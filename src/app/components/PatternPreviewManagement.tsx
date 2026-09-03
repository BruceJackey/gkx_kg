import { useEffect, useMemo, useState } from 'react';
import {
  Bot, RefreshCw, Loader2, Search, X, SquareCheck, Check, ChevronDown, Layers, Pencil,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, CartesianGrid, ZAxis, ReferenceLine,
} from 'recharts';

export type PatternPreviewFocus = 'preview' | 'scoring' | 'viz' | 'review';

interface CandidatePattern {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  pattern: string;
  source: string;
  generatedAt: string;
  confidence: number;
  support: number;
  lift: number;
  coverage: number;
  category: string;
  example: string;
  manualScore?: number;
}

const INITIAL: CandidatePattern[] = [
  {
    id: 'CP001', status: 'pending',
    pattern: '公司[INSTANCE]宣布…',
    source: '上下文模式抽取引擎', generatedAt: '2026-08-02 14:23',
    confidence: 0.89, support: 0.34, lift: 2.61, coverage: 412,
    category: '组织-事件', example: '华为公司宣布推出新一代芯片',
  },
  {
    id: 'CP002', status: 'pending',
    pattern: '[INSTANCE]总部位于…',
    source: '上下文模式抽取引擎', generatedAt: '2026-08-02 14:23',
    confidence: 0.82, support: 0.21, lift: 3.10, coverage: 258,
    category: '组织-地点', example: '字节跳动总部位于北京',
  },
  {
    id: 'CP003', status: 'accepted',
    pattern: '[INSTANCE]就职于…',
    source: '句法槽位泛化', generatedAt: '2026-08-01 09:47',
    confidence: 0.91, support: 0.18, lift: 4.22, coverage: 187,
    category: '人物-组织', example: '张三就职于清华大学',
  },
  {
    id: 'CP004', status: 'pending',
    pattern: '…由[INSTANCE]研发',
    source: '上下文模式抽取引擎', generatedAt: '2026-08-02 15:01',
    confidence: 0.76, support: 0.29, lift: 1.88, coverage: 334,
    category: '产品-组织', example: '该芯片由华为研发',
  },
  {
    id: 'CP005', status: 'rejected',
    pattern: '[INSTANCE]表示将…',
    source: '词性模板挖掘', generatedAt: '2026-07-31 11:22',
    confidence: 0.61, support: 0.44, lift: 1.12, coverage: 531,
    category: '人物-表态', example: '李明表示将加大投入',
  },
  {
    id: 'CP006', status: 'pending',
    pattern: '[INSTANCE]应用于…领域',
    source: '频繁模式挖掘', generatedAt: '2026-08-03 08:15',
    confidence: 0.85, support: 0.12, lift: 5.67, coverage: 143,
    category: '技术-应用', example: '医学影像识别应用于肺癌筛查领域',
  },
];

type SortKey = 'confidence' | 'support' | 'lift' | 'coverage';

function effectiveScore(p: CandidatePattern) {
  return p.manualScore ?? p.confidence;
}

/**
 * 审计目录专用：模式预览与管理 / 自动化评分 / 评分可视化 / 人工审核与阈值
 * 交互参考规则管理「候选规则」页，改名为候选模式
 */
export default function PatternPreviewManagement({
  initialFocus = 'preview',
}: {
  initialFocus?: PatternPreviewFocus;
}) {
  const [patterns, setPatterns] = useState(INITIAL);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('confidence');
  const [sortAsc, setSortAsc] = useState(false);
  const [showDistChart, setShowDistChart] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState('2026-08-03 08:15');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.8);
  const [thresholdInputStr, setThresholdInputStr] = useState('80');
  const [focus, setFocus] = useState<PatternPreviewFocus>(initialFocus);

  useEffect(() => {
    setFocus(initialFocus);
    if (initialFocus === 'viz') setShowDistChart(true);
  }, [initialFocus]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const aboveThresholdPending = patterns.filter(
    (p) => p.status === 'pending' && effectiveScore(p) >= threshold,
  );

  const handleDecision = (id: string, decision: 'accepted' | 'rejected') => {
    setPatterns((prev) => prev.map((p) => (p.id === id ? { ...p, status: decision } : p)));
  };

  const handleBatchAdopt = () => {
    setPatterns((prev) =>
      prev.map((p) =>
        p.status === 'pending' && effectiveScore(p) >= threshold
          ? { ...p, status: 'accepted' }
          : p,
      ),
    );
  };

  const handleRegenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setLastGenerated(
        new Date()
          .toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          .replace(/\//g, '-'),
      );
    }, 1600);
  };

  const filteredSorted = useMemo(() => {
    return patterns
      .filter((p) => {
        const matchStatus = filter === 'all' || p.status === filter;
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          p.pattern.toLowerCase().includes(q) ||
          p.source.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.example.toLowerCase().includes(q);
        return matchStatus && matchSearch;
      })
      .sort((a, b) => {
        const av = sortKey === 'confidence' ? effectiveScore(a) : a[sortKey];
        const bv = sortKey === 'confidence' ? effectiveScore(b) : b[sortKey];
        const v = av - bv;
        return sortAsc ? v : -v;
      });
  }, [patterns, filter, search, sortKey, sortAsc]);

  const titleMap: Record<PatternPreviewFocus, string> = {
    preview: '模式预览与管理',
    scoring: '自动化评分算法',
    viz: '评分结果可视化',
    review: '人工审核与阈值设定',
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 px-1">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">{titleMap[focus]}</h1>
          <p className="text-sm text-gray-500">
            候选模式列表、自动评分、分布可视化与人工阈值审核（形态参考候选规则页）
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
        {(
          [
            ['preview', '模式预览与管理'],
            ['scoring', '自动化评分'],
            ['viz', '评分可视化'],
            ['review', '人工审核与阈值'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFocus(id)}
            className={`text-sm px-3 py-1.5 rounded-lg ${
              focus === id ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Bot className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-500">
            由上下文模式抽取引擎生成的候选模式，请评估置信度 / 支持度后决定是否用于下一步
          </span>
          <span className="ml-auto text-[11px] text-gray-400">上次生成：{lastGenerated}</span>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                生成中…
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                重新生成
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: '候选总数', value: patterns.length, color: 'text-blue-600' },
            { label: '待审核', value: patterns.filter((r) => r.status === 'pending').length, color: 'text-amber-600' },
            { label: '已采纳', value: patterns.filter((r) => r.status === 'accepted').length, color: 'text-green-600' },
            { label: '已拒绝', value: patterns.filter((r) => r.status === 'rejected').length, color: 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {(focus === 'scoring' || focus === 'preview') && (
          <div className="flex-shrink-0 bg-white border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800 leading-relaxed">
            <strong className="font-medium">自动化评分算法：</strong>
            基于置信度（模式与种子共现可靠度）、支持度（语料覆盖占比）、提升度与覆盖实例数，为每个候选模式计算质量分数；列表中的「置信度」列即自动评分结果，可在审核区人工微调。
          </div>
        )}

        {/* filters */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-1.5">
            {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => {
              const labels = { all: '全部', pending: '待审核', accepted: '已采纳', rejected: '已拒绝' };
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    filter === f
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索模式、来源、类别…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* threshold / review */}
        {(focus === 'review' || focus === 'preview' || focus === 'scoring') && (
          <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <SquareCheck className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">人工审核与阈值设定</span>
              <span className="text-xs text-gray-400">
                仅质量分高于阈值的模式可批量进入下一步；可在展开项中人工调整分数
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <span className="text-[11px] text-gray-400 w-6">0%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(threshold * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setThreshold(v);
                    setThresholdInputStr(String(Math.round(v * 100)));
                  }}
                  className="relative w-full h-1.5 rounded-full appearance-none accent-blue-600 cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2563eb ${threshold * 100}%, #e5e7eb ${threshold * 100}%)`,
                  }}
                />
                <span className="text-[11px] text-gray-400 w-8 text-right">100%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdInputStr}
                  onChange={(e) => {
                    setThresholdInputStr(e.target.value);
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n) && n >= 0 && n <= 100) setThreshold(n / 100);
                  }}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center font-semibold"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {aboveThresholdPending.length} 条待采纳
                </span>
                <button
                  type="button"
                  onClick={handleBatchAdopt}
                  disabled={aboveThresholdPending.length === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg"
                >
                  <Check className="w-3.5 h-3.5" />
                  批量采纳
                </button>
              </div>
            </div>
          </div>
        )}

        {/* viz */}
        {(focus === 'viz' || focus === 'preview' || focus === 'scoring') && (
          <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDistChart((v) => !v)}
              className="w-full flex items-center gap-2.5 px-5 py-3 hover:bg-gray-50 text-left"
            >
              <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800">评分结果可视化</span>
              <span className="text-xs text-gray-400">· 分数分布与置信度×提升度</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${showDistChart ? 'rotate-180' : ''}`}
              />
            </button>
            {showDistChart && (
              <div className="border-t border-gray-100 p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  const bins = [
                    { range: '< 60%', min: 0, max: 0.6, color: '#f87171' },
                    { range: '60–70%', min: 0.6, max: 0.7, color: '#fb923c' },
                    { range: '70–80%', min: 0.7, max: 0.8, color: '#facc15' },
                    { range: '80–90%', min: 0.8, max: 0.9, color: '#34d399' },
                    { range: '≥ 90%', min: 0.9, max: 1.01, color: '#10b981' },
                  ];
                  const histData = bins.map((b) => ({
                    range: b.range,
                    count: patterns.filter((r) => {
                      const s = effectiveScore(r);
                      return s >= b.min && s < b.max;
                    }).length,
                    color: b.color,
                  }));
                  const scatterData = patterns.map((r) => ({
                    x: Math.round(effectiveScore(r) * 100),
                    y: r.lift,
                    z: r.coverage,
                    status: r.status,
                  }));
                  const scatterColor = (status: string) =>
                    status === 'accepted' ? '#10b981' : status === 'rejected' ? '#9ca3af' : '#3b82f6';
                  return (
                    <>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-3">质量分区间分布</div>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={histData} barCategoryGap="28%" margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                            <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                            <ReTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v} 条`, '数量']} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {histData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-3">质量分 × 提升度</div>
                        <ResponsiveContainer width="100%" height={160}>
                          <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="x" type="number" domain={[55, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${v}%`} />
                            <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${v}x`} />
                            <ZAxis dataKey="z" range={[40, 200]} />
                            <ReferenceLine x={Math.round(threshold * 100)} stroke="#3b82f6" strokeDasharray="4 3" />
                            <ReTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Scatter
                              data={scatterData}
                              shape={(props: { cx?: number; cy?: number; payload?: { z?: number; status?: string } }) => {
                                const { cx = 0, cy = 0, payload } = props;
                                const r = Math.max(5, Math.min(14, (payload?.z ?? 100) / 50));
                                const fill = scatterColor(payload?.status ?? 'pending');
                                return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} />;
                              }}
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* sort */}
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <span className="text-[11px] text-gray-400 mr-1">排序：</span>
          {(
            [
              { key: 'confidence' as SortKey, label: '质量分' },
              { key: 'support' as SortKey, label: '支持度' },
              { key: 'lift' as SortKey, label: '提升度' },
              { key: 'coverage' as SortKey, label: '覆盖数' },
            ]
          ).map(({ key, label }) => {
            const active = sortKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSort(key)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border ${
                  active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {label}
                {active && <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span>}
              </button>
            );
          })}
          <span className="ml-auto text-[11px] text-gray-400">{filteredSorted.length} 条结果</span>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
          {filteredSorted.map((p) => {
            const score = effectiveScore(p);
            const isExpanded = expandedId === p.id;
            const statusCfg = {
              pending: { label: '待审核', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
              accepted: { label: '已采纳', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
              rejected: { label: '已拒绝', bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200' },
            }[p.status];
            const isAbove = p.status === 'pending' && score >= threshold;
            return (
              <div
                key={p.id}
                className={`bg-white border rounded-xl overflow-hidden ${p.status === 'rejected' ? 'opacity-60' : ''} ${
                  isAbove ? 'border-blue-400' : statusCfg.border
                }`}
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                      {isAbove && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-300">
                          高于阈值
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 bg-gray-50 border px-2 py-0.5 rounded-full">{p.category}</span>
                      <span className="text-[10px] text-gray-400">{p.source}</span>
                      <span className="text-[10px] text-gray-300 ml-auto">{p.generatedAt}</span>
                    </div>
                    <p className="text-sm font-mono text-gray-800">{p.pattern}</p>
                    <p className="text-xs text-gray-500 mt-1">例句：{p.example}</p>
                  </div>
                </div>

                <div className="px-5 pb-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-200">
                    质量分 {(score * 100).toFixed(0)}%
                    {p.manualScore != null ? '（人工）' : '（自动）'}
                  </span>
                  <span className="text-gray-500">支持度 {(p.support * 100).toFixed(0)}%</span>
                  <span className="text-gray-500">提升度 {p.lift.toFixed(2)}x</span>
                  <span className="text-gray-500">覆盖 {p.coverage}</span>
                  <div className="ml-auto flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      {isExpanded ? '收起' : '调整'}
                    </button>
                    {p.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecision(p.id, 'accepted')}
                          className="px-2.5 py-1 rounded-lg bg-green-600 text-white"
                        >
                          采纳
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(p.id, 'rejected')}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600"
                        >
                          拒绝
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-2">
                    <div className="text-xs text-gray-500">人工调整质量分（覆盖自动评分，用于阈值判定）</div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(score * 100)}
                        onChange={(e) => {
                          const v = Number(e.target.value) / 100;
                          setPatterns((prev) =>
                            prev.map((x) => (x.id === p.id ? { ...x, manualScore: v } : x)),
                          );
                        }}
                        className="flex-1 accent-blue-600"
                      />
                      <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                        {(score * 100).toFixed(0)}%
                      </span>
                      {p.manualScore != null && (
                        <button
                          type="button"
                          onClick={() =>
                            setPatterns((prev) =>
                              prev.map((x) => (x.id === p.id ? { ...x, manualScore: undefined } : x)),
                            )
                          }
                          className="text-xs text-gray-500 underline"
                        >
                          恢复自动分
                        </button>
                      )}
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
