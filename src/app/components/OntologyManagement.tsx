import { useState, useRef, useEffect } from 'react';
import {
  Plus, Save, Trash2, Edit2, ChevronDown, ChevronRight,
  Sparkles, X, AlertCircle, Loader2, Check, Download, FileJson, FileCode2, FileText,
  Upload, FileUp, Network, RefreshCw
} from 'lucide-react';

type PropType = 'string' | 'text' | 'int' | 'number' | 'boolean' | 'date' | 'datetime' | 'json';
type Cardinality = '1' | '0..1' | '1..*' | '0..*';
const CARDINALITY_OPTIONS: { value: Cardinality; label: string }[] = [
  { value: '1',    label: '1（必须·唯一）' },
  { value: '0..1', label: '0..1（可选·唯一）' },
  { value: '1..*', label: '1..*（必须·多值）' },
  { value: '0..*', label: '0..*（可选·多值）' },
];
interface OntoProp {
  id: string; name: string; type: PropType; required: boolean;
  description: string; cardinality: Cardinality;
  inherited?: boolean; inheritedFrom?: string;
}
interface OntoEntity { id: string; name: string; enId: string; description: string; props: OntoProp[]; }
interface OntoRelation { id: string; name: string; chName: string; from: string; to: string; description: string; weight: number; }
interface Ontology { id: string; name: string; domain: string; description: string; savedAt: string; entities: OntoEntity[]; relations: OntoRelation[]; }

const MOCK_ONTOLOGIES: Ontology[] = [
  {
    id: 'o1', name: '科技论文知识图谱本体', domain: '学术科研', description: '用于构建科技论文领域知识图谱的本体模式，涵盖论文、作者、机构及概念实体。',
    savedAt: '2024-03-15 14:23',
    entities: [
      { id: 'e0', name: '学术文献', enId: 'AcademicDocument', description: '所有学术性文献的抽象父类', props: [
        { id: 'pd1', name: '标题', type: 'string', required: true, description: '文献的完整标题', cardinality: '1' },
        { id: 'pd2', name: '发表年份', type: 'int', required: true, description: '文献正式发表或出版的年份', cardinality: '1' },
        { id: 'pd3', name: '语言', type: 'string', required: false, description: '文献撰写所用的自然语言', cardinality: '0..1' },
        { id: 'pd4', name: '关键词', type: 'string', required: false, description: '描述文献主题的关键词列表', cardinality: '0..*' },
      ]},
      { id: 'e1', name: '论文', enId: 'Paper', description: '学术论文实体', props: [
        { id: 'p2', name: '摘要', type: 'text', required: false, description: '论文内容的简要概述', cardinality: '0..1' },
        { id: 'p4', name: 'DOI', type: 'string', required: false, description: '数字对象唯一标识符', cardinality: '0..1' },
        { id: 'p3x', name: '引用数', type: 'int', required: false, description: '该论文被引用的次数', cardinality: '0..1' },
      ]},
      { id: 'e2', name: '作者', enId: 'Author', description: '论文作者实体', props: [
        { id: 'p5', name: '姓名', type: 'string', required: true, description: '作者全名', cardinality: '1' },
        { id: 'p6', name: 'ORCID', type: 'string', required: false, description: '开放研究者与贡献者识别码', cardinality: '0..1' },
        { id: 'p7', name: '邮箱', type: 'string', required: false, description: '联系邮箱地址', cardinality: '0..*' },
      ]},
      { id: 'e3', name: '机构', enId: 'Institution', description: '研究机构实体', props: [
        { id: 'p8', name: '机构名称', type: 'string', required: true, description: '机构的官方名称', cardinality: '1' },
        { id: 'p9', name: '国家', type: 'string', required: false, description: '机构所在国家', cardinality: '0..1' },
      ]},
      { id: 'e4', name: '概念', enId: 'Concept', description: '学术概念/关键词', props: [
        { id: 'p10', name: '术语', type: 'string', required: true, description: '概念的规范术语表达', cardinality: '1' },
        { id: 'p11', name: '定义', type: 'text', required: false, description: '概念的标准定义文本', cardinality: '0..1' },
      ]},
    ],
    relations: [
      { id: 'r0', name: 'IS_A', chName: '是一种', from: 'Paper', to: 'AcademicDocument', description: 'Paper 是 AcademicDocument 的子类（上下位关系）', weight: 1.00 },
      { id: 'r1', name: 'WRITTEN_BY', chName: '由...撰写', from: 'Paper', to: 'Author', description: '论文与作者的撰写关系', weight: 0.90 },
      { id: 'r2', name: 'AFFILIATED_WITH', chName: '所属机构', from: 'Author', to: 'Institution', description: '作者与所属机构的关系', weight: 0.80 },
      { id: 'r3', name: 'CITES', chName: '引用', from: 'Paper', to: 'Paper', description: '论文之间的引用关系', weight: 0.70 },
      { id: 'r4', name: 'HAS_CONCEPT', chName: '包含概念', from: 'Paper', to: 'Concept', description: '论文包含的研究概念', weight: 0.60 },
    ],
  },
  {
    id: 'o2', name: '新能源产业图谱本体', domain: '能源产业', description: '新能源产业链知识图谱本体，涵盖企业、技术、产品等实体。',
    savedAt: '2024-03-10 09:15',
    entities: [
      { id: 'e5', name: '企业', enId: 'Company', description: '新能源企业', props: [
        { id: 'p12', name: '企业名称', type: 'string', required: true, description: '企业官方注册名称', cardinality: '1' },
        { id: 'p13', name: '注册地', type: 'string', required: false, description: '企业注册地区或国家', cardinality: '0..1' },
      ]},
      { id: 'e6', name: '技术', enId: 'Technology', description: '能源技术', props: [
        { id: 'p14', name: '技术名称', type: 'string', required: true, description: '技术的规范名称', cardinality: '1' },
        { id: 'p15', name: '成熟度', type: 'string', required: false, description: '技术成熟度等级（TRL）', cardinality: '0..1' },
      ]},
    ],
    relations: [
      { id: 'r5', name: 'DEVELOPS', chName: '研发', from: 'Company', to: 'Technology', description: '企业研发技术', weight: 0.85 },
    ],
  },
];

const PROP_TYPES: PropType[] = ['string', 'text', 'int', 'number', 'boolean', 'date', 'datetime', 'json'];

const MOCK_PREDICTIONS = [
  { id: 'c1', name: '学术期刊', confidence: 92, reason: '论文通常发表于期刊，建议添加父概念' },
  { id: 'c2', name: '科研成果', confidence: 87, reason: '论文属于科研产出的一种形式' },
  { id: 'c3', name: '文献资料', confidence: 78, reason: '论文是学术文献的重要类型' },
  { id: 'c4', name: '知识产品', confidence: 65, reason: '论文作为知识载体的上位概念' },
  { id: 'c5', name: '出版物', confidence: 58, reason: '已发表论文属于出版物范畴' },
];

// ─── Hypernym Prediction ─────────────────────────────────────────────────────

interface HierarchyPrediction {
  id: string;
  direction: 'parent' | 'child';
  entityName: string;       // 预测出的父/子实体类名
  entityEnId: string;       // 英文 ID
  confidence: number;       // 0-100
  reason: string;
  adopted: boolean;
  ignored: boolean;
}

const HYPERNYM_SEED: Record<string, { parents: Omit<HierarchyPrediction, 'id' | 'adopted' | 'ignored'>[]; children: Omit<HierarchyPrediction, 'id' | 'adopted' | 'ignored'>[] }> = {
  Paper: {
    parents: [
      { direction: 'parent', entityName: '学术文献', entityEnId: 'AcademicDocument', confidence: 95, reason: '论文属于学术文献的核心子类，语义包含关系明确' },
      { direction: 'parent', entityName: '出版物', entityEnId: 'Publication', confidence: 88, reason: '已发表论文本质上是一类出版物' },
      { direction: 'parent', entityName: '知识产品', entityEnId: 'KnowledgeArtifact', confidence: 72, reason: '论文作为知识载体，属于知识产品上位类' },
    ],
    children: [
      { direction: 'child', entityName: '期刊论文', entityEnId: 'JournalArticle', confidence: 93, reason: '期刊论文是论文的典型子类，以期刊为载体发表' },
      { direction: 'child', entityName: '会议论文', entityEnId: 'ConferencePaper', confidence: 91, reason: '会议论文在学术会议中发表，是论文的重要子类型' },
      { direction: 'child', entityName: '学位论文', entityEnId: 'Thesis', confidence: 84, reason: '学位论文（硕/博）是论文的专属子类' },
    ],
  },
  Author: {
    parents: [
      { direction: 'parent', entityName: '研究人员', entityEnId: 'Researcher', confidence: 96, reason: '作者通常具备研究人员身份，二者高度重叠' },
      { direction: 'parent', entityName: '人物', entityEnId: 'Person', confidence: 99, reason: '作者是人物实体的直接子类，关系最为基础' },
    ],
    children: [
      { direction: 'child', entityName: '通讯作者', entityEnId: 'CorrespondingAuthor', confidence: 89, reason: '通讯作者是作者的特殊角色，负责论文通讯联络' },
      { direction: 'child', entityName: '第一作者', entityEnId: 'FirstAuthor', confidence: 87, reason: '第一作者是作者的贡献角色子类' },
    ],
  },
  Institution: {
    parents: [
      { direction: 'parent', entityName: '组织机构', entityEnId: 'Organization', confidence: 98, reason: '机构是组织机构的直接子类，语义明确' },
      { direction: 'parent', entityName: '法人实体', entityEnId: 'LegalEntity', confidence: 80, reason: '研究机构通常具有法人资格' },
    ],
    children: [
      { direction: 'child', entityName: '大学', entityEnId: 'University', confidence: 92, reason: '大学是研究机构的典型子类型' },
      { direction: 'child', entityName: '研究所', entityEnId: 'ResearchInstitute', confidence: 88, reason: '独立研究所是机构的专属子类型' },
      { direction: 'child', entityName: '企业研发部门', entityEnId: 'CorporateRD', confidence: 74, reason: '企业的研发部门具有机构属性' },
    ],
  },
  Concept: {
    parents: [
      { direction: 'parent', entityName: '知识单元', entityEnId: 'KnowledgeUnit', confidence: 91, reason: '学术概念是知识体系的基本组成单元' },
      { direction: 'parent', entityName: '术语', entityEnId: 'Term', confidence: 85, reason: '概念通常以术语形式存在并被引用' },
    ],
    children: [
      { direction: 'child', entityName: '方法论概念', entityEnId: 'MethodologicalConcept', confidence: 82, reason: '科研方法论相关的概念子类' },
      { direction: 'child', entityName: '领域术语', entityEnId: 'DomainTerm', confidence: 79, reason: '特定领域的专有概念术语' },
    ],
  },
  Company: {
    parents: [
      { direction: 'parent', entityName: '组织机构', entityEnId: 'Organization', confidence: 97, reason: '企业是组织机构的典型子类' },
      { direction: 'parent', entityName: '市场主体', entityEnId: 'MarketEntity', confidence: 85, reason: '企业是市场经济中的主要市场主体' },
    ],
    children: [
      { direction: 'child', entityName: '上市企业', entityEnId: 'ListedCompany', confidence: 88, reason: '上市企业是企业的特殊子类，已在证交所上市' },
      { direction: 'child', entityName: '初创企业', entityEnId: 'Startup', confidence: 80, reason: '初创企业处于发展早期阶段的企业子类' },
    ],
  },
  Technology: {
    parents: [
      { direction: 'parent', entityName: '知识', entityEnId: 'Knowledge', confidence: 90, reason: '技术是人类知识体系中的应用性知识' },
      { direction: 'parent', entityName: '创新成果', entityEnId: 'Innovation', confidence: 84, reason: '技术通常源于科研或工程创新活动' },
    ],
    children: [
      { direction: 'child', entityName: '核心技术', entityEnId: 'CoreTechnology', confidence: 86, reason: '核心技术是技术中不可替代的关键子类' },
      { direction: 'child', entityName: '专利技术', entityEnId: 'PatentedTechnology', confidence: 81, reason: '受专利保护的技术形成专属子类' },
    ],
  },
};

function getHierarchyPredictions(enId: string): HierarchyPrediction[] {
  const seed = HYPERNYM_SEED[enId];
  if (!seed) {
    // fallback generic
    return [
      { id: 'h1', direction: 'parent', entityName: '实体类', entityEnId: 'Entity', confidence: 70, reason: '通用上位概念', adopted: false, ignored: false },
      { id: 'h2', direction: 'child', entityName: `${enId}子类`, entityEnId: `${enId}Sub`, confidence: 65, reason: '基于名称推断的泛化子类', adopted: false, ignored: false },
    ];
  }
  return [
    ...seed.parents.map((p, i) => ({ ...p, id: `hp_${i}`, adopted: false, ignored: false })),
    ...seed.children.map((c, i) => ({ ...c, id: `hc_${i}`, adopted: false, ignored: false })),
  ];
}

interface HypernymPredictionPanelProps {
  entities: OntoEntity[];
  onAdopt: (relation: Omit<OntoRelation, 'id'>) => void;
}

function HypernymPredictionPanel({ entities, onAdopt }: HypernymPredictionPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedEnId, setSelectedEnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<HierarchyPrediction[]>([]);
  const [filterDir, setFilterDir] = useState<'all' | 'parent' | 'child'>('all');

  const handlePredict = () => {
    if (!selectedEnId) return;
    setLoading(true);
    setPredictions([]);
    setTimeout(() => {
      setPredictions(getHierarchyPredictions(selectedEnId));
      setLoading(false);
    }, 900);
  };

  const handleAdopt = (p: HierarchyPrediction) => {
    // parent prediction: selectedEntity IS_A p.entityName (selected → parent)
    // child prediction: p.entityName IS_A selectedEntity (child → selected)
    const relation: Omit<OntoRelation, 'id'> = p.direction === 'parent'
      ? { name: 'IS_A', chName: '是一种', from: selectedEnId, to: p.entityEnId, description: `${selectedEnId} 是 ${p.entityName} 的子类（上下位关系预测，置信度 ${p.confidence}%）`, weight: parseFloat((p.confidence / 100).toFixed(2)) }
      : { name: 'HAS_SUBCLASS', chName: '包含子类', from: selectedEnId, to: p.entityEnId, description: `${p.entityName} 是 ${selectedEnId} 的子类（上下位关系预测，置信度 ${p.confidence}%）`, weight: parseFloat((p.confidence / 100).toFixed(2)) };
    onAdopt(relation);
    setPredictions(prev => prev.map(x => x.id === p.id ? { ...x, adopted: true } : x));
  };

  const handleIgnore = (id: string) => {
    setPredictions(prev => prev.map(x => x.id === id ? { ...x, ignored: true } : x));
  };

  const visible = predictions.filter(p => filterDir === 'all' || p.direction === filterDir);

  return (
    <div className="bg-white border border-indigo-200 rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-indigo-50 transition-colors text-left"
      >
        <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Network size={14} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-indigo-800">上下位关系预测</span>
          <span className="ml-2 text-xs text-indigo-400">选择实体类，AI 预测其父/子实体类并推荐关系</span>
        </div>
        <ChevronDown size={15} className={`text-indigo-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-indigo-100 p-4 space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3">
            <select
              value={selectedEnId}
              onChange={e => { setSelectedEnId(e.target.value); setPredictions([]); }}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white"
            >
              <option value="">选择实体类型…</option>
              {entities.map(e => (
                <option key={e.id} value={e.enId}>{e.name}（{e.enId}）</option>
              ))}
            </select>
            <button
              onClick={handlePredict}
              disabled={!selectedEnId || loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
            >
              {loading
                ? <Loader2 size={14} className="animate-spin" />
                : <Sparkles size={14} />}
              {loading ? '预测中…' : '运行预测'}
            </button>
          </div>

          {/* Results */}
          {predictions.length > 0 && (
            <div className="space-y-3">
              {/* Filter tabs */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">筛选：</span>
                {(['all', 'parent', 'child'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setFilterDir(d)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${filterDir === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {{ all: '全部', parent: '父类', child: '子类' }[d]}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-400">
                  {predictions.filter(p => !p.ignored).length} 条推荐
                </span>
              </div>

              <div className="space-y-2">
                {visible.map(p => (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 transition-opacity ${p.ignored ? 'opacity-35 bg-gray-50 border-gray-100' : p.adopted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* direction badge */}
                      <span className={`mt-0.5 flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${p.direction === 'parent' ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'}`}>
                        {p.direction === 'parent' ? '↑ 父类' : '↓ 子类'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-800">{p.entityName}</span>
                          <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{p.entityEnId}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{p.reason}</p>
                        {/* Confidence bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.confidence >= 90 ? 'bg-green-500' : p.confidence >= 75 ? 'bg-blue-500' : 'bg-amber-400'}`}
                              style={{ width: `${p.confidence}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium w-8 text-right ${p.confidence >= 90 ? 'text-green-600' : p.confidence >= 75 ? 'text-blue-600' : 'text-amber-600'}`}>
                            {p.confidence}%
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1.5 ml-1">
                        {p.adopted ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Check size={12} />已采纳
                          </span>
                        ) : p.ignored ? null : (
                          <>
                            <button
                              onClick={() => handleAdopt(p)}
                              className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                              一键采纳
                            </button>
                            <button
                              onClick={() => handleIgnore(p.id)}
                              className="text-xs px-2 py-1 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              忽略
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* adopted: show what relation was added */}
                    {p.adopted && (
                      <div className="mt-2 text-[11px] text-green-700 bg-green-100 rounded-lg px-2.5 py-1.5">
                        已添加关系：<span className="font-mono font-medium">{p.direction === 'parent' ? 'IS_A' : 'HAS_SUBCLASS'}</span>
                        &nbsp;（{p.direction === 'parent' ? `${selectedEnId} → ${p.entityEnId}` : `${selectedEnId} → ${p.entityEnId}`}）
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handlePredict}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <RefreshCw size={11} />重新预测
              </button>
            </div>
          )}

          {/* Empty hint */}
          {!loading && predictions.length === 0 && selectedEnId && (
            <p className="text-xs text-gray-400 text-center py-2">选择实体后点击「运行预测」获取上下位关系推荐</p>
          )}
          {!selectedEnId && (
            <p className="text-xs text-gray-400 text-center py-2">请先从左侧选择一个实体类型</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── File Upload Panel ────────────────────────────────────────────────────────

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: 'owl' | 'rdf' | 'rdfs' | 'other';
  uploadedAt: string;
  status: 'ready' | 'importing' | 'imported';
}

function getFileType(name: string): UploadedFile['type'] {
  if (name.endsWith('.owl') || name.endsWith('.ttl') || name.endsWith('.jsonld')) return 'owl';
  if (name.endsWith('.rdf') || name.endsWith('.xml')) return 'rdf';
  if (name.endsWith('.rdfs')) return 'rdfs';
  return 'other';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

const FILE_TYPE_COLORS: Record<UploadedFile['type'], string> = {
  owl: 'bg-purple-50 text-purple-700 border-purple-200',
  rdf: 'bg-blue-50 text-blue-700 border-blue-200',
  rdfs: 'bg-green-50 text-green-700 border-green-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
};

const FILE_TYPE_LABELS: Record<UploadedFile['type'], string> = {
  owl: 'OWL 本体',
  rdf: 'RDF 数据',
  rdfs: 'RDFS 词汇',
  other: '其他',
};

function FileUploadPanel() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: 'f_' + Date.now() + Math.random(),
      name: f.name,
      size: f.size,
      type: getFileType(f.name),
      uploadedAt: new Date().toLocaleString('zh-CN').replace(/\//g, '-'),
      status: 'ready',
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleImport = (id: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'importing' } : f));
    setTimeout(() => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'imported' } : f));
    }, 1200);
  };

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-800">本体文件导入</span>
          <span className="ml-2 text-xs text-gray-400">支持 OWL、RDF、RDFS 格式文件，导入后关联为图谱数据</span>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Upload size={12} /> 上传文件
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept=".owl,.rdf,.rdfs,.xml,.ttl,.jsonld,.json"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => files.length === 0 && fileRef.current?.click()}
        className={`transition-colors ${files.length === 0 ? 'cursor-pointer' : ''} ${dragging ? 'bg-blue-50' : ''}`}
      >
        {files.length === 0 ? (
          <div className={`flex flex-col items-center gap-2 py-8 border-2 border-dashed mx-4 my-3 rounded-xl transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
            <FileUp size={24} className={dragging ? 'text-blue-400' : 'text-gray-300'} />
            <p className="text-xs text-gray-400">拖拽文件到此处，或点击上传</p>
            <p className="text-[11px] text-gray-300">.owl · .rdf · .rdfs · .ttl · .jsonld</p>
          </div>
        ) : (
          <div className={`px-4 py-3 space-y-2 ${dragging ? 'bg-blue-50' : ''}`}>
            {dragging && (
              <div className="border-2 border-dashed border-blue-400 rounded-xl py-4 flex items-center justify-center mb-2">
                <p className="text-xs text-blue-500">松开以添加文件</p>
              </div>
            )}
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100 group">
                <FileCode2 size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-800 truncate">{f.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${FILE_TYPE_COLORS[f.type]}`}>
                      {FILE_TYPE_LABELS[f.type]}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{formatSize(f.size)} · {f.uploadedAt}</div>
                </div>
                {f.status === 'ready' && (
                  <button
                    onClick={() => handleImport(f.id)}
                    className="text-xs px-2.5 py-1 border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    导入入图
                  </button>
                )}
                {f.status === 'importing' && (
                  <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                    <Loader2 size={12} className="animate-spin" /> 导入中...
                  </span>
                )}
                {f.status === 'imported' && (
                  <span className="text-xs text-green-600 flex items-center gap-1 flex-shrink-0">
                    <Check size={12} /> 已入图
                  </span>
                )}
                <button
                  onClick={() => handleDelete(f.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Weight Input ─────────────────────────────────────────────────────────────

function WeightInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamped = Math.max(0, Math.min(1, value));
  const color = clamped >= 0.8 ? 'bg-blue-500' : clamped >= 0.5 ? 'bg-indigo-400' : clamped >= 0.3 ? 'bg-amber-400' : 'bg-gray-300';

  return (
    <div className="flex items-center gap-2 min-w-[112px]">
      {/* Visual bar */}
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped * 100}%` }} />
      </div>
      {/* Numeric input */}
      <input
        type="number"
        min={0} max={1} step={0.01}
        value={clamped}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(0, Math.min(1, parseFloat(v.toFixed(2)))));
        }}
        className="w-14 border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-center font-mono focus:outline-none focus:border-blue-400 focus:bg-blue-50 transition-colors"
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PropRow({ prop, onChange, onDelete }: {
  prop: OntoProp;
  onChange: (p: OntoProp) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2 w-32">
        <input
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 w-full"
          value={prop.name}
          onChange={e => onChange({ ...prop, name: e.target.value })}
        />
      </td>
      <td className="px-3 py-2 w-28">
        <select
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white w-full"
          value={prop.type}
          onChange={e => onChange({ ...prop, type: e.target.value as PropType })}
        >
          {PROP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td className="px-3 py-2 w-32">
        <select
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white w-full"
          value={prop.cardinality ?? '0..1'}
          onChange={e => onChange({ ...prop, cardinality: e.target.value as Cardinality })}
        >
          {CARDINALITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 w-full"
          placeholder="属性描述…"
          value={prop.description ?? ''}
          onChange={e => onChange({ ...prop, description: e.target.value })}
        />
      </td>
      <td className="px-3 py-2 text-center w-12">
        <input type="checkbox" checked={prop.required} onChange={e => onChange({ ...prop, required: e.target.checked })} />
      </td>
      <td className="px-3 py-2 text-center w-8">
        <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors">
          <X size={14} />
        </button>
      </td>
    </tr>
  );
}

function EntityCard({ entity, onUpdate, onDelete, onSparkles, inheritedProps }: {
  entity: OntoEntity;
  onUpdate: (e: OntoEntity) => void;
  onDelete: () => void;
  onSparkles: () => void;
  inheritedProps?: OntoProp[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(entity.name);
  const [editEnId, setEditEnId] = useState(entity.enId);
  const [editDesc, setEditDesc] = useState(entity.description);

  const handleSaveEdit = () => {
    onUpdate({ ...entity, name: editName, enId: editEnId, description: editDesc });
    setEditing(false);
  };

  const addProp = () => {
    const newProp: OntoProp = { id: 'p_' + Date.now(), name: '新属性', type: 'string', required: false, description: '', cardinality: '0..1' };
    onUpdate({ ...entity, props: [...entity.props, newProp] });
  };

  const updateProp = (idx: number, p: OntoProp) => {
    const props = [...entity.props];
    props[idx] = p;
    onUpdate({ ...entity, props });
  };

  const deleteProp = (idx: number) => {
    onUpdate({ ...entity, props: entity.props.filter((_, i) => i !== idx) });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2">
        {editing ? (
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 flex-1" value={editName} onChange={e => setEditName(e.target.value)} placeholder="中文名称" />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 flex-1" value={editEnId} onChange={e => setEditEnId(e.target.value)} placeholder="English ID" />
            </div>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="描述" />
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">保存</button>
              <button onClick={() => setEditing(false)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800">{entity.name}</span>
                <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{entity.enId}</span>
                {inheritedProps && inheritedProps.length > 0 && (
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full border border-violet-200">
                    继承 {inheritedProps.length} 个属性
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{entity.props.length} 个自有属性{inheritedProps && inheritedProps.length > 0 ? ` + ${inheritedProps.length} 个继承属性` : ''}</div>
            </div>
            <button onClick={onSparkles} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors" title="概念预测">
              <Sparkles size={15} />
            </button>
            <button onClick={() => { setEditing(true); setEditName(entity.name); setEditEnId(entity.enId); setEditDesc(entity.description); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <Edit2 size={15} />
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
      {expanded && !editing && (
        <div className="border-t border-gray-100">
          {/* 继承属性区域 */}
          {inheritedProps && inheritedProps.length > 0 && (
            <div className="border-b border-violet-100 bg-violet-50/60">
              <div className="px-3 py-2 flex items-center gap-1.5">
                <ChevronDown size={12} className="text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-700">继承属性</span>
                <span className="text-[10px] text-violet-400">来自父实体类 · 只读，不可修改</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-violet-100/60 border-y border-violet-100">
                  <tr>
                    <th className="text-left text-[11px] font-medium text-violet-500 px-3 py-1.5 w-32">属性名称</th>
                    <th className="text-left text-[11px] font-medium text-violet-500 px-3 py-1.5 w-28">类型</th>
                    <th className="text-left text-[11px] font-medium text-violet-500 px-3 py-1.5 w-32">基数</th>
                    <th className="text-left text-[11px] font-medium text-violet-500 px-3 py-1.5">描述</th>
                    <th className="text-left text-[11px] font-medium text-violet-500 px-3 py-1.5 w-12">必填</th>
                    <th className="text-left text-[11px] font-medium text-violet-500 px-3 py-1.5 w-24">来源</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-100">
                  {inheritedProps.map(p => (
                    <tr key={p.id} className="bg-violet-50/40 opacity-80">
                      <td className="px-3 py-2 text-sm text-violet-800 font-medium">{p.name}</td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px] text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">{p.type}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px] text-violet-600">{p.cardinality}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-violet-600">{p.description}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.required ? 'bg-violet-200 text-violet-700' : 'text-violet-300'}`}>
                          {p.required ? '必填' : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full">{p.inheritedFrom}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 自有属性 */}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 w-32">属性名称</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 w-28">类型</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 w-32">基数</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">描述</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 w-12">必填</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {entity.props.map((p, i) => (
                <PropRow key={p.id} prop={p} onChange={np => updateProp(i, np)} onDelete={() => deleteProp(i)} />
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t border-gray-100">
            <button onClick={addProp} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={12} /> 添加属性
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptPredictionDrawer({ entity, onClose }: { entity: OntoEntity; onClose: () => void }) {
  const [tab, setTab] = useState<'parent' | 'child'>('parent');
  const [adopted, setAdopted] = useState<string[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">概念预测</div>
          <div className="text-xs text-gray-400">{entity.name}</div>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X size={16} />
        </button>
      </div>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-full p-0.5">
          <button onClick={() => setTab('parent')} className={`flex-1 text-xs py-1 rounded-full transition-colors ${tab === 'parent' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>父概念</button>
          <button onClick={() => setTab('child')} className={`flex-1 text-xs py-1 rounded-full transition-colors ${tab === 'child' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>子概念</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {MOCK_PREDICTIONS.map(c => {
          const isAdopted = adopted.includes(c.id);
          const isIgnored = ignored.includes(c.id);
          return (
            <div key={c.id} className={`bg-white border rounded-xl p-3 ${isIgnored ? 'opacity-40' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-800">{c.name}</span>
                {isAdopted ? (
                  <span className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> 已采纳</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{c.confidence}%</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2">{c.reason}</p>
              {!isAdopted && !isIgnored && (
                <div className="flex gap-2">
                  <button onClick={() => setAdopted(a => [...a, c.id])} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">一键采纳</button>
                  <button onClick={() => setIgnored(ig => [...ig, c.id])} className="text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">忽略</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Export format generators ─────────────────────────────────────────────────

type ExportFormat = 'json-ld' | 'owl-xml' | 'turtle' | 'json';

const TYPE_TO_XSD: Record<string, string> = {
  string: 'xsd:string', text: 'xsd:string', int: 'xsd:integer',
  number: 'xsd:decimal', boolean: 'xsd:boolean',
  date: 'xsd:date', datetime: 'xsd:dateTime', json: 'xsd:string',
};

function generateJsonLd(o: Ontology): string {
  const base = `http://kg.yinji.tech/ontology/${o.id}#`;
  const graph: object[] = [
    { '@type': 'owl:Ontology', '@id': base.slice(0, -1), 'rdfs:label': o.name, 'rdfs:comment': o.description, 'dc:subject': o.domain },
  ];
  for (const e of o.entities) {
    graph.push({ '@id': `${base}${e.enId}`, '@type': 'owl:Class', 'rdfs:label': [{ '@value': e.name, '@language': 'zh' }, { '@value': e.enId, '@language': 'en' }], 'rdfs:comment': e.description });
    for (const p of e.props) {
      graph.push({ '@id': `${base}${e.enId}_${p.name}`, '@type': 'owl:DatatypeProperty', 'rdfs:domain': { '@id': `${base}${e.enId}` }, 'rdfs:range': { '@id': `http://www.w3.org/2001/XMLSchema#${TYPE_TO_XSD[p.type]?.replace('xsd:', '')}` }, 'rdfs:label': p.name, 'kg:required': p.required });
    }
  }
  for (const r of o.relations) {
    graph.push({ '@id': `${base}${r.name}`, '@type': 'owl:ObjectProperty', 'rdfs:domain': { '@id': `${base}${r.from}` }, 'rdfs:range': { '@id': `${base}${r.to}` }, 'rdfs:label': [{ '@value': r.chName, '@language': 'zh' }, { '@value': r.name, '@language': 'en' }], 'rdfs:comment': r.description, 'kg:weight': r.weight ?? 1 });
  }
  return JSON.stringify({
    '@context': { '@vocab': base, rdfs: 'http://www.w3.org/2000/01/rdf-schema#', owl: 'http://www.w3.org/2002/07/owl#', xsd: 'http://www.w3.org/2001/XMLSchema#', dc: 'http://purl.org/dc/elements/1.1/', kg: 'http://kg.yinji.tech/meta#' },
    '@graph': graph,
  }, null, 2);
}

function generateOwlXml(o: Ontology): string {
  const base = `http://kg.yinji.tech/ontology/${o.id}`;
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<Ontology xmlns="http://www.w3.org/2002/07/owl#"`,
    `  xml:base="${base}"`,
    `  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"`,
    `  xmlns:xsd="http://www.w3.org/2001/XMLSchema#"`,
    `  ontologyIRI="${base}">`,
    '',
    `  <!-- ${o.name} | ${o.domain} -->`,
    `  <!-- ${o.description} -->`,
    '',
    '  <!-- Classes -->',
  ];
  for (const e of o.entities) {
    lines.push(`  <Declaration><Class IRI="#${e.enId}"/></Declaration>`);
    lines.push(`  <AnnotationAssertion><AnnotationProperty abbreviatedIRI="rdfs:label"/><IRI>#${e.enId}</IRI><Literal xml:lang="zh">${e.name}</Literal></AnnotationAssertion>`);
    if (e.description) lines.push(`  <AnnotationAssertion><AnnotationProperty abbreviatedIRI="rdfs:comment"/><IRI>#${e.enId}</IRI><Literal>${e.description}</Literal></AnnotationAssertion>`);
  }
  lines.push('', '  <!-- Datatype Properties -->');
  for (const e of o.entities) {
    for (const p of e.props) {
      const propId = `${e.enId}_${p.name}`;
      lines.push(`  <Declaration><DataProperty IRI="#${propId}"/></Declaration>`);
      lines.push(`  <DataPropertyDomain><DataProperty IRI="#${propId}"/><Class IRI="#${e.enId}"/></DataPropertyDomain>`);
      lines.push(`  <DataPropertyRange><DataProperty IRI="#${propId}"/><Datatype abbreviatedIRI="${TYPE_TO_XSD[p.type]}"/></DataPropertyRange>`);
      if (p.required) lines.push(`  <FunctionalDataProperty><DataProperty IRI="#${propId}"/></FunctionalDataProperty>`);
    }
  }
  lines.push('', '  <!-- Object Properties -->');
  for (const r of o.relations) {
    lines.push(`  <Declaration><ObjectProperty IRI="#${r.name}"/></Declaration>`);
    lines.push(`  <ObjectPropertyDomain><ObjectProperty IRI="#${r.name}"/><Class IRI="#${r.from}"/></ObjectPropertyDomain>`);
    lines.push(`  <ObjectPropertyRange><ObjectProperty IRI="#${r.name}"/><Class IRI="#${r.to}"/></ObjectPropertyRange>`);
    lines.push(`  <AnnotationAssertion><AnnotationProperty abbreviatedIRI="rdfs:label"/><IRI>#${r.name}</IRI><Literal xml:lang="zh">${r.chName}</Literal></AnnotationAssertion>`);
    lines.push(`  <AnnotationAssertion><AnnotationProperty IRI="http://kg.yinji.tech/meta#weight"/><IRI>#${r.name}</IRI><Literal datatypeIRI="&xsd;decimal">${r.weight ?? 1}</Literal></AnnotationAssertion>`);
  }
  lines.push('', '</Ontology>');
  return lines.join('\n');
}

function generateTurtle(o: Ontology): string {
  const base = `http://kg.yinji.tech/ontology/${o.id}#`;
  const lines: string[] = [
    `@prefix owl: <http://www.w3.org/2002/07/owl#> .`,
    `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`,
    `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`,
    `@prefix kg: <http://kg.yinji.tech/meta#> .`,
    `@prefix : <${base}> .`,
    '',
    `<${base.slice(0, -1)}>`,
    `    a owl:Ontology ;`,
    `    rdfs:label "${o.name}"@zh ;`,
    `    rdfs:comment "${o.description.replace(/"/g, '\\"')}"@zh ;`,
    `    kg:domain "${o.domain}" .`,
    '',
    '# ── Classes ──',
  ];
  for (const e of o.entities) {
    lines.push(`\n:${e.enId} a owl:Class ;`);
    lines.push(`    rdfs:label "${e.name}"@zh, "${e.enId}"@en ;`);
    lines.push(`    rdfs:comment "${e.description}"@zh .`);
    for (const p of e.props) {
      lines.push(`\n:${e.enId}_${p.name} a owl:DatatypeProperty ;`);
      lines.push(`    rdfs:domain :${e.enId} ;`);
      lines.push(`    rdfs:range ${TYPE_TO_XSD[p.type]} ;`);
      lines.push(`    rdfs:label "${p.name}"@zh ;`);
      lines.push(`    kg:required ${p.required} .`);
    }
  }
  lines.push('\n# ── Object Properties ──');
  for (const r of o.relations) {
    lines.push(`\n:${r.name} a owl:ObjectProperty ;`);
    lines.push(`    rdfs:domain :${r.from} ;`);
    lines.push(`    rdfs:range :${r.to} ;`);
    lines.push(`    rdfs:label "${r.chName}"@zh, "${r.name}"@en ;`);
    lines.push(`    rdfs:comment "${r.description}"@zh ;`);
    lines.push(`    kg:weight ${r.weight ?? 1} .`);
  }
  return lines.join('\n');
}

function generateInternalJson(o: Ontology): string {
  return JSON.stringify({
    schema_version: '1.0',
    exported_at: new Date().toISOString(),
    ontology: {
      id: o.id, name: o.name, domain: o.domain, description: o.description,
      entities: o.entities.map(e => ({
        id: e.enId, label_zh: e.name, description: e.description,
        properties: e.props.map(p => ({ name: p.name, type: p.type, required: p.required })),
      })),
      relations: o.relations.map(r => ({
        name: r.name, label_zh: r.chName, from: r.from, to: r.to, description: r.description, weight: r.weight ?? 1,
      })),
    },
  }, null, 2);
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OntologyManagement() {
  const [ontologies, setOntologies] = useState<Ontology[]>(MOCK_ONTOLOGIES);
  const [selectedId, setSelectedId] = useState('o1');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [drawerEntity, setDrawerEntity] = useState<OntoEntity | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [addingRelation, setAddingRelation] = useState(false);
  const [newRelation, setNewRelation] = useState({ name: '', chName: '', from: '', to: '', description: '', weight: 1.0 });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const current = ontologies.find(o => o.id === selectedId) || ontologies[0];

  const updateCurrent = (o: Ontology) => setOntologies(prev => prev.map(x => x.id === o.id ? o : x));

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      updateCurrent({ ...current, savedAt: new Date().toLocaleString('zh-CN').replace(/\//g, '-') });
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleCreate = () => {
    const id = 'o_' + Date.now();
    const novo: Ontology = { id, name: newName, domain: newDomain, description: '', savedAt: '-', entities: [], relations: [] };
    setOntologies(prev => [...prev, novo]);
    setSelectedId(id);
    setShowNewModal(false);
    setNewName(''); setNewDomain('');
  };

  const handleDelete = () => {
    setOntologies(prev => prev.filter(o => o.id !== selectedId));
    setSelectedId(ontologies.find(o => o.id !== selectedId)?.id || '');
    setShowDeleteModal(false);
  };

  const addEntity = () => {
    const e: OntoEntity = { id: 'e_' + Date.now(), name: '新实体', enId: 'NewEntity', description: '', props: [] };
    updateCurrent({ ...current, entities: [...current.entities, e] });
  };

  const updateEntity = (idx: number, e: OntoEntity) => {
    const entities = [...current.entities];
    entities[idx] = e;
    updateCurrent({ ...current, entities });
  };

  const deleteEntity = (idx: number) => {
    updateCurrent({ ...current, entities: current.entities.filter((_, i) => i !== idx) });
  };

  const addRelation = () => {
    if (!newRelation.name) return;
    const r: OntoRelation = { id: 'r_' + Date.now(), ...newRelation };
    updateCurrent({ ...current, relations: [...current.relations, r] });
    setAddingRelation(false);
    setNewRelation({ name: '', chName: '', from: '', to: '', description: '', weight: 1.0 });
  };

  const updateRelation = (idx: number, r: OntoRelation) => {
    const relations = [...current.relations];
    relations[idx] = r;
    updateCurrent({ ...current, relations });
  };

  const deleteRelation = (idx: number) => {
    updateCurrent({ ...current, relations: current.relations.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {ontologies.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
          {current.domain} · 上次保存 {current.savedAt}
        </div>
        <div className="flex-1" />
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option>从模板创建</option>
          <option>学术论文模板</option>
          <option>企业知识图谱模板</option>
        </select>
        <button onClick={() => setShowNewModal(true)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
          <Plus size={14} /> 新建
        </button>
        <button onClick={handleSave} disabled={saveStatus === 'saving'} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
          {saveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> : saveStatus === 'saved' ? <Check size={14} /> : <Save size={14} />}
          {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '已保存' : '保存修改'}
        </button>
        {/* Export dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(v => !v)}
            className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download size={14} /> 导出 <ChevronDown size={12} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {([
                { fmt: 'json-ld' as ExportFormat, label: 'JSON-LD', ext: '.jsonld', mime: 'application/ld+json', Icon: FileJson },
                { fmt: 'owl-xml' as ExportFormat, label: 'OWL/XML', ext: '.owl', mime: 'application/rdf+xml', Icon: FileCode2 },
                { fmt: 'turtle' as ExportFormat, label: 'Turtle (RDF)', ext: '.ttl', mime: 'text/turtle', Icon: FileText },
                { fmt: 'json' as ExportFormat, label: 'JSON (内部格式)', ext: '.json', mime: 'application/json', Icon: FileJson },
              ] as const).map(({ fmt, label, ext, mime, Icon }) => (
                <button
                  key={fmt}
                  disabled={exporting !== null}
                  onClick={() => {
                    setExporting(fmt);
                    const content = fmt === 'json-ld' ? generateJsonLd(current)
                      : fmt === 'owl-xml' ? generateOwlXml(current)
                      : fmt === 'turtle' ? generateTurtle(current)
                      : generateInternalJson(current);
                    downloadFile(content, `${current.name}${ext}`, mime);
                    setTimeout(() => { setExporting(null); setShowExportMenu(false); }, 600);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {exporting === fmt ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Icon size={14} className="text-gray-400" />}
                  {label}
                  <span className="ml-auto text-xs text-gray-400">{ext}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setShowDeleteModal(true)} className="text-sm px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5">
          <Trash2 size={14} /> 删除
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File Upload */}
          <FileUploadPanel />

          {/* Basic Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm font-semibold text-gray-800 mb-4">本体基本信息</div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-500 mb-1.5">本体名称</div>
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full"
                  value={current.name} onChange={e => updateCurrent({ ...current, name: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">领域</div>
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full"
                  value={current.domain} onChange={e => updateCurrent({ ...current, domain: e.target.value })} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">Schema 提示</div>
                <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 h-[38px] flex items-center">实体 {current.entities.length} 个 · 关系 {current.relations.length} 个</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1.5">描述</div>
              <textarea className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full resize-none" rows={2}
                value={current.description} onChange={e => updateCurrent({ ...current, description: e.target.value })} />
            </div>
          </div>

          {/* Entities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">实体类型</div>
              <button onClick={addEntity} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
                <Plus size={14} /> 新增实体类型
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {current.entities.map((e, i) => {
                // Compute inherited props: find all IS_A/HAS_SUBCLASS relations where this entity is the child (from === e.enId)
                const inheritedProps: OntoProp[] = [];
                for (const rel of current.relations) {
                  if ((rel.name === 'IS_A' || rel.name === 'HAS_SUBCLASS') && rel.from === e.enId) {
                    const parentEntity = current.entities.find(pe => pe.enId === rel.to);
                    if (parentEntity) {
                      for (const p of parentEntity.props) {
                        inheritedProps.push({ ...p, id: `inh_${e.id}_${p.id}`, inherited: true, inheritedFrom: parentEntity.name });
                      }
                    }
                  }
                }
                return (
                  <EntityCard key={e.id} entity={e}
                    onUpdate={ne => updateEntity(i, ne)}
                    onDelete={() => deleteEntity(i)}
                    onSparkles={() => setDrawerEntity(e)}
                    inheritedProps={inheritedProps.length > 0 ? inheritedProps : undefined}
                  />
                );
              })}
            </div>
          </div>

          {/* Relations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">关系类型</div>
              <button onClick={() => setAddingRelation(true)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
                <Plus size={14} /> 新增关系类型
              </button>
            </div>
            <HypernymPredictionPanel
              entities={current.entities}
              onAdopt={(rel) => {
                const r: OntoRelation = { id: 'r_' + Date.now(), ...rel };
                updateCurrent({ ...current, relations: [...current.relations, r] });
              }}
            />
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">英文名称</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">中文名称</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">起点</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">终点</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">描述</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-36" title="关系权重用于图算法评分与路径寻优，取值范围 0.00–1.00">
                      权重 <span className="font-normal text-gray-400">0–1</span>
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {addingRelation && (
                    <tr className="bg-blue-50/40">
                      <td className="px-3 py-2"><input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" placeholder="RELATION_NAME" value={newRelation.name} onChange={e => setNewRelation(r => ({ ...r, name: e.target.value }))} /></td>
                      <td className="px-3 py-2"><input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" placeholder="中文名" value={newRelation.chName} onChange={e => setNewRelation(r => ({ ...r, chName: e.target.value }))} /></td>
                      <td className="px-3 py-2">
                        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={newRelation.from} onChange={e => setNewRelation(r => ({ ...r, from: e.target.value }))}>
                          <option value="">起点</option>
                          {current.entities.map(e => <option key={e.id} value={e.enId}>{e.enId}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={newRelation.to} onChange={e => setNewRelation(r => ({ ...r, to: e.target.value }))}>
                          <option value="">终点</option>
                          {current.entities.map(e => <option key={e.id} value={e.enId}>{e.enId}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2"><input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" placeholder="描述" value={newRelation.description} onChange={e => setNewRelation(r => ({ ...r, description: e.target.value }))} /></td>
                      <td className="px-3 py-2">
                        <WeightInput
                          value={newRelation.weight}
                          onChange={v => setNewRelation(r => ({ ...r, weight: v }))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={addRelation} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">确认</button>
                          <button onClick={() => setAddingRelation(false)} className="text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {current.relations.map((r, i) => (
                    <tr key={r.id} className="group hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.chName}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{r.from}</span></td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">{r.to}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.description}</td>
                      <td className="px-4 py-2">
                        <WeightInput
                          value={r.weight ?? 1}
                          onChange={v => updateRelation(i, { ...r, weight: v })}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteRelation(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Drawer */}
        {drawerEntity && (
          <ConceptPredictionDrawer entity={drawerEntity} onClose={() => setDrawerEntity(null)} />
        )}
      </div>

      {/* New Ontology Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <div className="text-sm font-semibold text-gray-800 mb-4">新建本体</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1.5">本体名称</div>
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={newName} onChange={e => setNewName(e.target.value)} placeholder="请输入名称" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">领域</div>
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="请输入领域" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowNewModal(false)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
              <button onClick={handleCreate} disabled={!newName} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">确认删除本体</div>
                <div className="text-xs text-gray-500 mt-0.5">此操作不可恢复，所有关联配置将同步清除。</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">即将删除：<span className="font-medium">{current.name}</span></p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
              <button onClick={handleDelete} className="text-sm px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
