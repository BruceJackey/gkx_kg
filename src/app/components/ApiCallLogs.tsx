import { useState } from 'react';
import { Search, Filter, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type LogModule = 'algorithm' | 'pipeline' | 'service';

interface ApiCallLog {
  id: string;
  timestamp: string;
  apiKey: string;
  module: LogModule;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
}

const mockLogs: ApiCallLog[] = [
  {
    id: 'log_001',
    timestamp: '2026-04-23 14:30:25',
    apiKey: 'kg_prod_a3f7...n8o1',
    module: 'service',
    endpoint: '/api/v1/entity/search',
    method: 'POST',
    statusCode: 200,
    responseTime: 125,
    userAgent: 'Python/3.9 requests/2.28.0',
  },
  {
    id: 'log_002',
    timestamp: '2026-04-23 14:30:18',
    apiKey: 'kg_prod_a3f7...n8o1',
    module: 'algorithm',
    endpoint: '/api/v1/relation/query',
    method: 'GET',
    statusCode: 200,
    responseTime: 89,
    userAgent: 'PostmanRuntime/7.29.0',
  },
  {
    id: 'log_003',
    timestamp: '2026-04-23 14:29:52',
    apiKey: 'kg_test_x9y8...k5j4',
    module: 'pipeline',
    endpoint: '/api/v1/graph/visualize',
    method: 'POST',
    statusCode: 200,
    responseTime: 342,
    userAgent: 'axios/1.3.4',
  },
  {
    id: 'log_004',
    timestamp: '2026-04-23 14:29:35',
    apiKey: 'kg_prod_a3f7...n8o1',
    module: 'algorithm',
    endpoint: '/api/v1/entity/create',
    method: 'POST',
    statusCode: 201,
    responseTime: 156,
    userAgent: 'Python/3.9 requests/2.28.0',
  },
  {
    id: 'log_005',
    timestamp: '2026-04-23 14:28:42',
    apiKey: 'kg_test_x9y8...k5j4',
    module: 'pipeline',
    endpoint: '/api/v1/reasoning/infer',
    method: 'POST',
    statusCode: 500,
    responseTime: 1520,
    userAgent: 'curl/7.68.0',
  },
];

const callVolumeData = [
  { hour: '00:00', calls: 120 },
  { hour: '04:00', calls: 45 },
  { hour: '08:00', calls: 280 },
  { hour: '12:00', calls: 450 },
  { hour: '16:00', calls: 380 },
  { hour: '20:00', calls: 210 },
];

const endpointData = [
  { name: 'entity/search', count: 3520 },
  { name: 'relation/query', count: 2840 },
  { name: 'graph/visualize', count: 1950 },
  { name: 'entity/create', count: 1620 },
  { name: 'reasoning/infer', count: 980 },
];

export function ApiCallLogs() {
  const [logs] = useState<ApiCallLog[]>(mockLogs);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | LogModule>('all');

  const getModuleLabel = (m: LogModule) => {
    if (m === 'algorithm') return '算法服务';
    if (m === 'pipeline') return '流程服务';
    return '图谱服务';
  };

  const getModuleBadgeColor = (m: LogModule) => {
    if (m === 'algorithm') return 'text-blue-600 bg-blue-100';
    if (m === 'pipeline') return 'text-purple-600 bg-purple-100';
    return 'text-teal-600 bg-teal-100';
  };

  const filteredLogs = logs.filter((log) => {
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
    if (statusFilter === '2xx' && (log.statusCode < 200 || log.statusCode >= 300)) return false;
    if (statusFilter === '4xx' && (log.statusCode < 400 || log.statusCode >= 500)) return false;
    if (statusFilter === '5xx' && (log.statusCode < 500 || log.statusCode >= 600)) return false;
    if (searchText && !log.endpoint.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600 bg-green-100';
    if (statusCode >= 400 && statusCode < 500) return 'text-orange-600 bg-orange-100';
    if (statusCode >= 500) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getMethodColor = (method: string) => {
    if (method === 'GET') return 'text-blue-600 bg-blue-100';
    if (method === 'POST') return 'text-green-600 bg-green-100';
    if (method === 'PUT') return 'text-orange-600 bg-orange-100';
    if (method === 'DELETE') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">调用日志</h2>
        <p className="text-sm text-gray-600 mt-1">
          统一查看算法服务、流程服务、图谱服务的接口调用记录
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">今日调用</p>
              <p className="text-xl font-semibold text-gray-900">15,240</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">成功率</p>
              <p className="text-xl font-semibold text-gray-900">98.5%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">平均响应时间</p>
              <p className="text-xl font-semibold text-gray-900">152ms</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">错误数</p>
              <p className="text-xl font-semibold text-gray-900">228</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">调用量趋势（24小时）</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={callVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} name="调用次数" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门接口 Top 5</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={endpointData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" name="调用次数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索接口路径..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value as 'all' | LogModule)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部模块</option>
              <option value="algorithm">算法服务</option>
              <option value="pipeline">流程服务</option>
              <option value="service">图谱服务</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">全部状态</option>
              <option value="2xx">2xx 成功</option>
              <option value="4xx">4xx 客户端错误</option>
              <option value="5xx">5xx 服务端错误</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  模块
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  接口路径
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  方法
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  状态码
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  响应时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  密钥
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  User-Agent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getModuleBadgeColor(log.module)}`}>
                      {getModuleLabel(log.module)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {log.endpoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(log.statusCode)}`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.responseTime}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                    {log.apiKey}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {log.userAgent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
