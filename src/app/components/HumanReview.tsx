import { useState } from 'react';
import { Check, X, Edit2, GitMerge, Search, Tag, GitBranch, CalendarDays, AlertTriangle, CheckSquare, ScanLine, Workflow, ChevronDown, ChevronRight, BookMarked, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { SeedTermPanel, HyponymyPanel, EventReviewPanel, ConflictManagementPanel } from './TermReview';

type CandidateType = 'entity' | 'relation' | 'attribute';
type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'modified';
interface ReviewCandidate {
  id: string; type: CandidateType; content: string; entityType: string;
  sourceDoc: string; context: string; confidence: number;
  hitRules: string[]; conflictReason: string; schemaHint: string;
  status: ReviewStatus; modifiedContent?: string;
  fromScan?: boolean; // flagged by consistency scan
}

const MOCK_CANDIDATES: ReviewCandidate[] = [
  { id: 'rc1', type: 'entity', content: '多伦多大学', entityType: '机构', sourceDoc: 'papers#2341', context: '...作者Geoffrey Hinton就职于多伦多大学计算机系...', confidence: 0.65, hitRules: ['机构别名合并'], conflictReason: '与已有实体「University of Toronto」存在别名冲突', schemaHint: 'Institution.name', status: 'pending' },
  { id: 'rc2', type: 'entity', content: 'Yoshua Bengio', entityType: '作者', sourceDoc: 'authors#203', context: '...与Hinton、LeCun共同获得图灵奖...', confidence: 0.72, hitRules: [], conflictReason: '', schemaHint: 'Author.name', status: 'pending' },
  { id: 'rc3', type: 'relation', content: 'CITES', entityType: '关系', sourceDoc: 'papers#2341→papers#1892', context: '论文引用关系，置信度偏低', confidence: 0.45, hitRules: ['引用关系验证'], conflictReason: '引用链不完整，缺少中间文献', schemaHint: 'Paper→Paper', status: 'pending' },
  { id: 'rc4', type: 'attribute', content: 'impact_factor=8.3', entityType: '论文', sourceDoc: 'papers#2341', context: 'IF值来源不明确', confidence: 0.38, hitRules: [], conflictReason: '属性值超出已知范围', schemaHint: 'Paper.impact_factor', status: 'pending' },
  { id: 'rc5', type: 'entity', content: '蒙特利尔学习算法研究所', entityType: '机构', sourceDoc: 'institutions#92', context: '...Bengio创立的AI研究机构...', confidence: 0.58, hitRules: [], conflictReason: '名称较长，可能存在缩写冲突', schemaHint: 'Institution.name', status: 'approved' },
  { id: 'rc6', type: 'relation', content: 'AFFILIATED_WITH', entityType: '关系', sourceDoc: 'authors#203→institutions#92', context: 'Bengio与MILA的关联', confidence: 0.70, hitRules: ['作者名称标准化'], conflictReason: '', schemaHint: 'Author→Institution', status: 'pending' },
  { id: 'rc7', type: 'entity', content: '卷积神经网络', entityType: '概念', sourceDoc: 'papers#1892', context: '...CNN在图像识别领域的突破性应用...', confidence: 0.55, hitRules: [], conflictReason: '与「CNN」别名未关联', schemaHint: 'Concept.term', status: 'rejected' },
  { id: 'rc8', type: 'attribute', content: 'pub_year=2012', entityType: '论文', sourceDoc: 'papers#1892', context: '发表年份字段，来源于元数据', confidence: 0.60, hitRules: [], conflictReason: '年份格式不标准', schemaHint: 'Paper.pub_year', status: 'pending' },
  { id: 'rc9', type: 'entity', content: 'Yann LeCun', entityType: '作者', sourceDoc: 'authors#301', context: '...Facebook AI研究院院长...', confidence: 0.75, hitRules: [], conflictReason: '', schemaHint: 'Author.name', status: 'pending' },
  { id: 'rc10', type: 'relation', content: 'HAS_CONCEPT', entityType: '关系', sourceDoc: 'papers#3011→concept#55', context: '论文主题相关概念', confidence: 0.50, hitRules: [], conflictReason: '概念边界不清晰', schemaHint: 'Paper→Concept', status: 'pending' },
  { id: 'rc11', type: 'attribute', content: 'citation_count=45320', entityType: '论文', sourceDoc: 'papers#2341', context: '引用次数统计', confidence: 0.79, hitRules: [], conflictReason: '', schemaHint: 'Paper.citation_count', status: 'approved' },
  { id: 'rc12', type: 'entity', content: 'Facebook AI Research', entityType: '机构', sourceDoc: 'institutions#205', context: '...现更名为Meta AI...', confidence: 0.62, hitRules: ['机构别名合并'], conflictReason: '机构已更名，需确认使用旧名或新名', schemaHint: 'Institution.name', status: 'pending' },
  // ── 以下来自数据一致性扫描 ──
  { id: 'scan-1', type: 'attribute', content: 'pub_year=2099', entityType: '论文', sourceDoc: 'papers#4521', context: '发表年份属性值超出本体定义范围 1900–2026', confidence: 0.20, hitRules: ['属性值范围校验'], conflictReason: '属性值超出范围：期望 1900–2026，实际 2099', schemaHint: 'Paper.pub_year', status: 'pending', fromScan: true },
  { id: 'scan-2', type: 'relation', content: 'AUTHORED_BY(论文#4521→机构#88)', entityType: '关系', sourceDoc: 'papers#4521→institutions#88', context: 'AUTHORED_BY 目标端应为 Person，实际指向 Institution', confidence: 0.15, hitRules: ['关系端点类型校验'], conflictReason: '关系不符合本体定义：目标类型应为 Person，实际为 Institution', schemaHint: 'Paper -[AUTHORED_BY]-> Person', status: 'pending', fromScan: true },
  { id: 'scan-3', type: 'entity', content: '作者#7721 (Wang Fang)', entityType: '作者', sourceDoc: 'authors#7721', context: '孤立实体：无任何出入度关系，不符合图谱完整性规则', confidence: 0.30, hitRules: ['孤立实体检测'], conflictReason: '孤立实体，期望至少 1 条关联关系，实际 0 条', schemaHint: 'Author', status: 'pending', fromScan: true },
  { id: 'scan-4', type: 'attribute', content: 'status=archived', entityType: '论文', sourceDoc: 'papers#3312', context: 'status 字段值不在枚举列表 draft|published|retracted 中', confidence: 0.25, hitRules: ['枚举值合规校验'], conflictReason: '属性枚举值不合规：期望 draft|published|retracted，实际 archived', schemaHint: 'Paper.status', status: 'pending', fromScan: true },
];

const ENTITY_TYPES = ['机构', '作者', '概念', '论文'];
const CONFLICT_TYPES = ['别名冲突', '属性超范围', '引用不完整', '格式不标准'];

// ─── Mapping rule types ───────────────────────────────────────────────────────

type RuleType = 'attribute' | 'entity-class' | 'relation' | 'pattern';
type RuleStatus = 'pending' | 'approved' | 'rejected' | 'modified';

interface MappingRuleCandidate {
  id: string;
  ruleType: RuleType;
  ruleName: string;
  sourcePattern: string;
  targetMapping: string;
  condition?: string;
  confidence: number;
  supportCount: number;
  exampleInput: string;
  exampleOutput: string;
  discoveredRun: string;
  status: RuleStatus;
  tags: string[];
  modifiedTarget?: string;
  modifiedCondition?: string;
}

const RULE_TYPE_META: Record<RuleType, { label: string; color: string; bg: string; border: string; dot: string }> = {
  'attribute':    { label: '属性映射',   color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  dot: 'bg-indigo-400'  },
  'entity-class': { label: '实体类映射', color: 'text-sky-600',     bg: 'bg-sky-50',     border: 'border-sky-200',     dot: 'bg-sky-400'     },
  'relation':     { label: '关系发现',   color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200',  dot: 'bg-violet-400'  },
  'pattern':      { label: '文本模式',   color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
};

const MOCK_RULE_CANDIDATES: MappingRuleCandidate[] = [
  {
    id: 'mr1', ruleType: 'attribute', ruleName: 'pub_year → publicationYear',
    sourcePattern: 'papers.pub_year (INTEGER)',
    targetMapping: 'kg:Paper kg:publicationYear xsd:gYear',
    condition: 'value ∈ [1900, 2030]',
    confidence: 0.94, supportCount: 5234,
    exampleInput: 'papers.pub_year = 2023',
    exampleOutput: 'paper:p4521 kg:publicationYear "2023"^^xsd:gYear .',
    discoveredRun: 'run-2026-07-31-001', status: 'pending',
    tags: ['论文', '时间属性'],
  },
  {
    id: 'mr2', ruleType: 'attribute', ruleName: 'doi → identifier',
    sourcePattern: 'papers.doi (VARCHAR)',
    targetMapping: 'kg:Paper kg:doi xsd:string',
    condition: 'matches /^10\\.\\d{4,}/',
    confidence: 0.98, supportCount: 4891,
    exampleInput: 'papers.doi = "10.1234/dl.2026.4521"',
    exampleOutput: 'paper:p4521 kg:doi "10.1234/dl.2026.4521" .',
    discoveredRun: 'run-2026-07-31-001', status: 'approved',
    tags: ['论文', '标识符'],
  },
  {
    id: 'mr3', ruleType: 'entity-class', ruleName: 'authors → Author',
    sourcePattern: 'authors 表 (id, name, orcid, email, inst_id)',
    targetMapping: 'kg:Author rdfs:subClassOf kg:Person',
    confidence: 0.91, supportCount: 4102,
    exampleInput: 'authors(id=145, name="Geoffrey Hinton", orcid="0000-0002-1580-8801")',
    exampleOutput: 'author:a145 rdf:type kg:Author ; rdfs:label "Geoffrey Hinton" .',
    discoveredRun: 'run-2026-07-31-001', status: 'pending',
    tags: ['作者', '实体类'],
  },
  {
    id: 'mr4', ruleType: 'relation', ruleName: '共同作者 → COLLABORATED_WITH',
    sourcePattern: 'papers_authors JOIN papers_authors ON paper_id',
    targetMapping: 'kg:Author kg:COLLABORATED_WITH kg:Author',
    condition: '同一 paper_id 下不同 author_id 两两配对',
    confidence: 0.76, supportCount: 18240,
    exampleInput: 'paper:p4521 writtenBy author:a145, author:a146',
    exampleOutput: 'author:a145 kg:COLLABORATED_WITH author:a146 .',
    discoveredRun: 'run-2026-07-31-001', status: 'pending',
    tags: ['作者', '关系', '挖掘规则'],
  },
  {
    id: 'mr5', ruleType: 'relation', ruleName: '引用关系 → CITES',
    sourcePattern: 'paper_references(citing_id, cited_id)',
    targetMapping: 'kg:Paper kg:CITES kg:Paper',
    condition: 'cited_id EXISTS IN papers',
    confidence: 0.83, supportCount: 89201,
    exampleInput: 'paper_references(citing=4521, cited=1892)',
    exampleOutput: 'paper:p4521 kg:CITES paper:p1892 .',
    discoveredRun: 'run-2026-07-20-001', status: 'approved',
    tags: ['论文', '关系'],
  },
  {
    id: 'mr6', ruleType: 'pattern', ruleName: '机构名文本抽取',
    sourcePattern: '文本: "...就职于 {机构名} ..."',
    targetMapping: 'kg:Author kg:affiliatedWith kg:Institution',
    condition: '正则: /就职于\\s+([^，。]+)/; 候选需在机构库中匹配',
    confidence: 0.61, supportCount: 342,
    exampleInput: '"作者 Geoffrey Hinton 就职于多伦多大学计算机系"',
    exampleOutput: 'author:a145 kg:affiliatedWith inst:i88 .',
    discoveredRun: 'run-2026-07-31-001', status: 'pending',
    tags: ['机构', '文本抽取', 'NLP'],
  },
  {
    id: 'mr7', ruleType: 'attribute', ruleName: 'abstract → description',
    sourcePattern: 'papers.abstract (TEXT)',
    targetMapping: 'kg:Paper dcterms:abstract xsd:string',
    condition: 'length ∈ [50, 5000]',
    confidence: 0.88, supportCount: 5101,
    exampleInput: 'papers.abstract = "We propose a novel..."',
    exampleOutput: 'paper:p4521 dcterms:abstract "We propose a novel..." .',
    discoveredRun: 'run-2026-07-20-001', status: 'pending',
    tags: ['论文', '文本属性'],
  },
  {
    id: 'mr8', ruleType: 'pattern', ruleName: '关键词共现规则',
    sourcePattern: '同一论文的关键词对 → 共现关系',
    targetMapping: 'kg:Concept kg:CO_OCCURS_WITH kg:Concept',
    condition: 'co-occurrence count ≥ 5; 双向对称',
    confidence: 0.54, supportCount: 2870,
    exampleInput: 'paper:p4521 hasConcept [深度学习, 图神经网络]',
    exampleOutput: 'concept:深度学习 kg:CO_OCCURS_WITH concept:图神经网络 .',
    discoveredRun: 'run-2026-07-31-001', status: 'rejected',
    tags: ['概念', '共现', '统计规则'],
  },
  {
    id: 'mr9', ruleType: 'entity-class', ruleName: 'institutions → Institution',
    sourcePattern: 'institutions 表 (id, name, country, city, type)',
    targetMapping: 'kg:Institution rdfs:subClassOf kg:Organization',
    confidence: 0.96, supportCount: 1890,
    exampleInput: 'institutions(id=88, name="University of Toronto", country="CA")',
    exampleOutput: 'inst:i88 rdf:type kg:Institution ; rdfs:label "University of Toronto" .',
    discoveredRun: 'run-2026-07-20-001', status: 'pending',
    tags: ['机构', '实体类'],
  },
  {
    id: 'mr10', ruleType: 'relation', ruleName: '作者-机构 → AFFILIATED_WITH',
    sourcePattern: 'authors.inst_id → institutions.id (FK)',
    targetMapping: 'kg:Author kg:affiliatedWith kg:Institution',
    condition: 'inst_id IS NOT NULL AND inst_id EXISTS IN institutions',
    confidence: 0.89, supportCount: 3892,
    exampleInput: 'authors(id=145, inst_id=88)',
    exampleOutput: 'author:a145 kg:affiliatedWith inst:i88 .',
    discoveredRun: 'run-2026-07-31-001', status: 'modified',
    modifiedTarget: 'kg:Author kg:primaryAffiliation kg:Institution',
    tags: ['作者', '机构', '关系'],
  },
];

type TopTab = 'kg-review' | 'seed-term' | 'hyponymy' | 'event-review' | 'conflict';

const TOP_TABS: { id: TopTab; label: string; icon: any }[] = [
  { id: 'kg-review',    label: '图谱候选审核',   icon: CheckSquare },
  { id: 'seed-term',    label: '种子术语审核',   icon: Tag },
  { id: 'hyponymy',     label: '上下位关系审核', icon: GitBranch },
  { id: 'event-review', label: '术语/事件优化',  icon: CalendarDays },
  { id: 'conflict',     label: '冲突管理',       icon: AlertTriangle },
];

export default function HumanReview() {
  const [topTab, setTopTab] = useState<TopTab>('kg-review');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top tab bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 pt-5 pb-0 flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">人工审核</h1>
          <p className="text-sm text-gray-500 mt-0.5">对算法生成的候选数据进行人工审核与修正</p>
        </div>
        <div className="flex gap-1">
          {TOP_TABS.map(t => (
            <button key={t.id} onClick={() => setTopTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                topTab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-6">
        {topTab === 'seed-term'    && <SeedTermPanel />}
        {topTab === 'hyponymy'     && <HyponymyPanel />}
        {topTab === 'event-review' && <EventReviewPanel />}
        {topTab === 'conflict'     && <ConflictManagementPanel />}
        {topTab === 'kg-review'    && <KGReviewPanel />}
      </div>
    </div>
  );
}

// ─── Mapping Rules Panel ──────────────────────────────────────────────────────

function MappingRulesPanel() {
  const [rules, setRules] = useState<MappingRuleCandidate[]>(MOCK_RULE_CANDIDATES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterConf, setFilterConf] = useState('');
  const [search, setSearch] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const updateStatus = (id: string, status: RuleStatus, extra?: Partial<MappingRuleCandidate>) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, status, ...extra } : r));

  const handleApprove = (id: string) => {
    updateStatus(id, 'approved');
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 2500);
  };

  const handleEdit = (r: MappingRuleCandidate) => {
    setEditId(r.id);
    setEditTarget(r.modifiedTarget || r.targetMapping);
    setEditCondition(r.modifiedCondition || r.condition || '');
    setExpandedId(r.id);
  };

  const confirmEdit = (id: string) => {
    updateStatus(id, 'modified', { modifiedTarget: editTarget, modifiedCondition: editCondition });
    setJustAdded(id);
    setEditId(null);
    setTimeout(() => setJustAdded(null), 2500);
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const bulkApprove = () => {
    const ids = new Set(selected);
    setRules(prev => prev.map(r => ids.has(r.id) && r.status === 'pending' ? { ...r, status: 'approved' } : r));
    setSelected([]);
  };

  const filtered = rules.filter(r => {
    if (filterType && r.ruleType !== filterType) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterConf === '>80' && r.confidence <= 0.8) return false;
    if (filterConf === '50-80' && (r.confidence < 0.5 || r.confidence > 0.8)) return false;
    if (filterConf === '<50' && r.confidence >= 0.5) return false;
    if (search && !r.ruleName.toLowerCase().includes(search.toLowerCase()) &&
        !r.sourcePattern.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    pending:  rules.filter(r => r.status === 'pending').length,
    approved: rules.filter(r => r.status === 'approved' || r.status === 'modified').length,
    rejected: rules.filter(r => r.status === 'rejected').length,
    avgConf:  Math.round(rules.reduce((s, r) => s + r.confidence, 0) / rules.length * 100),
    totalSupport: rules.reduce((s, r) => s + r.supportCount, 0),
  };

  const pendingSelected = selected.filter(id => rules.find(r => r.id === id)?.status === 'pending').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Stats */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-4">
          {[
            { value: stats.pending,       label: '待确认',    bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-600'  },
            { value: stats.approved,      label: '已加入规则库', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600'  },
            { value: stats.rejected,      label: '已拒绝',    bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-500'    },
            { value: `${stats.avgConf}%`, label: '平均置信度', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600'   },
            { value: stats.totalSupport.toLocaleString(), label: '支持三元组', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl px-4 py-2.5 flex-1 text-center`}>
              <div className={`text-xl font-bold ${s.text}`}>{s.value}</div>
              <div className={`text-xs mt-0.5 ${s.text} opacity-70`}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-400 w-40"
            placeholder="搜索规则…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white"
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">全部类型</option>
          <option value="attribute">属性映射</option>
          <option value="entity-class">实体类映射</option>
          <option value="relation">关系发现</option>
          <option value="pattern">文本模式</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white"
          value={filterConf} onChange={e => setFilterConf(e.target.value)}>
          <option value="">置信度</option>
          <option value=">80">&gt; 80%</option>
          <option value="50-80">50 – 80%</option>
          <option value="<50">&lt; 50%</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="approved">已加入</option>
          <option value="modified">已修改加入</option>
          <option value="rejected">已拒绝</option>
        </select>
        <div className="flex-1" />
        {pendingSelected > 0 && (
          <button onClick={bulkApprove}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <BookMarked size={13} /> 批量加入规则库 ({pendingSelected})
          </button>
        )}
      </div>

      {/* Rule list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Workflow className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">无符合筛选条件的映射规则</p>
            </div>
          )}

          {filtered.map(r => {
            const meta = RULE_TYPE_META[r.ruleType];
            const isExpanded = expandedId === r.id;
            const isEditing = editId === r.id;
            const isJustAdded = justAdded === r.id;
            const effectiveTarget = r.modifiedTarget || r.targetMapping;
            const effectiveCondition = r.modifiedCondition || r.condition;

            return (
              <div key={r.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${
                isExpanded ? 'border-indigo-200 shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}>
                {/* Row */}
                <div className="flex items-start gap-4 px-5 py-4">
                  {/* Select */}
                  <div className="pt-0.5 shrink-0">
                    <input type="checkbox" checked={selected.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="accent-indigo-600" />
                  </div>

                  {/* Type badge */}
                  <div className={`shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold border ${meta.bg} ${meta.color} ${meta.border} flex items-center gap-1 mt-0.5`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </div>

                  {/* Rule summary */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{r.ruleName}</span>
                      {r.status === 'modified' && r.modifiedTarget && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-medium">已修改</span>
                      )}
                      {r.tags.map(t => (
                        <span key={t} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <code className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono truncate max-w-[200px]" title={r.sourcePattern}>
                        {r.sourcePattern}
                      </code>
                      <ArrowRight size={12} className="text-gray-400 shrink-0" />
                      <code className={`text-[11px] px-2 py-0.5 rounded font-mono truncate max-w-[240px] ${r.status === 'modified' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}
                        title={effectiveTarget}>
                        {effectiveTarget}
                      </code>
                    </div>
                    {effectiveCondition && (
                      <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                        <Filter size={10} />
                        <span className="truncate max-w-xs" title={effectiveCondition}>{effectiveCondition}</span>
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="w-14 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${r.confidence >= 0.8 ? 'bg-green-400' : r.confidence >= 0.6 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${r.confidence * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 tabular-nums">{(r.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-[10px] text-gray-400">置信度</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-700 tabular-nums">{r.supportCount.toLocaleString()}</div>
                      <div className="text-[10px] text-gray-400">支持量</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="shrink-0 mt-0.5">
                    {r.status === 'pending' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">待确认</span>
                    ) : r.status === 'approved' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                        <BookMarked size={10} />已加入规则库
                      </span>
                    ) : r.status === 'modified' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                        <BookMarked size={10} />修改后已加入
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">已拒绝</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(r.id)} title="加入规则库"
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                          <BookMarked size={11} /> 加入规则库
                        </button>
                        <button onClick={() => handleEdit(r)} title="修改后加入"
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} title="拒绝"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <X size={13} />
                        </button>
                      </>
                    )}
                    {(r.status === 'approved' || r.status === 'modified') && (
                      <span className="text-[11px] text-green-600 flex items-center gap-1">
                        <Check size={12} className={isJustAdded ? 'animate-bounce' : ''} /> 已入库
                      </span>
                    )}
                    {r.status === 'rejected' && (
                      <button onClick={() => updateStatus(r.id, 'pending')} title="撤回拒绝"
                        className="text-xs px-2 py-1 text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                        撤回
                      </button>
                    )}
                    <button onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1">
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 space-y-4">
                    {/* Source → Output example */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">输入示例</p>
                        <div className="bg-slate-900 rounded-xl px-4 py-3">
                          <code className="text-[11px] text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">{r.exampleInput}</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">输出三元组</p>
                        <div className="bg-slate-900 rounded-xl px-4 py-3">
                          <code className="text-[11px] text-sky-300 font-mono leading-relaxed whitespace-pre-wrap">{r.exampleOutput}</code>
                        </div>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-6 text-[11px] text-gray-500">
                      <span>发现于 <span className="font-mono text-gray-700">{r.discoveredRun}</span></span>
                      <span>支持量 <span className="font-semibold text-gray-700">{r.supportCount.toLocaleString()}</span> 条三元组</span>
                      <span>置信度 <span className="font-semibold text-gray-700">{(r.confidence * 100).toFixed(0)}%</span></span>
                      {effectiveCondition && (
                        <span>约束 <span className="font-mono text-gray-700">{effectiveCondition}</span></span>
                      )}
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="bg-white border border-indigo-100 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                          <Edit2 size={12} /> 修改映射目标
                        </p>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">目标映射 (Turtle 片段)</label>
                          <input value={editTarget} onChange={e => setEditTarget(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400 bg-white" />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-1">过滤条件 (可选)</label>
                          <input value={editCondition} onChange={e => setEditCondition(e.target.value)}
                            placeholder="如: value > 0, matches /regex/"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400 bg-white" />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button onClick={() => setEditId(null)} className="text-sm px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            取消
                          </button>
                          <button onClick={() => confirmEdit(r.id)}
                            className="text-sm px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
                            <BookMarked size={12} /> 修改并加入规则库
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          <Sparkles size={12} className="text-indigo-400" />
          {filtered.length} 条规则候选 — 已有 {stats.approved} 条加入规则库
        </span>
        <div className="flex gap-2">
          <button className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            导出规则候选列表
          </button>
          <button
            onClick={() => {
              setRules(prev => prev.map(r => r.status === 'pending' ? { ...r, status: 'approved' } : r));
            }}
            className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
            <BookMarked size={13} /> 全部加入规则库
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KG Review Panel ──────────────────────────────────────────────────────────

function KGReviewPanel() {
  const [innerTab, setInnerTab] = useState<'candidates' | 'mapping-rules'>('candidates');
  const [candidates, setCandidates] = useState<ReviewCandidate[]>(MOCK_CANDIDATES);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterConfidence, setFilterConfidence] = useState('');
  const [filterConflict, setFilterConflict] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [editCandidate, setEditCandidate] = useState<ReviewCandidate | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editEntityType, setEditEntityType] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const updateStatus = (id: string, status: ReviewStatus, modifiedContent?: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status, modifiedContent } : c));
  };

  const bulkApprove = () => {
    setCandidates(prev => prev.map(c => selected.includes(c.id) ? { ...c, status: 'approved' } : c));
    setSelected([]);
  };

  const bulkReject = () => {
    setCandidates(prev => prev.map(c => selected.includes(c.id) ? { ...c, status: 'rejected' } : c));
    setSelected([]);
  };

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = (visible: ReviewCandidate[]) => {
    const ids = visible.map(c => c.id);
    const allChecked = ids.every(id => selected.includes(id));
    setSelected(allChecked ? selected.filter(id => !ids.includes(id)) : [...selected, ...ids.filter(id => !selected.includes(id))]);
  };

  const openEdit = (c: ReviewCandidate) => {
    setEditCandidate(c);
    setEditContent(c.content);
    setEditEntityType(c.entityType);
  };

  const confirmEdit = () => {
    if (!editCandidate) return;
    updateStatus(editCandidate.id, 'modified', editContent);
    setEditCandidate(null);
  };

  const filtered = candidates.filter(c => {
    if (search && !c.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && c.type !== filterType) return false;
    if (filterEntityType && c.entityType !== filterEntityType) return false;
    if (filterConfidence === '>60' && c.confidence <= 0.6) return false;
    if (filterConfidence === '40-60' && (c.confidence < 0.4 || c.confidence > 0.6)) return false;
    if (filterConfidence === '<40' && c.confidence >= 0.4) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterSource === 'scan' && !c.fromScan) return false;
    if (filterSource === 'normal' && c.fromScan) return false;
    return true;
  });

  const scanPendingCount = candidates.filter(c => c.fromScan && c.status === 'pending').length;

  const stats = {
    pending: candidates.filter(c => c.status === 'pending').length,
    approved: candidates.filter(c => c.status === 'approved' || c.status === 'modified').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    conflict: candidates.filter(c => c.conflictReason).length,
    avgConf: Math.round(candidates.reduce((s, c) => s + c.confidence, 0) / candidates.length * 100),
  };

  const approvedCount = candidates.filter(c => c.status === 'approved' || c.status === 'modified').length;
  const entityCount = candidates.filter(c => (c.status === 'approved' || c.status === 'modified') && c.type === 'entity').length;
  const relationCount = candidates.filter(c => (c.status === 'approved' || c.status === 'modified') && c.type === 'relation').length;
  const rejectedCount = candidates.filter(c => c.status === 'rejected').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Inner sub-tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 pt-3 flex gap-1">
        <button onClick={() => setInnerTab('candidates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${innerTab === 'candidates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <CheckSquare className="w-4 h-4" />候选数据
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${innerTab === 'candidates' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            {MOCK_CANDIDATES.filter(c => c.status === 'pending').length}
          </span>
        </button>
        <button onClick={() => setInnerTab('mapping-rules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${innerTab === 'mapping-rules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Workflow className="w-4 h-4" />映射规则
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${innerTab === 'mapping-rules' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
            {MOCK_RULE_CANDIDATES.filter(r => r.status === 'pending').length}
          </span>
        </button>
      </div>

      {/* Mapping rules tab */}
      {innerTab === 'mapping-rules' && <MappingRulesPanel />}

      {/* Candidates tab — everything below only renders when innerTab === 'candidates' */}
      {innerTab === 'candidates' && <>

      {/* Stats bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-amber-500 mt-0.5">待审核</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-xs text-green-500 mt-0.5">已通过</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold text-red-500">{stats.rejected}</div>
            <div className="text-xs text-red-400 mt-0.5">已拒绝</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold text-orange-500">{stats.conflict}</div>
            <div className="text-xs text-orange-400 mt-0.5">约束冲突</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-1 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.avgConf}%</div>
            <div className="text-xs text-blue-400 mt-0.5">平均置信度</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-44"
            placeholder="搜索内容..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">候选类型</option>
          <option value="entity">实体</option>
          <option value="relation">关系</option>
          <option value="attribute">属性</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={filterEntityType} onChange={e => setFilterEntityType(e.target.value)}>
          <option value="">实体类型</option>
          {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={filterConfidence} onChange={e => setFilterConfidence(e.target.value)}>
          <option value="">置信度区间</option>
          <option value=">60">&gt;60%</option>
          <option value="40-60">40–60%</option>
          <option value="<40">&lt;40%</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={filterConflict} onChange={e => setFilterConflict(e.target.value)}>
          <option value="">冲突类型</option>
          {CONFLICT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">审核状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
          <option value="modified">已修改</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="">全部来源</option>
          <option value="scan">一致性扫描</option>
          <option value="normal">图谱构造</option>
        </select>
        {scanPendingCount > 0 && filterSource !== 'scan' && (
          <button onClick={() => setFilterSource('scan')}
            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-orange-50 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors">
            <ScanLine size={12} />{scanPendingCount} 条一致性扫描问题待审核
          </button>
        )}
        {selected.length > 0 && (
          <>
            <button onClick={bulkApprove} className="text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
              <Check size={13} /> 批量通过 ({selected.length})
            </button>
            <button onClick={bulkReject} className="text-sm px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1.5">
              <X size={13} /> 批量拒绝
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" onChange={() => toggleAll(filtered)} checked={filtered.length > 0 && filtered.every(c => selected.includes(c.id))} />
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">候选内容</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">来源 / 上下文</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">置信度</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">命中规则</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">冲突原因</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">状态</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className={selected.includes(c.id) ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{c.modifiedContent || c.content}</span>
                      {c.fromScan && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 font-medium">
                          <ScanLine size={9} />一致性扫描
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.type === 'entity' ? 'bg-blue-50 text-blue-600' : c.type === 'relation' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                        {c.type === 'entity' ? '实体' : c.type === 'relation' ? '关系' : '属性'}
                      </span>
                      <span className="text-xs text-gray-400">{c.entityType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-mono text-xs text-gray-500">{c.sourceDoc}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate" title={c.context}>{c.context}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                        <div className={`h-1.5 rounded-full ${c.confidence >= 0.7 ? 'bg-green-400' : c.confidence >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${c.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{(c.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.hitRules.length > 0 ? c.hitRules.map(r => (
                        <span key={r} className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">{r}</span>
                      )) : <span className="text-xs text-gray-300">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {c.conflictReason ? (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{c.conflictReason.length > 30 ? c.conflictReason.slice(0, 30) + '…' : c.conflictReason}</span>
                    ) : <span className="text-xs text-gray-300">无</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      c.status === 'approved' ? 'bg-green-50 text-green-600' :
                      c.status === 'modified' ? 'bg-blue-50 text-blue-600' :
                      'bg-red-50 text-red-500'
                    }`}>
                      {c.status === 'pending' ? '待审核' : c.status === 'approved' ? '已通过' : c.status === 'modified' ? '已修改' : '已拒绝'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateStatus(c.id, 'approved')} title="通过" className="p-1 text-gray-400 hover:text-green-500 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => updateStatus(c.id, 'rejected')} title="拒绝" className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                      <button onClick={() => openEdit(c)} title="编辑" className="p-1 text-gray-400 hover:text-blue-500 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      {c.type === 'entity' && (
                        <button title="合并" className="p-1 text-gray-400 hover:text-purple-500 transition-colors">
                          <GitMerge size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
        <button className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">保存审核进度</button>
        <div className="flex gap-2">
          <button className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">完成人工审核</button>
          <button onClick={() => setShowSubmitModal(true)} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">提交入图</button>
        </div>
      </div>

      {/* End of candidates tab */}
      </>}

      {/* Edit Modal */}
      {editCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[480px]">
            <div className="text-sm font-semibold text-gray-800 mb-4">修改后通过</div>
            <div className="space-y-3">
              {editCandidate.type === 'entity' && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">实体名称</div>
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={editContent} onChange={e => setEditContent(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">实体类型</div>
                    <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full" value={editEntityType} onChange={e => setEditEntityType(e.target.value)}>
                      {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </>
              )}
              {editCandidate.type === 'relation' && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">起点实体</div>
                    <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full">
                      <option>选择起点实体</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">终点实体</div>
                    <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full">
                      <option>选择终点实体</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">关系类型</div>
                    <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full">
                      <option value="WRITTEN_BY">WRITTEN_BY</option>
                      <option value="AFFILIATED_WITH">AFFILIATED_WITH</option>
                      <option value="CITES">CITES</option>
                      <option value="HAS_CONCEPT">HAS_CONCEPT</option>
                    </select>
                  </div>
                </>
              )}
              {editCandidate.type === 'attribute' && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">属性名</div>
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={editContent.split('=')[0] || ''} onChange={e => setEditContent(e.target.value + '=' + (editContent.split('=')[1] || ''))} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">属性值</div>
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={editContent.split('=')[1] || ''} onChange={e => setEditContent((editContent.split('=')[0] || '') + '=' + e.target.value)} />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditCandidate(null)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
              <button onClick={confirmEdit} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">修改后通过</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <div className="text-sm font-semibold text-gray-800 mb-4">确认提交入图</div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">将写入实体数</span>
                <span className="font-medium text-gray-800">{entityCount} 个</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">将写入关系数</span>
                <span className="font-medium text-gray-800">{relationCount} 条</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">被拒绝数</span>
                <span className="font-medium text-red-500">{rejectedCount} 个</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-500">目标图空间</span>
                <span className="font-mono text-xs text-gray-700">kg_science_v2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Schema 校验</span>
                <span className="text-green-600 font-medium flex items-center gap-1"><Check size={13} /> 已通过</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSubmitModal(false)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
              <button onClick={() => setShowSubmitModal(false)} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">确认提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
