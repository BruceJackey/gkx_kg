import { useState } from 'react';
import { ArrowLeft, Copy, Play, Code, Network, Zap, CheckCircle } from 'lucide-react';

interface GraphServiceDetailProps {
  serviceId: string;
  onBack: () => void;
}

const serviceDetails: Record<string, any> = {
  'graph-visualization': {
    name: '图谱可视化服务',
    type: '可视化服务',
    status: '运行中',
    relatedGraph: '科技文献知识图谱',
    description: '提供交互式的知识图谱可视化能力，基于D3.js和Canvas技术实现高性能渲染。支持节点搜索、路径探索、子图展示、布局切换等丰富的交互功能。适用于图谱浏览、关系发现、知识探索等场景。',
    source: '图谱平台核心服务',
    capabilities: [
      '支持万级节点的流畅渲染',
      '多种布局算法：力导向、层次、径向等',
      '节点/边的样式自定义',
      '交互式筛选和高亮',
      '路径查询和可视化',
      '子图导出功能',
    ],
    graphInfo: {
      name: '科技文献知识图谱',
      entities: '2,580,000',
      relations: '8,450,000',
      types: '50+',
    },
    serviceUrl: 'http://api.example.com/graph/visualization',
    lastUpdated: '2026-04-18',
  },
  'graph-query': {
    name: '图谱查询服务',
    type: '查询服务',
    status: '运行中',
    relatedGraph: '科技文献知识图谱',
    description: '提供灵活强大的图谱查询接口，支持多种查询模式。包括实体查询、关系查询、路径查询、邻居扩展、SPARQL查询等。底层基于Neo4j图数据库，具有毫秒级查询响应能力。',
    source: '图谱平台核心服务',
    capabilities: [
      '实体属性查询和全文检索',
      '多跳关系路径查询',
      'K度邻居扩展查询',
      '条件过滤和结果排序',
      'SPARQL标准查询语言支持',
      '分页查询和结果聚合',
      '查询结果导出（JSON/CSV）',
    ],
    graphInfo: {
      name: '科技文献知识图谱',
      entities: '2,580,000',
      relations: '8,450,000',
      types: '50+',
    },
    serviceUrl: 'http://api.example.com/graph/query',
    lastUpdated: '2026-04-17',
  },
  'graph-analysis': {
    name: '图谱分析服务',
    type: '分析服务',
    status: '运行中',
    relatedGraph: '科技文献知识图谱',
    description: '提供丰富的图谱统计和分析能力，基于图算法实现深度分析。支持节点中心性分析、社区发现、影响力传播、重要性评估等功能。适用于学者影响力分析、研究团队发现、学科演化分析等场景。',
    source: '图谱平台核心服务',
    capabilities: [
      'PageRank中心性分析',
      '度中心性和介数中心性',
      'Louvain社区发现算法',
      '最短路径和多源路径分析',
      '影响力传播模拟',
      '图结构统计分析',
    ],
    graphInfo: {
      name: '科技文献知识图谱',
      entities: '2,580,000',
      relations: '8,450,000',
      types: '50+',
    },
    serviceUrl: 'http://api.example.com/graph/analysis',
    lastUpdated: '2026-04-16',
  },
  'entity-recommendation': {
    name: '实体推荐服务',
    type: '推荐服务',
    status: '运行中',
    relatedGraph: '科技文献知识图谱',
    description: '基于知识图谱的智能推荐服务，利用图结构和语义信息进行个性化推荐。支持相似实体推荐、关联实体发现、协同过滤推荐等。适用于文献推荐、专家推荐、研究方向推荐等场景。',
    source: 'LLM-Based 知识图谱构建流程 + 推荐算法',
    capabilities: [
      '基于结构相似度的实体推荐',
      '基于属性的语义推荐',
      '图嵌入相似度计算',
      '多源混合推荐策略',
      '实时推荐和离线推荐',
      '可解释性推荐结果',
    ],
    graphInfo: {
      name: '科技文献知识图谱',
      entities: '2,580,000',
      relations: '8,450,000',
      types: '50+',
    },
    serviceUrl: 'http://api.example.com/graph/recommendation',
    lastUpdated: '2026-04-15',
  },
  'knowledge-qa': {
    name: '知识问答服务',
    type: 'QA服务',
    status: '运行中',
    relatedGraph: '科技文献知识图谱',
    description: '基于知识图谱的智能问答服务，结合自然语言理解和图谱查询技术。支持事实型问答、推理型问答、列举型问答等多种问题类型。采用LLM+KG混合架构，提供准确可靠的答案。',
    source: 'LLM-Based Entity Extraction + 图谱查询服务',
    capabilities: [
      '自然语言问题理解',
      '实体识别和链接',
      '查询语句生成',
      '多跳推理问答',
      '答案生成和排序',
      '答案来源追溯',
    ],
    graphInfo: {
      name: '科技文献知识图谱',
      entities: '2,580,000',
      relations: '8,450,000',
      types: '50+',
    },
    serviceUrl: 'http://api.example.com/graph/qa',
    lastUpdated: '2026-04-14',
  },
};

export function GraphServiceDetail({ serviceId, onBack }: GraphServiceDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'test'>('overview');
  const [testResult, setTestResult] = useState('');
  const service = serviceDetails[serviceId] || serviceDetails['graph-visualization'];

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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">关联图谱信息</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">图谱名称</span>
                  <span className="text-sm font-medium text-gray-900">{service.graphInfo.name}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">实体数量</span>
                  <span className="text-sm font-medium text-gray-900">{service.graphInfo.entities}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">关系数量</span>
                  <span className="text-sm font-medium text-gray-900">{service.graphInfo.relations}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">实体类型</span>
                  <span className="text-sm font-medium text-gray-900">{service.graphInfo.types}</span>
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
                  <pre className="text-sm">{getExampleRequest(serviceId)}</pre>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">响应示例</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">{getExampleResponse(serviceId)}</pre>
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
                  placeholder={getExampleRequest(serviceId)}
                />
              </div>

              <button
                onClick={() => {
                  const mockResult = {
                    code: 200,
                    message: 'success',
                    data: getTestMockData(serviceId),
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

function getTestMockData(serviceId: string): any {
  const mockData: Record<string, any> = {
    'graph-visualization': {
      nodes: [
        { id: 'E_12345', label: '深度学习', type: '概念' },
        { id: 'E_12346', label: '卷积神经网络', type: '技术' },
      ],
      edges: [{ source: 'E_12345', target: 'E_12346', relation: '包含' }],
    },
    'graph-query': {
      entities: [
        { id: 'E_001', name: '深度学习', type: '概念', properties: {} },
      ],
      total: 1,
    },
  };

  return mockData[serviceId] || { result: '测试调用成功' };
}

function getExampleRequest(serviceId: string): string {
  const examples: Record<string, any> = {
    'graph-visualization': {
      endpoint: '/api/graph/visualization/subgraph',
      method: 'POST',
      body: {
        entity_id: 'E_12345',
        depth: 2,
        max_nodes: 100,
        relation_types: ['引用', '作者', '机构'],
      },
    },
    'graph-query': {
      endpoint: '/api/graph/query/entity',
      method: 'POST',
      body: {
        keyword: '深度学习',
        entity_types: ['概念', '技术'],
        limit: 20,
      },
    },
    'graph-analysis': {
      endpoint: '/api/graph/analysis/centrality',
      method: 'POST',
      body: {
        algorithm: 'pagerank',
        entity_type: '学者',
        top_k: 100,
      },
    },
    'entity-recommendation': {
      endpoint: '/api/graph/recommendation/similar',
      method: 'POST',
      body: {
        entity_id: 'E_12345',
        top_k: 10,
        strategy: 'hybrid',
      },
    },
    'knowledge-qa': {
      endpoint: '/api/graph/qa/question',
      method: 'POST',
      body: {
        question: '张三的研究方向是什么?',
        max_hops: 3,
      },
    },
  };

  return JSON.stringify(examples[serviceId] || {}, null, 2);
}

function getExampleResponse(serviceId: string): string {
  const examples: Record<string, any> = {
    'graph-visualization': {
      code: 200,
      data: {
        nodes: [
          { id: 'E_12345', label: '深度学习', type: '概念' },
          { id: 'E_12346', label: '卷积神经网络', type: '技术' },
        ],
        edges: [{ source: 'E_12345', target: 'E_12346', relation: '包含' }],
      },
    },
    'graph-query': {
      code: 200,
      data: {
        entities: [
          { id: 'E_001', name: '深度学习', type: '概念', properties: {} },
        ],
        total: 1,
      },
    },
    'graph-analysis': {
      code: 200,
      data: {
        results: [
          { entity_id: 'E_001', entity_name: '张三', score: 0.95 },
        ],
      },
    },
  };

  return JSON.stringify(examples[serviceId] || { code: 200, message: 'success' }, null, 2);
}
