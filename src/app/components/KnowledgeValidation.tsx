

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ValidationItem {
  id: string;
  entityName: string;
  entityType: '人物' | '组织' | '技术' | '概念';
  issue: string;
  severity: '严重' | '警告' | '提示';
  status: '异常' | '警告' | '正常';
}

const mockData: ValidationItem[] = [
  { id: '1', entityName: '阿尔伯特·爱因斯坦', entityType: '人物', issue: '缺少必填属性: birth_date', severity: '严重', status: '异常' },
  { id: '2', entityName: '麻省理工学院', entityType: '组织', issue: '存在孤立节点，无关联实体', severity: '严重', status: '异常' },
  { id: '3', entityName: '量子纠缠', entityType: '概念', issue: '关系目标实体不存在: "薛定谔的猫"', severity: '严重', status: '异常' },
  { id: '4', entityName: '深度学习', entityType: '技术', issue: '属性值超出合理范围: published_year=2099', severity: '严重', status: '异常' },
  { id: '5', entityName: '图灵机', entityType: '概念', issue: '存在循环依赖关系', severity: '严重', status: '异常' },
  { id: '6', entityName: '斯坦福大学', entityType: '组织', issue: '重复关联关系: "合作机构" × 3', severity: '严重', status: '异常' },
  { id: '7', entityName: '卷积神经网络', entityType: '技术', issue: '缺少关键属性: inventor', severity: '严重', status: '异常' },
  { id: '8', entityName: '图灵', entityType: '人物', issue: '别名字段存在冗余数据', severity: '警告', status: '警告' },
  { id: '9', entityName: '自然语言处理', entityType: '技术', issue: '关系权重缺失，默认值已填充', severity: '警告', status: '警告' },
  { id: '10', entityName: '知识图谱', entityType: '概念', issue: '描述字段超出最大长度限制', severity: '警告', status: '警告' },
  { id: '11', entityName: 'OpenAI', entityType: '组织', issue: '成立日期格式不规范: "2015年"', severity: '警告', status: '警告' },
  { id: '12', entityName: '注意力机制', entityType: '技术', issue: '引用文献链接已失效', severity: '警告', status: '警告' },
  { id: '13', entityName: '贝叶斯网络', entityType: '概念', issue: '节点类型标注不一致', severity: '警告', status: '警告' },
  { id: '14', entityName: '特斯拉公司', entityType: '组织', issue: '关联实体名称存在歧义', severity: '警告', status: '警告' },
  { id: '15', entityName: '强化学习', entityType: '技术', issue: '同义词列表与主词条冲突', severity: '警告', status: '警告' },
  { id: '16', entityName: '谷歌', entityType: '组织', issue: '国家/地区字段建议补充', severity: '警告', status: '警告' },
  { id: '17', entityName: '机器学习', entityType: '技术', issue: '概述字段建议添加来源', severity: '警告', status: '警告' },
  { id: '18', entityName: '牛顿', entityType: '人物', issue: '实体结构完整，校验通过', severity: '提示', status: '正常' },
  { id: '19', entityName: '哈佛大学', entityType: '组织', issue: '实体结构完整，校验通过', severity: '提示', status: '正常' },
  { id: '20', entityName: '神经网络', entityType: '技术', issue: '实体结构完整，校验通过', severity: '提示', status: '正常' },
  { id: '21', entityName: '信息熵', entityType: '概念', issue: '实体结构完整，校验通过', severity: '提示', status: '正常' },
  { id: '22', entityName: '达尔文', entityType: '人物', issue: '实体结构完整，校验通过', severity: '提示', status: '正常' },
  { id: '23', entityName: '迁移学习', entityType: '技术', issue: '实体结构完整，校验通过', severity: '提示', status: '正常' },
  { id: '24', entityName: '图神经网络', entityType: '技术', issue: '新增实体待关联核查', severity: '提示', status: '正常' },
];

const pieData = [
  { name: '正常', value: 6 },
  { name: '警告', value: 11 },
  { name: '异常', value: 7 },
];
const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444'];

const areaData = [
  { date: '6/16', 异常: 18, 正常: 45 },
  { date: '6/17', 异常: 15, 正常: 48 },
  { date: '6/18', 异常: 13, 正常: 52 },
  { date: '6/19', 异常: 11, 正常: 55 },
  { date: '6/20', 异常: 9, 正常: 58 },
  { date: '6/21', 异常: 8, 正常: 60 },
  { date: '6/22', 异常: 7, 正常: 62 },
];

const TABS = ['全部', '异常', '警告', '正常'] as const;
type Tab = typeof TABS[number];

const TAB_COUNTS: Record<Tab, number> = { 全部: 24, 异常: 7, 警告: 11, 正常: 6 };

const statusIcon = (status: ValidationItem['status']) => {
  if (status === '异常') return <span className="text-red-500 font-bold text-base">✕</span>;
  if (status === '警告') return <span className="text-yellow-500 font-bold text-base">⚠</span>;
  return <span className="text-green-500 font-bold text-base">✓</span>;
};

const severityBadge = (severity: ValidationItem['severity']) => {
  const cls =
    severity === '严重'
      ? 'bg-red-100 text-red-700'
      : severity === '警告'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-blue-100 text-blue-700';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{severity}</span>;
};

const entityTypeBadge = (type: ValidationItem['entityType']) => (
  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200">{type}</span>
);

const CustomPieLabel = ({ cx, cy, total }: { cx: number; cy: number; total: number }) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} dy="-6" fontSize={22} fontWeight={700} fill="#111827">{total}</tspan>
    <tspan x={cx} dy={20} fontSize={12} fill="#6b7280">总计</tspan>
  </text>
);

export default function KnowledgeValidation() {
  const [activeTab, setActiveTab] = useState<Tab>('全部');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchVal, setSearchVal] = useState('');
  const [validateType, setValidateType] = useState('全量校验');
  const [entityType, setEntityType] = useState('全部');
  const [isValidating, setIsValidating] = useState(false);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [kwEntity1, setKwEntity1] = useState('');
  const [kwEntity2, setKwEntity2] = useState('');
  const [kwRelation, setKwRelation] = useState('关联');

  const filteredData = mockData.filter((item) => {
    const tabMatch =
      activeTab === '全部' ? true : item.status === activeTab;
    const searchMatch =
      searchVal === '' || item.entityName.includes(searchVal) || item.id.includes(searchVal);
    const typeMatch = entityType === '全部' || item.entityType === entityType;
    return tabMatch && searchMatch && typeMatch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((d) => d.id)));
    }
  };

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => setIsValidating(false), 1000);
  };

  const stats = [
    { label: '已校验实体数', value: '1,284', color: 'text-blue-600' },
    { label: '异常节点', value: '7', color: 'text-red-500' },
    { label: '待处理关系', value: '23', color: 'text-yellow-500' },
    { label: '校验通过率', value: '95.2%', color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">知识校验</h1>
        <p className="text-sm text-gray-500 mt-1">
          检验知识图谱结构的逻辑性与一致性，识别异常节点，维护关系网络准确性
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">检索范围</label>
            <input
              className="border border-gray-200 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400"
              placeholder="输入实体名称或ID…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">校验类型</label>
            <select
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              value={validateType}
              onChange={(e) => setValidateType(e.target.value)}
            >
              {['全量校验', '结构校验', '属性校验', '关系校验'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">实体类型</label>
            <select
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              {['全部', '人物', '组织', '技术', '概念'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#2563eb] text-white text-sm rounded hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isValidating && <Loader2 size={14} className="animate-spin" />}
            开始校验
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={() => setShowAddKeyword((v) => !v)}
            className="px-3 py-1.5 border border-gray-200 text-sm rounded hover:bg-gray-50 transition-colors"
          >
            添加关键词关系
          </button>
          <button
            disabled={selectedIds.size === 0}
            className="px-3 py-1.5 border border-red-200 text-red-500 text-sm rounded hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            删除选中关键词
          </button>
        </div>

        {/* Inline add keyword form */}
        {showAddKeyword && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
            <input
              className="border border-gray-200 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:border-blue-400"
              placeholder="实体 A"
              value={kwEntity1}
              onChange={(e) => setKwEntity1(e.target.value)}
            />
            <select
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              value={kwRelation}
              onChange={(e) => setKwRelation(e.target.value)}
            >
              {['关联', '包含', '属于', '引用', '对立'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <input
              className="border border-gray-200 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:border-blue-400"
              placeholder="实体 B"
              value={kwEntity2}
              onChange={(e) => setKwEntity2(e.target.value)}
            />
            <button
              onClick={() => setShowAddKeyword(false)}
              className="px-3 py-1.5 bg-[#2563eb] text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              确认
            </button>
            <button
              onClick={() => setShowAddKeyword(false)}
              className="px-3 py-1.5 border border-gray-200 text-sm rounded hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* Main two-panel */}
      <div className="flex gap-4">
        {/* Left panel */}
        <div className="w-[400px] shrink-0 bg-white border border-gray-200 rounded-lg flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-[#2563eb] text-[#2563eb]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                <span className="ml-1 text-xs text-gray-400">({TAB_COUNTS[tab]})</span>
              </button>
            ))}
          </div>

          {/* Bulk select header */}
          <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-gray-50">
            <input
              type="checkbox"
              className="mr-2"
              checked={selectedIds.size > 0 && selectedIds.size === filteredData.length}
              onChange={toggleAll}
            />
            <span className="text-xs text-gray-500">全选 ({filteredData.length})</span>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
              <span className="text-xs text-blue-600">已选 {selectedIds.size} 项</span>
              <button className="px-2 py-0.5 bg-[#2563eb] text-white text-xs rounded hover:bg-blue-700">批量修复</button>
              <button className="px-2 py-0.5 border border-gray-300 text-gray-600 text-xs rounded hover:bg-white">批量忽略</button>
              <button className="px-2 py-0.5 border border-red-200 text-red-500 text-xs rounded hover:bg-red-50">删除关系</button>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
                <div className="mt-0.5 shrink-0">{statusIcon(item.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{item.entityName}</span>
                    {entityTypeBadge(item.entityType)}
                  </div>
                  <div className="text-xs text-gray-500 mb-1.5 leading-relaxed">{item.issue}</div>
                  <div className="flex items-center justify-between">
                    {severityBadge(item.severity)}
                    <button className="text-xs text-[#2563eb] hover:underline">修复</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Pie chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">校验状态分布</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${entry.name}-${i}`} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-6" fontSize={22} fontWeight={700} fill="#111827">24</tspan>
                  <tspan x="50%" dy={20} fontSize={12} fill="#6b7280">总计</tspan>
                </text>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Area chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">校验时序记录</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="正常" stroke="#22c55e" fill="url(#colorNormal)" strokeWidth={2} stackId="1" />
                <Area type="monotone" dataKey="异常" stroke="#ef4444" fill="url(#colorAnomaly)" strokeWidth={2} stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom actions */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-[#2563eb] text-white text-sm rounded hover:bg-blue-700 transition-colors">
              导出校验报告 PDF
            </button>
            <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
              导出异常列表 CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
