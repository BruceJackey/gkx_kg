import { Search, Network, Code, Activity, Sparkles, Play } from 'lucide-react';
import { useState } from 'react';

interface GraphService {
  id: string;
  name: string;
  type: string;
  relatedGraph: string;
  status: string;
  description: string;
  lastUpdated: string;
  apiCount: number;
}

const services: GraphService[] = [
  {
    id: 'graph-visualization',
    name: '图谱可视化服务',
    type: '可视化服务',
    relatedGraph: '科技文献知识图谱',
    status: '运行中',
    description: '提供交互式的知识图谱可视化能力，支持节点搜索、路径探索、子图展示等功能',
    lastUpdated: '2026-04-18',
    apiCount: 8,
  },
  {
    id: 'graph-query',
    name: '图谱查询服务',
    type: '查询服务',
    relatedGraph: '科技文献知识图谱',
    status: '运行中',
    description: '提供灵活的图谱查询接口，支持实体查询、关系查询、路径查询、SPARQL查询等',
    lastUpdated: '2026-04-17',
    apiCount: 12,
  },
];

interface GraphServiceListProps {
  onSelectService: (serviceId: string) => void;
}

export function GraphServiceList({ onSelectService }: GraphServiceListProps) {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">图谱服务列表</h2>
          <p className="text-sm text-gray-600 mt-1">
            统一查看和管理基于知识图谱的各类服务接口
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Activity className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索服务名称..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">全部类型</option>
            <option value="可视化服务">可视化服务</option>
            <option value="查询服务">查询服务</option>
            <option value="分析服务">分析服务</option>
            <option value="推荐服务">推荐服务</option>
            <option value="QA服务">QA服务</option>
            <option value="推理服务">推理服务</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">全部状态</option>
            <option value="运行中">运行中</option>
            <option value="部署中">部署中</option>
            <option value="维护中">维护中</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Network className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                      {service.type}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs rounded-full ${
                        service.status === '运行中'
                          ? 'bg-green-100 text-green-700'
                          : service.status === '部署中'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Sparkles className="w-4 h-4" />
                      <span>关联图谱: {service.relatedGraph}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Code className="w-4 h-4" />
                      <span>{service.apiCount} 个API</span>
                    </div>
                    <div className="text-gray-500">更新: {service.lastUpdated}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectService(service.id);
                    }}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs mt-0.5">
            i
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-indigo-900 mb-1">服务说明</h4>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>• <strong>可视化服务</strong>: 提供交互式图谱浏览和探索能力</li>
              <li>• <strong>查询服务</strong>: 支持多种查询模式，包括关键词、结构化查询、SPARQL等</li>
              <li>• <strong>分析服务</strong>: 提供图算法和统计分析能力</li>
              <li>• <strong>推荐/问答服务</strong>: 基于图谱的智能应用服务</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
