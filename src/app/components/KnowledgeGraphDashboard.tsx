import { useState } from 'react';
import { Network, TrendingUp, Activity, Zap, Settings2, ChevronRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ─── Static chart data ────────────────────────────────────────────────────────

const entityData = [
  { name: '人物', value: 12580, color: '#3b82f6' },
  { name: '机构', value: 8320,  color: '#8b5cf6' },
  { name: '地点', value: 5240,  color: '#10b981' },
  { name: '概念', value: 15680, color: '#f59e0b' },
  { name: '事件', value: 3420,  color: '#ef4444' },
];

const relationData = [
  { name: '工作于', value: 8500 },
  { name: '位于',   value: 6200 },
  { name: '研究',   value: 12300 },
  { name: '发表',   value: 9800 },
  { name: '合作',   value: 7600 },
  { name: '引用',   value: 15200 },
];

const growthData = [
  { month: '1月', entities: 45000, relations: 82000 },
  { month: '2月', entities: 52000, relations: 95000 },
  { month: '3月', entities: 58000, relations: 108000 },
  { month: '4月', entities: 65240, relations: 125400 },
];

// ─── Association strength data ────────────────────────────────────────────────

interface EntityPair {
  id: string;
  src: string; srcType: string;
  tgt: string; tgtType: string;
  score: number; // 0–100
  pathCount: number;
  avgPathWeight: number;
  dimensions: { name: string; value: number }[];
}

const PAIRS: EntityPair[] = [
  {
    id: 'p1', src: '深度学习', srcType: '概念', tgt: '神经网络', tgtType: '概念', score: 94,
    pathCount: 312, avgPathWeight: 0.91,
    dimensions: [
      { name: '共现频次', value: 96 }, { name: '路径强度', value: 93 },
      { name: '语义相似', value: 95 }, { name: '图结构', value: 91 },
    ],
  },
  {
    id: 'p2', src: '李彦宏', srcType: '人物', tgt: '百度', tgtType: '机构', score: 91,
    pathCount: 287, avgPathWeight: 0.88,
    dimensions: [
      { name: '共现频次', value: 98 }, { name: '路径强度', value: 89 },
      { name: '语义相似', value: 82 }, { name: '图结构', value: 94 },
    ],
  },
  {
    id: 'p3', src: '卷积神经网络', srcType: '概念', tgt: '图像识别', tgtType: '概念', score: 88,
    pathCount: 241, avgPathWeight: 0.85,
    dimensions: [
      { name: '共现频次', value: 92 }, { name: '路径强度', value: 87 },
      { name: '语义相似', value: 90 }, { name: '图结构', value: 82 },
    ],
  },
  {
    id: 'p4', src: '清华大学', srcType: '机构', tgt: '北京大学', tgtType: '机构', score: 72,
    pathCount: 158, avgPathWeight: 0.69,
    dimensions: [
      { name: '共现频次', value: 78 }, { name: '路径强度', value: 70 },
      { name: '语义相似', value: 75 }, { name: '图结构', value: 64 },
    ],
  },
  {
    id: 'p5', src: '强化学习', srcType: '概念', tgt: '自动驾驶', tgtType: '概念', score: 68,
    pathCount: 134, avgPathWeight: 0.64,
    dimensions: [
      { name: '共现频次', value: 72 }, { name: '路径强度', value: 65 },
      { name: '语义相似', value: 70 }, { name: '63图结构', value: 63 },
    ],
  },
  {
    id: 'p6', src: '量子计算', srcType: '概念', tgt: '密码学', tgtType: '概念', score: 55,
    pathCount: 89, avgPathWeight: 0.51,
    dimensions: [
      { name: '共现频次', value: 60 }, { name: '路径强度', value: 54 },
      { name: '语义相似', value: 58 }, { name: '图结构', value: 48 },
    ],
  },
  {
    id: 'p7', src: '气候变化', srcType: '概念', tgt: '碳中和', tgtType: '概念', score: 82,
    pathCount: 196, avgPathWeight: 0.79,
    dimensions: [
      { name: '共现频次', value: 88 }, { name: '路径强度', value: 80 },
      { name: '语义相似', value: 84 }, { name: '图结构', value: 76 },
    ],
  },
  {
    id: 'p8', src: '蛋白质折叠', srcType: '概念', tgt: '药物发现', tgtType: '概念', score: 44,
    pathCount: 62, avgPathWeight: 0.40,
    dimensions: [
      { name: '共现频次', value: 48 }, { name: '路径强度', value: 42 },
      { name: '语义相似', value: 46 }, { name: '图结构', value: 38 },
    ],
  },
];

// ─── SVG Arc Gauge ────────────────────────────────────────────────────────────

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function GaugeChart({ score, strongThreshold, mediumThreshold, size = 160 }: {
  score: number;
  strongThreshold: number;
  mediumThreshold: number;
  size?: number;
}) {
  const cx = size / 2, cy = size / 2 + 10;
  const r = size * 0.38;
  const trackR = r + 8;
  // gauge arc: -210° to 30° (240° sweep)
  const START = -210, SWEEP = 240;
  const scoreAngle = START + (score / 100) * SWEEP;

  const getColor = (s: number) =>
    s >= strongThreshold ? '#16a34a' : s >= mediumThreshold ? '#f59e0b' : '#ef4444';

  const color = getColor(score);

  // tick marks for thresholds
  const thresholdAngle = (v: number) => START + (v / 100) * SWEEP;
  const tickPos = (angle: number, rOuter: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + rOuter * Math.cos(rad), y: cy + rOuter * Math.sin(rad) };
  };

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      {/* Track */}
      <path d={arcPath(cx, cy, r, START, START + SWEEP)} fill="none" stroke="#f1f5f9" strokeWidth={14} strokeLinecap="round" />
      {/* Filled arc */}
      <path d={arcPath(cx, cy, r, START, scoreAngle)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
      {/* Strong threshold tick */}
      {(() => {
        const a = thresholdAngle(strongThreshold);
        const inner = tickPos(a, r - 9); const outer = tickPos(a, r + 9);
        return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#16a34a" strokeWidth={2} opacity={0.7} />;
      })()}
      {/* Medium threshold tick */}
      {(() => {
        const a = thresholdAngle(mediumThreshold);
        const inner = tickPos(a, r - 9); const outer = tickPos(a, r + 9);
        return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#f59e0b" strokeWidth={2} opacity={0.7} />;
      })()}
      {/* Score text */}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={size * 0.18} fontWeight="700" fill={color}>{score}</text>
      <text x={cx} y={cy + size * 0.14} textAnchor="middle" fontSize={size * 0.07} fill="#94a3b8">/ 100</text>
    </svg>
  );
}

// ─── Strength badge ───────────────────────────────────────────────────────────

function StrengthBadge({ score, strong, medium }: { score: number; strong: number; medium: number }) {
  if (score >= strong) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />强相关
    </span>
  );
  if (score >= medium) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />中等相关
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />弱相关
    </span>
  );
}

// ─── Percent bar ──────────────────────────────────────────────────────────────

function PercentBar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <div className="flex-1 bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function KnowledgeGraphDashboard() {
  const totalEntities = entityData.reduce((sum, item) => sum + item.value, 0);
  const totalRelations = relationData.reduce((sum, item) => sum + item.value, 0);

  // Association strength state
  const [strongThreshold, setStrongThreshold] = useState(80);
  const [mediumThreshold, setMediumThreshold] = useState(60);
  const [selectedPair, setSelectedPair] = useState<EntityPair>(PAIRS[0]);
  const [showThresholdEditor, setShowThresholdEditor] = useState(false);

  const getScoreColor = (s: number) =>
    s >= strongThreshold ? '#16a34a' : s >= mediumThreshold ? '#f59e0b' : '#ef4444';

  const strongCount  = PAIRS.filter(p => p.score >= strongThreshold).length;
  const mediumCount  = PAIRS.filter(p => p.score >= mediumThreshold && p.score < strongThreshold).length;
  const weakCount    = PAIRS.filter(p => p.score < mediumThreshold).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">知识图谱看板</h2>
        <p className="text-sm text-gray-600 mt-1">可视化展示知识图谱的规模、质量、增长趋势与实体关联强度</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总实体数', value: totalEntities.toLocaleString(), icon: Network, bg: 'bg-blue-100', ic: 'text-blue-600' },
          { label: '总关系数', value: totalRelations.toLocaleString(), icon: Zap, bg: 'bg-purple-100', ic: 'text-purple-600' },
          { label: '图谱密度', value: '1.92', icon: TrendingUp, bg: 'bg-green-100', ic: 'text-green-600' },
          { label: '本月新增', value: '+7,240', icon: Activity, bg: 'bg-orange-100', ic: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-6 h-6 ${s.ic}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Association Strength Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">实体关联强度分析</h3>
            <p className="text-xs text-gray-400 mt-0.5">基于共现频次、路径强度、语义相似度与图结构综合量化</p>
          </div>
          <button onClick={() => setShowThresholdEditor(v => !v)}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 border rounded-lg transition-colors ${showThresholdEditor ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Settings2 className="w-4 h-4" />阈值设置
          </button>
        </div>

        {/* Threshold editor */}
        {showThresholdEditor && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  强相关阈值：
                  <span className="text-green-600 font-bold ml-1">{strongThreshold}</span>
                </label>
                <input type="range" min={mediumThreshold + 5} max={99} value={strongThreshold}
                  onChange={e => setStrongThreshold(Number(e.target.value))}
                  className="w-full accent-green-600" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>↑ {mediumThreshold + 5}</span><span>99</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  中等相关阈值：
                  <span className="text-amber-600 font-bold ml-1">{mediumThreshold}</span>
                </label>
                <input type="range" min={20} max={strongThreshold - 5} value={mediumThreshold}
                  onChange={e => setMediumThreshold(Number(e.target.value))}
                  className="w-full accent-amber-500" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>20</span><span>↓ {strongThreshold - 5}</span>
                </div>
              </div>
              {/* Grade summary */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-600 mb-1">当前分布</div>
                {[
                  { label: '强相关', count: strongCount, color: 'bg-green-500', textColor: 'text-green-700' },
                  { label: '中等相关', count: mediumCount, color: 'bg-amber-400', textColor: 'text-amber-700' },
                  { label: '弱相关', count: weakCount, color: 'bg-red-400', textColor: 'text-red-600' },
                ].map(g => (
                  <div key={g.label} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${g.color}`} />
                    <span className="text-xs text-gray-600 flex-1">{g.label}</span>
                    <span className={`text-xs font-semibold ${g.textColor}`}>{g.count} 对</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Scale bar */}
            <div className="mt-4">
              <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b, #16a34a)' }}>
                {[{ pos: mediumThreshold, color: '#92400e' }, { pos: strongThreshold, color: '#14532d' }].map(m => (
                  <div key={m.pos} className="absolute top-0 bottom-0 w-0.5" style={{ left: `${m.pos}%`, backgroundColor: '#fff', opacity: 0.8 }} />
                ))}
              </div>
              <div className="relative mt-1 h-4">
                <span className="absolute text-[10px] text-gray-400 transform -translate-x-1/2" style={{ left: `${mediumThreshold}%` }}>{mediumThreshold}</span>
                <span className="absolute text-[10px] text-gray-400 transform -translate-x-1/2" style={{ left: `${strongThreshold}%` }}>{strongThreshold}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main content: gauge + list */}
        <div className="grid grid-cols-5 divide-x divide-gray-100">
          {/* Left: pair list */}
          <div className="col-span-3 divide-y divide-gray-100">
            {PAIRS.map(pair => {
              const color = getScoreColor(pair.score);
              const isSelected = selectedPair.id === pair.id;
              return (
                <div key={pair.id} onClick={() => setSelectedPair(pair)}
                  className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  {/* Entities */}
                  <div className="w-56 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-gray-900">{pair.src}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{pair.srcType}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                      <span className="font-medium text-gray-900">{pair.tgt}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{pair.tgtType}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{pair.pathCount} 条路径 · 平均权重 {pair.avgPathWeight}</div>
                  </div>

                  {/* Percent bar */}
                  <div className="flex-1 flex items-center gap-3">
                    <PercentBar value={pair.score} color={color} height={8} />
                    <span className="text-sm font-bold shrink-0 w-7 text-right" style={{ color }}>{pair.score}</span>
                  </div>

                  {/* Badge */}
                  <div className="shrink-0 w-24 text-right">
                    <StrengthBadge score={pair.score} strong={strongThreshold} medium={mediumThreshold} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: gauge detail */}
          <div className="col-span-2 p-6 flex flex-col gap-5">
            {/* Gauge */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">{selectedPair.src} ↔ {selectedPair.tgt}</div>
              <div className="flex justify-center">
                <GaugeChart score={selectedPair.score} strongThreshold={strongThreshold} mediumThreshold={mediumThreshold} size={180} />
              </div>
              <div className="flex justify-center mt-1">
                <StrengthBadge score={selectedPair.score} strong={strongThreshold} medium={mediumThreshold} />
              </div>
              <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-green-500" />{strongThreshold}</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-400" />{mediumThreshold}</span>
              </div>
            </div>

            {/* Dimension breakdown */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-3">维度拆分</div>
              <div className="space-y-2.5">
                {selectedPair.dimensions.map(d => {
                  const c = getScoreColor(d.value);
                  return (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{d.name}</span>
                        <span className="text-xs font-semibold" style={{ color: c }}>{d.value}</span>
                      </div>
                      <PercentBar value={d.value} color={c} height={6} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meta info */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs space-y-1.5 text-gray-500">
              <div className="flex justify-between"><span>路径数量</span><span className="font-medium text-gray-700">{selectedPair.pathCount}</span></div>
              <div className="flex justify-between"><span>平均路径权重</span><span className="font-medium text-gray-700">{selectedPair.avgPathWeight}</span></div>
              <div className="flex justify-between"><span>综合得分</span><span className="font-bold text-gray-900">{selectedPair.score} / 100</span></div>
            </div>

            {/* Grade legend */}
            <div className="border-t border-gray-100 pt-4 space-y-1.5">
              <div className="text-[10px] font-medium text-gray-400 mb-2">等级阈值说明</div>
              {[
                { label: '强相关', range: `≥ ${strongThreshold}`, color: 'bg-green-500', count: strongCount },
                { label: '中等相关', range: `${mediumThreshold} – ${strongThreshold - 1}`, color: 'bg-amber-400', count: mediumCount },
                { label: '弱相关', range: `< ${mediumThreshold}`, color: 'bg-red-400', count: weakCount },
              ].map(g => (
                <div key={g.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${g.color}`} />
                  <span className="flex-1 text-gray-700">{g.label}</span>
                  <span className="text-gray-400">{g.range}</span>
                  <span className="font-semibold text-gray-600 w-8 text-right">{g.count}对</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Original charts ── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">实体类型分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={entityData} cx="50%" cy="50%" labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={95} dataKey="value">
                {entityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {entityData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-700">{item.name}: {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">关系类型统计</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={relationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">增长趋势</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="entities" stroke="#3b82f6" strokeWidth={2} name="实体数量" />
            <Line type="monotone" dataKey="relations" stroke="#8b5cf6" strokeWidth={2} name="关系数量" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">图谱质量指标</h3>
          <div className="space-y-4">
            {[
              { label: '完整性', value: 92, color: 'bg-blue-600' },
              { label: '一致性', value: 88, color: 'bg-green-600' },
              { label: '准确性', value: 95, color: 'bg-purple-600' },
            ].map(q => (
              <div key={q.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{q.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{q.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${q.color} h-2 rounded-full`} style={{ width: `${q.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近更新</h3>
          <div className="space-y-3">
            {[
              { time: '2026-04-23 14:30', action: '新增实体', count: 125, type: 'entity' },
              { time: '2026-04-23 14:25', action: '新增关系', count: 280, type: 'relation' },
              { time: '2026-04-23 14:20', action: '更新实体属性', count: 45, type: 'update' },
              { time: '2026-04-23 14:15', action: '删除重复关系', count: 12, type: 'delete' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.type === 'entity' ? 'bg-blue-600' : item.type === 'relation' ? 'bg-purple-600' : item.type === 'update' ? 'bg-green-600' : 'bg-red-600'}`} />
                  <span className="text-sm text-gray-700">{item.action}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count} 条</span>
                </div>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
