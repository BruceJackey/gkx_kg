import { useState, useEffect } from 'react';
import { Plus, Play, Users, BarChart3, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

export type EventAnnotationMgmtTab = 'projects' | 'training';

interface AnnProject {
  id: string;
  name: string;
  assignee: string;
  total: number;
  done: number;
  status: '进行中' | '已完成' | '待分配';
}

const INITIAL_PROJECTS: AnnProject[] = [
  { id: 'P001', name: '产品发布事件标注', assignee: '张三、王研', total: 200, done: 146, status: '进行中' },
  { id: 'P002', name: '投融资事件标注', assignee: '赵六', total: 120, done: 120, status: '已完成' },
  { id: 'P003', name: '会议活动事件标注', assignee: '待分配', total: 80, done: 0, status: '待分配' },
];

const TRAINERS = ['张三', '王研', '赵六', '钱七'];

function ProjectsPanel() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [name, setName] = useState('');
  const [assignee, setAssignee] = useState(TRAINERS[0]);

  const create = () => {
    if (!name.trim()) return;
    const id = `P${String(projects.length + 1).padStart(3, '0')}`;
    setProjects((prev) => [
      ...prev,
      { id, name: name.trim(), assignee, total: 50, done: 0, status: '进行中' },
    ]);
    setName('');
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="text-sm font-semibold text-gray-800">创建标注项目</div>
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="项目名称"
            className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
          >
            {TRAINERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            type="button"
            onClick={create}
            disabled={!name.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
          >
            <Plus className="w-4 h-4" />创建
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">项目列表与进度</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left text-xs text-gray-500 px-4 py-2.5">项目</th>
              <th className="text-left text-xs text-gray-500 px-4 py-2.5">标注员</th>
              <th className="text-left text-xs text-gray-500 px-4 py-2.5">进度</th>
              <th className="text-left text-xs text-gray-500 px-4 py-2.5">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {projects.map((p) => {
              const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{p.name}</div>
                    <div className="text-[11px] text-gray-400">{p.id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.assignee}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{p.done}/{p.total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      p.status === '已完成' ? 'bg-green-50 text-green-700 border-green-200'
                        : p.status === '进行中' ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrainingPanel() {
  const [dataset, setDataset] = useState('P001 · 产品发布事件标注（已标注 146 条）');
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'train' | 'eval' | 'done'>('idle');
  const [version, setVersion] = useState('v1.2.0');

  const start = () => {
    setRunning(true);
    setPhase('train');
    setTimeout(() => setPhase('eval'), 1200);
    setTimeout(() => {
      setPhase('done');
      setRunning(false);
      setVersion((v) => {
        const m = v.match(/v(\d+)\.(\d+)\.(\d+)/);
        if (!m) return 'v1.3.0';
        return `v${m[1]}.${Number(m[2]) + 1}.0`;
      });
    }, 2200);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">训练数据（标注完成的项目）</label>
          <select
            value={dataset}
            onChange={(e) => { setDataset(e.target.value); setPhase('idle'); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
          >
            <option>P001 · 产品发布事件标注（已标注 146 条）</option>
            <option>P002 · 投融资事件标注（已标注 120 条）</option>
          </select>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>当前模型版本：<code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{version}</code></span>
        </div>
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '训练 / 评估中…' : '一键启动训练与迭代'}
        </button>
      </div>

      {phase !== 'idle' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <BarChart3 className="w-4 h-4 text-violet-600" />
            训练与评估进度
          </div>
          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${phase === 'train' || phase === 'eval' || phase === 'done' ? 'text-gray-800' : 'text-gray-400'}`}>
              {phase === 'train' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
              模型训练
            </div>
            <div className={`flex items-center gap-2 ${phase === 'eval' || phase === 'done' ? 'text-gray-800' : 'text-gray-400'}`}>
              {phase === 'eval' ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : phase === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <RefreshCw className="w-3.5 h-3.5" />}
              评估（F1 / Precision / Recall）
            </div>
            <div className={`flex items-center gap-2 ${phase === 'done' ? 'text-gray-800' : 'text-gray-400'}`}>
              {phase === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <RefreshCw className="w-3.5 h-3.5" />}
              版本迭代发布
            </div>
          </div>
          {phase === 'done' && (
            <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              完成 · 新版本 <strong>{version}</strong> 已发布 · F1=0.84 · P=0.86 · R=0.82
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 审计目录专用：事件标注项目管理 / 模型训练与迭代
 */
export default function EventAnnotationManagement({
  initialTab = 'projects',
}: {
  initialTab?: EventAnnotationMgmtTab;
}) {
  const [tab, setTab] = useState<EventAnnotationMgmtTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">
            {tab === 'training' ? '模型训练与迭代' : '事件标注项目管理'}
          </h1>
          <p className="text-sm text-gray-500">
            {tab === 'training'
              ? '基于已标注数据一键启动训练、评估与版本迭代'
              : '创建与管理事件标注项目，分配任务并统计进度'}
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('projects')}
          className={`text-sm px-4 py-2 rounded-lg transition-colors ${tab === 'projects' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          事件标注项目管理
        </button>
        <button
          type="button"
          onClick={() => setTab('training')}
          className={`text-sm px-4 py-2 rounded-lg transition-colors ${tab === 'training' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          模型训练与迭代
        </button>
      </div>

      {tab === 'projects' ? <ProjectsPanel /> : <TrainingPanel />}
    </div>
  );
}
