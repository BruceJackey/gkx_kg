import React from 'react';
import { Play } from 'lucide-react';

const NOISY_SENTENCE_POOL = [
  { id: 's1', text: '苹果公司于2023年宣布收购了该初创企业，进一步布局人工智能领域。', distant_label: '收购', quality: 0.91, noise: false, features: { dep_path_len: 2, trigger: '宣布收购', negation: false } },
  { id: 's2', text: '乔布斯的苹果和微软之间曾经存在激烈的竞争关系。', distant_label: '收购', quality: 0.18, noise: true, features: { dep_path_len: 6, trigger: null, negation: false } },
  { id: 's3', text: '据报道，该公司完成了对目标企业的全部股权收购，交易金额达15亿美元。', distant_label: '收购', quality: 0.88, noise: false, features: { dep_path_len: 3, trigger: '完成收购', negation: false } },
  { id: 's4', text: '收购案尚未得到监管机构批准，双方并未正式合并。', distant_label: '收购', quality: 0.22, noise: true, features: { dep_path_len: 4, trigger: '收购', negation: true } },
  { id: 's5', text: '该集团以换股方式完成了对竞争对手的战略并购，整合后市场份额超过40%。', distant_label: '收购', quality: 0.85, noise: false, features: { dep_path_len: 2, trigger: '完成并购', negation: false } },
  { id: 's6', text: '据悉苹果公司计划收购，但实际谈判破裂，交易告吹。', distant_label: '收购', quality: 0.14, noise: true, features: { dep_path_len: 5, trigger: '计划收购', negation: true } },
  { id: 's7', text: '董事会批准了这一跨境收购提案，预计将于下季度完成交割。', distant_label: '收购', quality: 0.79, noise: false, features: { dep_path_len: 3, trigger: '批准收购', negation: false } },
  { id: 's8', text: '两家企业均在科技领域，历史上曾是合作伙伴，后分道扬镳。', distant_label: '收购', quality: 0.09, noise: true, features: { dep_path_len: 7, trigger: null, negation: false } },
  { id: 's9', text: '收购完成后，被并购方保持独立品牌运营，核心团队全部留任。', distant_label: '收购', quality: 0.82, noise: false, features: { dep_path_len: 2, trigger: '收购完成', negation: false } },
  { id: 's10', text: '尽管外界猜测收购可能发生，但公司官方否认了相关传闻。', distant_label: '收购', quality: 0.11, noise: true, features: { dep_path_len: 5, trigger: '否认收购', negation: true } },
  { id: 's11', text: '这笔收购交易历经18个月谈判，最终以现金加股票的混合方式达成。', distant_label: '收购', quality: 0.93, noise: false, features: { dep_path_len: 2, trigger: '收购交易达成', negation: false } },
  { id: 's12', text: '由于反垄断审查，此次拟议收购案已被相关部门叫停。', distant_label: '收购', quality: 0.16, noise: true, features: { dep_path_len: 4, trigger: '收购案叫停', negation: true } },
];

export function RLDenoisingDemo() {
  const [tab, setTab] = React.useState<'identify' | 'optimize' | 'filter'>('identify');
  const [threshold, setThreshold] = React.useState(0.5);
  const [rlStep, setRlStep] = React.useState<'idle' | 'running' | 'done'>('idle');
  const [rlProgress, setRlProgress] = React.useState(0);
  const [rlRound, setRlRound] = React.useState(0);
  const [f1History, setF1History] = React.useState<{ round: number; baseline: number; denoised: number }[]>([]);
  const rlRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const sentences = NOISY_SENTENCE_POOL;
  const retained = sentences.filter(s => s.quality >= threshold);
  const noiseRate = sentences.filter(s => s.quality < threshold).length / sentences.length;

  const handleStartRL = () => {
    setRlStep('running');
    setRlProgress(0);
    setRlRound(0);
    setF1History([]);
    let round = 0;
    const baseF1s = [0.612, 0.627, 0.641, 0.653, 0.659, 0.663];
    const denoisedF1s = [0.648, 0.671, 0.689, 0.704, 0.716, 0.724];
    rlRef.current = setInterval(() => {
      round += 1;
      setRlRound(round);
      setRlProgress(Math.round((round / 6) * 100));
      setF1History(prev => [...prev, { round, baseline: baseF1s[round - 1], denoised: denoisedF1s[round - 1] }]);
      if (round >= 6) {
        clearInterval(rlRef.current!);
        setRlStep('done');
      }
    }, 700);
  };

  const qualityColor = (q: number) =>
    q >= 0.7 ? 'bg-green-400' : q >= 0.4 ? 'bg-amber-400' : 'bg-red-300';
  const qualityTextColor = (q: number) =>
    q >= 0.7 ? 'text-green-700' : q >= 0.4 ? 'text-amber-700' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          ['identify', '噪声句子识别'],
          ['optimize', '强化学习策略优化'],
          ['filter', '质量分数过滤'],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${tab === k ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Identify tab ── */}
      {tab === 'identify' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
            远程监督自动标注数据集 · 关系类型：<strong>收购</strong> · 共 {sentences.length} 条候选句子 · 含 {sentences.filter(s => s.noise).length} 条噪声（{Math.round(sentences.filter(s => s.noise).length / sentences.length * 100)}%）
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 grid grid-cols-12 gap-2 text-[11px] font-medium text-gray-500">
              <span className="col-span-6">候选句子</span>
              <span className="col-span-2 text-center">质量分</span>
              <span className="col-span-2 text-center">触发词</span>
              <span className="col-span-2 text-center">判定</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {sentences.map(s => (
                <div key={s.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-start ${s.noise ? 'bg-red-50/30' : ''}`}>
                  <div className="col-span-6">
                    <p className="text-xs text-gray-800 leading-relaxed">{s.text}</p>
                    {s.features.negation && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mt-1 inline-block">含否定词</span>
                    )}
                  </div>
                  <div className="col-span-2 flex flex-col items-center gap-1 pt-0.5">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${qualityColor(s.quality)}`} style={{ width: `${s.quality * 100}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold ${qualityTextColor(s.quality)}`}>{(s.quality * 100).toFixed(0)}%</span>
                  </div>
                  <div className="col-span-2 text-center pt-0.5">
                    {s.features.trigger
                      ? <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s.features.trigger}</span>
                      : <span className="text-[10px] text-gray-300">—</span>}
                  </div>
                  <div className="col-span-2 text-center pt-0.5">
                    {s.noise
                      ? <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">噪声</span>
                      : <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">正例</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Optimize tab ── */}
      {tab === 'optimize' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['策略网络', 'REINFORCE', 'text-purple-700 bg-purple-50 border-purple-200'],
              ['奖励信号', '验证集 F1 增量', 'text-blue-700 bg-blue-50 border-blue-200'],
              ['训练轮次', '6 轮交替优化', 'text-green-700 bg-green-50 border-green-200'],
            ].map(([k, v, cls]) => (
              <div key={k} className={`border rounded-xl p-3 ${cls}`}>
                <div className="text-[10px] opacity-70 mb-0.5">{k}</div>
                <div className="text-xs font-bold">{v}</div>
              </div>
            ))}
          </div>

          <button onClick={handleStartRL} disabled={rlStep === 'running'}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-xl transition-colors">
            {rlStep === 'running'
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />训练中… 第 {rlRound} 轮</>
              : <><Play className="w-3.5 h-3.5" />{rlStep === 'done' ? '重新训练' : '启动强化学习训练'}</>}
          </button>

          {f1History.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">F1 提升曲线（每轮交替训练）</span>
                {rlStep === 'done' && (
                  <span className="text-xs text-green-700 font-medium bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    +{((f1History[f1History.length - 1].denoised - f1History[0].baseline) * 100).toFixed(1)}% F1 提升
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-end gap-3 h-36">
                  {f1History.map(r => {
                    const baseH = Math.round((r.baseline - 0.6) * 400);
                    const denH = Math.round((r.denoised - 0.6) * 400);
                    return (
                      <div key={r.round} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end" style={{ height: 112 }}>
                          <div className="flex-1 bg-gray-300 rounded-t-sm" style={{ height: Math.max(baseH, 4) }} title={`基线 ${(r.baseline * 100).toFixed(1)}%`} />
                          <div className="flex-1 bg-purple-500 rounded-t-sm" style={{ height: Math.max(denH, 4) }} title={`降噪后 ${(r.denoised * 100).toFixed(1)}%`} />
                        </div>
                        <span className="text-[9px] text-gray-400">R{r.round}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-gray-300 rounded-sm inline-block" />基线（含噪）</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-purple-500 rounded-sm inline-block" />降噪后</span>
                  <span className="ml-auto text-[10px]">纵轴：F1（基准线 0.60）</span>
                </div>
              </div>
              <div className="border-t border-gray-100 px-4 py-2.5 grid grid-cols-4 gap-3">
                {[['基线F1', `${(f1History[0]?.baseline * 100).toFixed(1)}%`, 'text-gray-600'],
                  ['最终F1', `${(f1History[f1History.length - 1]?.denoised * 100).toFixed(1)}%`, 'text-purple-700'],
                  ['噪声率', `${Math.round(sentences.filter(s => s.noise).length / sentences.length * 100)}%`, 'text-red-600'],
                  ['过滤后规模', `${sentences.filter(s => !s.noise).length}/${sentences.length}`, 'text-green-700']].map(([k, v, cls]) => (
                  <div key={k} className="text-center">
                    <div className="text-[10px] text-gray-400">{k}</div>
                    <div className={`text-sm font-bold ${cls}`}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filter tab ── */}
      {tab === 'filter' && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">质量分数阈值</span>
              <input type="range" min={0.1} max={0.9} step={0.05} value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                className="flex-1 accent-purple-600" />
              <span className="text-lg font-bold text-purple-600 w-12 text-right">{threshold.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-500">原始总量 <strong className="text-gray-800">{sentences.length}</strong> 条</span>
              <span className="text-green-600">保留 <strong>{retained.length}</strong> 条</span>
              <span className="text-red-500">过滤 <strong>{sentences.length - retained.length}</strong> 条</span>
              <span className="text-gray-500">噪声过滤率 <strong className="text-purple-700">{Math.round(noiseRate * 100)}%</strong></span>
              <span className="text-gray-500 ml-auto">预估F1增益 <strong className="text-purple-700">+{(Math.min(noiseRate * 0.7, 0.11) * 100).toFixed(1)}%</strong></span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">过滤结果（阈值 ≥ {threshold.toFixed(2)}）</span>
              <span className="text-xs text-gray-400">{retained.length} 条保留</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {[...retained].sort((a, b) => b.quality - a.quality).map(s => (
                <div key={s.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-800 leading-relaxed">{s.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {s.features.trigger && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">触发词: {s.features.trigger}</span>
                      )}
                      <span className="text-[10px] text-gray-400">依存路径长度: {s.features.dep_path_len}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-bold ${qualityTextColor(s.quality)}`}>{(s.quality * 100).toFixed(0)}%</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${qualityColor(s.quality)}`} style={{ width: `${s.quality * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
