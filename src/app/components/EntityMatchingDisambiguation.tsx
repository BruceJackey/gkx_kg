import { useState } from 'react';
import { Check, X, List, Gavel, CheckSquare } from 'lucide-react';

type Tab = 'adjudicate' | 'candidates';
type ItemStatus = 'pending' | 'resolved' | 'rejected';

interface CandidateEntity {
  id: string;
  name: string;
  type: string;
  kb: string;
  confidence: number;
  description: string;
}

interface AmbiguousItem {
  id: string;
  mention: string;
  sourceCol: string;
  context: string;
  candidates: CandidateEntity[];
  status: ItemStatus;
  selectedId?: string;
}

const INITIAL_ITEMS: AmbiguousItem[] = [
  {
    id: 'AMB-001',
    mention: '李华',
    sourceCol: 'authors.name',
    context: '李华在清华大学计算机系发表了关于知识图谱的论文…',
    status: 'pending',
    candidates: [
      { id: 'E1', name: '李华（清华大学）', type: '人物', kb: '中文人物库', confidence: 0.84, description: '清华大学计算机系副教授' },
      { id: 'E2', name: '李华（北京大学）', type: '人物', kb: '中文人物库', confidence: 0.72, description: '北京大学信息科学技术学院研究员' },
      { id: 'E3', name: 'Hua Li', type: '人物', kb: '英文人物库', confidence: 0.61, description: 'Researcher at University of Toronto' },
    ],
  },
  {
    id: 'AMB-002',
    mention: 'Apple',
    sourceCol: 'org.name',
    context: 'Apple announced a new AI chip for on-device inference…',
    status: 'pending',
    candidates: [
      { id: 'E4', name: 'Apple Inc.', type: '机构', kb: '英文机构库', confidence: 0.91, description: 'Technology company, Cupertino' },
      { id: 'E5', name: '苹果公司', type: '机构', kb: '中文机构库', confidence: 0.88, description: '美国科技公司，中文常用名' },
      { id: 'E6', name: 'apple（水果）', type: '概念', kb: '通用概念库', confidence: 0.35, description: '蔷薇科苹果属植物果实' },
    ],
  },
  {
    id: 'AMB-003',
    mention: 'CNN',
    sourceCol: 'concepts.abbr',
    context: '…采用 CNN 提取图像特征后接入知识图谱推理模块…',
    status: 'pending',
    candidates: [
      { id: 'E7', name: '卷积神经网络', type: '概念', kb: '中文概念库', confidence: 0.86, description: 'Convolutional Neural Network' },
      { id: 'E8', name: 'CNN（媒体）', type: '机构', kb: '英文机构库', confidence: 0.42, description: 'Cable News Network' },
      { id: 'E9', name: 'CNN.com', type: '资源', kb: '英文资源库', confidence: 0.28, description: '新闻网站域名' },
    ],
  },
  {
    id: 'AMB-004',
    mention: '多伦多大学',
    sourceCol: 'affiliations.org',
    context: '…作者 Geoffrey Hinton 就职于多伦多大学计算机系…',
    status: 'pending',
    candidates: [
      { id: 'E10', name: 'University of Toronto', type: '机构', kb: '英文机构库', confidence: 0.93, description: 'Public research university in Toronto' },
      { id: 'E11', name: '多伦多大学', type: '机构', kb: '中文机构库', confidence: 0.9, description: '加拿大公立研究型大学' },
      { id: 'E12', name: 'Toronto Metropolitan University', type: '机构', kb: '英文机构库', confidence: 0.31, description: '前称 Ryerson University' },
    ],
  },
];

export type EntityMatchingDisambiguationFocus = 'adjudicate' | 'candidates';

export default function EntityMatchingDisambiguation({
  initialFocus,
}: {
  initialFocus?: EntityMatchingDisambiguationFocus | null;
}) {
  const [tab, setTab] = useState<Tab>(initialFocus ?? 'adjudicate');
  const [items, setItems] = useState<AmbiguousItem[]>(INITIAL_ITEMS);
  const [draftPick, setDraftPick] = useState<Record<string, string>>({});

  const confirmPick = (itemId: string) => {
    const selectedId = draftPick[itemId];
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, status: 'resolved' as ItemStatus, selectedId } : it,
      ),
    );
  };

  const rejectItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, status: 'rejected' as ItemStatus, selectedId: undefined } : it,
      ),
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-5 pb-3 bg-gray-900">
        <h1 className="text-2xl text-white mb-1">实体匹配消歧</h1>
        <p className="text-sm text-gray-400">
          对存在歧义的数据项列出候选实体，并由人工裁决选择最正确的一个
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-gray-50 flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 pt-3 flex gap-1">
          <button
            type="button"
            onClick={() => setTab('adjudicate')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'adjudicate' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Gavel className="w-4 h-4" />
            人工裁决界面
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
              tab === 'adjudicate' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {items.filter((i) => i.status === 'pending').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('candidates')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'candidates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            候选实体列表
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
              tab === 'candidates' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {items.reduce((s, i) => s + i.candidates.length, 0)}
            </span>
          </button>
        </div>

        {tab === 'adjudicate' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              歧义条目审核 · 从候选实体中选择最正确的一个后确认裁决
            </div>
            {items.map((item) => {
              const pick = draftPick[item.id] ?? item.selectedId ?? '';
              const chosen = item.candidates.find((c) => c.id === item.selectedId);
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{item.mention}</span>
                    <span className="text-[11px] font-mono text-gray-400">{item.id}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.sourceCol}</span>
                    {item.status === 'pending' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">待裁决</span>
                    )}
                    {item.status === 'resolved' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                        已裁决 → {chosen?.name}
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">已拒绝</span>
                    )}
                  </div>
                  <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                    上下文：{item.context}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {item.candidates.map((c) => {
                      const selected = pick === c.id;
                      return (
                        <label
                          key={c.id}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            selected ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                          } ${item.status !== 'pending' ? 'opacity-70 cursor-default' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`pick-${item.id}`}
                            className="mt-1 accent-blue-600"
                            checked={selected}
                            disabled={item.status !== 'pending'}
                            onChange={() => setDraftPick((prev) => ({ ...prev, [item.id]: c.id }))}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{c.name}</span>
                              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{c.type}</span>
                              <span className="text-[11px] text-gray-400">{c.kb}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${c.confidence >= 0.7 ? 'bg-green-400' : c.confidence >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${c.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 tabular-nums w-8">{(c.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {item.status === 'pending' && (
                    <div className="px-4 py-3 border-t border-gray-100 flex gap-2 justify-end bg-white">
                      <button
                        type="button"
                        onClick={() => rejectItem(item.id)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-3.5 h-3.5" /> 拒绝全部
                      </button>
                      <button
                        type="button"
                        disabled={!pick}
                        onClick={() => confirmPick(item.id)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> 确认裁决
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'candidates' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
              <List className="w-3.5 h-3.5" />
              为存在歧义的数据项列出所有可能的候选实体
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">歧义数据项</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">来源列</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">候选实体</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">类型</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">知识库</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">置信度</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.flatMap((item) =>
                    item.candidates.map((c, idx) => (
                      <tr key={`${item.id}-${c.id}`} className={item.selectedId === c.id ? 'bg-green-50/50' : ''}>
                        {idx === 0 ? (
                          <td className="px-4 py-3 align-top" rowSpan={item.candidates.length}>
                            <div className="font-medium text-gray-800">{item.mention}</div>
                            <div className="text-[11px] font-mono text-gray-400 mt-0.5">{item.id}</div>
                            <div className="text-[11px] text-gray-400 mt-1 line-clamp-2 max-w-[160px]" title={item.context}>
                              {item.context}
                            </div>
                          </td>
                        ) : null}
                        {idx === 0 ? (
                          <td className="px-4 py-3 align-top text-xs font-mono text-gray-500" rowSpan={item.candidates.length}>
                            {item.sourceCol}
                          </td>
                        ) : null}
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-800">{c.name}</span>
                          {item.selectedId === c.id && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">已选</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{c.type}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.kb}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${c.confidence >= 0.7 ? 'bg-green-400' : c.confidence >= 0.5 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${c.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{(c.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">{c.description}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
