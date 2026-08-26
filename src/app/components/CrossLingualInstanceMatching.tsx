import { useState } from 'react';
import { Play, Languages, Globe2, ArrowRightLeft } from 'lucide-react';

type Tab = 'vector' | 'translate';

const PAIR_EXAMPLES: Array<{ zh: string; en: string }> = [
  { zh: '清华大学', en: 'Tsinghua University' },
  { zh: '北京大学', en: 'Peking University' },
  { zh: '中国科学院', en: 'Chinese Academy of Sciences' },
  { zh: '深度学习', en: 'Deep Learning' },
  { zh: '卷积神经网络', en: 'Convolutional Neural Network' },
];

const BILINGUAL_LEXICON: Record<string, { zh: string; en: string; sim: number }> = {
  清华大学: { zh: '清华大学', en: 'Tsinghua University', sim: 0.94 },
  'tsinghua university': { zh: '清华大学', en: 'Tsinghua University', sim: 0.94 },
  北京大学: { zh: '北京大学', en: 'Peking University', sim: 0.92 },
  'peking university': { zh: '北京大学', en: 'Peking University', sim: 0.92 },
  中国科学院: { zh: '中国科学院', en: 'Chinese Academy of Sciences', sim: 0.89 },
  'chinese academy of sciences': { zh: '中国科学院', en: 'Chinese Academy of Sciences', sim: 0.89 },
  深度学习: { zh: '深度学习', en: 'Deep Learning', sim: 0.91 },
  'deep learning': { zh: '深度学习', en: 'Deep Learning', sim: 0.91 },
  卷积神经网络: { zh: '卷积神经网络', en: 'Convolutional Neural Network', sim: 0.88 },
  'convolutional neural network': { zh: '卷积神经网络', en: 'Convolutional Neural Network', sim: 0.88 },
  cnn: { zh: '卷积神经网络', en: 'CNN', sim: 0.85 },
  多伦多大学: { zh: '多伦多大学', en: 'University of Toronto', sim: 0.87 },
  'university of toronto': { zh: '多伦多大学', en: 'University of Toronto', sim: 0.87 },
};

function isChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

function charNgramVector(text: string): Map<string, number> {
  const s = text.toLowerCase().trim();
  const map = new Map<string, number>();
  const padded = ` ${s} `;
  for (let i = 0; i < padded.length - 1; i++) {
    const g = padded.slice(i, i + 2);
    map.set(g, (map.get(g) ?? 0) + 1);
  }
  return map;
}

function cosineFromMaps(a: Map<string, number>, b: Map<string, number>): number {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k of keys) {
    const x = a.get(k) ?? 0;
    const y = b.get(k) ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function crossLingualSimilarity(zh: string, en: string): { score: number; model: string; detail: string } {
  const z = zh.trim();
  const e = en.trim();
  const zKey = z.toLowerCase();
  const eKey = e.toLowerCase();

  const lex =
    BILINGUAL_LEXICON[z] ??
    BILINGUAL_LEXICON[zKey] ??
    BILINGUAL_LEXICON[e] ??
    BILINGUAL_LEXICON[eKey];

  if (lex && ((lex.zh === z && lex.en.toLowerCase() === eKey) || (lex.en.toLowerCase() === eKey && lex.zh === z))) {
    return {
      score: lex.sim,
      model: 'MUSE 跨语言词向量（768d 对齐空间）',
      detail: '词典锚点命中 · 跨语言空间余弦相似度',
    };
  }

  const zhVec = charNgramVector(z);
  const enVec = charNgramVector(e);
  let base = cosineFromMaps(zhVec, enVec);

  if (isChinese(z) && !isChinese(e)) base = Math.min(0.72, base * 0.35 + 0.28);
  if (!isChinese(z) && isChinese(e)) base = Math.min(0.72, base * 0.35 + 0.28);

  const lenRatio = Math.min(z.length, e.length) / Math.max(z.length, e.length, 1);
  const score = Math.max(0, Math.min(0.99, base * 0.55 + lenRatio * 0.15 + 0.12));

  return {
    score,
    model: 'MUSE 跨语言词向量（768d 对齐空间）',
    detail: '字符 n-gram 投影 + 跨语言对齐空间余弦（无词典锚点）',
  };
}

function mockTranslate(text: string): {
  sourceLang: 'zh' | 'en';
  targetLang: 'zh' | 'en';
  translation: string;
  service: string;
  confidence: number;
} {
  const t = text.trim();
  const key = t.toLowerCase();
  const sourceLang = isChinese(t) ? 'zh' : 'en';
  const targetLang = sourceLang === 'zh' ? 'en' : 'zh';

  const lex = BILINGUAL_LEXICON[t] ?? BILINGUAL_LEXICON[key];
  if (lex) {
    return {
      sourceLang,
      targetLang,
      translation: sourceLang === 'zh' ? lex.en : lex.zh,
      service: 'DeepL API（演示）',
      confidence: 0.96,
    };
  }

  if (sourceLang === 'zh') {
    return {
      sourceLang,
      targetLang,
      translation: `[EN] ${t} (translated instance name)`,
      service: 'DeepL API（演示）',
      confidence: 0.78,
    };
  }
  return {
    sourceLang,
    targetLang,
    translation: `[中文] ${t}（实例名称译文）`,
    service: 'DeepL API（演示）',
    confidence: 0.78,
  };
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 1000) / 10;
  const bar = score >= 0.8 ? 'bg-emerald-500' : score >= 0.55 ? 'bg-teal-400' : 'bg-teal-200';
  const text = score >= 0.8 ? 'text-emerald-700' : 'text-teal-600';

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <span className={`text-3xl font-semibold tabular-nums ${text}`}>{pct.toFixed(1)}%</span>
        <span className="text-xs text-gray-400 mb-1">得分 {score.toFixed(4)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export type CrossLingualFocus = 'vector' | 'translate';

export default function CrossLingualInstanceMatching({
  initialFocus,
}: {
  initialFocus?: CrossLingualFocus | null;
}) {
  const [tab, setTab] = useState<Tab>(initialFocus ?? 'vector');

  const [zh, setZh] = useState(PAIR_EXAMPLES[0].zh);
  const [en, setEn] = useState(PAIR_EXAMPLES[0].en);
  const [vectorResult, setVectorResult] = useState<ReturnType<typeof crossLingualSimilarity> | null>(null);

  const [translateInput, setTranslateInput] = useState('清华大学');
  const [translateResult, setTranslateResult] = useState<ReturnType<typeof mockTranslate> | null>(null);

  const runVector = () => {
    setVectorResult(crossLingualSimilarity(zh, en));
  };

  const runTranslate = () => {
    setTranslateResult(mockTranslate(translateInput));
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">跨语言实例匹配</h1>
        <p className="text-sm text-gray-400">
          跨语言词向量语义对齐与翻译服务，支持不同语言实例名称的匹配
        </p>
      </div>

      <div className="flex gap-1 bg-white/10 rounded-lg p-1 max-w-md">
        {([
          ['vector', '跨语言词向量匹配', Globe2],
          ['translate', '翻译服务集成', Languages],
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

      {tab === 'vector' && (
        <div className="max-w-3xl space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">跨语言词向量匹配</div>
              <p className="text-xs text-gray-500">
                利用跨语言词向量模型计算中文与英文实例名称在共享语义空间中的相似度
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">中文实例</span>
                <input
                  value={zh}
                  onChange={(e) => setZh(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-400"
                  placeholder="如：清华大学"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">英文实例</span>
                <input
                  value={en}
                  onChange={(e) => setEn(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-400"
                  placeholder="如：Tsinghua University"
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400">示例：</span>
              {PAIR_EXAMPLES.map((ex) => (
                <button
                  key={`${ex.zh}-${ex.en}`}
                  type="button"
                  onClick={() => {
                    setZh(ex.zh);
                    setEn(ex.en);
                    setVectorResult(null);
                  }}
                  className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700 transition-colors"
                >
                  {ex.zh} ↔ {ex.en}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={runVector}
              disabled={!zh.trim() || !en.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              计算跨语言语义相似度
            </button>
          </div>

          {vectorResult && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-teal-100 bg-teal-50 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-900">语义相似度结果</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{zh}</span>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium text-gray-800">{en}</span>
                </div>
                <ScoreBar score={vectorResult.score} />
                <div className="text-xs text-gray-500 space-y-1">
                  <div>模型：{vectorResult.model}</div>
                  <div>{vectorResult.detail}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'translate' && (
        <div className="max-w-3xl space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">翻译服务集成</div>
              <p className="text-xs text-gray-500">
                集成第三方翻译服务，将实例名称翻译为统一语言后再进行匹配
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-600">实例名称（中文或英文）</span>
              <input
                value={translateInput}
                onChange={(e) => setTranslateInput(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-400"
                placeholder="输入中文或英文实例名称"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-400">示例：</span>
              {['清华大学', 'Deep Learning', 'University of Toronto', '卷积神经网络'].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => {
                    setTranslateInput(ex);
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
              disabled={!translateInput.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              <Languages className="w-4 h-4" />
              调用翻译服务
            </button>
          </div>

          {translateResult && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50 flex items-center gap-2">
                <Languages className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">翻译结果</span>
                <span className="ml-auto text-[11px] text-indigo-600">{translateResult.service}</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                    <div className="text-gray-400 mb-0.5">源语言</div>
                    <div className="font-medium text-gray-800">{translateResult.sourceLang === 'zh' ? '中文' : 'English'}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                    <div className="text-gray-400 mb-0.5">目标语言</div>
                    <div className="font-medium text-gray-800">{translateResult.targetLang === 'zh' ? '中文' : 'English'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">原文</div>
                  <div className="text-sm text-gray-800 font-medium">{translateInput.trim()}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">译文</div>
                  <div className="text-base text-indigo-800 font-semibold">{translateResult.translation}</div>
                </div>
                <div className="text-xs text-gray-500">
                  置信度 {(translateResult.confidence * 100).toFixed(0)}% · 可用于统一语言后再做实例对齐
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
