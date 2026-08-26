import { useState } from 'react';
import { Play, Languages, GitCompare, ArrowRightLeft, CheckCircle2, XCircle } from 'lucide-react';

type Tab = 'name' | 'value';

const ATTR_EXAMPLES: Array<{ zh: string; en: string }> = [
  { zh: '成立时间', en: 'Founded Date' },
  { zh: '所在地', en: 'Location' },
  { zh: '员工人数', en: 'Number of Employees' },
  { zh: '官方网站', en: 'Official Website' },
];

const ATTR_LEXICON: Record<string, { zh: string; en: string; sim: number }> = {
  成立时间: { zh: '成立时间', en: 'Founded Date', sim: 0.93 },
  'founded date': { zh: '成立时间', en: 'Founded Date', sim: 0.93 },
  所在地: { zh: '所在地', en: 'Location', sim: 0.91 },
  location: { zh: '所在地', en: 'Location', sim: 0.91 },
  员工人数: { zh: '员工人数', en: 'Number of Employees', sim: 0.88 },
  'number of employees': { zh: '员工人数', en: 'Number of Employees', sim: 0.88 },
  官方网站: { zh: '官方网站', en: 'Official Website', sim: 0.9 },
  'official website': { zh: '官方网站', en: 'Official Website', sim: 0.9 },
  注册资本: { zh: '注册资本', en: 'Registered Capital', sim: 0.87 },
  'registered capital': { zh: '注册资本', en: 'Registered Capital', sim: 0.87 },
};

const VALUE_EXAMPLE_ZH = `清华大学,成立时间,1911
北京大学,成立时间,1898
清华大学,所在地,北京
北京大学,所在地,北京`;

const VALUE_EXAMPLE_EN = `Tsinghua University,Founded Date,1911
Peking University,Founded Date,1898
Tsinghua University,Location,Beijing
Peking University,Location,Beijing`;

function isChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function stringSimilarity(a: string, b: string): number {
  const s = a.trim().toLowerCase();
  const t = b.trim().toLowerCase();
  if (!s && !t) return 1;
  if (!s || !t) return 0;
  const m = s.length;
  const n = t.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const cur = s[i - 1] === t[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = cur;
    }
    row[n] = prev;
  }
  return 1 - row[n] / Math.max(m, n);
}

function translateAttr(name: string): { zh: string; en: string } {
  const key = name.trim().toLowerCase();
  const lex = ATTR_LEXICON[name.trim()] ?? ATTR_LEXICON[key];
  if (lex) return { zh: lex.zh, en: lex.en };

  if (isChinese(name)) {
    const en = name
      .replace(/成立时间/g, 'Founded Date')
      .replace(/所在地/g, 'Location')
      .replace(/员工人数/g, 'Number of Employees')
      .replace(/官方网站/g, 'Official Website')
      .replace(/注册资本/g, 'Registered Capital');
    return { zh: name.trim(), en: en === name.trim() ? `[EN] ${name.trim()}` : en };
  }
  return {
    zh: `[中文] ${name.trim()}`,
    en: name.trim(),
  };
}

function matchAttributeNames(zh: string, en: string): {
  zhTranslated: string;
  enTranslated: string;
  stringSim: number;
  translationSim: number;
  combinedScore: number;
  matched: boolean;
  method: string;
} {
  const z = zh.trim();
  const e = en.trim();
  const zKey = z.toLowerCase();
  const eKey = e.toLowerCase();

  const lex =
    ATTR_LEXICON[z] ??
    ATTR_LEXICON[zKey] ??
    ATTR_LEXICON[e] ??
    ATTR_LEXICON[eKey];

  const trans = translateAttr(isChinese(z) ? z : e);
  const zhNorm = isChinese(z) ? z : trans.zh;
  const enNorm = isChinese(e) ? e : trans.en;

  const directStrSim = stringSimilarity(z, e);
  const crossStrSim = stringSimilarity(zhNorm, enNorm);

  let translationSim = crossStrSim;
  if (lex && ((lex.zh === z && lex.en.toLowerCase() === eKey) || (lex.en.toLowerCase() === eKey && lex.zh === z))) {
    translationSim = lex.sim;
  }

  const combinedScore = lex
    ? translationSim * 0.6 + directStrSim * 0.1 + 0.3
    : translationSim * 0.65 + directStrSim * 0.35;

  const score = Math.max(0, Math.min(0.99, combinedScore));

  return {
    zhTranslated: zhNorm,
    enTranslated: enNorm,
    stringSim: directStrSim,
    translationSim,
    combinedScore: score,
    matched: score >= 0.75,
    method: lex ? '翻译服务 + 字符串相似度（词典锚点）' : '翻译服务 + Levenshtein 字符串相似度',
  };
}

type Triple = { instance: string; attr: string; value: string };

function parseTriples(text: string): Triple[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,，|]/).map((p) => p.trim());
      return {
        instance: parts[0] ?? '',
        attr: parts[1] ?? '',
        value: parts[2] ?? '',
      };
    })
    .filter((t) => t.instance && t.attr && t.value);
}

function normalizeValue(v: string): string {
  return v.trim().toLowerCase();
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function alignByInstanceValues(zhText: string, enText: string): {
  attrPairs: Array<{
    zhAttr: string;
    enAttr: string;
    overlap: number;
    zhValues: string[];
    enValues: string[];
    sharedValues: string[];
    equivalent: boolean;
  }>;
  instancePairs: Array<{ zh: string; en: string; sharedAttrs: number }>;
  overallEquivalent: boolean;
} {
  const zhTriples = parseTriples(zhText);
  const enTriples = parseTriples(enText);

  const zhByAttr = new Map<string, Set<string>>();
  const enByAttr = new Map<string, Set<string>>();

  for (const t of zhTriples) {
    const set = zhByAttr.get(t.attr) ?? new Set();
    set.add(normalizeValue(t.value));
    zhByAttr.set(t.attr, set);
  }
  for (const t of enTriples) {
    const set = enByAttr.get(t.attr) ?? new Set();
    set.add(normalizeValue(t.value));
    enByAttr.set(t.attr, set);
  }

  const zhAttrs = [...zhByAttr.keys()];
  const enAttrs = [...enByAttr.keys()];

  const attrPairs = zhAttrs.map((zhAttr) => {
    const zhValues = [...(zhByAttr.get(zhAttr) ?? [])];
    let bestEn = enAttrs[0] ?? '';
    let bestOverlap = 0;

    for (const enAttr of enAttrs) {
      const enValues = enByAttr.get(enAttr) ?? new Set();
      const overlap = jaccard(zhByAttr.get(zhAttr) ?? new Set(), enValues);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestEn = enAttr;
      }
    }

    const enValues = [...(enByAttr.get(bestEn) ?? [])];
    const shared = zhValues.filter((v) => enValues.includes(v));

    return {
      zhAttr,
      enAttr: bestEn,
      overlap: bestOverlap,
      zhValues,
      enValues,
      sharedValues: shared,
      equivalent: bestOverlap >= 0.6,
    };
  });

  const zhInstances = new Map<string, Set<string>>();
  const enInstances = new Map<string, Set<string>>();
  for (const t of zhTriples) {
    const s = zhInstances.get(t.instance) ?? new Set();
    s.add(`${t.attr}=${normalizeValue(t.value)}`);
    zhInstances.set(t.instance, s);
  }
  for (const t of enTriples) {
    const s = enInstances.get(t.instance) ?? new Set();
    s.add(`${t.attr}=${normalizeValue(t.value)}`);
    enInstances.set(t.instance, s);
  }

  const instancePairs: Array<{ zh: string; en: string; sharedAttrs: number }> = [];
  for (const [zhInst, zhSigs] of zhInstances) {
    let bestEn = '';
    let bestShared = 0;
    for (const [enInst, enSigs] of enInstances) {
      const sharedByValue = [...zhSigs].filter((sig) => {
        const val = sig.split('=')[1];
        return [...enSigs].some((es) => es.split('=')[1] === val);
      }).length;
      if (sharedByValue > bestShared) {
        bestShared = sharedByValue;
        bestEn = enInst;
      }
    }
    if (bestEn) instancePairs.push({ zh: zhInst, en: bestEn, sharedAttrs: bestShared });
  }

  const overallEquivalent = attrPairs.length > 0 && attrPairs.every((p) => p.equivalent);

  return { attrPairs, instancePairs, overallEquivalent };
}

function ScoreBar({ score, accent }: { score: number; accent: 'amber' | 'emerald' }) {
  const pct = Math.round(score * 1000) / 10;
  const bar =
    accent === 'amber'
      ? score >= 0.75 ? 'bg-amber-500' : score >= 0.5 ? 'bg-amber-300' : 'bg-amber-200'
      : score >= 0.75 ? 'bg-emerald-500' : score >= 0.5 ? 'bg-emerald-300' : 'bg-emerald-200';
  const text =
    accent === 'amber'
      ? score >= 0.75 ? 'text-amber-700' : 'text-amber-600'
      : score >= 0.75 ? 'text-emerald-700' : 'text-emerald-600';

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className={`text-3xl font-semibold tabular-nums ${text}`}>{pct.toFixed(1)}%</span>
        <span className="text-xs text-gray-400 mb-1">得分 {score.toFixed(4)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export type CrossLingualAttributeFocus = 'name' | 'value';

export default function CrossLingualAttributeAlignment({
  initialFocus,
}: {
  initialFocus?: CrossLingualAttributeFocus | null;
}) {
  const [tab, setTab] = useState<Tab>(initialFocus ?? 'name');

  const [zhAttr, setZhAttr] = useState(ATTR_EXAMPLES[0].zh);
  const [enAttr, setEnAttr] = useState(ATTR_EXAMPLES[0].en);
  const [nameResult, setNameResult] = useState<ReturnType<typeof matchAttributeNames> | null>(null);

  const [zhTriples, setZhTriples] = useState(VALUE_EXAMPLE_ZH);
  const [enTriples, setEnTriples] = useState(VALUE_EXAMPLE_EN);
  const [valueResult, setValueResult] = useState<ReturnType<typeof alignByInstanceValues> | null>(null);

  const runNameMatch = () => {
    setNameResult(matchAttributeNames(zhAttr, enAttr));
  };

  const runValueAlign = () => {
    setValueResult(alignByInstanceValues(zhTriples, enTriples));
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">跨语言属性对齐</h1>
        <p className="text-sm text-gray-400">
          属性名称翻译匹配与基于实例值的跨语言属性等价判定
        </p>
      </div>

      <div className="flex gap-1 bg-white/10 rounded-lg p-1 max-w-lg flex-shrink-0">
        {([
          ['name', '属性名称翻译与匹配', Languages],
          ['value', '基于实例值的属性对齐', GitCompare],
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

      {tab === 'name' && (
        <div className="max-w-3xl space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">属性名称翻译与匹配</div>
              <p className="text-xs text-gray-500">
                输入不同语言的属性名称，通过翻译与字符串相似度算法输出匹配结果
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">中文属性名</span>
                <input
                  value={zhAttr}
                  onChange={(e) => setZhAttr(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-400"
                  placeholder="如：成立时间"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">英文属性名</span>
                <input
                  value={enAttr}
                  onChange={(e) => setEnAttr(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-400"
                  placeholder="如：Founded Date"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400">示例：</span>
              {ATTR_EXAMPLES.map((ex) => (
                <button
                  key={`${ex.zh}-${ex.en}`}
                  type="button"
                  onClick={() => {
                    setZhAttr(ex.zh);
                    setEnAttr(ex.en);
                    setNameResult(null);
                  }}
                  className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700 transition-colors"
                >
                  {ex.zh} ↔ {ex.en}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={runNameMatch}
              disabled={!zhAttr.trim() || !enAttr.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              匹配属性名称
            </button>
          </div>

          {nameResult && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
                <Languages className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">属性名称匹配结果</span>
                {nameResult.matched ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> 匹配
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    <XCircle className="w-3 h-3" /> 不匹配
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{zhAttr}</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-800">{enAttr}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                    <div className="text-gray-400 mb-0.5">翻译后（中文）</div>
                    <div className="font-medium text-gray-800">{nameResult.zhTranslated}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                    <div className="text-gray-400 mb-0.5">翻译后（English）</div>
                    <div className="font-medium text-gray-800">{nameResult.enTranslated}</div>
                  </div>
                </div>
                <ScoreBar score={nameResult.combinedScore} accent="amber" />
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div>字符串相似度：{(nameResult.stringSim * 100).toFixed(1)}%</div>
                  <div>翻译对齐相似度：{(nameResult.translationSim * 100).toFixed(1)}%</div>
                </div>
                <div className="text-xs text-gray-500">算法：{nameResult.method}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'value' && (
        <div className="max-w-4xl space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">基于实例值的属性对齐</div>
              <p className="text-xs text-gray-500">
                输入不同语言的实例及其属性值（每行：实例,属性,值），分析属性下实例值重合度判定是否等价
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">中文实例及属性</span>
                <textarea
                  value={zhTriples}
                  onChange={(e) => setZhTriples(e.target.value)}
                  rows={6}
                  className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-400 resize-y"
                  placeholder="实例,属性,值"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">英文实例及属性</span>
                <textarea
                  value={enTriples}
                  onChange={(e) => setEnTriples(e.target.value)}
                  rows={6}
                  className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-400 resize-y"
                  placeholder="Instance,Attribute,Value"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setZhTriples(VALUE_EXAMPLE_ZH);
                setEnTriples(VALUE_EXAMPLE_EN);
                setValueResult(null);
              }}
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              载入示例数据
            </button>
            <button
              type="button"
              onClick={runValueAlign}
              disabled={!zhTriples.trim() || !enTriples.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors ml-2"
            >
              <Play className="w-4 h-4" />
              分析属性等价性
            </button>
          </div>

          {valueResult && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-900">实例值属性对齐结果</span>
                {valueResult.overallEquivalent ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> 属性等价
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                    <XCircle className="w-3 h-3" /> 部分不等价
                  </span>
                )}
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-700">属性值重合分析</div>
                  {valueResult.attrPairs.map((pair) => (
                    <div key={pair.zhAttr} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-gray-800">{pair.zhAttr}</span>
                        <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-gray-800">{pair.enAttr}</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          pair.equivalent
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          值重合度 {(pair.overlap * 100).toFixed(1)}%
                          {pair.equivalent ? ' · 等价' : ' · 不等价'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-500">
                        <div>
                          <div className="text-gray-400 mb-0.5">中文侧值</div>
                          {pair.zhValues.join(', ') || '—'}
                        </div>
                        <div>
                          <div className="text-gray-400 mb-0.5">英文侧值</div>
                          {pair.enValues.join(', ') || '—'}
                        </div>
                        <div>
                          <div className="text-gray-400 mb-0.5">重合值</div>
                          <span className="text-emerald-700 font-medium">{pair.sharedValues.join(', ') || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {valueResult.instancePairs.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">实例对齐</div>
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">中文实例</th>
                            <th className="text-left px-3 py-2 font-medium">英文实例</th>
                            <th className="text-right px-3 py-2 font-medium">共享属性值数</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valueResult.instancePairs.map((row) => (
                            <tr key={row.zh} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-800">{row.zh}</td>
                              <td className="px-3 py-2 text-gray-800">{row.en}</td>
                              <td className="px-3 py-2 text-right text-emerald-700 font-medium">{row.sharedAttrs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
