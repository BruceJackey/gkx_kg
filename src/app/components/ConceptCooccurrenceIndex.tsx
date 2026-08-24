import { useState } from 'react';
import { Search, Link2 } from 'lucide-react';

/** 演示用概念词典（命中后两两组成共现对） */
const CONCEPT_LEXICON = [
  '人工智能', '机器学习', '深度学习', '神经网络', '知识图谱',
  '自然语言处理', '大模型', '北京大学', '清华大学', '国家重点实验室',
  '新能源汽车', '电池', '芯片', '苹果公司', '华为',
  '图神经网络', '依存句法', '实体抽取', '关系抽取', '本体论',
];

type ConceptPair = { left: string; right: string; span: string };

function extractPairs(sentence: string): { concepts: string[]; pairs: ConceptPair[] } {
  const found = CONCEPT_LEXICON
    .filter((c) => sentence.includes(c))
    .sort((a, b) => sentence.indexOf(a) - sentence.indexOf(b) || b.length - a.length);

  // 去重：被更长概念覆盖的短串跳过
  const concepts: string[] = [];
  for (const c of found) {
    if (concepts.some((x) => x.includes(c) && x !== c)) continue;
    concepts.push(c);
  }

  const pairs: ConceptPair[] = [];
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      pairs.push({
        left: concepts[i],
        right: concepts[j],
        span: `${concepts[i]} ↔ ${concepts[j]}`,
      });
    }
  }
  return { concepts, pairs };
}

const SAMPLE =
  '北京大学国家重点实验室利用知识图谱与图神经网络开展实体抽取和关系抽取研究。';

/**
 * 审计目录专用：概念对共现索引简易演示
 */
export default function ConceptCooccurrenceIndex() {
  const [text, setText] = useState(SAMPLE);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [pairs, setPairs] = useState<ConceptPair[]>([]);
  const [ran, setRan] = useState(false);

  const runIndex = () => {
    const result = extractPairs(text.trim());
    setConcepts(result.concepts);
    setPairs(result.pairs);
    setRan(true);
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">概念对共现索引</h1>
          <p className="text-sm text-gray-500">
            快速索引在同一句子中共同出现的概念实体对，作为生成子图的输入
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-3xl">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">输入句子</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="在此输入包含多个概念实体的句子…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
          />
        </div>
        <button
          type="button"
          onClick={runIndex}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
        >
          <Search className="w-3.5 h-3.5" />
          索引共现概念对
        </button>

        {ran && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">识别到的概念实体（{concepts.length}）</div>
              {concepts.length === 0 ? (
                <p className="text-sm text-gray-400">未命中词典中的概念，可尝试示例句或更换表述。</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {concepts.map((c) => (
                    <span key={c} className="px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                共现概念对（{pairs.length}）
              </div>
              {pairs.length === 0 ? (
                <p className="text-sm text-gray-400">至少需要识别到 2 个概念才能生成共现对。</p>
              ) : (
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {pairs.map((p) => (
                    <li key={p.span} className="px-4 py-2.5 text-sm flex items-center gap-2 bg-white">
                      <span className="font-medium text-blue-700">{p.left}</span>
                      <span className="text-gray-300">—</span>
                      <span className="font-medium text-indigo-700">{p.right}</span>
                      <span className="ml-auto text-[11px] text-gray-400">同句共现</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
