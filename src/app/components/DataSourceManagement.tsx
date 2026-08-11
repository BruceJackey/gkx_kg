import { useState } from 'react';
import { Plus, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Loader2, Sprout, Link2, ArrowRight, Database, ChevronDown } from 'lucide-react';

type DSMode = 'structured' | 'unstructured' | 'seed';
type StructType = 'mysql' | 'postgresql' | 'datalake' | 'trs';
type UnstructType = 'minio' | 'cos' | 'oss';
type ConnStatus = 'idle' | 'testing' | 'ok' | 'failed' | 'scanning';

// ─── Ontology reference data (mirrors OntologyManagement mock) ────────────────
interface OntoProp { id: string; name: string; type: string; required: boolean; }
interface OntoEntity { id: string; name: string; enId: string; props: OntoProp[]; }
interface OntologyRef { id: string; name: string; entities: OntoEntity[]; }

const ONTOLOGY_REFS: OntologyRef[] = [
  {
    id: 'o1', name: '科技论文知识图谱本体',
    entities: [
      { id: 'e1', name: '论文', enId: 'Paper', props: [
        { id: 'p1', name: '标题', type: 'string', required: true },
        { id: 'p2', name: '摘要', type: 'text', required: false },
        { id: 'p3', name: '发表年份', type: 'int', required: true },
        { id: 'p4', name: 'DOI', type: 'string', required: false },
      ]},
      { id: 'e2', name: '作者', enId: 'Author', props: [
        { id: 'p5', name: '姓名', type: 'string', required: true },
        { id: 'p6', name: 'ORCID', type: 'string', required: false },
        { id: 'p7', name: '邮箱', type: 'string', required: false },
      ]},
      { id: 'e3', name: '机构', enId: 'Institution', props: [
        { id: 'p8', name: '机构名称', type: 'string', required: true },
        { id: 'p9', name: '国家', type: 'string', required: false },
      ]},
    ],
  },
  {
    id: 'o2', name: '新能源产业图谱本体',
    entities: [
      { id: 'e5', name: '企业', enId: 'Company', props: [
        { id: 'p12', name: '企业名称', type: 'string', required: true },
        { id: 'p13', name: '注册地', type: 'string', required: false },
      ]},
      { id: 'e6', name: '技术', enId: 'Technology', props: [
        { id: 'p14', name: '技术名称', type: 'string', required: true },
        { id: 'p15', name: '成熟度', type: 'string', required: false },
      ]},
    ],
  },
];

// ─── Seed instance types ──────────────────────────────────────────────────────
type SeedStatus = 'draft' | 'imported';
interface SeedInstance {
  id: string;
  name: string;
  description: string;
  ontologyId: string;
  entityId: string;
  fieldValues: Record<string, string>;
  status: SeedStatus;
  createdAt: string;
}

const MOCK_SEEDS: SeedInstance[] = [
  {
    id: 'seed1',
    name: 'GPT-4技术报告',
    description: '关于GPT-4大语言模型的技术报告种子实体',
    ontologyId: 'o1',
    entityId: 'e1',
    fieldValues: { p1: 'GPT-4 Technical Report', p2: 'OpenAI发布的GPT-4技术报告，详细描述了模型架构与评测结果', p3: '2023', p4: '10.48550/arXiv.2303.08774' },
    status: 'draft',
    createdAt: '2024-03-14 10:30',
  },
  {
    id: 'seed2',
    name: '清华大学',
    description: '中国顶尖研究型大学机构种子实体',
    ontologyId: 'o1',
    entityId: 'e3',
    fieldValues: { p8: '清华大学', p9: '中国' },
    status: 'imported',
    createdAt: '2024-03-12 14:15',
  },
];

// ─── Standard DS types ────────────────────────────────────────────────────────
interface TableField { name: string; type: string; }
interface ScannedTable { name: string; rowCount: number; fields: TableField[]; updatedAt: string; }
interface StructuredDS {
  id: string; name: string; type: StructType; host: string; port: string;
  database: string; username: string; password: string; defaultView: string;
  connStatus: ConnStatus; savedAt: string; tables: ScannedTable[];
}
interface UnstructuredDS {
  id: string; name: string; type: UnstructType; endpoint: string;
  accessKey: string; secretKey: string; bucket: string; prefix: string;
  protocol: 'http' | 'https'; connStatus: ConnStatus; savedAt: string;
  objects: { path: string; format: string; size: string; updatedAt: string; }[];
}

const MOCK_STRUCTURED: StructuredDS[] = [{
  id: 's1', name: '科研文献数据库', type: 'mysql', host: '192.168.1.10', port: '3306',
  database: 'corpus_db', username: 'kg_user', password: 'kg_pass_2024', defaultView: '',
  connStatus: 'ok', savedAt: '2024-03-15 10:20',
  tables: [
    { name: 'papers', rowCount: 128430, updatedAt: '2024-03-14 23:00', fields: [
      { name: 'id', type: 'bigint' }, { name: 'title', type: 'varchar(512)' }, { name: 'abstract', type: 'text' },
      { name: 'pub_year', type: 'int' }, { name: 'doi', type: 'varchar(128)' },
    ]},
    { name: 'authors', rowCount: 45621, updatedAt: '2024-03-14 23:00', fields: [
      { name: 'id', type: 'bigint' }, { name: 'name', type: 'varchar(256)' }, { name: 'orcid', type: 'varchar(64)' },
      { name: 'email', type: 'varchar(256)' }, { name: 'inst_id', type: 'bigint' },
    ]},
    { name: 'institutions', rowCount: 8340, updatedAt: '2024-03-14 22:30', fields: [
      { name: 'id', type: 'bigint' }, { name: 'name', type: 'varchar(512)' }, { name: 'country', type: 'varchar(64)' },
      { name: 'city', type: 'varchar(128)' }, { name: 'type', type: 'varchar(64)' },
    ]},
  ],
}];

const MOCK_UNSTRUCTURED: UnstructuredDS[] = [{
  id: 'u1', name: '研究文档存储', type: 'minio', endpoint: '127.0.0.1:9000',
  accessKey: 'kgminioadmin', secretKey: 'kgminio2024!', bucket: 'kg-construct-documents',
  prefix: 'research/', protocol: 'http', connStatus: 'ok', savedAt: '2024-03-12 16:45',
  objects: [
    { path: 'research/papers/2024/q1_batch.pdf', format: 'PDF', size: '12.3 MB', updatedAt: '2024-03-10' },
    { path: 'research/papers/2024/q2_batch.pdf', format: 'PDF', size: '9.8 MB', updatedAt: '2024-03-10' },
    { path: 'research/reports/annual_2023.docx', format: 'DOCX', size: '3.1 MB', updatedAt: '2024-02-28' },
    { path: 'research/reports/annual_2022.docx', format: 'DOCX', size: '2.8 MB', updatedAt: '2024-02-28' },
    { path: 'research/patents/batch_2024.json', format: 'JSON', size: '45.6 MB', updatedAt: '2024-03-08' },
    { path: 'research/thesis/grad_2023.pdf', format: 'PDF', size: '8.2 MB', updatedAt: '2024-01-15' },
    { path: 'research/conference/nips2023.pdf', format: 'PDF', size: '5.4 MB', updatedAt: '2024-01-20' },
    { path: 'research/conference/icml2023.pdf', format: 'PDF', size: '6.7 MB', updatedAt: '2024-01-20' },
  ],
}];

function StatusDot({ status }: { status: ConnStatus }) {
  const color = status === 'ok' ? 'bg-green-400' : status === 'failed' ? 'bg-red-400' : 'bg-gray-300';
  return <span className={`w-2 h-2 rounded-full inline-block ${color}`} />;
}

function ConnBanner({ status }: { status: ConnStatus }) {
  if (status === 'ok') return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
      <CheckCircle size={13} /> 连接成功，数据库响应正常
    </div>
  );
  if (status === 'failed') return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
      <XCircle size={13} /> 连接失败，请检查主机地址和端口是否可达
    </div>
  );
  return null;
}

export default function DataSourceManagement() {
  const [mode, setMode] = useState<DSMode>('structured');
  const [structuredList, setStructuredList] = useState<StructuredDS[]>(MOCK_STRUCTURED);
  const [unstructuredList, setUnstructuredList] = useState<UnstructuredDS[]>(MOCK_UNSTRUCTURED);
  const [selectedStructId, setSelectedStructId] = useState('s1');
  const [selectedUnstructId, setSelectedUnstructId] = useState('u1');
  const [showPwd, setShowPwd] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Seed instance state
  const [seedList, setSeedList] = useState<SeedInstance[]>(MOCK_SEEDS);
  const [selectedSeedId, setSelectedSeedId] = useState('seed1');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [showOntologyPicker, setShowOntologyPicker] = useState(false);

  const selectedStruct = structuredList.find(s => s.id === selectedStructId) || structuredList[0];
  const selectedUnstruct = unstructuredList.find(u => u.id === selectedUnstructId) || unstructuredList[0];
  const selectedSeed = seedList.find(s => s.id === selectedSeedId) || seedList[0];

  const updateSeed = (s: SeedInstance) => setSeedList(prev => prev.map(x => x.id === s.id ? s : x));

  const addSeed = () => {
    const id = 'seed_' + Date.now();
    const n: SeedInstance = {
      id, name: '新种子实例', description: '',
      ontologyId: ONTOLOGY_REFS[0].id,
      entityId: ONTOLOGY_REFS[0].entities[0].id,
      fieldValues: {}, status: 'draft',
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };
    setSeedList(prev => [...prev, n]);
    setSelectedSeedId(id);
  };

  const deleteSeed = (id: string) => {
    setSeedList(prev => prev.filter(s => s.id !== id));
    if (selectedSeedId === id) setSelectedSeedId(seedList.find(s => s.id !== id)?.id || '');
  };

  const handleImportSeed = (id: string) => {
    setImportingId(id);
    setTimeout(() => {
      setImportingId(null);
      setSeedList(prev => prev.map(s => s.id === id ? { ...s, status: 'imported' } : s));
    }, 1400);
  };

  const getSeedOntology = (seed: SeedInstance) => ONTOLOGY_REFS.find(o => o.id === seed.ontologyId);
  const getSeedEntity = (seed: SeedInstance) => getSeedOntology(seed)?.entities.find(e => e.id === seed.entityId);

  const updateStruct = (s: StructuredDS) => setStructuredList(prev => prev.map(x => x.id === s.id ? s : x));
  const updateUnstruct = (u: UnstructuredDS) => setUnstructuredList(prev => prev.map(x => x.id === u.id ? u : x));

  const handleTest = (id: string, isStruct: boolean) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      if (isStruct) {
        const s = structuredList.find(x => x.id === id);
        if (s) updateStruct({ ...s, connStatus: 'ok' });
      } else {
        const u = unstructuredList.find(x => x.id === id);
        if (u) updateUnstruct({ ...u, connStatus: 'ok' });
      }
    }, 1200);
  };

  const addStructured = () => {
    const id = 's_' + Date.now();
    const n: StructuredDS = { id, name: '新数据源', type: 'mysql', host: '', port: '3306', database: '', username: '', password: '', defaultView: '', connStatus: 'idle', savedAt: '-', tables: [] };
    setStructuredList(prev => [...prev, n]);
    setSelectedStructId(id);
  };

  const addUnstructured = () => {
    const id = 'u_' + Date.now();
    const n: UnstructuredDS = { id, name: '新对象存储', type: 'minio', endpoint: '', accessKey: '', secretKey: '', bucket: '', prefix: '', protocol: 'http', connStatus: 'idle', savedAt: '-', objects: [] };
    setUnstructuredList(prev => [...prev, n]);
    setSelectedUnstructId(id);
  };

  const deleteStruct = (id: string) => {
    setStructuredList(prev => prev.filter(s => s.id !== id));
    if (selectedStructId === id) setSelectedStructId(structuredList.find(s => s.id !== id)?.id || '');
  };

  const deleteUnstruct = (id: string) => {
    setUnstructuredList(prev => prev.filter(u => u.id !== id));
    if (selectedUnstructId === id) setSelectedUnstructId(unstructuredList.find(u => u.id !== id)?.id || '');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <div className="flex bg-gray-100 rounded-full p-0.5 gap-0.5">
          <button onClick={() => setMode('structured')} className={`text-sm px-4 py-1.5 rounded-full transition-colors ${mode === 'structured' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>结构化数据</button>
          <button onClick={() => setMode('unstructured')} className={`text-sm px-4 py-1.5 rounded-full transition-colors ${mode === 'unstructured' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>非结构化数据</button>
          <button onClick={() => setMode('seed')} className={`text-sm px-4 py-1.5 rounded-full transition-colors flex items-center gap-1 ${mode === 'seed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Sprout size={13} /> 种子实例
          </button>
        </div>
        <div className="flex-1" />
        {mode === 'seed' ? (
          <button onClick={addSeed} className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
            <Plus size={14} /> 新增种子实例
          </button>
        ) : (
          <button onClick={mode === 'structured' ? addStructured : addUnstructured} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
            <Plus size={14} /> 新增数据源
          </button>
        )}
      </div>

      {/* Main */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden p-6">
        {/* Source list */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          {mode === 'structured' ? (
            structuredList.map(s => (
              <div key={s.id} onClick={() => setSelectedStructId(s.id)}
                className={`bg-white border rounded-xl px-3 py-2.5 cursor-pointer flex items-center gap-2 transition-colors ${selectedStructId === s.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <StatusDot status={s.connStatus} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{s.name}</div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600">{s.type}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteStruct(s.id); }} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          ) : mode === 'unstructured' ? (
            unstructuredList.map(u => (
              <div key={u.id} onClick={() => setSelectedUnstructId(u.id)}
                className={`bg-white border rounded-xl px-3 py-2.5 cursor-pointer flex items-center gap-2 transition-colors ${selectedUnstructId === u.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <StatusDot status={u.connStatus} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">{u.type}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteUnstruct(u.id); }} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          ) : (
            seedList.map(seed => {
              const entity = getSeedEntity(seed);
              return (
                <div key={seed.id} onClick={() => setSelectedSeedId(seed.id)}
                  className={`bg-white border rounded-xl px-3 py-2.5 cursor-pointer flex items-center gap-2 transition-colors ${selectedSeedId === seed.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <Sprout size={14} className={seed.status === 'imported' ? 'text-emerald-500' : 'text-gray-400'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{seed.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {entity && <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{entity.name}</span>}
                      {seed.status === 'imported' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-600">已入库</span>}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteSeed(seed.id); }} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {mode === 'structured' && selectedStruct && (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm font-semibold text-gray-800 mb-4">数据源配置</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">数据源名称</div>
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedStruct.name} onChange={e => updateStruct({ ...selectedStruct, name: e.target.value })} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">数据库类型</div>
                    <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full" value={selectedStruct.type} onChange={e => updateStruct({ ...selectedStruct, type: e.target.value as StructType })}>
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="datalake">数据湖</option>
                      <option value="trs">TRS</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Host</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedStruct.host} onChange={e => updateStruct({ ...selectedStruct, host: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Port</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedStruct.port} onChange={e => updateStruct({ ...selectedStruct, port: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Database</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedStruct.database} onChange={e => updateStruct({ ...selectedStruct, database: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">默认表/View</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedStruct.defaultView} onChange={e => updateStruct({ ...selectedStruct, defaultView: e.target.value })} placeholder="可选" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Username</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedStruct.username} onChange={e => updateStruct({ ...selectedStruct, username: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Password</div>
                      <div className="relative">
                        <input type={showPwd ? 'text' : 'password'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full pr-9" value={selectedStruct.password} onChange={e => updateStruct({ ...selectedStruct, password: e.target.value })} />
                        <button onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <ConnBanner status={selectedStruct.connStatus} />
                  <div className="flex gap-2 flex-wrap">
                    <button className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">保存数据源</button>
                    <button onClick={() => handleTest(selectedStruct.id, true)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
                      {testingId === selectedStruct.id ? <Loader2 size={13} className="animate-spin" /> : selectedStruct.connStatus === 'ok' ? <CheckCircle size={13} className="text-green-500" /> : selectedStruct.connStatus === 'failed' ? <XCircle size={13} className="text-red-500" /> : null}
                      测试连接
                    </button>
                    <button className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">读取表字段</button>
                    <button className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
                      <RefreshCw size={13} /> 重新扫描
                    </button>
                  </div>
                </div>
              </div>

              {selectedStruct.tables.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="text-sm font-semibold text-gray-800 mb-4">扫描结果 <span className="text-xs font-normal text-gray-400">{selectedStruct.tables.length} 张表</span></div>
                  <div className="space-y-3">
                    {selectedStruct.tables.map(t => (
                      <div key={t.name} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-gray-800 font-medium">{t.name}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{t.rowCount.toLocaleString()} 行</span>
                            <span>{t.updatedAt}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {t.fields.map(f => (
                            <span key={f.name} className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                              {f.name} <span className="text-gray-400">{f.type}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'unstructured' && selectedUnstruct && (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm font-semibold text-gray-800 mb-4">对象存储配置</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">数据源名称</div>
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedUnstruct.name} onChange={e => updateUnstruct({ ...selectedUnstruct, name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">类型</div>
                      <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full" value={selectedUnstruct.type} onChange={e => updateUnstruct({ ...selectedUnstruct, type: e.target.value as UnstructType })}>
                        <option value="minio">MinIO</option>
                        <option value="cos">腾讯云 COS</option>
                        <option value="oss">阿里云 OSS</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">协议</div>
                      <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full" value={selectedUnstruct.protocol} onChange={e => updateUnstruct({ ...selectedUnstruct, protocol: e.target.value as 'http' | 'https' })}>
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Endpoint</div>
                    <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedUnstruct.endpoint} onChange={e => updateUnstruct({ ...selectedUnstruct, endpoint: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Access Key</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedUnstruct.accessKey} onChange={e => updateUnstruct({ ...selectedUnstruct, accessKey: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Secret Key</div>
                      <div className="relative">
                        <input type={showSecret ? 'text' : 'password'} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full pr-9" value={selectedUnstruct.secretKey} onChange={e => updateUnstruct({ ...selectedUnstruct, secretKey: e.target.value })} />
                        <button onClick={() => setShowSecret(!showSecret)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Bucket</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedUnstruct.bucket} onChange={e => updateUnstruct({ ...selectedUnstruct, bucket: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">Prefix</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full" value={selectedUnstruct.prefix} onChange={e => updateUnstruct({ ...selectedUnstruct, prefix: e.target.value })} />
                    </div>
                  </div>
                  <ConnBanner status={selectedUnstruct.connStatus} />
                  <div className="flex gap-2">
                    <button className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">保存数据源</button>
                    <button onClick={() => handleTest(selectedUnstruct.id, false)} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5">
                      {testingId === selectedUnstruct.id ? <Loader2 size={13} className="animate-spin" /> : selectedUnstruct.connStatus === 'ok' ? <CheckCircle size={13} className="text-green-500" /> : null}
                      测试连接
                    </button>
                    <button className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">扫描文档</button>
                  </div>
                </div>
              </div>

              {selectedUnstruct.objects.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-800">文档列表</div>
                    <div className="text-xs text-gray-400">共 {selectedUnstruct.objects.length} 个对象</div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">路径</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">格式</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">大小</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">更新时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedUnstruct.objects.map((o, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-xs truncate">{o.path}</td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{o.format}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{o.size}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{o.updatedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── Seed Instance Detail Panel ── */}
          {mode === 'seed' && selectedSeed && (() => {
            const ontology = getSeedOntology(selectedSeed);
            const entity = getSeedEntity(selectedSeed);
            return (
              <>
                {/* Basic info */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Sprout size={15} className="text-emerald-500" /> 种子实例配置
                    </div>
                    {selectedSeed.status === 'imported' && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle size={11} /> 已入库
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">实例名称</div>
                      <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 w-full"
                        value={selectedSeed.name}
                        onChange={e => updateSeed({ ...selectedSeed, name: e.target.value })} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1.5">描述</div>
                      <textarea rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 w-full resize-none"
                        value={selectedSeed.description}
                        onChange={e => updateSeed({ ...selectedSeed, description: e.target.value })} />
                    </div>

                    {/* Ontology & entity binding */}
                    <div className="border border-dashed border-emerald-200 rounded-xl p-4 bg-emerald-50/40 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                        <Link2 size={13} /> 关联本体实体类型
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1.5">目标本体</div>
                          <div className="relative">
                            <select
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 bg-white w-full appearance-none pr-8"
                              value={selectedSeed.ontologyId}
                              onChange={e => {
                                const newOntology = ONTOLOGY_REFS.find(o => o.id === e.target.value);
                                const firstEntity = newOntology?.entities[0];
                                updateSeed({ ...selectedSeed, ontologyId: e.target.value, entityId: firstEntity?.id || '', fieldValues: {} });
                              }}>
                              {ONTOLOGY_REFS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1.5">实体类型</div>
                          <div className="relative">
                            <select
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 bg-white w-full appearance-none pr-8"
                              value={selectedSeed.entityId}
                              onChange={e => updateSeed({ ...selectedSeed, entityId: e.target.value, fieldValues: {} })}>
                              {ontology?.entities.map(e => <option key={e.id} value={e.id}>{e.name}（{e.enId}）</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                      {entity && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-2">
                          <Database size={12} className="text-emerald-400" />
                          将作为 <span className="font-medium text-emerald-700">{ontology?.name}</span> 中
                          <span className="font-medium text-emerald-700">{entity.name}</span> 类型实体直接入库
                          <ArrowRight size={12} className="text-gray-400 ml-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entity property fields */}
                {entity && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="text-sm font-semibold text-gray-800 mb-1">实体属性填写</div>
                    <div className="text-xs text-gray-400 mb-4">根据「{entity.name}」实体类型的属性定义填写实例数据</div>
                    <div className="space-y-3">
                      {entity.props.map(prop => (
                        <div key={prop.id}>
                          <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                            {prop.name}
                            <span className="text-gray-300">({prop.type})</span>
                            {prop.required && <span className="text-red-400 text-xs">*</span>}
                          </div>
                          {prop.type === 'text' ? (
                            <textarea rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 w-full resize-none"
                              placeholder={`请输入${prop.name}`}
                              value={selectedSeed.fieldValues[prop.id] || ''}
                              onChange={e => updateSeed({ ...selectedSeed, fieldValues: { ...selectedSeed.fieldValues, [prop.id]: e.target.value } })} />
                          ) : prop.type === 'boolean' ? (
                            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 bg-white w-full"
                              value={selectedSeed.fieldValues[prop.id] || ''}
                              onChange={e => updateSeed({ ...selectedSeed, fieldValues: { ...selectedSeed.fieldValues, [prop.id]: e.target.value } })}>
                              <option value="">请选择</option>
                              <option value="true">是</option>
                              <option value="false">否</option>
                            </select>
                          ) : (
                            <input
                              type={prop.type === 'int' || prop.type === 'number' ? 'number' : prop.type === 'date' ? 'date' : 'text'}
                              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 w-full"
                              placeholder={`请输入${prop.name}`}
                              value={selectedSeed.fieldValues[prop.id] || ''}
                              onChange={e => updateSeed({ ...selectedSeed, fieldValues: { ...selectedSeed.fieldValues, [prop.id]: e.target.value } })} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => updateSeed({ ...selectedSeed })}
                        className="text-sm px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                        保存实例
                      </button>
                      {selectedSeed.status !== 'imported' ? (
                        <button
                          onClick={() => handleImportSeed(selectedSeed.id)}
                          disabled={importingId === selectedSeed.id}
                          className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-1.5">
                          {importingId === selectedSeed.id
                            ? <><Loader2 size={13} className="animate-spin" /> 入库中…</>
                            : <><Database size={13} /> 入库为实体</>}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm text-green-600 px-3">
                          <CheckCircle size={14} /> 已成功入库为实体
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
