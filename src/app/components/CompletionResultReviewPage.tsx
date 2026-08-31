import { useState } from 'react';
import { Check, ClipboardCheck, X } from 'lucide-react';

interface PendingTriple {
  id: string;
  head: string;
  relation: string;
  tail: string;
}

const INITIAL_TRIPLES: PendingTriple[] = [
  { id: 't1', head: 'GraphSAGE', relation: '适用于', tail: '大规模异质图谱节点分类' },
  { id: 't2', head: '清华大学', relation: '合作研究', tail: '北京大学' },
  { id: 't3', head: 'TransE', relation: '嵌入空间', tail: '实数空间 ℝᵈ' },
  { id: 't4', head: 'LiFePO₄', relation: '理论容量', tail: '170 mAh/g' },
  { id: 't5', head: 'CLIP ViT-B/32', relation: '训练损失', tail: '对称 InfoNCE' },
  { id: 't6', head: '知识图谱补全', relation: '评估指标', tail: 'MRR / Hits@10' },
];

export default function CompletionResultReviewPage() {
  const [pending, setPending] = useState(INITIAL_TRIPLES);

  const decide = (id: string, approved: boolean) => {
    setPending(prev => prev.filter(t => t.id !== id));
    void approved;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck className="w-5 h-5 text-violet-600" />
          <h1 className="text-lg font-semibold text-gray-900">补全结果审核</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
            待审核 {pending.length}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          模型补全的三元组待人工校验，请逐条确认通过或拒绝。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
            <ClipboardCheck size={36} className="text-gray-300" />
            <p className="text-sm">暂无待审核三元组</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-5xl mx-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">头实体</th>
                  <th className="text-left px-5 py-3 font-medium">关系</th>
                  <th className="text-left px-5 py-3 font-medium">尾实体</th>
                  <th className="text-right px-5 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pending.map(triple => (
                  <tr key={triple.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{triple.head}</td>
                    <td className="px-5 py-3.5 text-violet-700">{triple.relation}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{triple.tail}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => decide(triple.id, true)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          <Check size={12} /> 通过
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(triple.id, false)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                        >
                          <X size={12} /> 拒绝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
