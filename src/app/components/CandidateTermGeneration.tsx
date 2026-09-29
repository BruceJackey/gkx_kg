import { useEffect, useMemo, useState } from 'react';
import { Check, Layers, Play, RefreshCw, Sparkles, X } from 'lucide-react';

export type CandidateTermFocus = 'statistical' | 'rule-based' | 'dedup-merge';

type TermStatus = 'pending' | 'accepted' | 'rejected';

interface CandidateRow {
  id: string;
  term: string;
  source: 'statistical' | 'rule-based' | 'merged';
  score: number;
  detail: string;
  status: TermStatus;
}

const TABS: { id: CandidateTermFocus; label: string; desc: string }[] = [
  {
    id: 'statistical',
    label: '基于统计的扩展',
    desc: '词共现 · 互信息（PMI）发现与种子术语相关的候选',
  },
  {
    id: 'rule-based',
    label: '基于规则的扩展',
    desc: '按词性模式从语料抽取复合术语候选',
  },
  {
    id: 'dedup-merge',
    label: '候选术语去重与合并',
    desc: '跨来源标准化与近义合并，生成唯一候选列表',
  },
];

const DEFAULT_SEEDS = ['知识图谱', '深度学习', '自然语言处理', 'Transformer', '实体对齐'];

const STAT_POOL: Omit<CandidateRow, 'id' | 'status'>[] = [
  { term: '图神经网络', source: 'statistical', score: 0.91, detail: 'PMI 4.82 · 共现 1284' },
  { term: '知识表示学习', source: 'statistical', score: 0.88, detail: 'PMI 4.55 · 共现 982' },
  { term: '语义网络', source: 'statistical', score: 0.84, detail: 'PMI 3.98 · 共现 756' },
  { term: '链接预测', source: 'statistical', score: 0.81, detail: 'PMI 3.72 · 共现 645' },
  { term: '表示学习', source: 'statistical', score: 0.79, detail: 'PMI 3.45 · 共现 1102' },
];

const RULE_POOL: Omit<CandidateRow, 'id' | 'status'>[] = [
  { term: '深度神经网络', source: 'rule-based', score: 0.89, detail: '模式 a+n' },
  { term: '预训练语言模型', source: 'rule-based', score: 0.86, detail: '模式 v+n' },
  { term: '多模态知识图谱', source: 'rule-based', score: 0.84, detail: '模式 n+n' },
  { term: '大规模语料库', source: 'rule-based', score: 0.82, detail: '模式 a+n' },
  { term: '事件抽取模型', source: 'rule-based', score: 0.8, detail: '模式 n+n' },
];

const MERGE_POOL: Omit<CandidateRow, 'id' | 'status'>[] = [
  { term: '知识图谱', source: 'merged', score: 0.95, detail: '合并 3 条 · KG / Knowledge Graph' },
  { term: '图神经网络', source: 'merged', score: 0.93, detail: '合并 3 条 · GNN / 图神经网路' },
  { term: '知识图谱构建', source: 'merged', score: 0.9, detail: '合并 2 条 · 知识图谱 构建' },
  { term: '深度学习模型', source: 'merged', score: 0.88, detail: '合并 2 条 · 深度学习 模型' },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function CandidateTermGeneration({
  initialFocus,
}: {
  initialFocus?: CandidateTermFocus | null;
}) {
  const [tab, setTab] = useState<CandidateTermFocus>(initialFocus ?? 'statistical');
  const [seeds, setSeeds] = useState(DEFAULT_SEEDS.join('、'));
  const [windowSize, setWindowSize] = useState(5);
  const [pmiMin, setPmiMin] = useState(3);
  const [pattern, setPattern] = useState('a+n');
  const [mergeThreshold, setMergeThreshold] = useState(0.85);
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<CandidateRow[]>([]);

  useEffect(() => {
    if (initialFocus) setTab(initialFocus);
  }, [initialFocus]);

  const stats = useMemo(() => {
    const accepted = rows.filter(r => r.status === 'accepted').length;
    const rejected = rows.filter(r => r.status === 'rejected').length;
    const pending = rows.filter(r => r.status === 'pending').length;
    return { accepted, rejected, pending, total: rows.length };
  }, [rows]);

  const runGenerate = () => {
    setRunning(true);
    setTimeout(() => {
      const pool =
        tab === 'statistical' ? STAT_POOL : tab === 'rule-based' ? RULE_POOL : MERGE_POOL;
      setRows(
        pool.map(item => ({
          ...item,
          id: uid(),
          status: 'pending' as TermStatus,
        })),
      );
      setRunning(false);
    }, 700);
  };

  const setStatus = (id: string, status: TermStatus) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  const acceptAllPending = () => {
    setRows(prev => prev.map(r => (r.status === 'pending' ? { ...r, status: 'accepted' } : r)));
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-gray-900 mb-1">候选术语生成</h1>
        <p className="text-sm text-gray-500">
          以种子术语为起点，通过统计扩展、规则扩展与去重合并，构建领域候选术语集合
        </p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-3xl flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setRows([]);
            }}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl space-y-4 pb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-800 mb-0.5">{TABS.find(t => t.id === tab)?.label}</div>
            <p className="text-xs text-gray-500">{TABS.find(t => t.id === tab)?.desc}</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">种子术语（顿号或逗号分隔）</span>
            <textarea
              value={seeds}
              onChange={e => setSeeds(e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
            />
          </label>

          {tab === 'statistical' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-gray-600">共现窗口</span>
                <select
                  value={windowSize}
                  onChange={e => setWindowSize(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {[3, 5, 7, 10].map(n => (
                    <option key={n} value={n}>
                      {n} 词
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-600">PMI 下限</span>
                <input
                  type="number"
                  step={0.1}
                  value={pmiMin}
                  onChange={e => setPmiMin(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          {tab === 'rule-based' && (
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">词性模式</span>
              <select
                value={pattern}
                onChange={e => setPattern(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="a+n">形容词 + 名词 (a+n)</option>
                <option value="n+n">名词 + 名词 (n+n)</option>
                <option value="v+n">动词 + 名词 (v+n)</option>
                <option value="a+n+n">形容词 + 名词 + 名词</option>
              </select>
            </label>
          )}

          {tab === 'dedup-merge' && (
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">合并相似度阈值：{mergeThreshold.toFixed(2)}</span>
              <input
                type="range"
                min={0.7}
                max={0.95}
                step={0.01}
                value={mergeThreshold}
                onChange={e => setMergeThreshold(Number(e.target.value))}
                className="w-full"
              />
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runGenerate}
              disabled={running}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
            >
              {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? '生成中…' : '生成候选术语'}
            </button>
            {rows.some(r => r.status === 'pending') && (
              <button
                type="button"
                onClick={acceptAllPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-emerald-200 text-emerald-700 bg-emerald-50 text-sm rounded-lg hover:bg-emerald-100"
              >
                <Check className="w-4 h-4" />全部采纳待审项
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '候选总数', value: stats.total, icon: Layers },
            { label: '待确认', value: stats.pending, icon: Sparkles },
            { label: '已采纳', value: stats.accepted, icon: Check },
            { label: '已驳回', value: stats.rejected, icon: X },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-3 py-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
              <div className="text-xl font-semibold text-gray-900 tabular-nums">{value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 text-sm font-medium text-gray-800">
            生成结果
          </div>
          {rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-gray-400">点击「生成候选术语」后在此展示结果，并可逐条采纳或驳回</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map(row => (
                <li key={row.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{row.term}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{row.source}</span>
                      <span className="text-[11px] font-mono text-blue-700">{row.score.toFixed(2)}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded ${
                          row.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.status === 'rejected'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {row.status === 'accepted' ? '已采纳' : row.status === 'rejected' ? '已驳回' : '待确认'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{row.detail}</p>
                  </div>
                  {row.status === 'pending' && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setStatus(row.id, 'accepted')}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                        title="采纳"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(row.id, 'rejected')}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        title="驳回"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
