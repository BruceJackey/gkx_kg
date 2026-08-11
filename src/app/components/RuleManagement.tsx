import { useState, useRef, useCallback, type ReactNode } from 'react';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Cell, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, CartesianGrid, ReferenceLine,
} from 'recharts';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Plus, Edit2, Trash2, Copy, ChevronLeft,
  GripVertical, X, Check, AlertCircle, GitMerge, Zap,
  Filter, ArrowRight, ToggleLeft, Hash, Tag, Calendar,
  Search, Shield, CircleDot, ChevronDown,
  ScanSearch, GitBranch, Network, RefreshCw, Loader2,
  ChevronRight, AlertTriangle, CheckCircle2, Clock,
  ArrowDown, Layers, Share2, Bot, Code2, ChevronUp,
  FileJson, PlayCircle, SquareCheck, Eye, RotateCcw, History,
  Wand2, MousePointerClick
} from 'lucide-react';

// ─── DSL Syntax Highlighted Editor ───────────────────────────────────────────

const DSL_KEYWORDS = ['WHEN','IF','THEN','AND','OR','NOT','MATCH','WHERE','CREATE','SET','RETURN','rule_key','pattern','condition','action','params','type','from','to','properties','confidence'];
const DSL_ACTIONS = ['create_relation','add_tag','set_property','send_alert','mark_review'];

function highlightDsl(code: string): string {
  // escape HTML first
  const esc = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return esc
    // strings
    .replace(/"([^"]*)"/g, '<span style="color:#d97706">"$1"</span>')
    // numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#16a34a">$1</span>')
    // boolean / null
    .replace(/\b(true|false|null)\b/g, '<span style="color:#7c3aed">$1</span>')
    // action values
    .replace(new RegExp(`\\b(${DSL_ACTIONS.join('|')})\\b`, 'g'), '<span style="color:#0891b2;font-weight:600">$1</span>')
    // keywords
    .replace(new RegExp(`\\b(${DSL_KEYWORDS.join('|')})\\b`, 'g'), '<span style="color:#2563eb;font-weight:600">$1</span>')
    // property keys (word before colon in JSON)
    .replace(/("(?:[^"]+)")(\s*:)/g, '<span style="color:#0369a1">$1</span>$2')
    // regex-like patterns
    .replace(/(\(\?P&lt;[^&]+&gt;)/g, '<span style="color:#9333ea">$1</span>')
    // comments (#...)
    .replace(/(#[^\n]*)/g, '<span style="color:#9ca3af;font-style:italic">$1</span>');
}

const DSL_AUTOCOMPLETE_WORDS = [
  ...DSL_KEYWORDS,
  ...DSL_ACTIONS,
  'entity_type', 'entity_name', 'relation_type', 'property.confidence',
  'property.source', 'tag', 'A.id', 'B.id', 'C.id',
];

function DslHighlightedEditor({
  value, onChange, placeholder, rows = 8,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSug, setSelectedSug] = useState(0);

  const highlighted = highlightDsl(value);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSug(s => Math.min(s + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSug(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      applySuggestion(suggestions[selectedSug]);
    } else if (e.key === 'Escape') { setSuggestions([]); }
  };

  const applySuggestion = (word: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const before = value.slice(0, pos);
    const after = value.slice(pos);
    const wordMatch = before.match(/[\w.]+$/);
    const replaceStart = wordMatch ? pos - wordMatch[0].length : pos;
    const next = value.slice(0, replaceStart) + word + after;
    onChange(next);
    setSuggestions([]);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = replaceStart + word.length;
      ta.focus();
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    onChange(v);
    const pos = e.target.selectionStart;
    const before = v.slice(0, pos);
    const wordMatch = before.match(/[\w.]+$/);
    if (wordMatch && wordMatch[0].length >= 2) {
      const prefix = wordMatch[0].toLowerCase();
      const hits = DSL_AUTOCOMPLETE_WORDS.filter(w => w.toLowerCase().startsWith(prefix) && w.toLowerCase() !== prefix);
      setSuggestions(hits.slice(0, 6));
      setSelectedSug(0);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="relative">
      <div className="relative font-mono text-xs rounded-lg border border-gray-200 focus-within:border-blue-400 bg-gray-900 overflow-hidden" style={{ minHeight: `${rows * 1.5 + 1}rem` }}>
        {/* Highlighted display layer */}
        <pre
          aria-hidden
          className="absolute inset-0 p-3 text-xs font-mono whitespace-pre-wrap break-all pointer-events-none overflow-hidden text-gray-100 leading-[1.5rem]"
          dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
        />
        {/* Transparent editable layer */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={rows}
          placeholder={placeholder}
          spellCheck={false}
          className="relative w-full bg-transparent text-transparent caret-gray-100 p-3 text-xs font-mono resize-none focus:outline-none leading-[1.5rem]"
          style={{ caretColor: '#f3f4f6' }}
        />
      </div>
      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute left-3 top-full mt-0.5 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-40">
          {suggestions.map((s, i) => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); applySuggestion(s); }}
              className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${i === selectedSug ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Agent Drawer constants ───────────────────────────────────────────────────

const NL_EXAMPLE = `当论文实体的作者 A 和作者 C 同时是同一篇论文 B 的共同作者（即 A 和 C 各自通过"WRITTEN_BY"关系连接到同一篇论文 B），则推断 A 与 C 之间存在"合作者"关系，并写入知识图谱。

适用场景：科研合作关系网络构建，用于发现潜在合作伙伴或分析学术合作模式。
约束条件：A ≠ C（排除自我关联）。`;

const MOCK_PARSE_TRACE = `[Agent] 接收到规则描述，开始解析...
[Step 1] 识别规则类型: 关系发现 (confidence=0.97)
[Step 2] 提取实体节点: A:作者, B:论文, C:作者
[Step 3] 提取路径模式:
         A -[WRITTEN_BY]-> B <-[WRITTEN_BY]- C
[Step 4] 提取约束条件: A.id ≠ C.id（防止自我关联）
[Step 5] 生成推断动作:
         create_relation(type=合作者, from=A, to=C)
[Step 6] 白名单校验:
         ✓ entity_types 合法 (作者, 论文)
         ✓ relation_type "合作者" 已注册
         ✓ 路径深度 ≤ 3，符合执行限制
[Step 7] 生成 DSL 草稿完成 → rule_key=coauthor_relation_infer`;

const MOCK_DSL = JSON.stringify({
  rule_key: 'coauthor_relation_infer',
  name: '论文合著者关系推断',
  type: '关系发现',
  domain: '科研',
  priority: 80,
  when: {
    pattern: '(?P<A>作者)-[:WRITTEN_BY]->(?P<B>论文)<-[:WRITTEN_BY]-(?P<C>作者)',
    condition: 'A.id != C.id',
  },
  then: {
    action: 'create_relation',
    params: { type: '合作者', from: 'A', to: 'C', properties: { via_paper: 'B.id', confidence: 0.95 } },
  },
}, null, 2);

const FACTS_EXAMPLE = JSON.stringify([
  { subject: '作者:张三', predicate: 'WRITTEN_BY', object: '论文:深度学习新进展', properties: { order: 1 } },
  { subject: '作者:李四', predicate: 'WRITTEN_BY', object: '论文:深度学习新进展', properties: { order: 2 } },
  { subject: '作者:王五', predicate: 'WRITTEN_BY', object: '论文:图神经网络综述', properties: { order: 1 } },
  { subject: '作者:张三', predicate: 'WRITTEN_BY', object: '论文:图神经网络综述', properties: { order: 2 } },
], null, 2);

const SANDBOX_TRACE = `[Sandbox] 加载 4 条 facts，构建临时图...
[Match 1] 张三 →WRITTEN_BY→ 深度学习新进展 ←WRITTEN_BY← 李四
          → 满足约束 A≠C → 创建: 张三 →合作者→ 李四
[Match 2] 李四 →WRITTEN_BY→ 深度学习新进展 ←WRITTEN_BY← 张三
          → 反向已存在，跳过去重
[Match 3] 王五 →WRITTEN_BY→ 图神经网络综述 ←WRITTEN_BY← 张三
          → 满足约束 A≠C → 创建: 王五 →合作者→ 张三
[Complete] 命中 3 次，去重后输出 2 条新关系
[NOTE] ⚠ 不写入真实图数据库，仅沙箱环境`;

// ─── Agent Drawer Component ───────────────────────────────────────────────────

function AgentRuleDrawer({
  rule,
  isNew,
  onClose,
  onSave,
}: {
  rule: Rule;
  isNew: boolean;
  onClose: () => void;
  onSave: (r: Rule) => void;
}) {
  const [drawerMode, setDrawerMode] = useState<'agent' | 'visual' | 'manual'>(isNew ? 'agent' : 'manual');

  // Agent state
  const [nlText, setNlText] = useState(NL_EXAMPLE);
  const [isParsing, setIsParsing] = useState(false);
  const [parseDone, setParseDone] = useState(false);
  const [draftDsl, setDraftDsl] = useState('');
  const [factsJson, setFactsJson] = useState(FACTS_EXAMPLE);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const [sandboxDone, setSandboxDone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Manual DSL state
  const [draft, setDraft] = useState<Rule>(JSON.parse(JSON.stringify(rule)));
  const [whenJson, setWhenJson] = useState(JSON.stringify({ pattern: '', condition: '' }, null, 2));
  const [thenJson, setThenJson] = useState(JSON.stringify({ action: 'create_relation', params: {} }, null, 2));
  const [manualFactsJson, setManualFactsJson] = useState(FACTS_EXAMPLE);
  const [manualSandboxRunning, setManualSandboxRunning] = useState(false);
  const [manualSandboxDone, setManualSandboxDone] = useState(false);
  const [manualSandboxConfirmed, setManualSandboxConfirmed] = useState(false);

  const updateMeta = (patch: Partial<Rule>) => setDraft(d => ({ ...d, ...patch }));

  const handleParse = () => {
    setIsParsing(true);
    setParseDone(false);
    setTimeout(() => { setIsParsing(false); setParseDone(true); setDraftDsl(MOCK_DSL); }, 2200);
  };

  const handleSandbox = () => {
    setIsSandboxRunning(true);
    setSandboxDone(false);
    setTimeout(() => { setIsSandboxRunning(false); setSandboxDone(true); }, 1800);
  };

  const agentCanSave = parseDone && sandboxDone && confirmed;
  const manualCanSave = manualSandboxDone && manualSandboxConfirmed;
  const canSave = drawerMode === 'agent' ? agentCanSave : drawerMode === 'visual' ? true : manualCanSave;

  const saveHint = drawerMode === 'agent'
    ? (!parseDone ? '尚未解析' : !sandboxDone ? '尚未试跑' : !confirmed ? '尚未确认' : '')
    : drawerMode === 'visual' ? ''
    : (!manualSandboxDone ? '尚未完成沙箱试跑' : !manualSandboxConfirmed ? '尚未确认' : '');

  const parsedName = parseDone ? '论文合著者关系推断' : '';
  const parsedKey = parseDone ? 'coauthor_relation_infer' : '';

  const kgCorePreview = JSON.stringify({
    op: isNew ? 'rule.create' : 'rule.update',
    version: 'v2',
    payload: {
      name: drawerMode === 'agent' ? (parsedName || '(待解析)') : (draft.name || '(未填写)'),
      rule_key: drawerMode === 'agent' ? (parsedKey || '(待解析)') : draft.id,
      type: drawerMode === 'agent' ? '关系发现' : draft.category,
      domain: '科研',
      status: draft.status,
    },
  }, null, 2);

  // Step card style helper
  const stepCard = (step: number, title: string, locked: boolean, children: ReactNode) => (
    <div className={`border rounded-xl transition-colors ${locked ? 'border-gray-100 bg-gray-50/50 opacity-60' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-inherit">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${locked ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white'}`}>
          {step}
        </div>
        <span className={`text-sm font-semibold ${locked ? 'text-gray-400' : 'text-gray-800'}`}>{title}</span>
      </div>
      <div className={`p-5 ${locked ? 'pointer-events-none select-none' : ''}`}>{children}</div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25 z-40" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl" style={{ width: '940px' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isNew ? '新增规则' : `编辑规则 · ${rule.name}`}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">用自然语言编排、沙箱验证，再确认保存</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mode tabs */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
                <button onClick={() => setDrawerMode('agent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${drawerMode === 'agent' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Bot className="w-3.5 h-3.5" />Agent 编排
                </button>
                <button onClick={() => setDrawerMode('visual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors border-l border-gray-200 ${drawerMode === 'visual' ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <MousePointerClick className="w-3.5 h-3.5" />可视化编辑器
                </button>
                <button onClick={() => setDrawerMode('manual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors border-l border-gray-200 ${drawerMode === 'manual' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Code2 className="w-3.5 h-3.5" />手动 DSL
                </button>
              </div>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── Agent mode ── */}
          {drawerMode === 'agent' && (
            <>
              {/* Step 1: NL description */}
              {stepCard(1, '自然语言描述', false, (
                <div className="space-y-3">
                  <textarea
                    value={nlText}
                    onChange={e => setNlText(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <button onClick={handleParse} disabled={!nlText.trim() || isParsing}
                      className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                      {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                      {isParsing ? 'Agent 解析中…' : 'Agent 解析'}
                    </button>
                    <p className="text-xs text-gray-400">修改描述后需重新解析、试跑、确认</p>
                  </div>
                </div>
              ))}

              {/* Step 2: Parse trace + DSL */}
              {stepCard(2, '解析轨迹与可执行规则', !parseDone && !isParsing, (
                parseDone ? (
                  <div className="space-y-4">
                    {/* Summary 4-grid */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: '规则名称', value: '论文合著者关系推断' },
                        { label: 'rule_key', value: 'coauthor_relation_infer' },
                        { label: '类型 · Domain', value: '关系发现 · 科研' },
                        { label: 'then.action', value: 'create_relation(合作者)' },
                      ].map(s => (
                        <div key={s.label} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <div className="text-[10px] text-blue-500 mb-0.5">{s.label}</div>
                          <div className="text-xs text-gray-800 font-medium">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Trace + DSL side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-600">Agent 解析轨迹</span>
                        </div>
                        <pre className="bg-gray-900 text-green-400 text-[11px] leading-relaxed p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono h-48 overflow-y-auto">
                          {MOCK_PARSE_TRACE}
                        </pre>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-600">可执行 DSL（可编辑）</span>
                          <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">✓ 白名单校验通过</span>
                        </div>
                        <textarea
                          value={draftDsl}
                          onChange={e => setDraftDsl(e.target.value)}
                          className="w-full h-48 bg-gray-900 text-blue-300 text-[11px] font-mono p-3 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>

                    <button onClick={() => setDrawerMode('manual')}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                      切换手动模式精修元数据 →
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400 py-2">
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Clock className="w-4 h-4" />}
                    <span className="text-sm">{isParsing ? '正在解析…' : '等待解析'}</span>
                  </div>
                )
              ))}

              {/* Step 3: Facts input */}
              {stepCard(3, '事实输入 JSON', !parseDone, (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">输入小规模 facts 数组用于沙箱验证。每项字段：subject / predicate / object / properties</p>
                  <textarea
                    value={factsJson}
                    onChange={e => setFactsJson(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
                  />
                </div>
              ))}

              {/* Step 4: Sandbox */}
              {stepCard(4, '无副作用沙箱执行', !parseDone, (
                <div className="space-y-4">
                  <button onClick={handleSandbox} disabled={!factsJson.trim() || isSandboxRunning}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                    {isSandboxRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                    {isSandboxRunning ? '执行中…' : '执行沙箱试跑'}
                  </button>

                  {sandboxDone && (
                    <div className="space-y-3">
                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: '输入 facts', value: '4 条' },
                          { label: '临时节点', value: '3 作者 + 2 论文' },
                          { label: '条件命中', value: '3 次' },
                          { label: '输出结果', value: '2 条新关系' },
                        ].map(s => (
                          <div key={s.label} className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                            <div className="text-[10px] text-orange-500 mb-0.5">{s.label}</div>
                            <div className="text-xs text-gray-800 font-medium">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Trace + output */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">逐步 trace</div>
                          <pre className="bg-gray-900 text-amber-300 text-[11px] leading-relaxed p-3 rounded-lg h-36 overflow-y-auto font-mono whitespace-pre-wrap">
                            {SANDBOX_TRACE}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">输出 JSON</div>
                          <pre className="bg-gray-900 text-green-400 text-[11px] leading-relaxed p-3 rounded-lg h-36 overflow-y-auto font-mono">
                            {JSON.stringify({ output: [{ from: '张三', relation: '合作者', to: '李四' }, { from: '王五', relation: '合作者', to: '张三' }], count: 2, sandbox: true }, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        沙箱模式：不写入真实图数据库，结果仅供验证
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Step 5: Confirmation */}
              {stepCard(5, '人工确认', !sandboxDone, (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    我已检查解析轨迹、当前 DSL 和沙箱输出，确认规则逻辑正确，可以保存至规则库。
                  </span>
                </label>
              ))}
            </>
          )}

          {/* ── Visual editor mode ── */}
          {drawerMode === 'visual' && (
            <div className="space-y-5">
              {/* Intro banner */}
              <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                <Wand2 className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-800">图形化规则构建</p>
                  <p className="text-xs text-violet-600 mt-0.5">通过拖拽和配置即可定义规则，无需编写代码。完成后可一键转为 DSL 精修。</p>
                </div>
              </div>

              {/* STEP 1: Metadata */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <span className="text-sm font-semibold text-gray-700">基本信息</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">规则名称</label>
                    <input value={draft.name} onChange={e => updateMeta({ name: e.target.value })} placeholder="输入规则名称…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">类型</label>
                    <select value={draft.category} onChange={e => updateMeta({ category: e.target.value as any })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white">
                      {['实体类', '属性类', '关系类', '关系发现'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">触发时机</label>
                    <select value={draft.trigger} onChange={e => updateMeta({ trigger: e.target.value as any })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white">
                      <option value="entity_create">实体创建</option>
                      <option value="entity_update">实体更新</option>
                      <option value="relation_create">关系创建</option>
                      <option value="manual">手动触发</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">状态</label>
                    <select value={draft.status} onChange={e => updateMeta({ status: e.target.value as any })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white">
                      <option value="draft">草稿</option>
                      <option value="active">运行中</option>
                      <option value="inactive">已停用</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">描述</label>
                    <textarea value={draft.description} onChange={e => updateMeta({ description: e.target.value })}
                      placeholder="描述规则用途…" rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" />
                  </div>
                </div>
              </div>

              {/* STEP 2: Trigger block */}
              <div className="border border-violet-200 rounded-xl overflow-hidden">
                <div className="bg-violet-50 px-4 py-2.5 border-b border-violet-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <Zap className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-700">触发器 WHEN</span>
                  <span className="text-xs text-violet-400 ml-1">— 什么时候触发这条规则</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {(['entity_create','entity_update','relation_create','manual'] as const).map(t => {
                    const labels = { entity_create:'实体创建', entity_update:'实体更新', relation_create:'关系创建', manual:'手动触发' };
                    const active = draft.trigger === t;
                    return (
                      <button key={t} onClick={() => updateMeta({ trigger: t })}
                        className={`px-3.5 py-2 rounded-lg border-2 text-sm font-medium transition-all ${active ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-violet-300'}`}>
                        {labels[t]}
                        {active && <Check className="w-3.5 h-3.5 inline ml-1.5 text-violet-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Conditions */}
              <div className="border border-blue-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">条件 IF</span>
                  <span className="text-xs text-blue-400 ml-1">— 满足以下条件时才执行动作（可拖拽排序）</span>
                </div>
                <div className="p-4">
                  <ConditionGroupBlock
                    group={draft.conditionGroup}
                    depth={0}
                    onUpdateGroup={g => setDraft(d => ({ ...d, conditionGroup: g }))}
                  />
                </div>
              </div>

              {/* Arrow connector */}
              <div className="flex items-center gap-2 -my-1">
                <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-green-200" />
                <span className="text-[11px] text-gray-400 bg-white px-2 py-1 border border-gray-200 rounded-full">条件满足 →</span>
                <div className="flex-1 h-px bg-gradient-to-r from-green-200 to-yellow-200" />
              </div>

              {/* STEP 4: Actions */}
              <div className="border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">4</span>
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">动作 THEN</span>
                    <span className="text-xs text-amber-400 ml-1">— 顺序执行，可拖拽调整</span>
                  </div>
                  {/* Action palette */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['add_tag','set_property','create_relation','send_alert','mark_review'] as const).map(t => {
                      const labels = { add_tag:'添加标签', set_property:'设置属性', create_relation:'创建关系', send_alert:'发送告警', mark_review:'标记审核' };
                      return (
                        <button key={t}
                          onClick={() => setDraft(d => ({ ...d, actions: [...d.actions, { id: uid(), type: t, params: {} }] }))}
                          className="text-[11px] px-2 py-1 border border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1">
                          <Plus className="w-2.5 h-2.5" />{labels[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {draft.actions.length === 0 && (
                    <div className="border-2 border-dashed border-amber-200 rounded-xl py-8 flex flex-col items-center gap-2 text-amber-300">
                      <Zap className="w-6 h-6 opacity-40" />
                      <span className="text-xs">点击上方按钮添加动作</span>
                    </div>
                  )}
                  {draft.actions.map((action, idx) => (
                    <ActionBlock
                      key={action.id}
                      action={action}
                      index={idx}
                      onUpdate={(id, patch) => setDraft(d => ({ ...d, actions: d.actions.map(a => a.id === id ? { ...a, ...patch } : a) }))}
                      onRemove={(id) => setDraft(d => ({ ...d, actions: d.actions.filter(a => a.id !== id) }))}
                      onMove={(di, hi) => setDraft(d => {
                        const acts = [...d.actions];
                        const [item] = acts.splice(di, 1);
                        acts.splice(hi, 0, item);
                        return { ...d, actions: acts };
                      })}
                    />
                  ))}
                </div>
              </div>

              {/* Convert to DSL button */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Code2 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 flex-1">规则已可保存，也可切换到「手动 DSL」进行精修</span>
                <button onClick={() => setDrawerMode('manual')}
                  className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 hover:bg-white rounded-lg transition-colors">
                  切换到 DSL 精修 →
                </button>
              </div>
            </div>
          )}

          {/* ── Manual DSL mode ── */}
          {drawerMode === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">规则名称</label>
                  <input value={draft.name} onChange={e => updateMeta({ name: e.target.value })} placeholder="输入规则名称…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">规则标识 (rule_key)</label>
                  <input value={draft.id.startsWith('__') ? '' : draft.id} onChange={() => {}}
                    placeholder="如：coauthor_infer"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">类型</label>
                  <select value={draft.category} onChange={e => updateMeta({ category: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    {['实体类', '属性类', '关系类', '关系发现'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">状态</label>
                  <select value={draft.status} onChange={e => updateMeta({ status: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option value="draft">草稿</option>
                    <option value="active">运行中</option>
                    <option value="inactive">已停用</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Domain</label>
                  <input placeholder="如：科研" defaultValue="科研"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">责任方</label>
                  <input placeholder="如：数据工程团队"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">优先级</label>
                  <input type="number" placeholder="80" min={0} max={100}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">触发事件</label>
                  <select value={draft.trigger} onChange={e => updateMeta({ trigger: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option value="entity_create">实体创建</option>
                    <option value="entity_update">实体更新</option>
                    <option value="relation_create">关系创建</option>
                    <option value="manual">手动触发</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">来源</label>
                <input placeholder="如：规则库 v2 / Agent 自动生成"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500">when JSON</label>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">语法高亮 · Tab 补全</span>
                  </div>
                  <DslHighlightedEditor value={whenJson} onChange={setWhenJson} rows={7} placeholder={`{\n  "pattern": "...",\n  "condition": "..."\n}`} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500">then JSON</label>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">语法高亮 · Tab 补全</span>
                  </div>
                  <DslHighlightedEditor value={thenJson} onChange={setThenJson} rows={7} placeholder={`{\n  "action": "create_relation",\n  "params": {}\n}`} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">事实谓词范围（逗号分隔）</label>
                <input placeholder="如：WRITTEN_BY, AFFILIATED_WITH"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">说明</label>
                <textarea value={draft.description} onChange={e => updateMeta({ description: e.target.value })} rows={3}
                  placeholder="规则用途说明…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              </div>

              {/* ── Sandbox steps for manual mode ── */}
              {stepCard(1, '事实输入 JSON', false, (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">输入小规模 facts 数组验证 DSL 正确性。每项字段：subject / predicate / object / properties</p>
                  <textarea
                    value={manualFactsJson}
                    onChange={e => { setManualFactsJson(e.target.value); setManualSandboxDone(false); setManualSandboxConfirmed(false); }}
                    rows={8}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
                  />
                </div>
              ))}

              {stepCard(2, '无副作用沙箱执行', false, (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setManualSandboxRunning(true);
                      setManualSandboxDone(false);
                      setManualSandboxConfirmed(false);
                      setTimeout(() => { setManualSandboxRunning(false); setManualSandboxDone(true); }, 1800);
                    }}
                    disabled={!manualFactsJson.trim() || manualSandboxRunning}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {manualSandboxRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                    {manualSandboxRunning ? '执行中…' : '执行沙箱试跑'}
                  </button>

                  {manualSandboxDone && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: '输入 facts', value: '4 条' },
                          { label: '临时节点', value: '3 作者 + 2 论文' },
                          { label: '条件命中', value: '3 次' },
                          { label: '输出结果', value: '2 条新关系' },
                        ].map(s => (
                          <div key={s.label} className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                            <div className="text-[10px] text-orange-500 mb-0.5">{s.label}</div>
                            <div className="text-xs text-gray-800 font-medium">{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">逐步 trace</div>
                          <pre className="bg-gray-900 text-amber-300 text-[11px] leading-relaxed p-3 rounded-lg h-36 overflow-y-auto font-mono whitespace-pre-wrap">
                            {SANDBOX_TRACE}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">输出 JSON</div>
                          <pre className="bg-gray-900 text-green-400 text-[11px] leading-relaxed p-3 rounded-lg h-36 overflow-y-auto font-mono">
                            {JSON.stringify({ output: [{ from: '张三', relation: '合作者', to: '李四' }, { from: '王五', relation: '合作者', to: '张三' }], count: 2, sandbox: true }, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        沙箱模式：不写入真实图数据库，结果仅供验证
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {stepCard(3, '人工确认', !manualSandboxDone, (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={manualSandboxConfirmed} onChange={e => setManualSandboxConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 w-4 h-4 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    我已检查当前 DSL 和沙箱输出，确认规则逻辑正确，可以保存至规则库。
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 space-y-3 bg-gray-50">
          {/* kg_core preview */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
              <FileJson className="w-3.5 h-3.5" />kg_core 请求预览
            </div>
            <pre className="bg-gray-900 text-gray-300 text-[11px] font-mono p-3 rounded-lg overflow-x-auto max-h-20">
              {kgCorePreview}
            </pre>
          </div>

          {/* Save hint bar */}
          {!canSave && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {saveHint || '完成以上步骤后方可保存'}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose}
              className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              取消
            </button>
            <button
              disabled={drawerMode === 'agent' && !canSave}
              onClick={() => { onSave(draft); onClose(); }}
              className="text-sm px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors">
              按当前状态保存
            </button>
            <button
              disabled={drawerMode === 'agent' && !canSave}
              onClick={() => { onSave({ ...draft, status: 'active' }); onClose(); }}
              className="text-sm px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1.5">
              <Check className="w-4 h-4" />保存并发布
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'exists' | 'not_exists';
type LogicOp = 'AND' | 'OR';
type TriggerType = 'entity_create' | 'entity_update' | 'relation_create' | 'manual';
type ActionType = 'add_tag' | 'set_property' | 'create_relation' | 'send_alert' | 'mark_review';
type RuleStatus = 'active' | 'inactive' | 'draft';
type RuleCategory = '实体类' | '属性类' | '关系类' | '关系发现';

interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

interface ConditionGroup {
  id: string;
  logic: LogicOp;
  conditions: (Condition | ConditionGroup)[];
}

interface Action {
  id: string;
  type: ActionType;
  params: Record<string, string>;
}

interface PathNode {
  label: string;
  type: string;
  color: string;
}

interface PathEdge {
  label: string;
  variable?: string;
}

interface RelationDiscoveryPattern {
  nodes: PathNode[];
  edges: PathEdge[];
  inferredEdge: { from: number; to: number; label: string };
  condition?: string;
}

interface RuleVersion {
  version: string;       // e.g. "v3"
  savedAt: string;
  author: string;
  summary: string;
  dsl: string;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  status: RuleStatus;
  category: RuleCategory;
  trigger: TriggerType;
  conditionGroup: ConditionGroup;
  actions: Action[];
  createdAt: string;
  updatedAt: string;
  discoveryPattern?: RelationDiscoveryPattern;
  versions?: RuleVersion[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<TriggerType, string> = {
  entity_create: '实体创建',
  entity_update: '实体更新',
  relation_create: '关系创建',
  manual: '手动触发',
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: '等于',
  not_equals: '不等于',
  contains: '包含',
  not_contains: '不包含',
  gt: '大于',
  lt: '小于',
  gte: '大于等于',
  lte: '小于等于',
  exists: '存在',
  not_exists: '不存在',
};

const ACTION_LABELS: Record<ActionType, string> = {
  add_tag: '添加标签',
  set_property: '设置属性',
  create_relation: '创建关系',
  send_alert: '发送告警',
  mark_review: '标记审核',
};

const ACTION_COLORS: Record<ActionType, string> = {
  add_tag: 'bg-blue-50 text-blue-600 border-blue-200',
  set_property: 'bg-purple-50 text-purple-600 border-purple-200',
  create_relation: 'bg-green-50 text-green-600 border-green-200',
  send_alert: 'bg-red-50 text-red-600 border-red-200',
  mark_review: 'bg-yellow-50 text-yellow-600 border-yellow-200',
};

const FIELD_OPTIONS = [
  { value: 'entity_type', label: '实体类型' },
  { value: 'entity_name', label: '实体名称' },
  { value: 'property.confidence', label: '置信度' },
  { value: 'property.source', label: '来源' },
  { value: 'property.created_at', label: '创建时间' },
  { value: 'relation_type', label: '关系类型' },
  { value: 'tag', label: '标签' },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const newCondition = (): Condition => ({
  id: uid(),
  field: 'entity_type',
  operator: 'equals',
  value: '',
});

const newGroup = (logic: LogicOp = 'AND'): ConditionGroup => ({
  id: uid(),
  logic,
  conditions: [newCondition()],
});

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockRules: Rule[] = [
  {
    id: 'R001',
    name: '人物实体质量检测',
    description: '当人物实体置信度低于 0.6 时，自动标记为待审核并发送告警。',
    status: 'active',
    category: '实体类',
    trigger: 'entity_create',
    conditionGroup: {
      id: uid(), logic: 'AND',
      conditions: [
        { id: uid(), field: 'entity_type', operator: 'equals', value: '人物' },
        { id: uid(), field: 'property.confidence', operator: 'lt', value: '0.6' },
      ],
    },
    actions: [
      { id: uid(), type: 'mark_review', params: { reason: '低置信度实体' } },
      { id: uid(), type: 'send_alert', params: { message: '发现低置信度人物实体' } },
    ],
    createdAt: '2026-05-10 09:00',
    updatedAt: '2026-06-01 14:22',
    versions: [
      { version: 'v3', savedAt: '2026-06-01 14:22', author: '张明', summary: '将置信度阈值从 0.5 调整为 0.6，减少误报', dsl: '{"rule_key":"R001","when":{"pattern":"(?P<E>人物)","condition":"E.confidence < 0.6"},"then":{"action":"mark_review","params":{"reason":"低置信度实体"}}}' },
      { version: 'v2', savedAt: '2026-05-20 10:15', author: '李华', summary: '增加 send_alert 动作，触发告警通知', dsl: '{"rule_key":"R001","when":{"pattern":"(?P<E>人物)","condition":"E.confidence < 0.5"},"then":{"action":"mark_review"}}' },
      { version: 'v1', savedAt: '2026-05-10 09:00', author: '张明', summary: '初始版本，仅标记审核不发送告警', dsl: '{"rule_key":"R001","when":{"pattern":"(?P<E>人物)","condition":"E.confidence < 0.5"},"then":{"action":"mark_review"}}' },
    ],
  },
  {
    id: 'R002',
    name: '组织关系自动打标',
    description: '当新关系类型为"隶属于"时，自动为来源实体添加"机构成员"标签。',
    status: 'active',
    category: '关系类',
    trigger: 'relation_create',
    conditionGroup: {
      id: uid(), logic: 'AND',
      conditions: [
        { id: uid(), field: 'relation_type', operator: 'equals', value: '隶属于' },
      ],
    },
    actions: [
      { id: uid(), type: 'add_tag', params: { tag: '机构成员' } },
    ],
    createdAt: '2026-05-15 11:30',
    updatedAt: '2026-05-28 16:10',
    versions: [
      { version: 'v2', savedAt: '2026-05-28 16:10', author: '王芳', summary: '扩展触发条件，支持"附属于"关系类型', dsl: '{"rule_key":"R002","when":{"pattern":"(?P<R>关系)","condition":"R.type == 隶属于 OR R.type == 附属于"},"then":{"action":"add_tag","params":{"tag":"机构成员"}}}' },
      { version: 'v1', savedAt: '2026-05-15 11:30', author: '王芳', summary: '初始版本', dsl: '{"rule_key":"R002","when":{"pattern":"(?P<R>关系)","condition":"R.type == 隶属于"},"then":{"action":"add_tag","params":{"tag":"机构成员"}}}' },
    ],
  },
  {
    id: 'R003',
    name: '专利实体去重检测',
    description: '检测名称重复的专利实体并标记审核。',
    status: 'draft',
    category: '实体类',
    trigger: 'entity_update',
    conditionGroup: {
      id: uid(), logic: 'AND',
      conditions: [
        { id: uid(), field: 'entity_type', operator: 'equals', value: '专利' },
        { id: uid(), field: 'property.source', operator: 'contains', value: '外部导入' },
      ],
    },
    actions: [
      { id: uid(), type: 'mark_review', params: { reason: '疑似重复专利' } },
    ],
    createdAt: '2026-06-02 08:45',
    updatedAt: '2026-06-02 08:45',

  },
  {
    id: 'R005',
    name: '项目成员同事关系推断',
    description: '若 A 与 C 同时作为"项目成员"关系连接到同一个项目 B，则自动推断 A 与 C 之间存在"同事"关系，并写入图谱。',
    status: 'active',
    category: '关系发现',
    trigger: 'relation_create',
    conditionGroup: {
      id: uid(), logic: 'AND',
      conditions: [
        { id: uid(), field: 'relation_type', operator: 'equals', value: '项目成员' },
        { id: uid(), field: 'entity_type', operator: 'equals', value: '项目' },
      ],
    },
    actions: [
      { id: uid(), type: 'create_relation', params: { type: '同事', target: '共同项目成员' } },
    ],
    createdAt: '2026-07-01 10:00',
    updatedAt: '2026-07-04 11:30',
    discoveryPattern: {
      nodes: [
        { label: 'A', type: '人物', color: '#3b82f6' },
        { label: 'B', type: '项目', color: '#8b5cf6' },
        { label: 'C', type: '人物', color: '#3b82f6' },
      ],
      edges: [
        { label: '项目成员', variable: 'r1' },
        { label: '项目成员', variable: 'r2' },
      ],
      inferredEdge: { from: 0, to: 2, label: '同事' },
      condition: 'A ≠ C',
    },
  },
  {
    id: 'R004',
    name: '高价值实体关系扩展',
    description: '对置信度高的技术实体自动创建"应用于"关系连接相关领域。',
    status: 'inactive',
    category: '属性类',
    trigger: 'manual',
    conditionGroup: {
      id: uid(), logic: 'AND',
      conditions: [
        { id: uid(), field: 'entity_type', operator: 'equals', value: '技术' },
        { id: uid(), field: 'property.confidence', operator: 'gte', value: '0.9' },
      ],
    },
    actions: [
      { id: uid(), type: 'set_property', params: { key: 'priority', value: 'high' } },
      { id: uid(), type: 'create_relation', params: { type: '应用于', target: '领域实体' } },
    ],
    createdAt: '2026-06-05 13:00',
    updatedAt: '2026-06-06 09:20',

  },
];

// ─── Draggable Condition Block ────────────────────────────────────────────────

const ITEM_TYPE_CONDITION = 'CONDITION';
const ITEM_TYPE_ACTION = 'ACTION';
const ITEM_TYPE_PALETTE = 'PALETTE';

function ConditionBlock({
  condition,
  index,
  groupId,
  onUpdate,
  onRemove,
  onMove,
}: {
  condition: Condition;
  index: number;
  groupId: string;
  onUpdate: (id: string, patch: Partial<Condition>) => void;
  onRemove: (id: string) => void;
  onMove: (dragIndex: number, hoverIndex: number, groupId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ITEM_TYPE_CONDITION,
    item: { id: condition.id, index, groupId },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE_CONDITION,
    hover(item: any) {
      if (!ref.current || item.index === index || item.groupId !== groupId) return;
      onMove(item.index, index, groupId);
      item.index = index;
    },
    collect: m => ({ isOver: m.isOver() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2.5 transition-colors ${isOver ? 'border-[#2563eb]/60' : 'border-gray-200'}`}
    >
      <div className="cursor-grab text-gray-400 hover:text-gray-500 flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>

      <select
        value={condition.field}
        onChange={e => onUpdate(condition.id, { field: e.target.value })}
        className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-[#2563eb] min-w-0"
      >
        {FIELD_OPTIONS.map(f => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={e => onUpdate(condition.id, { operator: e.target.value as ConditionOperator })}
        className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-[#2563eb]"
      >
        {(Object.keys(OPERATOR_LABELS) as ConditionOperator[]).map(op => (
          <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
        ))}
      </select>

      {condition.operator !== 'exists' && condition.operator !== 'not_exists' && (
        <input
          type="text"
          placeholder="值..."
          value={condition.value}
          onChange={e => onUpdate(condition.id, { value: e.target.value })}
          className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb] min-w-0"
        />
      )}

      <button
        onClick={() => onRemove(condition.id)}
        className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Condition Group (recursive) ──────────────────────────────────────────────

function ConditionGroupBlock({
  group,
  depth,
  onUpdateGroup,
  onRemoveGroup,
}: {
  group: ConditionGroup;
  depth: number;
  onUpdateGroup: (updated: ConditionGroup) => void;
  onRemoveGroup?: () => void;
}) {
  const updateCondition = (id: string, patch: Partial<Condition>) => {
    onUpdateGroup({
      ...group,
      conditions: group.conditions.map(c =>
        'field' in c && c.id === id ? { ...c, ...patch } : c
      ),
    });
  };

  const removeCondition = (id: string) => {
    onUpdateGroup({
      ...group,
      conditions: group.conditions.filter(c => c.id !== id),
    });
  };

  const moveCondition = (dragIdx: number, hoverIdx: number, gid: string) => {
    if (gid !== group.id) return;
    const updated = [...group.conditions];
    const [dragged] = updated.splice(dragIdx, 1);
    updated.splice(hoverIdx, 0, dragged);
    onUpdateGroup({ ...group, conditions: updated });
  };

  const addCondition = () => {
    onUpdateGroup({ ...group, conditions: [...group.conditions, newCondition()] });
  };

  const addSubGroup = () => {
    onUpdateGroup({ ...group, conditions: [...group.conditions, newGroup('OR')] });
  };

  const borderColor = depth === 0 ? 'border-gray-200' : depth === 1 ? 'border-blue-100' : 'border-purple-100';
  const bgColor = depth === 0 ? 'bg-gray-50' : depth === 1 ? 'bg-gray-100' : 'bg-white';

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-3`}>
      {/* Group header */}
      <div className="flex items-center gap-2 mb-3">
        <GitMerge className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">条件组</span>
        <div className="flex border border-gray-200 rounded overflow-hidden">
          {(['AND', 'OR'] as LogicOp[]).map(op => (
            <button
              key={op}
              onClick={() => onUpdateGroup({ ...group, logic: op })}
              className={`px-2.5 py-0.5 text-xs font-medium transition-colors ${
                group.logic === op ? 'bg-[#2563eb] text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {op}
            </button>
          ))}
        </div>
        {onRemoveGroup && (
          <button
            onClick={onRemoveGroup}
            className="ml-auto text-gray-400 hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Conditions */}
      <div className="flex flex-col gap-2">
        {group.conditions.map((item, idx) => {
          if ('field' in item) {
            return (
              <div key={item.id}>
                {idx > 0 && (
                  <div className="flex items-center gap-2 my-1.5 px-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      group.logic === 'AND' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'
                    }`}>{group.logic}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <ConditionBlock
                  condition={item}
                  index={idx}
                  groupId={group.id}
                  onUpdate={updateCondition}
                  onRemove={removeCondition}
                  onMove={moveCondition}
                />
              </div>
            );
          } else {
            return (
              <div key={item.id}>
                {idx > 0 && (
                  <div className="flex items-center gap-2 my-1.5 px-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      group.logic === 'AND' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'
                    }`}>{group.logic}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                )}
                <ConditionGroupBlock
                  group={item}
                  depth={depth + 1}
                  onUpdateGroup={updated => {
                    onUpdateGroup({
                      ...group,
                      conditions: group.conditions.map(c => c.id === updated.id ? updated : c),
                    });
                  }}
                  onRemoveGroup={() => {
                    onUpdateGroup({ ...group, conditions: group.conditions.filter(c => c.id !== item.id) });
                  }}
                />
              </div>
            );
          }
        })}
      </div>

      {/* Add buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={addCondition}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#2563eb] transition-colors border border-dashed border-gray-200 hover:border-[#2563eb]/50 rounded px-2.5 py-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          添加条件
        </button>
        {depth < 2 && (
          <button
            onClick={addSubGroup}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors border border-dashed border-gray-200 hover:border-purple-300 rounded px-2.5 py-1.5"
          >
            <GitMerge className="w-3.5 h-3.5" />
            嵌套条件组
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Draggable Action Block ───────────────────────────────────────────────────

function ActionBlock({
  action,
  index,
  onUpdate,
  onRemove,
  onMove,
}: {
  action: Action;
  index: number;
  onUpdate: (id: string, patch: Partial<Action>) => void;
  onRemove: (id: string) => void;
  onMove: (dragIdx: number, hoverIdx: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE_ACTION,
    item: { id: action.id, index },
    collect: m => ({ isDragging: m.isDragging() }),
  });
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE_ACTION,
    hover(item: any) {
      if (!ref.current || item.index === index) return;
      onMove(item.index, index);
      item.index = index;
    },
    collect: m => ({ isOver: m.isOver() }),
  });
  drag(drop(ref));

  const actionParamFields: Record<ActionType, { key: string; placeholder: string }[]> = {
    add_tag: [{ key: 'tag', placeholder: '标签名称' }],
    set_property: [
      { key: 'key', placeholder: '属性键' },
      { key: 'value', placeholder: '属性值' },
    ],
    create_relation: [
      { key: 'type', placeholder: '关系类型' },
      { key: 'target', placeholder: '目标实体' },
    ],
    send_alert: [{ key: 'message', placeholder: '告警消息' }],
    mark_review: [{ key: 'reason', placeholder: '标记原因' }],
  };

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-start gap-2 bg-gray-50 border rounded-lg px-3 py-3 transition-colors ${isOver ? 'border-[#2563eb]/60' : 'border-gray-200'}`}
    >
      <div className="cursor-grab text-gray-400 hover:text-gray-500 pt-0.5">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex items-center gap-2 w-8 h-8 flex-shrink-0 mt-0.5">
        <div className={`flex items-center justify-center w-7 h-7 rounded border text-xs font-bold ${ACTION_COLORS[action.type]}`}>
          {index + 1}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <select
          value={action.type}
          onChange={e => onUpdate(action.id, { type: e.target.value as ActionType, params: {} })}
          className="bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#2563eb] w-full"
        >
          {(Object.keys(ACTION_LABELS) as ActionType[]).map(t => (
            <option key={t} value={t}>{ACTION_LABELS[t]}</option>
          ))}
        </select>

        <div className="flex gap-2 flex-wrap">
          {actionParamFields[action.type].map(f => (
            <input
              key={f.key}
              type="text"
              placeholder={f.placeholder}
              value={action.params[f.key] || ''}
              onChange={e => onUpdate(action.id, { params: { ...action.params, [f.key]: e.target.value } })}
              className="flex-1 min-w-24 bg-white border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb]"
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => onRemove(action.id)}
        className="text-gray-600 hover:text-red-400 transition-colors pt-0.5 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Palette Block (draggable from palette onto canvas) ───────────────────────

function PaletteItem({ type, label, icon: Icon, color }: {
  type: string; label: string; icon: any; color: string;
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE_PALETTE,
    item: { paletteType: type },
    collect: m => ({ isDragging: m.isDragging() }),
  });
  return (
    <div
      ref={drag as any}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab text-xs bg-white ${color} transition-opacity`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </div>
  );
}

// ─── Drop Zone for Palette items ──────────────────────────────────────────────

function CanvasDropZone({ onDrop, children }: { onDrop: (paletteType: string) => void; children: ReactNode }) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE_PALETTE,
    drop(item: any) { onDrop(item.paletteType); },
    collect: m => ({ isOver: m.isOver() }),
  });
  return (
    <div
      ref={drop as any}
      className={`flex-1 transition-colors rounded-lg ${isOver ? 'bg-blue-50 ring-1 ring-[#2563eb]/30' : ''}`}
    >
      {children}
    </div>
  );
}

// ─── Discovery Pattern Preview ───────────────────────────────────────────────

function DiscoveryPatternPreview({ pattern }: { pattern: RelationDiscoveryPattern }) {
  const { nodes, edges, inferredEdge, condition } = pattern;
  return (
    <div className="mt-1">
      {/* Pattern diagram */}
      <div className="flex items-center gap-0 flex-wrap">
        {/* Known path: A →r1→ B ←r2← C */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <span className="text-[10px] text-gray-400 mr-1">已知路径</span>
          {nodes.map((node, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: node.color + '18', color: node.color, border: `1px solid ${node.color}55` }}
              >
                <span className="font-bold">{node.label}</span>
                <span className="opacity-60 text-[9px]">{node.type}</span>
              </span>
              {i < edges.length && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                  {i === 0 ? (
                    <><ArrowRight className="w-3 h-3" /><span className="bg-white border border-gray-200 rounded px-1 py-px">{edges[i].label}</span><ArrowRight className="w-3 h-3" /></>
                  ) : (
                    <><ChevronLeft className="w-3 h-3" /><span className="bg-white border border-gray-200 rounded px-1 py-px">{edges[i].label}</span><ChevronLeft className="w-3 h-3" /></>
                  )}
                </span>
              )}
            </span>
          ))}
          {condition && (
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 ml-1">
              {condition}
            </span>
          )}
        </div>

        {/* Arrow to inferred */}
        <div className="flex items-center px-2">
          <svg width="28" height="14" viewBox="0 0 28 14">
            <line x1="0" y1="7" x2="22" y2="7" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="20,3 28,7 20,11" fill="#10b981" />
          </svg>
        </div>

        {/* Inferred relation */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <span className="text-[10px] text-emerald-600 mr-0.5">推断出</span>
          <span
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: nodes[inferredEdge.from].color + '18', color: nodes[inferredEdge.from].color, border: `1px solid ${nodes[inferredEdge.from].color}55` }}
          >
            <span className="font-bold">{nodes[inferredEdge.from].label}</span>
          </span>
          <ArrowRight className="w-3 h-3 text-emerald-500" />
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5">
            {inferredEdge.label}
          </span>
          <ArrowRight className="w-3 h-3 text-emerald-500" />
          <span
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: nodes[inferredEdge.to].color + '18', color: nodes[inferredEdge.to].color, border: `1px solid ${nodes[inferredEdge.to].color}55` }}
          >
            <span className="font-bold">{nodes[inferredEdge.to].label}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Rule Editor ──────────────────────────────────────────────────────────────

function RuleEditor({
  rule,
  onSave,
  onCancel,
}: {
  rule: Rule;
  onSave: (updated: Rule) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Rule>(JSON.parse(JSON.stringify(rule)));

  const updateMeta = (patch: Partial<Rule>) => setDraft(d => ({ ...d, ...patch }));

  const updateConditionGroup = useCallback((group: ConditionGroup) => {
    setDraft(d => ({ ...d, conditionGroup: group }));
  }, []);

  const addAction = (type?: ActionType) => {
    const t = type || 'add_tag';
    setDraft(d => ({
      ...d,
      actions: [...d.actions, { id: uid(), type: t, params: {} }],
    }));
  };

  const updateAction = (id: string, patch: Partial<Action>) => {
    setDraft(d => ({
      ...d,
      actions: d.actions.map(a => a.id === id ? { ...a, ...patch } : a),
    }));
  };

  const removeAction = (id: string) => {
    setDraft(d => ({ ...d, actions: d.actions.filter(a => a.id !== id) }));
  };

  const moveAction = (dragIdx: number, hoverIdx: number) => {
    setDraft(d => {
      const updated = [...d.actions];
      const [item] = updated.splice(dragIdx, 1);
      updated.splice(hoverIdx, 0, item);
      return { ...d, actions: updated };
    });
  };

  const handlePaletteDrop = (paletteType: string) => {
    if (paletteType.startsWith('action:')) {
      addAction(paletteType.replace('action:', '') as ActionType);
    }
  };

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Editor header */}
      <div className="flex items-center gap-3 pb-5 border-b border-gray-200 flex-shrink-0">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-gray-900 text-sm">{draft.id === '__new__' ? '新建规则' : `编辑规则 · ${draft.name}`}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors">
            取消
          </button>
          <button
            onClick={() => onSave(draft)}
            className="px-4 py-2 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            保存规则
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 pt-5">
        {/* Left palette */}
        <div className="w-44 flex-shrink-0 flex flex-col gap-3">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 px-1">条件组件</div>
            <div className="flex flex-col gap-1.5">
              <PaletteItem type="condition" label="添加条件" icon={Filter} color="text-blue-600 border-blue-200" />
              <PaletteItem type="conditionGroup" label="条件分组" icon={GitMerge} color="text-indigo-600 border-indigo-200" />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 px-1">动作组件</div>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(ACTION_LABELS) as ActionType[]).map(t => (
                <PaletteItem
                  key={t}
                  type={`action:${t}`}
                  label={ACTION_LABELS[t]}
                  icon={Zap}
                  color={`${ACTION_COLORS[t]} border`}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 p-2.5 bg-gray-50 border border-gray-100 rounded-lg">
            <div className="text-[10px] text-gray-400 mb-1.5">使用提示</div>
            <p className="text-[11px] text-gray-500 leading-relaxed">从左侧拖拽组件到画布，或点击「添加」按钮快速插入。</p>
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-5 min-h-0">
          {/* Metadata */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex-shrink-0">
            <div className="text-xs text-gray-500 mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />基本信息</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">规则名称</label>
                <input
                  value={draft.name}
                  onChange={e => updateMeta({ name: e.target.value })}
                  placeholder="输入规则名称..."
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">规则类型</label>
                <select
                  value={draft.category}
                  onChange={e => updateMeta({ category: e.target.value as RuleCategory })}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="实体类">实体类</option>
                  <option value="属性类">属性类</option>
                  <option value="关系类">关系类</option>
                  <option value="关系发现">关系发现</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">触发时机</label>
                <select
                  value={draft.trigger}
                  onChange={e => updateMeta({ trigger: e.target.value as TriggerType })}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#2563eb]"
                >
                  {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => (
                    <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">描述</label>
                <textarea
                  value={draft.description}
                  onChange={e => updateMeta({ description: e.target.value })}
                  placeholder="描述规则的用途..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-900">触发条件</span>
              <span className="text-xs text-gray-500 ml-1">— 满足以下条件时执行动作</span>
            </div>
            <CanvasDropZone onDrop={type => {
              if (type === 'condition') {
                updateConditionGroup({
                  ...draft.conditionGroup,
                  conditions: [...draft.conditionGroup.conditions, newCondition()],
                });
              } else if (type === 'conditionGroup') {
                updateConditionGroup({
                  ...draft.conditionGroup,
                  conditions: [...draft.conditionGroup.conditions, newGroup()],
                });
              }
            }}>
              <ConditionGroupBlock
                group={draft.conditionGroup}
                depth={0}
                onUpdateGroup={updateConditionGroup}
              />
            </CanvasDropZone>
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
              <ArrowRight className="w-3.5 h-3.5" />
              条件满足时执行
            </div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Actions */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-900">执行动作</span>
              <span className="text-xs text-gray-500 ml-1">— 按顺序依次执行，可拖拽调整顺序</span>
            </div>
            <CanvasDropZone onDrop={handlePaletteDrop}>
              <div className="flex flex-col gap-2">
                {draft.actions.length === 0 && (
                  <div className="border border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center gap-2 text-gray-400">
                    <Zap className="w-6 h-6 opacity-40" />
                    <span className="text-xs">从左侧拖拽动作组件到此处，或点击下方按钮添加</span>
                  </div>
                )}
                {draft.actions.map((action, idx) => (
                  <ActionBlock
                    key={action.id}
                    action={action}
                    index={idx}
                    onUpdate={updateAction}
                    onRemove={removeAction}
                    onMove={moveAction}
                  />
                ))}
                <button
                  onClick={() => addAction()}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#2563eb] transition-colors border border-dashed border-gray-200 hover:border-[#2563eb]/50 rounded-lg px-3 py-2.5 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加动作
                </button>
              </div>
            </CanvasDropZone>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Version History Panel ────────────────────────────────────────────────────

function VersionHistoryPanel({ rule, onClose, onRollback }: {
  rule: Rule;
  onClose: () => void;
  onRollback: (version: RuleVersion) => void;
}) {
  const versions = rule.versions ?? [];
  const [previewVersion, setPreviewVersion] = useState<RuleVersion | null>(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl border-l border-gray-200" style={{ width: '560px' }}>
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-500" />
              版本历史
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{rule.name} · {versions.length} 个版本</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <History className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">暂无版本记录</p>
            </div>
          ) : versions.map((v, i) => {
            const isCurrent = i === 0;
            const isPreviewing = previewVersion?.version === v.version;
            return (
              <div key={v.version} className={`border rounded-xl overflow-hidden transition-all ${isPreviewing ? 'border-blue-300 shadow-sm' : 'border-gray-200'}`}>
                {/* Version header */}
                <div className={`flex items-center gap-3 px-4 py-3 ${isPreviewing ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  {/* Version timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 ${isCurrent ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'}`} />
                    {i < versions.length - 1 && <div className="w-px h-4 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{v.version}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">当前版本</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{v.summary}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400">{v.savedAt}</span>
                      <span className="text-[11px] text-gray-300">·</span>
                      <span className="text-[11px] text-gray-400">{v.author}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setPreviewVersion(isPreviewing ? null : v)}
                      className={`text-xs px-2.5 py-1 border rounded-lg transition-colors flex items-center gap-1 ${isPreviewing ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Eye className="w-3 h-3" />{isPreviewing ? '收起' : '预览'}
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={() => { onRollback(v); onClose(); }}
                        className="text-xs px-2.5 py-1 border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />回滚
                      </button>
                    )}
                  </div>
                </div>
                {/* DSL Preview */}
                {isPreviewing && (
                  <div className="border-t border-blue-100 p-4">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">DSL 内容</div>
                    <DslHighlightedEditor
                      value={JSON.stringify(JSON.parse(v.dsl), null, 2)}
                      onChange={() => {}}
                      rows={8}
                    />
                    <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />预览模式为只读，点击「回滚」将当前规则还原为此版本
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">每次保存规则时自动生成新版本快照，最多保留 20 个历史版本</p>
        </div>
      </div>
    </>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RuleStatus, { label: string; dot: string; text: string }> = {
  active: { label: '运行中', dot: 'bg-green-400', text: 'text-green-400' },
  inactive: { label: '已停用', dot: 'bg-gray-500', text: 'text-gray-500' },
  draft: { label: '草稿', dot: 'bg-yellow-400', text: 'text-yellow-400' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Mock validation & reasoning data ────────────────────────────────────────

const mockViolations = [
  { id: 'V001', ruleId: 'R001', ruleName: '人物实体质量检测', entity: '张伟（人物）', issue: '置信度 0.42，低于阈值 0.6', severity: 'high' as const, detectedAt: '2026-07-04 09:12' },
  { id: 'V002', ruleId: 'R001', ruleName: '人物实体质量检测', entity: '李晓东（人物）', issue: '置信度 0.55，低于阈值 0.6', severity: 'high' as const, detectedAt: '2026-07-04 09:12' },
  { id: 'V003', ruleId: 'R003', ruleName: '专利实体去重检测', entity: 'CN202410099876A', issue: '检测到疑似重复专利，相似度 0.94', severity: 'medium' as const, detectedAt: '2026-07-04 09:13' },
  { id: 'V004', ruleId: 'R003', ruleName: '专利实体去重检测', entity: 'CN202410012345A', issue: '与已有专利内容高度重叠', severity: 'medium' as const, detectedAt: '2026-07-04 09:13' },
  { id: 'V005', ruleId: 'R002', ruleName: '组织关系自动打标', entity: '关系：清华大学→教育部', issue: '关系类型"隶属于"已标记但缺少必填属性', severity: 'low' as const, detectedAt: '2026-07-04 09:14' },
];

const mockReasoningSteps = [
  {
    id: 'RS001', timestamp: '2026-07-04 09:12:03', ruleId: 'R002', ruleName: '组织关系自动打标',
    trigger: '新增关系：[清华大学] →隶属于→ [教育部]',
    facts: ['关系类型 = "隶属于"', '来源实体 = 清华大学'],
    result: '为 [清华大学] 添加标签 "机构成员"',
    inferredFact: { entity: '清华大学', property: 'tag', value: '机构成员' },
    depends: [],
  },
  {
    id: 'RS002', timestamp: '2026-07-04 09:12:11', ruleId: 'R001', ruleName: '人物实体质量检测',
    trigger: '新增实体：张伟（人物，置信度=0.42）',
    facts: ['实体类型 = 人物', '属性 confidence = 0.42', '阈值 = 0.6', '0.42 < 0.6 为真'],
    result: '标记张伟为"待审核"，发送告警通知',
    inferredFact: { entity: '张伟', property: 'review_status', value: 'pending' },
    depends: [],
  },
  {
    id: 'RS003', timestamp: '2026-07-04 09:13:45', ruleId: 'R002', ruleName: '组织关系自动打标',
    trigger: '新增关系：[北京人工智能研究院] →隶属于→ [科学技术部]',
    facts: ['关系类型 = "隶属于"', '来源实体 = 北京人工智能研究院'],
    result: '为 [北京人工智能研究院] 添加标签 "机构成员"',
    inferredFact: { entity: '北京人工智能研究院', property: 'tag', value: '机构成员' },
    depends: ['RS001'],
  },
  {
    id: 'RS004', timestamp: '2026-07-04 09:15:22', ruleId: 'R005', ruleName: '项目成员同事关系推断',
    trigger: '新增关系：[李明] →项目成员→ [新能源知识图谱项目]，发现已存在 [张伟] →项目成员→ [新能源知识图谱项目]',
    facts: ['A = 李明（人物）', 'B = 新能源知识图谱项目（项目）', 'C = 张伟（人物）', '李明 →项目成员→ 新能源知识图谱项目', '张伟 →项目成员→ 新能源知识图谱项目', 'A ≠ C 满足'],
    result: '推断并创建关系：[李明] →同事→ [张伟]',
    inferredFact: { entity: '李明 ↔ 张伟', property: 'relation', value: '同事' },
    depends: [],
  },
  {
    id: 'RS005', timestamp: '2026-07-04 09:15:23', ruleId: 'R005', ruleName: '项目成员同事关系推断',
    trigger: '同一批次：[王芳] →项目成员→ [新能源知识图谱项目]，与 [李明]、[张伟] 同项目',
    facts: ['C = 王芳（人物）', '王芳 →项目成员→ 新能源知识图谱项目', '李明、张伟 同属该项目'],
    result: '推断并创建关系：[王芳] →同事→ [李明]，[王芳] →同事→ [张伟]',
    inferredFact: { entity: '王芳', property: 'relation', value: '同事×2' },
    depends: ['RS004'],
  },
];

const SEVERITY_CONFIG = {
  high: { label: '严重', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { label: '警告', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  low: { label: '提示', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
};

export default function RuleManagement() {
  const [rules, setRules] = useState<Rule[]>(mockRules);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [versionHistoryRule, setVersionHistoryRule] = useState<Rule | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<RuleStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<RuleCategory | 'all'>('all');
  const [filterTrigger, setFilterTrigger] = useState<TriggerType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'rules' | 'validation' | 'candidate'>('rules');
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState('2026-07-04 09:15');
  const [violations, setViolations] = useState(mockViolations);
  const [expandedStep, setExpandedStep] = useState<string | null>('RS001');
  const [expandedChainRuleId, setExpandedChainRuleId] = useState<string | null>(null);

  // Candidate rules
  const [candidateRules, setCandidateRules] = useState([
    {
      id: 'CR001', status: 'pending' as 'pending' | 'accepted' | 'rejected',
      rule: 'IF entity_type=人物 AND relation=任职于 AND target_type=机构 THEN 推断 relation=成员',
      source: '关联规则挖掘（Apriori）', generatedAt: '2026-08-02 14:23',
      confidence: 0.89, support: 0.34, lift: 2.61, coverage: 412,
      exampleSubject: '张伟', exampleRelation: '任职于', exampleObject: '清华大学',
      category: '关系发现',
    },
    {
      id: 'CR002', status: 'pending' as 'pending' | 'accepted' | 'rejected',
      rule: 'IF entity_type=论文 AND property.year<2020 AND citation_count>100 THEN property.tier="高影响力"',
      source: '决策树归纳', generatedAt: '2026-08-02 14:23',
      confidence: 0.82, support: 0.21, lift: 3.10, coverage: 258,
      exampleSubject: 'Attention Is All You Need (2017)', exampleRelation: 'citation_count=15423', exampleObject: 'tier→高影响力',
      category: '属性推断',
    },
    {
      id: 'CR003', status: 'accepted' as 'pending' | 'accepted' | 'rejected',
      rule: 'IF entity_type=专利 AND relation=发明人 AND target.affiliation=高校 THEN tag="产学研专利"',
      source: '频繁模式挖掘', generatedAt: '2026-08-01 09:47',
      confidence: 0.91, support: 0.18, lift: 4.22, coverage: 187,
      exampleSubject: 'CN202410099876A', exampleRelation: '发明人→李明（清华大学）', exampleObject: 'tag→产学研专利',
      category: '属性推断',
    },
    {
      id: 'CR004', status: 'pending' as 'pending' | 'accepted' | 'rejected',
      rule: 'IF entity_type=机构 AND relation=位于 AND target.admin_level=省级 THEN relation=隶属于省级行政区',
      source: '路径模式发现', generatedAt: '2026-08-02 15:01',
      confidence: 0.76, support: 0.29, lift: 1.88, coverage: 334,
      exampleSubject: '北京协和医院', exampleRelation: '位于→北京市', exampleObject: '隶属于→北京市',
      category: '关系发现',
    },
    {
      id: 'CR005', status: 'rejected' as 'pending' | 'accepted' | 'rejected',
      rule: 'IF entity_type=人物 AND property.age>60 THEN property.career_stage="资深"',
      source: '决策树归纳', generatedAt: '2026-07-31 11:22',
      confidence: 0.61, support: 0.44, lift: 1.12, coverage: 531,
      exampleSubject: '李国豪（63岁）', exampleRelation: 'age=63', exampleObject: 'career_stage→资深',
      category: '属性推断',
    },
    {
      id: 'CR006', status: 'pending' as 'pending' | 'accepted' | 'rejected',
      rule: 'IF entity_type=技术 AND relation=应用于 AND target_type=医疗 THEN tag="医疗AI"',
      source: '关联规则挖掘（FP-Growth）', generatedAt: '2026-08-03 08:15',
      confidence: 0.85, support: 0.12, lift: 5.67, coverage: 143,
      exampleSubject: '医学影像识别', exampleRelation: '应用于→肺癌筛查', exampleObject: 'tag→医疗AI',
      category: '关系发现',
    },
  ]);
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [candidateSearch, setCandidateSearch] = useState('');
  type SortKey = 'confidence' | 'support' | 'lift' | 'coverage';
  const [sortKey, setSortKey] = useState<SortKey>('confidence');
  const [sortAsc, setSortAsc] = useState(false);
  const [showDistChart, setShowDistChart] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };
  const [candidateGenerating, setCandidateGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState('2026-08-03 08:15');
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.80);
  const [thresholdInputStr, setThresholdInputStr] = useState('80');

  const handleCandidateDecision = (id: string, decision: 'accepted' | 'rejected') => {
    setCandidateRules(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r));
    if (decision === 'accepted') {
      const cr = candidateRules.find(r => r.id === id);
      if (cr) {
        const newRule: Rule = {
          id: `R${String(rules.length + 1).padStart(3, '0')}`,
          name: `[候选转入] ${cr.category} — ${cr.id}`,
          description: cr.rule,
          status: 'draft',
          category: cr.category as any,
          trigger: 'event',
          priority: 'medium',
          conditions: [],
          actions: [],
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
        };
        setRules(prev => [...prev, newRule]);
      }
    }
  };

  const aboveThresholdPending = candidateRules.filter(r => r.status === 'pending' && r.confidence >= confidenceThreshold);

  const handleBatchAdopt = () => {
    const toAdopt = candidateRules.filter(r => r.status === 'pending' && r.confidence >= confidenceThreshold);
    if (toAdopt.length === 0) return;
    setRules(prev => {
      let next = [...prev];
      toAdopt.forEach(cr => {
        next = [...next, {
          id: `R${String(next.length + 1).padStart(3, '0')}`,
          name: `[候选转入] ${cr.category} — ${cr.id}`,
          description: cr.rule,
          status: 'draft' as const,
          category: (cr.category as any) || '关系发现',
          trigger: 'entity_create' as const,
          conditionGroup: newGroup('AND'),
          actions: [],
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
        }];
      });
      return next;
    });
    setCandidateRules(prev =>
      prev.map(r => r.status === 'pending' && r.confidence >= confidenceThreshold ? { ...r, status: 'accepted' } : r)
    );
  };

  const handleRegenerateCandidate = () => {
    setCandidateGenerating(true);
    setTimeout(() => {
      setCandidateGenerating(false);
      setLastGenerated(new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'));
    }, 2000);
  };

  const filtered = rules.filter(r => {
    const matchSearch = !search || r.name.includes(search) || r.description.includes(search);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchTrigger = filterTrigger === 'all' || r.trigger === filterTrigger;
    return matchSearch && matchStatus && matchCategory && matchTrigger;
  });

  const handleSave = (updated: Rule) => {
    if (updated.id === '__new__') {
      const newRule = { ...updated, id: `R${String(rules.length + 1).padStart(3, '0')}`, createdAt: new Date().toLocaleString('zh-CN'), updatedAt: new Date().toLocaleString('zh-CN') };
      setRules(prev => [...prev, newRule]);
    } else {
      setRules(prev => prev.map(r => r.id === updated.id ? { ...updated, updatedAt: new Date().toLocaleString('zh-CN') } : r));
    }
    setEditingRule(null);
  };

  const toggleStatus = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r));
  };

  const duplicateRule = (rule: Rule) => {
    const copy: Rule = { ...JSON.parse(JSON.stringify(rule)), id: `R${String(rules.length + 1).padStart(3, '0')}`, name: `${rule.name} (副本)`, status: 'draft', createdAt: new Date().toLocaleString('zh-CN'), updatedAt: new Date().toLocaleString('zh-CN') };
    setRules(prev => [...prev, copy]);
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const newRule = (): Rule => ({
    id: '__new__',
    name: '',
    description: '',
    status: 'draft',
    category: '实体类',
    trigger: 'entity_create',
    conditionGroup: newGroup('AND'),
    actions: [],
    createdAt: '',
    updatedAt: '',

  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-1">规则管理</h1>
            <p className="text-sm text-gray-400">定义与管理知识图谱约束规则，支持可视化编辑、校验扫描与推理溯源</p>
          </div>
          {activeTab === 'rules' && (
            <button
              onClick={() => { setEditingRule(newRule()); setEditingIsNew(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm rounded-lg transition-colors"
            >
              <Bot className="w-4 h-4" />
              新增规则
            </button>
          )}
          {activeTab === 'validation' && (
            <button
              onClick={() => { setScanning(true); setTimeout(() => { setScanning(false); setLastScan(new Date().toLocaleString('zh-CN')); }, 2000); }}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
              {scanning ? '扫描中…' : '立即扫描'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 -mt-2 flex-shrink-0">
          {[
            { id: 'rules', label: '规则列表', icon: Shield },
            { id: 'validation', label: '校验报告', icon: ScanSearch },
            { id: 'candidate', label: '候选规则', icon: Bot },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'rules' && (<>{/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: '规则总数', value: rules.length, icon: Shield, color: 'text-blue-400' },
            { label: '已启用', value: rules.filter(r => r.status === 'active').length, icon: CircleDot, color: 'text-green-400' },
            { label: '已停用', value: rules.filter(r => r.status === 'inactive').length, icon: ToggleLeft, color: 'text-gray-400' },
            { label: '草稿', value: rules.filter(r => r.status === 'draft').length, icon: Shield, color: 'text-gray-400' },
            { label: '关系发现', value: rules.filter(r => r.category === '关系发现').length, icon: Share2, color: 'text-emerald-500' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <div className="text-lg text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索规则名称或描述..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb]"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">全部类型</option>
            <option value="实体类">实体类</option>
            <option value="属性类">属性类</option>
            <option value="关系类">关系类</option>
            <option value="关系发现">关系发现</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">全部状态</option>
            <option value="active">运行中</option>
            <option value="inactive">已停用</option>
            <option value="draft">草稿</option>
          </select>
          <select
            value={filterTrigger}
            onChange={e => setFilterTrigger(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-[#2563eb]"
          >
            <option value="all">全部触发方式</option>
            {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map(t => (
              <option key={t} value={t}>{TRIGGER_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Rule list */}
        <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Shield className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">未找到匹配的规则</p>
            </div>
          ) : (
            filtered.map(rule => {
              const sc = STATUS_CONFIG[rule.status];
              const chainSteps = mockReasoningSteps.filter(s => s.ruleId === rule.id);
              const chainOpen = expandedChainRuleId === rule.id;
              return (
                <div key={rule.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                  {/* Main content row */}
                  <div className="flex items-start gap-4 px-5 py-4">
                    <div className="pt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-900 font-medium">{rule.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${sc.text}`}>{sc.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          rule.category === '关系发现'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {rule.category === '关系发现' && <Share2 className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />}
                          {rule.category}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{TRIGGER_LABELS[rule.trigger]}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{rule.description}</p>
                      {rule.discoveryPattern ? (
                        <DiscoveryPatternPreview pattern={rule.discoveryPattern} />
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[11px] bg-gray-50 border border-gray-100 rounded px-2 py-1">
                            <Filter className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-500">{rule.conditionGroup.conditions.length} 个条件</span>
                            <span className="text-blue-400">{rule.conditionGroup.logic}</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <div className="flex items-center gap-1 flex-wrap">
                            {rule.actions.map(a => (
                              <span key={a.id} className={`text-[11px] px-1.5 py-0.5 rounded border ${ACTION_COLORS[a.type]}`}>
                                {ACTION_LABELS[a.type]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {rule.versions && rule.versions.length > 0 && (
                        <button onClick={() => setVersionHistoryRule(rule)} title="版本历史"
                          className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors relative">
                          <GitBranch className="w-4 h-4" />
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                            {rule.versions.length}
                          </span>
                        </button>
                      )}
                      <button onClick={() => { setEditingRule(JSON.parse(JSON.stringify(rule))); setEditingIsNew(false); }} title="编辑"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => duplicateRule(rule)} title="复制"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} title="删除"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reasoning chain toggle */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => setExpandedChainRuleId(chainOpen ? null : rule.id)}
                      className="w-full flex items-center gap-2 px-5 py-2 text-[11px] text-gray-400 hover:text-blue-600 hover:bg-blue-50/40 transition-colors"
                    >
                      <Network className="w-3 h-3" />
                      推理链路（{chainSteps.length} 条记录）
                      <ChevronRight className={`w-3 h-3 ml-auto transition-transform ${chainOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {chainOpen && (
                      <div className="px-5 pb-4 flex flex-col gap-2">
                        {chainSteps.length === 0 ? (
                          <p className="text-[11px] text-gray-400 py-1">该规则暂无推理记录</p>
                        ) : chainSteps.map((step, i) => (
                          <div key={step.id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                            <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0 mt-0.5">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 mb-0.5">{step.trigger}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                                  {step.inferredFact.entity} · {step.inferredFact.property} = "{step.inferredFact.value}"
                                </span>
                                {step.depends.length > 0 && (
                                  <span className="text-[10px] text-purple-500">依赖 {step.depends.join(', ')}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{step.timestamp.split(' ')[1]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>)}

        {/* ── 校验报告 Tab ── */}
        {activeTab === 'validation' && (
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
            {/* Scan status */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 flex-shrink-0">
              {scanning ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <span className="text-sm text-gray-700 font-medium">
                  {scanning ? '正在扫描知识库…' : `发现 ${violations.length} 条违规数据`}
                </span>
                <span className="text-xs text-gray-400 ml-3">上次扫描：{lastScan}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                {['严重', '警告', '提示'].map((s, i) => {
                  const count = violations.filter(v => v.severity === ['high','medium','low'][i]).length;
                  const colors = ['text-red-500', 'text-yellow-500', 'text-blue-500'];
                  return <span key={s} className={`${colors[i]} font-medium`}>{count} {s}</span>;
                })}
              </div>
            </div>

            {/* Violations list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
              {violations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mb-2 opacity-30 text-green-400" />
                  <p className="text-sm">未发现违规数据，知识库状态良好</p>
                </div>
              ) : violations.map(v => {
                const sc = SEVERITY_CONFIG[v.severity];
                return (
                  <div key={v.id} className={`bg-white border ${sc.border} rounded-xl px-5 py-4 flex items-start gap-4`}>
                    <div className={`w-2 h-2 rounded-full ${sc.dot} mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm text-gray-900 font-medium">{v.entity}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color} border ${sc.border}`}>{sc.label}</span>
                        <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">规则：{v.ruleName}</span>
                      </div>
                      <p className="text-xs text-gray-500">{v.issue}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{v.detectedAt}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">忽略</button>
                      <button className="text-xs px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">修复</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 候选规则 Tab ── */}
        {activeTab === 'candidate' && (
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">

            {/* Header bar */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-500">后台自动挖掘的候选规则，请评估置信度等指标后决定是否纳入规则库</span>
              <span className="ml-auto text-[11px] text-gray-400">上次生成：{lastGenerated}</span>
              <button onClick={handleRegenerateCandidate} disabled={candidateGenerating}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                {candidateGenerating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />生成中…</>
                  : <><RefreshCw className="w-3.5 h-3.5" />重新生成</>}
              </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3 flex-shrink-0">
              {[
                { label: '候选总数', value: candidateRules.length, color: 'text-blue-600' },
                { label: '待审核', value: candidateRules.filter(r => r.status === 'pending').length, color: 'text-amber-600' },
                { label: '已采纳', value: candidateRules.filter(r => r.status === 'accepted').length, color: 'text-green-600' },
                { label: '已拒绝', value: candidateRules.filter(r => r.status === 'rejected').length, color: 'text-gray-400' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div>
                    <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter tabs + search */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1.5">
                {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => {
                  const labels = { all: '全部', pending: '待审核', accepted: '已采纳', rejected: '已拒绝' };
                  return (
                    <button key={f} onClick={() => setCandidateFilter(f)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        candidateFilter === f
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}>
                      {labels[f]}
                    </button>
                  );
                })}
              </div>
              <div className="relative flex-1 max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={e => setCandidateSearch(e.target.value)}
                  placeholder="搜索规则内容、来源、类别…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-400 placeholder-gray-400"
                />
                {candidateSearch && (
                  <button onClick={() => setCandidateSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Threshold control */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-3 mb-3">
                <SquareCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">批量采纳阈值</span>
                <span className="text-xs text-gray-400">置信度高于此值的全部待审核规则将被批量采纳入规则库（草稿状态）</span>
              </div>
              <div className="flex items-center gap-4">
                {/* Slider */}
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <span className="text-[11px] text-gray-400 w-6 flex-shrink-0">0%</span>
                  <div className="relative flex-1">
                    {/* Track fill */}
                    <div className="absolute inset-y-0 left-0 rounded-full bg-blue-100" style={{ width: `${confidenceThreshold * 100}%`, top: '50%', height: '6px', transform: 'translateY(-50%)' }} />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round(confidenceThreshold * 100)}
                      onChange={e => {
                        const v = Number(e.target.value) / 100;
                        setConfidenceThreshold(v);
                        setThresholdInputStr(String(Math.round(v * 100)));
                      }}
                      className="relative w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-blue-600 cursor-pointer"
                      style={{ background: `linear-gradient(to right, #2563eb ${confidenceThreshold * 100}%, #e5e7eb ${confidenceThreshold * 100}%)` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 w-8 flex-shrink-0 text-right">100%</span>
                </div>

                {/* Number input */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={thresholdInputStr}
                    onChange={e => {
                      setThresholdInputStr(e.target.value);
                      const n = Number(e.target.value);
                      if (!isNaN(n) && n >= 0 && n <= 100) setConfidenceThreshold(n / 100);
                    }}
                    onBlur={() => {
                      const n = Math.min(100, Math.max(0, Number(thresholdInputStr) || 0));
                      setThresholdInputStr(String(n));
                      setConfidenceThreshold(n / 100);
                    }}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center font-semibold text-gray-900 focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>

                {/* Preview count */}
                <div className="flex items-center gap-2 flex-shrink-0 border-l border-gray-100 pl-4">
                  {aboveThresholdPending.length > 0 ? (
                    <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-medium">
                      {aboveThresholdPending.length} 条待采纳
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                      无匹配规则
                    </span>
                  )}
                  <button
                    onClick={handleBatchAdopt}
                    disabled={aboveThresholdPending.length === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    <Check className="w-3.5 h-3.5" />
                    批量采纳
                  </button>
                </div>
              </div>

              {/* Threshold indicator marks */}
              {aboveThresholdPending.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-gray-400">将采纳：</span>
                  {aboveThresholdPending.map(cr => (
                    <span key={cr.id} className="flex items-center gap-1 text-[11px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">
                      <span className="font-semibold">{(cr.confidence * 100).toFixed(0)}%</span>
                      <span className="text-green-600 opacity-70">·</span>
                      <span className="max-w-32 truncate">{cr.category}</span>
                      <span className="text-gray-400">({cr.id})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score distribution chart */}
            {(() => {
              // Build histogram bins for confidence
              const bins = [
                { range: '< 60%', min: 0,    max: 0.60, color: '#f87171' },
                { range: '60–70%', min: 0.60, max: 0.70, color: '#fb923c' },
                { range: '70–80%', min: 0.70, max: 0.80, color: '#facc15' },
                { range: '80–90%', min: 0.80, max: 0.90, color: '#34d399' },
                { range: '≥ 90%',  min: 0.90, max: 1.01, color: '#10b981' },
              ];
              const histData = bins.map(b => ({
                range: b.range,
                count: candidateRules.filter(r => r.confidence >= b.min && r.confidence < b.max).length,
                color: b.color,
              }));
              // Scatter: confidence vs lift
              const scatterData = candidateRules.map(r => ({
                x: Math.round(r.confidence * 100),
                y: r.lift,
                z: r.coverage,
                name: r.id,
                status: r.status,
              }));
              const scatterColor = (status: string) =>
                status === 'accepted' ? '#10b981' : status === 'rejected' ? '#9ca3af' : '#3b82f6';

              return (
                <div className="flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Panel header */}
                  <button
                    onClick={() => setShowDistChart(v => !v)}
                    className="w-full flex items-center gap-2.5 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">评分分布可视化</span>
                    <span className="text-xs text-gray-400 ml-1">· 共 {candidateRules.length} 条候选，点击图表可快速筛选</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${showDistChart ? 'rotate-180' : ''}`} />
                  </button>

                  {showDistChart && (
                    <div className="border-t border-gray-100 p-5 grid grid-cols-2 gap-6">
                      {/* Left: Confidence histogram */}
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                          置信度区间分布
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <ReBarChart data={histData} barCategoryGap="28%" margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                            <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                            <ReTooltip
                              contentStyle={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                              formatter={(v: number) => [`${v} 条`, '数量']}
                              cursor={{ fill: '#f3f4f6' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {histData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                          {histData.map(b => (
                            <span key={b.range} className="flex items-center gap-1 text-[10px] text-gray-500">
                              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: b.color }} />
                              {b.range}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Confidence × Lift scatter */}
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                          置信度 × 提升度分布
                          <span className="text-[10px] text-gray-400 font-normal ml-1">气泡大小 = 覆盖实例数</span>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                          <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey="x" type="number" domain={[55, 100]} name="置信度"
                              tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                              tickFormatter={v => `${v}%`}
                            />
                            <YAxis
                              dataKey="y" type="number" name="提升度"
                              tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                              tickFormatter={v => `${v}x`}
                            />
                            <ZAxis dataKey="z" range={[40, 200]} name="覆盖数" />
                            <ReferenceLine x={Math.round(confidenceThreshold * 100)} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: '阈值', position: 'top', fontSize: 10, fill: '#3b82f6' }} />
                            <ReferenceLine y={2} stroke="#e5e7eb" strokeDasharray="3 3" />
                            <ReTooltip
                              contentStyle={{ fontSize: 11, padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                              formatter={(v: number, name: string) => {
                                if (name === '置信度') return [`${v}%`, name];
                                if (name === '提升度') return [`${v}x`, name];
                                return [`${v} 条`, name];
                              }}
                            />
                            <Scatter
                              data={scatterData}
                              shape={(props: any) => {
                                const { cx, cy, node } = props;
                                const r = Math.max(5, Math.min(14, (node?.z ?? props.payload?.z ?? 100) / 50));
                                const fill = scatterColor(props.payload?.status ?? 'pending');
                                return <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.75} stroke={fill} strokeWidth={1} />;
                              }}
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                        {/* Scatter legend */}
                        <div className="flex gap-4 mt-2">
                          {[
                            { label: '待审核', color: '#3b82f6' },
                            { label: '已采纳', color: '#10b981' },
                            { label: '已拒绝', color: '#9ca3af' },
                          ].map(l => (
                            <span key={l.label} className="flex items-center gap-1 text-[10px] text-gray-500">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: l.color, opacity: 0.8 }} />
                              {l.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Sort toolbar */}
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-[11px] text-gray-400 mr-1">排序：</span>
              {([
                { key: 'confidence' as SortKey, label: '置信度' },
                { key: 'support'    as SortKey, label: '支持度' },
                { key: 'lift'       as SortKey, label: '提升度' },
                { key: 'coverage'   as SortKey, label: '覆盖数' },
              ]).map(({ key, label }) => {
                const active = sortKey === key;
                return (
                  <button key={key} onClick={() => handleSort(key)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                    }`}>
                    {label}
                    {active && (
                      <span className="text-[10px] leading-none">
                        {sortAsc ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                );
              })}
              <span className="ml-auto text-[11px] text-gray-400">
                {candidateRules.filter(r => (candidateFilter === 'all' || r.status === candidateFilter) && (!candidateSearch.trim() || r.rule.toLowerCase().includes(candidateSearch.toLowerCase()) || r.source.toLowerCase().includes(candidateSearch.toLowerCase()) || r.category.toLowerCase().includes(candidateSearch.toLowerCase()))).length} 条结果
              </span>
            </div>

            {/* Candidate list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
              {candidateRules
                .filter(r => {
                  const matchStatus = candidateFilter === 'all' || r.status === candidateFilter;
                  const q = candidateSearch.trim().toLowerCase();
                  const matchSearch = !q
                    || r.rule.toLowerCase().includes(q)
                    || r.source.toLowerCase().includes(q)
                    || r.category.toLowerCase().includes(q);
                  return matchStatus && matchSearch;
                })
                .sort((a, b) => {
                  const v = sortKey === 'coverage'
                    ? (a.coverage - b.coverage)
                    : (a[sortKey] - b[sortKey]);
                  return sortAsc ? v : -v;
                })
                .map(cr => {
                  const isExpanded = expandedCandidate === cr.id;
                  const statusCfg = {
                    pending: { label: '待审核', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                    accepted: { label: '已采纳', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
                    rejected: { label: '已拒绝', bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200' },
                  }[cr.status];

                  const confColor = cr.confidence >= 0.85 ? 'text-green-600 bg-green-50 border-green-200'
                    : cr.confidence >= 0.70 ? 'text-blue-600 bg-blue-50 border-blue-200'
                    : 'text-amber-600 bg-amber-50 border-amber-200';
                  const confBar = cr.confidence >= 0.85 ? 'bg-green-500'
                    : cr.confidence >= 0.70 ? 'bg-blue-500' : 'bg-amber-400';

                  const isAboveThreshold = cr.status === 'pending' && cr.confidence >= confidenceThreshold;
                  return (
                    <div key={cr.id}
                      className={`bg-white border rounded-xl overflow-hidden transition-all ${cr.status === 'rejected' ? 'opacity-60' : ''} ${isAboveThreshold ? 'border-blue-400 shadow-sm shadow-blue-100' : statusCfg.border}`}>
                      {/* Card header */}
                      <div className="flex items-start gap-3 px-5 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                              {statusCfg.label}
                            </span>
                            {isAboveThreshold && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />将被批量采纳
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">{cr.category}</span>
                            <span className="text-[10px] text-gray-400">{cr.source}</span>
                            <span className="text-[10px] text-gray-300 ml-auto">{cr.generatedAt}</span>
                          </div>
                          <p className="text-sm font-mono text-gray-800 leading-relaxed">{cr.rule}</p>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-6">
                        {/* Confidence */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider whitespace-nowrap">置信度</span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${confBar}`} style={{ width: `${cr.confidence * 100}%` }} />
                          </div>
                          <span className={`text-xs font-bold border px-1.5 py-0.5 rounded ${confColor}`}>
                            {(cr.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        {/* Support */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider whitespace-nowrap">支持度</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-purple-400" style={{ width: `${cr.support * 100}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-purple-600">{(cr.support * 100).toFixed(0)}%</span>
                        </div>
                        {/* Lift */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">提升度</span>
                          <span className={`text-xs font-bold ${cr.lift >= 3 ? 'text-green-600' : cr.lift >= 2 ? 'text-blue-600' : 'text-gray-600'}`}>
                            {cr.lift.toFixed(2)}x
                          </span>
                        </div>
                        {/* Coverage */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider">覆盖实例</span>
                          <span className="text-xs font-semibold text-gray-700">{cr.coverage.toLocaleString()} 条</span>
                        </div>
                        {/* Expand */}
                        <button onClick={() => setExpandedCandidate(isExpanded ? null : cr.id)}
                          className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                          示例{isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {/* Decision buttons */}
                        {cr.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleCandidateDecision(cr.id, 'rejected')}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 rounded-lg transition-colors">
                              <X className="w-3 h-3" />拒绝
                            </button>
                            <button onClick={() => handleCandidateDecision(cr.id, 'accepted')}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                              <Check className="w-3 h-3" />采纳入库
                            </button>
                          </div>
                        )}
                        {cr.status !== 'pending' && (
                          <button onClick={() => setCandidateRules(prev => prev.map(r => r.id === cr.id ? { ...r, status: 'pending' } : r))}
                            className="text-[11px] text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg transition-colors">
                            撤回
                          </button>
                        )}
                      </div>

                      {/* Expanded example */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">典型示例</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-white border border-gray-200 rounded px-2 py-1 text-gray-800 font-medium">{cr.exampleSubject}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-500">{cr.exampleRelation}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            <span className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-blue-800 font-medium">{cr.exampleObject}</span>
                          </div>
                          <div className="mt-2.5 grid grid-cols-3 gap-3">
                            {[
                              { label: '置信度解读', value: cr.confidence >= 0.85 ? '高度可信，建议直接采纳' : cr.confidence >= 0.70 ? '较可信，建议结合业务判断' : '置信度偏低，谨慎采纳' },
                              { label: '支持度解读', value: cr.support >= 0.3 ? '高频出现，泛化性强' : cr.support >= 0.15 ? '中等频率，具有一定代表性' : '低频模式，可能属于长尾场景' },
                              { label: '提升度解读', value: cr.lift >= 3 ? '强正相关，规则质量优秀' : cr.lift >= 2 ? '明显相关，规则有效' : '相关性一般，需人工确认' },
                            ].map(item => (
                              <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-2.5">
                                <div className="text-[10px] text-gray-400 mb-0.5">{item.label}</div>
                                <div className="text-[11px] text-gray-700">{item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

      </div>

      {/* Agent Drawer overlay */}
      {editingRule && (
        <AgentRuleDrawer
          rule={editingRule}
          isNew={editingIsNew}
          onClose={() => setEditingRule(null)}
          onSave={handleSave}
        />
      )}

      {/* Version History Panel */}
      {versionHistoryRule && (
        <VersionHistoryPanel
          rule={versionHistoryRule}
          onClose={() => setVersionHistoryRule(null)}
          onRollback={(version) => {
            setRules(prev => prev.map(r => r.id === versionHistoryRule.id
              ? { ...r, updatedAt: new Date().toLocaleString('zh-CN'), description: `[回滚至 ${version.version}] ${r.description}` }
              : r
            ));
          }}
        />
      )}
    </DndProvider>
  );
}
