import { useState } from 'react';
import { Languages, Layers, Play, ArrowRightLeft, Globe2 } from 'lucide-react';
import KnowledgeSearch from './KnowledgeSearch';

type Tab = 'translate' | 'fusion';

const QUERY_EXAMPLES = [
  '知识图谱 Transformer 嵌入',
  'cross-lingual knowledge graph alignment',
  '大语言模型 科学文献 信息抽取',
  'graph neural networks drug discovery',
];

const QUERY_PHRASE_MAP: Record<string, { zh: string; en: string }> = {
  '知识图谱 transformer 嵌入': {
    zh: '知识图谱 Transformer 嵌入',
    en: 'Knowledge Graph Transformer Embedding',
  },
  'cross-lingual knowledge graph alignment': {
    zh: '跨语言知识图谱对齐',
    en: 'Cross-lingual Knowledge Graph Alignment',
  },
  '大语言模型 科学文献 信息抽取': {
    zh: '大语言模型 科学文献 信息抽取',
    en: 'Large Language Models for Scientific Literature Information Extraction',
  },
  'graph neural networks drug discovery': {
    zh: '图神经网络 药物发现',
    en: 'Graph Neural Networks for Drug Discovery',
  },
  '知识图谱 实体链接': {
    zh: '知识图谱 实体链接',
    en: 'Knowledge Graph Entity Linking',
  },
  'knowledge graph entity linking': {
    zh: '知识图谱 实体链接',
    en: 'Knowledge Graph Entity Linking',
  },
};

function isChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function translateQueryIntent(query: string): {
  sourceLang: 'zh' | 'en';
  zh: string;
  en: string;
  targetLangs: string[];
  service: string;
  confidence: number;
} {
  const t = query.trim();
  const key = t.toLowerCase();
  const sourceLang = isChinese(t) ? 'zh' : 'en';

  const known = QUERY_PHRASE_MAP[key] ?? QUERY_PHRASE_MAP[t];
  if (known) {
    return {
      sourceLang,
      zh: known.zh,
      en: known.en,
      targetLangs: ['zh', 'en', 'ja', 'ko'],
      service: '查询意图翻译服务（NMT + 领域术语库）',
      confidence: 0.94,
    };
  }

  if (sourceLang === 'zh') {
    const en = t
      .replace(/知识图谱/g, 'Knowledge Graph')
      .replace(/嵌入/g, 'Embedding')
      .replace(/实体链接/g, 'Entity Linking')
      .replace(/大语言模型/g, 'Large Language Model')
      .replace(/信息抽取/g, 'Information Extraction')
      .replace(/跨语言/g, 'Cross-lingual')
      .replace(/对齐/g, 'Alignment');
    return {
      sourceLang,
      zh: t,
      en: en === t ? `[EN] ${t} (translated query intent)` : en,
      targetLangs: ['zh', 'en', 'ja', 'ko'],
      service: '查询意图翻译服务（NMT + 领域术语库）',
      confidence: 0.82,
    };
  }

  return {
    sourceLang,
    zh: `[中文] ${t.replace(/knowledge graph/gi, '知识图谱').replace(/entity linking/gi, '实体链接')}（查询意图译文）`,
    en: t,
    targetLangs: ['zh', 'en', 'ja', 'ko'],
    service: '查询意图翻译服务（NMT + 领域术语库）',
    confidence: 0.82,
  };
}

export type CrossLingualQueryFocus = 'translate' | 'fusion';

export default function CrossLingualQueryFusion({
  initialFocus,
}: {
  initialFocus?: CrossLingualQueryFocus | null;
}) {
  const [tab, setTab] = useState<Tab>(initialFocus ?? 'translate');
  const [queryInput, setQueryInput] = useState(QUERY_EXAMPLES[0]);
  const [translateResult, setTranslateResult] = useState<ReturnType<typeof translateQueryIntent> | null>(null);

  const runTranslate = () => {
    setTranslateResult(translateQueryIntent(queryInput));
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">查询驱动的实例匹配</h1>
        <p className="text-sm text-gray-400">
          查询意图跨语言翻译与多语言知识库结果融合
        </p>
      </div>

      <div className="flex gap-1 bg-white/10 rounded-lg p-1 max-w-lg flex-shrink-0">
        {([
          ['translate', '查询意图翻译', Languages],
          ['fusion', '跨库结果融合', Layers],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'translate' && (
        <div className="flex-1 overflow-auto max-w-3xl space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">查询意图翻译</div>
              <p className="text-xs text-gray-500">
                自动将用户查询翻译为知识库支持的其他语言，便于跨语言检索
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-600">检索内容（中文或英文）</span>
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTranslate()}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-400"
                placeholder="如：知识图谱 Transformer 嵌入"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400">示例：</span>
              {QUERY_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setQueryInput(ex);
                    setTranslateResult(null);
                  }}
                  className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={runTranslate}
              disabled={!queryInput.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              翻译查询意图
            </button>
          </div>

          {translateResult && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">中英双语查询意图</span>
                <span className="ml-auto text-[11px] text-indigo-600">{translateResult.service}</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
                    <div className="text-[11px] text-gray-400">中文查询意图</div>
                    <div className="text-sm font-medium text-gray-900 leading-relaxed">{translateResult.zh}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-1">
                    <div className="text-[11px] text-gray-400">English Query Intent</div>
                    <div className="text-sm font-medium text-gray-900 leading-relaxed">{translateResult.en}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">
                    {translateResult.sourceLang === 'zh' ? translateResult.zh : translateResult.en}
                  </span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500">自动翻译至</span>
                  <span className="font-medium text-gray-800">
                    {translateResult.sourceLang === 'zh' ? translateResult.en : translateResult.zh}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-gray-400">知识库支持语言：</span>
                  {translateResult.targetLangs.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {lang === 'zh' ? '中文' : lang === 'en' ? 'English' : lang === 'ja' ? '日本語' : '한국어'}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  源语言：{translateResult.sourceLang === 'zh' ? '中文' : 'English'} · 置信度{' '}
                  {(translateResult.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'fusion' && (
        <div className="min-h-[680px] h-[calc(100vh-220px)] rounded-xl overflow-hidden border border-gray-700/50 bg-gray-50">
          <KnowledgeSearch variant="cross-db-fusion" />
        </div>
      )}
    </div>
  );
}
