import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, File, Upload, Download, Trash2, Calendar, HardDrive, CheckCircle, Eye, Code,
  Star, GitCommit, Scissors, RotateCcw, ChevronDown, ChevronRight, AlertTriangle, Info,
  Plus, X, Filter, BarChart2, Clock, User, Search,
} from 'lucide-react';

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
  records: number;
  size: string;
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
    { version: 'v1.4', op: '审核通过', operator: '王医师', timestamp: '2026-04-15 14:32', changes: 0, note: '专家复核全部通过，标记为 A 级数据源', records: 12500, size: '45.2 MB' },
    { version: 'v1.3', op: '修正', operator: '李标注员', timestamp: '2026-04-14 09:15', changes: 238, note: '修正 238 条实体边界偏移问题', records: 12500, size: '45.1 MB' },
    { version: 'v1.2', op: '标注', operator: '张标注员', timestamp: '2026-04-12 16:40', changes: 1520, note: '新增 1520 条医疗实体标注', records: 12262, size: '43.8 MB' },
    { version: 'v1.1', op: '修正', operator: '李标注员', timestamp: '2026-04-10 11:00', changes: 86, note: '修正重复记录 86 条', records: 10742, size: '38.6 MB' },
    { version: 'v1.0', op: '创建', operator: '系统', timestamp: '2026-04-08 09:00', changes: 10656, note: '初始版本，导入原始数据', records: 10656, size: '38.2 MB' },
  ],
  'dataset-3': [
    { version: 'v2.1', op: '修正', operator: '陈研究员', timestamp: '2026-04-10 15:22', changes: 112, note: '修正科技术语边界标注 112 条', records: 5600, size: '15.3 MB' },
    { version: 'v2.0', op: '标注', operator: '王标注员', timestamp: '2026-04-08 10:00', changes: 900, note: '第二轮人工标注，新增 900 条', records: 5488, size: '15.0 MB' },
    { version: 'v1.0', op: '创建', operator: '系统', timestamp: '2026-04-05 09:00', changes: 4700, note: '初始版本', records: 4700, size: '12.8 MB' },
  ],
  'dataset-7': [
    { version: 'v1.1', op: '修正', operator: '质检机器人', timestamp: '2026-04-03 08:00', changes: 340, note: '自动质检修正 340 条低置信度标注', records: 18000, size: '68.5 MB' },
    { version: 'v1.0', op: '创建', operator: '众包平台', timestamp: '2026-04-01 00:00', changes: 18000, note: '众包平台批量导入', records: 18340, size: '69.2 MB' },
  ],
};

const DEFAULT_VERSIONS: VersionEntry[] = [
  { version: 'v1.1', op: '修正', operator: '管理员', timestamp: '2026-04-01 10:00', changes: 50, note: '例行质检修正', records: 0, size: '0 B' },
  { version: 'v1.0', op: '创建', operator: '系统', timestamp: '2026-03-28 09:00', changes: 0, note: '初始版本', records: 0, size: '0 B' },
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

function getDatasetVersions(ds: Dataset, map: Record<string, VersionEntry[]>): VersionEntry[] {
  if (map[ds.id]?.length) return map[ds.id];
  return DEFAULT_VERSIONS.map((v, i) => ({
    ...v,
    records: i === 0 ? ds.records : Math.max(0, ds.records - v.changes),
    size: ds.size,
  }));
}

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

function DatasetListPanel({
  datasets,
  versionsMap,
  onViewSample,
  onDeleteVersion,
  initialExpandedId,
  highlightVersionControl,
}: {
  datasets: Dataset[];
  versionsMap: Record<string, VersionEntry[]>;
  onViewSample: (s: string) => void;
  onDeleteVersion: (datasetId: string, version: string) => void;
  initialExpandedId?: string | null;
  highlightVersionControl?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId ?? null);
  const [detailVersion, setDetailVersion] = useState<{ dataset: Dataset; version: VersionEntry } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ dataset: Dataset; version: VersionEntry; remaining: number } | null>(null);

  if (datasets.length === 0) {
    return (
      <div className="text-center py-14 text-gray-400">
        <File className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">暂无数据集</p>
        <p className="text-xs mt-1">删除全部版本后，数据集将从列表中移除</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {highlightVersionControl && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          标注数据版本控制：展开下方数据集可查看标注修正历史，支持版本回溯、差异比对与删除
        </div>
      )}
      {datasets.map(dataset => {
        const gradeCfg = GRADE_CONFIG[dataset.confidenceGrade];
        const versions = getDatasetVersions(dataset, versionsMap);
        const head = versions[0];
        const older = versions.slice(1);
        const expanded = expandedId === dataset.id;
        return (
          <div key={dataset.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{dataset.name}</h3>
                      {head && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">当前 {head.version}</span>
                      )}
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
                      <span className="flex items-center gap-1.5"><GitCommit className="w-3.5 h-3.5" />{versions.length} 个版本</span>
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
                  {head && (
                    <button onClick={() => setDetailVersion({ dataset, version: head })}
                      className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">
                      <Eye className="w-4 h-4" />管理
                    </button>
                  )}
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="下载当前版本"><Download className="w-4 h-4" /></button>
                  {head && (
                    <button onClick={() => setDeleteTarget({ dataset, version: head, remaining: versions.length - 1 })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除当前版本">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {older.length > 0 && (
              <>
                <button
                  onClick={() => setExpandedId(expanded ? null : dataset.id)}
                  className="w-full flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <span>{expanded ? '收起标注数据版本' : `标注数据版本控制（${older.length} 个历史版本）`}</span>
                  {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {expanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {older.map((v, idx) => (
                      <div key={v.version} className="px-5 py-3 flex items-start gap-4 bg-white">
                        <div className="flex flex-col items-center flex-shrink-0 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                          {idx < older.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[12px]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">{v.version}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OP_COLOR[v.op]}`}>{v.op}</span>
                            <span className="text-xs text-gray-500">{v.records.toLocaleString()} 条 · {v.size}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{v.operator}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{v.timestamp}</span>
                            {v.changes > 0 && <span>{v.changes.toLocaleString()} 条变更</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.note}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setDetailVersion({ dataset, version: v })}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                            <Eye className="w-3.5 h-3.5" />管理
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="下载此版本">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget({ dataset, version: v, remaining: versions.length - 1 })}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="删除此版本">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {detailVersion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDetailVersion(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold text-gray-900">标注数据版本控制 · {detailVersion.version.version}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{detailVersion.dataset.name}</p>
              </div>
              <button onClick={() => setDetailVersion(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span className="text-gray-500">操作类型</span><span className={`px-2 py-0.5 rounded-full text-xs ${OP_COLOR[detailVersion.version.op]}`}>{detailVersion.version.op}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">操作人</span><span>{detailVersion.version.operator}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">时间</span><span>{detailVersion.version.timestamp}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">记录数</span><span>{detailVersion.version.records.toLocaleString()} 条 · {detailVersion.version.size}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">变更条数</span><span>{detailVersion.version.changes.toLocaleString()}</span></div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">说明</p>
                <p className="text-sm text-gray-700">{detailVersion.version.note}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-1.5">
                <Download className="w-4 h-4" />下载此版本
              </button>
              <button onClick={() => {
                const v = detailVersion.version;
                const ds = detailVersion.dataset;
                const remaining = getDatasetVersions(ds, versionsMap).length - 1;
                setDetailVersion(null);
                setDeleteTarget({ dataset: ds, version: v, remaining });
              }}
                className="flex-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center justify-center gap-1.5">
                <Trash2 className="w-4 h-4" />删除此版本
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">确认删除 {deleteTarget.version.version}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {deleteTarget.remaining === 0
                    ? <>这是 <strong>{deleteTarget.dataset.name}</strong> 的最后一个版本，删除后整个数据集将从列表中移除。</>
                    : getDatasetVersions(deleteTarget.dataset, versionsMap)[0]?.version === deleteTarget.version.version
                      ? <>将删除当前版本。下一版本 <strong>{getDatasetVersions(deleteTarget.dataset, versionsMap)[1]?.version}</strong> 会自动升为当前版本。</>
                      : <>将删除历史版本 <strong>{deleteTarget.version.version}</strong>，不影响当前版本。</>}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">取消</button>
              <button onClick={() => {
                onDeleteVersion(deleteTarget.dataset.id, deleteTarget.version.version);
                setDeleteTarget(null);
              }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">确认删除</button>
            </div>
          </div>
        </div>
      )}
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
        <p className="text-sm text-gray-500 mt-0.5">
          按置信度等级筛选数据源，配置划分比例，构建训练集、验证集和测试集；算法发起训练时将引用此处划分结果
        </p>
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
  initialTab?: 'list' | 'confidence' | 'split' | 'annotation';
  initialFocus?: 'version-control';
}

function seedVersionsMap(list: Dataset[]): Record<string, VersionEntry[]> {
  const map: Record<string, VersionEntry[]> = { ...VERSIONS_BY_DATASET };
  list.forEach(ds => {
    if (!map[ds.id]?.length) map[ds.id] = getDatasetVersions(ds, {});
  });
  return map;
}

export function DatasetCategoryDetail({ categoryId, onBack, initialTab, initialFocus }: DatasetCategoryDetailProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'confidence' | 'split' | 'annotation'>(initialTab ?? 'list');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState('');
  const [grades, setGrades] = useState<Record<string, ConfidenceGrade>>({});
  const [datasets, setDatasets] = useState<Dataset[]>(() => datasetsByCategory[categoryId] ?? []);
  const [versionsMap, setVersionsMap] = useState<Record<string, VersionEntry[]>>(() =>
    seedVersionsMap(datasetsByCategory[categoryId] ?? [])
  );

  useEffect(() => {
    const list = datasetsByCategory[categoryId] ?? [];
    setDatasets(list);
    setVersionsMap(seedVersionsMap(list));
    setActiveTab(initialTab ?? 'list');
    setGrades({});
  }, [categoryId, initialTab]);

  const category = categoryInfo[categoryId];

  const onDeleteVersion = (datasetId: string, version: string) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;
    const current = versionsMap[datasetId]?.length
      ? versionsMap[datasetId]
      : getDatasetVersions(dataset, versionsMap);
    const next = current.filter(v => v.version !== version);
    if (next.length === 0) {
      setDatasets(ds => ds.filter(d => d.id !== datasetId));
      setVersionsMap(prev => {
        const rest = { ...prev };
        delete rest[datasetId];
        return rest;
      });
      return;
    }
    if (current[0]?.version === version) {
      const head = next[0];
      setDatasets(ds => ds.map(d => d.id !== datasetId ? d : {
        ...d,
        records: head.records,
        size: head.size,
        uploadDate: head.timestamp.slice(0, 10),
      }));
    }
    setVersionsMap(prev => ({ ...prev, [datasetId]: next }));
  };

  const versionExpandId = initialFocus === 'version-control'
    ? (datasets.find(d => (versionsMap[d.id]?.length ?? getDatasetVersions(d, versionsMap).length) > 1)?.id ?? datasets[0]?.id ?? null)
    : null;

  const TABS = [
    { id: 'list' as const, label: '数据集列表' },
    { id: 'confidence' as const, label: '数据源置信度评级' },
    { id: 'split' as const, label: '数据集构建与划分' },
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
            <DatasetListPanel
              datasets={datasets}
              versionsMap={versionsMap}
              onViewSample={s => { setSelectedSample(s); setShowSampleModal(true); }}
              onDeleteVersion={onDeleteVersion}
              initialExpandedId={versionExpandId}
              highlightVersionControl={initialFocus === 'version-control'}
            />
          )}
          {activeTab === 'confidence' && (
            <ConfidenceRatingPanel datasets={datasets} grades={grades} onChangeGrade={(id, g) => setGrades(prev => ({ ...prev, [id]: g }))} />
          )}
          {activeTab === 'split' && <DatasetSplitPanel datasets={datasets} grades={grades} />}
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
