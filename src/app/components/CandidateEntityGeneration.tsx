import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Database } from 'lucide-react';

interface KbEntity {
  id: string;
  name: string;
  type: string;
  description: string;
  aliases?: string[];
  /** 知识库先验概率（演示用） */
  prior: number;
}

const entityTypeColors: Record<string, string> = {
  人物: 'bg-blue-500/20 text-blue-600',
  组织: 'bg-purple-500/20 text-purple-600',
  地点: 'bg-green-500/20 text-green-600',
  事件: 'bg-yellow-500/20 text-yellow-700',
  概念: 'bg-orange-500/20 text-orange-600',
  技术: 'bg-cyan-500/20 text-cyan-700',
};

/** 目标知识库实体（演示数据，风格对齐属性管理） */
const KB_ENTITIES: KbEntity[] = [
  {
    id: 'E001',
    name: '李明',
    type: '人物',
    aliases: ['李教授', 'Li Ming'],
    description: '知名人工智能研究员，专注于自然语言处理领域。',
    prior: 0.82,
  },
  {
    id: 'E002',
    name: '北京人工智能研究院',
    type: '组织',
    aliases: ['BIARI', '北京AI研究院'],
    description: '专注于人工智能基础研究与应用开发的国家级科研机构。',
    prior: 0.76,
  },
  {
    id: 'E003',
    name: '深度学习',
    type: '概念',
    aliases: ['Deep Learning', 'DL'],
    description: '机器学习的一个子领域，使用多层神经网络进行表示学习。',
    prior: 0.91,
  },
  {
    id: 'E004',
    name: '国家重点研发计划',
    type: '事件',
    aliases: ['重点研发计划'],
    description: '国家级科技研发支持项目，推动前沿技术突破与产业化应用。',
    prior: 0.64,
  },
  {
    id: 'E005',
    name: '中关村科技园',
    type: '地点',
    aliases: ['中关村', 'ZGC'],
    description: '中国最具影响力的科技创新中心，聚集了大量高科技企业与研究机构。',
    prior: 0.71,
  },
  {
    id: 'E006',
    name: 'Transformer',
    type: '技术',
    aliases: ['注意力机制模型', 'Self-Attention'],
    description: '基于注意力机制的神经网络架构，广泛应用于自然语言处理任务。',
    prior: 0.88,
  },
  {
    id: 'E007',
    name: '清华大学',
    type: '组织',
    aliases: ['清华', 'Tsinghua University'],
    description: '中国顶尖综合性研究型大学，计算机与人工智能学科实力突出。',
    prior: 0.95,
  },
  {
    id: 'E008',
    name: '知识图谱',
    type: '概念',
    aliases: ['Knowledge Graph', 'KG'],
    description: '以图结构组织实体与关系的语义网络，支撑检索、推理与问答。',
    prior: 0.93,
  },
  {
    id: 'E009',
    name: 'BERT',
    type: '技术',
    aliases: ['Bidirectional Encoder Representations from Transformers'],
    description: '基于 Transformer 编码器的预训练语言模型。',
    prior: 0.87,
  },
  {
    id: 'E010',
    name: '李明远',
    type: '人物',
    aliases: ['Mingyuan Li'],
    description: '计算机视觉方向青年学者，与「李明」同姓易混淆。',
    prior: 0.41,
  },
];

function literalSimilarity(mention: string, entity: KbEntity): number {
  const q = mention.trim().toLowerCase();
  if (!q) return 0;
  const names = [entity.name, ...(entity.aliases ?? []), entity.id].map((s) => s.toLowerCase());
  if (names.some((n) => n === q)) return 1;
  if (names.some((n) => n.includes(q) || q.includes(n))) {
    const best = Math.max(...names.map((n) => Math.min(q.length, n.length) / Math.max(q.length, n.length)));
    return 0.55 + 0.4 * best;
  }
  // 简单字符重叠
  const chars = new Set(q);
  let hit = 0;
  for (const ch of entity.name.toLowerCase()) if (chars.has(ch)) hit += 1;
  return Math.min(0.5, hit / Math.max(1, entity.name.length));
}

type RankedCandidate = KbEntity & {
  literal: number;
  score: number;
};

export default function CandidateEntityGeneration() {
  const [mention, setMention] = useState('');
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('全部');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 5;

  const entityTypes = useMemo(
    () => ['全部', ...Array.from(new Set(KB_ENTITIES.map((e) => e.type)))],
    [],
  );

  const ranked: RankedCandidate[] = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return KB_ENTITIES.map((e) => {
      const literal = literalSimilarity(q, e);
      // 综合先验概率与字面相似度做初步排序
      const score = 0.45 * e.prior + 0.55 * literal;
      return { ...e, literal, score };
    })
      .filter((e) => e.literal > 0.08 || e.name.includes(q) || e.id.includes(q))
      .filter((e) => filterType === '全部' || e.type === filterType)
      .sort((a, b) => b.score - a.score);
  }, [query, filterType]);

  const totalPages = Math.ceil(ranked.length / pageSize) || 1;
  const paginated = ranked.slice((page - 1) * pageSize, page * pageSize);
  const selected = ranked.find((e) => e.id === selectedId) ?? null;

  const runRecall = () => {
    setQuery(mention.trim());
    setPage(1);
    setSelectedId(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-5 pb-0 flex-shrink-0">
        <h1 className="text-2xl text-gray-900 mb-1">候选实体生成</h1>
        <p className="text-sm text-gray-500">
          对于识别出的每个实体提及，从目标知识库中召回一个或多个可能的候选实体
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <div className="flex gap-4 h-full min-h-[520px]">
          {/* 左栏：索引与召回 + 候选实体排序（对齐属性管理检索区） */}
          <div className="w-96 flex flex-col gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Database className="w-4 h-4 text-blue-500" />
              <span>目标知识库：科研知识图谱 · {KB_ENTITIES.length} 个索引实体</span>
            </div>

            {/* 索引与召回 */}
            <div className="border border-gray-200 rounded-xl overflow-visible bg-white">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-800">索引与召回</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  基于高效索引，根据实体提及从知识库快速召回候选实体
                </p>
              </div>
              <div className="p-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="输入实体提及（名称 / 别名 / ID）…"
                      value={mention}
                      onChange={(e) => setMention(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && runRecall()}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={runRecall}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg whitespace-nowrap"
                  >
                    召回
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {entityTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setFilterType(type);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                        filterType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {['李明', '深度学习', '清华', 'Transformer', '中关村'].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setMention(ex);
                        setQuery(ex);
                        setPage(1);
                        setSelectedId(null);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 候选实体排序 */}
            <div className="flex-1 flex flex-col min-h-0 border border-gray-200 rounded-xl bg-white overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex-shrink-0">
                <p className="text-sm font-semibold text-gray-800">候选实体排序</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  按先验概率与字面相似度对召回结果初步排序
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0 p-3">
                {!query ? (
                  <p className="text-center text-gray-400 text-sm py-8">请先在「索引与召回」中输入实体提及</p>
                ) : paginated.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">未找到匹配候选实体</p>
                ) : (
                  paginated.map((entity, idx) => {
                    const rank = (page - 1) * pageSize + idx + 1;
                    return (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => setSelectedId(entity.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedId === entity.id
                            ? 'bg-blue-50/50 border-blue-500/50'
                            : 'bg-white border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-mono text-gray-400 w-5 flex-shrink-0">
                              #{rank}
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {entity.name}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                              entityTypeColors[entity.type] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {entity.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 pl-7">
                          {entity.id} · 综合 {(entity.score * 100).toFixed(0)}% · 先验{' '}
                          {(entity.prior * 100).toFixed(0)}% · 字面 {(entity.literal * 100).toFixed(0)}%
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
              {query && totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500 px-3 py-2 border-t border-gray-100 flex-shrink-0">
                  <span>{ranked.length} 个候选</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-1">
                      {page}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧详情 */}
          <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
            {selected ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg text-gray-900">{selected.name}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        entityTypeColors[selected.type] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {selected.type}
                    </span>
                    <span className="text-xs text-gray-400">{selected.id}</span>
                  </div>
                  <p className="text-sm text-gray-500">{selected.description}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">别名</p>
                    <p className="text-sm text-gray-800">{selected.aliases?.join('、') ?? '—'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-400 mb-1">综合排序分</p>
                      <p className="text-xl font-semibold text-blue-700">
                        {(selected.score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-400 mb-1">先验概率</p>
                      <p className="text-xl font-semibold text-gray-800">
                        {(selected.prior * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs text-gray-400 mb-1">字面相似度</p>
                      <p className="text-xl font-semibold text-gray-800">
                        {(selected.literal * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    排序说明：综合分 = 0.45 × 先验概率 + 0.55 × 字面相似度，用于对召回候选做初步排序，供后续实体链接判断使用。
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Search className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">召回后选择一个候选实体查看排序详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
