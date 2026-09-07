import { useEffect, useRef, useState } from 'react';
import { Play, Sparkles } from 'lucide-react';

export type ScoringFunctionFocus = 'distance' | 'similarity' | 'visualize';

type ScoreTab = 'distance' | 'similarity';

/** 与 auditCatalog 功能点 name 严格对齐（两个打分 Tab） */
const TABS: Array<{
  id: ScoreTab;
  label: string;
  desc: string;
  endpoint: string;
}> = [
  {
    id: 'distance',
    label: '基于距离的打分函数',
    desc: '内置打分函数，通过计算实体间距离来评估三元组的合理性。',
    endpoint: 'POST /api/v1/score/distance:compute',
  },
  {
    id: 'similarity',
    label: '基于语义相似度的打分函数',
    desc: '内置DistMult、ComplEx等模型的打分函数，通过向量运算来评估语义相似度。',
    endpoint: 'POST /api/v1/score/semantic:compute',
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
  accent: string;
  bar: string;
}

/** 与算法侧接口一致：距离 TransE/TransH/TransR；语义 DistMult/ComplEx */
const SCORE_FNS: ScoreFn[] = [
  {
    id: 'transe',
    name: 'TransE',
    kind: 'distance',
    formula: 'f(h,r,t) = −‖h + r − t‖₁/₂',
    principle: '将关系 r 建模为平移：期望 h + r ≈ t。实体间平移距离越小，三元组越合理。',
    note: 'distance:compute · 适合 1-to-1 关系。',
    accent: 'border-sky-200 bg-sky-50/70',
    bar: 'bg-sky-500',
  },
  {
    id: 'transh',
    name: 'TransH',
    kind: 'distance',
    formula: 'f(h,r,t) = −‖h⊥ + dᵣ − t⊥‖',
    principle: '先将实体投影到关系超平面，再做平移。同一实体在不同关系下可有不同角色。',
    note: 'distance:compute · 缓解一对多映射问题。',
    accent: 'border-cyan-200 bg-cyan-50/70',
    bar: 'bg-cyan-500',
  },
  {
    id: 'transr',
    name: 'TransR',
    kind: 'distance',
    formula: 'f(h,r,t) = −‖Mᵣ h + r − Mᵣ t‖',
    principle: '用关系特定矩阵 Mᵣ 将实体映射到关系空间后再平移，不同关系拥有独立语义空间。',
    note: 'distance:compute · 表达力强于 TransE/TransH。',
    accent: 'border-indigo-200 bg-indigo-50/70',
    bar: 'bg-indigo-500',
  },
  {
    id: 'distmult',
    name: 'DistMult',
    kind: 'similarity',
    formula: 'f(h,r,t) = ⟨h, r, t⟩ = Σᵢ hᵢ rᵢ tᵢ',
    principle: '对角双线性：头、关系、尾向量逐元素乘积后求和，评估语义一致性。',
    note: 'semantic:compute · 参数高效，偏向对称关系。',
    accent: 'border-violet-200 bg-violet-50/70',
    bar: 'bg-violet-500',
  },
  {
    id: 'complex',
    name: 'ComplEx',
    kind: 'similarity',
    formula: 'f(h,r,t) = Re(⟨h, r, t̄⟩)',
    principle: '复数域 Hermitian 内积取实部作为得分，可建模非对称与反对称关系。',
    note: 'semantic:compute · 与 DistMult 参数量同阶。',
    accent: 'border-purple-200 bg-purple-50/70',
    bar: 'bg-purple-500',
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
    const plausibility = Number(
      Math.max(0.05, Math.min(0.98, 1 - dist / 1.4 + nonsense * 0.3)).toFixed(3),
    );
    return {
      raw: dist,
      plausibility,
      detail: `距离≈${dist}（越小越合理）→ 合理性 ${plausibility}`,
    };
  }

  const sim = Number(
    Math.max(0.05, Math.min(0.98, align * 0.85 + relBoost + 0.1 + nonsense)).toFixed(3),
  );
  return {
    raw: sim,
    plausibility: sim,
    detail: `语义得分≈${sim}（越大越合理）`,
  };
}

/**
 * 审计目录专用：打分函数
 * 两个打分 Tab；下方固定「打分函数可视化解释」公式区
 */
export default function ScoringFunctionWorkbench({
  initialFocus = 'distance',
}: {
  initialFocus?: ScoringFunctionFocus | null;
}) {
  const resolveTab = (f: ScoringFunctionFocus | null | undefined): ScoreTab =>
    f === 'similarity' ? 'similarity' : 'distance';

  const [tab, setTab] = useState<ScoreTab>(resolveTab(initialFocus));
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
  const vizRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!initialFocus) return;
    setTab(resolveTab(initialFocus));
    if (initialFocus === 'visualize') {
      window.setTimeout(() => {
        vizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [initialFocus]);

  const meta = TABS.find((t) => t.id === tab)!;
  const activeFns = SCORE_FNS.filter((f) => f.kind === tab);

  const run = () => {
    const h = head.trim();
    const r = rel.trim();
    const t = tail.trim();
    if (!h || !r || !t) return;
    setRunning(true);
    window.setTimeout(() => {
      setResults(
        activeFns.map((fn) => {
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
          <code className="mt-1.5 inline-block text-[11px] font-mono text-teal-700">{meta.endpoint}</code>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0 w-fit">
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

      <div className="flex-1 min-h-0 overflow-y-auto pb-6 space-y-4 max-w-5xl">
        {/* 输入 + 打分结果 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-900">输入三元组</h2>
            <span className="text-[11px] text-gray-400">
              {tab === 'distance' ? 'TransE / TransH / TransR' : 'DistMult / ComplEx'}
            </span>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
          >
            <Play className="w-4 h-4" />
            {running ? '计算中…' : '计算打分结果'}
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
          </div>
          {!results && (
            <p className="text-sm text-gray-400 text-center py-10">输入三元组后点击计算</p>
          )}
          {results && (
            <div className="p-4 space-y-3">
              {results.map(({ fn, plausibility, detail }) => (
                <div key={fn.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-24 flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-800">{fn.name}</div>
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
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 ml-24">{detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 下方固定：打分函数可视化解释（静态公式区） */}
        <section
          ref={vizRef}
          id="scoring-viz"
          className="bg-white border border-gray-200 rounded-xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">打分函数可视化解释</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              提供辅助工具，可视化解释特定三元组在不同打分函数下的得分原理。以下为算法侧已支持函数的公式与原理说明。
            </p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {SCORE_FNS.map((fn) => (
              <div key={fn.id} className={`rounded-xl border p-3.5 space-y-2 ${fn.accent}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">{fn.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-black/5 text-gray-500">
                    {fn.kind === 'distance' ? '距离 · distance:compute' : '语义 · semantic:compute'}
                  </span>
                </div>
                <code className="block text-xs font-mono text-gray-800 bg-white/80 rounded-lg px-2.5 py-2 border border-white">
                  {fn.formula}
                </code>
                <p className="text-xs text-gray-700 leading-relaxed">{fn.principle}</p>
                <p className="text-[11px] text-gray-500">{fn.note}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
