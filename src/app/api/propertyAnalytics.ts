interface ApiEnvelope<T> {
  code: string;
  message: string;
  requestId?: string;
  data: T;
}

export interface TimeseriesVia {
  edgeType: string;
  snapshotTag: string;
  timeField: string;
  timeGrain?: string;
}

export interface AnalyticsAttribute {
  attribute: string;
  label: string;
  tag: string;
  entityType: string;
  valueType: string;
  unit: string;
  displayUnit: string;
  scale: number;
  supportsDistribution: boolean;
  supportsTimeseries: boolean;
  timeseriesVia: TimeseriesVia | null;
  trsType?: string;
  timeFieldCandidates?: string[];
  sampleEntityIds: string[];
}

export interface DistributionResult {
  graphSpace: string;
  entityType: string;
  attribute: string;
  attributeLabel: string;
  unit: string;
  sampleCount: number;
  summary: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean: number;
    std: number;
    iqr: number;
    whiskerLow: number;
    whiskerHigh: number;
    outlierCount: number;
  };
  bins: {
    name: string;
    binStart: number;
    binEnd: number;
    count: number;
    outlier: boolean;
  }[];
  outliers: {
    entityId: string;
    entityName: string;
    entityType: string;
    value: number;
    displayValue?: number;
    reason: string;
    threshold?: number;
  }[];
  method: {
    outlierMethod: string;
    iqrMultiplier: number;
    binCount: number;
  };
  meta: {
    dataSources?: string[];
    asOf?: string;
    modelName?: string;
    modelVersion?: string;
    warnings?: string[];
  };
}

export interface TimeseriesEntity {
  entityId: string;
  entityName: string;
  entityType: string;
  pointCount: number;
  start: string;
  end: string;
}

export interface TimeseriesPoint {
  t: string;
  timestamp?: string;
  value: number;
  rawValue?: number;
  anomaly: boolean;
  zscore?: number | null;
  baseline?: number | null;
  snapshotId?: string;
}

export interface TimeseriesResult {
  graphSpace: string;
  entityId: string;
  entityName: string;
  entityType: string;
  attribute: string;
  attributeLabel: string;
  unit: string;
  timeGrain: string;
  points: TimeseriesPoint[];
  anomalies: {
    t: string;
    timestamp?: string;
    value: number;
    rawValue?: number;
    zscore?: number | null;
    baseline?: number | null;
    reason: string;
    snapshotId?: string;
  }[];
  summary: {
    pointCount: number;
    anomalyCount: number;
    mean: number;
    min: number;
    max: number;
    start: string;
    end: string;
  };
  method: {
    anomalyMethod: string;
    window: number;
    zThreshold: number;
    minHistory: number;
  };
  meta: {
    dataSources?: string[];
    dataBatch?: string;
    asOf?: string;
    modelName?: string;
    modelVersion?: string;
    warnings?: string[];
  };
}

export const PROPERTY_GRAPH_SPACES = [
  { id: 'prototype_enterprise_graph', label: '企业原型图' },
  { id: 'prototype_science_topic_graph', label: '科研专题图' },
] as const;

const API_BASE_URL = (
  import.meta.env.VITE_VERTICAL_DOMAIN_API_BASE_URL || '/algorithm-api'
).replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit, signal?: AbortSignal): Promise<T> {
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(init?.headers || {}),
  };
  const token = import.meta.env.VITE_ALGORITHM_GATEWAY_TOKEN;
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('无法连接属性分析算法服务，请检查服务地址或网络。');
  }

  let payload: ApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Gateway may return plain text.
  }

  if (!response.ok) {
    throw new Error(payload?.message || `算法服务请求失败（HTTP ${response.status}）`);
  }
  if (!payload || payload.code !== 'OK' || payload.data == null) {
    throw new Error(payload?.message || '算法服务返回了无效数据。');
  }
  return payload.data;
}

/** Unique option key: same attribute name can appear on multiple tags. */
export function attributeOptionKey(attr: AnalyticsAttribute): string {
  return `${attr.entityType}::${attr.tag}::${attr.attribute}`;
}

export function attributeOptionLabel(attr: AnalyticsAttribute): string {
  const unit = attr.displayUnit || attr.unit || '数值';
  return `${attr.label}（${attr.entityType}/${attr.tag} · ${unit}）`;
}

export function canRunTimeseries(attr: AnalyticsAttribute): boolean {
  return Boolean(attr.supportsTimeseries && attr.timeseriesVia);
}

export async function getPropertyAttributes(
  graphSpace: string,
  mode: 'distribution' | 'timeseries',
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ graphSpace, mode });
  return request<{ items: AnalyticsAttribute[] }>(
    `/api/v1/property-analytics/attributes?${query}`,
    undefined,
    signal,
  );
}

export async function postPropertyDistribution(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return request<DistributionResult>(
    '/api/v1/property-analytics/distribution',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    signal,
  );
}

export async function getTimeseriesEntities(
  graphSpace: string,
  attribute: string,
  path?: {
    entityType?: string;
    snapshotTag?: string;
    edgeType?: string;
    timeField?: string;
  },
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    graphSpace,
    attribute,
    page: '1',
    pageSize: '50',
  });
  if (path?.entityType) query.set('entityType', path.entityType);
  if (path?.snapshotTag) query.set('snapshotTag', path.snapshotTag);
  if (path?.edgeType) query.set('edgeType', path.edgeType);
  if (path?.timeField) query.set('timeField', path.timeField);

  return request<{
    items: TimeseriesEntity[];
    page: number;
    pageSize: number;
    total: number;
    warnings?: string[];
  }>(`/api/v1/property-analytics/timeseries/entities?${query}`, undefined, signal);
}

export async function postPropertyTimeseries(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  return request<TimeseriesResult>(
    '/api/v1/property-analytics/timeseries',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    signal,
  );
}

function preferredUnit(attr: AnalyticsAttribute): 'raw' | 'yi_yuan' | undefined {
  if (attr.displayUnit === '亿元' || attr.scale === 1e8) return 'yi_yuan';
  if (attr.displayUnit || attr.unit) return 'raw';
  return undefined;
}

export function buildDistributionRequest(
  graphSpace: string,
  attr: AnalyticsAttribute,
  timeValue = 2025,
) {
  const via = attr.timeseriesVia;
  const source = via
    ? {
        mode: 'snapshot' as const,
        entityType: attr.entityType,
        snapshotTag: via.snapshotTag,
        edgeType: via.edgeType,
        timeField: via.timeField,
        timeValue,
      }
    : {
        mode: 'vertex' as const,
        entityType: attr.entityType,
      };

  const body: Record<string, unknown> = {
    graphSpace,
    entityType: attr.entityType,
    attribute: attr.attribute,
    source,
    binCount: 7,
    outlierMethod: 'iqr',
    iqrMultiplier: 1.5,
    limit: 5000,
  };
  const unit = preferredUnit(attr);
  if (unit) body.unit = unit;
  return body;
}

export function buildTimeseriesRequest(
  graphSpace: string,
  entityId: string,
  attr: AnalyticsAttribute,
) {
  const via = attr.timeseriesVia;
  if (!via) {
    throw new Error(`属性 ${attr.attribute} 缺少 timeseriesVia，需由调用方提供快照路径。`);
  }

  const body: Record<string, unknown> = {
    graphSpace,
    entityId,
    attribute: attr.attribute,
    source: {
      mode: 'snapshot',
      entityType: attr.entityType,
      edgeType: via.edgeType,
      snapshotTag: via.snapshotTag,
      timeField: via.timeField,
    },
    timeRange: { start: '2021', end: '2025' },
    timeGrain: via.timeGrain || 'year',
    anomaly: {
      method: 'rolling_zscore',
      window: 4,
      zThreshold: 2.5,
      minHistory: 2,
    },
  };
  const unit = preferredUnit(attr);
  if (unit) body.unit = unit;
  return body;
}

export function timeseriesPathFromAttribute(attr: AnalyticsAttribute) {
  const via = attr.timeseriesVia;
  if (!via) return undefined;
  return {
    entityType: attr.entityType,
    snapshotTag: via.snapshotTag,
    edgeType: via.edgeType,
    timeField: via.timeField,
  };
}
