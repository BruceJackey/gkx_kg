import { ArrowLeft, GitBranch, Layers, Zap, Clock } from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  type: string;
  version: string;
  status: string;
  scenario: string;
  description: string;
  steps: number;
  lastUpdated: string;
  performance: string;
}

const pipelinesByCategory: Record<string, Pipeline[]> = {
  'end-to-end': [
    {
      id: 'llm-kg-construction',
      name: 'LLM-Based 知识图谱构建流程',
      type: '端到端构建',
      version: 'v2.0.1',
      status: '已部署',
      scenario: '少样本场景、快速原型构建',
      description: '基于大语言模型的端到端知识图谱构建方案，通过prompt工程实现从文本到图谱的一站式处理',
      steps: 4,
      lastUpdated: '2026-04-12',
      performance: '准确率: 90-93%',
    },
  ],
  'multi-stage': [
    {
      id: 'traditional-kg-construction',
      name: '传统知识图谱构建流程',
      type: '多阶段Pipeline',
      version: 'v3.2.0',
      status: '已部署',
      scenario: '大规模数据、高精度要求',
      description: '经典的多阶段知识图谱构建流程，通过专用模型逐步完成实体抽取、关系抽取、实体消歧和知识融合',
      steps: 6,
      lastUpdated: '2026-04-10',
      performance: '准确率: 88-91%',
    },
  ],
  'hybrid': [
    {
      id: 'hybrid-kg-construction',
      name: '混合式知识图谱构建流程',
      type: '混合方案',
      version: 'v1.5.0',
      status: '已部署',
      scenario: '平衡精度与成本',
      description: '结合传统方法的高效性和LLM的灵活性，对常见实体用传统模型，复杂场景使用LLM',
      steps: 5,
      lastUpdated: '2026-04-08',
      performance: '准确率: 89-92%',
    },
  ],
  'domain-specific': [
    {
      id: 'domain-kg-construction',
      name: '领域知识图谱构建流程',
      type: '专业领域',
      version: 'v2.1.0',
      status: '训练中',
      scenario: '科技文献、医疗等专业领域',
      description: '针对专业领域优化的知识图谱构建流程，集成领域本体和专业术语库',
      steps: 7,
      lastUpdated: '2026-04-15',
      performance: '准确率: 91-94%',
    },
  ],
  'incremental': [
    {
      id: 'incremental-kg-update',
      name: '增量知识图谱更新流程',
      type: '增量更新',
      version: 'v1.3.0',
      status: '已部署',
      scenario: '知识库持续更新',
      description: '支持对已有知识图谱进行增量更新，识别新实体和关系，避免重复处理',
      steps: 5,
      lastUpdated: '2026-04-05',
      performance: '更新效率: 95%+',
    },
  ],
};

const categoryInfo: Record<string, { name: string; description: string; icon: any }> = {
  'end-to-end': {
    name: '端到端构建流程',
    description: '基于大语言模型的一站式知识图谱构建方案',
    icon: Zap,
  },
  'multi-stage': {
    name: '多阶段构建流程',
    description: '经典的阶段式Pipeline，通过多个专用算法组合',
    icon: GitBranch,
  },
  'hybrid': {
    name: '混合式构建流程',
    description: '结合传统方法和LLM的优势',
    icon: Layers,
  },
  'domain-specific': {
    name: '领域专用流程',
    description: '针对专业领域优化的构建流程',
    icon: GitBranch,
  },
  'incremental': {
    name: '增量更新流程',
    description: '支持对已有知识图谱进行增量更新',
    icon: GitBranch,
  },
};

interface PipelineCategoryDetailProps {
  categoryId: string;
  onBack: () => void;
  onSelectPipeline: (pipelineId: string) => void;
}

export function PipelineCategoryDetail({ categoryId, onBack, onSelectPipeline }: PipelineCategoryDetailProps) {
  const pipelines = pipelinesByCategory[categoryId] || [];
  const category = categoryInfo[categoryId];
  const IconComponent = category?.icon;

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
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            {IconComponent && <IconComponent className="w-7 h-7 text-white" />}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{category?.name}</h2>
            <p className="text-gray-600 mt-1">{category?.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              onClick={() => onSelectPipeline(pipeline.id)}
              className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{pipeline.name}</h3>
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {pipeline.type}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs rounded-full ${
                        pipeline.status === '已部署'
                          ? 'bg-green-100 text-green-700'
                          : pipeline.status === '训练中'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pipeline.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{pipeline.description}</p>
                  <div className="flex items-center gap-6 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <GitBranch className="w-4 h-4" />
                      <span>{pipeline.steps} 个步骤</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Layers className="w-4 h-4" />
                      <span>版本: {pipeline.version}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Zap className="w-4 h-4" />
                      <span>{pipeline.performance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>更新: {pipeline.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                    <span>适用场景:</span>
                    <span className="font-medium">{pipeline.scenario}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPipeline(pipeline.id);
                    }}
                    className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    查看详情 →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs mt-0.5">
            !
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-purple-900 mb-1">流程说明</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• 流程包含多个算法步骤，按顺序执行完成知识图谱构建</li>
              <li>• 不同流程适用于不同的数据规模和精度要求</li>
              <li>• 可根据实际需求选择合适的流程类型</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
