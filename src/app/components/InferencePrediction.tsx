import { useState, useEffect } from 'react';
import {
  Brain, Zap, Filter, Search, Play, Plus, Trash2, Edit2,
  ToggleLeft, ToggleRight, ChevronRight, Check, ArrowRight
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MiningRule {
  id: string;
  antecedent: { entity: string; rel: string }[];
  consequentRel: string;
  confidence: number;
  support: number;
  evidenceCount: number;
  type: '链式规则' | '对称规则' | '逆关系规则' | '组合规则';
}

interface SavedRule {
  id: string;
  description: string;
  type: '链式规则' | '对称规则' | '逆关系规则' | '组合规则';
  confidence: number;
  support: number;
  enabled: boolean;
}

interface Prediction {
  id: string;
  targetEntity: string;
  entityType: '人物' | '组织' | '技术' | '概念';
  relation: string;
  confidence: number;
  path: { entity: string; rel: string }[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MINED_RULES: MiningRule[] = [
  { id: 'r1', antecedent: [{ entity: 'A', rel: '研究' }, { entity: 'B', rel: '应用于' }], consequentRel: '专精', confidence: 0.89, support: 0.42, evidenceCount: 156, type: '链式规则' },
  { id: 'r2', antecedent: [{ entity: 'A', rel: '隶属于' }, { entity: 'B', rel: '合作' }], consequentRel: '机构合作', confidence: 0.82, support: 0.35, evidenceCount: 98, type: '链式规则' },
  { id: 'r3', antecedent: [{ entity: 'A', rel: '引用' }, { entity: 'B', rel: '引用' }], consequentRel: '传承关系', confidence: 0.76, support: 0.58, evidenceCount: 234, type: '链式规则' },
  { id: 'r4', antecedent: [{ entity: 'A', rel: '合作' }], consequentRel: '合作', confidence: 0.91, support: 0.67, evidenceCount: 312, type: '对称规则' },
  { id: 'r5', antecedent: [{ entity: 'A', rel: '属于' }], consequentRel: '包含', confidence: 0.78, support: 0.45, evidenceCount: 187, type: '逆关系规则' },
  { id: 'r6', antecedent: [{ entity: 'A', rel: '开发' }, { entity: 'B', rel: '基于' }], consequentRel: '技术栈', confidence: 0.85, support: 0.31, evidenceCount: 76, type: '组合规则' },
  { id: 'r7', antecedent: [{ entity: 'A', rel: '发表' }, { entity: 'B', rel: '发表' }], consequentRel: '同领域', confidence: 0.72, support: 0.54, evidenceCount: 289, type: '链式规则' },
  { id: 'r8', antecedent: [{ entity: 'A', rel: '导师' }, { entity: 'B', rel: '导师' }], consequentRel: '学术谱系', confidence: 0.88, support: 0.29, evidenceCount: 143, type: '链式规则' },
  { id: 'r9', antecedent: [{ entity: 'A', rel: '竞争' }], consequentRel: '竞争', confidence: 0.93, support: 0.72, evidenceCount: 421, type: '对称规则' },
  { id: 'r10', antecedent: [{ entity: 'A', rel: '子概念' }], consequentRel: '父概念', confidence: 0.97, support: 0.88, evidenceCount: 567, type: '逆关系规则' },
  { id: 'r11', antecedent: [{ entity: 'A', rel: '使用' }, { entity: 'B', rel: '改进' }], consequentRel: '应用改进', confidence: 0.71, support: 0.26, evidenceCount: 64, type: '组合规则' },
  { id: 'r12', antecedent: [{ entity: 'A', rel: '位于' }, { entity: 'B', rel: '管辖' }], consequentRel: '行政归属', confidence: 0.94, support: 0.61, evidenceCount: 378, type: '链式规则' },
  { id: 'r13', antecedent: [{ entity: 'A', rel: '前身' }], consequentRel: '后续', confidence: 0.86, support: 0.43, evidenceCount: 201, type: '逆关系规则' },
  { id: 'r14', antecedent: [{ entity: 'A', rel: '参与' }, { entity: 'B', rel: '资助' }], consequentRel: '项目关联', confidence: 0.79, support: 0.33, evidenceCount: 112, type: '组合规则' },
  { id: 'r15', antecedent: [{ entity: 'A', rel: '基础于' }, { entity: 'B', rel: '扩展' }], consequentRel: '理论延伸', confidence: 0.83, support: 0.38, evidenceCount: 159, type: '链式规则' },
];

const SAVED_RULES: SavedRule[] = [
  { id: 's1', description: 'A 研究→应用于 B => A 专精 C', type: '链式规则', confidence: 0.89, support: 0.42, enabled: true },
  { id: 's2', description: 'A 合作 B => B 合作 A', type: '对称规则', confidence: 0.91, support: 0.67, enabled: true },
  { id: 's3', description: 'A 属于 B => B 包含 A', type: '逆关系规则', confidence: 0.78, support: 0.45, enabled: true },
  { id: 's4', description: 'A 开发→基于 B => A 技术栈 C', type: '组合规则', confidence: 0.85, support: 0.31, enabled: false },
  { id: 's5', description: 'A 引用→引用 B => A 传承关系 C', type: '链式规则', confidence: 0.76, support: 0.58, enabled: true },
  { id: 's6', description: 'A 子概念 B => B 父概念 A', type: '逆关系规则', confidence: 0.97, support: 0.88, enabled: true },
  { id: 's7', description: 'A 竞争 B => B 竞争 A', type: '对称规则', confidence: 0.93, support: 0.72, enabled: false },
  { id: 's8', description: 'A 位于→管辖 B => A 行政归属 C', type: '链式规则', confidence: 0.94, support: 0.61, enabled: true },
];

const PREDICTIONS: Prediction[] = [
  { id: 'p1', targetEntity: '图神经网络', entityType: '技术', relation: '基础于', confidence: 0.92, path: [{ entity: '知识图谱', rel: '使用' }, { entity: '深度学习', rel: '包含' }, { entity: '图神经网络', rel: '' }] },
  { id: 'p2', targetEntity: 'DeepMind', entityType: '组织', relation: '研究合作', confidence: 0.87, path: [{ entity: '知识图谱', rel: '应用于' }, { entity: 'AI研究', rel: '主导' }, { entity: 'DeepMind', rel: '' }] },
  { id: 'p3', targetEntity: '本体论', entityType: '概念', relation: '理论基础', confidence: 0.84, path: [{ entity: '知识图谱', rel: '依赖' }, { entity: '语义网', rel: '源自' }, { entity: '本体论', rel: '' }] },
  { id: 'p4', targetEntity: '李飞飞', entityType: '人物', relation: '推动者', confidence: 0.79, path: [{ entity: '知识图谱', rel: '关联' }, { entity: 'ImageNet', rel: '创建者' }, { entity: '李飞飞', rel: '' }] },
  { id: 'p5', targetEntity: 'SPARQL', entityType: '技术', relation: '查询语言', confidence: 0.96, path: [{ entity: '知识图谱', rel: '使用' }, { entity: 'RDF', rel: '查询' }, { entity: 'SPARQL', rel: '' }] },
  { id: 'p6', targetEntity: '斯坦福大学', entityType: '组织', relation: '学术归属', confidence: 0.73, path: [{ entity: '知识图谱', rel: '研究于' }, { entity: 'Protégé', rel: '开发' }, { entity: '斯坦福大学', rel: '' }] },
  { id: 'p7', targetEntity: '推荐系统', entityType: '技术', relation: '应用场景', confidence: 0.88, path: [{ entity: '知识图谱', rel: '增强' }, { entity: '个性化', rel: '实现' }, { entity: '推荐系统', rel: '' }] },
  { id: 'p8', targetEntity: '自然语言处理', entityType: '技术', relation: '交叉领域', confidence: 0.81, path: [{ entity: '知识图谱', rel: '融合' }, { entity: '文本理解', rel: '依赖' }, { entity: '自然语言处理', rel: '' }] },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value, threshold = 0.7 }: { value: number; threshold?: number }) {
  const isHigh = value >= threshold + 0.1;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isHigh ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
      {(value * 100).toFixed(0)}%
    </span>
  );
}

function EntityTypeChip({ type }: { type: Prediction['entityType'] }) {
  const map: Record<string, string> = {
    '人物': 'bg-purple-100 text-purple-700',
    '组织': 'bg-blue-100 text-blue-700',
    '技术': 'bg-cyan-100 text-cyan-700',
    '概念': 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[type]}`}>
      {type}
    </span>
  );
}

function RuleTypeChip({ type }: { type: SavedRule['type'] }) {
  const map: Record<string, string> = {
    '链式规则': 'bg-blue-50 text-blue-600',
    '对称规则': 'bg-indigo-50 text-indigo-600',
    '逆关系规则': 'bg-violet-50 text-violet-600',
    '组合规则': 'bg-teal-50 text-teal-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}

// ─── Tab 1: Rule Mining ───────────────────────────────────────────────────────

function RuleMining() {
  const [minConf, setMinConf] = useState(0.7);
  const [minSupport, setMinSupport] = useState(0.3);
  const [maxHops, setMaxHops] = useState(2);
  const [ruleTypes, setRuleTypes] = useState(['链式规则', '对称规则', '逆关系规则', '组合规则']);
  const [entityTypes, setEntityTypes] = useState(['人物', '组织', '技术', '概念']);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [addedRules, setAddedRules] = useState<Set<string>>(new Set());

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const handleMine = () => {
    setStatus('loading');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setStatus('done');
          return 100;
        }
        return p + 100 / 15;
      });
    }, 100);
  };

  const handleReset = () => {
    setMinConf(0.7);
    setMinSupport(0.3);
    setMaxHops(2);
    setRuleTypes(['链式规则', '对称规则', '逆关系规则', '组合规则']);
    setEntityTypes(['人物', '组织', '技术', '概念']);
    setStatus('idle');
    setProgress(0);
    setAddedRules(new Set());
  };

  const visibleRules = MINED_RULES.filter(r => r.confidence >= minConf && r.support >= minSupport);

  return (
    <div className="flex gap-5 h-full">
      {/* Config panel */}
      <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-5">
        <h3 className="text-sm font-semibold text-gray-900">挖掘参数配置</h3>

        {/* Min confidence */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-gray-600">最小置信度</label>
            <span className="text-xs font-semibold text-blue-600">{minConf.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={minConf}
            onChange={e => setMinConf(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600" />
        </div>

        {/* Min support */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-gray-600">最小支持度</label>
            <span className="text-xs font-semibold text-blue-600">{minSupport.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.01} value={minSupport}
            onChange={e => setMinSupport(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600" />
        </div>

        {/* Max hops */}
        <div>
          <label className="text-xs text-gray-600 block mb-2">最大跳数</label>
          <div className="flex gap-2">
            {[1, 2, 3].map(h => (
              <button key={h} onClick={() => setMaxHops(h)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${maxHops === h ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Rule types */}
        <div>
          <label className="text-xs text-gray-600 block mb-2">规则类型</label>
          <div className="flex flex-col gap-1.5">
            {(['链式规则', '对称规则', '逆关系规则', '组合规则'] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <span onClick={() => toggleItem(ruleTypes, setRuleTypes, t)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${ruleTypes.includes(t) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  {ruleTypes.includes(t) && <Check size={10} className="text-white" />}
                </span>
                <span className="text-xs text-gray-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Entity types */}
        <div>
          <label className="text-xs text-gray-600 block mb-2">实体类型范围</label>
          <div className="flex flex-col gap-1.5">
            {(['人物', '组织', '技术', '概念'] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <span onClick={() => toggleItem(entityTypes, setEntityTypes, t)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${entityTypes.includes(t) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  {entityTypes.includes(t) && <Check size={10} className="text-white" />}
                </span>
                <span className="text-xs text-gray-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          <button onClick={handleMine} disabled={status === 'loading'}
            className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            <Play size={14} />
            开始挖掘
          </button>
          <button onClick={handleReset}
            className="w-full py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            重置参数
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0 flex flex-col">
        {status === 'idle' && (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-4 text-center p-10">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Brain size={36} className="text-blue-400" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-base">配置挖掘参数后开始</p>
              <p className="text-gray-400 text-sm mt-1">系统将从知识图谱中自动发现关联规则</p>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-6 p-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Zap size={28} className="text-blue-500 animate-pulse" />
            </div>
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>正在挖掘规则...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-600">共发现 <span className="font-semibold text-gray-900">{visibleRules.length}</span> 条规则</p>
              <span className="text-xs text-gray-400">置信度 ≥ {minConf.toFixed(2)} · 支持度 ≥ {minSupport.toFixed(2)}</span>
            </div>
            {visibleRules.map(rule => (
              <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-sm">
                      {rule.antecedent.map((step, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          {i === 0 && <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-xs">{step.entity}</span>}
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <ArrowRight size={12} />
                            <span className="px-1.5 py-0.5 bg-blue-50 rounded text-blue-600 font-medium">{step.rel}</span>
                            <ArrowRight size={12} />
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono text-xs">{rule.antecedent[i + 1]?.entity ?? 'C'}</span>
                        </span>
                      ))}
                      <span className="mx-1 text-gray-300">⟹</span>
                      <span className="flex items-center gap-1 text-xs">
                        <span className="px-1.5 py-0.5 bg-green-50 rounded text-green-700 font-semibold">{rule.consequentRel}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-500">
                      <RuleTypeChip type={rule.type} />
                      <span>支持度: <strong className="text-gray-700">{rule.support.toFixed(2)}</strong></span>
                      <span>证据: <strong className="text-gray-700">{rule.evidenceCount}</strong> 条</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ConfidenceBadge value={rule.confidence} threshold={minConf} />
                    <button
                      onClick={() => setAddedRules(prev => new Set([...prev, rule.id]))}
                      disabled={addedRules.has(rule.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${addedRules.has(rule.id) ? 'bg-green-50 text-green-600 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      {addedRules.has(rule.id) ? '已加入' : '加入规则库'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: Rule Library ──────────────────────────────────────────────────────

function RuleLibrary() {
  const [rules, setRules] = useState<SavedRule[]>(SAVED_RULES);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const filtered = rules.filter(r => {
    const matchSearch = r.description.includes(search);
    const matchType = typeFilter === '全部' || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleEnabled = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索规则..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="pl-8 pr-8 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer">
            <option>全部</option>
            <option>链式规则</option>
            <option>对称规则</option>
            <option>逆关系规则</option>
            <option>组合规则</option>
          </select>
        </div>
        <button className="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 transition-colors">
          <Plus size={14} />
          新建规则
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">规则描述</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">类型</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">置信度</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">支持度</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">启用</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(rule => (
              <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-800 font-mono text-xs max-w-xs truncate">{rule.description}</td>
                <td className="px-4 py-3"><RuleTypeChip type={rule.type} /></td>
                <td className="px-4 py-3 text-center"><ConfidenceBadge value={rule.confidence} /></td>
                <td className="px-4 py-3 text-center text-gray-600">{rule.support.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleEnabled(rule.id)} className="inline-flex items-center transition-colors">
                    {rule.enabled
                      ? <ToggleRight size={22} className="text-blue-600" />
                      : <ToggleLeft size={22} className="text-gray-300" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">暂无匹配规则</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">共 {filtered.length} 条规则</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40">
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40">
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab 3: Prediction Results ────────────────────────────────────────────────

function PredictionResults() {
  const [entity, setEntity] = useState('知识图谱');
  const [inputVal, setInputVal] = useState('知识图谱');
  const [verified, setVerified] = useState<Set<string>>(new Set());

  const handlePredict = () => {
    setEntity(inputVal.trim() || '知识图谱');
    setVerified(new Set());
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.9) return 'text-green-600';
    if (c >= 0.75) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const confidenceBg = (c: number) => {
    if (c >= 0.9) return 'bg-green-50 border-green-100';
    if (c >= 0.75) return 'bg-blue-50 border-blue-100';
    return 'bg-yellow-50 border-yellow-100';
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Entity search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={inputVal} onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePredict()}
            placeholder="输入实体名称..."
            className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <button onClick={handlePredict}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 transition-colors">
          <Zap size={14} />
          开始预测
        </button>
      </div>

      {/* Results header */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">实体：</span>
        <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold">{entity}</span>
        <span className="text-sm text-gray-500">的预测关联，共 <strong className="text-gray-900">{PREDICTIONS.length}</strong> 条</span>
      </div>

      {/* Prediction cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {PREDICTIONS.map(pred => (
          <div key={pred.id} className={`bg-white rounded-xl border p-4 ${confidenceBg(pred.confidence)}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <EntityTypeChip type={pred.entityType} />
                <span className="text-base font-semibold text-gray-900">{pred.targetEntity}</span>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold ${confidenceColor(pred.confidence)}`}>
                  {(pred.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">置信度</div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              预测关联: <span className="font-semibold text-gray-700">{pred.relation}</span>
            </div>

            {/* Reasoning path */}
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {pred.path.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-700 font-medium shadow-sm">
                    {step.entity}
                  </span>
                  {step.rel && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <ChevronRight size={12} />
                      <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs text-blue-600 font-medium">
                        {step.rel}
                      </span>
                      <ChevronRight size={12} />
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setVerified(prev => new Set([...prev, pred.id]))}
                disabled={verified.has(pred.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${verified.has(pred.id) ? 'bg-green-50 text-green-600 cursor-default' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'}`}>
                {verified.has(pred.id) ? <><Check size={12} /> 已验证</> : '验证'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = ['规则挖掘', '规则库', '预测结果'] as const;
type Tab = typeof TABS[number];

export default function InferencePrediction() {
  const [activeTab, setActiveTab] = useState<Tab>('规则挖掘');

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 gap-5 overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Brain size={24} className="text-blue-600" />
          推理预测
        </h1>
        <p className="text-sm text-gray-500 mt-1">从知识图谱中挖掘关联规则，扩展推理链路，预测潜在知识关联</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="已挖掘规则数" value="1,284" icon={<Brain size={20} className="text-blue-600" />} color="bg-blue-50" />
        <StatCard label="高置信规则" value="847" icon={<Check size={20} className="text-green-600" />} color="bg-green-50" />
        <StatCard label="本月新增预测" value="3,621" icon={<Zap size={20} className="text-yellow-500" />} color="bg-yellow-50" />
        <StatCard label="平均置信度" value="83.6%" icon={<Filter size={20} className="text-purple-600" />} color="bg-purple-50" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {activeTab === '规则挖掘' && <RuleMining />}
        {activeTab === '规则库' && <RuleLibrary />}
        {activeTab === '预测结果' && <PredictionResults />}
      </div>
    </div>
  );
}
