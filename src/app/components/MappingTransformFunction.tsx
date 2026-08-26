import { useState } from 'react';
import { Play, Code2, BookOpen, Wand2 } from 'lucide-react';

type DataType = 'string' | 'number' | 'date' | 'json' | 'boolean';
type BuiltinFn =
  | 'identity'
  | 'upper'
  | 'lower'
  | 'trim'
  | 'format_date'
  | 'parse_json'
  | 'to_number'
  | 'bool_cn';

const DATA_TYPES: { id: DataType; label: string; sample: string }[] = [
  { id: 'string', label: '字符串', sample: '  OpenAI / Microsoft  ' },
  { id: 'number', label: '数值', sample: '3.14159' },
  { id: 'date', label: '日期', sample: '2024-03-15T10:30:00Z' },
  { id: 'json', label: 'JSON', sample: '{"name":"Geoffrey Hinton","org":"UofT"}' },
  { id: 'boolean', label: '布尔', sample: 'true' },
];

const BUILTIN_FNS: { id: BuiltinFn; label: string; desc: string; forTypes: DataType[] }[] = [
  { id: 'identity', label: '直接映射', desc: '原样输出', forTypes: ['string', 'number', 'date', 'json', 'boolean'] },
  { id: 'upper', label: '大写', desc: '转大写', forTypes: ['string'] },
  { id: 'lower', label: '小写', desc: '转小写', forTypes: ['string'] },
  { id: 'trim', label: '去空白', desc: '去除首尾空格', forTypes: ['string'] },
  { id: 'format_date', label: '格式化日期', desc: '输出 YYYY-MM-DD', forTypes: ['date', 'string'] },
  { id: 'parse_json', label: 'JSON 解析', desc: '提取 name 字段', forTypes: ['json', 'string'] },
  { id: 'to_number', label: '转数值', desc: '解析为 Number', forTypes: ['string', 'number'] },
  { id: 'bool_cn', label: '布尔中文化', desc: 'true/false → 是/否', forTypes: ['boolean', 'string'] },
];

function applyBuiltin(fn: BuiltinFn, raw: string): { ok: boolean; result: string; error?: string } {
  try {
    switch (fn) {
      case 'identity':
        return { ok: true, result: raw };
      case 'upper':
        return { ok: true, result: raw.toUpperCase() };
      case 'lower':
        return { ok: true, result: raw.toLowerCase() };
      case 'trim':
        return { ok: true, result: raw.trim() };
      case 'format_date': {
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return { ok: false, result: '', error: '无法解析日期' };
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return { ok: true, result: `${y}-${m}-${day}` };
      }
      case 'parse_json': {
        const obj = JSON.parse(raw);
        return { ok: true, result: String(obj.name ?? obj.org ?? JSON.stringify(obj)) };
      }
      case 'to_number': {
        const n = Number(raw);
        if (Number.isNaN(n)) return { ok: false, result: '', error: '无法转为数值' };
        return { ok: true, result: String(n) };
      }
      case 'bool_cn': {
        const v = raw.trim().toLowerCase();
        if (['true', '1', 'yes', '是'].includes(v)) return { ok: true, result: '是' };
        if (['false', '0', 'no', '否'].includes(v)) return { ok: true, result: '否' };
        return { ok: false, result: '', error: '无法识别布尔值' };
      }
      default:
        return { ok: false, result: '', error: '未知函数' };
    }
  } catch (e) {
    return { ok: false, result: '', error: e instanceof Error ? e.message : '执行失败' };
  }
}

function runCustomFn(code: string, raw: string): { ok: boolean; result: string; error?: string } {
  try {
    // Very limited sandbox for demo: function body receiving `value`
    // eslint-disable-next-line no-new-func
    const fn = new Function('value', `"use strict";\n${code}`);
    const out = fn(raw);
    return { ok: true, result: out === undefined ? 'undefined' : String(out) };
  } catch (e) {
    return { ok: false, result: '', error: e instanceof Error ? e.message : '自定义函数执行失败' };
  }
}

const DEFAULT_CUSTOM = `// 入参 value 为原始字符串
const s = String(value).trim();
return s.replace(/\\s+/g, ' ');`;

export default function MappingTransformFunction() {
  const [mode, setMode] = useState<'builtin' | 'custom'>('builtin');
  const [dataType, setDataType] = useState<DataType>('string');
  const [input, setInput] = useState(DATA_TYPES[0].sample);
  const [fnId, setFnId] = useState<BuiltinFn>('trim');
  const [customCode, setCustomCode] = useState(DEFAULT_CUSTOM);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ ok: boolean; result: string; error?: string; latency_ms: number } | null>(null);

  const availableFns = BUILTIN_FNS.filter((f) => f.forTypes.includes(dataType));

  const onTypeChange = (t: DataType) => {
    setDataType(t);
    const sample = DATA_TYPES.find((d) => d.id === t)?.sample ?? '';
    setInput(sample);
    const first = BUILTIN_FNS.find((f) => f.forTypes.includes(t));
    if (first) setFnId(first.id);
    setOutput(null);
  };

  const run = () => {
    setRunning(true);
    setOutput(null);
    const started = Date.now();
    setTimeout(() => {
      const res = mode === 'builtin' ? applyBuiltin(fnId, input) : runCustomFn(customCode, input);
      setOutput({ ...res, latency_ms: Date.now() - started + Math.floor(Math.random() * 20) });
      setRunning(false);
    }, 450);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">转换函数支持</h1>
          <p className="text-sm text-gray-500">
            映射过程中应用内置或自定义函数，对数据进行清洗与转换
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
        {([
          { id: 'builtin' as const, label: '内置转换函数' },
          { id: 'custom' as const, label: '自定义函数' },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setMode(t.id); setOutput(null); }}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors font-medium ${
              mode === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-6 max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">使用说明</span>
          </div>
          <div className="px-4 py-3 text-xs text-gray-600 space-y-1">
            <p>1. 选择输入数据类型并填写样例数据</p>
            <p>2. {mode === 'builtin' ? '选择内置转换方式' : '编写自定义函数（入参 value）'}</p>
            <p>3. 点击执行，查看清洗/转换结果</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">数据类型</label>
            <div className="flex flex-wrap gap-1.5">
              {DATA_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTypeChange(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    dataType === t.id
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">输入数据</label>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(null); }}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-400 bg-gray-50 resize-none"
            />
          </div>

          {mode === 'builtin' ? (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">转换方式</label>
              <div className="grid grid-cols-2 gap-2">
                {availableFns.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { setFnId(f.id); setOutput(null); }}
                    className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      fnId === f.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">{f.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                自定义函数（JavaScript，入参 value）
              </label>
              <textarea
                value={customCode}
                onChange={(e) => { setCustomCode(e.target.value); setOutput(null); }}
                rows={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-indigo-400 bg-gray-950 text-green-300 resize-none"
              />
            </div>
          )}

          <button
            type="button"
            onClick={run}
            disabled={!input.trim() || running}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg"
          >
            {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? '执行中…' : '执行转换'}
          </button>
        </div>

        {output && (
          <div className={`bg-white border rounded-xl overflow-hidden ${output.ok ? 'border-emerald-200' : 'border-red-200'}`}>
            <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${output.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <Code2 className={`w-4 h-4 ${output.ok ? 'text-emerald-600' : 'text-red-500'}`} />
              <span className={`text-sm font-semibold ${output.ok ? 'text-emerald-800' : 'text-red-700'}`}>
                {output.ok ? '转换结果' : '执行失败'}
              </span>
              <span className="text-[10px] text-gray-400 ml-auto">{output.latency_ms} ms</span>
            </div>
            <pre className="p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap bg-gray-50">
              {output.ok ? output.result : output.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
