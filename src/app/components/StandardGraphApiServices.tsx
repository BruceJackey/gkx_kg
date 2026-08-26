import { useEffect, useState } from 'react';
import { Play, Code2, BookOpen, Search, Route, Sparkles } from 'lucide-react';

export type StandardApiTab = 'query' | 'path' | 'semantic';

type ParamRow = { name: string; type: string; required: boolean; desc: string };

const TABS: Array<{
  id: StandardApiTab;
  label: string;
  method: 'POST' | 'GET';
  endpoint: string;
  intro: string;
  params: ParamRow[];
}> = [
  {
    id: 'query',
    label: '图谱查询API',
    method: 'POST',
    endpoint: '/api/v1/graph/query',
    intro:
      '提供标准图查询语言接口（兼容 Cypher / SPARQL 风格），对指定图谱空间执行只读查询，返回节点、边或聚合结果。',
    params: [
      { name: 'space', type: 'string', required: true, desc: '图谱空间标识，如 kg:sci-paper-v3' },
      { name: 'language', type: 'string', required: false, desc: '查询语言：cypher | sparql，默认 cypher' },
      { name: 'query', type: 'string', required: true, desc: '图查询语句' },
      { name: 'limit', type: 'integer', required: false, desc: '最大返回行数，默认 50' },
    ],
  },
  {
    id: 'path',
    label: '路径检索API',
    method: 'POST',
    endpoint: '/api/v1/graph/path',
    intro:
      '发现两个实体之间的关联路径，支持限制最大跳数、关系类型过滤，以及按路径长度 / 置信度排序。',
    params: [
      { name: 'space', type: 'string', required: true, desc: '图谱空间标识' },
      { name: 'source', type: 'string', required: true, desc: '起始实体 ID 或名称' },
      { name: 'target', type: 'string', required: true, desc: '目标实体 ID 或名称' },
      { name: 'max_hops', type: 'integer', required: false, desc: '最大跳数，默认 3' },
      { name: 'relation_filter', type: 'string[]', required: false, desc: '允许的关系类型列表' },
    ],
  },
  {
    id: 'semantic',
    label: '语义匹配API',
    method: 'POST',
    endpoint: '/api/v1/semantic/match',
    intro:
      '计算实体或文本之间的语义相似度，可用于实体消歧、候选对齐与检索排序，返回相似度分数与 Top-K 匹配项。',
    params: [
      { name: 'mode', type: 'string', required: false, desc: 'entity | text | mixed，默认 mixed' },
      { name: 'query', type: 'string', required: true, desc: '查询实体名或文本' },
      { name: 'candidates', type: 'string[]', required: false, desc: '候选列表；为空时在图谱内检索' },
      { name: 'top_k', type: 'integer', required: false, desc: '返回前 K 条，默认 5' },
    ],
  },
];

function buildQueryResult(space: string, language: string, query: string, limit: number) {
  return {
    status: 'ok',
    request_id: `gq_${Date.now()}`,
    endpoint: '/api/v1/graph/query',
    latency_ms: 18 + Math.floor(Math.random() * 40),
    space,
    language,
    query,
    columns: ['entity', 'type', 'name'],
    row_count: Math.min(3, limit),
    rows: [
      { entity: 'ent:author:hinton', type: '作者', name: 'Geoffrey Hinton' },
      { entity: 'ent:org:uoft', type: '机构', name: '多伦多大学' },
      { entity: 'ent:paper:4521', type: '论文', name: '深度学习框架 v2' },
    ].slice(0, Math.min(3, limit)),
  };
}

function buildPathResult(
  space: string,
  source: string,
  target: string,
  maxHops: number,
  relationFilter: string,
) {
  const filters = relationFilter
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    status: 'ok',
    request_id: `gp_${Date.now()}`,
    endpoint: '/api/v1/graph/path',
    latency_ms: 32 + Math.floor(Math.random() * 50),
    space,
    source,
    target,
    max_hops: maxHops,
    relation_filter: filters.length ? filters : null,
    path_count: 2,
    paths: [
      {
        hops: 2,
        score: 0.91,
        nodes: [source, '多伦多大学', target],
        relations: ['AFFILIATED_WITH', 'LOCATED_IN'],
      },
      {
        hops: 3,
        score: 0.76,
        nodes: [source, '深度学习', '卷积神经网络', target],
        relations: ['RESEARCHES', 'RELATED_TO', 'CONTRIBUTED_BY'],
      },
    ].filter((p) => p.hops <= maxHops),
  };
}

function buildSemanticResult(mode: string, query: string, candidatesRaw: string, topK: number) {
  const candidates = candidatesRaw
    .split(/[,，\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const pool =
    candidates.length > 0
      ? candidates
      : ['Geoffrey Hinton', 'Yoshua Bengio', 'Yann LeCun', '深度学习', '多伦多大学'];
  const matches = pool
    .map((c, i) => {
      const base = c.toLowerCase().includes(query.toLowerCase().slice(0, 4)) ? 0.92 : 0.78 - i * 0.07;
      return {
        item: c,
        score: Math.max(0.42, Math.min(0.99, Number(base.toFixed(3)))),
        type: /大学|机构/.test(c) ? '机构' : /学习|网络/.test(c) ? '概念' : '人物',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    status: 'ok',
    request_id: `sm_${Date.now()}`,
    endpoint: '/api/v1/semantic/match',
    latency_ms: 24 + Math.floor(Math.random() * 35),
    mode,
    query,
    top_k: topK,
    match_count: matches.length,
    matches,
  };
}

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-800">请求参数说明</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
            <th className="px-4 py-2 font-medium">参数</th>
            <th className="px-4 py-2 font-medium">类型</th>
            <th className="px-4 py-2 font-medium">必填</th>
            <th className="px-4 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-2 font-mono text-xs text-blue-700">{r.name}</td>
              <td className="px-4 py-2 text-xs text-gray-500">{r.type}</td>
              <td className="px-4 py-2 text-xs">
                {r.required ? <span className="text-amber-600">是</span> : <span className="text-gray-400">否</span>}
              </td>
              <td className="px-4 py-2 text-xs text-gray-600">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResponseBox({ response }: { response: string }) {
  if (!response) return null;
  return (
    <div className="bg-white border border-blue-200 rounded-xl overflow-hidden">
      <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
        <Code2 className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">响应 · JSON</span>
        <span className="text-[10px] text-blue-400 ml-auto">200 OK</span>
      </div>
      <pre className="p-4 text-xs font-mono whitespace-pre overflow-x-auto bg-gray-950 text-green-300 leading-relaxed max-h-[420px]">
        {response}
      </pre>
    </div>
  );
}

function QueryPanel() {
  const [space, setSpace] = useState('kg:sci-paper-v3');
  const [language, setLanguage] = useState('cypher');
  const [query, setQuery] = useState(
    "MATCH (a:作者)-[:AFFILIATED_WITH]->(o:机构) WHERE a.name CONTAINS 'Hinton' RETURN a, o LIMIT 10",
  );
  const [limit, setLimit] = useState(50);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      setResponse(JSON.stringify(buildQueryResult(space, language, query, limit), null, 2));
      setRunning(false);
    }, 700);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <ParamTable rows={TABS[0].params} />
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">{TABS[0].endpoint}</code>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">space</label>
            <input
              value={space}
              onChange={(e) => setSpace(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              <option value="cypher">cypher</option>
              <option value="sparql">sparql</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">query</label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono bg-gray-50 focus:outline-none focus:border-blue-400 resize-none"
          />
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-gray-600 mb-1 block">limit</label>
          <input
            type="number"
            min={1}
            max={200}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 50)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!query.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '请求中…' : '测试调用'}
        </button>
      </div>
      <ResponseBox response={response} />
    </div>
  );
}

function PathPanel() {
  const [space, setSpace] = useState('kg:sci-paper-v3');
  const [source, setSource] = useState('Geoffrey Hinton');
  const [target, setTarget] = useState('加拿大');
  const [maxHops, setMaxHops] = useState(3);
  const [relationFilter, setRelationFilter] = useState('AFFILIATED_WITH, LOCATED_IN');
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      setResponse(
        JSON.stringify(buildPathResult(space, source, target, maxHops, relationFilter), null, 2),
      );
      setRunning(false);
    }, 800);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <ParamTable rows={TABS[1].params} />
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">{TABS[1].endpoint}</code>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">space</label>
          <input
            value={space}
            onChange={(e) => setSpace(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">source</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">target</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">max_hops</label>
            <input
              type="number"
              min={1}
              max={6}
              value={maxHops}
              onChange={(e) => setMaxHops(Number(e.target.value) || 3)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">relation_filter</label>
            <input
              value={relationFilter}
              onChange={(e) => setRelationFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!source.trim() || !target.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '请求中…' : '测试调用'}
        </button>
      </div>
      <ResponseBox response={response} />
    </div>
  );
}

function SemanticPanel() {
  const [mode, setMode] = useState('mixed');
  const [query, setQuery] = useState('Hinton 深度学习');
  const [candidates, setCandidates] = useState('Geoffrey Hinton, Yoshua Bengio, 深度学习, 多伦多大学');
  const [topK, setTopK] = useState(5);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      setResponse(JSON.stringify(buildSemanticResult(mode, query, candidates, topK), null, 2));
      setRunning(false);
    }, 650);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <ParamTable rows={TABS[2].params} />
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">{TABS[2].endpoint}</code>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="entity">entity</option>
              <option value="text">text</option>
              <option value="mixed">mixed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">top_k</label>
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value) || 5)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">query</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">candidates（可选，逗号分隔）</label>
          <textarea
            value={candidates}
            onChange={(e) => setCandidates(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!query.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '请求中…' : '测试调用'}
        </button>
      </div>
      <ResponseBox response={response} />
    </div>
  );
}

const TAB_ICONS = {
  query: Search,
  path: Route,
  semantic: Sparkles,
};

export default function StandardGraphApiServices({
  initialTab = 'query',
}: {
  initialTab?: StandardApiTab;
}) {
  const [tab, setTab] = useState<StandardApiTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const meta = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">标准化API服务</h1>
          <p className="text-sm text-gray-500">图谱查询、路径检索与语义匹配接口说明及在线测试</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t.id];
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                on ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3 flex-shrink-0">
        <p className="text-sm font-semibold text-indigo-900 mb-0.5">{meta.label}</p>
        <p className="text-xs text-indigo-800/80 leading-relaxed">{meta.intro}</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        {tab === 'query' && <QueryPanel />}
        {tab === 'path' && <PathPanel />}
        {tab === 'semantic' && <SemanticPanel />}
      </div>
    </div>
  );
}
