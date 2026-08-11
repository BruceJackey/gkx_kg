import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, RotateCw,
  MousePointer2, Highlighter, StickyNote, Square, Circle, PenLine,
  Type, Bookmark, List, MessageSquare, Languages,
  FlaskConical, Send, Bot, User, Loader2, X, Underline,
  LayoutTemplate, Columns, Download,
  PanelLeftOpen, PanelRightOpen, Star, FileText, Sparkles,
  AlertCircle, ExternalLink, Tag
} from 'lucide-react';
import NoteGenerationDialog from './NoteGenerationDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = 'select' | 'highlight' | 'underline' | 'note' | 'rect' | 'circle' | 'draw' | 'text';
type AnnotationType = 'highlight' | 'underline' | 'note' | 'rect' | 'circle';
type EntityType = 'person' | 'organization' | 'dataset' | 'method' | 'concept' | 'venue';

interface Annotation {
  id: string; paraId: string; type: AnnotationType;
  color: string; note?: string; page: number;
}
interface Bookmark_ { id: string; page: number; title: string; createdAt: string; }
interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; }
interface KBEntity {
  id: string; name: string; type: EntityType;
  description: string; properties: { label: string; value: string }[];
}

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Entity Database ───────────────────────────────────────────────────────────

const ENTITY_DB: Record<string, KBEntity> = {
  kge: {
    id: 'kge', name: '知识图谱嵌入 (KGE)', type: 'concept',
    description: '将知识图谱中的实体和关系映射到低维连续向量空间的技术，是知识图谱补全与链接预测任务的核心方法。',
    properties: [
      { label: '主要任务', value: '链接预测 / KGC' },
      { label: '代表方法', value: 'TransE, RotatE, CompGCN' },
      { label: '评估指标', value: 'MRR, Hits@N' },
      { label: '应用场景', value: '问答、推荐、信息抽取' },
    ],
  },
  tkgEmbed: {
    id: 'tkgEmbed', name: 'TKGEmbed', type: 'method',
    description: '本文提出的基于Transformer的KGE框架，通过多头自注意力聚合实体邻居上下文，结合关系感知位置编码与联合训练目标。',
    properties: [
      { label: 'FB15k-237 MRR', value: '0.383 (SOTA)' },
      { label: 'Hits@10', value: '0.567' },
      { label: '核心机制', value: '多头自注意力' },
      { label: '训练目标', value: 'Margin Loss + 对比正则' },
    ],
  },
  multiheadAttn: {
    id: 'multiheadAttn', name: '多头自注意力', type: 'concept',
    description: '将输入投影到多个子空间并分别计算注意力权重，最终拼接输出，使模型从不同角度捕捉语义依赖关系。',
    properties: [
      { label: '公式', value: 'softmax(QKᵀ/√dₖ)V' },
      { label: '参数', value: 'Q, K, V 投影矩阵' },
      { label: '时间复杂度', value: 'O(n²·d)' },
      { label: '常见头数', value: '8~16 头' },
    ],
  },
  transformer: {
    id: 'transformer', name: 'Transformer', type: 'concept',
    description: '基于自注意力机制的神经网络架构，由Vaswani等人2017年提出，已成为NLP及众多AI任务的基础范式。',
    properties: [
      { label: '发表', value: 'NeurIPS 2017' },
      { label: '作者', value: 'Vaswani et al.' },
      { label: '核心机制', value: '多头自注意力' },
      { label: '代表模型', value: 'BERT, GPT, T5, LLaMA' },
    ],
  },
  mrr: {
    id: 'mrr', name: 'Mean Reciprocal Rank (MRR)', type: 'concept',
    description: '排序质量指标，计算正确答案排名倒数的均值。值越接近1表示正确实体排名越靠前。',
    properties: [
      { label: '取值范围', value: '(0, 1]' },
      { label: '计算方式', value: '(1/Q) Σ 1/rankᵢ' },
      { label: '相关指标', value: 'Hits@1, Hits@3, Hits@10' },
      { label: '评估设置', value: 'Filtered Setting（标准）' },
    ],
  },
  transE: {
    id: 'transE', name: 'TransE', type: 'method',
    description: '基于平移的KGE方法，将关系建模为实体向量空间中的平移（h+r≈t），是最具影响力的基线方法之一。',
    properties: [
      { label: '发表', value: 'NeurIPS 2013' },
      { label: '作者', value: 'Bordes et al.' },
      { label: 'FB15k-237 MRR', value: '0.279' },
      { label: '引用量', value: '14,200+' },
    ],
  },
  rotateE: {
    id: 'rotateE', name: 'RotatE', type: 'method',
    description: '将关系建模为复数空间中的旋转，能有效处理对称、反对称、逆关系和组合关系等复杂关系模式。',
    properties: [
      { label: '发表', value: 'ICLR 2019' },
      { label: '作者', value: 'Sun et al.' },
      { label: 'FB15k-237 MRR', value: '0.338' },
      { label: '关系建模', value: '复数空间旋转' },
    ],
  },
  distMult: {
    id: 'distMult', name: 'DistMult', type: 'method',
    description: '双线性模型，通过实体向量逐元素乘积对三元组打分，结构简单高效，但仅能建模对称关系。',
    properties: [
      { label: '发表', value: 'ICLR 2015' },
      { label: '作者', value: 'Yang et al.' },
      { label: '评分函数', value: '逐元素积 <h,r,t>' },
      { label: '局限', value: '仅能建模对称关系' },
    ],
  },
  complexE: {
    id: 'complexE', name: 'ComplEx', type: 'method',
    description: '将DistMult扩展到复数域，通过复数向量的Hermitian点积处理非对称关系，保持参数高效性。',
    properties: [
      { label: '发表', value: 'ICML 2016' },
      { label: '作者', value: 'Trouillon et al.' },
      { label: '向量空间', value: '复数域 ℂᵈ' },
      { label: '改进', value: '建模非对称关系' },
    ],
  },
  compGCN: {
    id: 'compGCN', name: 'CompGCN', type: 'method',
    description: '基于图神经网络的KGE方法，通过图卷积联合嵌入实体与关系，支持跨三元组参数共享，但存在过平滑问题。',
    properties: [
      { label: '发表', value: 'ICLR 2020' },
      { label: '作者', value: 'Vashishth et al.' },
      { label: 'FB15k-237 MRR', value: '0.355' },
      { label: '核心机制', value: '图卷积 + 组合操作' },
    ],
  },
  fb15k237: {
    id: 'fb15k237', name: 'FB15k-237', type: 'dataset',
    description: 'Freebase的修正子集，KGC任务最常用的标准基准数据集，解决了原FB15k中测试集泄露问题。',
    properties: [
      { label: '实体数', value: '14,505' },
      { label: '关系数', value: '237' },
      { label: '训练三元组', value: '272,115' },
      { label: '来源', value: 'Freebase' },
    ],
  },
  wn18rr: {
    id: 'wn18rr', name: 'WN18RR', type: 'dataset',
    description: 'WordNet的修正子集，去除了逆关系导致的测试泄露，关系类别少，适合评估关系语义建模能力。',
    properties: [
      { label: '实体数', value: '40,943' },
      { label: '关系数', value: '11' },
      { label: '训练三元组', value: '86,835' },
      { label: '来源', value: 'WordNet' },
    ],
  },
  yago310: {
    id: 'yago310', name: 'YAGO3-10', type: 'dataset',
    description: '真实世界KG YAGO的子集，仅保留出现10次以上的关系，规模大，广泛用于大规模KGE方法评估。',
    properties: [
      { label: '实体数', value: '123,182' },
      { label: '关系数', value: '37' },
      { label: '训练三元组', value: '1,079,040' },
      { label: '来源', value: 'Wikipedia + WordNet' },
    ],
  },
  freebase: {
    id: 'freebase', name: 'Freebase', type: 'dataset',
    description: 'Google维护的大规模结构化知识库，2016年停止维护并并入Wikidata，是FB15k系列数据集的原始来源。',
    properties: [
      { label: '实体数', value: '约1.2亿' },
      { label: '关系数', value: '约2.7万' },
      { label: '维护方', value: 'Google' },
      { label: '状态', value: '已停用（2016）' },
    ],
  },
  wordnet: {
    id: 'wordnet', name: 'WordNet', type: 'dataset',
    description: '英语词汇语义知识库，将词语按语义关系组织为同义词集（Synsets），是WN18RR等数据集的原始来源。',
    properties: [
      { label: '维护方', value: 'Princeton University' },
      { label: '词汇量', value: '约15.5万词' },
      { label: '同义词集', value: '约11.7万个' },
      { label: '主要关系', value: '上下位、同义、反义' },
    ],
  },
  yago: {
    id: 'yago', name: 'YAGO', type: 'dataset',
    description: '从Wikipedia、WordNet等来源自动构建的大规模真实世界知识图谱，涵盖人物、地点、事件等多类实体。',
    properties: [
      { label: '维护方', value: 'MPI Informatics' },
      { label: '实体数', value: '约1700万' },
      { label: '事实数', value: '约2亿' },
      { label: '当前版本', value: 'YAGO 4.5' },
    ],
  },
  zhangMing: {
    id: 'zhangMing', name: '张明', type: 'person',
    description: '清华大学计算机科学与技术系副教授，专注知识图谱表示学习与图神经网络，本文通讯作者。',
    properties: [
      { label: '机构', value: '清华大学 DCST' },
      { label: '研究方向', value: '知识图谱、图神经网络' },
      { label: '发表论文', value: '47篇' },
      { label: 'H-Index', value: '18' },
    ],
  },
  liHua: {
    id: 'liHua', name: '李华', type: 'person',
    description: '北京大学信息学院博士生，研究知识图谱嵌入与多模态知识融合，本文第二作者。',
    properties: [
      { label: '机构', value: '北京大学信息学院' },
      { label: '研究方向', value: 'KGE, 多模态知识' },
      { label: '入学年份', value: '2021' },
      { label: '导师', value: '王强教授' },
    ],
  },
  wangQiang: {
    id: 'wangQiang', name: '王强', type: 'person',
    description: '清华大学计算机系教授，知识图谱与智能系统研究领域专家，主持多项国家重点研发计划项目。',
    properties: [
      { label: '机构', value: '清华大学 DCST' },
      { label: '职称', value: '教授' },
      { label: 'H-Index', value: '32' },
      { label: '主持项目', value: '国家重点研发计划' },
    ],
  },
  tsinghua: {
    id: 'tsinghua', name: '清华大学', type: 'organization',
    description: '中国顶尖研究型大学，计算机科学全球排名前十，THUNLP、DCST等实验室在知识图谱领域贡献突出。',
    properties: [
      { label: '建立时间', value: '1911年' },
      { label: '地址', value: '北京市海淀区' },
      { label: 'CS全球排名', value: 'QS Top 10' },
      { label: '代表实验室', value: 'THUNLP, DCST' },
    ],
  },
  pku: {
    id: 'pku', name: '北京大学', type: 'organization',
    description: '中国顶尖综合性研究大学，信息学院在自然语言处理与知识工程领域有突出研究成果。',
    properties: [
      { label: '建立时间', value: '1898年' },
      { label: '地址', value: '北京市海淀区' },
      { label: 'CS全球排名', value: 'QS Top 20' },
      { label: '代表实验室', value: 'WICT' },
    ],
  },
  ieee_tkde: {
    id: 'ieee_tkde', name: 'IEEE TKDE', type: 'venue',
    description: 'IEEE Transactions on Knowledge and Data Engineering，知识与数据工程领域顶级期刊，CCF A类。',
    properties: [
      { label: '发行方', value: 'IEEE' },
      { label: '影响因子', value: '8.9（2024）' },
      { label: 'CCF等级', value: 'A类期刊' },
      { label: '审稿周期', value: '3–6个月' },
    ],
  },
};

// ─── Entity Type Config ────────────────────────────────────────────────────────

const ENTITY_TYPE_CONFIG: Record<EntityType, {
  label: string; badgeClass: string; underlineColor: string; bgActive: string; dotClass: string;
}> = {
  person:       { label: '人物',  badgeClass: 'bg-violet-100 text-violet-700', underlineColor: '#7c3aed', bgActive: 'rgba(124,58,237,0.09)',  dotClass: 'bg-violet-400' },
  organization: { label: '机构',  badgeClass: 'bg-emerald-100 text-emerald-700', underlineColor: '#059669', bgActive: 'rgba(5,150,105,0.09)', dotClass: 'bg-emerald-400' },
  dataset:      { label: '数据集', badgeClass: 'bg-amber-100 text-amber-700', underlineColor: '#d97706', bgActive: 'rgba(217,119,6,0.09)',     dotClass: 'bg-amber-400' },
  method:       { label: '方法',  badgeClass: 'bg-blue-100 text-blue-700', underlineColor: '#2563eb', bgActive: 'rgba(37,99,235,0.09)',        dotClass: 'bg-blue-400' },
  concept:      { label: '概念',  badgeClass: 'bg-cyan-100 text-cyan-700', underlineColor: '#0891b2', bgActive: 'rgba(8,145,178,0.09)',         dotClass: 'bg-cyan-500' },
  venue:        { label: '期刊',  badgeClass: 'bg-rose-100 text-rose-700', underlineColor: '#e11d48', bgActive: 'rgba(225,29,72,0.09)',         dotClass: 'bg-rose-400' },
};

// ─── Entity Popup ──────────────────────────────────────────────────────────────

function EntityPopup({ entity, anchorRect, onClose, pinned }: {
  entity: KBEntity; anchorRect: DOMRect; onClose: () => void; pinned: boolean;
}) {
  const cfg = ENTITY_TYPE_CONFIG[entity.type];
  const W = 284;
  const OFFSET = 10;

  let top = anchorRect.bottom + OFFSET;
  let left = anchorRect.left;
  if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
  if (left < 8) left = 8;
  if (top + 248 > window.innerHeight - 8) top = anchorRect.top - 248 - OFFSET;
  if (top < 8) top = 8;

  return createPortal(
    <div
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: 'fixed', top, left, width: W, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-gray-100 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.badgeClass}`}>{cfg.label}</span>
            {pinned && <span className="text-[9.5px] text-gray-400">已固定</span>}
          </div>
          <p className="text-[13px] font-semibold text-gray-900 leading-snug">{entity.name}</p>
        </div>
        {pinned && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Description */}
      <div className="px-4 py-2.5 border-b border-gray-100">
        <p className="text-[11.5px] text-gray-600 leading-[1.65]">{entity.description}</p>
      </div>

      {/* Properties */}
      <div className="px-4 py-2.5">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {entity.properties.map(prop => (
            <div key={prop.label}>
              <p className="text-[9.5px] text-gray-400 uppercase tracking-wide mb-0.5">{prop.label}</p>
              <p className="text-[11px] text-gray-800 font-medium leading-tight">{prop.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">知识库实体</span>
        <button className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors">
          查看详情 <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── EntitySpan ────────────────────────────────────────────────────────────────

function EntitySpan({ entityId, children }: { entityId: string; children: React.ReactNode }) {
  const entity = ENTITY_DB[entityId];
  if (!entity) return <>{children}</>;

  const cfg = ENTITY_TYPE_CONFIG[entity.type];
  const spanRef = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pinned, setPinned] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getRect = () => spanRef.current?.getBoundingClientRect() ?? null;

  const handleMouseEnter = () => {
    if (pinned) return;
    timer.current = setTimeout(() => {
      const r = getRect();
      if (r) { setRect(r); setShow(true); }
    }, 260);
  };

  const handleMouseLeave = () => {
    if (pinned) return;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setShow(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = getRect();
    if (r) setRect(r);
    if (pinned) { setPinned(false); setShow(false); }
    else { setPinned(true); setShow(true); }
  };

  const handleClose = () => { setPinned(false); setShow(false); };

  useEffect(() => {
    if (!pinned) return;
    const handler = (e: MouseEvent) => {
      if (spanRef.current && !spanRef.current.contains(e.target as Node)) {
        setPinned(false);
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pinned]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <>
      <span
        ref={spanRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          borderBottom: `1.5px dotted ${cfg.underlineColor}`,
          backgroundColor: pinned ? cfg.bgActive : undefined,
          cursor: 'pointer',
        }}
        className="rounded-[2px] transition-colors"
      >
        {children}
      </span>
      {show && rect && (
        <EntityPopup entity={entity} anchorRect={rect} onClose={handleClose} pinned={pinned} />
      )}
    </>
  );
}

function E({ id, children }: { id: string; children: React.ReactNode }) {
  return <EntitySpan entityId={id}>{children}</EntitySpan>;
}

// ─── Tool config ──────────────────────────────────────────────────────────────

const TOOLS: { id: Tool; icon: any; label: string; color?: string }[] = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'highlight', icon: Highlighter, label: '高亮', color: '#fbbf24' },
  { id: 'underline', icon: Underline, label: '下划线', color: '#3b82f6' },
  { id: 'note', icon: StickyNote, label: '添加备注', color: '#f59e0b' },
  { id: 'rect', icon: Square, label: '矩形标注', color: '#10b981' },
  { id: 'circle', icon: Circle, label: '椭圆标注', color: '#8b5cf6' },
  { id: 'draw', icon: PenLine, label: '自由绘制', color: '#ef4444' },
  { id: 'text', icon: Type, label: '插入文本', color: '#6366f1' },
];

const HL_COLORS: Record<AnnotationType, string> = {
  highlight: '#fef08a',
  underline: '#bfdbfe',
  note: '#fef9c3',
  rect: '#d1fae5',
  circle: '#ede9fe',
};

// ─── Paper content ─────────────────────────────────────────────────────────────

const OUTLINE = [
  { id: 'abstract', title: 'Abstract', level: 1, page: 1 },
  { id: 'intro', title: '1. Introduction', level: 1, page: 1 },
  { id: 'related', title: '2. Related Work', level: 1, page: 2 },
  { id: 'method', title: '3. Methodology', level: 1, page: 2 },
  { id: 'arch', title: '  3.1 Model Architecture', level: 2, page: 2 },
  { id: 'train', title: '  3.2 Training Objective', level: 2, page: 3 },
  { id: 'exp', title: '4. Experiments', level: 1, page: 3 },
  { id: 'results', title: '  4.1 Main Results', level: 2, page: 3 },
  { id: 'ablation', title: '  4.2 Ablation Study', level: 2, page: 4 },
  { id: 'conclusion', title: '5. Conclusion', level: 1, page: 4 },
  { id: 'ref', title: 'References', level: 1, page: 4 },
];

interface PageProps {
  annotations: Annotation[];
  activeTool: Tool;
  onParaClick: (paraId: string, page: number) => void;
  activeNoteId: string | null;
}

function Page1({ annotations, activeTool, onParaClick, activeNoteId }: PageProps) {
  const getStyle = (paraId: string) => {
    const ann = annotations.find(a => a.paraId === paraId && a.page === 1);
    if (!ann) return {};
    return { backgroundColor: HL_COLORS[ann.type] || undefined, textDecoration: ann.type === 'underline' ? 'underline' : undefined };
  };
  const cls = (id: string) => `cursor-${activeTool === 'select' ? 'default' : 'crosshair'} rounded transition-colors hover:brightness-95 ${activeNoteId === id ? 'ring-2 ring-amber-400' : ''}`;

  return (
    <div className="font-serif text-gray-800 leading-relaxed">
      <div className="text-center mb-8">
        <h1 className="text-[18px] font-bold leading-tight mb-3 text-gray-900">基于Transformer的知识图谱嵌入方法研究</h1>
        <p className="text-sm text-gray-600 mb-1">
          <E id="zhangMing">张明</E>¹&nbsp;&nbsp;<E id="liHua">李华</E>²&nbsp;&nbsp;<E id="wangQiang">王强</E>¹
        </p>
        <p className="text-xs text-gray-500">
          ¹<E id="tsinghua">清华大学</E>计算机科学与技术系&nbsp;&nbsp;²<E id="pku">北京大学</E>信息学院
        </p>
        <p className="text-xs text-gray-400 mt-1">
          <E id="ieee_tkde">IEEE Transactions on Knowledge and Data Engineering</E>, 2024
        </p>
      </div>

      <div className="mb-5">
        <h2 className="text-sm font-bold mb-2 uppercase tracking-wide">Abstract</h2>
        <p id="p-abstract" onClick={() => onParaClick('abstract', 1)} style={getStyle('abstract')} className={`text-[12.5px] leading-[1.7] ${cls('abstract')}`}>
          <E id="kge">Knowledge graph embedding (KGE)</E> aims to represent entities and relations in a knowledge graph as continuous low-dimensional vectors, enabling efficient reasoning and completion. However, traditional translation-based methods struggle to capture complex long-range semantic dependencies among entities. In this paper, we propose <E id="tkgEmbed">TKGEmbed</E>, a novel KGE framework leveraging <E id="multiheadAttn">multi-head self-attention</E> to encode rich contextual information around each entity. We further introduce a relation-aware positional encoding mechanism and a joint training objective combining margin-based ranking loss with contrastive regularization. Extensive experiments on <E id="fb15k237">FB15k-237</E>, <E id="wn18rr">WN18RR</E>, and <E id="yago310">YAGO3-10</E> demonstrate that <E id="tkgEmbed">TKGEmbed</E> significantly outperforms state-of-the-art baselines across all standard metrics.
        </p>
      </div>

      <div className="mb-5">
        <h2 className="text-sm font-bold mb-2">1. Introduction</h2>
        <p id="p-intro-1" onClick={() => onParaClick('intro-1', 1)} style={getStyle('intro-1')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('intro-1')}`}>
          Knowledge graphs (KGs) such as <E id="freebase">Freebase</E>, <E id="wordnet">WordNet</E>, and <E id="yago">YAGO</E> store vast amounts of structured factual knowledge in the form of entity-relation-entity triples (h, r, t). Despite their utility in downstream tasks such as question answering, recommendation, and information retrieval, real-world KGs are inherently incomplete, motivating the task of knowledge graph completion (KGC).
        </p>
        <p id="p-intro-2" onClick={() => onParaClick('intro-2', 1)} style={getStyle('intro-2')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('intro-2')}`}>
          Existing <E id="kge">KGE</E> methods can be broadly categorized into translational models (e.g., <E id="transE">TransE</E> [1], <E id="rotateE">RotatE</E> [5]), bilinear models (e.g., <E id="distMult">DistMult</E>, <E id="complexE">ComplEx</E>), and more recently, graph neural network-based approaches (e.g., <E id="compGCN">CompGCN</E> [12]). While these methods have achieved notable progress, they typically model each triple in isolation, failing to leverage the rich neighborhood context available in the graph.
        </p>
        <p id="p-intro-3" onClick={() => onParaClick('intro-3', 1)} style={getStyle('intro-3')} className={`text-[12.5px] leading-[1.7] ${cls('intro-3')}`}>
          Motivated by the remarkable success of <E id="transformer">Transformer-based architectures</E> in natural language processing [18] and their ability to capture long-range dependencies via <E id="multiheadAttn">self-attention</E>, we propose to apply <E id="multiheadAttn">multi-head self-attention</E> to aggregate entity neighborhood information for <E id="kge">KGE</E>. Our key contributions are summarized as follows: (i) We propose <E id="tkgEmbed">TKGEmbed</E>, incorporating a <E id="transformer">Transformer</E> encoder to capture contextual entity representations; (ii) We design a relation-aware positional encoding; (iii) We introduce a joint training objective; (iv) We achieve new state-of-the-art results on three standard benchmarks.
        </p>
      </div>
    </div>
  );
}

function Page2({ annotations, activeTool, onParaClick, activeNoteId }: PageProps) {
  const getStyle = (paraId: string) => {
    const ann = annotations.find(a => a.paraId === paraId && a.page === 2);
    if (!ann) return {};
    return { backgroundColor: HL_COLORS[ann.type] || undefined, textDecoration: ann.type === 'underline' ? 'underline' : undefined };
  };
  const cls = (id: string) => `cursor-${activeTool === 'select' ? 'default' : 'crosshair'} rounded transition-colors ${activeNoteId === id ? 'ring-2 ring-amber-400' : ''}`;

  return (
    <div className="font-serif text-gray-800 leading-relaxed">
      <h2 className="text-sm font-bold mb-3">2. Related Work</h2>
      <p onClick={() => onParaClick('related-1', 2)} style={getStyle('related-1')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('related-1')}`}>
        <strong>Translational Models.</strong> <E id="transE">TransE</E> [1] models relations as translations in embedding space: h + r ≈ t for a valid triple (h, r, t). <E id="rotateE">RotatE</E> [5] extends this idea to the complex space, modeling relations as rotations. These methods are computationally efficient but limited in expressiveness for complex relation patterns such as symmetry and composition.
      </p>
      <p onClick={() => onParaClick('related-2', 2)} style={getStyle('related-2')} className={`text-[12.5px] leading-[1.7] mb-5 ${cls('related-2')}`}>
        <strong>Graph Neural Networks.</strong> <E id="compGCN">CompGCN</E> [12] jointly embeds entities and relations using graph convolution, enabling parameter sharing across the graph. However, GNN-based methods suffer from over-smoothing as depth increases and do not naturally capture asymmetric relation patterns. Our <E id="tkgEmbed">TKGEmbed</E> addresses these limitations by using attention weights to selectively aggregate neighborhood information.
      </p>

      <h2 className="text-sm font-bold mb-3">3. Methodology</h2>
      <h3 className="text-[13px] font-semibold mb-2 text-gray-700">3.1 Model Architecture</h3>
      <p onClick={() => onParaClick('arch-1', 2)} style={getStyle('arch-1')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('arch-1')}`}>
        Given a KG G = (ε, R, T) with entity set ε, relation set R, and triple set T, we embed each entity e ∈ ε into a d-dimensional vector e ∈ ℝᵈ. The <E id="tkgEmbed">TKGEmbed</E> encoder consists of L stacked <E id="transformer">Transformer</E> blocks. For each entity eᵢ, we first collect its L-hop neighborhood N(eᵢ) and construct a sequence of (relation, entity) pairs as input.
      </p>
      <p onClick={() => onParaClick('arch-2', 2)} style={getStyle('arch-2')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('arch-2')}`}>
        Each <E id="transformer">Transformer</E> block applies <E id="multiheadAttn">multi-head self-attention</E> followed by a feed-forward network. The updated representation of entity eᵢ at layer l is:
      </p>
      {/* Formula box */}
      <div onClick={() => onParaClick('formula-1', 2)} style={getStyle('formula-1')} className={`my-3 p-3 bg-gray-50 border border-gray-200 rounded font-mono text-[12px] text-gray-700 ${cls('formula-1')}`}>
        e'ᵢ = Σⱼ αᵢⱼ · Wᵥeⱼ &nbsp;&nbsp; where &nbsp;&nbsp; αᵢⱼ = softmax(Qᵢ · Kⱼ / √d_k)
      </div>
      <p onClick={() => onParaClick('arch-3', 2)} style={getStyle('arch-3')} className={`text-[12.5px] leading-[1.7] ${cls('arch-3')}`}>
        where Q, K, V ∈ ℝᵈˣᵈ are learnable projection matrices, and d_k is the key dimensionality. To encode relation type into the <E id="multiheadAttn">attention mechanism</E>, we introduce relation-aware positional encodings: each (relation, entity) pair is encoded with the relation embedding added to the position encoding of that slot.
      </p>
    </div>
  );
}

function Page3({ annotations, activeTool, onParaClick, activeNoteId }: PageProps) {
  const getStyle = (paraId: string) => {
    const ann = annotations.find(a => a.paraId === paraId && a.page === 3);
    if (!ann) return {};
    return { backgroundColor: HL_COLORS[ann.type] || undefined, textDecoration: ann.type === 'underline' ? 'underline' : undefined };
  };
  const cls = (id: string) => `cursor-${activeTool === 'select' ? 'default' : 'crosshair'} rounded transition-colors ${activeNoteId === id ? 'ring-2 ring-amber-400' : ''}`;

  return (
    <div className="font-serif text-gray-800 leading-relaxed">
      <h3 className="text-[13px] font-semibold mb-2 text-gray-700">3.2 Training Objective</h3>
      <p onClick={() => onParaClick('train-1', 3)} style={getStyle('train-1')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('train-1')}`}>
        We adopt a margin-based ranking loss as the primary training signal:
      </p>
      <div className="my-3 p-3 bg-gray-50 border border-gray-200 rounded font-mono text-[12px] text-gray-700">
        ℒ_rank = Σ₍h,r,t₎ max(0, γ + d(h,r,t) − d(h,r,t′))
      </div>
      <p onClick={() => onParaClick('train-2', 3)} style={getStyle('train-2')} className={`text-[12.5px] leading-[1.7] mb-5 ${cls('train-2')}`}>
        where γ is the margin hyperparameter, d(·) is the scoring function, and t′ is a corrupted tail entity. Additionally, we add a contrastive regularization term ℒ_con that encourages similar entities to have proximal embeddings. The final objective is ℒ = ℒ_rank + λℒ_con where λ is a weighting coefficient tuned via grid search.
      </p>

      <h2 className="text-sm font-bold mb-3">4. Experiments</h2>
      <h3 className="text-[13px] font-semibold mb-2 text-gray-700">4.1 Main Results</h3>
      <p onClick={() => onParaClick('exp-1', 3)} style={getStyle('exp-1')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('exp-1')}`}>
        We evaluate <E id="tkgEmbed">TKGEmbed</E> on three standard KGC benchmarks: <E id="fb15k237">FB15k-237</E>, <E id="wn18rr">WN18RR</E>, and <E id="yago310">YAGO3-10</E>. Following standard protocol, we report <E id="mrr">Mean Reciprocal Rank (MRR)</E> and Hits@1/3/10 under filtered setting. Table 1 presents the comparison results.
      </p>

      {/* Table */}
      <div onClick={() => onParaClick('table-1', 3)} style={getStyle('table-1')} className={`mb-4 ${cls('table-1')}`}>
        <p className="text-[11px] text-center text-gray-500 mb-1">Table 1: Link prediction results on <E id="fb15k237">FB15k-237</E> (filtered setting)</p>
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="text-left py-1 pr-4 font-semibold">Method</th>
              <th className="text-center py-1 px-2 font-semibold">MRR</th>
              <th className="text-center py-1 px-2 font-semibold">H@1</th>
              <th className="text-center py-1 px-2 font-semibold">H@3</th>
              <th className="text-center py-1 px-2 font-semibold">H@10</th>
            </tr>
          </thead>
          <tbody>
            {[['TransE', '.279', '.198', '.376', '.441'], ['RotatE', '.338', '.241', '.375', '.533'], ['CompGCN', '.355', '.264', '.390', '.535'], ['TKGEmbed (ours)', '.383', '.289', '.419', '.567']].map(([m, ...v], i) => (
              <tr key={m} className={`border-b border-gray-200 ${i === 3 ? 'font-semibold' : ''}`}>
                <td className="py-1 pr-4">{m}</td>
                {v.map((val, j) => <td key={j} className="text-center py-1 px-2">{val}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p onClick={() => onParaClick('exp-2', 3)} style={getStyle('exp-2')} className={`text-[12.5px] leading-[1.7] ${cls('exp-2')}`}>
        <E id="tkgEmbed">TKGEmbed</E> achieves consistent improvements over all baselines across all metrics, with a +7.9% <E id="mrr">MRR</E> gain over <E id="compGCN">CompGCN</E> on <E id="fb15k237">FB15k-237</E>. The improvement is particularly pronounced on Hits@1, suggesting that <E id="tkgEmbed">TKGEmbed</E> is better at ranking the correct entity first, which we attribute to the richer contextual representations learned via <E id="multiheadAttn">multi-head attention</E>.
      </p>
    </div>
  );
}

function Page4({ annotations, activeTool, onParaClick, activeNoteId }: PageProps) {
  const getStyle = (paraId: string) => {
    const ann = annotations.find(a => a.paraId === paraId && a.page === 4);
    if (!ann) return {};
    return { backgroundColor: HL_COLORS[ann.type] || undefined, textDecoration: ann.type === 'underline' ? 'underline' : undefined };
  };
  const cls = (id: string) => `cursor-${activeTool === 'select' ? 'default' : 'crosshair'} rounded transition-colors ${activeNoteId === id ? 'ring-2 ring-amber-400' : ''}`;

  return (
    <div className="font-serif text-gray-800 leading-relaxed">
      <h3 className="text-[13px] font-semibold mb-2 text-gray-700">4.2 Ablation Study</h3>
      <p onClick={() => onParaClick('abl-1', 4)} style={getStyle('abl-1')} className={`text-[12.5px] leading-[1.7] mb-3 ${cls('abl-1')}`}>
        To validate the contribution of each component, we conduct an ablation study on <E id="fb15k237">FB15k-237</E> (Table 2). Removing the <E id="multiheadAttn">multi-head attention</E> module (w/o <E id="transformer">Transformer</E>) causes the largest performance drop (−16.1% <E id="mrr">MRR</E>), confirming the importance of contextual aggregation. Removing the relation-aware PE (w/o Rel-PE) and the contrastive loss (w/o Contrastive) also result in significant degradation.
      </p>

      <h2 className="text-sm font-bold mb-3">5. Conclusion</h2>
      <p onClick={() => onParaClick('conclusion', 4)} style={getStyle('conclusion')} className={`text-[12.5px] leading-[1.7] mb-5 ${cls('conclusion')}`}>
        We presented <E id="tkgEmbed">TKGEmbed</E>, a <E id="transformer">Transformer</E>-based knowledge graph embedding framework that captures rich contextual entity representations via <E id="multiheadAttn">multi-head self-attention</E>. With a relation-aware positional encoding and a joint training objective, <E id="tkgEmbed">TKGEmbed</E> achieves new state-of-the-art results on three standard benchmarks. Future work includes extending <E id="tkgEmbed">TKGEmbed</E> to multi-modal knowledge graphs and improving scalability to billion-scale graphs.
      </p>

      <h2 className="text-sm font-bold mb-2">References</h2>
      <div className="text-[11.5px] text-gray-600 space-y-1">
        {['[1] Bordes et al. Translating Embeddings for Modeling Multi-relational Data. NeurIPS 2013.',
          '[5] Sun et al. RotatE: Knowledge Graph Embedding by Relational Rotation in Complex Space. ICLR 2019.',
          '[12] Vashishth et al. Composition-based Multi-Relational Graph Convolutional Networks. ICLR 2020.',
          '[18] Vaswani et al. Attention Is All You Need. NeurIPS 2017.',
          '[21] Dettmers et al. Convolutional 2D Knowledge Graph Embeddings. AAAI 2018.'].map(r => (
          <p key={r}>{r}</p>
        ))}
      </div>
    </div>
  );
}

const PAGES = [Page1, Page2, Page3, Page4];

// ─── AI responses ─────────────────────────────────────────────────────────────

function getAIReply(q: string): string {
  const lq = q.toLowerCase();
  if (lq.includes('贡献') || lq.includes('创新') || lq.includes('novelty')) return '本文的主要贡献有四点：① 提出TKGEmbed框架，将Transformer引入KGE任务；② 设计了关系感知位置编码；③ 提出结合margin损失与对比正则化的联合目标；④ 在三个标准基准上刷新了SOTA。';
  if (lq.includes('方法') || lq.includes('模型') || lq.includes('架构')) return 'TKGEmbed的核心是多头自注意力编码器：对每个实体，收集其邻居(关系,实体)对构成序列，经L层Transformer块聚合上下文信息，再通过投影头映射到关系评分空间。关键公式：e\'ᵢ = Σⱼ αᵢⱼ·Wᵥeⱼ，αᵢⱼ = softmax(Qᵢ·Kⱼ/√dₖ)。';
  if (lq.includes('实验') || lq.includes('结果') || lq.includes('性能') || lq.includes('performance')) return '在FB15k-237上，TKGEmbed的MRR为0.383，相比最优基线CompGCN（0.355）提升7.9%；Hits@10达0.567。消融实验显示去掉Transformer模块MRR下降最多（-16.1%），说明上下文聚合是关键。';
  if (lq.includes('数据集') || lq.includes('dataset') || lq.includes('benchmark')) return '论文在三个标准KGC数据集上评估：FB15k-237（Freebase子集，含237种关系，14505实体，272115训练三元组）；WN18RR（WordNet子集，11种关系）；YAGO3-10（真实世界KG，仅保留至少10个三元组的关系）。评估指标均在filtered setting下计算。';
  if (lq.includes('限制') || lq.includes('局限') || lq.includes('future') || lq.includes('未来')) return '论文指出两个主要局限：① 扩展性——在亿级规模KG上计算开销较大；② 单模态——仅处理结构化三元组，未利用实体描述文本或图像。未来工作包括多模态KGE扩展和在线增量学习机制设计。';
  if (lq.includes('翻译') || lq.includes('translate')) return '请选择需要翻译的段落，点击"翻译"Tab即可查看英文原文对照翻译。';
  return `关于「${q}」，根据本文内容：TKGEmbed通过多头自注意力机制聚合实体邻居信息，有效捕获长距离语义依赖，在标准KGC基准上取得SOTA结果。如需了解更具体的信息，欢迎继续提问。`;
}

// ─── Entity Legend (for right panel) ──────────────────────────────────────────

const ENTITY_LIST_BY_TYPE: { type: EntityType; ids: string[] }[] = [
  { type: 'method',       ids: ['tkgEmbed', 'transE', 'rotateE', 'distMult', 'complexE', 'compGCN'] },
  { type: 'dataset',      ids: ['fb15k237', 'wn18rr', 'yago310', 'freebase', 'wordnet', 'yago'] },
  { type: 'concept',      ids: ['kge', 'transformer', 'multiheadAttn', 'mrr'] },
  { type: 'person',       ids: ['zhangMing', 'liHua', 'wangQiang'] },
  { type: 'organization', ids: ['tsinghua', 'pku'] },
  { type: 'venue',        ids: ['ieee_tkde'] },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function LiteratureReader() {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const [rotation, setRotation] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [leftTab, setLeftTab] = useState<'outline' | 'thumbnails' | 'bookmarks'>('outline');
  const [rightTab, setRightTab] = useState<'ai' | 'translate' | 'notes' | 'entities' | 'molecular'>('ai');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [annotations, setAnnotations] = useState<Annotation[]>([
    { id: uid(), paraId: 'abstract', type: 'highlight', color: '#fef08a', page: 1 },
    { id: uid(), paraId: 'intro-2', type: 'note', color: '#fef9c3', note: '关键论点：传统方法无法建模长距离依赖，Transformer来解决此问题', page: 1 },
    { id: uid(), paraId: 'arch-1', type: 'highlight', color: '#fef08a', page: 2 },
    { id: uid(), paraId: 'exp-2', type: 'underline', color: '#bfdbfe', page: 3 },
    { id: uid(), paraId: 'conclusion', type: 'highlight', color: '#fef08a', page: 4 },
  ]);
  const [bookmarks, setBookmarks] = useState<Bookmark_[]>([
    { id: uid(), page: 2, title: '3.1 模型架构（含关键公式）', createdAt: '2026-06-10' },
    { id: uid(), page: 3, title: 'Table 1 实验结果', createdAt: '2026-06-10' },
  ]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [pendingNoteParaId, setPendingNoteParaId] = useState<string | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { id: uid(), role: 'assistant', content: '您好！我已读取《基于Transformer的知识图谱嵌入方法研究》全文，请随时向我提问。\n\n可以问我：论文的核心贡献是什么？模型架构如何工作？实验结果怎么样？' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const TOTAL_PAGES = 4;

  const currentPaper = {
    id: 'L001',
    title: '基于Transformer的知识图谱嵌入方法研究',
    authors: ['张明', '李华', '王强'],
    journal: 'IEEE TKDE',
    year: 2024,
    impactFactor: 8.9,
    citations: 142,
    abstract: '本文提出了一种新的基于Transformer架构的知识图谱嵌入方法，有效解决了传统方法在长距离依赖建模方面的不足。实验结果表明，该方法在多个标准知识图谱补全数据集上均取得了优于现有方法的性能。',
    keywords: ['知识图谱', '嵌入', 'Transformer', '表示学习'],
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  const handleParaClick = (paraId: string, page: number) => {
    if (activeTool === 'select') return;
    if (activeTool === 'note') {
      setPendingNoteParaId(paraId);
      return;
    }
    const type: AnnotationType = activeTool === 'highlight' ? 'highlight' : activeTool === 'underline' ? 'underline' : activeTool === 'rect' ? 'rect' : activeTool === 'circle' ? 'circle' : 'highlight';
    setAnnotations(prev => {
      const existing = prev.findIndex(a => a.paraId === paraId && a.page === page);
      if (existing >= 0) return prev.filter((_, i) => i !== existing);
      return [...prev, { id: uid(), paraId, type, color: HL_COLORS[type], page }];
    });
  };

  const saveNote = () => {
    if (!pendingNoteParaId || !newNoteText.trim()) { setPendingNoteParaId(null); return; }
    setAnnotations(prev => [...prev, { id: uid(), paraId: pendingNoteParaId, type: 'note', color: '#fef9c3', note: newNoteText.trim(), page: currentPage }]);
    setNewNoteText('');
    setPendingNoteParaId(null);
  };

  const sendChat = () => {
    if (!chatInput.trim() || isThinking) return;
    const msg: ChatMsg = { id: uid(), role: 'user', content: chatInput.trim() };
    setChatMsgs(prev => [...prev, msg]);
    setChatInput('');
    setIsThinking(true);
    setTimeout(() => {
      setChatMsgs(prev => [...prev, { id: uid(), role: 'assistant', content: getAIReply(msg.content) }]);
      setIsThinking(false);
    }, 700 + Math.random() * 500);
  };

  const addBookmark = () => {
    const title = OUTLINE.find(o => o.page === currentPage)?.title || `第${currentPage}页`;
    setBookmarks(prev => [...prev, { id: uid(), page: currentPage, title, createdAt: new Date().toISOString().slice(0, 10) }]);
  };

  const SUGGEST_QUESTIONS = ['论文的核心贡献是什么？', '模型架构如何工作？', '消融实验说明了什么？', '与RotatE相比有何优势？'];

  return (
    <div className="h-full flex flex-col bg-gray-100 overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 mr-3 min-w-0">
          <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate max-w-[180px]">KG_Embedding_Transformer.pdf</span>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-1 text-xs text-gray-600 min-w-[70px] justify-center">
          <input type="number" min={1} max={TOTAL_PAGES} value={currentPage} onChange={e => setCurrentPage(Math.max(1, Math.min(TOTAL_PAGES, +e.target.value)))}
            className="w-8 text-center border border-gray-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-blue-400" />
          <span className="text-gray-400">/ {TOTAL_PAGES}</span>
        </div>
        <button onClick={() => setCurrentPage(p => Math.min(TOTAL_PAGES, p + 1))} disabled={currentPage === TOTAL_PAGES} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-xs text-gray-600 w-10 text-center">{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><ZoomIn className="w-4 h-4" /></button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button onClick={() => setViewMode('single')} title="单页" className={`p-1.5 rounded transition-colors ${viewMode === 'single' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}><LayoutTemplate className="w-4 h-4" /></button>
        <button onClick={() => setViewMode('double')} title="双页" className={`p-1.5 rounded transition-colors ${viewMode === 'double' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}><Columns className="w-4 h-4" /></button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} title="逆时针旋转" className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
        <button onClick={() => setRotation(r => (r + 90) % 360)} title="顺时针旋转" className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><RotateCw className="w-4 h-4" /></button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {TOOLS.map(tool => (
          <button key={tool.id} title={tool.label} onClick={() => setActiveTool(tool.id)}
            className={`p-1.5 rounded transition-colors ${activeTool === tool.id ? 'text-white' : 'hover:bg-gray-100 text-gray-500'}`}
            style={activeTool === tool.id ? { backgroundColor: tool.color || '#3b82f6' } : {}}>
            <tool.icon className="w-4 h-4" />
          </button>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button onClick={addBookmark} title="添加书签" className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><Bookmark className="w-4 h-4" /></button>
        <button title="下载" className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><Download className="w-4 h-4" /></button>

        <div className="flex-1" />

        <button onClick={() => setLeftOpen(v => !v)} className={`p-1.5 rounded transition-colors ${leftOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <button onClick={() => setRightOpen(v => !v)} className={`p-1.5 rounded transition-colors ${rightOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
          <PanelRightOpen className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left Panel ── */}
        {leftOpen && (
          <div className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="flex border-b border-gray-100">
              {([['outline', List, '大纲'], ['thumbnails', LayoutTemplate, '缩略图'], ['bookmarks', Bookmark, '书签']] as const).map(([id, Icon, label]) => (
                <button key={id} onClick={() => setLeftTab(id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${leftTab === id ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {leftTab === 'outline' && (
                <div className="py-2">
                  {OUTLINE.map(item => (
                    <button key={item.id} onClick={() => setCurrentPage(item.page)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 ${currentPage === item.page ? 'text-blue-600 bg-blue-50/50' : 'text-gray-600'} ${item.level === 2 ? 'pl-6 text-[11px]' : 'font-medium'}`}>
                      {item.title}
                    </button>
                  ))}
                </div>
              )}

              {leftTab === 'thumbnails' && (
                <div className="p-2 grid grid-cols-2 gap-2">
                  {PAGES.map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)}
                      className={`border-2 rounded-lg overflow-hidden transition-colors ${currentPage === i + 1 ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="h-20 bg-white flex flex-col items-start justify-start p-1.5 gap-0.5">
                        <div className="w-full h-1.5 bg-gray-200 rounded" />
                        <div className="w-3/4 h-1 bg-gray-100 rounded" />
                        <div className="w-full h-0.5 bg-gray-100 rounded mt-1" />
                        <div className="w-full h-0.5 bg-gray-100 rounded" />
                        <div className="w-full h-0.5 bg-gray-100 rounded" />
                        <div className="w-2/3 h-0.5 bg-gray-100 rounded" />
                        <div className="mt-1 w-full h-3 bg-gray-100 rounded" />
                        <div className="w-full h-0.5 bg-gray-100 rounded mt-0.5" />
                        <div className="w-full h-0.5 bg-gray-100 rounded" />
                      </div>
                      <div className="bg-gray-50 py-0.5 text-center text-[9px] text-gray-500">{i + 1}</div>
                    </button>
                  ))}
                </div>
              )}

              {leftTab === 'bookmarks' && (
                <div className="py-2">
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">暂无书签<br />点击工具栏 ⌖ 添加</div>
                  ) : (
                    bookmarks.map(bk => (
                      <button key={bk.id} onClick={() => setCurrentPage(bk.page)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-start gap-1.5">
                          <Star className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 leading-snug">{bk.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">第{bk.page}页 · {bk.createdAt}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setBookmarks(prev => prev.filter(b => b.id !== bk.id)); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Page Area ── */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-6 gap-6 bg-gray-200">
          {pendingNoteParaId && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setPendingNoteParaId(null)}>
              <div className="bg-white rounded-xl shadow-xl p-5 w-80" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-800">添加备注</span>
                </div>
                <textarea autoFocus value={newNoteText} onChange={e => setNewNoteText(e.target.value)}
                  placeholder="在此输入备注内容…"
                  rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-amber-400 mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => setPendingNoteParaId(null)} className="flex-1 py-2 border border-gray-200 text-sm text-gray-500 rounded-lg hover:bg-gray-50">取消</button>
                  <button onClick={saveNote} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors">保存备注</button>
                </div>
              </div>
            </div>
          )}

          {[currentPage, ...(viewMode === 'double' && currentPage < TOTAL_PAGES ? [currentPage + 1] : [])].map(pg => {
            const PC = PAGES[pg - 1];
            return (
              <div key={pg} className="flex-shrink-0 relative"
                style={{ transform: `rotate(${rotation}deg) scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                <div className="w-[620px] min-h-[878px] bg-white shadow-lg rounded-sm p-14 relative">
                  <PC annotations={annotations} activeTool={activeTool} onParaClick={(id, p) => handleParaClick(id, p)} activeNoteId={activeNoteId} />

                  {annotations.filter(a => a.page === pg && a.type === 'note').map(ann => (
                    <div key={ann.id} className="absolute right-3 top-20 group">
                      <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setActiveNoteId(activeNoteId === ann.paraId ? null : ann.paraId)}>
                        <StickyNote className="w-3.5 h-3.5 text-white" />
                      </div>
                      {activeNoteId === ann.paraId && (
                        <div className="absolute right-8 top-0 w-48 bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-2.5 z-10">
                          <p className="text-xs text-amber-800 leading-relaxed">{ann.note}</p>
                          <button onClick={() => { setAnnotations(prev => prev.filter(a => a.id !== ann.id)); setActiveNoteId(null); }}
                            className="text-[10px] text-amber-600 hover:text-red-500 mt-1.5 transition-colors">删除备注</button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="absolute bottom-5 left-0 right-0 text-center text-xs text-gray-400">{pg}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right Panel ── */}
        {rightOpen && (
          <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
            <div className="flex border-b border-gray-100 flex-shrink-0">
              {([
                ['ai', MessageSquare, 'AI问答'],
                ['translate', Languages, '翻译'],
                ['notes', StickyNote, '笔记'],
                ['entities', Tag, '实体'],
                ['molecular', FlaskConical, '分子'],
              ] as const).map(([id, Icon, label]) => (
                <button key={id} onClick={() => setRightTab(id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${rightTab === id ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* AI Q&A */}
            {rightTab === 'ai' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
                  <p className="text-[11px] text-blue-600">基于全文内容回答 · 支持中英文提问</p>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">
                  {chatMsgs.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-gray-500" />}
                      </div>
                      <div className={`flex-1 text-[11.5px] leading-relaxed rounded-xl px-2.5 py-2 whitespace-pre-line ${msg.role === 'assistant' ? 'bg-gray-50 border border-gray-100 text-gray-700' : 'bg-blue-600 text-white'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-2 flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                        <span className="text-[11px] text-gray-400">思考中…</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="px-2 pb-2 flex flex-wrap gap-1 flex-shrink-0">
                  {SUGGEST_QUESTIONS.map(q => (
                    <button key={q} onClick={() => setChatInput(q)}
                      className="text-[10px] bg-gray-50 border border-gray-200 hover:border-blue-300 text-gray-500 hover:text-blue-600 px-2 py-0.5 rounded-full transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
                <div className="px-2 pb-2 flex-shrink-0">
                  <div className="flex gap-1.5 border border-gray-200 rounded-xl px-2.5 py-1.5 focus-within:border-blue-300">
                    <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                      placeholder="提问…" rows={2}
                      className="flex-1 text-xs text-gray-800 resize-none outline-none leading-relaxed placeholder-gray-400" />
                    <button onClick={sendChat} disabled={!chatInput.trim() || isThinking}
                      className="self-end p-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors flex-shrink-0">
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Translation */}
            {rightTab === 'translate' && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <Languages className="w-4 h-4 text-blue-500" />
                  点击文中段落即可触发智能翻译
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] text-gray-500 font-medium">原文（第1页 · Abstract）</div>
                  <div className="p-3 text-[11.5px] text-gray-700 leading-relaxed">Knowledge graph embedding (KGE) aims to represent entities and relations in a knowledge graph as continuous low-dimensional vectors, enabling efficient reasoning and completion.</div>
                </div>
                <div className="border border-blue-100 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-600 font-medium flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5" />中文翻译
                  </div>
                  <div className="p-3 text-[11.5px] text-gray-700 leading-relaxed">知识图谱嵌入（KGE）旨在将知识图谱中的实体和关系表示为连续的低维向量，从而支持高效的推理与补全任务。</div>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[11px] text-gray-500 font-medium">原文（第2页 · 3.1节）</div>
                  <div className="p-3 text-[11.5px] text-gray-700 leading-relaxed">Given a KG G = (ε, R, T) with entity set ε, relation set R, and triple set T, we embed each entity e ∈ ε into a d-dimensional vector e ∈ ℝᵈ.</div>
                </div>
                <div className="border border-blue-100 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-600 font-medium flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" />中文翻译</div>
                  <div className="p-3 text-[11.5px] text-gray-700 leading-relaxed">给定一个知识图谱 G = (ε, R, T)，其中 ε 为实体集合，R 为关系集合，T 为三元组集合，我们将每个实体 e ∈ ε 嵌入为 d 维向量 e ∈ ℝᵈ。</div>
                </div>
              </div>
            )}

            {/* Notes */}
            {rightTab === 'notes' && (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                <button
                  onClick={() => setNoteDialogOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 一键生成笔记
                </button>
                <div className="text-xs text-gray-500 mb-1">{annotations.length} 条标注 · 点击可跳转</div>
                {annotations.map(ann => (
                  <div key={ann.id} className="border border-gray-200 rounded-lg p-2.5 hover:border-gray-300 transition-colors cursor-pointer group"
                    onClick={() => setCurrentPage(ann.page)}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: ann.color }} />
                      <span className="text-[10px] text-gray-500 capitalize">{ann.type === 'highlight' ? '高亮' : ann.type === 'underline' ? '下划线' : ann.type === 'note' ? '备注' : ann.type === 'rect' ? '矩形' : '椭圆'}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">第{ann.page}页</span>
                      <button onClick={e => { e.stopPropagation(); setAnnotations(prev => prev.filter(a => a.id !== ann.id)); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {ann.note && <p className="text-[11px] text-gray-600 leading-relaxed">{ann.note}</p>}
                    <p className="text-[10px] text-gray-400 font-mono">{ann.paraId}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Entities */}
            {rightTab === 'entities' && (
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {/* Legend */}
                <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">实体类型图例</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(ENTITY_TYPE_CONFIG) as [EntityType, typeof ENTITY_TYPE_CONFIG[EntityType]][]).map(([type, cfg]) => (
                      <div key={type} className="flex items-center gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>{cfg.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span className="border-b border-dashed border-gray-400 w-6 inline-block" />
                    悬停预览 · 点击固定浮窗
                  </div>
                </div>

                {/* Entity list by type */}
                <div className="flex-1 overflow-y-auto py-1">
                  {ENTITY_LIST_BY_TYPE.map(({ type, ids }) => {
                    const cfg = ENTITY_TYPE_CONFIG[type];
                    return (
                      <div key={type} className="mb-1">
                        <div className="px-3 py-1.5 flex items-center gap-1.5">
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.badgeClass}`}>{cfg.label}</span>
                          <span className="text-[10px] text-gray-400">{ids.length} 个</span>
                        </div>
                        {ids.map(id => {
                          const entity = ENTITY_DB[id];
                          if (!entity) return null;
                          return (
                            <div key={id} className="mx-2 mb-1 px-2.5 py-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-default">
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-[11.5px] font-medium text-gray-800 leading-tight">{entity.name}</p>
                                <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: cfg.underlineColor }} />
                              </div>
                              <p className="text-[10.5px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{entity.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Molecular extraction */}
            {rightTab === 'molecular' && (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  当前文献为KG方向，未检测到分子活性数据。以下为演示示例。
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-2">分子活性数据提取示例（演示）</div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[10.5px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {['化合物ID', 'IC₅₀(nM)', '活性', '选择性'].map(h => <th key={h} className="text-left px-2 py-2 text-gray-500 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {[['CPD-001', '12.4', '高活性', '8.2x'], ['CPD-002', '45.6', '中活性', '3.1x'], ['CPD-003', '3.8', '极高活性', '15.4x'], ['CPD-004', '189.2', '低活性', '1.2x']].map((row, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="px-2 py-1.5 font-mono text-blue-600">{row[0]}</td>
                            <td className="px-2 py-1.5 font-semibold text-gray-700">{row[1]}</td>
                            <td className="px-2 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${row[2] === '极高活性' ? 'bg-green-100 text-green-700' : row[2] === '高活性' ? 'bg-blue-100 text-blue-700' : row[2] === '中活性' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{row[2]}</span>
                            </td>
                            <td className="px-2 py-1.5 text-gray-600">{row[3]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button className="mt-2 w-full text-xs text-center text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50 rounded-lg py-2 transition-colors flex items-center justify-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />导出为 Excel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <NoteGenerationDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        selectedPapers={[currentPaper]}
      />
    </div>
  );
}
