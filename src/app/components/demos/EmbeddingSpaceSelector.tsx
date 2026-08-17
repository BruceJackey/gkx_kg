export type EmbeddingSpace = 'real' | 'complex';

export const GRAPH_EMBEDDING_SPACE_ALGOS = [
  'node2vec',
  'graph-sage',
  'representation-space',
  'encoding-model',
] as const;

export function supportsEmbeddingSpace(algorithmId: string): boolean {
  return (GRAPH_EMBEDDING_SPACE_ALGOS as readonly string[]).includes(algorithmId);
}

export const EMBEDDING_SPACE_OPTIONS = [
  {
    id: 'real' as const,
    name: '实数空间嵌入',
    symbol: 'ℝ',
    badge: '推荐',
    badgeClass: 'bg-blue-100 text-blue-700',
    selectedClass: 'border-blue-500 bg-blue-50 ring-2 ring-blue-400',
    idleClass: 'border-blue-200 bg-blue-50/60 hover:border-blue-300',
    hint: '实体与关系映射到 ℝᵈ，计算高效、显存占用低，适配 TransE、DistMult、Node2Vec、GraphSAGE。',
  },
  {
    id: 'complex' as const,
    name: '复数空间嵌入',
    symbol: 'ℂ',
    badge: '高精度',
    badgeClass: 'bg-purple-100 text-purple-700',
    selectedClass: 'border-purple-500 bg-purple-50 ring-2 ring-purple-400',
    idleClass: 'border-purple-200 bg-purple-50/60 hover:border-purple-300',
    hint: '实体与关系映射到 ℂᵈ，实部与虚部协同建模，可表达对称/反对称/互逆关系，适配 ComplEx、RotatE。',
  },
];

export function embeddingSpaceLabel(space: EmbeddingSpace): string {
  return space === 'complex' ? '复数空间 ℂ' : '实数空间 ℝ';
}

interface EmbeddingSpaceSelectorProps {
  value: EmbeddingSpace;
  onChange: (space: EmbeddingSpace) => void;
  /** compact：训练弹窗两列卡片；默认也是两列，可附带标题说明 */
  showHeader?: boolean;
}

export function EmbeddingSpaceSelector({
  value,
  onChange,
  showHeader = true,
}: EmbeddingSpaceSelectorProps) {
  return (
    <div>
      {showHeader && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          表示空间 <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-gray-400">
            决定嵌入落在实数域还是复数域，切换后需重新训练
          </span>
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        {EMBEDDING_SPACE_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${selected ? opt.selectedClass : opt.idleClass}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-700 select-none">
                  {opt.symbol}
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${opt.badgeClass}`}>
                  {opt.badge}
                </span>
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">{opt.name}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{opt.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
