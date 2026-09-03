import { useState } from 'react';
import { Play, Type, Sparkles, Binary } from 'lucide-react';

const EXAMPLES: Array<[string, string]> = [
  ['清华大学', '清华大學'],
  ['Knowledge Graph', 'knowledge graphs'],
  ['北京', '北京大学'],
  ['Geoffrey Hinton', 'G. Hinton'],
];

type AlgoId = 'edit_distance' | 'jaro_winkler' | 'cosine';

const ALGORITHMS: Array<{ id: AlgoId; label: string; desc: string }> = [
  { id: 'edit_distance', label: '编辑距离', desc: 'Levenshtein 归一化相似度' },
  { id: 'jaro_winkler', label: 'Jaro-Winkler', desc: '前缀加权字符串相似度' },
  { id: 'cosine', label: '词向量余弦相似度', desc: '字符 n-gram 向量余弦（演示）' },
];

/** Levenshtein 归一化相似度 ∈ [0,1] */
function editDistanceSimilarity(a: string, b: string): { score: number; distance: number } {
  const s = a.trim();
  const t = b.trim();
  if (!s && !t) return { score: 1, distance: 0 };
  if (!s || !t) return { score: 0, distance: Math.max(s.length, t.length) };
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
  const distance = row[n];
  return { score: 1 - distance / Math.max(m, n), distance };
}

/** Jaro 相似度 */
function jaro(a: string, b: string): number {
  const s = a.trim();
  const t = b.trim();
  if (!s && !t) return 1;
  if (!s || !t) return 0;
  const matchWindow = Math.floor(Math.max(s.length, t.length) / 2) - 1;
  const sMatches = new Array(s.length).fill(false);
  const tMatches = new Array(t.length).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < s.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, t.length);
    for (let j = start; j < end; j++) {
      if (tMatches[j] || s[i] !== t[j]) continue;
      sMatches[i] = true;
      tMatches[j] = true;
      matches += 1;
      break;
    }
  }
  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < s.length; i++) {
    if (!sMatches[i]) continue;
    while (!tMatches[k]) k += 1;
    if (s[i] !== t[k]) transpositions += 1;
    k += 1;
  }

  return (
    (matches / s.length + matches / t.length + (matches - transpositions / 2) / matches) / 3
  );
}

/** Jaro-Winkler 相似度 */
function jaroWinkler(a: string, b: string, p = 0.1): number {
  const s = a.trim();
  const t = b.trim();
  const j = jaro(s, t);
  let prefix = 0;
  const maxPrefix = Math.min(4, s.length, t.length);
  while (prefix < maxPrefix && s[prefix] === t[prefix]) prefix += 1;
  return j + prefix * p * (1 - j);
}

/** 词向量余弦相似度（字符 bigram 演示） */
function cosineSimilarity(a: string, b: string): number {
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

interface AlgoResult {
  algorithm: AlgoId;
  label: string;
  score: number;
  detail?: string;
}

/**
 * 审计目录专用：相似度计算引擎接口演示
 */
export default function SimilarityComputationEngine() {
  const [left, setLeft] = useState('清华大学');
  const [right, setRight] = useState('清华大學');
  const [selected, setSelected] = useState<AlgoId[]>(['edit_distance', 'jaro_winkler', 'cosine']);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AlgoResult[] | null>(null);
  const [responseJson, setResponseJson] = useState('');

  const toggleAlgo = (id: AlgoId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const run = () => {
    if (!left.trim() || !right.trim() || selected.length === 0) return;
    setRunning(true);
    setResults(null);
    setResponseJson('');

    setTimeout(() => {
      const out: AlgoResult[] = [];
      if (selected.includes('edit_distance')) {
        const { score, distance } = editDistanceSimilarity(left, right);
        out.push({
          algorithm: 'edit_distance',
          label: '编辑距离',
          score,
          detail: `Levenshtein distance = ${distance}`,
        });
      }
      if (selected.includes('jaro_winkler')) {
        out.push({
          algorithm: 'jaro_winkler',
          label: 'Jaro-Winkler',
          score: jaroWinkler(left, right),
          detail: 'prefix boost p=0.1, max prefix=4',
        });
      }
      if (selected.includes('cosine')) {
        out.push({
          algorithm: 'cosine',
          label: '词向量余弦相似度',
          score: cosineSimilarity(left, right),
          detail: 'char bigram bag-of-features cosine',
        });
      }

      const body = {
        status: 'ok',
        request_id: `sim_${Date.now()}`,
        endpoint: '/api/v1/similarity/compute',
        latency_ms: 12 + Math.floor(Math.random() * 20),
        input: { left: left.trim(), right: right.trim(), algorithms: selected },
        results: out.map((r) => ({
          algorithm: r.algorithm,
          score: Number(r.score.toFixed(6)),
          detail: r.detail,
        })),
      };

      setResults(out);
      setResponseJson(JSON.stringify(body, null, 2));
      setRunning(false);
    }, 450);
  };

  const iconFor = (id: AlgoId) => {
    if (id === 'edit_distance') return Type;
    if (id === 'jaro_winkler') return Sparkles;
    return Binary;
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">相似度计算引擎</h1>
          <p className="text-sm text-gray-500">
            内置编辑距离、Jaro-Winkler、词向量余弦等多种算法，对输入字符串对计算相似度
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/similarity/compute</code>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">字符串 A</label>
            <input
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="源文本"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">字符串 B</label>
            <input
              value={right}
              onChange={(e) => setRight(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="目标文本"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map(([a, b]) => (
            <button
              key={`${a}-${b}`}
              type="button"
              onClick={() => {
                setLeft(a);
                setRight(b);
                setResults(null);
                setResponseJson('');
              }}
              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            >
              {a} ↔ {b}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">选择算法</label>
          <div className="flex flex-wrap gap-2">
            {ALGORITHMS.map((algo) => {
              const on = selected.includes(algo.id);
              return (
                <button
                  key={algo.id}
                  type="button"
                  onClick={() => toggleAlgo(algo.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border text-left ${
                    on ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="font-medium">{algo.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{algo.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running || !left.trim() || !right.trim() || selected.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '计算中…' : '调用相似度计算接口'}
        </button>
      </div>

      {results && (
        <div className="max-w-3xl space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            {results.map((r) => {
              const Icon = iconFor(r.algorithm);
              const pct = Math.round(r.score * 1000) / 10;
              return (
                <div key={r.algorithm} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-medium text-gray-800">{r.label}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-2xl font-semibold tabular-nums text-blue-700">{pct.toFixed(1)}%</div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">score={r.score.toFixed(4)}</div>
                    {r.detail && <div className="text-[11px] text-gray-500">{r.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-500 mb-2">接口返回结果</div>
            <pre className="bg-gray-950 text-green-400 rounded-xl px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {responseJson}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
