import { useMemo, useState } from 'react';
import { CheckCircle2, Database, Search } from 'lucide-react';

type GraphOption = { id: string; name: string; ontology: string; entityTotal: number };

type EntityAttr = {
  id: string;
  name: string;
  type: string;
  attrs: Array<{ key: string; label: string; value: string; source: string; confidence: number }>;
};

const GRAPHS: GraphOption[] = [
  { id: 'g1', name: '科技论文知识图谱', ontology: '科技论文知识图谱本体', entityTotal: 128340 },
  { id: 'g2', name: '新能源产业图谱', ontology: '新能源产业图谱本体', entityTotal: 0 },
  { id: 'g3', name: '生物医学知识图谱', ontology: '生物医学知识图谱本体', entityTotal: 86420 },
];

const ENTITIES_BY_GRAPH: Record<string, EntityAttr[]> = {
  g1: [
    {
      id: 'e1',
      name: 'Geoffrey Hinton',
      type: '作者',
      attrs: [
        { key: 'affiliation', label: '所属机构', value: '多伦多大学', source: 'authors#145', confidence: 0.94 },
        { key: 'birth_year', label: '出生年份', value: '1947', source: 'authors#145', confidence: 0.91 },
        { key: 'research_field', label: '研究领域', value: '深度学习', source: 'papers#4521', confidence: 0.88 },
        { key: 'award', label: '获奖', value: '图灵奖', source: 'awards#12', confidence: 0.96 },
      ],
    },
    {
      id: 'e2',
      name: '多伦多大学',
      type: '机构',
      attrs: [
        { key: 'country', label: '国家', value: '加拿大', source: 'institutions#88', confidence: 0.97 },
        { key: 'city', label: '城市', value: '多伦多', source: 'institutions#88', confidence: 0.95 },
        { key: 'founded', label: '成立年份', value: '1827', source: 'institutions#88', confidence: 0.9 },
      ],
    },
    {
      id: 'e3',
      name: 'Attention Is All You Need',
      type: '论文',
      attrs: [
        { key: 'pub_year', label: '发表年份', value: '2017', source: 'papers#1892', confidence: 0.99 },
        { key: 'venue', label: '会议/期刊', value: 'NeurIPS', source: 'papers#1892', confidence: 0.93 },
        { key: 'doi', label: 'DOI', value: '10.5555/3295222.3295349', source: 'papers#1892', confidence: 0.98 },
      ],
    },
    {
      id: 'e4',
      name: '深度学习框架 v2',
      type: '技术概念',
      attrs: [
        { key: 'alias', label: '别名', value: 'Deep Learning Framework v2', source: 'papers#4521', confidence: 0.85 },
        { key: 'category', label: '类别', value: '软件框架', source: 'papers#4521', confidence: 0.8 },
      ],
    },
  ],
  g2: [],
  g3: [
    {
      id: 'e5',
      name: 'EGFR',
      type: '基因',
      attrs: [
        { key: 'full_name', label: '全称', value: 'Epidermal Growth Factor Receptor', source: 'genes#egfr', confidence: 0.99 },
        { key: 'chromosome', label: '染色体', value: '7p11.2', source: 'genes#egfr', confidence: 0.94 },
        { key: 'organism', label: '物种', value: 'Homo sapiens', source: 'genes#egfr', confidence: 0.98 },
      ],
    },
    {
      id: 'e6',
      name: 'Gefitinib',
      type: '药物',
      attrs: [
        { key: 'drugbank_id', label: 'DrugBank ID', value: 'DB00317', source: 'drugs#gef', confidence: 0.97 },
        { key: 'target', label: '靶点', value: 'EGFR', source: 'drugs#gef', confidence: 0.92 },
        { key: 'indication', label: '适应症', value: '非小细胞肺癌', source: 'drugs#gef', confidence: 0.89 },
      ],
    },
    {
      id: 'e7',
      name: '非小细胞肺癌',
      type: '疾病',
      attrs: [
        { key: 'mesh_id', label: 'MeSH ID', value: 'D002289', source: 'diseases#nsclc', confidence: 0.95 },
        { key: 'icd10', label: 'ICD-10', value: 'C34', source: 'diseases#nsclc', confidence: 0.91 },
      ],
    },
  ],
};

export default function AttributePreciseExtract() {
  const [graphId, setGraphId] = useState(GRAPHS[0].id);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graph = GRAPHS.find((g) => g.id === graphId) ?? GRAPHS[0];
  const entities = ENTITIES_BY_GRAPH[graphId] ?? [];

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return entities;
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(kw) ||
        e.type.includes(kw) ||
        e.attrs.some((a) => a.label.includes(kw) || a.value.toLowerCase().includes(kw)),
    );
  }, [entities, q]);

  const active = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">属性信息精确抽取</h1>
          <p className="text-sm text-gray-500">
            根据映射规则，从已有图谱实例中查看每个实体的精确属性值
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">选择已有图谱</span>
          <select
            value={graphId}
            onChange={(e) => {
              setGraphId(e.target.value);
              setSelectedId(null);
              setQ('');
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 min-w-[220px]"
          >
            {GRAPHS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-400">
          本体 · {graph.ontology} · 实体总量 {graph.entityTotal.toLocaleString()}
        </span>
        <div className="relative ml-auto">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索实体 / 属性"
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-52 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">实体列表</span>
            <span className="text-[11px] text-gray-400">{filtered.length} 条示例</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                {entities.length === 0 ? '该图谱暂无实体属性抽取结果' : '无匹配实体'}
              </div>
            ) : (
              filtered.map((e) => {
                const on = active?.id === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                      on ? 'bg-indigo-50/80' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-medium ${on ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {e.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{e.type}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{e.attrs.length} 个属性</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="col-span-8 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-800">精确属性值</span>
            {active && (
              <span className="text-xs text-gray-500 ml-1">
                {active.name} · {active.type}
              </span>
            )}
          </div>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">请选择实体查看属性</div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                    <th className="px-4 py-2.5 font-medium">属性</th>
                    <th className="px-4 py-2.5 font-medium">属性键</th>
                    <th className="px-4 py-2.5 font-medium">抽取值</th>
                    <th className="px-4 py-2.5 font-medium">来源映射</th>
                    <th className="px-4 py-2.5 font-medium">置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {active.attrs.map((a) => (
                    <tr key={a.key} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-gray-800 font-medium">{a.label}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{a.key}</td>
                      <td className="px-4 py-3 text-gray-900">{a.value}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{a.source}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-semibold ${
                            a.confidence >= 0.9 ? 'text-emerald-600' : a.confidence >= 0.8 ? 'text-amber-600' : 'text-gray-500'
                          }`}
                        >
                          {(a.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
