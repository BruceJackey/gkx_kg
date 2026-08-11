import { useState } from 'react';
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  callCount: number;
  status: 'active' | 'disabled';
}

const mockApiKeys: ApiKey[] = [
  {
    id: 'key_001',
    name: '生产环境密钥',
    key: 'kg_prod_a3f7b2c9d4e1f8g6h5i2j7k4l9m3n8o1',
    createdAt: '2026-03-01 10:00:00',
    lastUsed: '2026-04-23 14:30:00',
    callCount: 15240,
    status: 'active',
  },
  {
    id: 'key_002',
    name: '测试环境密钥',
    key: 'kg_test_x9y8w7v6u5t4s3r2q1p0o9n8m7l6k5j4',
    createdAt: '2026-03-15 14:20:00',
    lastUsed: '2026-04-22 16:45:00',
    callCount: 3520,
    status: 'active',
  },
  {
    id: 'key_003',
    name: '开发环境密钥',
    key: 'kg_dev_b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9',
    createdAt: '2026-04-01 09:30:00',
    lastUsed: '2026-04-20 11:15:00',
    callCount: 850,
    status: 'disabled',
  },
];

export function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return key;
    return key.substring(0, 12) + '•'.repeat(key.length - 12);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? '启用' : '禁用';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">API 密钥管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            管理您的 API 访问密钥，用于调用算法、流程和图谱服务接口
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          创建密钥
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">总密钥数</p>
              <p className="text-xl font-semibold text-gray-900">{apiKeys.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">活跃密钥</p>
              <p className="text-xl font-semibold text-gray-900">
                {apiKeys.filter((k) => k.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">总调用次数</p>
              <p className="text-xl font-semibold text-gray-900">
                {apiKeys.reduce((sum, k) => sum + k.callCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  密钥名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  密钥
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  调用次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  最后使用
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {apiKey.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-gray-700">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 text-xs rounded-full ${getStatusBadge(apiKey.status)}`}>
                      {getStatusText(apiKey.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apiKey.callCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apiKey.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apiKey.lastUsed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5">
            i
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">密钥使用说明</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• API 密钥用于调用知识图谱服务接口时的身份认证</li>
              <li>• 请妥善保管您的密钥，不要在公开场合泄露</li>
              <li>• 如果密钥泄露，请立即删除并创建新密钥</li>
              <li>• 调用接口时，在请求头中添加 <code className="bg-blue-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code></li>
            </ul>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateApiKeyModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateApiKeyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">创建 API 密钥</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密钥名称</label>
            <input
              type="text"
              placeholder="例如：生产环境密钥"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述 <span className="text-xs text-gray-500">(可选)</span>
            </label>
            <textarea
              placeholder="密钥用途说明..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
