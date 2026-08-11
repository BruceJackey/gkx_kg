import { useState } from 'react';
import { ArrowLeft, Play, Copy, ChevronRight, Settings, Eye, FileText } from 'lucide-react';

interface PipelineDetailProps {
  pipelineId: string;
  onBack: () => void;
  onNavigateToAlgorithm?: (algorithmId: string) => void;
}

const pipelineDetails: Record<string, any> = {
  'llm-kg-construction': {
    name: 'LLM-Based 知识图谱构建流程',
    version: 'v2.0.1',
    status: '已部署',
    scenario: '少样本场景、快速原型构建',
    description: '基于大语言模型的端到端知识图谱构建方案，通过精心设计的prompt模板和few-shot示例，实现从非结构化文本到结构化知识图谱的自动化转换。适合标注数据稀缺、需要快速迭代验证的场景。',
    owner: '张三',
    createdAt: '2025-10-15',
    updatedAt: '2026-04-12',
    steps: [
      {
        id: 1,
        name: '文本预处理与分段',
        algorithm: '文本处理工具',
        algorithmId: null,
        input: '原始文本',
        output: '清洗后的文本段落',
        description: '对输入文本进行清洗、去噪、分段处理，为后续LLM处理做准备',
      },
      {
        id: 2,
        name: 'LLM实体抽取',
        algorithm: 'LLM-Based Entity Extraction',
        algorithmId: 'llm-entity',
        input: '文本段落 + 实体类型定义',
        output: '实体列表（带类型和位置）',
        description: '使用LLM识别文本中的实体，支持零样本和少样本学习',
      },
      {
        id: 3,
        name: 'LLM关系抽取',
        algorithm: 'LLM-Based Relation Extraction',
        algorithmId: 'llm-relation',
        input: '文本 + 实体列表 + 关系类型',
        output: '实体关系三元组',
        description: '基于已识别的实体，使用LLM抽取实体间的关系',
      },
      {
        id: 4,
        name: '知识图谱构建与存储',
        algorithm: '图数据库写入工具',
        algorithmId: null,
        input: '实体 + 关系三元组',
        output: '知识图谱',
        description: '将抽取的实体和关系存储到图数据库，构建知识图谱',
      },
    ],
    inputSpec: {
      format: 'JSON',
      fields: [
        { name: 'texts', type: 'Array<string>', required: true, description: '待处理的文本列表' },
        { name: 'entity_types', type: 'Array<string>', required: true, description: '需要抽取的实体类型' },
        { name: 'relation_types', type: 'Array<string>', required: false, description: '需要抽取的关系类型（可选）' },
        { name: 'examples', type: 'Array<Object>', required: false, description: 'Few-shot示例（可选）' },
      ],
    },
    outputSpec: {
      format: 'JSON',
      fields: [
        { name: 'entities', type: 'Array<Entity>', description: '抽取的实体列表' },
        { name: 'relations', type: 'Array<Relation>', description: '抽取的关系列表' },
        { name: 'graph_id', type: 'string', description: '生成的图谱ID' },
        { name: 'statistics', type: 'Object', description: '统计信息' },
      ],
    },
    apiInfo: {
      endpoint: '/api/pipeline/llm-kg-construction',
      method: 'POST',
    },
  },
  'traditional-kg-construction': {
    name: '传统知识图谱构建流程',
    version: 'v3.2.0',
    status: '已部署',
    scenario: '大规模数据、高精度要求',
    description: '经典的多阶段知识图谱构建流程，采用训练好的专用模型完成各个环节。包括文本预处理、实体抽取、关系抽取、实体消歧、知识融合等步骤，适合大规模数据处理和对精度有较高要求的场景。',
    owner: '李四',
    createdAt: '2025-03-20',
    updatedAt: '2026-04-10',
    steps: [
      {
        id: 1,
        name: '文本预处理',
        algorithm: '文本处理工具',
        algorithmId: null,
        input: '原始文本',
        output: '标准化文本',
        description: '文本清洗、分词、词性标注等预处理操作',
      },
      {
        id: 2,
        name: '命名实体识别',
        algorithm: 'BERT-LSTM-CRF',
        algorithmId: 'bert-lstm-crf',
        input: '标准化文本',
        output: '实体列表',
        description: '使用BERT-LSTM-CRF模型进行高精度实体识别',
      },
      {
        id: 3,
        name: '关系抽取',
        algorithm: 'BERT-based Relation Extraction',
        algorithmId: 'bert-relation',
        input: '文本 + 实体',
        output: '关系三元组',
        description: '识别实体对之间的语义关系',
      },
      {
        id: 4,
        name: '实体消歧与链接',
        algorithm: 'Entity Linking',
        algorithmId: 'entity-linking',
        input: '实体 + 知识库',
        output: '标准化实体',
        description: '将实体链接到标准知识库，解决歧义',
      },
      {
        id: 5,
        name: '知识融合',
        algorithm: '知识融合算法',
        algorithmId: null,
        input: '标准化实体 + 关系',
        output: '融合后的知识',
        description: '去重、冲突检测和知识补全',
      },
      {
        id: 6,
        name: '图谱存储',
        algorithm: '图数据库',
        algorithmId: null,
        input: '融合知识',
        output: '知识图谱',
        description: '存储到Neo4j等图数据库',
      },
    ],
    inputSpec: {
      format: 'JSON',
      fields: [
        { name: 'texts', type: 'Array<string>', required: true, description: '待处理的文本列表' },
        { name: 'kb_config', type: 'Object', required: true, description: '知识库配置信息' },
        { name: 'entity_types', type: 'Array<string>', required: false, description: '实体类型过滤（可选）' },
      ],
    },
    outputSpec: {
      format: 'JSON',
      fields: [
        { name: 'entities', type: 'Array<Entity>', description: '标准化实体列表' },
        { name: 'relations', type: 'Array<Relation>', description: '关系列表' },
        { name: 'graph_id', type: 'string', description: '图谱ID' },
        { name: 'quality_score', type: 'number', description: '质量评分' },
      ],
    },
    apiInfo: {
      endpoint: '/api/pipeline/traditional-kg-construction',
      method: 'POST',
    },
  },
  'hybrid-kg-construction': {
    name: '混合式知识图谱构建流程',
    version: 'v1.5.0',
    status: '已部署',
    scenario: '平衡精度与成本',
    description: '结合传统深度学习模型和大语言模型的优势，对常见实体类型使用训练好的专用模型（速度快、成本低），对复杂场景和新类型使用LLM（灵活性高）。通过智能路由分配任务，在精度、速度和成本之间取得最佳平衡。',
    owner: '王五',
    createdAt: '2025-11-08',
    updatedAt: '2026-04-08',
    steps: [
      {
        id: 1,
        name: '文本分析与路由',
        algorithm: '任务路由器',
        algorithmId: null,
        input: '原始文本',
        output: '任务分配方案',
        description: '分析文本复杂度，决定使用传统模型还是LLM',
      },
      {
        id: 2,
        name: '实体抽取（双路径）',
        algorithm: 'BERT-LSTM-CRF + LLM-Entity',
        algorithmId: 'bert-lstm-crf',
        input: '文本',
        output: '实体列表',
        description: '常见实体用BERT模型，复杂实体用LLM',
      },
      {
        id: 3,
        name: '关系抽取（双路径）',
        algorithm: 'BERT-Relation + LLM-Relation',
        algorithmId: 'bert-relation',
        input: '文本 + 实体',
        output: '关系三元组',
        description: '常见关系用BERT，复杂关系用LLM',
      },
      {
        id: 4,
        name: '结果融合与质量检查',
        algorithm: '融合算法',
        algorithmId: null,
        input: '多路径结果',
        output: '融合结果',
        description: '合并双路径结果，进行一致性检查和质量评估',
      },
      {
        id: 5,
        name: '图谱构建',
        algorithm: '图数据库',
        algorithmId: null,
        input: '融合结果',
        output: '知识图谱',
        description: '构建并存储知识图谱',
      },
    ],
    inputSpec: {
      format: 'JSON',
      fields: [
        { name: 'texts', type: 'Array<string>', required: true, description: '待处理文本' },
        { name: 'routing_strategy', type: 'string', required: false, description: '路由策略：auto/traditional/llm' },
        { name: 'entity_types', type: 'Array<string>', required: true, description: '实体类型' },
      ],
    },
    outputSpec: {
      format: 'JSON',
      fields: [
        { name: 'entities', type: 'Array<Entity>', description: '实体列表' },
        { name: 'relations', type: 'Array<Relation>', description: '关系列表' },
        { name: 'graph_id', type: 'string', description: '图谱ID' },
        { name: 'routing_stats', type: 'Object', description: '路由统计信息' },
      ],
    },
    apiInfo: {
      endpoint: '/api/pipeline/hybrid-kg-construction',
      method: 'POST',
    },
  },
};

export function PipelineDetail({ pipelineId, onBack, onNavigateToAlgorithm }: PipelineDetailProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const pipeline = pipelineDetails[pipelineId];

  if (!pipeline) {
    return <div>流程不存在</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                返回列表
              </button>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-gray-900">{pipeline.name}</h2>
              <span
                className={`px-2.5 py-0.5 text-sm rounded-full ${
                  pipeline.status === '已部署'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {pipeline.status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm mt-3">
              <div>
                <span className="text-gray-600">流程版本:</span>
                <span className="ml-2 text-gray-900">{pipeline.version}</span>
              </div>
              <div>
                <span className="text-gray-600">负责人:</span>
                <span className="ml-2 text-gray-900">{pipeline.owner}</span>
              </div>
              <div>
                <span className="text-gray-600">最近更新:</span>
                <span className="ml-2 text-gray-900">{pipeline.updatedAt}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeployModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              部署流程
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Copy className="w-4 h-4" />
              复制API文档
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">流程介绍</h3>
        <p className="text-gray-700 mb-4">{pipeline.description}</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full">
          <span>适用场景:</span>
          <span className="font-medium">{pipeline.scenario}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">流程组成</h3>
        <div className="space-y-3">
          {pipeline.steps.map((step: any, index: number) => (
            <div key={step.id}>
              <div
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                      {step.id}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{step.name}</h4>
                        {step.algorithmId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToAlgorithm?.(step.algorithmId);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看算法 →
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>算法: {step.algorithm}</span>
                        <span>输入: {step.input}</span>
                        <span>输出: {step.output}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedStep === step.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
                {expandedStep === step.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700">{step.description}</p>
                  </div>
                )}
              </div>
              {index < pipeline.steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-6 bg-gray-300"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">输入规范</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-gray-600">数据格式:</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-900">
                {pipeline.inputSpec.format}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">字段说明:</div>
              <div className="space-y-2">
                {pipeline.inputSpec.fields.map((field: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{field.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          必填
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600">{field.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">输出规范</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-gray-600">数据格式:</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-900">
                {pipeline.outputSpec.format}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">字段说明:</div>
              <div className="space-y-2">
                {pipeline.outputSpec.fields.map((field: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{field.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                        {field.type}
                      </span>
                    </div>
                    <div className="text-gray-600">{field.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">服务调用说明</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">接口地址:</span>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-blue-600">
                {pipeline.apiInfo.endpoint}
              </code>
            </div>
            <div>
              <span className="text-gray-600">请求方式:</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                {pipeline.apiInfo.method}
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-yellow-600">💡</span>
              <div className="flex-1 text-sm text-yellow-800">
                <div className="font-medium mb-1">调用提示</div>
                <ul className="space-y-1 text-xs">
                  <li>• 流程部署后将自动生成完整的API文档和调用示例</li>
                  <li>• 支持同步调用和异步任务两种模式</li>
                  <li>• 建议使用异步模式处理大批量数据</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeployModal && (
        <PipelineDeployModal
          pipelineName={pipeline.name}
          onClose={() => setShowDeployModal(false)}
        />
      )}
    </div>
  );
}

function PipelineDeployModal({ pipelineName, onClose }: { pipelineName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-2/3 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">部署流程 - {pipelineName}</h3>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例如: kg-construction-service"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">部署配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">计算资源</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="cpu">CPU集群 (8C16G)</option>
                  <option value="gpu-small">GPU集群 - T4 (16C32G)</option>
                  <option value="gpu-large">GPU集群 - A100 (32C64G)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">服务副本数</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="1">1个副本</option>
                  <option value="2">2个副本 (推荐)</option>
                  <option value="3">3个副本</option>
                  <option value="5">5个副本</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">并发处理数</label>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">任务超时(分钟)</label>
                <input
                  type="number"
                  defaultValue={30}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">依赖算法版本选择</h4>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">实体抽取算法</span>
                  <select className="px-3 py-1.5 border border-gray-300 rounded text-sm">
                    <option>BERT-LSTM-CRF v2.3.1</option>
                    <option>BERT-LSTM-CRF v2.3.0</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">关系抽取算法</span>
                  <select className="px-3 py-1.5 border border-gray-300 rounded text-sm">
                    <option>BERT-Relation v1.5.2</option>
                    <option>BERT-Relation v1.5.1</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-blue-600">✓</span>
              <div className="flex-1 text-sm text-blue-800">
                <div className="font-medium mb-1">部署说明</div>
                <ul className="space-y-1 text-xs">
                  <li>• 流程部署后将自动生成统一的API接口</li>
                  <li>• 支持同步调用（实时返回）和异步调用（任务队列）</li>
                  <li>• 建议根据数据量选择合适的计算资源</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            开始部署
          </button>
        </div>
      </div>
    </div>
  );
}
