import { useEffect, useState } from 'react';
import {
  ChevronRight,
  Database,
  SlidersHorizontal,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  Circle,
  Layers,
  AlertCircle,
} from 'lucide-react';
import type { AssociationRuleMiningFocus } from '../data/auditPageMap';
import {
  assocRulesApi,
  RELATION_MEASURE_BASE,
  type AssocAlgorithm,
  type AssocJob,
  type AssocRule,
  type AssocSubset,
} from '../api/relationMeasureApi';

type AnalysisTab = AssociationRuleMiningFocus;
type TaskStatus = 'queued' | 'running' | 'done' | 'failed';

interface MiningTask {
  id: string;
  name: string;
  subset: string;
  algorithm: string;
  minSupport: number;
  minConfidence: number;
  status: TaskStatus;
  progress: number;
  rulesFound: number | null;
  createdAt: string;
}

const PIPELINE_STEPS = [
  { id: 'subset' as const, label: '数据子集选择', desc: '选定挖掘数据源', icon: Database },
  { id: 'params' as const, label: '算法参数配置', desc: '支持度 · 置信度', icon: SlidersHorizontal },
  { id: 'execute' as const, label: '规则挖掘任务执行', desc: '后台任务管理', icon: Play },
];

const TABS: { id: AnalysisTab; label: string; desc: string; icon: typeof Database }[] = [
  {
    id: 'subset',
    label: '数据子集选择',
    desc: '允许用户选择知识图谱的特定部分作为挖掘的数据源。',
    icon: Database,
  },
  {
    id: 'params',
    label: '算法参数配置',
    desc: '支持用户配置挖掘算法的核心参数，如最小支持度和最小置信度。',
    icon: SlidersHorizontal,
  },
  {
    id: 'execute',
    label: '规则挖掘任务执行',
    desc: '提供后台任务管理，支持执行耗时较长的关联规则挖掘任务。',
    icon: Play,
  },
];

const STATUS_META: Record<TaskStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  queued: { label: '排队中', className: 'bg-gray-100 text-gray-600', icon: Clock },
  running: { label: '运行中', className: 'bg-blue-50 text-blue-700', icon: Loader2 },
  done: { label: '已完成', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  failed: { label: '失败', className: 'bg-red-50 text-red-600', icon: Circle },
};

function normalizeState(state: string): TaskStatus {
  if (state === 'running' || state === 'queued' || state === 'done' || state === 'failed') return state;
  if (state === 'cancelled') return 'failed';
  return 'queued';
}

function formatCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return String(n);
}

function jobToTask(job: AssocJob): MiningTask {
  const pct =
    job.progress_pct != null
      ? job.progress_pct
      : job.progress != null
        ? Math.round(job.progress <= 1 ? job.progress * 100 : job.progress)
        : job.state === 'done'
          ? 100
          : 0;
  return {
    id: job.job_id,
    name: job.job_name || `${job.subset_id || 'job'}-${job.algorithm_id || 'algo'}`,
    subset: job.subset_name || job.subset_id || '—',
    algorithm: job.algorithm_id || '—',
    minSupport: job.min_support ?? 0,
    minConfidence: job.min_confidence ?? 0,
    status: normalizeState(job.state),
    progress: pct,
    rulesFound: job.rules_found ?? null,
    createdAt: (job.created_at || '').replace('T', ' ').slice(0, 16),
  };
}

export default function AssociationRuleMining({
  initialFocus = 'subset',
}: {
  initialFocus?: AssociationRuleMiningFocus | null;
}) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>(initialFocus ?? 'subset');
  const [subsets, setSubsets] = useState<AssocSubset[]>([]);
  const [algorithms, setAlgorithms] = useState<AssocAlgorithm[]>([]);
  const [subsetId, setSubsetId] = useState('sci');
  const [algorithm, setAlgorithm] = useState('apriori');
  const [minSupport, setMinSupport] = useState(0.05);
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [maxItemset, setMaxItemset] = useState(3);
  const [tasks, setTasks] = useState<MiningTask[]>([]);
  const [rules, setRules] = useState<AssocRule[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (initialFocus) setActiveTab(initialFocus);
  }, [initialFocus]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoadingMeta(true);
      setApiError('');
      try {
        const [subRes, algoRes] = await Promise.all([
          assocRulesApi.listSubsets(ac.signal),
          assocRulesApi.listAlgorithms(ac.signal),
        ]);
        const nextSubsets = subRes.subsets ?? [];
        const nextAlgos = algoRes.algorithms ?? [];
        setSubsets(nextSubsets);
        setAlgorithms(nextAlgos);
        if (nextSubsets[0]) {
          setSubsetId((prev) => nextSubsets.some((s) => s.subset_id === prev) ? prev : nextSubsets[0].subset_id);
        }
        if (nextAlgos[0]) {
          setAlgorithm((prev) => nextAlgos.some((a) => a.algorithm_id === prev) ? prev : nextAlgos[0].algorithm_id);
          const defs = nextAlgos[0].params || [];
          const ms = defs.find((p) => p.name === 'min_support')?.default;
          const mc = defs.find((p) => p.name === 'min_confidence')?.default;
          const mi = defs.find((p) => p.name === 'max_itemset_size')?.default;
          if (typeof ms === 'number') setMinSupport(ms);
          if (typeof mc === 'number') setMinConfidence(mc);
          if (typeof mi === 'number') setMaxItemset(mi);
        }
      } catch (e) {
        setApiError(e instanceof Error ? e.message : '加载子集/算法失败');
      } finally {
        setLoadingMeta(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // 轮询未完成任务
  useEffect(() => {
    const pending = tasks.filter((t) => t.status === 'queued' || t.status === 'running');
    if (!pending.length) return undefined;
    const timer = window.setInterval(async () => {
      for (const t of pending) {
        try {
          const job = await assocRulesApi.getJob(t.id);
          const next = jobToTask(job);
          setTasks((prev) => prev.map((x) => (x.id === t.id ? next : x)));
          if (next.status === 'done') {
            try {
              const ruleRes = await assocRulesApi.getRules(t.id, { page: 1, page_size: 20 });
              setRules(ruleRes.rules ?? []);
            } catch {
              /* ignore until ready */
            }
          }
        } catch {
          /* keep previous */
        }
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [tasks]);

  const tabMeta = TABS.find((t) => t.id === activeTab)!;
  const subset = subsets.find((s) => s.subset_id === subsetId);
  const algo = algorithms.find((a) => a.algorithm_id === algorithm);

  const submitTask = async () => {
    if (!subsetId || !algorithm) {
      setApiError('请先选择子集与算法');
      return;
    }
    setSubmitting(true);
    setApiError('');
    try {
      const created = await assocRulesApi.createJob({
        subset_id: subsetId,
        algorithm_id: algorithm,
        min_support: minSupport,
        min_confidence: minConfidence,
        max_itemset_size: maxItemset,
        job_name: `${subset?.name || subsetId}-${algo?.name || algorithm}`,
      });
      const job = await assocRulesApi.getJob(created.job_id).catch(() => ({
        job_id: created.job_id,
        state: created.state,
        created_at: created.created_at,
        subset_id: subsetId,
        subset_name: subset?.name,
        algorithm_id: algorithm,
        min_support: minSupport,
        min_confidence: minConfidence,
        progress_pct: created.state === 'done' ? 100 : 0,
        rules_found: null,
      } as AssocJob));
      const task = jobToTask(job);
      setTasks((prev) => [task, ...prev.filter((t) => t.id !== task.id)]);
      setSubmitMsg(`已提交任务 ${task.name}`);
      setActiveTab('execute');
      window.setTimeout(() => setSubmitMsg(''), 3000);
      if (task.status === 'done') {
        const ruleRes = await assocRulesApi.getRules(task.id, { page: 1, page_size: 20 });
        setRules(ruleRes.rules ?? []);
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : '提交任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden p-8">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">关联规则挖掘</div>
          <h1 className="text-xl font-semibold text-gray-900">{tabMeta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">{tabMeta.desc}</p>
          <p className="text-[11px] text-gray-400 mt-1 font-mono truncate">API {RELATION_MEASURE_BASE}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页 · 真实接口
        </span>
      </div>

      <div className="flex items-center gap-0 bg-white border border-gray-200 rounded-xl px-4 py-3 flex-shrink-0 overflow-x-auto">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 min-w-[150px]">
            <button
              type="button"
              onClick={() => setActiveTab(step.id)}
              className={`flex items-center gap-3 text-left rounded-lg px-2 py-1.5 transition-colors ${
                activeTab === step.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activeTab === step.id ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <step.icon className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-sm font-medium ${activeTab === step.id ? 'text-blue-800' : 'text-gray-800'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-gray-400">{step.desc}</div>
              </div>
            </button>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="flex-1 flex items-center justify-center px-1">
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      {submitMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {submitMsg}
        </div>
      )}
      {apiError && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
          {apiError}
        </div>
      )}

      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-h-0">
        <div className="flex border-b border-gray-100 flex-shrink-0 px-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loadingMeta && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在从算法服务加载子集与算法…
            </div>
          )}

          {activeTab === 'subset' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-500">
                选择知识图谱的特定部分作为「项集」事务来源，挖掘项集—项集之间的强关联模式。
              </div>
              {!subsets.length && !loadingMeta ? (
                <div className="text-center py-12 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  暂无可用子集
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {subsets.map((s) => (
                    <button
                      key={s.subset_id}
                      type="button"
                      onClick={() => {
                        setSubsetId(s.subset_id);
                        if (s.recommended_min_support != null) setMinSupport(s.recommended_min_support);
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        subsetId === s.subset_id
                          ? 'border-blue-300 bg-blue-50/60'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Layers className={`w-4 h-4 ${subsetId === s.subset_id ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${subsetId === s.subset_id ? 'text-blue-900' : 'text-gray-900'}`}>
                            {s.name}
                          </span>
                        </div>
                        {subsetId === s.subset_id && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{s.description}</p>
                      <div className="flex gap-3 text-[11px] text-gray-500">
                        <span>实体 {formatCount(s.entity_count)}</span>
                        <span>三元组 {formatCount(s.triple_count)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('params')}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  下一步：算法参数配置
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'params' && (
            <div className="flex flex-col gap-5 max-w-2xl">
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-600">
                当前数据源：
                <span className="font-medium text-gray-800">{subset?.name || subsetId}</span>
                {subset && (
                  <>
                    （实体 {formatCount(subset.entity_count)} · 三元组 {formatCount(subset.triple_count)}）
                  </>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2">挖掘算法</div>
                <div className="flex flex-col gap-2">
                  {algorithms.map((a) => (
                    <button
                      key={a.algorithm_id}
                      type="button"
                      onClick={() => {
                        setAlgorithm(a.algorithm_id);
                        const ms = a.params?.find((p) => p.name === 'min_support')?.default;
                        const mc = a.params?.find((p) => p.name === 'min_confidence')?.default;
                        if (typeof ms === 'number') setMinSupport(ms);
                        if (typeof mc === 'number') setMinConfidence(mc);
                      }}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        algorithm === a.algorithm_id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-sm font-medium ${algorithm === a.algorithm_id ? 'text-blue-800' : 'text-gray-800'}`}>
                        {a.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">最小支持度 (min_support)</span>
                  <span className="text-sm font-semibold text-blue-700">{minSupport.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={0.3}
                  step={0.01}
                  value={minSupport}
                  onChange={(e) => setMinSupport(Number(e.target.value))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">最小置信度 (min_confidence)</span>
                  <span className="text-sm font-semibold text-blue-700">{minConfidence.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.01}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">最大项集长度</span>
                  <span className="text-sm font-semibold text-gray-800">{maxItemset}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={maxItemset}
                  onChange={(e) => setMaxItemset(Number(e.target.value))}
                />
              </label>

              <div className="flex justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('subset')}
                  className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('execute')}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  下一步：任务执行
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    数据源：<span className="font-medium text-gray-800">{subset?.name || subsetId}</span>
                  </div>
                  <div>
                    算法：<span className="font-medium text-gray-800">{algo?.name || algorithm}</span>
                    {' · '}
                    support≥{minSupport.toFixed(2)}
                    {' · '}
                    confidence≥{minConfidence.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void submitTask()}
                  disabled={submitting}
                  className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {submitting ? '提交中…' : '提交挖掘任务'}
                </button>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">后台任务</div>
                {!tasks.length ? (
                  <div className="text-center py-10 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    尚未提交任务
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {tasks.map((t) => {
                      const meta = STATUS_META[t.status];
                      const Icon = meta.icon;
                      return (
                        <div key={t.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{t.name}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                {t.subset} · {t.algorithm} · support {t.minSupport} · confidence {t.minConfidence}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{t.id}</div>
                            </div>
                            <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${meta.className}`}>
                              <Icon className={`w-3 h-3 ${t.status === 'running' ? 'animate-spin' : ''}`} />
                              {meta.label}
                            </span>
                          </div>
                          {(t.status === 'running' || t.status === 'queued') && (
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${t.progress}%` }} />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span>{t.createdAt || '—'}</span>
                            <span>
                              {t.rulesFound != null
                                ? `发现规则 ${t.rulesFound.toLocaleString()} 条`
                                : t.status === 'running'
                                  ? `进度 ${t.progress}%`
                                  : '等待调度'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">规则结果</div>
                {!rules.length ? (
                  <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    任务完成后将展示规则列表
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {['前件（项集）', '后件（项集）', '支持度', '置信度', '提升度'].map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 text-gray-500 font-medium border-b border-gray-200">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((r) => (
                          <tr key={r.rule_id} className="border-b border-gray-50">
                            <td className="px-3 py-2.5 font-mono text-gray-700">
                              {r.antecedent_display || `{${r.antecedent.join(', ')}}`}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-gray-700">
                              {r.consequent_display || `{${r.consequent.join(', ')}}`}
                            </td>
                            <td className="px-3 py-2.5">{r.support.toFixed(3)}</td>
                            <td className="px-3 py-2.5 text-blue-700 font-medium">{r.confidence.toFixed(3)}</td>
                            <td className="px-3 py-2.5">{r.lift.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
