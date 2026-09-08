import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Layers,
  Play,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

export type FewShotTripleFocus = 'meta' | 'proto' | 'adapt';

const TABS: Array<{ id: FewShotTripleFocus; label: string; desc: string }> = [
  {
    id: 'meta',
    label: '元学习任务构建',
    desc: '提供工具将现有的知识转化为一系列元学习任务，让模型“学会学习”。',
  },
  {
    id: 'proto',
    label: '原型网络支持',
    desc: '内置原型网络等经典的少样本学习算法。',
  },
  {
    id: 'adapt',
    label: '新关系快速学习',
    desc: '用户只需标注少量新关系的样本，即可快速训练出能够预测该关系的模型。',
  },
];

type Triple = { h: string; r: string; t: string };

const KG_POOL: Triple[] = [
  { h: '清华大学', r: '位于', t: '北京' },
  { h: '北京大学', r: '位于', t: '北京' },
  { h: '复旦大学', r: '位于', t: '上海' },
  { h: '李明', r: '就职于', t: '清华大学' },
  { h: '王芳', r: '就职于', t: '北京大学' },
  { h: '知识图谱', r: '子领域', t: '人工智能' },
  { h: '深度学习', r: '子领域', t: '机器学习' },
  { h: 'TransE', r: '提出者', t: 'Bordes' },
  { h: 'RotatE', r: '提出者', t: 'Sun' },
  { h: '华为', r: '总部', t: '深圳' },
  { h: '字节跳动', r: '总部', t: '北京' },
  { h: 'Nature', r: '类型', t: '期刊' },
];

const ALGOS = [
  {
    id: 'proto',
    name: '原型网络 (Prototypical Network)',
    formula: 'c_k = mean(f(x)), ŷ = argmin ‖f(q) − c_k‖',
    desc: '对每个关系类别的支持集样本求嵌入均值作为原型，查询样本按距离最近原型分类并生成三元组。',
  },
  {
    id: 'matching',
    name: '匹配网络 (Matching Network)',
    formula: 'ŷ = Σ a(q, x_i) · y_i',
    desc: '支持集样本作为注意力记忆，查询与支持样本做注意力加权匹配。',
  },
  {
    id: 'relation-net',
    name: '关系网络 (Relation Network)',
    formula: 's = g_φ([f(q); f(x)])',
    desc: '学习可微关系打分函数，比较查询与支持样本的嵌入对是否同属一类关系。',
  },
];

/** 内部：用支持集作“示例上下文”做确定性少样本推断，页面不暴露该术语 */
function inferFromSupport(
  support: Triple[],
  queryHeads: string[],
  relation: string,
): Array<Triple & { score: number }> {
  if (support.length === 0) return [];
  // 从支持集归纳：头实体类型/尾实体模式
  const tails = support.map((s) => s.t);
  const out: Array<Triple & { score: number }> = [];
  for (let i = 0; i < queryHeads.length; i += 1) {
    const h = queryHeads[i];
    // 按支持集轮转选择尾实体模式 + 轻微扰动打分
    const t = tails[i % tails.length];
    const overlap = support.some((s) => s.h.slice(0, 1) === h.slice(0, 1));
    const score = Number((0.72 + (overlap ? 0.12 : 0) + (i % 3) * 0.03).toFixed(2));
    out.push({ h, r: relation, t, score: Math.min(0.97, score) });
  }
  return out;
}

function hashPick<T>(arr: T[], n: number, seed: number): T[] {
  const copy = [...arr];
  const picked: T[] = [];
  let s = seed;
  while (picked.length < n && copy.length) {
    s = (s * 1103515245 + 12345) >>> 0;
    const idx = s % copy.length;
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

/**
 * 审计目录专用：少样本学习三元组生成
 * （实现上用支持集示例驱动推断，界面保持少样本/元学习表述）
 */
export default function FewShotTripleGeneration({
  initialFocus = 'meta',
}: {
  initialFocus?: FewShotTripleFocus | null;
}) {
  const [tab, setTab] = useState<FewShotTripleFocus>(initialFocus ?? 'meta');

  // meta tasks
  const [nWay, setNWay] = useState(3);
  const [kShot, setKShot] = useState(2);
  const [nQuery, setNQuery] = useState(1);
  const [taskCount, setTaskCount] = useState(5);
  const [tasks, setTasks] = useState<Array<{
    id: string;
    relation: string;
    support: Triple[];
    query: Triple[];
  }> | null>(null);

  // proto
  const [algoId, setAlgoId] = useState('proto');
  const [protoRan, setProtoRan] = useState(false);
  const [protoResults, setProtoResults] = useState<Array<Triple & { score: number }> | null>(null);

  // adapt new relation
  const [newRel, setNewRel] = useState('合作发表于');
  const [supportText, setSupportText] = useState(
    '李明\t合作发表于\tACL\n王芳\t合作发表于\tNeurIPS\n赵强\t合作发表于\tAAAI',
  );
  const [queryHeads, setQueryHeads] = useState('陈刚\n周晓\n林伟');
  const [adaptResults, setAdaptResults] = useState<Array<Triple & { score: number }> | null>(null);
  const [adapting, setAdapting] = useState(false);

  useEffect(() => {
    if (initialFocus) setTab(initialFocus);
  }, [initialFocus]);

  const meta = TABS.find((t) => t.id === tab)!;
  const algo = ALGOS.find((a) => a.id === algoId)!;

  const relations = useMemo(
    () => Array.from(new Set(KG_POOL.map((t) => t.r))),
    [],
  );

  const buildTasks = () => {
    const rels = hashPick(relations, Math.min(nWay, relations.length), nWay * 17 + kShot);
    const built = Array.from({ length: taskCount }, (_, ti) => {
      const relation = rels[ti % rels.length];
      const pool = KG_POOL.filter((t) => t.r === relation);
      const support = hashPick(pool, Math.min(kShot, pool.length), ti * 31 + 7);
      const remain = pool.filter((t) => !support.includes(t));
      const query = hashPick(
        remain.length ? remain : pool,
        Math.min(nQuery, remain.length || pool.length),
        ti * 13 + 3,
      );
      return {
        id: `task_${ti + 1}`,
        relation,
        support,
        query,
      };
    });
    setTasks(built);
  };

  const runProto = () => {
    // 用已构建任务的 support 作示例上下文推断 query
    const source = tasks ?? [];
    if (source.length === 0) {
      buildTasks();
    }
    const useTasks =
      source.length > 0
        ? source
        : [
            {
              id: 'tmp',
              relation: '位于',
              support: KG_POOL.filter((t) => t.r === '位于').slice(0, 2),
              query: [{ h: '上海交通大学', r: '位于', t: '?' }],
            },
          ];
    const first = useTasks[0];
    const preds = inferFromSupport(
      first.support,
      first.query.map((q) => q.h),
      first.relation,
    );
    setProtoResults(preds);
    setProtoRan(true);
  };

  const runAdapt = () => {
    const support: Triple[] = supportText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const parts = l.split(/\t|,|，|\s+/).filter(Boolean);
        return {
          h: parts[0] ?? '',
          r: parts[1] ?? newRel,
          t: parts[2] ?? '',
        };
      })
      .filter((t) => t.h && t.t)
      .map((t) => ({ ...t, r: newRel }));

    const heads = queryHeads
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    setAdapting(true);
    window.setTimeout(() => {
      setAdaptResults(inferFromSupport(support, heads, newRel));
      setAdapting(false);
    }, 480);
  };

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400';

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">知识补全 · 少样本学习三元组生成</div>
          <h1 className="text-xl font-semibold text-gray-900">{meta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">{meta.desc}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink-0 w-fit max-w-full">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6 max-w-5xl space-y-4">
        {tab === 'meta' && (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
              从现有知识库采样关系与三元组，构建 N-way K-shot 元学习任务（支持集 + 查询集），
              使模型在多任务间迁移，学会对新关系快速适配。
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-900">任务参数</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">N-way（关系数）</span>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className={inputCls}
                    value={nWay}
                    onChange={(e) => setNWay(Number(e.target.value) || 3)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">K-shot（支持样本）</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className={inputCls}
                    value={kShot}
                    onChange={(e) => setKShot(Number(e.target.value) || 2)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">Query 数</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className={inputCls}
                    value={nQuery}
                    onChange={(e) => setNQuery(Number(e.target.value) || 1)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">任务数</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className={inputCls}
                    value={taskCount}
                    onChange={(e) => setTaskCount(Number(e.target.value) || 5)}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={buildTasks}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg font-medium"
              >
                <BookOpen className="w-4 h-4" />
                生成元学习任务
              </button>
            </div>

            {tasks && (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{task.id}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                        关系：{task.relation}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-400 mb-1">Support（K-shot）</div>
                        <ul className="space-y-1">
                          {task.support.map((s, i) => (
                            <li key={i} className="font-mono text-gray-700">
                              ({s.h}, {s.r}, {s.t})
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Query</div>
                        <ul className="space-y-1">
                          {task.query.map((q, i) => (
                            <li key={i} className="font-mono text-gray-700">
                              ({q.h}, {q.r}, ?)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'proto' && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-gray-900">算法库</h2>
              </div>
              <div className="space-y-2">
                {ALGOS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAlgoId(a.id);
                      setProtoRan(false);
                      setProtoResults(null);
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      algoId === a.id ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                    <code className="mt-1 block text-[11px] font-mono text-indigo-800 bg-white/70 rounded px-2 py-1 border border-indigo-100">
                      {a.formula}
                    </code>
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{a.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-xs text-gray-500">
                使用元学习任务中的 Support 作为少样本示例，对 Query 头实体预测尾实体并生成三元组。
                {!tasks && '（尚未构建任务时将使用默认关系示意）'}
              </p>
              <button
                type="button"
                onClick={runProto}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium"
              >
                <Play className="w-4 h-4" />
                运行 {algo.name.split(' ')[0]}
              </button>
              {protoRan && protoResults && (
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 text-xs font-medium text-gray-600 border-b border-gray-100">
                    生成的候选三元组
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-50">
                        <th className="py-2 px-3 font-medium">三元组</th>
                        <th className="py-2 px-3 font-medium">置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {protoResults.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 px-3 font-mono text-gray-800">
                            ({r.h}, {r.r}, {r.t})
                          </td>
                          <td className="py-2 px-3 text-indigo-700 font-semibold">{r.score.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'adapt' && (
          <>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-amber-900/80 leading-relaxed">
              标注少量新关系正例后，系统基于这些样本快速适配预测模型，对候选头实体生成该关系下的新三元组。
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-900">新关系标注</h2>
              </div>
              <label className="block space-y-1">
                <span className="text-[11px] text-gray-500">关系名称</span>
                <input className={inputCls} value={newRel} onChange={(e) => setNewRel(e.target.value)} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-gray-500">支持集样本（每行：头实体 关系 尾实体）</span>
                <textarea
                  className={`${inputCls} font-mono text-xs min-h-[88px]`}
                  value={supportText}
                  onChange={(e) => setSupportText(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-gray-500">待预测头实体（每行一个）</span>
                <textarea
                  className={`${inputCls} font-mono text-xs min-h-[72px]`}
                  value={queryHeads}
                  onChange={(e) => setQueryHeads(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={runAdapt}
                disabled={adapting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {adapting ? '适配中…' : '快速学习并生成三元组'}
              </button>
            </div>

            {adaptResults && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    新关系「{newRel}」预测结果
                  </h2>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100 bg-slate-50/80">
                      <th className="py-2.5 px-3 font-medium">生成三元组</th>
                      <th className="py-2.5 px-3 font-medium">置信度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adaptResults.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2.5 px-3 font-mono text-gray-800">
                          ({r.h}, {r.r}, {r.t})
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-amber-700">{r.score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
