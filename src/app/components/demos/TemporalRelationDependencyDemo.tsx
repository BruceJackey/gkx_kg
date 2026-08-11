import { useState } from 'react';
import { Play, Loader2, ChevronRight, Clock, TrendingUp, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RelationType = 'before' | 'after' | 'during' | 'simultaneous' | 'includes' | 'vague';

interface ExtractedRelation {
  eventA: string;
  relation: RelationType;
  eventB: string;
  confidence: number;
  evidence: string;
}

interface DependencyPattern {
  antecedent: string;
  consequent: string;
  deltaT: string;
  probability: number;
  support: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const RELATION_COLORS: Record<RelationType, string> = {
  before: 'bg-blue-50 text-blue-700 border-blue-200',
  after: 'bg-purple-50 text-purple-700 border-purple-200',
  during: 'bg-green-50 text-green-700 border-green-200',
  simultaneous: 'bg-teal-50 text-teal-700 border-teal-200',
  includes: 'bg-orange-50 text-orange-700 border-orange-200',
  vague: 'bg-gray-100 text-gray-500 border-gray-200',
};

const RELATION_LABELS: Record<RelationType, string> = {
  before: 'BEFORE（先于）',
  after: 'AFTER（后于）',
  during: 'DURING（期间）',
  simultaneous: 'SIMULTANEOUS（同时）',
  includes: 'INCLUDES（包含）',
  vague: 'VAGUE（模糊）',
};

const EXAMPLE_TEXTS = [
  {
    label: '新闻事件',
    text: '2024年3月，该公司完成了A轮融资。融资完成后，团队规模迅速扩张，并于同年6月正式发布了首款产品。产品发布后的两个月内，用户数量突破了百万大关。',
  },
  {
    label: '医疗诊疗',
    text: '患者于1月5日出现发热症状，随后于1月7日进行血常规检查，检查结果异常后立即收住院治疗。住院期间，患者接受了抗病毒治疗，并于1月15日病情稳定后出院。',
  },
  {
    label: '工业故障',
    text: '系统在凌晨2点检测到温度传感器异常。在异常发生前30分钟，冷却水泵已出现流量下降。温度超限触发之后，安全阀自动开启，生产线随之停机。',
  },
];

const MOCK_EXTRACTION_RESULTS: ExtractedRelation[] = [
  { eventA: '完成A轮融资', relation: 'before', eventB: '团队规模扩张', confidence: 0.95, evidence: '融资完成后，团队规模迅速扩张' },
  { eventA: '团队规模扩张', relation: 'before', eventB: '首款产品发布', confidence: 0.91, evidence: '并于同年6月正式发布了首款产品' },
  { eventA: '首款产品发布', relation: 'before', eventB: '用户数突破百万', confidence: 0.88, evidence: '产品发布后的两个月内，用户数量突破了百万大关' },
  { eventA: '完成A轮融资', relation: 'before', eventB: '首款产品发布', confidence: 0.86, evidence: '融资→扩张→发布的事件链推断' },
];

const MOCK_DEPENDENCY_PATTERNS: DependencyPattern[] = [
  { antecedent: '融资完成', consequent: '产品发布', deltaT: '≤ 6个月', probability: 0.82, support: 1247 },
  { antecedent: '产品发布', consequent: '用户数突破里程碑', deltaT: '≤ 90天', probability: 0.74, support: 893 },
  { antecedent: '团队规模扩张', consequent: '产品发布', deltaT: '≤ 4个月', probability: 0.69, support: 612 },
  { antecedent: '融资完成', consequent: '团队规模扩张', deltaT: '≤ 30天', probability: 0.91, support: 1589 },
];

const TIMESTAMP_EXAMPLE = `[
  { "event": "温度传感器异常", "timestamp": "2026-01-15T02:00:00Z" },
  { "event": "冷却水泵流量下降", "timestamp": "2026-01-15T01:30:00Z" },
  { "event": "安全阀开启", "timestamp": "2026-01-15T02:03:00Z" },
  { "event": "生产线停机", "timestamp": "2026-01-15T02:05:00Z" },
  { "event": "温度传感器异常", "timestamp": "2026-02-03T14:10:00Z" },
  { "event": "冷却水泵流量下降", "timestamp": "2026-02-03T13:38:00Z" },
  { "event": "安全阀开启", "timestamp": "2026-02-03T14:14:00Z" }
]`;

const MOCK_TIMESTAMP_PATTERNS: DependencyPattern[] = [
  { antecedent: '冷却水泵流量下降', consequent: '温度传感器异常', deltaT: '≤ 35分钟', probability: 0.94, support: 87 },
  { antecedent: '温度传感器异常', consequent: '安全阀开启', deltaT: '≤ 5分钟', probability: 0.98, support: 112 },
  { antecedent: '安全阀开启', consequent: '生产线停机', deltaT: '≤ 3分钟', probability: 0.96, support: 98 },
  { antecedent: '冷却水泵流量下降', consequent: '生产线停机', deltaT: '≤ 40分钟', probability: 0.91, support: 81 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : 'bg-yellow-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">{pct}%</span>
    </div>
  );
}

function TimelineChain({ patterns }: { patterns: DependencyPattern[] }) {
  return (
    <div className="flex items-start gap-0 flex-wrap">
      {patterns.map((p, i) => (
        <div key={i} className="flex items-center gap-0">
          {i === 0 && (
            <div className="flex flex-col items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-xs font-semibold text-blue-800">{p.antecedent}</span>
            </div>
          )}
          <div className="flex flex-col items-center px-2">
            <div className="flex items-center gap-1">
              <div className="w-6 h-px bg-gray-300" />
              <ArrowRight size={12} className="text-gray-400" />
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5">{p.deltaT}</span>
            <span className="text-[10px] text-orange-500">P={Math.round(p.probability * 100)}%</span>
          </div>
          <div className="flex flex-col items-center px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-xs font-semibold text-green-800">{p.consequent}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab 1: 时序关系抽取 ──────────────────────────────────────────────────────

function ExtractionTab() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [inputText, setInputText] = useState(EXAMPLE_TEXTS[0].text);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setDone(false);
    setTimeout(() => { setRunning(false); setDone(true); }, 1600);
  };

  const handleExampleChange = (idx: number) => {
    setSelectedExample(idx);
    setInputText(EXAMPLE_TEXTS[idx].text);
    setDone(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
        从文本中自动识别事件对之间的显式时序关系，支持 <strong>before、after、during、includes、simultaneous、vague</strong> 六类标签，输出关系类型与置信度。
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">输入文本</label>
          <div className="flex gap-1">
            {EXAMPLE_TEXTS.map((ex, i) => (
              <button key={i} onClick={() => handleExampleChange(i)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${selectedExample === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {ex.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={inputText}
          onChange={e => { setInputText(e.target.value); setDone(false); }}
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
        />
      </div>

      <button onClick={handleRun} disabled={!inputText.trim() || running}
        className="flex items-center gap-2 text-sm px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors">
        {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
        {running ? '抽取中…' : '运行时序关系抽取'}
      </button>

      {done && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '识别事件数', value: '4 个' },
              { label: '关系对数', value: `${MOCK_EXTRACTION_RESULTS.length} 对` },
              { label: '平均置信度', value: '90%' },
            ].map(s => (
              <div key={s.label} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
                <div className="text-[11px] text-blue-500 mb-1">{s.label}</div>
                <div className="text-lg font-bold text-blue-800">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Results table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-500">抽取结果</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">事件 A</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">时序关系</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">事件 B</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5 w-36">置信度</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">依据</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_EXTRACTION_RESULTS.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-medium text-gray-800">{r.eventA}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${RELATION_COLORS[r.relation]}`}>
                        {RELATION_LABELS[r.relation]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-800">{r.eventB}</td>
                    <td className="px-4 py-3 w-36"><ConfidenceBar value={r.confidence} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px]">
                      <span title={r.evidence} className="line-clamp-2">{r.evidence}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline visualization */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-500 mb-3">事件链可视化（高置信度路径）</div>
            <div className="overflow-x-auto pb-1">
              <TimelineChain patterns={[
                { antecedent: 'A轮融资完成', consequent: '团队规模扩张', deltaT: '< 7天', probability: 0.95, support: 0 },
                { antecedent: '团队规模扩张', consequent: '产品发布', deltaT: '< 3月', probability: 0.91, support: 0 },
                { antecedent: '产品发布', consequent: '用户破百万', deltaT: '< 60天', probability: 0.88, support: 0 },
              ]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: 时序依赖分析 ──────────────────────────────────────────────────────

function DependencyTab() {
  const [tsInput, setTsInput] = useState(TIMESTAMP_EXAMPLE);
  const [minProb, setMinProb] = useState(0.7);
  const [maxDelta, setMaxDelta] = useState(60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setDone(false);
    setTimeout(() => { setRunning(false); setDone(true); }, 2000);
  };

  const filteredPatterns = MOCK_TIMESTAMP_PATTERNS.filter(p => p.probability >= minProb);

  return (
    <div className="space-y-5">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-xs text-orange-700 leading-relaxed">
        通过分析大量事件时间戳序列，挖掘隐含的概率性时序依赖模式，输出形如
        <strong>「事件 A → 事件 B（Δt ≤ N天，P = xx%）」</strong>的规律，可直接写入知识图谱用于下游推理与预警。
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">事件时间戳序列（JSON 格式）</label>
        <textarea
          value={tsInput}
          onChange={e => { setTsInput(e.target.value); setDone(false); }}
          rows={8}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
        />
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div>
          <label className="text-xs text-gray-500 mb-2 block">最小置信概率 P ≥ {Math.round(minProb * 100)}%</label>
          <input type="range" min={50} max={95} step={5} value={Math.round(minProb * 100)}
            onChange={e => setMinProb(Number(e.target.value) / 100)}
            className="w-full accent-blue-600" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>50%</span><span>95%</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-2 block">最大时间窗口 Δt ≤ {maxDelta} 分钟</label>
          <input type="range" min={5} max={120} step={5} value={maxDelta}
            onChange={e => setMaxDelta(Number(e.target.value))}
            className="w-full accent-orange-500" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>5min</span><span>120min</span>
          </div>
        </div>
      </div>

      <button onClick={handleRun} disabled={!tsInput.trim() || running}
        className="flex items-center gap-2 text-sm px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl transition-colors">
        {running ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />}
        {running ? '挖掘中…' : '运行时序依赖分析'}
      </button>

      {done && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '输入事件记录', value: '7 条' },
              { label: '唯一事件类型', value: '4 类' },
              { label: '发现依赖模式', value: `${filteredPatterns.length} 条` },
              { label: '最强依赖', value: 'P=98%' },
            ].map(s => (
              <div key={s.label} className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-center">
                <div className="text-[11px] text-orange-500 mb-1">{s.label}</div>
                <div className="text-lg font-bold text-orange-800">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Patterns */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">时序依赖模式（P ≥ {Math.round(minProb * 100)}%）</span>
              <span className="text-xs text-gray-400">{filteredPatterns.length} 条规则</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">前件事件 A</th>
                  <th className="text-xs font-medium text-gray-500 px-4 py-2.5">→</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">后件事件 B</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">时间窗口 Δt</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5 w-36">概率 P</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-2.5">支持度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatterns.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{p.antecedent}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ArrowRight size={14} className="text-gray-400 mx-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-800 bg-green-50 border border-green-100 px-2 py-0.5 rounded">{p.consequent}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">{p.deltaT}</span>
                    </td>
                    <td className="px-4 py-3 w-36"><ConfidenceBar value={p.probability} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.support} 次</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Causal chain */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-500 mb-3">推断的故障传播链</div>
            <div className="overflow-x-auto">
              <TimelineChain patterns={MOCK_TIMESTAMP_PATTERNS.slice(0, 3)} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <AlertCircle size={13} className="flex-shrink-0" />
            发现的依赖模式可通过「图谱增强」功能直接写入知识图谱，为实体间自动添加带时间属性的有向边。
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Demo Component ──────────────────────────────────────────────────────

export function TemporalRelationDependencyDemo() {
  const [tab, setTab] = useState<'extraction' | 'dependency'>('extraction');

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('extraction')}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors ${tab === 'extraction' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
          <Clock size={14} />
          时序关系抽取
        </button>
        <button onClick={() => setTab('dependency')}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors ${tab === 'dependency' ? 'bg-white text-orange-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
          <TrendingUp size={14} />
          时序依赖分析
        </button>
      </div>

      {tab === 'extraction' && <ExtractionTab />}
      {tab === 'dependency' && <DependencyTab />}
    </div>
  );
}
