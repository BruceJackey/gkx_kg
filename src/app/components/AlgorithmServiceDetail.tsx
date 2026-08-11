import { useState } from 'react';
import { ArrowLeft, Copy, Play, Code, Network, CheckCircle } from 'lucide-react';
import { getAlgorithmById, CATEGORY_LABELS } from '../data/algorithmRegistry';

interface AlgorithmServiceDetailProps {
  serviceId: string;
  onBack: () => void;
  onViewAlgorithm?: (algorithmId: string) => void;
}

const TYPE_LABEL: Record<string, string> = {
  'deep-learning': '深度学习',
  'llm': '大模型',
  'rule-based': '规则算法',
};

export function AlgorithmServiceDetail({ serviceId, onBack, onViewAlgorithm }: AlgorithmServiceDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'test'>('overview');
  const [testResult, setTestResult] = useState('');
  const [copied, setCopied] = useState(false);

  const algo = getAlgorithmById(serviceId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!algo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <Network className="w-10 h-10" />
        <p className="text-sm">服务不存在</p>
        <button onClick={onBack} className="text-blue-600 text-sm hover:underline">返回列表</button>
      </div>
    );
  }

  const categoryLabel = CATEGORY_LABELS[algo.categoryId as keyof typeof CATEGORY_LABELS] ?? algo.categoryId;
  const serviceUrl = `http://api.example.com/algorithm/${algo.id}`;

  const capabilities = [
    `支持 ${categoryLabel} 相关任务`,
    `基于 ${TYPE_LABEL[algo.type] ?? algo.type} 方法`,
    algo.trainable ? '支持自定义数据微调训练' : '开箱即用，无需训练',
    '标准 REST API 接入',
    '批量与实时两种调用模式',
    `性能指标：${algo.performance}`,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
          {onViewAlgorithm && (
            <button
              onClick={() => onViewAlgorithm(algo.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors text-sm"
            >
              查看算法详情 →
            </button>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-2xl font-semibold text-gray-900">{algo.name}</h2>
              <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-sm rounded-full">运行中</span>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full">{categoryLabel}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{algo.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>版本: <span className="text-gray-800 font-medium">{algo.version}</span></span>
              <span>更新: {algo.lastUpdated}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mt-6">
          <div className="flex gap-1">
            {(['overview', 'api', 'test'] as const).map((tab) => {
              const labels = { overview: '服务概览', api: '查看 API', test: '在线调试' };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">算法模型信息</h3>
              <div className="space-y-3">
                {[
                  { label: '模型名称', value: algo.name },
                  { label: '版本', value: algo.version },
                  { label: '算法类型', value: TYPE_LABEL[algo.type] ?? algo.type },
                  { label: '性能指标', value: algo.performance },
                  { label: '支持训练', value: algo.trainable ? '是' : '否' },
                  { label: '最近更新', value: algo.lastUpdated },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">服务能力</h3>
              <ul className="space-y-2">
                {capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">服务地址</h3>
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
              <Code className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <code className="flex-1 text-sm font-mono text-gray-700 break-all">{serviceUrl}</code>
              <button
                onClick={() => copyToClipboard(serviceUrl)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API */}
      {activeTab === 'api' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900">API 接口文档</h3>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">请求示例</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{`POST ${serviceUrl}
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "text": "待处理文本内容",
  "params": {
    "threshold": 0.75
  }
}`}</pre>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">响应示例</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{`{
  "code": 200,
  "message": "success",
  "data": {
    "results": [
      {
        "text": "识别结果",
        "type": "ENTITY",
        "start": 0,
        "end": 4,
        "confidence": 0.95
      }
    ],
    "algorithm": "${algo.id}",
    "version": "${algo.version}"
  }
}`}</pre>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <strong>注意：</strong>调用前请在「API Key 管理」页面获取有效的访问令牌，并在请求头 Authorization 字段中携带。
          </div>
        </div>
      )}

      {/* Test */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">在线调试</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API 地址</label>
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <Code className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <code className="flex-1 text-sm font-mono text-gray-700 break-all">{serviceUrl}</code>
              <button
                onClick={() => copyToClipboard(serviceUrl)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">请求参数（JSON）</label>
            <textarea
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:border-blue-400"
              defaultValue={`{\n  "text": "示例文本内容",\n  "params": {\n    "threshold": 0.75\n  }\n}`}
            />
          </div>

          <button
            onClick={() => {
              const result = {
                code: 200,
                message: 'success',
                data: {
                  results: [{ text: '示例结果', type: 'ENTITY', start: 0, end: 4, confidence: 0.95 }],
                  algorithm: algo.id,
                  version: algo.version,
                },
                latency_ms: Math.floor(Math.random() * 80 + 20),
                timestamp: new Date().toISOString(),
              };
              setTestResult(JSON.stringify(result, null, 2));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
      )}
    </div>
  );
}
