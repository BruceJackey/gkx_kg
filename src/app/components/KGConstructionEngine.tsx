import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Check, X, ChevronRight, Play, RefreshCw,
  Database, Network, Cpu, Server, Wifi, WifiOff,
  Upload, GitBranch, Zap, Star, ArrowRight, Brain,
  Shield, BarChart3, Box, Eye, EyeOff, ZoomIn, ZoomOut,
  RotateCcw, AlertCircle, BookmarkCheck, Trash2, FolderOpen
} from 'lucide-react';
import { getSavedConfigs, saveKGConfig, deleteKGConfig, SavedKGConfig } from '../utils/kgStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

type GatewayStatus = 'idle' | 'testing' | 'ok' | 'error';
type TaskStatus = 'idle' | 'running' | 'done';
type StageStatus = 'pending' | 'running' | 'done';
type CandidateStatus = 'pending' | 'accepted' | 'rejected';
type SourceId = 'mysql' | 'es' | 'minio' | 'api' | '';
type SchemaStatus = 'idle' | 'loading' | 'done';

interface ConnParams {
  host: string; port: string; database: string; table: string;
  textColumn: string; user: string; password: string;
  index: string; bucket: string; prefix: string;
  accessKey: string; secretKey: string; endpoint: string;
  baseUrl: string; apiKey: string; apiEndpoint: string;
}

interface OntologyClass { name: string; count: number; properties: string[] }
interface OntologyRelation { name: string; from: string; to: string; count: number }

interface ConfigState {
  sourceId: SourceId;
  conn: ConnParams;
  schemaStatus: SchemaStatus;
  classes: OntologyClass[];
  relations: OntologyRelation[];
  selectedClasses: string[];
  selectedRelations: string[];
  graphId: string;
  mode: 'sample' | 'full';
  vectorize: boolean;
  embModel: string;
}

interface PipelineStage { id: string; name: string; status: StageStatus; duration?: string }
interface Candidate {
  id: string; name: string; ctype: string; confidence: number; snippet: string;
  kind: 'entity' | 'relation'; from?: string; to?: string; rtype?: string;
  status: CandidateStatus;
}
interface GraphNode { id: string; label: string; ntype: string; x: number; y: number; r: number }
interface GraphEdge { id: string; from: string; to: string; label: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const EMBEDDING_MODELS = ['bge-large-zh-v1.5', 'text-embedding-3-large', 'jina-embeddings-v3', 'gte-Qwen2-7B'];

const EMPTY_CONN: ConnParams = {
  host: '', port: '3306', database: '', table: '', textColumn: 'content', user: '', password: '',
  index: '', bucket: '', prefix: '', accessKey: '', secretKey: '',
  endpoint: '', baseUrl: '', apiKey: '', apiEndpoint: '/v1/data',
};

const MOCK_SCHEMAS: Record<string, { classes: OntologyClass[]; relations: OntologyRelation[]; totalDocs: number }> = {
  mysql: {
    totalDocs: 12480,
    classes: [
      { name: '企业', count: 2340, properties: ['名称', '注册地', '成立时间', '法定代表人', '统一信用代码', '行业类别', '注册资本'] },
      { name: '人物', count: 1870, properties: ['姓名', '职务', '所在企业', '出生年份', '学历', '国籍'] },
      { name: '产品', count: 3120, properties: ['名称', '型号', '发布时间', '所属企业', '价格区间', '产品类别'] },
      { name: '技术', count: 1560, properties: ['名称', '技术领域', '成熟度', '专利数量', '主要应用场景'] },
      { name: '事件', count: 890, properties: ['事件名称', '发生时间', '涉及主体', '影响范围', '事件类型'] },
    ],
    relations: [
      { name: '任职', from: '人物', to: '企业', count: 1240 },
      { name: '发布', from: '企业', to: '产品', count: 890 },
      { name: '研发', from: '企业', to: '技术', count: 670 },
      { name: '投资', from: '企业', to: '企业', count: 540 },
      { name: '供应', from: '企业', to: '企业', count: 430 },
      { name: '合作', from: '企业', to: '企业', count: 380 },
    ],
  },
  es: {
    totalDocs: 45600,
    classes: [
      { name: '事件', count: 12400, properties: ['标题', '发生时间', '地点', '关键词', '新闻来源', '热度'] },
      { name: '人物', count: 8900, properties: ['姓名', '身份', '相关机构', '活跃领域', '影响力指数'] },
      { name: '地点', count: 6700, properties: ['名称', '行政级别', '上级地区', '经纬度', '人口'] },
      { name: '机构', count: 5400, properties: ['名称', '类型', '成立时间', '主要职能', '规模'] },
      { name: '话题', count: 3200, properties: ['话题名称', '热度指数', '相关实体', '时效性'] },
    ],
    relations: [
      { name: '发生于', from: '事件', to: '地点', count: 9800 },
      { name: '涉及', from: '事件', to: '人物', count: 7600 },
      { name: '属于', from: '人物', to: '机构', count: 5400 },
      { name: '关联话题', from: '事件', to: '话题', count: 4300 },
    ],
  },
  minio: {
    totalDocs: 8760,
    classes: [
      { name: '专利', count: 4200, properties: ['专利号', '申请日期', '授权日期', '技术领域', '摘要', '权利要求数'] },
      { name: '发明人', count: 3100, properties: ['姓名', '所属机构', '专利数量', '技术方向', 'H指数'] },
      { name: '技术领域', count: 890, properties: ['领域名称', 'IPC分类号', '技术描述', '上级领域'] },
      { name: '受理机构', count: 210, properties: ['机构名称', '国家/地区', '专利类型', '年受理量'] },
    ],
    relations: [
      { name: '发明', from: '发明人', to: '专利', count: 6800 },
      { name: '属于领域', from: '专利', to: '技术领域', count: 4200 },
      { name: '受理于', from: '专利', to: '受理机构', count: 4200 },
      { name: '合作发明', from: '发明人', to: '发明人', count: 1300 },
    ],
  },
  api: {
    totalDocs: 31200,
    classes: [
      { name: '公司', count: 5600, properties: ['公司名称', '股票代码', '市值', '行业', '成立时间', '员工规模'] },
      { name: '行业', count: 320, properties: ['行业名称', '行业代码', '上级行业', '市场规模', '增长率'] },
      { name: '产品', count: 9800, properties: ['产品名称', '产品类别', '发布时间', '目标市场', 'SKU数量'] },
      { name: '融资事件', count: 2400, properties: ['轮次', '融资金额', '投资方', '时间', '估值'] },
      { name: '投资机构', count: 1800, properties: ['机构名称', '类型', '管理规模', '投资偏好', '成立年份'] },
    ],
    relations: [
      { name: '属于行业', from: '公司', to: '行业', count: 5600 },
      { name: '获得融资', from: '公司', to: '融资事件', count: 2400 },
      { name: '投资于', from: '投资机构', to: '公司', count: 3600 },
      { name: '推出产品', from: '公司', to: '产品', count: 9800 },
    ],
  },
};

const INIT_PIPELINE: PipelineStage[] = [
  { id: 's1', name: '读取数据源', status: 'pending' },
  { id: 's2', name: '实体抽取', status: 'pending' },
  { id: 's3', name: '关系抽取', status: 'pending' },
  { id: 's4', name: '本体映射', status: 'pending' },
  { id: 's5', name: '图数据库写入', status: 'pending' },
  { id: 's6', name: '向量索引生成', status: 'pending' },
  { id: 's7', name: '质量检查', status: 'pending' },
];
const STAGE_DURATIONS = ['1.2s', '8.4s', '6.7s', '2.1s', '3.3s', '4.8s', '1.9s'];

const LOG_LINES = [
  '[INFO]  Connecting to data source…',
  '[INFO]  Fetched 12,480 documents from corpus.articles',
  '[INFO]  Entity extraction model loaded: BERT-LSTM-CRF v2.3',
  '[INFO]  Extracted 4,312 entity candidates (threshold=0.75)',
  '[INFO]  Relation extraction model loaded: RE-Bert v1.8',
  '[INFO]  Extracted 2,871 relation triples',
  '[INFO]  Mapping to ontology schema: 9 classes matched',
  '[INFO]  Writing to Neo4j graph database…',
  '[INFO]  Created 3,204 nodes, 2,651 edges',
  '[INFO]  Generating vector embeddings…',
  '[INFO]  Indexed 3,204 vectors to Milvus',
  '[INFO]  Quality check: precision=91.2%, recall=88.7%',
  '[SUCCESS] Pipeline completed in 28.4s',
];

// Graph canvas data
const GNODES: GraphNode[] = [
  { id: 'gn1', label: '华为技术', ntype: 'enterprise', x: 210, y: 135, r: 26 },
  { id: 'gn2', label: '余承东', ntype: 'person', x: 75, y: 75, r: 20 },
  { id: 'gn3', label: 'Mate 70', ntype: 'product', x: 345, y: 65, r: 20 },
  { id: 'gn4', label: '麒麟9010', ntype: 'technology', x: 375, y: 175, r: 20 },
  { id: 'gn5', label: '台积电', ntype: 'enterprise', x: 295, y: 255, r: 20 },
  { id: 'gn6', label: '深圳', ntype: 'location', x: 95, y: 235, r: 18 },
  { id: 'gn7', label: '消费者BG', ntype: 'org', x: 55, y: 165, r: 18 },
  { id: 'gn8', label: '5G技术', ntype: 'technology', x: 185, y: 265, r: 18 },
];
const GEDGES: GraphEdge[] = [
  { id: 'ge1', from: 'gn1', to: 'gn2', label: '任职' },
  { id: 'ge2', from: 'gn1', to: 'gn3', label: '发布' },
  { id: 'ge3', from: 'gn1', to: 'gn4', label: '研发' },
  { id: 'ge4', from: 'gn5', to: 'gn1', label: '供应' },
  { id: 'ge5', from: 'gn1', to: 'gn6', label: '位于' },
  { id: 'ge6', from: 'gn3', to: 'gn4', label: '搭载' },
  { id: 'ge7', from: 'gn2', to: 'gn7', label: '负责' },
  { id: 'ge8', from: 'gn1', to: 'gn8', label: '布局' },
];
const NODE_STYLE: Record<string, { fill: string; stroke: string; text: string }> = {
  enterprise: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' },
  person: { fill: '#f3e8ff', stroke: '#a855f7', text: '#6b21a8' },
  product: { fill: '#dcfce7', stroke: '#22c55e', text: '#166534' },
  technology: { fill: '#fef9c3', stroke: '#eab308', text: '#713f12' },
  location: { fill: '#ccfbf1', stroke: '#14b8a6', text: '#134e4a' },
  org: { fill: '#ffedd5', stroke: '#f97316', text: '#9a3412' },
};
const NODE_TYPE_LABEL: Record<string, string> = { enterprise: '企业', person: '人物', product: '产品', technology: '技术', location: '地点', org: '机构' };

const MOCK_CANDIDATES: Candidate[] = [
  { id: 'c1', name: '华为技术有限公司', ctype: '企业', confidence: 0.97, snippet: '华为技术有限公司宣布推出新一代旗舰产品', kind: 'entity', status: 'pending' },
  { id: 'c2', name: '余承东', ctype: '人物', confidence: 0.94, snippet: '华为消费者业务 CEO 余承东表示', kind: 'entity', status: 'pending' },
  { id: 'c3', name: 'Mate 70 Pro', ctype: '产品', confidence: 0.91, snippet: '旗舰产品 Mate 70 Pro 搭载麒麟芯片', kind: 'entity', status: 'accepted' },
  { id: 'c4', name: '麒麟 9010', ctype: '技术', confidence: 0.89, snippet: '自研芯片麒麟 9010 采用 3nm 制程', kind: 'entity', status: 'pending' },
  { id: 'c5', name: '台积电', ctype: '企业', confidence: 0.88, snippet: '由台积电代工生产', kind: 'entity', status: 'rejected' },
  { id: 'c6', name: '任职', ctype: '任职', confidence: 0.93, snippet: '余承东任职华为消费者业务 CEO', kind: 'relation', from: '余承东', to: '华为技术有限公司', rtype: '任职', status: 'pending' },
  { id: 'c7', name: '发布', ctype: '发布', confidence: 0.90, snippet: '华为技术有限公司发布 Mate 70 Pro', kind: 'relation', from: '华为技术有限公司', to: 'Mate 70 Pro', rtype: '发布', status: 'accepted' },
  { id: 'c8', name: '研发', ctype: '研发', confidence: 0.85, snippet: '华为研发麒麟 9010 芯片', kind: 'relation', from: '华为技术有限公司', to: '麒麟 9010', rtype: '研发', status: 'pending' },
  { id: 'c9', name: '供应', ctype: '供应', confidence: 0.72, snippet: '台积电向华为供应晶圆', kind: 'relation', from: '台积电', to: '华为技术有限公司', rtype: '供应', status: 'pending' },
];

const NEXT_STEPS = [
  { id: 'emb', name: 'KG Embedding 训练', desc: '生成图结构感知向量', icon: Brain, bg: 'bg-purple-50 border-purple-200', ic: 'bg-purple-100 text-purple-600' },
  { id: 'reason', name: '关系推理', desc: '推断隐含关系与缺失链接', icon: GitBranch, bg: 'bg-blue-50 border-blue-200', ic: 'bg-blue-100 text-blue-600' },
  { id: 'match', name: '实例匹配', desc: '跨图谱实体对齐', icon: Box, bg: 'bg-green-50 border-green-200', ic: 'bg-green-100 text-green-600' },
  { id: 'qa', name: '图谱质量评估', desc: '完整性、一致性检测', icon: Shield, bg: 'bg-amber-50 border-amber-200', ic: 'bg-amber-100 text-amber-600' },
  { id: 'viz', name: '图谱可视化分析', desc: '交互式图谱探索', icon: Network, bg: 'bg-indigo-50 border-indigo-200', ic: 'bg-indigo-100 text-indigo-600' },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-full border transition-all select-none flex items-center gap-1
        ${active ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}>
      {active && <Check className="w-3 h-3" />}{label}
    </button>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text', mono = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 ${mono ? 'font-mono' : ''}`} />
    </div>
  );
}

function StatCard({ label, value, vc = 'text-blue-600' }: { label: string; value: string | number; vc?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`text-2xl font-bold ${vc}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

const STEP_META = [
  { label: '数据源与本体配置', icon: Database },
  { label: '启动构造 · 实时监控', icon: Play },
  { label: '文档抽取 · 人机确认', icon: Check },
  { label: '构造完成', icon: Star },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
      <div className="flex items-start">
        {STEP_META.map((s, i) => {
          const Icon = s.icon;
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className="flex items-start flex-1">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0
                  ${done ? 'bg-blue-600' : active ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-100'}`}>
                  {done ? <Check className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />}
                </div>
                <span className={`text-[11px] text-center leading-tight max-w-[72px]
                  ${active ? 'text-blue-700 font-semibold' : done ? 'text-gray-600' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < STEP_META.length - 1 && (
                <div className={`flex-1 h-0.5 mt-4 mx-2 ${i < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1: Data source + schema discovery ───────────────────────────────────

function ConnForm({ sourceId, conn, onChange }: { sourceId: SourceId; conn: ConnParams; onChange: (c: ConnParams) => void }) {
  const [showPwd, setShowPwd] = useState(false);
  const set = (k: keyof ConnParams) => (v: string) => onChange({ ...conn, [k]: v });

  if (sourceId === 'mysql') return (
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2"><FieldInput label="主机地址" value={conn.host} onChange={set('host')} placeholder="127.0.0.1" mono /></div>
      <FieldInput label="端口" value={conn.port} onChange={set('port')} placeholder="3306" mono />
      <FieldInput label="数据库名" value={conn.database} onChange={set('database')} placeholder="corpus_db" mono />
      <FieldInput label="数据表名" value={conn.table} onChange={set('table')} placeholder="articles" mono />
      <FieldInput label="文本字段" value={conn.textColumn} onChange={set('textColumn')} placeholder="content" mono />
      <FieldInput label="用户名" value={conn.user} onChange={set('user')} placeholder="root" />
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">密码</label>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} value={conn.password} onChange={e => set('password')(e.target.value)}
            placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 pr-9" />
          <button onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-2 text-gray-400">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  if (sourceId === 'es') return (
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2"><FieldInput label="主机地址" value={conn.host} onChange={set('host')} placeholder="localhost" mono /></div>
      <FieldInput label="端口" value={conn.port} onChange={set('port')} placeholder="9200" mono />
      <FieldInput label="索引名" value={conn.index} onChange={set('index')} placeholder="news_articles" mono />
      <FieldInput label="用户名" value={conn.user} onChange={set('user')} placeholder="elastic" />
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">密码</label>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} value={conn.password} onChange={e => set('password')(e.target.value)}
            placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 pr-9" />
          <button onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-2 text-gray-400">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  if (sourceId === 'minio') return (
    <div className="grid grid-cols-2 gap-3">
      <FieldInput label="Endpoint" value={conn.endpoint} onChange={set('endpoint')} placeholder="minio.example.com:9000" mono />
      <FieldInput label="Bucket 名" value={conn.bucket} onChange={set('bucket')} placeholder="patents" mono />
      <FieldInput label="路径前缀（可选）" value={conn.prefix} onChange={set('prefix')} placeholder="2024/" mono />
      <div />
      <FieldInput label="Access Key" value={conn.accessKey} onChange={set('accessKey')} placeholder="minioadmin" mono />
      <FieldInput label="Secret Key" value={conn.secretKey} onChange={set('secretKey')} type="password" placeholder="••••••••" mono />
    </div>
  );

  if (sourceId === 'api') return (
    <div className="grid grid-cols-2 gap-3">
      <FieldInput label="Base URL" value={conn.baseUrl} onChange={set('baseUrl')} placeholder="https://api.example.com" mono />
      <FieldInput label="数据 Endpoint" value={conn.apiEndpoint} onChange={set('apiEndpoint')} placeholder="/v1/data" mono />
      <div className="col-span-2"><FieldInput label="API Key" value={conn.apiKey} onChange={set('apiKey')} type="password" placeholder="sk-..." mono /></div>
    </div>
  );

  return null;
}

function StepConfig({ config, onChange, onNext }: { config: ConfigState; onChange: (c: ConfigState) => void; onNext: () => void }) {
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [savedConfigs, setSavedConfigs] = useState<SavedKGConfig[]>(() => getSavedConfigs());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [newPropInput, setNewPropInput] = useState<Record<string, string>>({});
  const [editingClassName, setEditingClassName] = useState<Record<string, string>>({});
  const [showAddClass, setShowAddClass] = useState(false);
  const [addClassName, setAddClassName] = useState('');
  const [addClassProps, setAddClassProps] = useState('');
  const [showAddRelation, setShowAddRelation] = useState(false);
  const [addRelFrom, setAddRelFrom] = useState('');
  const [addRelName, setAddRelName] = useState('');
  const [addRelTo, setAddRelTo] = useState('');

  const updateClasses = (classes: OntologyClass[]) => {
    const names = classes.map(c => c.name);
    onChange({
      ...config,
      classes,
      selectedClasses: config.selectedClasses.filter(n => names.includes(n)),
    });
  };

  const removeClass = (name: string) => {
    updateClasses(config.classes.filter(c => c.name !== name));
    if (expandedClass === name) setExpandedClass(null);
  };

  const renameProp = (className: string, oldProp: string, newProp: string) => {
    updateClasses(config.classes.map(c =>
      c.name === className ? { ...c, properties: c.properties.map(p => p === oldProp ? newProp : p) } : c
    ));
  };

  const removeProp = (className: string, prop: string) => {
    updateClasses(config.classes.map(c =>
      c.name === className ? { ...c, properties: c.properties.filter(p => p !== prop) } : c
    ));
  };

  const addProp = (className: string) => {
    const val = (newPropInput[className] ?? '').trim();
    if (!val) return;
    updateClasses(config.classes.map(c =>
      c.name === className && !c.properties.includes(val) ? { ...c, properties: [...c.properties, val] } : c
    ));
    setNewPropInput(p => ({ ...p, [className]: '' }));
  };

  const applyClassRename = (oldName: string) => {
    const newName = (editingClassName[oldName] ?? '').trim();
    if (!newName || newName === oldName) { setEditingClassName(p => { const n = { ...p }; delete n[oldName]; return n; }); return; }
    const updatedClasses = config.classes.map(c => c.name === oldName ? { ...c, name: newName } : c);
    const updatedSelected = config.selectedClasses.map(n => n === oldName ? newName : n);
    onChange({ ...config, classes: updatedClasses, selectedClasses: updatedSelected });
    setEditingClassName(p => { const n = { ...p }; delete n[oldName]; return n; });
    setExpandedClass(newName);
  };

  const confirmAddClass = () => {
    const name = addClassName.trim();
    if (!name || config.classes.find(c => c.name === name)) return;
    const props = addClassProps.split(/[,，、\n]/).map(p => p.trim()).filter(Boolean);
    const newCls: OntologyClass = { name, count: 0, properties: props };
    onChange({ ...config, classes: [...config.classes, newCls], selectedClasses: [...config.selectedClasses, name] });
    setAddClassName(''); setAddClassProps(''); setShowAddClass(false);
  };

  const removeRelation = (name: string) => {
    const relations = config.relations.filter(r => r.name !== name);
    onChange({ ...config, relations, selectedRelations: config.selectedRelations.filter(n => n !== name) });
  };

  const confirmAddRelation = () => {
    const name = addRelName.trim(); const from = addRelFrom.trim(); const to = addRelTo.trim();
    if (!name || !from || !to) return;
    const newRel: OntologyRelation = { name, from, to, count: 0 };
    onChange({ ...config, relations: [...config.relations, newRel], selectedRelations: [...config.selectedRelations, name] });
    setAddRelName(''); setAddRelFrom(''); setAddRelTo(''); setShowAddRelation(false);
  };

  const sources = [
    { id: 'mysql' as const, name: 'MySQL 语料库', desc: '结构化文本数据', cls: 'bg-blue-100 text-blue-600' },
    { id: 'es' as const, name: 'Elasticsearch', desc: '全文检索索引', cls: 'bg-amber-100 text-amber-600' },
    { id: 'minio' as const, name: 'MinIO 对象存储', desc: 'PDF / Word 文件', cls: 'bg-orange-100 text-orange-600' },
    { id: 'api' as const, name: '外部 REST API', desc: '实时数据接入', cls: 'bg-purple-100 text-purple-600' },
  ];

  const SOURCE_LABELS: Record<string, string> = { mysql: 'MySQL', es: 'Elasticsearch', minio: 'MinIO', api: 'REST API' };

  const handleSaveConfig = () => {
    if (config.schemaStatus !== 'done' || !config.graphId.trim()) return;
    const cfg: SavedKGConfig = {
      id: config.graphId.trim(),
      name: config.graphId.trim(),
      savedAt: new Date().toISOString(),
      sourceId: config.sourceId,
      sourceLabel: SOURCE_LABELS[config.sourceId] ?? config.sourceId,
      classes: config.classes,
      relations: config.relations,
    };
    saveKGConfig(cfg);
    setSavedConfigs(getSavedConfigs());
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleLoadConfig = (saved: SavedKGConfig) => {
    onChange({
      ...config,
      graphId: saved.name,
      sourceId: saved.sourceId as any,
      schemaStatus: 'done',
      classes: saved.classes,
      relations: saved.relations,
      selectedClasses: saved.classes.map(c => c.name),
      selectedRelations: saved.relations.map(r => r.name),
    });
    setFetchStatus('ok');
    setShowSavedPanel(false);
  };

  const handleDeleteSaved = (id: string) => {
    deleteKGConfig(id);
    setSavedConfigs(getSavedConfigs());
  };

  const fetchSchema = () => {
    setFetchStatus('loading');
    setTimeout(() => {
      const schema = MOCK_SCHEMAS[config.sourceId as string] ?? MOCK_SCHEMAS.mysql;
      onChange({
        ...config,
        schemaStatus: 'done',
        classes: schema.classes,
        relations: schema.relations,
        selectedClasses: schema.classes.map(c => c.name),
        selectedRelations: schema.relations.map(r => r.name),
      });
      setFetchStatus('ok');
    }, 1800);
  };

  const toggleClass = (name: string) => {
    const next = config.selectedClasses.includes(name)
      ? config.selectedClasses.filter(v => v !== name)
      : [...config.selectedClasses, name];
    onChange({ ...config, selectedClasses: next });
  };

  const toggleRelation = (name: string) => {
    const next = config.selectedRelations.includes(name)
      ? config.selectedRelations.filter(v => v !== name)
      : [...config.selectedRelations, name];
    onChange({ ...config, selectedRelations: next });
  };

  const connFilled = config.sourceId === 'mysql' ? (config.conn.host && config.conn.database && config.conn.table)
    : config.sourceId === 'es' ? (config.conn.host && config.conn.index)
    : config.sourceId === 'minio' ? (config.conn.endpoint && config.conn.bucket)
    : config.sourceId === 'api' ? (config.conn.baseUrl && config.conn.apiKey)
    : false;

  const canNext = config.schemaStatus === 'done' && config.selectedClasses.length > 0 && config.selectedRelations.length > 0 && config.graphId.trim();

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Left */}
      <div className="col-span-3 space-y-5">
        {/* Saved configs banner */}
        {savedConfigs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
            <button onClick={() => setShowSavedPanel(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100/50 transition-colors">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">已保存的本体配置</span>
                <span className="text-[11px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full">{savedConfigs.length}</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-blue-500 transition-transform ${showSavedPanel ? 'rotate-90' : ''}`} />
            </button>
            {showSavedPanel && (
              <div className="border-t border-blue-200 divide-y divide-blue-100">
                {savedConfigs.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-blue-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-[11px] text-gray-500">{s.sourceLabel} · {s.classes.length} 个类目 · {s.relations.length} 种关系 · {new Date(s.savedAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <button onClick={() => handleLoadConfig(s)}
                      className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0">载入</button>
                    <button onClick={() => handleDeleteSaved(s.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source cards */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">选择数据源类型</p>
          <div className="grid grid-cols-2 gap-3">
            {sources.map(ds => {
              const active = config.sourceId === ds.id;
              return (
                <div key={ds.id} onClick={() => onChange({ ...config, sourceId: ds.id, schemaStatus: 'idle', classes: [], relations: [], selectedClasses: [], selectedRelations: [] })}
                  className={`flex items-center gap-3 border-2 rounded-xl p-3.5 cursor-pointer transition-all
                    ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ds.cls}`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{ds.name}</p>
                    <p className="text-[11px] text-gray-500">{ds.desc}</p>
                  </div>
                  {active && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Connection form */}
        {config.sourceId && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">连接参数配置</p>
            <ConnForm sourceId={config.sourceId} conn={config.conn} onChange={conn => onChange({ ...config, conn })} />
            <div className="flex items-center gap-3 mt-4">
              <button onClick={fetchSchema} disabled={!connFilled || fetchStatus === 'loading'}
                className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 transition-colors">
                {fetchStatus === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {fetchStatus === 'loading' ? '读取中…' : '读取本体信息'}
              </button>
              {fetchStatus === 'ok' && (
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <Check className="w-4 h-4" />已读取 {config.classes.length} 个类目 · {config.relations.length} 种关系
                </span>
              )}
            </div>
          </div>
        )}

        {/* Schema chips */}
        {config.schemaStatus === 'done' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">本体类目 <span className="text-gray-400 font-normal">— 选择参与构造的实体类型</span></p>
                <span className="text-[11px] text-gray-400">已选 {config.selectedClasses.length}/{config.classes.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.classes.map(c => (
                  <Chip key={c.name} label={`${c.name} (${c.count.toLocaleString()})`}
                    active={config.selectedClasses.includes(c.name)} onClick={() => toggleClass(c.name)} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">关系类型 <span className="text-gray-400 font-normal">— 选择参与构造的关系类型</span></p>
                <span className="text-[11px] text-gray-400">已选 {config.selectedRelations.length}/{config.relations.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.relations.map(r => (
                  <Chip key={r.name} label={`${r.name} (${r.count.toLocaleString()})`}
                    active={config.selectedRelations.includes(r.name)} onClick={() => toggleRelation(r.name)} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">目标图谱 ID</p>
              <input value={config.graphId} onChange={e => onChange({ ...config, graphId: e.target.value })}
                placeholder="kg_tech_20260717"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
              <p className="text-[11px] text-gray-400 mt-1">将写入 Neo4j 的图谱命名空间标识</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">构造模式</p>
              <div className="flex gap-3">
                {[{ id: 'sample' as const, name: '抽样模式', desc: '随机抽取 10%，快速验证' }, { id: 'full' as const, name: '全量模式', desc: '处理全部语料，生产就绪' }].map(m => (
                  <div key={m.id} onClick={() => onChange({ ...config, mode: m.id })}
                    className={`flex-1 border-2 rounded-xl p-3.5 cursor-pointer transition-all
                      ${config.mode === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${config.mode === m.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                        {config.mode === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 pl-5">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">开启向量化</p>
                <p className="text-[11px] text-gray-500 mt-0.5">对实体节点生成 Embedding，支持语义检索与推理</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button onClick={() => onChange({ ...config, vectorize: !config.vectorize })}
                  className="relative rounded-full flex items-center px-0.5"
                  style={{ width: 40, height: 22, backgroundColor: config.vectorize ? '#a855f7' : '#d1d5db' }}>
                  <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: config.vectorize ? 'translateX(18px)' : 'translateX(0)' }} />
                </button>
                {config.vectorize && (
                  <select value={config.embModel} onChange={e => onChange({ ...config, embModel: e.target.value })}
                    className="text-xs border border-purple-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                    {EMBEDDING_MODELS.map(m => <option key={m}>{m}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={onNext} disabled={!canNext}
                className="flex items-center gap-2 text-sm px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 transition-colors">
                下一步：启动构造 <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={handleSaveConfig} disabled={config.schemaStatus !== 'done' || !config.graphId.trim()}
                className="flex items-center gap-2 text-sm px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg disabled:opacity-40 transition-colors">
                {saveStatus === 'saved'
                  ? <><BookmarkCheck className="w-4 h-4 text-green-500" /><span className="text-green-600">已保存</span></>
                  : <><BookmarkCheck className="w-4 h-4 text-gray-400" />保存本体配置</>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: schema preview */}
      <div className="col-span-2 space-y-4">
        {config.schemaStatus === 'done' && config.classes.length > 0 ? (
          <>
            {/* Editable ontology classes panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">本体 Schema 编辑</p>
                <button onClick={() => { setShowAddClass(true); setExpandedClass(null); }}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                  <span className="text-base leading-none">+</span> 新增类目
                </button>
              </div>

              <div className="space-y-2">
                {config.classes.map(cls => {
                  const isExpanded = expandedClass === cls.name;
                  const isEditing = cls.name in editingClassName;
                  return (
                    <div key={cls.name} className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100 bg-gray-50'}`}>
                      {/* Header row */}
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button onClick={() => setExpandedClass(isExpanded ? null : cls.name)}
                          className="flex-1 flex items-center gap-2 text-left min-w-0">
                          <span className={`transition-transform text-gray-400 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                          {isEditing ? (
                            <input autoFocus value={editingClassName[cls.name]} onChange={e => setEditingClassName(p => ({ ...p, [cls.name]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') applyClassRename(cls.name); if (e.key === 'Escape') setEditingClassName(p => { const n = { ...p }; delete n[cls.name]; return n; }); }}
                              onClick={e => e.stopPropagation()}
                              className="text-sm font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-0.5 w-32 focus:outline-none" />
                          ) : (
                            <span className="text-sm font-semibold text-gray-900 truncate">{cls.name}</span>
                          )}
                          {cls.count > 0 && <span className="text-[10px] text-gray-400 flex-shrink-0">{cls.count.toLocaleString()} 实例</span>}
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isEditing ? (
                            <>
                              <button onClick={() => applyClassRename(cls.name)}
                                className="text-[10px] text-green-600 hover:bg-green-50 px-1.5 py-0.5 rounded transition-colors">确定</button>
                              <button onClick={() => setEditingClassName(p => { const n = { ...p }; delete n[cls.name]; return n; })}
                                className="text-[10px] text-gray-400 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors">取消</button>
                            </>
                          ) : (
                            <button onClick={e => { e.stopPropagation(); setEditingClassName(p => ({ ...p, [cls.name]: cls.name })); setExpandedClass(cls.name); }}
                              className="text-[10px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors">重命名</button>
                          )}
                          <button onClick={e => { e.stopPropagation(); removeClass(cls.name); }}
                            className="p-0.5 text-gray-300 hover:text-red-400 transition-colors rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded: properties editor */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-blue-100">
                          <p className="text-[10px] text-gray-500 pt-2 font-medium">属性字段</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cls.properties.map(prop => (
                              <span key={prop} className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                                {prop}
                                <button onClick={() => removeProp(cls.name, prop)} className="text-blue-400 hover:text-red-400 transition-colors">×</button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-1.5 mt-1.5">
                            <input value={newPropInput[cls.name] ?? ''} onChange={e => setNewPropInput(p => ({ ...p, [cls.name]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && addProp(cls.name)}
                              placeholder="新属性名称…"
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400" />
                            <button onClick={() => addProp(cls.name)}
                              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">添加</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add class form */}
                {showAddClass && (
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-3 bg-blue-50/40 space-y-2">
                    <p className="text-[11px] font-semibold text-blue-700">新增本体类目</p>
                    <input value={addClassName} onChange={e => setAddClassName(e.target.value)} placeholder="类目名称，如：机构"
                      className="w-full text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white" />
                    <textarea value={addClassProps} onChange={e => setAddClassProps(e.target.value)} rows={2}
                      placeholder="属性字段（逗号分隔）：名称, 类型, 成立时间"
                      className="w-full text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white resize-none" />
                    <div className="flex gap-2">
                      <button onClick={confirmAddClass} disabled={!addClassName.trim()}
                        className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-40">确认添加</button>
                      <button onClick={() => { setShowAddClass(false); setAddClassName(''); setAddClassProps(''); }}
                        className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editable relations panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">关系 Schema 编辑</p>
                <button onClick={() => setShowAddRelation(v => !v)}
                  className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors">
                  <span className="text-base leading-none">+</span> 新增关系
                </button>
              </div>
              <div className="space-y-2">
                {config.relations.map(rel => (
                  <div key={rel.name} className="flex items-center gap-1.5 text-xs group">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{rel.from}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">{rel.name}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{rel.to}</span>
                    {rel.count > 0 && <span className="text-gray-400 ml-auto">{rel.count.toLocaleString()}</span>}
                    <button onClick={() => removeRelation(rel.name)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all rounded p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {config.relations.length === 0 && <p className="text-xs text-gray-400 text-center py-2">暂无关系，点击新增</p>}

                {/* Add relation form */}
                {showAddRelation && (
                  <div className="border-2 border-dashed border-purple-200 rounded-xl p-3 bg-purple-50/30 space-y-2 mt-2">
                    <p className="text-[11px] font-semibold text-purple-700">新增关系类型</p>
                    <div className="flex items-center gap-2">
                      <select value={addRelFrom} onChange={e => setAddRelFrom(e.target.value)}
                        className="flex-1 text-xs border border-purple-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-purple-400">
                        <option value="">主体类目…</option>
                        {config.classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <input value={addRelName} onChange={e => setAddRelName(e.target.value)} placeholder="关系名"
                        className="w-20 text-xs border border-purple-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-purple-400 bg-white" />
                      <select value={addRelTo} onChange={e => setAddRelTo(e.target.value)}
                        className="flex-1 text-xs border border-purple-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-purple-400">
                        <option value="">客体类目…</option>
                        {config.classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={confirmAddRelation} disabled={!addRelName.trim() || !addRelFrom || !addRelTo}
                        className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-40">确认添加</button>
                      <button onClick={() => { setShowAddRelation(false); setAddRelName(''); setAddRelFrom(''); setAddRelTo(''); }}
                        className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">本体 Schema 预览</p>
            <p className="text-xs text-gray-400 mt-1">配置连接参数并读取本体信息后，将在此展示图谱 Schema</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Graph canvas component ───────────────────────────────────────────────────

function GraphCanvas({ progress }: { progress: number }) {
  const visibleNodes = Math.min(Math.floor((progress / 100) * GNODES.length), GNODES.length);
  const visibleEdges = progress > 40 ? Math.min(Math.floor(((progress - 40) / 60) * GEDGES.length), GEDGES.length) : 0;
  const nodeMap = Object.fromEntries(GNODES.map(n => [n.id, n]));

  return (
    <div className="relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden" style={{ height: 290 }}>
      <div className="absolute top-2.5 left-3 z-10">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">实时构造预览</span>
      </div>
      {/* Legend */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-0.5">
        {Object.entries(NODE_TYPE_LABEL).slice(0, 4).map(([type, label]) => {
          const s = NODE_STYLE[type];
          return (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: s.fill, borderColor: s.stroke }} />
              <span className="text-[9px] text-gray-500">{label}</span>
            </div>
          );
        })}
      </div>

      <svg width="100%" height="100%" viewBox="0 0 440 290">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Edges */}
        {GEDGES.slice(0, visibleEdges).map(edge => {
          const from = nodeMap[edge.from];
          const to = nodeMap[edge.to];
          if (!from || !to) return null;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len;
          const uy = dy / len;
          const x1 = from.x + ux * from.r;
          const y1 = from.y + uy * from.r;
          const x2 = to.x - ux * (to.r + 8);
          const y2 = to.y - uy * (to.r + 8);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={edge.id}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
              <text x={mx} y={my - 3} textAnchor="middle" fontSize="9" fill="#94a3b8">{edge.label}</text>
            </g>
          );
        })}

        {/* Nodes */}
        {GNODES.slice(0, visibleNodes).map(node => {
          const s = NODE_STYLE[node.ntype] ?? NODE_STYLE.enterprise;
          return (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={node.r} fill={s.fill} stroke={s.stroke} strokeWidth="2" />
              <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle"
                fontSize={node.r > 22 ? '9' : '8'} fill={s.text} fontWeight="600">
                {node.label.length > 6 ? node.label.slice(0, 6) + '…' : node.label}
              </text>
            </g>
          );
        })}

        {/* Empty state */}
        {visibleNodes === 0 && (
          <text x="220" y="145" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#d1d5db">
            启动构造后将在此实时展示图谱
          </text>
        )}
      </svg>

      {/* Stats overlay */}
      {visibleNodes > 0 && (
        <div className="absolute bottom-2.5 left-3 flex items-center gap-3">
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{visibleNodes} 个节点</span>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{visibleEdges} 条边</span>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Monitor ──────────────────────────────────────────────────────────

function StepMonitor({ config, onNext }: { config: ConfigState; onNext: () => void }) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('idle');
  const [pipeline, setPipeline] = useState<PipelineStage[]>(INIT_PIPELINE.map(s => ({ ...s })));
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ entities: 0, relations: 0, docs: 0 });
  const [currentStage, setCurrentStage] = useState(-1);
  const logRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
  }, []);

  const start = () => {
    setTaskStatus('running');
    setProgress(0); setElapsed(0);
    setLogs([]); setStats({ entities: 0, relations: 0, docs: 0 });
    setPipeline(INIT_PIPELINE.map(s => ({ ...s, status: 'pending' as StageStatus })));
    setCurrentStage(0);
    let tick = 0; const ticks = 65;
    elapsedRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    timerRef.current = setInterval(() => {
      tick++;
      const pct = Math.min((tick / ticks) * 100, 100);
      setProgress(pct);
      const si = Math.min(Math.floor((pct / 100) * INIT_PIPELINE.length), INIT_PIPELINE.length - 1);
      setCurrentStage(si);
      setPipeline(prev => prev.map((s, i) => i < si ? { ...s, status: 'done', duration: STAGE_DURATIONS[i] } : i === si ? { ...s, status: 'running' } : { ...s, status: 'pending' }));
      setLogs(LOG_LINES.slice(0, Math.floor((pct / 100) * LOG_LINES.length)));
      setStats({ entities: Math.floor((pct / 100) * 3204), relations: Math.floor((pct / 100) * 2651), docs: Math.min(Math.floor((pct / 25) * 12480), 12480) });
      if (tick >= ticks) {
        clearInterval(timerRef.current!); clearInterval(elapsedRef.current!);
        setPipeline(INIT_PIPELINE.map((s, i) => ({ ...s, status: 'done', duration: STAGE_DURATIONS[i] })));
        setLogs(LOG_LINES); setStats({ entities: 3204, relations: 2651, docs: 12480 });
        setTaskStatus('done'); setProgress(100); setCurrentStage(INIT_PIPELINE.length - 1);
      }
    }, 250);
  };

  const sc: Record<StageStatus, string> = { pending: 'bg-gray-100 text-gray-400', running: 'bg-blue-100 text-blue-600', done: 'bg-green-100 text-green-700' };

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Left: controls + stages + log */}
      <div className="col-span-2 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">构造任务</p>
              <p className="text-xs text-gray-500 mt-0.5 font-mono">{config.graphId || 'kg_default'}</p>
            </div>
            {taskStatus === 'idle' && (
              <button onClick={start} className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Play className="w-3.5 h-3.5" />启动
              </button>
            )}
            {taskStatus === 'running' && <span className="flex items-center gap-1.5 text-sm text-blue-600"><RefreshCw className="w-4 h-4 animate-spin" />运行中</span>}
            {taskStatus === 'done' && <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium"><Check className="w-4 h-4" />完成</span>}
          </div>
          {taskStatus !== 'idle' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500"><span>进度</span><span>{Math.floor(progress)}%</span></div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${taskStatus === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-gray-400">已运行 {elapsed}s</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs font-semibold text-gray-700">Pipeline 阶段</span>
          </div>
          <div className="divide-y divide-gray-100">
            {pipeline.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${sc[stage.status]}`}>
                  {stage.status === 'done' ? <Check className="w-3 h-3" /> : stage.status === 'running' ? <RefreshCw className="w-3 h-3 animate-spin" /> : i + 1}
                </div>
                <span className={`flex-1 text-xs ${stage.status === 'done' ? 'text-gray-600' : stage.status === 'running' ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>{stage.name}</span>
                {stage.duration && <span className="text-[10px] text-gray-400">{stage.duration}</span>}
              </div>
            ))}
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-2">
              <div className="flex gap-1">{['bg-red-400','bg-yellow-400','bg-green-400'].map(c=><div key={c} className={`w-2 h-2 rounded-full ${c}`}/>)}</div>
              <span className="text-[10px] text-gray-400">构造日志</span>
            </div>
            <div ref={logRef} className="p-3 h-28 overflow-y-auto space-y-0.5">
              {logs.map((line, i) => (
                <p key={i} className={`text-[10px] font-mono leading-4 ${line.startsWith('[SUCCESS]') ? 'text-green-400' : 'text-gray-300'}`}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {taskStatus === 'done' && (
          <button onClick={onNext} className="w-full flex items-center justify-center gap-2 text-sm px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            下一步：文档抽取 <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right: graph + stats */}
      <div className="col-span-3 space-y-4">
        <GraphCanvas progress={progress} />
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="实体数" value={stats.entities.toLocaleString()} vc="text-blue-600" />
          <StatCard label="关系数" value={stats.relations.toLocaleString()} vc="text-purple-600" />
          <StatCard label="文档数" value={stats.docs.toLocaleString()} vc="text-amber-600" />
          <StatCard label="耗时" value={`${elapsed}s`} vc="text-gray-700" />
        </div>
        {taskStatus !== 'idle' && currentStage >= 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-2">
            {taskStatus === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />}
            {taskStatus === 'done' && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
            <span className="text-sm text-gray-700 font-medium">
              {taskStatus === 'done' ? '全部阶段完成，图谱已写入 Neo4j' : pipeline[currentStage]?.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Extract + human confirm ─────────────────────────────────────────

function StepExtract({ config, onNext }: { config: ConfigState; onNext: () => void }) {
  const [docText, setDocText] = useState(
    '华为技术有限公司宣布推出旗舰产品 Mate 70 Pro，该产品搭载华为自研芯片麒麟 9010，采用台积电 3nm 制程工艺，NPU 算力达 35TOPS。华为消费者业务 CEO 余承东表示，该系列将于 2025 年第四季度正式量产发货。'
  );
  const [targetEntities, setTargetEntities] = useState<string[]>(config.selectedClasses.length > 0 ? config.selectedClasses : ['企业', '人物', '产品', '技术']);
  const [targetRelations, setTargetRelations] = useState<string[]>(config.selectedRelations.length > 0 ? config.selectedRelations : ['任职', '发布', '研发', '供应']);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const availableEntities = config.selectedClasses.length > 0 ? config.selectedClasses : ['企业', '人物', '产品', '技术', '事件', '地点'];
  const availableRelations = config.selectedRelations.length > 0 ? config.selectedRelations : ['任职', '发布', '研发', '投资', '供应', '合作'];

  const toggleEntity = (v: string) => setTargetEntities(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleRelation = (v: string) => setTargetRelations(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const doExtract = () => {
    setExtracting(true);
    setTimeout(() => {
      setExtracting(false);
      setExtracted(true);
      setCandidates(MOCK_CANDIDATES.map(c => ({ ...c })));
    }, 1800);
  };

  const setStatus = (id: string, status: CandidateStatus) => setCandidates(p => p.map(c => c.id === id ? { ...c, status } : c));

  // Filter by selected types
  const filteredCandidates = candidates.filter(c =>
    c.kind === 'entity' ? targetEntities.includes(c.ctype) : targetRelations.includes(c.rtype ?? '')
  );
  const entities = filteredCandidates.filter(c => c.kind === 'entity');
  const relations = filteredCandidates.filter(c => c.kind === 'relation');
  const accepted = candidates.filter(c => c.status === 'accepted').length;
  const pending = filteredCandidates.filter(c => c.status === 'pending').length;
  const rejected = candidates.filter(c => c.status === 'rejected').length;

  const confColor = (v: number) => v >= 0.9 ? 'text-green-600' : v >= 0.75 ? 'text-blue-600' : 'text-amber-600';
  const sb: Record<CandidateStatus, string> = { pending: 'bg-amber-100 text-amber-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600' };
  const sl: Record<CandidateStatus, string> = { pending: '待确认', accepted: '已接受', rejected: '已拒绝' };

  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-3 space-y-5">
        {/* Doc input */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">文档输入</p>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">
              <Upload className="w-3.5 h-3.5" />上传文件<input type="file" className="hidden" />
            </label>
          </div>
          <textarea value={docText} onChange={e => setDocText(e.target.value)} rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 leading-relaxed focus:outline-none focus:border-blue-400 resize-none" />

          {/* Target type selectors */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                目标实体类型 <span className="text-gray-400 font-normal">（已选 {targetEntities.length}）</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableEntities.map(e => <Chip key={e} label={e} active={targetEntities.includes(e)} onClick={() => toggleEntity(e)} />)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                目标关系类型 <span className="text-gray-400 font-normal">（已选 {targetRelations.length}）</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableRelations.map(r => <Chip key={r} label={r} active={targetRelations.includes(r)} onClick={() => toggleRelation(r)} />)}
              </div>
            </div>
          </div>

          <button onClick={doExtract} disabled={!docText.trim() || extracting || targetEntities.length === 0}
            className="mt-4 flex items-center gap-2 text-sm px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-40 transition-colors">
            {extracting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
            {extracting ? '抽取中…' : '抽取实体与关系'}
          </button>
        </div>

        {/* Candidates */}
        {extracted && (
          <>
            {entities.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Box className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-900">候选实体</span>
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{entities.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {entities.map(c => (
                    <div key={c.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{c.ctype}</span>
                          <span className={`text-[11px] font-medium ${confColor(c.confidence)}`}>{(c.confidence * 100).toFixed(0)}%</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sb[c.status]}`}>{sl[c.status]}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">「{c.snippet}」</p>
                      </div>
                      {c.status === 'pending' && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setStatus(c.id, 'accepted')} className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setStatus(c.id, 'rejected')} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relations.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-semibold text-gray-900">候选关系</span>
                  <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{relations.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {relations.map(c => (
                    <div key={c.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{c.from}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">{c.rtype}</span>
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{c.to}</span>
                          <span className={`text-[11px] font-medium ${confColor(c.confidence)}`}>{(c.confidence * 100).toFixed(0)}%</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sb[c.status]}`}>{sl[c.status]}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">「{c.snippet}」</p>
                      </div>
                      {c.status === 'pending' && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setStatus(c.id, 'accepted')} className="p-1.5 text-gray-400 hover:text-green-500 transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setStatus(c.id, 'rejected')} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entities.length === 0 && relations.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-amber-800 font-medium">当前选择的类型未匹配到候选结果</p>
                <p className="text-xs text-amber-600 mt-1">请调整目标实体或关系类型后重新抽取</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right */}
      <div className="col-span-2 space-y-4">
        <div className="space-y-3">
          <StatCard label="已接受" value={accepted} vc="text-green-600" />
          <StatCard label="待确认" value={pending} vc="text-amber-600" />
          <StatCard label="已拒绝" value={rejected} vc="text-gray-500" />
        </div>
        {extracted && (
          <div className="space-y-2">
            <button onClick={onNext} className="w-full flex items-center justify-center gap-2 text-sm px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              下一步：构造完成 <ChevronRight className="w-4 h-4" />
            </button>
            {pending > 0 && <p className="text-xs text-center text-gray-400">还有 {pending} 条待确认，可直接进入</p>}
          </div>
        )}
        {!extracted && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500">选择目标实体和关系类型后点击「抽取实体与关系」，仅抽取所选类型的候选项</p>
          </div>
        )}
        {extracted && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1.5">当前抽取范围</p>
            <p className="text-xs text-blue-700">实体：{targetEntities.join('、')}</p>
            <p className="text-xs text-blue-700 mt-0.5">关系：{targetRelations.join('、')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Complete ─────────────────────────────────────────────────────────

function StepComplete({ config, onBack }: { config: ConfigState; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-7 text-white flex items-center gap-4">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Check className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-1">本次知识图谱从 0 到 1 构造已完成</h3>
          <p className="text-green-100 text-sm">图谱已写入 Neo4j · 向量索引已就绪 · 可供下游任务调用</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />构造结果统计
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard label="实体总数" value="3,204" vc="text-blue-600" />
              <StatCard label="关系总数" value="2,651" vc="text-purple-600" />
              <StatCard label="文档数量" value="12,480" vc="text-amber-600" />
              <StatCard label="人工确认" value="8" vc="text-green-600" />
            </div>
            <div className="space-y-3 border-t border-gray-100 pt-4">
              {[
                { k: '图谱 ID', v: config.graphId || 'kg_tech_20260717', mono: true },
                { k: '数据源', v: config.sourceId || 'mysql' },
                { k: '构造模式', v: config.mode === 'sample' ? '抽样 10%' : '全量' },
                { k: '图数据库写入', v: '✓ Neo4j · 写入成功', green: true },
                { k: '向量索引', v: config.vectorize ? `✓ Milvus · ${config.embModel}` : '未开启', green: config.vectorize },
              ].map(item => (
                <div key={item.k} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{item.k}</span>
                  <span className={`font-medium ${item.mono ? 'font-mono text-xs text-gray-700' : item.green ? 'text-green-700' : 'text-gray-900'}`}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onBack} className="w-full text-sm px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            确认完成 · 返回流程列表
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />后续能力入口</p>
          <p className="text-xs text-gray-500 mb-4">图谱构造完成，可接入以下下游任务</p>
          <div className="space-y-2.5">
            {NEXT_STEPS.map(step => (
              <div key={step.id} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all hover:shadow-sm ${step.bg}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${step.ic}`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{step.name}</p>
                  <p className="text-[11px] text-gray-500">{step.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props { onBack: () => void }

export default function KGConstructionEngine({ onBack }: Props) {
  const [step, setStep] = useState(0);
  const [gateway, setGateway] = useState('http://kg-gateway.internal:8080');
  const [gwStatus, setGwStatus] = useState<GatewayStatus>('idle');
  const [config, setConfig] = useState<ConfigState>({
    sourceId: '', conn: { ...EMPTY_CONN }, schemaStatus: 'idle',
    classes: [], relations: [], selectedClasses: [], selectedRelations: [],
    graphId: '', mode: 'sample', vectorize: true, embModel: EMBEDDING_MODELS[0],
  });

  const testGw = () => { setGwStatus('testing'); setTimeout(() => setGwStatus('ok'), 1400); };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />返回流程列表
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Network className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">知识图谱构造引擎</h1>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">从 0 到 1</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
                {['配置数据源与本体', '启动构造并实时观测', '文档抽取 + 人机确认', '构造完成'].map((t, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className={step >= i ? 'text-blue-600 font-medium' : ''}>{t}</span>
                    {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-r border-gray-200"><Server className="w-3.5 h-3.5 text-gray-400" /></div>
              <input value={gateway} onChange={e => { setGateway(e.target.value); setGwStatus('idle'); }}
                className="px-3 py-2 text-xs font-mono text-gray-700 w-52 focus:outline-none" />
            </div>
            <button onClick={testGw} disabled={gwStatus === 'testing'}
              className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {gwStatus === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
              测试连接
            </button>
            {gwStatus === 'ok' && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />在线
              </span>
            )}
            {gwStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg">
                <WifiOff className="w-3 h-3" />离线
              </span>
            )}
          </div>
        </div>
      </div>

      <StepBar current={step} />

      {step === 0 && <StepConfig config={config} onChange={setConfig} onNext={() => setStep(1)} />}
      {step === 1 && <StepMonitor config={config} onNext={() => setStep(2)} />}
      {step === 2 && <StepExtract config={config} onNext={() => setStep(3)} />}
      {step === 3 && <StepComplete config={config} onBack={onBack} />}
    </div>
  );
}
