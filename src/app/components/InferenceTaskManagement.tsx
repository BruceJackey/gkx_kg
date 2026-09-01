import { useState } from 'react';
import { Play, Square, Clock, AlertTriangle, CheckCircle2, Pause } from 'lucide-react';

type TaskStatus = 'idle' | 'running' | 'stopped' | 'completed' | 'scheduled';

interface InferenceTask {
  id: string;
  name: string;
  status: TaskStatus;
  schedule: string;
  ruleIds: string[];
  createdAt: string;
  lastRunAt?: string;
  problemCount?: number;
}

interface ProblemTriple {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  ruleId: string;
  ruleName: string;
  issue: string;
}

const AVAILABLE_RULES = [
  { id: 'R001', name: '人物实体质量检测' },
  { id: 'R010', name: '必填属性非空约束' },
  { id: 'R030', name: '三元组完整性校验' },
  { id: 'R031', name: '类型约束违规检测' },
  { id: 'R032', name: '矛盾事实冲突检测' },
];

const TRIPLES_SAMPLE = [
  { subject: '作者:张三', predicate: '就职于', object: '机构:清华大学' },
  { subject: '作者:张三', predicate: '就职于', object: '机构:北京大学' },
  { subject: '论文:深度学习新进展', predicate: '发表年份', object: '1899' },
  { subject: '作者:李四', predicate: 'WRITTEN_BY', object: '论文:深度学习新进展' },
  { subject: '作者:王五', predicate: '合作者', object: '' },
  { subject: '机构:清华大学', predicate: '位于', object: '地点:北京' },
];

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  idle: { label: '待运行', className: 'bg-gray-100 text-gray-600' },
  running: { label: '运行中', className: 'bg-blue-100 text-blue-700' },
  stopped: { label: '已停止', className: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  scheduled: { label: '已调度', className: 'bg-violet-100 text-violet-700' },
};

/**
 * 审计目录专用：推理任务管理
 * 输入图谱三元组，按配置规则推理是否存在问题三元组；支持启停与调度
 */
export default function InferenceTaskManagement() {
  const [tasks, setTasks] = useState<InferenceTask[]>([
    {
      id: 'task-001',
      name: '科研图谱质量巡检',
      status: 'idle',
      schedule: '手动',
      ruleIds: ['R030', 'R031', 'R032'],
      createdAt: '2026-08-28T10:00:00.000Z',
    },
    {
      id: 'task-002',
      name: '合著关系矛盾扫描',
      status: 'scheduled',
      schedule: '每日 02:00',
      ruleIds: ['R032', 'R001'],
      createdAt: '2026-08-29T08:00:00.000Z',
    },
  ]);
  const [activeId, setActiveId] = useState('task-001');
  const [triplesJson, setTriplesJson] = useState(JSON.stringify(TRIPLES_SAMPLE, null, 2));
  const [selectedRules, setSelectedRules] = useState<string[]>(['R030', 'R031', 'R032']);
  const [scheduleHint, setScheduleHint] = useState('手动');
  const [problems, setProblems] = useState<ProblemTriple[] | null>(null);
  const [running, setRunning] = useState(false);

  const active = tasks.find((t) => t.id === activeId) ?? tasks[0];

  const toggleRule = (id: string) => {
    setSelectedRules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const patchTask = (id: string, patch: Partial<InferenceTask>) => {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const stopTask = () => {
    if (!active) return;
    patchTask(active.id, { status: 'stopped' });
    setRunning(false);
  };

  const scheduleTask = () => {
    if (!active) return;
    patchTask(active.id, {
      status: 'scheduled',
      schedule: scheduleHint || '每日 02:00',
      ruleIds: selectedRules,
    });
  };

  const runTask = () => {
    if (!active || selectedRules.length === 0) return;
    setRunning(true);
    setProblems(null);
    patchTask(active.id, { status: 'running', ruleIds: selectedRules, schedule: scheduleHint });

    setTimeout(() => {
      let triples: Array<{ subject: string; predicate: string; object: string }> = [];
      try {
        triples = JSON.parse(triplesJson);
      } catch {
        triples = [];
      }

      const found: ProblemTriple[] = [];
      const rules = new Set(selectedRules);

      triples.forEach((t, idx) => {
        if (rules.has('R030') && (!t.subject?.trim() || !t.predicate?.trim() || !String(t.object ?? '').trim())) {
          found.push({
            id: `p_${idx}_incomplete`,
            ...t,
            ruleId: 'R030',
            ruleName: '三元组完整性校验',
            issue: '三元组主谓宾存在空值',
          });
        }
        if (rules.has('R031') && t.predicate === '发表年份') {
          const y = Number(t.object);
          if (Number.isNaN(y) || y < 1900 || y > 2100) {
            found.push({
              id: `p_${idx}_year`,
              ...t,
              ruleId: 'R031',
              ruleName: '类型约束违规检测',
              issue: `发表年份「${t.object}」超出合理范围`,
            });
          }
        }
        if (rules.has('R001') && t.subject.startsWith('作者:') && t.predicate === '就职于' && !t.object) {
          found.push({
            id: `p_${idx}_aff`,
            ...t,
            ruleId: 'R001',
            ruleName: '人物实体质量检测',
            issue: '作者缺少有效就职机构',
          });
        }
      });

      if (rules.has('R032')) {
        const jobs = triples.filter((t) => t.predicate === '就职于');
        const bySub = new Map<string, string[]>();
        for (const j of jobs) {
          const list = bySub.get(j.subject) ?? [];
          list.push(j.object);
          bySub.set(j.subject, list);
        }
        for (const [sub, orgs] of bySub) {
          const uniq = [...new Set(orgs.filter(Boolean))];
          if (uniq.length > 1) {
            found.push({
              id: `p_conflict_${sub}`,
              subject: sub,
              predicate: '就职于',
              object: uniq.join(' | '),
              ruleId: 'R032',
              ruleName: '矛盾事实冲突检测',
              issue: `同一主体存在多个互斥就职机构：${uniq.join('、')}`,
            });
          }
        }
      }

      setProblems(found);
      patchTask(active.id, {
        status: 'completed',
        lastRunAt: new Date().toISOString(),
        problemCount: found.length,
        ruleIds: selectedRules,
      });
      setRunning(false);
    }, 900);
  };

  const createTask = () => {
    const id = `task-${String(tasks.length + 1).padStart(3, '0')}`;
    const task: InferenceTask = {
      id,
      name: `推理任务 ${tasks.length + 1}`,
      status: 'idle',
      schedule: '手动',
      ruleIds: selectedRules,
      createdAt: new Date().toISOString(),
    };
    setTasks((list) => [task, ...list]);
    setActiveId(id);
    setProblems(null);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-6">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">推理任务管理</h1>
          <p className="text-sm text-gray-500">
            管理推理任务的启动、停止与调度；输入图谱三元组并按配置规则检测问题三元组
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">任务列表</span>
            <button type="button" onClick={createTask} className="text-xs text-blue-600 hover:text-blue-700">
              + 新建
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {tasks.map((t) => {
              const meta = STATUS_META[t.status];
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(t.id);
                      setSelectedRules(t.ruleIds);
                      setScheduleHint(t.schedule);
                      setProblems(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 ${
                      active?.id === t.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{t.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${meta.className}`}>{meta.label}</span>
                      <span className="text-[11px] text-gray-400">{t.schedule}</span>
                    </div>
                    {typeof t.problemCount === 'number' && (
                      <div className="text-[11px] text-gray-500 mt-1">上次发现问题 {t.problemCount} 条</div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-y-auto p-5 space-y-4">
          {active && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg text-gray-900 mr-auto">{active.name}</h2>
                <button
                  type="button"
                  onClick={runTask}
                  disabled={running || selectedRules.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  <Play className="w-3.5 h-3.5" />
                  {running ? '推理中…' : '启动'}
                </button>
                <button
                  type="button"
                  onClick={stopTask}
                  disabled={!running && active.status !== 'running'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-sm rounded-lg text-gray-700 disabled:opacity-40"
                >
                  <Square className="w-3.5 h-3.5" />
                  停止
                </button>
                <button
                  type="button"
                  onClick={scheduleTask}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-sm rounded-lg text-gray-700"
                >
                  <Clock className="w-3.5 h-3.5" />
                  调度
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">调度策略</label>
                  <select
                    value={scheduleHint}
                    onChange={(e) => setScheduleHint(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="手动">手动</option>
                    <option value="每日 02:00">每日 02:00</option>
                    <option value="每小时">每小时</option>
                    <option value="每周一 09:00">每周一 09:00</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="text-xs text-gray-500 pb-2 inline-flex items-center gap-1.5">
                    <Pause className="w-3.5 h-3.5" />
                    当前状态：{STATUS_META[active.status].label}
                    {active.lastRunAt ? ` · 上次 ${active.lastRunAt}` : ''}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">图谱三元组（JSON）</label>
                <textarea
                  value={triplesJson}
                  onChange={(e) => setTriplesJson(e.target.value)}
                  rows={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">配置规则</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_RULES.map((rule) => {
                    const on = selectedRules.includes(rule.id);
                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border ${
                          on ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        {rule.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {problems && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    {problems.length > 0 ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    )}
                    问题三元组 · {problems.length} 条
                  </div>
                  {problems.length === 0 ? (
                    <p className="text-sm text-green-600">未发现有问题的三元组</p>
                  ) : (
                    <ul className="divide-y border border-gray-200 rounded-lg overflow-hidden">
                      {problems.map((p) => (
                        <li key={p.id} className="px-4 py-3 text-sm bg-white">
                          <div className="font-mono text-xs text-gray-800">
                            ({p.subject}, {p.predicate}, {p.object || '∅'})
                          </div>
                          <div className="text-xs text-red-600 mt-1">规则：{p.ruleName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{p.issue}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
