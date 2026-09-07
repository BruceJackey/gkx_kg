import { useEffect, useMemo, useState } from 'react';
import { Play, Sparkles } from 'lucide-react';

export type ScoringFunctionFocus = 'distance' | 'similarity' | 'visualize';

/** 与 auditCatalog 功能点 name / featureDesc 严格对齐 */
const TABS: Array<{
  id: ScoringFunctionFocus;
  label: string;
  desc: string;
}> = [
  {
    id: 'distance',
    label: '基于距离的打分函数',
    desc: '内置打分函数，通过计算实体间距离来评估三元组的合理性。',
  },
  {
    id: 'similarity',
    label: '基于语义相似度的打分函数',
    desc: '内置DistMult、ComplEx等模型的打分函数，通过向量运算来评估语义相似度。',
  },
  {
    id: 'visualize',
    label: '打分函数可视化解释',
    desc: '提供辅助工具，可视化解释特定三元组在不同打分函数下的得分原理。',
  },
];

type FnKind = 'distance' | 'similarity';

interface ScoreFn {
  id: string;
  name: string;
  kind: FnKind;
  formula: string;
  principle: string;
  note: string;
  higherBetter: boolean;
  accent: string;
  bar: string;
}

const SCORE_FNS: ScoreFn[] = [
  {
    id: 'transe',
    name: 'TransE',
    kind: 'distance',
    formula: 'f(h,r,t) = −‖h + r − t‖₁/₂',
    principle: '将关系 r 建模为平移：期望 h + r ≈ t。距离越小，三元组越合理；界面展示为归一化后的合理性得分（越大越好）。',
    note: '适合 1-to-1 关系；对 1-N / N-1 表达力有限。',
    higherBetter: true,
    accent: 'border-sky-200 bg-sky-50/60',
    bar: 'bg-sky-500',
  },
  {
    id: 'transh',
    name: 'TransH',
    kind: 'distance',
    formula: 'f(h,r,t) = −‖h⊥ + dᵣ − t⊥‖',
    principle: '先将实体投影到关系超平面，再做平移。同一实体在不同关系下可有不同角色，缓解一对多问题。',
    note: '距离类扩展；仍基于几何距离衡量合理性。',
    higherBetter: true,
    accent: 'border-cyan-200 bg-cyan-50/60',
    bar: 'bg-cyan-500',
  },
  {
    id: 'rotate',
    name: 'RotatE',
    kind: 'distance',
    formula: 'f(h,r,t) = −‖h ∘ r − t‖',
    principle: '在复数空间把关系建模为旋转：期望 h 旋转 r 后接近 t。可刻画对称、反对称、组合等模式。',
    note: '复数模长约束；距离越小越合理。',
    higherBetter: true,
    accent: 'border-indigo-200 bg-indigo-50/60',
    bar: 'bg-indigo-500',
  },
  {
    id: 'distmult',
    name: 'DistMult',
    kind: 'similarity',
    formula: 'f(h,r,t) = ⟨h, r, t⟩ = Σᵢ hᵢ rᵢ tᵢ',
    principle: '对角双线性：对头、关系、尾向量做逐元素乘积后求和。得分越高语义匹配越强。',
    note: '参数高效；天然偏向对称关系。',
    higherBetter: true,
    accent: 'border-violet-200 bg-violet-50/60',
    bar: 'bg-violet-500',
  },
  {
    id: 'complex',
    name: 'ComplEx',
    kind: 'similarity',
    formula: 'f(h,r,t) = Re(⟨h, r, t̄⟩)',
    principle: '将嵌入扩展到复数域，取 Hermitian 内积的实部为得分，可建模非对称与反对称关系。',
    note: '与 DistMult 参数量同阶，表达力更强。',
    higherBetter: true,
    accent: 'border-purple-200 bg-purple-50/60',
    bar: 'bg-purple-500',
  },
  {
    id: 'rescal',
    name: 'RESCAL',
    kind: 'similarity',
    formula: 'f(h,r,t) = hᵀ Mᵣ t',
    principle: '每种关系使用独立矩阵 Mᵣ，通过全矩阵双线性捕捉丰富实体交互，得分越高越合理。',
    note: '表达力最强，参数随关系数与维度平方增长。',
    higherBetter: true,
    accent: 'border-fuchsia-200 bg-fuchsia-50/60',
    bar: 'bg-fuchsia-500',
  },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 确定性伪嵌入打分（演示用，非真实训练模型） */
function scoreTriple(fn: ScoreFn, h: string, r: string, t: string): {
  raw: number;
  plausibility: number;
  detail: string;
} {
  const hh = hashStr(`${fn.id}|h|${h}`);
  const rr = hashStr(`${fn.id}|r|${r}`);
  const tt = hashStr(`${fn.id}|t|${t}`);
  const align = 1 - Math.abs(((hh + rr) % 997) - (tt % 997)) / 997;
  const relBoost = /位于|就职|子领域|提出|评测|属于|包含/.test(r) ? 0.08 : 0;
  const nonsense = h === t || /测试|随便|xxx/i.test(`${h}${t}`) ? -0.25 : 0;

  if (fn.kind === 'distance') {
    const dist = Number((1.2 - align * 0.95 - relBoost + Math.abs(nonsense)).toFixed(3));
    const plausibility = Number(Math.max(0.05, Math.min(0.98, 1 - dist / 1.4 + nonsense * 0.3)).toFixed(3));
    return {
      raw: dist,
      plausibility,
      detail: `距离≈${dist}（越小越合理）→ 合理性 ${plausibility}`,
    };
  }

  const sim = Number(Math.max(0.05, Math.min(0.98, align * 0.85 + relBoost + 0.1 + nonsense)).toFixed(3));
  return {
    raw: sim,
    plausibility: sim,
    detail: `相似度得分≈${sim}（越大越合理）`,
  };
}

/**
 * 审计目录专用：打分函数工作台
 * 输入三元组 → 多函数打分；静态公式框解释原理
 */
export default function ScoringFunctionWorkbench({
  initialFocus = 'distance',
}: {
  initialFocus?: ScoringFunctionFocus | null;
}) {
  const [tab, setTab] = useState<ScoringFunctionFocus>(initialFocus ?? 'distance');
  const [head, setHead] = useState('清华大学');
  const [rel, setRel] = useState('位于');
  const [tail, setTail] = useState('北京');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Array<{
    fn: ScoreFn;
    raw: number;
    plausibility: number;
    detail: string;
  }> | null>(null);

  useEffect(() => {
    if (initialFocus) setTab(initialFocus);
  }, [initialFocus]);

  const meta = TABS.find((t) => t.id === tab)!;

  const formulaFns = useMemo(() => {
    if (tab === 'distance') return SCORE_FNS.filter((f) => f.kind === 'distance');
    if (tab === 'similarity') return SCORE_FNS.filter((f) => f.kind === 'similarity');
    return SCORE_FNS;
  }, [tab]);

  const run = () => {
    const h = head.trim();
    const r = rel.trim();
    const t = tail.trim();
    if (!h || !r || !t) return;
    setRunning(true);
    window.setTimeout(() => {
      const scoped =
        tab === 'distance'
          ? SCORE_FNS.filter((f) => f.kind === 'distance')
          : tab === 'similarity'
            ? SCORE_FNS.filter((f) => f.kind === 'similarity')
            : SCORE_FNS;
      setResults(
        scoped.map((fn) => {
          const s = scoreTriple(fn, h, r, t);
          return { fn, ...s };
        }),
      );
      setRunning(false);
    }, 280);
  };

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400';

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">知识表示学习 · 打分函数</div>
          <h1 className="text-xl font-semibold text-gray-900">{meta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl">{meta.desc}</p>
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
            onClick={() => {
              setTab(t.id);
              setResults(null);
            }}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 max-w-6xl">
          {/* 输入 + 结果 */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-900">输入三元组</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">头实体 h</span>
                  <input className={inputCls} value={head} onChange={(e) => setHead(e.target.value)} />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">关系 r</span>
                  <input className={inputCls} value={rel} onChange={(e) => setRel(e.target.value)} />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">尾实体 t</span>
                  <input className={inputCls} value={tail} onChange={(e) => setTail(e.target.value)} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ['清华大学', '位于', '北京'],
                  ['李明', '就职于', '清华大学'],
                  ['知识图谱', '子领域', '人工智能'],
                  ['苹果公司', '位于', '上海'],
                ].map(([h, r, t]) => (
                  <button
                    key={`${h}-${r}-${t}`}
                    type="button"
                    onClick={() => {
                      setHead(h);
                      setRel(r);
                      setTail(t);
                    }}
                    className="text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-teal-300"
                  >
                    ({h}, {r}, {t})
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={run}
                disabled={running || !head.trim() || !rel.trim() || !tail.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
              >
                <Play className="w-4 h-4" />
                {running ? '计算中…' : tab === 'visualize' ? '计算并可视化解释' : '计算打分结果'}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  打分结果
                  <span className="ml-2 text-[11px] font-normal text-gray-400">
                    ({head || 'h'}, {rel || 'r'}, {tail || 't'})
                  </span>
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {tab === 'distance' && '展示距离类函数的归一化合理性得分（越大越合理）'}
                  {tab === 'similarity' && '展示 DistMult / ComplEx / RESCAL 等语义相似度得分'}
                  {tab === 'visualize' && '对比全部函数得分，并对照右侧公式理解原理'}
                </p>
              </div>

              {!results && (
                <p className="text-sm text-gray-400 text-center py-12">输入三元组后点击计算，结果将显示在这里</p>
              )}

              {results && (
                <div className="p-4 space-y-3">
                  {results.map(({ fn, plausibility, detail }) => (
                    <div key={fn.id} className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0">
                        <div className="text-sm font-semibold text-gray-800">{fn.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {fn.kind === 'distance' ? '距离类' : '相似度类'}
                        </div>
                      </div>
                      <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${fn.bar}`}
                          style={{ width: `${plausibility * 100}%` }}
                        />
                        <span className="absolute inset-y-0 right-2 flex items-center text-xs font-mono text-gray-700">
                          {plausibility.toFixed(3)}
                        </span>
                      </div>
                      <code className="hidden md:block text-[10px] text-gray-500 w-36 text-right font-mono truncate" title={fn.formula}>
                        {fn.formula}
                      </code>
                    </div>
                  ))}
                  {tab === 'visualize' && results[0] && (
                    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 space-y-1">
                      {results.map(({ fn, detail }) => (
                        <div key={fn.id}>
                          <span className="font-medium text-slate-800">{fn.name}</span>：{detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 静态公式解释 */}
          <div className="xl:col-span-2 space-y-3">
            <div className="text-xs font-medium text-gray-500 px-0.5">
              {tab === 'visualize' ? '所支持打分函数 · 原理与公式' : '本类打分函数 · 原理与公式'}
            </div>
            {formulaFns.map((fn) => (
              <div key={fn.id} className={`rounded-xl border p-3.5 space-y-2 ${fn.accent}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">{fn.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-black/5 text-gray-500">
                    {fn.kind === 'distance' ? '基于距离' : '语义相似度'}
                  </span>
                </div>
                <code className="block text-xs font-mono text-gray-800 bg-white/70 rounded-lg px-2.5 py-2 border border-white/80">
                  {fn.formula}
                </code>
                <p className="text-xs text-gray-700 leading-relaxed">{fn.principle}</p>
                <p className="text-[11px] text-gray-500">{fn.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
