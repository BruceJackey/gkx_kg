import React from 'react';
import { Play } from 'lucide-react';

const RELATION_SCHEMA_OPTIONS = [
  { id: 'cause-effect', label: '因果关系', color: 'text-red-700 bg-red-50 border-red-200' },
  { id: 'before-after', label: '时序关系', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'coreference', label: '共指关系', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { id: 'hypernym', label: '上下位关系', color: 'text-green-700 bg-green-50 border-green-200' },
];

const EVENT_RELATION_SAMPLE_TEXTS = [
  {
    id: 't1',
    text: '由于芯片供应短缺，多家手机厂商不得不削减产量，导致今年第三季度智能手机出货量同比下降15%。',
    expected: [
      { subject: '芯片供应短缺', relation: '因果关系', object: '手机厂商削减产量', confidence: 0.91, evidence: '由于…导致' },
      { subject: '手机厂商削减产量', relation: '因果关系', object: '出货量下降15%', confidence: 0.87, evidence: '导致…下降' },
    ],
  },
  {
    id: 't2',
    text: '该公司于今年3月完成A轮融资，随后在6月启动了新产品的研发，并计划于明年Q2正式发布。',
    expected: [
      { subject: 'A轮融资（3月）', relation: '时序关系', object: '新产品研发（6月）', confidence: 0.89, evidence: '随后' },
      { subject: '新产品研发', relation: '时序关系', object: '产品发布（明年Q2）', confidence: 0.83, evidence: '并计划' },
    ],
  },
  {
    id: 't3',
    text: '比亚迪和新能源汽车巨头均大幅扩产，这家深圳车企的年销量已超过传统豪华品牌。',
    expected: [
      { subject: '比亚迪', relation: '共指关系', object: '新能源汽车巨头', confidence: 0.78, evidence: '均大幅扩产' },
      { subject: '比亚迪', relation: '共指关系', object: '这家深圳车企', confidence: 0.94, evidence: '上下文指代' },
    ],
  },
];

export function EventRelationExtractionDemo() {
  const [tab, setTab] = React.useState<'api' | 'extract' | 'manage'>('api');
  const [selectedText, setSelectedText] = React.useState('t1');
  const [activeSchemas, setActiveSchemas] = React.useState(['cause-effect', 'before-after', 'coreference', 'hypernym']);
  const [extractStep, setExtractStep] = React.useState<'idle' | 'running' | 'done'>('idle');
  const [extractedRelations, setExtractedRelations] = React.useState<typeof EVENT_RELATION_SAMPLE_TEXTS[0]['expected']>([]);
  const [confThreshold, setConfThreshold] = React.useState(0.65);
  const extractRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSample = EVENT_RELATION_SAMPLE_TEXTS.find(t => t.id === selectedText)!;

  const handleExtract = () => {
    setExtractStep('running');
    setExtractedRelations([]);
    let idx = 0;
    extractRef.current = setInterval(() => {
      idx += 1;
      setExtractedRelations(currentSample.expected.slice(0, idx));
      if (idx >= currentSample.expected.length) {
        clearInterval(extractRef.current!);
        setExtractStep('done');
      }
    }, 600);
  };

  const toggleSchema = (id: string) => {
    setActiveSchemas(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const schemaMap = Object.fromEntries(RELATION_SCHEMA_OPTIONS.map(s => [s.id, s]));
  const filteredRelations = extractedRelations.filter(r => r.confidence >= confThreshold);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          ['api', 'API接口调用'],
          ['extract', '关系识别演示'],
          ['manage', '模型管理'],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${tab === k ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── API tab ── */}
      {tab === 'api' && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
              <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-bold">POST</span>
              <span className="text-xs text-gray-300 font-mono">/api/v1/event-relation/extract</span>
              <span className="ml-auto text-[10px] text-gray-500">P99 &lt;50ms</span>
            </div>
            <pre className="bg-gray-900 text-green-300 text-[11px] p-4 overflow-x-auto leading-relaxed font-mono">{`{
  "text": "由于芯片短缺，手机厂商削减产量，出货量同比下降15%",
  "relation_schema": ["cause-effect", "before-after"],
  "window_size": 3,
  "confidence_threshold": 0.65
}`}</pre>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
              <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded font-bold">200</span>
              <span className="text-xs text-gray-600">Response</span>
            </div>
            <pre className="bg-gray-900 text-green-300 text-[11px] p-4 overflow-x-auto leading-relaxed font-mono">{`{
  "relations": [
    {
      "subject": "芯片短缺",
      "relation": "cause-effect",
      "object": "手机厂商削减产量",
      "confidence": 0.91,
      "evidence_span": "由于…导致"
    },
    {
      "subject": "手机厂商削减产量",
      "relation": "cause-effect",
      "object": "出货量下降15%",
      "confidence": 0.87,
      "evidence_span": "导致…下降"
    }
  ],
  "latency_ms": 32,
  "model_version": "v1.3.0"
}`}</pre>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['支持关系类型', '20+', 'text-blue-700'],
              ['批量吞吐量', '3000 req/min', 'text-green-700'],
              ['SDK支持', 'Python / Java / Go', 'text-purple-700'],
            ].map(([k, v, cls]) => (
              <div key={k} className="border border-gray-200 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-400 mb-1">{k}</div>
                <div className={`text-xs font-bold ${cls}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Extract tab ── */}
      {tab === 'extract' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">选择示例文本</div>
            <div className="space-y-2">
              {EVENT_RELATION_SAMPLE_TEXTS.map(t => (
                <button key={t.id} onClick={() => { setSelectedText(t.id); setExtractStep('idle'); setExtractedRelations([]); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-xs leading-relaxed transition-colors ${selectedText === t.id ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
                  {t.text}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">启用关系模式</div>
            <div className="flex flex-wrap gap-2">
              {RELATION_SCHEMA_OPTIONS.map(s => (
                <button key={s.id} onClick={() => toggleSchema(s.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${activeSchemas.includes(s.id) ? s.color : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleExtract} disabled={extractStep === 'running'}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-xl transition-colors">
            {extractStep === 'running'
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />抽取中…</>
              : <><Play className="w-3.5 h-3.5" />{extractStep === 'done' ? '重新抽取' : '执行关系抽取'}</>}
          </button>

          {extractedRelations.length > 0 && (
            <div className="space-y-2">
              {extractedRelations.map((r, i) => {
                const schema = Object.values(schemaMap).find(s => s.label === r.relation) || RELATION_SCHEMA_OPTIONS[0];
                return (
                  <div key={i} className={`border rounded-xl p-4 ${schema.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] border px-2 py-0.5 rounded-full font-medium ${schema.color}`}>{r.relation}</span>
                      <span className="text-[10px] text-gray-500 ml-auto">置信度 <strong>{(r.confidence * 100).toFixed(0)}%</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-medium text-gray-800 bg-white px-2 py-1 rounded-lg border border-gray-200">{r.subject}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-800 bg-white px-2 py-1 rounded-lg border border-gray-200">{r.object}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-2">证据片段：「{r.evidence}」</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Manage tab ── */}
      {tab === 'manage' && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">模型版本管理</span>
              <span className="text-xs text-gray-400">A/B 测试流量分配</span>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { version: 'v1.3.0', status: '生产（80%）', f1: '82.4%', date: '2026-08-02', bar: 80, active: true },
                { version: 'v1.4.0-beta', status: '灰度（20%）', f1: '85.1%', date: '2026-08-01', bar: 20, active: false },
                { version: 'v1.2.0', status: '备用', f1: '78.9%', date: '2026-07-10', bar: 0, active: false },
              ].map(m => (
                <div key={m.version} className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{m.version}</span>
                      {m.active && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">当前生产</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      <span>F1: <strong className="text-gray-700">{m.f1}</strong></span>
                      <span>发布: {m.date}</span>
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>{m.status}</span><span>{m.bar}%</span></div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.active ? 'bg-blue-500' : m.bar > 0 ? 'bg-amber-400' : 'bg-gray-200'}`} style={{ width: `${m.bar}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['QPS（当前）', '1,842', 'text-blue-700'], ['P99 延迟', '38ms', 'text-green-700'], ['近24h错误率', '0.12%', 'text-orange-600']].map(([k, v, cls]) => (
              <div key={k} className="border border-gray-200 rounded-xl p-3 text-center">
                <div className="text-[10px] text-gray-400 mb-1">{k}</div>
                <div className={`text-sm font-bold ${cls}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">置信度阈值（实时过滤）</span>
              <span className="text-sm font-bold text-blue-600">{confThreshold.toFixed(2)}</span>
            </div>
            <input type="range" min={0.3} max={0.95} step={0.05} value={confThreshold}
              onChange={e => setConfThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600" />
            <div className="text-xs text-gray-400">当前阈值下预估精度：{(confThreshold * 95 + 5).toFixed(0)}% · 预估召回：{((1 - confThreshold) * 60 + 60).toFixed(0)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
