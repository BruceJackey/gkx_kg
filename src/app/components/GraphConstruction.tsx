import { useState } from 'react';
import type { ElementType } from 'react';
import {
  Plus, Trash2, RotateCcw, CheckCircle2, Database, Layers, Shield,
  Wifi, SlidersHorizontal, Globe, Server, AlertCircle, ChevronRight, Play,
} from 'lucide-react';

type TabId = 'data' | 'scope' | 'rules' | 'remote' | 'threshold';

interface RemoteService {
  id: string; name: string; endpoint: string; authType: 'bearer' | 'header' | 'none';
  token: string; timeout: number; failStrategy: 'fallback' | 'stop';
  entityTypes: string[]; note: string; enabled: boolean;
}
interface FieldRuleRow { id: string; entity: string; attr: string; ruleId: string; }
interface RelationRuleRow { id: string; relation: string; ruleId: string; }

const uid = () => Math.random().toString(36).slice(2, 9);

const ONTOLOGIES = [
  { id: 'o1', name: '科技论文知识图谱本体', entities: ['论文', '作者', '机构', '概念'], relations: ['WRITTEN_BY', 'AFFILIATED_WITH', 'CITES', 'HAS_CONCEPT'] },
  { id: 'o2', name: '新能源产业图谱本体', entities: ['企业', '技术'], relations: ['DEVELOPS'] },
];
const DATASOURCES = [
  { id: 's1', name: '科研文献数据库', type: 'structured' },
  { id: 'u1', name: '研究文档存储', type: 'unstructured', detail: '127.0.0.1:9000 · kg-construct-documents · research/' },
];
const MAPPINGS = [{ id: 't1', name: '科研文献字段映射', ontologyId: 'o1', datasourceId: 's1' }];
const RULES = [
  { id: 'r1', name: '作者名称标准化', category: '实体类', status: 'published' },
  { id: 'r2', name: '机构别名合并', category: '实体类', status: 'published' },
  { id: 'r3', name: '专利实体去重检测', category: '实体类', status: 'published' },
  { id: 'r4', name: '属性格式化规范', category: '属性类', status: 'published' },
  { id: 'r5', name: '引用关系验证', category: '关系类', status: 'published' },
  { id: 'r6', name: '循环关系检测', category: '关系类', status: 'draft' },
];
const ENTITY_ATTRS: Record<string, string[]> = {
  '论文': ['标题', '摘要', '发表年份', 'DOI'],
  '作者': ['姓名', 'ORCID', '邮箱'],
  '机构': ['机构名称', '国家'],
  '概念': ['术语', '定义'],
  '企业': ['企业名称', '注册地'],
  '技术': ['技术名称', '成熟度'],
};

const TABS: { id: TabId; label: string; icon: ElementType }[] = [
  { id: 'data', label: '数据与本体', icon: Database },
  { id: 'scope', label: '抽取范围', icon: Layers },
  { id: 'rules', label: '规则配置', icon: Shield },
  { id: 'remote', label: '远程抽取', icon: Wifi },
  { id: 'threshold', label: '阈值策略', icon: SlidersHorizontal },
];

export default function GraphConstruction({ onNavigateTo }: { onNavigateTo?: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('data');

  // 数据与本体
  const [selectedOntoId, setSelectedOntoId] = useState('o1');
  const [selectedDsId, setSelectedDsId] = useState('s1');
  const [selectedMappingId, setSelectedMappingId] = useState('t1');
  const [syncMode, setSyncMode] = useState<'全量' | '增量'>('全量');
  const [extractMethod, setExtractMethod] = useState('LLM+规则');

  // 抽取范围
  const [checkedEntities, setCheckedEntities] = useState<string[]>(['论文', '作者', '机构', '概念']);
  const [checkedRelations, setCheckedRelations] = useState<string[]>(['WRITTEN_BY', 'AFFILIATED_WITH']);

  // 规则配置
  const [globalRules, setGlobalRules] = useState<string[]>(['r1', 'r2']);
  const [newGlobalRuleId, setNewGlobalRuleId] = useState('');
  const [fieldRules, setFieldRules] = useState<FieldRuleRow[]>([]);
  const [newFieldEntity, setNewFieldEntity] = useState('');
  const [newFieldAttr, setNewFieldAttr] = useState('');
  const [newFieldRuleId, setNewFieldRuleId] = useState('');
  const [relationRules, setRelationRules] = useState<RelationRuleRow[]>([]);
  const [newRelation, setNewRelation] = useState('');
  const [newRelationRuleId, setNewRelationRuleId] = useState('');

  // 远程抽取
  const [remoteServices, setRemoteServices] = useState<RemoteService[]>([]);
  const [remoteName, setRemoteName] = useState('');
  const [remoteEndpoint, setRemoteEndpoint] = useState('');
  const [remoteAuthType, setRemoteAuthType] = useState<'bearer' | 'header' | 'none'>('none');
  const [remoteToken, setRemoteToken] = useState('');
  const [remoteTimeout, setRemoteTimeout] = useState(30);
  const [remoteFailStrategy, setRemoteFailStrategy] = useState<'fallback' | 'stop'>('fallback');
  const [remoteEntityTypes, setRemoteEntityTypes] = useState<string[]>([]);
  const [remoteNote, setRemoteNote] = useState('');

  // 阈值
  const [threshold, setThreshold] = useState(75);

  // 多策略权重 (0-100, 归一化后使用)
  const [weights, setWeights] = useState({ rule: 40, dict: 30, ml: 30 });
  const totalWeight = weights.rule + weights.dict + weights.ml;
  const normalizedWeights = totalWeight > 0
    ? { rule: weights.rule / totalWeight, dict: weights.dict / totalWeight, ml: weights.ml / totalWeight }
    : { rule: 1 / 3, dict: 1 / 3, ml: 1 / 3 };
  const setWeight = (key: keyof typeof weights, val: number) => {
    setWeights(w => ({ ...w, [key]: Math.max(0, Math.min(100, val)) }));
  };

  // 抽取模型
  type ExtractModel = 'glm5.2' | 'glm5.1';
  const [extractModel, setExtractModel] = useState<ExtractModel>('glm5.2');
  const MODEL_OPTIONS: { value: ExtractModel; label: string; tag?: string; desc: string }[] = [
    { value: 'glm5.2', label: 'GLM-5.2', tag: '推荐', desc: '最新版本，抽取精度更高，支持长上下文' },
    { value: 'glm5.1', label: 'GLM-5.1', desc: '稳定版本，速度更快，适合大批量任务' },
  ];

  // Submit
  const [submitting, setSubmitting] = useState(false);

  const currentOnto = ONTOLOGIES.find(o => o.id === selectedOntoId) || ONTOLOGIES[0];
  const currentDS = DATASOURCES.find(d => d.id === selectedDsId);
  const isStructured = currentDS?.type === 'structured';
  const publishedRules = RULES.filter(r => r.status === 'published');
  const attrRules = publishedRules.filter(r => r.category === '属性类');
  const relRules = publishedRules.filter(r => r.category === '关系类');
  const availableGlobalRules = publishedRules.filter(r => !globalRules.includes(r.id));
  const entityAttrs = newFieldEntity ? (ENTITY_ATTRS[newFieldEntity] || []) : [];
  const canAddGlobal = !!newGlobalRuleId && !globalRules.includes(newGlobalRuleId);
  const canAddField = !!(newFieldEntity && newFieldAttr && newFieldRuleId);
  const canAddRelation = !!(newRelation && newRelationRuleId);
  const totalRules = globalRules.length + fieldRules.length + relationRules.length;
  const enabledRemote = remoteServices.filter(s => s.enabled).length;
  const thresholdColor = threshold >= 80 ? 'text-green-600' : threshold >= 60 ? 'text-amber-500' : 'text-red-500';

  const configValid = !!selectedOntoId && !!selectedDsId && (isStructured ? !!selectedMappingId : true) && checkedEntities.length > 0;
  const configReason = !selectedOntoId ? '请选择本体' : !selectedDsId ? '请选择数据源'
    : (isStructured && !selectedMappingId) ? '结构化数据源需要选择映射模板'
    : checkedEntities.length === 0 ? '请至少选择一个实体类型' : '';

  const toggleEntity = (name: string) => setCheckedEntities(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  const toggleRelation = (name: string) => setCheckedRelations(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  const toggleRemoteEntity = (name: string) => setRemoteEntityTypes(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);

  const addRemoteService = () => {
    if (!remoteName || !remoteEndpoint) return;
    setRemoteServices(p => [...p, {
      id: uid(), name: remoteName, endpoint: remoteEndpoint, authType: remoteAuthType,
      token: remoteToken, timeout: remoteTimeout, failStrategy: remoteFailStrategy,
      entityTypes: remoteEntityTypes, note: remoteNote, enabled: true,
    }]);
    setRemoteName(''); setRemoteEndpoint(''); setRemoteAuthType('none');
    setRemoteToken(''); setRemoteTimeout(30); setRemoteFailStrategy('fallback');
    setRemoteEntityTypes([]); setRemoteNote('');
  };

  const handleReset = () => {
    setSelectedOntoId('o1'); setSelectedDsId('s1'); setSelectedMappingId('t1');
    setSyncMode('全量'); setExtractMethod('LLM+规则');
    setCheckedEntities(['论文', '作者', '机构', '概念']);
    setCheckedRelations(['WRITTEN_BY', 'AFFILIATED_WITH']);
    setGlobalRules(['r1', 'r2']); setFieldRules([]); setRelationRules([]);
    setRemoteServices([]); setThreshold(75); setActiveTab('data');
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); onNavigateTo?.('graph-tasks'); }, 800);
  };

  const renderTabContent = () => {
    // ── 数据与本体 ──
    if (activeTab === 'data') return (
      <div className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-800 mb-3">本体</div>
            <select value={selectedOntoId} onChange={e => setSelectedOntoId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              {ONTOLOGIES.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <div className="mt-2 text-xs text-gray-400">{currentOnto.entities.length} 实体 · {currentOnto.relations.length} 关系</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-800 mb-3">数据源</div>
            <select value={selectedDsId} onChange={e => setSelectedDsId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              {DATASOURCES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${isStructured ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                {isStructured ? '结构化' : '非结构化'}
              </span>
            </div>
          </div>
        </div>

        {isStructured ? (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">映射模板</div>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
                {(['全量', '增量'] as const).map(m => (
                  <button key={m} onClick={() => setSyncMode(m)}
                    className={`px-3 py-1 transition-colors ${syncMode === m ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <select value={selectedMappingId} onChange={e => setSelectedMappingId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              {MAPPINGS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {syncMode === '增量' && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                增量同步需要全量基线。上次全量：2026-07-20 02:30 · 同步水位：checkpoint=2026-07-30T14:22:00Z
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-800 mb-2">对象存储信息（只读）</div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Endpoint: <span className="text-gray-700 font-mono">127.0.0.1:9000</span></div>
                <div>Bucket: <span className="text-gray-700 font-mono">kg-construct-documents</span></div>
                <div>Prefix: <span className="text-gray-700 font-mono">research/</span></div>
                <div>文档数: <span className="text-gray-700">8 个</span></div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">抽取方式</div>
              <select value={extractMethod} onChange={e => setExtractMethod(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                {['LLM+规则', '仅LLM', '仅规则'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    );

    // ── 抽取范围 ──
    if (activeTab === 'scope') return (
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">实体类型</div>
          <div className="space-y-2.5">
            {currentOnto.entities.map(e => (
              <label key={e} className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={checkedEntities.includes(e)} onChange={() => toggleEntity(e)}
                  className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700 flex-1">{e}</span>
                <span className="text-xs text-gray-400">~3,000</span>
              </label>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">关系类型</div>
          <div className="space-y-2.5">
            {currentOnto.relations.map(r => {
              const disabled = checkedEntities.length === 0;
              return (
                <label key={r} className={`flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-40' : ''}`}>
                  <input type="checkbox" checked={checkedRelations.includes(r)} onChange={() => !disabled && toggleRelation(r)}
                    disabled={disabled} className="rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              );
            })}
          </div>
          {checkedEntities.length === 0 && (
            <p className="text-xs text-amber-600 mt-3">请先选择至少一个实体类型</p>
          )}
        </div>
      </div>
    );

    // ── 规则配置 ──
    if (activeTab === 'rules') return (
      <div className="grid grid-cols-3 gap-4 max-w-4xl">
        {/* 全局规则 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">全局规则</div>
          {globalRules.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {globalRules.map(id => {
                const rule = RULES.find(r => r.id === id);
                if (!rule) return null;
                return (
                  <div key={id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                    <span className="text-xs text-gray-800 flex-1">{rule.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${rule.category === '实体类' ? 'bg-blue-50 text-blue-600' : rule.category === '属性类' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                      {rule.category}
                    </span>
                    <button onClick={() => setGlobalRules(p => p.filter(x => x !== id))} className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex gap-2">
            <select value={newGlobalRuleId} onChange={e => setNewGlobalRuleId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white min-w-0">
              <option value="">选择规则…</option>
              {availableGlobalRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button disabled={!canAddGlobal}
              onClick={() => { setGlobalRules(p => [...p, newGlobalRuleId]); setNewGlobalRuleId(''); }}
              className="flex-shrink-0 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs flex items-center gap-1 transition-colors">
              <Plus size={11} />添加
            </button>
          </div>
          {availableGlobalRules.length === 0 && globalRules.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-2">已添加全部可用规则</p>
          )}
        </div>

        {/* 字段规则 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">字段规则</div>
          {fieldRules.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {fieldRules.map(row => {
                const ruleName = RULES.find(r => r.id === row.ruleId)?.name || row.ruleId;
                return (
                  <div key={row.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                    <span className="text-[11px] text-blue-700 font-medium">{row.entity}</span>
                    <span className="text-gray-400 text-[10px]">·</span>
                    <span className="text-[11px] text-gray-600">{row.attr}</span>
                    <span className="text-gray-400 mx-0.5 text-[10px]">→</span>
                    <span className="text-[11px] text-purple-600 flex-1 truncate">{ruleName}</span>
                    <button onClick={() => setFieldRules(p => p.filter(r => r.id !== row.id))} className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-1.5">
            <select value={newFieldEntity} onChange={e => { setNewFieldEntity(e.target.value); setNewFieldAttr(''); }}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
              <option value="">实体</option>
              {currentOnto.entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={newFieldAttr} onChange={e => setNewFieldAttr(e.target.value)} disabled={!newFieldEntity}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white disabled:opacity-40">
              <option value="">属性</option>
              {entityAttrs.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={newFieldRuleId} onChange={e => setNewFieldRuleId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
              <option value="">规则</option>
              {attrRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button disabled={!canAddField}
              onClick={() => {
                setFieldRules(p => [...p, { id: uid(), entity: newFieldEntity, attr: newFieldAttr, ruleId: newFieldRuleId }]);
                setNewFieldAttr(''); setNewFieldRuleId('');
              }}
              className="w-full px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs flex items-center justify-center gap-1 transition-colors">
              <Plus size={11} />添加字段规则
            </button>
          </div>
        </div>

        {/* 关系规则 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">关系规则</div>
          {relationRules.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {relationRules.map(row => {
                const ruleName = RULES.find(r => r.id === row.ruleId)?.name || row.ruleId;
                return (
                  <div key={row.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">
                    <span className="text-[11px] text-green-700 font-medium">{row.relation}</span>
                    <span className="text-gray-400 mx-0.5 text-[10px]">→</span>
                    <span className="text-[11px] text-purple-600 flex-1 truncate">{ruleName}</span>
                    <button onClick={() => setRelationRules(p => p.filter(r => r.id !== row.id))} className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-1.5">
            <select value={newRelation} onChange={e => setNewRelation(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
              <option value="">关系</option>
              {currentOnto.relations.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={newRelationRuleId} onChange={e => setNewRelationRuleId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400 bg-white">
              <option value="">规则</option>
              {relRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button disabled={!canAddRelation}
              onClick={() => {
                setRelationRules(p => [...p, { id: uid(), relation: newRelation, ruleId: newRelationRuleId }]);
                setNewRelation(''); setNewRelationRuleId('');
              }}
              className="w-full px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs flex items-center justify-center gap-1 transition-colors">
              <Plus size={11} />添加关系规则
            </button>
          </div>
        </div>
      </div>
    );

    // ── 远程抽取 ──
    if (activeTab === 'remote') return (
      <div className="max-w-3xl space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <Globe className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">把指定实体类型交给远程服务抽取，系统只接收并校验返回结果。远程服务需遵循 kg_extract v2 协议。</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-800 mb-4">配置远程抽取服务</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">服务名称</label>
              <input value={remoteName} onChange={e => setRemoteName(e.target.value)} placeholder="如：文献专利抽取服务"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Endpoint URL</label>
              <input value={remoteEndpoint} onChange={e => setRemoteEndpoint(e.target.value)} placeholder="https://..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">鉴权方式</label>
              <select value={remoteAuthType} onChange={e => setRemoteAuthType(e.target.value as any)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="none">无</option>
                <option value="bearer">Bearer Token</option>
                <option value="header">Header Key</option>
              </select>
            </div>
            {remoteAuthType !== 'none' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Token</label>
                <input value={remoteToken} onChange={e => setRemoteToken(e.target.value)} placeholder="输入 Token…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">超时秒数</label>
              <input type="number" value={remoteTimeout} onChange={e => setRemoteTimeout(Number(e.target.value))} min={1} max={300}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">失败策略</label>
              <select value={remoteFailStrategy} onChange={e => setRemoteFailStrategy(e.target.value as any)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="fallback">失败回退本地/LLM</option>
                <option value="stop">失败即停</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-2 block">适用实体类型</label>
              <div className="flex flex-wrap gap-2">
                {currentOnto.entities.map(e => (
                  <button key={e} onClick={() => toggleRemoteEntity(e)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${remoteEntityTypes.includes(e) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">说明（可选）</label>
              <textarea value={remoteNote} onChange={e => setRemoteNote(e.target.value)} rows={2} placeholder="服务用途说明…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addRemoteService} disabled={!remoteName || !remoteEndpoint}
              className="flex items-center gap-1.5 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors">
              <Plus className="w-4 h-4" />添加远程抽取服务
            </button>
            <button onClick={() => {
              setRemoteName(''); setRemoteEndpoint(''); setRemoteAuthType('none');
              setRemoteToken(''); setRemoteTimeout(30); setRemoteFailStrategy('fallback');
              setRemoteEntityTypes([]); setRemoteNote('');
            }} className="flex items-center gap-1.5 text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              清空草稿
            </button>
          </div>
        </div>

        {remoteServices.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['服务', 'Endpoint', '实体范围', '失败策略', '启用状态', '操作'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {remoteServices.map(svc => (
                  <tr key={svc.id}>
                    <td className="px-4 py-3 font-medium text-gray-800 text-sm">{svc.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[160px] truncate">{svc.endpoint}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{svc.entityTypes.length ? svc.entityTypes.join('、') : '全部'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{svc.failStrategy === 'fallback' ? '回退本地' : '失败即停'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${svc.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {svc.enabled ? '已启用' : '已停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setRemoteServices(p => p.map(s => s.id === svc.id ? { ...s, enabled: !s.enabled } : s))}
                          className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                          {svc.enabled ? '停用' : '启用'}
                        </button>
                        <button onClick={() => setRemoteServices(p => p.filter(s => s.id !== svc.id))}
                          className="text-xs px-2.5 py-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无远程抽取服务，填写上方表单并点击"添加"</p>
          </div>
        )}
      </div>
    );

    // ── 阈值策略 ──
    if (activeTab === 'threshold') return (
      <div className="max-w-2xl space-y-4">

        {/* 模型选择 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-800 mb-3">抽取模型</div>
          <div className="space-y-2.5">
            {MODEL_OPTIONS.map(opt => {
              const selected = extractModel === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setExtractModel(opt.value)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* radio dot */}
                  <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selected ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                    {selected && <span className="w-2 h-2 rounded-full bg-blue-500 block" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {opt.label}
                      </span>
                      {opt.tag && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {opt.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">所选模型将用于实体、关系的全部抽取步骤</p>
        </div>

        {/* 多策略加权配置 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-800">多策略加权配置</div>
            <div className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              totalWeight === 100
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              权重总计 {totalWeight}%
              {totalWeight !== 100 && ' · 将自动归一化'}
            </div>
          </div>

          {/* Strategy rows */}
          <div className="space-y-4">
            {([
              { key: 'rule' as const, label: '规则策略', en: 'Rule',  color: 'blue',   dot: 'bg-blue-500',   bar: 'bg-blue-400',   ring: 'focus:border-blue-400',   desc: '基于预定义规则匹配的置信度' },
              { key: 'dict' as const, label: '词典策略', en: 'Dict',  color: 'violet', dot: 'bg-violet-500', bar: 'bg-violet-400', ring: 'focus:border-violet-400', desc: '基于词典/知识库查找的置信度' },
              { key: 'ml'   as const, label: '机器学习', en: 'ML',    color: 'teal',   dot: 'bg-teal-500',   bar: 'bg-teal-400',   ring: 'focus:border-teal-400',   desc: '基于模型预测的置信度' },
            ]).map(({ key, label, en, color, dot, bar, ring, desc }) => {
              const w = weights[key];
              const pct = totalWeight > 0 ? Math.round(normalizedWeights[key] * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-sm font-medium text-gray-800 w-20 flex-shrink-0">{label}</span>
                    <span className="text-[11px] text-gray-400 flex-1">{desc}</span>
                    {/* Stepper input */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <button onClick={() => setWeight(key, w - 5)}
                        className="px-2 py-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-sm transition-colors">−</button>
                      <input
                        type="number" min={0} max={100} value={w}
                        onChange={e => setWeight(key, Number(e.target.value))}
                        className={`w-14 text-center text-sm text-gray-800 border-x border-gray-200 py-1.5 focus:outline-none ${ring} bg-white`}
                      />
                      <button onClick={() => setWeight(key, w + 5)}
                        className="px-2 py-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-sm transition-colors">+</button>
                    </div>
                    <span className="text-[11px] text-gray-400 w-12 text-right flex-shrink-0">
                      {pct}% 归一
                    </span>
                  </div>
                  {/* Track */}
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stacked proportion bar */}
          <div className="mt-4">
            <div className="text-[11px] text-gray-400 mb-1.5">权重比例预览</div>
            <div className="flex h-3 rounded-full overflow-hidden gap-px bg-gray-100">
              <div className="bg-blue-400 transition-all duration-300"   style={{ width: `${Math.round(normalizedWeights.rule * 100)}%` }} />
              <div className="bg-violet-400 transition-all duration-300" style={{ width: `${Math.round(normalizedWeights.dict * 100)}%` }} />
              <div className="bg-teal-400 transition-all duration-300"   style={{ width: `${Math.round(normalizedWeights.ml   * 100)}%` }} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              {[
                { label: '规则', dot: 'bg-blue-400',   val: normalizedWeights.rule },
                { label: '词典', dot: 'bg-violet-400', val: normalizedWeights.dict },
                { label: 'ML',   dot: 'bg-teal-400',   val: normalizedWeights.ml   },
              ].map(({ label, dot, val }) => (
                <span key={label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {label} {Math.round(val * 100)}%
                </span>
              ))}
              <span className="ml-auto text-[11px] text-gray-400 font-mono">
                C = {Math.round(normalizedWeights.rule * 100)}%·Rule + {Math.round(normalizedWeights.dict * 100)}%·Dict + {Math.round(normalizedWeights.ml * 100)}%·ML
              </span>
            </div>
          </div>
        </div>

        {/* 综合置信度阈值 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-800">综合置信度阈值</div>
            <div className={`text-xl font-bold tabular-nums ${thresholdColor}`}>{threshold}%</div>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <input type="range" min={0} max={100} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="flex-1 accent-blue-600" />
            <input type="number" min={0} max={100} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-20 text-center" />
          </div>
          {/* Threshold band visualization */}
          <div className="relative h-5 bg-gradient-to-r from-red-100 via-amber-100 to-green-100 rounded-full overflow-hidden mb-3">
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-700 transition-all"
              style={{ left: `${threshold}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <span className="text-[10px] text-red-500 font-medium">低</span>
              <span className="text-[10px] text-green-600 font-medium">高</span>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400 mb-4">综合置信度 C ≥ {threshold}% 自动采纳；否则进人工审核</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="text-xs font-medium text-green-700 mb-1">C ≥ {threshold}%</div>
              <div className="text-xs text-green-600">自动采纳，直接写入图谱</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-xs font-medium text-amber-700 mb-1">C &lt; {threshold}%</div>
              <div className="text-xs text-amber-600">进入人工审核队列</div>
            </div>
          </div>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Header + tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 pt-5 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">图谱构造</h1>
            <p className="text-sm text-gray-500 mt-0.5">只负责配置抽取策略并提交任务；执行、进度、候选预览统一在图谱任务完成。</p>
          </div>
          <button onClick={() => onNavigateTo?.('graph-tasks')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 transition-colors">
            查看图谱任务 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm border-b-2 -mb-px transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderTabContent()}
      </div>

      {/* Bottom submit bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3">
        {!configValid && (
          <div className="flex items-center gap-2 mb-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{configReason}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium flex items-center gap-1.5 ${configValid ? 'text-green-700' : 'text-gray-400'}`}>
              {configValid
                ? <><CheckCircle2 className="w-4 h-4" />配置完整，可以提交构造任务</>
                : '配置不完整'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{currentDS?.name}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{currentOnto.name}</span>
              {isStructured && selectedMappingId && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{MAPPINGS.find(m => m.id === selectedMappingId)?.name}</span>
              )}
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{checkedEntities.length} 类实体</span>
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{checkedRelations.length} 类关系</span>
              {totalRules > 0 && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{totalRules} 规则绑定</span>}
              {enabledRemote > 0 && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{enabledRemote} 远程服务</span>}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{syncMode}</span>
            </div>
          </div>
          <button onClick={handleReset}
            className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />重置配置
          </button>
          <button onClick={() => onNavigateTo?.('graph-tasks')}
            className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0">
            查看任务
          </button>
          <button onClick={handleSubmit} disabled={!configValid || submitting}
            title={!configValid ? configReason : undefined}
            className="text-sm px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium flex-shrink-0">
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中…</>
              : <><Play className="w-4 h-4" />提交构造任务</>}
          </button>
        </div>
      </div>
    </div>
  );
}
