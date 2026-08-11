import { useState, useMemo } from 'react';
import {
  ArrowLeft, File, Upload, Download, Trash2, Calendar, HardDrive, CheckCircle, Eye, Code,
  Star, GitCommit, Scissors, RotateCcw, ChevronDown, ChevronRight, AlertTriangle, Info,
  Plus, X, Filter, BarChart2, Clock, User, Search, Tag, Folder, Globe, Cpu, BookOpen, Award,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

// ── types ─────────────────────────────────────────────────────────────────────

type ConfidenceGrade = 'A' | 'B' | 'C' | 'D' | 'unrated';
type SourceType = '专家审核' | '人工标注' | '众包标注' | '自动标注';
type SimilarityLabel = 'similar' | 'dissimilar' | 'uncertain';

interface EntityAttr {
  id: string; name: string; type: string; description: string;
}
interface EntityPair {
  id: string; entityA: EntityAttr; entityB: EntityAttr;
  originalLabel: SimilarityLabel; confidence: number;
}

interface Dataset {
  id: string;
  name: string;
  size: string;
  records: number;
  uploadDate: string;
  status: 'ready' | 'processing' | 'error';
  format: string;
  description: string;
  usedBy: string[];
  sampleData?: string;
  sourceType: SourceType;
  confidenceGrade: ConfidenceGrade;
}

interface VersionEntry {
  version: string;
  op: '创建' | '标注' | '修正' | '回滚' | '审核通过';
  operator: string;
  timestamp: string;
  changes: number;
  note: string;
}

// ── mock data ─────────────────────────────────────────────────────────────────

const datasetsByCategory: Record<string, Dataset[]> = {
  'entity-extraction': [
    {
      id: 'dataset-1', name: 'medical_entities_training.jsonl',
      size: '45.2 MB', records: 12500, uploadDate: '2026-04-15', status: 'ready',
      format: 'JSONL', sourceType: '专家审核', confidenceGrade: 'A',
      description: '医疗领域实体标注数据，包含疾病、药物、症状等实体类型',
      usedBy: ['BERT-LSTM-CRF'],
      sampleData: '```json\n{\n  "text": "患者服用阿司匹林后出现头痛症状",\n  "entities": [\n    {"text": "阿司匹林", "type": "DRUG", "start": 4, "end": 8},\n    {"text": "头痛", "type": "SYMPTOM", "start": 11, "end": 13}\n  ]\n}\n```',
    },
    {
      id: 'dataset-3', name: 'tech_literature_entities.csv',
      size: '15.3 MB', records: 5600, uploadDate: '2026-04-10', status: 'ready',
      format: 'CSV', sourceType: '人工标注', confidenceGrade: 'B',
      description: '科技文献实体标注数据集',
      usedBy: ['LSTM-CRF'],
      sampleData: '```csv\ntext,entities\n"深度学习在自然语言处理中的应用","..."\n```',
    },
    {
      id: 'dataset-7', name: 'general_ner_dataset.jsonl',
      size: '68.5 MB', records: 18000, uploadDate: '2026-04-01', status: 'ready',
      format: 'JSONL', sourceType: '众包标注', confidenceGrade: 'C',
      description: '通用领域实体识别数据集，包含人名、地名、机构名等',
      usedBy: [],
      sampleData: '```json\n{\n  "text": "张三在北京大学工作",\n  "entities": [\n    {"text": "张三", "type": "PER"},\n    {"text": "北京大学", "type": "ORG"}\n  ]\n}\n```',
    },
  ],
  'relation-extraction': [
    {
      id: 'dataset-2', name: 'relation_extraction_data.jsonl',
      size: '28.7 MB', records: 8300, uploadDate: '2026-04-12', status: 'ready',
      format: 'JSONL', sourceType: '人工标注', confidenceGrade: 'B',
      description: '关系抽取标注数据，包含实体对和关系类型标注',
      usedBy: ['BERT-based Relation Extraction'],
      sampleData: '```json\n{"text": "张三在北京大学工作", "relation": "work_at"}\n```',
    },
    {
      id: 'dataset-8', name: 'knowledge_triple_data.jsonl',
      size: '35.2 MB', records: 10500, uploadDate: '2026-03-28', status: 'ready',
      format: 'JSONL', sourceType: '自动标注', confidenceGrade: 'D',
      description: '知识三元组数据，用于关系抽取模型训练',
      usedBy: ['CNN-based Relation Extraction'],
      sampleData: '```json\n{"text": "苹果公司由史蒂夫·乔布斯创立于1976年", "relation": "founded_by"}\n```',
    },
  ],
  'entity-linking': [
    {
      id: 'dataset-4', name: 'entity_linking_train.jsonl',
      size: '52.1 MB', records: 15200, uploadDate: '2026-04-08', status: 'ready',
      format: 'JSONL', sourceType: '专家审核', confidenceGrade: 'A',
      description: '实体链接训练数据，包含候选实体和正确链接标注',
      usedBy: ['Neural Disambiguation'],
      sampleData: '```json\n{"mention": "苹果", "correct_entity": "entity_fruit_apple"}\n```',
    },
    {
      id: 'dataset-9', name: 'disambiguation_dataset.jsonl',
      size: '41.8 MB', records: 13600, uploadDate: '2026-03-22', status: 'ready',
      format: 'JSONL', sourceType: '众包标注', confidenceGrade: 'C',
      description: '实体消歧数据集，包含多义词消歧标注',
      usedBy: [],
      sampleData: '```json\n{"mention": "华为", "correct_entity": "entity_huawei_brand"}\n```',
    },
  ],
  'knowledge-reasoning': [
    {
      id: 'dataset-10', name: 'reasoning_rules.jsonl',
      size: '12.3 MB', records: 3500, uploadDate: '2026-04-03', status: 'ready',
      format: 'JSONL', sourceType: '人工标注', confidenceGrade: 'B',
      description: '知识推理规则数据，包含事实三元组和推理路径',
      usedBy: ['Neural Reasoning'],
      sampleData: '```json\n{"premise": [...], "conclusion": {...}, "confidence": 0.85}\n```',
    },
  ],
  'graph-embedding': [
    {
      id: 'dataset-5', name: 'graph_embedding_samples.txt',
      size: '102.5 MB', records: 35000, uploadDate: '2026-04-05', status: 'ready',
      format: 'TXT', sourceType: '自动标注', confidenceGrade: 'C',
      description: '图结构数据，用于图嵌入模型训练',
      usedBy: ['Node2Vec', 'GraphSAGE'],
      sampleData: '```txt\nnode1 node2 0.8\nnode1 node3 0.6\n```',
    },
    {
      id: 'dataset-11', name: 'knowledge_graph_structure.txt',
      size: '85.6 MB', records: 28000, uploadDate: '2026-03-18', status: 'ready',
      format: 'TXT', sourceType: '人工标注', confidenceGrade: 'B',
      description: '知识图谱结构数据，用于图嵌入训练',
      usedBy: ['Node2Vec'],
      sampleData: '```txt\n张三 work_at 北京大学\n```',
    },
  ],
  'entity-similarity': [
    {
      id: 'sim-dataset-1', name: 'enterprise_entity_pairs.jsonl',
      size: '28.4 MB', records: 3500, uploadDate: '2026-04-20', status: 'ready',
      format: 'JSONL', sourceType: '人工标注', confidenceGrade: 'B',
      description: '企业领域实体相似度标注数据集，包含公司、人物、产品等实体对的相似与不相似标注',
      usedBy: ['SimCSE', '实体对齐'],
      sampleData: '```json\n{"entityA": {"name": "苹果公司", "type": "机构"}, "entityB": {"name": "Apple Inc.", "type": "机构"}, "label": "similar", "confidence": 0.98}\n```',
    },
    {
      id: 'sim-dataset-2', name: 'biomedical_entity_pairs.jsonl',
      size: '19.7 MB', records: 2800, uploadDate: '2026-04-18', status: 'ready',
      format: 'JSONL', sourceType: '专家审核', confidenceGrade: 'A',
      description: '生物医疗领域实体相似度标注数据集，包含药物、疾病、症状等实体对的相似与不相似标注',
      usedBy: ['医疗实体链接'],
      sampleData: '```json\n{"entityA": {"name": "阿司匹林", "type": "药品"}, "entityB": {"name": "乙酰水杨酸", "type": "药品"}, "label": "similar", "confidence": 0.96}\n```',
    },
  ],
};

const VERSIONS_BY_DATASET: Record<string, VersionEntry[]> = {
  'dataset-1': [
    { version: 'v1.4', op: '审核通过', operator: '王医师', timestamp: '2026-04-15 14:32', changes: 0, note: '专家复核全部通过，标记为 A 级数据源' },
    { version: 'v1.3', op: '修正', operator: '李标注员', timestamp: '2026-04-14 09:15', changes: 238, note: '修正 238 条实体边界偏移问题' },
    { version: 'v1.2', op: '标注', operator: '张标注员', timestamp: '2026-04-12 16:40', changes: 1520, note: '新增 1520 条医疗实体标注' },
    { version: 'v1.1', op: '修正', operator: '李标注员', timestamp: '2026-04-10 11:00', changes: 86, note: '修正重复记录 86 条' },
    { version: 'v1.0', op: '创建', operator: '系统', timestamp: '2026-04-08 09:00', changes: 10656, note: '初始版本，导入原始数据' },
  ],
  'dataset-3': [
    { version: 'v2.1', op: '修正', operator: '陈研究员', timestamp: '2026-04-10 15:22', changes: 112, note: '修正科技术语边界标注 112 条' },
    { version: 'v2.0', op: '标注', operator: '王标注员', timestamp: '2026-04-08 10:00', changes: 900, note: '第二轮人工标注，新增 900 条' },
    { version: 'v1.0', op: '创建', operator: '系统', timestamp: '2026-04-05 09:00', changes: 4700, note: '初始版本' },
  ],
  'dataset-7': [
    { version: 'v1.1', op: '修正', operator: '质检机器人', timestamp: '2026-04-03 08:00', changes: 340, note: '自动质检修正 340 条低置信度标注' },
    { version: 'v1.0', op: '创建', operator: '众包平台', timestamp: '2026-04-01 00:00', changes: 18000, note: '众包平台批量导入' },
  ],
};

const DEFAULT_VERSIONS: VersionEntry[] = [
  { version: 'v1.1', op: '修正', operator: '管理员', timestamp: '2026-04-01 10:00', changes: 50, note: '例行质检修正' },
  { version: 'v1.0', op: '创建', operator: '系统', timestamp: '2026-03-28 09:00', changes: 0, note: '初始版本' },
];

const categoryInfo: Record<string, { name: string; description: string }> = {
  'entity-extraction': { name: '实体抽取数据集', description: '用于训练实体识别模型的标注数据' },
  'relation-extraction': { name: '关系抽取数据集', description: '用于训练关系分类模型的数据' },
  'entity-linking': { name: '实体消歧数据集', description: '用于训练实体链接模型的数据' },
  'knowledge-reasoning': { name: '知识推理数据集', description: '用于训练推理模型的数据' },
  'graph-embedding': { name: '图嵌入数据集', description: '用于训练图嵌入模型的图结构数据' },
  'entity-similarity': { name: '相似度计算数据集', description: '已标注的相似与不相似实体对，用于训练实体相似度计算模型' },
};

// ── helpers ───────────────────────────────────────────────────────────────────

const GRADE_CONFIG: Record<ConfidenceGrade, { label: string; color: string; bg: string; border: string; desc: string; stars: number }> = {
  A: { label: 'A 级', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', desc: '专家审核，可信度极高', stars: 5 },
  B: { label: 'B 级', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300',    desc: '人工标注，可信度较高', stars: 4 },
  C: { label: 'C 级', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300',   desc: '众包标注，需人工复核', stars: 2 },
  D: { label: 'D 级', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-300',     desc: '自动标注，置信度较低', stars: 1 },
  unrated: { label: '未评级', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', desc: '尚未设置置信度等级', stars: 0 },
};

const SOURCE_TYPE_COLOR: Record<SourceType, string> = {
  '专家审核': 'bg-emerald-100 text-emerald-700',
  '人工标注': 'bg-blue-100 text-blue-700',
  '众包标注': 'bg-amber-100 text-amber-700',
  '自动标注': 'bg-red-100 text-red-700',
};

const OP_COLOR: Record<string, string> = {
  '创建': 'bg-gray-100 text-gray-600',
  '标注': 'bg-blue-100 text-blue-700',
  '修正': 'bg-amber-100 text-amber-700',
  '回滚': 'bg-red-100 text-red-600',
  '审核通过': 'bg-emerald-100 text-emerald-700',
};

function GradeStars({ grade }: { grade: ConfidenceGrade }) {
  const cfg = GRADE_CONFIG[grade];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= cfg.stars ? 'fill-current text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function DatasetListPanel({ datasets, onViewSample }: { datasets: Dataset[]; onViewSample: (s: string) => void }) {
  return (
    <div className="space-y-4">
      {datasets.map(dataset => {
        const gradeCfg = GRADE_CONFIG[dataset.confidenceGrade];
        return (
          <div key={dataset.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <File className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900">{dataset.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{dataset.format}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_TYPE_COLOR[dataset.sourceType]}`}>{dataset.sourceType}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${gradeCfg.bg} ${gradeCfg.color} ${gradeCfg.border}`}>
                      {gradeCfg.label}
                    </span>
                    {dataset.status === 'ready' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        <CheckCircle className="w-3 h-3" />就绪
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{dataset.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" />{dataset.size}</span>
                    <span className="flex items-center gap-1.5"><File className="w-3.5 h-3.5" />{dataset.records.toLocaleString()} 条</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{dataset.uploadDate}</span>
                  </div>
                  {dataset.usedBy.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">使用算法:</span>
                      {dataset.usedBy.map((a, i) => <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">{a}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {dataset.sampleData && (
                  <button onClick={() => onViewSample(dataset.sampleData!)}
                    className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm">
                    <Code className="w-4 h-4" />示例
                  </button>
                )}
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceRatingPanel({ datasets, grades, onChangeGrade }: {
  datasets: Dataset[];
  grades: Record<string, ConfidenceGrade>;
  onChangeGrade: (id: string, grade: ConfidenceGrade) => void;
}) {
  const GRADES: ConfidenceGrade[] = ['A', 'B', 'C', 'D'];
  const SOURCE_TYPES: SourceType[] = ['专家审核', '人工标注', '众包标注', '自动标注'];

  const gradeCount = GRADES.reduce((acc, g) => {
    acc[g] = datasets.filter(d => (grades[d.id] ?? d.confidenceGrade) === g).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">数据源置信度评级</h3>
        <p className="text-sm text-gray-500 mt-0.5">为每个数据源设置置信度等级，影响下游数据集构建时的筛选优先级</p>
      </div>

      {/* grade legend */}
      <div className="grid grid-cols-4 gap-3">
        {GRADES.map(g => {
          const cfg = GRADE_CONFIG[g];
          return (
            <div key={g} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                <span className={`text-lg font-bold ${cfg.color}`}>{gradeCount[g] ?? 0}</span>
              </div>
              <GradeStars grade={g} />
              <p className="text-xs text-gray-600 mt-1.5">{cfg.desc}</p>
            </div>
          );
        })}
      </div>

      {/* per-dataset rating */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 grid grid-cols-12 text-xs font-semibold text-gray-600">
          <span className="col-span-4">数据集</span>
          <span className="col-span-2">数据源类型</span>
          <span className="col-span-2 text-center">记录数</span>
          <span className="col-span-4 text-center">置信度等级</span>
        </div>
        <div className="divide-y divide-gray-100">
          {datasets.map(ds => {
            const currentGrade = grades[ds.id] ?? ds.confidenceGrade;
            const cfg = GRADE_CONFIG[currentGrade];
            return (
              <div key={ds.id} className="px-5 py-3.5 grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ds.name}</p>
                  <p className="text-xs text-gray-400">{ds.format} · {ds.size}</p>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_TYPE_COLOR[ds.sourceType]}`}>{ds.sourceType}</span>
                </div>
                <div className="col-span-2 text-center text-sm text-gray-700">{ds.records.toLocaleString()}</div>
                <div className="col-span-4 flex items-center justify-center gap-1.5">
                  {GRADES.map(g => {
                    const gcfg = GRADE_CONFIG[g];
                    const active = currentGrade === g;
                    return (
                      <button key={g} onClick={() => onChangeGrade(ds.id, g)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-all ${active ? `${gcfg.bg} ${gcfg.color} ${gcfg.border} shadow-sm` : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
                        {g}
                      </button>
                    );
                  })}
                  <div className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                    <GradeStars grade={currentGrade} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* recommended mapping */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">推荐评级参考</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-xs">
              {SOURCE_TYPES.map((st, i) => {
                const grade = (['A', 'B', 'C', 'D'] as const)[i];
                const gcfg = GRADE_CONFIG[grade];
                return (
                  <span key={st}>{st} → <span className={`font-semibold ${gcfg.color}`}>{gcfg.label}</span>（{gcfg.desc}）</span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VersionControlPanel({ datasets }: { datasets: Dataset[] }) {
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id ?? '');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);
  const [rolledBack, setRolledBack] = useState<Record<string, string>>({});

  const versions = VERSIONS_BY_DATASET[selectedDatasetId] ?? DEFAULT_VERSIONS;
  const currentVersion = rolledBack[selectedDatasetId] ?? versions[0]?.version ?? '';
  const dataset = datasets.find(d => d.id === selectedDatasetId);

  const confirmRollback = (version: string) => {
    setRolledBack(prev => ({ ...prev, [selectedDatasetId]: version }));
    setRollbackTarget(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">标注数据版本控制</h3>
        <p className="text-sm text-gray-500 mt-0.5">记录所有标注和修正操作，支持查看历史版本与一键回滚</p>
      </div>

      {/* dataset selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 flex-shrink-0">选择数据集</label>
        <select value={selectedDatasetId} onChange={e => { setSelectedDatasetId(e.target.value); setExpandedVersion(null); }}
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
          {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {dataset && (
          <span className="text-xs text-gray-500">当前版本：<span className="font-semibold text-gray-800">{currentVersion}</span></span>
        )}
      </div>

      {/* version timeline */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">版本历史（{versions.length} 条）</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />按时间倒序
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {versions.map((v, idx) => {
            const isCurrent = v.version === currentVersion;
            const isExpanded = expandedVersion === v.version;
            return (
              <div key={v.version} className={`${isCurrent ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'} transition-colors`}>
                <div className="px-5 py-3.5 flex items-start gap-4">
                  {/* timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1">
                    <div className={`w-3 h-3 rounded-full border-2 ${isCurrent ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'}`} />
                    {idx < versions.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[16px]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>{v.version}</span>
                      {isCurrent && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">当前</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OP_COLOR[v.op]}`}>{v.op}</span>
                      {v.changes > 0 && <span className="text-xs text-gray-500">{v.changes.toLocaleString()} 条变更</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{v.operator}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{v.timestamp}</span>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700">{v.note}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setExpandedVersion(isExpanded ? null : v.version)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                      <Eye className="w-3.5 h-3.5" />详情
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {!isCurrent && (
                      <button onClick={() => setRollbackTarget(v.version)}
                        className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50 border border-amber-200">
                        <RotateCcw className="w-3.5 h-3.5" />回滚至此
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* rollback confirm dialog */}
      {rollbackTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">确认版本回滚</h4>
                <p className="text-sm text-gray-600 mt-1">
                  将把 <strong>{dataset?.name}</strong> 回滚至 <strong>{rollbackTarget}</strong>。当前版本（{currentVersion}）的所有变更将被还原，此操作会生成新的回滚版本记录。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRollbackTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                取消
              </button>
              <button onClick={() => confirmRollback(rollbackTarget)}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium">
                确认回滚
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DatasetSplitPanel({ datasets, grades }: { datasets: Dataset[]; grades: Record<string, ConfidenceGrade> }) {
  const [minGrade, setMinGrade] = useState<ConfidenceGrade>('B');
  const [trainRatio, setTrainRatio] = useState(70);
  const [valRatio, setValRatio] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(datasets.map(d => d.id)));
  const [built, setBuilt] = useState(false);
  const [building, setBuilding] = useState(false);

  const GRADE_ORDER: ConfidenceGrade[] = ['A', 'B', 'C', 'D', 'unrated'];
  const testRatio = 100 - trainRatio - valRatio;
  const gradeIndex = (g: ConfidenceGrade) => GRADE_ORDER.indexOf(g);

  const filteredDatasets = datasets.filter(d => {
    const g = grades[d.id] ?? d.confidenceGrade;
    return gradeIndex(g) <= gradeIndex(minGrade) && selectedIds.has(d.id);
  });

  const totalRecords = filteredDatasets.reduce((s, d) => s + d.records, 0);
  const trainCount = Math.round(totalRecords * trainRatio / 100);
  const valCount = Math.round(totalRecords * valRatio / 100);
  const testCount = totalRecords - trainCount - valCount;

  const toggleDataset = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setBuilt(false);
  };

  const handleBuild = () => {
    setBuilding(true); setBuilt(false);
    setTimeout(() => { setBuilding(false); setBuilt(true); }, 900);
  };

  const SPLITS = [
    { label: '训练集', count: trainCount, ratio: trainRatio, color: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { label: '验证集', count: valCount, ratio: valRatio, color: 'bg-purple-500', lightBg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { label: '测试集', count: testCount, ratio: testRatio, color: 'bg-green-500', lightBg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">数据集构建与划分</h3>
        <p className="text-sm text-gray-500 mt-0.5">按置信度等级筛选数据源，配置划分比例，一键构建训练集、验证集和测试集</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* left: filter + config */}
        <div className="space-y-4">
          {/* grade filter */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">置信度筛选</span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">最低等级要求</label>
              <div className="flex gap-2">
                {(['A', 'B', 'C', 'D'] as ConfidenceGrade[]).map(g => {
                  const cfg = GRADE_CONFIG[g];
                  const active = minGrade === g;
                  return (
                    <button key={g} onClick={() => { setMinGrade(g); setBuilt(false); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                      {g}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                将纳入 <span className="font-semibold text-gray-700">{GRADE_ORDER.slice(0, gradeIndex(minGrade) + 1).filter(g => g !== 'unrated').join('、')} 级</span> 数据源
              </p>
            </div>
          </div>

          {/* dataset checklist */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600">选择数据集</div>
            <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
              {datasets.map(ds => {
                const g = grades[ds.id] ?? ds.confidenceGrade;
                const cfg = GRADE_CONFIG[g];
                const qualifies = gradeIndex(g) <= gradeIndex(minGrade);
                const checked = selectedIds.has(ds.id);
                return (
                  <label key={ds.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${!qualifies ? 'opacity-40' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={checked && qualifies} disabled={!qualifies}
                      onChange={() => qualifies && toggleDataset(ds.id)}
                      className="rounded border-gray-300 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{ds.name}</p>
                      <p className="text-[10px] text-gray-400">{ds.records.toLocaleString()} 条</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* split ratio sliders */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">划分比例</span>
            </div>
            {[
              { label: '训练集', value: trainRatio, onChange: (v: number) => { setTrainRatio(v); setBuilt(false); }, color: 'accent-blue-600', max: 100 - valRatio - 5 },
              { label: '验证集', value: valRatio, onChange: (v: number) => { setValRatio(v); setBuilt(false); }, color: 'accent-purple-600', max: 100 - trainRatio - 5 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{s.label}</span>
                  <span className="text-xs font-mono font-semibold text-gray-800">{s.value}%</span>
                </div>
                <input type="range" min={5} max={s.max} value={s.value} onChange={e => s.onChange(+e.target.value)}
                  className={`w-full h-1.5 ${s.color}`} />
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>测试集（自动）</span>
              <span className="font-mono font-semibold text-gray-800">{testRatio}%</span>
            </div>
            {testRatio < 5 && (
              <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />测试集比例过小，建议至少 5%</p>
            )}
          </div>
        </div>

        {/* right: preview + action */}
        <div className="space-y-4">
          {/* summary */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">划分预览</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>纳入数据集：<span className="font-semibold text-gray-700">{filteredDatasets.length}</span> 个</span>
                <span>总记录数：<span className="font-semibold text-gray-700">{totalRecords.toLocaleString()}</span></span>
              </div>
              {/* stacked bar */}
              <div className="flex h-5 rounded-lg overflow-hidden gap-px">
                {SPLITS.map(s => (
                  <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${s.ratio}%` }} />
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                {SPLITS.map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className={`w-2.5 h-2.5 rounded ${s.color}`} />
                    <span>{s.label} {s.ratio}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {SPLITS.map(s => (
                <div key={s.label} className={`rounded-lg p-3 ${s.lightBg} border ${s.border}`}>
                  <p className={`text-xs font-semibold ${s.text}`}>{s.label}</p>
                  <p className={`text-base font-bold ${s.text} mt-0.5`}>{s.count.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">条记录</p>
                </div>
              ))}
            </div>
          </div>

          {/* data source breakdown */}
          {filteredDatasets.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600">已纳入数据源</div>
              <div className="divide-y divide-gray-100">
                {filteredDatasets.map(ds => {
                  const g = grades[ds.id] ?? ds.confidenceGrade;
                  const cfg = GRADE_CONFIG[g];
                  return (
                    <div key={ds.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-700 truncate flex-1">{ds.name}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{ds.records.toLocaleString()} 条</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredDatasets.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-400">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
              当前筛选条件下无可用数据集，请降低最低等级要求
            </div>
          )}

          <button onClick={handleBuild} disabled={building || filteredDatasets.length === 0 || testRatio < 5}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-medium transition-colors">
            <Scissors className="w-4 h-4" />
            {building ? '构建中…' : '构建数据集'}
          </button>

          {built && (
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">数据集构建成功</span>
              </div>
              {SPLITS.map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs text-emerald-800">
                  <span>{s.label}</span>
                  <span className="font-mono font-semibold">{s.count.toLocaleString()} 条 · {s.ratio}%</span>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-lg text-xs hover:bg-emerald-100">
                  <Download className="w-3.5 h-3.5" />下载
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-lg text-xs hover:bg-emerald-100">
                  <Eye className="w-3.5 h-3.5" />预览
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── classification + evaluation data ─────────────────────────────────────────

const DOMAIN_TAGS = ['生物医疗', '金融', '科技', '法律', '通用', '学术', '工业', '教育'];
const TASK_TAGS = ['链接预测', '实体识别', '关系抽取', '知识推理', '图分类', '属性预测', '实体消歧'];
const MODALITY_TAGS = ['文本', '图结构', '多模态', '表格数据', '知识三元组'];

interface DatasetTags { domain: string[]; task: string[]; modality: string[]; }
interface DatasetMeta { description: string; source: string; creator: string; publishDate: string; license: string; }

const INITIAL_TAGS: Record<string, DatasetTags> = {
  'dataset-1':  { domain: ['生物医疗'],      task: ['实体识别'],              modality: ['文本', '知识三元组'] },
  'dataset-2':  { domain: ['通用'],          task: ['关系抽取'],              modality: ['文本'] },
  'dataset-3':  { domain: ['科技', '学术'],  task: ['实体识别'],              modality: ['文本'] },
  'dataset-4':  { domain: ['通用'],          task: ['实体消歧', '链接预测'],  modality: ['文本'] },
  'dataset-5':  { domain: ['通用'],          task: ['图分类'],                modality: ['图结构'] },
  'dataset-7':  { domain: ['通用'],          task: ['实体识别'],              modality: ['文本'] },
  'dataset-8':  { domain: ['通用'],          task: ['关系抽取'],              modality: ['知识三元组'] },
  'dataset-9':  { domain: ['通用'],          task: ['实体消歧'],              modality: ['文本'] },
  'dataset-10': { domain: ['通用'],          task: ['知识推理'],              modality: ['知识三元组'] },
  'dataset-11': { domain: ['通用'],          task: ['图分类'],                modality: ['图结构'] },
  'sim-dataset-1': { domain: ['通用', '金融'], task: ['实体消歧', '链接预测'], modality: ['文本'] },
  'sim-dataset-2': { domain: ['生物医疗'],     task: ['实体消歧', '链接预测'], modality: ['文本', '知识三元组'] },
};

const INITIAL_META: Record<string, DatasetMeta> = {
  'dataset-1': { description: '医疗领域实体标注数据，包含疾病、药物、症状等实体类型', source: '北京协和医院', creator: '王医师', publishDate: '2026-04-15', license: 'CC BY 4.0' },
  'dataset-2': { description: '关系抽取标注数据，包含实体对和关系类型标注', source: '知识图谱实验室', creator: '张研究员', publishDate: '2026-04-12', license: 'Apache 2.0' },
  'dataset-3': { description: '科技文献实体标注数据集', source: '清华大学', creator: '陈研究员', publishDate: '2026-04-10', license: 'CC BY-NC 4.0' },
  'dataset-4': { description: '实体链接训练数据，包含候选实体和正确链接标注', source: '百度百科', creator: '李工程师', publishDate: '2026-04-08', license: 'Apache 2.0' },
  'dataset-5': { description: '图结构数据，用于图嵌入模型训练', source: '内部构建', creator: '系统', publishDate: '2026-04-05', license: 'MIT' },
  'sim-dataset-1': { description: '企业领域实体相似度标注数据集', source: '内部构建', creator: '王工程师', publishDate: '2026-04-20', license: 'Apache 2.0' },
  'sim-dataset-2': { description: '生物医疗领域实体相似度标注数据', source: '北京协和医院', creator: '李医师', publishDate: '2026-04-18', license: 'CC BY 4.0' },
};

interface EvalStats {
  entityCount: number; tripleCount: number; density: number;
  avgDegree: number; maxDegree: number; missingRate: number;
  duplicates: number; consistencyScore: number;
  degreeDistribution: { degree: string; count: number }[];
  relTypeDistribution: { type: string; count: number; color: string }[];
  fieldQuality: { field: string; completeness: number }[];
}

const EVAL_STATS: Record<string, EvalStats> = {
  'dataset-1': {
    entityCount: 8543, tripleCount: 12547, density: 0.073, avgDegree: 3.4, maxDegree: 48,
    missingRate: 2.3, duplicates: 45, consistencyScore: 94.2,
    degreeDistribution: [{ degree: '1', count: 2800 }, { degree: '2', count: 2100 }, { degree: '3', count: 1500 }, { degree: '4', count: 900 }, { degree: '5+', count: 1243 }],
    relTypeDistribution: [{ type: '疾病-症状', count: 3200, color: '#6366f1' }, { type: '药物-适应症', count: 2800, color: '#22c55e' }, { type: '疾病-部位', count: 2100, color: '#f59e0b' }, { type: '药物-副作用', count: 1900, color: '#ef4444' }, { type: '其他', count: 2547, color: '#94a3b8' }],
    fieldQuality: [{ field: '实体文本', completeness: 100 }, { field: '实体类型', completeness: 98.7 }, { field: '起始位置', completeness: 97.4 }, { field: '结束位置', completeness: 97.4 }, { field: '置信度', completeness: 89.2 }],
  },
  'dataset-2': {
    entityCount: 5832, tripleCount: 8300, density: 0.051, avgDegree: 2.8, maxDegree: 32,
    missingRate: 4.1, duplicates: 120, consistencyScore: 88.6,
    degreeDistribution: [{ degree: '1', count: 1900 }, { degree: '2', count: 1500 }, { degree: '3', count: 1100 }, { degree: '4', count: 700 }, { degree: '5+', count: 632 }],
    relTypeDistribution: [{ type: '雇佣关系', count: 2800, color: '#6366f1' }, { type: '从属关系', count: 2200, color: '#22c55e' }, { type: '合作关系', count: 1800, color: '#f59e0b' }, { type: '其他', count: 1500, color: '#94a3b8' }],
    fieldQuality: [{ field: '实体对', completeness: 100 }, { field: '关系类型', completeness: 95.9 }, { field: '句子上下文', completeness: 100 }, { field: '置信度', completeness: 72.3 }],
  },
};

const DEFAULT_EVAL_STATS: EvalStats = {
  entityCount: 4200, tripleCount: 6300, density: 0.038, avgDegree: 2.1, maxDegree: 22,
  missingRate: 5.8, duplicates: 85, consistencyScore: 82.0,
  degreeDistribution: [{ degree: '1', count: 1800 }, { degree: '2', count: 1200 }, { degree: '3', count: 700 }, { degree: '4', count: 300 }, { degree: '5+', count: 200 }],
  relTypeDistribution: [{ type: '主要关系', count: 2500, color: '#6366f1' }, { type: '次要关系', count: 1800, color: '#22c55e' }, { type: '其他', count: 2000, color: '#94a3b8' }],
  fieldQuality: [{ field: '主要字段', completeness: 98.0 }, { field: '辅助字段', completeness: 88.0 }, { field: '置信度', completeness: 70.0 }],
};

const BENCHMARKS = [
  { name: 'FB15k-237',    entities: 14541, relations: 237,  triples: 310116, density: 0.032, missingRate: 0.0, consistencyScore: 100.0, year: 2015 },
  { name: 'WN18RR',       entities: 40943, relations: 11,   triples: 93003,  density: 0.011, missingRate: 0.0, consistencyScore: 100.0, year: 2018 },
  { name: 'NELL-995',     entities: 75492, relations: 200,  triples: 154213, density: 0.021, missingRate: 1.2, consistencyScore: 98.8,  year: 2017 },
  { name: 'Freebase-15k', entities: 15000, relations: 1345, triples: 592213, density: 0.054, missingRate: 0.0, consistencyScore: 100.0, year: 2013 },
];

// ── DatasetClassificationPanel ────────────────────────────────────────────────

function DatasetClassificationPanel() {
  const allDatasets = useMemo(() => Object.values(datasetsByCategory).flat(), []);

  const [searchText, setSearchText] = useState('');
  const [filterDomain, setFilterDomain] = useState<string | null>(null);
  const [filterTask, setFilterTask] = useState<string | null>(null);
  const [filterModality, setFilterModality] = useState<string | null>(null);
  const [tags, setTags] = useState<Record<string, DatasetTags>>({ ...INITIAL_TAGS });
  const [metas, setMetas] = useState<Record<string, DatasetMeta>>({ ...INITIAL_META });
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);
  const [metaDraft, setMetaDraft] = useState<DatasetMeta | null>(null);

  const filtered = useMemo(() => allDatasets.filter(d => {
    const t = tags[d.id] ?? { domain: [], task: [], modality: [] };
    if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase()) && !d.description.includes(searchText)) return false;
    if (filterDomain && !t.domain.includes(filterDomain)) return false;
    if (filterTask && !t.task.includes(filterTask)) return false;
    if (filterModality && !t.modality.includes(filterModality)) return false;
    return true;
  }), [allDatasets, searchText, filterDomain, filterTask, filterModality, tags]);

  const toggleTag = (dsId: string, dim: 'domain' | 'task' | 'modality', val: string) => {
    setTags(prev => {
      const cur = prev[dsId] ?? { domain: [], task: [], modality: [] };
      const existing = cur[dim];
      return { ...prev, [dsId]: { ...cur, [dim]: existing.includes(val) ? existing.filter(v => v !== val) : [...existing, val] } };
    });
  };

  const openMetaEdit = (ds: Dataset) => {
    setEditingMetaId(ds.id);
    setMetaDraft(metas[ds.id] ?? { description: ds.description, source: '', creator: '', publishDate: ds.uploadDate, license: 'CC BY 4.0' });
  };

  const DIM_STYLES = {
    domain:   { color: 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200', active: 'bg-indigo-600 text-white border-indigo-600' },
    task:     { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200', active: 'bg-emerald-600 text-white border-emerald-600' },
    modality: { color: 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200', active: 'bg-amber-600 text-white border-amber-600' },
  };

  return (
    <div className="space-y-6">
      {/* ── 分类目录与搜索 ── */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Folder className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-800">分类目录与搜索</span>
          <span className="ml-auto text-xs text-gray-400">共 {filtered.length} / {allDatasets.length} 个数据集</span>
        </div>

        {/* search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder="按名称或描述搜索数据集..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
          />
        </div>

        {/* dimension filters */}
        <div className="space-y-3">
          {([
            { label: '领域', dim: 'domain' as const, opts: DOMAIN_TAGS, cur: filterDomain, set: setFilterDomain },
            { label: '任务类型', dim: 'task' as const, opts: TASK_TAGS, cur: filterTask, set: setFilterTask },
            { label: '数据模态', dim: 'modality' as const, opts: MODALITY_TAGS, cur: filterModality, set: setFilterModality },
          ] as const).map(({ label, dim, opts, cur, set }) => (
            <div key={dim} className="flex items-start gap-3">
              <span className="text-xs font-medium text-gray-500 pt-1.5 w-16 flex-shrink-0">{label}</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => set(null)}
                  className={`px-2.5 py-0.5 rounded-full text-xs transition-colors border ${cur === null ? DIM_STYLES[dim].active : DIM_STYLES[dim].color}`}>
                  全部
                </button>
                {opts.map(o => (
                  <button key={o} onClick={() => set(cur === o ? null : o)}
                    className={`px-2.5 py-0.5 rounded-full text-xs transition-colors border ${cur === o ? DIM_STYLES[dim].active : DIM_STYLES[dim].color}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* results */}
        <div className="mt-4 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">没有符合条件的数据集</div>
          )}
          {filtered.map(ds => {
            const t = tags[ds.id] ?? { domain: [], task: [], modality: [] };
            const isEditingTag = editingTagId === ds.id;
            const isEditingMeta = editingMetaId === ds.id;
            return (
              <div key={ds.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <File className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-medium text-sm text-gray-900 truncate">{ds.name}</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{ds.format}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {t.domain.map(v => <span key={v} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full border border-indigo-100">{v}</span>)}
                      {t.task.map(v => <span key={v} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full border border-emerald-100">{v}</span>)}
                      {t.modality.map(v => <span key={v} className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full border border-amber-100">{v}</span>)}
                      {(t.domain.length + t.task.length + t.modality.length === 0) && <span className="text-xs text-gray-400 italic">暂无标签</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{ds.description}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setEditingTagId(isEditingTag ? null : ds.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${isEditingTag ? 'bg-blue-600 text-white border-blue-600' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                      <Tag className="w-3.5 h-3.5" />标签
                    </button>
                    <button onClick={() => isEditingMeta ? setEditingMetaId(null) : openMetaEdit(ds)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${isEditingMeta ? 'bg-gray-700 text-white border-gray-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      <BookOpen className="w-3.5 h-3.5" />元数据
                    </button>
                  </div>
                </div>

                {/* tag editor */}
                {isEditingTag && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">多维度标签编辑</p>
                    {([
                      { label: '领域', dim: 'domain' as const, opts: DOMAIN_TAGS },
                      { label: '任务类型', dim: 'task' as const, opts: TASK_TAGS },
                      { label: '数据模态', dim: 'modality' as const, opts: MODALITY_TAGS },
                    ]).map(({ label, dim, opts }) => (
                      <div key={dim} className="flex items-start gap-2">
                        <span className="text-xs text-gray-500 pt-1 w-16 flex-shrink-0">{label}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {opts.map(o => {
                            const active = (tags[ds.id] ?? { domain: [], task: [], modality: [] })[dim].includes(o);
                            return (
                              <button key={o} onClick={() => toggleTag(ds.id, dim, o)}
                                className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${active ? DIM_STYLES[dim].active : DIM_STYLES[dim].color}`}>
                                {active && <span className="mr-1">✓</span>}{o}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* metadata editor */}
                {isEditingMeta && metaDraft && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <p className="text-xs font-medium text-gray-600 mb-3">元数据编辑</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {([
                        { key: 'description' as const, label: '描述', span: 2, textarea: true },
                        { key: 'source' as const, label: '数据来源', span: 1 },
                        { key: 'creator' as const, label: '创建者', span: 1 },
                        { key: 'publishDate' as const, label: '发布日期', span: 1, type: 'date' },
                        { key: 'license' as const, label: '许可证', span: 1 },
                      ]).map(f => (
                        <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                          <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                          {f.textarea ? (
                            <textarea value={metaDraft[f.key]} onChange={e => setMetaDraft({ ...metaDraft, [f.key]: e.target.value })} rows={2}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 bg-white resize-none" />
                          ) : (
                            <input type={f.type ?? 'text'} value={metaDraft[f.key]} onChange={e => setMetaDraft({ ...metaDraft, [f.key]: e.target.value })}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 bg-white" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingMetaId(null)} className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-white">取消</button>
                      <button onClick={() => { setMetas(prev => ({ ...prev, [ds.id]: metaDraft! })); setEditingMetaId(null); }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">保存元数据</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── DatasetEvaluationPanel ────────────────────────────────────────────────────

function DatasetEvaluationPanel({ datasets }: { datasets: Dataset[] }) {
  const allDatasets = useMemo(() => Object.values(datasetsByCategory).flat(), []);
  const [selectedId, setSelectedId] = useState<string>(datasets[0]?.id ?? allDatasets[0]?.id ?? '');
  const [section, setSection] = useState<'stats' | 'quality' | 'benchmark'>('stats');

  const ds = useMemo(() => allDatasets.find(d => d.id === selectedId), [allDatasets, selectedId]);
  const ev = EVAL_STATS[selectedId] ?? DEFAULT_EVAL_STATS;

  const qualityScore = Math.round((100 - ev.missingRate) * 0.4 + ev.consistencyScore * 0.4 + (ev.duplicates < 50 ? 100 : ev.duplicates < 100 ? 85 : 70) * 0.2);
  const qualityColor = qualityScore >= 90 ? 'text-emerald-600' : qualityScore >= 75 ? 'text-amber-600' : 'text-red-600';
  const qualityBg = qualityScore >= 90 ? 'bg-emerald-50 border-emerald-200' : qualityScore >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  const benchmarkRow = ds ? {
    name: ds.name.split('.')[0],
    entities: ev.entityCount,
    relations: ev.relTypeDistribution.length,
    triples: ev.tripleCount,
    density: ev.density,
    missingRate: ev.missingRate,
    consistencyScore: ev.consistencyScore,
    year: 2026,
  } : null;

  const SECTION_TABS = [
    { id: 'stats' as const, label: '统计特征自动评估', icon: BarChart2 },
    { id: 'quality' as const, label: '数据质量与完整性', icon: CheckCircle },
    { id: 'benchmark' as const, label: '评估基准对比', icon: Award },
  ];

  return (
    <div className="space-y-5">
      {/* dataset selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">选择评估数据集</span>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          className="flex-1 max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
          {allDatasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg border border-blue-100">
          {ds?.records.toLocaleString()} 条 · {ds?.size}
        </span>
      </div>

      {/* section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {SECTION_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSection(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${section === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── 统计特征自动评估 ── */}
      {section === 'stats' && (
        <div className="space-y-5">
          {/* summary cards */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: '实体总数', value: ev.entityCount.toLocaleString(), sub: '个唯一实体' },
              { label: '三元组数', value: ev.tripleCount.toLocaleString(), sub: '条关系记录' },
              { label: '图密度', value: ev.density.toFixed(3), sub: '连接稠密度' },
              { label: '平均度数', value: ev.avgDegree.toFixed(1), sub: '每节点平均边数' },
              { label: '最大度数', value: ev.maxDegree, sub: '最高连接节点' },
            ].map((c, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-gray-900">{c.value}</div>
                <div className="text-xs font-medium text-gray-700 mt-0.5">{c.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* degree distribution */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-3">节点度数分布</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ev.degreeDistribution} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="degree" tick={{ fontSize: 11 }} label={{ value: '度数', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), '节点数']} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* relation type distribution */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-3">关系类型分布</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={ev.relTypeDistribution} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={70} label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {ev.relTypeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), '条']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── 数据质量与完整性报告 ── */}
      {section === 'quality' && (
        <div className="space-y-5">
          {/* overall score */}
          <div className={`flex items-center gap-6 p-5 rounded-xl border ${qualityBg}`}>
            <div className="text-center">
              <div className={`text-5xl font-bold ${qualityColor}`}>{qualityScore}</div>
              <div className="text-xs text-gray-500 mt-1">综合质量分</div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              {[
                { label: '缺失率', value: `${ev.missingRate}%`, good: ev.missingRate < 3, icon: '⚠' },
                { label: '一致性', value: `${ev.consistencyScore}%`, good: ev.consistencyScore > 90, icon: '✓' },
                { label: '重复记录', value: `${ev.duplicates} 条`, good: ev.duplicates < 50, icon: ev.duplicates < 50 ? '✓' : '⚠' },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className={`text-lg font-bold ${m.good ? 'text-emerald-600' : 'text-amber-600'}`}>{m.value}</div>
                  <div className="text-xs text-gray-500">{m.label}</div>
                  <div className={`text-xs mt-0.5 ${m.good ? 'text-emerald-500' : 'text-amber-500'}`}>{m.icon} {m.good ? '正常' : '需关注'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* field completeness */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-800 mb-4">字段完整性</p>
            <div className="space-y-3">
              {ev.fieldQuality.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{f.field}</span>
                    <span className={`text-sm font-medium ${f.completeness >= 95 ? 'text-emerald-600' : f.completeness >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{f.completeness}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${f.completeness >= 95 ? 'bg-emerald-500' : f.completeness >= 80 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${f.completeness}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* quality issues */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-800 mb-3">质量问题清单</p>
            <div className="space-y-2">
              {[
                { level: 'error' as const, msg: `发现 ${ev.duplicates} 条重复记录`, detail: '建议去重后重新训练' },
                ...(ev.missingRate > 3 ? [{ level: 'warn' as const, msg: `字段缺失率 ${ev.missingRate}% 超过阈值`, detail: '建议对缺失字段进行补全或过滤' }] : []),
                ...(ev.consistencyScore < 90 ? [{ level: 'warn' as const, msg: `一致性得分 ${ev.consistencyScore}% 偏低`, detail: '存在标注冲突，建议人工复核' }] : []),
                { level: 'ok' as const, msg: '文本编码格式检测正常', detail: '全部为 UTF-8 格式' },
                { level: 'ok' as const, msg: '实体边界无越界问题', detail: '所有实体在文本范围内' },
              ].map((issue, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg text-sm ${issue.level === 'error' ? 'bg-red-50 border border-red-100' : issue.level === 'warn' ? 'bg-amber-50 border border-amber-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                  <span className={`flex-shrink-0 mt-0.5 ${issue.level === 'error' ? 'text-red-500' : issue.level === 'warn' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {issue.level === 'ok' ? '✓' : '⚠'}
                  </span>
                  <div>
                    <div className={`font-medium ${issue.level === 'error' ? 'text-red-700' : issue.level === 'warn' ? 'text-amber-700' : 'text-emerald-700'}`}>{issue.msg}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{issue.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 评估基准对比 ── */}
      {section === 'benchmark' && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            将当前数据集与公开知识图谱基准数据集进行多维度对比，评估数据规模、稠密度和质量指标的相对水平。
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">数据集</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">实体数</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">关系类型</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">三元组数</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">图密度</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">缺失率</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">一致性</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* current dataset highlighted */}
                  {benchmarkRow && (
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded font-medium">当前</span>
                          <span className="font-medium text-blue-800 truncate max-w-[160px]">{benchmarkRow.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-blue-800">{benchmarkRow.entities.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-blue-800">{benchmarkRow.relations}</td>
                      <td className="px-4 py-3 text-right text-blue-800">{benchmarkRow.triples.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-blue-800">{benchmarkRow.density.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${benchmarkRow.missingRate < 3 ? 'text-emerald-600' : 'text-amber-600'}`}>{benchmarkRow.missingRate}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${benchmarkRow.consistencyScore >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{benchmarkRow.consistencyScore}%</span>
                      </td>
                    </tr>
                  )}
                  {BENCHMARKS.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{b.year}</span>
                          <span className="font-medium text-gray-800">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{b.entities.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{b.relations}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{b.triples.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{b.density.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={b.missingRate < 1 ? 'text-emerald-600 font-medium' : 'text-amber-600'}>{b.missingRate}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={b.consistencyScore >= 99 ? 'text-emerald-600 font-medium' : 'text-amber-600'}>{b.consistencyScore}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* radar-style summary */}
          {benchmarkRow && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gray-800 mb-4">当前数据集 vs 基准均值对比</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: '规模排名', val: Math.min(4, BENCHMARKS.filter(b => b.triples > benchmarkRow.triples).length + 1), total: 5, unit: `/ ${BENCHMARKS.length + 1}`, desc: `三元组数 ${benchmarkRow.triples.toLocaleString()}`, good: false },
                  { label: '图密度排名', val: Math.min(4, BENCHMARKS.filter(b => b.density > benchmarkRow.density).length + 1), total: 5, unit: `/ ${BENCHMARKS.length + 1}`, desc: `密度 ${benchmarkRow.density.toFixed(3)}`, good: false },
                  { label: '数据质量', val: qualityScore, total: 100, unit: '分', desc: `缺失率 ${benchmarkRow.missingRate}%`, good: qualityScore >= 80 },
                ].map((m, i) => (
                  <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className={`text-3xl font-bold ${m.good ? 'text-emerald-600' : 'text-blue-600'}`}>{m.val}<span className="text-base font-normal text-gray-400">{m.unit}</span></div>
                    <div className="text-sm font-medium text-gray-700 mt-1">{m.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── similarity annotation data ────────────────────────────────────────────────

const LABEL_META: Record<SimilarityLabel, { label: string; color: string; bg: string; border: string }> = {
  similar:    { label: '相似',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  dissimilar: { label: '不相似', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-300'     },
  uncertain:  { label: '不确定', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300'   },
};

const ENTITY_PAIRS_BY_DATASET: Record<string, EntityPair[]> = {
  'sim-dataset-1': [
    { id: 'ep-1', entityA: { id: 'e1', name: '苹果公司', type: '机构', description: '跨国科技企业，以iPhone、Mac等产品著称，总部位于美国加州库比蒂诺' }, entityB: { id: 'e2', name: 'Apple Inc.', type: '机构', description: 'Multinational technology company, known for iPhone, Mac and services businesses' }, originalLabel: 'similar', confidence: 0.98 },
    { id: 'ep-2', entityA: { id: 'e3', name: '腾讯', type: '机构', description: '中国互联网科技公司，旗下有微信、QQ等产品，总部位于深圳' }, entityB: { id: 'e4', name: 'Tencent', type: '机构', description: 'Chinese multinational technology conglomerate holding company headquartered in Shenzhen' }, originalLabel: 'similar', confidence: 0.97 },
    { id: 'ep-3', entityA: { id: 'e5', name: '谷歌', type: '机构', description: '美国跨国科技公司，主营搜索引擎和云计算，Alphabet旗下子公司' }, entityB: { id: 'e6', name: 'Google LLC', type: '机构', description: 'American multinational technology company specializing in internet services and products' }, originalLabel: 'similar', confidence: 0.98 },
    { id: 'ep-4', entityA: { id: 'e7', name: '北京大学', type: '机构', description: '中国顶尖综合性研究型大学，位于北京市海淀区，1898年建校' }, entityB: { id: 'e8', name: '北大', type: '机构', description: '北京大学的常用简称，中国顶尖学府' }, originalLabel: 'similar', confidence: 0.95 },
    { id: 'ep-5', entityA: { id: 'e9', name: '华为', type: '机构', description: '中国跨国科技公司，主要业务涵盖通信设备、智能手机和云服务' }, entityB: { id: 'e10', name: '华为技术有限公司', type: '机构', description: '华为的法定全称，全球领先的ICT基础设施和智能终端提供商' }, originalLabel: 'similar', confidence: 0.93 },
    { id: 'ep-6', entityA: { id: 'e11', name: '苹果公司', type: '机构', description: '跨国科技企业，以iPhone、Mac等消费电子产品著称' }, entityB: { id: 'e12', name: '苹果手机', type: '产品', description: 'iPhone系列智能手机的通俗称呼，苹果公司旗下主力产品线' }, originalLabel: 'dissimilar', confidence: 0.89 },
    { id: 'ep-7', entityA: { id: 'e13', name: '北京大学', type: '机构', description: '中国顶尖综合性研究型大学，人文社科与理工科均衡发展' }, entityB: { id: 'e14', name: '清华大学', type: '机构', description: '中国顶尖理工科研究型大学，工程技术和理科见长，位于北京海淀区' }, originalLabel: 'dissimilar', confidence: 0.92 },
    { id: 'ep-8', entityA: { id: 'e15', name: '张伟（企业家）', type: '人物', description: '某知名科技企业创始人，互联网领域连续创业者，毕业于北京大学' }, entityB: { id: 'e16', name: '张伟（科学家）', type: '人物', description: '中科院院士，材料科学领域专家，主攻纳米材料研究，毕业于清华大学' }, originalLabel: 'dissimilar', confidence: 0.88 },
    { id: 'ep-9', entityA: { id: 'e17', name: '人工智能', type: '概念', description: '使计算机模拟、延伸和扩展人类智能的理论、方法、技术和应用系统' }, entityB: { id: 'e18', name: '机器学习', type: '概念', description: '人工智能的子领域，研究如何通过数据训练让计算机自动改进性能的算法' }, originalLabel: 'dissimilar', confidence: 0.84 },
    { id: 'ep-10', entityA: { id: 'e19', name: '微软', type: '机构', description: '美国跨国科技公司，Windows操作系统和Office套件的制造商，总部位于华盛顿州' }, entityB: { id: 'e20', name: 'Microsoft Azure', type: '产品', description: '微软旗下的云计算服务平台，提供基础设施、平台和软件即服务' }, originalLabel: 'uncertain', confidence: 0.69 },
  ],
  'sim-dataset-2': [
    { id: 'ep-11', entityA: { id: 'e21', name: '阿司匹林', type: '药品', description: '解热镇痛抗炎药，化学名乙酰水杨酸，同时具有抗血小板聚集作用' }, entityB: { id: 'e22', name: '乙酰水杨酸', type: '药品', description: '阿司匹林的化学名称，属于非甾体抗炎药，水杨酸的衍生物' }, originalLabel: 'similar', confidence: 0.96 },
    { id: 'ep-12', entityA: { id: 'e23', name: '新冠肺炎', type: '疾病', description: '由新型冠状病毒（SARS-CoV-2）引起的急性呼吸道传染病，2019年底首次报告' }, entityB: { id: 'e24', name: 'COVID-19', type: '疾病', description: 'Coronavirus Disease 2019，新型冠状病毒肺炎的英文官方名称' }, originalLabel: 'similar', confidence: 0.98 },
    { id: 'ep-13', entityA: { id: 'e25', name: '磁共振成像', type: '检查', description: '利用强磁场、磁场梯度和无线电波对人体产生解剖和功能图像的医学技术' }, entityB: { id: 'e26', name: 'MRI', type: '检查', description: 'Magnetic Resonance Imaging，磁共振成像技术的英文缩写，临床广泛使用' }, originalLabel: 'similar', confidence: 0.97 },
    { id: 'ep-14', entityA: { id: 'e27', name: '世界卫生组织', type: '机构', description: '联合国下属专门机构，负责领导全球公共卫生事务，总部位于日内瓦' }, entityB: { id: 'e28', name: 'WHO', type: '机构', description: 'World Health Organization，世界卫生组织的英文缩写，成立于1948年' }, originalLabel: 'similar', confidence: 0.99 },
    { id: 'ep-15', entityA: { id: 'e29', name: '胰岛素', type: '药品', description: '由胰腺β细胞分泌的多肽激素，调节血糖代谢，也用于糖尿病治疗' }, entityB: { id: 'e30', name: '重组人胰岛素', type: '药品', description: '通过基因工程技术在大肠杆菌或酵母菌中表达生产的人胰岛素，结构与天然胰岛素相同' }, originalLabel: 'uncertain', confidence: 0.71 },
    { id: 'ep-16', entityA: { id: 'e31', name: '高血压', type: '疾病', description: '以体循环动脉血压持续升高为主要特征的慢性非传染性疾病，诊断标准为≥140/90mmHg' }, entityB: { id: 'e32', name: '原发性高血压', type: '疾病', description: '无明确继发原因的高血压，又称特发性高血压，约占全部高血压的90%以上' }, originalLabel: 'uncertain', confidence: 0.68 },
    { id: 'ep-17', entityA: { id: 'e33', name: '阿司匹林', type: '药品', description: '非甾体抗炎药，具有解热、镇痛、抗炎和抗血小板聚集等多重药理作用' }, entityB: { id: 'e34', name: '布洛芬', type: '药品', description: '非甾体抗炎药，具有退烧、镇痛和消炎作用，常用于肌肉骨骼疼痛和发热' }, originalLabel: 'dissimilar', confidence: 0.91 },
    { id: 'ep-18', entityA: { id: 'e35', name: '心肌梗死', type: '疾病', description: '冠状动脉急性闭塞导致心肌细胞坏死的急性心脏事件，属心血管急症' }, entityB: { id: 'e36', name: '心脏病', type: '疾病', description: '各种心脏疾病的泛称，包括冠心病、心律失常、心力衰竭等多种类型' }, originalLabel: 'dissimilar', confidence: 0.83 },
    { id: 'ep-19', entityA: { id: 'e37', name: '肝素', type: '药品', description: '天然多糖类抗凝血剂，通过增强抗凝血酶活性发挥抗凝作用，静脉或皮下注射' }, entityB: { id: 'e38', name: '华法林', type: '药品', description: '口服抗凝药，维生素K拮抗剂，通过干扰凝血因子合成发挥抗凝作用' }, originalLabel: 'dissimilar', confidence: 0.87 },
    { id: 'ep-20', entityA: { id: 'e39', name: '新冠肺炎', type: '疾病', description: '由新型冠状病毒（SARS-CoV-2）引起的急性呼吸道传染病，重症可致呼吸衰竭' }, entityB: { id: 'e40', name: '流行性感冒', type: '疾病', description: '由流感病毒引起的急性呼吸道传染病，俗称流感，季节性流行，重症可致死' }, originalLabel: 'dissimilar', confidence: 0.84 },
  ],
};

// ── SimilarityAnnotationPanel ─────────────────────────────────────────────────

function SimilarityAnnotationPanel({ datasets }: { datasets: Dataset[] }) {
  const [activeDatasetId, setActiveDatasetId] = useState(datasets[0]?.id ?? '');
  const [labels, setLabels] = useState<Record<string, SimilarityLabel>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<'all' | SimilarityLabel | 'modified' | 'unreviewed'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pairs = ENTITY_PAIRS_BY_DATASET[activeDatasetId] ?? [];

  const labelCounts = useMemo(() => {
    const c = { similar: 0, dissimilar: 0, uncertain: 0 };
    pairs.forEach(p => { const k = labels[p.id] ?? p.originalLabel; c[k]++; });
    return c;
  }, [pairs, labels]);

  const annotatedCount = pairs.filter(p => labels[p.id] !== undefined).length;
  const modifiedCount = pairs.filter(p => labels[p.id] !== undefined && labels[p.id] !== p.originalLabel).length;
  const progress = pairs.length > 0 ? Math.round(annotatedCount / pairs.length * 100) : 0;

  const filtered = useMemo(() => pairs.filter(p => {
    const cur = labels[p.id] ?? p.originalLabel;
    if (filterLabel === 'modified') { if (!(labels[p.id] !== undefined && labels[p.id] !== p.originalLabel)) return false; }
    else if (filterLabel === 'unreviewed') { if (labels[p.id] !== undefined) return false; }
    else if (filterLabel !== 'all') { if (cur !== filterLabel) return false; }
    if (search) {
      const q = search.toLowerCase();
      if (!p.entityA.name.toLowerCase().includes(q) && !p.entityB.name.toLowerCase().includes(q) &&
          !p.entityA.description.toLowerCase().includes(q) && !p.entityB.description.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [pairs, filterLabel, search, labels]);

  const setLabel = (pairId: string, label: SimilarityLabel) => setLabels(prev => ({ ...prev, [pairId]: label }));

  const revertLabel = (pairId: string) => setLabels(prev => { const n = { ...prev }; delete n[pairId]; return n; });

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const batchAnnotate = (label: SimilarityLabel) => {
    setLabels(prev => { const n = { ...prev }; selectedIds.forEach(id => { n[id] = label; }); return n; });
    setSelectedIds(new Set());
  };

  const FILTERS = [
    { id: 'all' as const, label: '全部', count: pairs.length },
    { id: 'similar' as const, label: '相似', count: labelCounts.similar },
    { id: 'dissimilar' as const, label: '不相似', count: labelCounts.dissimilar },
    { id: 'uncertain' as const, label: '不确定', count: labelCounts.uncertain },
    { id: 'modified' as const, label: '已修改', count: modifiedCount },
    { id: 'unreviewed' as const, label: '未复核', count: pairs.length - annotatedCount },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">实体相似度数据集二次标注</h3>
        <p className="text-sm text-gray-500 mt-0.5">对已标注的实体对进行人工复核和修正，确认或更改相似/不相似标签以提升数据质量</p>
      </div>

      {/* Dataset selector + progress readout */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 flex-shrink-0">当前数据集</label>
        <select value={activeDatasetId} onChange={e => { setActiveDatasetId(e.target.value); setFilterLabel('all'); setSearch(''); setSelectedIds(new Set()); }}
          className="flex-1 max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400">
          {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <span className="text-xs text-gray-500">已复核 <span className="font-semibold text-gray-800">{annotatedCount} / {pairs.length}</span></span>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '总实体对', value: pairs.length, color: 'text-gray-800', bg: 'bg-gray-50', border: 'border-gray-200' },
          { label: '相似', value: labelCounts.similar, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: '不相似', value: labelCounts.dissimilar, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '不确定', value: labelCounts.uncertain, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: '已修改', value: modifiedCount, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg} ${s.border} text-center`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
          <span>标注进度</span>
          <span className="font-semibold text-gray-800">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Filter + search + batch controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilterLabel(f.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterLabel === f.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {f.label}
              <span className={`text-[10px] font-bold ${filterLabel === f.id ? 'opacity-80' : 'text-gray-400'}`}>{f.count}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 relative min-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索实体名称或描述..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400" />
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500 font-medium">已选 {selectedIds.size} 对</span>
            <button onClick={() => batchAnnotate('similar')} className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">批量→相似</button>
            <button onClick={() => batchAnnotate('dissimilar')} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">批量→不相似</button>
            <button onClick={() => batchAnnotate('uncertain')} className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">批量→不确定</button>
            <button onClick={() => setSelectedIds(new Set())} className="p-1.5 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Entity pair list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">没有符合条件的实体对</p>
          </div>
        )}
        {filtered.map((pair, idx) => {
          const currentLabel = labels[pair.id] ?? pair.originalLabel;
          const isModified = labels[pair.id] !== undefined && labels[pair.id] !== pair.originalLabel;
          const isSelected = selectedIds.has(pair.id);
          const isExpanded = expandedId === pair.id;
          const lm = LABEL_META[currentLabel];
          const origMeta = LABEL_META[pair.originalLabel];

          return (
            <div key={pair.id} className={`border-2 rounded-xl transition-all ${isSelected ? 'border-teal-400 shadow-sm' : isModified ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="p-4">
                {/* Pair header row */}
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(pair.id)}
                    className="rounded border-gray-300 text-teal-600 flex-shrink-0" />
                  <span className="text-xs text-gray-400 font-mono flex-shrink-0">#{idx + 1}</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${lm.border} ${lm.bg} ${lm.color}`}>
                    {lm.label} · {(pair.confidence * 100).toFixed(0)}%
                  </span>
                  {isModified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      原标签: {origMeta.label}
                    </span>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : pair.id)}
                    className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    详情
                  </button>
                </div>

                {/* Entity pair cards */}
                <div className="grid grid-cols-[1fr_44px_1fr] items-center gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">{pair.entityA.name}</span>
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded font-medium">{pair.entityA.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{pair.entityA.description}</p>
                  </div>

                  <div className={`flex items-center justify-center w-11 h-11 rounded-full border-2 font-bold text-base flex-shrink-0 ${lm.border} ${lm.bg} ${lm.color}`}>
                    {currentLabel === 'similar' ? '=' : currentLabel === 'dissimilar' ? '≠' : '?'}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">{pair.entityB.name}</span>
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded font-medium">{pair.entityB.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{pair.entityB.description}</p>
                  </div>
                </div>

                {/* Annotation controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 flex-shrink-0">二次标注：</span>
                  {(['similar', 'dissimilar', 'uncertain'] as SimilarityLabel[]).map(label => {
                    const meta = LABEL_META[label];
                    const active = currentLabel === label;
                    return (
                      <button key={label} onClick={() => setLabel(pair.id, label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${active ? `${meta.bg} ${meta.color} ${meta.border} shadow-sm` : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
                        <span>{label === 'similar' ? '✓' : label === 'dissimilar' ? '✗' : '?'}</span>
                        {meta.label}
                      </button>
                    );
                  })}
                  {labels[pair.id] !== undefined && (
                    <button onClick={() => revertLabel(pair.id)}
                      className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 hover:bg-gray-100 rounded">
                      <RotateCcw className="w-3 h-3" />还原
                    </button>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-900 rounded-lg p-3">
                        <p className="text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">实体 A · {pair.entityA.type}</p>
                        <p className="text-sm font-bold text-white mb-1">{pair.entityA.name}</p>
                        <p className="text-xs text-gray-300">{pair.entityA.description}</p>
                        <p className="text-[10px] text-gray-500 mt-2 font-mono">ID: {pair.entityA.id}</p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-3">
                        <p className="text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">实体 B · {pair.entityB.type}</p>
                        <p className="text-sm font-bold text-white mb-1">{pair.entityB.name}</p>
                        <p className="text-xs text-gray-300">{pair.entityB.description}</p>
                        <p className="text-[10px] text-gray-500 mt-2 font-mono">ID: {pair.entityB.id}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">标注备注（可选）</label>
                      <textarea value={notes[pair.id] ?? ''} onChange={e => setNotes(prev => ({ ...prev, [pair.id]: e.target.value }))}
                        placeholder="补充说明标注理由，例如：两者为同一实体的中英文名称..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-teal-400 resize-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export footer */}
      {annotatedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="text-sm text-teal-800">
            已复核 <span className="font-bold">{annotatedCount}</span> 对
            {modifiedCount > 0 && <>，其中修改标签 <span className="font-bold">{modifiedCount}</span> 对</>}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-teal-300 text-teal-700 rounded-lg text-sm hover:bg-teal-100">
              <Download className="w-4 h-4" />导出已标注
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
              <CheckCircle className="w-4 h-4" />提交审核
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface DatasetCategoryDetailProps {
  categoryId: string;
  onBack: () => void;
}

export function DatasetCategoryDetail({ categoryId, onBack }: DatasetCategoryDetailProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'confidence' | 'versions' | 'split' | 'classification' | 'evaluation' | 'annotation'>('list');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState('');
  const [grades, setGrades] = useState<Record<string, ConfidenceGrade>>({});

  const datasets = datasetsByCategory[categoryId] ?? [];
  const category = categoryInfo[categoryId];

  const TABS = [
    { id: 'list' as const, label: '数据集列表' },
    { id: 'confidence' as const, label: '置信度评级' },
    { id: 'versions' as const, label: '版本控制' },
    { id: 'split' as const, label: '构建与划分' },
    { id: 'classification' as const, label: '数据集分类' },
    { id: 'evaluation' as const, label: '数据集评估' },
    ...(categoryId === 'entity-similarity' ? [{ id: 'annotation' as const, label: '相似度标注' }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
          <ArrowLeft className="w-4 h-4" />返回
        </button>
        <button onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Upload className="w-4 h-4" />上传数据集
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* category header */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-100">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <File className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{category?.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{category?.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{datasets.length} 个数据集</span>
              <span>{datasets.reduce((s, d) => s + d.records, 0).toLocaleString()} 条总记录</span>
            </div>
          </div>
        </div>

        {/* tab nav */}
        <div className="flex border-b border-gray-200 px-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`py-3 px-1 mr-6 border-b-2 text-sm font-medium transition-colors -mb-px ${activeTab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* tab content */}
        <div className="p-6">
          {activeTab === 'list' && (
            <DatasetListPanel datasets={datasets} onViewSample={s => { setSelectedSample(s); setShowSampleModal(true); }} />
          )}
          {activeTab === 'confidence' && (
            <ConfidenceRatingPanel datasets={datasets} grades={grades} onChangeGrade={(id, g) => setGrades(prev => ({ ...prev, [id]: g }))} />
          )}
          {activeTab === 'versions' && <VersionControlPanel datasets={datasets} />}
          {activeTab === 'split' && <DatasetSplitPanel datasets={datasets} grades={grades} />}
          {activeTab === 'classification' && <DatasetClassificationPanel />}
          {activeTab === 'evaluation' && <DatasetEvaluationPanel datasets={datasets} />}
          {activeTab === 'annotation' && categoryId === 'entity-similarity' && <SimilarityAnnotationPanel datasets={datasets} />}
        </div>
      </div>

      {/* modals */}
      {showUploadModal && <UploadDatasetModal onClose={() => setShowUploadModal(false)} />}
      {showSampleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">数据示例</h3>
              <button onClick={() => setShowSampleModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <pre className="bg-gray-950 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto">{selectedSample}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadDatasetModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">上传数据集</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">数据集名称</label>
            <input type="text" placeholder="例如: medical_entities_training.jsonl"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
            <textarea placeholder="描述数据集的内容和用途..." rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">数据源类型</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                {['专家审核', '人工标注', '众包标注', '自动标注'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">初始置信度评级</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                {['A 级（专家审核）', 'B 级（人工标注）', 'C 级（众包标注）', 'D 级（自动标注）'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">选择文件</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">点击上传或拖拽文件到此处</p>
              <p className="text-xs text-gray-400">支持 JSONL、CSV、TXT，最大 500MB</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">取消</button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">上传</button>
        </div>
      </div>
    </div>
  );
}
