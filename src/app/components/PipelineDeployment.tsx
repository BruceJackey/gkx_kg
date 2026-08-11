import { useState } from 'react';
import { Eye, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const deployments = [
  {
    id: 'DEPLOY_PL_001',
    pipelineName: 'LLM-Based 知识图谱构建流程',
    version: 'v2.0.1',
    serviceName: 'llm-kg-construction-service',
    serviceUrl: 'http://api.example.com/pipeline/llm-kg-construction',
    status: '运行中',
    currentVersion: 'v2.0.1',
    createdAt: '2026-04-12 10:00:00',
    updatedAt: '2026-04-12 10:00:00',
    apiEntry: '/api/pipeline/llm-kg-construction',
    replicas: 2,
    requests: 15234,
  },
  {
    id: 'DEPLOY_PL_002',
    pipelineName: '传统知识图谱构建流程',
    version: 'v3.2.0',
    serviceName: 'traditional-kg-service',
    serviceUrl: 'http://api.example.com/pipeline/traditional-kg',
    status: '运行中',
    currentVersion: 'v3.2.0',
    createdAt: '2026-04-10 14:30:00',
    updatedAt: '2026-04-15 09:00:00',
    apiEntry: '/api/pipeline/traditional-kg',
    replicas: 3,
    requests: 28456,
  },
  {
    id: 'DEPLOY_PL_003',
    pipelineName: '混合式知识图谱构建流程',
    version: 'v1.5.0',
    serviceName: 'hybrid-kg-service',
    serviceUrl: 'http://api.example.com/pipeline/hybrid-kg',
    status: '运行中',
    currentVersion: 'v1.5.0',
    createdAt: '2026-04-08 16:00:00',
    updatedAt: '2026-04-08 16:00:00',
    apiEntry: '/api/pipeline/hybrid-kg',
    replicas: 2,
    requests: 8932,
  },
];

export function PipelineDeployment() {
  const [showApiModal, setShowApiModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);

  const handleViewApi = (deployment: any) => {
    setSelectedDeployment(deployment);
    setShowApiModal(true);
  };

  const handleSwitchVersion = (deployment: any) => {
    setSelectedDeployment(deployment);
    setShowVersionModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">流程部署管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            查看和管理已部署的知识图谱构建流程服务
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">运行中的服务</div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {deployments.filter((d) => d.status === '运行中').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">总请求数</div>
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xs">↑</span>
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {deployments.reduce((sum, d) => sum + d.requests, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">服务副本总数</div>
            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-xs">#</span>
            </div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {deployments.reduce((sum, d) => sum + d.replicas, 0)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">已部署流程列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  流程名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  流程版本
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  服务名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  服务地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  副本数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  请求数
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
              {deployments.map((deployment) => (
                <tr key={deployment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {deployment.pipelineName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{deployment.version}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{deployment.serviceName}</td>
                  <td className="px-6 py-4 text-sm text-blue-600 max-w-xs truncate">
                    {deployment.serviceUrl}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {deployment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{deployment.replicas}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {deployment.requests.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{deployment.updatedAt}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleViewApi(deployment)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      查看API
                    </button>
                    <button
                      onClick={() => handleSwitchVersion(deployment)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      版本切换
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showApiModal && selectedDeployment && (
        <ApiDetailModal
          deployment={selectedDeployment}
          onClose={() => {
            setShowApiModal(false);
            setSelectedDeployment(null);
          }}
        />
      )}

      {showVersionModal && selectedDeployment && (
        <VersionSwitchModal
          deployment={selectedDeployment}
          onClose={() => {
            setShowVersionModal(false);
            setSelectedDeployment(null);
          }}
        />
      )}
    </div>
  );
}

function ApiDetailModal({ deployment, onClose }: { deployment: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            API 信息 - {deployment.pipelineName}
          </h3>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">服务名称:</span>
                <span className="ml-2 text-gray-900">{deployment.serviceName}</span>
              </div>
              <div>
                <span className="text-gray-600">服务地址:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-blue-600 text-xs">
                  {deployment.serviceUrl}
                </code>
              </div>
              <div>
                <span className="text-gray-600">API入口:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-blue-600 text-xs">
                  {deployment.apiEntry}
                </code>
              </div>
              <div>
                <span className="text-gray-600">请求方式:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  POST
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">请求示例</h4>
            <pre className="bg-gray-900 text-gray-100 rounded p-4 text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  texts: [
                    '清华大学和北京大学是中国的顶尖高等学府。',
                    '张三在清华大学计算机系任教授。',
                  ],
                  entity_types: ['ORG', 'PERSON', 'LOC'],
                  relation_types: ['任职于', '位于'],
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
                    graph_id: 'KG_20260419_001',
                    entities: [
                      { id: 'E1', text: '清华大学', type: 'ORG' },
                      { id: 'E2', text: '北京大学', type: 'ORG' },
                      { id: 'E3', text: '张三', type: 'PERSON' },
                    ],
                    relations: [
                      { subject: 'E3', predicate: '任职于', object: 'E1' },
                    ],
                    statistics: {
                      total_entities: 3,
                      total_relations: 1,
                      processing_time: 2.5,
                    },
                  },
                },
                null,
                2
              )}
            </pre>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-3">调用统计</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">总请求数</div>
                <div className="text-2xl font-semibold text-blue-900">
                  {deployment.requests.toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">成功率</div>
                <div className="text-2xl font-semibold text-green-900">98.5%</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">平均耗时</div>
                <div className="text-2xl font-semibold text-purple-900">2.3s</div>
              </div>
            </div>
          </div>
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

function VersionSwitchModal({ deployment, onClose }: { deployment: any; onClose: () => void }) {
  const [selectedVersion, setSelectedVersion] = useState(deployment.version);

  const handleSwitch = () => {
    if (selectedVersion !== deployment.currentVersion) {
      if (confirm(`确认将服务切换到版本 ${selectedVersion} 吗？`)) {
        alert('版本切换成功');
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-2/5 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">版本切换</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="text-sm text-gray-600 mb-4">
              当前服务: <span className="font-medium text-gray-900">{deployment.serviceName}</span>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              当前版本: <span className="font-medium text-gray-900">{deployment.currentVersion}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择目标版本 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="v2.0.1">v2.0.1 (当前版本)</option>
              <option value="v2.0.0">v2.0.0</option>
              <option value="v1.9.5">v1.9.5</option>
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1 text-sm text-yellow-800">
                <div className="font-medium mb-1">注意事项</div>
                <ul className="space-y-1 text-xs">
                  <li>• 版本切换会导致服务短暂中断（约10-30秒）</li>
                  <li>• 切换前请确认新版本已完成测试验证</li>
                  <li>• 建议在业务低峰期进行版本切换</li>
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
          <button
            onClick={handleSwitch}
            disabled={selectedVersion === deployment.currentVersion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认切换
          </button>
        </div>
      </div>
    </div>
  );
}
