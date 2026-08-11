import { useState } from 'react';
import { ArrowLeft, Copy, Play, Code, Network, Zap, CheckCircle } from 'lucide-react';

interface PipelineServiceDetailProps {
  serviceId: string;
  onBack: () => void;
}

const serviceDetails: Record<string, any> = {
  'kg-construction-service': {
    name: '知识图谱构建服务',
    type: '图谱构建',
    status: '运行中',
    pipeline: '标准图谱构建流程 v1.0',
    description: '端到端的知识图谱构建流程服务。集成实体抽取、关系抽取、实体链接等多个算法模块，提供完整的从文本到知识图谱的转换能力。支持批量处理和实时构建两种模式。',
    capabilities: [
      '端到端自动化构建',
      '支持多种文本格式输入',
      '实体抽取、关系抽取、实体链接集成',
      '批量处理和实时构建',
      '图谱质量评估和优化',
      '增量构建和更新',
    ],
    pipelineInfo: {
      name: '标准图谱构建流程',
      version: 'v1.0',
      steps: ['文本预处理', '实体抽取', '关系抽取', '实体链接', '图谱存储'],
      avgTime: '30秒/千字',
    },
    serviceUrl: 'http://api.example.com/pipeline/kg-construction',
    lastUpdated: '2026-04-18',
  },
  'llm-kg-construction-service': {
    name: 'LLM图谱构建服务',
    type: '图谱构建',
    status: '运行中',
    pipeline: 'LLM-Based 图谱构建 v2.1',
    description: '基于大语言模型的知识图谱构建服务。利用大模型的理解能力，实现更准确的实体识别和关系抽取。特别适合处理复杂文本和领域知识抽取。',
    capabilities: [
      '基于大模型的深度理解',
      '支持复杂语义关系抽取',
      '零样本和少样本学习',
      '多语言支持',
      '领域自适应能力强',
      '知识推理增强',
    ],
    pipelineInfo: {
      name: 'LLM-Based 图谱构建',
      version: 'v2.1',
      steps: ['文本理解', 'LLM实体识别', 'LLM关系抽取', '知识推理', '图谱融合'],
      avgTime: '45秒/千字',
    },
    serviceUrl: 'http://api.example.com/pipeline/llm-kg-construction',
    lastUpdated: '2026-04-17',
  },
};

export function PipelineServiceDetail({ serviceId, onBack }: PipelineServiceDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'test'>('overview');
  const [testResult, setTestResult] = useState('');
  const service = serviceDetails[serviceId] || serviceDetails['kg-construction-service'];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-900">{service.name}</h2>
          <p className="text-sm text-gray-600 mt-1">{service.type}</p>
        </div>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            service.status === '运行中'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {service.status}
        </span>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            服务概览
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'api'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            查看API
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'test'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            在线调试
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">服务描述</h3>
            <p className="text-gray-700 leading-relaxed">{service.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">流程信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">流程名称</span>
                  <span className="text-sm font-medium text-gray-900">{service.pipelineInfo.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">版本</span>
                  <span className="text-sm font-medium text-gray-900">{service.pipelineInfo.version}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">平均耗时</span>
                  <span className="text-sm font-medium text-gray-900">{service.pipelineInfo.avgTime}</span>
                </div>
                <div className="py-2">
                  <span className="text-sm text-gray-600 block mb-2">流程步骤</span>
                  <div className="flex flex-wrap gap-2">
                    {service.pipelineInfo.steps.map((step: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {index + 1}. {step}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">服务能力</h3>
              <ul className="space-y-2">
                {service.capabilities.map((capability: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">服务地址</h3>
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
              <Code className="w-5 h-5 text-gray-400" />
              <code className="flex-1 text-sm font-mono text-gray-700">{service.serviceUrl}</code>
              <button
                onClick={() => copyToClipboard(service.serviceUrl)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API 接口文档</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">请求示例</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`POST ${service.serviceUrl}
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "text": "待处理的文本内容",
  "params": {
    "language": "zh",
    "mode": "batch"
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">响应示例</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`{
  "code": 200,
  "message": "success",
  "data": {
    "entities": [...],
    "relations": [...],
    "graph_id": "kg_xxx",
    "processing_time": "28.5s"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'test' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">在线调试</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API 地址</label>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Code className="w-5 h-5 text-gray-400" />
                  <code className="flex-1 text-sm font-mono text-gray-700">{service.serviceUrl}</code>
                  <button
                    onClick={() => copyToClipboard(service.serviceUrl)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">请求参数</label>
                <textarea
                  className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder={`{
  "text": "待处理的文本内容",
  "params": {
    "language": "zh",
    "mode": "batch"
  }
}`}
                />
              </div>

              <button
                onClick={() => {
                  const mockResult = {
                    code: 200,
                    message: 'success',
                    data: {
                      entities: [{ id: 'E_001', text: '示例实体', type: 'PERSON' }],
                      relations: [{ source: 'E_001', target: 'E_002', type: '相关' }],
                      graph_id: 'kg_12345',
                      processing_time: '28.5s'
                    },
                    timestamp: new Date().toISOString(),
                  };
                  setTestResult(JSON.stringify(mockResult, null, 2));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Play className="w-4 h-4" />
                发送请求
              </button>

              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">返回结果</label>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">{testResult}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
