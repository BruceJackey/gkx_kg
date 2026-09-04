import { useEffect, useState } from 'react';
import { CheckCircle2, Network, Play, Sparkles } from 'lucide-react';

export type TermConfidenceGraphFocus = 'graph' | 'ranking';

const ENDPOINT = '/api/v1/terms/confidence-graph:build';

const SAMPLE_TERMS = [
  '知识图谱',
  '深度学习',
  '图神经网络',
  '实体抽取',
  '关系抽取',
  '本体论',
  '自然语言处理',
  '大模型',
].join('\n');

const SAMPLE_SEEDS = ['知识图谱', '深度学习'].join('\n');

interface GraphNode {
  id: string;
  term: string;
  is_seed: boolean;
  confidence: number;
  rank: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

/** 简易字符 bigram 余弦，用于演示术语相似度 */
function cosineSim(a: string, b: string): number {
  const s = a.trim().toLowerCase();
  const t = b.trim().toLowerCase();
  if (!s || !t) return 0;
  if (s === t) return 1;
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

function parseLines(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/[\n,，;；]+/)) {
    const t = line.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function buildGraph(terms: string[], seeds: string[], simThreshold: number, damping: number) {
  const seedSet = new Set(seeds.filter((s) => terms.includes(s)));
  if (seedSet.size === 0 && terms.length > 0) {
    // 无种子时默认取前 2 个为种子
    terms.slice(0, Math.min(2, terms.length)).forEach((t) => seedSet.add(t));
  }

  const edges: GraphEdge[] = [];
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const w = cosineSim(terms[i], terms[j]);
      if (w >= simThreshold) {
        edges.push({
          source: terms[i],
          target: terms[j],
          weight: Number(w.toFixed(4)),
        });
      }
    }
  }

  // 邻接表（无向）
  const adj = new Map<string, Array<{ to: string; w: number }>>();
  for (const t of terms) adj.set(t, []);
  for (const e of edges) {
    adj.get(e.source)!.push({ to: e.target, w: e.weight });
    adj.get(e.target)!.push({ to: e.source, w: e.weight });
  }

  // 置信度传播：种子=1，迭代加权平均
  const score = new Map<string, number>();
  for (const t of terms) score.set(t, seedSet.has(t) ? 1 : 0.05);
  for (let iter = 0; iter < 12; iter++) {
    const next = new Map(score);
    for (const t of terms) {
      if (seedSet.has(t)) {
        next.set(t, 1);
        continue;
      }
      const neighbors = adj.get(t) ?? [];
      if (neighbors.length === 0) {
        next.set(t, score.get(t) ?? 0.05);
        continue;
      }
      let num = 0;
      let den = 0;
      for (const n of neighbors) {
        num += n.w * (score.get(n.to) ?? 0);
        den += n.w;
      }
      const propagated = den > 0 ? num / den : 0;
      next.set(t, damping * propagated + (1 - damping) * (score.get(t) ?? 0));
    }
    for (const [k, v] of next) score.set(k, v);
  }

  const ranked = [...terms]
    .map((t) => ({ term: t, confidence: score.get(t) ?? 0 }))
    .sort((a, b) => b.confidence - a.confidence);

  const nodes: GraphNode[] = ranked.map((r, i) => ({
    id: `term:${r.term}`,
    term: r.term,
    is_seed: seedSet.has(r.term),
    confidence: Number(r.confidence.toFixed(4)),
    rank: i + 1,
  }));

  return {
    status: 'ok',
    request_id: `tcg_${Date.now()}`,
    endpoint: ENDPOINT,
    latency_ms: 12 + Math.floor(Math.random() * 25),
    parameters: {
      similarity_threshold: simThreshold,
      damping,
      seed_count: seedSet.size,
      term_count: terms.length,
    },
    capabilities: [
      {
        id: 'graph',
        name: '语义相似度图构建',
        description: '基于术语向量，自动构建以术语为节点、相似度为边权重的图。',
      },
      {
        id: 'ranking',
        name: '置信度计算与排序',
        description: '将种子术语作为高置信度节点，在图上运行传播算法，为所有节点打分。',
      },
    ],
    subgraph: {
      nodes,
      edges: edges.map((e) => ({
        ...e,
        source: `term:${e.source}`,
        target: `term:${e.target}`,
      })),
    },
  };
}

/**
 * 审计目录专用：语义相似度图构建 + 置信度传播排序接口演示
 */
export default function TermConfidenceGraphApi({
  initialFocus,
}: {
  initialFocus?: TermConfidenceGraphFocus | null;
}) {
  const [focus, setFocus] = useState<TermConfidenceGraphFocus>(initialFocus ?? 'graph');
  const [termsText, setTermsText] = useState(SAMPLE_TERMS);
  const [seedsText, setSeedsText] = useState(SAMPLE_SEEDS);
  const [threshold, setThreshold] = useState(0.12);
  const [damping, setDamping] = useState(0.85);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof buildGraph> | null>(null);
  const [responseJson, setResponseJson] = useState('');

  useEffect(() => {
    if (initialFocus) setFocus(initialFocus);
  }, [initialFocus]);

  const run = () => {
    const terms = parseLines(termsText);
    if (terms.length < 2) return;
    const seeds = parseLines(seedsText);
    setRunning(true);
    setResult(null);
    setResponseJson('');
    window.setTimeout(() => {
      const body = buildGraph(terms, seeds, threshold, damping);
      setResult(body);
      setResponseJson(JSON.stringify(body, null, 2));
      setRunning(false);
    }, 450);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">术语置信度图构建与排序</h1>
          <p className="text-sm text-gray-500">
            输入术语列表，构建语义相似度子图，并以种子术语传播置信度打分
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
        <button
          type="button"
          onClick={() => setFocus('graph')}
          className={`text-left bg-white border rounded-xl p-4 ${
            focus === 'graph' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Network className={`w-4 h-4 ${focus === 'graph' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-semibold text-gray-900">语义相似度图构建</span>
          </div>
          <p className="text-xs text-gray-500">术语为节点，相似度为边权重</p>
        </button>
        <button
          type="button"
          onClick={() => setFocus('ranking')}
          className={`text-left bg-white border rounded-xl p-4 ${
            focus === 'ranking' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={`w-4 h-4 ${focus === 'ranking' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-semibold text-gray-900">置信度计算与排序</span>
          </div>
          <p className="text-xs text-gray-500">种子节点高置信度，图上传播打分</p>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">{ENDPOINT}</code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">术语列表（每行一个）</label>
            <textarea
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              rows={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">种子术语（高置信度节点）</label>
            <textarea
              value={seedsText}
              onChange={(e) => setSeedsText(e.target.value)}
              rows={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">similarity_threshold</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">damping</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={damping}
              onChange={(e) => setDamping(Number(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '构建中…' : '构建子图并打分'}
        </button>
      </div>

      {result && (
        <div className="max-w-4xl space-y-4 pb-6">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            完成 · 节点 {result.subgraph.nodes.length} · 边 {result.subgraph.edges.length} · latency{' '}
            {result.latency_ms} ms
          </div>

          <div className={`bg-white border rounded-xl overflow-hidden ${focus === 'ranking' ? 'border-blue-300' : 'border-gray-200'}`}>
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-800">
              subgraph.nodes（含 confidence / rank）
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 bg-slate-50">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">rank</th>
                    <th className="text-left font-medium px-4 py-2">term</th>
                    <th className="text-left font-medium px-4 py-2">seed</th>
                    <th className="text-left font-medium px-4 py-2">confidence</th>
                    <th className="text-left font-medium px-4 py-2 w-40" />
                  </tr>
                </thead>
                <tbody>
                  {result.subgraph.nodes.map((n) => (
                    <tr key={n.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 tabular-nums text-gray-500">#{n.rank}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{n.term}</td>
                      <td className="px-4 py-2">
                        {n.is_seed ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                            seed
                          </span>
                        ) : (
                          <span className="text-gray-300">–</span>
                        )}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-blue-700 font-medium">
                        {n.confidence.toFixed(4)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, n.confidence * 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`bg-white border rounded-xl overflow-hidden ${focus === 'graph' ? 'border-blue-300' : 'border-gray-200'}`}>
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-800">
              subgraph.edges（similarity weight）
            </div>
            {result.subgraph.edges.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400">无边：可降低 similarity_threshold 后重试</p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {result.subgraph.edges
                  .slice()
                  .sort((a, b) => b.weight - a.weight)
                  .map((e) => (
                    <li key={`${e.source}-${e.target}`} className="px-4 py-2.5 flex items-center gap-2 text-sm">
                      <span className="text-gray-800">{e.source.replace(/^term:/, '')}</span>
                      <span className="text-gray-300">—</span>
                      <span className="text-gray-800">{e.target.replace(/^term:/, '')}</span>
                      <span className="ml-auto tabular-nums text-teal-700 text-xs font-medium">
                        w={e.weight.toFixed(4)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600 mb-1.5">响应 JSON</div>
            <pre className="text-xs font-mono bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700 max-h-72">
              {responseJson}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
