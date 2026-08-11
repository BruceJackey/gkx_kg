import React from 'react';
import { Play } from 'lucide-react';

const CONCEPT_PRESETS = [
  {
    id: 'dl',
    label: '深度学习模型',
    positives: ['BERT', 'GPT-4', 'ResNet', 'Transformer', 'LSTM', 'VGG', 'DenseNet', 'RoBERTa', 'T5', 'ViT'],
    negatives: ['随机森林', 'SVM', 'K-means', '线性回归', '决策树', 'PCA', 'Apriori', 'PageRank'],
    candidates: [
      { entity: 'ELECTRA', trueLabel: true },
      { entity: 'XGBoost', trueLabel: false },
      { entity: 'AlBERT', trueLabel: true },
      { entity: 'AdaBoost', trueLabel: false },
      { entity: 'ERNIE 3.0', trueLabel: true },
      { entity: 'Lasso回归', trueLabel: false },
      { entity: 'DeBERTa', trueLabel: true },
      { entity: '朴素贝叶斯', trueLabel: false },
      { entity: 'Swin Transformer', trueLabel: true },
      { entity: 'TF-IDF', trueLabel: false },
      { entity: 'MobileNet', trueLabel: true },
      { entity: '关联规则', trueLabel: false },
      { entity: 'LLaMA', trueLabel: true },
      { entity: '谱聚类', trueLabel: false },
      { entity: 'Qwen', trueLabel: true },
    ],
  },
  {
    id: 'org',
    label: 'AI研究机构',
    positives: ['DeepMind', 'OpenAI', '中科院自动化所', 'Google Brain', '清华AIR', 'Meta AI'],
    negatives: ['阿里云', '华为云', '腾讯音乐', '字节跳动电商', '京东物流', '滴滴出行'],
    candidates: [
      { entity: 'Anthropic', trueLabel: true },
      { entity: '拼多多', trueLabel: false },
      { entity: 'Stability AI', trueLabel: true },
      { entity: '美团外卖', trueLabel: false },
      { entity: '上海AI实验室', trueLabel: true },
      { entity: '顺丰速运', trueLabel: false },
      { entity: 'Mistral AI', trueLabel: true },
      { entity: '携程旅行', trueLabel: false },
      { entity: '智谱AI', trueLabel: true },
      { entity: '小红书', trueLabel: false },
    ],
  },
];

function genSvmResult(entity: string, trueLabel: boolean, threshold: number) {
  const baseConf = trueLabel
    ? 0.62 + Math.abs(Math.sin(entity.length * 7.3)) * 0.35
    : 0.08 + Math.abs(Math.sin(entity.length * 3.1)) * 0.38;
  const conf = Math.min(0.99, Math.max(0.01, baseConf));
  return { entity, confidence: conf, isInstance: conf >= threshold, isSupportVector: conf > 0.72 && conf < 0.88 };
}

export function StatInstanceGenerationDemo() {
  const [tab, setTab] = React.useState<'train' | 'predict' | 'filter'>('train');
  const [conceptId, setConceptId] = React.useState('dl');
  const [kernel, setKernel] = React.useState<'rbf' | 'linear' | 'poly'>('rbf');
  const [cParam, setCParam] = React.useState(1.0);
  const [gamma, setGamma] = React.useState(0.1);
  const [trainStep, setTrainStep] = React.useState<'idle' | 'running' | 'done'>('idle');
  const [trainProgress, setTrainProgress] = React.useState(0);
  const [threshold, setThreshold] = React.useState(0.60);
  const [predictStep, setPredictStep] = React.useState<'idle' | 'running' | 'done'>('idle');
  const [predictProgress, setPredictProgress] = React.useState(0);
  const [results, setResults] = React.useState<ReturnType<typeof genSvmResult>[]>([]);
  const trainRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const predictRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const concept = CONCEPT_PRESETS.find(c => c.id === conceptId)!;

  const handleTrain = () => {
    setTrainStep('running');
    setTrainProgress(0);
    setPredictStep('idle');
    setResults([]);
    let p = 0;
    trainRef.current = setInterval(() => {
      p += Math.random() * 8 + 4;
      setTrainProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(trainRef.current!);
        setTrainStep('done');
      }
    }, 120);
  };

  const handlePredict = () => {
    setPredictStep('running');
    setPredictProgress(0);
    setResults([]);
    let p = 0;
    let revealed: ReturnType<typeof genSvmResult>[] = [];
    const sorted = [...concept.candidates].sort((a, b) => a.entity.localeCompare(b.entity));
    predictRef.current = setInterval(() => {
      p += Math.random() * 12 + 6;
      const pct = Math.min(p, 100);
      setPredictProgress(pct);
      const count = Math.floor(sorted.length * pct / 100);
      revealed = sorted.slice(0, count).map(c => genSvmResult(c.entity, c.trueLabel, threshold));
      setResults([...revealed]);
      if (pct >= 100) {
        clearInterval(predictRef.current!);
        setPredictStep('done');
        setResults(sorted.map(c => genSvmResult(c.entity, c.trueLabel, threshold)));
      }
    }, 150);
  };

  const handleReset = () => {
    if (trainRef.current) clearInterval(trainRef.current);
    if (predictRef.current) clearInterval(predictRef.current);
    setTrainStep('idle'); setTrainProgress(0);
    setPredictStep('idle'); setPredictProgress(0);
    setResults([]);
  };

  const filteredResults = results.filter(r => r.confidence >= threshold);
  const positiveCount = filteredResults.filter(r => r.isInstance).length;

  // Confidence distribution buckets for histogram
  const allResults = predictStep === 'done'
    ? concept.candidates.map(c => genSvmResult(c.entity, c.trueLabel, threshold))
    : results;
  const buckets = [0, 0.2, 0.4, 0.6, 0.8].map(lo => ({
    lo, hi: lo + 0.2,
    count: allResults.filter(r => r.confidence >= lo && r.confidence < lo + 0.2).length,
  }));
  const maxBucket = Math.max(...buckets.map(b => b.count), 1);

  const confColor = (c: number) =>
    c >= 0.8 ? 'bg-green-400' : c >= 0.6 ? 'bg-blue-400' : c >= 0.4 ? 'bg-amber-400' : 'bg-red-300';
  const confTextColor = (c: number) =>
    c >= 0.8 ? 'text-green-700' : c >= 0.6 ? 'text-blue-700' : 'text-amber-700';

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          ['train', '分类模型训练'],
          ['predict', '批量实例预测'],
          ['filter', '置信度评估与筛选'],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${tab === k ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Train tab ── */}
      {tab === 'train' && (
        <div className="space-y-4">
          {/* Concept selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 whitespace-nowrap">目标概念</span>
            <div className="flex gap-2">
              {CONCEPT_PRESETS.map(c => (
                <button key={c.id} onClick={() => { setConceptId(c.id); handleReset(); }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${conceptId === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Samples */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-green-50 px-4 py-2.5 border-b border-green-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-800">正例样本（Positive）</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{concept.positives.length} 条</span>
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {concept.positives.map(p => (
                    <span key={p} className="text-xs bg-green-50 text-green-800 border border-green-200 px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-4 py-2.5 border-b border-red-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-800">负例样本（Negative）</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{concept.negatives.length} 条</span>
                </div>
                <div className="p-3 flex flex-wrap gap-1.5">
                  {concept.negatives.map(n => (
                    <span key={n} className="text-xs bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">{n}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* SVM config + train */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-800">SVM 超参数配置</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">核函数（Kernel）</div>
                    <div className="flex gap-2">
                      {(['rbf', 'linear', 'poly'] as const).map(k => (
                        <button key={k} onClick={() => setKernel(k)}
                          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${kernel === k ? 'bg-blue-50 text-blue-700 border-blue-400 font-medium' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                          {k === 'rbf' ? 'RBF（推荐）' : k === 'linear' ? '线性' : '多项式'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">惩罚系数 C</span><span className="font-bold text-blue-600">{cParam.toFixed(1)}</span></div>
                    <input type="range" min={0.1} max={10} step={0.1} value={cParam} onChange={e => setCParam(parseFloat(e.target.value))} className="w-full accent-blue-600" />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>欠拟合 0.1</span><span>过拟合 10</span></div>
                  </div>
                  {kernel === 'rbf' && (
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">gamma</span><span className="font-bold text-blue-600">{gamma.toFixed(2)}</span></div>
                      <input type="range" min={0.01} max={1} step={0.01} value={gamma} onChange={e => setGamma(parseFloat(e.target.value))} className="w-full accent-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleTrain} disabled={trainStep === 'running'}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-xl transition-colors">
                {trainStep === 'running' ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />训练中…</> : <><Play className="w-3.5 h-3.5" />{trainStep === 'done' ? '重新训练' : '训练 SVM 分类器'}</>}
              </button>

              {(trainStep === 'running' || trainStep === 'done') && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${trainStep === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${trainProgress}%` }} />
                  </div>
                  {trainStep === 'done' && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-green-700">✓ 模型训练完成</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[['交叉验证 F1', '88.4%'], ['支持向量数', `${concept.positives.length + 3}`], ['核函数', kernel.toUpperCase()], ['训练样本', `${concept.positives.length + concept.negatives.length} 条`]].map(([k, v]) => (
                          <div key={k} className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                            <div className="text-[10px] text-gray-500">{k}</div>
                            <div className="text-xs font-bold text-gray-800 mt-0.5">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Predict tab ── */}
      {tab === 'predict' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-gray-600">
              候选实体池：<strong className="text-gray-900">{concept.candidates.length}</strong> 个候选实体 · 目标概念：<strong className="text-blue-700">{concept.label}</strong>
            </div>
            <button onClick={handlePredict} disabled={trainStep !== 'done' || predictStep === 'running'}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
              title={trainStep !== 'done' ? '请先完成模型训练' : ''}>
              {predictStep === 'running' ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />预测中…</> : <><Play className="w-3.5 h-3.5" />批量预测</>}
            </button>
            {trainStep !== 'done' && <span className="text-xs text-amber-600">⚠ 请先训练模型</span>}
          </div>

          {/* Progress */}
          {predictStep !== 'idle' && (
            <div className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-600">预测进度</span>
                <span className="font-medium text-blue-700">{results.length} / {concept.candidates.length} 个实体</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${predictStep === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${predictProgress}%` }} />
              </div>
            </div>
          )}

          {/* Results table */}
          {results.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 grid grid-cols-12 gap-2 text-[11px] font-medium text-gray-500">
                <span className="col-span-4">候选实体</span>
                <span className="col-span-4">置信度</span>
                <span className="col-span-2 text-center">判定</span>
                <span className="col-span-2 text-center">支持向量</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {[...results].sort((a, b) => b.confidence - a.confidence).map(r => (
                  <div key={r.entity} className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center ${r.isInstance ? '' : 'opacity-60'}`}>
                    <span className="col-span-4 text-sm font-medium text-gray-800">{r.entity}</span>
                    <div className="col-span-4 flex items-center gap-1.5">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${confColor(r.confidence)}`} style={{ width: `${r.confidence * 100}%` }} />
                      </div>
                      <span className={`text-xs font-bold w-9 text-right ${confTextColor(r.confidence)}`}>{(r.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="col-span-2 text-center">
                      {r.isInstance
                        ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">是实例</span>
                        : <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">非实例</span>}
                    </div>
                    <div className="col-span-2 text-center text-[10px] text-gray-400">
                      {r.isSupportVector ? <span className="text-purple-600 font-medium">✦ SV</span> : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {predictStep === 'idle' && trainStep !== 'done' && (
            <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center text-gray-400 text-sm">
              请先完成「分类模型训练」后再执行批量预测
            </div>
          )}
        </div>
      )}

      {/* ── Filter tab ── */}
      {tab === 'filter' && (
        <div className="space-y-4">
          {/* Threshold slider */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">置信度阈值</span>
              <input type="range" min={0.1} max={0.95} step={0.05} value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600" />
              <span className="text-lg font-bold text-blue-600 w-14 text-right">{threshold.toFixed(2)}</span>
            </div>
            {predictStep === 'done' && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">全部预测 <strong className="text-gray-800">{allResults.length}</strong> 条</span>
                <span className="text-green-600">阈值以上 <strong>{filteredResults.filter(r => r.isInstance).length}</strong> 个实例</span>
                <span className="text-red-500">过滤掉 <strong>{allResults.length - filteredResults.length}</strong> 条</span>
                <span className="text-gray-500">预估精度 ~{(threshold * 80 + 20).toFixed(0)}%</span>
              </div>
            )}
          </div>

          {/* Histogram */}
          {predictStep === 'done' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">置信度分布直方图</span>
              </div>
              <div className="p-4">
                <div className="flex items-end gap-3 h-28">
                  {buckets.map(b => {
                    const barH = Math.round((b.count / maxBucket) * 88);
                    const active = b.lo >= threshold;
                    return (
                      <div key={b.lo} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-gray-500">{b.count}</span>
                        <div className="w-full rounded-t-sm transition-colors" style={{ height: Math.max(barH, 4) }}
                          title={`${(b.lo * 100).toFixed(0)}-${(b.hi * 100).toFixed(0)}%: ${b.count}条`}>
                          <div className={`w-full h-full rounded-t-sm ${active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        </div>
                        <span className="text-[9px] text-gray-400">{(b.lo * 100).toFixed(0)}-{(b.hi * 100).toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filtered results */}
          {predictStep === 'done' && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">筛选后实例列表</span>
                <span className="text-xs text-gray-400">置信度 ≥ {threshold.toFixed(2)} 且判定为实例</span>
              </div>
              {filteredResults.filter(r => r.isInstance).length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">当前阈值下无符合条件的实例</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                  {filteredResults.filter(r => r.isInstance).sort((a, b) => b.confidence - a.confidence).map(r => (
                    <div key={r.entity} className="flex items-center gap-4 px-4 py-2.5">
                      <span className="text-sm font-medium text-gray-800 flex-1">{r.entity}</span>
                      <div className="flex items-center gap-1.5 w-32">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${confColor(r.confidence)}`} style={{ width: `${r.confidence * 100}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${confTextColor(r.confidence)}`}>{(r.confidence * 100).toFixed(1)}%</span>
                      </div>
                      {r.isSupportVector && <span className="text-[10px] text-purple-600 font-medium">✦ SV</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {predictStep !== 'done' && (
            <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center text-gray-400 text-sm">
              请先完成「批量实例预测」后查看置信度分布与筛选结果
            </div>
          )}
        </div>
      )}
    </div>
  );
}
