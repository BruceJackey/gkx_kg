import { useState, type ReactNode } from 'react';
import { BookOpen, Loader2, Play, Sparkles } from 'lucide-react';

const SAMPLE_TEXT =
  '本研究提出一种基于元学习的少样本知识图谱补全框架，通过对抗迁移学习提升跨领域泛化能力，并在链接预测与关系推理任务上验证了方法的有效性。';

const CONCEPT_RULES: { pattern: RegExp; label: string; color: string }[] = [
  { pattern: /元学习/g, label: '元学习', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  { pattern: /少样本/g, label: '少样本学习', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  { pattern: /知识图谱补全/g, label: '知识图谱补全', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { pattern: /对抗迁移学习/g, label: '对抗迁移学习', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { pattern: /跨领域泛化/g, label: '领域泛化', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { pattern: /链接预测/g, label: '链接预测', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { pattern: /关系推理/g, label: '关系推理', color: 'bg-amber-100 text-amber-800 border-amber-200' },
];

interface DetectedConcept {
  text: string;
  label: string;
  start: number;
  end: number;
  color: string;
  score: number;
}

function runConceptExtraction(text: string): DetectedConcept[] {
  const found: DetectedConcept[] = [];
  for (const rule of CONCEPT_RULES) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      found.push({
        text: m[0],
        label: rule.label,
        start: m.index,
        end: m.index + m[0].length,
        color: rule.color,
        score: 0.82 + (m.index % 5) * 0.03,
      });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

function highlightConcepts(text: string, concepts: DetectedConcept[]) {
  if (!concepts.length) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  concepts.forEach((c, i) => {
    if (c.start > cursor) parts.push(text.slice(cursor, c.start));
    parts.push(
      <mark key={i} className={`px-0.5 rounded border ${c.color}`}>{c.text}</mark>,
    );
    cursor = c.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export default function TextConceptLocalizationPage() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [running, setRunning] = useState(false);
  const [concepts, setConcepts] = useState<DetectedConcept[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const extract = () => {
    if (!input.trim()) return;
    setRunning(true);
    setHasRun(false);
    setTimeout(() => {
      setConcepts(runConceptExtraction(input));
      setHasRun(true);
      setRunning(false);
    }, 650);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg font-semibold text-gray-900">文本概念定位</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          接口演示：输入文本，识别并输出抽象概念（非具体命名实体）。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 font-mono">POST</span> 输入 · text
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); setHasRun(false); }}
                rows={8}
                className="w-full flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 resize-none leading-relaxed"
                placeholder="输入待分析文本…"
              />
              <button
                type="button"
                onClick={extract}
                disabled={running || !input.trim()}
                className="self-start text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                调用概念定位接口
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-500" /> 输出 · concepts
            </div>
            <div className="p-4 flex-1 space-y-4">
              {!hasRun && !running && (
                <p className="text-sm text-gray-400 text-center py-12">概念识别结果将显示在此处</p>
              )}
              {running && (
                <p className="text-sm text-gray-400 text-center py-12 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> 识别中…
                </p>
              )}
              {hasRun && (
                <>
                  <div className="text-sm text-gray-700 leading-relaxed border border-gray-100 rounded-lg px-3 py-2.5 bg-gray-50/50">
                    {highlightConcepts(input, concepts)}
                  </div>
                  {concepts.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="text-left py-2 font-medium">概念</th>
                          <th className="text-left py-2 font-medium">归一化标签</th>
                          <th className="text-left py-2 font-medium">置信度</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {concepts.map((c, i) => (
                          <tr key={i}>
                            <td className="py-2 font-medium text-gray-800">{c.text}</td>
                            <td className="py-2">
                              <span className={`px-1.5 py-0.5 rounded border ${c.color}`}>{c.label}</span>
                            </td>
                            <td className="py-2 text-gray-600 tabular-nums">{(c.score * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-400">未识别到抽象概念</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
