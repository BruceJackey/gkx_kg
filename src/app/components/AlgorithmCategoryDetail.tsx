import { ArrowLeft, Layers, CheckCircle, XCircle } from 'lucide-react';
import { algorithmsByCategory, CATEGORY_LABELS, AlgorithmEntry } from '../data/algorithmRegistry';

const categoryInfo: Record<string, { name: string; description: string }> = {
  'entity-extraction': {
    name: '实体抽取算法',
    description: '从文本中识别和提取命名实体',
  },
  'relation-extraction': {
    name: '关系抽取算法',
    description: '识别实体对之间的语义关系',
  },
  'entity-linking': {
    name: '实体消歧算法',
    description: '将实体链接到知识库中的标准实体',
  },
  'knowledge-reasoning': {
    name: '知识推理算法',
    description: '基于已有知识进行推理',
  },
  'graph-embedding': {
    name: '图嵌入算法',
    description: '将图节点嵌入到向量空间',
  },
};

interface AlgorithmCategoryDetailProps {
  categoryId: string;
  onBack: () => void;
  onSelectAlgorithm: (algorithmId: string) => void;
}

export function AlgorithmCategoryDetail({ categoryId, onBack, onSelectAlgorithm }: AlgorithmCategoryDetailProps) {
  const algorithms: AlgorithmEntry[] = algorithmsByCategory[categoryId] || [];
  const category = categoryInfo[categoryId];

  const getTypeTag = (type: AlgorithmEntry['type']) => {
    const tags = {
      'deep-learning': { label: '深度学习', class: 'bg-blue-100 text-blue-700' },
      'llm': { label: '大模型', class: 'bg-purple-100 text-purple-700' },
      'rule-based': { label: '规则算法', class: 'bg-green-100 text-green-700' },
    };
    return tags[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{category?.name}</h2>
            <p className="text-gray-600 mt-1">{category?.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {algorithms.map((algo) => {
            const typeTag = getTypeTag(algo.type);
            return (
              <div
                key={algo.id}
                onClick={() => onSelectAlgorithm(algo.id)}
                className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{algo.name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs rounded-full ${typeTag.class}`}>
                        {typeTag.label}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-xs rounded-full ${
                          algo.status === '已部署'
                            ? 'bg-green-100 text-green-700'
                            : algo.status === '训练中'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {algo.status}
                      </span>
                      {algo.trainable ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                          <CheckCircle className="w-3 h-3" />
                          支持训练
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                          <XCircle className="w-3 h-3" />
                          不支持训练
                        </span>
                      )}
                      {algo.status === '已部署' && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full border border-indigo-200">
                          已上线服务
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{algo.description}</p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-gray-600">
                        <span className="text-gray-500">版本:</span> {algo.version}
                      </div>
                      <div className="text-gray-600">
                        <span className="text-gray-500">性能:</span> {algo.performance}
                      </div>
                      <div className="text-gray-500">更新: {algo.lastUpdated}</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAlgorithm(algo.id);
                    }}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    查看详情 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs mt-0.5">
            !
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-900 mb-1">算法类型说明</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>深度学习算法</strong>：需要标注数据进行训练，可自定义训练参数</li>
              <li>• <strong>大模型算法</strong>：基于预训练模型，无需训练即可使用，但可通过微调提升效果</li>
              <li>• <strong>规则算法</strong>：基于规则和统计方法，无需训练，可直接部署使用</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
