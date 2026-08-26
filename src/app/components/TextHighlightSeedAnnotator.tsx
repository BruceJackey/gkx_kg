import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Highlighter, Play, Trash2, Sprout, CheckCircle2 } from 'lucide-react';

const SAMPLE_TEXT =
  '人工智能领域的代表性公司包括谷歌、微软、OpenAI 与华为技术有限公司。谷歌旗下 DeepMind 长期从事强化学习研究；微软与 OpenAI 保持深度合作；华为在昇腾芯片与盘古大模型方向持续投入。';

interface SeedMark {
  id: string;
  text: string;
  start: number;
  end: number;
}

function buildHighlightedNodes(text: string, marks: SeedMark[]) {
  if (marks.length === 0) return [<span key="all">{text}</span>];
  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((m, i) => {
    if (m.start > cursor) {
      nodes.push(<span key={`t-${i}`}>{text.slice(cursor, m.start)}</span>);
    }
    nodes.push(
      <mark
        key={m.id}
        className="bg-emerald-200 text-emerald-900 px-0.5 rounded font-medium not-italic cursor-pointer"
        title="点击可在下方列表删除"
      >
        {text.slice(m.start, m.end)}
      </mark>,
    );
    cursor = m.end;
  });
  if (cursor < text.length) nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  return nodes;
}

export default function TextHighlightSeedAnnotator() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [marks, setMarks] = useState<SeedMark[]>([]);
  const [editing, setEditing] = useState(true);
  const [seeds, setSeeds] = useState<Array<{ id: string; name: string; concept: string; evidence: string }>>([]);
  const [running, setRunning] = useState(false);
  const [concept, setConcept] = useState('人工智能公司');
  const areaRef = useRef<HTMLDivElement>(null);

  const addMarkFromSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !areaRef.current) return;
    const selected = sel.toString().trim();
    if (!selected) return;
    const full = text;
    // Prefer index within current text
    let start = full.indexOf(selected);
    if (start < 0) {
      // try from anchor offset if possible
      start = 0;
      return;
    }
    // If multiple occurrences, prefer the one closest to selection context
    const ranges: number[] = [];
    let idx = 0;
    while ((idx = full.indexOf(selected, idx)) !== -1) {
      ranges.push(idx);
      idx += selected.length;
    }
    start = ranges[0] ?? start;
    const end = start + selected.length;
    // skip exact duplicates
    if (marks.some((m) => m.start === start && m.end === end)) {
      sel.removeAllRanges();
      return;
    }
    // skip overlaps
    if (marks.some((m) => !(end <= m.start || start >= m.end))) {
      sel.removeAllRanges();
      return;
    }
    setMarks((prev) => [...prev, { id: `m-${Date.now()}`, text: selected, start, end }]);
    setSeeds([]);
    sel.removeAllRanges();
  }, [text, marks]);

  const removeMark = (id: string) => {
    setMarks((prev) => prev.filter((m) => m.id !== id));
    setSeeds([]);
  };

  const runExtract = () => {
    setRunning(true);
    setTimeout(() => {
      const list = [...marks]
        .sort((a, b) => a.start - b.start)
        .map((m, i) => ({
          id: `seed-out-${i + 1}`,
          name: m.text,
          concept,
          evidence: text.slice(Math.max(0, m.start - 12), Math.min(text.length, m.end + 12)),
        }));
      setSeeds(list);
      setRunning(false);
    }, 700);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">文本高亮标注</h1>
          <p className="text-sm text-gray-500">
            在给定文本段落中划词高亮，直接标注出种子实例；执行后输出种子实例列表
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-6 max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">目标概念</label>
            <input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
              placeholder="如：人工智能公司"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-600">输入文本</label>
              <button
                type="button"
                onClick={() => { setEditing(true); setMarks([]); setSeeds([]); }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                重置文本/标注
              </button>
            </div>
            {editing ? (
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setMarks([]); setSeeds([]); }}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 resize-none"
                placeholder="粘贴待标注文本段落…"
              />
            ) : (
              <div
                ref={areaRef}
                onMouseUp={addMarkFromSelection}
                className="w-full border border-emerald-200 bg-emerald-50/30 rounded-lg px-3 py-2.5 text-sm text-gray-800 leading-relaxed min-h-[120px] select-text"
              >
                {buildHighlightedNodes(text, marks)}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              {editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  开始划词高亮
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  返回编辑文本
                </button>
              )}
              {!editing && (
                <span className="text-[11px] text-emerald-600">在上方文本中拖拽选中词语即可标注</span>
              )}
            </div>
          </div>

          {marks.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1.5">已高亮标注（{marks.length}）</div>
              <div className="flex flex-wrap gap-1.5">
                {marks.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {m.text}
                    <button type="button" onClick={() => removeMark(m.id)} className="text-emerald-400 hover:text-red-500">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={runExtract}
            disabled={marks.length === 0 || running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
          >
            {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? '生成中…' : '执行 · 输出种子实例'}
          </button>
        </div>

        {seeds.length > 0 && (
          <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden">
            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">输出 · 种子实例</span>
              <span className="text-[11px] text-emerald-500 ml-auto flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {seeds.length} 条
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-2 font-medium">实例</th>
                  <th className="px-4 py-2 font-medium">目标概念</th>
                  <th className="px-4 py-2 font-medium">证据片段</th>
                </tr>
              </thead>
              <tbody>
                {seeds.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{s.concept}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">…{s.evidence}…</td>
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
