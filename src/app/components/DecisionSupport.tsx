import { useState, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import {
  Brain, Target, Shield, Star, Check, X, ChevronDown, ChevronRight,
  Plus, Edit2, Trash2, ThumbsUp, ThumbsDown, AlertTriangle, MessageSquare,
  Sliders, GitMerge, Cpu, BookOpen, Network, ChevronUp, Send, Settings2,
  TrendingUp, BarChart3, ArrowRight, Layers,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'cluster' | 'orchestration' | 'scoring';

interface Rule { id: string; name: string; condition: string; priority: '高' | '中' | '低' }
interface Domain { id: string; name: string; rules: Rule[] }
interface ClusterPoint { x: number; y: number; name: string }
interface Cluster { id: string; name: string; color: string; points: ClusterPoint[] }
interface HistoryRecord { id: string; name: string; date: string; outcome: '成功' | '部分达成' | '待评估'; rating: number }

interface ModelNode {
  id: string;
  type: 'expert' | 'association' | 'ml';
  name: string;
  description: string;
  weight: number; // 0–100
  enabled: boolean;
  color: string;
  icon: 'book' | 'network' | 'cpu';
  subModels?: string[];
}

interface DecisionOption {
  id: string;
  title: string;
  description: string;
  cluster: string;
  modelScores: { expert: number; association: number; ml: number };
  compositeScore: number;
  // user feedback
  userRating: number;
  thumbsDown: boolean;
  comments: { id: string; author: string; text: string; time: string }[];
}

interface Recommendation {
  id: string; icon: 'brain' | 'target' | 'shield' | 'alert';
  title: string; description: string; confidence: number; status: 'pending' | 'adopted' | 'ignored';
}

// ─── Static data ──────────────────────────────────────────────────────────────

const initialDomains: Domain[] = [
  {
    id: 'ai', name: '人工智能领域',
    rules: [
      { id: 'ai-1', name: '高潜力技术识别规则', condition: 'IF 技术成熟度 > 0.8 AND 市场需求 > 0.6', priority: '高' },
      { id: 'ai-2', name: '研究方向优先级规则', condition: 'IF 引用频次 > 500 AND 近三年增长率 > 0.3', priority: '中' },
      { id: 'ai-3', name: '合作网络扩展规则', condition: 'IF 跨机构合作度 < 0.4 AND 领域影响力 > 0.7', priority: '低' },
    ],
  },
  {
    id: 'bio', name: '生物医学领域',
    rules: [
      { id: 'bio-1', name: '临床转化潜力规则', condition: 'IF 动物实验成功率 > 0.75 AND 安全性评分 > 0.8', priority: '高' },
      { id: 'bio-2', name: '药物靶点优选规则', condition: 'IF 靶点特异性 > 0.85 AND 毒副作用风险 < 0.2', priority: '中' },
    ],
  },
  {
    id: 'mat', name: '材料科学领域',
    rules: [
      { id: 'mat-1', name: '新材料研发优先规则', condition: 'IF 性能提升比 > 1.5 AND 制备成本 < 基准值*0.8', priority: '高' },
      { id: 'mat-2', name: '应用场景匹配规则', condition: 'IF 环境适应性 > 0.7 AND 规模化可行性 > 0.6', priority: '中' },
    ],
  },
];

const clusters: Cluster[] = [
  {
    id: 'high', name: '高潜力技术群', color: '#2563eb',
    points: [
      { x: 0.82, y: 0.91, name: '深度学习' }, { x: 0.78, y: 0.85, name: '大模型' },
      { x: 0.85, y: 0.88, name: '强化学习' }, { x: 0.80, y: 0.92, name: '多模态AI' },
      { x: 0.76, y: 0.80, name: '图神经网络' }, { x: 0.88, y: 0.87, name: '扩散模型' },
    ],
  },
  {
    id: 'mature', name: '成熟应用技术群', color: '#16a34a',
    points: [
      { x: 0.92, y: 0.58, name: '图像识别' }, { x: 0.95, y: 0.62, name: '语音识别' },
      { x: 0.90, y: 0.55, name: '推荐系统' }, { x: 0.88, y: 0.60, name: 'OCR识别' },
    ],
  },
  {
    id: 'explore', name: '探索性研究群', color: '#d97706',
    points: [
      { x: 0.35, y: 0.72, name: '量子计算' }, { x: 0.28, y: 0.68, name: '脑机接口' },
      { x: 0.42, y: 0.78, name: '具身智能' }, { x: 0.31, y: 0.80, name: '类脑计算' },
    ],
  },
];

const recommendationsByCluster: Record<string, Recommendation[]> = {
  high: [
    { id: 'r1', icon: 'brain', title: '加大大模型研发投入', description: '当前大模型技术处于高速发展阶段，建议优先配置研究资源，把握技术窗口期。', confidence: 0.92, status: 'pending' },
    { id: 'r2', icon: 'target', title: '布局多模态技术生态', description: '多模态AI具备跨领域应用潜力，建议构建联合研究团队推进落地。', confidence: 0.87, status: 'pending' },
    { id: 'r3', icon: 'shield', title: '建立AI安全评测体系', description: '高潜力技术群落地需配套安全评测机制，降低应用风险。', confidence: 0.80, status: 'pending' },
    { id: 'r4', icon: 'alert', title: '关注算力基础设施建设', description: '大规模模型训练对算力依赖极高，建议同步推进专用芯片研发合作。', confidence: 0.74, status: 'pending' },
  ],
  mature: [
    { id: 'r5', icon: 'target', title: '深化图像识别行业应用', description: '图像识别已达商用成熟度，建议聚焦医疗、工业等垂直领域深度定制。', confidence: 0.95, status: 'pending' },
    { id: 'r6', icon: 'brain', title: '语音技术融合创新', description: '与自然语言处理深度融合，构建端到端语音交互解决方案。', confidence: 0.88, status: 'pending' },
    { id: 'r7', icon: 'shield', title: '推荐系统隐私合规升级', description: '在数据隐私法规趋严背景下，建议引入差分隐私与联邦推荐技术。', confidence: 0.82, status: 'pending' },
  ],
  explore: [
    { id: 'r8', icon: 'brain', title: '量子计算前沿跟踪', description: '量子计算尚处早期阶段，建议以跟踪研究为主，积累核心专利布局。', confidence: 0.65, status: 'pending' },
    { id: 'r9', icon: 'alert', title: '脑机接口伦理框架制定', description: '探索性技术需同步构建伦理与监管框架，为后续产业化奠定基础。', confidence: 0.60, status: 'pending' },
    { id: 'r10', icon: 'target', title: '具身智能场景验证', description: '建议在受控环境下启动具身智能小规模应用验证，积累实战数据。', confidence: 0.70, status: 'pending' },
  ],
};

const radarDataByCluster: Record<string, { subject: string; prediction: number; feedback: number }[]> = {
  high: [
    { subject: '可行性', prediction: 88, feedback: 82 }, { subject: '风险性', prediction: 35, feedback: 42 },
    { subject: '创新性', prediction: 95, feedback: 90 }, { subject: '时效性', prediction: 85, feedback: 80 },
    { subject: '资源需求', prediction: 72, feedback: 68 },
  ],
  mature: [
    { subject: '可行性', prediction: 95, feedback: 93 }, { subject: '风险性', prediction: 20, feedback: 18 },
    { subject: '创新性', prediction: 55, feedback: 50 }, { subject: '时效性', prediction: 90, feedback: 88 },
    { subject: '资源需求', prediction: 60, feedback: 65 },
  ],
  explore: [
    { subject: '可行性', prediction: 45, feedback: 40 }, { subject: '风险性', prediction: 75, feedback: 80 },
    { subject: '创新性', prediction: 98, feedback: 92 }, { subject: '时效性', prediction: 35, feedback: 30 },
    { subject: '资源需求', prediction: 85, feedback: 88 },
  ],
};

const historyRecords: HistoryRecord[] = [
  { id: 'h1', name: '大模型研发路线决策', date: '2024-05-10', outcome: '成功', rating: 5 },
  { id: 'h2', name: '图像识别产品化方案', date: '2024-04-22', outcome: '成功', rating: 4 },
  { id: 'h3', name: '量子计算合作立项', date: '2024-03-15', outcome: '部分达成', rating: 3 },
  { id: 'h4', name: '联邦学习隐私方案', date: '2024-02-28', outcome: '成功', rating: 5 },
  { id: 'h5', name: '脑机接口预研立项', date: '2024-01-20', outcome: '待评估', rating: 0 },
];

const INITIAL_MODEL_NODES: ModelNode[] = [
  {
    id: 'expert', type: 'expert', name: '专家规则引擎', icon: 'book',
    description: '基于领域专家知识库的规则推理，包含优先级规则与条件分支',
    weight: 40, enabled: true, color: '#2563eb',
    subModels: ['高潜力技术识别规则', '研究方向优先级规则', '合作网络扩展规则'],
  },
  {
    id: 'association', type: 'association', name: '关联分析模型', icon: 'network',
    description: '图谱关联路径分析，挖掘实体间隐含关联强度与影响传播路径',
    weight: 35, enabled: true, color: '#7c3aed',
    subModels: ['图谱关联路径分析', '实体影响力扩散', '跨域关联发现'],
  },
  {
    id: 'ml', type: 'ml', name: '机器学习模型', icon: 'cpu',
    description: '融合 XGBoost 与神经网络的集成预测模型，支持多维特征输入',
    weight: 25, enabled: true, color: '#059669',
    subModels: ['XGBoost 梯度提升', '多层感知机 MLP', '集成投票策略'],
  },
];

const INITIAL_DECISIONS: DecisionOption[] = [
  {
    id: 'd1', title: '加大大模型研发投入', cluster: '高潜力技术群',
    description: '当前大模型技术处于高速发展阶段，建议优先配置研究资源，把握技术窗口期。',
    modelScores: { expert: 92, association: 88, ml: 90 },
    compositeScore: 90.4, userRating: 0, thumbsDown: false, comments: [],
  },
  {
    id: 'd2', title: '布局多模态技术生态', cluster: '高潜力技术群',
    description: '多模态AI具备跨领域应用潜力，建议构建联合研究团队推进落地。',
    modelScores: { expert: 87, association: 91, ml: 84 },
    compositeScore: 87.8, userRating: 4, thumbsDown: false,
    comments: [
      { id: 'c1', author: '张伟', text: '多模态赛道竞争已十分激烈，建议先聚焦垂直场景差异化布局。', time: '2026-07-28 14:23' },
    ],
  },
  {
    id: 'd3', title: '建立AI安全评测体系', cluster: '高潜力技术群',
    description: '高潜力技术群落地需配套安全评测机制，降低应用风险。',
    modelScores: { expert: 80, association: 76, ml: 79 },
    compositeScore: 78.7, userRating: 5, thumbsDown: false, comments: [],
  },
  {
    id: 'd4', title: '深化图像识别行业应用', cluster: '成熟应用技术群',
    description: '图像识别已达商用成熟度，建议聚焦医疗、工业等垂直领域深度定制。',
    modelScores: { expert: 95, association: 82, ml: 93 },
    compositeScore: 90.0, userRating: 0, thumbsDown: false, comments: [],
  },
  {
    id: 'd5', title: '推荐系统隐私合规升级', cluster: '成熟应用技术群',
    description: '在数据隐私法规趋严背景下，建议引入差分隐私与联邦推荐技术。',
    modelScores: { expert: 82, association: 79, ml: 85 },
    compositeScore: 82.0, userRating: 3, thumbsDown: false,
    comments: [
      { id: 'c2', author: '李敏', text: '合规成本高，建议评估是否有轻量化方案可替代。', time: '2026-07-29 09:11' },
      { id: 'c3', author: '王芳', text: '同意，差分隐私在精度损耗方面需要重点验证。', time: '2026-07-29 10:45' },
    ],
  },
  {
    id: 'd6', title: '量子计算前沿跟踪', cluster: '探索性研究群',
    description: '量子计算尚处早期阶段，建议以跟踪研究为主，积累核心专利布局。',
    modelScores: { expert: 65, association: 70, ml: 62 },
    compositeScore: 65.8, userRating: 0, thumbsDown: true,
    comments: [
      { id: 'c4', author: '赵磊', text: '目前量子计算离工程化落地还远，投入时机尚早。', time: '2026-07-30 16:02' },
    ],
  },
  {
    id: 'd7', title: '具身智能场景验证', cluster: '探索性研究群',
    description: '建议在受控环境下启动具身智能小规模应用验证，积累实战数据。',
    modelScores: { expert: 70, association: 74, ml: 68 },
    compositeScore: 70.9, userRating: 2, thumbsDown: false, comments: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeComposite(scores: { expert: number; association: number; ml: number }, nodes: ModelNode[]) {
  const total = nodes.filter(n => n.enabled).reduce((s, n) => s + n.weight, 0) || 1;
  const w = { expert: 0, association: 0, ml: 0 };
  nodes.forEach(n => { if (n.enabled) (w as any)[n.id] = n.weight / total; });
  return Math.round((scores.expert * w.expert + scores.association * w.association + scores.ml * w.ml) * 10) / 10;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono text-gray-600 w-7 text-right">{value}</span>
    </div>
  );
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s === value ? 0 : s)}
          className="transition-transform hover:scale-110">
          <Star size={14} className={(hover || value) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: '高' | '中' | '低' }) {
  const map = { 高: 'bg-red-100 text-red-700', 中: 'bg-yellow-100 text-yellow-700', 低: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[priority]}`}>{priority}优先</span>;
}

function OutcomeBadge({ outcome }: { outcome: HistoryRecord['outcome'] }) {
  const map: Record<string, string> = { 成功: 'bg-green-100 text-green-700', 部分达成: 'bg-yellow-100 text-yellow-700', 待评估: 'bg-gray-100 text-gray-500' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[outcome]}`}>{outcome}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={13} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}
    </div>
  );
}

function RecommendationIcon({ type }: { type: Recommendation['icon'] }) {
  const cls = 'shrink-0';
  if (type === 'brain') return <Brain size={18} className={`${cls} text-blue-500`} />;
  if (type === 'target') return <Target size={18} className={`${cls} text-green-500`} />;
  if (type === 'shield') return <Shield size={18} className={`${cls} text-purple-500`} />;
  return <AlertTriangle size={18} className={`${cls} text-amber-500`} />;
}

function CustomScatterDot(props: { cx?: number; cy?: number; color?: string }) {
  const { cx = 0, cy = 0, color = '#2563eb' } = props;
  return <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.8} stroke="#fff" strokeWidth={1.5} />;
}

// ─── Pipeline Canvas ──────────────────────────────────────────────────────────

function PipelineCanvas({ nodes, selectedNode, onSelectNode }: {
  nodes: ModelNode[];
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
}) {
  const nodeY: Record<string, number> = { expert: 80, association: 190, ml: 300 };
  const enabledNodes = nodes.filter(n => n.enabled);
  const total = enabledNodes.reduce((s, n) => s + n.weight, 0) || 1;

  const iconMap: Record<string, JSX.Element> = {
    book: <BookOpen size={14} className="text-white" />,
    network: <Network size={14} className="text-white" />,
    cpu: <Cpu size={14} className="text-white" />,
  };

  return (
    <svg width="100%" height="380" viewBox="0 0 620 380" className="select-none">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
        </marker>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Input node */}
      <rect x={20} y={170} width={110} height={52} rx={10} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1.5} filter="url(#shadow)" />
      <text x={75} y={191} textAnchor="middle" fontSize={10} fill="#64748b" fontWeight="600">图谱数据</text>
      <text x={75} y={207} textAnchor="middle" fontSize={9} fill="#94a3b8">知识图谱输入源</text>
      <rect x={72} y={212} width={6} height={6} rx={2} fill="#10b981" />

      {/* Lines from input to models */}
      {nodes.map(n => {
        const y = nodeY[n.id];
        const active = n.enabled;
        return (
          <line key={`in-${n.id}`}
            x1={130} y1={196} x2={188} y2={y + 26}
            stroke={active ? '#cbd5e1' : '#e2e8f0'} strokeWidth={active ? 1.5 : 1}
            strokeDasharray={active ? '0' : '4 3'}
            markerEnd="url(#arrow)" />
        );
      })}

      {/* Model nodes */}
      {nodes.map(n => {
        const y = nodeY[n.id];
        const isSelected = selectedNode === n.id;
        const pct = n.enabled ? Math.round((n.weight / total) * 100) : 0;
        return (
          <g key={n.id} onClick={() => onSelectNode(n.id)} style={{ cursor: 'pointer' }}>
            <rect x={190} y={y} width={160} height={52} rx={10}
              fill={n.enabled ? (isSelected ? n.color : '#fff') : '#f8fafc'}
              stroke={isSelected ? n.color : n.enabled ? '#e2e8f0' : '#e2e8f0'}
              strokeWidth={isSelected ? 2 : 1.5}
              filter="url(#shadow)"
              opacity={n.enabled ? 1 : 0.5} />
            {/* Icon bg */}
            <rect x={198} y={y + 10} width={26} height={26} rx={7}
              fill={n.enabled ? n.color : '#94a3b8'} opacity={isSelected ? 0.9 : 0.85} />
            <text x={211} y={y + 27} textAnchor="middle" fontSize={13}>{n.icon === 'book' ? '📖' : n.icon === 'network' ? '🕸' : '🤖'}</text>

            <text x={234} y={y + 19} fontSize={10} fill={isSelected ? '#fff' : '#1e293b'} fontWeight="600">{n.name}</text>
            <text x={234} y={y + 31} fontSize={8.5} fill={isSelected ? '#ffffffcc' : '#64748b'}>
              权重 {n.weight}% · 占比 {pct}%
            </text>
            {/* mini bar */}
            <rect x={234} y={y + 38} width={100} height={4} rx={2} fill={isSelected ? '#ffffff30' : '#f1f5f9'} />
            <rect x={234} y={y + 38} width={pct} height={4} rx={2} fill={isSelected ? '#fff' : n.color} opacity={0.7} />
            {!n.enabled && (
              <text x={350} y={y + 28} fontSize={9} fill="#94a3b8">已禁用</text>
            )}
          </g>
        );
      })}

      {/* Lines from models to aggregator */}
      {nodes.map(n => {
        const y = nodeY[n.id];
        const active = n.enabled;
        return (
          <line key={`out-${n.id}`}
            x1={350} y1={y + 26} x2={408} y2={196}
            stroke={active ? '#3b82f6' : '#e2e8f0'} strokeWidth={active ? 1.5 : 1}
            strokeDasharray={active ? '0' : '4 3'}
            markerEnd={active ? 'url(#arrow-active)' : 'url(#arrow)'} />
        );
      })}

      {/* Aggregator node */}
      <rect x={410} y={164} width={110} height={64} rx={10} fill="#1e40af" stroke="#1d4ed8" strokeWidth={1.5} filter="url(#shadow)" />
      <text x={465} y={186} textAnchor="middle" fontSize={10} fill="#bfdbfe" fontWeight="600">权重聚合器</text>
      <text x={465} y={200} textAnchor="middle" fontSize={8.5} fill="#93c5fd">加权求和</text>
      <text x={465} y={216} textAnchor="middle" fontSize={8} fill="#60a5fa">
        {enabledNodes.map(n => `${n.name.slice(0, 2)} ×${Math.round(n.weight / total * 100)}%`).join(' + ')}
      </text>

      {/* Line from aggregator to output */}
      <line x1={520} y1={196} x2={570} y2={196} stroke="#3b82f6" strokeWidth={2} markerEnd="url(#arrow-active)" />

      {/* Output node */}
      <rect x={572} y={166} width={46} height={60} rx={10} fill="#0f172a" stroke="#1e293b" strokeWidth={1.5} filter="url(#shadow)" />
      <text x={595} y={190} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight="600">综合</text>
      <text x={595} y={202} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight="600">评分</text>
      <text x={595} y={218} textAnchor="middle" fontSize={12} fill="#3b82f6" fontWeight="800">∑</text>

      {/* Labels */}
      <text x={75} y={245} textAnchor="middle" fontSize={8} fill="#94a3b8">输入源</text>
      <text x={270} y={355} textAnchor="middle" fontSize={8} fill="#94a3b8">决策模型层</text>
      <text x={465} y={245} textAnchor="middle" fontSize={8} fill="#94a3b8">聚合层</text>
      <text x={595} y={244} textAnchor="middle" fontSize={8} fill="#94a3b8">输出</text>
    </svg>
  );
}

// ─── Decision Card ────────────────────────────────────────────────────────────

function DecisionCard({
  decision, rank, nodes, onUpdate,
}: {
  decision: DecisionOption;
  rank: number;
  nodes: ModelNode[];
  onUpdate: (d: DecisionOption) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRating = (v: number) => onUpdate({ ...decision, userRating: v });
  const handleThumbsDown = () => onUpdate({ ...decision, thumbsDown: !decision.thumbsDown });
  const handleComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `c${Date.now()}`, author: '我', text: newComment.trim(),
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };
    onUpdate({ ...decision, comments: [...decision.comments, comment] });
    setNewComment('');
  };

  const scoreColor = decision.compositeScore >= 85 ? '#16a34a' : decision.compositeScore >= 70 ? '#2563eb' : '#d97706';
  const nodeMap: Record<string, ModelNode> = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${decision.thumbsDown ? 'opacity-60 border-gray-200' : decision.userRating >= 4 ? 'border-amber-200' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Rank */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-gray-100 text-gray-600' : rank === 3 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{decision.title}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{decision.cluster}</span>
            {decision.thumbsDown && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-100">已踩</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{decision.description}</p>

          {/* Model score breakdown */}
          <div className="mt-2 grid grid-cols-3 gap-2">
            {nodes.map(n => (
              <div key={n.id} className={`rounded-lg px-2 py-1.5 ${n.enabled ? 'bg-gray-50' : 'bg-gray-50 opacity-40'}`}>
                <div className="text-[10px] text-gray-400 mb-1 truncate">{n.name}</div>
                <ScoreBar value={(decision.modelScores as any)[n.id]} color={n.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Composite score */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>{decision.compositeScore}</div>
            <div className="text-xs text-gray-400">综合评分</div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleThumbsDown}
              className={`p-1.5 rounded-lg border transition-colors ${decision.thumbsDown ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}
              title="踩">
              <ThumbsDown size={13} />
            </button>
            <button onClick={() => { setShowComments(v => !v); setTimeout(() => inputRef.current?.focus(), 100); }}
              className={`p-1.5 rounded-lg border transition-colors relative ${showComments ? 'bg-blue-50 border-blue-200 text-blue-500' : 'border-gray-200 text-gray-400 hover:text-blue-400'}`}
              title="评论">
              <MessageSquare size={13} />
              {decision.comments.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center">{decision.comments.length}</span>
              )}
            </button>
          </div>

          {/* Star rating */}
          <StarInput value={decision.userRating} onChange={handleRating} />
          {decision.userRating > 0 && (
            <span className="text-[10px] text-amber-500">{['', '较差', '一般', '良好', '很好', '极好'][decision.userRating]}</span>
          )}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {decision.comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {decision.comments.map(c => (
                <div key={c.id} className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] text-blue-600 font-bold">{c.author.slice(0, 1)}</div>
                    <span className="text-xs font-medium text-gray-700">{c.author}</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{c.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input ref={inputRef} value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="添加评论…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" />
            <button onClick={handleComment}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors flex items-center gap-1">
              <Send size={11} />发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DecisionSupport() {
  const [activeTab, setActiveTab] = useState<TabId>('cluster');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['ai']));
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string>('high');
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation[]>>(recommendationsByCluster);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackOutcome, setFeedbackOutcome] = useState<HistoryRecord['outcome'] | null>(null);

  // Model orchestration state
  const [modelNodes, setModelNodes] = useState<ModelNode[]>(INITIAL_MODEL_NODES);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<DecisionOption[]>(INITIAL_DECISIONS);
  const [decisionFilter, setDecisionFilter] = useState<'all' | 'high' | 'mature' | 'explore'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'rating'>('score');

  const selectedModelNode = modelNodes.find(n => n.id === selectedNode);

  const handleWeightChange = (nodeId: string, weight: number) => {
    setModelNodes(prev => prev.map(n => n.id === nodeId ? { ...n, weight } : n));
  };

  const handleToggleNode = (nodeId: string) => {
    setModelNodes(prev => prev.map(n => n.id === nodeId ? { ...n, enabled: !n.enabled } : n));
  };

  const recomputedDecisions = decisions.map(d => ({
    ...d,
    compositeScore: computeComposite(d.modelScores, modelNodes),
  }));

  const filteredDecisions = recomputedDecisions
    .filter(d => {
      if (decisionFilter === 'all') return true;
      if (decisionFilter === 'high') return d.cluster === '高潜力技术群';
      if (decisionFilter === 'mature') return d.cluster === '成熟应用技术群';
      if (decisionFilter === 'explore') return d.cluster === '探索性研究群';
      return true;
    })
    .sort((a, b) => sortBy === 'score' ? b.compositeScore - a.compositeScore : b.userRating - a.userRating);

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleRecommendationAction = (clusterId: string, recId: string, action: 'adopted' | 'ignored') => {
    setRecommendations(prev => ({
      ...prev,
      [clusterId]: prev[clusterId].map(r => r.id === recId ? { ...r, status: r.status === action ? 'pending' : action } : r),
    }));
  };

  const currentRecs = recommendations[selectedCluster] ?? [];
  const currentRadar = radarDataByCluster[selectedCluster] ?? [];
  const totalAdopted = Object.values(recommendations).flat().filter(r => r.status === 'adopted').length;
  const avgRating = (historyRecords.filter(h => h.rating > 0).reduce((s, h) => s + h.rating, 0) / historyRecords.filter(h => h.rating > 0).length).toFixed(1);

  const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
    { id: 'cluster', label: '聚类分析与建议', icon: <BarChart3 size={14} /> },
    { id: 'orchestration', label: '模型编排', icon: <GitMerge size={14} /> },
    { id: 'scoring', label: '综合决策评分', icon: <TrendingUp size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">决策支持</h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">
              基于规则、关联分析与机器学习的综合决策模型编排平台，支持多模型权重配置与决策评分
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '专家规则', value: initialDomains.reduce((s, d) => s + d.rules.length, 0), icon: <BookOpen size={15} className="text-blue-500" />, bg: 'bg-blue-50' },
              { label: '决策建议', value: Object.values(recommendationsByCluster).flat().length, icon: <Target size={15} className="text-purple-500" />, bg: 'bg-purple-50' },
              { label: '已采纳', value: totalAdopted, icon: <Check size={15} className="text-green-500" />, bg: 'bg-green-50' },
              { label: '平均评分', value: avgRating, icon: <Star size={15} className="text-amber-500 fill-amber-500" />, bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 w-[120px]">
                <div className={`${s.bg} p-1.5 rounded-lg shrink-0`}>{s.icon}</div>
                <div>
                  <div className="text-lg font-bold text-gray-900 leading-none">{s.value}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Cluster Analysis ── */}
      {activeTab === 'cluster' && (
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Left: rules */}
          <div className="bg-white border-r border-gray-200 flex flex-col overflow-y-auto" style={{ width: 240, minWidth: 240 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">专家规则策略</span>
              <button className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md transition-colors">
                <Plus size={12} />新建
              </button>
            </div>
            <div className="flex-1 py-2">
              {initialDomains.map(domain => {
                const expanded = expandedDomains.has(domain.id);
                return (
                  <div key={domain.id}>
                    <button onClick={() => toggleDomain(domain.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors text-left">
                      {expanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                      <span className="text-xs font-medium text-gray-700 flex-1">{domain.name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-1.5">{domain.rules.length}</span>
                    </button>
                    {expanded && (
                      <div className="ml-2">
                        {domain.rules.map(rule => {
                          const active = selectedRule === rule.id;
                          return (
                            <div key={rule.id} onClick={() => setSelectedRule(active ? null : rule.id)}
                              className={`group relative mx-2 mb-1 rounded-lg px-3 py-2 cursor-pointer transition-colors ${active ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                              <div className="flex items-start justify-between gap-1">
                                <span className={`text-xs font-medium leading-tight ${active ? 'text-blue-700' : 'text-gray-800'}`}>{rule.name}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button className="text-gray-400 hover:text-blue-500"><Edit2 size={11} /></button>
                                  <button className="text-gray-400 hover:text-red-500"><Trash2 size={11} /></button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 leading-tight line-clamp-2">{rule.condition}</p>
                              <div className="mt-1.5"><PriorityBadge priority={rule.priority} /></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="bg-white border-b border-gray-200" style={{ height: '42%', minHeight: 260 }}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">实体聚类分析</span>
                <div className="flex items-center gap-2">
                  {clusters.map(c => (
                    <button key={c.id} onClick={() => setSelectedCluster(c.id)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedCluster === c.id ? 'border-transparent text-white font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      style={selectedCluster === c.id ? { backgroundColor: c.color } : {}}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />{c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-2 pt-1" style={{ height: 'calc(100% - 48px)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" dataKey="x" domain={[0, 1]}
                      label={{ value: '技术成熟度', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#9ca3af' }}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis type="number" dataKey="y" domain={[0, 1]}
                      label={{ value: '应用潜力', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
                      tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0]?.payload as ClusterPoint;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
                            <div className="font-medium text-gray-800">{d?.name}</div>
                            <div className="text-gray-500 mt-0.5">成熟度: {d?.x} · 潜力: {d?.y}</div>
                          </div>
                        );
                      }} />
                    {clusters.map(c => (
                      <Scatter key={c.id} name={c.name} data={c.points} fill={c.color}
                        opacity={selectedCluster === c.id ? 1 : 0.25}
                        shape={(props: { cx?: number; cy?: number }) => <CustomScatterDot {...props} color={c.color} />}
                        onClick={() => setSelectedCluster(c.id)} style={{ cursor: 'pointer' }} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-800">决策建议</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: clusters.find(c => c.id === selectedCluster)?.color }}>
                  {clusters.find(c => c.id === selectedCluster)?.name}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {currentRecs.map(rec => (
                  <div key={rec.id}
                    className={`bg-white rounded-xl border px-4 py-3 transition-all ${rec.status === 'adopted' ? 'border-green-200' : rec.status === 'ignored' ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><RecommendationIcon type={rec.icon} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{rec.title}</span>
                          {rec.status === 'adopted' && (
                            <span className="flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full"><Check size={10} />已采纳</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{rec.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400 shrink-0">置信度</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${rec.confidence * 100}%`, backgroundColor: rec.confidence >= 0.85 ? '#16a34a' : rec.confidence >= 0.7 ? '#2563eb' : '#d97706' }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 shrink-0">{Math.round(rec.confidence * 100)}%</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => handleRecommendationAction(selectedCluster, rec.id, 'adopted')}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${rec.status === 'adopted' ? 'bg-green-500 text-white border-green-500' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                          采纳
                        </button>
                        <button onClick={() => handleRecommendationAction(selectedCluster, rec.id, 'ignored')}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${rec.status === 'ignored' ? 'bg-gray-400 text-white border-gray-400' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                          忽略
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: radar + history */}
          <div className="bg-white border-l border-gray-200 flex flex-col overflow-y-auto" style={{ width: 280, minWidth: 280 }}>
            <div className="border-b border-gray-100">
              <div className="px-4 py-3 border-b border-gray-50">
                <span className="text-sm font-semibold text-gray-800">当前决策评估</span>
              </div>
              <div className="px-2 py-2" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={currentRadar} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Radar name="预测值" dataKey="prediction" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="实际反馈" dataKey="feedback" stroke="#16a34a" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                    <Tooltip content={({ payload, label }) => {
                      if (!payload?.length) return null;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs">
                          <div className="font-medium text-gray-700 mb-1">{label}</div>
                          {payload.map(p => (
                            <div key={p.name} className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.stroke as string }} />
                              <span className="text-gray-600">{p.name}:</span>
                              <span className="font-medium">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 pb-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-blue-600 rounded" /><span>预测值</span></div>
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-green-600 rounded" /><span>实际反馈</span></div>
              </div>
            </div>
            <div className="flex-1 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800 block mb-3">历史反馈记录</span>
              <div className="space-y-2.5">
                {historyRecords.map(h => (
                  <div key={h.id} className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800 leading-tight flex-1">{h.name}</span>
                      <OutcomeBadge outcome={h.outcome} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-400">{h.date}</span>
                      {h.rating > 0 ? <StarRating rating={h.rating} /> : <span className="text-xs text-gray-400">暂无评分</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-4 border-t border-gray-100">
              <button onClick={() => setShowFeedbackModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                <ThumbsUp size={15} />提交反馈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Model Orchestration ── */}
      {activeTab === 'orchestration' && (
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Left: model palette */}
          <div className="bg-white border-r border-gray-200 flex flex-col overflow-y-auto" style={{ width: 260, minWidth: 260 }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Layers size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">模型节点配置</span>
            </div>
            <div className="flex-1 p-3 space-y-3">
              {modelNodes.map(n => {
                const isSelected = selectedNode === n.id;
                const total = modelNodes.filter(m => m.enabled).reduce((s, m) => s + m.weight, 0) || 1;
                const pct = n.enabled ? Math.round((n.weight / total) * 100) : 0;
                return (
                  <div key={n.id} onClick={() => setSelectedNode(isSelected ? null : n.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-all ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'} ${!n.enabled ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: n.color + '20', color: n.color }}>
                        {n.icon === 'book' ? '📖' : n.icon === 'network' ? '🕸' : '🤖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900">{n.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {n.enabled ? `权重 ${n.weight}% · 占比 ${pct}%` : '已禁用'}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleToggleNode(n.id); }}
                        className={`w-8 h-4 rounded-full transition-colors shrink-0 ${n.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${n.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{n.description}</p>
                    {n.enabled && (
                      <div className="mt-2">
                        <input type="range" min={5} max={80} value={n.weight}
                          onChange={e => { e.stopPropagation(); handleWeightChange(n.id, Number(e.target.value)); }}
                          className="w-full h-1.5 rounded-full accent-blue-600" onClick={e => e.stopPropagation()} />
                        <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                          <span>5%</span><span className="font-medium" style={{ color: n.color }}>{n.weight}%</span><span>80%</span>
                        </div>
                      </div>
                    )}
                    {n.subModels && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {n.subModels.map(sm => (
                          <span key={sm} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{sm}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Weight summary */}
            <div className="border-t border-gray-100 p-4">
              <div className="text-xs font-medium text-gray-700 mb-2">权重分配</div>
              {(() => {
                const total = modelNodes.filter(n => n.enabled).reduce((s, n) => s + n.weight, 0) || 1;
                return modelNodes.filter(n => n.enabled).map(n => (
                  <div key={n.id} className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
                    <span className="text-[10px] text-gray-600 flex-1 truncate">{n.name}</span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(n.weight / total * 100)}%`, backgroundColor: n.color }} />
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{Math.round(n.weight / total * 100)}%</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Center: canvas */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-800">多模型流程编排画布</span>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-blue-500 rounded" /><span>激活通道</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-gray-300 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#d1d5db 0,#d1d5db 3px,transparent 3px,transparent 6px)' }} /><span>禁用通道</span></div>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <PipelineCanvas nodes={modelNodes} selectedNode={selectedNode} onSelectNode={id => setSelectedNode(selectedNode === id ? null : id)} />
              </div>

              {/* Selected node detail */}
              {selectedModelNode && (
                <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ backgroundColor: selectedModelNode.color + '20' }}>
                      {selectedModelNode.icon === 'book' ? '📖' : selectedModelNode.icon === 'network' ? '🕸' : '🤖'}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{selectedModelNode.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white ml-auto" style={{ backgroundColor: selectedModelNode.color }}>
                      权重 {selectedModelNode.weight}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">子模型数</div>
                      <div className="text-lg font-bold text-gray-800">{selectedModelNode.subModels?.length ?? 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">输出占比</div>
                      <div className="text-lg font-bold" style={{ color: selectedModelNode.color }}>
                        {Math.round(selectedModelNode.weight / (modelNodes.filter(n => n.enabled).reduce((s, n) => s + n.weight, 0) || 1) * 100)}%
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">状态</div>
                      <div className={`text-sm font-semibold ${selectedModelNode.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedModelNode.enabled ? '运行中' : '已禁用'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Jump to scoring */}
              <div className="mt-4 flex justify-end">
                <button onClick={() => setActiveTab('scoring')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  查看综合决策评分 <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Decision Scoring ── */}
      {activeTab === 'scoring' && (
        <div className="flex-1 overflow-y-auto">
          {/* Subheader */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
            <span className="text-sm font-medium text-gray-700">决策选项</span>
            <div className="flex gap-1">
              {([['all', '全部'], ['high', '高潜力'], ['mature', '成熟应用'], ['explore', '探索性']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setDecisionFilter(v)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${decisionFilter === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500">排序：</span>
              <button onClick={() => setSortBy('score')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${sortBy === 'score' ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
                综合评分
              </button>
              <button onClick={() => setSortBy('rating')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${sortBy === 'rating' ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-gray-200 text-gray-500'}`}>
                用户评分
              </button>
            </div>

            {/* Model weights summary */}
            <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
              <Settings2 size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">当前权重：</span>
              {(() => {
                const total = modelNodes.filter(n => n.enabled).reduce((s, n) => s + n.weight, 0) || 1;
                return modelNodes.filter(n => n.enabled).map(n => (
                  <span key={n.id} className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: n.color + '18', color: n.color }}>
                    {n.name.slice(0, 2)} {Math.round(n.weight / total * 100)}%
                  </span>
                ));
              })()}
              <button onClick={() => setActiveTab('orchestration')} className="text-xs text-blue-600 hover:underline">调整</button>
            </div>
          </div>

          <div className="p-6 space-y-3 max-w-4xl mx-auto">
            {filteredDecisions.map((d, i) => (
              <DecisionCard key={d.id} decision={d} rank={i + 1} nodes={modelNodes}
                onUpdate={updated => setDecisions(prev => prev.map(x => x.id === updated.id ? updated : x))} />
            ))}
          </div>
        </div>
      )}

      {/* ── Feedback Modal ── */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <span className="text-base font-semibold text-gray-900">提交决策反馈</span>
              <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">决策名称</label>
                <input type="text" placeholder="请输入决策名称"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">反馈内容</label>
                <textarea rows={3} value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  placeholder="请描述决策执行结果与改进建议..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">效果评分</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setFeedbackRating(s)} className="transition-transform hover:scale-110">
                      <Star size={24} className={s <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">执行结果</label>
                <div className="flex gap-2">
                  {(['成功', '部分达成', '待评估'] as const).map(o => (
                    <button key={o} onClick={() => setFeedbackOutcome(o)}
                      className={`flex-1 text-xs border rounded-lg py-2 transition-colors ${feedbackOutcome === o ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setShowFeedbackModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={() => setShowFeedbackModal(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                提交反馈
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
