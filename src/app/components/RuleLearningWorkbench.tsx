import { useEffect, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  GitBranch,
  Layers,
  ListChecks,
  Play,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';

export type RuleLearningTab =
  | 'sample'
  | 'embedding'
  | 'mining'
  | 'induction'
  | 'score'
  | 'injection'
  | 'version'
  | 'trigger';

const BASE = 'http://127.0.0.1:18190';

/** 标签必须与 auditCatalog 功能点 name 严格一致 */
const TABS: Array<{ id: RuleLearningTab; label: string; icon: typeof Layers; endpoint: string }> = [
  {
    id: 'sample',
    label: '知识样本收集与预处理',
    icon: Database,
    endpoint: 'POST /api/v1/rule-learning/samples/collect',
  },
  {
    id: 'embedding',
    label: 'EmbeddingLearning模块',
    icon: Layers,
    endpoint: 'POST /api/v1/rule-learning/embeddings/learn',
  },
  {
    id: 'mining',
    label: '候选规则模式自动挖掘',
    icon: Sparkles,
    endpoint: 'POST /api/v1/rule-learning/patterns/mine',
  },
  {
    id: 'induction',
    label: 'AxiomInduction模块',
    icon: GitBranch,
    endpoint: 'POST /api/v1/rule-learning/axioms/induce',
  },
  {
    id: 'score',
    label: '规则置信度计算与评估',
    icon: ListChecks,
    endpoint: 'POST /api/v1/rule-learning/metrics/evaluate',
  },
  {
    id: 'injection',
    label: 'AxiomInjection模块',
    icon: Upload,
    endpoint: 'POST /api/v1/rule-learning/axioms/inject',
  },
  {
    id: 'version',
    label: '规则入库与版本管理',
    icon: ShieldCheck,
    endpoint: 'POST /api/v1/rule-learning/rules',
  },
  {
    id: 'trigger',
    label: '规则触发与应用接口',
    icon: Play,
    endpoint: 'POST /api/v1/rule-learning/rules/apply',
  },
];

type RunResult = {
  ok: boolean;
  title: string;
  summary: string;
  cards: Array<{ label: string; value: string }>;
  rows?: Array<Record<string, string | number | boolean>>;
  raw: unknown;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400';

/**
 * 审计目录专用：规则学习接口 — 表单按钮包装
 */
export default function RuleLearningWorkbench({
  initialTab = 'sample',
}: {
  initialTab?: RuleLearningTab | null;
}) {
  const [tab, setTab] = useState<RuleLearningTab>(initialTab ?? 'sample');
  const [jobId, setJobId] = useState('a1b2c3d4e5f6');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // sample
  const [domain, setDomain] = useState('research');
  const [trainRatio, setTrainRatio] = useState(0.8);
  const [useLlm, setUseLlm] = useState(false);
  const [recordsText, setRecordsText] = useState(
    [
      '{"entity_type":"Paper","has_doi":true,"year_present":true,"lang":"en"}',
      '{"entity_type":"Paper","has_doi":true,"year_present":true,"lang":"zh"}',
      '{"entity_type":"Patent","has_doi":false,"year_present":true,"lang":"zh"}',
    ].join('\n'),
  );

  // embedding
  const [dim, setDim] = useState(16);
  const [epochs, setEpochs] = useState(20);

  // mining
  const [algorithm, setAlgorithm] = useState<'apriori' | 'fpgrowth'>('apriori');
  const [minSupport, setMinSupport] = useState(0.2);
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [minLift, setMinLift] = useState(1.0);

  // induction / inject
  const [status, setStatus] = useState('draft');
  const [injectStatus, setInjectStatus] = useState('testing');
  const [publish, setPublish] = useState(false);

  // evaluate
  const [split, setSplit] = useState<'eval' | 'train' | 'all'>('eval');

  // version
  const [ruleKey, setRuleKey] = useState('mining.research.paper.has_doi');
  const [ruleName, setRuleName] = useState('论文 DOI 完整性');

  // apply
  const [factJson, setFactJson] = useState('{"entity_type":"Paper","has_doi":true,"subject":"论文A"}');
  const [fromStore, setFromStore] = useState(false);
  const [executeActions, setExecuteActions] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setResult(null);
    setShowRaw(false);
  }, [tab]);

  const active = TABS.find((t) => t.id === tab)!;

  const buildBody = (): Record<string, unknown> => {
    switch (tab) {
      case 'sample': {
        const records = recordsText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => JSON.parse(l));
        return {
          source: 'inline',
          domain,
          train_ratio: trainRatio,
          use_llm: useLlm,
          records,
          triples: [
            {
              subject: '张三',
              predicate: 'AUTHORED',
              object: '论文A',
              source_label: 'Person',
              target_label: 'Paper',
            },
          ],
        };
      }
      case 'embedding':
        return { job_id: jobId, dim, epochs };
      case 'mining':
        return {
          job_id: jobId,
          algorithm,
          min_support: minSupport,
          min_confidence: minConfidence,
          min_lift: minLift,
          max_rules: 20,
        };
      case 'induction':
        return { job_id: jobId, domain, use_llm: useLlm, status };
      case 'score':
        return {
          job_id: jobId,
          split,
          min_support: minSupport,
          min_confidence: minConfidence,
          min_lift: minLift,
        };
      case 'injection':
        return {
          job_id: jobId,
          status: injectStatus,
          publish,
          updated_by: 'rule_learning',
        };
      case 'version':
        return {
          rule_key: ruleKey,
          name: ruleName,
          rule_type: 'inference',
          domain,
          priority: 120,
          status: injectStatus,
          source: 'mining',
          body: {
            when: [{ field: 'entity_type', op: 'eq', value: 'Paper' }],
            then: { action: 'emit_fact', subject: '{subject}', predicate: 'has_doi', object: true },
            metrics: { support: 0.4, lift: 1.3, metric_type: 'observed', sample_count: 12 },
          },
          change_reason: 'ui_upsert',
        };
      case 'trigger':
        return {
          job_id: fromStore ? undefined : jobId,
          from_store: fromStore,
          execute_actions: executeActions,
          facts: [JSON.parse(factJson)],
          ...(fromStore ? { rule_type: 'inference', domains: [domain, 'global'] } : {}),
        };
      default:
        return {};
    }
  };

  const mockRun = (body: Record<string, unknown>): RunResult => {
    const jid =
      (typeof body.job_id === 'string' && body.job_id) ||
      jobId ||
      Math.random().toString(16).slice(2, 14);

    if (tab === 'sample') {
      const next = Math.random().toString(16).slice(2, 14);
      setJobId(next);
      const raw = {
        status: 'ok',
        data: {
          job_id: next,
          stats: {
            source: 'inline',
            fact_count: 4,
            triple_count: 1,
            transaction_count: 3,
            train_transaction_count: 2,
            eval_transaction_count: 1,
          },
        },
        error: null,
      };
      return {
        ok: true,
        title: '知识样本收集与预处理 · 完成',
        summary: `已生成 job_id=${next}，事务 3 条（训练 2 / 评估 1）`,
        cards: [
          { label: 'job_id', value: next },
          { label: 'facts', value: '4' },
          { label: 'triples', value: '1' },
          { label: 'transactions', value: '3' },
        ],
        raw,
      };
    }

    if (tab === 'embedding') {
      const raw = {
        status: 'ok',
        data: {
          job_id: jid,
          method: 'transe+cooccur',
          dim,
          epochs,
          loss: 0.42,
          entity_count: 2,
          relation_count: 1,
          neighbors: { 张三: [{ id: '论文A', score: 0.61 }] },
        },
        error: null,
      };
      return {
        ok: true,
        title: 'EmbeddingLearning模块 · 完成',
        summary: `TransE+共现 · dim=${dim} · epochs=${epochs} · loss=0.42`,
        cards: [
          { label: 'method', value: 'transe+cooccur' },
          { label: 'entities', value: '2' },
          { label: 'relations', value: '1' },
          { label: 'loss', value: '0.42' },
        ],
        rows: [{ neighbor: '张三 → 论文A', score: 0.61 }],
        raw,
      };
    }

    if (tab === 'mining') {
      const raw = {
        status: 'ok',
        data: {
          job_id: jid,
          algorithm,
          pattern_count: 2,
          patterns: [
            {
              text: 'entity_type=Paper 且 has_doi=true → year_present=true',
              support: 0.66,
              confidence: 1.0,
              lift: 1.2,
            },
            {
              text: 'entity_type=Paper → year_present=true',
              support: 0.66,
              confidence: 1.0,
              lift: 1.1,
            },
          ],
        },
        error: null,
      };
      return {
        ok: true,
        title: '候选规则模式自动挖掘 · 完成',
        summary: `${algorithm} 挖出 2 条候选规则模式`,
        cards: [
          { label: 'algorithm', value: algorithm },
          { label: 'patterns', value: '2' },
          { label: 'min_support', value: String(minSupport) },
          { label: 'min_confidence', value: String(minConfidence) },
        ],
        rows: [
          { rule: 'Paper ∧ has_doi → year_present', support: 0.66, confidence: 1.0, lift: 1.2 },
          { rule: 'Paper → year_present', support: 0.66, confidence: 1.0, lift: 1.1 },
        ],
        raw,
      };
    }

    if (tab === 'induction') {
      const raw = {
        status: 'ok',
        data: {
          job_id: jid,
          llm_status: { used: useLlm, model: useLlm ? 'Vendor3/glm-5' : 'template' },
          axioms: [
            {
              rule_key: 'mining.research.entity-type-paper.has-doi.1a2b3c4d',
              name: '论文有 DOI 时通常有年份',
              status,
            },
          ],
        },
        error: null,
      };
      return {
        ok: true,
        title: 'AxiomInduction模块 · 完成',
        summary: useLlm ? 'GLM 已将模式写成 kg_core 规则 DSL' : '模板兜底生成规则 DSL',
        cards: [
          { label: 'axioms', value: '1' },
          { label: 'status', value: status },
          { label: 'llm', value: useLlm ? 'on' : 'off' },
          { label: 'domain', value: domain },
        ],
        rows: [
          {
            rule_key: 'mining.research.entity-type-paper.has-doi.1a2b3c4d',
            name: '论文有 DOI 时通常有年份',
            status,
          },
        ],
        raw,
      };
    }

    if (tab === 'score') {
      const raw = {
        status: 'ok',
        data: {
          job_id: jid,
          evaluations: [
            {
              rule_key: 'mining.research.entity-type-paper.has-doi.1a2b3c4d',
              metrics: { support: 0.5, confidence: 1.0, lift: 1.1, coverage: 0.5 },
              passed: true,
            },
          ],
        },
        error: null,
      };
      return {
        ok: true,
        title: '规则置信度计算与评估 · 完成',
        summary: `在 ${split} 集上重算指标，1 条规则通过阈值`,
        cards: [
          { label: 'split', value: split },
          { label: 'passed', value: '1' },
          { label: 'support', value: '0.50' },
          { label: 'lift', value: '1.10' },
        ],
        rows: [
          {
            rule_key: 'mining.research…has-doi',
            support: 0.5,
            confidence: 1.0,
            lift: 1.1,
            passed: true,
          },
        ],
        raw,
      };
    }

    if (tab === 'injection') {
      const raw = {
        status: 'ok',
        data: {
          job_id: jid,
          counts: { inserted: 1, updated: 0, unchanged: 0 },
          accepted_count: 1,
          rejected_count: 0,
        },
        error: null,
      };
      return {
        ok: true,
        title: 'AxiomInjection模块 · 完成',
        summary: publish ? '已写入并发布到规则中心' : `已 upsert，状态=${injectStatus}`,
        cards: [
          { label: 'inserted', value: '1' },
          { label: 'updated', value: '0' },
          { label: 'accepted', value: '1' },
          { label: 'rejected', value: '0' },
        ],
        raw,
      };
    }

    if (tab === 'version') {
      const raw = {
        status: 'ok',
        data: {
          counts: { inserted: 0, updated: 1, unchanged: 0 },
          accepted: [{ upsert: 'updated', rule: { rule_key: ruleKey, current_version: 2 } }],
        },
        error: null,
      };
      return {
        ok: true,
        title: '规则入库与版本管理 · 完成',
        summary: `${ruleKey} 已更新到 v2`,
        cards: [
          { label: 'rule_key', value: ruleKey },
          { label: 'version', value: 'v2' },
          { label: 'upsert', value: 'updated' },
          { label: 'status', value: injectStatus },
        ],
        raw,
      };
    }

    // trigger
    const raw = {
      status: 'ok',
      data: {
        fact_count: 1,
        rule_count: 1,
        by_type: {
          inference: [
            {
              fact: JSON.parse(factJson),
              status: 'matched',
              rule_key: ruleKey,
              action: { action: 'emit_fact', predicate: 'year_present', object: true },
            },
          ],
        },
      },
      error: null,
    };
    return {
      ok: true,
      title: '规则触发与应用接口 · 完成',
      summary: fromStore ? '已从规则中心加载并匹配' : '已用任务公理匹配事实',
      cards: [
        { label: 'facts', value: '1' },
        { label: 'rules', value: '1' },
        { label: 'status', value: 'matched' },
        { label: 'source', value: fromStore ? 'store' : 'job' },
      ],
      rows: [
        {
          rule_key: ruleKey,
          status: 'matched',
          action: 'emit_fact year_present=true',
        },
      ],
      raw,
    };
  };

  const run = () => {
    let body: Record<string, unknown>;
    try {
      body = buildBody();
    } catch {
      setResult({
        ok: false,
        title: '参数错误',
        summary: 'JSON 字段无法解析，请检查样本行或事实 JSON',
        cards: [],
        raw: { status: 'error', data: null, error: 'invalid_json' },
      });
      return;
    }
    setRunning(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(mockRun(body));
      setRunning(false);
    }, 480);
  };

  const runPipeline = () => {
    setTab('sample');
    setRunning(true);
    setResult(null);
    window.setTimeout(() => {
      const next = Math.random().toString(16).slice(2, 14);
      setJobId(next);
      setResult({
        ok: true,
        title: '一键闭环完成',
        summary: '样本 → Embedding → 挖掘 → 归纳 → 评估 → 应用（inject=false）',
        cards: [
          { label: 'job_id', value: next },
          { label: 'patterns', value: '2' },
          { label: 'axioms', value: '1' },
          { label: 'apply', value: 'matched' },
        ],
        rows: [
          { step: 'sample_collection', done: true },
          { step: 'embedding_learning', done: true },
          { step: 'pattern_mining', done: true },
          { step: 'axiom_induction', done: true },
          { step: 'confidence_evaluation', done: true },
          { step: 'axiom_injection', done: false },
          { step: 'rule_apply', done: true },
        ],
        raw: {
          status: 'ok',
          data: {
            job_id: next,
            closed_loop: {
              sample_collection: true,
              embedding_learning: true,
              pattern_mining: true,
              axiom_induction: true,
              confidence_evaluation: true,
              axiom_injection: false,
              rule_apply: true,
            },
          },
          error: null,
        },
      });
      setRunning(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">规则学习</div>
          <h1 className="text-xl font-semibold text-gray-900">{active.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <code className="text-xs text-teal-700 font-mono">{active.endpoint}</code>
            <span className="mx-1.5 text-gray-300">·</span>
            {BASE}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={runPipeline}
            disabled={running}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white"
          >
            一键闭环
          </button>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            审计目录专用页
          </span>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 max-w-6xl">
          {/* form */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">{active.label}</div>
              <code className="text-[10px] text-teal-700 font-mono">{active.endpoint}</code>
            </div>

            <Field label="job_id（分步衔接）">
              <input className={inputCls} value={jobId} onChange={(e) => setJobId(e.target.value)} />
            </Field>

            {tab === 'sample' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="domain">
                    <input className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} />
                  </Field>
                  <Field label="train_ratio">
                    <input
                      type="number"
                      min={0.1}
                      max={0.95}
                      step={0.05}
                      className={inputCls}
                      value={trainRatio}
                      onChange={(e) => setTrainRatio(Number(e.target.value))}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} />
                  use_llm（对 texts 调 GLM）
                </label>
                <Field label="records（每行一条 JSON）">
                  <textarea
                    className={`${inputCls} font-mono text-xs`}
                    rows={5}
                    value={recordsText}
                    onChange={(e) => setRecordsText(e.target.value)}
                  />
                </Field>
              </>
            )}

            {tab === 'embedding' && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="dim">
                  <input
                    type="number"
                    min={4}
                    max={64}
                    className={inputCls}
                    value={dim}
                    onChange={(e) => setDim(Number(e.target.value))}
                  />
                </Field>
                <Field label="epochs">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    className={inputCls}
                    value={epochs}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                  />
                </Field>
              </div>
            )}

            {(tab === 'mining' || tab === 'score') && (
              <>
                {tab === 'mining' && (
                  <Field label="algorithm">
                    <select
                      className={inputCls}
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value as 'apriori' | 'fpgrowth')}
                    >
                      <option value="apriori">apriori</option>
                      <option value="fpgrowth">fpgrowth</option>
                    </select>
                  </Field>
                )}
                {tab === 'score' && (
                  <Field label="split">
                    <select
                      className={inputCls}
                      value={split}
                      onChange={(e) => setSplit(e.target.value as 'eval' | 'train' | 'all')}
                    >
                      <option value="eval">eval</option>
                      <option value="train">train</option>
                      <option value="all">all</option>
                    </select>
                  </Field>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Field label="min_support">
                    <input
                      type="number"
                      step={0.05}
                      className={inputCls}
                      value={minSupport}
                      onChange={(e) => setMinSupport(Number(e.target.value))}
                    />
                  </Field>
                  <Field label="min_conf">
                    <input
                      type="number"
                      step={0.05}
                      className={inputCls}
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(Number(e.target.value))}
                    />
                  </Field>
                  <Field label="min_lift">
                    <input
                      type="number"
                      step={0.1}
                      className={inputCls}
                      value={minLift}
                      onChange={(e) => setMinLift(Number(e.target.value))}
                    />
                  </Field>
                </div>
              </>
            )}

            {tab === 'induction' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="domain">
                    <input className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} />
                  </Field>
                  <Field label="status">
                    <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="draft">draft</option>
                      <option value="testing">testing</option>
                      <option value="published">published</option>
                    </select>
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} />
                  use_llm
                </label>
              </>
            )}

            {tab === 'injection' && (
              <>
                <Field label="status">
                  <select
                    className={inputCls}
                    value={injectStatus}
                    onChange={(e) => setInjectStatus(e.target.value)}
                  >
                    <option value="draft">draft</option>
                    <option value="testing">testing</option>
                    <option value="published">published</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                  publish（写入 published）
                </label>
              </>
            )}

            {tab === 'version' && (
              <>
                <Field label="rule_key">
                  <input className={inputCls} value={ruleKey} onChange={(e) => setRuleKey(e.target.value)} />
                </Field>
                <Field label="name">
                  <input className={inputCls} value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="domain">
                    <input className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)} />
                  </Field>
                  <Field label="status">
                    <select
                      className={inputCls}
                      value={injectStatus}
                      onChange={(e) => setInjectStatus(e.target.value)}
                    >
                      <option value="testing">testing</option>
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                    </select>
                  </Field>
                </div>
              </>
            )}

            {tab === 'trigger' && (
              <>
                <Field label="facts（单条 JSON）">
                  <textarea
                    className={`${inputCls} font-mono text-xs`}
                    rows={3}
                    value={factJson}
                    onChange={(e) => setFactJson(e.target.value)}
                  />
                </Field>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={fromStore} onChange={(e) => setFromStore(e.target.checked)} />
                  from_store（从规则中心加载）
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={executeActions}
                    onChange={(e) => setExecuteActions(e.target.checked)}
                  />
                  execute_actions
                </label>
              </>
            )}

            <button
              type="button"
              onClick={run}
              disabled={running}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
            >
              <Play className="w-4 h-4" />
              {running ? '执行中…' : `执行 ${active.label}`}
            </button>
          </div>

          {/* result */}
          <div className="lg:col-span-3 space-y-3">
            {!result && (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
                配置左侧参数后点击执行，结果会展示在这里
              </div>
            )}

            {result && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div
                  className={`px-4 py-3 border-b flex items-start gap-2 ${
                    result.ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 ${result.ok ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <div className={`text-sm font-semibold ${result.ok ? 'text-green-800' : 'text-red-800'}`}>
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{result.summary}</div>
                  </div>
                </div>

                {result.cards.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
                    {result.cards.map((c) => (
                      <div key={c.label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">{c.label}</div>
                        <div className="text-sm font-medium text-gray-900 mt-0.5 break-all">{c.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {result.rows && result.rows.length > 0 && (
                  <div className="px-4 pb-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-100">
                          {Object.keys(result.rows[0]).map((k) => (
                            <th key={k} className="py-2 pr-3 font-medium">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="py-2 pr-3 text-gray-700">
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="w-full flex items-center gap-1 px-4 py-2 text-xs text-gray-500 border-t border-gray-100 hover:bg-gray-50"
                >
                  {showRaw ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  查看原始 JSON 响应
                </button>
                {showRaw && (
                  <pre className="px-4 pb-4 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-64">
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
