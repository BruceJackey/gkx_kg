import React from 'react';
import { Play, Check, X } from 'lucide-react';

interface SentenceCandidate {
  id: string;
  text: string;
  uncertainty: number;
  entityDensity: number;
  diversity: number;
  policyScore: number;
  compositeScore: number;
  predictedEntities: { text: string; type: string }[];
  status: 'pending' | 'selected' | 'annotated' | 'skipped';
}

const ENTITY_TYPE_COLORS: Record<string, string> = {
  人物: 'bg-blue-100 text-blue-800',
  机构: 'bg-purple-100 text-purple-800',
  地点: 'bg-green-100 text-green-800',
  术语: 'bg-amber-100 text-amber-800',
  时间: 'bg-pink-100 text-pink-800',
};

const INITIAL_SENTENCES: SentenceCandidate[] = [
  { id: 's1', text: '李明于2023年在中科院计算所与王芳合作发表了关于图神经网络的研究成果。', uncertainty: 0.87, entityDensity: 0.91, diversity: 0.76, policyScore: 0.88, compositeScore: 0.87, predictedEntities: [{ text: '李明', type: '人物' }, { text: '中科院计算所', type: '机构' }, { text: '王芳', type: '人物' }], status: 'pending' },
  { id: 's2', text: '该技术已在北京人工智能研究院的多个项目中得到了广泛应用。', uncertainty: 0.79, entityDensity: 0.82, diversity: 0.68, policyScore: 0.81, compositeScore: 0.79, predictedEntities: [{ text: '北京人工智能研究院', type: '机构' }], status: 'pending' },
  { id: 's3', text: '注意力机制作为Transformer架构的核心组件，极大地推动了自然语言处理领域的发展。', uncertainty: 0.92, entityDensity: 0.85, diversity: 0.88, policyScore: 0.91, compositeScore: 0.91, predictedEntities: [{ text: '注意力机制', type: '术语' }, { text: 'Transformer', type: '术语' }], status: 'pending' },
  { id: 's4', text: '张伟教授团队在2024年3月发布了新版知识图谱构建框架KGBuilder 3.0。', uncertainty: 0.83, entityDensity: 0.94, diversity: 0.72, policyScore: 0.85, compositeScore: 0.85, predictedEntities: [{ text: '张伟', type: '人物' }, { text: 'KGBuilder 3.0', type: '术语' }], status: 'pending' },
  { id: 's5', text: '清华大学与华为公司联合开展了大模型安全评估研究项目，历时一年完成。', uncertainty: 0.76, entityDensity: 0.88, diversity: 0.81, policyScore: 0.79, compositeScore: 0.79, predictedEntities: [{ text: '清华大学', type: '机构' }, { text: '华为公司', type: '机构' }], status: 'pending' },
  { id: 's6', text: '联邦学习框架通过在本地设备上训练模型并汇聚梯度来保护数据隐私。', uncertainty: 0.88, entityDensity: 0.78, diversity: 0.93, policyScore: 0.87, compositeScore: 0.87, predictedEntities: [{ text: '联邦学习', type: '术语' }], status: 'pending' },
  { id: 's7', text: '上海交通大学人工智能研究院院长陈刚发表了关于强化学习的综述报告。', uncertainty: 0.81, entityDensity: 0.96, diversity: 0.65, policyScore: 0.82, compositeScore: 0.82, predictedEntities: [{ text: '陈刚', type: '人物' }, { text: '上海交通大学人工智能研究院', type: '机构' }, { text: '强化学习', type: '术语' }], status: 'pending' },
  { id: 's8', text: '该系统每天处理的日志量超过十亿条，对稳定性要求极高。', uncertainty: 0.41, entityDensity: 0.22, diversity: 0.35, policyScore: 0.38, compositeScore: 0.33, predictedEntities: [], status: 'pending' },
  { id: 's9', text: '知识蒸馏技术可将大模型的知识迁移到轻量级学生模型中，降低部署成本。', uncertainty: 0.85, entityDensity: 0.79, diversity: 0.89, policyScore: 0.84, compositeScore: 0.85, predictedEntities: [{ text: '知识蒸馏', type: '术语' }], status: 'pending' },
  { id: 's10', text: '数据中心的电力消耗已成为制约大模型规模扩展的重要因素之一。', uncertainty: 0.52, entityDensity: 0.31, diversity: 0.44, policyScore: 0.48, compositeScore: 0.43, predictedEntities: [], status: 'pending' },
];

const SCORE_WEIGHTS = { uncertainty: 0.35, entityDensity: 0.25, diversity: 0.20, policyScore: 0.20 };

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 w-7 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export function RLSentenceSelectorDemo() {
  const [sentences, setSentences] = React.useState<SentenceCandidate[]>(
    [...INITIAL_SENTENCES].sort((a, b) => b.compositeScore - a.compositeScore)
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [budget, setBudget] = React.useState(5);
  const [weights, setWeights] = React.useState(SCORE_WEIGHTS);
  const [tab, setTab] = React.useState<'selector' | 'queue' | 'stats'>('selector');
  const [rewardHistory, setRewardHistory] = React.useState<number[]>([]);
  const runRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const selected = sentences.filter(s => s.status === 'selected');
  const annotated = sentences.filter(s => s.status === 'annotated');
  const pending = sentences.filter(s => s.status === 'pending');

  const recomposeScore = (s: SentenceCandidate, w: typeof weights) =>
    s.uncertainty * w.uncertainty + s.entityDensity * w.entityDensity + s.diversity * w.diversity + s.policyScore * w.policyScore;

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    const next = { ...weights, [key]: val };
    setWeights(next);
    setSentences(prev =>
      prev.map(s => ({ ...s, compositeScore: recomposeScore(s, next) }))
        .sort((a, b) => b.compositeScore - a.compositeScore)
    );
  };

  const handleSelect = () => {
    setIsRunning(true);
    let count = 0;
    const toSelect = sentences.filter(s => s.status === 'pending').slice(0, budget).map(s => s.id);
    runRef.current = setInterval(() => {
      if (count >= toSelect.length) {
        clearInterval(runRef.current!);
        setIsRunning(false);
        setTab('queue');
        return;
      }
      const id = toSelect[count];
      setSentences(prev => prev.map(s => s.id === id ? { ...s, status: 'selected' } : s));
      count++;
    }, 400);
  };

  const handleAnnotate = (id: string) => {
    setSentences(prev => prev.map(s => s.id === id ? { ...s, status: 'annotated' } : s));
    setRewardHistory(prev => [...prev, +(0.06 + Math.random() * 0.04).toFixed(3)]);
  };

  const handleSkip = (id: string) => {
    setSentences(prev => prev.map(s => s.id === id ? { ...s, status: 'skipped' } : s));
  };

  const handleReset = () => {
    if (runRef.current) clearInterval(runRef.current);
    setSentences([...INITIAL_SENTENCES].sort((a, b) => b.compositeScore - a.compositeScore));
    setIsRunning(false);
    setRewardHistory([]);
    setTab('selector');
  };

  const scoreGradient = (score: number) =>
    score >= 0.85 ? 'text-green-700 bg-green-50 border-green-200' :
    score >= 0.70 ? 'text-blue-700 bg-blue-50 border-blue-200' :
    'text-gray-500 bg-gray-50 border-gray-200';

  const W_LABELS: Record<keyof typeof weights, string> = {
    uncertainty: '模型不确定度',
    entityDensity: '实体密度',
    diversity: '句子多样性',
    policyScore: 'RL策略分',
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([['selector', '候选句子排序'], ['queue', `标注队列 (${selected.length})`], ['stats', `标注进度`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${tab === k ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Selector tab ── */}
      {tab === 'selector' && (
        <div className="space-y-4">
          {/* Weight config */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">评分维度权重配置</span>
              <span className="text-xs text-gray-400">调整权重后自动重排候选句子</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {(Object.entries(weights) as [keyof typeof weights, number][]).map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-gray-700">{W_LABELS[key]}</span>
                    <span className="font-bold text-blue-600">{(val * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0.05} max={0.60} step={0.05} value={val}
                    onChange={e => handleWeightChange(key, parseFloat(e.target.value))}
                    className="w-full accent-blue-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Budget + run */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
              <span className="text-xs text-gray-600 whitespace-nowrap">本轮标注预算</span>
              <input type="number" min={1} max={pending.length || 10} value={budget}
                onChange={e => setBudget(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-sm" />
              <span className="text-xs text-gray-500">句</span>
            </div>
            <button onClick={handleSelect} disabled={isRunning || pending.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors">
              {isRunning ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />选取中…</> : <><Play className="w-3.5 h-3.5" />RL智能选句</>}
            </button>
            <button onClick={handleReset} className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">重置</button>
            <div className="ml-auto text-xs text-gray-400">剩余未标注 <strong className="text-gray-700">{pending.length}</strong> 句 · 已选 <strong className="text-blue-600">{selected.length}</strong> · 已标注 <strong className="text-green-600">{annotated.length}</strong></div>
          </div>

          {/* Candidate list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 grid grid-cols-12 gap-2 text-[11px] font-medium text-gray-500">
              <span className="col-span-5">句子文本</span>
              <span className="col-span-1 text-center">不确定度</span>
              <span className="col-span-1 text-center">实体密度</span>
              <span className="col-span-1 text-center">多样性</span>
              <span className="col-span-1 text-center">策略分</span>
              <span className="col-span-2 text-center">综合分</span>
              <span className="col-span-1 text-center">状态</span>
            </div>
            <div className="divide-y divide-gray-100">
              {sentences.map((s, rank) => {
                const statusStyle = {
                  pending: '',
                  selected: 'bg-blue-50',
                  annotated: 'bg-green-50 opacity-60',
                  skipped: 'opacity-40',
                }[s.status];
                return (
                  <div key={s.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs transition-colors ${statusStyle}`}>
                    <div className="col-span-5">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] text-gray-400 w-4 flex-shrink-0 pt-0.5">#{rank + 1}</span>
                        <div>
                          <p className="text-gray-800 leading-relaxed">{s.text}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {s.predictedEntities.map((e, i) => (
                              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ENTITY_TYPE_COLORS[e.type] || 'bg-gray-100 text-gray-700'}`}>{e.text}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1"><ScoreBar value={s.uncertainty} color="bg-blue-400" /></div>
                    <div className="col-span-1"><ScoreBar value={s.entityDensity} color="bg-amber-400" /></div>
                    <div className="col-span-1"><ScoreBar value={s.diversity} color="bg-purple-400" /></div>
                    <div className="col-span-1"><ScoreBar value={s.policyScore} color="bg-green-500" /></div>
                    <div className="col-span-2 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${scoreGradient(s.compositeScore)}`}>
                        {(s.compositeScore * 100).toFixed(1)}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      {s.status === 'pending' && <span className="text-[10px] text-gray-400">待选</span>}
                      {s.status === 'selected' && <span className="text-[10px] text-blue-600 font-medium">已选✓</span>}
                      {s.status === 'annotated' && <span className="text-[10px] text-green-600 font-medium">已标注</span>}
                      {s.status === 'skipped' && <span className="text-[10px] text-gray-400">已跳过</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Queue tab ── */}
      {tab === 'queue' && (
        <div className="space-y-3">
          {selected.length === 0 && annotated.length === 0 ? (
            <div className="border border-gray-200 rounded-xl py-12 text-center text-gray-400 text-sm">
              暂无待标注句子，请先在「候选句子排序」中执行 RL 智能选句
            </div>
          ) : (
            <>
              {selected.length > 0 && (
                <div className="text-xs text-gray-500 mb-1">待标注 {selected.length} 句 · 点击「确认标注」模拟完成标注并获得奖励反馈</div>
              )}
              {[...selected, ...annotated].map((s) => (
                <div key={s.id} className={`border rounded-xl p-4 transition-all ${s.status === 'annotated' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${s.status === 'annotated' ? 'bg-green-500' : 'bg-blue-500'}`}>
                      {s.status === 'annotated' ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-white text-[10px] font-bold">标</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 mb-2">{s.text}</p>
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {s.predictedEntities.map((e, i) => (
                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ENTITY_TYPE_COLORS[e.type] || 'bg-gray-100 text-gray-700'}`}>{e.text} <span className="opacity-60">({e.type})</span></span>
                        ))}
                        {s.predictedEntities.length === 0 && <span className="text-[10px] text-gray-400">无预测实体（高多样性价值句）</span>}
                      </div>
                      <div className="text-[11px] text-gray-500">综合分 <strong className="text-blue-700">{(s.compositeScore * 100).toFixed(1)}</strong> · RL策略分 <strong className="text-green-700">{(s.policyScore * 100).toFixed(0)}%</strong></div>
                    </div>
                    {s.status === 'selected' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleAnnotate(s.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors">
                          <Check className="w-3 h-3" />确认标注
                        </button>
                        <button onClick={() => handleSkip(s.id)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">
                          <X className="w-3 h-3" />跳过
                        </button>
                      </div>
                    )}
                    {s.status === 'annotated' && (
                      <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ 已完成</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Stats tab ── */}
      {tab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '总语料句数', value: INITIAL_SENTENCES.length, color: 'text-gray-800' },
              { label: '已标注', value: annotated.length, color: 'text-green-700' },
              { label: '标注率', value: `${((annotated.length / INITIAL_SENTENCES.length) * 100).toFixed(1)}%`, color: 'text-blue-700' },
              { label: '累计奖励', value: rewardHistory.length ? rewardHistory.reduce((a, b) => a + b, 0).toFixed(3) : '0.000', color: 'text-purple-700' },
            ].map(stat => (
              <div key={stat.label} className="border border-gray-200 rounded-xl p-3 text-center bg-white">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Reward history */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-800">标注奖励历史</span>
              <span className="text-xs text-gray-400 ml-2">每完成一句标注后模型F1的边际提升</span>
            </div>
            {rewardHistory.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">完成标注后奖励曲线将在此显示</div>
            ) : (
              <div className="p-4">
                <svg viewBox={`0 0 ${Math.max(rewardHistory.length * 60, 300)} 80`} className="w-full">
                  {rewardHistory.map((r, i) => {
                    const x = i * 60 + 30;
                    const barH = Math.round((r / 0.12) * 60);
                    const y = 70 - barH;
                    return (
                      <g key={i}>
                        <rect x={x - 16} y={y} width={32} height={barH} rx={4} fill="#3b82f6" opacity={0.8} />
                        <text x={x} y={70 + 12} textAnchor="middle" fontSize={9} fill="#9ca3af">第{i + 1}句</text>
                        <text x={x} y={y - 3} textAnchor="middle" fontSize={9} fill="#1d4ed8" fontWeight="600">+{r}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Comparison */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            <div className="text-xs font-semibold text-gray-700 mb-3">与随机采样策略对比（模拟）</div>
            <div className="space-y-2">
              {[
                { label: 'RL选句（本算法）', pct: Math.min(annotated.length * 12, 100), color: 'bg-blue-500' },
                { label: '随机采样（基线）', pct: Math.min(annotated.length * 7, 100), color: 'bg-gray-300' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-36 flex-shrink-0">{row.label}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-10 text-right">{row.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-gray-400">纵轴：等效模型F1提升幅度（相对于0标注基线）</div>
          </div>
        </div>
      )}
    </div>
  );
}
