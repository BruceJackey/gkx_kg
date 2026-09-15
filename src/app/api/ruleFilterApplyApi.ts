/**
 * 规则筛选与应用 / 规则库 / 应用接口 — 原型客户端
 * 契约见 docs/关系度量与关联规则挖掘接口需求.md §规则筛选与应用
 * 优先打算法网关；失败时回落本地演示数据（规则库用 localStorage）
 */

import {
  RELATION_MEASURE_BASE,
  RELATION_MEASURE_TOKEN,
  type ApiEnvelope,
} from './relationMeasureApi';

export type EvaluatedRule = {
  rule_id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction?: number;
  leverage?: number;
  antecedent_display?: string;
  consequent_display?: string;
  source_job_id?: string;
  category_hint?: string;
};

export type LibraryRule = EvaluatedRule & {
  library_id: string;
  category: string;
  tags: string[];
  version: number;
  versions: Array<{ version: number; note: string; saved_at: string }>;
  status: 'active' | 'draft' | 'archived';
  saved_at: string;
  updated_at: string;
};

export type ApplyHit = {
  library_id: string;
  rule_id: string;
  version: number;
  category: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  matched_facts: string[];
  inferred: string[];
};

const LIBRARY_KEY = 'gkx_proto_assoc_rule_library_v1';

export const SEED_EVALUATED_RULES: EvaluatedRule[] = [
  {
    rule_id: 'r_001',
    antecedent: ['知识图谱', '嵌入'],
    consequent: ['链路预测'],
    support: 0.12,
    confidence: 0.86,
    lift: 2.4,
    conviction: 3.1,
    leverage: 0.07,
    antecedent_display: '{知识图谱, 嵌入}',
    consequent_display: '{链路预测}',
    source_job_id: 'ar_job_demo',
    category_hint: '推荐',
  },
  {
    rule_id: 'r_002',
    antecedent: ['Transformer', '预训练'],
    consequent: ['自然语言处理'],
    support: 0.18,
    confidence: 0.91,
    lift: 2.1,
    conviction: 4.2,
    leverage: 0.09,
    antecedent_display: '{Transformer, 预训练}',
    consequent_display: '{自然语言处理}',
    source_job_id: 'ar_job_demo',
    category_hint: '推荐',
  },
  {
    rule_id: 'r_003',
    antecedent: ['图神经网络', '节点分类'],
    consequent: ['半监督学习'],
    support: 0.09,
    confidence: 0.78,
    lift: 1.9,
    conviction: 2.4,
    leverage: 0.04,
    antecedent_display: '{图神经网络, 节点分类}',
    consequent_display: '{半监督学习}',
    source_job_id: 'ar_job_demo',
    category_hint: '科研',
  },
  {
    rule_id: 'r_004',
    antecedent: ['药物', '靶点'],
    consequent: ['副作用风险'],
    support: 0.06,
    confidence: 0.72,
    lift: 3.2,
    conviction: 2.8,
    leverage: 0.05,
    antecedent_display: '{药物, 靶点}',
    consequent_display: '{副作用风险}',
    source_job_id: 'ar_job_demo',
    category_hint: '预警',
  },
  {
    rule_id: 'r_005',
    antecedent: ['专利', '权利要求'],
    consequent: ['技术路径'],
    support: 0.11,
    confidence: 0.81,
    lift: 1.7,
    conviction: 2.0,
    leverage: 0.03,
    antecedent_display: '{专利, 权利要求}',
    consequent_display: '{技术路径}',
    source_job_id: 'ar_job_demo',
    category_hint: '科研',
  },
  {
    rule_id: 'r_006',
    antecedent: ['异常流量', '权限提升'],
    consequent: ['安全告警'],
    support: 0.04,
    confidence: 0.88,
    lift: 4.1,
    conviction: 5.0,
    leverage: 0.06,
    antecedent_display: '{异常流量, 权限提升}',
    consequent_display: '{安全告警}',
    source_job_id: 'ar_job_demo',
    category_hint: '预警',
  },
];

const DEFAULT_CATEGORIES = ['推荐', '预警', '科研', '通用'];

async function requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${RELATION_MEASURE_TOKEN}`,
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${RELATION_MEASURE_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
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

function loadLibrary(): LibraryRule[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LibraryRule[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLibrary(rules: LibraryRule[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(rules));
}

function nowIso() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function displayItems(items: string[]) {
  return `{${items.join(', ')}}`;
}

export const ruleFilterApplyApi = {
  base: RELATION_MEASURE_BASE,

  /** 评估指标列表（优先网关，失败用演示规则） */
  async listEvaluatedRules(opts?: {
    min_support?: number;
    min_confidence?: number;
    min_lift?: number;
    q?: string;
  }): Promise<{ rules: EvaluatedRule[]; source: 'api' | 'local' }> {
    try {
      const q = new URLSearchParams();
      if (opts?.min_support != null) q.set('min_support', String(opts.min_support));
      if (opts?.min_confidence != null) q.set('min_confidence', String(opts.min_confidence));
      if (opts?.min_lift != null) q.set('min_lift', String(opts.min_lift));
      if (opts?.q) q.set('q', opts.q);
      const qs = q.toString();
      const data = await requestJson<{ rules: EvaluatedRule[] }>(
        'GET',
        `/api/v1/assoc-rules/evaluated-rules${qs ? `?${qs}` : ''}`,
      );
      return { rules: data.rules ?? [], source: 'api' };
    } catch {
      let rules = [...SEED_EVALUATED_RULES];
      if (opts?.min_support != null) rules = rules.filter((r) => r.support >= opts.min_support!);
      if (opts?.min_confidence != null) rules = rules.filter((r) => r.confidence >= opts.min_confidence!);
      if (opts?.min_lift != null) rules = rules.filter((r) => r.lift >= opts.min_lift!);
      if (opts?.q?.trim()) {
        const needle = opts.q.trim().toLowerCase();
        rules = rules.filter((r) => {
          const text = [
            ...(r.antecedent || []),
            ...(r.consequent || []),
            r.antecedent_display || '',
            r.consequent_display || '',
            r.category_hint || '',
          ]
            .join(' ')
            .toLowerCase();
          return text.includes(needle);
        });
      }
      return { rules, source: 'local' };
    }
  },

  listCategories(): string[] {
    const fromLib = loadLibrary().map((r) => r.category).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...fromLib]));
  },

  listLibrary(opts?: { category?: string; q?: string; status?: string }): LibraryRule[] {
    let rules = loadLibrary();
    if (opts?.category && opts.category !== '全部') {
      rules = rules.filter((r) => r.category === opts.category);
    }
    if (opts?.status && opts.status !== '全部') {
      rules = rules.filter((r) => r.status === opts.status);
    }
    if (opts?.q?.trim()) {
      const needle = opts.q.trim().toLowerCase();
      rules = rules.filter((r) => {
        const text = [
          ...(r.antecedent || []),
          ...(r.consequent || []),
          r.category,
          ...(r.tags || []),
          r.library_id,
        ]
          .join(' ')
          .toLowerCase();
        return text.includes(needle);
      });
    }
    return rules.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  },

  async saveToLibrary(rule: EvaluatedRule, opts?: { category?: string; tags?: string[]; note?: string }) {
    try {
      const data = await requestJson<LibraryRule>('POST', '/api/v1/rule-library/rules', {
        rule_id: rule.rule_id,
        antecedent: rule.antecedent,
        consequent: rule.consequent,
        support: rule.support,
        confidence: rule.confidence,
        lift: rule.lift,
        conviction: rule.conviction,
        leverage: rule.leverage,
        category: opts?.category || rule.category_hint || '通用',
        tags: opts?.tags || [],
        note: opts?.note || '首次入库',
      });
      // 同步本地缓存便于应用接口演示
      const local = loadLibrary().filter((r) => r.library_id !== data.library_id && r.rule_id !== data.rule_id);
      local.unshift(data);
      saveLibrary(local);
      return { rule: data, source: 'api' as const };
    } catch {
      const existing = loadLibrary();
      const dup = existing.find((r) => r.rule_id === rule.rule_id && r.status !== 'archived');
      if (dup) {
        const nextVersion = dup.version + 1;
        const updated: LibraryRule = {
          ...dup,
          ...rule,
          category: opts?.category || dup.category,
          tags: opts?.tags ?? dup.tags,
          version: nextVersion,
          versions: [
            { version: nextVersion, note: opts?.note || `更新为 v${nextVersion}`, saved_at: nowIso() },
            ...dup.versions,
          ],
          updated_at: nowIso(),
        };
        saveLibrary(existing.map((r) => (r.library_id === dup.library_id ? updated : r)));
        return { rule: updated, source: 'local' as const };
      }
      const ts = nowIso();
      const created: LibraryRule = {
        ...rule,
        library_id: `lib_${Date.now().toString(36)}`,
        category: opts?.category || rule.category_hint || '通用',
        tags: opts?.tags || [],
        version: 1,
        versions: [{ version: 1, note: opts?.note || '首次入库', saved_at: ts }],
        status: 'active',
        saved_at: ts,
        updated_at: ts,
        antecedent_display: rule.antecedent_display || displayItems(rule.antecedent),
        consequent_display: rule.consequent_display || displayItems(rule.consequent),
      };
      saveLibrary([created, ...existing]);
      return { rule: created, source: 'local' as const };
    }
  },

  updateLibraryMeta(libraryId: string, patch: Partial<Pick<LibraryRule, 'category' | 'tags' | 'status'>>) {
    const rules = loadLibrary();
    const next = rules.map((r) =>
      r.library_id === libraryId
        ? { ...r, ...patch, updated_at: nowIso() }
        : r,
    );
    saveLibrary(next);
    return next.find((r) => r.library_id === libraryId) || null;
  },

  bumpVersion(libraryId: string, note: string) {
    const rules = loadLibrary();
    const target = rules.find((r) => r.library_id === libraryId);
    if (!target) return null;
    const version = target.version + 1;
    const updated: LibraryRule = {
      ...target,
      version,
      versions: [{ version, note: note || `版本 v${version}`, saved_at: nowIso() }, ...target.versions],
      updated_at: nowIso(),
    };
    saveLibrary(rules.map((r) => (r.library_id === libraryId ? updated : r)));
    return updated;
  },

  /**
   * 应用接口：给定事实项集，返回命中规则与推断结论
   * POST /api/v1/rule-library/apply
   */
  async apply(payload: {
    facts: string[];
    category?: string;
    library_ids?: string[];
    min_confidence?: number;
    top_k?: number;
  }): Promise<{
    request_id: string;
    matched_count: number;
    hits: ApplyHit[];
    inferences: string[];
    source: 'api' | 'local';
    latency_ms: number;
  }> {
    const started = Date.now();
    try {
      const data = await requestJson<{
        request_id: string;
        matched_count: number;
        hits: ApplyHit[];
        inferences: string[];
      }>('POST', '/api/v1/rule-library/apply', payload);
      return { ...data, source: 'api', latency_ms: Date.now() - started };
    } catch {
      const facts = new Set((payload.facts || []).map((f) => f.trim()).filter(Boolean));
      let pool = loadLibrary().filter((r) => r.status === 'active');
      if (!pool.length) {
        // 无入库规则时，用评估演示规则模拟
        pool = SEED_EVALUATED_RULES.map((r, i) => ({
          ...r,
          library_id: `seed_${i}`,
          category: r.category_hint || '通用',
          tags: [],
          version: 1,
          versions: [{ version: 1, note: '演示规则', saved_at: nowIso() }],
          status: 'active' as const,
          saved_at: nowIso(),
          updated_at: nowIso(),
        }));
      }
      if (payload.category) pool = pool.filter((r) => r.category === payload.category);
      if (payload.library_ids?.length) {
        const allow = new Set(payload.library_ids);
        pool = pool.filter((r) => allow.has(r.library_id));
      }
      if (payload.min_confidence != null) {
        pool = pool.filter((r) => r.confidence >= payload.min_confidence!);
      }

      const hits: ApplyHit[] = [];
      for (const rule of pool) {
        const matched = rule.antecedent.filter((a) => facts.has(a));
        if (matched.length === rule.antecedent.length) {
          hits.push({
            library_id: rule.library_id,
            rule_id: rule.rule_id,
            version: rule.version,
            category: rule.category,
            antecedent: rule.antecedent,
            consequent: rule.consequent,
            support: rule.support,
            confidence: rule.confidence,
            lift: rule.lift,
            matched_facts: matched,
            inferred: rule.consequent,
          });
        }
      }
      hits.sort((a, b) => b.confidence - a.confidence || b.lift - a.lift);
      const topK = payload.top_k ?? 20;
      const sliced = hits.slice(0, topK);
      const inferences = Array.from(new Set(sliced.flatMap((h) => h.inferred)));
      return {
        request_id: `apply_${Date.now().toString(36)}`,
        matched_count: sliced.length,
        hits: sliced,
        inferences,
        source: 'local',
        latency_ms: Date.now() - started + 40 + Math.floor(Math.random() * 80),
      };
    }
  },
};
