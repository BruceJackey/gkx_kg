import React, { useState, useRef } from 'react';
import { Play, TrendingUp, Cpu, Eye } from 'lucide-react';

interface PretrainedModel {
  id: string; name: string; org: string; dim: number; lang: string;
  speed: string; specialty: string; badge: string; badgeColor: string;
}

const PRETRAINED_MODELS: PretrainedModel[] = [
  { id: 'bge-large', name: 'BGE-Large-zh', org: 'BAAI', dim: 1024, lang: '中文', speed: '中', specialty: '语义检索最强', badge: '推荐', badgeColor: 'bg-blue-100 text-blue-700' },
  { id: 'text2vec', name: 'text2vec-chinese', org: 'shibing624', dim: 768, lang: '中文', speed: '快', specialty: '中文句义匹配', badge: '轻量', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'ernie3', name: 'ERNIE 3.0', org: '百度', dim: 768, lang: '中文', speed: '中', specialty: '百科知识增强', badge: '', badgeColor: '' },
  { id: 'macbert', name: 'MacBERT-Large', org: 'HFL', dim: 1024, lang: '中文', speed: '慢', specialty: '中文NLP基准', badge: '', badgeColor: '' },
  { id: 'roberta', name: 'RoBERTa-wwm', org: 'HFL', dim: 768, lang: '中英', speed: '中', specialty: '通用文本理解', badge: '', badgeColor: '' },
  { id: 'gte', name: 'GTE-Large', org: '阿里', dim: 1024, lang: '中英', speed: '慢', specialty: '多语言嵌入', badge: '新', badgeColor: 'bg-purple-100 text-purple-700' },
];

const FINETUNE_STRATEGIES = [
  { id: 'continue', label: '继续预训练', desc: '在领域语料上无监督继续训练，适合语料量大（>50K 句）' },
  { id: 'contrast', label: '对比学习', desc: '使用术语对 / 近义词对进行对比微调，精度最高', recommended: true },
  { id: 'supervised', label: '监督微调', desc: '使用标注的相似度句对（SimCSE 风格），需要标注数据' },
];

const MOCK_CORPUS_FILES = [
  { name: '芯片领域语料.txt', size: '2.3 MB', sentences: 18420 },
  { name: '新能源技术文献.jsonl', size: '5.1 MB', sentences: 41280 },
];

const MOCK_TERMS = ['深度学习', '卷积神经网络', '变压器架构', '梯度下降', '过拟合', '正则化', '注意力机制', '迁移学习'];

export function TermVectorDemo() {
  const [selectedModel, setSelectedModel] = useState('bge-large');
  const [strategy, setStrategy] = useState('contrast');
  const [corpusFiles, setCorpusFiles] = useState(MOCK_CORPUS_FILES);
  const [finetuneStep, setFinetuneStep] = useState<'idle' | 'preparing' | 'training' | 'evaluating' | 'done'>('idle');
  const [ftProgress, setFtProgress] = useState(0);
  const [ftEpoch, setFtEpoch] = useState(0);
  const ftRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [dragging, setDragging] = useState(false);

  const model = PRETRAINED_MODELS.find(m => m.id === selectedModel)!;

  const startFinetune = () => {
    setFinetuneStep('preparing');
    setFtProgress(0); setFtEpoch(0); setShowComparison(false);
    let phase = 0;
    let localProgress = 0;
    ftRef.current = setInterval(() => {
      localProgress += Math.random() * 4 + 1.5;
      setFtProgress(Math.min(localProgress, 100));
      if (localProgress > 20 && phase === 0) { phase = 1; setFinetuneStep('training'); }
      if (localProgress > 65 && phase === 1) { setFtEpoch(p => Math.min(p + 1, 3)); }
      if (localProgress > 90 && phase <= 1) { phase = 2; setFinetuneStep('evaluating'); }
      if (localProgress >= 100) {
        clearInterval(ftRef.current!);
        setFinetuneStep('done');
        setFtProgress(100);
        setShowComparison(true);
      }
    }, 250);
  };

  const resetFinetune = () => {
    if (ftRef.current) clearInterval(ftRef.current);
    setFinetuneStep('idle'); setFtProgress(0); setFtEpoch(0); setShowComparison(false);
  };

  const STEP_LABELS: Record<string, string> = { idle: '未开始', preparing: '数据预处理中', training: '模型训练中', evaluating: '效果评估中', done: '微调完成' };
  const STEP_COLOR: Record<string, string> = { idle: 'text-gray-400', preparing: 'text-blue-500', training: 'text-indigo-500', evaluating: 'text-purple-500', done: 'text-green-600' };

  // Mock 2D vectors for visualization (before / after finetune)
  const TERM_POSITIONS_BASE: Record<string, [number, number]> = {
    '深度学习': [120, 80], '卷积神经网络': [145, 110], '变压器架构': [80, 140],
    '梯度下降': [220, 60], '过拟合': [240, 100], '正则化': [210, 130],
    '注意力机制': [100, 180], '迁移学习': [170, 170],
  };
  const TERM_POSITIONS_FT: Record<string, [number, number]> = {
    '深度学习': [110, 85], '卷积神经网络': [130, 105], '变压器架构': [95, 125],
    '梯度下降': [215, 55], '过拟合': [225, 90], '正则化': [208, 115],
    '注意力机制': [108, 165], '迁移学习': [155, 155],
  };
  const CLUSTER_COLORS = ['#3b82f6', '#3b82f6', '#3b82f6', '#f59e0b', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];

  const positions = showComparison ? TERM_POSITIONS_FT : TERM_POSITIONS_BASE;

  return (
    <div className="space-y-6">
      {/* ── Model selection ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800">预训练模型选择</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {PRETRAINED_MODELS.map(m => (
            <div key={m.id} onClick={() => setSelectedModel(m.id)}
              className={`border-2 rounded-xl p-3.5 cursor-pointer transition-all ${selectedModel === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedModel === m.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {selectedModel === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex items-center gap-1">
                  {m.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.badgeColor}`}>{m.badge}</span>}
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{m.org}</span>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900">{m.name}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{m.specialty}</div>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">dim={m.dim}</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{m.lang}</span>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">速度:{m.speed}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-2.5 bg-blue-50 border-t border-blue-100 text-xs text-blue-700 flex items-center gap-1.5">
          <span className="font-medium">已选：{model.name}</span>
          <span className="text-blue-400">·</span>
          <span>向量维度 {model.dim}d · {model.lang} · {model.specialty}</span>
        </div>
      </div>

      {/* ── Fine-tune ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-gray-800">模型领域微调</span>
          </div>
          {finetuneStep === 'idle' && (
            <button onClick={startFinetune} disabled={corpusFiles.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-40 transition-colors">
              <Play className="w-3 h-3" />开始微调
            </button>
          )}
          {finetuneStep !== 'idle' && finetuneStep !== 'done' && (
            <button onClick={resetFinetune} className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
          )}
          {finetuneStep === 'done' && (
            <button onClick={resetFinetune} className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">重置</button>
          )}
        </div>

        <div className="p-5 grid grid-cols-2 gap-5">
          {/* Left: config */}
          <div className="space-y-4">
            {/* Corpus upload */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">领域语料</div>
              <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); }}
                className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors ${dragging ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="text-xs text-gray-500 mb-1">拖拽上传 TXT / JSONL 文件</div>
                <div className="text-[11px] text-gray-400">或</div>
                <button className="mt-1 text-xs text-purple-600 hover:underline">点击选择文件</button>
              </div>
              {corpusFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {corpusFiles.map(f => (
                    <div key={f.name} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
                      <div>
                        <span className="font-medium text-gray-800">{f.name}</span>
                        <span className="text-gray-400 ml-2">{f.size} · {f.sentences.toLocaleString()} 句</span>
                      </div>
                      <button onClick={() => setCorpusFiles(p => p.filter(x => x.name !== f.name))} className="text-gray-400 hover:text-red-400 transition-colors">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strategy */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">微调策略</div>
              <div className="space-y-2">
                {FINETUNE_STRATEGIES.map(s => (
                  <div key={s.id} onClick={() => setStrategy(s.id)}
                    className={`flex items-start gap-2.5 p-2.5 border rounded-xl cursor-pointer transition-all ${strategy === s.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 ${strategy === s.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-800">{s.label}</span>
                        {s.recommended && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">推荐</span>}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: progress + result */}
          <div className="flex flex-col gap-4">
            {/* Progress */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`text-xs font-semibold ${STEP_COLOR[finetuneStep]}`}>{STEP_LABELS[finetuneStep]}</div>
                {finetuneStep === 'training' && <div className="text-[11px] text-gray-500">Epoch {ftEpoch}/3</div>}
                {finetuneStep !== 'idle' && <div className="text-[11px] text-gray-500">{Math.floor(ftProgress)}%</div>}
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-300 ${finetuneStep === 'done' ? 'bg-green-500' : 'bg-purple-500'}`}
                  style={{ width: `${ftProgress}%` }} />
              </div>
              <div className="space-y-1.5">
                {[
                  { key: 'preparing', label: '数据预处理', pct: 20 },
                  { key: 'training', label: '模型训练 (3 Epoch)', pct: 70 },
                  { key: 'evaluating', label: '效果评估', pct: 90 },
                  { key: 'done', label: '模型保存', pct: 100 },
                ].map(ph => {
                  const done = ftProgress >= ph.pct;
                  const active = ftProgress > ph.pct - 20 && ftProgress < ph.pct;
                  return (
                    <div key={ph.key} className="flex items-center gap-2 text-[11px]">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                        ${done ? 'bg-green-500' : active ? 'bg-purple-400 animate-pulse' : 'bg-gray-100'}`}>
                        {done && <span className="text-white text-[9px]">✓</span>}
                      </div>
                      <span className={done ? 'text-gray-700' : 'text-gray-400'}>{ph.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Done metrics */}
            {finetuneStep === 'done' && (
              <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-green-800 mb-3">微调完成 · 效果对比</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'MRR@10', before: '0.81', after: '0.91', up: true },
                    { label: '领域召回率', before: '72%', after: '87%', up: true },
                    { label: '推理速度', before: `${model.speed}`, after: `${model.speed}`, up: false },
                    { label: '模型版本', before: 'base', after: `ft-${strategy}`, up: false },
                  ].map(m => (
                    <div key={m.label} className="bg-white rounded-lg px-3 py-2 border border-green-100">
                      <div className="text-gray-500 text-[10px] mb-0.5">{m.label}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 line-through">{m.before}</span>
                        <span className="text-[10px]">→</span>
                        <span className={`font-semibold ${m.up ? 'text-green-700' : 'text-gray-700'}`}>{m.after}</span>
                        {m.up && <span className="text-green-500 text-[10px]">↑</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Vector space visualization ── */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">向量空间预览</span>
            <span className="text-xs text-gray-400">t-SNE 降维至 2D · 颜色表示语义簇</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">基座模型</span>
            <div className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${showComparison ? 'bg-purple-500' : 'bg-gray-200'}`}
              onClick={() => finetuneStep === 'done' && setShowComparison(p => !p)}
              style={{ cursor: finetuneStep === 'done' ? 'pointer' : 'not-allowed', opacity: finetuneStep === 'done' ? 1 : 0.4 }}>
              <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${showComparison ? 'translate-x-3' : ''}`} />
            </div>
            <span className="text-gray-500">微调后</span>
          </div>
        </div>
        <div className="p-4 bg-white">
          <svg viewBox="0 0 340 260" className="w-full">
            {/* Grid */}
            {[60, 120, 180, 240, 300].map(x => <line key={`vx${x}`} x1={x} y1={20} x2={x} y2={230} stroke="#f3f4f6" />)}
            {[50, 100, 150, 200].map(y => <line key={`hy${y}`} x1={20} y1={y} x2={320} y2={y} stroke="#f3f4f6" />)}
            {/* Cluster backgrounds */}
            <ellipse cx="125" cy="108" rx="42" ry="38" fill="#3b82f610" stroke="#3b82f630" strokeWidth="1" />
            <ellipse cx="220" cy="92" rx="38" ry="38" fill="#f59e0b10" stroke="#f59e0b30" strokeWidth="1" />
            <ellipse cx="130" cy="168" rx="38" ry="30" fill="#10b98110" stroke="#10b98130" strokeWidth="1" />
            {/* Terms */}
            {MOCK_TERMS.map((term, i) => {
              const [x, y] = positions[term];
              return (
                <g key={term}>
                  <circle cx={x} cy={y} r={showComparison ? 7 : 6} fill={CLUSTER_COLORS[i]} opacity={0.85} />
                  <text x={x + 10} y={y + 4} fontSize={9} fill="#374151" fontWeight="500">{term}</text>
                </g>
              );
            })}
            {/* Cluster labels */}
            <text x="78" y="38" fontSize={9} fill="#3b82f6" fontWeight="600">神经网络架构</text>
            <text x="190" y="38" fontSize={9} fill="#f59e0b" fontWeight="600">训练优化</text>
            <text x="85" y="210" fontSize={9} fill="#10b981" fontWeight="600">迁移与注意力</text>
          </svg>
          {!showComparison && finetuneStep !== 'done' && (
            <div className="text-center text-xs text-gray-400 mt-1">完成微调后可切换查看语义聚类效果对比</div>
          )}
          {showComparison && (
            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-purple-600">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              微调后语义簇更紧凑，类内距离缩小约 18%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
