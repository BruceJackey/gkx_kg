import { useMemo, useState } from 'react';
import { Play, Database, Network, Route, ArrowRight } from 'lucide-react';

type GraphOption = { id: string; name: string; ontology: string };

type GraphNode = {
  id: string;
  name: string;
  type: string;
  neighbors: Array<{ id: string; name: string; type: string; relation: string }>;
  /** 从该节点出发的典型关系路径模式（类型序列） */
  pathPatterns: string[];
};

const GRAPHS: GraphOption[] = [
  { id: 'g1', name: '科技论文知识图谱', ontology: '科技论文知识图谱本体' },
  { id: 'g2', name: '新能源产业图谱', ontology: '新能源产业图谱本体' },
  { id: 'g3', name: '生物医学知识图谱', ontology: '生物医学知识图谱本体' },
];

const NODES_BY_GRAPH: Record<string, GraphNode[]> = {
  g1: [
    {
      id: 'n1',
      name: 'Geoffrey Hinton',
      type: '作者',
      neighbors: [
        { id: 'i1', name: '多伦多大学', type: '机构', relation: '隶属于' },
        { id: 'f1', name: '深度学习', type: '领域', relation: '研究' },
        { id: 'p1', name: '反向传播算法', type: '方法', relation: '提出' },
        { id: 'a1', name: '图灵奖', type: '奖项', relation: '获得' },
      ],
      pathPatterns: ['作者→隶属于→机构', '作者→研究→领域', '作者→提出→方法', '作者→获得→奖项'],
    },
    {
      id: 'n2',
      name: 'Yoshua Bengio',
      type: '作者',
      neighbors: [
        { id: 'i2', name: '蒙特利尔大学', type: '机构', relation: '隶属于' },
        { id: 'f1', name: '深度学习', type: '领域', relation: '研究' },
        { id: 'p2', name: '注意力机制', type: '方法', relation: '提出' },
        { id: 'a1', name: '图灵奖', type: '奖项', relation: '获得' },
      ],
      pathPatterns: ['作者→隶属于→机构', '作者→研究→领域', '作者→提出→方法', '作者→获得→奖项'],
    },
    {
      id: 'n3',
      name: '多伦多大学',
      type: '机构',
      neighbors: [
        { id: 'n1', name: 'Geoffrey Hinton', type: '作者', relation: '雇佣' },
        { id: 'c1', name: '加拿大', type: '国家', relation: '位于' },
        { id: 'f1', name: '深度学习', type: '领域', relation: '布局' },
      ],
      pathPatterns: ['机构→雇佣→作者', '机构→位于→国家', '机构→布局→领域'],
    },
    {
      id: 'n4',
      name: 'FB15k-237',
      type: '数据集',
      neighbors: [
        { id: 't1', name: '链接预测', type: '任务', relation: '用于' },
        { id: 'm1', name: 'TransE', type: '模型', relation: '评估' },
        { id: 'm2', name: 'RGAT', type: '模型', relation: '评估' },
      ],
      pathPatterns: ['数据集→用于→任务', '数据集→评估→模型'],
    },
    {
      id: 'n5',
      name: 'RGAT',
      type: '模型',
      neighbors: [
        { id: 'n4', name: 'FB15k-237', type: '数据集', relation: '在…上评估' },
        { id: 't1', name: '链接预测', type: '任务', relation: '解决' },
        { id: 'p3', name: '图注意力', type: '方法', relation: '采用' },
      ],
      pathPatterns: ['模型→在…上评估→数据集', '模型→解决→任务', '模型→采用→方法'],
    },
  ],
  g2: [
    {
      id: 'e1',
      name: '宁德时代',
      type: '企业',
      neighbors: [
        { id: 'p1', name: '动力电池', type: '产品', relation: '生产' },
        { id: 'c1', name: '福建', type: '地区', relation: '总部' },
        { id: 't1', name: '磷酸铁锂', type: '技术', relation: '掌握' },
      ],
      pathPatterns: ['企业→生产→产品', '企业→总部→地区', '企业→掌握→技术'],
    },
    {
      id: 'e2',
      name: '比亚迪',
      type: '企业',
      neighbors: [
        { id: 'p1', name: '动力电池', type: '产品', relation: '生产' },
        { id: 'c2', name: '深圳', type: '地区', relation: '总部' },
        { id: 't1', name: '磷酸铁锂', type: '技术', relation: '掌握' },
        { id: 'p2', name: '新能源汽车', type: '产品', relation: '生产' },
      ],
      pathPatterns: ['企业→生产→产品', '企业→总部→地区', '企业→掌握→技术'],
    },
    {
      id: 'e3',
      name: '磷酸铁锂',
      type: '技术',
      neighbors: [
        { id: 'e1', name: '宁德时代', type: '企业', relation: '被掌握' },
        { id: 'e2', name: '比亚迪', type: '企业', relation: '被掌握' },
        { id: 'm1', name: '安全性高', type: '特性', relation: '具备' },
      ],
      pathPatterns: ['技术→被掌握→企业', '技术→具备→特性'],
    },
  ],
  g3: [
    {
      id: 'b1',
      name: 'EGFR',
      type: '基因',
      neighbors: [
        { id: 'd1', name: '非小细胞肺癌', type: '疾病', relation: '关联' },
        { id: 'drug1', name: '奥希替尼', type: '药物', relation: '靶向' },
        { id: 'p1', name: '酪氨酸激酶', type: '蛋白', relation: '编码' },
      ],
      pathPatterns: ['基因→关联→疾病', '基因→靶向→药物', '基因→编码→蛋白'],
    },
    {
      id: 'b2',
      name: 'ALK',
      type: '基因',
      neighbors: [
        { id: 'd1', name: '非小细胞肺癌', type: '疾病', relation: '关联' },
        { id: 'drug2', name: '阿来替尼', type: '药物', relation: '靶向' },
        { id: 'p2', name: 'ALK 融合蛋白', type: '蛋白', relation: '编码' },
      ],
      pathPatterns: ['基因→关联→疾病', '基因→靶向→药物', '基因→编码→蛋白'],
    },
    {
      id: 'b3',
      name: '非小细胞肺癌',
      type: '疾病',
      neighbors: [
        { id: 'b1', name: 'EGFR', type: '基因', relation: '涉及' },
        { id: 'b2', name: 'ALK', type: '基因', relation: '涉及' },
        { id: 'icd', name: 'C34', type: '编码', relation: 'ICD-10' },
      ],
      pathPatterns: ['疾病→涉及→基因', '疾病→ICD-10→编码'],
    },
  ],
};

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function neighborSimilarity(a: GraphNode, b: GraphNode) {
  const nameA = new Set(a.neighbors.map((n) => n.name.toLowerCase()));
  const nameB = new Set(b.neighbors.map((n) => n.name.toLowerCase()));
  const typeA = new Set(a.neighbors.map((n) => n.type));
  const typeB = new Set(b.neighbors.map((n) => n.type));
  const relA = new Set(a.neighbors.map((n) => `${n.relation}|${n.type}`));
  const relB = new Set(b.neighbors.map((n) => `${n.relation}|${n.type}`));

  const nameScore = jaccard(nameA, nameB);
  const typeScore = jaccard(typeA, typeB);
  const relScore = jaccard(relA, relB);
  const score = nameScore * 0.45 + typeScore * 0.25 + relScore * 0.3;

  const commonNames = [...nameA].filter((n) => nameB.has(n));
  const commonTypes = [...typeA].filter((t) => typeB.has(t));

  return { score, nameScore, typeScore, relScore, commonNames, commonTypes };
}

function pathPatternSimilarity(a: GraphNode, b: GraphNode) {
  const setA = new Set(a.pathPatterns);
  const setB = new Set(b.pathPatterns);
  const score = jaccard(setA, setB);
  const common = a.pathPatterns.filter((p) => setB.has(p));
  const onlyA = a.pathPatterns.filter((p) => !setB.has(p));
  const onlyB = b.pathPatterns.filter((p) => !setA.has(p));
  return { score, common, onlyA, onlyB };
}

function ScoreBar({ score, accent }: { score: number; accent: 'purple' | 'teal' }) {
  const pct = Math.round(score * 1000) / 10;
  const bar =
    accent === 'purple'
      ? score >= 0.7
        ? 'bg-purple-500'
        : score >= 0.45
          ? 'bg-purple-300'
          : 'bg-purple-200'
      : score >= 0.7
        ? 'bg-teal-500'
        : score >= 0.45
          ? 'bg-teal-300'
          : 'bg-teal-200';
  const text =
    accent === 'purple'
      ? score >= 0.7
        ? 'text-purple-700'
        : 'text-purple-500'
      : score >= 0.7
        ? 'text-teal-700'
        : 'text-teal-500';

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className={`text-3xl font-semibold tabular-nums ${text}`}>{pct.toFixed(1)}%</span>
        <span className="text-xs text-gray-400 mb-1">得分 {score.toFixed(4)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

export default function StructureInstanceMatching() {
  const [graphId, setGraphId] = useState(GRAPHS[0].id);
  const [nodeAId, setNodeAId] = useState('');
  const [nodeBId, setNodeBId] = useState('');
  const [computed, setComputed] = useState(false);

  const graph = GRAPHS.find((g) => g.id === graphId) ?? GRAPHS[0];
  const nodes = NODES_BY_GRAPH[graphId] ?? [];

  const nodeA = nodes.find((n) => n.id === nodeAId) ?? null;
  const nodeB = nodes.find((n) => n.id === nodeBId) ?? null;

  const neighborResult = useMemo(
    () => (computed && nodeA && nodeB ? neighborSimilarity(nodeA, nodeB) : null),
    [computed, nodeA, nodeB],
  );
  const pathResult = useMemo(
    () => (computed && nodeA && nodeB ? pathPatternSimilarity(nodeA, nodeB) : null),
    [computed, nodeA, nodeB],
  );

  const resetSelection = (nextGraphId: string) => {
    setGraphId(nextGraphId);
    setNodeAId('');
    setNodeBId('');
    setComputed(false);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">结构实例匹配</h1>
        <p className="text-sm text-gray-400">
          从已有图谱中选择两个节点，计算邻居节点相似性与关系路径模式匹配得分
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-3">
          <Database className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">选择已有图谱</span>
          <select
            value={graphId}
            onChange={(e) => resetSelection(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 min-w-[220px]"
          >
            {GRAPHS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400">本体 · {graph.ontology}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">节点 A</span>
            <select
              value={nodeAId}
              onChange={(e) => {
                setNodeAId(e.target.value);
                setComputed(false);
              }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="">请选择节点…</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id} disabled={n.id === nodeBId}>
                  {n.name}（{n.type}）
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">节点 B</span>
            <select
              value={nodeBId}
              onChange={(e) => {
                setNodeBId(e.target.value);
                setComputed(false);
              }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="">请选择节点…</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id} disabled={n.id === nodeAId}>
                  {n.name}（{n.type}）
                </option>
              ))}
            </select>
          </label>
        </div>

        {(nodeA || nodeB) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
            {nodeA && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="font-medium text-gray-700 mb-1">{nodeA.name} · 邻居 {nodeA.neighbors.length}</div>
                <div className="flex flex-wrap gap-1">
                  {nodeA.neighbors.map((n) => (
                    <span key={n.id} className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                      {n.relation}→{n.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {nodeB && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="font-medium text-gray-700 mb-1">{nodeB.name} · 邻居 {nodeB.neighbors.length}</div>
                <div className="flex flex-wrap gap-1">
                  {nodeB.neighbors.map((n) => (
                    <span key={n.id} className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                      {n.relation}→{n.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setComputed(true)}
          disabled={!nodeA || !nodeB}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          计算结构相似度
        </button>
      </div>

      {neighborResult && pathResult && nodeA && nodeB && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-100 bg-purple-50">
              <Network className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-purple-900">邻居节点相似性分析</div>
                <div className="text-[11px] text-purple-700/70">邻居名称 / 类型 / 关系模式 Jaccard</div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <ScoreBar score={neighborResult.score} accent="purple" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{nodeA.name}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{nodeB.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['名称重合', neighborResult.nameScore],
                  ['类型重合', neighborResult.typeScore],
                  ['关系模式', neighborResult.relScore],
                ].map(([label, v]) => (
                  <div key={label as string} className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-2">
                    <div className="text-[10px] text-gray-400">{label}</div>
                    <div className="text-sm font-semibold text-gray-800">{((v as number) * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
              {neighborResult.commonNames.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">共同邻居</div>
                  <div className="flex flex-wrap gap-1">
                    {neighborResult.commonNames.map((n) => (
                      <span key={n} className="text-[11px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 leading-relaxed">
                通过比较两个实例的邻居节点的重合度和相似性来进行匹配。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-teal-100 bg-teal-50">
              <Route className="w-4 h-4 text-teal-600" />
              <div>
                <div className="text-sm font-medium text-teal-900">关系路径模式匹配</div>
                <div className="text-[11px] text-teal-700/70">路径类型序列模式重合度</div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <ScoreBar score={pathResult.score} accent="teal" />
              {pathResult.common.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">共同路径模式</div>
                  <div className="flex flex-col gap-1">
                    {pathResult.common.map((p) => (
                      <span key={p} className="text-[11px] font-mono px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(pathResult.onlyA.length > 0 || pathResult.onlyB.length > 0) && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-gray-400 mb-1">仅 A</div>
                    {pathResult.onlyA.map((p) => (
                      <div key={p} className="text-gray-500 truncate">{p}</div>
                    ))}
                    {pathResult.onlyA.length === 0 && <div className="text-gray-300">—</div>}
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">仅 B</div>
                    {pathResult.onlyB.map((p) => (
                      <div key={p} className="text-gray-500 truncate">{p}</div>
                    ))}
                    {pathResult.onlyB.length === 0 && <div className="text-gray-300">—</div>}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 leading-relaxed">
                通过分析连接两个实例的关系路径模式来判断其是否匹配。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
