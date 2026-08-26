import { useState } from 'react';
import { Play, Type, Network, Hash } from 'lucide-react';

type FeatureRow = {
  key: string;
  label: string;
  category: '文本' | '结构' | '数值';
  value: number | string;
  detail?: string;
};

const EXAMPLES: Array<{ a: string; b: string; aAttrs: string; bAttrs: string }> = [
  {
    a: '清华大学',
    b: 'Tsinghua University',
    aAttrs: '成立年份=1911; 师生数=53000; 所在城市=北京',
    bAttrs: 'founded=1911; students=52000; city=Beijing',
  },
  {
    a: 'Geoffrey Hinton',
    b: '杰弗里·辛顿',
    aAttrs: '出生年=1947; h指数=180; 机构=多伦多大学',
    bAttrs: '出生年=1948; h指数=175; 机构=多伦多大学',
  },
  {
    a: '宁德时代',
    b: '比亚迪',
    aAttrs: '成立年份=2011; 市值=9000; 产品=动力电池',
    bAttrs: '成立年份=1995; 市值=7000; 产品=新能源汽车,动力电池',
  },
];

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  raw.split(/[;\n]+/).forEach((part) => {
    const m = part.trim().match(/^([^=：:]+)[=：:](.+)$/);
    if (m) out[m[1].trim().toLowerCase()] = m[2].trim();
  });
  return out;
}

function levRatio(a: string, b: string): number {
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

function tokenJaccard(a: string, b: string): number {
  const tok = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/[\s,，、;/|]+/)
        .map((x) => x.trim())
        .filter(Boolean),
    );
  const A = tok(a);
  const B = tok(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / (A.size + B.size - inter || 1);
}

function extractNum(v: string | undefined): number | null {
  if (!v) return null;
  const m = v.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function extractFeatures(a: string, b: string, aAttrsRaw: string, bAttrsRaw: string): FeatureRow[] {
  const aAttrs = parseAttrs(aAttrsRaw);
  const bAttrs = parseAttrs(bAttrsRaw);
  const keysA = new Set(Object.keys(aAttrs));
  const keysB = new Set(Object.keys(bAttrs));
  let keyInter = 0;
  for (const k of keysA) if (keysB.has(k)) keyInter += 1;
  const keyUnion = keysA.size + keysB.size - keyInter || 1;

  const sharedVals: string[] = [];
  for (const k of keysA) {
    if (keysB.has(k) && aAttrs[k].toLowerCase() === bAttrs[k].toLowerCase()) {
      sharedVals.push(k);
    }
  }

  const numsA = Object.values(aAttrs).map(extractNum).filter((n): n is number => n !== null);
  const numsB = Object.values(bAttrs).map(extractNum).filter((n): n is number => n !== null);
  const pairedDiffs: Array<{ key: string; abs: number; rel: number }> = [];
  for (const k of keysA) {
    if (!keysB.has(k)) continue;
    const na = extractNum(aAttrs[k]);
    const nb = extractNum(bAttrs[k]);
    if (na !== null && nb !== null) {
      const abs = Math.abs(na - nb);
      pairedDiffs.push({
        key: k,
        abs,
        rel: abs / Math.max(Math.abs(na), Math.abs(nb), 1),
      });
    }
  }
  const avgAbsDiff =
    pairedDiffs.length > 0
      ? pairedDiffs.reduce((s, x) => s + x.abs, 0) / pairedDiffs.length
      : numsA.length && numsB.length
        ? Math.abs(
            numsA.reduce((s, x) => s + x, 0) / numsA.length -
              numsB.reduce((s, x) => s + x, 0) / numsB.length,
          )
        : 0;
  const avgRelDiff =
    pairedDiffs.length > 0
      ? pairedDiffs.reduce((s, x) => s + x.rel, 0) / pairedDiffs.length
      : 0;

  const strSim = levRatio(a, b);
  const tokenSim = tokenJaccard(a, b);
  const attrKeyOverlap = keyInter / keyUnion;
  const attrValOverlap = sharedVals.length / (keyInter || 1);

  // 结构特征：用属性键空间与取值重合近似邻居/属性图结构
  const structDegreeDiff = Math.abs(keysA.size - keysB.size);
  const structOverlap = attrKeyOverlap * 0.6 + attrValOverlap * 0.4;

  return [
    {
      key: 'str_similarity',
      label: '字符串相似度',
      category: '文本',
      value: +strSim.toFixed(4),
      detail: 'Levenshtein 归一化',
    },
    {
      key: 'token_jaccard',
      label: '词元 Jaccard',
      category: '文本',
      value: +tokenSim.toFixed(4),
      detail: '名称分词重叠',
    },
    {
      key: 'name_len_ratio',
      label: '名称长度比',
      category: '文本',
      value: +(Math.min(a.length, b.length) / Math.max(a.length, b.length || 1)).toFixed(4),
      detail: `len(A)=${a.length}, len(B)=${b.length}`,
    },
    {
      key: 'attr_key_iou',
      label: '属性键重合度',
      category: '结构',
      value: +attrKeyOverlap.toFixed(4),
      detail: `共同键 ${keyInter} / 并集 ${keyUnion}`,
    },
    {
      key: 'attr_val_match',
      label: '同键同值比例',
      category: '结构',
      value: +attrValOverlap.toFixed(4),
      detail: sharedVals.length ? `匹配键: ${sharedVals.join(', ')}` : '无完全相同键值',
    },
    {
      key: 'struct_overlap',
      label: '结构综合分',
      category: '结构',
      value: +structOverlap.toFixed(4),
      detail: '键重合×0.6 + 值重合×0.4',
    },
    {
      key: 'degree_diff',
      label: '属性度数差',
      category: '结构',
      value: structDegreeDiff,
      detail: `|deg(A)-deg(B)| = |${keysA.size}-${keysB.size}|`,
    },
    {
      key: 'num_abs_diff_avg',
      label: '数值平均绝对差',
      category: '数值',
      value: +avgAbsDiff.toFixed(4),
      detail: pairedDiffs.length ? `${pairedDiffs.length} 对同键数值` : '无同键数值时用均值差',
    },
    {
      key: 'num_pair_count',
      label: '可对齐数值对数',
      category: '数值',
      value: pairedDiffs.length,
      detail: '两侧均可解析为数字的同名属性',
    },
    {
      key: 'num_rel_diff',
      label: '相对数值差',
      category: '数值',
      value: +avgRelDiff.toFixed(4),
      detail: '|a-b| / max(|a|,|b|,1) 平均',
    },
  ];
}

const CATEGORY_STYLE: Record<FeatureRow['category'], { badge: string; icon: typeof Type; header: string }> = {
  文本: {
    badge: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: Type,
    header: 'border-blue-100 bg-blue-50 text-blue-900',
  },
  结构: {
    badge: 'text-purple-700 bg-purple-50 border-purple-200',
    icon: Network,
    header: 'border-purple-100 bg-purple-50 text-purple-900',
  },
  数值: {
    badge: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: Hash,
    header: 'border-amber-100 bg-amber-50 text-amber-900',
  },
};

export default function InstanceFeatureEngineering() {
  const [a, setA] = useState(EXAMPLES[0].a);
  const [b, setB] = useState(EXAMPLES[0].b);
  const [aAttrs, setAAttrs] = useState(EXAMPLES[0].aAttrs);
  const [bAttrs, setBAttrs] = useState(EXAMPLES[0].bAttrs);
  const [features, setFeatures] = useState<FeatureRow[] | null>(null);

  const run = () => {
    setFeatures(extractFeatures(a, b, aAttrs, bAttrs));
  };

  const byCat = (cat: FeatureRow['category']) =>
    features?.filter((f) => f.category === cat) ?? [];

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">特征工程</h1>
        <p className="text-sm text-gray-400">
          输入两个实例及其属性，自动提取文本、结构、数值等多维特征
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">实例 A 名称</span>
            <input
              value={a}
              onChange={(e) => setA(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
              placeholder="实例名称"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">实例 B 名称</span>
            <input
              value={b}
              onChange={(e) => setB(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
              placeholder="实例名称"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">实例 A 属性（key=value，分号分隔）</span>
            <textarea
              value={aAttrs}
              onChange={(e) => setAAttrs(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 font-mono text-[12px]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">实例 B 属性（key=value，分号分隔）</span>
            <textarea
              value={bAttrs}
              onChange={(e) => setBAttrs(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 font-mono text-[12px]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400">示例：</span>
          {EXAMPLES.map((ex) => (
            <button
              key={`${ex.a}-${ex.b}`}
              type="button"
              onClick={() => {
                setA(ex.a);
                setB(ex.b);
                setAAttrs(ex.aAttrs);
                setBAttrs(ex.bAttrs);
                setFeatures(null);
              }}
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {ex.a} ↔ {ex.b}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!a.trim() || !b.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          提取特征
        </button>
      </div>

      {features && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
          {(['文本', '结构', '数值'] as const).map((cat) => {
            const style = CATEGORY_STYLE[cat];
            const Icon = style.icon;
            const rows = byCat(cat);
            return (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${style.header}`}>
                  <Icon className="w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">{cat}特征</div>
                    <div className="text-[11px] opacity-70">{rows.length} 维</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {rows.map((f) => (
                    <div key={f.key} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div>
                          <div className="text-xs font-medium text-gray-800">{f.label}</div>
                          <div className="text-[10px] font-mono text-gray-400">{f.key}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ${style.badge}`}>
                          {cat}
                        </span>
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-gray-900 mt-1">
                        {typeof f.value === 'number' ? f.value : f.value}
                      </div>
                      {f.detail && <div className="text-[11px] text-gray-400 mt-0.5">{f.detail}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
