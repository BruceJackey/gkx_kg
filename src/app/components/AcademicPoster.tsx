import { useState, useEffect, useRef } from 'react';
import {
  FileText, ScrollText, StickyNote, Image, Volume2,
  BookmarkPlus, Download, Play, Pause, ChevronDown,
  ChevronRight, Check, Loader2, RefreshCw, Share2,
  TrendingUp, Printer, BookOpen, Sparkles,
  GalleryHorizontal, Copy, Search, Mic
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type DocType = '文献' | '专利' | '笔记';
type DocFormat = 'PDF' | 'XML' | 'HTML' | 'TXT';
type GenTab = 'poster' | 'audio';

interface KBDoc {
  id: string; type: DocType; format: DocFormat; title: string;
  authors?: string[]; journal?: string; year?: number;
  impactFactor?: number; citations?: number;
  patentNumber?: string; applicant?: string;
  tags: string[]; abstract?: string;
  keywords?: string[];
  methods?: string[];
  results?: { label: string; value: string; delta?: string }[];
  conclusion?: string;
  refs?: string[];
  institution?: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const kbDocs: KBDoc[] = [
  {
    id: 'd1', type: '文献', format: 'PDF',
    title: '基于Transformer的知识图谱嵌入方法研究',
    authors: ['张明', '李华', '王强'], institution: '清华大学计算机科学与技术系',
    journal: 'IEEE TKDE', year: 2024, impactFactor: 8.9, citations: 142,
    tags: ['知识图谱', 'Transformer'],
    keywords: ['知识图谱', 'Transformer', '嵌入表示', '链接预测', '自注意力'],
    abstract: '本文提出了一种新的基于Transformer架构的知识图谱嵌入方法TKGEmbed，有效解决了传统方法在长距离依赖建模方面的不足。实验结果表明，该方法在多个标准知识图谱补全数据集上均取得了优于现有方法的性能。',
    methods: ['引入多头自注意力机制聚合实体邻居上下文', '设计关系感知位置编码区分语义关系类型', '联合训练目标融合对比损失与链接预测损失', '在FB15k-237与WN18RR数据集上验证'],
    results: [
      { label: 'MRR', value: '0.383', delta: '+7.9%' },
      { label: 'Hits@1', value: '0.291', delta: '+5.2%' },
      { label: 'Hits@10', value: '0.567', delta: '+4.6%' },
    ],
    conclusion: '本研究为知识图谱嵌入领域提供了新方向，证明Transformer架构能有效捕获长距离语义依赖。未来将探索多模态扩展与大规模图上的效率优化。',
    refs: ['[1] Bordes et al. TransE, NeurIPS 2013', '[2] Sun et al. RotatE, ICLR 2019', '[3] Vashishth et al. CompGCN, ICLR 2020', '[4] Vaswani et al. Attention Is All You Need, NeurIPS 2017', '[5] Hamilton et al. GraphSAGE, NeurIPS 2017'],
  },
  {
    id: 'd2', type: '文献', format: 'XML',
    title: 'Large Language Models for Scientific Knowledge Extraction',
    authors: ['Chen Wei', 'Liu Yang'], institution: 'Peking University AI Lab',
    journal: 'NeurIPS', year: 2024, impactFactor: 12.4, citations: 389,
    tags: ['LLM', 'NLP'],
    keywords: ['LLM', 'Knowledge Extraction', 'Scientific NLP', 'Information Retrieval'],
    abstract: 'We present a comprehensive study on leveraging large language models for automated scientific knowledge extraction from research papers.',
    methods: ['Prompt engineering for structured extraction', 'Chain-of-thought reasoning over scientific text', 'Multi-stage pipeline: parsing → extraction → validation'],
    results: [
      { label: 'Precision', value: '91.3%', delta: '+6.1%' },
      { label: 'Recall', value: '87.8%', delta: '+4.3%' },
      { label: 'F1', value: '89.5%', delta: '+5.2%' },
    ],
    conclusion: 'LLMs substantially advance scientific knowledge extraction. Future directions include domain adaptation and multi-document synthesis.',
    refs: ['[1] Brown et al. GPT-3, NeurIPS 2020', '[2] Touvron et al. LLaMA 2, arXiv 2023', '[3] Wei et al. CoT, NeurIPS 2022'],
  },
  {
    id: 'd3', type: '文献', format: 'HTML',
    title: '面向科研领域的知识图谱构建与应用综述',
    authors: ['刘芳', '陈志远'], institution: '中国科学院计算技术研究所',
    journal: 'ACM SIGKDD', year: 2023, impactFactor: 7.2, citations: 256,
    tags: ['知识图谱', '综述'],
    keywords: ['知识图谱', '综述', '实体识别', '关系抽取', '知识融合'],
    abstract: '本文系统综述了近年来面向科研领域的知识图谱构建技术与应用场景，重点分析了实体识别、关系抽取、知识融合等核心技术的研究进展。',
    methods: ['文献调研覆盖2018-2023年200余篇核心论文', '按技术体系分类归纳', '对比分析各方法优劣势'],
    results: [
      { label: '覆盖论文数', value: '200+' },
      { label: '技术方向', value: '12项' },
      { label: '数据集汇总', value: '35个' },
    ],
    conclusion: '科研知识图谱技术已趋于成熟，跨模态知识融合与动态更新是未来主要挑战。',
    refs: ['[1] Ji et al. Knowledge Graph Survey, IEEE TKDE 2021', '[2] Cai et al. KGQA Survey, AI Open 2022'],
  },
  {
    id: 'd4', type: '专利', format: 'PDF',
    title: '一种基于深度学习的知识图谱自动构建方法及装置',
    applicant: '清华大学', patentNumber: 'CN202410012345A',
    tags: ['知识图谱', '深度学习'],
    abstract: '本发明涉及一种基于深度学习的知识图谱自动构建方法，包括知识抽取、融合和存储三个核心模块。',
  },
  {
    id: 'd5', type: '专利', format: 'TXT',
    title: '多模态语义理解装置及其专利技术方案分析系统',
    applicant: '北京人工智能研究院', patentNumber: 'CN202310987654B',
    tags: ['多模态', '语义理解'],
    abstract: '本发明涉及多模态语义理解装置，能够处理图像、文本、表格等多种模态的专利文件内容。',
  },
  {
    id: 'd6', type: '文献', format: 'PDF',
    title: 'Graph Neural Networks for Biomedical Knowledge Discovery',
    authors: ['Smith J', 'Johnson M'], institution: 'Stanford Medicine AI Lab',
    journal: 'Nature', year: 2024, impactFactor: 69.5, citations: 1203,
    tags: ['GNN', '生物医学'],
    keywords: ['GNN', 'Biomedical', 'Drug Discovery', 'Protein Interaction'],
    abstract: 'This paper introduces a novel graph neural network architecture specifically designed for biomedical knowledge discovery.',
    methods: ['Heterogeneous graph construction from biomedical ontologies', 'Multi-relational GNN with attention pooling', 'Transfer learning from pre-trained biological embeddings'],
    results: [
      { label: 'AUROC', value: '0.941', delta: '+3.2%' },
      { label: 'AP', value: '0.887', delta: '+2.8%' },
    ],
    conclusion: 'GNNs significantly advance biomedical knowledge discovery. Multi-modal integration remains an open challenge.',
    refs: ['[1] Kipf & Welling, GCN, ICLR 2017', '[2] Veličković et al. GAT, ICLR 2018'],
  },
  {
    id: 'd7', type: '文献', format: 'PDF',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Lewis P', 'Perez E'], institution: 'Facebook AI Research',
    journal: 'NeurIPS', year: 2022, impactFactor: 12.4, citations: 2341,
    tags: ['RAG', 'NLP'],
    keywords: ['RAG', 'Retrieval Augmentation', 'Open Domain QA', 'Parametric Memory'],
    abstract: 'We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG), combining parametric and non-parametric memory for language generation.',
    methods: ['Dense passage retrieval with FAISS index', 'Sequence-to-sequence generation conditioned on retrieved passages', 'End-to-end fine-tuning with marginalised likelihood'],
    results: [
      { label: 'NaturalQ EM', value: '44.5', delta: '+3.6' },
      { label: 'TriviaQA EM', value: '56.8', delta: '+2.1' },
      { label: 'WebQ EM', value: '45.5', delta: '+1.9' },
    ],
    conclusion: 'RAG outperforms parametric-only models on knowledge-intensive tasks and provides verifiable, updateable knowledge access.',
    refs: ['[1] Karpukhin et al. DPR, EMNLP 2020', '[2] Lewis et al. BART, ACL 2020', '[3] Izacard & Grave FiD, EACL 2021'],
  },
  {
    id: 'd8', type: '专利', format: 'PDF',
    title: '医学知识图谱辅助临床决策系统及其数据处理方法',
    applicant: '中科院医学信息研究所', patentNumber: 'CN202211234567A',
    tags: ['医疗', '临床决策'],
    abstract: '本发明提供一种医学知识图谱辅助临床决策系统，通过整合疾病、症状、药物等知识实体。',
  },
  {
    id: 'd9', type: '笔记', format: 'TXT',
    title: '知识图谱领域2024年研究进展整理',
    tags: ['知识图谱', '研究笔记'],
    abstract: '整理了2024年知识图谱领域的主要研究进展，包括嵌入方法、推理、多模态等方向。',
  },
];

const TYPE_CONFIG: Record<DocType, { icon: any; color: string; bg: string }> = {
  '文献': { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  '专利': { icon: ScrollText, color: 'text-amber-600', bg: 'bg-amber-50' },
  '笔记': { icon: StickyNote, color: 'text-green-600', bg: 'bg-green-50' },
};

const POSTER_TEMPLATES = [
  { id: 't1', name: '竖版学术', color: '#2563eb' },
  { id: 't2', name: '横版展示', color: '#7c3aed' },
  { id: 't3', name: '简约现代', color: '#059669' },
  { id: 't4', name: '深色科技', color: '#1e293b' },
];

// ─── Audio script generator ──────────────────────────────────────────────────

function buildAudioScript(doc: KBDoc): string {
  const title = doc.title;
  const journal = doc.journal ? `${doc.journal} ${doc.year ?? ''}年` : (doc.patentNumber ?? '');
  const authorsStr = doc.authors ? doc.authors.slice(0, 3).join('、') : (doc.applicant ?? '');

  const sections: { label: string; text: string }[] = [];

  sections.push({
    label: '开场白',
    text: `欢迎收听本篇文献的音频概览。今天我们来介绍发表于 ${journal} 的论文《${title}》。`,
  });

  if (doc.abstract) {
    sections.push({
      label: '研究背景',
      text: doc.abstract,
    });
  }

  if (doc.methods && doc.methods.length > 0) {
    sections.push({
      label: '核心方法',
      text: `本文提出的核心方法包括：${doc.methods.join('；')}。`,
    });
  }

  if (doc.results && doc.results.length > 0) {
    const resText = doc.results.map(r => `${r.label} 达到 ${r.value}${r.delta ? `（${r.delta}）` : ''}`).join('，');
    sections.push({
      label: '实验结果',
      text: `实验评测表明，${resText}，较已有最优基线有显著提升。`,
    });
  }

  const conclusionText = doc.conclusion ?? `本研究为领域发展提供了新思路，${authorsStr ? authorsStr + '等作者' : ''}后续工作将在更广泛场景中验证方法有效性。`;
  sections.push({
    label: '结语',
    text: `${conclusionText} 感谢收听。`,
  });

  return JSON.stringify(sections);
}

const SECTION_BADGE: Record<string, string> = {
  '开场白': 'bg-gray-100 text-gray-600',
  '研究背景': 'bg-blue-100 text-blue-700',
  '核心方法': 'bg-purple-100 text-purple-700',
  '实验结果': 'bg-green-100 text-green-700',
  '结语': 'bg-gray-100 text-gray-500',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DocRow({ doc, selected, onToggle }: { doc: KBDoc; selected: boolean; onToggle: () => void }) {
  const cfg = TYPE_CONFIG[doc.type];
  const Icon = cfg.icon;
  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
    >
      <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon size={12} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">{doc.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{doc.journal ?? doc.patentNumber ?? doc.type} {doc.year ?? ''}</p>
      </div>
      {selected && <Check size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />}
    </div>
  );
}

function TemplateBox({ tpl, selected, onSelect }: { tpl: typeof POSTER_TEMPLATES[0]; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
    >
      <div style={{ backgroundColor: tpl.color }} className="h-8 w-full" />
      <div className="h-6 bg-white flex flex-col gap-[3px] px-1.5 py-1">
        <div className="h-1 bg-gray-200 rounded-full w-full" />
        <div className="h-1 bg-gray-200 rounded-full w-3/4" />
      </div>
      {selected && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
          <Check size={9} className="text-white" />
        </div>
      )}
      <p className="text-center text-[10px] text-gray-500 py-1 bg-gray-50 border-t border-gray-100">{tpl.name}</p>
    </div>
  );
}

// ─── Poster view ─────────────────────────────────────────────────────────────

function AcademicPosterView({ doc, templateColor }: { doc: KBDoc; templateColor: string }) {
  const isLight = templateColor !== '#1e293b';
  const headerTextColor = isLight ? 'white' : '#e2e8f0';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: templateColor }} className="px-8 py-6">
        <h1 className="text-xl font-bold leading-tight mb-2" style={{ color: headerTextColor }}>
          {doc.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-90" style={{ color: headerTextColor }}>
          {doc.authors && <span>{doc.authors.join(' · ')}</span>}
          {doc.authors && (doc.institution || doc.journal) && <span className="opacity-50">|</span>}
          {doc.institution && <span>{doc.institution}</span>}
          {doc.journal && <span className="font-medium">{doc.journal}</span>}
          {doc.year && <span>{doc.year}</span>}
          {doc.citations && <span>{doc.citations} 引用</span>}
        </div>
      </div>

      {/* Body — two columns */}
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Left column */}
        <div className="p-5 space-y-4">
          {/* Abstract */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateColor }}>摘要</h3>
            <p className="text-xs text-gray-700 leading-relaxed">{doc.abstract}</p>
          </div>

          {/* Keywords */}
          {doc.keywords && doc.keywords.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateColor }}>关键词</h3>
              <div className="flex flex-wrap gap-1">
                {doc.keywords.map(k => (
                  <span key={k} className="px-2 py-0.5 rounded-full text-[11px] border" style={{ borderColor: templateColor, color: templateColor }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Background */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateColor }}>研究背景</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {doc.type === '文献'
                ? `本研究针对${doc.tags[0] ?? '该领域'}中的核心挑战，在现有方法基础上提出改进方案，具有重要的理论和应用价值。`
                : `本专利${doc.applicant ? '由' + doc.applicant + '申请，' : ''}针对相关技术领域提供了创新性的技术方案。`}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="p-5 space-y-4">
          {/* Methods */}
          {doc.methods && doc.methods.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateColor }}>研究方法</h3>
              <ul className="space-y-1">
                {doc.methods.map((m, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: templateColor }} />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateColor }}>技术方案</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{doc.abstract?.slice(0, 80) ?? '—'}</p>
            </div>
          )}

          {/* Results */}
          {doc.results && doc.results.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: templateColor }}>主要结果</h3>
              <div className="grid grid-cols-3 gap-2">
                {doc.results.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
                    <div className="text-base font-bold" style={{ color: templateColor }}>{r.value}</div>
                    <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{r.label}</div>
                    {r.delta && <div className="text-[10px] text-green-600 font-medium mt-0.5">{r.delta}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-5 py-3 bg-gray-50">
        {doc.conclusion && (
          <div className="mb-2">
            <span className="text-xs font-bold mr-1.5" style={{ color: templateColor }}>结论与展望</span>
            <span className="text-xs text-gray-600">{doc.conclusion}</span>
          </div>
        )}
        {doc.refs && doc.refs.length > 0 && (
          <p className="text-[11px] text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-500">参考文献：</span>
            {doc.refs.join('  ')}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Audio Card ───────────────────────────────────────────────────────────────

interface AudioCard {
  docId: string;
  title: string;
  journal: string;
  duration: string;
  scriptJson: string;
  playing: boolean;
  progress: number; // 0-100
  expanded: boolean;
}

function AudioCardView({
  card,
  onTogglePlay,
  onToggleExpand,
  onCopyScript,
}: {
  card: AudioCard;
  onTogglePlay: () => void;
  onToggleExpand: () => void;
  onCopyScript: () => void;
}) {
  const sections: { label: string; text: string }[] = JSON.parse(card.scriptJson);
  const totalSecs = 204; // fixed 3:24 for demo
  const elapsed = Math.round((card.progress / 100) * totalSecs);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Volume2 size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{card.title}</p>
          <p className="text-xs text-gray-400">{card.journal} · {card.duration}</p>
        </div>
        <button
          onClick={onTogglePlay}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-colors"
          style={{ backgroundColor: '#2563eb' }}
        >
          {card.playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      {/* Player */}
      <div className="px-4 py-2 flex items-center gap-3 bg-gray-50">
        <span className="text-[11px] text-gray-500 w-10 text-right tabular-nums">{fmt(elapsed)}</span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${card.progress}%`, backgroundColor: '#2563eb' }}
          />
        </div>
        <span className="text-[11px] text-gray-400 w-10 tabular-nums">{fmt(totalSecs)}</span>
      </div>

      {/* Script section */}
      <div>
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>脚本</span>
          {card.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {card.expanded && (
          <div className="px-4 pb-4 space-y-3">
            {sections.map((sec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 mt-0.5 ${SECTION_BADGE[sec.label] ?? 'bg-gray-100 text-gray-500'}`}>
                  {sec.label}
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">{sec.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-100 bg-gray-50">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Download size={12} /> 下载音频
        </button>
        <button
          onClick={onCopyScript}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Copy size={12} /> 复制脚本
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <BookmarkPlus size={12} /> 保存到知识库
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AcademicPoster() {
  // ── Left panel state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all');
  const [selectedDocId, setSelectedDocId] = useState<string | null>('d1');

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<GenTab>('poster');

  // ── Poster state ──
  const [selectedTemplate, setSelectedTemplate] = useState(POSTER_TEMPLATES[0].id);
  const [posterGenerated, setPosterGenerated] = useState(true);
  const [posterGenerating, setPosterGenerating] = useState(false);

  // ── Audio state ──
  const [audioCards, setAudioCards] = useState<AudioCard[]>([]);
  const [generatingAudioForIds, setGeneratingAudioForIds] = useState<Set<string>>(new Set());
  const progressTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Pre-generate audio cards for d1 and d7 on mount
  useEffect(() => {
    const preload = ['d1', 'd7'].map(id => {
      const doc = kbDocs.find(d => d.id === id)!;
      return {
        docId: id,
        title: doc.title,
        journal: doc.journal ? `${doc.journal} ${doc.year ?? ''}` : (doc.patentNumber ?? ''),
        duration: '03:24',
        scriptJson: buildAudioScript(doc),
        playing: false,
        progress: 0,
        expanded: true,
      } satisfies AudioCard;
    });
    setAudioCards(preload);
  }, []);

  // Progress ticker
  useEffect(() => {
    audioCards.forEach(card => {
      if (card.playing && !progressTimers.current.has(card.docId)) {
        const timer = setInterval(() => {
          setAudioCards(prev =>
            prev.map(c =>
              c.docId === card.docId
                ? { ...c, progress: Math.min(100, c.progress + 0.5) }
                : c
            )
          );
        }, 170);
        progressTimers.current.set(card.docId, timer);
      } else if (!card.playing && progressTimers.current.has(card.docId)) {
        clearInterval(progressTimers.current.get(card.docId)!);
        progressTimers.current.delete(card.docId);
      }
    });
  }, [audioCards]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      progressTimers.current.forEach(t => clearInterval(t));
    };
  }, []);

  const filteredDocs = kbDocs.filter(doc => {
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesSearch = !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const selectedDoc = kbDocs.find(d => d.id === selectedDocId) ?? null;
  const templateColor = POSTER_TEMPLATES.find(t => t.id === selectedTemplate)?.color ?? '#2563eb';

  function handleGeneratePoster() {
    if (!selectedDoc) return;
    setPosterGenerating(true);
    setTimeout(() => {
      setPosterGenerating(false);
      setPosterGenerated(true);
    }, 1800);
  }

  function handleGenerateAudio() {
    if (!selectedDoc) return;
    const id = selectedDoc.id;
    if (audioCards.some(c => c.docId === id) || generatingAudioForIds.has(id)) return;
    setGeneratingAudioForIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      const card: AudioCard = {
        docId: id,
        title: selectedDoc.title,
        journal: selectedDoc.journal ? `${selectedDoc.journal} ${selectedDoc.year ?? ''}` : (selectedDoc.patentNumber ?? ''),
        duration: '03:24',
        scriptJson: buildAudioScript(selectedDoc),
        playing: false,
        progress: 0,
        expanded: true,
      };
      setAudioCards(prev => [card, ...prev]);
      setGeneratingAudioForIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 2000);
  }

  function togglePlay(docId: string) {
    setAudioCards(prev => prev.map(c => c.docId === docId ? { ...c, playing: !c.playing } : c));
  }

  function toggleExpand(docId: string) {
    setAudioCards(prev => prev.map(c => c.docId === docId ? { ...c, expanded: !c.expanded } : c));
  }

  function copyScript(docId: string) {
    const card = audioCards.find(c => c.docId === docId);
    if (!card) return;
    const sections: { label: string; text: string }[] = JSON.parse(card.scriptJson);
    const text = sections.map(s => `[${s.label}] ${s.text}`).join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">

      {/* ── Left panel: KB picker ─────────────────────────────────────────── */}
      <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-3">
            <BookOpen size={14} className="text-blue-600" /> 知识库文献
          </h2>
          {/* Search */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索文献..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          {/* Type filter */}
          <div className="flex gap-1">
            {(['all', '文献', '专利', '笔记'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex-1 py-1 text-[11px] rounded-md transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {t === 'all' ? '全部' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Doc list */}
        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {filteredDocs.map(doc => (
            <DocRow
              key={doc.id}
              doc={doc}
              selected={selectedDocId === doc.id}
              onToggle={() => {
                setSelectedDocId(prev => prev === doc.id ? null : doc.id);
                setPosterGenerated(false);
              }}
            />
          ))}
          {filteredDocs.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">无匹配文献</p>
          )}
        </div>

        {/* Selection summary */}
        <div className="border-t border-gray-100 p-3">
          {selectedDoc ? (
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-[11px] font-semibold text-blue-700 mb-0.5">已选文献</p>
              <p className="text-[11px] text-blue-600 line-clamp-2 leading-tight">{selectedDoc.title}</p>
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 text-center py-1">未选择文献</p>
          )}
        </div>
      </div>

      {/* ── Right area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Tab bar */}
        <div className="bg-white border-b border-gray-200 px-6 pt-4 flex-shrink-0">
          <div className="flex gap-1">
            {([
              { id: 'poster' as GenTab, label: '学术海报', icon: Image },
              { id: 'audio' as GenTab, label: '音频概览', icon: Mic },
            ]).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">

          {/* ── Poster tab ───────────────────────────────────────────────── */}
          {activeTab === 'poster' && (
            <div className="flex h-full">
              {/* Config panel */}
              <div className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col gap-4 p-4 overflow-y-auto">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">选择模板</p>
                  <div className="grid grid-cols-2 gap-2">
                    {POSTER_TEMPLATES.map(tpl => (
                      <TemplateBox
                        key={tpl.id}
                        tpl={tpl}
                        selected={selectedTemplate === tpl.id}
                        onSelect={() => { setSelectedTemplate(tpl.id); setPosterGenerated(false); }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">来源文献</p>
                  {selectedDoc ? (
                    <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 line-clamp-2 leading-snug">
                      {selectedDoc.title}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                      未选择文献
                    </p>
                  )}
                </div>

                <button
                  onClick={handleGeneratePoster}
                  disabled={!selectedDoc || posterGenerating}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  {posterGenerating ? (
                    <><Loader2 size={14} className="animate-spin" /> 生成中…</>
                  ) : (
                    <><Sparkles size={14} /> 生成海报</>
                  )}
                </button>

                {posterGenerated && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">导出</p>
                    <button className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download size={12} /> 下载 PNG
                    </button>
                    <button className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Printer size={12} /> 导出 PDF
                    </button>
                    <button className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Share2 size={12} /> 分享
                    </button>
                    <button
                      onClick={handleGeneratePoster}
                      className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <RefreshCw size={12} /> 重新生成
                    </button>
                  </div>
                )}
              </div>

              {/* Poster preview area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {posterGenerating && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-sm">正在生成学术海报…</p>
                  </div>
                )}

                {!posterGenerating && posterGenerated && selectedDoc && (
                  <AcademicPosterView doc={selectedDoc} templateColor={templateColor} />
                )}

                {!posterGenerating && !posterGenerated && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-300">
                    <GalleryHorizontal size={48} />
                    <div className="text-center">
                      <p className="text-base font-medium text-gray-400">
                        {selectedDoc ? '点击"生成海报"创建学术海报' : '请先从左侧选择文献'}
                      </p>
                      <p className="text-sm text-gray-300 mt-1">支持4种模板，自动提取摘要、方法、结果等内容</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Audio tab ────────────────────────────────────────────────── */}
          {activeTab === 'audio' && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
                <p className="text-sm text-gray-600">
                  {selectedDoc ? (
                    <span>已选：<span className="font-medium text-gray-900 line-clamp-1 max-w-xs inline-block align-bottom">{selectedDoc.title}</span></span>
                  ) : (
                    <span className="text-gray-400">未选择文献</span>
                  )}
                </p>
                <button
                  onClick={handleGenerateAudio}
                  disabled={!selectedDoc || !!generatingAudioForIds.size || audioCards.some(c => c.docId === selectedDoc?.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  {generatingAudioForIds.size > 0 ? (
                    <><Loader2 size={14} className="animate-spin" /> 生成脚本中…</>
                  ) : (
                    <><Mic size={14} /> 生成音频脚本</>
                  )}
                </button>
              </div>

              {/* Cards list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Loading placeholders */}
                {Array.from(generatingAudioForIds).map(id => {
                  const doc = kbDocs.find(d => d.id === id);
                  return (
                    <div key={id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                      <Loader2 size={18} className="animate-spin text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 line-clamp-1">{doc?.title ?? id}</p>
                        <p className="text-xs text-blue-500 mt-0.5">正在生成音频脚本…</p>
                      </div>
                    </div>
                  );
                })}

                {audioCards.map(card => (
                  <AudioCardView
                    key={card.docId}
                    card={card}
                    onTogglePlay={() => togglePlay(card.docId)}
                    onToggleExpand={() => toggleExpand(card.docId)}
                    onCopyScript={() => copyScript(card.docId)}
                  />
                ))}

                {audioCards.length === 0 && generatingAudioForIds.size === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-300 pt-20">
                    <Volume2 size={48} />
                    <div className="text-center">
                      <p className="text-base font-medium text-gray-400">选择文献并点击"生成音频脚本"</p>
                      <p className="text-sm text-gray-300 mt-1">自动生成播客风格的文献音频概览</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
