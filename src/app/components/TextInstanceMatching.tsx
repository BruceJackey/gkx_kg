import { useState } from 'react';
import { Play, Type, Binary } from 'lucide-react';

const EXAMPLES: Array<[string, string]> = [
  ['清华大学', 'Tsinghua University'],
  ['北京大学', 'Peking University'],
  ['腾讯', 'Alibaba Group'],
  ['中科院自动化研究所', 'Institute of Automation, CAS'],
];

/** Levenshtein 归一化相似度 */
function stringSimilarity(a: string, b: string): number {
  const s = a.trim();
  const t = b.trim();
  if (!s && !t) return 1;
  if (!s || !t) return 0;
  const m = s.length;
  const n = t.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const cur =
        s[i - 1] === t[j - 1]
          ? row[j - 1]
          : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = cur;
    }
    row[n] = prev;
  }
  return 1 - row[n] / Math.max(m, n);
}

/** 字符 bigram 向量 + 余弦相似度（演示用语义近似） */
function vectorCosineSimilarity(a: string, b: string): number {
  const s = a.trim().toLowerCase();
  const t = b.trim().toLowerCase();
  if (!s && !t) return 1;
  if (!s || !t) return 0;

  const grams = (text: string) => {
    const map = new Map<string, number>();
    const padded = ` ${text} `;
    for (let i = 0; i < padded.length - 1; i++) {
      const g = padded.slice(i, i + 2);
      map.set(g, (map.get(g) ?? 0) + 1);
    }
    return map;
  };

  const va = grams(s);
  const vb = grams(t);
  const keys = new Set([...va.keys(), ...vb.keys()]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const x = va.get(k) ?? 0;
    const y = vb.get(k) ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function ScoreBar({ score, accent }: { score: number; accent: 'blue' | 'violet' }) {
  const pct = Math.round(score * 1000) / 10;
  const bar =
    accent === 'blue'
      ? score >= 0.7
        ? 'bg-blue-500'
        : score >= 0.45
          ? 'bg-blue-300'
          : 'bg-blue-200'
      : score >= 0.7
        ? 'bg-violet-500'
        : score >= 0.45
          ? 'bg-violet-300'
          : 'bg-violet-200';
  const text =
    accent === 'blue'
      ? score >= 0.7
        ? 'text-blue-700'
        : 'text-blue-500'
      : score >= 0.7
        ? 'text-violet-700'
        : 'text-violet-500';

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className={`text-3xl font-semibold tabular-nums ${text}`}>{pct.toFixed(1)}%</span>
        <span className="text-xs text-gray-400 mb-1">得分 {(score).toFixed(4)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export default function TextInstanceMatching() {
  const [a, setA] = useState('清华大学');
  const [b, setB] = useState('Tsinghua University');
  const [strScore, setStrScore] = useState<number | null>(null);
  const [vecScore, setVecScore] = useState<number | null>(null);

  const run = () => {
    setStrScore(stringSimilarity(a, b));
    setVecScore(vectorCosineSimilarity(a, b));
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">文本实例匹配</h1>
        <p className="text-sm text-gray-400">
          输入两个实例文本，分别计算字符串相似度与文本向量余弦相似度
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">实例 A</span>
            <input
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="输入源实例名称或描述"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">实例 B</span>
            <input
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder="输入目标实例名称或描述"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400">示例：</span>
          {EXAMPLES.map(([x, y]) => (
            <button
              key={`${x}-${y}`}
              type="button"
              onClick={() => {
                setA(x);
                setB(y);
                setStrScore(null);
                setVecScore(null);
              }}
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {x} ↔ {y}
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
          计算相似度
        </button>
      </div>

      {(strScore !== null || vecScore !== null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100 bg-blue-50">
              <Type className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-900">字符串相似度匹配</div>
                <div className="text-[11px] text-blue-700/70">基于编辑距离（Levenshtein）归一化</div>
              </div>
            </div>
            <div className="p-4">
              {strScore !== null && <ScoreBar score={strScore} accent="blue" />}
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                利用字符串相似度算法判断两个实例是否指向同一实体（字面层）。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-100 bg-violet-50">
              <Binary className="w-4 h-4 text-violet-600" />
              <div>
                <div className="text-sm font-medium text-violet-900">文本向量相似度匹配</div>
                <div className="text-[11px] text-violet-700/70">字符 bigram 向量余弦相似度</div>
              </div>
            </div>
            <div className="p-4">
              {vecScore !== null && <ScoreBar score={vecScore} accent="violet" />}
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                利用文本向量的余弦相似度判断语义上的相似性（语义层）。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
