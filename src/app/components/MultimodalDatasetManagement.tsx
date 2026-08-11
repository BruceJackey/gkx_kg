import { useState, useRef } from 'react';
import {
  Plus, GitBranch, GitCommit, Tag, Upload, Image, FileText, Search, Filter,
  MoreVertical, ChevronRight, CheckCircle, Clock, AlertCircle, RefreshCw,
  Trash2, Download, Eye, Layers, Zap, Database, Settings, X, Check,
  ArrowRight, BarChart3, Cpu, Link2, Archive, Shuffle, AlignCenter,
  FolderOpen, Star, Copy, Play, Pause, ChevronDown, Package, Sparkles, Wand2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Modality = 'image' | 'text' | 'audio' | 'video';
type DatasetTab = 'overview' | 'version' | 'preprocess' | 'storage';
type UploadMode = 'pairs' | 'label';

interface ImageTextPair {
  id: string;
  imageUrl: string;
  caption: string;
  tags: string[];
  source: string;
  addedAt: string;
}

interface CommitRecord {
  hash: string;
  message: string;
  author: string;
  date: string;
  added: number;
  removed: number;
  tag?: string;
}

interface PreprocessJob {
  id: string;
  name: string;
  type: 'clean' | 'convert' | 'align' | 'augment';
  status: 'idle' | 'running' | 'done' | 'failed';
  progress: number;
  config: string;
}

interface IndexConfig {
  type: 'faiss' | 'milvus' | 'elasticsearch';
  dim: number;
  metric: 'cosine' | 'l2' | 'ip';
  built: boolean;
  vectorCount: number;
  buildAt: string;
}

interface MultimodalDataset {
  id: string;
  name: string;
  description: string;
  modalities: Modality[];
  pairCount: number;
  size: string;
  version: string;
  branch: string;
  updatedAt: string;
  status: 'active' | 'archived';
  pairs: ImageTextPair[];
  commits: CommitRecord[];
  preprocessJobs: PreprocessJob[];
  indexConfig: IndexConfig | null;
  starred: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=120&h=120&fit=crop',
];

const MOCK_DATASETS: MultimodalDataset[] = [
  {
    id: 'ds1',
    name: 'SciPaper-CLIP-v2',
    description: '科技论文图文对数据集，用于科学图表-摘要对比学习，支持CLIP类模型训练',
    modalities: ['image', 'text'],
    pairCount: 128640,
    size: '42.3 GB',
    version: 'v2.1.0',
    branch: 'main',
    updatedAt: '2024-03-15 14:22',
    status: 'active',
    starred: true,
    pairs: [
      { id: 'p1', imageUrl: PLACEHOLDER_IMAGES[0], caption: 'Figure 1: Transformer architecture showing multi-head attention mechanism with positional encoding', tags: ['architecture', 'attention'], source: 'arXiv:2310.00001', addedAt: '2024-03-14' },
      { id: 'p2', imageUrl: PLACEHOLDER_IMAGES[1], caption: 'Performance comparison of language models on benchmark datasets including MMLU and HellaSwag', tags: ['benchmark', 'evaluation'], source: 'arXiv:2310.00002', addedAt: '2024-03-14' },
      { id: 'p3', imageUrl: PLACEHOLDER_IMAGES[2], caption: 'Protein structure visualization showing alpha helices and beta sheets in 3D space', tags: ['protein', 'structure'], source: 'PubMed:38000001', addedAt: '2024-03-13' },
      { id: 'p4', imageUrl: PLACEHOLDER_IMAGES[3], caption: 'Neural network training loss curves across different learning rate schedules', tags: ['training', 'loss'], source: 'arXiv:2310.00003', addedAt: '2024-03-13' },
      { id: 'p5', imageUrl: PLACEHOLDER_IMAGES[4], caption: 'Electron microscopy image of carbon nanotube cross-section at nanometer scale', tags: ['microscopy', 'material'], source: 'Nature:2024.001', addedAt: '2024-03-12' },
      { id: 'p6', imageUrl: PLACEHOLDER_IMAGES[5], caption: 'Climate model output showing global temperature anomaly distribution from 1980 to 2023', tags: ['climate', 'visualization'], source: 'IPCC:2024', addedAt: '2024-03-12' },
    ],
    commits: [
      { hash: 'a3f9c2d', message: 'Add 12k new image-text pairs from arXiv 2024 Q1', author: 'Zhang Wei', date: '2024-03-15 14:22', added: 12048, removed: 0, tag: 'v2.1.0' },
      { hash: 'b81e4f1', message: 'Remove duplicate pairs via perceptual hashing', author: 'Li Fang', date: '2024-03-10 09:15', added: 0, removed: 3214 },
      { hash: 'c524a7e', message: 'Normalize captions: lowercase + punctuation strip', author: 'Zhang Wei', date: '2024-03-05 16:30', added: 0, removed: 0 },
      { hash: 'd9b3f6c', message: 'Initial dataset with NeurIPS 2023 figures', author: 'Wang Hao', date: '2024-02-20 11:00', added: 89820, removed: 0, tag: 'v2.0.0' },
      { hash: 'e1a2b3c', message: 'Add ICML 2023 supplementary material figures', author: 'Zhang Wei', date: '2024-02-15 14:00', added: 26772, removed: 0 },
    ],
    preprocessJobs: [
      { id: 'j1', name: '图像尺寸标准化', type: 'convert', status: 'done', progress: 100, config: '224×224 / 336×336，保持长宽比 + padding' },
      { id: 'j2', name: '文本清洗', type: 'clean', status: 'done', progress: 100, config: '去除 LaTeX 公式、截断 > 77 tokens' },
      { id: 'j3', name: '跨模态对齐校验', type: 'align', status: 'running', progress: 63, config: 'CLIP ViT-B/32 相似度阈值 > 0.25' },
      { id: 'j4', name: '数据增强', type: 'augment', status: 'idle', progress: 0, config: '随机裁剪、颜色抖动、水平翻转' },
    ],
    indexConfig: {
      type: 'faiss', dim: 512, metric: 'cosine', built: true,
      vectorCount: 128640, buildAt: '2024-03-15 15:00',
    },
  },
  {
    id: 'ds2',
    name: 'MedImage-Caption',
    description: '医学影像图文对数据集，包含X光、CT、MRI图像及对应医学描述文本',
    modalities: ['image', 'text'],
    pairCount: 45230,
    size: '18.7 GB',
    version: 'v1.3.2',
    branch: 'main',
    updatedAt: '2024-03-12 09:30',
    status: 'active',
    starred: false,
    pairs: [
      { id: 'mp1', imageUrl: PLACEHOLDER_IMAGES[2], caption: 'Chest X-ray showing bilateral pulmonary infiltrates consistent with COVID-19 pneumonia', tags: ['xray', 'covid'], source: 'CheXpert:001', addedAt: '2024-03-11' },
      { id: 'mp2', imageUrl: PLACEHOLDER_IMAGES[4], caption: 'Brain MRI axial view demonstrating right temporal lobe lesion with surrounding edema', tags: ['mri', 'brain'], source: 'MIMIC:002', addedAt: '2024-03-10' },
    ],
    commits: [
      { hash: 'f2d8e1a', message: 'Integrate MIMIC-CXR batch 7 reports', author: 'Chen Jing', date: '2024-03-12 09:30', added: 8200, removed: 0, tag: 'v1.3.2' },
      { hash: 'g9c5b4d', message: 'Fix label encoding for rare pathology classes', author: 'Liu Yang', date: '2024-03-01 14:20', added: 0, removed: 0 },
    ],
    preprocessJobs: [
      { id: 'mj1', name: 'DICOM → PNG 转换', type: 'convert', status: 'done', progress: 100, config: 'Windowing: WL=40 WW=400，16bit→8bit' },
      { id: 'mj2', name: '报告文本去标识化', type: 'clean', status: 'done', progress: 100, config: '去除患者姓名、日期、医院信息' },
    ],
    indexConfig: null,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModalityBadge({ m }: { m: Modality }) {
  const cfg: Record<Modality, { label: string; cls: string }> = {
    image: { label: '图像', cls: 'bg-violet-50 text-violet-700' },
    text: { label: '文本', cls: 'bg-blue-50 text-blue-700' },
    audio: { label: '音频', cls: 'bg-amber-50 text-amber-700' },
    video: { label: '视频', cls: 'bg-red-50 text-red-700' },
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg[m].cls}`}>{cfg[m].label}</span>;
}

function StatusBadge({ status }: { status: 'active' | 'archived' }) {
  return status === 'active'
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">运行中</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">已归档</span>;
}

function JobTypeBadge({ type }: { type: PreprocessJob['type'] }) {
  const cfg = {
    clean: { label: '数据清洗', cls: 'bg-blue-50 text-blue-600' },
    convert: { label: '格式转换', cls: 'bg-amber-50 text-amber-700' },
    align: { label: '跨模态对齐', cls: 'bg-purple-50 text-purple-700' },
    augment: { label: '数据增强', cls: 'bg-emerald-50 text-emerald-700' },
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cfg[type].cls}`}>{cfg[type].label}</span>;
}

function JobStatusIcon({ status, progress }: { status: PreprocessJob['status']; progress: number }) {
  if (status === 'done') return <CheckCircle size={14} className="text-green-500" />;
  if (status === 'failed') return <AlertCircle size={14} className="text-red-400" />;
  if (status === 'running') return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-xs text-gray-500">{progress}%</span>
    </div>
  );
  return <Clock size={14} className="text-gray-300" />;
}

// ─── Auto-caption mock data ───────────────────────────────────────────────────

const MOCK_CAPTIONS: Record<string, { caption: string; tags: string; confidence: number }> = {
  'li1': {
    caption: 'A scientific diagram illustrating a multi-layer neural network architecture with feedforward connections, showing input nodes, hidden layers, and output classification nodes with activation functions.',
    tags: 'neural-network, architecture, deep-learning',
    confidence: 94,
  },
  'li2': {
    caption: 'A bar chart comparing model performance metrics across five benchmark datasets, showing accuracy scores ranging from 72% to 96% with error bars indicating standard deviation across three evaluation runs.',
    tags: 'chart, benchmark, evaluation, performance',
    confidence: 91,
  },
  'li3': {
    caption: 'A technical diagram depicting the data flow pipeline from raw sensor input through preprocessing modules, feature extraction layers, and final classification output with confidence scores.',
    tags: 'pipeline, data-flow, diagram, sensor',
    confidence: 88,
  },
};

const VL_MODELS = [
  { id: 'internvl2', label: 'InternVL2-8B', desc: '中英双语，科技图表效果好' },
  { id: 'llava-next', label: 'LLaVA-NeXT-34B', desc: '通用场景，细节描述丰富' },
  { id: 'blip2', label: 'BLIP-2 OPT-6.7B', desc: '轻量快速，适合批量处理' },
  { id: 'qwenvl', label: 'Qwen-VL-Plus', desc: '阿里出品，中文友好' },
];

// ─── Upload Dialog ────────────────────────────────────────────────────────────

type GenState = 'idle' | 'generating' | 'done';

interface LabeledImage {
  id: string;
  name: string;
  caption: string;
  tags: string;
  genState: GenState;
  confidence: number | null;
  aiGenerated: boolean;
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('pairs');
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedModel, setSelectedModel] = useState('internvl2');
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [labeledImages, setLabeledImages] = useState<LabeledImage[]>([
    { id: 'li1', name: 'figure_001.png', caption: '', tags: '', genState: 'idle', confidence: null, aiGenerated: false },
    { id: 'li2', name: 'chart_002.jpg', caption: '', tags: '', genState: 'idle', confidence: null, aiGenerated: false },
    { id: 'li3', name: 'diagram_003.png', caption: '', tags: '', genState: 'idle', confidence: null, aiGenerated: false },
  ]);

  const updateImage = (id: string, patch: Partial<LabeledImage>) =>
    setLabeledImages(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));

  const generateCaption = (id: string) => {
    updateImage(id, { genState: 'generating', caption: '', tags: '', confidence: null });
    const mock = MOCK_CAPTIONS[id];
    // Simulate streaming: reveal text character by character
    let i = 0;
    const text = mock?.caption ?? 'A detailed scientific image showing complex visual information with multiple elements and structural relationships between components.';
    const tags = mock?.tags ?? 'science, diagram';
    const interval = setInterval(() => {
      i += Math.floor(Math.random() * 6) + 3;
      if (i >= text.length) {
        clearInterval(interval);
        updateImage(id, {
          caption: text,
          tags,
          genState: 'done',
          confidence: mock?.confidence ?? 85,
          aiGenerated: true,
        });
      } else {
        updateImage(id, { caption: text.slice(0, i), genState: 'generating' });
      }
    }, 40);
  };

  const generateAll = () => {
    const pending = labeledImages.filter(img => !img.caption.trim());
    if (!pending.length) return;
    setBatchGenerating(true);
    pending.forEach((img, i) => {
      setTimeout(() => {
        generateCaption(img.id);
        if (i === pending.length - 1) {
          // Wait a bit for last one to finish
          setTimeout(() => setBatchGenerating(false), 2500);
        }
      }, i * 600);
    });
  };

  const completedCount = labeledImages.filter(img => img.caption.trim()).length;
  const aiCount = labeledImages.filter(img => img.aiGenerated).length;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[720px] max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="font-semibold text-gray-800">上传数据到数据集</div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        {/* Mode tabs */}
        <div className="px-6 pt-4 pb-0">
          <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden w-fit">
            <button onClick={() => { setUploadMode('pairs'); setStep(1); }}
              className={`text-sm px-5 py-2 transition-colors flex items-center gap-1.5 ${uploadMode === 'pairs' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Link2 size={13} /> 上传图文对
            </button>
            <button onClick={() => { setUploadMode('label'); setStep(1); }}
              className={`text-sm px-5 py-2 transition-colors flex items-center gap-1.5 ${uploadMode === 'label' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Tag size={13} /> 上传图片并打标
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {uploadMode === 'pairs' ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">支持上传 JSON/JSONL/CSV 格式的图文对文件，或压缩包（包含图片文件夹 + 标注文件）</div>
              <div className="border-2 border-dashed border-violet-200 rounded-xl p-10 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors cursor-pointer group">
                <Upload size={32} className="mx-auto mb-3 text-violet-300 group-hover:text-violet-400" />
                <div className="text-sm font-medium text-gray-700 mb-1">拖拽文件到此处，或点击上传</div>
                <div className="text-xs text-gray-400">支持 .json .jsonl .csv .zip .tar.gz，单次最大 10 GB</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2">
                <div className="font-medium text-gray-700 mb-2">格式说明</div>
                <div className="font-mono bg-white border border-gray-200 rounded-lg p-3 text-gray-600 leading-relaxed">
                  {'{"image": "path/to/img.jpg", "caption": "描述文本", "tags": ["tag1"]}'}<br />
                  {'{"image_url": "https://...", "text": "caption text"}'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">图像字段名</div>
                  <input defaultValue="image" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">文本字段名</div>
                  <input defaultValue="caption" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="text-sm text-gray-500">第一步：上传图片文件</div>
                  <div className="border-2 border-dashed border-violet-200 rounded-xl p-10 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors cursor-pointer group">
                    <Image size={32} className="mx-auto mb-3 text-violet-300 group-hover:text-violet-400" />
                    <div className="text-sm font-medium text-gray-700 mb-1">上传图片文件</div>
                    <div className="text-xs text-gray-400">支持 JPG、PNG、WEBP、TIFF，可批量选择</div>
                  </div>
                  <div className="space-y-1.5">
                    {labeledImages.map(img => (
                      <div key={img.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="w-8 h-8 bg-violet-100 rounded flex items-center justify-center flex-shrink-0">
                          <Image size={14} className="text-violet-500" />
                        </div>
                        <div className="text-sm text-gray-700 flex-1">{img.name}</div>
                        <CheckCircle size={14} className="text-green-400" />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    下一步：为图片打标 <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  {/* Step 2 header */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStep(1)} className="text-xs text-violet-600 hover:underline flex-shrink-0">← 返回</button>
                    <span className="text-sm text-gray-500 flex-1">第二步：为每张图片填写描述（可 AI 自动生成）</span>
                    <span className="text-xs text-gray-400">{completedCount}/{labeledImages.length} 已填写</span>
                  </div>

                  {/* AI model selector + batch generate */}
                  <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={15} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-violet-800 mb-1">AI 自动描述生成</div>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedModel}
                          onChange={e => setSelectedModel(e.target.value)}
                          className="border border-violet-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-violet-400 text-gray-700"
                        >
                          {VL_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.label} — {m.desc}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={generateAll}
                      disabled={batchGenerating || labeledImages.every(img => img.caption.trim())}
                      className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      {batchGenerating
                        ? <><RefreshCw size={13} className="animate-spin" /> 批量生成中…</>
                        : <><Wand2 size={13} /> 一键全部生成</>}
                    </button>
                  </div>

                  {/* Per-image cards */}
                  <div className="space-y-3">
                    {labeledImages.map(img => (
                      <div key={img.id}
                        className={`border rounded-xl p-4 transition-colors ${img.genState === 'generating' ? 'border-violet-300 bg-violet-50/30' : img.genState === 'done' ? 'border-emerald-200' : 'border-gray-200'}`}>
                        <div className="flex gap-3">
                          {/* Thumbnail placeholder */}
                          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                            <Image size={26} className="text-violet-300" />
                            {img.genState === 'generating' && (
                              <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center">
                                <RefreshCw size={16} className="animate-spin text-violet-500" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Filename + status row */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700 flex-1 truncate">{img.name}</span>
                              {img.genState === 'generating' && (
                                <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full flex items-center gap-1 flex-shrink-0">
                                  <RefreshCw size={10} className="animate-spin" /> AI生成中
                                </span>
                              )}
                              {img.genState === 'done' && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1 flex-shrink-0">
                                  <Sparkles size={10} /> AI生成
                                  {img.confidence !== null && <span className="text-emerald-500 font-medium">{img.confidence}%</span>}
                                </span>
                              )}
                            </div>

                            {/* Caption textarea */}
                            <div className="relative">
                              <textarea
                                rows={img.caption.length > 80 ? 3 : 2}
                                placeholder="输入图片描述（caption）…"
                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none resize-none transition-colors ${img.genState === 'generating' ? 'border-violet-200 bg-violet-50/20 text-violet-800' : img.aiGenerated ? 'border-emerald-200 focus:border-emerald-400' : 'border-gray-200 focus:border-violet-400'}`}
                                value={img.caption}
                                onChange={e => updateImage(img.id, { caption: e.target.value, aiGenerated: false, genState: 'idle', confidence: null })}
                              />
                              {img.genState === 'generating' && (
                                <span className="absolute bottom-2 right-2 inline-block w-1 h-4 bg-violet-500 animate-pulse rounded-sm" />
                              )}
                            </div>

                            {/* Tags input + per-image generate button */}
                            <div className="flex gap-2">
                              <input
                                placeholder="标签，用逗号分隔（可选）"
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-violet-400"
                                value={img.tags}
                                onChange={e => updateImage(img.id, { tags: e.target.value })}
                              />
                              <button
                                onClick={() => generateCaption(img.id)}
                                disabled={img.genState === 'generating'}
                                title="AI自动生成此图描述"
                                className="flex-shrink-0 text-xs px-3 py-1.5 border border-violet-300 bg-white hover:bg-violet-50 disabled:opacity-50 text-violet-700 rounded-lg transition-colors flex items-center gap-1"
                              >
                                {img.genState === 'generating'
                                  ? <RefreshCw size={11} className="animate-spin" />
                                  : <Sparkles size={11} />}
                                {img.genState === 'generating' ? '生成中' : img.aiGenerated ? '重新生成' : 'AI生成描述'}
                              </button>
                            </div>

                            {/* Confidence bar for AI-generated */}
                            {img.aiGenerated && img.confidence !== null && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">置信度</span>
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${img.confidence >= 90 ? 'bg-emerald-400' : img.confidence >= 75 ? 'bg-amber-400' : 'bg-red-400'}`}
                                    style={{ width: `${img.confidence}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${img.confidence >= 90 ? 'text-emerald-600' : img.confidence >= 75 ? 'text-amber-600' : 'text-red-500'}`}>
                                  {img.confidence}%
                                </span>
                                <span className="text-xs text-gray-300">|</span>
                                <button
                                  onClick={() => updateImage(img.id, { caption: '', tags: '', aiGenerated: false, genState: 'idle', confidence: null })}
                                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  清除
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  {aiCount > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700">
                      <Sparkles size={13} className="text-emerald-500" />
                      已由 AI 自动生成 <strong>{aiCount}</strong> 条描述，你可以在提交前手动修改任意内容
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
          <button onClick={onClose}
            className="text-sm px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
            <Upload size={13} /> 确认上传
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Dataset Dialog ───────────────────────────────────────────────────────

function NewDatasetDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedModalities, setSelectedModalities] = useState<Modality[]>(['image', 'text']);
  const allModalities: Modality[] = ['image', 'text', 'audio', 'video'];
  const toggleModality = (m: Modality) => setSelectedModalities(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="font-semibold text-gray-800">新建多模态数据集</div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1.5">数据集名称 <span className="text-red-400">*</span></div>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400"
              placeholder="例如：MyCLIP-Dataset-v1" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1.5">数据集描述</div>
            <textarea rows={3} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400 resize-none"
              placeholder="描述数据集的用途、来源和特点…" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">模态类型</div>
            <div className="flex gap-2 flex-wrap">
              {allModalities.map(m => (
                <button key={m} onClick={() => toggleModality(m)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${selectedModalities.includes(m) ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {selectedModalities.includes(m) && <Check size={12} />}
                  <ModalityBadge m={m} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1.5">版本初始化</div>
            <div className="flex gap-2">
              <div className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">v1.0.0（自动）</div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
                <option>main</option>
                <option>dev</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg">取消</button>
          <button onClick={() => { if (name.trim()) { onCreate(name, desc); onClose(); } }}
            className="text-sm px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            disabled={!name.trim()}>
            <Plus size={13} /> 创建数据集
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function OverviewPanel({ ds, onUpload }: { ds: MultimodalDataset; onUpload: () => void }) {
  const [searchQ, setSearchQ] = useState('');
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [pairs, setPairs] = useState(ds.pairs);
  const filtered = pairs.filter(p => p.caption.toLowerCase().includes(searchQ.toLowerCase()) || p.tags.some(t => t.includes(searchQ)));

  const autoCaption = (pairId: string) => {
    setGeneratingIds(prev => new Set([...prev, pairId]));
    const mockCaptions = [
      'A detailed scientific visualization showing transformer attention patterns across multiple heads, with color-coded attention weights and positional encoding representations.',
      'Performance comparison chart displaying F1-score and precision-recall curves for five different model configurations across three experimental conditions.',
      'High-resolution electron microscopy image revealing crystalline lattice structure at atomic resolution, showing periodic arrangement of atoms with approximately 2.3 Å spacing.',
      'Schematic diagram of a convolutional neural network pipeline with batch normalization layers, residual connections, and global average pooling for classification tasks.',
    ];
    const randomCaption = mockCaptions[Math.floor(Math.random() * mockCaptions.length)];
    setTimeout(() => {
      setPairs(prev => prev.map(p => p.id === pairId ? { ...p, caption: randomCaption } : p));
      setGeneratingIds(prev => { const s = new Set(prev); s.delete(pairId); return s; });
    }, 1600 + Math.random() * 800);
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '图文对总数', value: ds.pairCount.toLocaleString(), icon: Link2, color: 'text-violet-600 bg-violet-50' },
          { label: '数据集大小', value: ds.size, icon: Archive, color: 'text-blue-600 bg-blue-50' },
          { label: '当前版本', value: ds.version, icon: Tag, color: 'text-emerald-600 bg-emerald-50' },
          { label: '最近更新', value: ds.updatedAt.split(' ')[0], icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sample pairs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-800 flex-1">图文对样本</div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-violet-400 w-52"
              placeholder="搜索描述或标签…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <button onClick={onUpload}
            className="text-sm px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
            <Upload size={13} /> 上传数据
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map(pair => {
            const isGenerating = generatingIds.has(pair.id);
            return (
              <div key={pair.id} className={`flex gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors ${isGenerating ? 'bg-violet-50/20' : ''}`}>
                <img src={pair.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                <div className="flex-1 min-w-0">
                  {isGenerating ? (
                    <div className="flex items-center gap-2 text-sm text-violet-600 mb-1.5">
                      <RefreshCw size={12} className="animate-spin" />
                      <span className="text-xs">AI 正在生成描述…</span>
                      <span className="inline-block w-1 h-3.5 bg-violet-400 animate-pulse rounded-sm" />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-snug line-clamp-2 mb-1.5">{pair.caption}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {pair.tags.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-md">{t}</span>
                    ))}
                    <span className="text-xs text-gray-400 ml-auto">{pair.source}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end justify-between gap-1">
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400"><Eye size={13} /></button>
                  <button
                    onClick={() => autoCaption(pair.id)}
                    disabled={isGenerating}
                    title="AI自动生成描述"
                    className="flex items-center gap-1 text-xs px-2 py-1 border border-violet-200 text-violet-600 hover:bg-violet-50 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    {isGenerating ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    {isGenerating ? '生成中' : 'AI描述'}
                  </button>
                  <span className="text-xs text-gray-400">{pair.addedAt}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          显示 {filtered.length} / {ds.pairCount.toLocaleString()} 条图文对
        </div>
      </div>
    </div>
  );
}

function VersionPanel({ ds }: { ds: MultimodalDataset }) {
  const [activeCommit, setActiveCommit] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Branch info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2"><GitBranch size={15} className="text-gray-500" /> 分支管理</div>
          <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1"><Plus size={12} /> 新建分支</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['main', 'dev', 'experiment/clip-finetune'].map(b => (
            <div key={b} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${b === ds.branch ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-600'}`}>
              <GitBranch size={13} className={b === ds.branch ? 'text-violet-500' : 'text-gray-400'} />
              {b}
              {b === ds.branch && <span className="text-xs px-1.5 py-0.5 bg-violet-200 text-violet-700 rounded-md">当前</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Commit history */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2"><GitCommit size={15} className="text-gray-500" /> 提交历史</div>
          <button className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1"><GitCommit size={12} /> 新建提交</button>
        </div>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[3.2rem] top-0 bottom-0 w-px bg-gray-100" />
          <div className="divide-y divide-gray-50">
            {ds.commits.map(c => (
              <div key={c.hash}
                onClick={() => setActiveCommit(activeCommit === c.hash ? null : c.hash)}
                className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${activeCommit === c.hash ? 'bg-violet-50/40' : ''}`}>
                {/* Hash bubble */}
                <div className="flex-shrink-0 w-14 text-right relative z-10">
                  <span className="font-mono text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-600">{c.hash.slice(0, 7)}</span>
                </div>
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-4 flex items-start justify-center pt-1.5 relative z-10">
                  <div className={`w-3 h-3 rounded-full border-2 ${c.tag ? 'border-violet-500 bg-violet-100' : 'border-gray-300 bg-white'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-gray-800 font-medium">{c.message}</span>
                    {c.tag && <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full flex items-center gap-1"><Tag size={10} />{c.tag}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{c.author}</span>
                    <span>{c.date}</span>
                    {c.added > 0 && <span className="text-green-600">+{c.added.toLocaleString()}</span>}
                    {c.removed > 0 && <span className="text-red-500">-{c.removed.toLocaleString()}</span>}
                  </div>
                  {activeCommit === c.hash && (
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"><Eye size={11} /> 查看差异</button>
                      <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"><Download size={11} /> 下载该版本</button>
                      <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1"><Copy size={11} /> 复制哈希</button>
                      {c.tag && <button className="text-xs px-3 py-1.5 border border-violet-200 rounded-lg text-violet-600 hover:bg-violet-50 flex items-center gap-1"><Package size={11} /> 基于此版本创建数据集</button>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreprocessPanel({ ds }: { ds: MultimodalDataset }) {
  const [jobs, setJobs] = useState(ds.preprocessJobs);

  const runJob = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'running' as const, progress: 0 } : j));
    const interval = setInterval(() => {
      setJobs(prev => {
        const job = prev.find(j => j.id === id);
        if (!job || job.progress >= 100) { clearInterval(interval); return prev; }
        const np = Math.min(job.progress + Math.floor(Math.random() * 15) + 5, 100);
        return prev.map(j => j.id === id ? { ...j, progress: np, status: np >= 100 ? 'done' as const : 'running' as const } : j);
      });
    }, 400);
  };

  const toolTemplates = [
    { name: '图像去噪', icon: Zap, desc: '使用中值滤波或深度去噪模型清除图像噪声', type: 'clean' as const },
    { name: '分辨率统一', icon: Settings, desc: '将所有图像统一缩放至指定分辨率', type: 'convert' as const },
    { name: 'CLIP相似度过滤', icon: Link2, desc: '使用CLIP计算图文相似度，过滤低质量对', type: 'align' as const },
    { name: '随机数据增强', icon: Shuffle, desc: '翻转、旋转、颜色抖动等增强操作', type: 'augment' as const },
    { name: '文本Token截断', icon: AlignCenter, desc: '将文本截断至模型最大输入长度', type: 'clean' as const },
    { name: '跨模态对齐检测', icon: Cpu, desc: '检测图像与文本语义不匹配的数据对', type: 'align' as const },
  ];

  return (
    <div className="space-y-4">
      {/* Active jobs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">预处理任务</div>
          <span className="text-xs text-gray-400">{jobs.filter(j => j.status === 'done').length}/{jobs.length} 已完成</span>
        </div>
        <div className="divide-y divide-gray-50">
          {jobs.map(job => (
            <div key={job.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <JobTypeBadge type={job.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 mb-0.5">{job.name}</div>
                <div className="text-xs text-gray-400 truncate">{job.config}</div>
              </div>
              <div className="flex items-center gap-3">
                <JobStatusIcon status={job.status} progress={job.progress} />
                {job.status === 'idle' && (
                  <button onClick={() => runJob(job.id)}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1">
                    <Play size={11} /> 运行
                  </button>
                )}
                {job.status === 'running' && (
                  <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg flex items-center gap-1">
                    <Pause size={11} /> 暂停
                  </button>
                )}
                {job.status === 'done' && (
                  <button className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg flex items-center gap-1">
                    <RefreshCw size={11} /> 重跑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool templates */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-800 mb-4">预处理工具库</div>
        <div className="grid grid-cols-3 gap-3">
          {toolTemplates.map(t => (
            <div key={t.name} className="border border-gray-200 rounded-xl p-4 hover:border-violet-300 hover:bg-violet-50/30 cursor-pointer transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                  <t.icon size={15} className="text-gray-500 group-hover:text-violet-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-800 mb-0.5">{t.name}</div>
                  <div className="text-xs text-gray-400 leading-relaxed">{t.desc}</div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                <JobTypeBadge type={t.type} />
                <button className="text-xs text-violet-600 hover:underline flex items-center gap-0.5">
                  添加任务 <ChevronRight size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoragePanel({ ds }: { ds: MultimodalDataset }) {
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [indexCfg, setIndexCfg] = useState(ds.indexConfig);

  const buildIndex = () => {
    setBuildingIndex(true);
    setTimeout(() => {
      setBuildingIndex(false);
      setIndexCfg({
        type: 'faiss', dim: 512, metric: 'cosine', built: true,
        vectorCount: ds.pairCount,
        buildAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      });
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Storage stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '原始图像存储', value: '38.1 GB', sub: 'MinIO / kg-bucket', icon: Database, cls: 'text-blue-600 bg-blue-50' },
          { label: '向量索引存储', value: '1.24 GB', sub: 'FAISS IndexFlatIP', icon: Layers, cls: 'text-violet-600 bg-violet-50' },
          { label: '元数据存储', value: '280 MB', sub: 'PostgreSQL 16', icon: FileText, cls: 'text-emerald-600 bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.cls}`}><s.icon size={16} /></div>
            <div>
              <div className="text-base font-semibold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className="text-xs text-gray-300 mt-0.5">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Storage config */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-800 mb-4">存储方案配置</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-600 mb-2">图像存储</div>
            <div>
              <div className="text-xs text-gray-400 mb-1">存储后端</div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
                <option>MinIO（本地）</option>
                <option>阿里云 OSS</option>
                <option>腾讯云 COS</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">图像格式</div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
                <option>原始格式保留</option>
                <option>统一转 WebP</option>
                <option>统一转 PNG</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-600 mb-2">元数据存储</div>
            <div>
              <div className="text-xs text-gray-400 mb-1">数据库</div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
                <option>PostgreSQL</option>
                <option>MySQL</option>
                <option>MongoDB</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">分片策略</div>
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
                <option>按来源分片</option>
                <option>按日期分片</option>
                <option>按哈希分片</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">保存存储配置</button>
        </div>
      </div>

      {/* Vector index */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Zap size={15} className="text-amber-500" /> 多模态检索索引
          </div>
          {indexCfg?.built && <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full flex items-center gap-1"><CheckCircle size={11} /> 索引已构建</span>}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">向量库类型</div>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
              <option value="faiss">FAISS（本地高速）</option>
              <option value="milvus">Milvus（分布式）</option>
              <option value="elasticsearch">Elasticsearch（混合检索）</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">相似度度量</div>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
              <option value="cosine">余弦相似度（Cosine）</option>
              <option value="l2">欧氏距离（L2）</option>
              <option value="ip">内积（Inner Product）</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">向量维度</div>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
              <option>512（CLIP ViT-B/32）</option>
              <option>768（CLIP ViT-L/14）</option>
              <option>1024（自定义）</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">编码器模型</div>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-full focus:outline-none focus:border-violet-400">
              <option>openai/clip-vit-base-patch32</option>
              <option>openai/clip-vit-large-patch14</option>
              <option>laion/CLIP-ViT-H-14-laion2B</option>
            </select>
          </div>
        </div>

        {indexCfg?.built && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-xs text-gray-400 mb-0.5">索引向量数</div><div className="font-medium text-gray-700">{indexCfg.vectorCount.toLocaleString()}</div></div>
            <div><div className="text-xs text-gray-400 mb-0.5">构建时间</div><div className="font-medium text-gray-700">{indexCfg.buildAt}</div></div>
            <div><div className="text-xs text-gray-400 mb-0.5">检索延迟（预估）</div><div className="font-medium text-gray-700">~12 ms / query</div></div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={buildIndex} disabled={buildingIndex}
            className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5">
            {buildingIndex ? <><RefreshCw size={13} className="animate-spin" /> 构建中…</> : <><Zap size={13} /> {indexCfg?.built ? '重新构建索引' : '构建检索索引'}</>}
          </button>
          {indexCfg?.built && (
            <button className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
              <Search size={13} /> 测试检索
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MultimodalDatasetManagement() {
  const [datasets, setDatasets] = useState<MultimodalDataset[]>(MOCK_DATASETS);
  const [selectedId, setSelectedId] = useState('ds1');
  const [activeTab, setActiveTab] = useState<DatasetTab>('overview');
  const [showNewDataset, setShowNewDataset] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const selected = datasets.find(d => d.id === selectedId) || datasets[0];

  const createDataset = (name: string, desc: string) => {
    const id = 'ds_' + Date.now();
    const newDs: MultimodalDataset = {
      id, name, description: desc,
      modalities: ['image', 'text'],
      pairCount: 0, size: '0 B', version: 'v1.0.0', branch: 'main',
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: 'active', starred: false,
      pairs: [], commits: [], preprocessJobs: [], indexConfig: null,
    };
    setDatasets(prev => [...prev, newDs]);
    setSelectedId(id);
    setActiveTab('overview');
  };

  const tabs: { id: DatasetTab; label: string; icon: any }[] = [
    { id: 'overview', label: '数据概览', icon: BarChart3 },
    { id: 'version', label: '版本控制', icon: GitBranch },
    { id: 'preprocess', label: '预处理与对齐', icon: Cpu },
    { id: 'storage', label: '存储与索引', icon: Database },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {showNewDataset && <NewDatasetDialog onClose={() => setShowNewDataset(false)} onCreate={createDataset} />}
      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} />}

      {/* Left sidebar: dataset list */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">多模态数据集</div>
          <button onClick={() => setShowNewDataset(true)}
            className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {datasets.map(ds => (
            <div key={ds.id} onClick={() => { setSelectedId(ds.id); setActiveTab('overview'); }}
              className={`rounded-xl p-3 cursor-pointer transition-colors border ${selectedId === ds.id ? 'border-violet-300 bg-violet-50' : 'border-transparent hover:bg-gray-50'}`}>
              <div className="flex items-start gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedId === ds.id ? 'bg-violet-100' : 'bg-gray-100'}`}>
                  <FolderOpen size={14} className={selectedId === ds.id ? 'text-violet-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="text-xs font-medium text-gray-800 truncate flex-1">{ds.name}</div>
                    {ds.starred && <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {ds.modalities.map(m => <ModalityBadge key={m} m={m} />)}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{ds.pairCount.toLocaleString()} 对</span>
                    <span className="text-xs text-gray-400">{ds.version}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {selected ? (
          <>
            {/* Dataset header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-gray-900">{selected.name}</h2>
                    <StatusBadge status={selected.status} />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                      <GitBranch size={10} /> {selected.branch}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">{selected.version}</span>
                  </div>
                  <p className="text-xs text-gray-500 max-w-2xl">{selected.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1.5">
                    <Download size={13} /> 导出
                  </button>
                  <button onClick={() => setShowUpload(true)}
                    className="text-sm px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1.5">
                    <Upload size={13} /> 上传数据
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 mt-4 border-b -mb-px">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 text-sm px-4 py-2.5 border-b-2 transition-colors ${activeTab === tab.id ? 'border-violet-600 text-violet-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && <OverviewPanel ds={selected} onUpload={() => setShowUpload(true)} />}
              {activeTab === 'version' && <VersionPanel ds={selected} />}
              {activeTab === 'preprocess' && <PreprocessPanel ds={selected} />}
              {activeTab === 'storage' && <StoragePanel ds={selected} />}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3">
            <FolderOpen size={32} className="text-gray-300" />
            <div className="text-sm">请选择或新建一个多模态数据集</div>
            <button onClick={() => setShowNewDataset(true)}
              className="text-sm px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-1.5">
              <Plus size={14} /> 新建数据集
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
