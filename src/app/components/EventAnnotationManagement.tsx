import { useState, useEffect } from 'react';
import {
  Plus, Play, Users, BarChart3, CheckCircle2, Loader2, RefreshCw,
  Upload, FileText, Database, ChevronRight,
} from 'lucide-react';

export type EventAnnotationMgmtTab = 'projects' | 'training';

/** 待标注事件固定格式（JSONL 每行一条） */
interface PendingEvent {
  event_id: string;
  doc_id: string;
  text: string;
  status: 'pending' | 'annotated';
  annotation?: {
    event_type: string;
    trigger: string;
    arguments: Record<string, string>;
  };
}

interface AnnProject {
  id: string;
  name: string;
  assignees: string[];
  events: PendingEvent[];
  status: '待分配' | '进行中' | '已完成';
  createdAt: string;
  datasetId?: string;
}

const EVENT_FORMAT_SAMPLE = `{"event_id":"evt-001","doc_id":"doc-001","text":"2024年3月，该公司完成了A轮融资，融资金额5000万元。"}
{"event_id":"evt-002","doc_id":"doc-001","text":"融资完成后，团队规模迅速扩张，并于同年6月正式发布了首款产品。"}
{"event_id":"evt-003","doc_id":"doc-002","text":"产品发布后的两个月内，用户数量突破了百万大关。"}`;

const SAMPLE_EVENTS: PendingEvent[] = [
  { event_id: 'evt-001', doc_id: 'doc-001', text: '2024年3月，该公司完成了A轮融资，融资金额5000万元。', status: 'annotated', annotation: { event_type: '投融资', trigger: '完成', arguments: { 金额: '5000万元', 轮次: 'A轮' } } },
  { event_id: 'evt-002', doc_id: 'doc-001', text: '融资完成后，团队规模迅速扩张，并于同年6月正式发布了首款产品。', status: 'annotated', annotation: { event_type: '产品发布', trigger: '发布', arguments: { 产品: '首款产品' } } },
  { event_id: 'evt-003', doc_id: 'doc-002', text: '产品发布后的两个月内，用户数量突破了百万大关。', status: 'pending' },
  { event_id: 'evt-004', doc_id: 'doc-002', text: 'CEO在发布会上宣布将与三家头部企业达成战略合作。', status: 'pending' },
  { event_id: 'evt-005', doc_id: 'doc-003', text: '公司获得ISO 27001信息安全管理体系认证。', status: 'pending' },
];

const INITIAL_PROJECTS: AnnProject[] = [
  {
    id: 'P001',
    name: '产品发布事件标注',
    assignees: ['张三', '王研'],
    events: SAMPLE_EVENTS.map((e) => ({ ...e })),
    status: '进行中',
    createdAt: '2026-08-20',
    datasetId: 'ds-p001',
  },
  {
    id: 'P002',
    name: '投融资事件标注',
    assignees: ['赵六'],
    events: [
      { event_id: 'evt-101', doc_id: 'doc-010', text: '字节跳动宣布完成新一轮战略融资。', status: 'annotated', annotation: { event_type: '投融资', trigger: '融资', arguments: { 主体: '字节跳动' } } },
      { event_id: 'evt-102', doc_id: 'doc-011', text: '该轮融资由红杉资本领投。', status: 'annotated', annotation: { event_type: '投融资', trigger: '领投', arguments: { 投资方: '红杉资本' } } },
    ],
    status: '已完成',
    createdAt: '2026-08-10',
    datasetId: 'ds-p002',
  },
];

const TRAINERS = ['张三', '王研', '赵六', '钱七'];

function parseEventJsonl(raw: string): PendingEvent[] {
  const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean);
  const events: PendingEvent[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.event_id && obj.text) {
        events.push({
          event_id: String(obj.event_id),
          doc_id: String(obj.doc_id ?? 'doc-unknown'),
          text: String(obj.text),
          status: 'pending',
        });
      }
    } catch {
      /* skip invalid lines */
    }
  }
  return events;
}

function projectProgress(p: AnnProject) {
  const done = p.events.filter((e) => e.status === 'annotated').length;
  return { done, total: p.events.length, pct: p.events.length ? Math.round((done / p.events.length) * 100) : 0 };
}

function ProjectsPanel({
  projects,
  setProjects,
  selectedId,
  setSelectedId,
}: {
  projects: AnnProject[];
  setProjects: React.Dispatch<React.SetStateAction<AnnProject[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) {
  const [name, setName] = useState('');
  const [assignees, setAssignees] = useState<string[]>([TRAINERS[0]]);
  const [uploadRaw, setUploadRaw] = useState('');
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState('');

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  const toggleAssignee = (t: string) => {
    setAssignees((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleFileUpload = (file: File) => {
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setUploadRaw(text);
      setParseError('');
    };
    reader.readAsText(file);
  };

  const createProject = () => {
    const events = parseEventJsonl(uploadRaw || EVENT_FORMAT_SAMPLE);
    if (events.length === 0) {
      setParseError('未能解析有效事件，请检查 JSONL 格式（每行需含 event_id、text）');
      return;
    }
    if (!name.trim()) return;
    const id = `P${String(projects.length + 1).padStart(3, '0')}`;
    const project: AnnProject = {
      id,
      name: name.trim(),
      assignees: assignees.length ? assignees : [TRAINERS[0]],
      events,
      status: assignees.length ? '进行中' : '待分配',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects((prev) => [project, ...prev]);
    setSelectedId(id);
    setName('');
    setUploadRaw('');
    setUploadFileName(null);
    setParseError('');
  };

  const simulateAnnotate = (projectId: string, count = 1) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        let remaining = count;
        const events = p.events.map((e) => {
          if (remaining <= 0 || e.status === 'annotated') return e;
          remaining -= 1;
          return {
            ...e,
            status: 'annotated' as const,
            annotation: {
              event_type: '待审核类型',
              trigger: e.text.slice(0, 6),
              arguments: { 来源: e.doc_id },
            },
          };
        });
        const { done, total } = { done: events.filter((e) => e.status === 'annotated').length, total: events.length };
        const status = done >= total ? '已完成' : p.status === '待分配' ? '进行中' : p.status;
        const datasetId = done >= total ? `ds-${p.id.toLowerCase()}` : p.datasetId;
        return { ...p, events, status, datasetId };
      }),
    );
  };

  const exportDataset = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, datasetId: p.datasetId ?? `ds-${p.id.toLowerCase()}` };
      }),
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-4">
        {/* 创建项目 + 上传 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="text-sm font-semibold text-gray-800">创建标注项目 · 上传待标注事件</div>

          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1">
            <div className="font-medium text-slate-700">固定格式（JSONL，每行一条）</div>
            <code className="block text-[11px] font-mono whitespace-pre-wrap text-slate-500">
              {`{"event_id":"evt-001","doc_id":"doc-001","text":"事件描述文本…"}`}
            </code>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-5 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30">
            <Upload className="w-6 h-6 text-gray-300" />
            <span className="text-sm text-gray-600">上传待标注事件 JSONL</span>
            <input
              type="file"
              accept=".jsonl,.json,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
          </label>
          {uploadFileName && (
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-blue-500" />
              {uploadFileName}
              <span className="text-xs text-gray-400 ml-auto">
                已解析 {parseEventJsonl(uploadRaw).length} 条
              </span>
            </div>
          )}

          <div>
            <div className="text-xs text-gray-500 mb-1">或使用示例数据</div>
            <textarea
              value={uploadRaw || EVENT_FORMAT_SAMPLE}
              onChange={(e) => { setUploadRaw(e.target.value); setParseError(''); }}
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] font-mono resize-y"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="项目名称"
              className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600 mb-1.5">分配标注员</div>
            <div className="flex flex-wrap gap-1.5">
              {TRAINERS.map((t) => {
                const on = assignees.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleAssignee(t)}
                    className={`text-xs px-2.5 py-1 rounded-md border ${
                      on ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {parseError && <p className="text-xs text-red-600">{parseError}</p>}

          <button
            type="button"
            onClick={createProject}
            disabled={!name.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
          >
            <Plus className="w-4 h-4" />
            创建项目并分配任务
          </button>
        </div>

        {/* 项目列表 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">项目列表与标注进度</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs text-gray-500 px-4 py-2.5">项目</th>
                <th className="text-left text-xs text-gray-500 px-4 py-2.5">标注员</th>
                <th className="text-left text-xs text-gray-500 px-4 py-2.5">进度</th>
                <th className="text-left text-xs text-gray-500 px-4 py-2.5">数据集</th>
                <th className="text-left text-xs text-gray-500 px-4 py-2.5">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((p) => {
                const { done, total, pct } = projectProgress(p);
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer hover:bg-gray-50 ${selectedId === p.id ? 'bg-blue-50/50' : ''}`}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-[11px] text-gray-400">{p.id} · {total} 条事件</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.assignees.join('、')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{done}/{total}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.datasetId && done > 0 ? (
                        <span className="text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                          {p.datasetId}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
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

      {/* 右侧：选中项目详情 */}
      <div className="bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-h-[320px]">
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-800">
          {selected ? selected.name : '选择项目查看事件'}
        </div>
        {selected ? (
          <>
            <div className="px-4 py-2 flex gap-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => simulateAnnotate(selected.id, 1)}
                className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-lg"
              >
                模拟标注 +1
              </button>
              {projectProgress(selected).done > 0 && (
                <button
                  type="button"
                  onClick={() => exportDataset(selected.id)}
                  className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-700 flex items-center gap-1"
                >
                  <Database className="w-3 h-3" />
                  生成训练数据集
                </button>
              )}
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-50 text-xs">
              {selected.events.map((e) => (
                <li key={e.event_id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-[10px] text-gray-400">{e.event_id}</code>
                    <span className={`text-[10px] px-1 py-0.5 rounded ${
                      e.status === 'annotated' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {e.status === 'annotated' ? '已标注' : '待标注'}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{e.text}</p>
                  {e.annotation && (
                    <p className="text-gray-500 mt-1">
                      {e.annotation.event_type} · 触发词「{e.annotation.trigger}」
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {selected.datasetId && projectProgress(selected).done > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-green-700 bg-green-50/50 flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5" />
                已标注 {projectProgress(selected).done} 条可进入「模型训练与迭代」
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-4">
            点击左侧项目查看待标注事件
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingPanel({ projects }: { projects: AnnProject[] }) {
  const datasets = projects.filter((p) => projectProgress(p).done > 0);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    datasets[0]?.datasetId ?? datasets[0]?.id ?? '',
  );
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'train' | 'eval' | 'done'>('idle');
  const [version, setVersion] = useState('v1.2.0');

  const selectedProject = datasets.find((p) => (p.datasetId ?? p.id) === selectedDatasetId) ?? datasets[0];
  const annotatedCount = selectedProject ? projectProgress(selectedProject).done : 0;

  useEffect(() => {
    if (datasets.length && !datasets.some((p) => (p.datasetId ?? p.id) === selectedDatasetId)) {
      setSelectedDatasetId(datasets[0].datasetId ?? datasets[0].id);
    }
  }, [datasets, selectedDatasetId]);

  const start = () => {
    if (!selectedProject || annotatedCount === 0) return;
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
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/events/models:train</code>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            训练数据集（来自标注项目）
          </label>
          {datasets.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              暂无可用数据集，请先在「事件标注项目管理」中上传事件并完成标注
            </p>
          ) : (
            <select
              value={selectedDatasetId}
              onChange={(e) => { setSelectedDatasetId(e.target.value); setPhase('idle'); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {datasets.map((p) => {
                const { done } = projectProgress(p);
                return (
                  <option key={p.id} value={p.datasetId ?? p.id}>
                    {p.name} · 已标注 {done} 条 · {p.datasetId ?? p.id}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {selectedProject && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            数据集含 {annotatedCount} 条标注样本，事件类型覆盖投融资、产品发布等；
            标注员：{selectedProject.assignees.join('、')}
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>当前模型版本：</span>
          <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{version}</code>
        </div>

        <button
          type="button"
          onClick={start}
          disabled={running || datasets.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '训练 / 评估中…' : '一键启动训练、评估与版本迭代'}
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
              模型训练（基于 {annotatedCount} 条标注数据）
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
              · 训练集 {annotatedCount} 条
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
  const [projects, setProjects] = useState<AnnProject[]>(() =>
    INITIAL_PROJECTS.map((p) => ({ ...p, events: p.events.map((e) => ({ ...e })) })),
  );
  const [selectedId, setSelectedId] = useState<string | null>('P001');

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
              ? '基于标注项目产出的数据集，一键启动模型训练、评估与版本迭代'
              : '上传固定格式待标注事件，分配标注任务，统计进度并生成训练数据集'}
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

      {tab === 'projects' ? (
        <ProjectsPanel
          projects={projects}
          setProjects={setProjects}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ) : (
        <TrainingPanel projects={projects} />
      )}
    </div>
  );
}
