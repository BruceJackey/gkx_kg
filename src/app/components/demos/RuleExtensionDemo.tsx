import { useState } from 'react';
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown, Plus, X, CheckCircle, Info } from 'lucide-react';

// ── ontology ─────────────────────────────────────────────────────────────────

interface OntologyNode {
  id: string;
  label: string;
  parent?: string;
  children: string[];
  examples: string[];
}

const ONTOLOGY: Record<string, OntologyNode> = {
  entity: { id: 'entity', label: '实体 (Entity)', children: ['person', 'organization', 'location', 'concept'], examples: [] },
  person: { id: 'person', label: '人物 (Person)', parent: 'entity', children: ['researcher', 'engineer', 'student'], examples: ['张明', '李华', '王芳'] },
  organization: { id: 'organization', label: '机构 (Organization)', parent: 'entity', children: ['university', 'company', 'institute'], examples: ['企业A', '机构B'] },
  location: { id: 'location', label: '地点 (Location)', parent: 'entity', children: ['city', 'country', 'campus'], examples: ['北京', '上海'] },
  concept: { id: 'concept', label: '概念 (Concept)', parent: 'entity', children: ['domain', 'technology', 'method'], examples: ['知识图谱', '机器学习'] },
  researcher: { id: 'researcher', label: '研究员 (Researcher)', parent: 'person', children: [], examples: ['张明', '李华'] },
  engineer: { id: 'engineer', label: '工程师 (Engineer)', parent: 'person', children: [], examples: ['王工', '刘工'] },
  student: { id: 'student', label: '学生 (Student)', parent: 'person', children: ['phd_student', 'undergrad'], examples: ['小明', '小华'] },
  phd_student: { id: 'phd_student', label: '博士生 (PhD Student)', parent: 'student', children: [], examples: ['张博', '李博'] },
  undergrad: { id: 'undergrad', label: '本科生 (Undergrad)', parent: 'student', children: [], examples: ['王本', '赵本'] },
  university: { id: 'university', label: '高校 (University)', parent: 'organization', children: ['top_uni', 'general_uni'], examples: ['清华大学', '北京大学'] },
  company: { id: 'company', label: '企业 (Company)', parent: 'organization', children: [], examples: ['科技公司X', '互联网公司Y'] },
  institute: { id: 'institute', label: '研究院 (Institute)', parent: 'organization', children: [], examples: ['中科院计算所', '清华AIR'] },
  top_uni: { id: 'top_uni', label: '顶尖高校 (Top University)', parent: 'university', children: [], examples: ['清华大学', '北京大学', '中科大'] },
  general_uni: { id: 'general_uni', label: '普通高校 (General University)', parent: 'university', children: [], examples: ['普通大学A', '普通大学B'] },
  city: { id: 'city', label: '城市 (City)', parent: 'location', children: [], examples: ['北京', '上海', '深圳'] },
  country: { id: 'country', label: '国家 (Country)', parent: 'location', children: [], examples: ['中国', '美国'] },
  campus: { id: 'campus', label: '校区 (Campus)', parent: 'location', children: [], examples: ['清华园', '燕园'] },
  domain: { id: 'domain', label: '领域 (Domain)', parent: 'concept', children: ['ai_domain', 'science_domain'], examples: ['人工智能', '生命科学'] },
  technology: { id: 'technology', label: '技术 (Technology)', parent: 'concept', children: [], examples: ['知识图谱', '深度学习'] },
  method: { id: 'method', label: '方法 (Method)', parent: 'concept', children: [], examples: ['TransE', 'BERT'] },
  ai_domain: { id: 'ai_domain', label: 'AI 领域 (AI Domain)', parent: 'domain', children: [], examples: ['自然语言处理', '计算机视觉'] },
  science_domain: { id: 'science_domain', label: '自然科学 (Natural Science)', parent: 'domain', children: [], examples: ['物理', '化学', '生物'] },
};

// ── rule structures ───────────────────────────────────────────────────────────

interface RulePart {
  subject: string;
  predicate: string;
  object: string;
}

interface Rule {
  id: string;
  conditions: RulePart[];
  conclusion: RulePart;
  confidence: number;
  support: number;
  label: string;
}

const BASE_RULES: Rule[] = [
  {
    id: 'r1',
    label: '研究员就职于顶尖高校 → 发表于顶刊',
    conditions: [
      { subject: '?x', predicate: '类型', object: 'researcher' },
      { subject: '?x', predicate: '就职于', object: '?y' },
      { subject: '?y', predicate: '类型', object: 'top_uni' },
    ],
    conclusion: { subject: '?x', predicate: '发表于', object: '?z(顶刊)' },
    confidence: 0.83,
    support: 124,
  },
  {
    id: 'r2',
    label: '博士生隶属高校 → 从事 AI 领域研究',
    conditions: [
      { subject: '?x', predicate: '类型', object: 'phd_student' },
      { subject: '?x', predicate: '隶属于', object: '?y' },
      { subject: '?y', predicate: '类型', object: 'university' },
    ],
    conclusion: { subject: '?x', predicate: '从事', object: '?z(AI领域)' },
    confidence: 0.71,
    support: 88,
  },
  {
    id: 'r3',
    label: '工程师在企业工作 → 拥有编程技术',
    conditions: [
      { subject: '?x', predicate: '类型', object: 'engineer' },
      { subject: '?x', predicate: '工作于', object: '?y' },
      { subject: '?y', predicate: '类型', object: 'company' },
    ],
    conclusion: { subject: '?x', predicate: '掌握', object: '?z(编程技术)' },
    confidence: 0.91,
    support: 203,
  },
];

// ── generalisation results ────────────────────────────────────────────────────

interface GeneralizedRule {
  step: number;
  description: string;
  rule: Rule;
  changedParts: string[];
  confidence: number;
  coverage: number;
}

function getAncestors(id: string): string[] {
  const result: string[] = [];
  let cur: OntologyNode | undefined = ONTOLOGY[id];
  while (cur?.parent) {
    result.push(cur.parent);
    cur = ONTOLOGY[cur.parent];
  }
  return result;
}

function getChildren(id: string): string[] {
  return ONTOLOGY[id]?.children ?? [];
}

function generalize(rule: Rule): GeneralizedRule[] {
  const results: GeneralizedRule[] = [];
  rule.conditions.forEach((cond, ci) => {
    if (!cond.object.startsWith('?')) {
      const ancestors = getAncestors(cond.object);
      ancestors.forEach((anc, ai) => {
        const newConds = rule.conditions.map((c, i) =>
          i === ci ? { ...c, object: anc } : c
        );
        const coverageMult = (ai + 2) * 1.8;
        results.push({
          step: results.length + 1,
          description: `将条件 "${ONTOLOGY[cond.object]?.label ?? cond.object}" 泛化为父类 "${ONTOLOGY[anc]?.label ?? anc}"`,
          rule: { ...rule, id: `${rule.id}_gen_${results.length}`, conditions: newConds, confidence: +(rule.confidence * (0.92 - ai * 0.06)).toFixed(2), support: Math.round(rule.support * coverageMult) },
          changedParts: [`cond-${ci}`],
          confidence: +(rule.confidence * (0.92 - ai * 0.06)).toFixed(2),
          coverage: Math.round(coverageMult * 100) / 100,
        });
      });
    }
  });
  return results.slice(0, 4);
}

function specialize(rule: Rule): Array<{ type: 'subclass' | 'constraint'; description: string; rule: Rule; changedParts: string[]; confidence: number }> {
  const results: Array<{ type: 'subclass' | 'constraint'; description: string; rule: Rule; changedParts: string[]; confidence: number }> = [];

  rule.conditions.forEach((cond, ci) => {
    if (!cond.object.startsWith('?')) {
      const children = getChildren(cond.object);
      children.forEach(child => {
        const newConds = rule.conditions.map((c, i) =>
          i === ci ? { ...c, object: child } : c
        );
        results.push({
          type: 'subclass',
          description: `将 "${ONTOLOGY[cond.object]?.label ?? cond.object}" 下推至子类 "${ONTOLOGY[child]?.label ?? child}"`,
          rule: { ...rule, id: `${rule.id}_spec_${results.length}`, conditions: newConds, confidence: +(Math.min(0.99, rule.confidence * 1.08)).toFixed(2), support: Math.round(rule.support * 0.45) },
          changedParts: [`cond-${ci}`],
          confidence: +(Math.min(0.99, rule.confidence * 1.08)).toFixed(2),
        });
      });
    }
  });

  // constraint additions
  const extraConstraints: RulePart[] = [
    { subject: '?x', predicate: '发表年份', object: '>= 2020' },
    { subject: '?x', predicate: '合作者数量', object: '>= 3' },
    { subject: '?y', predicate: '排名', object: 'Top-100' },
    { subject: '?x', predicate: '引用量', object: '>= 50' },
  ];

  extraConstraints.slice(0, 2).forEach((extra, ei) => {
    results.push({
      type: 'constraint',
      description: `增加约束条件：${extra.subject} ${extra.predicate} ${extra.object}`,
      rule: { ...rule, id: `${rule.id}_cstr_${ei}`, conditions: [...rule.conditions, extra], confidence: +(Math.min(0.99, rule.confidence + 0.05 + ei * 0.02)).toFixed(2), support: Math.round(rule.support * 0.38) },
      changedParts: [`new-cond-${rule.conditions.length}`],
      confidence: +(Math.min(0.99, rule.confidence + 0.05 + ei * 0.02)).toFixed(2),
    });
  });

  return results.slice(0, 5);
}

// ── ontology tree viewer ──────────────────────────────────────────────────────

function OntologyTree({ nodeId, depth = 0, highlight }: { nodeId: string; depth?: number; highlight?: string }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const node = ONTOLOGY[nodeId];
  if (!node) return null;
  const isHL = nodeId === highlight;
  return (
    <div className={`${depth > 0 ? 'ml-4 border-l border-gray-200 pl-2' : ''}`}>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${isHL ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
        onClick={() => node.children.length > 0 && setExpanded(!expanded)}
      >
        {node.children.length > 0 ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        ) : <span className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="text-xs">{node.label}</span>
        {node.examples.length > 0 && (
          <span className="text-[10px] text-gray-400 ml-1">({node.examples.slice(0, 2).join(', ')})</span>
        )}
      </div>
      {expanded && node.children.map(c => (
        <OntologyTree key={c} nodeId={c} depth={depth + 1} highlight={highlight} />
      ))}
    </div>
  );
}

// ── rule display ──────────────────────────────────────────────────────────────

function RuleCard({ rule, changedParts = [], highlight = 'none' }: {
  rule: Rule; changedParts?: string[]; highlight?: 'gen' | 'spec' | 'none';
}) {
  const hlBg = highlight === 'gen' ? 'bg-blue-50 border-blue-300' : highlight === 'spec' ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200';
  return (
    <div className={`rounded-xl border p-3 ${hlBg}`}>
      <div className="space-y-1 mb-2">
        {rule.conditions.map((c, i) => {
          const isChanged = changedParts.includes(`cond-${i}`);
          const isNew = changedParts.includes(`new-cond-${i}`);
          return (
            <div key={i} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${isNew ? 'bg-purple-200 text-purple-900 font-semibold' : isChanged ? (highlight === 'gen' ? 'bg-blue-200 text-blue-900 font-semibold' : 'bg-purple-200 text-purple-900 font-semibold') : 'text-gray-700'}`}>
              <span className="text-gray-400 w-4 text-center">IF</span>
              <span className="font-mono">{c.subject}</span>
              <span className="text-gray-500">—[{c.predicate}]→</span>
              <span className="font-mono">{ONTOLOGY[c.object]?.label ?? c.object}</span>
              {isNew && <span className="ml-1 text-[10px] bg-purple-500 text-white px-1 rounded">新增</span>}
              {isChanged && !isNew && <span className={`ml-1 text-[10px] px-1 rounded text-white ${highlight === 'gen' ? 'bg-blue-500' : 'bg-purple-500'}`}>{highlight === 'gen' ? '已泛化' : '已特化'}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-xs px-2 py-1 bg-white rounded-md border border-dashed border-gray-300">
        <span className="text-green-600 font-bold w-10">THEN</span>
        <span className="font-mono text-gray-700">{rule.conclusion.subject}</span>
        <span className="text-gray-500">—[{rule.conclusion.predicate}]→</span>
        <span className="font-mono text-gray-700">{rule.conclusion.object}</span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span>置信度 <span className="font-mono font-semibold text-gray-800">{(rule.confidence * 100).toFixed(0)}%</span></span>
        <span>支持数 <span className="font-mono font-semibold text-gray-800">{rule.support}</span></span>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function RuleExtensionDemo() {
  const [activeSection, setActiveSection] = useState<'generalize' | 'specialize'>('generalize');

  // generalize state
  const [genRuleId, setGenRuleId] = useState('r1');
  const [genResults, setGenResults] = useState<GeneralizedRule[]>([]);
  const [genRunning, setGenRunning] = useState(false);
  const [genSelectedIdx, setGenSelectedIdx] = useState<number | null>(null);
  const [genShowOntology, setGenShowOntology] = useState(false);

  // specialize state
  const [specRuleId, setSpecRuleId] = useState('r1');
  const [specResults, setSpecResults] = useState<ReturnType<typeof specialize>>([]);
  const [specRunning, setSpecRunning] = useState(false);
  const [specSelectedIdx, setSpecSelectedIdx] = useState<number | null>(null);
  const [customConstraints, setCustomConstraints] = useState<RulePart[]>([]);
  const [newConstraint, setNewConstraint] = useState({ subject: '?x', predicate: '', object: '' });

  const baseRule = BASE_RULES.find(r => r.id === genRuleId) ?? BASE_RULES[0];
  const specBaseRule = BASE_RULES.find(r => r.id === specRuleId) ?? BASE_RULES[0];

  const runGeneralize = () => {
    setGenRunning(true); setGenResults([]); setGenSelectedIdx(null);
    setTimeout(() => {
      setGenResults(generalize(baseRule));
      setGenRunning(false);
    }, 700);
  };

  const runSpecialize = () => {
    setSpecRunning(true); setSpecResults([]); setSpecSelectedIdx(null);
    const base = { ...specBaseRule, conditions: [...specBaseRule.conditions, ...customConstraints] };
    setTimeout(() => {
      setSpecResults(specialize(base));
      setSpecRunning(false);
    }, 700);
  };

  const addConstraint = () => {
    if (!newConstraint.predicate || !newConstraint.object) return;
    setCustomConstraints(prev => [...prev, { ...newConstraint }]);
    setNewConstraint({ subject: '?x', predicate: '', object: '' });
  };

  const SECTIONS = [
    { id: 'generalize' as const, label: '① 规则泛化' },
    { id: 'specialize' as const, label: '② 规则特化' },
  ];

  return (
    <div className="space-y-5">
      {/* Section nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ① Generalize ── */}
      {activeSection === 'generalize' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">规则泛化</h3>
            <p className="text-sm text-gray-500 mt-0.5">基于本体层级关系，将规则中的具体实体类型向上推广至父类，生成覆盖范围更广的通用规则</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Left: controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">选择基础规则</label>
                <div className="space-y-2">
                  {BASE_RULES.map(r => (
                    <button key={r.id} onClick={() => { setGenRuleId(r.id); setGenResults([]); setGenSelectedIdx(null); }}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${genRuleId === r.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-xs font-medium text-gray-800">{r.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">置信度 {(r.confidence * 100).toFixed(0)}% · 支持数 {r.support}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">本体层级结构</label>
                  <button onClick={() => setGenShowOntology(!genShowOntology)}
                    className="text-xs text-indigo-600 hover:text-indigo-800">{genShowOntology ? '收起' : '展开'}</button>
                </div>
                {genShowOntology && (
                  <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                    <OntologyTree nodeId="entity" />
                  </div>
                )}
              </div>

              <button onClick={runGeneralize} disabled={genRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                <ArrowUp className="w-4 h-4" />{genRunning ? '泛化中…' : '执行规则泛化'}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">泛化效果</p>
                    <ul className="space-y-0.5 text-blue-700">
                      <li>• 覆盖范围扩大 1.8–5×，支持数显著增加</li>
                      <li>• 置信度随泛化层级上升而小幅下降</li>
                      <li>• 适合探索更通用的领域规律</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: results */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600">原始规则</p>
              <RuleCard rule={baseRule} highlight="none" />

              {genResults.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-blue-200" />
                    <span className="text-xs text-blue-600 font-medium">泛化结果（{genResults.length} 条）</span>
                    <div className="flex-1 h-px bg-blue-200" />
                  </div>
                  <div className="space-y-2">
                    {genResults.map((gr, idx) => (
                      <div key={gr.step}>
                        <button
                          onClick={() => setGenSelectedIdx(genSelectedIdx === idx ? null : idx)}
                          className={`w-full text-left p-2.5 rounded-xl border-2 transition-all ${genSelectedIdx === idx ? 'border-blue-400' : 'border-gray-200 hover:border-blue-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">L{gr.step}</span>
                              <span className="text-xs text-gray-700">{gr.description}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-shrink-0">
                              <span>覆盖 <span className="font-semibold text-blue-700">×{gr.coverage}</span></span>
                              <span>置信度 <span className="font-semibold">{(gr.confidence * 100).toFixed(0)}%</span></span>
                            </div>
                          </div>
                        </button>
                        {genSelectedIdx === idx && (
                          <div className="mt-1.5 ml-2">
                            <RuleCard rule={gr.rule} changedParts={gr.changedParts} highlight="gen" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {genRunning && (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  <span className="animate-pulse">遍历本体层级中…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ② Specialize ── */}
      {activeSection === 'specialize' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">规则特化</h3>
            <p className="text-sm text-gray-500 mt-0.5">将规则中的类别向下推至子类，或增加额外的约束条件，生成适用范围更窄但精确度更高的规则</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Left: controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">选择基础规则</label>
                <div className="space-y-2">
                  {BASE_RULES.map(r => (
                    <button key={r.id} onClick={() => { setSpecRuleId(r.id); setSpecResults([]); setSpecSelectedIdx(null); }}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${specRuleId === r.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-xs font-medium text-gray-800">{r.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">置信度 {(r.confidence * 100).toFixed(0)}% · 支持数 {r.support}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom constraint */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">手动添加约束条件</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <select value={newConstraint.subject} onChange={e => setNewConstraint(p => ({ ...p, subject: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-400">
                      {['?x', '?y', '?z'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <input placeholder="谓词" value={newConstraint.predicate} onChange={e => setNewConstraint(p => ({ ...p, predicate: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-400" />
                    <input placeholder="值/范围" value={newConstraint.object} onChange={e => setNewConstraint(p => ({ ...p, object: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-purple-400" />
                  </div>
                  <button onClick={addConstraint} disabled={!newConstraint.predicate || !newConstraint.object}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-purple-300 text-purple-700 rounded-lg text-xs hover:bg-purple-50 disabled:opacity-40 transition-colors">
                    <Plus className="w-3.5 h-3.5" />添加约束
                  </button>
                  {customConstraints.length > 0 && (
                    <div className="space-y-1">
                      {customConstraints.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs">
                          <span className="font-mono text-purple-700 flex-1">{c.subject} {c.predicate} {c.object}</span>
                          <button onClick={() => setCustomConstraints(prev => prev.filter((_, j) => j !== i))}>
                            <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button onClick={runSpecialize} disabled={specRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                <ArrowDown className="w-4 h-4" />{specRunning ? '特化中…' : '执行规则特化'}
              </button>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">特化效果</p>
                    <ul className="space-y-0.5 text-purple-700">
                      <li>• 置信度提升 5–15%，精确率更高</li>
                      <li>• 支持数减少约 55–62%，覆盖范围缩小</li>
                      <li>• 适合需要高精度决策的细分场景</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: results */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-600">原始规则</p>
              <RuleCard rule={specBaseRule} highlight="none" />

              {specResults.length > 0 && (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-purple-200" />
                    <span className="text-xs text-purple-600 font-medium">特化结果（{specResults.length} 条）</span>
                    <div className="flex-1 h-px bg-purple-200" />
                  </div>
                  <div className="space-y-2">
                    {specResults.map((sr, idx) => (
                      <div key={idx}>
                        <button
                          onClick={() => setSpecSelectedIdx(specSelectedIdx === idx ? null : idx)}
                          className={`w-full text-left p-2.5 rounded-xl border-2 transition-all ${specSelectedIdx === idx ? 'border-purple-400' : 'border-gray-200 hover:border-purple-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${sr.type === 'subclass' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                {sr.type === 'subclass' ? '子类' : '约束'}
                              </span>
                              <span className="text-xs text-gray-700">{sr.description}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-shrink-0">
                              <span className="flex items-center gap-0.5 text-green-700">
                                <CheckCircle className="w-3 h-3" />{(sr.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </button>
                        {specSelectedIdx === idx && (
                          <div className="mt-1.5 ml-2">
                            <RuleCard rule={sr.rule} changedParts={sr.changedParts} highlight="spec" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* comparison table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
                    <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">特化前后对比</div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">指标</th>
                          <th className="text-center px-3 py-2 text-gray-500 font-medium">原始</th>
                          <th className="text-center px-3 py-2 text-gray-500 font-medium">子类特化</th>
                          <th className="text-center px-3 py-2 text-gray-500 font-medium">约束特化</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[
                          { label: '置信度', orig: `${(specBaseRule.confidence * 100).toFixed(0)}%`, sub: `${(Math.min(0.99, specBaseRule.confidence * 1.08) * 100).toFixed(0)}%`, cstr: `${(Math.min(0.99, specBaseRule.confidence + 0.05) * 100).toFixed(0)}%` },
                          { label: '支持数', orig: `${specBaseRule.support}`, sub: `${Math.round(specBaseRule.support * 0.45)}`, cstr: `${Math.round(specBaseRule.support * 0.38)}` },
                          { label: '适用场景', orig: '通用', sub: '细分子类', cstr: '受限条件' },
                        ].map(row => (
                          <tr key={row.label}>
                            <td className="px-3 py-2 font-medium text-gray-700">{row.label}</td>
                            <td className="px-3 py-2 text-center text-gray-600">{row.orig}</td>
                            <td className="px-3 py-2 text-center text-purple-700 font-semibold">{row.sub}</td>
                            <td className="px-3 py-2 text-center text-orange-700 font-semibold">{row.cstr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {specRunning && (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  <span className="animate-pulse">遍历子类与约束空间中…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
