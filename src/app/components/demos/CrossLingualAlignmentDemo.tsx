import { useState } from 'react';
import {
  Play, Plus, Pause, RotateCcw, Download, Search,
  CheckCircle, XCircle, Clock, Loader2, Globe, Database,
  ChevronDown, Filter, ArrowRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed';
type AlignStrategy = 'translation' | 'embedding' | 'structure' | 'hybrid';
type AlignType = 'sameAs' | 'closeMatch' | 'relatedMatch';
type VerifyStatus = 'unverified' | 'verified' | 'rejected';

interface AlignTask {
  id: string;
  name: string;
  srcLang: string;
  tgtLang: string;
  strategy: AlignStrategy;
  threshold: number;
  totalEntities: number;
  processed: number;
  aligned: number;
  status: TaskStatus;
  createdAt: string;
  finishedAt?: string;
}

interface AlignResult {
  id: string;
  taskId: string;
  srcEntity: string;
  srcLang: string;
  srcType: string;
  tgtEntity: string;
  tgtLang: string;
  tgtType: string;
  alignType: AlignType;
  confidence: number;
  verifyStatus: VerifyStatus;
  strategy: AlignStrategy;
  createdAt: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const LANG_OPTIONS = ['中文', '英文', '日文', '韩文', '法文', '德文'];
const STRATEGY_LABELS: Record<AlignStrategy, string> = {
  translation: '翻译增强',
  embedding: '嵌入空间对齐',
  structure: '结构相似度',
  hybrid: '混合策略',
};
const STRATEGY_COLORS: Record<AlignStrategy, string> = {
  translation: 'bg-blue-50 text-blue-700 border-blue-200',
  embedding: 'bg-purple-50 text-purple-700 border-purple-200',
  structure: 'bg-green-50 text-green-700 border-green-200',
  hybrid: 'bg-orange-50 text-orange-700 border-orange-200',
};

const INITIAL_TASKS: AlignTask[] = [
  {
    id: 'T001', name: 'DBpedia 中英全量对齐', srcLang: '中文', tgtLang: '英文',
    strategy: 'hybrid', threshold: 0.80, totalEntities: 1_280_000,
    processed: 1_280_000, aligned: 986_412, status: 'completed',
    createdAt: '2026-07-20 02:00', finishedAt: '2026-07-20 08:47',
  },
  {
    id: 'T002', name: '科技论文中日实体对齐', srcLang: '中文', tgtLang: '日文',
    strategy: 'embedding', threshold: 0.75, totalEntities: 420_000,
    processed: 312_500, aligned: 218_340, status: 'running',
    createdAt: '2026-07-31 09:00',
  },
  {
    id: 'T003', name: '生物医疗中英关系对齐', srcLang: '中文', tgtLang: '英文',
    strategy: 'translation', threshold: 0.85, totalEntities: 96_000,
    processed: 0, aligned: 0, status: 'queued',
    createdAt: '2026-07-31 11:30',
  },
  {
    id: 'T004', name: '新能源产业中英对齐', srcLang: '中文', tgtLang: '英文',
    strategy: 'hybrid', threshold: 0.78, totalEntities: 56_000,
    processed: 56_000, aligned: 41_882, status: 'completed',
    createdAt: '2026-07-28 14:00', finishedAt: '2026-07-28 15:22',
  },
];

const INITIAL_RESULTS: AlignResult[] = [
  { id: 'R001', taskId: 'T001', srcEntity: '清华大学', srcLang: '中文', srcType: '机构', tgtEntity: 'Tsinghua University', tgtLang: '英文', tgtType: 'Organization', alignType: 'sameAs', confidence: 0.98, verifyStatus: 'verified', strategy: 'hybrid', createdAt: '2026-07-20 08:47' },
  { id: 'R002', taskId: 'T001', srcEntity: '深度学习', srcLang: '中文', srcType: '概念', tgtEntity: 'Deep Learning', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.97, verifyStatus: 'verified', strategy: 'hybrid', createdAt: '2026-07-20 08:47' },
  { id: 'R003', taskId: 'T001', srcEntity: '李彦宏', srcLang: '中文', srcType: '人物', tgtEntity: 'Robin Li', tgtLang: '英文', tgtType: 'Person', alignType: 'sameAs', confidence: 0.95, verifyStatus: 'verified', strategy: 'hybrid', createdAt: '2026-07-20 08:47' },
  { id: 'R004', taskId: 'T001', srcEntity: '图神经网络', srcLang: '中文', srcType: '概念', tgtEntity: 'Graph Neural Network', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.96, verifyStatus: 'unverified', strategy: 'hybrid', createdAt: '2026-07-20 08:47' },
  { id: 'R005', taskId: 'T001', srcEntity: '卷积神经网络', srcLang: '中文', srcType: '概念', tgtEntity: 'Convolutional Neural Network', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.99, verifyStatus: 'verified', strategy: 'translation', createdAt: '2026-07-20 08:47' },
  { id: 'R006', taskId: 'T001', srcEntity: '量子纠缠', srcLang: '中文', srcType: '概念', tgtEntity: 'Quantum entanglement', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.93, verifyStatus: 'unverified', strategy: 'embedding', createdAt: '2026-07-20 08:47' },
  { id: 'R007', taskId: 'T004', srcEntity: '锂离子电池', srcLang: '中文', srcType: '概念', tgtEntity: 'Lithium-ion battery', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.97, verifyStatus: 'verified', strategy: 'hybrid', createdAt: '2026-07-28 15:22' },
  { id: 'R008', taskId: 'T004', srcEntity: '太阳能发电', srcLang: '中文', srcType: '概念', tgtEntity: 'Solar power generation', tgtLang: '英文', tgtType: 'Concept', alignType: 'closeMatch', confidence: 0.82, verifyStatus: 'unverified', strategy: 'hybrid', createdAt: '2026-07-28 15:22' },
  { id: 'R009', taskId: 'T001', srcEntity: '人工智能', srcLang: '中文', srcType: '概念', tgtEntity: 'Artificial Intelligence', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.99, verifyStatus: 'verified', strategy: 'translation', createdAt: '2026-07-20 08:47' },
  { id: 'R010', taskId: 'T001', srcEntity: '强化学习奖励塑造', srcLang: '中文', srcType: '概念', tgtEntity: 'Reward Shaping', tgtLang: '英文', tgtType: 'Concept', alignType: 'closeMatch', confidence: 0.78, verifyStatus: 'unverified', strategy: 'embedding', createdAt: '2026-07-20 08:47' },
  { id: 'R011', taskId: 'T004', srcEntity: '储能系统', srcLang: '中文', srcType: '概念', tgtEntity: 'Energy Storage System', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.91, verifyStatus: 'verified', strategy: 'hybrid', createdAt: '2026-07-28 15:22' },
  { id: 'R012', taskId: 'T001', srcEntity: '联邦学习', srcLang: '中文', srcType: '概念', tgtEntity: 'Federated Learning', tgtLang: '英文', tgtType: 'Concept', alignType: 'sameAs', confidence: 0.96, verifyStatus: 'rejected', strategy: 'hybrid', createdAt: '2026-07-20 08:47' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dot: string; animate: boolean }> = {
  queued:    { label: '排队中', color: 'text-gray-500',  dot: 'bg-gray-400',  animate: false },
  running:   { label: '运行中', color: 'text-blue-600',  dot: 'bg-blue-500',  animate: true  },
  paused:    { label: '已暂停', color: 'text-amber-600', dot: 'bg-amber-400', animate: false },
  completed: { label: '已完成', color: 'text-green-600', dot: 'bg-green-500', animate: false },
  failed:    { label: '失败',   color: 'text-red-600',   dot: 'bg-red-500',   animate: false },
};

const ALIGN_TYPE_CONFIG: Record<AlignType, { label: string; color: string }> = {
  sameAs:       { label: '等价 (sameAs)',    color: 'bg-green-50 text-green-700 border-green-200' },
  closeMatch:   { label: '近似 (closeMatch)', color: 'bg-blue-50 text-blue-700 border-blue-200'   },
  relatedMatch: { label: '关联 (relatedMatch)', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const VERIFY_CONFIG: Record<VerifyStatus, { label: string; color: string }> = {
  unverified: { label: '待验证', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  verified:   { label: '已验证', color: 'bg-green-50 text-green-600 border-green-200' },
  rejected:   { label: '已拒绝', color: 'bg-red-50 text-red-500 border-red-200'       },
};

function fmt(n: number) { return n.toLocaleString('zh-CN'); }

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateTaskModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (t: AlignTask) => void;
}) {
  const [name, setName]         = useState('');
  const [srcLang, setSrcLang]   = useState('中文');
  const [tgtLang, setTgtLang]   = useState('英文');
  const [strategy, setStrategy] = useState<AlignStrategy>('hybrid');
  const [threshold, setThreshold] = useState(0.80);
  const [batchSize, setBatchSize] = useState(10000);

  const handleCreate = () => {
    if (!name.trim() || srcLang === tgtLang) return;
    const est = Math.round(batchSize * (Math.random() * 8 + 12));
    onCreate({
      id: `T${String(Date.now()).slice(-4)}`,
      name: name.trim(), srcLang, tgtLang, strategy, threshold,
      totalEntities: est, processed: 0, aligned: 0,
      status: 'queued',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">新建对齐任务</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">任务名称</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="如：DBpedia 中英实体对齐 v2"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">源语言知识库</label>
              <select value={srcLang} onChange={e => setSrcLang(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {LANG_OPTIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">目标语言知识库</label>
              <select value={tgtLang} onChange={e => setTgtLang(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {LANG_OPTIONS.map(l => <option key={l}>{l}</option>)}
              </select>
              {srcLang === tgtLang && <p className="text-xs text-red-500 mt-1">源语言与目标语言不能相同</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">对齐策略</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(STRATEGY_LABELS) as AlignStrategy[]).map(s => (
                <button key={s} onClick={() => setStrategy(s)}
                  className={`text-xs px-2 py-2 rounded-lg border transition-colors ${strategy === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  {STRATEGY_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              {strategy === 'translation' && '利用多语言翻译接口对实体名称进行语义对齐，适合命名规范的实体'}
              {strategy === 'embedding' && '将不同语言实体投影到统一嵌入空间，通过向量相似度对齐，适合短文本实体'}
              {strategy === 'structure' && '基于邻居节点和关系路径的结构相似度进行对齐，适合图结构丰富的知识库'}
              {strategy === 'hybrid' && '综合翻译、嵌入和结构三种策略加权融合，精度最高，推荐用于大规模批量任务'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                置信度阈值：<span className="text-blue-600 font-mono">{threshold.toFixed(2)}</span>
              </label>
              <input type="range" min={0.5} max={0.99} step={0.01} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full accent-blue-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>0.50</span><span>0.99</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">预估实体数（万）</label>
              <input type="number" min={1} max={1000} value={Math.round(batchSize / 10000)}
                onChange={e => setBatchSize(Number(e.target.value) * 10000)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
            <div className="font-medium mb-1">预估指标（混合策略）</div>
            <div className="grid grid-cols-3 gap-2">
              <div>对齐率 ~{Math.round((0.72 + threshold * 0.1) * 100)}%</div>
              <div>预计耗时 ~{Math.round(batchSize / 10000 * 2.3)}min</div>
              <div>存储容量 ~{Math.round(batchSize * 0.78 * 0.12 / 1000)}MB</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">取消</button>
          <button onClick={handleCreate} disabled={!name.trim() || srcLang === tgtLang}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" />提交任务
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo ────────────────────────────────────────────────────────────────

export function CrossLingualAlignmentDemo() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'results'>('tasks');
  const [tasks, setTasks] = useState<AlignTask[]>(INITIAL_TASKS);
  const [results, setResults] = useState<AlignResult[]>(INITIAL_RESULTS);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // task filters
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | 'all'>('all');

  // result filters
  const [resultSearch, setResultSearch] = useState('');
  const [resultAlignType, setResultAlignType] = useState<AlignType | 'all'>('all');
  const [resultVerify, setResultVerify] = useState<VerifyStatus | 'all'>('all');
  const [resultStrategy, setResultStrategy] = useState<AlignStrategy | 'all'>('all');

  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.status === 'running') return { ...t, status: 'paused' as TaskStatus };
      if (t.status === 'paused') return { ...t, status: 'running' as TaskStatus };
      return t;
    }));
  };

  const handleVerify = (id: string, s: VerifyStatus) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, verifyStatus: s } : r));
  };

  const filteredTasks = tasks.filter(t => taskStatusFilter === 'all' || t.status === taskStatusFilter);

  const filteredResults = results.filter(r => {
    if (resultSearch && !r.srcEntity.includes(resultSearch) && !r.tgtEntity.toLowerCase().includes(resultSearch.toLowerCase())) return false;
    if (resultAlignType !== 'all' && r.alignType !== resultAlignType) return false;
    if (resultVerify !== 'all' && r.verifyStatus !== resultVerify) return false;
    if (resultStrategy !== 'all' && r.strategy !== resultStrategy) return false;
    return true;
  });

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalAligned = tasks.reduce((s, t) => s + t.aligned, 0);
  const verifiedCount = results.filter(r => r.verifyStatus === 'verified').length;

  return (
    <div className="space-y-4">
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={t => setTasks(prev => [t, ...prev])}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '任务总数', value: tasks.length, sub: `${completedTasks} 已完成`, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: '总对齐实体对', value: fmt(totalAligned), sub: '跨所有任务', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '存储结果条数', value: fmt(results.length), sub: `${verifiedCount} 已验证`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: '平均置信度', value: (results.reduce((s, r) => s + r.confidence, 0) / results.length).toFixed(2), sub: '当前结果集', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 border border-gray-100`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'tasks' as const, label: '批量对齐任务管理', icon: <Play className="w-3.5 h-3.5" /> },
          { id: 'results' as const, label: '对齐结果存储', icon: <Database className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tasks tab ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['all', 'queued', 'running', 'paused', 'completed', 'failed'] as const).map(s => (
                <button key={s} onClick={() => setTaskStatusFilter(s)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${taskStatusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s === 'all' ? '全部' : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />新建对齐任务
            </button>
          </div>

          {/* Task list */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 1fr 1.5fr' }}>
              <div>任务名称</div><div>语言对</div><div>策略</div><div>状态</div>
              <div>进度</div><div>对齐率</div><div>操作</div>
            </div>

            {filteredTasks.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-sm">暂无任务，点击右上角新建</div>
            )}

            {filteredTasks.map(t => {
              const sc = STATUS_CONFIG[t.status];
              const pct = t.totalEntities > 0 ? Math.round(t.processed / t.totalEntities * 100) : 0;
              const alignRate = t.processed > 0 ? (t.aligned / t.processed * 100).toFixed(1) : '—';

              return (
                <div key={t.id} className="grid px-4 py-3.5 items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 1fr 1.5fr' }}>

                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">{t.id} · 创建 {t.createdAt}</div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Globe className="w-3 h-3 text-gray-400" />
                    {t.srcLang} <ArrowRight className="w-3 h-3 text-gray-300" /> {t.tgtLang}
                  </div>

                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STRATEGY_COLORS[t.strategy]}`}>
                      {STRATEGY_LABELS[t.strategy]}
                    </span>
                  </div>

                  <div>
                    <span className={`flex items-center gap-1.5 text-xs ${sc.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${sc.animate ? 'animate-pulse' : ''}`} />
                      {sc.label}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-gray-500">{pct}%</span>
                      <span className="text-xs text-gray-400">{fmt(t.processed)}/{fmt(t.totalEntities)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${t.status === 'failed' ? 'bg-red-400' : t.status === 'paused' ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    {t.status === 'completed' || t.processed > 0
                      ? <><span className="font-semibold text-green-600">{alignRate}%</span><span className="text-gray-400 ml-1">({fmt(t.aligned)})</span></>
                      : <span className="text-gray-300">—</span>}
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    {(t.status === 'running' || t.status === 'paused') && (
                      <button onClick={() => handleToggleTask(t.id)}
                        className={`text-xs px-2.5 py-1 border rounded-lg transition-colors flex items-center gap-1 ${t.status === 'running' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                        {t.status === 'running' ? <><Pause className="w-3 h-3" />暂停</> : <><Play className="w-3 h-3" />恢复</>}
                      </button>
                    )}
                    {t.status === 'failed' && (
                      <button className="text-xs px-2.5 py-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />重试
                      </button>
                    )}
                    {t.status === 'completed' && (
                      <button onClick={() => setActiveTab('results')}
                        className="text-xs px-2.5 py-1 border border-green-200 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        查看结果
                      </button>
                    )}
                    {t.status === 'completed' && (
                      <button className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1">
                        <Download className="w-3 h-3" />导出
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Results tab ── */}
      {activeTab === 'results' && (
        <div className="space-y-3">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={resultSearch} onChange={e => setResultSearch(e.target.value)}
                placeholder="搜索实体名称…"
                className="border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-44" />
            </div>
            <select value={resultAlignType} onChange={e => setResultAlignType(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="all">对齐类型</option>
              <option value="sameAs">等价 (sameAs)</option>
              <option value="closeMatch">近似 (closeMatch)</option>
              <option value="relatedMatch">关联 (relatedMatch)</option>
            </select>
            <select value={resultStrategy} onChange={e => setResultStrategy(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="all">对齐策略</option>
              {(Object.keys(STRATEGY_LABELS) as AlignStrategy[]).map(s => (
                <option key={s} value={s}>{STRATEGY_LABELS[s]}</option>
              ))}
            </select>
            <select value={resultVerify} onChange={e => setResultVerify(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="all">验证状态</option>
              <option value="unverified">待验证</option>
              <option value="verified">已验证</option>
              <option value="rejected">已拒绝</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">共 {filteredResults.length} 条</span>
            <button className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" />导出
            </button>
          </div>

          {/* Export format hint */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>支持导出格式：</span>
            {['N-Triples (.nt)', 'CSV', 'JSON-LD'].map(f => (
              <span key={f} className="px-2 py-0.5 bg-gray-100 rounded text-gray-500">{f}</span>
            ))}
          </div>

          {/* Results table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['源实体（语言·类型）', '', '目标实体（语言·类型）', '对齐类型', '置信度', '策略', '验证状态', '操作'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResults.map(r => {
                  const atc = ALIGN_TYPE_CONFIG[r.alignType];
                  const vc = VERIFY_CONFIG[r.verifyStatus];
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${r.verifyStatus === 'rejected' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.srcEntity}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.srcLang} · {r.srcType}</div>
                      </td>
                      <td className="px-2 py-3 text-gray-300">
                        <ArrowRight className="w-4 h-4" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.tgtEntity}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{r.tgtLang} · {r.tgtType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${atc.color}`}>{atc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{ width: `${r.confidence * 100}%`, backgroundColor: r.confidence >= 0.9 ? '#16a34a' : r.confidence >= 0.8 ? '#2563eb' : '#d97706' }} />
                          </div>
                          <span className="text-xs font-mono text-gray-700">{(r.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${STRATEGY_COLORS[r.strategy]}`}>{STRATEGY_LABELS[r.strategy]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${vc.color}`}>{vc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.verifyStatus === 'unverified' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleVerify(r.id, 'verified')}
                              className="p-1 text-gray-400 hover:text-green-500 transition-colors" title="验证通过">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleVerify(r.id, 'rejected')}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="拒绝">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
