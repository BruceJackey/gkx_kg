import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ChevronRight,
  Filter,
  GitBranch,
  Play,
  Route,
  Search,
  Calculator,
  ArrowUpDown,
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { RelationMeasureRankingFocus } from '../data/auditPageMap';
import {
  relationMeasureApi,
  RELATION_MEASURE_BASE,
  type ApiPath,
} from '../api/relationMeasureApi';

type AnalysisTab = RelationMeasureRankingFocus;

interface PathHop {
  from: string;
  relation: string;
  to: string;
}

interface DiscoveredPath {
  id: string;
  hops: PathHop[];
  length: number;
  score: number | null;
  modelScores: Record<string, number>;
}

function toUiPath(p: ApiPath): DiscoveredPath {
  return {
    id: p.path_id,
    length: p.length,
    hops: (p.hops ?? []).map((h) => ({
      from: h.from,
      relation: h.relation,
      to: h.to,
    })),
    score: p.score ?? null,
    modelScores: p.model_scores ?? {},
  };
}

function toApiPath(p: DiscoveredPath): ApiPath {
  return {
    path_id: p.id,
    length: p.length,
    hops: p.hops.map((h) => ({
      from: h.from,
      from_id: h.from,
      relation: h.relation,
      to: h.to,
      to_id: h.to,
    })),
    score: p.score,
    model_scores: p.modelScores,
  };
}

const ENTITIES = ['知识图谱', 'Transformer', 'BERT', '深度学习', '清华大学', '张明', '自然语言处理'];

const SCORING_MODELS = [
  { id: 'path_len', name: '路径长度衰减', desc: 'score = ∏(wᵢ) / length' },
  { id: 'rel_product', name: '关系权重乘积', desc: '各边权重连乘' },
  { id: 'reliability', name: '路径可靠性', desc: '证据支持度加权' },
];

const PIPELINE_STEPS = [
  { id: 'discover' as const, label: '多步路径发现', desc: '指定深度内全部路径', icon: Route },
  { id: 'score' as const, label: '路径评分批量计算', desc: '按模型批量打分', icon: Calculator },
  { id: 'filter' as const, label: '结果排序与筛选', desc: '评分 · 长度 · 包含/排除', icon: Filter },
  { id: 'export-table' as const, label: '导出为表格数据', desc: 'CSV · Excel', icon: FileSpreadsheet },
  { id: 'export-image' as const, label: '导出为可视化图片', desc: 'PNG · SVG', icon: ImageIcon },
];

const TABS: { id: AnalysisTab; label: string; desc: string; icon: typeof Route }[] = [
  {
    id: 'discover',
    label: '多步路径发现',
    desc: '提供高效的图算法，用于发现两个实体之间指定深度内的所有连接路径。',
    icon: Route,
  },
  {
    id: 'score',
    label: '路径评分批量计算',
    desc: '根据用户选定的评分模型，对所有发现的路径进行自动化的批量打分。',
    icon: Calculator,
  },
  {
    id: 'filter',
    label: '结果排序与筛选',
    desc: '支持用户根据综合评分、路径长度、包含/排除特定节点或关系等条件，对路径结果进行排序和筛选。',
    icon: Filter,
  },
  {
    id: 'export-table',
    label: '导出为表格数据',
    desc: '支持将发现的路径列表及其评分，以CSV或Excel格式导出。',
    icon: FileSpreadsheet,
  },
  {
    id: 'export-image',
    label: '导出为可视化图片',
    desc: '支持将当前的关系分析可视化网络图，导出为PNG或SVG图片格式。',
    icon: ImageIcon,
  },
];

function pathText(hops: PathHop[]) {
  return hops
    .map((h, i) => (i === 0 ? `${h.from} -[${h.relation}]-> ${h.to}` : `-[${h.relation}]-> ${h.to}`))
    .join(' ');
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function NetworkPreview({
  source,
  target,
  paths,
  svgRef,
}: {
  source: string;
  target: string;
  paths: DiscoveredPath[];
  svgRef: RefObject<SVGSVGElement | null>;
}) {
  const nodes = useMemo(() => {
    const set = new Set<string>([source, target]);
    paths.slice(0, 4).forEach((p) => p.hops.forEach((h) => { set.add(h.from); set.add(h.to); }));
    return Array.from(set);
  }, [source, target, paths]);

  const positions = useMemo(() => {
    const cx = 280;
    const cy = 140;
    const r = 100;
    const map: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      if (n === source) map[n] = { x: 70, y: cy };
      else if (n === target) map[n] = { x: 490, y: cy };
      else {
        const angle = (Math.PI * 0.25) + (i / Math.max(nodes.length, 1)) * Math.PI * 1.5;
        map[n] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.7 };
      }
    });
    return map;
  }, [nodes, source, target]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: { from: string; to: string; rel: string }[] = [];
    paths.slice(0, 4).forEach((p) => {
      p.hops.forEach((h) => {
        const key = `${h.from}|${h.relation}|${h.to}`;
        if (seen.has(key)) return;
        seen.add(key);
        list.push({ from: h.from, to: h.to, rel: h.relation });
      });
    });
    return list;
  }, [paths]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 560 280"
      className="w-full h-auto bg-slate-50 rounded-lg border border-gray-200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = positions[e.from];
        const b = positions[e.to];
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2 - 8;
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <text x={mx} y={my} textAnchor="middle" fontSize="9" fill="#64748b">{e.rel}</text>
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = positions[n];
        if (!p) return null;
        const isEndpoint = n === source || n === target;
        return (
          <g key={n}>
            <circle cx={p.x} cy={p.y} r={isEndpoint ? 22 : 18} fill={isEndpoint ? '#dbeafe' : '#fff'} stroke={isEndpoint ? '#3b82f6' : '#94a3b8'} strokeWidth="2" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight={isEndpoint ? 600 : 400}>
              {n.length > 6 ? `${n.slice(0, 5)}…` : n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PathChips({ hops }: { hops: PathHop[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {hops.map((h, i) => (
        <span key={`${h.from}-${i}`} className="inline-flex items-center gap-1">
          {i === 0 && (
            <span className="text-xs font-medium text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{h.from}</span>
          )}
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{h.relation}</span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-xs font-medium text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{h.to}</span>
        </span>
      ))}
    </div>
  );
}

export default function RelationMeasureRanking({
  initialFocus = 'discover',
}: {
  initialFocus?: RelationMeasureRankingFocus | null;
}) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>(initialFocus ?? 'discover');
  const [source, setSource] = useState('知识图谱');
  const [target, setTarget] = useState('Transformer');
  const [maxDepth, setMaxDepth] = useState(3);
  const [discovered, setDiscovered] = useState(false);
  const [paths, setPaths] = useState<DiscoveredPath[]>([]);
  const [selectedModel, setSelectedModel] = useState('path_len');
  const [scored, setScored] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [apiMsg, setApiMsg] = useState('');
  const [apiError, setApiError] = useState('');
  const [meta, setMeta] = useState<{ elapsedMs?: number; graphSource?: string; requestId?: string }>({});

  const [sortBy, setSortBy] = useState<'score' | 'length'>('score');
  const [minScore, setMinScore] = useState(0);
  const [maxLength, setMaxLength] = useState(4);
  const [includeNode, setIncludeNode] = useState('');
  const [excludeNode, setExcludeNode] = useState('');
  const [includeRel, setIncludeRel] = useState('');
  const [excludeRel, setExcludeRel] = useState('');

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (initialFocus) setActiveTab(initialFocus);
  }, [initialFocus]);

  const tabMeta = TABS.find((t) => t.id === activeTab)!;
  const parentLabel =
    activeTab === 'export-table' || activeTab === 'export-image'
      ? '关系度量与排序 · 关系分析结果导出'
      : '关系度量与排序';

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setApiError(msg);
      setApiMsg('');
    } else {
      setApiMsg(msg);
      setApiError('');
    }
    window.setTimeout(() => {
      setApiMsg('');
      setApiError('');
    }, 4000);
  };

  const runDiscover = async () => {
    setDiscovering(true);
    setApiError('');
    try {
      const data = await relationMeasureApi.discover({
        source_entity_name: source,
        target_entity_name: target,
        max_depth: maxDepth,
        directed: true,
        max_paths: 200,
      });
      setPaths((data.paths ?? []).map(toUiPath));
      setDiscovered(true);
      setScored(false);
      setMeta({
        elapsedMs: data.elapsed_ms,
        graphSource: data.graph_source,
        requestId: data.request_id,
      });
      flash(`发现 ${data.path_count} 条路径${data.truncated ? '（已截断）' : ''}`);
    } catch (e) {
      flash(e instanceof Error ? e.message : '路径发现失败', true);
    } finally {
      setDiscovering(false);
    }
  };

  const runBatchScore = async () => {
    if (!paths.length) {
      flash('请先发现路径', true);
      return;
    }
    setScoring(true);
    setApiError('');
    try {
      const data = await relationMeasureApi.score({
        scoring_model: selectedModel,
        paths: paths.map(toApiPath),
      });
      setPaths((data.paths ?? []).map(toUiPath));
      setScored(true);
      flash(`已用 ${data.scoring_model} 对 ${data.path_count} 条路径打分`);
    } catch (e) {
      flash(e instanceof Error ? e.message : '批量打分失败', true);
    } finally {
      setScoring(false);
    }
  };

  const filteredSorted = useMemo(() => {
    let list = [...paths];
    if (scored) {
      list = list.filter((p) => (p.score ?? 0) >= minScore);
    }
    list = list.filter((p) => p.length <= maxLength);
    if (includeNode.trim()) {
      const q = includeNode.trim();
      list = list.filter((p) => p.hops.some((h) => h.from.includes(q) || h.to.includes(q)));
    }
    if (excludeNode.trim()) {
      const q = excludeNode.trim();
      list = list.filter((p) => !p.hops.some((h) => h.from.includes(q) || h.to.includes(q)));
    }
    if (includeRel.trim()) {
      const q = includeRel.trim();
      list = list.filter((p) => p.hops.some((h) => h.relation.includes(q)));
    }
    if (excludeRel.trim()) {
      const q = excludeRel.trim();
      list = list.filter((p) => !p.hops.some((h) => h.relation.includes(q)));
    }
    list.sort((a, b) => {
      if (sortBy === 'length') return a.length - b.length;
      return (b.score ?? -1) - (a.score ?? -1);
    });
    return list;
  }, [paths, scored, minScore, maxLength, includeNode, excludeNode, includeRel, excludeRel, sortBy]);

  const exportRows = filteredSorted.length ? filteredSorted : paths;

  const exportCsv = async () => {
    if (!exportRows.length) {
      flash('没有可导出的路径，请先发现路径', true);
      return;
    }
    setExporting(true);
    try {
      const data = await relationMeasureApi.exportTable({
        format: 'csv',
        paths: exportRows.map(toApiPath),
        filename_prefix: `relation-paths-${source}-${target}`,
      });
      flash(`已导出 CSV（${data.row_count ?? exportRows.length} 条）`);
    } catch (e) {
      // 接口失败时本地兜底
      const header = 'path_id,length,score,path';
      const lines = exportRows.map((p) =>
        [p.id, p.length, p.score?.toFixed(4) ?? '', `"${pathText(p.hops).replace(/"/g, '""')}"`].join(','),
      );
      downloadBlob(`relation-paths-${source}-${target}.csv`, [header, ...lines].join('\n'), 'text/csv;charset=utf-8');
      flash(`接口不可用，已本地导出 CSV（${exportRows.length} 条）`);
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    if (!exportRows.length) {
      flash('没有可导出的路径，请先发现路径', true);
      return;
    }
    setExporting(true);
    try {
      await relationMeasureApi.exportTable({
        format: 'xlsx',
        paths: exportRows.map(toApiPath),
        filename_prefix: `relation-paths-${source}-${target}`,
      });
      flash(`已导出 Excel（${exportRows.length} 条）`);
    } catch {
      const header = 'path_id\tlength\tscore\tpath';
      const lines = exportRows.map((p) =>
        [p.id, p.length, p.score?.toFixed(4) ?? '', pathText(p.hops)].join('\t'),
      );
      downloadBlob(
        `relation-paths-${source}-${target}.xls`,
        `\ufeff${[header, ...lines].join('\n')}`,
        'application/vnd.ms-excel;charset=utf-8',
      );
      flash(`接口不可用，已本地导出 Excel（${exportRows.length} 条）`);
    } finally {
      setExporting(false);
    }
  };

  const exportSvg = async () => {
    if (!exportRows.length) {
      flash('没有可导出的路径', true);
      return;
    }
    setExporting(true);
    try {
      await relationMeasureApi.exportImage({
        format: 'svg',
        paths: exportRows.map(toApiPath),
        source_entity_name: source,
        target_entity_name: target,
      });
      flash('已导出 SVG 网络图');
    } catch {
      const el = svgRef.current;
      if (!el) {
        flash('SVG 导出失败', true);
        return;
      }
      const xml = new XMLSerializer().serializeToString(el);
      downloadBlob(`relation-network-${source}-${target}.svg`, xml, 'image/svg+xml;charset=utf-8');
      flash('接口不可用，已本地导出 SVG');
    } finally {
      setExporting(false);
    }
  };

  const exportPng = async () => {
    if (!exportRows.length) {
      flash('没有可导出的路径', true);
      return;
    }
    setExporting(true);
    try {
      await relationMeasureApi.exportImage({
        format: 'png',
        paths: exportRows.map(toApiPath),
        source_entity_name: source,
        target_entity_name: target,
        width: 1120,
        height: 560,
      });
      flash('已导出 PNG 网络图');
    } catch {
      const el = svgRef.current;
      if (!el) {
        flash('PNG 导出失败', true);
        return;
      }
      const xml = new XMLSerializer().serializeToString(el);
      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1120;
        canvas.height = 560;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `relation-network-${source}-${target}.png`;
          a.click();
          URL.revokeObjectURL(url);
          flash('接口不可用，已本地导出 PNG');
        }, 'image/png');
      };
      img.src = svgUrl;
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden p-8">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">{parentLabel}</div>
          <h1 className="text-xl font-semibold text-gray-900">{tabMeta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">{tabMeta.desc}</p>
          <p className="text-[11px] text-gray-400 mt-1 font-mono truncate">
            API {RELATION_MEASURE_BASE}
            {meta.requestId ? ` · ${meta.requestId}` : ''}
            {meta.elapsedMs != null ? ` · ${meta.elapsedMs}ms` : ''}
            {meta.graphSource ? ` · ${meta.graphSource}` : ''}
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页 · 真实接口
        </span>
      </div>

      <div className="flex items-center gap-0 bg-white border border-gray-200 rounded-xl px-4 py-3 flex-shrink-0 overflow-x-auto">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 min-w-[140px]">
            <button
              type="button"
              onClick={() => setActiveTab(step.id)}
              className={`flex items-center gap-3 text-left rounded-lg px-2 py-1.5 transition-colors ${
                activeTab === step.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activeTab === step.id ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <step.icon className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-sm font-medium ${activeTab === step.id ? 'text-blue-800' : 'text-gray-800'}`}>
                  {step.label}
                </div>
                <div className="text-xs text-gray-400">{step.desc}</div>
              </div>
            </button>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="flex-1 flex items-center justify-center px-1">
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      {apiMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {apiMsg}
        </div>
      )}
      {apiError && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
          {apiError}
        </div>
      )}

      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-h-0">
        <div className="flex border-b border-gray-100 flex-shrink-0 px-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* 多步路径发现 */}
          {activeTab === 'discover' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-500">源实体</span>
                  <input
                    list="rm-entities"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                    placeholder="实体名或可识别名称"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-500">目标实体</span>
                  <input
                    list="rm-entities"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                    placeholder="实体名或可识别名称"
                  />
                </label>
                <datalist id="rm-entities">
                  {ENTITIES.map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-500">最大深度（跳数）</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-600">{maxDepth} 跳以内</span>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => void runDiscover()}
                    disabled={discovering}
                    className="w-full flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {discovering ? '发现中…' : '发现路径'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '源 → 目标', value: `${source} → ${target}` },
                  { label: '深度上限', value: `${maxDepth} 跳` },
                  { label: '已发现路径', value: discovered ? `${paths.length} 条` : '—' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                    <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                    <div className="text-sm text-gray-900 font-medium truncate">{s.value}</div>
                  </div>
                ))}
              </div>

              {!discovered ? (
                <div className="text-center py-16 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  选择实体对与深度后，点击「发现路径」枚举连接路径
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {paths.map((p) => (
                    <div key={p.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-gray-400 font-mono">{p.id}</span>
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.length} 跳</span>
                      </div>
                      <PathChips hops={p.hops} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 路径评分批量计算 */}
          {activeTab === 'score' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="text-xs text-gray-500 mb-2">评分模型</div>
                  <div className="flex flex-col gap-2">
                    {SCORING_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModel(m.id)}
                        className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                          selectedModel === m.id
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-sm font-medium ${selectedModel === m.id ? 'text-blue-800' : 'text-gray-800'}`}>
                          {m.name}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-56 flex flex-col gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                    <div>待打分路径：{paths.length} 条</div>
                    <div>当前模型：{SCORING_MODELS.find((m) => m.id === selectedModel)?.name}</div>
                    <div>状态：{scored ? '已完成' : scoring ? '计算中…' : discovered ? '未打分' : '请先发现路径'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void runBatchScore()}
                    disabled={scoring || !paths.length}
                    className="flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {scoring ? '批量计算中…' : '批量打分'}
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {['路径', '长度', '综合得分'].map((h) => (
                        <th key={h} className="text-left px-3 py-2.5 text-gray-500 font-medium border-b border-gray-200">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!paths.length ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-gray-400">
                          暂无路径，请先在「多步路径发现」中调用接口
                        </td>
                      </tr>
                    ) : (
                      paths.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="px-3 py-3">
                          <PathChips hops={p.hops} />
                        </td>
                        <td className="px-3 py-3 text-gray-500">{p.length}</td>
                        <td className="px-3 py-3">
                          {p.score != null ? (
                            <span className="font-semibold text-blue-700">{p.score.toFixed(4)}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 结果排序与筛选 */}
          {activeTab === 'filter' && (
            <div className="flex flex-col gap-5">
              {!scored && (
                <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                  <span>建议先完成路径发现与批量打分，以便按综合评分排序筛选。</span>
                  <button
                    type="button"
                    onClick={() => void runBatchScore()}
                    disabled={!paths.length || scoring}
                    className="flex-shrink-0 text-amber-900 underline disabled:opacity-50"
                  >
                    一键打分
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" />排序
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'score' | 'length')}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-400"
                  >
                    <option value="score">综合评分 ↓</option>
                    <option value="length">路径长度 ↑</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">最低评分 ≥ {minScore.toFixed(1)}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="mt-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">最大长度 ≤ {maxLength}</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={maxLength}
                    onChange={(e) => setMaxLength(Number(e.target.value))}
                    className="mt-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">包含节点</span>
                  <input
                    value={includeNode}
                    onChange={(e) => setIncludeNode(e.target.value)}
                    placeholder="如 BERT"
                    className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">排除节点</span>
                  <input
                    value={excludeNode}
                    onChange={(e) => setExcludeNode(e.target.value)}
                    placeholder="如 张明"
                    className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">包含 / 排除关系</span>
                  <div className="flex gap-1">
                    <input
                      value={includeRel}
                      onChange={(e) => setIncludeRel(e.target.value)}
                      placeholder="含"
                      className="w-1/2 text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-400"
                    />
                    <input
                      value={excludeRel}
                      onChange={(e) => setExcludeRel(e.target.value)}
                      placeholder="排"
                      className="w-1/2 text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  显示 {filteredSorted.length} / {paths.length} 条路径
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMinScore(0);
                    setMaxLength(5);
                    setIncludeNode('');
                    setExcludeNode('');
                    setIncludeRel('');
                    setExcludeRel('');
                    setSortBy('score');
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3 h-3" />重置筛选
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {filteredSorted.length === 0 ? (
                  <div className="text-center py-12 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    无符合条件的路径，请调整筛选条件
                  </div>
                ) : (
                  filteredSorted.map((p, idx) => (
                    <div key={p.id} className="border border-gray-200 rounded-lg p-3 flex items-start gap-3">
                      <span className="text-xs font-mono text-gray-400 w-6 flex-shrink-0 pt-0.5">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <PathChips hops={p.hops} />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.length} 跳</span>
                        {p.score != null && (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {p.score.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 导出为表格数据 */}
          {activeTab === 'export-table' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                将当前路径列表及其评分导出为表格，便于线下汇报与二次分析。当前可导出 {exportRows.length} 条。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => void exportCsv()}
                  disabled={exporting}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      导出 CSV
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      逗号分隔文本，含 path_id / length / score / path 列，可用 Excel 或数据分析工具打开。
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void exportExcel()}
                  disabled={exporting}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      导出 Excel
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      生成可被 Excel 直接打开的表格文件，字段与 CSV 一致。
                    </p>
                  </div>
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">导出预览</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white">
                      {['path_id', 'length', 'score', 'path'].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium border-b border-gray-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exportRows.slice(0, 5).map((p) => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-400">{p.id}</td>
                        <td className="px-3 py-2">{p.length}</td>
                        <td className="px-3 py-2">{p.score?.toFixed(2) ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-md truncate">{pathText(p.hops)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 导出为可视化图片 */}
          {activeTab === 'export-image' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                将当前关系分析网络图导出为图片，用于汇报材料或文档插图。源实体「{source}」→ 目标「{target}」。
              </div>
              <NetworkPreview source={source} target={target} paths={exportRows} svgRef={svgRef} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => void exportPng()}
                  disabled={exporting}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      导出 PNG
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">位图格式，适合 PPT / Word 插入与打印。</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void exportSvg()}
                  disabled={exporting}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left disabled:opacity-60"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      导出 SVG
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">矢量格式，可无损缩放，适合设计排版与二次编辑。</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
