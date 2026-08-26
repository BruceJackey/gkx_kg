import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Trash2, Check, X, ChevronDown, ChevronRight,
  Link2, Boxes, ArrowRight, Edit2, Layers, Hash,
  Tag, Calendar, FileText, ToggleLeft, Info,
  Sparkles, Loader2, ChevronUp, TrendingUp,
  Star, Sliders, GitMerge, Play, PanelRightOpen,
  CheckSquare, Square, ThumbsUp, ThumbsDown,
  Workflow, Settings2, Database, Upload, AlertCircle, Network
} from 'lucide-react';

// ─── Prediction helpers ───────────────────────────────────────────────────────

interface PredictionCandidate {
  id: string;
  label: string;
  name: string;
  confidence: number;
  adopted: boolean;
}

const MOCK_PREDICTIONS: Record<string, { parents: PredictionCandidate[]; children: PredictionCandidate[] }> = {
  person: {
    parents: [
      { id: 'pred-p1', label: '生物智能体', name: 'BioIntelligentAgent', confidence: 0.93, adopted: false },
      { id: 'pred-p2', label: '社会成员', name: 'SocialMember', confidence: 0.87, adopted: false },
      { id: 'pred-p3', label: '认知主体', name: 'CognitiveAgent', confidence: 0.81, adopted: false },
    ],
    children: [
      { id: 'pred-c1', label: '研究员', name: 'Researcher', confidence: 0.92, adopted: false },
      { id: 'pred-c2', label: '学者', name: 'Scholar', confidence: 0.86, adopted: false },
      { id: 'pred-c3', label: '科学家', name: 'Scientist', confidence: 0.80, adopted: false },
    ],
  },
  organization: {
    parents: [
      { id: 'pred-p1', label: '法人实体', name: 'LegalEntity', confidence: 0.91, adopted: false },
      { id: 'pred-p2', label: '社会群体', name: 'SocialGroup', confidence: 0.85, adopted: false },
      { id: 'pred-p3', label: '制度性主体', name: 'InstitutionalActor', confidence: 0.78, adopted: false },
    ],
    children: [
      { id: 'pred-c1', label: '大学', name: 'University', confidence: 0.94, adopted: false },
      { id: 'pred-c2', label: '研究院', name: 'ResearchInstitute', confidence: 0.89, adopted: false },
      { id: 'pred-c3', label: '企业', name: 'Enterprise', confidence: 0.83, adopted: false },
    ],
  },
  concept: {
    parents: [
      { id: 'pred-p1', label: '知识单元', name: 'KnowledgeUnit', confidence: 0.90, adopted: false },
      { id: 'pred-p2', label: '抽象实体', name: 'AbstractEntity', confidence: 0.84, adopted: false },
      { id: 'pred-p3', label: '思想范畴', name: 'IdeaCategory', confidence: 0.77, adopted: false },
    ],
    children: [
      { id: 'pred-c1', label: '方法论', name: 'Methodology', confidence: 0.91, adopted: false },
      { id: 'pred-c2', label: '理论框架', name: 'TheoreticalFramework', confidence: 0.85, adopted: false },
      { id: 'pred-c3', label: '技术范式', name: 'TechParadigm', confidence: 0.79, adopted: false },
    ],
  },
  technology: {
    parents: [
      { id: 'pred-p1', label: '工程手段', name: 'EngineeringMethod', confidence: 0.89, adopted: false },
      { id: 'pred-p2', label: '人工制品', name: 'Artifact', confidence: 0.83, adopted: false },
      { id: 'pred-p3', label: '应用科学', name: 'AppliedScience', confidence: 0.76, adopted: false },
    ],
    children: [
      { id: 'pred-c1', label: '算法', name: 'Algorithm', confidence: 0.93, adopted: false },
      { id: 'pred-c2', label: '模型架构', name: 'ModelArchitecture', confidence: 0.87, adopted: false },
      { id: 'pred-c3', label: '工具框架', name: 'Toolkit', confidence: 0.81, adopted: false },
    ],
  },
};

function getMockPredictions(entityId: string) {
  return MOCK_PREDICTIONS[entityId] ?? {
    parents: [
      { id: 'pred-p1', label: '上位概念A', name: 'SuperConceptA', confidence: 0.88, adopted: false },
      { id: 'pred-p2', label: '上位概念B', name: 'SuperConceptB', confidence: 0.82, adopted: false },
    ],
    children: [
      { id: 'pred-c1', label: '下位概念A', name: 'SubConceptA', confidence: 0.90, adopted: false },
      { id: 'pred-c2', label: '下位概念B', name: 'SubConceptB', confidence: 0.84, adopted: false },
    ],
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PropType = 'string' | 'number' | 'date' | 'boolean' | 'text';

interface PropertyDef {
  id: string;
  key: string;
  label: string;
  type: PropType;
  required: boolean;
  description: string;
}

interface EntityType {
  id: string;
  name: string;
  label: string;
  color: string;
  description: string;
  properties: PropertyDef[];
  parentId?: string;
}

interface RelationType {
  id: string;
  name: string;
  label: string;
  description: string;
  sourceTypeIds: string[];
  targetTypeIds: string[];
  directed: boolean;
}

type NodePositions = Record<string, { x: number; y: number }>;

interface Triple {
  subject: string;
  predicate: string;
  object: string;
}

interface GraphItem {
  id: string;
  name: string;
  tripleCount: number;
  entityCount: number;
  createdAt: string;
  source: 'builtin' | 'uploaded';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_W = 148;
const NODE_H = 54;
const CANVAS_W = 880;
const CANVAS_H = 500;

const uid = () => Math.random().toString(36).slice(2, 9);

const ENTITY_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#06b6d4', '#ef4444', '#ec4899', '#6366f1',
];

const PROP_TYPE_ICON: Record<PropType, any> = {
  string: Tag,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  text: FileText,
};

const PROP_TYPE_LABEL: Record<PropType, string> = {
  string: '字符串',
  number: '数值',
  date: '日期',
  boolean: '布尔值',
  text: '长文本',
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const initEntityTypes: EntityType[] = [
  {
    id: 'person', name: 'Person', label: '人物', color: '#3b82f6', description: '参与科研活动的自然人，包括研究员、学者等。',
    properties: [
      { id: uid(), key: 'name', label: '姓名', type: 'string', required: true, description: '' },
      { id: uid(), key: 'birth_date', label: '出生日期', type: 'date', required: false, description: '' },
      { id: uid(), key: 'nationality', label: '国籍', type: 'string', required: false, description: '' },
      { id: uid(), key: 'affiliation', label: '所属机构', type: 'string', required: false, description: '' },
      { id: uid(), key: 'h_index', label: 'H指数', type: 'number', required: false, description: '' },
    ],
  },
  {
    id: 'organization', name: 'Organization', label: '组织', color: '#8b5cf6', description: '从事科研、教育或产业活动的机构或团体。',
    properties: [
      { id: uid(), key: 'name', label: '机构名称', type: 'string', required: true, description: '' },
      { id: uid(), key: 'founded', label: '成立日期', type: 'date', required: false, description: '' },
      { id: uid(), key: 'location', label: '所在地', type: 'string', required: false, description: '' },
      { id: uid(), key: 'employee_count', label: '人员规模', type: 'number', required: false, description: '' },
    ],
  },
  {
    id: 'location', name: 'Location', label: '地点', color: '#10b981', description: '地理位置，包括城市、园区、实验室等。',
    properties: [
      { id: uid(), key: 'name', label: '名称', type: 'string', required: true, description: '' },
      { id: uid(), key: 'address', label: '地址', type: 'string', required: false, description: '' },
      { id: uid(), key: 'area_km2', label: '面积(km²)', type: 'number', required: false, description: '' },
    ],
  },
  {
    id: 'concept', name: 'Concept', label: '概念', color: '#f59e0b', description: '科研领域的核心概念、理论或方法论。',
    properties: [
      { id: uid(), key: 'name', label: '概念名称', type: 'string', required: true, description: '' },
      { id: uid(), key: 'coined_year', label: '提出年份', type: 'number', required: false, description: '' },
      { id: uid(), key: 'parent_concept', label: '上位概念', type: 'string', required: false, description: '' },
    ],
  },
  {
    id: 'technology', name: 'Technology', label: '技术', color: '#06b6d4', description: '具体的技术方法、算法或工具。',
    properties: [
      { id: uid(), key: 'name', label: '技术名称', type: 'string', required: true, description: '' },
      { id: uid(), key: 'proposed_year', label: '提出年份', type: 'number', required: false, description: '' },
      { id: uid(), key: 'authors', label: '提出者', type: 'string', required: false, description: '' },
      { id: uid(), key: 'paper', label: '原始论文', type: 'string', required: false, description: '' },
    ],
  },
  {
    id: 'event', name: 'Event', label: '事件', color: '#ec4899', description: '具有时间节点的科研活动，如项目启动、论文发表等。',
    properties: [
      { id: uid(), key: 'name', label: '事件名称', type: 'string', required: true, description: '' },
      { id: uid(), key: 'start_date', label: '开始日期', type: 'date', required: false, description: '' },
      { id: uid(), key: 'budget', label: '经费(亿元)', type: 'number', required: false, description: '' },
    ],
  },
];

const initRelationTypes: RelationType[] = [
  { id: 'r1', name: 'belongs_to', label: '隶属于', description: '人物与其所属机构之间的关系。', sourceTypeIds: ['person'], targetTypeIds: ['organization'], directed: true },
  { id: 'r2', name: 'located_in', label: '位于', description: '机构所在的地理位置。', sourceTypeIds: ['organization'], targetTypeIds: ['location'], directed: true },
  { id: 'r3', name: 'researches', label: '研究', description: '研究员对概念或领域的研究关系。', sourceTypeIds: ['person'], targetTypeIds: ['concept'], directed: true },
  { id: 'r4', name: 'applied_to', label: '应用于', description: '技术在特定概念或场景中的应用关系。', sourceTypeIds: ['technology'], targetTypeIds: ['concept'], directed: true },
  { id: 'r5', name: 'participates_in', label: '参与', description: '人物参与事件的关系。', sourceTypeIds: ['person'], targetTypeIds: ['event'], directed: true },
  { id: 'r6', name: 'occurs_at', label: '发生于', description: '事件发生的地理位置。', sourceTypeIds: ['event'], targetTypeIds: ['location'], directed: true },
];

const initPositions: NodePositions = {
  person:       { x: 50,  y: 80  },
  organization: { x: 310, y: 45  },
  location:     { x: 580, y: 130 },
  concept:      { x: 80,  y: 300 },
  technology:   { x: 380, y: 310 },
  event:        { x: 620, y: 360 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEdgeEndpoints(srcPos: { x: number; y: number }, tgtPos: { x: number; y: number }) {
  const scx = srcPos.x + NODE_W / 2, scy = srcPos.y + NODE_H / 2;
  const tcx = tgtPos.x + NODE_W / 2, tcy = tgtPos.y + NODE_H / 2;
  const dx = tcx - scx, dy = tcy - scy;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  const ratio = NODE_W / NODE_H;
  let sx: number, sy: number, ex: number, ey: number;
  if (adx * NODE_H > ady * NODE_W) {
    // Exit left/right
    if (dx >= 0) { sx = srcPos.x + NODE_W; sy = scy; ex = tgtPos.x; ey = tcy; }
    else { sx = srcPos.x; sy = scy; ex = tgtPos.x + NODE_W; ey = tcy; }
  } else {
    // Exit top/bottom
    if (dy >= 0) { sx = scx; sy = srcPos.y + NODE_H; ex = tcx; ey = tgtPos.y; }
    else { sx = scx; sy = srcPos.y; ex = tcx; ey = tgtPos.y + NODE_H; }
  }
  return { sx, sy, ex, ey };
}

function cubicPath(sx: number, sy: number, ex: number, ey: number) {
  const cx = (sx + ex) / 2;
  return `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ey}, ${ex} ${ey}`;
}

// ─── Property row editor ──────────────────────────────────────────────────────

function PropRow({ prop, onUpdate, onRemove }: {
  prop: PropertyDef;
  onUpdate: (p: PropertyDef) => void;
  onRemove: () => void;
}) {
  const Icon = PROP_TYPE_ICON[prop.type];
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0 group">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <input
        value={prop.label}
        onChange={e => onUpdate({ ...prop, label: e.target.value })}
        placeholder="显示名"
        className="w-20 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#2563eb] text-xs text-gray-600 outline-none py-0.5"
      />
      <input
        value={prop.key}
        onChange={e => onUpdate({ ...prop, key: e.target.value })}
        placeholder="字段键"
        className="w-20 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#2563eb] text-xs text-gray-400 font-mono outline-none py-0.5"
      />
      <select
        value={prop.type}
        onChange={e => onUpdate({ ...prop, type: e.target.value as PropType })}
        className="bg-white border border-gray-100 rounded px-1.5 py-0.5 text-[11px] text-gray-500 focus:outline-none"
      >
        {(Object.keys(PROP_TYPE_LABEL) as PropType[]).map(t => (
          <option key={t} value={t}>{PROP_TYPE_LABEL[t]}</option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer">
        <input type="checkbox" checked={prop.required} onChange={e => onUpdate({ ...prop, required: e.target.checked })} className="accent-blue-500 w-3 h-3" />
        必填
      </label>
      <button onClick={onRemove} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-400 transition-all">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function EntityDetailPanel({ entity, allEntities, onChange, onDelete }: {
  entity: EntityType;
  allEntities: EntityType[];
  onChange: (e: EntityType) => void;
  onDelete: () => void;
}) {
  const u = (patch: Partial<EntityType>) => onChange({ ...entity, ...patch });
  const addProp = () => u({ properties: [...entity.properties, { id: uid(), key: '', label: '', type: 'string', required: false, description: '' }] });
  const updateProp = (id: string, p: PropertyDef) => u({ properties: entity.properties.map(x => x.id === id ? p : x) });
  const removeProp = (id: string) => u({ properties: entity.properties.filter(p => p.id !== id) });

  // Prediction state
  const [predicting, setPredicting] = useState<'parent' | 'child' | null>(null);
  const [loading, setLoading] = useState(false);
  const [parentCandidates, setParentCandidates] = useState<PredictionCandidate[]>([]);
  const [childCandidates, setChildCandidates] = useState<PredictionCandidate[]>([]);
  const [predExpanded, setPredExpanded] = useState(true);

  const triggerPrediction = (type: 'parent' | 'child') => {
    if (predicting === type) { setPredicting(null); return; }
    setPredicting(type);
    setLoading(true);
    setTimeout(() => {
      const mock = getMockPredictions(entity.id);
      if (type === 'parent') setParentCandidates(mock.parents.map(c => ({ ...c, adopted: false })));
      else setChildCandidates(mock.children.map(c => ({ ...c, adopted: false })));
      setLoading(false);
    }, 900);
  };

  const adoptParent = (candidate: PredictionCandidate) => {
    // Check if a matching entity already exists
    const existing = allEntities.find(e => e.label === candidate.label);
    if (existing) {
      u({ parentId: existing.id });
    } else {
      // Will be handled by parent component—for demo just set parentId to a mock value
      u({ parentId: undefined }); // signal to create new
    }
    setParentCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, adopted: true } : c));
  };

  const adoptChild = (candidate: PredictionCandidate) => {
    setChildCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, adopted: true } : c));
    // Notify parent to add new child entity
    const newChild: EntityType = {
      id: uid(), name: candidate.name, label: candidate.label,
      color: entity.color, description: `由上下位预测生成，${entity.label} 的下位概念。`,
      properties: [], parentId: entity.id,
    };
    onChange({ ...entity, _pendingChild: newChild } as any);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entity.color }} />
        <span className="text-sm text-gray-900 font-medium">实体类型详情</span>
        <button onClick={onDelete} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
          删除
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-400 mb-1 block">显示名称</label>
          <input value={entity.label} onChange={e => u({ label: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#2563eb]" />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 mb-1 block">英文标识</label>
          <input value={entity.name} onChange={e => u({ name: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-500 font-mono focus:outline-none focus:border-[#2563eb]" />
        </div>
        <div className="col-span-2">
          <label className="text-[11px] text-gray-400 mb-1 block">颜色</label>
          <div className="flex gap-2 flex-wrap">
            {ENTITY_COLORS.map(c => (
              <button key={c} onClick={() => u({ color: c })}
                className={`w-6 h-6 rounded-full transition-transform ${entity.color === c ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] text-gray-400 mb-1 block">父类型</label>
          <select value={entity.parentId || ''} onChange={e => u({ parentId: e.target.value || undefined })}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-[#2563eb]">
            <option value="">— 无 —</option>
            {allEntities.filter(e => e.id !== entity.id).map(e => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-[11px] text-gray-400 mb-1 block">描述</label>
          <textarea value={entity.description} onChange={e => u({ description: e.target.value })} rows={2}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-600 resize-none focus:outline-none focus:border-[#2563eb]" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-gray-400">属性定义 ({entity.properties.length})</span>
          <button onClick={addProp} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#2563eb] transition-colors">
            <Plus className="w-3 h-3" />添加
          </button>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1">
          {entity.properties.length === 0 ? (
            <p className="text-[11px] text-gray-400 py-2 text-center">暂无属性，点击添加</p>
          ) : (
            entity.properties.map(p => (
              <PropRow key={p.id} prop={p} onUpdate={up => updateProp(p.id, up)} onRemove={() => removeProp(p.id)} />
            ))
          )}
        </div>
      </div>

      {/* ── 上下位关系预测 ── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setPredExpanded(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-[11px] font-medium text-gray-700 flex-1">上下位关系预测</span>
          {predExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>

        {predExpanded && (
          <div className="px-3 py-3 flex flex-col gap-3">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              基于训练模型为「{entity.label}」智能推荐可能的父/子概念，点击采纳后自动添加至本体。
            </p>

            {/* Trigger buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => triggerPrediction('parent')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] rounded-lg border transition-colors ${
                  predicting === 'parent' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {loading && predicting === 'parent' ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                预测父概念
              </button>
              <button
                onClick={() => triggerPrediction('child')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] rounded-lg border transition-colors ${
                  predicting === 'child' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                {loading && predicting === 'child' ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                预测子概念
              </button>
            </div>

            {/* Parent candidates */}
            {predicting === 'parent' && !loading && parentCandidates.length > 0 && (
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  推荐父概念（置信度排序）
                </div>
                <div className="flex flex-col gap-1.5">
                  {parentCandidates.map(c => (
                    <div key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${c.adopted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-gray-800 font-medium truncate">{c.label}</span>
                          {c.adopted && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${c.confidence * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{(c.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      {!c.adopted && (
                        <button
                          onClick={() => adoptParent(c)}
                          className="flex-shrink-0 text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          采纳
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Child candidates */}
            {predicting === 'child' && !loading && childCandidates.length > 0 && (
              <div>
                <div className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  推荐子概念（置信度排序）
                </div>
                <div className="flex flex-col gap-1.5">
                  {childCandidates.map(c => (
                    <div key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${c.adopted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-gray-800 font-medium truncate">{c.label}</span>
                          {c.adopted && <Check className="w-3 h-3 text-green-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400 rounded-full" style={{ width: `${c.confidence * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{(c.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      {!c.adopted && (
                        <button
                          onClick={() => adoptChild(c)}
                          className="flex-shrink-0 text-[10px] px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                        >
                          采纳
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center gap-2 py-2 text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[11px]">模型推理中…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RelationDetailPanel({ relation, allEntities, onChange, onDelete }: {
  relation: RelationType;
  allEntities: EntityType[];
  onChange: (r: RelationType) => void;
  onDelete: () => void;
}) {
  const u = (patch: Partial<RelationType>) => onChange({ ...relation, ...patch });
  const toggleSource = (id: string) => {
    const ids = relation.sourceTypeIds.includes(id)
      ? relation.sourceTypeIds.filter(x => x !== id)
      : [...relation.sourceTypeIds, id];
    u({ sourceTypeIds: ids });
  };
  const toggleTarget = (id: string) => {
    const ids = relation.targetTypeIds.includes(id)
      ? relation.targetTypeIds.filter(x => x !== id)
      : [...relation.targetTypeIds, id];
    u({ targetTypeIds: ids });
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-900 font-medium">关系类型详情</span>
        <button onClick={onDelete} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />删除
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-400 mb-1 block">显示名称</label>
          <input value={relation.label} onChange={e => u({ label: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#2563eb]" />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 mb-1 block">英文标识</label>
          <input value={relation.name} onChange={e => u({ name: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-500 font-mono focus:outline-none focus:border-[#2563eb]" />
        </div>
        <div className="col-span-2">
          <label className="text-[11px] text-gray-400 mb-1 block">描述</label>
          <textarea value={relation.description} onChange={e => u({ description: e.target.value })} rows={2}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-600 resize-none focus:outline-none focus:border-[#2563eb]" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <label className="text-[11px] text-gray-400">有向关系</label>
          <input type="checkbox" checked={relation.directed} onChange={e => u({ directed: e.target.checked })} className="accent-blue-500" />
        </div>
      </div>

      {[
        { title: '起始实体类型', ids: relation.sourceTypeIds, toggle: toggleSource },
        { title: '目标实体类型', ids: relation.targetTypeIds, toggle: toggleTarget },
      ].map(({ title, ids, toggle }) => (
        <div key={title}>
          <label className="text-[11px] text-gray-400 mb-2 block">{title}</label>
          <div className="flex flex-wrap gap-1.5">
            {allEntities.map(e => (
              <button key={e.id} onClick={() => toggle(e.id)}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border transition-colors ${
                  ids.includes(e.id) ? 'border-transparent text-white' : 'border-gray-200 text-gray-400 hover:border-gray-400'
                }`}
                style={ids.includes(e.id) ? { backgroundColor: e.color + '33', borderColor: e.color + '66', color: e.color } : {}}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                {e.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── NewGraphDialog ───────────────────────────────────────────────────────────

function NewGraphDialog({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, triples: Triple[]) => void;
}) {
  const [graphName, setGraphName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [triples, setTriples] = useState<Triple[] | null>(null);
  const [parseError, setParseError] = useState('');
  const [step, setStep] = useState<'form' | 'building' | 'done'>('form');
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setGraphName('');
    setFile(null);
    setTriples(null);
    setParseError('');
    setStep('form');
    setProgress(0);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File) => {
    setFile(f);
    setParseError('');
    setTriples(null);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const arr: Triple[] = Array.isArray(raw) ? raw : (raw.triples ?? raw.data ?? []);
        if (!arr.length) throw new Error('数组为空');
        const sample = arr[0];
        if (!('subject' in sample || 'head' in sample || 's' in sample)) throw new Error('字段格式不识别');
        const normalized: Triple[] = arr.map((t: any) => ({
          subject: t.subject ?? t.head ?? t.s ?? '',
          predicate: t.predicate ?? t.relation ?? t.p ?? '',
          object: t.object ?? t.tail ?? t.o ?? '',
        }));
        setTriples(normalized);
      } catch (err: any) {
        setParseError(`JSON 解析失败：${err.message || '格式不正确'}`);
      }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.json')) handleFile(f);
  };

  const handleBuild = () => {
    if (!graphName.trim() || !triples) return;
    setStep('building');
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 22 + 8;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setStep('done'), 300); }
      setProgress(Math.min(100, Math.round(p)));
    }, 180);
  };

  const handleConfirm = () => {
    onCreate(graphName.trim(), triples ?? []);
    handleClose();
  };

  if (!open) return null;

  const uniqueEntities = triples ? new Set([...triples.map(t => t.subject), ...triples.map(t => t.object)]).size : 0;
  const uniqueRelations = triples ? new Set(triples.map(t => t.predicate)).size : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-[560px] max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Network className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base text-gray-900 font-medium">新建知识图谱</h2>
            <p className="text-xs text-gray-400 mt-0.5">上传三元组 JSON 文件，构建新的本体图谱</p>
          </div>
          <button onClick={handleClose} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Graph name */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">图谱名称 <span className="text-red-400">*</span></label>
            <input
              value={graphName}
              onChange={e => setGraphName(e.target.value)}
              placeholder="例：生物医学知识图谱 v1.0"
              disabled={step !== 'form'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* File upload zone */}
          {step === 'form' && (
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">三元组 JSON 文件 <span className="text-red-400">*</span></label>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                  file && !parseError ? 'border-green-300 bg-green-50' : parseError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                {!file ? (
                  <>
                    <Upload className="w-8 h-8 text-gray-300" />
                    <div className="text-center">
                      <p className="text-sm text-gray-500">拖拽 JSON 文件到此处，或点击选择文件</p>
                      <p className="text-[11px] text-gray-400 mt-1">支持格式：{"{ subject, predicate, object }"} 数组</p>
                    </div>
                  </>
                ) : parseError ? (
                  <>
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <div className="text-center">
                      <p className="text-sm text-red-500 font-medium">{file.name}</p>
                      <p className="text-xs text-red-400 mt-1">{parseError}</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); setParseError(''); }} className="mt-2 text-xs text-blue-500 hover:underline">重新选择</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-700 font-medium">{file.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · 解析成功</p>
                    </div>
                  </>
                )}
              </div>

              {/* Format hint */}
              <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-gray-400 mb-1 font-medium">支持的字段别名</p>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400">
                  <span><span className="text-gray-600 font-mono">subject</span> / head / s</span>
                  <span><span className="text-gray-600 font-mono">predicate</span> / relation / p</span>
                  <span><span className="text-gray-600 font-mono">object</span> / tail / o</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview stats — shown when file parsed ok */}
          {triples && step === 'form' && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '三元组', value: triples.length.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: '实体数', value: uniqueEntities.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: '关系类型', value: uniqueRelations.toLocaleString(), color: 'text-green-600', bg: 'bg-green-50' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center`}>
                  <div className={`text-lg font-semibold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sample triples preview */}
          {triples && triples.length > 0 && step === 'form' && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">前 5 条三元组预览</p>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['主体 (Subject)', '谓语 (Predicate)', '客体 (Object)'].map(h => (
                        <th key={h} className="text-left text-gray-400 font-medium px-3 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {triples.slice(0, 5).map((t, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate" title={t.subject}>{t.subject}</td>
                        <td className="px-3 py-2"><span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{t.predicate}</span></td>
                        <td className="px-3 py-2 text-gray-700 max-w-[140px] truncate" title={t.object}>{t.object}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Building progress */}
          {step === 'building' && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="relative w-14 h-14">
                <div className="w-14 h-14 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                <Network className="absolute inset-0 m-auto w-5 h-5 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-700 font-medium">正在构建图谱…</p>
                <p className="text-xs text-gray-400 mt-1">解析三元组并生成本体结构</p>
              </div>
              <div className="w-56">
                <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                  <span>构建进度</span><span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-700 font-medium">「{graphName}」构建完成</p>
                <p className="text-xs text-gray-400 mt-1">已解析 {(triples ?? []).length} 条三元组 · {uniqueEntities} 个实体 · {uniqueRelations} 种关系</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={handleClose} className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            取消
          </button>
          <div className="flex-1" />
          {step === 'form' && (
            <button
              onClick={handleBuild}
              disabled={!graphName.trim() || !triples || !!parseError}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Network className="w-3.5 h-3.5" />开始构建
            </button>
          )}
          {step === 'done' && (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              <Check className="w-3.5 h-3.5" />进入图谱
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Canvas Node ──────────────────────────────────────────────────────────────

function EntityNode({ entity, pos, selected, onClick, onDragStart }: {
  entity: EntityType;
  pos: { x: number; y: number };
  selected: boolean;
  onClick: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}) {
  const parentArc = entity.parentId ? 8 : 0;
  return (
    <div
      onMouseDown={e => { e.stopPropagation(); onDragStart(e); onClick(); }}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: NODE_W,
        height: NODE_H,
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div
        className={`w-full h-full rounded-xl border-2 flex flex-col justify-center px-3 transition-shadow ${
          selected ? 'shadow-[0_0_0_2px_rgba(255,255,255,0.15),0_4px_20px_rgba(0,0,0,0.4)]' : 'shadow-md'
        }`}
        style={{
          backgroundColor: entity.color + '1a',
          borderColor: selected ? entity.color : entity.color + '60',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entity.color }} />
          <span className="text-sm text-gray-900 font-medium truncate">{entity.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-4.5">
          <span className="text-[10px] text-gray-500 font-mono">{entity.name}</span>
          <span className="text-[10px] text-gray-400">· {entity.properties.length}属性</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main OntologyEditor ──────────────────────────────────────────────────────

export default function OntologyEditor({
  initialMode = 'structure',
  lockMode = false,
  initialRightPanelTab = 'detail',
  initialShowDrawer = false,
  initialDrawerTab = 'components',
}: {
  initialMode?: 'structure' | 'schema-match';
  lockMode?: boolean;
  initialRightPanelTab?: 'detail' | 'recommend' | 'review' | 'fusion';
  initialShowDrawer?: boolean;
  initialDrawerTab?: 'components' | 'templates';
}) {
  const [entityTypes, setEntityTypes] = useState<EntityType[]>(initEntityTypes);
  const [relationTypes, setRelationTypes] = useState<RelationType[]>(initRelationTypes);
  const [positions, setPositions] = useState<NodePositions>(initPositions);
  const [selectedId, setSelectedId] = useState<string | null>('person');
  const [selectedKind, setSelectedKind] = useState<'entity' | 'relation'>('entity');
  const [leftTab, setLeftTab] = useState<'entities' | 'relations'>('entities');
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);

  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: positions[id]?.x ?? 0, origY: positions[id]?.y ?? 0 };
  }, [positions]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const { id, startX, startY, origX, origY } = dragRef.current;
    setPositions(prev => ({
      ...prev,
      [id]: {
        x: Math.max(0, Math.min(CANVAS_W - NODE_W, origX + e.clientX - startX)),
        y: Math.max(0, Math.min(CANVAS_H - NODE_H, origY + e.clientY - startY)),
      },
    }));
  }, []);

  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  const addEntityType = () => {
    const id = uid();
    const newE: EntityType = { id, name: 'NewType', label: '新实体类', color: ENTITY_COLORS[entityTypes.length % ENTITY_COLORS.length], description: '', properties: [] };
    setEntityTypes(prev => [...prev, newE]);
    setPositions(prev => ({ ...prev, [id]: { x: 100 + (entityTypes.length % 4) * 180, y: 80 + Math.floor(entityTypes.length / 4) * 120 } }));
    setSelectedId(id);
    setSelectedKind('entity');
  };

  const addRelationType = () => {
    const newR: RelationType = { id: uid(), name: 'new_relation', label: '新关系', description: '', sourceTypeIds: [], targetTypeIds: [], directed: true };
    setRelationTypes(prev => [...prev, newR]);
    setSelectedId(newR.id);
    setSelectedKind('relation');
  };

  const selectedEntity = selectedKind === 'entity' ? entityTypes.find(e => e.id === selectedId) : null;
  const selectedRelation = selectedKind === 'relation' ? relationTypes.find(r => r.id === selectedId) : null;
  const toggleExpand = (id: string) => setExpandedEntities(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── Graph list state ────────────────────────────────────────────────────────
  const [graphs, setGraphs] = useState<GraphItem[]>([
    { id: 'g1', name: '科研知识图谱 v2.1', tripleCount: 18420, entityCount: 6, createdAt: '2026-05-12', source: 'builtin' },
    { id: 'g2', name: '医学本体图谱', tripleCount: 7340, entityCount: 12, createdAt: '2026-06-18', source: 'uploaded' },
  ]);
  const [activeGraphId, setActiveGraphId] = useState('g1');
  const [showGraphDropdown, setShowGraphDropdown] = useState(false);
  const [showNewGraphDialog, setShowNewGraphDialog] = useState(false);
  const activeGraph = graphs.find(g => g.id === activeGraphId) ?? graphs[0];

  const handleCreateGraph = (name: string, triples: Triple[]) => {
    const uniqueEntities = new Set([...triples.map(t => t.subject), ...triples.map(t => t.object)]).size;
    const newG: GraphItem = {
      id: uid(),
      name,
      tripleCount: triples.length,
      entityCount: uniqueEntities,
      createdAt: new Date().toISOString().slice(0, 10),
      source: 'uploaded',
    };
    setGraphs(prev => [...prev, newG]);
    setActiveGraphId(newG.id);
  };

  // ── Schema Matching state ───────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'structure' | 'schema-match'>(initialMode);
  const [checkedEntities, setCheckedEntities] = useState<Set<string>>(new Set(['person', 'organization', 'technology', 'event']));
  const [starredEntities, setStarredEntities] = useState<Set<string>>(new Set(['person', 'organization']));
  const [matchThreshold, setMatchThreshold] = useState(0.7);
  const [sourceOntology, setSourceOntology] = useState('科研知识图谱 v2.1');
  const [targetOntology, setTargetOntology] = useState('W3C SOSA Ontology');
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showDrawer, setShowDrawer] = useState(initialShowDrawer);
  const [rightPanelTab, setRightPanelTab] = useState<'detail' | 'recommend' | 'review' | 'fusion'>(initialRightPanelTab);
  const [isMatching, setIsMatching] = useState(false);
  const [matchDone, setMatchDone] = useState(true);
  const [strategyWeights, setStrategyWeights] = useState({ text: 0.35, structure: 0.3, ml: 0.35 });
  const [fusionThreshold, setFusionThreshold] = useState(0.65);

  const startMatching = () => { setIsMatching(true); setTimeout(() => { setIsMatching(false); setMatchDone(true); }, 1800); };

  // Mock schema match data
  const TARGET_NODES = [
    { id: 'T_Person',       label: 'Person',       color: '#3b82f6', x: 650, y: 80  },
    { id: 'T_Organization', label: 'Organization', color: '#8b5cf6', x: 650, y: 165 },
    { id: 'T_Technology',   label: 'Technology',   color: '#06b6d4', x: 650, y: 260 },
    { id: 'T_Event',        label: 'Event',        color: '#ec4899', x: 650, y: 355 },
    { id: 'T_Dataset',      label: 'Dataset',      color: '#f59e0b', x: 650, y: 440 },
  ];
  const MATCH_LINES: { srcId: string; tgtId: string; relation: '等价' | '模糊匹配' | '从属'; score: number }[] = [
    { srcId: 'person',       tgtId: 'T_Person',       relation: '等价',    score: 0.96 },
    { srcId: 'organization', tgtId: 'T_Organization', relation: '等价',    score: 0.93 },
    { srcId: 'technology',   tgtId: 'T_Technology',   relation: '模糊匹配', score: 0.82 },
    { srcId: 'event',        tgtId: 'T_Event',        relation: '从属',    score: 0.76 },
  ];
  const MATCH_COLORS = { '等价': '#3b82f6', '模糊匹配': '#8b5cf6', '从属': '#10b981' };
  const MATCH_DASH = { '等价': undefined, '模糊匹配': '6,4', '从属': undefined };

  const RECOMMENDATIONS = [
    { target: 'Person', score: 0.96, relation: '等价', algo: 'TextSim + StructAlign', accepted: null as boolean | null },
    { target: 'Organization', score: 0.93, relation: '等价', algo: 'StructAlign', accepted: null as boolean | null },
    { target: 'AgentClass', score: 0.71, relation: '从属', algo: 'TextSim', accepted: null as boolean | null },
  ];
  const [recs, setRecs] = useState(RECOMMENDATIONS);

  const FUSION_CANDIDATES = [
    { src: '人物', tgt: 'Person', text: 0.92, structure: 0.88, ml: 0.95 },
    { src: '组织', tgt: 'Organization', text: 0.85, structure: 0.91, ml: 0.87 },
    { src: '技术', tgt: 'Technology', text: 0.78, structure: 0.72, ml: 0.81 },
    { src: '事件', tgt: 'Event', text: 0.55, structure: 0.68, ml: 0.49 },
    { src: '数据集', tgt: 'Dataset', text: 0.41, structure: 0.52, ml: 0.38 },
  ];

  const strategyWeightTotal = strategyWeights.text + strategyWeights.structure + strategyWeights.ml;
  const normStrategyWeights = {
    text: strategyWeights.text / strategyWeightTotal,
    structure: strategyWeights.structure / strategyWeightTotal,
    ml: strategyWeights.ml / strategyWeightTotal,
  };
  const fusionRanked = FUSION_CANDIDATES
    .map((c) => {
      const score =
        c.text * normStrategyWeights.text +
        c.structure * normStrategyWeights.structure +
        c.ml * normStrategyWeights.ml;
      const votes = [c.text, c.structure, c.ml].filter((s) => s >= fusionThreshold).length;
      return { ...c, score, votes, decision: score >= fusionThreshold ? '匹配' as const : '不匹配' as const };
    })
    .sort((a, b) => b.score - a.score);

  // ── Fusion templates ──────────────────────────────────────────────────────
  interface FusionTemplate {
    id: string;
    name: string;
    savedAt: string;
    sourceOntology: string;
    targetOntology: string;
    checkedEntities: string[];
    starredEntities: string[];
    matchThreshold: number;
    matchDepth: string;
  }
  const [fusionTemplates, setFusionTemplates] = useState<FusionTemplate[]>([
    {
      id: 'tpl-1',
      name: '科研→SOSA 标准映射',
      savedAt: '2026-07-15 10:30',
      sourceOntology: '科研知识图谱 v2.1',
      targetOntology: 'W3C SOSA Ontology',
      checkedEntities: ['person', 'organization', 'technology', 'event'],
      starredEntities: ['person', 'organization'],
      matchThreshold: 0.7,
      matchDepth: '包含子节点',
    },
    {
      id: 'tpl-2',
      name: '全实体高精度融合',
      savedAt: '2026-07-22 14:05',
      sourceOntology: '科研知识图谱 v2.1',
      targetOntology: 'Schema.org',
      checkedEntities: ['person', 'organization', 'technology', 'event', 'paper', 'patent'],
      starredEntities: ['person', 'technology'],
      matchThreshold: 0.85,
      matchDepth: '包含关联节点',
    },
  ]);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [matchDepth, setMatchDepth] = useState('仅当前节点');
  const [drawerTab, setDrawerTab] = useState<'components' | 'templates'>(initialDrawerTab);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) return;
    const tpl: FusionTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      savedAt: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
      sourceOntology,
      targetOntology,
      checkedEntities: Array.from(checkedEntities),
      starredEntities: Array.from(starredEntities),
      matchThreshold,
      matchDepth,
    };
    setFusionTemplates(prev => [tpl, ...prev]);
    setNewTemplateName('');
    setShowSaveTemplateDialog(false);
  };

  const handleApplyTemplate = (tpl: FusionTemplate) => {
    setApplyingTemplateId(tpl.id);
    setTimeout(() => {
      setSourceOntology(tpl.sourceOntology);
      setTargetOntology(tpl.targetOntology);
      setCheckedEntities(new Set(tpl.checkedEntities));
      setStarredEntities(new Set(tpl.starredEntities));
      setMatchThreshold(tpl.matchThreshold);
      setMatchDepth(tpl.matchDepth);
      setMatchDone(false);
      setApplyingTemplateId(null);
    }, 600);
  };

  const REVIEW_ITEMS = [
    { src: '人物', tgt: 'Person', relation: '等价', status: '已接受' },
    { src: '组织', tgt: 'Organization', relation: '等价', status: '已接受' },
    { src: '技术', tgt: 'Technology', relation: '模糊匹配', status: '待审核' },
    { src: '事件', tgt: 'Event', relation: '从属', status: '待审核' },
  ];

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">

      {/* ── Graph selector + Mode tabs + drawer button ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Graph selector */}
        <div className="relative">
          <button
            onClick={() => setShowGraphDropdown(v => !v)}
            className="flex items-center gap-2 h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-300 transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="max-w-[140px] truncate">{activeGraph?.name ?? '选择图谱'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          </button>
          {showGraphDropdown && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowGraphDropdown(false)} />
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-[11px] text-gray-400 font-medium">当前工作图谱</p>
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {graphs.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setActiveGraphId(g.id); setShowGraphDropdown(false); }}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${g.id === activeGraphId ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${g.id === activeGraphId ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Network className={`w-3.5 h-3.5 ${g.id === activeGraphId ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium truncate ${g.id === activeGraphId ? 'text-blue-700' : 'text-gray-700'}`}>{g.name}</span>
                        {g.source === 'uploaded' && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">上传</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{g.tripleCount.toLocaleString()} 条三元组 · {g.entityCount} 种实体</p>
                    </div>
                    {g.id === activeGraphId && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => { setShowGraphDropdown(false); setShowNewGraphDialog(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />新建图谱…
                </button>
              </div>
            </div>
            </>
          )}
        </div>

        {!lockMode && <div className="w-px h-5 bg-gray-200" />}

        {/* Mode tabs — hidden when locked */}
        {!lockMode && (
          <>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {([['structure', '本体结构'], ['schema-match', 'Schema 匹配']] as const).map(([mode, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {mode === 'schema-match' && <GitMerge className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                  {label}
                </button>
              ))}
            </div>
            {viewMode === 'schema-match' && (
              <span className="text-[11px] text-gray-400 ml-1">在现有本体上叠加跨本体匹配视图</span>
            )}
          </>
        )}
        <button onClick={() => setShowDrawer(v => !v)}
          className={`ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${showDrawer ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
          <Workflow className="w-3.5 h-3.5" />原子组件库
        </button>
      </div>

      {/* NewGraphDialog */}
      <NewGraphDialog
        open={showNewGraphDialog}
        onClose={() => setShowNewGraphDialog(false)}
        onCreate={handleCreateGraph}
      />

      <div className="flex gap-3 flex-1 min-h-0 relative">
        {/* ── Left Panel ── */}
        <div className="w-52 flex-shrink-0 flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
          {viewMode === 'structure' ? (
            <>
              <div className="flex border-b border-gray-200">
                {(['entities', 'relations'] as const).map(tab => (
                  <button key={tab} onClick={() => setLeftTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${leftTab === tab ? 'text-gray-900 border-b-2 border-[#2563eb]' : 'text-gray-400 hover:text-gray-600'}`}>
                    {tab === 'entities' ? `实体类 (${entityTypes.length})` : `关系 (${relationTypes.length})`}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {leftTab === 'entities' ? (
                  <div>
                    {entityTypes.map(e => (
                      <div key={e.id}>
                        <button onClick={() => { setSelectedId(e.id); setSelectedKind('entity'); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${selectedId === e.id && selectedKind === 'entity' ? 'bg-blue-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                          <span className="flex-1 text-left truncate">{e.label}</span>
                          <span className="text-gray-400 text-[10px]">{e.properties.length}</span>
                          <button onClick={ev => { ev.stopPropagation(); toggleExpand(e.id); }} className="text-gray-400 hover:text-gray-600">
                            {expandedEntities.includes(e.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        </button>
                        {expandedEntities.includes(e.id) && (
                          <div className="pl-7 pb-1">
                            {e.properties.map(p => (
                              <div key={p.id} className="flex items-center gap-1.5 py-0.5 text-[11px] text-gray-400">
                                {(() => { const Icon = PROP_TYPE_ICON[p.type]; return <Icon className="w-3 h-3" />; })()}
                                {p.label}{p.required && <span className="text-red-500">*</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  relationTypes.map(r => {
                    const src = entityTypes.find(e => r.sourceTypeIds[0] === e.id);
                    const tgt = entityTypes.find(e => r.targetTypeIds[0] === e.id);
                    return (
                      <button key={r.id} onClick={() => { setSelectedId(r.id); setSelectedKind('relation'); }}
                        className={`w-full flex flex-col px-3 py-2 text-xs transition-colors ${selectedId === r.id && selectedKind === 'relation' ? 'bg-blue-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <span className="text-left font-medium">{r.label}</span>
                        {src && tgt && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                            <span style={{ color: src.color + 'cc' }}>{src.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span style={{ color: tgt.color + 'cc' }}>{tgt.label}</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="p-2 border-t border-gray-200">
                {leftTab === 'entities' ? (
                  <button onClick={addEntityType} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-[#2563eb] border border-dashed border-gray-200 hover:border-[#2563eb]/50 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" />添加实体类
                  </button>
                ) : (
                  <button onClick={addRelationType} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-[#2563eb] border border-dashed border-gray-200 hover:border-[#2563eb]/50 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" />添加关系类型
                  </button>
                )}
              </div>
            </>
          ) : (
            // Schema-match mode left panel: source ontology scope
            <>
              <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">本体子集选择<span className="font-normal text-gray-400">（标星的是核心概念定义）</span></span>
                <span className="text-[10px] text-gray-400">{checkedEntities.size}/{entityTypes.length} 选中</span>
              </div>
              <div className="flex-1 overflow-y-auto py-1">
                {entityTypes.map(e => {
                  const isChecked = checkedEntities.has(e.id);
                  const isStarred = starredEntities.has(e.id);
                  return (
                    <div key={e.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 group">
                      <button onClick={() => setCheckedEntities(prev => { const n = new Set(prev); isChecked ? n.delete(e.id) : n.add(e.id); return n; })}
                        className="flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors">
                        {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> : <Square className="w-3.5 h-3.5" />}
                      </button>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <span className={`flex-1 text-xs truncate ${isChecked ? 'text-gray-800' : 'text-gray-400'}`}>{e.label}</span>
                      <button onClick={() => setStarredEntities(prev => { const n = new Set(prev); isStarred ? n.delete(e.id) : n.add(e.id); return n; })}
                        className={`flex-shrink-0 transition-colors ${isStarred ? 'text-amber-400' : 'text-gray-200 group-hover:text-gray-300'}`}>
                        <Star className={`w-3 h-3 ${isStarred ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="p-2 border-t border-gray-200">
                <button onClick={() => setShowSubjectDialog(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors font-medium">
                  <Settings2 className="w-3.5 h-3.5" />选择匹配主体
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Canvas ── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {viewMode === 'schema-match' ? (
            // Schema-match canvas toolbar
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 flex-shrink-0">
              <GitMerge className="w-4 h-4 text-blue-500" />
              <select value={sourceOntology} onChange={e => setSourceOntology(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400">
                <option>科研知识图谱 v2.1</option>
                <option>医疗本体 v1.0</option>
              </select>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <select value={targetOntology} onChange={e => setTargetOntology(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400">
                <option>W3C SOSA Ontology</option>
                <option>Schema.org</option>
                <option>Dublin Core</option>
              </select>
              <div className="flex items-center gap-1.5 ml-2">
                <Sliders className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] text-gray-500">阈值</span>
                <input type="range" min={0.5} max={1} step={0.05} value={matchThreshold} onChange={e => setMatchThreshold(+e.target.value)} className="w-16 accent-blue-500 h-1" />
                <span className="text-[11px] text-gray-600 w-6">{matchThreshold.toFixed(2).slice(1)}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {/* Legend */}
                {[['#3b82f6', '等价', 'solid'], ['#8b5cf6', '模糊匹配', 'dashed'], ['#10b981', '从属', 'arrow']].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1 text-[10px] text-gray-500">
                    <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke={color as string} strokeWidth="1.5" strokeDasharray={label === '模糊匹配' ? '4,2' : undefined} />{label === '从属' && <polygon points="14,1 18,4 14,7" fill={color as string} />}</svg>
                    {label}
                  </div>
                ))}
                <button onClick={startMatching} disabled={isMatching}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                  {isMatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {isMatching ? '匹配中…' : '开始智能匹配'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
              <Layers className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">本体图谱画布</span>
              <span className="text-[11px] text-gray-400 ml-1">— 拖拽节点调整布局，点击节点或关系线进行编辑</span>
            </div>
          )}

          <div className="flex-1 overflow-auto">
            <div ref={canvasRef}
              style={{ position: 'relative', width: viewMode === 'schema-match' ? 860 : CANVAS_W, height: CANVAS_H, minWidth: viewMode === 'schema-match' ? 860 : CANVAS_W, minHeight: CANVAS_H }}
              onMouseDown={() => { setSelectedId(null); }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.7" fill="#00000008" />
                  </pattern>
                  <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
                  </marker>
                  <marker id="arrow-selected" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
                  </marker>
                  {(['#3b82f6','#8b5cf6','#10b981'] as const).map((color, i) => (
                    <marker key={i} id={`ma-${i}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill={color} />
                    </marker>
                  ))}
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Ontology section divider in schema-match mode */}
                {viewMode === 'schema-match' && (
                  <>
                    <line x1="580" y1="10" x2="580" y2="490" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
                    <text x="100" y="20" fontSize="10" fill="#9ca3af" textAnchor="middle">源本体</text>
                    <text x="730" y="20" fontSize="10" fill="#9ca3af" textAnchor="middle">目标本体</text>
                  </>
                )}

                {/* Schema match lines */}
                {viewMode === 'schema-match' && matchDone && MATCH_LINES.map((ml, i) => {
                  const srcPos = positions[ml.srcId];
                  const tgt = TARGET_NODES.find(n => n.id === ml.tgtId);
                  if (!srcPos || !tgt) return null;
                  const sx = srcPos.x + NODE_W;
                  const sy = srcPos.y + NODE_H / 2;
                  const ex = tgt.x;
                  const ey = tgt.y + NODE_H / 2;
                  const mx = (sx + ex) / 2;
                  const my = (sy + ey) / 2;
                  const color = MATCH_COLORS[ml.relation];
                  const dash = MATCH_DASH[ml.relation];
                  const markerIdx = ml.relation === '等价' ? 0 : ml.relation === '模糊匹配' ? 1 : 2;
                  return (
                    <g key={ml.srcId}>
                      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth="1.5" strokeDasharray={dash} strokeOpacity="0.75" markerEnd={`url(#ma-${markerIdx})`} style={{ pointerEvents: 'none' }} />
                      <rect x={mx - 28} y={my - 10} width="56" height="18" rx="4" fill="white" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
                      <text x={mx} y={my + 4} textAnchor="middle" fontSize="9" fill={color} style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {ml.relation} {(ml.score * 100).toFixed(0)}%
                      </text>
                    </g>
                  );
                })}

                {/* Regular ontology relation edges */}
                {relationTypes.map(rel => {
                  const srcId = rel.sourceTypeIds[0]; const tgtId = rel.targetTypeIds[0];
                  if (!srcId || !tgtId) return null;
                  const srcPos = positions[srcId]; const tgtPos = positions[tgtId];
                  if (!srcPos || !tgtPos) return null;
                  const { sx, sy, ex, ey } = getEdgeEndpoints(srcPos, tgtPos);
                  const mx = (sx + ex) / 2; const my = (sy + ey) / 2;
                  const isSelected = selectedId === rel.id && selectedKind === 'relation';
                  const pathD = cubicPath(sx, sy, ex, ey);
                  return (
                    <g key={rel.id}>
                      <path d={pathD} stroke="transparent" strokeWidth="12" fill="none" style={{ cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setSelectedId(rel.id); setSelectedKind('relation'); }} />
                      <path d={pathD} stroke={isSelected ? '#60a5fa' : '#4b5563'} strokeWidth={isSelected ? 2 : 1.5}
                        fill="none" markerEnd={`url(#${isSelected ? 'arrow-selected' : 'arrow'})`}
                        strokeDasharray={rel.directed ? undefined : '5,3'} style={{ pointerEvents: 'none' }} />
                      <text x={mx} y={my - 6} textAnchor="middle" fontSize="10" fill={isSelected ? '#93c5fd' : '#6b7280'}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>{rel.label}</text>
                    </g>
                  );
                })}
                {entityTypes.filter(e => e.parentId).map(e => {
                  const parent = entityTypes.find(p => p.id === e.parentId);
                  if (!parent || !positions[e.id] || !positions[parent.id]) return null;
                  const { sx, sy, ex, ey } = getEdgeEndpoints(positions[e.id], positions[parent.id]);
                  return <line key={`inherit-${e.id}`} x1={sx} y1={sy} x2={ex} y2={ey} stroke={e.color + '66'} strokeWidth={1.5} strokeDasharray="4,3" style={{ pointerEvents: 'none' }} />;
                })}
              </svg>

              {/* Source ontology nodes */}
              {entityTypes.map(e => (
                <EntityNode key={e.id} entity={e} pos={positions[e.id] ?? { x: 0, y: 0 }}
                  selected={selectedId === e.id && selectedKind === 'entity'}
                  onClick={() => { setSelectedId(e.id); setSelectedKind('entity'); }}
                  onDragStart={ev => handleNodeDragStart(ev, e.id)} />
              ))}

              {/* Target ontology nodes in schema-match mode */}
              {viewMode === 'schema-match' && matchDone && TARGET_NODES.map(t => (
                <div key={t.id} style={{ position: 'absolute', left: t.x, top: t.y, width: NODE_W, height: NODE_H, userSelect: 'none' }}>
                  <div className="w-full h-full rounded-xl border-2 flex flex-col justify-center px-3"
                    style={{ backgroundColor: t.color + '1a', borderColor: t.color + '60' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-sm text-gray-800 font-medium truncate">{t.label}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 ml-4.5 mt-0.5 font-mono">{t.id.replace('T_', '')} · 目标本体</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Detail Panel ── */}
        <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {viewMode === 'schema-match' ? (
            // Schema-match mode: tabbed right panel
            <>
              <div className="flex border-b border-gray-200 flex-shrink-0">
                {([['detail', '详情'], ['recommend', '模糊关系'], ['review', '人工审核'], ['fusion', '多策略融合']] as const).map(([tab, label]) => (
                  <button key={tab} onClick={() => setRightPanelTab(tab)}
                    className={`flex-1 py-2.5 px-0.5 text-[10px] font-medium transition-colors leading-tight ${rightPanelTab === tab ? 'text-gray-900 border-b-2 border-[#2563eb]' : 'text-gray-400 hover:text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {rightPanelTab === 'detail' && (selectedEntity ? (
                  <EntityDetailPanel entity={selectedEntity} allEntities={entityTypes}
                    onChange={updated => setEntityTypes(prev => prev.map(e => e.id === updated.id ? updated : e))}
                    onDelete={() => { setEntityTypes(prev => prev.filter(e => e.id !== selectedEntity.id)); setSelectedId(null); }} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <Info className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs text-center">点击实体节点查看详情</p>
                  </div>
                ))}

                {rightPanelTab === 'recommend' && (
                  <div className="flex flex-col gap-3">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-blue-400" />模糊关系构建
                      {selectedEntity && <span className="text-gray-500 normal-case">· {selectedEntity.label}</span>}
                    </div>
                    {recs.map((r, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-800">{r.target}</span>
                          <span className="text-[11px] font-semibold text-blue-600">{(r.score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">{r.relation}</span>
                          <span className="text-[10px] text-gray-400">{r.algo}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${r.score * 100}%` }} />
                        </div>
                        {r.accepted === null ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => setRecs(prev => prev.map((x, j) => j === i ? { ...x, accepted: true } : x))}
                              className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                              <ThumbsUp className="w-3 h-3" />确认
                            </button>
                            <button onClick={() => setRecs(prev => prev.map((x, j) => j === i ? { ...x, accepted: false } : x))}
                              className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
                              <ThumbsDown className="w-3 h-3" />否决
                            </button>
                          </div>
                        ) : (
                          <div className={`text-[11px] text-center py-1 rounded-lg ${r.accepted ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
                            {r.accepted ? '✓ 已确认' : '✗ 已否决'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {rightPanelTab === 'review' && (
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">已建立 / 待审核的匹配关系</div>
                    {REVIEW_ITEMS.map((item, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[11px] text-blue-600 font-medium">{item.src}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="text-[11px] text-purple-600 font-medium">{item.tgt}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{item.relation}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.status === '已接受' ? 'text-green-600 bg-green-50 border border-green-200' : 'text-blue-600 bg-blue-50 border border-blue-200'}`}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {rightPanelTab === 'fusion' && (
                  <div className="flex flex-col gap-3">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3 h-3 text-orange-400" />策略权重配置
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                      {([
                        ['text', '文本匹配', 'accent-blue-600', 'text-blue-700'],
                        ['structure', '结构匹配', 'accent-purple-600', 'text-purple-700'],
                        ['ml', '机器学习', 'accent-green-600', 'text-green-700'],
                      ] as const).map(([key, label, accent, textCls]) => (
                        <div key={key}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-gray-600">{label}</span>
                            <span className={`font-semibold ${textCls}`}>
                              {(normStrategyWeights[key] * 100).toFixed(0)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.05}
                            max={1}
                            step={0.05}
                            value={strategyWeights[key]}
                            onChange={(e) =>
                              setStrategyWeights((w) => ({ ...w, [key]: parseFloat(e.target.value) }))
                            }
                            className={`w-full h-1.5 ${accent}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 whitespace-nowrap">判定阈值</span>
                      <input
                        type="range"
                        min={0.3}
                        max={0.9}
                        step={0.05}
                        value={fusionThreshold}
                        onChange={(e) => setFusionThreshold(parseFloat(e.target.value))}
                        className="flex-1 accent-orange-500 h-1.5"
                      />
                      <span className="text-[11px] font-semibold text-orange-600 w-8 text-right">
                        {fusionThreshold.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">结果投票与排序</div>
                    <div className="flex flex-col gap-2">
                      {fusionRanked.map((c, i) => (
                        <div key={`${c.src}-${c.tgt}`} className="border border-gray-200 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1.5 gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[10px] text-gray-400 w-3">{i + 1}</span>
                              <span className="text-[11px] text-blue-600 font-medium truncate">{c.src}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />
                              <span className="text-[11px] text-purple-600 font-medium truncate">{c.tgt}</span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                c.decision === '匹配'
                                  ? 'text-green-600 bg-green-50 border border-green-200'
                                  : 'text-gray-500 bg-gray-50 border border-gray-200'
                              }`}
                            >
                              {c.decision}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${c.score >= fusionThreshold ? 'bg-orange-500' : 'bg-gray-300'}`}
                                style={{ width: `${c.score * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-orange-600 w-8 text-right">
                              {(c.score * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>
                              文 {(c.text * 100).toFixed(0)} · 构 {(c.structure * 100).toFixed(0)} · 学 {(c.ml * 100).toFixed(0)}
                            </span>
                            <span>票数 {c.votes}/3</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 overflow-y-auto flex-1">
              {selectedEntity ? (
                <EntityDetailPanel entity={selectedEntity} allEntities={entityTypes}
                  onChange={updated => setEntityTypes(prev => prev.map(e => e.id === updated.id ? updated : e))}
                  onDelete={() => { setEntityTypes(prev => prev.filter(e => e.id !== selectedEntity.id)); setSelectedId(null); }} />
              ) : selectedRelation ? (
                <RelationDetailPanel relation={selectedRelation} allEntities={entityTypes}
                  onChange={updated => setRelationTypes(prev => prev.map(r => r.id === updated.id ? updated : r))}
                  onDelete={() => { setRelationTypes(prev => prev.filter(r => r.id !== selectedRelation.id)); setSelectedId(null); }} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Info className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs text-center leading-relaxed">点击画布中的节点或关系线<br />查看并编辑详情</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 原子组件库 / 流程模板 Drawer ── */}
        {showDrawer && (
          <div className="absolute right-0 top-0 h-full w-72 bg-white border-l border-gray-200 shadow-lg rounded-r-lg flex flex-col z-10 overflow-hidden"
            style={{ right: '-1px' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
              <Workflow className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">流程 / 模板</span>
              <button onClick={() => setShowDrawer(false)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            {/* Drawer tabs */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
              {([['components', '原子组件库'], ['templates', '流程模板管理']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setDrawerTab(k)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${drawerTab === k ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>

            {drawerTab === 'components' && (<>
            {/* Mini flow preview */}
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">当前流程预览</div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['加载本体', '主体选择', '语义匹配', '人工审核'].map((step, i, arr) => (
                  <div key={step} className="flex items-center gap-1 flex-shrink-0">
                    <div className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 whitespace-nowrap">{step}</div>
                    {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
            {/* Component list */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">原子组件</div>
              <div className="flex flex-col gap-1.5">
                {[
                  { name: '加载本体', icon: Database, color: 'text-blue-500 bg-blue-50 border-blue-200' },
                  { name: '主体选择', icon: Settings2, color: 'text-purple-500 bg-purple-50 border-purple-200' },
                  { name: '文本匹配', icon: Tag, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
                  { name: '语义匹配', icon: Sparkles, color: 'text-amber-500 bg-amber-50 border-amber-200' },
                  { name: '结构匹配', icon: GitMerge, color: 'text-green-500 bg-green-50 border-green-200' },
                  { name: '人工审核', icon: CheckSquare, color: 'text-red-500 bg-red-50 border-red-200' },
                ].map(comp => (
                  <div key={comp.name} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${comp.color} cursor-grab`}>
                    <comp.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium">{comp.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 flex-shrink-0">
              <button onClick={() => { setNewTemplateName(''); setShowSaveTemplateDialog(true); setDrawerTab('templates'); }}
                className="w-full text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                保存当前配置为模板
              </button>
            </div>
            </>)}

            {drawerTab === 'templates' && (<>
            <div className="flex-1 overflow-y-auto flex flex-col gap-0 min-h-0">
              {/* Save new template inline form */}
              {showSaveTemplateDialog ? (
                <div className="p-3 border-b border-gray-100 bg-blue-50 flex-shrink-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">保存当前融合配置</div>
                  <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
                    placeholder="模板名称…"
                    className="w-full text-xs border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500 mb-2"
                    onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()} />
                  <div className="flex gap-1.5">
                    <div className="flex-1 text-[10px] text-gray-400 bg-white border border-gray-200 rounded px-2 py-1 truncate">
                      {sourceOntology} → {targetOntology}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => setShowSaveTemplateDialog(false)}
                      className="flex-1 text-xs py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
                    <button onClick={handleSaveTemplate} disabled={!newTemplateName.trim()}
                      className="flex-1 text-xs py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">保存</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowSaveTemplateDialog(true)}
                  className="flex items-center justify-center gap-1.5 mx-3 mt-3 py-2 text-xs text-blue-600 border border-dashed border-blue-300 hover:border-blue-500 rounded-lg transition-colors flex-shrink-0">
                  <Plus className="w-3.5 h-3.5" />保存当前配置为模板
                </button>
              )}

              {/* Template list */}
              <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
                {fusionTemplates.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">暂无已保存模板</div>
                )}
                {fusionTemplates.map(tpl => {
                  const isApplying = applyingTemplateId === tpl.id;
                  return (
                    <div key={tpl.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <div className="px-3 py-2.5">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-xs font-medium text-gray-800 leading-snug">{tpl.name}</span>
                          <button onClick={() => setFusionTemplates(prev => prev.filter(t => t.id !== tpl.id))}
                            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-gray-400 mb-2">{tpl.savedAt}</div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                          <span className="bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded truncate max-w-[90px]">{tpl.sourceOntology}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />
                          <span className="bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded truncate max-w-[90px]">{tpl.targetOntology}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span>{tpl.checkedEntities.length} 个实体</span>
                          <span>阈值 {(tpl.matchThreshold * 100).toFixed(0)}%</span>
                          <span>{tpl.matchDepth}</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 px-3 py-2">
                        <button onClick={() => handleApplyTemplate(tpl)} disabled={isApplying}
                          className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                          {isApplying
                            ? <><Loader2 className="w-3 h-3 animate-spin" />应用中…</>
                            : <><Play className="w-3 h-3" />应用此模板</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </>)}
          </div>
        )}
      </div>

      {/* ── 选择本体匹配主体 Dialog ── */}
      {showSubjectDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowSubjectDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <Settings2 className="w-5 h-5 text-blue-500" />
              <span className="text-base font-medium text-gray-900">选择本体匹配主体</span>
              <button onClick={() => setShowSubjectDialog(false)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Source ontology tree */}
              <div className="flex-1 border-r border-gray-100 p-4 overflow-y-auto">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Database className="w-3 h-3" />源本体 · {sourceOntology}
                </div>
                {entityTypes.map(e => (
                  <label key={e.id} className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded px-1 cursor-pointer">
                    <input type="checkbox" checked={checkedEntities.has(e.id)}
                      onChange={() => setCheckedEntities(prev => { const n = new Set(prev); checkedEntities.has(e.id) ? n.delete(e.id) : n.add(e.id); return n; })}
                      className="accent-blue-500 flex-shrink-0" />
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <span className="text-xs text-gray-700">{e.label}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{e.properties.length}属性</span>
                  </label>
                ))}
              </div>
              {/* Target ontology tree */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Database className="w-3 h-3" />目标本体 · {targetOntology}
                </div>
                {TARGET_NODES.map(t => (
                  <label key={t.id} className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded px-1 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-purple-500 flex-shrink-0" />
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-xs text-gray-700">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Core concepts + depth */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">已标记核心概念</div>
                  <div className="flex flex-wrap gap-1.5">
                    {entityTypes.filter(e => starredEntities.has(e.id)).map(e => (
                      <span key={e.id} className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />{e.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">匹配深度</div>
                  <select value={matchDepth} onChange={e => setMatchDepth(e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none">
                    <option>仅当前节点</option>
                    <option>包含子节点</option>
                    <option>包含关联节点</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button onClick={() => setShowSubjectDialog(false)} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={() => setShowSubjectDialog(false)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-colors">确认选择</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
