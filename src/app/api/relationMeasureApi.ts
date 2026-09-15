/**
 * 关系度量 / 导出 / 关联规则挖掘 — 算法网关客户端
 * 契约见 docs/关系度量与关联规则挖掘接口需求.md
 * 联调说明见 ATTRIBUTIONS.md（端口 18220，网关 30080）
 */

const DEFAULT_BASE =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? '/relation-measure-api'
    : 'http://113.57.198.122:30080');
const DEFAULT_TOKEN = 'dev-token';

export const RELATION_MEASURE_BASE =
  (import.meta.env.VITE_RELATION_MEASURE_API_BASE as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_BASE;

export const RELATION_MEASURE_TOKEN =
  (import.meta.env.VITE_RELATION_MEASURE_API_TOKEN as string | undefined) || DEFAULT_TOKEN;

export type ApiEnvelope<T> = {
  status: 'ok' | 'error';
  data: T | null;
  error: string | null;
};

export type PathHop = {
  from: string;
  from_id?: string | null;
  relation: string;
  relation_id?: string | null;
  to: string;
  to_id?: string | null;
};

export type ApiPath = {
  path_id: string;
  length: number;
  hops: PathHop[];
  score: number | null;
  model_scores?: Record<string, number>;
};

export type DiscoverData = {
  request_id: string;
  source: { entity_id: string; entity_name: string };
  target: { entity_id: string; entity_name: string };
  max_depth: number;
  path_count: number;
  truncated: boolean;
  paths: ApiPath[];
  elapsed_ms?: number;
  graph_id?: string;
  graph_space?: string;
  graph_source?: string;
};

export type ScoreData = {
  request_id: string;
  scoring_model: string;
  path_count: number;
  paths: ApiPath[];
  score_stats?: { min: number; max: number; mean: number };
};

export type FilterData = {
  request_id: string;
  total: number;
  page: number;
  page_size: number;
  paths: ApiPath[];
  applied_filters?: Record<string, unknown>;
};

export type ExportFileData = {
  format: string;
  filename: string;
  mime: string;
  content_base64: string;
  row_count?: number;
  node_count?: number;
  edge_count?: number;
};

export type AssocSubset = {
  subset_id: string;
  name: string;
  description: string;
  entity_count: number;
  triple_count: number;
  entity_types?: string[];
  relation_types?: string[];
  recommended_min_support?: number;
};

export type AssocAlgorithm = {
  algorithm_id: string;
  name: string;
  description: string;
  params: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: number;
    min?: number;
    max?: number;
    description?: string;
  }>;
};

export type AssocJob = {
  job_id: string;
  job_name?: string;
  subset_id?: string;
  subset_name?: string;
  algorithm_id?: string;
  min_support?: number;
  min_confidence?: number;
  state: 'queued' | 'running' | 'done' | 'failed' | 'cancelled' | string;
  progress_pct?: number;
  progress?: number;
  rules_found?: number | null;
  message?: string | null;
  created_at?: string;
  updated_at?: string;
  finished_at?: string | null;
};

export type AssocRule = {
  rule_id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  antecedent_display?: string;
  consequent_display?: string;
};

async function requestJson<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${RELATION_MEASURE_TOKEN}`,
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${RELATION_MEASURE_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`接口返回非 JSON（HTTP ${response.status}）`);
  }

  if (!response.ok || envelope.status !== 'ok' || envelope.data == null) {
    throw new Error(envelope.error || `请求失败（HTTP ${response.status}）`);
  }

  return envelope.data;
}

function downloadBase64File(filename: string, mime: string, contentBase64: string) {
  const binary = atob(contentBase64.replace(/^data:[^;]+;base64,/, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const relationMeasureApi = {
  base: RELATION_MEASURE_BASE,

  discover(payload: {
    source_entity_name?: string;
    source_entity_id?: string;
    target_entity_name?: string;
    target_entity_id?: string;
    max_depth: number;
    graph_id?: string;
    directed?: boolean;
    max_paths?: number;
  }, signal?: AbortSignal) {
    return requestJson<DiscoverData>('POST', '/api/v1/relation-measure/paths:discover', payload, signal);
  },

  score(payload: {
    scoring_model: string;
    paths: ApiPath[];
    discover_request_id?: string;
  }, signal?: AbortSignal) {
    return requestJson<ScoreData>('POST', '/api/v1/relation-measure/paths:score', payload, signal);
  },

  filter(payload: {
    paths: ApiPath[];
    sort_by?: 'score' | 'length';
    sort_order?: 'asc' | 'desc';
    min_score?: number;
    max_length?: number;
    include_node?: string;
    exclude_node?: string;
    include_relation?: string;
    exclude_relation?: string;
    page?: number;
    page_size?: number;
  }, signal?: AbortSignal) {
    return requestJson<FilterData>('POST', '/api/v1/relation-measure/paths:filter', payload, signal);
  },

  async exportTable(payload: {
    format: 'csv' | 'xlsx' | 'xls';
    paths: ApiPath[];
    filename_prefix?: string;
  }, signal?: AbortSignal) {
    const data = await requestJson<ExportFileData>(
      'POST',
      '/api/v1/relation-measure/export:table',
      payload,
      signal,
    );
    downloadBase64File(data.filename, data.mime, data.content_base64);
    return data;
  },

  async exportImage(payload: {
    format: 'png' | 'svg';
    paths: ApiPath[];
    source_entity_name?: string;
    target_entity_name?: string;
    layout?: string;
    width?: number;
    height?: number;
  }, signal?: AbortSignal) {
    const data = await requestJson<ExportFileData>(
      'POST',
      '/api/v1/relation-measure/export:image',
      payload,
      signal,
    );
    downloadBase64File(data.filename, data.mime, data.content_base64);
    return data;
  },
};

export const assocRulesApi = {
  base: RELATION_MEASURE_BASE,

  listSubsets(signal?: AbortSignal) {
    return requestJson<{ subsets: AssocSubset[]; graph_id?: string }>(
      'GET',
      '/api/v1/assoc-rules/subsets',
      undefined,
      signal,
    );
  },

  listAlgorithms(signal?: AbortSignal) {
    return requestJson<{ algorithms: AssocAlgorithm[] }>(
      'GET',
      '/api/v1/assoc-rules/algorithms',
      undefined,
      signal,
    );
  },

  createJob(payload: {
    subset_id: string;
    algorithm_id: string;
    min_support: number;
    min_confidence: number;
    max_itemset_size?: number;
    job_name?: string;
  }, signal?: AbortSignal) {
    return requestJson<Pick<AssocJob, 'job_id' | 'state' | 'created_at'>>(
      'POST',
      '/api/v1/assoc-rules/jobs',
      payload,
      signal,
    );
  },

  getJob(jobId: string, signal?: AbortSignal) {
    return requestJson<AssocJob>('GET', `/api/v1/assoc-rules/jobs/${encodeURIComponent(jobId)}`, undefined, signal);
  },

  listJobs(signal?: AbortSignal) {
    return requestJson<{ jobs?: AssocJob[]; items?: AssocJob[]; total?: number }>(
      'GET',
      '/api/v1/assoc-rules/jobs',
      undefined,
      signal,
    ).catch(async () => {
      // 部分实现可能没有列表接口，回退为空
      return { jobs: [] as AssocJob[] };
    });
  },

  getRules(jobId: string, opts?: { page?: number; page_size?: number }, signal?: AbortSignal) {
    const q = new URLSearchParams();
    if (opts?.page) q.set('page', String(opts.page));
    if (opts?.page_size) q.set('page_size', String(opts.page_size));
    const qs = q.toString();
    return requestJson<{
      job_id: string;
      total: number;
      page: number;
      page_size: number;
      rules: AssocRule[];
    }>(
      'GET',
      `/api/v1/assoc-rules/jobs/${encodeURIComponent(jobId)}/rules${qs ? `?${qs}` : ''}`,
      undefined,
      signal,
    );
  },
};
