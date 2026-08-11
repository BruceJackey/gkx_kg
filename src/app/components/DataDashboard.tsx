import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const mockData = {
  overview: {
    totalSources: 3,
    totalRecords: 15600000,
    lastUpdated: '2026-04-19 10:30:00',
  },
  distribution: [
    { name: '文献', value: 8500000, percentage: 54.5 },
    { name: '专利', value: 4200000, percentage: 26.9 },
    { name: '科研数据库', value: 2900000, percentage: 18.6 },
  ],
};

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4'];

export function DataDashboard() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">数据看板</h2>
          <p className="text-sm text-gray-600 mt-1">
            展示平台当前数据来源及规模，涵盖文献、专利与科研数据库三类数据。
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">数据来源总数</div>
          <div className="text-3xl font-semibold text-gray-900">{mockData.overview.totalSources}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">数据总条数</div>
          <div className="text-3xl font-semibold text-gray-900">
            {(mockData.overview.totalRecords / 10000).toFixed(0)} 万条
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-2">最近更新时间</div>
          <div className="text-lg font-semibold text-gray-900">{mockData.overview.lastUpdated}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">数据来源分布</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockData.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                id="distribution-pie"
              >
                {mockData.distribution.map((entry, index) => (
                  <Cell key={`distribution-cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip key="pie-tooltip" formatter={(value: number) => `${(value / 10000).toFixed(0)} 万条`} />
              <Legend key="pie-legend" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
