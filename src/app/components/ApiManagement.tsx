import { useState } from 'react';
import { Search, Copy, Play, Code, Eye, Filter } from 'lucide-react';

interface ApiItem {
  id: string;
  name: string;
  service: string;
  path: string;
  method: string;
  authType: string;
  status: string;
  description: string;
  lastUpdated: string;
}

const apis: ApiItem[] = [
  // 图谱可视化服务 API
  {
    id: 'api-viz-001',
    name: '获取子图',
    service: '图谱可视化服务',
    path: '/api/graph/visualization/subgraph',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '根据中心节点获取指定深度的子图数据',
    lastUpdated: '2026-04-18',
  },
  {
    id: 'api-viz-002',
    name: '节点搜索',
    service: '图谱可视化服务',
    path: '/api/graph/visualization/search',
    method: 'GET',
    authType: 'Bearer Token',
    status: '正常',
    description: '按关键词搜索图谱节点',
    lastUpdated: '2026-04-18',
  },
  {
    id: 'api-viz-003',
    name: '路径查询',
    service: '图谱可视化服务',
    path: '/api/graph/visualization/path',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '查询两个节点之间的最短路径',
    lastUpdated: '2026-04-17',
  },
  // 图谱查询服务 API
  {
    id: 'api-query-001',
    name: '实体查询',
    service: '图谱查询服务',
    path: '/api/graph/query/entity',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '根据条件查询实体信息',
    lastUpdated: '2026-04-17',
  },
  {
    id: 'api-query-002',
    name: '关系查询',
    service: '图谱查询服务',
    path: '/api/graph/query/relation',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '查询实体间的关系',
    lastUpdated: '2026-04-17',
  },
  {
    id: 'api-query-003',
    name: '邻居扩展',
    service: '图谱查询服务',
    path: '/api/graph/query/neighbors',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '获取节点的K度邻居',
    lastUpdated: '2026-04-16',
  },
  {
    id: 'api-query-004',
    name: 'SPARQL查询',
    service: '图谱查询服务',
    path: '/api/graph/query/sparql',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '执行SPARQL标准查询语句',
    lastUpdated: '2026-04-15',
  },
  // 图谱分析服务 API
  {
    id: 'api-analysis-001',
    name: '中心性分析',
    service: '图谱分析服务',
    path: '/api/graph/analysis/centrality',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '计算节点的中心性指标',
    lastUpdated: '2026-04-16',
  },
  {
    id: 'api-analysis-002',
    name: '社区发现',
    service: '图谱分析服务',
    path: '/api/graph/analysis/community',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '识别图谱中的社区结构',
    lastUpdated: '2026-04-16',
  },
  {
    id: 'api-analysis-003',
    name: '影响力分析',
    service: '图谱分析服务',
    path: '/api/graph/analysis/influence',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '分析节点的影响力传播',
    lastUpdated: '2026-04-15',
  },
  // 实体推荐服务 API
  {
    id: 'api-rec-001',
    name: '相似实体推荐',
    service: '实体推荐服务',
    path: '/api/graph/recommendation/similar',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '推荐与目标实体相似的实体',
    lastUpdated: '2026-04-15',
  },
  {
    id: 'api-rec-002',
    name: '关联实体发现',
    service: '实体推荐服务',
    path: '/api/graph/recommendation/related',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '发现与目标实体相关的其他实体',
    lastUpdated: '2026-04-14',
  },
  // 知识问答服务 API
  {
    id: 'api-qa-001',
    name: '问答查询',
    service: '知识问答服务',
    path: '/api/graph/qa/question',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '基于知识图谱的自然语言问答',
    lastUpdated: '2026-04-14',
  },
  {
    id: 'api-qa-002',
    name: '答案验证',
    service: '知识问答服务',
    path: '/api/graph/qa/verify',
    method: 'POST',
    authType: 'Bearer Token',
    status: '正常',
    description: '验证答案的准确性',
    lastUpdated: '2026-04-13',
  },
];

export function ApiManagement() {
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleViewDetail = (api: ApiItem) => {
    setSelectedApi(api);
    setShowDetailModal(true);
  };

  const handleTest = (api: ApiItem) => {
    setSelectedApi(api);
    setShowTestModal(true);
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    alert('接口路径已复制');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">API 管理</h2>
          <p className="text-sm text-gray-600 mt-1">统一查看和管理所有图谱服务API接口</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索API名称或路径..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">全部服务</option>
            <option value="图谱可视化服务">图谱可视化服务</option>
            <option value="图谱查询服务">图谱查询服务</option>
            <option value="图谱分析服务">图谱分析服务</option>
            <option value="实体推荐服务">实体推荐服务</option>
            <option value="知识问答服务">知识问答服务</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">全部方法</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">全部状态</option>
            <option value="正常">正常</option>
            <option value="维护中">维护中</option>
            <option value="已废弃">已废弃</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  API 名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  所属服务
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  接口路径
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  请求方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  鉴权方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apis.map((api) => (
                <tr key={api.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{api.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{api.service}</td>
                  <td className="px-6 py-4 text-sm">
                    <code className="px-2 py-1 bg-gray-100 rounded text-blue-600 text-xs">
                      {api.path}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${
                        api.method === 'GET'
                          ? 'bg-blue-100 text-blue-700'
                          : api.method === 'POST'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {api.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{api.authType}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {api.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{api.lastUpdated}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(api)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleTest(api)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        在线调试
                      </button>
                      <button
                        onClick={() => handleCopyPath(api.path)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedApi && (
        <ApiDetailModal api={selectedApi} onClose={() => setShowDetailModal(false)} />
      )}

      {showTestModal && selectedApi && (
        <ApiTestModal api={selectedApi} onClose={() => setShowTestModal(false)} />
      )}
    </div>
  );
}

function ApiDetailModal({ api, onClose }: { api: ApiItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">API 详情 - {api.name}</h3>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">API名称:</span>
                <span className="ml-2 text-gray-900">{api.name}</span>
              </div>
              <div>
                <span className="text-gray-600">所属服务:</span>
                <span className="ml-2 text-gray-900">{api.service}</span>
              </div>
              <div>
                <span className="text-gray-600">接口路径:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-blue-600 text-xs">
                  {api.path}
                </code>
              </div>
              <div>
                <span className="text-gray-600">请求方式:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                  {api.method}
                </span>
              </div>
              <div>
                <span className="text-gray-600">鉴权方式:</span>
                <span className="ml-2 text-gray-900">{api.authType}</span>
              </div>
              <div>
                <span className="text-gray-600">状态:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  {api.status}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-gray-600 text-sm">描述:</span>
              <p className="mt-1 text-gray-900">{api.description}</p>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">请求参数</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">参数名</th>
                    <th className="px-4 py-2 text-left border-b">类型</th>
                    <th className="px-4 py-2 text-left border-b">必填</th>
                    <th className="px-4 py-2 text-left border-b">说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b">keyword</td>
                    <td className="px-4 py-2 border-b">String</td>
                    <td className="px-4 py-2 border-b">是</td>
                    <td className="px-4 py-2 border-b">搜索关键词</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">limit</td>
                    <td className="px-4 py-2">Integer</td>
                    <td className="px-4 py-2">否</td>
                    <td className="px-4 py-2">返回结果数量，默认20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">请求示例</h4>
            <pre className="bg-gray-900 text-gray-100 rounded p-4 text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  keyword: '深度学习',
                  entity_types: ['概念', '技术'],
                  limit: 20,
                },
                null,
                2
              )}
            </pre>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">响应示例</h4>
            <pre className="bg-gray-900 text-gray-100 rounded p-4 text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  code: 200,
                  message: 'success',
                  data: {
                    entities: [
                      { id: 'E_001', name: '深度学习', type: '概念' },
                      { id: 'E_002', name: '卷积神经网络', type: '技术' },
                    ],
                    total: 2,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">错误码说明</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left border-b">错误码</th>
                    <th className="px-4 py-2 text-left border-b">说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b">400</td>
                    <td className="px-4 py-2 border-b">请求参数错误</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b">401</td>
                    <td className="px-4 py-2 border-b">未授权，token无效或过期</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">500</td>
                    <td className="px-4 py-2">服务器内部错误</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(api.path);
              alert('接口路径已复制');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" />
            复制路径
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function ApiTestModal({ api, onClose }: { api: ApiItem; onClose: () => void }) {
  const [testResult, setTestResult] = useState('');

  const handleTest = () => {
    const mockResult = {
      code: 200,
      message: 'success',
      data: {
        result: 'API调用成功',
        timestamp: new Date().toISOString(),
      },
    };
    setTestResult(JSON.stringify(mockResult, null, 2));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">在线调试 - {api.name}</h3>
        </div>
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-gray-50 rounded p-3 text-sm">
            <div className="flex items-center gap-4">
              <span
                className={`px-2 py-1 text-xs rounded font-medium ${
                  api.method === 'GET'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {api.method}
              </span>
              <code className="text-blue-600">{api.path}</code>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">请求参数</label>
            <textarea
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              defaultValue={JSON.stringify({ keyword: '深度学习', limit: 10 }, null, 2)}
            />
          </div>

          <button
            onClick={handleTest}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            发送请求
          </button>

          {testResult && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">返回结果</label>
              <pre className="bg-gray-900 text-gray-100 rounded p-4 text-xs overflow-x-auto">
                {testResult}
              </pre>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
