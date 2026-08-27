import { useEffect, useRef, useState } from 'react';
import {
  Brain, CheckCircle, Cpu, GitBranch, Layers, Loader2, Play, Rocket, Search, Sparkles,
} from 'lucide-react';
import type { MultimodalRepresentationFocus } from '../../data/auditPageMap';

const CROSS_MODAL_MODELS = [
  {
    id: 'clip-vit-b32',
    name: 'CLIP ViT-B/32',
    family: 'OpenAI CLIP',
    dim: 512,
    modalities: ['image', 'text'],
    status: 'deployed' as const,
    benchmark: 'Recall@1 58.2% (Flickr30k)',
    desc: '经典双塔对比学习，image/text encoder + InfoNCE，适合通用图文检索与零样本分类。',
  },
  {
    id: 'clip-vit-l14',
    name: 'CLIP ViT-L/14',
    family: 'OpenAI CLIP',
    dim: 768,
    modalities: ['image', 'text'],
    status: 'deployed' as const,
    benchmark: 'Recall@1 68.7% (Flickr30k)',
    desc: '更大视觉骨干，语义区分度更高，适合高精度跨模态检索场景。',
  },
  {
    id: 'chinese-clip',
    name: 'Chinese-CLIP ViT-B/16',
    family: 'Chinese-CLIP',
    dim: 512,
    modalities: ['image', 'text'],
    status: 'deployed' as const,
    benchmark: 'Recall@1 61.4% (MUGE)',
    desc: '中文图文对比预训练，适配专利附图、医学报告等中文领域图文对。',
  },
  {
    id: 'blip2',
    name: 'BLIP-2 Q-Former',
    family: 'Salesforce BLIP',
    dim: 768,
    modalities: ['image', 'text'],
    status: 'staging' as const,
    benchmark: 'CIDEr 138.2 (COCO Caption)',
    desc: '冻结视觉编码器 + Q-Former 桥接，支持图文理解与生成式跨模态任务。',
  },
  {
    id: 'siglip',
    name: 'SigLIP ViT-SO/14',
    family: 'Google SigLIP',
    dim: 768,
    modalities: ['image', 'text'],
    status: 'staging' as const,
    benchmark: 'Recall@1 71.3% (Flickr30k)',
    desc: 'Sigmoid 损失替代 InfoNCE，大批次训练更稳定，统一语义空间映射精度更高。',
  },
];

const SAMPLE_PAIRS = [
  {
    id: 'p1',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop',
    caption: 'Transformer architecture with multi-head attention and positional encoding',
    clipScore: 0.87,
  },
  {
    id: 'p2',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&h=120&fit=crop',
    caption: 'Bar chart comparing language models on MMLU and HellaSwag benchmarks',
    clipScore: 0.82,
  },
  {
    id: 'p3',
    imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=120&h=120&fit=crop',
    caption: 'Electron microscopy image of carbon nanotube cross-section at nanometer scale',
    clipScore: 0.79,
  },
  {
    id: 'p4',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&h=120&fit=crop',
    caption: 'Climate model output showing global temperature anomaly distribution 1980–2023',
    clipScore: 0.74,
  },
];

const REGISTRY_MODELS = [
  {
    id: 'm1', name: 'SciPaper-CLIP-v2.1', base: 'CLIP ViT-B/32', version: 'v2.1.0',
    status: 'deployed' as const, dataset: 'SciPaper-CLIP-v2', recall: 'R@1 62.4%',
    trainedAt: '2026-07-18', owner: '张明',
  },
  {
    id: 'm2', name: 'MedImage-CLIP-v1.3', base: 'Chinese-CLIP ViT-B/16', version: 'v1.3.2',
    status: 'deployed' as const, dataset: 'MedImage-Caption', recall: 'R@1 58.9%',
    trainedAt: '2026-06-02', owner: '李芳',
  },
  {
    id: 'm3', name: 'PatentFig-CLIP-v1.0', base: 'CLIP ViT-L/14', version: 'v1.0.0',
    status: 'evaluating' as const, dataset: 'PatentFig-CLIP-v1', recall: 'R@1 55.1%',
    trainedAt: '2026-08-01', owner: '王浩',
  },
  {
    id: 'm4', name: 'SigLIP-Sci-v0.9', base: 'SigLIP ViT-SO/14', version: 'v0.9.0-rc',
    status: 'training' as const, dataset: 'SciPaper-CLIP-v2', recall: '—',
    trainedAt: '2026-08-20', owner: '张明',
  },
];

const TRAIN_LOGS = [
  '加载 SciPaper-CLIP-v2 训练集（128,640 图文对）',
  '初始化 CLIP ViT-B/32 · image encoder + text encoder',
  '对比损失 InfoNCE · batch=256 · lr=5e-5 · warmup=500 steps',
  'Epoch 1/20 · train_loss 2.841 · val_recall@1 0.412',
  'Epoch 5/20 · train_loss 1.623 · val_recall@1 0.538',
  'Epoch 10/20 · train_loss 0.892 · val_recall@1 0.601',
  'Epoch 15/20 · train_loss 0.534 · val_recall@1 0.618',
  'Epoch 20/20 · train_loss 0.387 · val_recall@1 0.624',
  '构建 FAISS 索引（512-d cosine）· 128,640 向量',
  '评估完成 · 注册模型 SciPaper-CLIP-v2.1 → 仓库',
];

interface MultimodalRepresentationDemoProps {
  initialFocus?: MultimodalRepresentationFocus;
  onRequestTrainingModal?: () => void;
}

export function MultimodalRepresentationDemo({
  initialFocus,
  onRequestTrainingModal,
}: MultimodalRepresentationDemoProps) {
  const [selectedModel, setSelectedModel] = useState(CROSS_MODAL_MODELS[0].id);
  const [searchQ, setSearchQ] = useState('transformer attention architecture');
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<typeof SAMPLE_PAIRS>([]);
  const [trainState, setTrainState] = useState<'idle' | 'running' | 'done'>('idle');
  const [trainLogs, setTrainLogs] = useState<string[]>([]);
  const [trainProgress, setTrainProgress] = useState(0);
  const trainRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modelsRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef<HTMLDivElement>(null);
  const mgmtRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialFocus) return;
    const target =
      initialFocus === 'models' ? modelsRef
        : initialFocus === 'semantic-space' ? spaceRef
          : mgmtRef;
    setTimeout(() => {
      target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [initialFocus]);

  useEffect(() => () => {
    if (trainRef.current) clearInterval(trainRef.current);
  }, []);

  const highlight = (section: MultimodalRepresentationFocus) =>
    initialFocus === section ? 'ring-2 ring-violet-300 rounded-xl' : '';

  const runSearch = () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    setTimeout(() => {
      const q = searchQ.toLowerCase();
      const ranked = [...SAMPLE_PAIRS]
        .map(p => ({
          ...p,
          score: p.caption.toLowerCase().includes(q.split(' ')[0]) ? p.clipScore : p.clipScore - 0.15,
        }))
        .sort((a, b) => b.score - a.score);
      setHits(ranked);
      setSearching(false);
    }, 600);
  };

  const startTraining = () => {
    if (trainRef.current) clearInterval(trainRef.current);
    setTrainState('running');
    setTrainLogs([]);
    setTrainProgress(0);
    let step = 0;
    trainRef.current = setInterval(() => {
      step += 1;
      setTrainLogs(prev => [...prev, TRAIN_LOGS[step - 1]]);
      setTrainProgress((step / TRAIN_LOGS.length) * 100);
      if (step >= TRAIN_LOGS.length) {
        clearInterval(trainRef.current!);
        setTrainState('done');
      }
    }, 550);
  };

  const sel = CROSS_MODAL_MODELS.find(m => m.id === selectedModel)!;

  return (
    <div className="space-y-6">
      {/* Section 1: Cross-modal models */}
      <div
        id="mm-repr-models"
        ref={modelsRef}
        className={`space-y-4 ${highlight('models')}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Brain size={16} className="text-violet-600" /> 跨模态表示学习模型
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              内置多种先进跨模态模型，联合学习文本、图像等模态向量，映射到统一语义空间。
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 flex-shrink-0">
            {CROSS_MODAL_MODELS.filter(m => m.status === 'deployed').length} 个已部署
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CROSS_MODAL_MODELS.map(model => (
            <button
              key={model.id}
              type="button"
              onClick={() => setSelectedModel(model.id)}
              className={`text-left border rounded-xl p-4 transition-all ${
                selectedModel === model.id
                  ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{model.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{model.family}</div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  model.status === 'deployed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {model.status === 'deployed' ? '已部署' : '预发布'}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">{model.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {model.modalities.map(m => (
                  <span key={m} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md">{m}</span>
                ))}
                <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-md">{model.dim}-d</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-2 tabular-nums">{model.benchmark}</div>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-600">
          当前选中：<span className="font-semibold text-gray-800">{sel.name}</span>
          {' · '}输出维度 {sel.dim}
          {' · '}模态 {sel.modalities.join(' + ')}
          {' · '}与图嵌入流水线对接后可作为多模态实体/关系向量编码器。
        </div>
      </div>

      {/* Section 2: Unified semantic space */}
      <div
        id="mm-repr-semantic-space"
        ref={spaceRef}
        className={`space-y-4 ${highlight('semantic-space')}`}
      >
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Layers size={16} className="text-violet-600" /> 统一语义空间映射
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            不同模态向量映射到同一高维空间，语义相近的内容距离也相近，支持以文搜图 / 以图搜文。
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: '文本编码器', sub: 'Text Encoder', color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { label: '统一语义空间', sub: `${sel.dim}-d · cosine`, color: 'bg-violet-50 text-violet-700 border-violet-200 ring-2 ring-violet-100' },
              { label: '图像编码器', sub: 'Image Encoder', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            ].map((block, i) => (
              <div key={block.label} className="flex items-center gap-2">
                <div className={`flex-1 border rounded-xl px-3 py-4 ${block.color}`}>
                  <div className="text-xs font-semibold">{block.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{block.sub}</div>
                </div>
                {i < 2 && <span className="text-gray-300 text-lg">↔</span>}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <Search size={12} /> 跨模态检索验证（基于 {sel.name}）
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
                placeholder="输入文本查询，检索语义相近图像…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSearch()}
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={searching}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm rounded-lg flex items-center gap-1.5"
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                检索
              </button>
            </div>

            {(hits.length > 0 || searching) && (
              <div className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                {searching ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> 在统一语义空间中检索…
                  </div>
                ) : hits.map((hit, i) => (
                  <div key={hit.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                    <span className="text-xs text-gray-400 w-4 tabular-nums">{i + 1}</span>
                    <img src={hit.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 line-clamp-2">{hit.caption}</p>
                    </div>
                    <span className="text-xs font-mono text-violet-600 tabular-nums">{hit.clipScore.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Model management & training */}
      <div
        id="mm-repr-model-mgmt"
        ref={mgmtRef}
        className={`space-y-4 ${highlight('model-mgmt')}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Cpu size={16} className="text-violet-600" /> 表示模型管理与训练
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              中央模型仓库：管理、训练、评估和版本化所有跨模态表示学习模型。
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={startTraining}
              disabled={trainState === 'running'}
              className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1"
            >
              {trainState === 'running' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
              发起训练
            </button>
            {onRequestTrainingModal && (
              <button
                type="button"
                onClick={onRequestTrainingModal}
                className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1"
              >
                <Rocket size={12} /> 高级配置
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <GitBranch size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">模型仓库</span>
            <span className="text-xs text-gray-400 ml-auto">{REGISTRY_MODELS.length} 个版本</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left px-5 py-2 font-medium">模型名称</th>
                  <th className="text-left px-3 py-2 font-medium">基座</th>
                  <th className="text-left px-3 py-2 font-medium">版本</th>
                  <th className="text-left px-3 py-2 font-medium">训练集</th>
                  <th className="text-left px-3 py-2 font-medium">Recall@1</th>
                  <th className="text-left px-3 py-2 font-medium">状态</th>
                  <th className="text-left px-3 py-2 font-medium">负责人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {REGISTRY_MODELS.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-2.5 font-medium text-gray-800">{m.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{m.base}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-500">{m.version}</td>
                    <td className="px-3 py-2.5 text-gray-600">{m.dataset}</td>
                    <td className="px-3 py-2.5 tabular-nums text-violet-600">{m.recall}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        m.status === 'deployed' ? 'bg-green-50 text-green-700'
                          : m.status === 'evaluating' ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {m.status === 'deployed' ? '已部署' : m.status === 'evaluating' ? '评估中' : '训练中'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">{m.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(trainState !== 'idle') && (
          <div className="bg-gray-900 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">训练日志 · SciPaper-CLIP-v2.1</span>
              {trainState === 'done' && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle size={12} /> 训练完成
                </span>
              )}
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${trainProgress}%` }}
              />
            </div>
            <div className="font-mono text-[11px] text-green-400 space-y-0.5 max-h-36 overflow-y-auto">
              {trainLogs.map((log, i) => (
                <div key={i} className="opacity-90">{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
