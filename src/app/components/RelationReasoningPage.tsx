import { useState, useRef, useEffect } from 'react';
import {
  GitBranch, Play, Check, X, ChevronRight, BookOpen, Route,
  AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import type { RelationReasoningFocus } from '../data/auditPageMap';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FactTriple {
  subject: string;
  predicate: string;
  object: string;
}

interface HornRule {
  id: string;
  name: string;
  clause: string;
  enabled: boolean;
}

interface PathPattern {
  id: string;
  pattern: string;
  relPath: string[];
  support: number;
  confidence: number;
  count: number;
}

interface InferredRelation {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  source: 'rule' | 'path';
  sourceDetail: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SAMPLE_FACTS: FactTriple[] = [
  { subject: '张明', predicate: '就职于', object: '清华大学' },
  { subject: '李华', predicate: '就职于', object: '清华大学' },
  { subject: '张明', predicate: '研究方向', object: '知识图谱' },
  { subject: '李华', predicate: '研究方向', object: '自然语言处理' },
  { subject: '清华大学', predicate: '位于', object: '北京' },
  { subject: '王磊', predicate: '就职于', object: '北京大学' },
  { subject: '王磊', predicate: '合作者', object: '张明' },
];

const HORN_RULES: HornRule[] = [
  {
    id: 'r1',
    name: '同机构同事推断',
    clause: '就职于(X,A) ∧ 就职于(Y,A) ∧ X≠Y → 同事(X,Y)',
    enabled: true,
  },
  {
    id: 'r2',
    name: '同领域研究关联',
    clause: '研究方向(X,D) ∧ 研究方向(Y,D) → 同领域(X,Y)',
    enabled: true,
  },
  {
    id: 'r3',
    name: '机构地理归属',
    clause: '就职于(X,A) ∧ 位于(A,L) → 工作地(X,L)',
    enabled: true,
  },
  {
    id: 'r4',
    name: '合作者对称性',
    clause: '合作者(X,Y) → 合作者(Y,X)',
    enabled: false,
  },
];

const PATH_PATTERNS: PathPattern[] = [
  {
    id: 'p1',
    pattern: '就职于 → 就职于 → 同事',
    relPath: ['就职于', '就职于'],
    support: 0.68,
    confidence: 0.91,
    count: 284,
  },
  {
    id: 'p2',
    pattern: '研究方向 → 研究方向 → 同领域',
    relPath: ['研究方向', '研究方向'],
    support: 0.54,
    confidence: 0.87,
    count: 156,
  },
  {
    id: 'p3',
    pattern: '就职于 → 位于 → 工作地',
    relPath: ['就职于', '位于'],
    support: 0.72,
    confidence: 0.94,
    count: 412,
  },
  {
    id: 'p4',
    pattern: '合作者 → 就职于 → 机构关联',
    relPath: ['合作者', '就职于'],
    support: 0.41,
    confidence: 0.79,
    count: 98,
  },
];

const RULE_INFERENCES: Omit<InferredRelation, 'id' | 'status'>[] = [
  { subject: '张明', predicate: '同事', object: '李华', confidence: 0.93, source: 'rule', sourceDetail: '同机构同事推断' },
  { subject: '张明', predicate: '工作地', object: '北京', confidence: 0.96, source: 'rule', sourceDetail: '机构地理归属' },
  { subject: '李华', predicate: '工作地', object: '北京', confidence: 0.96, source: 'rule', sourceDetail: '机构地理归属' },
];

const PATH_INFERENCES: Omit<InferredRelation, 'id' | 'status'>[] = [
  { subject: '王磊', predicate: '机构关联', object: '清华大学', confidence: 0.82, source: 'path', sourceDetail: '合作者 → 就职于 → 机构关联' },
  { subject: '张明', predicate: '同领域', object: '李华', confidence: 0.74, source: 'path', sourceDetail: '研究方向 → 研究方向 → 同领域' },
  { subject: '王磊', predicate: '工作地', object: '北京', confidence: 0.88, source: 'path', sourceDetail: '就职于 → 位于 → 工作地' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface RelationReasoningPageProps {
  initialFocus?: RelationReasoningFocus;
}

export default function RelationReasoningPage({ initialFocus = 'rule' }: RelationReasoningPageProps) {
  const [activeSection, setActiveSection] = useState<'rule' | 'path'>(
    initialFocus === 'path' ? 'path' : 'rule',
  );
  const [facts, setFacts] = useState<FactTriple[]>(SAMPLE_FACTS);
  const [rules, setRules] = useState<HornRule[]>(HORN_RULES);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['p1', 'p3']);
  const [ruleRunning, setRuleRunning] = useState(false);
  const [pathRunning, setPathRunning] = useState(false);
  const [ruleRan, setRuleRan] = useState(false);
  const [pathRan, setPathRan] = useState(false);
  const [inferred, setInferred] = useState<InferredRelation[]>([]);
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFocus === 'path') setActiveSection('path');
    else if (initialFocus === 'rule') setActiveSection('rule');
    if (initialFocus === 'review') {
      reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialFocus]);

  const pending = inferred.filter(r => r.status === 'pending');
  const approved = inferred.filter(r => r.status === 'approved');
  const rejected = inferred.filter(r => r.status === 'rejected');

  const appendInferences = (items: Omit<InferredRelation, 'id' | 'status'>[]) => {
    const ts = Date.now();
    setInferred(prev => {
      const existing = new Set(prev.map(r => `${r.subject}|${r.predicate}|${r.object}`));
      const next = items
        .filter(item => !existing.has(`${item.subject}|${item.predicate}|${item.object}`))
        .map((item, i) => ({
          ...item,
          id: `inf_${ts}_${i}`,
          status: 'pending' as const,
        }));
      return [...next, ...prev];
    });
    setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  };

  const runRuleInference = () => {
    setRuleRunning(true);
    setRuleRan(false);
    setTimeout(() => {
      const enabled = rules.filter(r => r.enabled);
      const results = RULE_INFERENCES.filter(r =>
        enabled.some(rule => rule.name === r.sourceDetail),
      );
      appendInferences(results.length > 0 ? results : RULE_INFERENCES.slice(0, 2));
      setRuleRunning(false);
      setRuleRan(true);
    }, 800);
  };

  const runPathInference = () => {
    setPathRunning(true);
    setPathRan(false);
    setTimeout(() => {
      const results = PATH_INFERENCES.filter(r =>
        selectedPatterns.some(pid => PATH_PATTERNS.find(p => p.id === pid)?.pattern === r.sourceDetail)
          || selectedPatterns.includes('p1') || selectedPatterns.includes('p3'),
      );
      appendInferences(results);
      setPathRunning(false);
      setPathRan(true);
    }, 900);
  };

  const updateStatus = (id: string, status: 'approved' | 'rejected') => {
    setInferred(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const togglePattern = (id: string) => {
    setSelectedPatterns(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const addFact = () => {
    setFacts(prev => [...prev, { subject: '', predicate: '', object: '' }]);
  };

  const updateFact = (idx: number, field: keyof FactTriple, value: string) => {
    setFacts(prev => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto p-6">
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2.5">
          <GitBranch className="w-6 h-6 text-indigo-600" />
          关系推理
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          基于 Horn 逻辑规则演绎推理与 PRA 路径模式预测，推理结果统一进入待审核队列
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-gray-200 flex-shrink-0">
        {[
          { id: 'rule' as const, label: '① 基于规则的推理', icon: BookOpen },
          { id: 'path' as const, label: '② 基于路径的推理', icon: Route },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeSection === id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Rule-based reasoning */}
      {activeSection === 'rule' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-shrink-0">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">输入事实（三元组）</h3>
              <p className="text-xs text-gray-500 mt-0.5">作为 Horn 规则推理的前置知识库</p>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                <span>主体</span><span>谓词</span><span>客体</span><span />
              </div>
              <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                {facts.map((f, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-3 py-2">
                    {(['subject', 'predicate', 'object'] as const).map(field => (
                      <input
                        key={field}
                        value={f[field]}
                        onChange={e => updateFact(i, field, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-400"
                      />
                    ))}
                    <span />
                  </div>
                ))}
              </div>
              <div className="px-3 py-2 border-t border-gray-100">
                <button type="button" onClick={addFact} className="text-xs text-indigo-600 hover:text-indigo-800">
                  + 添加事实
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Horn 逻辑规则配置</h3>
              <p className="text-xs text-gray-500 mt-0.5">选择并加载 Horn 子句规则进行演绎推理</p>
            </div>
            <div className="space-y-2">
              {rules.map(rule => (
                <label
                  key={rule.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    rule.enabled ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(rule.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                    <code className="text-[11px] font-mono text-gray-600 mt-0.5 block">{rule.clause}</code>
                  </div>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={runRuleInference}
              disabled={ruleRunning || rules.filter(r => r.enabled).length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg"
            >
              <Play className="w-3.5 h-3.5" />
              {ruleRunning ? '演绎推理中…' : '执行规则推理'}
            </button>
            {ruleRan && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                推理完成，新关系已加入下方待审核列表
              </p>
            )}
          </div>
        </div>
      )}

      {/* Path-based reasoning */}
      {activeSection === 'path' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-shrink-0">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">高频路径模式（PRA）</h3>
              <p className="text-xs text-gray-500 mt-0.5">从知识图谱中学习的高频关系路径模式</p>
            </div>
            <div className="space-y-2">
              {PATH_PATTERNS.map(p => {
                const on = selectedPatterns.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePattern(p.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      on ? 'border-purple-200 bg-purple-50/60' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{p.pattern}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${on ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {on ? '已选' : '未选'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>支持度 {(p.support * 100).toFixed(0)}%</span>
                      <span>置信度 {(p.confidence * 100).toFixed(0)}%</span>
                      <span>出现 {p.count} 次</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">路径推理说明</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                PRA（Path Ranking Algorithm）基于路径模式对候选关系打分并预测新链接
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm text-gray-700 space-y-2">
              <p>算法流程：</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                <li>从图谱中抽取满足路径模式的关系链</li>
                <li>对每条候选路径计算路径特征向量</li>
                <li>基于路径频率与置信度加权预测新关系</li>
                <li>输出 Top-K 候选关系及路径证据</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={runPathInference}
              disabled={pathRunning || selectedPatterns.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg"
            >
              <Play className="w-3.5 h-3.5" />
              {pathRunning ? 'PRA 推理中…' : '执行路径推理'}
            </button>
            {pathRan && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                路径预测完成，新关系已加入下方待审核列表
              </p>
            )}
          </div>
        </div>
      )}

      {/* Review queue — shared */}
      <div ref={reviewRef} className="flex-shrink-0 border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              ③ 推理结果审核
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              规则推理与路径推理产出的新关系统一进入待审核队列，供人工确认后入库
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              待审核 {pending.length}
            </span>
            <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
              已通过 {approved.length}
            </span>
            <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
              已拒绝 {rejected.length}
            </span>
          </div>
        </div>

        {inferred.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-500">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            暂无推理结果。请在上方执行规则推理或路径推理，新关系将自动进入此列表。
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_80px_140px_120px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
              <span>推理三元组</span>
              <span>来源</span>
              <span>置信度</span>
              <span>依据</span>
              <span>操作</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {inferred.map(row => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[1fr_100px_80px_140px_120px] gap-2 px-4 py-3 items-center text-sm ${
                    row.status === 'approved' ? 'bg-green-50/40' : row.status === 'rejected' ? 'bg-red-50/30 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-medium text-gray-900 truncate">{row.subject}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-indigo-700 font-medium truncate">{row.predicate}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{row.object}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit ${
                    row.source === 'rule' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {row.source === 'rule' ? '规则推理' : '路径推理'}
                  </span>
                  <span className="text-xs font-mono text-gray-700">{(row.confidence * 100).toFixed(0)}%</span>
                  <span className="text-xs text-gray-500 truncate" title={row.sourceDetail}>{row.sourceDetail}</span>
                  <div className="flex gap-1">
                    {row.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus(row.id, 'approved')}
                          className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                          title="确认入库"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(row.id, 'rejected')}
                          className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                          title="拒绝"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {row.status === 'approved' ? '已确认' : '已拒绝'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
