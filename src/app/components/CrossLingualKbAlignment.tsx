import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, XCircle, Plus, Terminal, Database, CheckCircle2,
  Clock, Loader2, HardDrive, Layers, FileJson,
} from 'lucide-react';

type Tab = 'tasks' | 'storage';
type TaskStatus = 'idle' | 'running' | 'paused' | 'cancelled' | 'completed';

interface AlignPair {
  zh: string;
  en: string;
  type?: string;
}

interface AlignTask {
  id: string;
  name: string;
  pairs: AlignPair[];
  status: TaskStatus;
  progress: number;
  aligned: number;
  createdAt: string;
  finishedAt?: string;
  stored: boolean;
}

const SAMPLE_JSON = `[
  { "zh": "清华大学", "en": "Tsinghua University", "type": "机构" },
  { "zh": "北京大学", "en": "Peking University", "type": "机构" },
  { "zh": "深度学习", "en": "Deep Learning", "type": "概念" },
  { "zh": "卷积神经网络", "en": "Convolutional Neural Network", "type": "概念" },
  { "zh": "图神经网络", "en": "Graph Neural Network", "type": "概念" },
  { "zh": "联邦学习", "en": "Federated Learning", "type": "概念" }
]`;

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  idle: { label: '待执行', color: 'text-gray-600', bg: 'bg-gray-100' },
  running: { label: '运行中', color: 'text-blue-700', bg: 'bg-blue-50' },
  paused: { label: '已暂停', color: 'text-amber-700', bg: 'bg-amber-50' },
  cancelled: { label: '已取消', color: 'text-red-600', bg: 'bg-red-50' },
  completed: { label: '已完成', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

function nowStr() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}

function parseBatchJson(raw: string): { ok: true; pairs: AlignPair[] } | { ok: false; error: string } {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return { ok: false, error: 'JSON 根节点必须是数组' };
    if (data.length === 0) return { ok: false, error: '数组不能为空' };
    const pairs: AlignPair[] = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item || typeof item !== 'object') return { ok: false, error: `第 ${i + 1} 条不是对象` };
      const zh = String(item.zh ?? item.source ?? '').trim();
      const en = String(item.en ?? item.target ?? '').trim();
      if (!zh || !en) return { ok: false, error: `第 ${i + 1} 条缺少 zh/en 字段` };
      pairs.push({ zh, en, type: item.type ? String(item.type) : undefined });
    }
    return { ok: true, pairs };
  } catch {
    return { ok: false, error: 'JSON 解析失败，请检查格式' };
  }
}

export type CrossLingualKbFocus = 'tasks' | 'storage';

export default function CrossLingualKbAlignment({
  initialFocus,
}: {
  initialFocus?: CrossLingualKbFocus | null;
}) {
  const [tab, setTab] = useState<Tab>(initialFocus ?? 'tasks');

  const [taskName, setTaskName] = useState('中英实体批量对齐');
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<AlignTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${nowStr()}] ${msg}`]);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const createTask = () => {
    const parsed = parseBatchJson(jsonInput);
    if (!parsed.ok) {
      setParseError(parsed.error);
      return;
    }
    clearTimer();
    setParseError(null);
    const id = `BAT-${Date.now().toString(36).toUpperCase()}`;
    const task: AlignTask = {
      id,
      name: taskName.trim() || '未命名对齐任务',
      pairs: parsed.pairs,
      status: 'idle',
      progress: 0,
      aligned: 0,
      createdAt: nowStr(),
      stored: false,
    };
    setTasks((prev) => [task, ...prev]);
    setSelectedId(id);
    setLogs([]);
    appendLog(`任务已创建：${task.name}（${parsed.pairs.length} 条待对齐）`);
  };

  const runTaskTick = (taskId: string) => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task || task.status !== 'running') {
          clearTimer();
          return prev;
        }
        const step = Math.max(1, Math.ceil(task.pairs.length / 8));
        const nextAligned = Math.min(task.pairs.length, task.aligned + step);
        const nextProgress = Math.round((nextAligned / task.pairs.length) * 100);
        const done = nextAligned >= task.pairs.length;

        if (done) {
          clearTimer();
          setLogs((prevLogs) => [
            ...prevLogs,
            `[${nowStr()}] 对齐完成：共 ${task.pairs.length} 条`,
            `[${nowStr()}] 正在写入对齐结果库…`,
            `[${nowStr()}] 入库成功：对齐关系已持久化存储`,
          ]);
          return prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  aligned: nextAligned,
                  progress: 100,
                  status: 'completed' as TaskStatus,
                  finishedAt: nowStr(),
                  stored: true,
                }
              : t,
          );
        }

        const pair = task.pairs[nextAligned - 1];
        if (pair) {
          setLogs((prevLogs) => [
            ...prevLogs,
            `[${nowStr()}] 对齐 ${nextAligned}/${task.pairs.length}：${pair.zh} ↔ ${pair.en}`,
          ]);
        }

        return prev.map((t) =>
          t.id === taskId ? { ...t, aligned: nextAligned, progress: nextProgress } : t,
        );
      });
    }, 450);
  };

  const startTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === 'completed' || task.status === 'cancelled') return;
    setSelectedId(taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'running' as TaskStatus } : t)),
    );
    appendLog(task.status === 'paused' ? `任务恢复执行：${task.name}` : `开始执行任务：${task.name}`);
    runTaskTick(taskId);
  };

  const pauseTask = (taskId: string) => {
    clearTimer();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId && t.status === 'running' ? { ...t, status: 'paused' as TaskStatus } : t)),
    );
    appendLog('任务已暂停');
  };

  const cancelTask = (taskId: string) => {
    clearTimer();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId && (t.status === 'running' || t.status === 'paused' || t.status === 'idle')
          ? { ...t, status: 'cancelled' as TaskStatus, finishedAt: nowStr() }
          : t,
      ),
    );
    appendLog('任务已取消');
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">跨语言知识库生成与对齐</h1>
        <p className="text-sm text-gray-400">
          批量对齐任务创建、执行与管理，以及对齐结果持久化存储
        </p>
      </div>

      <div className="flex gap-1 bg-white/10 rounded-lg p-1 max-w-lg flex-shrink-0">
        {([
          ['tasks', '批量对齐任务管理', Layers],
          ['storage', '对齐结果存储', Database],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div className="max-w-5xl space-y-4 pb-8">
          {/* Create */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">创建批量对齐任务</div>
              <p className="text-xs text-gray-500">
                在 JSON 中填写多条跨语言实体对，创建任务后执行，可暂停或取消
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-600">任务名称</span>
              <input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
                placeholder="如：中英实体批量对齐"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5" />
                批量数据（JSON 数组）
              </span>
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setParseError(null);
                }}
                rows={10}
                className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 resize-y"
                spellCheck={false}
              />
            </label>
            {parseError && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{parseError}</div>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setJsonInput(SAMPLE_JSON);
                  setParseError(null);
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                载入示例 JSON
              </button>
              <button
                type="button"
                onClick={createTask}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                创建任务
              </button>
            </div>
          </div>

          {/* Task list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-800">任务列表</span>
              <span className="text-xs text-gray-400 ml-auto">{tasks.length} 个任务</span>
            </div>
            {tasks.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">暂无任务，请先创建批量对齐任务</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tasks.map((t) => {
                  const meta = STATUS_META[t.status];
                  const active = selectedId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`px-4 py-3 space-y-2 cursor-pointer transition-colors ${active ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{t.name}</span>
                        <span className="text-[11px] font-mono text-gray-400">{t.id}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                        {t.stored && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> 已入库
                          </span>
                        )}
                        <span className="ml-auto text-[11px] text-gray-400">{t.pairs.length} 条 · {t.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              t.status === 'cancelled' ? 'bg-red-400' : t.status === 'paused' ? 'bg-amber-400' : t.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] tabular-nums text-gray-500 w-20 text-right">
                          {t.aligned}/{t.pairs.length} ({t.progress}%)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        {(t.status === 'idle' || t.status === 'paused') && (
                          <button
                            type="button"
                            onClick={() => startTask(t.id)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Play className="w-3 h-3" /> {t.status === 'paused' ? '恢复' : '执行'}
                          </button>
                        )}
                        {t.status === 'running' && (
                          <button
                            type="button"
                            onClick={() => pauseTask(t.id)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                          >
                            <Pause className="w-3 h-3" /> 暂停
                          </button>
                        )}
                        {(t.status === 'idle' || t.status === 'running' || t.status === 'paused') && (
                          <button
                            type="button"
                            onClick={() => cancelTask(t.id)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                          >
                            <XCircle className="w-3 h-3" /> 取消
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-800">执行日志</span>
              {selected?.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin ml-1" />}
              {selected && <span className="ml-auto text-[11px] text-gray-400">{selected.id}</span>}
            </div>
            <div className="bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed px-4 py-3 max-h-56 overflow-y-auto min-h-[120px]">
              {logs.length === 0 ? (
                <span className="text-slate-500">创建并执行任务后，日志将在此滚动展示…</span>
              ) : (
                logs.map((line, i) => (
                  <div key={`${i}-${line}`} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'storage' && (
        <div className="max-w-3xl space-y-4 pb-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">对齐结果存储</span>
            </div>
            <div className="p-5 space-y-5 text-sm text-gray-700 leading-relaxed">
              <p>
                批量对齐任务执行完成后，系统会自动将生成的跨语言对齐关系<strong className="font-medium text-gray-900">持久化写入对齐结果库</strong>，
                形成可检索、可复用的多语言知识对齐资产。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: CheckCircle2, title: '自动入库', desc: '任务状态变为「已完成」后立即写入，无需人工导出导入' },
                  { icon: HardDrive, title: '持久化关系', desc: '存储实体对、语言对、对齐类型、置信度与来源任务 ID' },
                  { icon: Clock, title: '可追溯', desc: '保留创建时间与任务上下文，支持按任务回溯对齐结果' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-medium">
                      <Icon className="w-3.5 h-3.5" />
                      {title}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-gray-100 bg-slate-50 px-4 py-3 space-y-2">
                <div className="text-xs font-medium text-gray-800">存储内容概要</div>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                  <li>源实体名称与目标实体名称（跨语言对应关系）</li>
                  <li>对齐关系类型（如 sameAs / closeMatch）与置信度分数</li>
                  <li>所属批量任务 ID，便于任务级管理与审计</li>
                  <li>入库时间戳，支持增量同步与下游图谱融合消费</li>
                </ul>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-800">
                在「批量对齐任务管理」中执行任务至完成后，任务卡片会标记「已入库」，表示对齐关系已成功持久化。
                可在任务列表中查看完成时间与入库状态。
              </div>

              {tasks.some((t) => t.stored) && (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 border-b border-gray-100">
                    本会话已入库任务
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {tasks.filter((t) => t.stored).map((t) => (
                      <li key={t.id} className="px-3 py-2 text-xs flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-medium text-gray-800">{t.name}</span>
                        <span className="text-gray-400 font-mono">{t.id}</span>
                        <span className="ml-auto text-gray-500">{t.aligned} 条关系 · {t.finishedAt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
