import { useState, useRef, useEffect, useReducer } from 'react';
import { Plus, Trash2, Edit2, Info, List, Workflow } from 'lucide-react';

interface PropMapping { ontoAttr: string; sourceField: string; transform: string; defaultValue: string; required: boolean; }
interface EntityMapping { id: string; ontoEntity: string; sourceTable: string; idField: string; propMappings: PropMapping[]; enabled: boolean; }
interface RelationMappingRow { id: string; ontoRelation: string; sourceTable: string; fromField: string; toField: string; typeField: string; enabled: boolean; }
interface MappingTemplate { id: string; name: string; ontologyId: string; datasourceId: string; entityMappings: EntityMapping[]; relationMappings: RelationMappingRow[]; savedAt: string; }

const ONTOLOGIES = [
  { id: 'o1', name: '科技论文知识图谱本体' },
  { id: 'o2', name: '新能源产业图谱本体' },
];

const DATASOURCES = [
  { id: 's1', name: '科研文献数据库', type: 'structured' },
  { id: 'u1', name: '研究文档存储', type: 'unstructured' },
];

const TABLE_NAMES = ['papers', 'authors', 'institutions'];
const PAPER_FIELDS = ['id', 'title', 'abstract', 'pub_year', 'doi'];
const AUTHOR_FIELDS = ['id', 'name', 'orcid', 'email', 'inst_id'];
const INST_FIELDS = ['id', 'name', 'country', 'city', 'type'];
const ALL_FIELDS = ['id', 'title', 'abstract', 'pub_year', 'doi', 'name', 'orcid', 'email', 'inst_id', 'country', 'city', 'type'];

const TRANSFORMS = ['直接映射', '大写', '小写', '格式化日期', 'JSON解析'];

const SOURCE_SCHEMA: Record<string, { fields: string[]; color: string; label: string }> = {
  papers:       { fields: ['id', 'title', 'abstract', 'pub_year', 'doi'], color: '#6366f1', label: 'papers' },
  authors:      { fields: ['id', 'name', 'orcid', 'email', 'inst_id'],   color: '#0ea5e9', label: 'authors' },
  institutions: { fields: ['id', 'name', 'country', 'city', 'type'],     color: '#10b981', label: 'institutions' },
};

const ENTITY_COLORS: Record<string, string> = {
  '论文': '#f59e0b',
  '作者': '#ef4444',
  '机构': '#8b5cf6',
};

const MOCK_TEMPLATES: MappingTemplate[] = [{
  id: 't1', name: '科研文献字段映射', ontologyId: 'o1', datasourceId: 's1', savedAt: '2024-03-15 14:00',
  entityMappings: [
    {
      id: 'em1', ontoEntity: '论文', sourceTable: 'papers', idField: 'id', enabled: true,
      propMappings: [
        { ontoAttr: '标题',    sourceField: 'title',    transform: '直接映射', defaultValue: '', required: true  },
        { ontoAttr: '摘要',    sourceField: 'abstract', transform: '直接映射', defaultValue: '', required: false },
        { ontoAttr: '发表年份', sourceField: 'pub_year', transform: '直接映射', defaultValue: '', required: true  },
        { ontoAttr: 'DOI',    sourceField: 'doi',      transform: '直接映射', defaultValue: '', required: false },
        { ontoAttr: '论文ID',  sourceField: 'id',       transform: '直接映射', defaultValue: '', required: true  },
      ],
    },
    {
      id: 'em2', ontoEntity: '作者', sourceTable: 'authors', idField: 'id', enabled: true,
      propMappings: [
        { ontoAttr: '姓名',  sourceField: 'name',  transform: '直接映射', defaultValue: '', required: true  },
        { ontoAttr: 'ORCID', sourceField: 'orcid', transform: '直接映射', defaultValue: '', required: false },
        { ontoAttr: '邮箱',  sourceField: 'email', transform: '小写',    defaultValue: '', required: false },
        { ontoAttr: '作者ID', sourceField: 'id',   transform: '直接映射', defaultValue: '', required: true  },
      ],
    },
    {
      id: 'em3', ontoEntity: '机构', sourceTable: 'institutions', idField: 'id', enabled: true,
      propMappings: [
        { ontoAttr: '机构名称', sourceField: 'name',    transform: '直接映射', defaultValue: '', required: true  },
        { ontoAttr: '国家',    sourceField: 'country', transform: '直接映射', defaultValue: '', required: false },
        { ontoAttr: '城市',    sourceField: 'city',    transform: '直接映射', defaultValue: '', required: false },
        { ontoAttr: '机构ID',  sourceField: 'id',      transform: '直接映射', defaultValue: '', required: true  },
      ],
    },
  ],
  relationMappings: [
    { id: 'rm1', ontoRelation: 'WRITTEN_BY',     sourceTable: 'papers',  fromField: 'id', toField: 'author_id', typeField: '', enabled: true },
    { id: 'rm2', ontoRelation: 'AFFILIATED_WITH', sourceTable: 'authors', fromField: 'id', toField: 'inst_id',   typeField: '', enabled: true },
  ],
}];

function getFieldsForTable(table: string): string[] {
  if (table === 'papers') return PAPER_FIELDS;
  if (table === 'authors') return AUTHOR_FIELDS;
  if (table === 'institutions') return INST_FIELDS;
  return ALL_FIELDS;
}

// ─── bezier helper ──────────────────────────────────────────────────────────

function cubicBez(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1) * 0.55;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// ─── List-mode entity card ───────────────────────────────────────────────────

function EntityMappingCard({ mapping, onUpdate }: { mapping: EntityMapping; onUpdate: (m: EntityMapping) => void }) {
  const [expanded, setExpanded] = useState(true);
  const fields = getFieldsForTable(mapping.sourceTable);

  const updateProp = (idx: number, p: PropMapping) => {
    const propMappings = [...mapping.propMappings];
    propMappings[idx] = p;
    onUpdate({ ...mapping, propMappings });
  };

  const deleteProp = (idx: number) => onUpdate({ ...mapping, propMappings: mapping.propMappings.filter((_, i) => i !== idx) });

  const addProp = () => onUpdate({ ...mapping, propMappings: [...mapping.propMappings, { ontoAttr: '新属性', sourceField: '', transform: '直接映射', defaultValue: '', required: false }] });

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{mapping.ontoEntity}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">来源表</span>
            <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
              value={mapping.sourceTable} onChange={e => onUpdate({ ...mapping, sourceTable: e.target.value, idField: '' })}>
              <option value="">暂不映射</option>
              {TABLE_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {mapping.sourceTable && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">ID字段</span>
              <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
                value={mapping.idField} onChange={e => onUpdate({ ...mapping, idField: e.target.value })}>
                <option value="">选择字段</option>
                {fields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <div onClick={() => onUpdate({ ...mapping, enabled: !mapping.enabled })}
            className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${mapping.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
            <div className="w-3 h-3 bg-white rounded-full mt-0.5 transition-all" style={{ marginLeft: mapping.enabled ? '18px' : '2px' }} />
          </div>
          启用
        </label>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-400 hover:text-gray-600">
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      {expanded && (
        <div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">本体属性</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">来源字段</th>
                <th id="mapping-attr-normalize" className="text-left text-xs font-medium text-gray-500 px-4 py-3">属性值标准化与清洗</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">默认值</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">必填</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mapping.propMappings.map((pm, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm text-gray-700">{pm.ontoAttr}</td>
                  <td className="px-4 py-2">
                    <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
                      value={pm.sourceField} onChange={e => updateProp(i, { ...pm, sourceField: e.target.value })}>
                      <option value="">暂不映射</option>
                      {fields.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
                      value={pm.transform} onChange={e => updateProp(i, { ...pm, transform: e.target.value })}>
                      {TRANSFORMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-400 w-24"
                      value={pm.defaultValue} onChange={e => updateProp(i, { ...pm, defaultValue: e.target.value })} placeholder="可选" />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input type="checkbox" checked={pm.required} onChange={e => updateProp(i, { ...pm, required: e.target.checked })} />
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => deleteProp(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100">
            <button onClick={addProp} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Plus size={12} /> 属性映射
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visual canvas ───────────────────────────────────────────────────────────

interface VisConn {
  id: string;
  sourcePort: string;
  targetPort: string;
  transform: string;
  color: string;
}

function VisualMappingCanvas({ template, onUpdate }: { template: MappingTemplate; onUpdate: (t: MappingTemplate) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, sourcePort: '', startX: 0, startY: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredConn, setHoveredConn] = useState<string | null>(null);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // derive connections from entityMappings
  const connections: VisConn[] = template.entityMappings.flatMap(em =>
    em.propMappings
      .filter(pm => pm.sourceField && em.sourceTable)
      .map(pm => ({
        id: `${em.ontoEntity}::${pm.ontoAttr}`,
        sourcePort: `${em.sourceTable}.${pm.sourceField}`,
        targetPort: `${em.ontoEntity}.${pm.ontoAttr}`,
        transform: pm.transform,
        color: SOURCE_SCHEMA[em.sourceTable]?.color || '#64748b',
      }))
  );

  const ontoEntities = template.entityMappings.map(em => ({
    entity: em.ontoEntity,
    color: ENTITY_COLORS[em.ontoEntity] || '#64748b',
    props: em.propMappings.map(pm => pm.ontoAttr),
  }));

  const getPortPos = (sel: string) => {
    const container = containerRef.current;
    if (!container) return null;
    const el = container.querySelector(sel) as HTMLElement | null;
    if (!el) return null;
    const er = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    return { x: er.left + er.width / 2 - cr.left, y: er.top + er.height / 2 - cr.top };
  };

  // recompute connection positions on panel scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const panels = container.querySelectorAll('.vis-scroll');
    const handler = () => forceUpdate();
    panels.forEach(p => p.addEventListener('scroll', handler));
    return () => panels.forEach(p => p.removeEventListener('scroll', handler));
  }, []);

  // cancel drag on window mouseup
  useEffect(() => {
    const handler = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, []);

  const handleSrcDown = (portId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getPortPos(`[data-sp="${portId}"]`);
    const cr = containerRef.current?.getBoundingClientRect();
    if (!pos || !cr) return;
    dragRef.current = { active: true, sourcePort: portId, startX: pos.x, startY: pos.y };
    setIsDragging(true);
    setCursor({ x: e.clientX - cr.left, y: e.clientY - cr.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    const cr = containerRef.current?.getBoundingClientRect();
    if (!cr) return;
    setCursor({ x: e.clientX - cr.left, y: e.clientY - cr.top });
  };

  const handleTgtUp = (portId: string) => {
    if (!dragRef.current.active) return;
    const parts = dragRef.current.sourcePort.split('.');
    const table = parts[0];
    const field = parts[1];
    const tparts = portId.split('.');
    const entity = tparts[0];
    const attr = tparts[1];

    const entityMappings = template.entityMappings.map(em => {
      if (em.ontoEntity !== entity) return em;
      const pms = [...em.propMappings];
      const idx = pms.findIndex(p => p.ontoAttr === attr);
      if (idx >= 0) {
        pms[idx] = { ...pms[idx], sourceField: field };
      } else {
        pms.push({ ontoAttr: attr, sourceField: field, transform: '直接映射', defaultValue: '', required: false });
      }
      return { ...em, sourceTable: em.sourceTable || table, propMappings: pms };
    });

    onUpdate({ ...template, entityMappings });
    dragRef.current.active = false;
    setIsDragging(false);
  };

  const handleDelConn = (id: string) => {
    const parts = id.split('::');
    const entity = parts[0];
    const attr = parts[1];
    const entityMappings = template.entityMappings.map(em => {
      if (em.ontoEntity !== entity) return em;
      return {
        ...em,
        propMappings: em.propMappings.map(pm =>
          pm.ontoAttr === attr ? { ...pm, sourceField: '' } : pm
        ),
      };
    });
    onUpdate({ ...template, entityMappings });
  };

  const dragStartPos = isDragging ? getPortPos(`[data-sp="${dragRef.current.sourcePort}"]`) : null;
  const dragColor = isDragging
    ? (SOURCE_SCHEMA[dragRef.current.sourcePort?.split('.')[0]]?.color || '#6366f1')
    : '#6366f1';

  const totalMapped = connections.length;
  const totalAttrs = template.entityMappings.reduce((n, em) => n + em.propMappings.length, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden relative"
        style={{ cursor: isDragging ? 'crosshair' : 'default' }}
        onMouseMove={handleMouseMove}
      >
        {/* ── Source panel ─────────────────────────────────────── */}
        <div className="vis-scroll w-64 shrink-0 overflow-y-auto bg-white border-r border-slate-200" style={{ zIndex: 10, position: 'relative' }}>
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3" style={{ zIndex: 20 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">原始数据字段</p>
          </div>
          {Object.entries(SOURCE_SCHEMA).map(([table, { fields, color }]) => (
            <div key={table} className="border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50/80">
                <span className="w-2 h-2 rounded-[3px] shrink-0" style={{ background: color }} />
                <span className="text-[11px] font-bold font-mono text-slate-600">{table}</span>
                <span className="ml-auto text-[9px] text-slate-300 font-mono">{fields.length}F</span>
              </div>
              {fields.map(field => {
                const pid = `${table}.${field}`;
                const conn = connections.find(c => c.sourcePort === pid);
                return (
                  <div key={field} className="flex items-center gap-2 pl-5 pr-3 py-[6px] hover:bg-indigo-50/20 group transition-colors">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 transition-all"
                      style={{ background: conn ? color : '#e2e8f0' }}
                    />
                    <span className={`text-[11px] font-mono flex-1 min-w-0 truncate transition-colors ${conn ? 'text-slate-800' : 'text-slate-400'}`}>
                      {field}
                    </span>
                    {conn && (
                      <span className="text-[9px] text-slate-300 shrink-0 truncate max-w-[56px]">
                        {conn.targetPort.split('.')[1]}
                      </span>
                    )}
                    {/* source port dot */}
                    <div
                      data-sp={pid}
                      onMouseDown={e => handleSrcDown(pid, e)}
                      title={`拖拽映射 ${field}`}
                      className="w-3 h-3 rounded-full border-2 shrink-0 ml-1 cursor-crosshair transition-transform hover:scale-[1.6] group-hover:border-opacity-100"
                      style={{
                        borderColor: conn ? color : '#94a3b8',
                        background: conn ? color : 'white',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Middle canvas ────────────────────────────────────── */}
        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e8eef7 100%)' }}
        >
          {/* dot grid */}
          <svg className="absolute inset-0 w-full h-full" aria-hidden>
            <defs>
              <pattern id="vis-dotgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.9" fill="#94a3b8" opacity="0.28" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#vis-dotgrid)" />
          </svg>

          {!isDragging && totalMapped === 0 && (
            <div className="relative text-center select-none pointer-events-none z-10">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm border border-slate-100">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
                  <circle cx="6" cy="9"  r="2" fill="#6366f1" opacity="0.7" />
                  <circle cx="6" cy="16" r="2" fill="#0ea5e9" opacity="0.7" />
                  <circle cx="6" cy="23" r="2" fill="#10b981" opacity="0.7" />
                  <circle cx="22" cy="9"  r="2" fill="#f59e0b" opacity="0.7" />
                  <circle cx="22" cy="16" r="2" fill="#ef4444" opacity="0.7" />
                  <circle cx="22" cy="23" r="2" fill="#8b5cf6" opacity="0.7" />
                  <path d="M8 9 Q14 9 14 16 Q14 23 20 23" stroke="#94a3b8" strokeWidth="1" fill="none" strokeDasharray="2,2" />
                </svg>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">拖拽左侧字段端口连接到右侧本体属性</p>
              <p className="text-[10px] text-slate-300 mt-1">单击连线可删除映射关系</p>
            </div>
          )}

          {isDragging && (
            <div className="relative z-10 select-none pointer-events-none">
              <div className="text-[11px] text-indigo-500 bg-white/90 backdrop-blur-sm border border-indigo-100 px-3.5 py-1.5 rounded-full shadow-sm">
                松开到目标属性端口以建立映射
              </div>
            </div>
          )}
        </div>

        {/* ── Target panel ─────────────────────────────────────── */}
        <div className="vis-scroll w-64 shrink-0 overflow-y-auto bg-white border-l border-slate-200" style={{ zIndex: 10, position: 'relative' }}>
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3" style={{ zIndex: 20 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">目标本体属性</p>
          </div>
          {ontoEntities.map(({ entity, color, props }) => {
            const entityConns = connections.filter(c => c.targetPort.startsWith(`${entity}.`));
            return (
              <div key={entity} className="border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50/80">
                  <span className="w-2 h-2 rounded-[3px] shrink-0" style={{ background: color }} />
                  <span className="text-[11px] font-bold text-slate-600">{entity}</span>
                  <span className="ml-auto text-[9px] font-mono" style={{ color: entityConns.length > 0 ? color : '#cbd5e1' }}>
                    {entityConns.length}/{props.length}
                  </span>
                </div>
                {props.map(prop => {
                  const pid = `${entity}.${prop}`;
                  const conn = connections.find(c => c.targetPort === pid);
                  return (
                    <div
                      key={prop}
                      className="flex items-center gap-2 pl-3 pr-5 py-[6px] hover:bg-amber-50/20 group transition-colors"
                      style={{ cursor: isDragging ? 'crosshair' : 'default' }}
                      onMouseUp={() => handleTgtUp(pid)}
                    >
                      {/* target port dot */}
                      <div
                        data-tp={pid}
                        className="w-3 h-3 rounded-full border-2 shrink-0 transition-transform group-hover:scale-[1.6]"
                        style={{
                          borderColor: conn ? conn.color : (isDragging ? '#6366f1' : '#94a3b8'),
                          background: conn ? conn.color : 'white',
                          boxShadow: isDragging && !conn ? '0 0 0 2px rgba(99,102,241,0.15)' : undefined,
                        }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: conn ? conn.color : '#e2e8f0' }}
                      />
                      <span className={`text-[11px] flex-1 min-w-0 truncate transition-colors ${conn ? 'text-slate-800' : 'text-slate-400'}`}>
                        {prop}
                      </span>
                      {conn && (
                        <span className="text-[9px] text-slate-300 shrink-0 truncate max-w-[56px]">
                          {conn.sourcePort.split('.')[1]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── SVG connection overlay (rendered last → on top) ─── */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
          aria-hidden
        >
          {/* existing connections */}
          {connections.map(conn => {
            const from = getPortPos(`[data-sp="${conn.sourcePort}"]`);
            const to   = getPortPos(`[data-tp="${conn.targetPort}"]`);
            if (!from || !to) return null;
            const hov = hoveredConn === conn.id;
            const mx  = (from.x + to.x) / 2;
            const my  = (from.y + to.y) / 2;
            const d   = cubicBez(from.x, from.y, to.x, to.y);
            return (
              <g key={conn.id} style={{ pointerEvents: 'all' }}
                onMouseEnter={() => setHoveredConn(conn.id)}
                onMouseLeave={() => setHoveredConn(null)}>
                {/* fat transparent hit area */}
                <path d={d} fill="none" stroke="transparent" strokeWidth="16"
                  style={{ cursor: 'pointer' }} onClick={() => handleDelConn(conn.id)} />
                {/* glow on hover */}
                {hov && <path d={d} fill="none" stroke={conn.color} strokeWidth="8" opacity="0.12" />}
                {/* main path */}
                <path
                  d={d}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth={hov ? 2 : 1.5}
                  opacity={hov ? 0.95 : 0.5}
                  strokeDasharray={conn.transform !== '直接映射' ? '5,3' : undefined}
                  style={{ transition: 'opacity 0.15s, stroke-width 0.15s' }}
                />
                {/* delete button */}
                {hov && (
                  <g transform={`translate(${mx},${my})`} style={{ cursor: 'pointer' }}
                    onClick={() => handleDelConn(conn.id)}>
                    <circle r="9" fill="white" stroke={conn.color} strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fill={conn.color}
                      fontSize="13" fontWeight="700" style={{ userSelect: 'none' }}>×</text>
                  </g>
                )}
                {/* transform badge */}
                {conn.transform !== '直接映射' && (
                  <text x={mx} y={my - 15} textAnchor="middle"
                    fill={conn.color} fontSize="9" fontFamily="'JetBrains Mono', monospace" opacity="0.75">
                    {conn.transform}
                  </text>
                )}
              </g>
            );
          })}

          {/* live drag preview */}
          {isDragging && dragStartPos && (
            <g>
              <path
                d={cubicBez(dragStartPos.x, dragStartPos.y, cursor.x, cursor.y)}
                fill="none" stroke={dragColor} strokeWidth="2" strokeDasharray="6,3" opacity="0.75"
              />
              <circle cx={dragStartPos.x} cy={dragStartPos.y} r="4" fill={dragColor} opacity="0.8" />
              <circle cx={cursor.x} cy={cursor.y} r="5" fill={dragColor} opacity="0.35" />
              <circle cx={cursor.x} cy={cursor.y} r="9" fill={dragColor} opacity="0.1" />
            </g>
          )}
        </svg>
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 py-2 flex items-center gap-5 text-[10px] text-slate-400">
        {/* legend */}
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-5 border-t border-slate-300" />
          <span>直接映射</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-5 border-t border-dashed border-slate-400" />
          <span>转换映射</span>
        </div>
        <div className="flex items-center gap-3 ml-2">
          {Object.entries(SOURCE_SCHEMA).map(([table, { color }]) => (
            <span key={table} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-[2px] inline-block" style={{ background: color }} />
              {table}
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-slate-500 font-medium">{totalMapped}</span>
        <span>/ {totalAttrs} 属性已映射</span>
        <span className="text-slate-200">|</span>
        <span>拖拽端口建立连接 · 悬停连线删除</span>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function MappingManagement({
  focusNormalize,
  initialViewMode,
}: {
  focusNormalize?: boolean;
  initialViewMode?: 'list' | 'visual';
} = {}) {
  const [templates, setTemplates] = useState<MappingTemplate[]>(MOCK_TEMPLATES);
  const [selectedId, setSelectedId] = useState('t1');
  const [activeTab, setActiveTab] = useState<'entity' | 'relation'>('entity');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOntoId, setNewOntoId] = useState('o1');
  const [newDsId, setNewDsId] = useState('s1');
  const [viewMode, setViewMode] = useState<'list' | 'visual'>(initialViewMode ?? 'list');

  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => {
    if (!focusNormalize) return;
    setViewMode('list');
    setActiveTab('entity');
    const timer = window.setTimeout(() => {
      document.getElementById('mapping-attr-normalize')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [focusNormalize]);

  const current = templates.find(t => t.id === selectedId) || templates[0];
  const currentDS = DATASOURCES.find(d => d.id === current?.datasourceId);
  const isUnstructured = currentDS?.type === 'unstructured';

  const updateCurrent = (t: MappingTemplate) => setTemplates(prev => prev.map(x => x.id === t.id ? t : x));

  const updateEntityMapping = (idx: number, em: EntityMapping) => {
    const entityMappings = [...current.entityMappings];
    entityMappings[idx] = em;
    updateCurrent({ ...current, entityMappings });
  };

  const toggleRelation = (idx: number) => {
    const relationMappings = [...current.relationMappings];
    relationMappings[idx] = { ...relationMappings[idx], enabled: !relationMappings[idx].enabled };
    updateCurrent({ ...current, relationMappings });
  };

  const deleteRelation = (idx: number) => updateCurrent({ ...current, relationMappings: current.relationMappings.filter((_, i) => i !== idx) });

  const handleCreate = () => {
    const id = 't_' + Date.now();
    const t: MappingTemplate = { id, name: newName, ontologyId: newOntoId, datasourceId: newDsId, entityMappings: [], relationMappings: [], savedAt: '-' };
    setTemplates(prev => [...prev, t]);
    setSelectedId(id);
    setShowNewModal(false);
    setNewName('');
  };

  const handleDelete = () => {
    setTemplates(prev => prev.filter(t => t.id !== selectedId));
    setSelectedId(templates.find(t => t.id !== selectedId)?.id || '');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="mr-1">
          <div className="text-sm font-semibold text-gray-900">映射配置解析与保存</div>
          <div className="text-[11px] text-gray-400">解析可视化映射规则并保存为可执行配置</div>
        </div>
        <input
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 w-44"
          value={current?.name || ''}
          onChange={e => updateCurrent({ ...current, name: e.target.value })}
          placeholder="映射模板名称"
        />
        <label className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-500 whitespace-nowrap">本体</span>
          <select className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
            value={current?.ontologyId || ''} onChange={e => updateCurrent({ ...current, ontologyId: e.target.value })}>
            {ONTOLOGIES.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <select className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white"
          value={current?.datasourceId || ''} onChange={e => updateCurrent({ ...current, datasourceId: e.target.value })}>
          {DATASOURCES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <div className="flex-1" />

        {/* view mode toggle */}
        <div className="flex gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-gray-50 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List size={12} /> 批量实体链接
          </button>
          <button
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all ${viewMode === 'visual' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Workflow size={12} /> 可视化映射规则配置
          </button>
        </div>

        <button id="mapping-config-save" className="text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shrink-0">
          保存映射配置
        </button>
        <button onClick={() => setShowNewModal(true)}
          className="text-sm px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0">
          <Plus size={13} /> 新建
        </button>
        <button onClick={handleDelete}
          className="text-sm px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0">
          <Trash2 size={13} /> 删除
        </button>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      {isUnstructured ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 flex items-start gap-3 max-w-lg">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">当前数据源为非结构化文档，无需配置字段映射，可直接进入图谱构造。</p>
          </div>
        </div>
      ) : viewMode === 'visual' ? (
        <VisualMappingCanvas template={current} onUpdate={updateCurrent} />
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* tabs */}
          <div className="flex-shrink-0 px-6 pt-4 border-b border-gray-200 bg-white">
            <div className="flex gap-1">
              <button onClick={() => setActiveTab('entity')}
                className={`text-sm px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'entity' ? 'bg-white border border-b-white border-gray-200 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                实体映射 <span className="text-xs text-gray-400 ml-1">({current?.entityMappings.length})</span>
              </button>
              <button onClick={() => setActiveTab('relation')}
                className={`text-sm px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'relation' ? 'bg-white border border-b-white border-gray-200 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                关系映射 <span className="text-xs text-gray-400 ml-1">({current?.relationMappings.length})</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'entity' && (
              <div className="space-y-4">
                {current?.entityMappings.map((em, i) => (
                  <EntityMappingCard key={em.id} mapping={em} onUpdate={nem => updateEntityMapping(i, nem)} />
                ))}
              </div>
            )}

            {activeTab === 'relation' && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">本体关系</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">来源表</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">起点字段</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">终点字段</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">类型字段</th>
                      <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">启用</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {current?.relationMappings.map((rm, i) => (
                      <tr key={rm.id}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{rm.ontoRelation}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rm.sourceTable}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rm.fromField}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rm.toField}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{rm.typeField || '—'}</td>
                        <td className="px-4 py-3">
                          <div onClick={() => toggleRelation(i)}
                            className={`w-8 h-4 rounded-full cursor-pointer transition-colors ${rm.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                            <div className="w-3 h-3 bg-white rounded-full mt-0.5 transition-all"
                              style={{ marginLeft: rm.enabled ? '18px' : '2px' }} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 size={13} /></button>
                            <button onClick={() => deleteRelation(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── New template modal ───────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <div className="text-sm font-semibold text-gray-800 mb-4">新建映射模板</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1.5">模板名称</div>
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 w-full"
                  value={newName} onChange={e => setNewName(e.target.value)} placeholder="请输入名称" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">本体</div>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full"
                  value={newOntoId} onChange={e => setNewOntoId(e.target.value)}>
                  {ONTOLOGIES.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">数据源</div>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white w-full"
                  value={newDsId} onChange={e => setNewDsId(e.target.value)}>
                  {DATASOURCES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowNewModal(false)}
                className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                取消
              </button>
              <button onClick={handleCreate} disabled={!newName}
                className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
