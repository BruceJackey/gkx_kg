import { Search, Network, Activity, Sparkles, Code, Play } from 'lucide-react';
import { useState } from 'react';

interface PipelineService {
  id: string;
  name: string;
  type: string;
  pipeline: string;
  status: string;
  description: string;
  lastUpdated: string;
  apiCount: number;
}

const services: PipelineService[] = [
  {
    id: 'kg-construction-service',
    name: '知识图谱构建服务',
    type: '图谱构建',
    pipeline: '标准图谱构建流程 v1.0',
    status: '运行中',
    description: '端到端的知识图谱构建流程，包含实体抽取、关系抽取、实体链接',
    lastUpdated: '2026-04-18',
    apiCount: 5,
  },
  {
    id: 'llm-kg-construction-service',
    name: 'LLM图谱构建服务',
    type: '图谱构建',
    pipeline: 'LLM-Based 图谱构建 v2.1',
    status: '运行中',
    description: '基于大语言模型的知识图谱构建服务，支持复杂场景的知识抽取',
    lastUpdated: '2026-04-17',
    apiCount: 6,
  },
];

interface PipelineApiManagementProps {
  onSelectService: (serviceId: string) => void;
}

export function PipelineApiManagement({ onSelectService }: PipelineApiManagementProps) {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">流程服务列表</h2>
          <p className="text-sm text-gray-600 mt-1">
            统一查看和管理已部署的流程服务接口
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
            <option value="图谱构建">图谱构建</option>
            <option value="领域图谱">领域图谱</option>
            <option value="图谱更新">图谱更新</option>
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
                      <span>流程名称: {service.pipeline}</span>
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
              <li>• <strong>图谱构建</strong>: 端到端的知识图谱构建流程</li>
              <li>• <strong>领域图谱</strong>: 针对特定领域优化的构建流程</li>
              <li>• <strong>图谱更新</strong>: 增量更新和图谱维护服务</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
