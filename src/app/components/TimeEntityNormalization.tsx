import { useState } from 'react';
import { Play, Clock, CheckCircle2 } from 'lucide-react';

const FORMAT_OPTIONS = [
  { id: 'iso8601', label: 'ISO 8601', example: '2024-03-15T14:30:00+08:00' },
  { id: 'date', label: '日期 (YYYY-MM-DD)', example: '2024-03-15' },
  { id: 'datetime', label: '日期时间 (YYYY-MM-DD HH:mm:ss)', example: '2024-03-15 14:30:00' },
  { id: 'unix', label: 'Unix 时间戳（秒）', example: '1710484200' },
  { id: 'rfc3339', label: 'RFC 3339', example: '2024-03-15T14:30:00+08:00' },
] as const;

type FormatId = (typeof FORMAT_OPTIONS)[number]['id'];

const SAMPLE_INPUTS = [
  '苹果公司于2024年3月15日在北京发布了新款芯片',
  '会议定于下周三下午两点半举行',
  '该项目启动于2023年第二季度',
  '2026-07-04 09:12:03',
  '三天前',
  'last Friday at 3pm',
];

interface NormalizeResult {
  rawSpan: string;
  normalized: string;
  confidence: number;
  type: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toFormats(y: number, m: number, d: number, h = 0, min = 0, s = 0, format: FormatId): string {
  const date = new Date(y, m - 1, d, h, min, s);
  const yyyy = y;
  const MM = pad(m);
  const dd = pad(d);
  const HH = pad(h);
  const mm = pad(min);
  const ss = pad(s);

  switch (format) {
    case 'iso8601':
    case 'rfc3339':
      return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}+08:00`;
    case 'date':
      return `${yyyy}-${MM}-${dd}`;
    case 'datetime':
      return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
    case 'unix':
      return String(Math.floor(date.getTime() / 1000));
    default:
      return `${yyyy}-${MM}-${dd}`;
  }
}

/** 简易 mock：识别常见中英文时间表述并标准化 */
function mockNormalize(text: string, format: FormatId): NormalizeResult[] {
  const results: NormalizeResult[] = [];
  const ref = new Date(2026, 7, 24, 17, 0, 0);

  const patterns: Array<{
    re: RegExp;
    type: string;
    resolve: (m: RegExpMatchArray) => { y: number; m: number; d: number; h?: number; min?: number; s?: number; span: string; confidence: number };
  }> = [
    {
      re: /(\d{4})年(\d{1,2})月(\d{1,2})日/g,
      type: '绝对日期',
      resolve: (m) => ({
        y: +m[1], m: +m[2], d: +m[3], span: m[0], confidence: 0.96,
      }),
    },
    {
      re: /(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/g,
      type: '标准日期时间',
      resolve: (m) => ({
        y: +m[1], m: +m[2], d: +m[3],
        h: m[4] ? +m[4] : 0, min: m[5] ? +m[5] : 0, s: m[6] ? +m[6] : 0,
        span: m[0], confidence: 0.99,
      }),
    },
    {
      re: /(\d{4})年(?:第)?([一二三四1-4])季度/g,
      type: '季度',
      resolve: (m) => {
        const qMap: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '1': 1, '2': 2, '3': 3, '4': 4 };
        const q = qMap[m[2]] ?? 1;
        return { y: +m[1], m: q * 3 - 2, d: 1, span: m[0], confidence: 0.88 };
      },
    },
    {
      re: /三天前/g,
      type: '相对时间',
      resolve: (m) => {
        const d = new Date(ref);
        d.setDate(d.getDate() - 3);
        return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), span: m[0], confidence: 0.85 };
      },
    },
    {
      re: /下周三(?:下午)?(?:两点半|2[:：]30)?/g,
      type: '相对日期时间',
      resolve: (m) => {
        const d = new Date(ref);
        const day = d.getDay();
        const daysUntilWed = (3 - day + 7) % 7 || 7;
        d.setDate(d.getDate() + daysUntilWed);
        return {
          y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(),
          h: 14, min: 30, span: m[0], confidence: 0.82,
        };
      },
    },
    {
      re: /last Friday at (\d{1,2})(?:pm|PM)/gi,
      type: '英文相对时间',
      resolve: (m) => {
        const d = new Date(ref);
        const day = d.getDay();
        d.setDate(d.getDate() - ((day + 2) % 7 || 7));
        let h = +m[1];
        if (h < 12) h += 12;
        return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h, min: 0, span: m[0], confidence: 0.80 };
      },
    },
  ];

  for (const { re, type, resolve } of patterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const { y, m, d, h = 0, min = 0, s = 0, span, confidence } = resolve(match);
      results.push({
        rawSpan: span,
        normalized: toFormats(y, m, d, h, min, s, format),
        confidence,
        type,
      });
    }
  }

  if (results.length === 0 && text.trim()) {
    results.push({
      rawSpan: text.trim().slice(0, 40),
      normalized: toFormats(ref.getFullYear(), ref.getMonth() + 1, ref.getDate(), 0, 0, 0, format),
      confidence: 0.55,
      type: '未识别（默认参考日）',
    });
  }

  return results;
}

/**
 * 审计目录专用：时间实体识别与标准化简易演示
 */
export default function TimeEntityNormalization() {
  const [inputText, setInputText] = useState(SAMPLE_INPUTS[0]);
  const [format, setFormat] = useState<FormatId>('iso8601');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<NormalizeResult[]>([]);
  const [ran, setRan] = useState(false);

  const runNormalize = () => {
    setRunning(true);
    setRan(false);
    setResults([]);
    setTimeout(() => {
      setResults(mockNormalize(inputText, format));
      setRunning(false);
      setRan(true);
    }, 700);
  };

  const selectedFormat = FORMAT_OPTIONS.find((f) => f.id === format)!;

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">时间实体识别与标准化</h1>
          <p className="text-sm text-gray-500">从文本中抽取时间表述，并转换为所选标准格式</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-3xl">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">输入文本（含时间表述）</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            placeholder="例如：苹果公司于2024年3月15日在北京发布了新款芯片"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SAMPLE_INPUTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setInputText(s); setRan(false); setResults([]); }}
                className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {s.length > 18 ? `${s.slice(0, 18)}…` : s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">标准化格式</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as FormatId)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label} — 示例 {f.example}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={runNormalize}
          disabled={!inputText.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {running ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? '识别与标准化中…' : '启动标准化'}
        </button>
      </div>

      {ran && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            标准化结果
            <span className="text-xs font-normal text-gray-400 ml-1">
              格式：{selectedFormat.label} · 共 {results.length} 条
            </span>
          </div>

          {results.length === 0 ? (
            <p className="text-sm text-gray-400">未识别到时间实体</p>
          ) : (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={`${r.rawSpan}-${i}`} className="border border-gray-100 rounded-lg px-4 py-3 bg-gray-50/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-gray-500">原文片段</span>
                        <code className="text-xs bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-100">{r.rawSpan}</code>
                        <span className="text-[10px] text-gray-400">{r.type}</span>
                        <span className="text-[10px] text-blue-500 ml-auto">置信度 {(r.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-sm font-mono text-gray-900 bg-white border border-green-200 rounded-lg px-3 py-2">
                        {r.normalized}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
