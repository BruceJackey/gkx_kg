import { useState, useEffect } from 'react';
import { Database, GitBranch, Layers, ListChecks, Play, ShieldCheck, Sparkles, Upload } from 'lucide-react';

export type RuleLearningTab =
  | 'embedding'
  | 'induction'
  | 'injection'
  | 'sample'
  | 'mining'
  | 'score'
  | 'version'
  | 'trigger';

const TABS: Array<{ id: RuleLearningTab; label: string; icon: typeof Layers }> = [
  { id: 'embedding', label: 'EmbeddingLearning', icon: Layers },
  { id: 'induction', label: 'AxiomInduction', icon: GitBranch },
  { id: 'injection', label: 'AxiomInjection', icon: Upload },
  { id: 'sample', label: '样本预处理', icon: Database },
  { id: 'mining', label: '候选规则挖掘', icon: Sparkles },
  { id: 'score', label: '置信度评估', icon: ListChecks },
  { id: 'version', label: '入库与版本', icon: ShieldCheck },
  { id: 'trigger', label: '触发与应用', icon: Play },
];

const CONTENT: Record<
  RuleLearningTab,
  { title: string; desc: string; bullets: string[]; sample: string }
> = {
  embedding: {
    title: 'EmbeddingLearning 模块',
    desc: '将知识图谱进行向量化表示，为后续规则搜索与验证提供嵌入基础。',
    bullets: ['选择嵌入模型与维度', '对实体/关系批量编码', '导出向量快照供归纳模块使用'],
    sample: JSON.stringify(
      { status: 'ok', entities: 12840, relations: 62, dim: 128, model: 'ComplEx' },
      null,
      2,
    ),
  },
  induction: {
    title: 'AxiomInduction 模块',
    desc: '在向量空间中搜索并发现潜在逻辑规则模式。',
    bullets: ['设定规则长度与谓词白名单', '基于嵌入邻域挖掘候选公理', '输出规则模板与支持证据'],
    sample: JSON.stringify(
      {
        status: 'ok',
        rules: [
          { pattern: '(?X, works_at, ?Y) ∧ (?Y, located_in, ?Z) ⇒ (?X, located_in, ?Z)', support: 0.41 },
          { pattern: '(?A, coauthor, ?B) ∧ (?B, coauthor, ?C) ⇒ (?A, coauthor, ?C)', support: 0.28 },
        ],
      },
      null,
      2,
    ),
  },
  injection: {
    title: 'AxiomInjection 模块',
    desc: '将发现的规则重新应用于知识图谱，验证有效性并做修正。',
    bullets: ['选择待注入规则集', '在子图上试运行并统计冲突', '确认后写回或回滚'],
    sample: JSON.stringify(
      { status: 'ok', injected: 12, conflicts: 1, accepted: 11, rejected: 1 },
      null,
      2,
    ),
  },
  sample: {
    title: '知识样本收集与预处理',
    desc: '从知识图谱中采样用于规则学习的正负样本。',
    bullets: ['按关系类型分层采样', '构造负样本（腐化头/尾实体）', '导出训练/验证划分'],
    sample: JSON.stringify(
      { status: 'ok', positive: 5000, negative: 5000, split: { train: 0.8, valid: 0.1, test: 0.1 } },
      null,
      2,
    ),
  },
  mining: {
    title: '候选规则模式自动挖掘',
    desc: '基于样本自动挖掘满足特定模式的候选规则。',
    bullets: ['配置最小支持度/置信度', '挖掘 Horn 规则与路径规则', '去重并按质量初排'],
    sample: JSON.stringify(
      { status: 'ok', candidates: 86, filtered: 24, top: ['works_at ∘ located_in ⇒ located_in'] },
      null,
      2,
    ),
  },
  score: {
    title: '规则置信度计算与评估',
    desc: '为每条候选规则计算置信度、支持度等评估指标。',
    bullets: ['批量打分与排序', '可视化指标分布', '人工阈值筛选进入入库队列'],
    sample: JSON.stringify(
      {
        status: 'ok',
        scored: [
          { rule: 'works_at ∘ located_in ⇒ located_in', confidence: 0.91, support: 0.41 },
          { rule: 'advisor_of ⇒ alumni_of', confidence: 0.77, support: 0.22 },
        ],
      },
      null,
      2,
    ),
  },
  version: {
    title: '规则入库与版本管理',
    desc: '将评估通过的规则存入规则库，并管理版本。',
    bullets: ['创建规则库版本标签', '对比版本差异', '回滚到历史版本'],
    sample: JSON.stringify(
      { status: 'ok', library: 'sci-rules', version: 'v1.4.2', added: 9, deprecated: 2 },
      null,
      2,
    ),
  },
  trigger: {
    title: '规则触发与应用接口',
    desc: '将规则库与推理引擎集成，在推理任务中自动触发与应用。',
    bullets: ['配置触发条件与优先级', '联调推理任务', '查看命中日志与溯源'],
    sample: JSON.stringify(
      {
        status: 'ok',
        endpoint: '/api/v1/rules:trigger',
        fired: 17,
        facts_added: 5,
      },
      null,
      2,
    ),
  },
};

/**
 * 审计目录专用：规则学习流水线（五级叶子无子功能点拆分）
 */
export default function RuleLearningWorkbench({
  initialTab = 'embedding',
}: {
  initialTab?: RuleLearningTab | null;
}) {
  const [tab, setTab] = useState<RuleLearningTab>(initialTab ?? 'embedding');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const meta = CONTENT[tab];

  const run = () => {
    setRunning(true);
    setOutput('');
    window.setTimeout(() => {
      setOutput(meta.sample);
      setRunning(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">规则学习</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Embedding → 归纳 → 注入 → 样本/挖掘/评估 → 入库与触发的端到端规则学习流水线
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setOutput('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{meta.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{meta.desc}</p>
          </div>
          <ul className="space-y-1.5">
            {meta.bullets.map((b) => (
              <li key={b} className="text-sm text-gray-700 flex gap-2">
                <span className="text-teal-600">•</span>
                {b}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm rounded-lg"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? '执行中…' : '运行演示'}
          </button>
          {output && (
            <pre className="text-xs font-mono bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700">
              {output}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
