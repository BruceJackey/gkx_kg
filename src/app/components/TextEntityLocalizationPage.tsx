import { useState, type ReactNode } from 'react';
import { FileText, Loader2, Play, Sparkles } from 'lucide-react';

const SAMPLE_TEXT =
  '清华大学张明教授在 ACL 2024 上发表了关于知识图谱与 GraphSAGE 嵌入的研究成果，合作单位包括北京大学与中科院计算所。';

const ENTITY_RULES: { pattern: RegExp; type: string; color: string }[] = [
  { pattern: /清华大学/g, type: 'ORG', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { pattern: /北京大学/g, type: 'ORG', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { pattern: /中科院计算所/g, type: 'ORG', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { pattern: /张明/g, type: 'PER', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { pattern: /ACL 2024/g, type: 'EVENT', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { pattern: /知识图谱/g, type: 'CONCEPT', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  { pattern: /GraphSAGE/g, type: 'CONCEPT', color: 'bg-violet-100 text-violet-800 border-violet-200' },
];

interface DetectedEntity {
  text: string;
  type: string;
  start: number;
  end: number;
  color: string;
}

function runNer(text: string): DetectedEntity[] {
  const found: DetectedEntity[] = [];
  for (const rule of ENTITY_RULES) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      found.push({
        text: m[0],
        type: rule.type,
        start: m.index,
        end: m.index + m[0].length,
        color: rule.color,
      });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

function highlightText(text: string, entities: DetectedEntity[]) {
  if (!entities.length) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  entities.forEach((e, i) => {
    if (e.start > cursor) parts.push(text.slice(cursor, e.start));
    parts.push(
      <mark key={i} className={`px-0.5 rounded border ${e.color}`}>{e.text}</mark>,
    );
    cursor = e.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export default function TextEntityLocalizationPage() {
  const [input, setInput] = useState(SAMPLE_TEXT);
  const [running, setRunning] = useState(false);
  const [entities, setEntities] = useState<DetectedEntity[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const recognize = () => {
    if (!input.trim()) return;
    setRunning(true);
    setHasRun(false);
    setTimeout(() => {
      setEntities(runNer(input));
      setHasRun(true);
      setRunning(false);
    }, 650);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">文本实体定位</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          接口演示：输入文本，输出命名实体识别结果（实体 span 与类型）。
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
                className="w-full flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 resize-none font-mono leading-relaxed"
                placeholder="输入待识别文本…"
              />
              <button
                type="button"
                onClick={recognize}
                disabled={running || !input.trim()}
                className="self-start text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                调用识别接口
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-600 flex items-center gap-1.5">
              <Sparkles size={13} className="text-violet-500" /> 输出 · entities
            </div>
            <div className="p-4 flex-1 space-y-4">
              {!hasRun && !running && (
                <p className="text-sm text-gray-400 text-center py-12">识别结果将显示在此处</p>
              )}
              {running && (
                <p className="text-sm text-gray-400 text-center py-12 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> 识别中…
                </p>
              )}
              {hasRun && (
                <>
                  <div className="text-sm text-gray-700 leading-relaxed border border-gray-100 rounded-lg px-3 py-2.5 bg-gray-50/50">
                    {highlightText(input, entities)}
                  </div>
                  {entities.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="text-left py-2 font-medium">实体</th>
                          <th className="text-left py-2 font-medium">类型</th>
                          <th className="text-left py-2 font-medium">位置</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {entities.map((e, i) => (
                          <tr key={i}>
                            <td className="py-2 font-medium text-gray-800">{e.text}</td>
                            <td className="py-2">
                              <span className={`px-1.5 py-0.5 rounded border ${e.color}`}>{e.type}</span>
                            </td>
                            <td className="py-2 text-gray-500 font-mono tabular-nums">{e.start}–{e.end}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-400">未识别到实体</p>
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
