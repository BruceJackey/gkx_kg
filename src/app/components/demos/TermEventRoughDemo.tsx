import React, { useState } from 'react';
import { Play, Search } from 'lucide-react';

interface EventArg { agent?: string; patient?: string; time?: string; location?: string; }
interface ExtractedEvent { id: string; trigger: string; pos: string; args: EventArg; sentenceId: number; confidence: number; }

const SAMPLE_TEXTS = [
  '苹果公司于2024年在北京发布了新款芯片，该芯片由工程师团队历时三年研发完成。',
  '国家重点实验室联合高校于上月在上海举办了人工智能技术研讨会，来自全国的专家参与了讨论。',
  '研究人员在实验室中成功合成了一种新型催化剂，该成果于本周在《自然》杂志上发表。',
  '政府宣布将在未来五年内投资建设新能源基础设施，推动碳中和目标的实现。',
];

const MOCK_EVENTS: Record<number, ExtractedEvent[]> = {
  0: [
    { id: 'e0-1', trigger: '发布', pos: 'VV', args: { agent: '苹果公司', patient: '新款芯片', time: '2024年', location: '北京' }, sentenceId: 0, confidence: 0.91 },
    { id: 'e0-2', trigger: '研发', pos: 'VV', args: { agent: '工程师团队', patient: '芯片', time: '三年' }, sentenceId: 0, confidence: 0.84 },
  ],
  1: [
    { id: 'e1-1', trigger: '举办', pos: 'VV', args: { agent: '国家重点实验室', patient: '人工智能技术研讨会', time: '上月', location: '上海' }, sentenceId: 1, confidence: 0.93 },
    { id: 'e1-2', trigger: '参与', pos: 'VV', args: { agent: '专家', patient: '讨论' }, sentenceId: 1, confidence: 0.78 },
    { id: 'e1-3', trigger: '研讨会', pos: 'NN', args: { agent: '国家重点实验室', time: '上月', location: '上海' }, sentenceId: 1, confidence: 0.71 },
  ],
  2: [
    { id: 'e2-1', trigger: '合成', pos: 'VV', args: { agent: '研究人员', patient: '新型催化剂', location: '实验室' }, sentenceId: 2, confidence: 0.89 },
    { id: 'e2-2', trigger: '发表', pos: 'VV', args: { agent: '研究人员', patient: '成果', time: '本周', location: '《自然》杂志' }, sentenceId: 2, confidence: 0.86 },
  ],
  3: [
    { id: 'e3-1', trigger: '宣布', pos: 'VV', args: { agent: '政府', patient: '建设新能源基础设施' }, sentenceId: 3, confidence: 0.94 },
    { id: 'e3-2', trigger: '投资', pos: 'VV', args: { agent: '政府', patient: '新能源基础设施', time: '未来五年' }, sentenceId: 3, confidence: 0.87 },
    { id: 'e3-3', trigger: '建设', pos: 'VV', args: { patient: '新能源基础设施' }, sentenceId: 3, confidence: 0.76 },
    { id: 'e3-4', trigger: '实现', pos: 'VV', args: { patient: '碳中和目标' }, sentenceId: 3, confidence: 0.69 },
  ],
};

function highlightTriggers(text: string, triggers: string[]): React.ReactNode[] {
  if (!triggers.length) return [<span key="text">{text}</span>];
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  for (const trigger of triggers) {
    const idx = remaining.indexOf(trigger);
    if (idx === -1) continue;
    if (idx > 0) parts.push(<span key={keyIdx++}>{remaining.slice(0, idx)}</span>);
    parts.push(
      <span key={keyIdx++} className="bg-amber-200 text-amber-900 font-semibold px-0.5 rounded">
        {trigger}
      </span>
    );
    remaining = remaining.slice(idx + trigger.length);
  }
  if (remaining) parts.push(<span key={keyIdx++}>{remaining}</span>);
  return parts;
}

export function TermEventRoughDemo() {
  const [selectedText, setSelectedText] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState(0.7);

  const events = (MOCK_EVENTS[selectedText] || []).filter(e => e.confidence >= confThreshold);
  const triggers = events.map(e => e.trigger);

  const handleExtract = () => {
    setIsExtracting(true);
    setShowResults(false);
    setSelectedEvent(null);
    setTimeout(() => {
      setIsExtracting(false);
      setShowResults(true);
    }, 1200);
  };

  const handleSelectText = (idx: number) => {
    setSelectedText(idx);
    setShowResults(false);
    setSelectedEvent(null);
  };

  const argLabels: Record<keyof EventArg, { label: string; color: string }> = {
    agent: { label: '参与者 (Agent)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    patient: { label: '承受者 (Patient)', color: 'bg-green-100 text-green-800 border-green-200' },
    time: { label: '时间 (Time)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    location: { label: '地点 (Location)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  };

  const highlighted = showResults ? highlightTriggers(SAMPLE_TEXTS[selectedText], triggers) : [<span key="plain">{SAMPLE_TEXTS[selectedText]}</span>];

  return (
    <div className="space-y-5">
      {/* Input panel */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">待抽取文本</span>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 inline-block" />事件触发词</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {SAMPLE_TEXTS.map((_, i) => (
              <button key={i} onClick={() => handleSelectText(i)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedText === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                示例 {i + 1}
              </button>
            ))}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 leading-loose min-h-16">
            {highlighted}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs text-gray-500 whitespace-nowrap">置信度阈值</span>
              <input type="range" min={0.5} max={0.95} step={0.05} value={confThreshold}
                onChange={e => { setConfThreshold(parseFloat(e.target.value)); setShowResults(false); }}
                className="flex-1 accent-blue-600" />
              <span className="text-xs font-bold text-blue-600 w-8 text-right">{confThreshold.toFixed(2)}</span>
            </div>
            <button onClick={handleExtract} disabled={isExtracting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm rounded-lg transition-colors flex-shrink-0">
              {isExtracting ? (
                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />抽取中…</>
              ) : (
                <><Play className="w-3.5 h-3.5" />执行粗提取</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <div className="grid grid-cols-5 gap-4">
          {/* Event list */}
          <div className="col-span-2 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">识别到的事件</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{events.length} 个</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {events.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">当前阈值下无结果</div>
              )}
              {events.map(ev => {
                const isVV = ev.pos === 'VV';
                const argCount = Object.values(ev.args).filter(Boolean).length;
                return (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev.id)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${selectedEvent === ev.id ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-gray-900">{ev.trigger}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isVV ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                        {isVV ? '动词' : '名词'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>{argCount} 个论元</span>
                      <span className={`font-medium ${ev.confidence >= 0.85 ? 'text-green-600' : ev.confidence >= 0.75 ? 'text-blue-600' : 'text-amber-600'}`}>
                        置信度 {(ev.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event detail */}
          <div className="col-span-3 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-800">
                {selectedEvent ? `事件详情：${events.find(e => e.id === selectedEvent)?.trigger}` : '点击左侧事件查看详情'}
              </span>
            </div>
            {selectedEvent ? (() => {
              const ev = events.find(e => e.id === selectedEvent)!;
              const confPct = ev.confidence * 100;
              const barColor = ev.confidence >= 0.85 ? 'bg-green-400' : ev.confidence >= 0.75 ? 'bg-blue-400' : 'bg-amber-400';
              return (
                <div className="p-4 space-y-4">
                  {/* Trigger info */}
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex-1">
                      <div className="text-[10px] text-amber-600 font-medium mb-1">触发词 (Trigger)</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-amber-900">{ev.trigger}</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          {ev.pos === 'VV' ? '动词' : '名词'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-[10px] text-gray-500 mb-1 text-center">置信度</div>
                      <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                        style={{ borderColor: ev.confidence >= 0.85 ? '#4ade80' : ev.confidence >= 0.75 ? '#60a5fa' : '#fbbf24' }}>
                        <span className="text-base font-bold text-gray-800">{confPct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Arguments */}
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">论元框架 (Argument Frame)</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(argLabels) as [keyof EventArg, typeof argLabels[keyof EventArg]][]).map(([role, meta]) => (
                        <div key={role} className={`border rounded-lg p-2.5 ${ev.args[role] ? meta.color : 'border-gray-100 bg-gray-50'}`}>
                          <div className={`text-[10px] font-semibold mb-1 ${ev.args[role] ? '' : 'text-gray-400'}`}>{meta.label}</div>
                          {ev.args[role] ? (
                            <div className="text-sm font-medium">{ev.args[role]}</div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">未识别</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* JSON output preview */}
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1.5">输出结构 (JSON 半成品)</div>
                    <div className="bg-gray-900 rounded-lg p-3 text-[11px] font-mono text-green-300 overflow-auto max-h-32">
                      <pre>{JSON.stringify({ trigger: ev.trigger, trigger_pos: ev.pos, ...ev.args, confidence: ev.confidence, sentence_id: ev.sentenceId }, null, 2)}</pre>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                      <span className={`h-full block rounded-full ${barColor}`} style={{ width: `${confPct}%` }} />
                    </span>
                  </div>
                </div>
              );
            })() : (
              <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-2 h-48">
                <Search className="w-8 h-8 text-gray-300" />
                <span className="text-sm">从左侧选择一个事件查看详细论元信息</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats summary when results shown */}
      {showResults && events.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '识别事件数', value: events.length, sub: `阈值 ≥ ${confThreshold.toFixed(2)}` },
            { label: '动词触发词', value: events.filter(e => e.pos === 'VV').length, sub: '占比 ' + Math.round(events.filter(e => e.pos === 'VV').length / events.length * 100) + '%' },
            { label: '名词触发词', value: events.filter(e => e.pos === 'NN').length, sub: '占比 ' + Math.round(events.filter(e => e.pos === 'NN').length / events.length * 100) + '%' },
            { label: '平均论元数', value: (events.reduce((s, e) => s + Object.values(e.args).filter(Boolean).length, 0) / events.length).toFixed(1), sub: '参与者/承受者/时间/地点' },
          ].map(stat => (
            <div key={stat.label} className="border border-gray-200 rounded-xl p-3 text-center bg-white">
              <div className="text-2xl font-bold text-blue-700">{stat.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">{stat.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
