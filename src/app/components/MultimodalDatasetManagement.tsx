import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import type { MultimodalDatasetFocus } from '../data/auditPageMap';
import {
  Plus, GitBranch, GitCommit, Tag, Upload, Image, FileText, Search, Filter,
  MoreVertical, ChevronRight, CheckCircle, Clock, AlertCircle, RefreshCw,
  Trash2, Download, Eye, Layers, Zap, Database, Settings, X, Check,
  ArrowRight, BarChart3, Cpu, Link2, Archive, Shuffle, AlignCenter,
  FolderOpen, Star, Copy, Play, Pause, ChevronDown, Package, Sparkles, Wand2,
  ClipboardList, Activity, Gauge, User, Calendar, Globe, Lock, Server,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Modality = 'image' | 'text';
type DatasetTab = 'overview' | 'metadata' | 'evaluation' | 'preprocess' | 'version';

const MULTIMODAL_FOCUS_LABELS: Partial<Record<MultimodalDatasetFocus, string>> = {
  import: '数据导入与整合',
  wizard: '可视化构建向导',
  version: '数据版本控制',
  catalog: '分类目录与搜索',
  'metadata-tags': '多维度标签分类',
  'metadata-form': '数据集元数据管理',
  'eval-stats': '统计特征自动评估',
  'eval-quality': '数据质量与完整性报告',
  'eval-benchmark': '评估基准对比',
  representation: '跨模态表示学习 / 统一语义空间',
  index: '高效数据存储与索引',
  preprocess: '数据预处理与对齐工具',
  'cross-modal-link': '跨模态链接构建',
  'link-inference': '关联关系推理与补全',
};

const MGMT_CAPABILITIES: {
  focus: MultimodalDatasetFocus;
  label: string;
  desc: string;
  tab: DatasetTab;
  sectionId: string;
  icon: typeof GitBranch;
}[] = [
  {
    focus: 'version',
    label: '数据版本控制',
    desc: 'Git 式变更记录、版本标签与回溯',
    tab: 'version',
    sectionId: 'mm-version-history',
    icon: GitBranch,
  },
  {
    focus: 'preprocess',
    label: '数据预处理与对齐工具',
    desc: '清洗、格式转换与跨模态对齐',
    tab: 'preprocess',
    sectionId: 'mm-preprocess',
    icon: Cpu,
  },
  {
    focus: 'index',
    label: '高效数据存储与索引',
    desc: '优化存储方案与多模态检索引擎',
    tab: 'overview',
    sectionId: 'mm-storage-index',
    icon: Database,
  },
];

const FOCUS_SECTION_IDS: Partial<Record<MultimodalDatasetFocus, string>> = {
  catalog: 'mm-catalog',
  version: 'mm-version-history',
  'metadata-tags': 'mm-metadata-tags',
  'metadata-form': 'mm-metadata-form',
  'eval-stats': 'mm-eval-stats',
  'eval-quality': 'mm-eval-quality',
  'eval-benchmark': 'mm-eval-benchmark',
  representation: 'mm-representation',
  index: 'mm-storage-index',
  preprocess: 'mm-preprocess',
  import: 'mm-upload-dialog',
  wizard: 'mm-upload-wizard',
  'cross-modal-link': 'mm-cross-modal-link',
  'link-inference': 'mm-link-inference',
};

function resolveDatasetTab(f: MultimodalDatasetFocus | null): DatasetTab {
  if (!f) return 'overview';
  if (f === 'version') return 'version';
  if (f === 'metadata-tags' || f === 'metadata-form') return 'metadata';
  if (f === 'eval-stats' || f === 'eval-quality' || f === 'eval-benchmark') return 'evaluation';
  if (f === 'preprocess') return 'preprocess';
  return 'overview';
}
type UploadMode = 'pairs' | 'label';
type DataOrigin = 'upload' | 'database' | 'api';
type RetrievalMode = 'text2image' | 'image2text';

interface ConfiguredDataSource {
  id: string;
  name: string;
  kind: 'database' | 'api';
  detail: string;
  status: 'connected' | 'idle';
}

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

interface ImageTextPair {
  id: string;
  imageUrl: string;
  caption: string;
  tags: string[];
  source: string;
  addedAt: string;
  split?: 'train' | 'val' | 'test';
  lang?: string;
  clipScore?: number;
}

interface RetrievalHit {
  pair: ImageTextPair;
  score: number;
  matchBy: 'text' | 'image' | 'joint';
  reason: string;
}

interface DatasetMetadata {
  description: string;
  source: string;
  creator: string;
  publishedAt: string;
  license: string;
  homepage: string;
}

interface DatasetTaxonomy {
  domains: string[];
  tasks: string[];
  modalities: Modality[];
  extraTags: string[];
}

interface QualityIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  count: number;
  detail: string;
}

interface DatasetEvaluation {
  graphDensity: number;
  avgDegree: number;
  maxDegree: number;
  nodeCount: number;
  edgeCount: number;
  degreeBins: { label: string; value: number }[];
  relationDist: { type: string; count: number; pct: number }[];
  missingRate: number;
  inconsistencyRate: number;
  duplicateRate: number;
  completenessScore: number;
  qualityScore: number;
  issues: QualityIssue[];
  lastEvaluatedAt: string;
}

interface BenchmarkRow {
  name: string;
  density: number;
  avgDegree: number;
  completeness: number;
  quality: number;
  isCurrent?: boolean;
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
  metadata: DatasetMetadata;
  taxonomy: DatasetTaxonomy;
  evaluation: DatasetEvaluation;
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const DOMAIN_OPTIONS = ['生物', '金融', '材料', '医疗', '气候', '通用科研', '计算机'];
const TASK_OPTIONS = ['CLIP对比学习', '图文检索', '零样本分类', '对比学习', '实体对齐', '关系抽取', '分类', '问答'];

const DEFAULT_EVALUATION: DatasetEvaluation = {
  graphDensity: 0.012,
  avgDegree: 4.6,
  maxDegree: 128,
  nodeCount: 8420,
  edgeCount: 19350,
  degreeBins: [
    { label: '1–2', value: 32 },
    { label: '3–5', value: 28 },
    { label: '6–10', value: 18 },
    { label: '11–20', value: 12 },
    { label: '21+', value: 10 },
  ],
  relationDist: [
    { type: 'DESCRIBES', count: 8200, pct: 42 },
    { type: 'PART_OF', count: 4100, pct: 21 },
    { type: 'RELATED_TO', count: 3600, pct: 19 },
    { type: 'DERIVED_FROM', count: 2100, pct: 11 },
    { type: 'OTHER', count: 1350, pct: 7 },
  ],
  missingRate: 3.2,
  inconsistencyRate: 1.4,
  duplicateRate: 2.1,
  completenessScore: 92,
  qualityScore: 88,
  issues: [
    { id: 'q1', severity: 'high', category: '缺失值', count: 412, detail: '图文对缺少 caption 或 image 路径' },
    { id: 'q2', severity: 'medium', category: '不一致', count: 186, detail: '同一 image 对应多条冲突描述' },
    { id: 'q3', severity: 'medium', category: '重复', count: 270, detail: '感知哈希判定为近似重复图像' },
    { id: 'q4', severity: 'low', category: '格式异常', count: 54, detail: '标签含非法分隔符或超长字段' },
  ],
  lastEvaluatedAt: '2024-03-15 16:40',
};

const BENCHMARKS: BenchmarkRow[] = [
  { name: 'SciPaper-CLIP-v2（当前）', density: 0.012, avgDegree: 4.6, completeness: 92, quality: 88, isCurrent: true },
  { name: 'MS-COCO Captions', density: 0.008, avgDegree: 3.2, completeness: 96, quality: 91 },
  { name: 'Flickr30k', density: 0.006, avgDegree: 2.9, completeness: 94, quality: 90 },
  { name: 'Conceptual Captions', density: 0.004, avgDegree: 2.1, completeness: 89, quality: 84 },
  { name: 'LAION-400M subset', density: 0.003, avgDegree: 1.8, completeness: 81, quality: 76 },
];

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
      { id: 'p1', imageUrl: PLACEHOLDER_IMAGES[0], caption: 'Figure 1: Transformer architecture showing multi-head attention mechanism with positional encoding', tags: ['architecture', 'attention'], source: 'arXiv:2310.00001', addedAt: '2024-03-14', split: 'train', lang: 'en', clipScore: 0.41 },
      { id: 'p2', imageUrl: PLACEHOLDER_IMAGES[1], caption: 'Performance comparison of language models on benchmark datasets including MMLU and HellaSwag', tags: ['benchmark', 'evaluation'], source: 'arXiv:2310.00002', addedAt: '2024-03-14', split: 'train', lang: 'en', clipScore: 0.38 },
      { id: 'p3', imageUrl: PLACEHOLDER_IMAGES[2], caption: 'Protein structure visualization showing alpha helices and beta sheets in 3D space', tags: ['protein', 'structure'], source: 'PubMed:38000001', addedAt: '2024-03-13', split: 'train', lang: 'en', clipScore: 0.36 },
      { id: 'p4', imageUrl: PLACEHOLDER_IMAGES[3], caption: 'Neural network training loss curves across different learning rate schedules', tags: ['training', 'loss'], source: 'arXiv:2310.00003', addedAt: '2024-03-13', split: 'val', lang: 'en', clipScore: 0.33 },
      { id: 'p5', imageUrl: PLACEHOLDER_IMAGES[4], caption: 'Electron microscopy image of carbon nanotube cross-section at nanometer scale', tags: ['microscopy', 'material'], source: 'Nature:2024.001', addedAt: '2024-03-12', split: 'train', lang: 'en', clipScore: 0.29 },
      { id: 'p6', imageUrl: PLACEHOLDER_IMAGES[5], caption: 'Climate model output showing global temperature anomaly distribution from 1980 to 2023', tags: ['climate', 'visualization'], source: 'IPCC:2024', addedAt: '2024-03-12', split: 'test', lang: 'en', clipScore: 0.31 },
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
    metadata: {
      description: '科技论文图文对数据集，用于科学图表-摘要对比学习，支持CLIP类模型训练',
      source: 'arXiv / NeurIPS / ICML 公开论文附图',
      creator: '知识图谱平台 · 数据组',
      publishedAt: '2024-02-20',
      license: 'CC BY-NC 4.0',
      homepage: 'https://example.com/datasets/scipaper-clip-v2',
    },
    taxonomy: {
      domains: ['通用科研', '计算机', '材料'],
      tasks: ['CLIP对比学习', '图文检索', '零样本分类'],
      modalities: ['image', 'text'],
      extraTags: ['CLIP', 'ViT-B/32', '科学图表', '开放获取'],
    },
    evaluation: DEFAULT_EVALUATION,
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
      { id: 'mp1', imageUrl: PLACEHOLDER_IMAGES[2], caption: 'Chest X-ray showing bilateral pulmonary infiltrates consistent with COVID-19 pneumonia', tags: ['xray', 'covid'], source: 'CheXpert:001', addedAt: '2024-03-11', split: 'train', lang: 'en', clipScore: 0.44 },
      { id: 'mp2', imageUrl: PLACEHOLDER_IMAGES[4], caption: 'Brain MRI axial view demonstrating right temporal lobe lesion with surrounding edema', tags: ['mri', 'brain'], source: 'MIMIC:002', addedAt: '2024-03-10', split: 'train', lang: 'en', clipScore: 0.40 },
      { id: 'mp3', imageUrl: PLACEHOLDER_IMAGES[0], caption: 'Abdominal CT with contrast showing hepatic lesion in segment VI with delayed washout', tags: ['ct', 'liver'], source: 'MIMIC:014', addedAt: '2024-03-09', split: 'val', lang: 'en', clipScore: 0.37 },
      { id: 'mp4', imageUrl: PLACEHOLDER_IMAGES[5], caption: 'Fundus photograph of the left eye with optic disc swelling suggestive of papilledema', tags: ['fundus', 'ophthalmology'], source: 'CheXpert:088', addedAt: '2024-03-08', split: 'test', lang: 'en', clipScore: 0.35 },
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
    metadata: {
      description: '医学影像图文对数据集，包含X光、CT、MRI图像及对应医学描述文本，适用于医学视觉-语言预训练。',
      source: 'MIMIC-CXR / CheXpert',
      creator: '医学影像实验室',
      publishedAt: '2023-11-08',
      license: 'PhysioNet Credentialed',
      homepage: 'https://example.com/datasets/medimage-caption',
    },
    taxonomy: {
      domains: ['医疗', '生物'],
      tasks: ['CLIP对比学习', '图文检索', '分类'],
      modalities: ['image', 'text'],
      extraTags: ['CLIP', '放射科', '去标识化', '临床报告'],
    },
    evaluation: {
      ...DEFAULT_EVALUATION,
      graphDensity: 0.009,
      avgDegree: 3.8,
      maxDegree: 96,
      nodeCount: 5120,
      edgeCount: 9740,
      missingRate: 5.8,
      inconsistencyRate: 2.3,
      duplicateRate: 1.6,
      completenessScore: 86,
      qualityScore: 82,
      lastEvaluatedAt: '2024-03-12 10:05',
      issues: [
        { id: 'mq1', severity: 'high', category: '缺失值', count: 980, detail: '部分报告字段缺失 Impression / Findings' },
        { id: 'mq2', severity: 'medium', category: '不一致', count: 240, detail: '影像模态标签与 DICOM 元数据冲突' },
        { id: 'mq3', severity: 'low', category: '重复', count: 120, detail: '同一检查号重复入库' },
      ],
    },
  },
  {
    id: 'ds3',
    name: 'PatentFig-CLIP-v1',
    description: '专利附图与权利要求图文对，用于 CLIP 在工程图纸 / 装置结构图上的对比学习',
    modalities: ['image', 'text'],
    pairCount: 28640,
    size: '9.4 GB',
    version: 'v1.0.0',
    branch: 'main',
    updatedAt: '2024-03-08 11:12',
    status: 'active',
    starred: false,
    pairs: [
      { id: 'pp1', imageUrl: PLACEHOLDER_IMAGES[5], caption: 'A multimodal encoder architecture that jointly encodes image, text and table inputs via a visual Transformer and cross-modal attention.', tags: ['encoder', 'architecture'], source: 'CN202310987654B', addedAt: '2024-03-07', split: 'train', lang: 'en', clipScore: 0.39 },
      { id: 'pp2', imageUrl: PLACEHOLDER_IMAGES[0], caption: 'Patent drawing of a battery pack cooling plate with parallel coolant channels and a thermal interface layer.', tags: ['battery', 'cooling'], source: 'CN112345678A', addedAt: '2024-03-06', split: 'train', lang: 'en', clipScore: 0.34 },
      { id: 'pp3', imageUrl: PLACEHOLDER_IMAGES[1], caption: '一种知识图谱补全装置的结构框图，包括关系感知位置编码模块与多跳推理模块。', tags: ['kgc', 'block-diagram'], source: 'CN115862341A', addedAt: '2024-03-05', split: 'val', lang: 'zh', clipScore: 0.32 },
      { id: 'pp4', imageUrl: PLACEHOLDER_IMAGES[3], caption: 'Flowchart of an incremental knowledge graph update pipeline with delta computation and dynamic insertion.', tags: ['pipeline', 'kg'], source: 'CN202410112233A', addedAt: '2024-03-04', split: 'test', lang: 'en', clipScore: 0.30 },
    ],
    commits: [
      { hash: 'h4c1d2e', message: 'Initial patent figure–claim pairs from CNIPA 2023 dump', author: 'Zhao Lei', date: '2024-03-08 11:12', added: 28640, removed: 0, tag: 'v1.0.0' },
    ],
    preprocessJobs: [
      { id: 'pj1', name: '附图去水印', type: 'clean', status: 'done', progress: 100, config: '检测并裁剪页眉页脚、申请号水印' },
      { id: 'pj2', name: '权利要求截断', type: 'clean', status: 'done', progress: 100, config: '保留独权 + 截断 > 77 tokens' },
      { id: 'pj3', name: 'CLIP 相似度过滤', type: 'align', status: 'done', progress: 100, config: 'ViT-B/32 cosine > 0.22' },
    ],
    indexConfig: {
      type: 'faiss', dim: 512, metric: 'cosine', built: true,
      vectorCount: 28640, buildAt: '2024-03-08 12:40',
    },
    metadata: {
      description: '专利附图与权利要求图文对，用于 CLIP 在工程图纸 / 装置结构图上的对比学习。',
      source: 'CNIPA 公开专利附图 + 权利要求书',
      creator: '知识产权数据组',
      publishedAt: '2024-03-08',
      license: '内部研究使用',
      homepage: 'https://example.com/datasets/patentfig-clip-v1',
    },
    taxonomy: {
      domains: ['计算机', '材料'],
      tasks: ['CLIP对比学习', '图文检索'],
      modalities: ['image', 'text'],
      extraTags: ['CLIP', '专利附图', '中英双语'],
    },
    evaluation: {
      ...DEFAULT_EVALUATION,
      graphDensity: 0.007,
      avgDegree: 3.1,
      nodeCount: 3640,
      edgeCount: 5620,
      completenessScore: 84,
      qualityScore: 80,
      lastEvaluatedAt: '2024-03-08 13:00',
    },
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModalityBadge({ m }: { m: Modality }) {
  const cfg: Record<Modality, { label: string; cls: string }> = {
    image: { label: '图像', cls: 'bg-violet-50 text-violet-700' },
    text: { label: '文本', cls: 'bg-blue-50 text-blue-700' },
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg[m].cls}`}>{cfg[m].label}</span>;
}

function ProvenanceMarks({ source, creator, compact }: { source: string; creator: string; compact?: boolean }) {
  const textCls = compact ? 'text-[10px]' : 'text-[11px]';
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-gray-500 ${textCls}`}>
      <span className="inline-flex items-center gap-1 min-w-0" title={`来源：${source || '未标注'}`}>
        <Globe size={10} className="flex-shrink-0 text-gray-400" />
        <span className="truncate max-w-[160px]">{source || '未标注来源'}</span>
      </span>
      <span className="inline-flex items-center gap-1 min-w-0" title={`创建者：${creator || '未标注'}`}>
        <User size={10} className="flex-shrink-0 text-gray-400" />
        <span className="truncate max-w-[120px]">{creator || '未标注创建者'}</span>
      </span>
    </div>
  );
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

const CONFIGURED_DATA_SOURCES: ConfiguredDataSource[] = [
  { id: 'db1', name: 'SciCorpus MySQL', kind: 'database', detail: 'mysql://corpus_db · table: image_captions', status: 'connected' },
  { id: 'db2', name: 'MedArchive PostgreSQL', kind: 'database', detail: 'postgresql://med_db · view: v_mm_pairs', status: 'connected' },
  { id: 'db3', name: 'Lab Object Storage Meta', kind: 'database', detail: 'mysql://lab_meta · table: media_objects', status: 'idle' },
  { id: 'api1', name: 'PubMed Figure API', kind: 'api', detail: 'GET https://api.example.com/v1/figures', status: 'connected' },
  { id: 'api2', name: 'Internal Media Hub', kind: 'api', detail: 'POST https://media.internal/list', status: 'connected' },
  { id: 'api3', name: 'OpenAlex Works API', kind: 'api', detail: 'GET https://api.openalex.org/works', status: 'idle' },
];

const DEFAULT_IMAGE_TEXT_SCHEMA = {
  name: 'ImageTextPairSchema',
  version: 'v1.1',
  description: 'CLIP 图文对比训练默认 Schema。每行一条 image–caption 对，与 samples/clip 样例文件一致。',
  fields: [
    { name: 'id', type: 'string', required: true, desc: '图文对唯一 ID，建议 {dataset}-{split}-{seq}' },
    { name: 'image', type: 'string | url', required: true, desc: '图像路径、对象存储 Key 或 URL（CLIP 视觉侧）' },
    { name: 'caption', type: 'string', required: true, desc: '与图像对齐的文本（CLIP 文本侧，建议 ≤ 77 tokens）' },
    { name: 'split', type: 'train | val | test', required: true, desc: '训练划分，CLIP 只用 train 计算 InfoNCE' },
    { name: 'tags', type: 'string[]', required: false, desc: '可选标签，不进入对比损失' },
    { name: 'source', type: 'string', required: false, desc: '来源标识（DOI、专利号、检查号）' },
    { name: 'lang', type: 'en | zh', required: false, desc: '文本语言，默认 en' },
    { name: 'width', type: 'int', required: false, desc: '图像宽度（像素）' },
    { name: 'height', type: 'int', required: false, desc: '图像高度（像素）' },
    { name: 'clip_score', type: 'float', required: false, desc: '预训练 CLIP 图文相似度，可用于过滤低质量对' },
  ] as SchemaField[],
};

// ─── Upload Dialog ────────────────────────────────────────────────────────────

type GenState = 'idle' | 'generating' | 'done';
type WizardStep = 'source' | 'schema' | 'content' | 'label';

interface LabeledImage {
  id: string;
  name: string;
  caption: string;
  tags: string;
  genState: GenState;
  confidence: number | null;
  aiGenerated: boolean;
}

function UploadStepIndicator({
  steps,
  current,
}: {
  steps: { id: WizardStep; label: string }[];
  current: WizardStep;
}) {
  const idx = steps.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1 px-6 pt-3 pb-1 overflow-x-auto">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <div className={`w-6 h-px mx-0.5 ${done || active ? 'bg-violet-300' : 'bg-gray-200'}`} />}
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              active ? 'bg-violet-100 text-violet-700 font-medium' : done ? 'text-violet-600' : 'text-gray-400'
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                active ? 'bg-violet-600 text-white' : done ? 'bg-violet-200 text-violet-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check size={10} /> : i + 1}
              </span>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UploadDialog({
  onClose,
  highlightWizard = false,
  initialUploadMode = 'pairs',
  highlightCrossModalLink = false,
}: {
  onClose: () => void;
  highlightWizard?: boolean;
  initialUploadMode?: UploadMode;
  highlightCrossModalLink?: boolean;
}) {
  const [uploadMode, setUploadMode] = useState<UploadMode>(initialUploadMode);
  const [wizardStep, setWizardStep] = useState<WizardStep>('source');
  const [dataOrigin, setDataOrigin] = useState<DataOrigin>('upload');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('db1');
  const [selectedModel, setSelectedModel] = useState('internvl2');
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [dbTable, setDbTable] = useState('image_captions');
  const [dbQuery, setDbQuery] = useState('SELECT image_url AS image, caption, tags FROM image_captions WHERE status = \'ready\' LIMIT 10000');
  const [apiEndpoint, setApiEndpoint] = useState('/v1/figures');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [labeledImages, setLabeledImages] = useState<LabeledImage[]>([
    { id: 'li1', name: 'figure_001.png', caption: '', tags: '', genState: 'idle', confidence: null, aiGenerated: false },
    { id: 'li2', name: 'chart_002.jpg', caption: '', tags: '', genState: 'idle', confidence: null, aiGenerated: false },
    { id: 'li3', name: 'diagram_003.png', caption: '', tags: '', genState: 'idle', confidence: null, aiGenerated: false },
  ]);

  const wizardSteps: { id: WizardStep; label: string }[] =
    uploadMode === 'pairs'
      ? [
          { id: 'source', label: '数据指定' },
          { id: 'schema', label: 'Schema 定义' },
          { id: 'content', label: '导入确认' },
        ]
      : [
          { id: 'source', label: '数据指定' },
          { id: 'schema', label: 'Schema 定义' },
          { id: 'content', label: '获取数据' },
          { id: 'label', label: '链接标注' },
        ];

  const filteredSources = CONFIGURED_DATA_SOURCES.filter(s =>
    dataOrigin === 'database' ? s.kind === 'database' : dataOrigin === 'api' ? s.kind === 'api' : false,
  );
  const selectedSource = CONFIGURED_DATA_SOURCES.find(s => s.id === selectedSourceId);

  const resetWizard = (mode: UploadMode) => {
    setUploadMode(mode);
    setWizardStep('source');
    setDataOrigin('upload');
    setSelectedSourceId(mode === 'label' ? 'api1' : 'db1');
  };

  const canProceedFromSource =
    dataOrigin === 'upload' ||
    (selectedSourceId && filteredSources.some(s => s.id === selectedSourceId));

  const updateImage = (id: string, patch: Partial<LabeledImage>) =>
    setLabeledImages(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));

  const generateCaption = (id: string) => {
    updateImage(id, { genState: 'generating', caption: '', tags: '', confidence: null });
    const mock = MOCK_CAPTIONS[id];
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
          setTimeout(() => setBatchGenerating(false), 2500);
        }
      }, i * 600);
    });
  };

  const completedCount = labeledImages.filter(img => img.caption.trim()).length;
  const aiCount = labeledImages.filter(img => img.aiGenerated).length;

  const goNext = () => {
    if (wizardStep === 'source') setWizardStep('schema');
    else if (wizardStep === 'schema') setWizardStep('content');
    else if (wizardStep === 'content' && uploadMode === 'label') setWizardStep('label');
  };

  const goBack = () => {
    if (wizardStep === 'label') setWizardStep('content');
    else if (wizardStep === 'content') setWizardStep('schema');
    else if (wizardStep === 'schema') setWizardStep('source');
  };

  const originLabel =
    dataOrigin === 'upload' ? '直接上传' : dataOrigin === 'database' ? '数据库' : 'API';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div
        id={highlightWizard ? 'mm-upload-wizard' : highlightCrossModalLink ? 'mm-cross-modal-link' : 'mm-upload-dialog'}
        className={`bg-white rounded-2xl shadow-2xl w-[760px] max-h-[90vh] flex flex-col overflow-hidden ${highlightWizard || highlightCrossModalLink ? 'ring-2 ring-violet-300' : ''}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="font-semibold text-gray-800">
              {highlightCrossModalLink ? '跨模态链接构建' : highlightWizard ? '可视化构建向导' : '导入数据到数据集'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {highlightCrossModalLink
                ? '标注或自动发现图表与正文等跨模态内容间的链接关系'
                : highlightWizard
                  ? '分步完成数据指定、Schema 定义与数据集生成'
                  : '支持直接上传、已配置数据库 / API 数据源'}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        {highlightCrossModalLink && (
          <div className="px-6 py-2 bg-violet-50 border-b border-violet-100 text-xs text-violet-800">
            在数据预处理阶段，为图像/图表与正文段落建立跨模态链接（如 figure ↔ 正文引用、caption ↔ 段落）。
          </div>
        )}

        {highlightWizard && (
          <div className="px-6 py-2 bg-violet-50 border-b border-violet-100 text-xs text-violet-800">
            向导模式：按步骤指定数据来源 → 定义 Schema → 确认导入，完成多模态数据集构建。
          </div>
        )}

        <div className="px-6 pt-4 pb-0">
          <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden w-fit">
            <button onClick={() => resetWizard('pairs')}
              className={`text-sm px-5 py-2 transition-colors flex items-center gap-1.5 ${uploadMode === 'pairs' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Link2 size={13} /> 上传图文对
            </button>
            <button onClick={() => resetWizard('label')}
              className={`text-sm px-5 py-2 transition-colors flex items-center gap-1.5 ${uploadMode === 'label' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Link2 size={13} /> 跨模态链接构建
            </button>
          </div>
        </div>

        <UploadStepIndicator steps={wizardSteps} current={wizardStep} />

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {wizardStep === 'source' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">选择数据来源：可使用平台已配置的数据源，或直接上传本地文件。</div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'upload' as DataOrigin, title: '直接上传', desc: '本地文件 / 压缩包', icon: Upload },
                  { id: 'database' as DataOrigin, title: '数据库', desc: 'MySQL / PostgreSQL 等', icon: Database },
                  { id: 'api' as DataOrigin, title: 'API 来源', desc: 'REST / 内部服务接口', icon: Globe },
                ]).map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setDataOrigin(opt.id);
                      const first = CONFIGURED_DATA_SOURCES.find(s =>
                        opt.id === 'database' ? s.kind === 'database' : opt.id === 'api' ? s.kind === 'api' : false,
                      );
                      if (first) setSelectedSourceId(first.id);
                    }}
                    className={`text-left border rounded-xl p-4 transition-colors ${
                      dataOrigin === opt.id ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                      dataOrigin === opt.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <opt.icon size={16} />
                    </div>
                    <div className="text-sm font-medium text-gray-800">{opt.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {dataOrigin === 'upload' && (
                <div className="border border-dashed border-violet-200 rounded-xl p-6 bg-violet-50/20">
                  <div className="text-sm font-medium text-gray-700 mb-1">将在后续步骤中选择本地文件</div>
                  <div className="text-xs text-gray-400">
                    {uploadMode === 'pairs'
                      ? '支持 JSON / JSONL / CSV / ZIP 图文对文件'
                      : '支持 JPG、PNG、WEBP、TIFF 批量图片'}
                  </div>
                </div>
              )}

              {(dataOrigin === 'database' || dataOrigin === 'api') && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    <Server size={12} /> 已配置的{dataOrigin === 'database' ? '数据库' : 'API'}数据源
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {filteredSources.map(src => (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => setSelectedSourceId(src.id)}
                        className={`w-full text-left border rounded-xl px-4 py-3 transition-colors ${
                          selectedSourceId === src.id ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-800 flex-1">{src.name}</div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            src.status === 'connected' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {src.status === 'connected' ? '已连接' : '未连接'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-mono truncate">{src.detail}</div>
                      </button>
                    ))}
                  </div>
                  {dataOrigin === 'database' && (
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">表 / 视图</div>
                        <input value={dbTable} onChange={e => setDbTable(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">抽取 SQL（可选）</div>
                        <textarea value={dbQuery} onChange={e => setDbQuery(e.target.value)} rows={3}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-violet-400 resize-none" />
                      </div>
                    </div>
                  )}
                  {dataOrigin === 'api' && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">方法</div>
                        <select value={apiMethod} onChange={e => setApiMethod(e.target.value as 'GET' | 'POST')}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500 mb-1">接口路径</div>
                        <input value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-violet-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {wizardStep === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Lock size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-amber-800">Schema 已锁定（平台默认）</div>
                  <div className="text-xs text-amber-700/80 mt-0.5">
                    当前仅提供一种 CLIP 图文对 Schema（v1.1），不可修改字段定义。导入 JSONL/CSV 需映射到该结构，样例见 samples/clip/。
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{DEFAULT_IMAGE_TEXT_SCHEMA.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{DEFAULT_IMAGE_TEXT_SCHEMA.description}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{DEFAULT_IMAGE_TEXT_SCHEMA.version}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {DEFAULT_IMAGE_TEXT_SCHEMA.fields.map(f => (
                    <div key={f.name} className="px-4 py-3 flex items-start gap-3 opacity-90">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-gray-800">{f.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{f.type}</span>
                          {f.required
                            ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">必填</span>
                            : <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-400">可选</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{f.desc}</div>
                      </div>
                      <Lock size={12} className="text-gray-300 mt-1 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
                数据来源：<span className="text-gray-700 font-medium">{originLabel}</span>
                {selectedSource && dataOrigin !== 'upload' && (
                  <> · <span className="text-gray-700 font-medium">{selectedSource.name}</span></>
                )}
                {' '}→ 将映射到上述 Schema
              </div>
            </div>
          )}

          {wizardStep === 'content' && uploadMode === 'pairs' && (
            <div className="space-y-4">
              {dataOrigin === 'upload' ? (
                <>
                  <div className="text-sm text-gray-500">上传 JSON/JSONL/CSV 图文对文件，或压缩包（图片文件夹 + 标注文件）</div>
                  <div className="border-2 border-dashed border-violet-200 rounded-xl p-10 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors cursor-pointer group">
                    <Upload size={32} className="mx-auto mb-3 text-violet-300 group-hover:text-violet-400" />
                    <div className="text-sm font-medium text-gray-700 mb-1">拖拽文件到此处，或点击上传</div>
                    <div className="text-xs text-gray-400">支持 .json .jsonl .csv .zip .tar.gz，单次最大 10 GB</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-2">
                    <div className="font-medium text-gray-700 mb-2">格式需符合 ImageTextPairSchema</div>
                    <div className="font-mono bg-white border border-gray-200 rounded-lg p-3 text-gray-600 leading-relaxed">
                      {'{"image": "path/to/img.jpg", "caption": "描述文本", "tags": ["tag1"]}'}<br />
                      {'{"image_url": "https://...", "text": "caption text"}'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">图像字段名 → image</div>
                      <input defaultValue="image" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">文本字段名 → caption</div>
                      <input defaultValue="caption" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-600">
                    将从{dataOrigin === 'database' ? '数据库' : 'API'}拉取数据并按默认 Schema 导入。
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">数据源</span><span className="text-gray-800 font-medium">{selectedSource?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">连接信息</span><span className="text-gray-600 text-xs font-mono truncate max-w-[360px]">{selectedSource?.detail}</span></div>
                    {dataOrigin === 'database' && (
                      <>
                        <div className="flex justify-between"><span className="text-gray-400">表 / 视图</span><span className="text-gray-800">{dbTable}</span></div>
                        <div>
                          <div className="text-gray-400 text-xs mb-1">SQL</div>
                          <pre className="text-xs font-mono bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-wrap text-gray-600">{dbQuery}</pre>
                        </div>
                      </>
                    )}
                    {dataOrigin === 'api' && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">请求</span>
                        <span className="text-gray-800 font-mono text-xs">{apiMethod} {apiEndpoint}</span>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-gray-400">目标 Schema</span><span className="text-violet-700 font-medium">{DEFAULT_IMAGE_TEXT_SCHEMA.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">预估条数</span><span className="text-gray-800">{dataOrigin === 'database' ? '约 12,480' : '约 3,200'}</span></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <CheckCircle size={13} /> 字段探测完成：image / caption 可映射；tags、source 可选
                  </div>
                </>
              )}
            </div>
          )}

          {wizardStep === 'content' && uploadMode === 'label' && (
            <div className="space-y-4">
              {dataOrigin === 'upload' ? (
                <>
                  <div className="text-sm text-gray-500">获取待打标图片（本地上传）</div>
                  <div className="border-2 border-dashed border-violet-200 rounded-xl p-10 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors cursor-pointer group">
                    <Image size={32} className="mx-auto mb-3 text-violet-300 group-hover:text-violet-400" />
                    <div className="text-sm font-medium text-gray-700 mb-1">上传图片文件</div>
                    <div className="text-xs text-gray-400">支持 JPG、PNG、WEBP、TIFF，可批量选择</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500">
                    从已配置的{dataOrigin === 'database' ? '数据库' : 'API'}拉取待打标图片列表
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-gray-400">数据源</span><span className="font-medium text-gray-800">{selectedSource?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">详情</span><span className="text-xs font-mono text-gray-600 truncate max-w-[360px]">{selectedSource?.detail}</span></div>
                    {dataOrigin === 'api' && (
                      <div className="flex justify-between"><span className="text-gray-400">请求</span><span className="font-mono text-xs">{apiMethod} {apiEndpoint}</span></div>
                    )}
                    {dataOrigin === 'database' && (
                      <div className="flex justify-between"><span className="text-gray-400">表 / 视图</span><span>{dbTable}</span></div>
                    )}
                  </div>
                </>
              )}
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
              <div className="text-xs text-gray-400">导入后将按 {DEFAULT_IMAGE_TEXT_SCHEMA.name} 填写 caption / tags</div>
            </div>
          )}

          {wizardStep === 'label' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 flex-1">为图像建立与正文/描述的跨模态链接（可 AI 自动发现）</span>
                <span className="text-xs text-gray-400">{completedCount}/{labeledImages.length} 已填写</span>
              </div>

              <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-violet-800 mb-1">AI 自动描述生成</div>
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

              <div className="space-y-3">
                {labeledImages.map(img => (
                  <div key={img.id}
                    className={`border rounded-xl p-4 transition-colors ${img.genState === 'generating' ? 'border-violet-300 bg-violet-50/30' : img.genState === 'done' ? 'border-emerald-200' : 'border-gray-200'}`}>
                    <div className="flex gap-3">
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        <Image size={26} className="text-violet-300" />
                        {img.genState === 'generating' && (
                          <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center">
                            <RefreshCw size={16} className="animate-spin text-violet-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
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
                            className="flex-shrink-0 text-xs px-3 py-1.5 border border-violet-300 bg-white hover:bg-violet-50 disabled:opacity-50 text-violet-700 rounded-lg transition-colors flex items-center gap-1"
                          >
                            {img.genState === 'generating'
                              ? <RefreshCw size={11} className="animate-spin" />
                              : <Sparkles size={11} />}
                            {img.genState === 'generating' ? '生成中' : img.aiGenerated ? '重新生成' : 'AI生成描述'}
                          </button>
                        </div>
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {aiCount > 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700">
                  <Sparkles size={13} className="text-emerald-500" />
                  已由 AI 自动生成 <strong>{aiCount}</strong> 条描述，你可以在提交前手动修改任意内容
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 px-6 py-4 border-t border-gray-100">
          <div>
            {wizardStep !== 'source' && (
              <button onClick={goBack}
                className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                上一步
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
            {wizardStep !== 'label' && !(uploadMode === 'pairs' && wizardStep === 'content') ? (
              <button
                onClick={goNext}
                disabled={wizardStep === 'source' && !canProceedFromSource}
                className="text-sm px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                下一步 <ArrowRight size={13} />
              </button>
            ) : (
              <button onClick={onClose}
                className="text-sm px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
                <Upload size={13} /> 确认导入
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Dataset Dialog ───────────────────────────────────────────────────────

function NewDatasetDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string, source: string, creator: string) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [source, setSource] = useState('');
  const [creator, setCreator] = useState('');
  const [selectedModalities, setSelectedModalities] = useState<Modality[]>(['image', 'text']);
  const allModalities: Modality[] = ['image', 'text'];
  const toggleModality = (m: Modality) => setSelectedModalities(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  const canCreate = !!name.trim() && !!source.trim() && !!creator.trim();

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
              placeholder="例如：用于 CLIP ViT-B/32 图文对比训练的领域图文对…" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1.5">来源 <span className="text-red-400">*</span></div>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400"
                placeholder="如 arXiv / 内部采集" value={source} onChange={e => setSource(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1.5">创建者 <span className="text-red-400">*</span></div>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-violet-400"
                placeholder="个人或团队名称" value={creator} onChange={e => setCreator(e.target.value)} />
            </div>
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
            <p className="text-[11px] text-gray-400 mt-1.5">仅支持图像与文本图文对，不含音频、视频。</p>
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
          <button onClick={() => { if (canCreate) { onCreate(name.trim(), desc, source.trim(), creator.trim()); onClose(); } }}
            className="text-sm px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            disabled={!canCreate}>
            <Plus size={13} /> 创建数据集
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

function StorageIndexPanel({ ds, highlight }: { ds: MultimodalDataset; highlight?: boolean }) {
  const idx = ds.indexConfig;
  const shardCount = Math.max(1, Math.ceil(ds.pairCount / 50000));
  return (
    <div
      id="mm-storage-index"
      className={`space-y-4 ${highlight ? 'ring-2 ring-violet-300 rounded-xl p-1' : ''}`}
    >
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <Database size={14} className="text-violet-600" />
          <span className="text-sm font-semibold text-gray-800">高效数据存储</span>
          <span className="text-[11px] text-gray-400 ml-auto">{ds.size}</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: '存储格式', value: 'Parquet + WebDataset', sub: '列式存储 · 流式读取' },
            { label: '对象存储', value: 's3://kg-mm/' + ds.name.toLowerCase(), sub: `${shardCount} 分片 · zstd 压缩` },
            { label: '元数据索引', value: 'PostgreSQL + 倒排', sub: 'caption / tags / split 可检索' },
          ].map(item => (
            <div key={item.label} className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50/50">
              <div className="text-[11px] text-gray-400 mb-1">{item.label}</div>
              <div className="text-sm font-medium text-gray-800 font-mono truncate">{item.value}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-violet-600" />
            <span className="text-sm font-semibold text-gray-800">多模态检索索引</span>
          </div>
          {idx?.built ? (
            <span className="text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
              <CheckCircle size={11} /> {idx.type.toUpperCase()} · {idx.vectorCount.toLocaleString()} 向量
            </span>
          ) : (
            <span className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              未构建索引
            </span>
          )}
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="border border-gray-100 rounded-lg px-3 py-2">
            <div className="text-gray-400">引擎</div>
            <div className="font-medium text-gray-800 mt-0.5">{idx?.type ?? 'FAISS'} · IVF-PQ</div>
          </div>
          <div className="border border-gray-100 rounded-lg px-3 py-2">
            <div className="text-gray-400">维度</div>
            <div className="font-medium text-gray-800 mt-0.5">{idx?.dim ?? 512}-d</div>
          </div>
          <div className="border border-gray-100 rounded-lg px-3 py-2">
            <div className="text-gray-400">度量</div>
            <div className="font-medium text-gray-800 mt-0.5">{idx?.metric ?? 'cosine'}</div>
          </div>
          <div className="border border-gray-100 rounded-lg px-3 py-2">
            <div className="text-gray-400">构建时间</div>
            <div className="font-medium text-gray-800 mt-0.5">{idx?.buildAt ?? '—'}</div>
          </div>
        </div>
        <div className="px-5 pb-4 flex gap-2">
          <button type="button" className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1">
            <Play size={11} /> 重建索引
          </button>
          <button type="button" className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg">
            导出索引元数据
          </button>
        </div>
      </div>
    </div>
  );
}

function RetrievalPanel({ ds, highlightIndex }: { ds: MultimodalDataset; highlightIndex?: boolean }) {
  const [mode, setMode] = useState<RetrievalMode>('text2image');
  const [query, setQuery] = useState('transformer attention architecture');
  const [queryImage, setQueryImage] = useState<string | null>(null);
  const [queryImageName, setQueryImageName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState(ds.version);
  const [topK, setTopK] = useState(6);
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<RetrievalHit[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const versions = Array.from(new Set([
    ds.version,
    ...ds.commits.map(commit => commit.tag).filter((tag): tag is string => Boolean(tag)),
  ]));

  const canSearch =
    (mode === 'text2image' && !!query.trim()) ||
    (mode === 'image2text' && !!queryImage);

  const scorePair = (pair: ImageTextPair): RetrievalHit | null => {
    const q = query.trim().toLowerCase();
    const blob = `${pair.caption} ${pair.tags.join(' ')} ${pair.source}`.toLowerCase();
    let textScore = 0;
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      const hitTokens = tokens.filter(t => blob.includes(t));
      textScore = tokens.length ? hitTokens.length / tokens.length : 0;
      if (blob.includes(q)) textScore = Math.max(textScore, 0.92);
      if (/attention|transformer|架构/.test(q) && /attention|transformer|architecture/.test(blob)) textScore = Math.max(textScore, 0.78);
      if (/loss|training|曲线/.test(q) && /loss|training/.test(blob)) textScore = Math.max(textScore, 0.74);
      if (/protein|结构/.test(q) && /protein|structure/.test(blob)) textScore = Math.max(textScore, 0.8);
      if (/climate|温度/.test(q) && /climate|temperature/.test(blob)) textScore = Math.max(textScore, 0.76);
      if (/microscopy|材料|nanotube/.test(q) && /microscopy|material|nanotube/.test(blob)) textScore = Math.max(textScore, 0.77);
      if (/benchmark|performance|模型/.test(q) && /benchmark|performance|model/.test(blob)) textScore = Math.max(textScore, 0.72);
    }

    let imageScore = 0;
    if (queryImage) {
      const seed = (pair.id.charCodeAt(1) + (queryImageName.length % 7)) % 6;
      imageScore = 0.55 + seed * 0.07;
      if (queryImage === pair.imageUrl) imageScore = 0.98;
    }

    if (mode === 'text2image') {
      if (!q) return null;
      const score = Math.min(0.99, 0.35 + textScore * 0.65);
      return {
        pair,
        score: textScore === 0 ? 0.42 + (pair.id.charCodeAt(1) % 5) * 0.05 : score,
        matchBy: 'text',
        reason: '文本语义 ↔ 图像向量',
      };
    }
    if (mode === 'image2text') {
      if (!queryImage) return null;
      return { pair, score: Math.min(0.99, imageScore), matchBy: 'image', reason: '查询图像 ↔ 图文对视觉相似' };
    }
    return null;
  };

  const runSearch = () => {
    if (!canSearch) return;
    setSearching(true);
    setTimeout(() => {
      const ranked = ds.pairs
        .map(scorePair)
        .filter((h): h is RetrievalHit => !!h)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      setHits(ranked.length > 0 ? ranked : ds.pairs.slice(0, Math.min(topK, ds.pairs.length)).map((pair, i) => ({
        pair,
        score: 0.61 - i * 0.04,
        matchBy: mode === 'image2text' ? 'image' as const : 'text' as const,
        reason: '近邻召回（弱相关）',
      })));
      setSearching(false);
    }, 700);
  };

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (queryImage?.startsWith('blob:')) URL.revokeObjectURL(queryImage);
    setQueryImage(url);
    setQueryImageName(file.name);
    setMode('image2text');
  };

  const useSampleAsQuery = (url: string) => {
    setQueryImage(url);
    setQueryImageName('样本图像');
    if (mode === 'text2image') setMode('image2text');
  };

  return (
    <div id="mm-retrieval-index" className={`space-y-4 ${highlightIndex ? 'ring-2 ring-violet-300 rounded-xl p-1' : ''}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Search size={15} className="text-violet-600" /> 图文检索
            </div>
            <p className="text-xs text-gray-400 mt-1">
              支持以文搜图、以图搜文，并可限定数据集版本。
            </p>
          </div>
          {ds.indexConfig?.built ? (
            <span className="text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1 flex-shrink-0">
              <CheckCircle size={11} /> 索引可用 · {ds.indexConfig.type.toUpperCase()}
            </span>
          ) : (
            <span className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex-shrink-0">
              未构建索引（演示仍可检索）
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'text2image' as const, label: '以文搜图', desc: '文本查询 → 相关图像' },
            { id: 'image2text' as const, label: '以图搜文', desc: '上传图像 → 相关描述/图文对' },
          ]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-2 rounded-lg border text-left transition-colors ${
                mode === m.id ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`text-xs font-medium ${mode === m.id ? 'text-violet-700' : 'text-gray-700'}`}>{m.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <div className="space-y-3">
            {mode === 'text2image' && (
              <div className="flex items-center border border-gray-200 rounded-xl focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 bg-white">
                <FileText size={15} className="ml-3 text-gray-400 flex-shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runSearch()}
                  placeholder="输入文本查询，如 transformer attention / 蛋白质结构…"
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                />
              </div>
            )}

            {mode === 'image2text' && (
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                >
                  <Upload size={12} /> 上传查询图片
                </button>
                <span className="text-[11px] text-gray-400">或点击下方样本图作为查询</span>
                {queryImage && (
                  <div className="flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-lg border border-gray-200 bg-white">
                    <img src={queryImage} alt="" className="w-8 h-8 rounded object-cover" />
                    <span className="text-[11px] text-gray-600 max-w-[120px] truncate">{queryImageName}</span>
                    <button
                      onClick={() => {
                        if (queryImage.startsWith('blob:')) URL.revokeObjectURL(queryImage);
                        setQueryImage(null);
                        setQueryImageName('');
                      }}
                      className="p-1 text-gray-300 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:justify-end">
            <label className="text-xs text-gray-500 flex items-center gap-1.5">
              版本
              <select
                value={selectedVersion}
                onChange={e => {
                  setSelectedVersion(e.target.value);
                  setHits(null);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
              >
                {versions.map(version => <option key={version} value={version}>{version}</option>)}
              </select>
            </label>
            <label className="text-xs text-gray-500 flex items-center gap-1.5">
              Top-K
              <select
                value={topK}
                onChange={e => setTopK(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white"
              >
                {[3, 6, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button
              onClick={runSearch}
              disabled={!canSearch || searching}
              className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              {searching ? '检索中…' : '开始检索'}
            </button>
          </div>
        </div>

        {mode === 'image2text' && (
          <div>
            <div className="text-[11px] text-gray-400 mb-2">快速选用样本图像作为查询</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ds.pairs.map(p => (
                <button
                  key={p.id}
                  onClick={() => useSampleAsQuery(p.imageUrl)}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    queryImage === p.imageUrl ? 'border-violet-500' : 'border-transparent hover:border-violet-200'
                  }`}
                >
                  <img src={p.imageUrl} alt="" className="w-14 h-14 object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">检索结果</div>
          {hits && (
            <span className="text-xs text-gray-400">
              版本 {selectedVersion} · 返回 {hits.length} 条 · {mode === 'text2image' ? '以文搜图' : '以图搜文'}
            </span>
          )}
        </div>

        {!hits && (
          <div className="px-5 py-14 text-center text-sm text-gray-400">
            <Image size={28} className="mx-auto mb-2 text-gray-300" />
            配置查询条件后点击「开始检索」
          </div>
        )}

        {hits && hits.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-400">未召回到相关图文对，请调整查询</div>
        )}

        {hits && hits.length > 0 && (
          <div className="divide-y divide-gray-50">
            {hits.map((hit, idx) => (
              <div key={hit.pair.id} className="flex gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div className="w-6 text-xs text-gray-300 font-mono pt-1">{idx + 1}</div>
                <img src={hit.pair.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      hit.score >= 0.85 ? 'bg-green-50 text-green-700' :
                      hit.score >= 0.65 ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      相似度 {(hit.score * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                      {hit.matchBy === 'text' ? '文→图' : '图→文'}
                    </span>
                    <span className="text-[10px] text-gray-400">{hit.reason}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug line-clamp-2">{hit.pair.caption}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {hit.pair.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{t}</span>
                    ))}
                    <span className="text-[10px] text-gray-400 ml-auto">{hit.pair.source}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-1">
                  <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400" title="预览"><Eye size={13} /></button>
                  <button
                    onClick={() => useSampleAsQuery(hit.pair.imageUrl)}
                    className="p-1.5 hover:bg-violet-50 rounded text-violet-500"
                    title="以此图继续检索"
                  >
                    <Image size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewPanel({
  ds,
  onUpload,
  highlightRetrieval,
  highlightIndex,
  highlightLinkInference,
}: {
  ds: MultimodalDataset;
  onUpload: () => void;
  highlightRetrieval?: boolean;
  highlightIndex?: boolean;
  highlightLinkInference?: boolean;
}) {
  const [searchQ, setSearchQ] = useState('');
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [pairs, setPairs] = useState(ds.pairs);
  const filtered = pairs.filter(p => p.caption.toLowerCase().includes(searchQ.toLowerCase()) || p.tags.some(t => t.includes(searchQ)));

  const inferAndCompleteLink = (pairId: string) => {
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
      <div
        id="mm-representation"
        className={`bg-violet-50 border rounded-xl px-4 py-3 text-xs text-violet-800 ${highlightRetrieval ? 'border-violet-300 ring-2 ring-violet-200' : 'border-violet-100'}`}
      >
        本数据集用于 <span className="font-semibold">CLIP 图文对比学习</span>（image encoder + text encoder + InfoNCE）。
        下列为样例图文对；完整字段与 JSONL 样例见 <span className="font-mono">samples/clip/</span>。
        {highlightRetrieval && (
          <span className="block mt-1.5 text-violet-700 font-medium">
            跨模态表示 · 统一语义空间：图像与文本映射到同一向量空间，支持以文搜图 / 以图搜文。
          </span>
        )}
      </div>
      {/* Sample pairs · 关联关系推理与补全 */}
      <div
        id="mm-link-inference"
        className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${highlightLinkInference ? 'ring-2 ring-violet-300' : ''}`}
      >
        {highlightLinkInference && (
          <div className="px-5 py-2.5 bg-violet-50 border-b border-violet-100 text-xs text-violet-800">
            <span className="font-semibold">关联关系推理与补全</span>：基于已学习的跨模态表示，推理并预测数据集中可能缺失的图文链接，自动补全 caption 与跨模态关联。
          </div>
        )}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-800 flex-1">CLIP 图文对样本</div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-violet-400 w-52"
              placeholder="搜索描述或标签…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <button onClick={onUpload}
            className="text-sm px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
            <Upload size={13} /> 导入数据
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
                      <span className="text-xs">正在推理跨模态链接并补全…</span>
                      <span className="inline-block w-1 h-3.5 bg-violet-400 animate-pulse rounded-sm" />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-snug line-clamp-2 mb-1.5">{pair.caption}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {pair.split && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        pair.split === 'train' ? 'bg-emerald-50 text-emerald-700' : pair.split === 'val' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>{pair.split}</span>
                    )}
                    {pair.lang && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md">{pair.lang}</span>}
                    {typeof pair.clipScore === 'number' && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-md tabular-nums">CLIP {pair.clipScore.toFixed(2)}</span>
                    )}
                    {pair.tags.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-md">{t}</span>
                    ))}
                    <span className="text-xs text-gray-400 ml-auto">{pair.source}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end justify-between gap-1">
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400"><Eye size={13} /></button>
                  <button
                    onClick={() => inferAndCompleteLink(pair.id)}
                    disabled={isGenerating}
                    title="基于跨模态表示推理缺失链接并补全描述"
                    className="flex items-center gap-1 text-[10px] px-2 py-1 border border-violet-200 text-violet-600 hover:bg-violet-50 disabled:opacity-40 rounded-lg transition-colors max-w-[7.5rem] text-center leading-tight"
                  >
                    {isGenerating ? <RefreshCw size={10} className="animate-spin flex-shrink-0" /> : <Sparkles size={10} className="flex-shrink-0" />}
                    {isGenerating ? '推理中' : '关联关系推理与补全'}
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
      <StorageIndexPanel ds={ds} highlight={highlightIndex} />
      <RetrievalPanel ds={ds} highlightIndex={highlightIndex} />
    </div>
  );
}

function PreprocessPanel({ ds, highlight }: { ds: MultimodalDataset; highlight?: boolean }) {
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
    <div id="mm-preprocess" className={`space-y-4 ${highlight ? 'ring-2 ring-violet-200 rounded-xl p-1' : ''}`}>
      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-xs text-violet-800">
        <span className="font-semibold">数据预处理与对齐工具</span>：提供标准化清洗、格式转换与跨模态数据对齐预处理流水线。
      </div>
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

function toggleInList(list: string[], value: string) {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
}

function MetadataPanel({
  ds,
  onSave,
  highlight,
}: {
  ds: MultimodalDataset;
  onSave: (patch: { metadata: DatasetMetadata; taxonomy: DatasetTaxonomy; description: string }) => void;
  highlight?: 'tags' | 'form' | null;
}) {
  const [metadata, setMetadata] = useState<DatasetMetadata>(ds.metadata);
  const [taxonomy, setTaxonomy] = useState<DatasetTaxonomy>(ds.taxonomy);
  const [extraTagInput, setExtraTagInput] = useState('');
  const [saved, setSaved] = useState(false);

  const setMeta = (key: keyof DatasetMetadata, value: string) =>
    setMetadata(prev => ({ ...prev, [key]: value }));

  const addExtraTag = () => {
    const t = extraTagInput.trim();
    if (!t || taxonomy.extraTags.includes(t)) return;
    setTaxonomy(prev => ({ ...prev, extraTags: [...prev.extraTags, t] }));
    setExtraTagInput('');
  };

  const handleSave = () => {
    if (!metadata.source.trim() || !metadata.creator.trim()) return;
    const nextTaxonomy: DatasetTaxonomy = {
      ...taxonomy,
      modalities: taxonomy.modalities.filter((m): m is Modality => m === 'image' || m === 'text'),
    };
    onSave({ metadata, taxonomy: nextTaxonomy, description: metadata.description });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const canSaveMeta = !!metadata.source.trim() && !!metadata.creator.trim();

  return (
    <div className="space-y-4">
      <div
        id="mm-metadata-tags"
        className={`bg-white border rounded-xl p-5 ${highlight === 'tags' ? 'border-violet-300 ring-2 ring-violet-200' : 'border-gray-200'}`}
      >
        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag size={15} className="text-violet-500" /> 多维度标签分类
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">领域</div>
            <div className="flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map(d => {
                const on = taxonomy.domains.includes(d);
                return (
                  <button key={d} type="button" onClick={() => setTaxonomy(prev => ({ ...prev, domains: toggleInList(prev.domains, d) }))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${on ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">任务类型</div>
            <div className="flex flex-wrap gap-2">
              {TASK_OPTIONS.map(t => {
                const on = taxonomy.tasks.includes(t);
                return (
                  <button key={t} type="button" onClick={() => setTaxonomy(prev => ({ ...prev, tasks: toggleInList(prev.tasks, t) }))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${on ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">数据模态</div>
            <div className="flex flex-wrap gap-2">
              {(['image', 'text'] as Modality[]).map(m => {
                const on = taxonomy.modalities.includes(m);
                const labels: Record<Modality, string> = { image: '图像', text: '文本' };
                return (
                  <button key={m} type="button" onClick={() => setTaxonomy(prev => ({ ...prev, modalities: toggleInList(prev.modalities, m) as Modality[] }))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${on ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {labels[m]}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">多模态数据集仅标记图像与文本，不包含音频、视频。</p>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">自定义标签</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {taxonomy.extraTags.map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                  {t}
                  <button type="button" onClick={() => setTaxonomy(prev => ({ ...prev, extraTags: prev.extraTags.filter(x => x !== t) }))}
                    className="text-gray-400 hover:text-gray-600"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={extraTagInput} onChange={e => setExtraTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExtraTag()}
                placeholder="输入标签后回车添加"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
              <button type="button" onClick={addExtraTag}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">添加</button>
            </div>
          </div>
        </div>
      </div>

      <div
        id="mm-metadata-form"
        className={`bg-white border rounded-xl p-5 ${highlight === 'form' ? 'border-violet-300 ring-2 ring-violet-200' : 'border-gray-200'}`}
      >
        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList size={15} className="text-violet-500" /> 数据集元数据
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">描述</label>
            <textarea value={metadata.description} onChange={e => setMeta('description', e.target.value)} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">来源 <span className="text-red-400">*</span></label>
            <input value={metadata.source} onChange={e => setMeta('source', e.target.value)}
              placeholder="数据出处，如公开论文附图、内部采集平台"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><User size={11} /> 创建者 <span className="text-red-400">*</span></label>
            <input value={metadata.creator} onChange={e => setMeta('creator', e.target.value)}
              placeholder="个人或团队"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><Calendar size={11} /> 发布日期</label>
            <input type="date" value={metadata.publishedAt} onChange={e => setMeta('publishedAt', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">许可协议</label>
            <input value={metadata.license} onChange={e => setMeta('license', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">主页 / 文档链接</label>
            <input value={metadata.homepage} onChange={e => setMeta('homepage', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={!canSaveMeta}
            className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5">
            <Check size={13} /> 保存元数据
          </button>
          {!canSaveMeta && <span className="text-xs text-amber-600">来源与创建者均为必填</span>}
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> 已保存</span>}
        </div>
      </div>
    </div>
  );
}

function EvaluationPanel({
  ds,
  onEvaluated,
  highlight,
}: {
  ds: MultimodalDataset;
  onEvaluated: (evaluation: DatasetEvaluation) => void;
  highlight?: 'stats' | 'quality' | 'benchmark' | null;
}) {
  const ev = ds.evaluation;
  const [running, setRunning] = useState(false);
  const maxBin = Math.max(...ev.degreeBins.map(b => b.value), 1);
  const benchmarks = BENCHMARKS.map(b =>
    b.isCurrent
      ? {
          ...b,
          name: `${ds.name}（当前）`,
          density: ev.graphDensity,
          avgDegree: ev.avgDegree,
          completeness: ev.completenessScore,
          quality: ev.qualityScore,
        }
      : b,
  );

  const runEvaluation = () => {
    setRunning(true);
    setTimeout(() => {
      const next: DatasetEvaluation = {
        ...ev,
        missingRate: Math.max(0.5, +(ev.missingRate + (Math.random() - 0.5)).toFixed(1)),
        inconsistencyRate: Math.max(0.3, +(ev.inconsistencyRate + (Math.random() - 0.4)).toFixed(1)),
        duplicateRate: Math.max(0.2, +(ev.duplicateRate + (Math.random() - 0.5)).toFixed(1)),
        completenessScore: Math.min(99, Math.max(70, ev.completenessScore + Math.floor(Math.random() * 5) - 1)),
        qualityScore: Math.min(99, Math.max(70, ev.qualityScore + Math.floor(Math.random() * 5) - 1)),
        lastEvaluatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      };
      onEvaluated(next);
      setRunning(false);
    }, 1200);
  };

  const severityCls = {
    high: 'bg-red-50 text-red-700 border-red-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-100',
    low: 'bg-gray-50 text-gray-600 border-gray-100',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Activity size={15} className="text-violet-500" /> 自动化数据集评估
          </div>
          <div className="text-xs text-gray-400 mt-1">最近评估：{ev.lastEvaluatedAt}</div>
        </div>
        <button type="button" onClick={runEvaluation} disabled={running}
          className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5">
          {running ? <><RefreshCw size={13} className="animate-spin" /> 评估中…</> : <><Gauge size={13} /> 重新评估</>}
        </button>
      </div>

      <div
        id="mm-eval-stats"
        className={`grid grid-cols-4 gap-3 ${highlight === 'stats' ? 'ring-2 ring-violet-200 rounded-xl p-1' : ''}`}
      >
        {[
          { label: '图谱密度', value: ev.graphDensity.toFixed(3) },
          { label: '平均节点度', value: ev.avgDegree.toFixed(1) },
          { label: '完整性得分', value: `${ev.completenessScore}` },
          { label: '质量得分', value: `${ev.qualityScore}` },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className="text-xl font-semibold text-gray-800">{s.value}</div>
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-2 gap-4 ${highlight === 'stats' ? 'ring-2 ring-violet-200 rounded-xl p-1' : ''}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-800 mb-1">统计特征 · 节点度分布</div>
          <div className="text-xs text-gray-400 mb-4">节点 {ev.nodeCount.toLocaleString()} · 边 {ev.edgeCount.toLocaleString()} · 最大度 {ev.maxDegree}</div>
          <div className="space-y-2">
            {ev.degreeBins.map(bin => (
              <div key={bin.label} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-gray-500">{bin.label}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(bin.value / maxBin) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-gray-500">{bin.value}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-800 mb-4">统计特征 · 关系类型分布</div>
          <div className="space-y-3">
            {ev.relationDist.map(r => (
              <div key={r.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-gray-700">{r.type}</span>
                  <span className="text-gray-400">{r.count.toLocaleString()}（{r.pct}%）</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        id="mm-eval-quality"
        className={`bg-white border rounded-xl p-5 ${highlight === 'quality' ? 'border-violet-300 ring-2 ring-violet-200' : 'border-gray-200'}`}
      >
        <div className="text-sm font-semibold text-gray-800 mb-4">数据质量与完整性报告</div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: '缺失率', value: `${ev.missingRate}%`, color: 'text-red-600' },
            { label: '不一致率', value: `${ev.inconsistencyRate}%`, color: 'text-amber-600' },
            { label: '重复率', value: `${ev.duplicateRate}%`, color: 'text-blue-600' },
          ].map(m => (
            <div key={m.label} className="rounded-lg bg-gray-50 px-4 py-3">
              <div className="text-xs text-gray-400">{m.label}</div>
              <div className={`text-lg font-semibold mt-0.5 ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {ev.issues.map(issue => (
            <div key={issue.id} className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${severityCls[issue.severity]}`}>
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-2">
                  {issue.category}
                  <span className="text-xs font-normal opacity-80">{issue.count} 项</span>
                </div>
                <div className="text-xs opacity-80 mt-0.5">{issue.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="mm-eval-benchmark"
        className={`bg-white border rounded-xl overflow-hidden ${highlight === 'benchmark' ? 'border-violet-300 ring-2 ring-violet-200' : 'border-gray-200'}`}
      >
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800">评估基准对比</div>
          <div className="text-xs text-gray-400 mt-0.5">与领域内公开基准数据集的关键指标对比</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left font-medium px-5 py-2.5">数据集</th>
                <th className="text-right font-medium px-4 py-2.5">图谱密度</th>
                <th className="text-right font-medium px-4 py-2.5">平均度</th>
                <th className="text-right font-medium px-4 py-2.5">完整性</th>
                <th className="text-right font-medium px-4 py-2.5">质量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {benchmarks.map(row => (
                <tr key={row.name} className={row.isCurrent ? 'bg-violet-50/60' : ''}>
                  <td className="px-5 py-3 text-gray-800 font-medium">
                    {row.name}
                    {row.isCurrent && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">当前</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.density.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.avgDegree.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.completeness}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.quality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function VersionHistoryPanel({ ds, highlight }: { ds: MultimodalDataset; highlight?: boolean }) {
  const [current, setCurrent] = useState(ds.version);
  return (
    <div id="mm-version-history" className={`space-y-4 ${highlight ? 'ring-2 ring-violet-300 rounded-xl p-1' : ''}`}>
      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-xs text-violet-800">
        <span className="font-semibold">数据版本控制</span>：集成 Git 式版本管理，对多模态数据集每一次变更进行记录。
        当前版本 <span className="font-semibold">{current}</span> · 分支 <span className="font-mono">{ds.branch}</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <GitCommit size={14} className="text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">提交历史</span>
          <span className="text-[11px] text-gray-400 ml-auto">{ds.commits.length} 条</span>
        </div>
        <div className="divide-y divide-gray-50">
          {ds.commits.map((c) => (
            <div key={c.hash} className="px-5 py-3 flex gap-3 hover:bg-gray-50/60">
              <div className="w-1.5 rounded-full bg-violet-300 shrink-0 my-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium text-gray-900">{c.message}</span>
                  {c.tag && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100 flex items-center gap-0.5">
                      <Tag size={9} /> {c.tag}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  <span className="font-mono">{c.hash}</span> · {c.author} · {c.date}
                  {c.added > 0 && <span className="text-emerald-600 ml-2">+{c.added.toLocaleString()}</span>}
                  {c.removed > 0 && <span className="text-rose-500 ml-1">-{c.removed.toLocaleString()}</span>}
                </p>
              </div>
              {c.tag && (
                <button
                  type="button"
                  onClick={() => setCurrent(c.tag!)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border shrink-0 ${
                    current === c.tag
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {current === c.tag ? '当前版本' : '回溯至此'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MultimodalDatasetManagement({
  initialFocus,
  initialBuildFocus,
}: {
  initialFocus?: MultimodalDatasetFocus | null;
  /** @deprecated 使用 initialFocus */
  initialBuildFocus?: MultimodalDatasetFocus | null;
}) {
  const focus = initialFocus ?? initialBuildFocus ?? null;

  const [datasets, setDatasets] = useState<MultimodalDataset[]>(MOCK_DATASETS);
  const [selectedId, setSelectedId] = useState('ds1');
  const [activeTab, setActiveTab] = useState<DatasetTab>(resolveDatasetTab(focus));
  const [showNewDataset, setShowNewDataset] = useState(false);
  const [showUpload, setShowUpload] = useState(
    focus === 'import' || focus === 'wizard' || focus === 'cross-modal-link',
  );
  const [catalogQuery, setCatalogQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState<string>('全部');
  const [filterTask, setFilterTask] = useState<string>('全部');
  const [filterModality, setFilterModality] = useState<Modality | '全部'>('全部');

  useEffect(() => {
    if (!focus) return;
    setActiveTab(resolveDatasetTab(focus));
    setShowUpload(focus === 'import' || focus === 'wizard' || focus === 'cross-modal-link');
  }, [focus]);

  useEffect(() => {
    if (!focus) return;
    const sectionId = FOCUS_SECTION_IDS[focus];
    if (!sectionId) return;
    const delay = focus === 'import' || focus === 'wizard' || focus === 'cross-modal-link' ? 450 : 250;
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [focus, activeTab, showUpload]);
  const selected = datasets.find(d => d.id === selectedId) || datasets[0];

  const filteredDatasets = datasets.filter(ds => {
    const q = catalogQuery.trim().toLowerCase();
    const hitQuery = !q || [
      ds.name,
      ds.description,
      ds.metadata.description,
      ds.metadata.source,
      ds.metadata.creator,
      ...ds.taxonomy.domains,
      ...ds.taxonomy.tasks,
      ...ds.taxonomy.extraTags,
    ].some(s => s.toLowerCase().includes(q));
    const hitDomain = filterDomain === '全部' || ds.taxonomy.domains.includes(filterDomain);
    const hitTask = filterTask === '全部' || ds.taxonomy.tasks.includes(filterTask);
    const hitModality = filterModality === '全部' || ds.taxonomy.modalities.includes(filterModality) || ds.modalities.includes(filterModality);
    return hitQuery && hitDomain && hitTask && hitModality;
  });

  const createDataset = (name: string, desc: string, source: string, creator: string) => {
    const id = 'ds_' + Date.now();
    const newDs: MultimodalDataset = {
      id, name, description: desc,
      modalities: ['image', 'text'],
      pairCount: 0, size: '0 B', version: 'v1.0.0', branch: 'main',
      updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: 'active', starred: false,
      pairs: [], commits: [], preprocessJobs: [], indexConfig: null,
      metadata: {
        description: desc,
        source,
        creator,
        publishedAt: new Date().toISOString().slice(0, 10),
        license: '',
        homepage: '',
      },
      taxonomy: {
        domains: [],
        tasks: [],
        modalities: ['image', 'text'],
        extraTags: [],
      },
      evaluation: {
        ...DEFAULT_EVALUATION,
        nodeCount: 0,
        edgeCount: 0,
        missingRate: 0,
        inconsistencyRate: 0,
        duplicateRate: 0,
        completenessScore: 100,
        qualityScore: 100,
        issues: [],
        lastEvaluatedAt: '尚未评估',
      },
    };
    setDatasets(prev => [...prev, newDs]);
    setSelectedId(id);
    setActiveTab('metadata');
  };

  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const jumpToMgmt = (cap: typeof MGMT_CAPABILITIES[number]) => {
    setActiveTab(cap.tab);
    scrollToSection(cap.sectionId);
  };

  const isMgmtFocus = focus === 'version' || focus === 'preprocess' || focus === 'index';

  const tabs: { id: DatasetTab; label: string; icon: any }[] = [
    { id: 'overview', label: '数据概览', icon: BarChart3 },
    { id: 'metadata', label: '分类与元数据', icon: ClipboardList },
    { id: 'evaluation', label: '数据集评估', icon: Gauge },
    { id: 'preprocess', label: '数据预处理与对齐', icon: Cpu },
    { id: 'version', label: '数据版本控制', icon: GitBranch },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {showNewDataset && <NewDatasetDialog onClose={() => setShowNewDataset(false)} onCreate={createDataset} />}
      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          highlightWizard={focus === 'wizard'}
          initialUploadMode={focus === 'cross-modal-link' ? 'label' : 'pairs'}
          highlightCrossModalLink={focus === 'cross-modal-link'}
        />
      )}

      {/* Left sidebar: catalog + search */}
      <div
        id="mm-catalog"
        className={`w-72 flex-shrink-0 border-r bg-white flex flex-col ${focus === 'catalog' ? 'border-violet-300 ring-2 ring-inset ring-violet-200' : 'border-gray-200'}`}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">多模态数据集</div>
          <button onClick={() => setShowNewDataset(true)}
            className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="px-4 py-2 bg-violet-50/70 border-b border-violet-100 text-[11px] text-violet-800 leading-relaxed">
          面向 <span className="font-semibold">CLIP 图文对比训练</span>。样例契约见仓库 <span className="font-mono">samples/clip/</span>，供后端对照接入。
        </div>

        <div className="px-3 py-3 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={catalogQuery}
              onChange={e => setCatalogQuery(e.target.value)}
              placeholder="关键词搜索数据集…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400"
            />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-violet-400">
              <option value="全部">分类目录 · 全部领域</option>
              {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterTask} onChange={e => setFilterTask(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-violet-400">
              <option value="全部">全部任务类型</option>
              {TASK_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterModality} onChange={e => setFilterModality(e.target.value as Modality | '全部')}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-violet-400">
              <option value="全部">全部模态</option>
              <option value="image">图像</option>
              <option value="text">文本</option>
            </select>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Filter size={11} /> {filteredDatasets.length} / {datasets.length} 个数据集
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredDatasets.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-8 px-2">没有匹配的数据集，请调整分类或关键词</div>
          )}
          {filteredDatasets.map(ds => (
            <div key={ds.id} onClick={() => setSelectedId(ds.id)}
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
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {ds.taxonomy.domains.slice(0, 2).map(d => (
                      <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">{d}</span>
                    ))}
                    {ds.taxonomy.tasks.slice(0, 1).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {ds.modalities.map(m => <ModalityBadge key={m} m={m} />)}
                  </div>
                  <div className="mt-1.5">
                    <ProvenanceMarks source={ds.metadata.source} creator={ds.metadata.creator} compact />
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
        {focus && MULTIMODAL_FOCUS_LABELS[focus] && (
          <div className="flex-shrink-0 px-4 py-2 bg-violet-50 border-b border-violet-100 text-xs text-violet-800 flex items-center gap-2">
            <Sparkles size={14} className="flex-shrink-0 text-violet-600" />
            <span>
              审计聚焦：<strong>{MULTIMODAL_FOCUS_LABELS[focus]}</strong>
              · 已跳转至多模态数据集对应模块
            </span>
          </div>
        )}
        {selected ? (
          <>
            {/* Dataset header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-gray-900">{selected.name}</h2>
                    <StatusBadge status={selected.status} />
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1 ${focus === 'version' ? 'ring-2 ring-violet-300' : ''}`}>
                      <GitBranch size={10} /> {selected.branch}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 ${focus === 'version' ? 'ring-2 ring-violet-300' : ''}`}>{selected.version}</span>
                  </div>
                  <p className="text-xs text-gray-500 max-w-2xl">{selected.description}</p>
                  <div className="mt-2">
                    <ProvenanceMarks source={selected.metadata.source} creator={selected.metadata.creator} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.taxonomy.domains.map(d => (
                      <span key={d} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{d}</span>
                    ))}
                    {selected.taxonomy.tasks.map(t => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1.5">
                    <Download size={13} /> 导出
                  </button>
                  <button onClick={() => setShowUpload(true)}
                    className="text-sm px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-1.5">
                    <Upload size={13} /> 导入数据
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 mt-4 border-b -mb-px overflow-x-auto">
                {tabs.map(tab => {
                  const tabFocused =
                    (tab.id === 'version' && focus === 'version')
                    || (tab.id === 'preprocess' && focus === 'preprocess')
                    || (tab.id === 'overview' && focus === 'index');
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 text-sm px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-violet-600 text-violet-700 font-medium'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      } ${tabFocused ? 'ring-2 ring-violet-200 ring-inset rounded-t-lg' : ''}`}>
                      <tab.icon size={14} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* 多模态数据集管理 */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-[11px] font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                  <Package size={12} /> 多模态数据集管理
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {MGMT_CAPABILITIES.map(cap => (
                    <button
                      key={cap.focus}
                      type="button"
                      onClick={() => jumpToMgmt(cap)}
                      className={`text-left border rounded-xl px-3 py-2.5 transition-colors ${
                        focus === cap.focus || (isMgmtFocus && activeTab === cap.tab && focus === cap.focus)
                          ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'
                          : 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <cap.icon size={12} className="text-violet-600" />
                        <span className="text-xs font-semibold text-gray-800">{cap.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-snug">{cap.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <OverviewPanel
                  ds={selected}
                  onUpload={() => setShowUpload(true)}
                  highlightRetrieval={focus === 'representation'}
                  highlightIndex={focus === 'index'}
                  highlightLinkInference={focus === 'link-inference'}
                />
              )}
              {activeTab === 'metadata' && (
                <MetadataPanel
                  key={selected.id}
                  ds={selected}
                  highlight={
                    focus === 'metadata-tags' ? 'tags' : focus === 'metadata-form' ? 'form' : null
                  }
                  onSave={({ metadata, taxonomy, description }) =>
                    updateDataset(selected.id, {
                      metadata,
                      taxonomy,
                      description,
                      modalities: taxonomy.modalities.length ? taxonomy.modalities : selected.modalities,
                    })
                  }
                />
              )}
              {activeTab === 'evaluation' && (
                <EvaluationPanel
                  key={selected.id}
                  ds={selected}
                  highlight={
                    focus === 'eval-stats'
                      ? 'stats'
                      : focus === 'eval-quality'
                        ? 'quality'
                        : focus === 'eval-benchmark'
                          ? 'benchmark'
                          : null
                  }
                  onEvaluated={evaluation => updateDataset(selected.id, { evaluation })}
                />
              )}
              {activeTab === 'preprocess' && (
                <PreprocessPanel ds={selected} highlight={focus === 'preprocess'} />
              )}
              {activeTab === 'version' && (
                <VersionHistoryPanel ds={selected} highlight={focus === 'version'} />
              )}
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
