import { useState } from 'react';
import { Play } from 'lucide-react';

type PredPair = { hyponym: string; hypernym: string; confidence: number };

const SAMPLE =
  '卷积神经网络, Transformer, BERT, 深度学习, 机器学习, 计算机视觉, 目标检测, 自然语言处理';

function hashConfidence(a: string, b: string): number {
  let h = 0;
  const s = `${a}|${b}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 0.52 + (h % 47) / 100;
}

function predictPairs(concepts: string[]): PredPair[] {
  const pairs: PredPair[] = [];
  for (let i = 0; i < concepts.length; i++) {
    for (let j = 0; j < concepts.length; j++) {
      if (i === j) continue;
      pairs.push({
        hyponym: concepts[i],
        hypernym: concepts[j],
        confidence: hashConfidence(concepts[i], concepts[j]),
      });
    }
  }
  return pairs.sort((a, b) => b.confidence - a.confidence);
}

function parseConcepts(text: string): string[] {
  return text
    .split(/[,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 审计目录专用：上下位关系批量预测简易接口
 */
export default function HypernymGenerationAudit() {
  const [wordList, setWordList] = useState(SAMPLE);
  const [threshold, setThreshold] = useState('0.75');
  const [kept, setKept] = useState<PredPair[]>([]);
  const [filtered, setFiltered] = useState<PredPair[]>([]);
  const [ran, setRan] = useState(false);

  const runPredict = () => {
    const concepts = parseConcepts(wordList);
    const th = Math.min(1, Math.max(0, parseFloat(threshold) || 0));
    const all = predictPairs(concepts);
    setKept(all.filter((p) => p.confidence >= th));
    setFiltered(all.filter((p) => p.confidence < th));
    setRan(true);
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">上下位关系生成</h1>
          <p className="text-sm text-gray-500">上传概念词表，设定置信度阈值，批量预测上下位关系</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-3xl">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">概念词表（逗号分隔）</label>
          <textarea
            value={wordList}
            onChange={(e) => setWordList(e.target.value)}
            rows={4}
            placeholder="卷积神经网络, Transformer, BERT, 深度学习…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
          />
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">置信度阈值（0–1）</label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <button
            type="button"
            onClick={runPredict}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            <Play className="w-3.5 h-3.5" />
            启动批量预测
          </button>
        </div>

        {ran && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <ResultBlock title={`保留结果（≥ ${threshold}）`} count={kept.length} pairs={kept} tone="keep" />
            <ResultBlock title={`被过滤结果（< ${threshold}）`} count={filtered.length} pairs={filtered} tone="drop" />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultBlock({
  title,
  count,
  pairs,
  tone,
}: {
  title: string;
  count: number;
  pairs: PredPair[];
  tone: 'keep' | 'drop';
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-2">
        {title} · {count} 条
      </div>
      {pairs.length === 0 ? (
        <p className="text-sm text-gray-400">无</p>
      ) : (
        <ul className={`divide-y border rounded-lg overflow-hidden ${tone === 'keep' ? 'border-green-200' : 'border-gray-200'}`}>
          {pairs.map((p) => (
            <li
              key={`${p.hyponym}-${p.hypernym}`}
              className={`px-4 py-2 text-sm flex items-center gap-2 ${tone === 'keep' ? 'bg-green-50/50' : 'bg-gray-50'}`}
            >
              <span className="font-medium text-gray-800">{p.hyponym}</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-indigo-700">{p.hypernym}</span>
              <span className="ml-auto text-xs text-gray-500">{p.confidence.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
