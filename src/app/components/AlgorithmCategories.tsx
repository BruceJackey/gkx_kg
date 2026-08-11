import { Search, ChevronRight, Layers, Network, Link, Brain, Zap } from 'lucide-react';
import { algorithmsByCategory } from '../data/algorithmRegistry';

interface AlgorithmCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

const categories: AlgorithmCategory[] = [
  {
    id: 'entity-extraction',
    name: '实体抽取算法',
    description: '从文本中识别和提取命名实体，包括人名、地名、机构名、专业术语等',
    icon: Layers,
    color: 'blue',
  },
  {
    id: 'relation-extraction',
    name: '关系抽取算法',
    description: '识别实体对之间的语义关系，构建知识图谱的关系网络',
    icon: Network,
    color: 'purple',
  },
  {
    id: 'entity-linking',
    name: '实体消歧算法',
    description: '将实体链接到知识库中的标准实体，解决实体歧义问题',
    icon: Link,
    color: 'green',
  },
  {
    id: 'knowledge-reasoning',
    name: '知识推理算法',
    description: '基于已有知识进行推理，发现隐含关系和新知识',
    icon: Brain,
    color: 'orange',
  },
  {
    id: 'graph-embedding',
    name: '图嵌入算法',
    description: '将知识图谱节点和边嵌入到低维向量空间',
    icon: Zap,
    color: 'indigo',
  },
];

interface AlgorithmCategoriesProps {
  onSelectCategory: (categoryId: string) => void;
}

export function AlgorithmCategories({ onSelectCategory }: AlgorithmCategoriesProps) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string; hover: string }> = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
        border: 'border-blue-200',
        hover: 'hover:border-blue-400',
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
        border: 'border-purple-200',
        hover: 'hover:border-purple-400',
      },
      green: {
        bg: 'bg-green-50',
        icon: 'bg-gradient-to-br from-green-500 to-green-600',
        border: 'border-green-200',
        hover: 'hover:border-green-400',
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'bg-gradient-to-br from-orange-500 to-orange-600',
        border: 'border-orange-200',
        hover: 'hover:border-orange-400',
      },
      indigo: {
        bg: 'bg-indigo-50',
        icon: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
        border: 'border-indigo-200',
        hover: 'hover:border-indigo-400',
      },
    };
    return colors[color];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">算法管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            按算法类型浏览和管理各类知识图谱构建算法
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索算法类型..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const colors = getColorClasses(category.color);
            const algos = algorithmsByCategory[category.id] || [];
            const deployedCount = algos.filter(a => a.status === '已部署').length;
            return (
              <div
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`${colors.bg} border-2 ${colors.border} ${colors.hover} rounded-lg p-6 cursor-pointer transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 font-medium">
                    {algos.length} 个算法
                  </span>
                  <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {deployedCount} 已部署
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5">
            i
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">算法说明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>深度学习算法</strong>：基于神经网络，需要标注数据训练</li>
              <li>• <strong>大模型算法</strong>：基于预训练语言模型，支持零样本/少样本</li>
              <li>• <strong>规则算法</strong>：基于规则和统计方法，无需训练</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
