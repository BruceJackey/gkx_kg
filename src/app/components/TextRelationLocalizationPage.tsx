import { useState, type ReactNode } from 'react';
import { FileText, Loader2, Play, Sparkles } from 'lucide-react';

const SAMPLE_TEXT =
  'LiFePO₄ 正极材料在 3.4V 平台下可逆容量达 170 mAh/g，经 GraphSAGE 嵌入后可与电解液体系进行链接预测。';

interface TextRelation {
  head: string;
  relation: string;
  tail: string;
  headStart: number;
  headEnd: number;
  tailStart: number;
  tailEnd: number;
  score: number;
}

const MOCK_TEXT_RELATIONS: TextRelation[] = [
  { head: 'LiFePO₄', relation: '理论容量', tail: '170 mAh/g', headStart: 0, headEnd: 7, tailStart: 28, tailEnd: 38, score: 0.92 },
  { head: 'LiFePO₄', relation: '工作电压', tail: '3.4V', headStart: 0, headEnd: 7, tailStart: 12, tailEnd: 16, score: 0.88 },
  { head: 'GraphSAGE', relation: '用于', tail: '链接预测', headStart: 40, headEnd: 49, tailStart: 58, tailEnd: 62, score: 0.85 },
];

function highlightRelations(text: string, relations: TextRelation[]) {
  const spans: { start: number; end: number; role: 'head' | 'tail' }[] = [];
  relations.forEach(r => {
    spans.push({ start: r.headStart, end: r.headEnd, role: 'head' });
    spans.push({ start: r.tailStart, end: r.tailEnd, role: 'tail' });
  });
  const merged = spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const parts: ReactNode[] = [];
  let cursor = 0;
  merged.forEach((s, i) => {
    if (s.start > cursor) parts.push(text.slice(cursor, s.start));
    const cls = s.role === 'head' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' : 'bg-amber-100 text-amber-900 border-amber-200';
    parts.push(<mark key={i} className={`px-0.5 rounded border ${cls}`}>{text.slice(s.start, s.end)}</mark>);
    cursor = Math.max(cursor, s.end);
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export default function TextRelationLocalizationPage() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [running, setRunning] = useState(false);
  const [relations, setRelations] = useState<TextRelation[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const extract = () => {
    if (!input.trim()) return;
    setRunning(true);
    setHasRun(false);
    setTimeout(() => {
      setRelations(MOCK_TEXT_RELATIONS);
      setHasRun(true);
      setRunning(false);
    }, 650);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-cyan-600" />
          <h1 className="text-lg font-semibold text-gray-900">文本关系定位</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          接口演示：输入文本，输出关系抽取三元组（主体 · 关系 · 客体）。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 font-mono mr-1.5">POST</span> 输入 · text
            </div>
            <div className="p-4 space-y-3">
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); setHasRun(false); }}
                rows={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={extract}
                disabled={running || !input.trim()}
                className="text-sm px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                调用关系抽取接口
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-500" /> 输出 · triples
            </div>
            <div className="p-4 space-y-4">
              {!hasRun && !running && (
                <p className="text-sm text-gray-400 text-center py-12">关系三元组将显示在此处</p>
              )}
              {running && (
                <p className="text-sm text-gray-400 text-center py-12 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> 抽取中…
                </p>
              )}
              {hasRun && (
                <>
                  <div className="text-sm text-gray-700 leading-relaxed border border-gray-100 rounded-lg px-3 py-2.5 bg-gray-50/50">
                    {highlightRelations(input, relations)}
                    <div className="mt-2 flex gap-3 text-[10px] text-gray-400">
                      <span><mark className="bg-emerald-100 px-1 rounded border border-emerald-200">主体</mark></span>
                      <span><mark className="bg-amber-100 px-1 rounded border border-amber-200">客体</mark></span>
                    </div>
                  </div>
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
                          <td className="py-2 font-medium text-gray-800">{r.head}</td>
                          <td className="py-2 text-cyan-700">{r.relation}</td>
                          <td className="py-2 font-medium text-gray-800">{r.tail}</td>
                          <td className="py-2 text-right tabular-nums text-gray-600">{(r.score * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
