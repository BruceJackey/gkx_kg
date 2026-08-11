import { Search, ChevronRight, FileText, Network, Link, Brain, Zap, Scale } from 'lucide-react';

interface DatasetCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  datasetCount: number;
  color: string;
}

const categories: DatasetCategory[] = [
  {
    id: 'entity-extraction',
    name: '实体抽取数据集',
    description: '用于训练实体识别模型的标注数据，包含文本和实体边界、类型标注',
    icon: FileText,
    datasetCount: 3,
    color: 'blue',
  },
  {
    id: 'relation-extraction',
    name: '关系抽取数据集',
    description: '用于训练关系分类模型的数据，包含实体对和关系类型标注',
    icon: Network,
    datasetCount: 2,
    color: 'purple',
  },
  {
    id: 'entity-linking',
    name: '实体消歧数据集',
    description: '用于训练实体链接模型的数据，包含候选实体和正确链接标注',
    icon: Link,
    datasetCount: 2,
    color: 'green',
  },
  {
    id: 'knowledge-reasoning',
    name: '知识推理数据集',
    description: '用于训练推理模型的数据，包含事实三元组和推理规则',
    icon: Brain,
    datasetCount: 1,
    color: 'orange',
  },
  {
    id: 'graph-embedding',
    name: '图嵌入数据集',
    description: '用于训练图嵌入模型的图结构数据，包含节点和边的信息',
    icon: Zap,
    datasetCount: 2,
    color: 'indigo',
  },
  {
    id: 'entity-similarity',
    name: '相似度计算数据集',
    description: '已标注的相似与不相似实体对数据集，用于训练实体相似度计算和对齐模型',
    icon: Scale,
    datasetCount: 2,
    color: 'teal',
  },
];

interface DatasetCategoriesProps {
  onSelectCategory: (categoryId: string) => void;
}

export function DatasetCategories({ onSelectCategory }: DatasetCategoriesProps) {
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
      teal: {
        bg: 'bg-teal-50',
        icon: 'bg-gradient-to-br from-teal-500 to-teal-600',
        border: 'border-teal-200',
        hover: 'hover:border-teal-400',
      },
    };
    return colors[color];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">数据集管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            按数据类型管理训练数据集，支持多种数据格式
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索数据集类型..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const colors = getColorClasses(category.color);
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">
                    {category.datasetCount} 个数据集
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
            <h4 className="text-sm font-medium text-blue-900 mb-1">数据集使用说明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 上传数据集时请确保数据格式符合对应算法的要求</li>
              <li>• 建议为每个数据集添加数据示例，方便其他用户理解数据格式</li>
              <li>• 支持 JSONL、CSV、TXT 等多种格式，单个文件最大 500MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
