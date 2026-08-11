import { useState, useRef } from 'react';
import { Search, Zap, Clock, CheckCircle, Copy, ChevronRight } from 'lucide-react';

// ── static graph topology for demo ──────────────────────────────────────────
const NODES = [
  { id: 'tsinghua', label: '清华大学', type: 'org' },
  { id: 'pku', label: '北京大学', type: 'org' },
  { id: 'ustc', label: '中科大', type: 'org' },
  { id: 'zhangming', label: '张明', type: 'person' },
  { id: 'lihua', label: '李华', type: 'person' },
  { id: 'wangfang', label: '王芳', type: 'person' },
  { id: 'liujun', label: '刘军', type: 'person' },
  { id: 'ai', label: '人工智能', type: 'concept' },
  { id: 'kg', label: '知识图谱', type: 'concept' },
  { id: 'nlp', label: '自然语言处理', type: 'concept' },
  { id: 'ml', label: '机器学习', type: 'concept' },
  { id: 'ieee_tkde', label: 'IEEE TKDE', type: 'venue' },
  { id: 'acl', label: 'ACL', type: 'venue' },
];

// adjacency (undirected for path-based algos)
const EDGES: [string, string][] = [
  ['tsinghua', 'zhangming'], ['tsinghua', 'lihua'], ['tsinghua', 'ai'], ['tsinghua', 'kg'],
  ['pku', 'wangfang'], ['pku', 'liujun'], ['pku', 'nlp'], ['pku', 'ml'],
  ['ustc', 'liujun'], ['ustc', 'ai'], ['ustc', 'ml'],
  ['zhangming', 'kg'], ['zhangming', 'ieee_tkde'], ['zhangming', 'ai'],
  ['lihua', 'nlp'], ['lihua', 'acl'], ['lihua', 'kg'],
  ['wangfang', 'ml'], ['wangfang', 'acl'],
  ['liujun', 'ai'], ['liujun', 'ieee_tkde'],
  ['ai', 'kg'], ['ai', 'nlp'], ['ai', 'ml'],
  ['kg', 'nlp'],
];

// build adjacency map
const ADJ: Record<string, string[]> = {};
for (const n of NODES) ADJ[n.id] = [];
for (const [a, b] of EDGES) { ADJ[a].push(b); ADJ[b].push(a); }

// ── deterministic similarity scores (precomputed for demo) ───────────────────
type AlgoId = 'ppr' | 'simrank' | 'cosine';

const SCORES: Record<AlgoId, Record<string, number>> = {
  ppr: {
    tsinghua: 1.000, pku: 0.312, ustc: 0.278, zhangming: 0.541, lihua: 0.487,
    wangfang: 0.198, liujun: 0.231, ai: 0.623, kg: 0.589, nlp: 0.412,
    ml: 0.334, ieee_tkde: 0.298, acl: 0.265,
  },
  simrank: {
    tsinghua: 1.000, pku: 0.427, ustc: 0.381, zhangming: 0.612, lihua: 0.558,
    wangfang: 0.289, liujun: 0.315, ai: 0.534, kg: 0.498, nlp: 0.371,
    ml: 0.312, ieee_tkde: 0.265, acl: 0.241,
  },
  cosine: {
    tsinghua: 1.000, pku: 0.764, ustc: 0.698, zhangming: 0.712, lihua: 0.681,
    wangfang: 0.534, liujun: 0.578, ai: 0.843, kg: 0.812, nlp: 0.756,
    ml: 0.721, ieee_tkde: 0.489, acl: 0.467,
  },
};

const ALGOS: { id: AlgoId; name: string; type: 'path' | 'embedding'; badge: string; badgeClass: string; desc: string; latency: string; scalability: string; bestFor: string }[] = [
  {
    id: 'ppr', name: 'Personalized PageRank', type: 'path',
    badge: '路径算法', badgeClass: 'bg-blue-100 text-blue-700',
    desc: '从源节点出发随机游走，以一定概率重启回源节点，稳定后各节点的访问概率即为相似度。能自然体现图的全局结构，对稀疏图效果尤佳。',
    latency: '~15ms', scalability: '百万节点', bestFor: '全图相关性排序、推荐',
  },
  {
    id: 'simrank', name: 'SimRank', type: 'path',
    badge: '路径算法', badgeClass: 'bg-blue-100 text-blue-700',
    desc: '两节点若被相似节点共同指向则相似，递归定义。SimRank(a,b) = C·avg_{u∈N(a), v∈N(b)} SimRank(u,v)，捕捉结构对称相似性。',
    latency: '~30ms', scalability: '十万节点', bestFor: '结构等价节点检测',
  },
  {
    id: 'cosine', name: '余弦相似度（嵌入向量）', type: 'embedding',
    badge: '嵌入算法', badgeClass: 'bg-purple-100 text-purple-700',
    desc: '直接使用已训练好的实体嵌入向量，通过 cos(h, t) = (h·t)/(‖h‖·‖t‖) 计算相似度。无需图结构，延迟极低，适合实时大批量查询。',
    latency: '< 1ms', scalability: '千万节点', bestFor: '实时检索、实体对齐',
  },
];

const TYPE_COLOR: Record<string, string> = {
  org: 'bg-blue-100 text-blue-700',
  person: 'bg-green-100 text-green-700',
  concept: 'bg-purple-100 text-purple-700',
  venue: 'bg-orange-100 text-orange-700',
};

const API_EXAMPLE = (algo: AlgoId, source: string, topK: number) =>
`POST /api/node-similarity
{
  "algorithm": "${algo}",
  "source": "${source}",
  "top_k": ${topK}
}`;

export function NodeSimilarityDemo() {
  const [activeSection, setActiveSection] = useState<'path' | 'embedding' | 'api'>('path');
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoId>('ppr');
  const [sourceNode, setSourceNode] = useState('tsinghua');
  const [topK, setTopK] = useState(5);
  const [running, setRunning] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [apiCopied, setApiCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const algo = ALGOS.find(a => a.id === selectedAlgo)!;
  const source = NODES.find(n => n.id === sourceNode)!;

  const results = Object.entries(SCORES[selectedAlgo])
    .filter(([id]) => id !== sourceNode)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topK)
    .map(([id, score]) => ({ node: NODES.find(n => n.id === id)!, score }));

  const runQuery = () => {
    setRunning(true);
    setLatencyMs(null);
    const fakeLatency = algo.id === 'cosine' ? Math.round(Math.random() * 0.8 + 0.2) :
      algo.id === 'ppr' ? Math.round(Math.random() * 10 + 10) :
      Math.round(Math.random() * 15 + 22);
    timerRef.current = setTimeout(() => {
      setRunning(false);
      setLatencyMs(fakeLatency);
    }, 600);
  };

  const SECTIONS = [
    { id: 'path' as const, label: '① 路径算法' },
    { id: 'embedding' as const, label: '② 嵌入向量算法' },
    { id: 'api' as const, label: '③ 实时计算接口' },
  ];

  return (
    <div className="space-y-5">
      {/* Section nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ① Path-based ── */}
      {activeSection === 'path' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">基于路径的相似度算法</h3>
            <p className="text-sm text-gray-500 mt-0.5">无需训练，直接利用图拓扑结构计算节点间相关性，适合中等规模图谱的精确相似度查询</p>
          </div>

          {/* Algorithm cards */}
          <div className="grid grid-cols-2 gap-3">
            {ALGOS.filter(a => a.type === 'path').map(a => (
              <button key={a.id} onClick={() => setSelectedAlgo(a.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${selectedAlgo === a.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 text-sm">{a.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${a.badgeClass}`}>{a.badge}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{a.desc}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />{a.latency}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">扩展至 {a.scalability}</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{a.bestFor}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Query panel */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">交互查询：{algo.name}</p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">源节点</label>
                <select value={sourceNode} onChange={e => { setSourceNode(e.target.value); setLatencyMs(null); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  {NODES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">返回 Top-K</label>
                <select value={topK} onChange={e => setTopK(+e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                  {[3, 5, 8, 10].map(k => <option key={k} value={k}>Top-{k}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={runQuery} disabled={running}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                  <Search className="w-4 h-4" />{running ? '计算中…' : '查询'}
                </button>
              </div>
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">
                  与 <span className="font-semibold text-gray-900">{source.label}</span> 最相关的 {topK} 个节点
                </p>
                {latencyMs !== null && (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3" />耗时 {latencyMs}ms
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {results.map(({ node: n, score }, rank) => (
                  <div key={n.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-400 font-mono w-4 text-center">{rank + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-900">{n.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLOR[n.type]}`}>{n.type}</span>
                    <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${score * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-blue-700 w-12 text-right font-semibold">{score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Graph neighbors hint */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {source.label} 的直接邻居（共 {ADJ[sourceNode].length} 个）
            </p>
            <div className="flex flex-wrap gap-2">
              {ADJ[sourceNode].map(nid => {
                const n = NODES.find(x => x.id === nid)!;
                return (
                  <button key={nid} onClick={() => { setSourceNode(nid); setLatencyMs(null); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${TYPE_COLOR[n.type]} hover:opacity-80`}>
                    {n.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ② Embedding-based ── */}
      {activeSection === 'embedding' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">基于嵌入向量的相似度算法</h3>
            <p className="text-sm text-gray-500 mt-0.5">直接使用已训练好的实体向量，通过余弦相似度实现亚毫秒级大批量实时查询</p>
          </div>

          {/* Algo card */}
          {ALGOS.filter(a => a.type === 'embedding').map(a => (
            <div key={a.id} className="border-2 border-purple-300 bg-purple-50/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-gray-900">{a.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${a.badgeClass}`}>{a.badge}</span>
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />{a.latency}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{a.desc}</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <p className="text-xs text-gray-400 mb-0.5">扩展性</p>
                  <p className="font-semibold text-gray-900">{a.scalability}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <p className="text-xs text-gray-400 mb-0.5">适用场景</p>
                  <p className="font-semibold text-gray-900">{a.bestFor}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <p className="text-xs text-gray-400 mb-0.5">前提条件</p>
                  <p className="font-semibold text-gray-900">需预训练嵌入</p>
                </div>
              </div>
            </div>
          ))}

          {/* Worked example */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">余弦相似度计算示例（4维向量）</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: '清华大学', vec: [0.82, -0.31, 0.54, 0.17] },
                { name: '北京大学', vec: [0.79, -0.28, 0.51, 0.22] },
              ].map(({ name, vec }) => (
                <div key={name} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1.5 font-medium">{name} (h)</p>
                  <div className="flex gap-1.5">
                    {vec.map((v, i) => (
                      <div key={i} className="flex-1 bg-white border border-gray-200 rounded px-1.5 py-2 text-center">
                        <span className="text-xs font-mono text-gray-700">{v.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm">
              <span className="font-mono text-purple-800">cos(清华大学, 北京大学)</span>
              <span className="text-gray-600"> = (0.82·0.79 + (−0.31)·(−0.28) + 0.54·0.51 + 0.17·0.22) / (‖h‖ · ‖t‖) = </span>
              <span className="font-bold text-purple-900">0.9983</span>
            </div>
          </div>

          {/* Batch query */}
          <div className="border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">批量查询演示（余弦相似度，源：清华大学）</p>
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3" />{'< 1ms'}
              </span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(SCORES.cosine)
                .filter(([id]) => id !== 'tsinghua')
                .sort(([, a], [, b]) => b - a)
                .map(([id, score], rank) => {
                  const n = NODES.find(x => x.id === id)!;
                  return (
                    <div key={id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-400 font-mono w-4 text-center">{rank + 1}</span>
                      <span className="flex-1 text-sm font-medium text-gray-900">{n.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLOR[n.type]}`}>{n.type}</span>
                      <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${score * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-purple-700 w-12 text-right font-semibold">{score.toFixed(3)}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Comparison */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">算法对比</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">算法</th>
                  <th className="text-center px-3 py-2.5 text-gray-500 font-medium">类型</th>
                  <th className="text-center px-3 py-2.5 text-gray-500 font-medium">延迟</th>
                  <th className="text-center px-3 py-2.5 text-gray-500 font-medium">扩展性</th>
                  <th className="text-center px-3 py-2.5 text-gray-500 font-medium">需要图结构</th>
                  <th className="text-center px-3 py-2.5 text-gray-500 font-medium">需要预训练</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ALGOS.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{a.name}</td>
                    <td className="px-3 py-2.5 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${a.badgeClass}`}>{a.badge}</span></td>
                    <td className="px-3 py-2.5 text-center font-mono text-blue-700">{a.latency}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600">{a.scalability}</td>
                    <td className="px-3 py-2.5 text-center font-semibold">{a.type === 'path' ? <span className="text-green-600">✓</span> : <span className="text-gray-300">−</span>}</td>
                    <td className="px-3 py-2.5 text-center font-semibold">{a.type === 'embedding' ? <span className="text-green-600">✓</span> : <span className="text-gray-300">−</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ③ Real-time API ── */}
      {activeSection === 'api' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">实时计算接口</h3>
            <p className="text-sm text-gray-500 mt-0.5">三种算法统一封装为单一低延迟 REST API，支持 Top-K 返回、批量查询与过滤条件</p>
          </div>

          {/* Live playground */}
          <div className="border-2 border-blue-200 rounded-xl overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded font-bold">POST</span>
                <code className="text-sm font-mono text-blue-900">/api/node-similarity</code>
              </div>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">实时沙箱</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">算法 (algorithm)</label>
                  <select value={selectedAlgo} onChange={e => { setSelectedAlgo(e.target.value as AlgoId); setLatencyMs(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {ALGOS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">源节点 (source)</label>
                  <select value={sourceNode} onChange={e => { setSourceNode(e.target.value); setLatencyMs(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {NODES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">返回数量 (top_k)</label>
                  <select value={topK} onChange={e => setTopK(+e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {[3, 5, 8, 10].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              {/* Request */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-600">请求体 (Request Body)</p>
                  <button onClick={() => { navigator.clipboard.writeText(API_EXAMPLE(selectedAlgo, sourceNode, topK)); setApiCopied(true); setTimeout(() => setApiCopied(false), 1500); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    {apiCopied ? <><CheckCircle className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">已复制</span></> : <><Copy className="w-3.5 h-3.5" />复制</>}
                  </button>
                </div>
                <pre className="bg-gray-950 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto">
                  {API_EXAMPLE(selectedAlgo, sourceNode, topK)}
                </pre>
              </div>

              {/* Send */}
              <button onClick={runQuery} disabled={running}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                <Zap className="w-4 h-4" />{running ? '请求中…' : '发送请求'}
              </button>

              {/* Response */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-600">响应体 (Response)</p>
                  {latencyMs !== null && (
                    <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />200 OK · {latencyMs}ms
                    </span>
                  )}
                </div>
                <pre className="bg-gray-950 text-green-300 rounded-xl p-4 text-xs font-mono overflow-x-auto min-h-[120px]">
                  {latencyMs !== null
                    ? JSON.stringify({
                        algorithm: selectedAlgo,
                        source: sourceNode,
                        latency_ms: latencyMs,
                        results: results.map(r => ({ node: r.node.id, label: r.node.label, score: +r.score.toFixed(3) })),
                      }, null, 2)
                    : running
                      ? '// 请求中…'
                      : '// 点击"发送请求"查看响应'}
                </pre>
              </div>
            </div>
          </div>

          {/* Endpoint docs */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">接口说明</div>
            <div className="divide-y divide-gray-100">
              {[
                { field: 'algorithm', type: 'string', required: true, desc: '"ppr" | "simrank" | "cosine"' },
                { field: 'source', type: 'string', required: true, desc: '源节点 ID' },
                { field: 'top_k', type: 'integer', required: false, desc: '返回数量，默认 10，最大 100' },
                { field: 'filter_types', type: 'string[]', required: false, desc: '过滤节点类型，如 ["person", "org"]' },
                { field: 'min_score', type: 'float', required: false, desc: '分数阈值，低于此值的结果不返回' },
              ].map(p => (
                <div key={p.field} className="flex items-center gap-4 px-4 py-3 text-sm">
                  <code className="font-mono text-blue-700 w-28 flex-shrink-0">{p.field}</code>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono w-16 text-center">{p.type}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded w-12 text-center ${p.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>{p.required ? '必填' : '可选'}</span>
                  <span className="text-gray-600 flex-1">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SLA */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'PPR 延迟', value: '~15ms', sub: '百万节点图谱', color: 'bg-blue-50 text-blue-900' },
              { label: 'SimRank 延迟', value: '~30ms', sub: '十万节点图谱', color: 'bg-indigo-50 text-indigo-900' },
              { label: '余弦相似度延迟', value: '< 1ms', sub: '千万节点图谱', color: 'bg-green-50 text-green-900' },
            ].map(m => (
              <div key={m.label} className={`rounded-xl p-4 ${m.color}`}>
                <p className="text-xs opacity-70 mb-1">{m.sub}</p>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs font-semibold mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
