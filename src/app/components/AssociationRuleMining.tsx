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
} from 'lucide-react';
import type { AssociationRuleMiningFocus } from '../data/auditPageMap';

type AnalysisTab = AssociationRuleMiningFocus;

const SUBSETS = [
  { id: 'sci', name: '科技领域子图', entities: '12.4 万', triples: '86.2 万', desc: '实体类型：技术 / 概念 / 组织；关系：应用于、引用、研究' },
  { id: 'bio', name: '生物医学子图', entities: '8.1 万', triples: '54.7 万', desc: '实体类型：基因 / 疾病 / 化合物；关系：关联、治疗、靶向' },
  { id: 'mat', name: '材料科学子图', entities: '5.6 万', triples: '31.0 万', desc: '实体类型：材料 / 工艺 / 性能；关系：组成、制备、表征' },
  { id: 'full', name: '全量知识图谱', entities: '210 万', triples: '1.4 亿', desc: '全库挖掘，耗时较长，建议提高最小支持度' },
];

const ALGORITHMS = [
  { id: 'apriori', name: 'Apriori', desc: '经典频繁项集挖掘，适合中小规模子集' },
  { id: 'fpgrowth', name: 'FP-Growth', desc: '压缩树结构，适合大规模图事务' },
];

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

const INITIAL_TASKS: MiningTask[] = [
  {
    id: 't1',
    name: '科技子图-Apriori-v1',
    subset: '科技领域子图',
    algorithm: 'Apriori',
    minSupport: 0.05,
    minConfidence: 0.6,
    status: 'done',
    progress: 100,
    rulesFound: 1284,
    createdAt: '2026-09-08 14:22',
  },
  {
    id: 't2',
    name: '生物医学-FPGrowth',
    subset: '生物医学子图',
    algorithm: 'FP-Growth',
    minSupport: 0.03,
    minConfidence: 0.7,
    status: 'running',
    progress: 62,
    rulesFound: null,
    createdAt: '2026-09-09 10:05',
  },
  {
    id: 't3',
    name: '材料科学-试跑',
    subset: '材料科学子图',
    algorithm: 'Apriori',
    minSupport: 0.08,
    minConfidence: 0.55,
    status: 'queued',
    progress: 0,
    rulesFound: null,
    createdAt: '2026-09-09 16:40',
  },
];

const SAMPLE_RULES = [
  { ante: '{知识图谱, 嵌入}', cons: '{链路预测}', support: 0.12, confidence: 0.86, lift: 2.4 },
  { ante: '{Transformer}', cons: '{注意力机制, 预训练}', support: 0.18, confidence: 0.91, lift: 1.9 },
  { ante: '{基因G, 疾病D}', cons: '{化合物C}', support: 0.04, confidence: 0.73, lift: 3.1 },
];

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

export default function AssociationRuleMining({
  initialFocus = 'subset',
}: {
  initialFocus?: AssociationRuleMiningFocus | null;
}) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>(initialFocus ?? 'subset');
  const [subsetId, setSubsetId] = useState('sci');
  const [algorithm, setAlgorithm] = useState('apriori');
  const [minSupport, setMinSupport] = useState(0.05);
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [maxItemset, setMaxItemset] = useState(3);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    if (initialFocus) setActiveTab(initialFocus);
  }, [initialFocus]);

  const tabMeta = TABS.find((t) => t.id === activeTab)!;
  const subset = SUBSETS.find((s) => s.id === subsetId)!;
  const algo = ALGORITHMS.find((a) => a.id === algorithm)!;

  const submitTask = () => {
    const id = `t${Date.now().toString(36).slice(-4)}`;
    const task: MiningTask = {
      id,
      name: `${subset.name.split('子')[0]}-${algo.name}-${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
      subset: subset.name,
      algorithm: algo.name,
      minSupport,
      minConfidence,
      status: 'queued',
      progress: 0,
      rulesFound: null,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setTasks((prev) => [task, ...prev]);
    setSubmitMsg(`已提交任务 ${task.name}，进入后台队列`);
    setActiveTab('execute');
    window.setTimeout(() => setSubmitMsg(''), 2800);

    // 模拟排队 → 运行 → 完成
    window.setTimeout(() => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'running', progress: 28 } : t)));
    }, 800);
    window.setTimeout(() => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, progress: 71 } : t)));
    }, 1800);
    window.setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: 'done', progress: 100, rulesFound: Math.floor(400 + Math.random() * 900) }
            : t,
        ),
      );
    }, 3200);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden p-8">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">关联规则挖掘</div>
          <h1 className="text-xl font-semibold text-gray-900">{tabMeta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">{tabMeta.desc}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
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
          {/* 数据子集选择 */}
          {activeTab === 'subset' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-500">
                选择知识图谱的特定部分作为「项集」事务来源，挖掘项集—项集之间的强关联模式。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SUBSETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubsetId(s.id)}
                    className={`text-left p-4 rounded-xl border transition-colors ${
                      subsetId === s.id
                        ? 'border-blue-300 bg-blue-50/60'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className={`w-4 h-4 ${subsetId === s.id ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${subsetId === s.id ? 'text-blue-900' : 'text-gray-900'}`}>
                          {s.name}
                        </span>
                      </div>
                      {subsetId === s.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{s.desc}</p>
                    <div className="flex gap-3 text-[11px] text-gray-500">
                      <span>实体 {s.entities}</span>
                      <span>三元组 {s.triples}</span>
                    </div>
                  </button>
                ))}
              </div>
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

          {/* 算法参数配置 */}
          {activeTab === 'params' && (
            <div className="flex flex-col gap-5 max-w-2xl">
              <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-600">
                当前数据源：<span className="font-medium text-gray-800">{subset.name}</span>
                （实体 {subset.entities} · 三元组 {subset.triples}）
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2">挖掘算法</div>
                <div className="flex flex-col gap-2">
                  {ALGORITHMS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAlgorithm(a.id)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        algorithm === a.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-sm font-medium ${algorithm === a.id ? 'text-blue-800' : 'text-gray-800'}`}>
                        {a.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.desc}</div>
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
                <p className="text-[11px] text-gray-400">项集在事务中出现的最低频率阈值。</p>
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
                <p className="text-[11px] text-gray-400">规则前件推出后件的最低条件概率。</p>
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

          {/* 规则挖掘任务执行 */}
          {activeTab === 'execute' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    数据源：<span className="font-medium text-gray-800">{subset.name}</span>
                  </div>
                  <div>
                    算法：<span className="font-medium text-gray-800">{algo.name}</span>
                    {' · '}
                    support≥{minSupport.toFixed(2)}
                    {' · '}
                    confidence≥{minConfidence.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={submitTask}
                  className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  提交挖掘任务
                </button>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">后台任务</div>
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
                          </div>
                          <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${meta.className}`}>
                            <Icon className={`w-3 h-3 ${t.status === 'running' ? 'animate-spin' : ''}`} />
                            {meta.label}
                          </span>
                        </div>
                        {t.status === 'running' && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${t.progress}%` }} />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span>{t.createdAt}</span>
                          <span>
                            {t.rulesFound != null ? `发现规则 ${t.rulesFound.toLocaleString()} 条` : t.status === 'running' ? `进度 ${t.progress}%` : '等待调度'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">示例规则输出（已完成任务）</div>
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
                      {SAMPLE_RULES.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-3 py-2.5 font-mono text-gray-700">{r.ante}</td>
                          <td className="px-3 py-2.5 font-mono text-gray-700">{r.cons}</td>
                          <td className="px-3 py-2.5">{r.support.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-blue-700 font-medium">{r.confidence.toFixed(2)}</td>
                          <td className="px-3 py-2.5">{r.lift.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
