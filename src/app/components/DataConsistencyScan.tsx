import { useState } from 'react';
import {
  ScanLine, Play, Clock, CheckCircle2, AlertCircle, XCircle,
  RefreshCw, ChevronDown, ChevronRight, Filter, Eye,
  AlertTriangle, ShieldCheck, Calendar, Zap, ClipboardCheck,
} from 'lucide-react';

type ScanStatus = 'queued' | 'running' | 'completed' | 'failed';
type ScanScope = 'full' | 'entity' | 'relation' | 'attribute';
type IssueLevel = 'error' | 'warning' | 'info';
type IssueStatus = 'pending' | 'approved' | 'rejected';

interface ScanIssue {
  id: string;
  level: IssueLevel;
  type: string;
  target: string;
  targetType: '实体' | '关系' | '属性';
  description: string;
  expected: string;
  actual: string;
  reviewStatus: IssueStatus;
}

interface ScanTask {
  id: string;
  graphName: string;
  graphId: string;
  scope: ScanScope;
  status: ScanStatus;
  progress: number;
  scheduledType: 'manual' | 'scheduled';
  scheduleExpr?: string;
  scannedNodes: number;
  scannedRelations: number;
  issueCount: number;
  errorCount: number;
  warnCount: number;
  issues: ScanIssue[];
  submittedAt: string;
  finishedAt?: string;
  submittedBy: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const MOCK_ISSUES_T1: ScanIssue[] = [
  {
    id: 'i1', level: 'error', type: '属性值超出范围', target: '论文#4521.pub_year', targetType: '属性',
    description: '发表年份超出合法范围', expected: '1900–2026', actual: '2099',
    reviewStatus: 'pending',
  },
  {
    id: 'i2', level: 'error', type: '关系不符合定义', target: 'AUTHORED_BY(论文#4521→机构#88)', targetType: '关系',
    description: 'AUTHORED_BY 的目标类型应为 Person，实际指向 Institution',
    expected: 'Person', actual: 'Institution',
    reviewStatus: 'pending',
  },
  {
    id: 'i3', level: 'warning', type: '必填属性缺失', target: '实体#8830 (研究方向)', targetType: '属性',
    description: '实体缺少本体要求的必填属性 description', expected: '非空字符串', actual: '(缺失)',
    reviewStatus: 'pending',
  },
  {
    id: 'i4', level: 'warning', type: '枚举值不合规', target: '论文#3312.status', targetType: '属性',
    description: 'status 字段值不在允许的枚举列表中', expected: 'draft|published|retracted', actual: 'archived',
    reviewStatus: 'approved',
  },
  {
    id: 'i5', level: 'error', type: '孤立实体', target: '作者#7721 (Wang Fang)', targetType: '实体',
    description: '实体无任何出入度关系，不符合图谱完整性规则', expected: '至少1条关系', actual: '0条',
    reviewStatus: 'pending',
  },
  {
    id: 'i6', level: 'info', type: '重复值检测', target: '论文#1102 & 论文#1888', targetType: '实体',
    description: '两实体 title 属性相似度 > 0.96，疑似重复录入', expected: '唯一标识', actual: '相似度 0.97',
    reviewStatus: 'pending',
  },
];

const MOCK_TASKS: ScanTask[] = [
  {
    id: 'scan-20260731-001',
    graphName: '科技论文知识图谱',
    graphId: 'g1',
    scope: 'full',
    status: 'completed',
    progress: 100,
    scheduledType: 'manual',
    scannedNodes: 128340,
    scannedRelations: 89201,
    issueCount: 6,
    errorCount: 3,
    warnCount: 2,
    issues: MOCK_ISSUES_T1,
    submittedAt: '2026-07-31 10:00',
    finishedAt: '2026-07-31 10:14',
    submittedBy: 'admin',
  },
  {
    id: 'scan-20260730-002',
    graphName: '科技论文知识图谱',
    graphId: 'g1',
    scope: 'relation',
    status: 'completed',
    progress: 100,
    scheduledType: 'scheduled',
    scheduleExpr: '0 2 * * *',
    scannedNodes: 0,
    scannedRelations: 89201,
    issueCount: 1,
    errorCount: 1,
    warnCount: 0,
    issues: [
      {
        id: 'i7', level: 'error', type: '关系不符合定义', target: 'CITES(论文#1892→论文#1892)', targetType: '关系',
        description: '自引关系不被允许', expected: '不同来源与目标', actual: '相同节点',
        reviewStatus: 'rejected',
      },
    ],
    submittedAt: '2026-07-30 02:00',
    finishedAt: '2026-07-30 02:06',
    submittedBy: 'scheduler',
  },
  {
    id: 'scan-20260731-003',
    graphName: '新能源产业图谱',
    graphId: 'g2',
    scope: 'attribute',
    status: 'running',
    progress: 43,
    scheduledType: 'manual',
    scannedNodes: 8920,
    scannedRelations: 0,
    issueCount: 0,
    errorCount: 0,
    warnCount: 0,
    issues: [],
    submittedAt: '2026-07-31 11:20',
    submittedBy: 'zhang_wei',
  },
  {
    id: 'scan-20260731-004',
    graphName: '新能源产业图谱',
    graphId: 'g2',
    scope: 'full',
    status: 'queued',
    progress: 0,
    scheduledType: 'scheduled',
    scheduleExpr: '0 3 * * 1',
    scannedNodes: 0,
    scannedRelations: 0,
    issueCount: 0,
    errorCount: 0,
    warnCount: 0,
    issues: [],
    submittedAt: '2026-07-31 11:21',
    submittedBy: 'scheduler',
  },
];

const GRAPHS = [
  { id: 'g1', name: '科技论文知识图谱' },
  { id: 'g2', name: '新能源产业图谱' },
];

const SCOPE_LABELS: Record<ScanScope, string> = {
  full: '全图扫描', entity: '仅实体', relation: '仅关系', attribute: '仅属性',
};

const STATUS_CONFIG: Record<ScanStatus, { label: string; color: string; dot: string; animate: boolean; icon: any }> = {
  queued:    { label: '排队中',   color: 'text-gray-500',   dot: 'bg-gray-400',   animate: false, icon: Clock },
  running:   { label: '扫描中',   color: 'text-blue-600',   dot: 'bg-blue-500',   animate: true,  icon: ScanLine },
  completed: { label: '已完成',   color: 'text-green-600',  dot: 'bg-green-500',  animate: false, icon: CheckCircle2 },
  failed:    { label: '失败',     color: 'text-red-600',    dot: 'bg-red-500',    animate: false, icon: XCircle },
};

const LEVEL_CONFIG: Record<IssueLevel, { label: string; color: string; bg: string; icon: any }> = {
  error:   { label: '错误', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    icon: XCircle },
  warning: { label: '警告', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  info:    { label: '提示', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: AlertCircle },
};

const REVIEW_STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
  pending:  { label: '待审核', color: 'text-amber-600 bg-amber-50 border border-amber-200' },
  approved: { label: '已通过', color: 'text-green-600 bg-green-50 border border-green-200' },
  rejected: { label: '已忽略', color: 'text-gray-500 bg-gray-50 border border-gray-200' },
};

function SubmitModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (t: Partial<ScanTask>) => void }) {
  const [graphId, setGraphId] = useState('g1');
  const [scope, setScope] = useState<ScanScope>('full');
  const [schedType, setSchedType] = useState<'manual' | 'scheduled'>('manual');
  const [cron, setCron] = useState('0 2 * * *');

  const handleSubmit = () => {
    onSubmit({
      id: `scan-${uid()}`,
      graphName: GRAPHS.find(g => g.id === graphId)?.name ?? '',
      graphId,
      scope,
      status: 'queued',
      progress: 0,
      scheduledType: schedType,
      scheduleExpr: schedType === 'scheduled' ? cron : undefined,
      scannedNodes: 0,
      scannedRelations: 0,
      issueCount: 0,
      errorCount: 0,
      warnCount: 0,
      issues: [],
      submittedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      submittedBy: 'admin',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">提交一致性扫描任务</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">目标图谱</label>
            <select value={graphId} onChange={e => setGraphId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {GRAPHS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">扫描范围</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(SCOPE_LABELS) as ScanScope[]).map(s => (
                <button key={s} onClick={() => setScope(s)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${scope === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">执行方式</label>
            <div className="flex gap-3">
              <button onClick={() => setSchedType('manual')}
                className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${schedType === 'manual' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-200'}`}>
                <Zap className="w-4 h-4" />立即执行
              </button>
              <button onClick={() => setSchedType('scheduled')}
                className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors ${schedType === 'scheduled' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-200'}`}>
                <Calendar className="w-4 h-4" />定时执行
              </button>
            </div>
          </div>
          {schedType === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cron 表达式</label>
              <input value={cron} onChange={e => setCron(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="0 2 * * *" />
              <p className="text-xs text-gray-400 mt-1">示例：0 2 * * *（每天凌晨2点）；0 3 * * 1（每周一凌晨3点）</p>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-1">
            <div className="font-medium">扫描规则包括：</div>
            <div className="text-blue-600 space-y-0.5">
              <div>• 属性值超出本体定义的范围或枚举</div>
              <div>• 关系端点类型与本体定义不符</div>
              <div>• 必填属性缺失 / 孤立实体检测</div>
              <div>• 重复实体相似度检测（阈值 0.95）</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">取消</button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" />提交扫描
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueRow({ issue, onReview }: { issue: ScanIssue; onReview: (id: string, s: IssueStatus) => void }) {
  const lvl = LEVEL_CONFIG[issue.level];
  const rev = REVIEW_STATUS_CONFIG[issue.reviewStatus];
  const LvlIcon = lvl.icon;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${lvl.bg} ${lvl.color} font-medium`}>
          <LvlIcon className="w-3 h-3" />{lvl.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 font-medium">{issue.type}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${issue.targetType === '实体' ? 'bg-purple-50 text-purple-700' : issue.targetType === '关系' ? 'bg-cyan-50 text-cyan-700' : 'bg-orange-50 text-orange-700'}`}>
          {issue.targetType}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 max-w-[160px] truncate" title={issue.target}>{issue.target}</td>
      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">{issue.description}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-400">{issue.expected}</td>
      <td className="px-4 py-3 text-xs font-mono text-red-500">{issue.actual}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rev.color}`}>{rev.label}</span>
      </td>
      <td className="px-4 py-3">
        {issue.reviewStatus === 'pending' && (
          <div className="flex gap-1">
            <button onClick={() => onReview(issue.id, 'approved')}
              className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors">通过</button>
            <button onClick={() => onReview(issue.id, 'rejected')}
              className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100 transition-colors">忽略</button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function DataConsistencyScan({
  onNavigateTo,
  pageTitle = '数据一致性自动扫描',
  pageDescription = '提供后台任务，能够定期或按需扫描全图数据，寻找不一致、不规范的数据，如属性值超出范围、关系不符合定义。',
}: {
  onNavigateTo?: (page: string) => void;
  pageTitle?: string;
  pageDescription?: string;
}) {
  const [tasks, setTasks] = useState<ScanTask[]>(MOCK_TASKS);
  const [showModal, setShowModal] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>('scan-20260731-001');
  const [filterStatus, setFilterStatus] = useState<ScanStatus | 'all'>('all');
  const [filterLevel, setFilterLevel] = useState<IssueLevel | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleSubmit = (partial: Partial<ScanTask>) => {
    setTasks(prev => [partial as ScanTask, ...prev]);
  };

  const handleReview = (taskId: string, issueId: string, status: IssueStatus) => {
    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t,
      issues: t.issues.map(i => i.id !== issueId ? i : { ...i, reviewStatus: status }),
    }));
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const totalPending = tasks.reduce((sum, t) => sum + t.issues.filter(i => i.reviewStatus === 'pending').length, 0);
  const totalErrors = tasks.reduce((sum, t) => sum + t.errorCount, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {showModal && <SubmitModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {pageDescription}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totalPending > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span>{totalPending} 个问题待审核</span>
              </div>
            )}
            <button onClick={handleRefresh}
              className="text-sm px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />刷新
            </button>
            <button onClick={() => setShowModal(true)}
              className="text-sm px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5">
              <Play className="w-4 h-4" />提交扫描任务
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          {[
            { label: '扫描任务总数', value: tasks.length, color: 'text-gray-700' },
            { label: '运行中', value: tasks.filter(t => t.status === 'running').length, color: 'text-blue-600' },
            { label: '已完成', value: tasks.filter(t => t.status === 'completed').length, color: 'text-green-600' },
            { label: '错误问题', value: totalErrors, color: 'text-red-600' },
            { label: '待人工审核', value: totalPending, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">状态筛选：</span>
          {(['all', 'queued', 'running', 'completed', 'failed'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
              {s === 'all' ? '全部' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
            <ClipboardCheck className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">扫描任务列表</span>
            <span className="text-xs text-gray-400">点击展开查看问题详情与审核操作</span>
          </div>

          {/* Table header */}
          <div className="grid px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500"
            style={{ gridTemplateColumns: '1.8fr 0.9fr 0.8fr 0.8fr 1fr 1fr 1fr 0.7fr 1.4fr' }}>
            <div>图谱 / 任务ID</div>
            <div>扫描范围</div>
            <div>执行方式</div>
            <div>状态</div>
            <div>进度</div>
            <div>扫描量（节点/关系）</div>
            <div>问题（错误/警告/提示）</div>
            <div>提交人</div>
            <div>时间</div>
          </div>

          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <ScanLine className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">暂无扫描任务，点击右上角"提交扫描任务"开始。</p>
            </div>
          )}

          {filteredTasks.map(task => {
            const sc = STATUS_CONFIG[task.status];
            const StatusIcon = sc.icon;
            const isExpanded = expandedTaskId === task.id;
            const pendingIssues = task.issues.filter(i => i.reviewStatus === 'pending');

            const filteredIssues = filterLevel === 'all'
              ? task.issues
              : task.issues.filter(i => i.level === filterLevel);

            return (
              <div key={task.id} className="border-b border-gray-100 last:border-b-0">
                {/* Row */}
                <div
                  className="grid px-5 py-4 items-center hover:bg-gray-50/60 transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: '1.8fr 0.9fr 0.8fr 0.8fr 1fr 1fr 1fr 0.7fr 1.4fr' }}
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-gray-900 text-sm">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                      {task.graphName}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 ml-5 font-mono">{task.id}</div>
                  </div>

                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                      {SCOPE_LABELS[task.scope]}
                    </span>
                  </div>

                  <div>
                    {task.scheduledType === 'scheduled' ? (
                      <span className="flex items-center gap-1 text-xs text-purple-600">
                        <Calendar className="w-3 h-3" />定时
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Zap className="w-3 h-3" />手动
                      </span>
                    )}
                    {task.scheduleExpr && (
                      <div className="text-xs font-mono text-gray-400 mt-0.5">{task.scheduleExpr}</div>
                    )}
                  </div>

                  <div>
                    <span className={`flex items-center gap-1.5 text-xs ${sc.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.animate ? 'animate-pulse' : ''}`} />
                      {sc.label}
                    </span>
                  </div>

                  <div onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-600">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${task.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${task.progress}%` }} />
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    {task.scannedNodes.toLocaleString()} / {task.scannedRelations.toLocaleString()}
                  </div>

                  <div className="flex items-center gap-2">
                    {task.issueCount > 0 ? (
                      <>
                        <span className="text-xs text-red-600 font-semibold">{task.errorCount}错</span>
                        <span className="text-xs text-amber-600">{task.warnCount}警</span>
                        <span className="text-xs text-blue-600">{task.issueCount - task.errorCount - task.warnCount}提</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">{task.status === 'completed' ? '无问题' : '—'}</span>
                    )}
                    {pendingIssues.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        {pendingIssues.length}待审
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">{task.submittedBy}</div>

                  <div className="text-xs text-gray-400 space-y-0.5">
                    <div>提交 {task.submittedAt}</div>
                    {task.finishedAt && <div>完成 {task.finishedAt}</div>}
                  </div>
                </div>

                {/* Expanded issues panel */}
                {isExpanded && task.issues.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">扫描问题详情</span>
                      <div className="flex gap-1 ml-auto">
                        {(['all', 'error', 'warning', 'info'] as const).map(l => (
                          <button key={l} onClick={() => setFilterLevel(l)}
                            className={`text-xs px-2.5 py-0.5 rounded-full transition-colors ${filterLevel === l ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                            {l === 'all' ? '全部' : LEVEL_CONFIG[l].label}
                          </button>
                        ))}
                      </div>
                      {pendingIssues.length > 0 && (
                        <button onClick={() => onNavigateTo?.('validation-report')}
                          className="text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1.5">
                          <Eye className="w-3 h-3" />转人工审核（{pendingIssues.length}）
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[1000px]">
                        <thead className="bg-white border-b border-gray-100">
                          <tr>
                            {['级别', '问题类型', '目标类型', '目标标识', '描述', '期望值', '实际值', '审核状态', '操作'].map(h => (
                              <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredIssues.map(issue => (
                            <IssueRow key={issue.id} issue={issue}
                              onReview={(iid, s) => handleReview(task.id, iid, s)} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isExpanded && task.issues.length === 0 && task.status === 'completed' && (
                  <div className="flex items-center gap-2 px-6 py-4 bg-green-50 border-t border-green-100 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4" />本次扫描未发现数据一致性问题
                  </div>
                )}

                {isExpanded && task.status === 'running' && (
                  <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                      <ScanLine className="w-4 h-4 animate-pulse" />扫描进行中，已处理 {task.scannedNodes.toLocaleString()} 个节点…
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-300 space-y-1">
                      <div><span className="text-gray-500">11:20:01</span> <span className="text-green-400">INFO</span> 开始属性一致性扫描任务…</div>
                      <div><span className="text-gray-500">11:20:03</span> <span className="text-green-400">INFO</span> 加载本体规则 42 条…</div>
                      <div><span className="text-gray-500">11:20:05</span> <span className="text-green-400">INFO</span> 已扫描节点 8,920 / 约 20,000</div>
                      <div><span className="text-gray-500">11:20:08</span> <span className="text-blue-400">INFO</span> 校验属性值范围、枚举约束中…</div>
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
