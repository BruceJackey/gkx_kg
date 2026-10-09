import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileJson,
  Play,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import type { AdversarialTransferFocus } from '../data/auditPageMap';

const TABS: Array<{ id: AdversarialTransferFocus; label: string; desc: string }> = [
  {
    id: 'transfer',
    label: '跨领域知识迁移',
    desc: '上传 JSON 三元组并命名源/目标领域',
  },
  {
    id: 'task',
    label: '知识补全任务配置',
    desc: '上传残缺 JSON 三元组并发起补全',
  },
  {
    id: 'review',
    label: '补全结果审核',
    desc: '待审核三元组列表，人工通过/拒绝',
  },
];

type Triple = { head: string; relation: string; tail: string };

type Pending = {
  id: string;
  head: string;
  relation: string;
  tail: string;
  score: number;
};

const DEMO_PENDING: Pending[] = [
  { id: 'c1', head: '阿司匹林', relation: '药物-适应症', tail: '心肌梗死预防', score: 0.94 },
  { id: 'c2', head: 'EGFR', relation: '基因-功能', tail: '细胞增殖调控', score: 0.88 },
  { id: 'c3', head: 'BERT', relation: '方法-数据集', tail: 'GLUE', score: 0.91 },
  { id: 'c4', head: '华润医药', relation: '公司-股东', tail: '华润集团', score: 0.81 },
];

const SAMPLE_SOURCE_JSON = `[
  {"head": "阿司匹林", "relation": "作用于", "tail": "COX-1"},
  {"head": "阿司匹林", "relation": "用于治疗", "tail": "发热"},
  {"head": "EGFR", "relation": "与…相关", "tail": "细胞增殖"}
]`;

const SAMPLE_TARGET_JSON = `[
  {"head": "BaTiO3", "relation": "具有性能", "tail": "铁电性"},
  {"head": "PZT", "relation": "具有性能", "tail": "压电性"}
]`;

const SAMPLE_INCOMPLETE_JSON = `[
  {"head": "KNN陶瓷", "relation": "具有性能", "tail": ""},
  {"head": "", "relation": "具有性能", "tail": "压电性"},
  {"head": "BaTiO3", "relation": "", "tail": "铁电性"}
]`;

function parseTriplesJson(text: string): { ok: true; triples: Triple[] } | { ok: false; error: string } {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return { ok: false, error: 'JSON 须为三元组数组' };
    const triples: Triple[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || typeof row !== 'object') {
        return { ok: false, error: `第 ${i + 1} 项不是对象` };
      }
      const head = String((row as Triple).head ?? '').trim();
      const relation = String((row as Triple).relation ?? '').trim();
      const tail = String((row as Triple).tail ?? '').trim();
      triples.push({ head, relation, tail });
    }
    if (!triples.length) return { ok: false, error: '数组为空' };
    return { ok: true, triples };
  } catch {
    return { ok: false, error: 'JSON 解析失败' };
  }
}

function isCompleteTriple(t: Triple) {
  return Boolean(t.head && t.relation && t.tail);
}

function isIncompleteTriple(t: Triple) {
  const filled = [t.head, t.relation, t.tail].filter(Boolean).length;
  return filled >= 1 && filled < 3;
}

async function readJsonFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

export default function AdversarialTransferKgc({
  initialFocus = 'transfer',
}: {
  initialFocus?: AdversarialTransferFocus | null;
}) {
  const [tab, setTab] = useState<AdversarialTransferFocus>(initialFocus ?? 'transfer');

  const [sourceDomain, setSourceDomain] = useState('药物-靶点知识图谱');
  const [targetDomain, setTargetDomain] = useState('材料-性能知识图谱');
  const [sourceFileName, setSourceFileName] = useState('');
  const [targetFileName, setTargetFileName] = useState('');
  const [sourceTriples, setSourceTriples] = useState<Triple[]>([]);
  const [targetTriples, setTargetTriples] = useState<Triple[]>([]);
  const [sourceError, setSourceError] = useState('');
  const [targetError, setTargetError] = useState('');
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);

  const [taskName, setTaskName] = useState('');
  const [incompleteFileName, setIncompleteFileName] = useState('');
  const [incompleteTriples, setIncompleteTriples] = useState<Triple[]>([]);
  const [incompleteError, setIncompleteError] = useState('');
  const [taskRunning, setTaskRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const [pending, setPending] = useState<Pending[]>(() => [...DEMO_PENDING]);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (initialFocus) setTab(initialFocus);
  }, [initialFocus]);

  const transferReady =
    sourceDomain.trim() &&
    targetDomain.trim() &&
    sourceTriples.some(isCompleteTriple) &&
    targetTriples.some(isCompleteTriple);

  const incompleteCount = incompleteTriples.filter(isIncompleteTriple).length;
  const taskReady = trained && taskName.trim() && incompleteCount > 0;

  const summary = useMemo(() => {
    const parts = [
      `${sourceDomain.trim() || '—'} → ${targetDomain.trim() || '—'}`,
      trained ? '迁移训练完成' : '尚未训练',
      taskId ? `任务 ${taskId}` : null,
      `待审核 ${pending.length}`,
    ];
    return parts.filter(Boolean).join(' · ');
  }, [sourceDomain, targetDomain, trained, taskId, pending.length]);

  const handleUploadDomain = async (
    side: 'source' | 'target',
    file: File | undefined,
  ) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      const msg = '仅支持 .json 文件';
      if (side === 'source') setSourceError(msg);
      else setTargetError(msg);
      return;
    }
    try {
      const text = await readJsonFile(file);
      const parsed = parseTriplesJson(text);
      if (!parsed.ok) {
        if (side === 'source') {
          setSourceError(parsed.error);
          setSourceTriples([]);
          setSourceFileName(file.name);
        } else {
          setTargetError(parsed.error);
          setTargetTriples([]);
          setTargetFileName(file.name);
        }
        setTrained(false);
        return;
      }
      const complete = parsed.triples.filter(isCompleteTriple);
      if (!complete.length) {
        const msg = '未找到完整三元组（需含 head / relation / tail）';
        if (side === 'source') {
          setSourceError(msg);
          setSourceTriples([]);
        } else {
          setTargetError(msg);
          setTargetTriples([]);
        }
        setTrained(false);
        return;
      }
      if (side === 'source') {
        setSourceFileName(file.name);
        setSourceTriples(complete);
        setSourceError('');
      } else {
        setTargetFileName(file.name);
        setTargetTriples(complete);
        setTargetError('');
      }
      setTrained(false);
    } catch {
      const msg = '文件读取失败';
      if (side === 'source') setSourceError(msg);
      else setTargetError(msg);
    }
  };

  const loadSampleTransfer = () => {
    const src = parseTriplesJson(SAMPLE_SOURCE_JSON);
    const tgt = parseTriplesJson(SAMPLE_TARGET_JSON);
    if (src.ok) {
      setSourceTriples(src.triples);
      setSourceFileName('sample_source_triples.json');
      setSourceError('');
    }
    if (tgt.ok) {
      setTargetTriples(tgt.triples);
      setTargetFileName('sample_target_triples.json');
      setTargetError('');
    }
    setTrained(false);
  };

  const startTrain = () => {
    if (!transferReady || training) return;
    setTraining(true);
    setTrained(false);
    window.setTimeout(() => {
      setTraining(false);
      setTrained(true);
    }, 900);
  };

  const handleUploadIncomplete = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setIncompleteError('仅支持 .json 文件');
      return;
    }
    try {
      const text = await readJsonFile(file);
      const parsed = parseTriplesJson(text);
      if (!parsed.ok) {
        setIncompleteError(parsed.error);
        setIncompleteTriples([]);
        setIncompleteFileName(file.name);
        return;
      }
      const incomplete = parsed.triples.filter(isIncompleteTriple);
      if (!incomplete.length) {
        setIncompleteError('未找到残缺三元组（head/relation/tail 至少缺一项）');
        setIncompleteTriples([]);
        setIncompleteFileName(file.name);
        return;
      }
      setIncompleteFileName(file.name);
      setIncompleteTriples(incomplete);
      setIncompleteError('');
    } catch {
      setIncompleteError('文件读取失败');
    }
  };

  const loadSampleIncomplete = () => {
    const parsed = parseTriplesJson(SAMPLE_INCOMPLETE_JSON);
    if (parsed.ok) {
      setIncompleteTriples(parsed.triples.filter(isIncompleteTriple));
      setIncompleteFileName('sample_incomplete_triples.json');
      setIncompleteError('');
    }
  };

  const submitTask = () => {
    if (!taskReady || taskRunning) return;
    setTaskRunning(true);
    const id = `kgc_${Date.now().toString(36).slice(-5)}`;
    window.setTimeout(() => {
      setTaskId(id);
      setTaskRunning(false);
      const generated: Pending[] = incompleteTriples.slice(0, 8).map((t, i) => ({
        id: `gen_${id}_${i}`,
        head: t.head || '（补全头实体）',
        relation: t.relation || '（补全关系）',
        tail: t.tail || '（补全尾实体）',
        score: Number((0.72 + (i % 5) * 0.04).toFixed(2)),
      }));
      setPending(prev => [...generated, ...prev]);
      setTab('review');
    }, 800);
  };

  const decide = (id: string) => {
    setPending(prev => prev.filter(item => item.id !== id));
    setDone(n => n + 1);
  };

  const TriplePreview = ({
    triples,
    emptyText,
  }: {
    triples: Triple[];
    emptyText: string;
  }) => (
    <div className="border border-gray-100 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
      {triples.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">{emptyText}</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-gray-500">
              <th className="text-left px-3 py-1.5 font-medium">head</th>
              <th className="text-left px-3 py-1.5 font-medium">relation</th>
              <th className="text-left px-3 py-1.5 font-medium">tail</th>
            </tr>
          </thead>
          <tbody>
            {triples.slice(0, 20).map((t, i) => (
              <tr key={`${t.head}-${t.relation}-${t.tail}-${i}`} className="border-t border-gray-50">
                <td className="px-3 py-1.5 text-gray-800">{t.head || <span className="text-amber-500">空</span>}</td>
                <td className="px-3 py-1.5 text-indigo-700">{t.relation || <span className="text-amber-500">空</span>}</td>
                <td className="px-3 py-1.5 text-gray-800">{t.tail || <span className="text-amber-500">空</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">
            数据的统一建模与表示融合 · 基于对抗迁移学习的知识图谱补全
          </div>
          <h1 className="text-xl font-semibold text-gray-900">基于对抗迁移学习的知识图谱补全</h1>
          <p className="text-sm text-gray-500 mt-1">
            上传源/目标领域 JSON 三元组完成迁移，再上传残缺三元组发起补全；对抗学习策略由后端定义。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3 py-2 rounded-lg text-left border ${
                tab === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">{item.label}</div>
              <div className="text-[11px] text-gray-500 max-w-[220px]">{item.desc}</div>
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
          {summary}
        </div>

        {tab === 'transfer' ? (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">跨领域知识迁移</h2>
                <p className="text-xs text-gray-500 mt-1">
                  为源领域与目标领域分别命名，并上传完整三元组 JSON（数组，字段 head / relation / tail）。对抗学习策略由后端自行定义，前端不展示。
                </p>
              </div>
              <button
                type="button"
                onClick={loadSampleTransfer}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex-shrink-0"
              >
                载入示例
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-xs text-gray-500">
                  源领域名称
                  <input
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    value={sourceDomain}
                    placeholder="如：药物-靶点知识图谱"
                    onChange={e => {
                      setSourceDomain(e.target.value);
                      setTrained(false);
                    }}
                  />
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-xl p-5 bg-indigo-50/30 cursor-pointer hover:bg-indigo-50/60">
                  <Upload className="w-5 h-5 text-indigo-400 mb-1.5" />
                  <span className="text-sm text-gray-700 font-medium">上传源领域 JSON</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">完整三元组数组</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json,application/json"
                    onChange={e => {
                      void handleUploadDomain('source', e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5" />
                  {sourceFileName || '尚未选择文件'}
                  {sourceTriples.length > 0 ? ` · ${sourceTriples.length} 条` : ''}
                </div>
                {sourceError ? <p className="text-xs text-red-600">{sourceError}</p> : null}
                <TriplePreview triples={sourceTriples} emptyText="上传后预览源领域三元组" />
              </div>

              <div className="space-y-3">
                <label className="block text-xs text-gray-500">
                  目标领域名称
                  <input
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    value={targetDomain}
                    placeholder="如：材料-性能知识图谱"
                    onChange={e => {
                      setTargetDomain(e.target.value);
                      setTrained(false);
                    }}
                  />
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-200 rounded-xl p-5 bg-amber-50/30 cursor-pointer hover:bg-amber-50/60">
                  <Upload className="w-5 h-5 text-amber-400 mb-1.5" />
                  <span className="text-sm text-gray-700 font-medium">上传目标领域 JSON</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">完整三元组数组</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json,application/json"
                    onChange={e => {
                      void handleUploadDomain('target', e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <FileJson className="w-3.5 h-3.5" />
                  {targetFileName || '尚未选择文件'}
                  {targetTriples.length > 0 ? ` · ${targetTriples.length} 条` : ''}
                </div>
                {targetError ? <p className="text-xs text-red-600">{targetError}</p> : null}
                <TriplePreview triples={targetTriples} emptyText="上传后预览目标领域三元组" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 py-1 text-sm">
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                {sourceDomain.trim() || '源领域'}
              </span>
              <ArrowRight className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium">对抗迁移（后端策略）</span>
              <ArrowRight className="w-4 h-4 text-indigo-500" />
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                {targetDomain.trim() || '目标领域'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!transferReady || training}
                onClick={startTrain}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
              >
                {training ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {training ? '训练中…' : trained ? '重新训练' : '启动跨领域迁移训练'}
              </button>
              {trained ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> 迁移训练完成
                </span>
              ) : null}
              {trained ? (
                <button
                  type="button"
                  className="ml-auto text-sm text-indigo-600"
                  onClick={() => setTab('task')}
                >
                  下一步：配置补全任务 →
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {tab === 'task' ? (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">知识补全任务配置</h2>
                <p className="text-xs text-gray-500 mt-1">
                  上传残缺三元组 JSON（head / relation / tail 至少缺一项），命名任务后发起补全。
                </p>
              </div>
              <button
                type="button"
                onClick={loadSampleIncomplete}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex-shrink-0"
              >
                载入示例
              </button>
            </div>

            {!trained ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                请先完成跨领域知识迁移训练。{' '}
                <button type="button" className="underline" onClick={() => setTab('transfer')}>
                  去训练
                </button>
              </p>
            ) : (
              <div className="text-xs text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                已就绪：{sourceDomain} → {targetDomain}
              </div>
            )}

            <label className="block text-xs text-gray-500">
              任务名称
              <input
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                value={taskName}
                placeholder={`例如：${targetDomain.trim() || '目标域'} 补全任务`}
                onChange={e => setTaskName(e.target.value)}
              />
            </label>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-violet-200 rounded-xl p-6 bg-violet-50/30 cursor-pointer hover:bg-violet-50/60">
              <Upload className="w-5 h-5 text-violet-400 mb-1.5" />
              <span className="text-sm text-gray-700 font-medium">上传残缺三元组 JSON</span>
              <span className="text-[11px] text-gray-400 mt-0.5">字段可为空，用于待补全位置</span>
              <input
                type="file"
                className="hidden"
                accept=".json,application/json"
                onChange={e => {
                  void handleUploadIncomplete(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5" />
              {incompleteFileName || '尚未选择文件'}
              {incompleteCount > 0 ? ` · ${incompleteCount} 条残缺` : ''}
            </div>
            {incompleteError ? <p className="text-xs text-red-600">{incompleteError}</p> : null}
            <TriplePreview triples={incompleteTriples} emptyText="上传后预览残缺三元组" />

            <button
              type="button"
              disabled={!taskReady || taskRunning}
              onClick={submitTask}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
            >
              {taskRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {taskRunning ? '补全中…' : '发起知识补全任务'}
            </button>
            {taskId ? (
              <p className="text-xs text-emerald-700">任务已提交：{taskId}，结果进入审核列表</p>
            ) : null}
          </section>
        ) : null}

        {tab === 'review' ? (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-indigo-600" /> 补全结果审核
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  待审核 {pending.length} · 已处理 {done}
                </p>
              </div>
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded-lg"
                onClick={() => {
                  setPending([...DEMO_PENDING]);
                  setDone(0);
                }}
              >
                重置演示
              </button>
            </div>

            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">暂无待审核三元组</p>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-medium">头实体</th>
                      <th className="text-left px-4 py-2.5 font-medium">关系</th>
                      <th className="text-left px-4 py-2.5 font-medium">尾实体</th>
                      <th className="text-left px-4 py-2.5 font-medium">置信度</th>
                      <th className="text-right px-4 py-2.5 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.head}</td>
                        <td className="px-4 py-3 text-indigo-700">{item.relation}</td>
                        <td className="px-4 py-3 text-gray-900">{item.tail}</td>
                        <td className="px-4 py-3 text-indigo-700 font-semibold">
                          {item.score.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => decide(item.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white"
                            >
                              <Check className="w-3 h-3" /> 通过
                            </button>
                            <button
                              type="button"
                              onClick={() => decide(item.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600"
                            >
                              <X className="w-3 h-3" /> 拒绝
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
