import { useState, useEffect, Fragment, useRef, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  RefreshCw, ChevronDown, ChevronRight, AlertCircle, CheckCircle2,
  Clock, Network, History, Play, RotateCcw, ScanLine,
  Zap, Eye, GitMerge, TrendingUp,
  XCircle, Plus, X, Database, Timer, Activity,
  CheckCircle, FileCode2, Trash2, Upload, Lock,
  FileText, AlertTriangle,
} from 'lucide-react';
import { RdfExportPanel } from './GraphExport';

// ─── Types ──────────────────────────────────────────────────────────────────

type RunStatus = 'extracting' | 'merging' | 'committing' | 'review_pending' | 'succeeded' | 'failed';
type RunMode = 'full' | 'incremental';

interface GraphRun {
  id: string; mode: RunMode; status: RunStatus; phase: string; progress: number;
  processedRows: number; entityCount: number; relationCount: number;
  newCount: number; modCount: number; delCount: number;
  startedAt: string; finishedAt?: string;
}
interface GraphVersion {
  id: string; tag: string; label: string;
  createdAt: string; runId?: string;
  entityCount: number; relationCount: number;
  mode: RunMode; isCurrent: boolean; note?: string;
}
interface GraphEntry {
  id: string; graphName: string; ontologyName: string; datasourceName: string;
  targetSpace: string; entityCount: number; relationCount: number;
  lastFull?: string; lastIncremental?: string; activeRun?: GraphRun; runs: GraphRun[];
  isPrivate?: boolean;
  versions: GraphVersion[];
  delayedExec?: { hours: number; mode: RunMode } | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const MOCK_GRAPHS: GraphEntry[] = [
  {
    id: 'g1', graphName: '科技论文知识图谱', ontologyName: '科技论文知识图谱本体',
    datasourceName: '科研文献数据库', targetSpace: 'kg:sci-paper-v3',
    entityCount: 128340, relationCount: 89201,
    lastFull: '2026-07-20 02:30', lastIncremental: '2026-07-30 14:15',
    activeRun: {
      id: 'run-2026-07-31-001', mode: 'incremental', status: 'review_pending', phase: '待人工审核',
      progress: 94, processedRows: 12430, entityCount: 12196, relationCount: 8700,
      newCount: 234, modCount: 89, delCount: 12, startedAt: '2026-07-31 09:15',
    },
    runs: [
      {
        id: 'run-2026-07-31-001', mode: 'incremental', status: 'review_pending', phase: '待人工审核',
        progress: 94, processedRows: 12430, entityCount: 12196, relationCount: 8700,
        newCount: 234, modCount: 89, delCount: 12, startedAt: '2026-07-31 09:15',
      },
      {
        id: 'run-2026-07-30-001', mode: 'incremental', status: 'succeeded', phase: '已完成',
        progress: 100, processedRows: 9820, entityCount: 9632, relationCount: 7201,
        newCount: 189, modCount: 45, delCount: 6, startedAt: '2026-07-30 14:10', finishedAt: '2026-07-30 14:22',
      },
      {
        id: 'run-2026-07-20-001', mode: 'full', status: 'succeeded', phase: '已完成',
        progress: 100, processedRows: 128430, entityCount: 128340, relationCount: 89201,
        newCount: 128340, modCount: 0, delCount: 0, startedAt: '2026-07-20 02:01', finishedAt: '2026-07-20 02:28',
      },
    ],
    versions: [
      { id: 'v-g1-4', tag: 'v3.2', label: '增量更新', createdAt: '2026-07-30 14:22', runId: 'run-2026-07-30-001', entityCount: 128340, relationCount: 89201, mode: 'incremental', isCurrent: true, note: '日常增量更新，新增 189 条实体，修正 45 条属性' },
      { id: 'v-g1-3', tag: 'v3.1', label: '全量重建', createdAt: '2026-07-20 02:28', runId: 'run-2026-07-20-001', entityCount: 118420, relationCount: 82103, mode: 'full', isCurrent: false, note: '第三次全量重建，覆盖近两年文献数据，修正本体映射 12 处' },
      { id: 'v-g1-2', tag: 'v2.8', label: '全量重建', createdAt: '2026-06-15 01:52', entityCount: 98230, relationCount: 68420, mode: 'full', isCurrent: false, note: '二次全量构建，修正实体去重规则，删除冗余节点 3,200 条' },
      { id: 'v-g1-1', tag: 'v1.0', label: '初始版本', createdAt: '2026-04-01 10:18', entityCount: 45200, relationCount: 31500, mode: 'full', isCurrent: false, note: '图谱首次构建，覆盖 2020-2026 年文献数据' },
    ],
  },
  {
    id: 'g2', graphName: '新能源产业图谱', ontologyName: '新能源产业图谱本体',
    datasourceName: '产业数据库', targetSpace: 'kg:energy-v1',
    entityCount: 0, relationCount: 0, runs: [], versions: [],
  },
];

const CHANGESET = [
  { id: 'cs-001', runId: 'run-2026-07-31-001', type: 'incremental' as const, status: 'pending' as const, delta: '+234 / ~89 / -12', createdAt: '2026-07-31 09:25' },
  { id: 'cs-002', runId: 'run-2026-07-30-001', type: 'incremental' as const, status: 'committed' as const, delta: '+189 / ~45 / -6', createdAt: '2026-07-30 14:20' },
  { id: 'cs-003', runId: 'run-2026-07-20-001', type: 'full' as const, status: 'committed' as const, delta: '+128340 / ~0 / -0', createdAt: '2026-07-20 02:28' },
];

const MOCK_CANDIDATES = [
  { id: 'c1', opType: 'INSERT', kind: '实体', name: '深度学习框架 v2', source: 'papers#4521', confidence: 0.95, status: 'auto' as const },
  { id: 'c2', opType: 'INSERT', kind: '实体', name: 'Geoffrey Hinton', source: 'authors#145', confidence: 0.92, status: 'auto' as const },
  { id: 'c3', opType: 'INSERT', kind: '关系', name: 'WRITTEN_BY', source: 'papers#4521→authors#145', confidence: 0.88, status: 'auto' as const },
  { id: 'c4', opType: 'INSERT', kind: '实体', name: '多伦多大学', source: 'institutions#88', confidence: 0.65, status: 'review' as const },
  { id: 'c5', opType: 'UPDATE', kind: '属性', name: 'pub_year=2026', source: 'papers#4521', confidence: 0.99, status: 'auto' as const },
  { id: 'c6', opType: 'INSERT', kind: '关系', name: 'CITES', source: 'papers#4521→papers#1892', confidence: 0.45, status: 'review' as const },
];

const RUN_STATUS_CONFIG: Record<RunStatus, { label: string; color: string; dot: string; animate: boolean }> = {
  extracting:    { label: '实体抽取中', color: 'text-blue-600',   dot: 'bg-blue-500',   animate: true  },
  merging:       { label: '合并中',     color: 'text-indigo-600', dot: 'bg-indigo-500', animate: true  },
  committing:    { label: '提交中',     color: 'text-purple-600', dot: 'bg-purple-500', animate: true  },
  review_pending:{ label: '待人工审核', color: 'text-amber-600',  dot: 'bg-amber-500',  animate: false },
  succeeded:     { label: '已完成',     color: 'text-green-600',  dot: 'bg-green-500',  animate: false },
  failed:        { label: '失败',       color: 'text-red-600',    dot: 'bg-red-500',    animate: false },
};

const PIPELINE_PHASES = [
  { key: 'scan',    label: '数据扫描', Icon: ScanLine  },
  { key: 'extract', label: '实体抽取', Icon: Zap       },
  { key: 'merge',   label: '冲突合并', Icon: GitMerge  },
  { key: 'review',  label: '人工审核', Icon: Eye       },
  { key: 'commit',  label: '图谱提交', Icon: Database  },
];

const STATIC_THROUGHPUT = [
  { t: '09:15', 行: 0,    实体: 0    },
  { t: '09:17', 行: 892,  实体: 720  },
  { t: '09:19', 行: 1240, 实体: 1015 },
  { t: '09:21', 行: 1380, 实体: 1120 },
  { t: '09:23', 行: 1450, 实体: 1180 },
  { t: '09:25', 行: 1421, 实体: 1150 },
  { t: '09:27', 行: 1380, 实体: 1100 },
  { t: '09:29', 行: 890,  实体: 710  },
  { t: '09:31', 行: 940,  实体: 760  },
  { t: '09:33', 行: 845,  实体: 670  },
  { t: '09:35', 行: 720,  实体: 580  },
  { t: '09:37', 行: 340,  实体: 270  },
  { t: '09:39', 行: 120,  实体: 90   },
  { t: '09:41', 行: 48,   实体: 35   },
];

const ACTIVE_THROUGHPUT_INIT = [
  { t: 'T+0s',  行: 0,   实体: 0   },
  { t: 'T+10s', 行: 180, 实体: 145 },
  { t: 'T+20s', 行: 312, 实体: 250 },
];

const ENTITY_DIST = [
  { name: '论文',  count: 5234, color: '#6366f1' },
  { name: '作者',  count: 4102, color: '#0ea5e9' },
  { name: '机构',  count: 1890, color: '#10b981' },
  { name: '关键词', count: 970,  color: '#f59e0b' },
];

const ERROR_BREAKDOWN = [
  { type: '低置信度跳过', count: 234, pct: 61, color: '#f59e0b', example: '候选作者 "X. Liu"'            },
  { type: '实体重复合并', count: 89,  pct: 23, color: '#6366f1', example: 'DL Framework → 深度学习框架 v2'  },
  { type: '关系目标缺失', count: 45,  pct: 12, color: '#ef4444', example: 'CITES → paper#9999 (未收录)' },
  { type: '属性格式错误', count: 12,  pct: 3,  color: '#94a3b8', example: 'pub_year: "invalid"'         },
];

const DELAY_HOURS = [0, 1, 2, 4, 6, 12, 24];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPhaseIdx(status: RunStatus): number {
  const m: Record<RunStatus, number> = {
    extracting: 1, merging: 2, committing: 4,
    review_pending: 3, succeeded: 5, failed: -1,
  };
  return m[status] ?? 0;
}

// ─── Phase timeline ───────────────────────────────────────────────────────────

function PhaseTimeline({ status }: { status: RunStatus }) {
  const activeIdx = getPhaseIdx(status);
  const isSucceeded = status === 'succeeded';
  const isFailed = status === 'failed';

  return (
    <div className="flex items-start">
      {PIPELINE_PHASES.map(({ key, label, Icon }, i) => {
        const done = isSucceeded || activeIdx > i;
        const active = !isSucceeded && !isFailed && activeIdx === i;
        const fail = isFailed && activeIdx === -1 && i === 1;
        const lineColor = done ? 'bg-emerald-300' : i < activeIdx ? 'bg-blue-200' : 'bg-gray-200';

        return (
          <Fragment key={key}>
            {i > 0 && (
              <div className={`flex-1 h-0.5 mt-[17px] mx-0.5 transition-colors ${lineColor}`} />
            )}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done  ? 'border-emerald-500 bg-emerald-500 text-white' :
                active? 'border-blue-500 bg-blue-500 text-white ring-4 ring-blue-100' :
                fail  ? 'border-red-500 bg-red-500 text-white' :
                        'border-gray-200 bg-gray-50 text-gray-300'
              }`}>
                {done  ? <CheckCircle2 size={15} strokeWidth={2.5} /> :
                 fail  ? <XCircle size={15} /> :
                 active? <Icon size={15} /> :
                         <Icon size={15} />}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                done ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-gray-400'
              }`}>{label}</span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent, icon: Icon, pulse,
}: {
  label: string; value: string | number; sub?: string;
  accent: string; icon: React.ElementType; pulse?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={14} className="text-white" />
        </div>
      </div>
      <div className={`text-2xl font-bold text-gray-900 tracking-tight ${pulse ? 'tabular-nums' : ''}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-gray-400 truncate">{sub}</div>}
    </div>
  );
}

// ─── Run dashboard ────────────────────────────────────────────────────────────

export type GraphTasksDashTab = 'monitor' | 'changeset' | 'candidates';

function RunDashboard({
  graph, run, onClose, onNavigateTo, initialDashTab, focusTaskLogs, focusChangeset,
}: {
  graph: GraphEntry; run: GraphRun;
  onClose: () => void;
  onNavigateTo?: (p: string) => void;
  initialDashTab?: GraphTasksDashTab;
  focusTaskLogs?: boolean;
  focusChangeset?: boolean;
}) {
  const [dashTab, setDashTab] = useState<GraphTasksDashTab>(initialDashTab ?? 'monitor');
  const [candidateFilter, setCandidateFilter] = useState<'all' | '实体' | '关系' | '属性'>('all');
  const [liveSpeed, setLiveSpeed] = useState(143);
  const [throughputData, setThroughputData] = useState(
    ['extracting', 'merging', 'committing'].includes(run.status)
      ? ACTIVE_THROUGHPUT_INIT
      : STATIC_THROUGHPUT
  );

  useEffect(() => {
    if (!focusTaskLogs) return;
    setDashTab('monitor');
    const timer = window.setTimeout(() => {
      document.getElementById('task-logs-alerts')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [focusTaskLogs]);

  useEffect(() => {
    if (!focusChangeset) return;
    setDashTab('changeset');
    const timer = window.setTimeout(() => {
      document.getElementById('graph-changelog-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [focusChangeset]);

  const isActive = ['extracting', 'merging', 'committing'].includes(run.status);
  const sc = RUN_STATUS_CONFIG[run.status];
  const pendingCount = MOCK_CANDIDATES.filter(c => c.status === 'review').length;
  const filteredCandidates = MOCK_CANDIDATES.filter(c => candidateFilter === 'all' || c.kind === candidateFilter);
  const totalErrors = ERROR_BREAKDOWN.reduce((s, e) => s + e.count, 0);

  useEffect(() => {
    if (!isActive) return;
    let tick = 0;
    const iv = setInterval(() => {
      tick++;
      setLiveSpeed(Math.floor(80 + Math.random() * 130));
      if (tick % 5 === 0) {
        const now = new Date();
        const t = `T+${tick * 2}s`;
        setThroughputData(prev => [
          ...prev.slice(-13),
          { t, 行: Math.floor(280 + Math.random() * 350), 实体: Math.floor(220 + Math.random() * 280) },
        ]);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [isActive]);

  const speedDisplay  = isActive ? `${liveSpeed} 行/s`    : '809 行/min';
  const speedSub      = isActive ? '实时吞吐'              : '处理期间平均';
  const elapsedSec    = isActive ? '—'                   : '26m 14s';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Dashboard header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.animate ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-semibold text-gray-800">{graph.graphName}</span>
        </div>
        <span className="text-xs text-gray-400 font-mono">{run.id.slice(-16)}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${run.mode === 'full' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
          {run.mode === 'full' ? '全量' : '增量'}
        </span>
        <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>

        <div className="flex-1" />

        {/* Dash tabs */}
        <div className="flex gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-white">
          {([
            ['monitor',   '仪表盘'],
            ['changeset', '变更日志'],
            ['candidates','实例生成预览'],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setDashTab(key)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${dashTab === key ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
              {key === 'candidates' && pendingCount > 0 && (
                <span className="ml-1 bg-amber-400 text-white rounded-full px-1 py-px text-[9px] font-bold">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* ── Monitor tab ─────────────────────────────────────────── */}
      {dashTab === 'monitor' && (
        <div className="p-5 space-y-5 bg-gray-50/40">

          {/* KPI row */}
          <div className="grid grid-cols-5 gap-3">
            <KpiCard
              label="整体进度"
              value={`${run.progress}%`}
              sub={run.phase}
              accent="bg-blue-500"
              icon={Activity}
            />
            <KpiCard
              label="处理速度"
              value={speedDisplay}
              sub={speedSub}
              accent="bg-indigo-500"
              icon={TrendingUp}
              pulse={isActive}
            />
            <KpiCard
              label="成功数"
              value={run.processedRows.toLocaleString()}
              sub={`实体 ${run.entityCount.toLocaleString()} · 关系 ${run.relationCount.toLocaleString()}`}
              accent="bg-emerald-500"
              icon={CheckCircle}
            />
            <KpiCard
              label="失败数"
              value={totalErrors.toLocaleString()}
              sub={`跳过 ${run.delCount} · 重复 ${run.modCount}`}
              accent="bg-amber-500"
              icon={AlertCircle}
            />
            <KpiCard
              label="运行时长"
              value={elapsedSec}
              sub={`开始 ${run.startedAt.split(' ')[1]}`}
              accent="bg-slate-500"
              icon={Timer}
            />
          </div>

          {/* Progress bar + phase */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">执行阶段</span>
              <span className="text-xs text-gray-400">{run.progress}% 完成</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${run.progress}%`,
                  background: run.status === 'succeeded' ? '#10b981'
                    : run.status === 'failed' ? '#ef4444'
                    : 'linear-gradient(90deg,#6366f1,#3b82f6)',
                }}
              />
            </div>
            <PhaseTimeline status={run.status} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-5 gap-4">
            {/* Throughput chart */}
            <div className="col-span-3 bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">处理吞吐量</span>
                <span className="text-[10px] text-gray-400">{isActive ? '实时更新' : '历史数据'} · 行/2min</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={throughputData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gt-rowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gt-entGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="行" stroke="#6366f1" fill="url(#gt-rowGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="实体" stroke="#0ea5e9" fill="url(#gt-entGrad)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" />处理行数
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="w-3 h-0.5 bg-sky-500 inline-block rounded" />抽取实体
                </span>
              </div>
            </div>

            {/* Entity distribution */}
            <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">实体类型分布</div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={ENTITY_DIST} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(v: number) => [v.toLocaleString(), '数量']}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {ENTITY_DIST.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Delta summary */}
              <div className="mt-3 space-y-1">
                {[
                  { label: '新增', value: `+${run.newCount}`, color: 'text-emerald-600' },
                  { label: '修改', value: `~${run.modCount}`, color: 'text-blue-600' },
                  { label: '删除', value: `-${run.delCount}`, color: 'text-red-500' },
                ].map(d => (
                  <div key={d.label} className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">{d.label}</span>
                    <span className={`font-bold font-mono ${d.color}`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: error breakdown + log */}
          <div className="grid grid-cols-2 gap-4">
            {/* Error breakdown */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">异常分类</span>
                <span className="text-xs text-gray-400">共 {totalErrors} 条</span>
              </div>
              <div className="space-y-2.5">
                {ERROR_BREAKDOWN.map(e => (
                  <div key={e.type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                        <span className="text-xs text-gray-700">{e.type}</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-gray-700">{e.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1">
                      <div className="h-1 rounded-full" style={{ width: `${e.pct}%`, background: e.color }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">示例: {e.example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live log */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span id="task-logs-alerts" className={`text-xs font-semibold uppercase tracking-wide ${focusTaskLogs ? 'text-amber-700' : 'text-gray-600'}`}>任务日志与告警</span>
                {isActive && <span className="flex items-center gap-1 text-[10px] text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />实时</span>}
              </div>
              <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] text-gray-300 space-y-1 h-[138px] overflow-y-auto">
                <div><span className="text-slate-500">09:15:01</span> <span className="text-emerald-400">INFO</span> 开始增量抽取任务…</div>
                <div><span className="text-slate-500">09:15:03</span> <span className="text-emerald-400">INFO</span> 加载 checkpoint:2026-07-30T14:22:00Z</div>
                <div><span className="text-slate-500">09:15:05</span> <span className="text-emerald-400">INFO</span> 扫描增量数据 12,430 行</div>
                <div><span className="text-slate-500">09:15:08</span> <span className="text-emerald-400">INFO</span> 抽取实体 12,196 个，关系 8,700 条</div>
                <div><span className="text-slate-500">09:15:12</span> <span className="text-amber-400">WARN</span> 234 个低置信度候选进入审核队列</div>
                <div><span className="text-slate-500">09:15:14</span> <span className="text-emerald-400">INFO</span> 合并阶段完成，Changeset cs-001 生成</div>
                <div><span className="text-slate-500">09:15:16</span> <span className="text-sky-400">INFO</span> 等待人工审核确认…</div>
                {isActive && (
                  <>
                    <div><span className="text-slate-500">实时</span> <span className="text-sky-400">INFO</span> 处理中 · {liveSpeed} 行/s</div>
                    <div className="inline-flex gap-0.5 mt-0.5">
                      {[...Array(3)].map((_, i) => (
                        <span key={i} className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Changeset tab ───────────────────────────────────────── */}
      {dashTab === 'changeset' && (
        <div id="graph-changelog-panel" className="p-5">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Changeset ID', 'Run ID', '类型', '实体变更（新增/修改/删除）', '创建时间', '状态'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CHANGESET.filter(cs => graph.runs.some(r => r.id === cs.runId)).map(cs => (
                <tr key={cs.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{cs.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{cs.runId.slice(-12)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cs.type === 'incremental' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {cs.type === 'incremental' ? '增量' : '全量'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">{cs.delta}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{cs.createdAt}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cs.status === 'committed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {cs.status === 'committed' ? '已提交' : '待提交'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Candidates tab ──────────────────────────────────────── */}
      {dashTab === 'candidates' && (
        <div>
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
            {pendingCount > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {pendingCount} 待审核
              </span>
            )}
            <div className="flex gap-1 ml-auto">
              {(['all', '实体', '关系', '属性'] as const).map(f => (
                <button key={f} onClick={() => setCandidateFilter(f)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${candidateFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {f === 'all' ? '全部' : f}
                </button>
              ))}
            </div>
            {pendingCount > 0 && (
              <button onClick={() => onNavigateTo?.('human-review')}
                className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
                去人工审核
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['操作类型', '类别', '名称/三元组', '来源', '置信度', '状态'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.opType === 'INSERT' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{c.opType}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.kind}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-gray-100 rounded-full h-1">
                        <div className="h-1 rounded-full bg-blue-400" style={{ width: `${c.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{Math.round(c.confidence * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'auto' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {c.status === 'auto' ? '已采纳' : '待审核'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Private Graph Upload Modal ───────────────────────────────────────────────

type ParseState = 'idle' | 'parsing' | 'done' | 'error';
const TRIPLE_FORMATS = [
  { ext: '.nt',      label: 'N-Triples',  mime: 'application/n-triples', color: 'slate'  },
  { ext: '.ttl',     label: 'Turtle',     mime: 'text/turtle',            color: 'indigo' },
  { ext: '.jsonld',  label: 'JSON-LD',    mime: 'application/ld+json',    color: 'amber'  },
  { ext: '.nq',      label: 'N-Quads',    mime: 'application/n-quads',    color: 'emerald'},
  { ext: '.csv',     label: 'CSV (s,p,o)','mime': 'text/csv',             color: 'blue'   },
];

function PrivateGraphModal({ onClose, onBuild }: {
  onClose: () => void;
  onBuild: (entry: GraphEntry) => void;
}) {
  const [graphName, setGraphName] = useState('');
  const [targetSpace, setTargetSpace] = useState('kg:private/');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseState, setParseState] = useState<ParseState>('idle');
  const [parseProgress, setParseProgress] = useState(0);
  const [tripleCount, setTripleCount] = useState(0);
  const [entityEst, setEntityEst] = useState(0);
  const [relationEst, setRelationEst] = useState(0);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detectedFmt = file
    ? TRIPLE_FORMATS.find(f => file.name.toLowerCase().endsWith(f.ext))
    : null;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  }, []);

  const acceptFile = (f: File) => {
    setFile(f);
    setParseState('parsing');
    setParseProgress(0);
    setParseError('');
    let p = 0;
    timerRef.current = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(timerRef.current!);
        const est = Math.floor(f.size / 120 + Math.random() * 500);
        setTripleCount(est);
        setEntityEst(Math.floor(est * 0.38));
        setRelationEst(Math.floor(est * 0.62));
        setParseState('done');
      }
      setParseProgress(Math.min(p, 100));
    }, 120);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const canBuild = parseState === 'done' && graphName.trim() && targetSpace.trim();

  const handleBuild = () => {
    if (!canBuild) return;
    const slug = graphName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const ts = targetSpace.trim().endsWith('/') ? `${targetSpace.trim()}${slug}` : targetSpace.trim();
    const newEntry: GraphEntry = {
      id: `g-priv-${uid()}`,
      graphName: graphName.trim(),
      ontologyName: '自定义 (用户上传)',
      datasourceName: file?.name ?? '三元组文件',
      targetSpace: ts,
      entityCount: entityEst,
      relationCount: relationEst,
      isPrivate: true,
      runs: [],
      versions: [],
    };
    onBuild(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Lock size={15} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">自定义图谱上传</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">直接上传三元组文件，跳过数据源配置快速构建图谱</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Meta fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">图谱名称 <span className="text-red-400">*</span></label>
              <input
                value={graphName}
                onChange={e => setGraphName(e.target.value)}
                placeholder="如：我的自定义关系图谱"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">目标命名空间</label>
              <input
                value={targetSpace}
                onChange={e => setTargetSpace(e.target.value)}
                placeholder="kg:private/"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400 bg-white"
              />
            </div>
          </div>

          {/* Format hints */}
          <div>
            <p className="text-[11px] font-semibold text-gray-600 mb-2">支持格式</p>
            <div className="flex flex-wrap gap-1.5">
              {TRIPLE_FORMATS.map(f => (
                <span key={f.ext}
                  className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${detectedFmt?.ext === f.ext ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {f.ext} <span className="opacity-60">{f.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => parseState === 'idle' && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
              dragOver ? 'border-indigo-400 bg-indigo-50' :
              file ? 'border-gray-200 bg-gray-50 cursor-default' :
              'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
            }`}
            style={{ minHeight: 140 }}>
            <input ref={fileInputRef} type="file"
              accept=".nt,.ttl,.jsonld,.nq,.csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }} />

            {!file ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Upload size={28} className={`transition-colors ${dragOver ? 'text-indigo-500' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-500">拖入三元组文件，或 <span className="text-indigo-600 font-medium">点击选择</span></p>
                <p className="text-[11px] text-gray-400">支持 .nt / .ttl / .jsonld / .nq / .csv</p>
              </div>
            ) : (
              <div className="p-5">
                {/* File info row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                      {detectedFmt && <span className="ml-2 text-indigo-500 font-medium">{detectedFmt.label}</span>}
                      {!detectedFmt && <span className="ml-2 text-amber-500">格式未识别</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setParseState('idle'); setParseProgress(0); }}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>

                {/* Parse progress */}
                {parseState === 'parsing' && (
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                      <span>正在解析三元组…</span>
                      <span className="font-mono">{Math.round(parseProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-150"
                        style={{ width: `${parseProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Parse done */}
                {parseState === 'done' && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '三元组', value: tripleCount.toLocaleString(), color: 'text-indigo-600' },
                      { label: '预估实体', value: entityEst.toLocaleString(), color: 'text-sky-600' },
                      { label: '预估关系', value: relationEst.toLocaleString(), color: 'text-emerald-600' },
                    ].map(s => (
                      <div key={s.label} className="text-center bg-white rounded-xl border border-gray-100 py-2.5">
                        <div className={`text-base font-bold tabular-nums ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {parseState === 'error' && (
                  <div className="flex items-center gap-2 text-red-500 text-xs">
                    <AlertTriangle size={13} /> {parseError || '文件解析失败，请检查格式后重试'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help note */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2.5">
            <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              自定义图谱不依赖本体与数据源配置，直接基于三元组构建。实体识别与关系抽取将按文件内容原样导入，不经过冲突合并与人工审核流程。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            取消
          </button>
          <button
            onClick={handleBuild}
            disabled={!canBuild}
            className="px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-40 bg-indigo-600 hover:bg-indigo-700 text-white disabled:cursor-not-allowed">
            <Lock size={13} /> 开始构建自定义图谱
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rollback Modal ───────────────────────────────────────────────────────────

function RollbackModal({ graph, onClose, onRollback }: {
  graph: GraphEntry;
  onClose: () => void;
  onRollback: (graphId: string, versionId: string) => void;
}) {
  const [confirmTarget, setConfirmTarget] = useState<GraphVersion | null>(null);
  const versions = graph.versions;
  const currentVersion = versions.find(v => v.isCurrent);
  const rollbackable = versions.filter(v => !v.isCurrent);

  const entityDiff = confirmTarget && currentVersion
    ? confirmTarget.entityCount - currentVersion.entityCount
    : 0;
  const relationDiff = confirmTarget && currentVersion
    ? confirmTarget.relationCount - currentVersion.relationCount
    : 0;

  const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <RotateCcw size={15} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">图谱版本回滚</h2>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{graph.graphName}</p>
          </div>
          {confirmTarget && (
            <button onClick={() => setConfirmTarget(null)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded-lg flex items-center gap-1">
              <ChevronRight size={12} className="rotate-180" />返回列表
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── Confirmation step ── */}
        {confirmTarget ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">此操作不可撤销</p>
                <p>图谱将恢复至 <strong>{confirmTarget.tag}</strong>（{confirmTarget.createdAt}）的数据状态。当前版本 <strong>{currentVersion?.tag}</strong> 新增的所有变更将被撤销。</p>
              </div>
            </div>

            {/* Version comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">当前版本</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{currentVersion?.tag}</span>
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">当前</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{currentVersion?.createdAt}</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>实体</span><span className="font-mono font-semibold">{currentVersion?.entityCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>关系</span><span className="font-mono font-semibold">{currentVersion?.relationCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-2">回滚目标</div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-amber-800">{confirmTarget.tag}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${confirmTarget.mode === 'full' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {confirmTarget.mode === 'full' ? '全量' : '增量'}
                  </span>
                </div>
                <p className="text-xs text-amber-600 mb-2">{confirmTarget.createdAt}</p>
                <div className="space-y-1 text-xs text-amber-700">
                  <div className="flex items-center justify-between">
                    <span>实体</span><span className="font-mono font-semibold">{confirmTarget.entityCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>关系</span><span className="font-mono font-semibold">{confirmTarget.relationCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delta summary */}
            <div className="flex items-center gap-6 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <span className="text-gray-500 text-xs">变更量</span>
              <span className={`font-mono font-semibold ${entityDiff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                实体 {fmt(entityDiff)}
              </span>
              <span className={`font-mono font-semibold ${relationDiff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                关系 {fmt(relationDiff)}
              </span>
            </div>

            {confirmTarget.note && (
              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-600">版本备注：</span>{confirmTarget.note}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                取消
              </button>
              <button
                onClick={() => { onRollback(graph.id, confirmTarget.id); onClose(); }}
                className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-2 transition-colors">
                <RotateCcw size={13} /> 确认回滚至 {confirmTarget.tag}
              </button>
            </div>
          </div>
        ) : (
          /* ── Version list ── */
          <div className="flex-1 overflow-y-auto p-6">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <History className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">暂无版本快照</p>
                <p className="text-xs mt-1 text-gray-400">完成一次图谱构建提交后，将自动生成版本快照</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline track */}
                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gray-200 z-0" />

                <div className="space-y-2.5">
                  {versions.map((v, idx) => (
                    <div key={v.id}
                      className={`relative flex items-start gap-4 pl-11 pr-4 py-4 rounded-xl border-2 transition-all ${v.isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}`}>

                      {/* Timeline dot */}
                      <div className={`absolute left-3 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${v.isCurrent ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}>
                        {v.isCurrent
                          ? <CheckCircle2 size={12} className="text-white" />
                          : <span className="text-[9px] text-gray-400 font-bold">{idx + 1}</span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-sm font-bold ${v.isCurrent ? 'text-blue-700' : 'text-gray-800'}`}>{v.tag}</span>
                          {v.isCurrent && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">当前</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${v.mode === 'full' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            {v.mode === 'full' ? '全量' : '增量'}
                          </span>
                          <span className="text-xs text-gray-400">{v.createdAt}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1.5">{v.label}</p>
                        {v.note && <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">{v.note}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{v.entityCount.toLocaleString()} 实体</span>
                          <span>{v.relationCount.toLocaleString()} 关系</span>
                          {v.runId && <span className="font-mono text-gray-300 text-[10px]">Run {v.runId.slice(-10)}</span>}
                        </div>
                      </div>

                      {!v.isCurrent && (
                        <button onClick={() => setConfirmTarget(v)}
                          disabled={rollbackable.length === 0}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 rounded-lg text-xs font-medium transition-all">
                          <RotateCcw size={11} /> 回滚至此
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({ graph, onClose, onConfirm }: {
  graph: GraphEntry;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [inputVal, setInputVal] = useState('');
  const confirmed = inputVal.trim() === graph.graphName.trim();
  const hasRuns = graph.runs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-6 pb-4">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">删除图谱</h2>
            <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
              此操作不可恢复。删除后，该图谱的所有执行记录、配置及结构化输出预设将被永久清除。
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Graph info */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-16 shrink-0">图谱名称</span>
              <span className="text-sm font-semibold text-gray-800">{graph.graphName}</span>
              {graph.isPrivate && (
                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">自定义</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-16 shrink-0">目标空间</span>
              <span className="text-xs font-mono text-gray-600">{graph.targetSpace}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-16 shrink-0">数据规模</span>
              <span className="text-xs text-gray-600">
                {graph.entityCount.toLocaleString()} 实体 · {graph.relationCount.toLocaleString()} 关系
                {hasRuns && <span className="ml-2 text-gray-400">· {graph.runs.length} 次执行记录</span>}
              </span>
            </div>
          </div>

          {/* Confirm input */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">
              请输入图谱名称 <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{graph.graphName}</span> 以确认删除
            </label>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder={`输入"${graph.graphName}"`}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors bg-white border-gray-200 focus:border-red-400"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              取消
            </button>
            <button
              onClick={onConfirm}
              disabled={!confirmed}
              className="px-5 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 disabled:cursor-not-allowed">
              <Trash2 size={13} /> 确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GraphTasks({
  onNavigateTo,
  initialDashTab,
  focusTaskLogs,
  initialOpenExport,
  exportFocus,
  initialOpenCustomUpload,
  focusIncremental,
  focusVersionRollback,
}: {
  onNavigateTo?: (page: string) => void;
  initialDashTab?: GraphTasksDashTab;
  focusTaskLogs?: boolean;
  /** 审计跳转：自动打开首个图谱的结构化输出面板 */
  initialOpenExport?: boolean;
  exportFocus?: 'rdf' | 'formats';
  /** 审计跳转：自动打开自定义图谱上传弹窗 */
  initialOpenCustomUpload?: boolean;
  /** 审计跳转：高亮增量更新按钮 */
  focusIncremental?: boolean;
  /** 审计跳转：打开变更日志并高亮版本回滚 */
  focusVersionRollback?: boolean;
}) {
  const [graphs, setGraphs] = useState<GraphEntry[]>(MOCK_GRAPHS);
  const [expandedGraphId, setExpandedGraphId] = useState<string | null>(() =>
    focusIncremental && MOCK_GRAPHS[0] ? MOCK_GRAPHS[0].id : null,
  );
  const [openRunId, setOpenRunId] = useState<{ graphId: string; runId: string } | null>(() => {
    if (focusVersionRollback && MOCK_GRAPHS[0]) {
      const g = MOCK_GRAPHS[0];
      const run = g.activeRun ?? g.runs[0];
      return run ? { graphId: g.id, runId: run.id } : null;
    }
    if (!initialDashTab && !focusTaskLogs) return null;
    const g = MOCK_GRAPHS[0];
    const run = g?.activeRun ?? g?.runs[0];
    return g && run ? { graphId: g.id, runId: run.id } : null;
  });
  const [exportOpenId, setExportOpenId] = useState<string | null>(() =>
    initialOpenExport && MOCK_GRAPHS[0] ? MOCK_GRAPHS[0].id : null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [scanStates, setScanStates] = useState<Record<string, 'idle' | 'scanning' | 'done'>>({});
  const [showPrivateModal, setShowPrivateModal] = useState(!!initialOpenCustomUpload);
  const [deleteTarget, setDeleteTarget] = useState<GraphEntry | null>(null);
  const [rollbackGraphId, setRollbackGraphId] = useState<string | null>(null);
  const [delayHours, setDelayHours] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!focusVersionRollback || !MOCK_GRAPHS[0]) return;
    const timer = window.setTimeout(() => {
      setRollbackGraphId(MOCK_GRAPHS[0].id);
      document.getElementById('graph-version-rollback-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [focusVersionRollback]);

  const handleScan = (graphId: string) => {
    if (scanStates[graphId] === 'scanning') return;
    setScanStates(prev => ({ ...prev, [graphId]: 'scanning' }));
    setTimeout(() => setScanStates(prev => ({ ...prev, [graphId]: 'done' })), 2200);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFullBuild = (graphId: string, mode: RunMode = 'full', ignoreDelay = false) => {
    const hours = ignoreDelay ? 0 : (delayHours[graphId] ?? 0);
    if (hours > 0) {
      setGraphs(prev => prev.map(g => g.id !== graphId ? g : { ...g, delayedExec: { hours, mode } }));
      return;
    }
    const newRun: GraphRun = {
      id: `run-${uid()}`, mode, status: 'extracting', phase: '实体抽取中',
      progress: 5, processedRows: 0, entityCount: 0, relationCount: 0,
      newCount: 0, modCount: 0, delCount: 0, startedAt: new Date().toLocaleString('zh-CN'),
    };
    setGraphs(prev => prev.map(g => g.id !== graphId ? g : { ...g, delayedExec: null, activeRun: newRun, runs: [newRun, ...g.runs] }));
    setOpenRunId({ graphId, runId: newRun.id });
  };

  const cancelDelayedExec = (graphId: string) => {
    setGraphs(prev => prev.map(g => g.id !== graphId ? g : { ...g, delayedExec: null }));
  };

  const handleBuildPrivate = (entry: GraphEntry) => {
    const newRun: GraphRun = {
      id: `run-${uid()}`, mode: 'full', status: 'extracting', phase: '导入三元组中',
      progress: 12, processedRows: 0, entityCount: 0, relationCount: 0,
      newCount: 0, modCount: 0, delCount: 0, startedAt: new Date().toLocaleString('zh-CN'),
    };
    const withRun: GraphEntry = { ...entry, activeRun: newRun, runs: [newRun] };
    setGraphs(prev => [...prev, withRun]);
    setOpenRunId({ graphId: entry.id, runId: newRun.id });
  };

  const handleRollback = (graphId: string, versionId: string) => {
    setGraphs(prev => prev.map(g => {
      if (g.id !== graphId) return g;
      const target = g.versions.find(v => v.id === versionId);
      if (!target) return g;
      return {
        ...g,
        entityCount: target.entityCount,
        relationCount: target.relationCount,
        versions: g.versions.map(v => ({ ...v, isCurrent: v.id === versionId })),
      };
    }));
    setRollbackGraphId(null);
  };

  const handleDelete = (graphId: string) => {
    setGraphs(prev => prev.filter(g => g.id !== graphId));
    if (openRunId?.graphId === graphId) setOpenRunId(null);
    if (exportOpenId === graphId) setExportOpenId(null);
    if (expandedGraphId === graphId) setExpandedGraphId(null);
    setDeleteTarget(null);
  };

  const openEntry = openRunId
    ? graphs.find(g => g.id === openRunId.graphId)
    : null;
  const openRun = openEntry
    ? (openEntry.runs.find(r => r.id === openRunId?.runId) || openEntry.activeRun)
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">图谱任务</h1>
            <p className="text-sm text-gray-500 mt-0.5">构造任务管理与实时监控；延迟执行在操作栏标记即可</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPrivateModal(true)}
              className={`text-sm px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5${initialOpenCustomUpload ? ' ring-2 ring-indigo-200' : ''}`}>
              <Lock size={13} /> 自定义图谱上传
            </button>
            <button onClick={() => onNavigateTo?.('graph-construction')}
              className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              去配置构造
            </button>
            <button onClick={handleRefresh}
              className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> 刷新
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Graph list */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
                <Network className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">图谱列表</span>
              </div>

              {graphs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                  <Network className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">暂无构造任务</p>
                </div>
              ) : (
                <div>
                  <div className="grid gap-3 px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1.5fr 0.8fr 1.2fr 2.4fr' }}>
                    <div>图谱 / 配置</div><div>目标空间</div><div>当前状态</div>
                    <div>活动 Run</div><div>实体/关系</div><div>最近执行</div><div>操作</div>
                  </div>

                  {graphs.map(g => {
                    const isExpanded = expandedGraphId === g.id;
                    const ar = g.activeRun;
                    const arCfg = ar ? RUN_STATUS_CONFIG[ar.status] : null;
                    const isActive = ar && ['extracting', 'merging', 'committing'].includes(ar.status);
                    const isOpen = openRunId?.graphId === g.id;
                    const scanState = scanStates[g.id] || 'idle';

                    return (
                      <div key={g.id} className="border-b border-gray-100 last:border-0">
                        {/* Row */}
                        <div className="grid gap-3 px-5 py-4 items-center hover:bg-gray-50/50 transition-colors"
                          style={{ gridTemplateColumns: '2fr 1fr 1fr 1.5fr 0.8fr 1.2fr 2.4fr' }}>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-gray-900 text-sm">{g.graphName}</span>
                              {g.isPrivate && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  <Lock size={8} />自定义
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{g.ontologyName} · {g.datasourceName}</div>
                          </div>
                          <div className="font-mono text-xs text-gray-500 truncate">{g.targetSpace}</div>
                          <div>
                            {g.delayedExec && !isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                {g.delayedExec.mode === 'full' ? '全量' : '增量'} · {g.delayedExec.hours}小时后执行
                                <button type="button" onClick={() => cancelDelayedExec(g.id)}
                                  className="ml-0.5 text-blue-400 hover:text-blue-700">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ) : ar ? (
                              <span className={`flex items-center gap-1.5 text-xs ${arCfg?.color}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${arCfg?.dot} ${arCfg?.animate ? 'animate-pulse' : ''}`} />
                                {arCfg?.label}
                              </span>
                            ) : g.runs.length > 0 ? (
                              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />已完成
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">未运行</span>
                            )}
                          </div>
                          <div>
                            {ar ? (
                              <div>
                                <div className="flex items-center gap-2 mb-1 text-xs text-gray-600">
                                  <span>{ar.phase}</span>
                                  <span className="text-gray-400">{ar.processedRows.toLocaleString()} 行</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                  <div className="h-1.5 rounded-full transition-all"
                                    style={{ width: `${ar.progress}%`, background: 'linear-gradient(90deg,#6366f1,#3b82f6)' }} />
                                </div>
                              </div>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </div>
                          <div className="text-xs text-gray-600">
                            {g.entityCount.toLocaleString()}<span className="text-gray-300 mx-1">/</span>{g.relationCount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <div>全量 {g.lastFull ?? '—'}</div>
                            <div>增量 {g.lastIncremental ?? '—'}</div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {ar?.status === 'review_pending' && (
                              <button onClick={() => onNavigateTo?.('human-review')}
                                className="text-xs px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
                                继续审核
                              </button>
                            )}
                            {ar?.status === 'failed' && (
                              <button onClick={() => handleFullBuild(g.id, 'full', true)}
                                className="text-xs px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-0.5">
                                <RotateCcw className="w-3 h-3" />重试
                              </button>
                            )}
                            {ar && (
                              <button
                                onClick={() => setOpenRunId(isOpen ? null : { graphId: g.id, runId: ar.id })}
                                className={`text-xs px-2.5 py-1 border rounded-lg transition-colors ${isOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                {isOpen ? '收起仪表盘' : '打开仪表盘'}
                              </button>
                            )}
                            <select
                              value={delayHours[g.id] ?? 0}
                              onChange={e => setDelayHours(prev => ({ ...prev, [g.id]: Number(e.target.value) }))}
                              disabled={!!isActive}
                              title="延迟执行"
                              className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 bg-white text-gray-600 focus:outline-none focus:border-blue-400 disabled:opacity-40"
                            >
                              {DELAY_HOURS.map(h => (
                                <option key={h} value={h}>{h === 0 ? '立即执行' : `${h}小时后`}</option>
                              ))}
                            </select>
                            <button onClick={() => handleFullBuild(g.id, 'full')} disabled={!!isActive}
                              className="text-xs px-2.5 py-1 border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-0.5">
                              <Play className="w-3 h-3" />全量
                            </button>
                            <button onClick={() => handleFullBuild(g.id, 'incremental')} disabled={!g.lastFull || !!isActive}
                              className={`text-xs px-2.5 py-1 border rounded-lg transition-colors disabled:opacity-40 ${
                                focusIncremental && g.id === graphs[0]?.id
                                  ? 'border-emerald-400 text-emerald-700 bg-emerald-50 ring-2 ring-emerald-200'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}>
                              增量
                            </button>
                            {scanState === 'scanning' ? (
                              <span className="text-xs px-2.5 py-1 border border-blue-200 text-blue-500 rounded-lg flex items-center gap-1 bg-blue-50">
                                <ScanLine className="w-3 h-3 animate-pulse" />扫描中…
                              </span>
                            ) : scanState === 'done' ? (
                              <button onClick={() => onNavigateTo?.('human-review')}
                                className="text-xs px-2.5 py-1 border border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />查看结果
                              </button>
                            ) : (
                              <button onClick={() => handleScan(g.id)}
                                className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1">
                                <ScanLine className="w-3 h-3" />扫描
                              </button>
                            )}
                            <button onClick={() => setExportOpenId(exportOpenId === g.id ? null : g.id)}
                              className={`text-xs px-2.5 py-1 border rounded-lg transition-colors flex items-center gap-0.5 ${exportOpenId === g.id ? `bg-indigo-50 border-indigo-200 text-indigo-600${exportFocus ? ' ring-2 ring-indigo-200' : ''}` : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              <FileCode2 className="w-3 h-3" />结构化输出
                            </button>
                            <button onClick={() => setExpandedGraphId(isExpanded ? null : g.id)}
                              className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-0.5">
                              历史 {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            <button
                              id={g.id === graphs[0]?.id ? 'graph-version-rollback-btn' : undefined}
                              onClick={() => setRollbackGraphId(g.id)}
                              disabled={g.versions.filter(v => !v.isCurrent).length === 0}
                              className={`text-xs px-2.5 py-1 border rounded-lg transition-colors flex items-center gap-0.5 disabled:opacity-30 ${
                                focusVersionRollback && g.id === graphs[0]?.id
                                  ? 'border-amber-400 text-amber-700 bg-amber-50 ring-2 ring-amber-200'
                                  : 'border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400'
                              }`}
                              title="版本回滚">
                              <RotateCcw className="w-3 h-3" />版本
                            </button>
                            <button
                              onClick={() => setDeleteTarget(g)}
                              disabled={!!isActive}
                              className="text-xs px-2 py-1 border border-red-100 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors flex items-center gap-0.5"
                              title="删除图谱">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* History */}
                        {isExpanded && (
                          <div className="bg-gray-50 border-t border-gray-100 px-5 py-3">
                            {g.runs.length === 0 ? (
                              <p className="text-xs text-gray-400 py-1">暂无执行记录</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-400">
                                    {['Run ID', '模式', '状态', '进度', '实体/关系', '时间'].map(h => (
                                      <th key={h} className="text-left pb-2 pr-4 font-medium">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {g.runs.map(run => {
                                    const sc = RUN_STATUS_CONFIG[run.status];
                                    return (
                                      <tr key={run.id} className="hover:bg-gray-100/50">
                                        <td className="py-2 pr-4 font-mono text-gray-600">{run.id.slice(-12)}</td>
                                        <td className="py-2 pr-4">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${run.mode === 'full' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {run.mode === 'full' ? '全量' : '增量'}
                                          </span>
                                        </td>
                                        <td className={`py-2 pr-4 ${sc.color}`}>
                                          <div className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                                          </div>
                                        </td>
                                        <td className="py-2 pr-4">
                                          <div className="flex items-center gap-2">
                                            <div className="w-20 bg-gray-200 rounded-full h-1">
                                              <div className="h-1 rounded-full bg-blue-400" style={{ width: `${run.progress}%` }} />
                                            </div>
                                            <span className="text-gray-500">{run.progress}%</span>
                                          </div>
                                        </td>
                                        <td className="py-2 pr-4 text-gray-600">
                                          {run.entityCount.toLocaleString()} / {run.relationCount.toLocaleString()}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">
                                          {run.startedAt}{run.finishedAt ? ` → ${run.finishedAt.split(' ')[1]}` : ''}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RDF export panel */}
            {exportOpenId && (() => {
              const eg = graphs.find(g => g.id === exportOpenId);
              return eg ? (
                <RdfExportPanel
                  graphId={eg.id}
                  graphName={eg.graphName}
                  entityCount={eg.entityCount}
                  relationCount={eg.relationCount}
                  targetSpace={eg.targetSpace}
                  onClose={() => setExportOpenId(null)}
                  highlightMode={exportFocus}
                />
              ) : null;
            })()}

            {/* Run dashboard */}
            {openEntry && openRun && (
              <RunDashboard
                key={`${openRun.id}-${initialDashTab ?? 'monitor'}-${focusTaskLogs ? 'logs' : 'plain'}-${focusVersionRollback ? 'rollback' : 'plain'}`}
                graph={openEntry}
                run={openRun}
                onClose={() => setOpenRunId(null)}
                onNavigateTo={onNavigateTo}
                initialDashTab={
                  initialDashTab === 'candidates'
                    ? 'candidates'
                    : initialDashTab === 'changeset'
                      ? 'changeset'
                      : 'monitor'
                }
                focusTaskLogs={focusTaskLogs}
                focusChangeset={focusVersionRollback}
              />
            )}
      </div>

      {/* Modals */}
      {showPrivateModal && (
        <PrivateGraphModal
          onClose={() => setShowPrivateModal(false)}
          onBuild={handleBuildPrivate}
        />
      )}
      {rollbackGraphId && (() => {
        const g = graphs.find(gr => gr.id === rollbackGraphId);
        return g ? (
          <RollbackModal
            graph={g}
            onClose={() => setRollbackGraphId(null)}
            onRollback={handleRollback}
          />
        ) : null;
      })()}
      {deleteTarget && (
        <DeleteConfirmModal
          graph={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
    </div>
  );
}
