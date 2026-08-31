import { useState } from 'react';
import { GitBranch, Loader2, Play, Sparkles } from 'lucide-react';

const SAMPLE_TEXT =
  '清华大学张明教授研究知识图谱补全，与北京大学合作开展 GraphSAGE 嵌入与关系推理方法对比实验。';

interface RelationTriple {
  head: string;
  headKind: 'entity' | 'concept';
  relation: string;
  tail: string;
  tailKind: 'entity' | 'concept';
  score: number;
}

const MOCK_RELATIONS: RelationTriple[] = [
  { head: '张明', headKind: 'entity', relation: '就职于', tail: '清华大学', tailKind: 'entity', score: 0.94 },
  { head: '清华大学', headKind: 'entity', relation: '合作研究', tail: '北京大学', tailKind: 'entity', score: 0.89 },
  { head: '张明', headKind: 'entity', relation: '研究领域', tail: '知识图谱补全', tailKind: 'concept', score: 0.87 },
  { head: 'GraphSAGE', headKind: 'concept', relation: '应用于', tail: '知识图谱补全', tailKind: 'concept', score: 0.82 },
  { head: 'GraphSAGE', headKind: 'concept', relation: '对比方法', tail: '关系推理', tailKind: 'concept', score: 0.76 },
];

export default function RelationLocalizationPage() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [running, setRunning] = useState(false);
  const [relations, setRelations] = useState<RelationTriple[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const localize = () => {
    if (!input.trim()) return;
    setRunning(true);
    setHasRun(false);
    setTimeout(() => {
      setRelations(MOCK_RELATIONS);
      setHasRun(true);
      setRunning(false);
    }, 700);
  };

  const kindBadge = (k: 'entity' | 'concept') =>
    k === 'entity'
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : 'bg-violet-50 text-violet-700 border-violet-100';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-5 h-5 text-teal-600" />
          <h1 className="text-lg font-semibold text-gray-900">关系定位</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          接口演示：识别并定位实体与概念之间的语义关系。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 font-mono mr-1.5">POST</span> 输入 · content
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); setHasRun(false); }}
                rows={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={localize}
                disabled={running || !input.trim()}
                className="text-sm px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                调用关系定位接口
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-500" /> 输出 · relations
            </div>
            <div className="p-4">
              {!hasRun && !running && (
                <p className="text-sm text-gray-400 text-center py-12">语义关系将显示在此处</p>
              )}
              {running && (
                <p className="text-sm text-gray-400 text-center py-12 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> 定位中…
                </p>
              )}
              {hasRun && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left py-2 font-medium">主体</th>
                      <th className="text-left py-2 font-medium">关系</th>
                      <th className="text-left py-2 font-medium">客体</th>
                      <th className="text-right py-2 font-medium">置信度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {relations.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2.5">
                          <span className="font-medium text-gray-800">{r.head}</span>
                          <span className={`ml-1 text-[10px] px-1 py-0.5 rounded border ${kindBadge(r.headKind)}`}>
                            {r.headKind === 'entity' ? '实体' : '概念'}
                          </span>
                        </td>
                        <td className="py-2.5 text-teal-700">{r.relation}</td>
                        <td className="py-2.5">
                          <span className="font-medium text-gray-800">{r.tail}</span>
                          <span className={`ml-1 text-[10px] px-1 py-0.5 rounded border ${kindBadge(r.tailKind)}`}>
                            {r.tailKind === 'entity' ? '实体' : '概念'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-gray-600">{(r.score * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
