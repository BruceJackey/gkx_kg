import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Play, Check, X, Edit2,
  ChevronDown, Database, FileText,
  Cpu, Search, CheckSquare, Square,
  Tag, Layers, RefreshCw, Network,
  Server, Eye, EyeOff, Plus, AlertCircle,
  ChevronRight, Settings2, FolderOpen, Trash2,
  BookmarkCheck
} from 'lucide-react';
import { getSavedConfigs, SavedKGConfig } from '../utils/kgStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OntologyClass {
  id: string;
  name: string;
  properties: string[];
  instanceCount: number;
}

interface GraphOption {
  id: string;
  name: string;
  source: 'saved' | 'builtin';
  sourceLabel?: string;
  ontology: OntologyClass[];
}

// ─── Built-in graphs (fallback) ───────────────────────────────────────────────

const BUILTIN_GRAPHS: GraphOption[] = [
  {
    id: 'tech',
    name: '科技硬件图谱',
    source: 'builtin',
    ontology: [
      { id: 'chip', name: '芯片', properties: ['制程工艺', '架构', '功耗', '性能指标', '制造商', '发布年份'], instanceCount: 1240 },
      { id: 'device', name: '硬件设备', properties: ['型号', '规格参数', '接口类型', '工作温度', '认证标准'], instanceCount: 3820 },
      { id: 'company', name: '科技企业', properties: ['注册地', '成立时间', '核心业务', '市值', '专利数量'], instanceCount: 560 },
      { id: 'tech', name: '核心技术', properties: ['技术原理', '应用场景', '成熟度', '专利覆盖'], instanceCount: 890 },
    ],
  },
  {
    id: 'newenergy',
    name: '新能源图谱',
    source: 'builtin',
    ontology: [
      { id: 'battery', name: '电池技术', properties: ['能量密度', '充电速率', '循环寿命', '化学体系', '安全等级'], instanceCount: 780 },
      { id: 'vehicle', name: '新能源车型', properties: ['续航里程', '电机功率', '充电标准', '智能驾驶级别'], instanceCount: 2100 },
      { id: 'policy', name: '产业政策', properties: ['政策名称', '发布机构', '生效日期', '补贴金额', '覆盖范围'], instanceCount: 430 },
    ],
  },
  {
    id: 'internet',
    name: '互联网图谱',
    source: 'builtin',
    ontology: [
      { id: 'product', name: '互联网产品', properties: ['月活用户', '上线时间', '商业模式', '核心功能', '目标用户群'], instanceCount: 1560 },
      { id: 'algorithm', name: '推荐算法', properties: ['算法类型', '技术原理', '应用场景', '召回精度'], instanceCount: 340 },
      { id: 'regulation', name: '监管法规', properties: ['法规名称', '主管部门', '生效范围', '处罚条款'], instanceCount: 210 },
    ],
  },
];

function savedToGraph(s: SavedKGConfig): GraphOption {
  return {
    id: s.id,
    name: s.name,
    source: 'saved',
    sourceLabel: s.sourceLabel,
    ontology: s.classes.map(c => ({
      id: c.name,
      name: c.name,
      properties: c.properties,
      instanceCount: c.count,
    })),
  };
}

// ─── Rules & strategy ────────────────────────────────────────────────────────

interface Rule {
  id: string;
  name: string;
  type: 'regex' | 'syntax';
  pattern: string;
  attribute: string;
  enabled: boolean;
}

const PRESET_RULES: Rule[] = [
  { id: 'r1', name: '定义句型提取', type: 'regex', pattern: '([^，。]+)是([^，。]+的[^，。]+)', attribute: '定义', enabled: true },
  { id: 'r2', name: '组成成分提取', type: 'regex', pattern: '(由|包含|组成)(.*?)(构成|组成)', attribute: '组成', enabled: true },
  { id: 'r3', name: '属性值依存句法', type: 'syntax', pattern: 'nsubj → ATTR ← dobj', attribute: '属性值', enabled: true },
  { id: 'r4', name: '应用场景提取', type: 'regex', pattern: '(适用于|应用于|用于)([^，。]+)', attribute: '应用场景', enabled: false },
  { id: 'r5', name: '提出者/作者', type: 'syntax', pattern: 'nsubj(提出|发明|创建) → PERSON', attribute: '提出者', enabled: true },
  { id: 'r6', name: '数值参数提取', type: 'regex', pattern: '(\\d+(?:\\.\\d+)?\\s*(?:nm|GHz|W|V|A|mAh)[^，。]*)', attribute: '规格参数', enabled: false },
];

interface CandidateResult {
  id: string;
  entity: string;
  entityType: string;
  attribute: string;
  value: string;
  source: 'rule' | 'llm';
  confidence: number;
  context: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  modifiedValue?: string;
}

const MOCK_CANDIDATES: CandidateResult[] = [
  { id: 'cr1', entity: '苹果 A18 Pro', entityType: '芯片', attribute: '制程工艺', value: '3nm FinFET', source: 'llm', confidence: 0.96, context: '该芯片采用台积电3nm FinFET制程工艺，晶体管密度达到行业领先水平。', status: 'pending' },
  { id: 'cr2', entity: '苹果 A18 Pro', entityType: '芯片', attribute: '架构', value: 'ARM v9', source: 'llm', confidence: 0.91, context: '基于ARM v9架构设计，支持SVE2向量扩展指令集，提升AI推理性能。', status: 'pending' },
  { id: 'cr3', entity: '苹果 A18 Pro', entityType: '芯片', attribute: '功耗', value: '5W TDP', source: 'rule', confidence: 0.88, context: '芯片设计功耗为5W TDP，适合移动端应用场景，支持动态调频。', status: 'accepted' },
  { id: 'cr4', entity: '台积电', entityType: '组织', attribute: '制造商', value: '台积电', source: 'llm', confidence: 0.94, context: '由台积电负责代工生产，使用N3工艺节点量产。', status: 'pending' },
  { id: 'cr5', entity: '苹果 A18 Pro', entityType: '芯片', attribute: '发布年份', value: '2025', source: 'rule', confidence: 0.83, context: '该系列芯片于2025年第四季度正式量产发货。', status: 'accepted' },
  { id: 'cr6', entity: '苹果 A18 Pro', entityType: '芯片', attribute: '性能指标', value: 'NPU算力 35TOPS', source: 'llm', confidence: 0.78, context: 'NPU算力达到35TOPS，可支持实时语音、图像及大模型本地推理。', status: 'pending' },
  { id: 'cr7', entity: '骁龙 8 Gen4', entityType: '芯片', attribute: '架构', value: 'big.LITTLE 混合架构', source: 'rule', confidence: 0.65, context: '采用big.LITTLE混合架构设计，包含高性能核与高效能核。', status: 'pending' },
  { id: 'cr8', entity: '骁龙 8 Gen4', entityType: '芯片', attribute: '制程工艺', value: '先进制程', source: 'llm', confidence: 0.51, context: '使用先进制程生产，相比上一代功耗降低约20%。', status: 'rejected' },
  { id: 'cr9', entity: 'iPhone 16 Pro', entityType: '硬件设备', attribute: '型号', value: 'A3293', source: 'rule', confidence: 0.92, context: 'iPhone 16 Pro 型号为 A3293，配备 6.3 英寸 Super Retina XDR 屏幕。', status: 'pending' },
  { id: 'cr10', entity: 'iPhone 16 Pro', entityType: '硬件设备', attribute: '规格参数', value: '6.3英寸 / 120Hz ProMotion', source: 'llm', confidence: 0.87, context: '搭载 6.3 英寸屏幕，支持 120Hz ProMotion 自适应刷新率。', status: 'pending' },
];

// ─── Step bar ─────────────────────────────────────────────────────────────────

const STEPS = ['选择图谱', '选择本体', '语料库配置', '抽取策略', '执行'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-[11px] whitespace-nowrap ${active ? 'text-blue-600 font-medium' : done ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 mb-4 mx-1 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MySQL config form ────────────────────────────────────────────────────────

interface MySQLConfig {
  host: string; port: string; database: string; table: string;
  textColumn: string; user: string; password: string; maxRows: string;
}

function MySQLConfigStep({ config, onChange }: { config: MySQLConfig; onChange: (c: MySQLConfig) => void }) {
  const [showPwd, setShowPwd] = useState(false);
  const [testing, setTesting] = useState<null | 'ok' | 'error' | 'loading'>(null);
  const set = (key: keyof MySQLConfig) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...config, [key]: e.target.value });
  const testConn = () => { setTesting('loading'); setTimeout(() => setTesting('ok'), 1600); };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1.5">主机地址</label>
          <input value={config.host} onChange={set('host')} placeholder="127.0.0.1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">端口</label>
          <input value={config.port} onChange={set('port')} placeholder="3306" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">数据库名</label>
          <input value={config.database} onChange={set('database')} placeholder="corpus_db" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">数据表名</label>
          <input value={config.table} onChange={set('table')} placeholder="articles" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">文本字段</label>
          <input value={config.textColumn} onChange={set('textColumn')} placeholder="content" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">用户名</label>
          <input value={config.user} onChange={set('user')} placeholder="root" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1.5">密码</label>
          <input type={showPwd ? 'text' : 'password'} value={config.password} onChange={set('password')} placeholder="••••••••"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 pr-9" />
          <button onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 bottom-2 text-gray-400 hover:text-gray-600">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">最大读取行数</label>
          <input value={config.maxRows} onChange={set('maxRows')} placeholder="50000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={testConn} disabled={testing === 'loading'}
          className="flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {testing === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
          测试连接
        </button>
        {testing === 'ok' && <span className="flex items-center gap-1.5 text-sm text-green-600"><Check className="w-4 h-4" />连接成功</span>}
      </div>
    </div>
  );
}

// ─── Strategy config ──────────────────────────────────────────────────────────

type LLMModel = 'gpt4o' | 'claude3' | 'qwen2';
interface StrategyConfig { model: LLMModel; threshold: number; useRules: boolean; selectedRules: string[] }

const LLM_MODELS = [
  { id: 'gpt4o' as LLMModel, name: 'GPT-4o', badge: 'OpenAI', perf: '综合最强，成本较高' },
  { id: 'claude3' as LLMModel, name: 'Claude Sonnet 4.6', badge: 'Anthropic', perf: '长文本理解优异' },
  { id: 'qwen2' as LLMModel, name: 'Qwen2.5-72B', badge: '通义', perf: '中文语料效果突出' },
];

function StrategyStep({ config, onChange, targetProperties }: { config: StrategyConfig; onChange: (c: StrategyConfig) => void; targetProperties: string[] }) {
  const [rules, setRules] = useState<Rule[]>(PRESET_RULES);
  const [addingRule, setAddingRule] = useState(false);
  const [newRule, setNewRule] = useState<Omit<Rule, 'id' | 'enabled'>>({ name: '', type: 'regex', pattern: '', attribute: '' });

  const toggleRule = (id: string) => {
    const next = config.selectedRules.includes(id) ? config.selectedRules.filter(r => r !== id) : [...config.selectedRules, id];
    onChange({ ...config, selectedRules: next });
  };
  const addRule = () => {
    if (!newRule.name || !newRule.pattern) return;
    const r: Rule = { id: `r_${Date.now()}`, ...newRule, enabled: true };
    setRules(p => [...p, r]);
    onChange({ ...config, selectedRules: [...config.selectedRules, r.id] });
    setAddingRule(false);
    setNewRule({ name: '', type: 'regex', pattern: '', attribute: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-blue-500" />
          <h4 className="text-sm font-semibold text-gray-900">大模型抽取（必选）</h4>
          <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">LLM</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {LLM_MODELS.map(m => (
            <div key={m.id} onClick={() => onChange({ ...config, model: m.id })}
              className={`border-2 rounded-xl p-3.5 cursor-pointer transition-all ${config.model === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.model === m.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {config.model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{m.badge}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{m.name}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{m.perf}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-2 flex justify-between">
              置信度阈值 <span className="text-gray-800 font-medium">{config.threshold.toFixed(2)}</span>
            </label>
            <input type="range" min={0.1} max={1} step={0.05} value={config.threshold}
              onChange={e => onChange({ ...config, threshold: parseFloat(e.target.value) })} className="w-full accent-blue-600" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>宽松 0.1</span><span>严格 1.0</span></div>
          </div>
          <div className="w-48">
            <label className="text-xs text-gray-500 mb-1.5 block">目标属性范围</label>
            <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 leading-relaxed max-h-16 overflow-y-auto">
              {targetProperties.length > 0 ? targetProperties.join('、') : '未选择本体'}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-semibold text-gray-900">规则增强（可选）</h4>
            <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">已选 {config.selectedRules.length} 条</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <div onClick={() => onChange({ ...config, useRules: !config.useRules })}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${config.useRules ? 'bg-purple-500' : 'bg-gray-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${config.useRules ? 'translate-x-4' : ''}`} />
              </div>
              启用规则增强
            </label>
            {config.useRules && (
              <button onClick={() => setAddingRule(true)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                <Plus className="w-3.5 h-3.5" />新增规则
              </button>
            )}
          </div>
        </div>
        {config.useRules && (
          <>
            {addingRule && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="规则名称"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <select value={newRule.type} onChange={e => setNewRule(p => ({ ...p, type: e.target.value as Rule['type'] }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option value="regex">正则表达式</option>
                    <option value="syntax">依存句法</option>
                  </select>
                  <input value={newRule.pattern} onChange={e => setNewRule(p => ({ ...p, pattern: e.target.value }))} placeholder="匹配模式"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                  <input value={newRule.attribute} onChange={e => setNewRule(p => ({ ...p, attribute: e.target.value }))} placeholder="目标属性"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addRule} disabled={!newRule.name || !newRule.pattern} className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg disabled:opacity-40 hover:bg-purple-700 transition-colors">添加</button>
                  <button onClick={() => setAddingRule(false)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">取消</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {rules.map(rule => {
                const checked = config.selectedRules.includes(rule.id);
                return (
                  <div key={rule.id} onClick={() => toggleRule(rule.id)}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${checked ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${checked ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800 font-medium">{rule.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${rule.type === 'regex' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                          {rule.type === 'regex' ? '正则' : '句法'}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{rule.attribute}</span>
                      </div>
                      <code className="text-[11px] text-gray-500 font-mono block truncate mt-0.5">{rule.pattern}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {!config.useRules && <p className="text-sm text-gray-400 py-2">未启用规则增强，将仅使用大模型进行抽取。启用后可通过选择规则补充边界明确的属性值。</p>}
      </div>
    </div>
  );
}

// ─── Task config wizard ───────────────────────────────────────────────────────

function TaskConfigTab({ onJobComplete }: { onJobComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [savedGraphs, setSavedGraphs] = useState<GraphOption[]>([]);
  const [selectedGraph, setSelectedGraph] = useState<GraphOption | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<OntologyClass[]>([]);
  const [corpusMode, setCorpusMode] = useState<'db' | 'text'>('db');
  const [pastedText, setPastedText] = useState('');
  const [dbConfig, setDbConfig] = useState<MySQLConfig>({
    host: '', port: '3306', database: '', table: '', textColumn: 'content', user: '', password: '', maxRows: '50000',
  });
  const [strategy, setStrategy] = useState<StrategyConfig>({
    model: 'claude3', threshold: 0.75, useRules: false, selectedRules: [],
  });
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved configs on mount
  useEffect(() => {
    const saved = getSavedConfigs().map(savedToGraph);
    setSavedGraphs(saved);
  }, []);

  useEffect(() => {
    if (progress >= 100 && running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      setDone(true);
      onJobComplete();
    }
  }, [progress, running]);

  const canNext = [
    !!selectedGraph,
    selectedClasses.length > 0,
    corpusMode === 'text' ? pastedText.trim().length > 0 : !!(dbConfig.host && dbConfig.database && dbConfig.table),
    true,
  ];
  const next = () => setStep(p => Math.min(p + 1, 4));
  const prev = () => setStep(p => Math.max(p - 1, 0));
  const runTask = () => {
    setRunning(true); setDone(false); setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8 + 2, 100));
    }, 180);
  };

  const allGraphs = [...savedGraphs, ...BUILTIN_GRAPHS];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
        <StepBar current={step} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Step 0: select graph */}
        {step === 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">选择图谱</h3>
            <p className="text-sm text-gray-500 mb-5">选择知识图谱作为本次实体抽取的本体来源</p>

            {/* Saved configs section */}
            {savedGraphs.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookmarkCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">已保存的图谱配置</span>
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{savedGraphs.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {savedGraphs.map(g => (
                    <div key={g.id} onClick={() => { setSelectedGraph(g); setSelectedClasses([]); }}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedGraph?.id === g.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Network className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">已保存</span>
                          {selectedGraph?.id === g.id && <Check className="w-4 h-4 text-blue-500" />}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{g.name}</p>
                      <p className="text-[11px] text-gray-400 mb-2">{g.sourceLabel} · {g.ontology.length} 个本体类</p>
                      <div className="flex flex-wrap gap-1">
                        {g.ontology.slice(0, 4).map(o => (
                          <span key={o.id} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{o.name}</span>
                        ))}
                        {g.ontology.length > 4 && <span className="text-[10px] text-gray-400">+{g.ontology.length - 4}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Built-in graphs */}
            <div>
              {savedGraphs.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">内置图谱</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {BUILTIN_GRAPHS.map(g => (
                  <div key={g.id} onClick={() => { setSelectedGraph(g); setSelectedClasses([]); }}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedGraph?.id === g.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Network className="w-5 h-5 text-white" />
                      </div>
                      {selectedGraph?.id === g.id && <Check className="w-4 h-4 text-blue-500" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{g.name}</p>
                    <p className="text-[11px] text-gray-500">{g.ontology.length} 个本体类 · {g.ontology.reduce((s, c) => s + c.instanceCount, 0).toLocaleString()} 个实例</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {g.ontology.slice(0, 3).map(o => (
                        <span key={o.id} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{o.name}</span>
                      ))}
                      {g.ontology.length > 3 && <span className="text-[10px] text-gray-400">+{g.ontology.length - 3}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: select ontology class */}
        {step === 1 && selectedGraph && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">选择本体概念</h3>
            <p className="text-sm text-gray-500 mb-5">
              来自 <span className="font-medium text-gray-700">{selectedGraph.name}</span> 的本体 Schema，选择要抽取属性的目标概念类
            </p>
            <div className="grid grid-cols-2 gap-4">
              {selectedGraph.ontology.map(cls => {
                const isSelected = selectedClasses.some(c => c.id === cls.id);
                const toggle = () => setSelectedClasses(prev =>
                  isSelected ? prev.filter(c => c.id !== cls.id) : [...prev, cls]
                );
                return (
                <div key={cls.id} onClick={toggle}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{cls.name}</span>
                    </div>
                    {cls.instanceCount > 0 && <span className="text-[11px] text-gray-500">{cls.instanceCount.toLocaleString()} 实例</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.properties.map(p => (
                      <span key={p} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              );
              })}
            </div>
            {selectedClasses.length > 0 && (
              <div className="mt-3 text-xs text-blue-600">
                已选 {selectedClasses.length} 个本体类：{selectedClasses.map(c => c.name).join('、')}
              </div>
            )}
          </div>
        )}

        {/* Step 2: corpus source */}
        {step === 2 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">语料配置</h3>
            <p className="text-sm text-gray-500 mb-4">选择抽取语料的来源方式</p>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-5">
              {[
                { id: 'db', label: '数据库连接', icon: Database },
                { id: 'text', label: '粘贴文本', icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setCorpusMode(id as 'db' | 'text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors ${corpusMode === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            {corpusMode === 'db' ? (
              <MySQLConfigStep config={dbConfig} onChange={setDbConfig} />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500">粘贴或输入待抽取文本</label>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{pastedText.length.toLocaleString()} 字符</span>
                    {pastedText.length > 0 && (
                      <button onClick={() => setPastedText('')} className="text-red-400 hover:text-red-600 transition-colors">清空</button>
                    )}
                  </div>
                </div>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="将需要抽取实体的文本内容粘贴到此处，支持多段落。系统将对全文进行实体识别与属性抽取。"
                  className="w-full h-64 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none focus:border-blue-400 placeholder:text-gray-400"
                />
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex items-start gap-2 text-xs text-blue-700">
                  <span className="mt-0.5 flex-shrink-0">💡</span>
                  <span>文本模式适合对单篇文章或段落快速验证抽取效果，不受行数限制。大批量语料建议使用数据库连接。</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: strategy */}
        {step === 3 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">抽取策略配置</h3>
            <p className="text-sm text-gray-500 mb-5">
              抽取目标：<span className="font-medium text-gray-700">{selectedClasses.map(c => c.name).join('、') || '—'}</span>，共
              <span className="font-medium text-gray-700"> {[...new Set(selectedClasses.flatMap(c => c.properties))].length} 个属性</span>
            </p>
            <StrategyStep config={strategy} onChange={setStrategy} targetProperties={[...new Set(selectedClasses.flatMap(c => c.properties))]} />
          </div>
        )}

        {/* Step 4: execute */}
        {step === 4 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">确认并执行</h3>
            <p className="text-sm text-gray-500 mb-5">确认配置信息，点击执行开始抽取任务</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: '图谱', value: selectedGraph?.name },
                { label: '目标本体', value: selectedClasses.map(c => c.name).join('、') || '—' },
                { label: '语料来源', value: corpusMode === 'text' ? '粘贴文本' : `${dbConfig.database}.${dbConfig.table} @ ${dbConfig.host}` },
                { label: corpusMode === 'text' ? '文本字符数' : '最大行数', value: corpusMode === 'text' ? `${pastedText.length.toLocaleString()} 字符` : `${parseInt(dbConfig.maxRows || '50000').toLocaleString()} 行` },
                { label: '抽取模型', value: LLM_MODELS.find(m => m.id === strategy.model)?.name },
                { label: '置信度阈值', value: strategy.threshold.toFixed(2) },
                { label: '规则增强', value: strategy.useRules ? `已启用 (${strategy.selectedRules.length} 条规则)` : '未启用' },
                { label: '目标属性数', value: `${[...new Set(selectedClasses.flatMap(c => c.properties))].length} 个` },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3.5">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <p className="text-sm text-gray-900 font-medium mt-0.5">{item.value ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
            {!running && !done && (
              <button onClick={runTask} className="flex items-center gap-2 text-sm px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Play className="w-4 h-4" />开始执行抽取任务
              </button>
            )}
            {running && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600"><RefreshCw className="w-4 h-4 animate-spin text-blue-500" />正在抽取…</span>
                  <span className="text-gray-500">{Math.min(Math.floor(progress), 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-200" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400">正在使用 {LLM_MODELS.find(m => m.id === strategy.model)?.name} 处理语料…</p>
              </div>
            )}
            {done && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">抽取完成</p>
                  <p className="text-xs text-green-700 mt-0.5">共生成 <strong>{Math.floor(Math.random() * 500 + 400)}</strong> 条候选属性，可前往「候选属性审核」进行人工复核</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={prev} disabled={step === 0}
          className="text-sm px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
          ← 上一步
        </button>
        {step < 4 && (
          <button onClick={next} disabled={!canNext[step]}
            className="text-sm px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 transition-colors">
            下一步 →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Review tab ───────────────────────────────────────────────────────────────

function ReviewTab() {
  const [candidates, setCandidates] = useState<CandidateResult[]>(MOCK_CANDIDATES);
  const [filterStatus, setFilterStatus] = useState<CandidateResult['status'] | 'all'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'rule' | 'llm'>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const entityOptions = [...new Set(candidates.map(c => c.entity))];

  const filtered = candidates.filter(c =>
    (filterStatus === 'all' || c.status === filterStatus) &&
    (filterSource === 'all' || c.source === filterSource) &&
    (filterEntity === 'all' || c.entity === filterEntity) &&
    (!search || c.entity.includes(search) || c.attribute.includes(search) || c.value.includes(search))
  );
  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id));
  const toggleAll = () => {
    if (allSelected) setSelected(p => p.filter(id => !filtered.some(c => c.id === id)));
    else setSelected(p => [...new Set([...p, ...filtered.map(c => c.id)])]);
  };
  const setStatus = (ids: string[], status: CandidateResult['status']) =>
    setCandidates(p => p.map(c => ids.includes(c.id) ? { ...c, status } : c));
  const startEdit = (c: CandidateResult) => { setEditingId(c.id); setEditValue(c.modifiedValue ?? c.value); };
  const saveEdit = (id: string) => {
    setCandidates(p => p.map(c => c.id === id ? { ...c, modifiedValue: editValue, status: 'modified' } : c));
    setEditingId(null);
  };

  const statusColors: Record<CandidateResult['status'], string> = {
    pending: 'bg-amber-100 text-amber-700', accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600', modified: 'bg-blue-100 text-blue-700',
  };
  const statusLabels: Record<CandidateResult['status'], string> = {
    pending: '待审核', accepted: '已接受', rejected: '已拒绝', modified: '已修改',
  };
  const stats = {
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    accepted: candidates.filter(c => c.status === 'accepted').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总候选数', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
          { label: '待审核', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: '已接受', value: stats.accepted, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: '已拒绝', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索属性名或属性值…"
            className="flex-1 text-sm focus:outline-none bg-transparent" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="accepted">已接受</option>
          <option value="rejected">已拒绝</option>
        </select>
        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
          <option value="all">全部实体</option>
          {entityOptions.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
          <option value="all">全部来源</option>
          <option value="rule">规则抽取</option>
          <option value="llm">大模型抽取</option>
        </select>
        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">已选 {selected.length} 条</span>
            <button onClick={() => { setStatus(selected, 'accepted'); setSelected([]); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <Check className="w-3.5 h-3.5" />批量接受
            </button>
            <button onClick={() => { setStatus(selected, 'rejected'); setSelected([]); }}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />批量拒绝
            </button>
          </div>
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 w-8">
                <button onClick={toggleAll}>
                  {allSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-gray-400" />}
                </button>
              </th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">实体</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-28">属性名</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">属性值</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">上下文</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-20">来源</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-24">置信度</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-20">状态</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(c => (
              <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.status === 'rejected' ? 'opacity-45' : ''}`}>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id])}>
                    {selected.includes(c.id) ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-gray-400" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{c.entity}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{c.entityType}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{c.attribute}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {editingId === c.id ? (
                    <div className="flex items-center gap-1.5">
                      <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                        className="flex-1 border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none" />
                      <button onClick={() => saveEdit(c.id)} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <span className={c.modifiedValue ? 'text-blue-700' : ''}>{c.modifiedValue ?? c.value}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[220px] truncate" title={c.context}>{c.context}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.source === 'rule' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {c.source === 'rule' ? '规则' : '大模型'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.confidence >= 0.85 ? 'bg-green-400' : c.confidence >= 0.7 ? 'bg-blue-400' : 'bg-amber-400'}`}
                        style={{ width: `${c.confidence * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{(c.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>{statusLabels[c.status]}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {c.status === 'pending' && (
                      <>
                        <button onClick={() => setStatus([c.id], 'accepted')} title="接受" className="p-1 text-gray-400 hover:text-green-500 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setStatus([c.id], 'rejected')} title="拒绝" className="p-1 text-gray-400 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    <button onClick={() => startEdit(c)} title="修改值" className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">暂无匹配的候选属性</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type TabId = 'config' | 'review';
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'config', label: '抽取任务配置', icon: Settings2 },
  { id: 'review', label: '候选属性审核', icon: CheckSquare },
];

interface Props { onBack: () => void }

export default function EntityExtraction({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('config');

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />返回
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">实体抽取</h2>
              <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full">自动化流程</span>
              <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-sm rounded-full">已部署</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              从大规模文本语料中自动识别并抽取与指定本体概念相关的候选属性及其对应值。支持载入已保存的图谱本体配置，融合大模型抽取与规则增强策略，结合人工审核工作台确保抽取质量。
            </p>
          </div>
        </div>
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${activeTab === id ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'config' && <TaskConfigTab onJobComplete={() => setActiveTab('review')} />}
      {activeTab === 'review' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ReviewTab />
        </div>
      )}
    </div>
  );
}
