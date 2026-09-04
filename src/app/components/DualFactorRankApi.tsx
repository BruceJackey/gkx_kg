import { useEffect, useState } from 'react';
import { CheckCircle2, Network, Play, Sparkles, Waypoints } from 'lucide-react';

export type DualFactorRankFocus = 'structure' | 'embedding' | 'cross-resource';

const ENDPOINT = '/api/v1/general/kg-search/dual-factor-rank';

const CAPABILITIES = [
  {
    id: 'structure' as const,
    title: '图结构约束集成',
    desc: '在排序算法中考虑实体在图谱中的连接结构、中心性等拓扑特征。',
    icon: Network,
  },
  {
    id: 'embedding' as const,
    title: '嵌入相似度集成',
    desc: '将跨模态嵌入向量的语义相似度作为排序的核心因子。',
    icon: Sparkles,
  },
  {
    id: 'cross-resource' as const,
    title: '跨资源关联结果优先',
    desc: '优先返回能够连接文献、专利、数据库三类资源的关联结果。',
    icon: Waypoints,
  },
];

interface RankItem {
  rank: number;
  id: string;
  title: string;
  resource_types: Array<'literature' | 'patent' | 'database'>;
  snippet: string;
  cross_resource_association: {
    covers_literature: boolean;
    covers_patent: boolean;
    covers_database: boolean;
    bridge_count: number;
    path_summary: string;
  };
  graph_structure: {
    degree: number;
    centrality: number;
    hops_from_query: number;
    neighbor_types: string[];
  };
  ranking_factors: {
    embedding_score: number;
    structure_score: number;
    final_score: number;
  };
}

function buildMockResponse(query: string, params: {
  embedding_weight: number;
  structure_weight: number;
  top_n: number;
  hops: number;
  cross_resource_top_n: number;
}) {
  const seeds: Array<Omit<RankItem, 'rank' | 'ranking_factors'> & { emb: number; str: number }> = [
    {
      id: 'lit:PMID:31284567',
      title: 'CB1 receptor signaling and gut motility in IBS',
      resource_types: ['literature', 'database'],
      snippet: 'Cannabinoid receptor gene expression correlates with visceral hypersensitivity…',
      emb: 0.91,
      str: 0.72,
      cross_resource_association: {
        covers_literature: true,
        covers_patent: false,
        covers_database: true,
        bridge_count: 2,
        path_summary: '文献 → 基因实体 → 数据库实验记录',
      },
      graph_structure: {
        degree: 18,
        centrality: 0.64,
        hops_from_query: 1,
        neighbor_types: ['Gene', 'Disease', 'Experiment'],
      },
    },
    {
      id: 'pat:US20210123456A1',
      title: 'Method for modulating cannabinoid receptor in bowel disorders',
      resource_types: ['patent', 'literature', 'database'],
      snippet: 'Claims cover CNR1 modulators for irritable bowel syndrome phenotypes…',
      emb: 0.84,
      str: 0.88,
      cross_resource_association: {
        covers_literature: true,
        covers_patent: true,
        covers_database: true,
        bridge_count: 3,
        path_summary: '专利技术问题 → 文献方案 → 数据库验证',
      },
      graph_structure: {
        degree: 27,
        centrality: 0.81,
        hops_from_query: Math.min(2, params.hops),
        neighbor_types: ['Compound', 'Gene', 'Pathway'],
      },
    },
    {
      id: 'db:GEO:GSE142073',
      title: 'Transcriptome of CNR1 in IBS mucosal biopsies',
      resource_types: ['database', 'literature'],
      snippet: 'Differential expression of cannabinoid receptor gene across IBS subtypes…',
      emb: 0.79,
      str: 0.69,
      cross_resource_association: {
        covers_literature: true,
        covers_patent: false,
        covers_database: true,
        bridge_count: 2,
        path_summary: '数据库样本 → 基因 → 相关文献',
      },
      graph_structure: {
        degree: 14,
        centrality: 0.55,
        hops_from_query: 2,
        neighbor_types: ['Sample', 'Gene', 'Publication'],
      },
    },
    {
      id: 'lit:DOI:10.1038/s41575-020-0312',
      title: 'Endocannabinoid system and gastrointestinal disorders',
      resource_types: ['literature'],
      snippet: 'Review of CB receptors in IBS pathophysiology…',
      emb: 0.86,
      str: 0.41,
      cross_resource_association: {
        covers_literature: true,
        covers_patent: false,
        covers_database: false,
        bridge_count: 1,
        path_summary: '单资源文献节点',
      },
      graph_structure: {
        degree: 9,
        centrality: 0.33,
        hops_from_query: 1,
        neighbor_types: ['Disease', 'Concept'],
      },
    },
  ];

  const ranked = seeds
    .map((s) => {
      const embedding_score = s.emb;
      const structure_score = s.str;
      const final_score =
        params.embedding_weight * embedding_score + params.structure_weight * structure_score;
      // cross-resource boost for demo
      const boost = s.cross_resource_association.bridge_count >= 3 ? 0.04 : 0;
      return {
        ...s,
        ranking_factors: {
          embedding_score: Number(embedding_score.toFixed(4)),
          structure_score: Number(structure_score.toFixed(4)),
          final_score: Number((final_score + boost).toFixed(4)),
        },
      };
    })
    .sort((a, b) => b.ranking_factors.final_score - a.ranking_factors.final_score)
    .slice(0, params.top_n)
    .map((item, i) => ({
      rank: i + 1,
      id: item.id,
      title: item.title,
      resource_types: item.resource_types,
      snippet: item.snippet,
      cross_resource_association: item.cross_resource_association,
      graph_structure: item.graph_structure,
      ranking_factors: item.ranking_factors,
    }));

  return {
    status: 'ok',
    request_id: `dfr_${Date.now()}`,
    endpoint: ENDPOINT,
    query,
    latency_ms: 45 + Math.floor(Math.random() * 60),
    capabilities: CAPABILITIES.map((c) => ({
      id: c.id,
      name: c.title,
      description: c.desc,
    })),
    parameters: {
      collection: 'gkx_kg_rag_text_bge_m3',
      trs_space: 'gkx_kg_rag',
      embedding_weight: params.embedding_weight,
      structure_weight: params.structure_weight,
      hops: params.hops,
      top_n: params.top_n,
      cross_resource_top_n: params.cross_resource_top_n,
    },
    results: ranked,
  };
}

const RESOURCE_LABEL: Record<string, string> = {
  literature: '文献',
  patent: '专利',
  database: '数据库',
};

/**
 * 审计目录专用：「语义+结构」双因子排序接口演示
 * POST /api/v1/general/kg-search/dual-factor-rank
 */
export default function DualFactorRankApi({
  initialFocus,
}: {
  initialFocus?: DualFactorRankFocus | null;
}) {
  const [focus, setFocus] = useState<DualFactorRankFocus>(initialFocus ?? 'cross-resource');
  const [query, setQuery] = useState('cannabinoid receptor gene and irritable bowel syndrome');
  const [embeddingWeight, setEmbeddingWeight] = useState(0.7);
  const [structureWeight, setStructureWeight] = useState(0.3);
  const [topN, setTopN] = useState(10);
  const [hops, setHops] = useState(2);
  const [crossResourceTopN, setCrossResourceTopN] = useState(40);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<ReturnType<typeof buildMockResponse> | null>(null);
  const [responseJson, setResponseJson] = useState('');

  useEffect(() => {
    if (initialFocus) setFocus(initialFocus);
  }, [initialFocus]);

  const syncWeights = (emb: number) => {
    const e = Math.max(0, Math.min(1, emb));
    setEmbeddingWeight(Number(e.toFixed(2)));
    setStructureWeight(Number((1 - e).toFixed(2)));
  };

  const run = () => {
    if (!query.trim()) return;
    setRunning(true);
    setResponse(null);
    setResponseJson('');
    window.setTimeout(() => {
      const body = buildMockResponse(query.trim(), {
        embedding_weight: embeddingWeight,
        structure_weight: structureWeight,
        top_n: topN,
        hops,
        cross_resource_top_n: crossResourceTopN,
      });
      setResponse(body);
      setResponseJson(JSON.stringify(body, null, 2));
      setRunning(false);
    }, 650);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">「语义+结构」双因子排序</h1>
          <p className="text-sm text-gray-500">
            集成图结构约束与嵌入向量语义相似度，优先返回跨文献 / 专利 / 数据库的关联结果
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl">
        {CAPABILITIES.map((c) => {
          const active = focus === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFocus(c.id)}
              className={`text-left bg-white border rounded-xl p-4 transition-colors ${
                active ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <c.icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-sm font-semibold text-gray-900">{c.title}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-5xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">{ENDPOINT}</code>
        </div>

        <div className="text-xs text-gray-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          请求体：
          <code className="mx-1 text-blue-700">parameters</code>
          （collection / trs_space / weights / hops / top_n）+
          <code className="mx-1 text-blue-700">inputs.query</code>
          ；返回
          <code className="mx-1 text-blue-700">capabilities</code>
          、
          <code className="mx-1 text-blue-700">cross_resource_association</code>
          、
          <code className="mx-1 text-blue-700">graph_structure</code>
          、
          <code className="mx-1 text-blue-700">ranking_factors</code>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">查询 query</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">embedding_weight</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={embeddingWeight}
              onChange={(e) => syncWeights(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">structure_weight</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={structureWeight}
              onChange={(e) => {
                const s = Math.max(0, Math.min(1, Number(e.target.value)));
                setStructureWeight(Number(s.toFixed(2)));
                setEmbeddingWeight(Number((1 - s).toFixed(2)));
              }}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">hops</label>
            <input
              type="number"
              min={1}
              max={4}
              value={hops}
              onChange={(e) => setHops(Number(e.target.value) || 1)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">top_n</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value) || 10)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">cross_resource_top_n</label>
            <input
              type="number"
              min={1}
              max={100}
              value={crossResourceTopN}
              onChange={(e) => setCrossResourceTopN(Number(e.target.value) || 40)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running || !query.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '排序中…' : '调用双因子排序'}
        </button>
      </div>

      {response && (
        <div className="max-w-5xl space-y-4 pb-6">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            排序完成 · {response.results.length} 条 · latency {response.latency_ms} ms
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-800">
              capabilities
            </div>
            <ul className="divide-y divide-gray-100">
              {response.capabilities.map((c) => (
                <li
                  key={c.id}
                  className={`px-4 py-3 text-sm ${focus === c.id ? 'bg-blue-50/60' : ''}`}
                >
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>
                </li>
              ))}
            </ul>
          </div>

          <ul className="space-y-3">
            {response.results.map((item) => {
              const highlightStructure = focus === 'structure';
              const highlightEmb = focus === 'embedding';
              const highlightCross = focus === 'cross-resource';
              return (
                <li key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 flex items-start gap-3">
                    <span className="text-lg font-semibold tabular-nums text-gray-400 w-7">#{item.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">{item.id}</div>
                      <p className="text-xs text-gray-500 mt-1.5">{item.snippet}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.resource_types.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-teal-100 bg-teal-50 text-teal-700"
                          >
                            {RESOURCE_LABEL[t] ?? t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-semibold tabular-nums text-blue-700">
                        {(item.ranking_factors.final_score * 100).toFixed(1)}
                      </div>
                      <div className="text-[10px] text-gray-400">final_score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-gray-100 text-xs">
                    <div className={`px-4 py-3 ${highlightCross ? 'bg-amber-50/70' : 'bg-white'}`}>
                      <div className="text-[11px] font-semibold text-gray-700 mb-1.5">cross_resource_association</div>
                      <div className="text-gray-600 space-y-0.5">
                        <div>bridge_count：{item.cross_resource_association.bridge_count}</div>
                        <div>path：{item.cross_resource_association.path_summary}</div>
                        <div className="text-gray-400">
                          文献 {item.cross_resource_association.covers_literature ? '✓' : '–'} · 专利{' '}
                          {item.cross_resource_association.covers_patent ? '✓' : '–'} · 数据库{' '}
                          {item.cross_resource_association.covers_database ? '✓' : '–'}
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-3 border-t md:border-t-0 md:border-l border-gray-100 ${highlightStructure ? 'bg-violet-50/70' : ''}`}>
                      <div className="text-[11px] font-semibold text-gray-700 mb-1.5">graph_structure</div>
                      <div className="text-gray-600 space-y-0.5">
                        <div>degree：{item.graph_structure.degree}</div>
                        <div>centrality：{item.graph_structure.centrality}</div>
                        <div>hops：{item.graph_structure.hops_from_query}</div>
                        <div className="text-gray-400">neighbors：{item.graph_structure.neighbor_types.join(', ')}</div>
                      </div>
                    </div>
                    <div className={`px-4 py-3 border-t md:border-t-0 md:border-l border-gray-100 ${highlightEmb ? 'bg-blue-50/70' : ''}`}>
                      <div className="text-[11px] font-semibold text-gray-700 mb-1.5">ranking_factors</div>
                      <div className="space-y-1.5">
                        <ScoreBar label="embedding_score" value={item.ranking_factors.embedding_score} color="bg-blue-500" />
                        <ScoreBar label="structure_score" value={item.ranking_factors.structure_score} color="bg-violet-500" />
                        <ScoreBar label="final_score" value={item.ranking_factors.final_score} color="bg-teal-500" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div>
            <div className="text-xs font-medium text-gray-600 mb-1.5">响应 JSON</div>
            <pre className="text-xs font-mono bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700 max-h-80">
              {responseJson}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10;
  return (
    <div>
      <div className="flex justify-between text-gray-600 mb-0.5">
        <span>{label}</span>
        <span className="tabular-nums font-medium">{value.toFixed(4)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
