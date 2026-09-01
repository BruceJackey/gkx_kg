import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Play, ShieldAlert } from 'lucide-react';

type PropType = 'string' | 'number' | 'date' | 'text';

interface Property {
  key: string;
  label: string;
  value: string;
  type: PropType;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: Property[];
}

interface Relation {
  id: string;
  sourceId: string;
  sourceName: string;
  relationType: string;
  targetId: string;
  targetName: string;
}

type OpKind = 'update_property' | 'add_entity' | 'delete_entity' | 'add_relation' | 'delete_relation';

interface ChangeRecord {
  id: string;
  op: OpKind;
  opLabel: string;
  at: string;
  before: unknown;
  after: unknown;
  process: string;
}

interface Issue {
  id: string;
  severity: 'error' | 'warning';
  ruleId: string;
  ruleName: string;
  message: string;
  relatedOpId: string;
}

const AVAILABLE_RULES = [
  { id: 'R001', name: '人物实体质量检测' },
  { id: 'R010', name: '必填属性非空约束' },
  { id: 'R012', name: '属性类型与取值范围' },
  { id: 'R020', name: '关系端点存在性' },
  { id: 'R021', name: '互斥关系冲突检测' },
];

const INITIAL_ENTITIES: Entity[] = [
  {
    id: 'E001',
    name: '李明',
    type: '人物',
    description: '知名人工智能研究员，专注于自然语言处理领域。',
    properties: [
      { key: 'birth_date', label: '出生日期', value: '1980-03-15', type: 'date' },
      { key: 'nationality', label: '国籍', value: '中国', type: 'string' },
      { key: 'affiliation', label: '所属机构', value: '清华大学', type: 'string' },
      { key: 'h_index', label: 'H指数', value: '42', type: 'number' },
    ],
  },
  {
    id: 'E002',
    name: '北京人工智能研究院',
    type: '组织',
    description: '专注于人工智能基础研究与应用开发的国家级科研机构。',
    properties: [
      { key: 'founded', label: '成立时间', value: '2018-04-23', type: 'date' },
      { key: 'location', label: '所在地', value: '北京市海淀区', type: 'string' },
      { key: 'employee_count', label: '员工人数', value: '1240', type: 'number' },
    ],
  },
  {
    id: 'E003',
    name: '深度学习',
    type: '概念',
    description: '机器学习的一个子领域，使用多层神经网络进行表示学习。',
    properties: [
      { key: 'coined_year', label: '提出年份', value: '2006', type: 'number' },
      { key: 'parent_concept', label: '上位概念', value: '机器学习', type: 'string' },
    ],
  },
];

const INITIAL_RELATIONS: Relation[] = [
  {
    id: 'R1',
    sourceId: 'E001',
    sourceName: '李明',
    relationType: '就职于',
    targetId: 'E002',
    targetName: '北京人工智能研究院',
  },
];

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * 审计目录专用：事实变更监听
 * 复用属性管理式增删改，将原数据 / 过程 / 最终数据送入规则引擎校验
 */
export default function FactChangeListening() {
  const [entities, setEntities] = useState<Entity[]>(() => clone(INITIAL_ENTITIES));
  const [relations, setRelations] = useState<Relation[]>(() => clone(INITIAL_RELATIONS));
  const [selectedId, setSelectedId] = useState('E001');
  const [changes, setChanges] = useState<ChangeRecord[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>(['R001', 'R010', 'R012']);
  const [running, setRunning] = useState(false);
  const [issues, setIssues] = useState<Issue[] | null>(null);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', type: '人物', description: '' });

  const [showAddRelation, setShowAddRelation] = useState(false);
  const [newRel, setNewRel] = useState({ sourceId: 'E001', relationType: '研究领域', targetId: 'E003' });

  const selected = useMemo(
    () => entities.find((e) => e.id === selectedId) ?? entities[0],
    [entities, selectedId],
  );

  const pushChange = (rec: Omit<ChangeRecord, 'id' | 'at'>) => {
    setChanges((prev) => [
      { ...rec, id: `chg_${Date.now()}_${prev.length}`, at: nowIso() },
      ...prev,
    ]);
    setIssues(null);
  };

  const toggleRule = (id: string) => {
    setSelectedRules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const startEdit = (p: Property) => {
    setEditingKey(p.key);
    setEditValue(p.value);
  };

  const saveEdit = () => {
    if (!selected || !editingKey) return;
    const prop = selected.properties.find((p) => p.key === editingKey);
    if (!prop) return;
    const before = clone(selected);
    const afterEntity: Entity = {
      ...selected,
      properties: selected.properties.map((p) =>
        p.key === editingKey ? { ...p, value: editValue } : p,
      ),
    };
    setEntities((list) => list.map((e) => (e.id === selected.id ? afterEntity : e)));
    pushChange({
      op: 'update_property',
      opLabel: `修改属性 ${prop.label}`,
      before,
      after: afterEntity,
      process: `实体 ${selected.name}(${selected.id}) 属性 ${prop.key}: "${prop.value}" → "${editValue}"`,
    });
    setEditingKey(null);
  };

  const addEntity = () => {
    if (!newEntity.name.trim()) return;
    const before = { entities: clone(entities) };
    const id = `E${String(entities.length + 1).padStart(3, '0')}`;
    const entity: Entity = {
      id,
      name: newEntity.name.trim(),
      type: newEntity.type,
      description: newEntity.description.trim() || '（无描述）',
      properties: [
        { key: 'created_at', label: '创建时间', value: new Date().toISOString().slice(0, 10), type: 'date' },
      ],
    };
    setEntities((list) => [entity, ...list]);
    setSelectedId(id);
    pushChange({
      op: 'add_entity',
      opLabel: `新增实体 ${entity.name}`,
      before,
      after: entity,
      process: `创建实体 ${entity.id} / ${entity.type} / ${entity.name}`,
    });
    setShowAddEntity(false);
    setNewEntity({ name: '', type: '人物', description: '' });
  };

  const deleteEntity = (id: string) => {
    const target = entities.find((e) => e.id === id);
    if (!target) return;
    const before = { entity: clone(target), relations: relations.filter((r) => r.sourceId === id || r.targetId === id) };
    setEntities((list) => list.filter((e) => e.id !== id));
    setRelations((list) => list.filter((r) => r.sourceId !== id && r.targetId !== id));
    if (selectedId === id) {
      const next = entities.find((e) => e.id !== id);
      setSelectedId(next?.id ?? '');
    }
    pushChange({
      op: 'delete_entity',
      opLabel: `删除实体 ${target.name}`,
      before,
      after: null,
      process: `删除实体 ${target.id}，级联移除相关关系 ${before.relations.length} 条`,
    });
  };

  const addRelation = () => {
    const source = entities.find((e) => e.id === newRel.sourceId);
    const target = entities.find((e) => e.id === newRel.targetId);
    if (!source || !target || !newRel.relationType.trim()) return;
    const before = { relations: clone(relations) };
    const rel: Relation = {
      id: `R${Date.now()}`,
      sourceId: source.id,
      sourceName: source.name,
      relationType: newRel.relationType.trim(),
      targetId: target.id,
      targetName: target.name,
    };
    setRelations((list) => [...list, rel]);
    pushChange({
      op: 'add_relation',
      opLabel: `新增关系 ${source.name}-${rel.relationType}-${target.name}`,
      before,
      after: rel,
      process: `断言关系 ${rel.sourceId} --${rel.relationType}→ ${rel.targetId}`,
    });
    setShowAddRelation(false);
  };

  const deleteRelation = (id: string) => {
    const rel = relations.find((r) => r.id === id);
    if (!rel) return;
    pushChange({
      op: 'delete_relation',
      opLabel: `删除关系 ${rel.sourceName}-${rel.relationType}-${rel.targetName}`,
      before: clone(rel),
      after: null,
      process: `收回关系 ${rel.id}`,
    });
    setRelations((list) => list.filter((r) => r.id !== id));
  };

  const runRuleCheck = () => {
    if (changes.length === 0 || selectedRules.length === 0) return;
    setRunning(true);
    setIssues(null);
    setTimeout(() => {
      const found: Issue[] = [];
      const latest = changes[0];
      const rules = AVAILABLE_RULES.filter((r) => selectedRules.includes(r.id));

      for (const rule of rules) {
        if (rule.id === 'R010' && latest.op === 'update_property') {
          const after = latest.after as Entity;
          const empty = after.properties?.find((p) => !String(p.value ?? '').trim());
          if (empty) {
            found.push({
              id: `iss_${found.length + 1}`,
              severity: 'error',
              ruleId: rule.id,
              ruleName: rule.name,
              message: `属性「${empty.label}」修改后为空，违反必填约束`,
              relatedOpId: latest.id,
            });
          }
        }
        if (rule.id === 'R012' && latest.op === 'update_property') {
          const after = latest.after as Entity;
          const h = after.properties?.find((p) => p.key === 'h_index');
          const n = h ? Number(h.value) : NaN;
          if (h && (Number.isNaN(n) || n < 0 || n > 200)) {
            found.push({
              id: `iss_${found.length + 1}`,
              severity: 'error',
              ruleId: rule.id,
              ruleName: rule.name,
              message: `H指数取值「${h.value}」超出合理范围 [0, 200]`,
              relatedOpId: latest.id,
            });
          }
          const year = after.properties?.find((p) => p.key === 'coined_year');
          const y = year ? Number(year.value) : NaN;
          if (year && (Number.isNaN(y) || y < 1900 || y > 2100)) {
            found.push({
              id: `iss_${found.length + 1}`,
              severity: 'warning',
              ruleId: rule.id,
              ruleName: rule.name,
              message: `提出年份「${year.value}」疑似异常`,
              relatedOpId: latest.id,
            });
          }
        }
        if (rule.id === 'R001' && (latest.op === 'add_entity' || latest.op === 'update_property')) {
          const ent = (latest.after as Entity) ?? null;
          if (ent?.type === '人物' && !ent.properties.some((p) => p.key === 'affiliation' && p.value)) {
            found.push({
              id: `iss_${found.length + 1}`,
              severity: 'warning',
              ruleId: rule.id,
              ruleName: rule.name,
              message: `人物实体「${ent.name}」缺少所属机构，建议补全`,
              relatedOpId: latest.id,
            });
          }
        }
        if (rule.id === 'R020' && latest.op === 'add_relation') {
          const rel = latest.after as Relation;
          const sOk = entities.some((e) => e.id === rel.sourceId);
          const tOk = entities.some((e) => e.id === rel.targetId);
          if (!sOk || !tOk) {
            found.push({
              id: `iss_${found.length + 1}`,
              severity: 'error',
              ruleId: rule.id,
              ruleName: rule.name,
              message: '关系端点实体不存在',
              relatedOpId: latest.id,
            });
          }
        }
        if (rule.id === 'R021' && latest.op === 'add_relation') {
          const rel = latest.after as Relation;
          const conflict = relations.some(
            (r) =>
              r.id !== rel.id &&
              r.sourceId === rel.sourceId &&
              r.targetId === rel.targetId &&
              r.relationType !== rel.relationType &&
              (r.relationType.includes('互斥') || rel.relationType === '对立于'),
          );
          if (rel.relationType === '对立于' && conflict) {
            found.push({
              id: `iss_${found.length + 1}`,
              severity: 'error',
              ruleId: rule.id,
              ruleName: rule.name,
              message: `关系「${rel.relationType}」与已有关系冲突`,
              relatedOpId: latest.id,
            });
          }
        }
      }

      // 演示：若用户把 H 指数改成异常值会检出；否则给出一次“通过”示意
      if (found.length === 0 && latest.op === 'delete_entity' && selectedRules.includes('R020')) {
        found.push({
          id: 'iss_orphan',
          severity: 'warning',
          ruleId: 'R020',
          ruleName: '关系端点存在性',
          message: '删除实体后已级联清理关系；请确认下游引用无残留',
          relatedOpId: latest.id,
        });
      }

      setIssues(found);
      setRunning(false);
    }, 700);
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden p-6">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">事实变更监听</h1>
          <p className="text-sm text-gray-500">
            对属性管理式增删改进行监听，将原数据、操作过程与最终数据送入规则引擎，判断本次修改是否存在问题
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[280px_1fr_340px] gap-4">
        {/* 实体列表 */}
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">实体</span>
            <button
              type="button"
              onClick={() => setShowAddEntity(true)}
              className="text-xs inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" /> 新增
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {entities.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm ${
                    selected?.id === e.id ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="font-medium">{e.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {e.id} · {e.type}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 属性 / 关系 CRUD */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-y-auto p-4 space-y-4">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg text-gray-900">{selected.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">{selected.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteEntity(selected.id)}
                  className="text-xs inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 删除实体
                </button>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">属性（改）</div>
                <ul className="border border-gray-200 rounded-lg divide-y overflow-hidden">
                  {selected.properties.map((p) => (
                    <li key={p.key} className="px-3 py-2.5 flex items-center gap-2 text-sm bg-white">
                      <div className="w-28 text-xs text-gray-500 flex-shrink-0">{p.label}</div>
                      {editingKey === p.key ? (
                        <>
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
                          />
                          <button type="button" onClick={saveEdit} className="text-xs text-blue-600">
                            保存
                          </button>
                          <button type="button" onClick={() => setEditingKey(null)} className="text-xs text-gray-500">
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 text-gray-800">{p.value || <span className="text-gray-300">空</span>}</div>
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="text-gray-400 hover:text-blue-600"
                            title="编辑"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-gray-500">关系（增 / 删）</div>
                  <button
                    type="button"
                    onClick={() => setShowAddRelation(true)}
                    className="text-xs inline-flex items-center gap-1 text-blue-600"
                  >
                    <Plus className="w-3.5 h-3.5" /> 新增关系
                  </button>
                </div>
                <ul className="border border-gray-200 rounded-lg divide-y overflow-hidden">
                  {relations
                    .filter((r) => r.sourceId === selected.id || r.targetId === selected.id)
                    .map((r) => (
                      <li key={r.id} className="px-3 py-2.5 flex items-center gap-2 text-sm">
                        <span className="flex-1 text-gray-700">
                          {r.sourceName} <span className="text-blue-600">—{r.relationType}→</span> {r.targetName}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteRelation(r.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  {relations.filter((r) => r.sourceId === selected.id || r.targetId === selected.id).length === 0 && (
                    <li className="px-3 py-3 text-xs text-gray-400">暂无相关关系</li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">请先新增实体</p>
          )}

          {showAddEntity && (
            <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-3 space-y-2">
              <div className="text-xs font-medium text-gray-700">新增实体</div>
              <input
                placeholder="名称"
                value={newEntity.name}
                onChange={(e) => setNewEntity((s) => ({ ...s, name: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
              <select
                value={newEntity.type}
                onChange={(e) => setNewEntity((s) => ({ ...s, type: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              >
                {['人物', '组织', '概念', '技术', '地点', '事件'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <textarea
                placeholder="描述"
                value={newEntity.description}
                onChange={(e) => setNewEntity((s) => ({ ...s, description: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button type="button" onClick={addEntity} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg">
                  确认新增
                </button>
                <button type="button" onClick={() => setShowAddEntity(false)} className="text-xs px-3 py-1.5 text-gray-600">
                  取消
                </button>
              </div>
            </div>
          )}

          {showAddRelation && (
            <div className="border border-blue-100 bg-blue-50/40 rounded-lg p-3 space-y-2">
              <div className="text-xs font-medium text-gray-700">新增关系</div>
              <select
                value={newRel.sourceId}
                onChange={(e) => setNewRel((s) => ({ ...s, sourceId: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              >
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    起点：{e.name}
                  </option>
                ))}
              </select>
              <input
                value={newRel.relationType}
                onChange={(e) => setNewRel((s) => ({ ...s, relationType: e.target.value }))}
                placeholder="关系类型"
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
              <select
                value={newRel.targetId}
                onChange={(e) => setNewRel((s) => ({ ...s, targetId: e.target.value }))}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              >
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    终点：{e.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={addRelation} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg">
                  确认新增
                </button>
                <button type="button" onClick={() => setShowAddRelation(false)} className="text-xs px-3 py-1.5 text-gray-600">
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 变更日志 + 规则校验 */}
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-600">
            变更记录 → 规则引擎
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div>
              <div className="text-[11px] text-gray-500 mb-1.5">配置校验规则</div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_RULES.map((rule) => {
                  const on = selectedRules.includes(rule.id);
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className={`text-[11px] px-2 py-1 rounded-md border ${
                        on ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {rule.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={runRuleCheck}
              disabled={running || changes.length === 0 || selectedRules.length === 0}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
            >
              <Play className="w-3.5 h-3.5" />
              {running ? '推理校验中…' : '送入推理内核校验最近变更'}
            </button>

            {issues && (
              <div className="border border-gray-100 rounded-lg p-2.5">
                <div className="text-[11px] font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  校验结果 · {issues.length} 个问题
                </div>
                {issues.length === 0 ? (
                  <p className="text-xs text-green-600">未发现问题，本次修改可通过</p>
                ) : (
                  <ul className="space-y-2">
                    {issues.map((iss) => (
                      <li
                        key={iss.id}
                        className={`text-xs rounded-md px-2 py-1.5 border ${
                          iss.severity === 'error'
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : 'bg-amber-50 border-amber-100 text-amber-800'
                        }`}
                      >
                        <div className="font-medium">{iss.ruleName}</div>
                        <div className="mt-0.5 opacity-90">{iss.message}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div>
              <div className="text-[11px] text-gray-500 mb-1.5">操作日志（原数据 / 过程 / 最终数据）</div>
              {changes.length === 0 ? (
                <p className="text-xs text-gray-400">尚无变更，请先在左侧进行增删改</p>
              ) : (
                <ul className="space-y-2">
                  {changes.map((c) => (
                    <li key={c.id} className="border border-gray-100 rounded-lg p-2 text-[11px]">
                      <div className="font-medium text-gray-800">{c.opLabel}</div>
                      <div className="text-gray-400 mt-0.5">{c.at}</div>
                      <div className="text-gray-600 mt-1">{c.process}</div>
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-blue-600">查看 before / after JSON</summary>
                        <pre className="mt-1 bg-gray-950 text-green-400 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-40">
                          {JSON.stringify({ before: c.before, after: c.after }, null, 2)}
                        </pre>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
