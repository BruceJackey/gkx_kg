import { Search, ChevronRight, Zap, GitBranch, Layers, Brain, RefreshCw, FileSearch, Network } from 'lucide-react';

interface PipelineCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  pipelineCount: number;
  color: string;
}

const categories: PipelineCategory[] = [
  {
    id: 'end-to-end',
    name: '端到端构建流程',
    description: '基于大语言模型的一站式知识图谱构建方案，适合快速原型和少样本场景',
    icon: Zap,
    pipelineCount: 1,
    color: 'purple',
  },
  {
    id: 'multi-stage',
    name: '多阶段构建流程',
    description: '经典的阶段式Pipeline，通过多个专用算法组合完成知识图谱构建',
    icon: GitBranch,
    pipelineCount: 1,
    color: 'blue',
  },
  {
    id: 'hybrid',
    name: '混合式构建流程',
    description: '结合传统方法和LLM的优势，在精度、效率和成本间寻求最佳平衡',
    icon: Layers,
    pipelineCount: 1,
    color: 'green',
  },
  {
    id: 'domain-specific',
    name: '领域专用流程',
    description: '针对专业领域优化的构建流程，集成领域本体和专业术语库',
    icon: Brain,
    pipelineCount: 1,
    color: 'orange',
  },
  {
    id: 'incremental',
    name: '增量更新流程',
    description: '支持对已有知识图谱进行增量更新，避免重复处理，提升更新效率',
    icon: RefreshCw,
    pipelineCount: 1,
    color: 'indigo',
  },
  {
    id: 'text-semantic',
    name: '文本语义抽取',
    description: '自动化工作流，从大规模文本语料中识别并抽取与指定概念相关的候选属性及其对应值',
    icon: FileSearch,
    pipelineCount: 1,
    color: 'teal',
  },
  {
    id: 'kg-construction',
    name: '知识图谱构造引擎',
    description: '从 0 到 1 完整构造知识图谱，涵盖数据源配置、本体选择、实时监控、人机确认全流程',
    icon: Network,
    pipelineCount: 1,
    color: 'blue',
  },
];

interface PipelineCategoriesProps {
  onSelectCategory: (categoryId: string) => void;
}

export function PipelineCategories({ onSelectCategory }: PipelineCategoriesProps) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string; hover: string }> = {
      purple: {
        bg: 'bg-purple-50',
        icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
        border: 'border-purple-200',
        hover: 'hover:border-purple-400',
      },
      blue: {
        bg: 'bg-blue-50',
        icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
        border: 'border-blue-200',
        hover: 'hover:border-blue-400',
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
          <h2 className="text-2xl font-semibold text-gray-900">流程管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            按流程类型浏览和管理知识图谱构建Pipeline
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索流程类型..."
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
                    {category.pipelineCount} 个流程
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs mt-0.5">
            i
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-purple-900 mb-1">流程选择建议</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• <strong>端到端流程</strong>：适合标注数据少、需要快速验证的场景</li>
              <li>• <strong>多阶段流程</strong>：适合大规模数据处理、对成本敏感的场景</li>
              <li>• <strong>混合式流程</strong>：在精度和成本之间寻求平衡的最佳选择</li>
              <li>• <strong>领域流程</strong>：针对专业领域优化，精度更高但需要领域知识支持</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
