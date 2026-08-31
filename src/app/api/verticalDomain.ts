export type GraphNodeType = 'company' | 'person' | 'product' | 'technology' | 'partner';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  x: number;
  y: number;
  properties?: Record<string, string | number | boolean>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  relationType: string;
  weight?: number;
  inferred: boolean;
}

export interface Evidence {
  modality: 'graph' | 'news' | 'financial' | 'patent' | 'industry';
  sourceId: string;
  sourceName?: string;
  sourceUrl?: string;
  eventTime?: string;
  snippet: string;
  score?: number;
}

export interface CompanyData {
  id: string;
  name: string;
  industry: string;
  founded: string;
  type: string;
  location: string;
  legalRep: string;
  creditCode: string;
  financialSummary: string;
  financialTrend: { year: string; revenue: number; profit: number; rd: number }[];
  news: { id: string; date: string; title: string; content?: string; sourceUrl?: string }[];
  associates: { id: string; name: string; relation: string; weight?: number }[];
  riskEvents: {
    id: string;
    date: string;
    desc: string;
    severity: 'high' | 'medium' | 'low';
    sourceUrl?: string;
  }[];
  sentiment: string;
  sentimentStats: { positive: number; neutral: number; negative: number };
  nodes: GraphNode[];
  edges: GraphEdge[];
  inference: {
    relations: {
      id: string;
      from: string;
      fromId: string;
      rel: string;
      relationType: string;
      to: string;
      toId: string;
      confidence: number;
      basis: string;
      evidence: Evidence[];
    }[];
    trends: {
      id: string;
      tech: string;
      technologyId?: string;
      direction: 'up' | 'down';
      confidence: number;
      desc: string;
      horizonMonths: number;
      evidence: Evidence[];
    }[];
    opportunities: {
      id: string;
      title: string;
      tag: string;
      desc: string;
      score: number;
      evidence: Evidence[];
    }[];
  };
  meta: {
    graphSpace: string;
    dataBatch: string;
    asOf: string;
    modelName: string;
    modelVersion: string;
    dataSources?: string[];
    warnings?: string[];
  };
}

export interface CompanyListItem {
  id: string;
  name: string;
  industry: string;
  domain: string;
}

interface ApiEnvelope<T> {
  code: string;
  message: string;
  requestId?: string;
  data: T;
}

const API_BASE_URL = (
  import.meta.env.VITE_VERTICAL_DOMAIN_API_BASE_URL || '/algorithm-api'
).replace(/\/+$/, '');

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const headers: HeadersInit = { Accept: 'application/json' };
  const token = import.meta.env.VITE_ALGORITHM_GATEWAY_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('无法连接垂直领域算法服务，请检查服务地址或网络。');
  }

  let payload: ApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // The gateway can return a plain-text proxy error.
  }

  if (!response.ok) {
    throw new Error(payload?.message || `算法服务请求失败（HTTP ${response.status}）`);
  }
  if (!payload || payload.code !== 'OK' || payload.data == null) {
    throw new Error(payload?.message || '算法服务返回了无效数据。');
  }
  return payload.data;
}

export async function getVerticalDomainCompanies(signal?: AbortSignal) {
  const query = new URLSearchParams({ page: '1', pageSize: '50' });
  return request<{
    items: CompanyListItem[];
    page: number;
    pageSize: number;
    total: number;
  }>(`/api/v1/vertical-domain/companies?${query}`, signal);
}

export async function getVerticalDomainDashboard(orgId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({
    graphSpace: 'prototype_enterprise_graph',
    includeInference: 'true',
  });
  return request<CompanyData>(
    `/api/v1/vertical-domain/companies/${encodeURIComponent(orgId)}/dashboard?${query}`,
    signal,
  );
}
