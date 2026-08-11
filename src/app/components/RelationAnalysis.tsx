import { useState, useMemo } from 'react';
import {
  Network,
  Search,
  Filter,
  Download,
  ChevronRight,
  ArrowRight,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityType = '人物' | '组织' | '技术' | '概念';
type RelationType = '隶属于' | '研究' | '应用于' | '合作' | '引用' | '参与';

interface EntityNode {
  id: string;
  name: string;
  type: EntityType;
  x: number;
  y: number;
}

interface RelationEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: RelationType;
  score: number;
  evidence: number;
  dimensions: {
    共现频率: number;
    语义相似度: number;
    时序关联: number;
    路径权重: number;
  };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const NODES: EntityNode[] = [
  { id: 'n1',  name: '张明',       type: '人物', x: 120, y: 100 },
  { id: 'n2',  name: '李华',       type: '人物', x: 340, y: 60  },
  { id: 'n3',  name: '王强',       type: '人物', x: 560, y: 120 },
  { id: 'n4',  name: '清华大学',   type: '组织', x: 200, y: 220 },
  { id: 'n5',  name: '北京大学',   type: '组织', x: 460, y: 240 },
  { id: 'n6',  name: '中科院',     type: '组织', x: 620, y: 300 },
  { id: 'n7',  name: 'Transformer',type: '技术', x: 160, y: 360 },
  { id: 'n8',  name: 'BERT',       type: '技术', x: 360, y: 390 },
  { id: 'n9',  name: '图神经网络', type: '技术', x: 570, y: 400 },
  { id: 'n10', name: '知识图谱',   type: '概念', x: 280, y: 290 },
  { id: 'n11', name: '深度学习',   type: '概念', x: 460, y: 340 },
  { id: 'n12', name: '自然语言处理', type: '概念', x: 90, y: 260 },
];

const EDGES: RelationEdge[] = [
  { id: 'e1',  sourceId: 'n1',  targetId: 'n4',  relationType: '隶属于', score: 0.95, evidence: 12, dimensions: { 共现频率: 0.92, 语义相似度: 0.88, 时序关联: 0.95, 路径权重: 0.98 } },
  { id: 'e2',  sourceId: 'n2',  targetId: 'n5',  relationType: '隶属于', score: 0.90, evidence: 9,  dimensions: { 共现频率: 0.85, 语义相似度: 0.90, 时序关联: 0.88, 路径权重: 0.92 } },
  { id: 'e3',  sourceId: 'n3',  targetId: 'n6',  relationType: '隶属于', score: 0.88, evidence: 7,  dimensions: { 共现频率: 0.80, 语义相似度: 0.85, 时序关联: 0.90, 路径权重: 0.86 } },
  { id: 'e4',  sourceId: 'n1',  targetId: 'n10', relationType: '研究',   score: 0.82, evidence: 15, dimensions: { 共现频率: 0.78, 语义相似度: 0.82, 时序关联: 0.80, 路径权重: 0.84 } },
  { id: 'e5',  sourceId: 'n2',  targetId: 'n7',  relationType: '研究',   score: 0.78, evidence: 10, dimensions: { 共现频率: 0.75, 语义相似度: 0.80, 时序关联: 0.76, 路径权重: 0.80 } },
  { id: 'e6',  sourceId: 'n3',  targetId: 'n9',  relationType: '研究',   score: 0.75, evidence: 8,  dimensions: { 共现频率: 0.72, 语义相似度: 0.76, 时序关联: 0.74, 路径权重: 0.76 } },
  { id: 'e7',  sourceId: 'n7',  targetId: 'n11', relationType: '应用于', score: 0.88, evidence: 20, dimensions: { 共现频率: 0.90, 语义相似度: 0.86, 时序关联: 0.85, 路径权重: 0.90 } },
  { id: 'e8',  sourceId: 'n8',  targetId: 'n12', relationType: '应用于', score: 0.85, evidence: 18, dimensions: { 共现频率: 0.82, 语义相似度: 0.88, 时序关联: 0.83, 路径权重: 0.86 } },
  { id: 'e9',  sourceId: 'n9',  targetId: 'n10', relationType: '应用于', score: 0.80, evidence: 14, dimensions: { 共现频率: 0.78, 语义相似度: 0.80, 时序关联: 0.82, 路径权重: 0.78 } },
  { id: 'e10', sourceId: 'n4',  targetId: 'n5',  relationType: '合作',   score: 0.72, evidence: 6,  dimensions: { 共现频率: 0.70, 语义相似度: 0.72, 时序关联: 0.68, 路径权重: 0.74 } },
  { id: 'e11', sourceId: 'n4',  targetId: 'n6',  relationType: '合作',   score: 0.68, evidence: 5,  dimensions: { 共现频率: 0.65, 语义相似度: 0.70, 时序关联: 0.66, 路径权重: 0.70 } },
  { id: 'e12', sourceId: 'n7',  targetId: 'n8',  relationType: '引用',   score: 0.92, evidence: 25, dimensions: { 共现频率: 0.94, 语义相似度: 0.90, 时序关联: 0.92, 路径权重: 0.94 } },
  { id: 'e13', sourceId: 'n8',  targetId: 'n11', relationType: '引用',   score: 0.87, evidence: 19, dimensions: { 共现频率: 0.88, 语义相似度: 0.86, 时序关联: 0.85, 路径权重: 0.88 } },
  { id: 'e14', sourceId: 'n10', targetId: 'n11', relationType: '引用',   score: 0.76, evidence: 11, dimensions: { 共现频率: 0.74, 语义相似度: 0.78, 时序关联: 0.75, 路径权重: 0.76 } },
  { id: 'e15', sourceId: 'n1',  targetId: 'n5',  relationType: '参与',   score: 0.65, evidence: 4,  dimensions: { 共现频率: 0.62, 语义相似度: 0.66, 时序关联: 0.64, 路径权重: 0.68 } },
  { id: 'e16', sourceId: 'n2',  targetId: 'n10', relationType: '研究',   score: 0.70, evidence: 9,  dimensions: { 共现频率: 0.68, 语义相似度: 0.72, 时序关联: 0.70, 路径权重: 0.70 } },
  { id: 'e17', sourceId: 'n3',  targetId: 'n12', relationType: '研究',   score: 0.60, evidence: 5,  dimensions: { 共现频率: 0.58, 语义相似度: 0.62, 时序关联: 0.60, 路径权重: 0.62 } },
  { id: 'e18', sourceId: 'n6',  targetId: 'n9',  relationType: '参与',   score: 0.55, evidence: 3,  dimensions: { 共现频率: 0.52, 语义相似度: 0.56, 时序关联: 0.54, 路径权重: 0.58 } },
];

// ─── Color helpers ────────────────────────────────────────────────────────────

const ENTITY_COLOR: Record<EntityType, string> = {
  人物: '#2563eb',
  组织: '#7c3aed',
  技术: '#0891b2',
  概念: '#d97706',
};

const ENTITY_BG: Record<EntityType, string> = {
  人物: 'bg-blue-100 text-blue-700',
  组织: 'bg-purple-100 text-purple-700',
  技术: 'bg-cyan-100 text-cyan-700',
  概念: 'bg-amber-100 text-amber-700',
};

const RELATION_COLOR: Record<RelationType, string> = {
  隶属于: '#6366f1',
  研究:   '#10b981',
  应用于: '#f59e0b',
  合作:   '#8b5cf6',
  引用:   '#ef4444',
  参与:   '#06b6d4',
};

const RELATION_BG: Record<RelationType, string> = {
  隶属于: 'bg-indigo-100 text-indigo-700',
  研究:   'bg-emerald-100 text-emerald-700',
  应用于: 'bg-amber-100 text-amber-700',
  合作:   'bg-violet-100 text-violet-700',
  引用:   'bg-red-100 text-red-700',
  参与:   'bg-cyan-100 text-cyan-700',
};

const ALL_RELATION_TYPES: RelationType[] = ['隶属于', '研究', '应用于', '合作', '引用', '参与'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RelationAnalysis() {
  const [search, setSearch] = useState('');
  const [activeRelTypes, setActiveRelTypes] = useState<Set<RelationType>>(new Set(ALL_RELATION_TYPES));
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodeMap = useMemo(() => Object.fromEntries(NODES.map(n => [n.id, n])), []);

  // Filter edges by active relation types
  const visibleEdges = useMemo(
    () => EDGES.filter(e => activeRelTypes.has(e.relationType)),
    [activeRelTypes],
  );

  // Edges that are highlighted (connected to selected node OR are the selected edge)
  const highlightedEdgeIds = useMemo(() => {
    if (selectedEdgeId) return new Set([selectedEdgeId]);
    if (selectedNodeId) {
      return new Set(visibleEdges.filter(e => e.sourceId === selectedNodeId || e.targetId === selectedNodeId).map(e => e.id));
    }
    return new Set<string>();
  }, [selectedEdgeId, selectedNodeId, visibleEdges]);

  const hasSelection = selectedEdgeId !== null || selectedNodeId !== null;

  // Left panel list: filtered by search + relation type, sorted by score desc
  const listEdges = useMemo(() => {
    let result = visibleEdges;
    if (search.trim()) {
      const q = search.trim();
      result = result.filter(e => {
        const src = nodeMap[e.sourceId]?.name ?? '';
        const tgt = nodeMap[e.targetId]?.name ?? '';
        return src.includes(q) || tgt.includes(q);
      });
    }
    return [...result].sort((a, b) => b.score - a.score).slice(0, 10);
  }, [visibleEdges, search, nodeMap]);

  const selectedEdge = selectedEdgeId ? EDGES.find(e => e.id === selectedEdgeId) ?? null : null;

  function toggleRelType(rt: RelationType) {
    setActiveRelTypes(prev => {
      const next = new Set(prev);
      if (next.has(rt)) { next.delete(rt); } else { next.add(rt); }
      return next;
    });
  }

  function handleNodeClick(nodeId: string) {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
    setSelectedEdgeId(null);
  }

  function handleEdgeClick(edgeId: string) {
    setSelectedEdgeId(prev => prev === edgeId ? null : edgeId);
    setSelectedNodeId(null);
  }

  // Stats
  const totalNodes = NODES.length;
  const totalEdges = EDGES.length;
  const avgScore = (EDGES.reduce((s, e) => s + e.score, 0) / EDGES.length).toFixed(2);
  const totalEvidence = EDGES.reduce((s, e) => s + e.evidence, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">关系分析</h1>
            <p className="text-sm text-gray-500">基于知识图谱的实体关系强度分析与可视化</p>
          </div>
        </div>
        <div className="flex gap-6">
          {[
            { label: '实体节点', value: totalNodes },
            { label: '关系边', value: totalEdges },
            { label: '平均置信度', value: avgScore },
            { label: '证据总数', value: totalEvidence },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">{stat.value}</span>
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Three-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT panel ── */}
        <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索实体..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Relation type filters */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">关系类型</span>
            </div>
            <div className="space-y-1.5">
              {ALL_RELATION_TYPES.map(rt => (
                <label key={rt} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeRelTypes.has(rt)}
                    onChange={() => toggleRelType(rt)}
                    className="w-3.5 h-3.5 rounded accent-blue-600"
                  />
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ backgroundColor: RELATION_COLOR[rt] + '20', color: RELATION_COLOR[rt] }}
                  >
                    {rt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Relation list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 pb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">关系列表（按分数）</span>
            </div>
            <div className="px-2 pb-2 space-y-1">
              {listEdges.map(edge => {
                const src = nodeMap[edge.sourceId];
                const tgt = nodeMap[edge.targetId];
                const isActive = selectedEdgeId === edge.id;
                return (
                  <button
                    key={edge.id}
                    onClick={() => handleEdgeClick(edge.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors ${
                      isActive
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1 text-xs text-gray-700 font-medium">
                      <span className="truncate max-w-[60px]">{src?.name}</span>
                      <ArrowRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate max-w-[60px]">{tgt?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: RELATION_COLOR[edge.relationType] + '20', color: RELATION_COLOR[edge.relationType] }}
                      >
                        {edge.relationType}
                      </span>
                      <span className="text-[10px] text-gray-400">{edge.evidence}条证据</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${edge.score * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-blue-600 w-7 text-right">
                        {edge.score.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
              {listEdges.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">暂无匹配关系</p>
              )}
            </div>
          </div>
        </div>

        {/* ── CENTER canvas ── */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" style={{ width: 700, height: 450 }}>
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">关系网络图</span>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {(['人物', '组织', '技术', '概念'] as EntityType[]).map(t => (
                  <span key={t} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ENTITY_COLOR[t] }} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative" style={{ width: 700, height: 406 }}>
              <svg width={700} height={406} className="absolute inset-0">
                {/* Edges */}
                {visibleEdges.map(edge => {
                  const src = nodeMap[edge.sourceId];
                  const tgt = nodeMap[edge.targetId];
                  if (!src || !tgt) return null;
                  const isHighlighted = highlightedEdgeIds.has(edge.id);
                  const dimmed = hasSelection && !isHighlighted;
                  return (
                    <line
                      key={edge.id}
                      x1={src.x} y1={src.y}
                      x2={tgt.x} y2={tgt.y}
                      stroke={RELATION_COLOR[edge.relationType]}
                      strokeWidth={edge.score * 4}
                      strokeOpacity={dimmed ? 0.15 : isHighlighted ? 1 : 0.55}
                      className="cursor-pointer transition-all"
                      onClick={() => handleEdgeClick(edge.id)}
                    />
                  );
                })}

                {/* Nodes */}
                {NODES.map(node => {
                  const connectedEdge = visibleEdges.some(e => e.sourceId === node.id || e.targetId === node.id);
                  const isSelected = selectedNodeId === node.id;
                  const dimmed = hasSelection && !isSelected && !highlightedEdgeIds.size && selectedNodeId !== null;
                  return (
                    <g
                      key={node.id}
                      onClick={() => handleNodeClick(node.id)}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <circle
                          cx={node.x} cy={node.y} r={28}
                          fill={ENTITY_COLOR[node.type]}
                          fillOpacity={0.15}
                        />
                      )}
                      <circle
                        cx={node.x} cy={node.y} r={20}
                        fill={ENTITY_COLOR[node.type]}
                        fillOpacity={dimmed ? 0.25 : 1}
                        stroke="white"
                        strokeWidth={2}
                      />
                      <text
                        x={node.x} y={node.y + 34}
                        textAnchor="middle"
                        fontSize={11}
                        fill={dimmed ? '#9ca3af' : '#374151'}
                        fontWeight={isSelected ? '600' : '400'}
                      >
                        {node.name}
                      </text>
                      <text
                        x={node.x} y={node.y + 5}
                        textAnchor="middle"
                        fontSize={10}
                        fill="white"
                        fontWeight="600"
                      >
                        {node.type[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* ── RIGHT panel ── */}
        <div className="w-70 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden" style={{ width: 280 }}>
          {selectedEdge ? (
            <RightDetail edge={selectedEdge} nodeMap={nodeMap} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">点击左侧列表或图中关系线查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Right Detail Sub-component ───────────────────────────────────────────────

function RightDetail({
  edge,
  nodeMap,
}: {
  edge: RelationEdge;
  nodeMap: Record<string, EntityNode>;
}) {
  const src = nodeMap[edge.sourceId];
  const tgt = nodeMap[edge.targetId];

  const dimLabels: (keyof RelationEdge['dimensions'])[] = ['共现频率', '语义相似度', '时序关联', '路径权重'];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ENTITY_BG[src.type]}`}>{src.type}</span>
          <span className="text-sm font-semibold text-gray-900">{src.name}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: RELATION_COLOR[edge.relationType] + '20', color: RELATION_COLOR[edge.relationType] }}
          >
            {edge.relationType}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ENTITY_BG[tgt.type]}`}>{tgt.type}</span>
          <span className="text-sm font-semibold text-gray-900">{tgt.name}</span>
        </div>
      </div>

      {/* Score */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">综合置信度</div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold text-blue-600">{edge.score.toFixed(2)}</span>
          <span className="text-sm text-gray-400 mb-1">/ 1.00</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
            style={{ width: `${edge.score * 100}%` }}
          />
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-3">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">评分维度</span>
        </div>
        <div className="space-y-2.5">
          {dimLabels.map(dim => {
            const val = edge.dimensions[dim];
            return (
              <div key={dim}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">{dim}</span>
                  <span className="text-xs font-semibold text-gray-700">{val.toFixed(2)}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${val * 100}%`,
                      backgroundColor: val >= 0.85 ? '#2563eb' : val >= 0.70 ? '#7c3aed' : '#d97706',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">支持证据</span>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">{edge.evidence} <span className="text-sm font-normal text-gray-400">条</span></div>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
            查看证据
          </button>
        </div>
      </div>

      {/* Export */}
      <div className="p-4 mt-auto">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">导出</div>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 text-gray-500" />
            导出关系表 CSV
          </button>
          <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 text-gray-500" />
            导出网络图
          </button>
        </div>
      </div>
    </div>
  );
}
