import { useState, useEffect, type DragEvent } from 'react';
import { Check, X, Tag, Link2, Highlighter, MousePointerClick, Trash2, Plus, GripVertical } from 'lucide-react';

type EntityType = '机构' | '作者' | '概念' | '论文';
type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'modified';

interface RecognitionItem {
  id: string;
  text: string;
  entityType: EntityType;
  sourceDoc: string;
  context: string;
  confidence: number;
  status: ReviewStatus;
  /** 已链接本体 ID */
  ontologyId: string | null;
  /** 同名消歧候选（≥2 才视为有歧义） */
  ontologyOptions: Array<{ id: string; label: string; ontology: string; desc: string }>;
}

const TYPE_COLORS: Record<EntityType, { bg: string; text: string; border: string; mark: string }> = {
  机构: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', mark: 'bg-blue-200 text-blue-900' },
  作者: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', mark: 'bg-violet-200 text-violet-900' },
  概念: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', mark: 'bg-emerald-200 text-emerald-900' },
  论文: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', mark: 'bg-amber-200 text-amber-900' },
};

const ENTITY_TYPES: EntityType[] = ['机构', '作者', '概念', '论文'];

/** 仅含有歧义（多个本体候选）的识别项 */
const INITIAL_ITEMS: RecognitionItem[] = [
  {
    id: 'rc1', text: '多伦多大学', entityType: '机构', sourceDoc: 'papers#2341',
    context: '作者Geoffrey Hinton就职于多伦多大学计算机系，长期从事深度学习研究。',
    confidence: 0.65, status: 'pending', ontologyId: null,
    ontologyOptions: [
      { id: 'onto:org/utoronto', label: 'University of Toronto', ontology: '机构本体', desc: '加拿大 · 综合大学' },
      { id: 'onto:org/toronto-metro', label: '多伦多都会大学', ontology: '机构本体', desc: '加拿大 · 应用型大学' },
    ],
  },
  {
    id: 'rc2', text: 'Yoshua Bengio', entityType: '作者', sourceDoc: 'authors#203',
    context: '与Hinton、Yoshua Bengio、LeCun共同获得图灵奖，推动深度学习发展。',
    confidence: 0.72, status: 'pending', ontologyId: null,
    ontologyOptions: [
      { id: 'onto:person/bengio-y', label: 'Yoshua Bengio', ontology: '人物本体', desc: 'MILA / 蒙特利尔大学' },
      { id: 'onto:person/bengio-s', label: 'Samy Bengio', ontology: '人物本体', desc: 'Apple ML Research' },
    ],
  },
  {
    id: 'rc7', text: '卷积神经网络', entityType: '概念', sourceDoc: 'papers#1892',
    context: 'CNN即卷积神经网络在图像识别领域的突破性应用，推动了计算机视觉发展。',
    confidence: 0.55, status: 'pending', ontologyId: null,
    ontologyOptions: [
      { id: 'onto:concept/cnn', label: '卷积神经网络 (CNN)', ontology: '概念本体', desc: '深度学习 · 视觉模型' },
      { id: 'onto:concept/conv-net', label: 'Convolutional Network', ontology: '概念本体', desc: '同义英文条目' },
    ],
  },
  {
    id: 'rc12', text: 'Facebook AI Research', entityType: '机构', sourceDoc: 'institutions#205',
    context: 'Facebook AI Research（现更名为Meta AI）在自监督学习方向发表多项成果。',
    confidence: 0.62, status: 'pending', ontologyId: null,
    ontologyOptions: [
      { id: 'onto:org/fair', label: 'FAIR / Meta AI', ontology: '机构本体', desc: '美国 · 工业实验室（已更名）' },
      { id: 'onto:org/fb-legacy', label: 'Facebook AI Research', ontology: '机构本体', desc: '历史名称条目' },
    ],
  },
];

function highlightContext(context: string, text: string, entityType: EntityType) {
  const idx = context.indexOf(text);
  const color = TYPE_COLORS[entityType];
  if (idx === -1) {
    return <span className="text-sm text-gray-700 leading-relaxed">{context}</span>;
  }
  return (
    <span className="text-sm text-gray-700 leading-relaxed">
      {context.slice(0, idx)}
      <mark className={`px-0.5 rounded ${color.mark} font-medium not-italic`}>{text}</mark>
      {context.slice(idx + text.length)}
    </span>
  );
}

export type RecognitionFocus = 'highlight' | 'review' | 'linking';

/**
 * 识别结果管理：仅展示有歧义项；拖拽至删除/新增区；实体链接到对应本体
 */
export function RecognitionResultManagementPanel({ initialFocus }: { initialFocus?: RecognitionFocus } = {}) {
  const [items, setItems] = useState<RecognitionItem[]>(INITIAL_ITEMS);
  const [selectedId, setSelectedId] = useState(INITIAL_ITEMS[0]?.id ?? '');
  const [dragOverZone, setDragOverZone] = useState<'delete' | 'add' | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!initialFocus) return;
    const id = initialFocus === 'highlight' ? 'recog-highlight' : initialFocus === 'review' ? 'recog-review' : 'recog-linking';
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [initialFocus]);

  // 仅有歧义（≥2 个本体候选）
  const ambiguousItems = items.filter((i) => i.ontologyOptions.length >= 2);
  const selected = ambiguousItems.find((i) => i.id === selectedId) ?? ambiguousItems[0];

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  const updateSelected = (patch: Partial<RecognitionItem>) => {
    if (!selected) return;
    setItems((prev) => prev.map((i) => (i.id === selected.id ? { ...i, ...patch } : i)));
  };

  const removeById = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      setSelectedId((cur) => {
        if (cur !== id) return cur;
        const rest = next.filter((i) => i.ontologyOptions.length >= 2);
        return rest[0]?.id ?? '';
      });
      return next;
    });
  };

  const handleDropOnDelete = (e: DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
    const id = e.dataTransfer.getData('text/entity-id');
    if (!id) return;
    const name = items.find((i) => i.id === id)?.text ?? id;
    removeById(id);
    flash(`已删除实体「${name}」`);
  };

  const handleDropOnAdd = (e: DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
    const sourceId = e.dataTransfer.getData('text/entity-id');
    const source = items.find((i) => i.id === sourceId);
    const id = `rc-new-${Date.now()}`;
    const neu: RecognitionItem = {
      id,
      text: source ? `${source.text}（副本）` : '新实体',
      entityType: source?.entityType ?? '概念',
      sourceDoc: source?.sourceDoc ?? selected?.sourceDoc ?? 'manual',
      context: source?.context ?? '（拖拽新增）请在原文中确认实体并链接到对应本体。',
      confidence: 0.5,
      status: 'modified',
      ontologyId: null,
      ontologyOptions: source?.ontologyOptions?.length
        ? source.ontologyOptions.map((o) => ({ ...o }))
        : [
            { id: 'onto:concept/new-a', label: '候选本体 A', ontology: '概念本体', desc: '待消歧' },
            { id: 'onto:concept/new-b', label: '候选本体 B', ontology: '概念本体', desc: '待消歧' },
          ],
    };
    setItems((prev) => [...prev, neu]);
    setSelectedId(id);
    flash(`已新增实体「${neu.text}」`);
  };

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
        暂无有歧义的识别结果
      </div>
    );
  }

  const color = TYPE_COLORS[selected.entityType];

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
      <p className="text-sm text-gray-500 flex-shrink-0">
        仅展示有歧义的识别项：原文高亮、拖拽增删、链接到对应本体完成消歧
      </p>

      {toast && (
        <div className="flex-shrink-0 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
          {toast}
        </div>
      )}

      <div id="recog-highlight" className="flex items-center gap-3 flex-wrap flex-shrink-0 text-xs">
        <span className="flex items-center gap-1 text-gray-500"><Highlighter className="w-3.5 h-3.5" />类别颜色</span>
        {ENTITY_TYPES.map((t) => (
          <span key={t} className={`px-2 py-0.5 rounded border ${TYPE_COLORS[t].bg} ${TYPE_COLORS[t].text} ${TYPE_COLORS[t].border}`}>
            {t}
          </span>
        ))}
        <span className="text-gray-400 ml-auto">有歧义 {ambiguousItems.length} 项</span>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        {/* List — 仅有歧义项，可拖拽 */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
            {ambiguousItems.map((item) => {
              const c = TYPE_COLORS[item.entityType];
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/entity-id', item.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors cursor-grab active:cursor-grabbing ${
                    item.id === selected.id ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 truncate">{item.text}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ${c.bg} ${c.text} ${c.border}`}>
                      {item.entityType}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 truncate pl-5">
                    {item.ontologyOptions.length} 个本体候选 · {(item.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* 拖拽落点：删除 / 新增 */}
          <div className="flex gap-2 flex-shrink-0 pt-1">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverZone('delete'); }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={handleDropOnDelete}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 border-dashed text-xs transition-colors ${
                dragOverZone === 'delete'
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-gray-200 text-gray-400 bg-gray-50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              拖到此处删除
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverZone('add'); }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={handleDropOnAdd}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 border-dashed text-xs transition-colors ${
                dragOverZone === 'add'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-400 bg-gray-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              拖到此处新增
            </div>
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Highlighter className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">结果可视化与高亮</span>
              <span className="text-[11px] text-gray-400 ml-auto">{selected.sourceDoc}</span>
            </div>
            <div className="p-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                {highlightContext(selected.context, selected.text, selected.entityType)}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ambiguousItems
                  .filter((i) => i.sourceDoc === selected.sourceDoc)
                  .map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setSelectedId(i.id)}
                      className={`text-[11px] px-2 py-0.5 rounded border ${TYPE_COLORS[i.entityType].bg} ${TYPE_COLORS[i.entityType].text} ${TYPE_COLORS[i.entityType].border} ${
                        i.id === selected.id ? 'ring-1 ring-blue-400' : ''
                      }`}
                    >
                      {i.text}
                    </button>
                  ))}
              </div>
            </div>
          </section>

          <section
            id="recog-review"
            className={`bg-white border rounded-xl overflow-hidden ${initialFocus === 'review' ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}
          >
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <MousePointerClick className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-gray-800">人工审核与修正界面</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 mb-1 block">实体文本</label>
                  <input
                    value={selected.text}
                    onChange={(e) => updateSelected({ text: e.target.value, status: 'modified' })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">将左侧列表项拖到「删除」或「新增」区域进行增删</p>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 mb-1 block">分类</label>
                  <select
                    value={selected.entityType}
                    onChange={(e) => updateSelected({ entityType: e.target.value as EntityType, status: 'modified' })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                  >
                    {ENTITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSelected({ status: 'approved' })}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check className="w-3.5 h-3.5" />确认
                </button>
                <button
                  type="button"
                  onClick={() => updateSelected({ status: 'rejected' })}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <X className="w-3.5 h-3.5" />拒绝
                </button>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                  {selected.status === 'pending' ? '待审核' : selected.status === 'approved' ? '已确认' : selected.status === 'rejected' ? '已拒绝' : '已修正'}
                </span>
              </div>
            </div>
          </section>

          <section
            id="recog-linking"
            className={`bg-white border rounded-xl overflow-hidden ${initialFocus === 'linking' ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}
          >
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
              <Link2 className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-gray-800">实体链接与消歧</span>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-xs text-gray-500">
                已链接本体：
                {selected.ontologyId ? (
                  <code className="ml-1 text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded">{selected.ontologyId}</code>
                ) : (
                  <span className="ml-1 text-amber-600">未选择（请从候选中链接）</span>
                )}
              </div>
              {selected.ontologyOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateSelected({
                    ontologyId: opt.id,
                    status: selected.status === 'pending' ? 'modified' : selected.status,
                  })}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    selected.ontologyId === opt.id ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {opt.ontology}
                    </span>
                    <code className="text-[10px] text-gray-400 ml-auto">{opt.id}</code>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 ml-5">{opt.desc}</p>
                </button>
              ))}
              {selected.ontologyId && (
                <button
                  type="button"
                  onClick={() => updateSelected({ ontologyId: null })}
                  className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  取消链接
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function RecognitionResultManagement({ initialFocus }: { initialFocus?: RecognitionFocus }) {
  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">识别结果管理</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          人机协同界面：对实体识别与分类的自动化结果进行审核、修正和确认
        </p>
      </div>
      <RecognitionResultManagementPanel initialFocus={initialFocus} />
    </div>
  );
}
