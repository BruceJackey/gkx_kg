import { Search, Network, Activity, Sparkles, Code, ExternalLink } from 'lucide-react';
import { useState, useMemo } from 'react';
import { deployedAlgorithms, CATEGORY_LABELS, AlgorithmEntry } from '../data/algorithmRegistry';

const TYPE_LABEL: Record<AlgorithmEntry['type'], { label: string; cls: string }> = {
  'deep-learning': { label: '深度学习', cls: 'bg-blue-100 text-blue-700' },
  'llm': { label: '大模型', cls: 'bg-purple-100 text-purple-700' },
  'rule-based': { label: '规则算法', cls: 'bg-green-100 text-green-700' },
};

interface AlgorithmApiManagementProps {
  onSelectService: (serviceId: string) => void;
}

export function AlgorithmApiManagement({ onSelectService }: AlgorithmApiManagementProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');

  const filtered = useMemo(() => {
    return deployedAlgorithms.filter((algo) => {
      const matchSearch =
        !search ||
        algo.name.toLowerCase().includes(search.toLowerCase()) ||
        algo.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || algo.categoryId === filterCategory;
      const matchType = !filterType || algo.type === filterType;
      return matchSearch && matchCategory && matchType;
    });
  }, [search, filterCategory, filterType]);

  const categoryOptions = Object.entries(CATEGORY_LABELS) as [string, string][];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">算法服务列表</h2>
          <p className="text-sm text-gray-600 mt-1">
            统一查看和管理已部署的算法服务接口，共 {deployedAlgorithms.length} 个服务运行中
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
          <Activity className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索服务名称或描述..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">全部类型</option>
            {categoryOptions.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">全部算法类型</option>
            <option value="deep-learning">深度学习</option>
            <option value="llm">大模型</option>
            <option value="rule-based">规则算法</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">暂无匹配的服务</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((algo) => {
              const typeTag = TYPE_LABEL[algo.type];
              const categoryLabel = CATEGORY_LABELS[algo.categoryId as keyof typeof CATEGORY_LABELS] ?? algo.categoryId;
              return (
                <div
                  key={algo.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onSelectService(algo.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Network className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <h3 className="text-base font-semibold text-gray-900">{algo.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${typeTag.cls}`}>
                          {typeTag.label}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {categoryLabel}
                        </span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          运行中
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{algo.description}</p>
                      <div className="flex items-center gap-5 text-sm flex-wrap">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{algo.name} {algo.version}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Code className="w-3.5 h-3.5" />
                          <span>性能: {algo.performance}</span>
                        </div>
                        <span className="text-gray-400">更新: {algo.lastUpdated}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectService(algo.id);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm ml-4 flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      查看详情
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs mt-0.5 flex-shrink-0">
            i
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-indigo-900 mb-1">服务说明</h4>
            <p className="text-sm text-indigo-800">
              算法服务由算法列表中状态为「已部署」的算法自动生成。在算法详情页完成部署后，对应服务将实时出现在此列表中。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
