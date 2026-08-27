import { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle, XCircle, X, Rocket } from 'lucide-react';
import type { SupervisedSimilarityFocus } from '../../data/auditPageMap';

const INIT_PAIRS = [
  { id: 'p1', a: '苹果公司', b: 'Apple Inc.', hint: '知名科技企业', label: null as null | 'similar' | 'dissimilar' },
  { id: 'p2', a: '人工智能', b: '机器学习', hint: '相关但层次不同的概念', label: null as null | 'similar' | 'dissimilar' },
  { id: 'p3', a: '清华大学', b: '清华大学（THU）', hint: '同一机构不同表述', label: 'similar' as null | 'similar' | 'dissimilar' },
  { id: 'p4', a: '深度学习', b: '卷积神经网络', hint: '上下位关系', label: null as null | 'similar' | 'dissimilar' },
  { id: 'p5', a: 'GPT-4', b: 'Claude 3', hint: '同类产品不同品牌', label: 'dissimilar' as null | 'similar' | 'dissimilar' },
  { id: 'p6', a: '知识图谱', b: 'Knowledge Graph', hint: '中英文对照', label: 'similar' as null | 'similar' | 'dissimilar' },
  { id: 'p7', a: '北京', b: '上海', hint: '同类型不同实体', label: null as null | 'similar' | 'dissimilar' },
  { id: 'p8', a: '变压器（Transformer）', b: '注意力机制', hint: '架构与核心机制', label: null as null | 'similar' | 'dissimilar' },
];

const TRAIN_LOGS = [
  'Epoch 1/10 — loss: 0.6821  auc: 0.7140',
  'Epoch 2/10 — loss: 0.5934  auc: 0.7803',
  'Epoch 3/10 — loss: 0.4912  auc: 0.8411',
  'Epoch 4/10 — loss: 0.4103  auc: 0.8844',
  'Epoch 5/10 — loss: 0.3597  auc: 0.9106',
  'Epoch 6/10 — loss: 0.3118  auc: 0.9320',
  'Epoch 7/10 — loss: 0.2804  auc: 0.9451  ← Early Stop 候选',
  'Epoch 8/10 — loss: 0.2711  auc: 0.9488',
  'Epoch 9/10 — loss: 0.2689  auc: 0.9501',
  'Epoch 10/10 — loss: 0.2662  auc: 0.9527  ✓ Best',
  '保存检查点 model_v1.pt …',
  '在测试集上评估 …',
  '训练完成 · AUC 0.9527 · F1 0.9214',
];

const PR_POINTS = [
  { t: 0.5, p: 0.82, r: 0.96 }, { t: 0.6, p: 0.87, r: 0.93 }, { t: 0.7, p: 0.91, r: 0.90 },
  { t: 0.75, p: 0.938, r: 0.905 }, { t: 0.8, p: 0.95, r: 0.87 }, { t: 0.85, p: 0.97, r: 0.82 },
  { t: 0.9, p: 0.98, r: 0.74 }, { t: 0.95, p: 0.99, r: 0.61 },
];

interface SupervisedSimilarityDemoProps {
  initialSection?: SupervisedSimilarityFocus;
  onRequestTrainingModal?: () => void;
}

export function SupervisedSimilarityDemo({
  initialSection,
  onRequestTrainingModal,
}: SupervisedSimilarityDemoProps) {
  const [activeSection, setActiveSection] = useState<'annotate' | 'train' | 'evaluate'>(
    initialSection === 'evaluate' ? 'evaluate' : initialSection === 'train' ? 'train' : 'annotate',
  );
  const [pairs, setPairs] = useState(INIT_PAIRS);
  const [trainConfig, setTrainConfig] = useState({ arch: 'siamese-bert', epochs: 10, lr: '2e-5', batchSize: 32 });
  const [trainState, setTrainState] = useState<'idle' | 'running' | 'done'>(
    initialSection === 'evaluate' ? 'done' : 'idle',
  );
  const [trainProgress, setTrainProgress] = useState(initialSection === 'evaluate' ? 100 : 0);
  const [trainLog, setTrainLog] = useState<string[]>(initialSection === 'evaluate' ? TRAIN_LOGS : []);
  const [threshold, setThreshold] = useState(0.75);
  const [published, setPublished] = useState(false);
  const trainTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const labeled = pairs.filter(p => p.label !== null).length;
  const similarCount = pairs.filter(p => p.label === 'similar').length;
  const dissimilarCount = pairs.filter(p => p.label === 'dissimilar').length;

  const setLabel = (id: string, label: 'similar' | 'dissimilar' | null) =>
    setPairs(prev => prev.map(p => p.id === id ? { ...p, label } : p));

  useEffect(() => {
    if (!initialSection) return;
    if (initialSection === 'train') {
      setActiveSection('train');
      return;
    }
    if (initialSection === 'evaluate') {
      setActiveSection('evaluate');
      setTrainState('done');
      setTrainProgress(100);
      setTrainLog(TRAIN_LOGS);
    }
  }, [initialSection]);

  const startTraining = () => {
    if (labeled < 4) return;
    setTrainState('running');
    setTrainProgress(0);
    setTrainLog([]);
    let step = 0;
    trainTimerRef.current = setInterval(() => {
      step++;
      setTrainProgress(Math.min(100, Math.round((step / TRAIN_LOGS.length) * 100)));
      setTrainLog(prev => [...prev, TRAIN_LOGS[step - 1]]);
      if (step >= TRAIN_LOGS.length) {
        clearInterval(trainTimerRef.current!);
        setTrainState('done');
      }
    }, 400);
  };

  // cleanup on unmount
  const cleanupRef = useRef<() => void>(() => { if (trainTimerRef.current) clearInterval(trainTimerRef.current); });
  useRef(cleanupRef.current);

  const curPoint = PR_POINTS.reduce((a, b) => Math.abs(b.t - threshold) < Math.abs(a.t - threshold) ? b : a);

  const METRICS = [
    { label: 'AUC', value: '0.9527', color: 'bg-blue-50 text-blue-900', sub: '区分能力' },
    { label: 'F1', value: '0.9214', color: 'bg-indigo-50 text-indigo-900', sub: '综合指标' },
    { label: 'Precision', value: '0.9380', color: 'bg-purple-50 text-purple-900', sub: '精确率' },
    { label: 'Recall', value: '0.9054', color: 'bg-violet-50 text-violet-900', sub: '召回率' },
  ];

  const SECTIONS = [
    { id: 'annotate' as const, label: '① 样本标注', active: 'border-amber-500 text-amber-700' },
    { id: 'train' as const, label: '② 模型训练', active: 'border-blue-500 text-blue-700' },
    { id: 'evaluate' as const, label: '③ 评估与发布', active: 'border-green-500 text-green-700' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? s.active : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'annotate' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">相似度样本标注工具</h3>
              <p className="text-sm text-gray-500 mt-0.5">对每组实体对判断是否表示"相似"含义</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">已标注 <span className="font-semibold text-gray-900">{labeled}</span> / {pairs.length}</span>
              <span className="text-green-600">相似 {similarCount}</span>
              <span className="text-red-500">不相似 {dissimilarCount}</span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 rounded-full" style={{ width: `${(labeled / pairs.length) * 100}%` }} />
          </div>
          <div className="space-y-2">
            {pairs.map((pair, idx) => (
              <div key={pair.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${pair.label === 'similar' ? 'border-green-300 bg-green-50/50' : pair.label === 'dissimilar' ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <span className="text-xs text-gray-400 w-5 flex-shrink-0 font-mono">{idx + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                  <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">实体 A</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{pair.a}</p>
                  </div>
                  <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                    <p className="text-[11px] text-gray-400 mb-0.5">实体 B</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{pair.b}</p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 w-28 flex-shrink-0 text-center hidden lg:block">{pair.hint}</span>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setLabel(pair.id, pair.label === 'similar' ? null : 'similar')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${pair.label === 'similar' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}>
                    <CheckCircle className="w-3.5 h-3.5" />相似
                  </button>
                  <button onClick={() => setLabel(pair.id, pair.label === 'dissimilar' ? null : 'dissimilar')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${pair.label === 'dissimilar' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'}`}>
                    <XCircle className="w-3.5 h-3.5" />不相似
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">建议每类至少标注 50 对以获得稳定效果，当前为演示样本</p>
            <button onClick={() => setActiveSection('train')} disabled={labeled < 2}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
              下一步：训练模型 →
            </button>
          </div>
        </div>
      )}

      {activeSection === 'train' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">相似度模型训练</h3>
            <p className="text-sm text-gray-500 mt-0.5">基于 {labeled} 条标注样本（相似 {similarCount} · 不相似 {dissimilarCount}）训练专用相似度模型</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">模型架构</label>
              <select value={trainConfig.arch} onChange={e => setTrainConfig(c => ({ ...c, arch: e.target.value }))} disabled={trainState === 'running'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="siamese-bert">孪生网络（Siamese BERT）</option>
                <option value="simcse">对比学习（SimCSE）</option>
                <option value="cross-encoder">交叉编码器（Cross-Encoder）</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">训练轮数 (Epochs)</label>
              <input type="number" min={3} max={50} value={trainConfig.epochs} onChange={e => setTrainConfig(c => ({ ...c, epochs: +e.target.value }))} disabled={trainState === 'running'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">学习率</label>
              <select value={trainConfig.lr} onChange={e => setTrainConfig(c => ({ ...c, lr: e.target.value }))} disabled={trainState === 'running'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="1e-5">1e-5（保守）</option>
                <option value="2e-5">2e-5（推荐）</option>
                <option value="5e-5">5e-5（激进）</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">批大小 (Batch Size)</label>
              <select value={trainConfig.batchSize} onChange={e => setTrainConfig(c => ({ ...c, batchSize: +e.target.value }))} disabled={trainState === 'running'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value={16}>16</option>
                <option value={32}>32（推荐）</option>
                <option value={64}>64</option>
              </select>
            </div>
          </div>
          {trainState === 'idle' && (
            <div className="flex flex-wrap gap-3">
              <button onClick={startTraining}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Play className="w-4 h-4" />发起训练
              </button>
              {onRequestTrainingModal && (
                <button
                  onClick={onRequestTrainingModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  完整训练配置
                </button>
              )}
            </div>
          )}
          {(trainState === 'running' || trainState === 'done') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">{trainState === 'running' ? '训练进行中…' : '训练完成 ✓'}</span>
                <span className="text-gray-500">{trainProgress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${trainState === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${trainProgress}%` }} />
              </div>
              <div className="bg-gray-950 rounded-xl p-4 font-mono text-[11px] text-green-400 h-48 overflow-y-auto space-y-0.5">
                {trainLog.map((line, i) => (
                  <div key={i} className={`leading-5 ${line.includes('✓') ? 'text-green-300 font-semibold' : line.includes('Early Stop') ? 'text-yellow-400' : 'text-green-400'}`}>{line}</div>
                ))}
                {trainState === 'running' && <div className="text-green-600 animate-pulse">▋</div>}
              </div>
              {trainState === 'done' && (
                <div className="flex justify-end">
                  <button onClick={() => setActiveSection('evaluate')}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                    下一步：评估与发布 →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSection === 'evaluate' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">模型评估与发布</h3>
              <p className="text-sm text-gray-500 mt-0.5">测试集自动评估结果 · 调节阈值 · 确认后一键发布为服务</p>
            </div>
            {trainState !== 'done' && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">请先完成模型训练</span>}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {METRICS.map(m => (
              <div key={m.label} className={`rounded-xl p-4 ${m.color} ${trainState !== 'done' ? 'opacity-40' : ''}`}>
                <p className="text-xs font-medium mb-1 opacity-70">{m.sub}</p>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs font-semibold mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          <div className={`border border-gray-200 rounded-xl p-5 ${trainState !== 'done' ? 'opacity-40 pointer-events-none' : ''}`}>
            <p className="text-sm font-semibold text-gray-700 mb-4">混淆矩阵（测试集）</p>
            <div className="flex gap-6 items-start">
              <div className="grid grid-cols-3 gap-1 text-center text-sm">
                <div /><div className="text-xs text-gray-500 font-medium pb-1">预测:相似</div><div className="text-xs text-gray-500 font-medium pb-1">预测:不相似</div>
                <div className="text-xs text-gray-500 font-medium flex items-center justify-end pr-2">实际:相似</div>
                <div className="w-20 h-16 bg-green-100 border-2 border-green-400 rounded-lg flex flex-col items-center justify-center"><span className="text-lg font-bold text-green-800">47</span><span className="text-[10px] text-green-600">TP</span></div>
                <div className="w-20 h-16 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center"><span className="text-lg font-bold text-red-500">3</span><span className="text-[10px] text-red-400">FN</span></div>
                <div className="text-xs text-gray-500 font-medium flex items-center justify-end pr-2">实际:不相似</div>
                <div className="w-20 h-16 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center justify-center"><span className="text-lg font-bold text-red-500">5</span><span className="text-[10px] text-red-400">FP</span></div>
                <div className="w-20 h-16 bg-green-100 border-2 border-green-400 rounded-lg flex flex-col items-center justify-center"><span className="text-lg font-bold text-green-800">45</span><span className="text-[10px] text-green-600">TN</span></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700 mb-2">相似度判断阈值</p>
                <div className="flex items-center gap-3 mb-3">
                  <input type="range" min={0.5} max={0.95} step={0.05} value={threshold} onChange={e => setThreshold(+e.target.value)} className="flex-1 accent-blue-600" />
                  <span className="text-sm font-bold text-gray-900 w-10 text-right">{threshold}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-0.5">当前阈值 Precision</p><p className="font-semibold text-gray-900">{(curPoint.p * 100).toFixed(1)}%</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400 mb-0.5">当前阈值 Recall</p><p className="font-semibold text-gray-900">{(curPoint.r * 100).toFixed(1)}%</p></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">← 降低阈值提高召回 · 升高阈值提高精度 →</p>
              </div>
            </div>
          </div>
          <div className={`border rounded-xl p-5 flex items-center justify-between ${published ? 'border-green-300 bg-green-50' : 'border-gray-200'} ${trainState !== 'done' ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <p className="font-medium text-gray-900">{published ? '✓ 模型已成功发布为服务' : '发布相似度计算服务'}</p>
              <p className="text-sm text-gray-500 mt-0.5">{published ? `服务端点：POST /api/similarity/ALG_SUP_SIM_001  ·  阈值：${threshold}` : `将以阈值 ${threshold} 发布为 REST API，自动生成 SDK 文档`}</p>
              {published && <p className="text-xs text-green-600 mt-1 font-mono">{"curl -X POST /api/similarity/ALG_SUP_SIM_001 -d '{\"pairs\":[]}'​"}</p>}
            </div>
            <button onClick={() => setPublished(p => !p)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${published ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
              {published ? <><X className="w-4 h-4" />取消发布</> : <><Rocket className="w-4 h-4" />一键发布</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
