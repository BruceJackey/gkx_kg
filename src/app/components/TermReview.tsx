import { useState, useMemo, useEffect } from 'react';
import {
  Check, X, Search, Tag, Clock, CheckCircle2, XCircle,
  AlertCircle, BarChart3, GitBranch, Layers,
  ChevronRight, FileText, ChevronDown, Sparkles,
  AlertTriangle, ShieldCheck, Link2,
  Edit2, Plus, Trash2, Merge, CalendarDays, Users, MapPin, Newspaper,
  MousePointer, Database, RefreshCw
} from 'lucide-react';

// ─── Shared types ─────────────────────────────────────────────────────────────

type ReviewStatus = 'pending' | 'accepted' | 'rejected';

// ─── Seed term types & data ───────────────────────────────────────────────────

interface SeedTerm {
  id: string; term: string; domain: string[];
  confidenceScore: number; seedScore: number; propagatedScore: number;
  neighborCount: number; source: string; frequency: number;
  status: ReviewStatus; reviewedAt?: string;
}

const mockTerms: SeedTerm[] = [
  { id: 'T001', term: '知识图谱嵌入', domain: ['知识图谱', '表示学习'], confidenceScore: 0.94, seedScore: 0.82, propagatedScore: 0.12, neighborCount: 8, source: 'TextRank++', frequency: 1243, status: 'pending' },
  { id: 'T002', term: '实体对齐', domain: ['知识融合'], confidenceScore: 0.91, seedScore: 0.78, propagatedScore: 0.13, neighborCount: 6, source: 'TextRank++', frequency: 876, status: 'pending' },
  { id: 'T003', term: '关系抽取', domain: ['信息抽取', 'NLP'], confidenceScore: 0.89, seedScore: 0.80, propagatedScore: 0.09, neighborCount: 11, source: 'NewTermMining', frequency: 2105, status: 'accepted' },
  { id: 'T004', term: '图神经网络', domain: ['深度学习', '图学习'], confidenceScore: 0.87, seedScore: 0.75, propagatedScore: 0.12, neighborCount: 9, source: 'TextRank++', frequency: 1587, status: 'pending' },
  { id: 'T005', term: '命名实体识别', domain: ['NLP', '信息抽取'], confidenceScore: 0.85, seedScore: 0.79, propagatedScore: 0.06, neighborCount: 7, source: 'NewTermMining', frequency: 1934, status: 'accepted' },
  { id: 'T006', term: '知识补全', domain: ['知识图谱'], confidenceScore: 0.83, seedScore: 0.71, propagatedScore: 0.12, neighborCount: 5, source: 'TextRank++', frequency: 743, status: 'pending' },
  { id: 'T007', term: '多跳推理', domain: ['知识推理'], confidenceScore: 0.80, seedScore: 0.68, propagatedScore: 0.12, neighborCount: 4, source: 'NewTermMining', frequency: 612, status: 'pending' },
  { id: 'T008', term: '时序知识图谱', domain: ['知识图谱', '时序分析'], confidenceScore: 0.78, seedScore: 0.66, propagatedScore: 0.12, neighborCount: 6, source: 'TextRank++', frequency: 489, status: 'pending' },
  { id: 'T009', term: '跨语言知识融合', domain: ['知识融合', '多语言'], confidenceScore: 0.75, seedScore: 0.63, propagatedScore: 0.12, neighborCount: 3, source: 'TextRank++', frequency: 321, status: 'rejected' },
  { id: 'T010', term: '本体学习', domain: ['本体工程'], confidenceScore: 0.73, seedScore: 0.61, propagatedScore: 0.12, neighborCount: 5, source: 'NewTermMining', frequency: 298, status: 'pending' },
  { id: 'T011', term: '图表示学习', domain: ['深度学习', '图学习'], confidenceScore: 0.70, seedScore: 0.59, propagatedScore: 0.11, neighborCount: 7, source: 'TextRank++', frequency: 567, status: 'pending' },
  { id: 'T012', term: '属性抽取', domain: ['信息抽取'], confidenceScore: 0.68, seedScore: 0.58, propagatedScore: 0.10, neighborCount: 4, source: 'NewTermMining', frequency: 412, status: 'pending' },
  { id: 'T013', term: '语义角色标注', domain: ['NLP'], confidenceScore: 0.65, seedScore: 0.57, propagatedScore: 0.08, neighborCount: 3, source: 'TextRank++', frequency: 234, status: 'pending' },
  { id: 'T014', term: '共指消解', domain: ['NLP'], confidenceScore: 0.62, seedScore: 0.54, propagatedScore: 0.08, neighborCount: 2, source: 'NewTermMining', frequency: 187, status: 'rejected' },
  { id: 'T015', term: '零样本学习', domain: ['深度学习'], confidenceScore: 0.58, seedScore: 0.50, propagatedScore: 0.08, neighborCount: 4, source: 'TextRank++', frequency: 356, status: 'pending' },
];

// ─── Hyponymy relation types & data ──────────────────────────────────────────

interface SimilarCase {
  child: string; parent: string; confidence: number;
}

interface ConflictInfo {
  type: 'circular' | 'inconsistent';
  description: string;
  path: string;   // e.g. "A → B → C → A"
}

interface HyponymyRelation {
  id: string;
  child: string;
  parent: string;
  confidenceScore: number;
  evidence: string;
  evidenceHighlight: string;
  source: string;
  algorithm: string;
  status: ReviewStatus;
  reviewedAt?: string;
  similarCases: SimilarCase[];    // 相似已确认案例
  conflict?: ConflictInfo;        // 冲突检测（无则为undefined）
}

const mockRelations: HyponymyRelation[] = [
  { id: 'R001', child: '知识图谱嵌入', parent: '表示学习', confidenceScore: 0.95, evidence: '近年来，知识图谱嵌入作为表示学习的重要研究方向，已在链接预测等任务中取得显著成果。', evidenceHighlight: '知识图谱嵌入作为表示学习的重要研究方向', source: '基于Transformer的知识图谱嵌入方法研究', algorithm: 'PatternMatcher', status: 'pending',
    similarCases: [{ child: '词向量嵌入', parent: '表示学习', confidence: 0.97 }, { child: '图嵌入', parent: '表示学习', confidence: 0.93 }, { child: '实体嵌入', parent: '表示学习', confidence: 0.91 }],
    conflict: undefined },
  { id: 'R002', child: '图神经网络', parent: '深度学习', confidenceScore: 0.93, evidence: '图神经网络是深度学习在图结构数据上的重要扩展，能够直接处理非欧几里得空间的数据。', evidenceHighlight: '图神经网络是深度学习在图结构数据上的重要扩展', source: 'Graph Neural Networks for Biomedical Knowledge Discovery', algorithm: 'PatternMatcher', status: 'pending',
    similarCases: [{ child: '卷积神经网络', parent: '深度学习', confidence: 0.98 }, { child: '循环神经网络', parent: '深度学习', confidence: 0.96 }, { child: '图卷积网络', parent: '深度学习', confidence: 0.90 }],
    conflict: undefined },
  { id: 'R003', child: 'Transformer', parent: '注意力机制模型', confidenceScore: 0.91, evidence: 'Transformer模型通过多头自注意力机制实现了对序列数据的高效建模，是注意力机制模型的代表性架构。', evidenceHighlight: 'Transformer模型通过多头自注意力机制实现了对序列数据的高效建模', source: '基于Transformer的知识图谱嵌入方法研究', algorithm: 'HypernymExtractor', status: 'accepted',
    similarCases: [{ child: 'BERT', parent: '注意力机制模型', confidence: 0.95 }, { child: 'GPT', parent: '注意力机制模型', confidence: 0.93 }],
    conflict: undefined },
  { id: 'R004', child: '关系抽取', parent: '信息抽取', confidenceScore: 0.89, evidence: '关系抽取是信息抽取的核心子任务，旨在从文本中识别实体对之间的语义关系。', evidenceHighlight: '关系抽取是信息抽取的核心子任务', source: 'Large Language Models for Scientific Knowledge Extraction', algorithm: 'HypernymExtractor', status: 'accepted',
    similarCases: [{ child: '实体识别', parent: '信息抽取', confidence: 0.98 }, { child: '事件抽取', parent: '信息抽取', confidence: 0.92 }],
    conflict: undefined },
  { id: 'R005', child: 'RAG', parent: '检索增强生成', confidenceScore: 0.88, evidence: 'RAG（Retrieval-Augmented Generation）即检索增强生成，是一种将外部知识检索与语言生成相结合的方法。', evidenceHighlight: 'RAG（Retrieval-Augmented Generation）即检索增强生成', source: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', algorithm: 'PatternMatcher', status: 'pending',
    similarCases: [{ child: '知识增强生成', parent: '检索增强生成', confidence: 0.86 }, { child: '文档检索生成', parent: '检索增强生成', confidence: 0.83 }],
    conflict: { type: 'inconsistent', description: '本体中已存在「RAG」作为「生成式AI」的子概念，与当前父概念「检索增强生成」之间存在层级不一致。', path: 'RAG → 生成式AI（已有） vs RAG → 检索增强生成（待接受）' } },
  { id: 'R006', child: '药物-靶点相互作用预测', parent: '生物医学知识发现', confidenceScore: 0.85, evidence: '药物-靶点相互作用预测是生物医学知识发现的关键应用场景，直接服务于新药研发流程。', evidenceHighlight: '药物-靶点相互作用预测是生物医学知识发现的关键应用场景', source: 'Graph Neural Networks for Biomedical Knowledge Discovery', algorithm: 'HypernymExtractor', status: 'pending',
    similarCases: [{ child: '蛋白质功能预测', parent: '生物医学知识发现', confidence: 0.88 }, { child: '疾病基因关联预测', parent: '生物医学知识发现', confidence: 0.84 }],
    conflict: undefined },
  { id: 'R007', child: '知识图谱补全', parent: '知识图谱', confidenceScore: 0.83, evidence: '知识图谱补全是知识图谱研究的核心问题之一，通过推断缺失的三元组来提升图谱完整性。', evidenceHighlight: '知识图谱补全是知识图谱研究的核心问题之一', source: '面向科研领域的知识图谱构建与应用综述', algorithm: 'PatternMatcher', status: 'pending',
    similarCases: [{ child: '知识图谱嵌入', parent: '知识图谱', confidence: 0.87 }, { child: '实体链接', parent: '知识图谱', confidence: 0.82 }, { child: '关系推理', parent: '知识图谱', confidence: 0.80 }],
    conflict: { type: 'circular', description: '检测到潜在循环继承：接受此关系后，本体中将形成「知识图谱 → 知识图谱补全 → 知识图谱嵌入 → 知识图谱」的循环路径。', path: '知识图谱 → 知识图谱补全 → 知识图谱嵌入 → 知识图谱（循环）' } },
  { id: 'R008', child: 'BERT-KG', parent: '预训练语言模型', confidenceScore: 0.80, evidence: 'BERT-KG是一种预训练语言模型，通过引入图谱结构知识对BERT进行增强，提升下游任务表现。', evidenceHighlight: 'BERT-KG是一种预训练语言模型', source: 'BERT-KG: Pre-trained Language Models Meet Knowledge Graphs', algorithm: 'HypernymExtractor', status: 'pending',
    similarCases: [{ child: 'BERT', parent: '预训练语言模型', confidence: 0.99 }, { child: 'GPT-4', parent: '预训练语言模型', confidence: 0.97 }, { child: 'LLaMA', parent: '预训练语言模型', confidence: 0.95 }],
    conflict: undefined },
  { id: 'R009', child: '链接预测', parent: '知识图谱推理', confidenceScore: 0.78, evidence: '链接预测作为知识图谱推理的典型任务，目标是预测图谱中缺失的实体间关系。', evidenceHighlight: '链接预测作为知识图谱推理的典型任务', source: '基于Transformer的知识图谱嵌入方法研究', algorithm: 'PatternMatcher', status: 'rejected',
    similarCases: [{ child: '三元组分类', parent: '知识图谱推理', confidence: 0.82 }, { child: '关系路径推理', parent: '知识图谱推理', confidence: 0.79 }],
    conflict: undefined },
  { id: 'R010', child: '对比学习', parent: '自监督学习', confidenceScore: 0.75, evidence: '对比学习是自监督学习的主流范式之一，通过最大化正样本对相似度、最小化负样本对相似度来学习表示。', evidenceHighlight: '对比学习是自监督学习的主流范式之一', source: 'Cross-lingual Knowledge Graph Alignment via Contrastive Learning', algorithm: 'HypernymExtractor', status: 'pending',
    similarCases: [{ child: 'SimCLR', parent: '自监督学习', confidence: 0.91 }, { child: 'MoCo', parent: '自监督学习', confidence: 0.88 }],
    conflict: undefined },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 0.85) return { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (score >= 0.70) return { bar: 'bg-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  return { bar: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: any }> = {
  pending:  { label: '待审核', color: 'text-blue-600 bg-blue-50 border-blue-200',    icon: Clock },
  accepted: { label: '已接受', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'text-red-500 bg-red-50 border-red-200',       icon: XCircle },
};

type ReviewType = 'seed-term' | 'hyponymy' | 'event-review' | 'entity-recognition';

const REVIEW_TYPES: { id: ReviewType; label: string; icon: any }[] = [
  { id: 'seed-term',          label: '种子术语审核',   icon: Tag },
  { id: 'hyponymy',           label: '上下位关系管理', icon: GitBranch },
  { id: 'event-review',       label: '术语/事件优化',  icon: CalendarDays },
  { id: 'entity-recognition', label: '冲突管理',       icon: AlertTriangle },
];

// ─── Seed Term Panel ──────────────────────────────────────────────────────────

export function SeedTermPanel() {
  const [terms, setTerms] = useState<SeedTerm[]>(mockTerms);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);

  const sources = ['all', ...Array.from(new Set(terms.map(t => t.source)))];

  const filtered = useMemo(() => terms.filter(t =>
    (statusFilter === 'all' || t.status === statusFilter) &&
    (sourceFilter === 'all' || t.source === sourceFilter) &&
    (!searchQuery || t.term.includes(searchQuery) || t.domain.some(d => d.includes(searchQuery))) &&
    t.confidenceScore >= minScore
  ), [terms, statusFilter, sourceFilter, searchQuery, minScore]);

  const stats = { pending: terms.filter(t => t.status === 'pending').length, accepted: terms.filter(t => t.status === 'accepted').length, rejected: terms.filter(t => t.status === 'rejected').length };

  const updateStatus = (ids: string[], status: ReviewStatus) => {
    setTerms(prev => prev.map(t => ids.includes(t.id) ? { ...t, status, reviewedAt: new Date().toLocaleString('zh-CN') } : t));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPageSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id));
  const toggleAll = () => {
    if (allPageSelected) setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(t => n.delete(t.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(t => n.add(t.id)); return n; });
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: '待审核', value: stats.pending, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: '已接受', value: stats.accepted, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
          { label: '已拒绝', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-50', border: 'border-red-100' },
          { label: '平均置信度', value: `${(terms.reduce((s, t) => s + t.confidenceScore, 0) / terms.length * 100).toFixed(0)}%`, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-xl px-4 py-3 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div><div className="text-xl font-semibold text-gray-900">{s.value}</div><div className="text-xs text-gray-400">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索术语或领域…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-48 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:border-blue-400">
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="accepted">已接受</option>
          <option value="rejected">已拒绝</option>
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:border-blue-400">
          {sources.map(s => <option key={s} value={s}>{s === 'all' ? '全部来源' : s}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs">置信度 ≥</span>
          <input type="range" min={0} max={0.9} step={0.05} value={minScore}
            onChange={e => setMinScore(+e.target.value)} className="w-20 accent-blue-500 h-1" />
          <span className="text-xs text-gray-600 w-8">{(minScore * 100).toFixed(0)}%</span>
        </div>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} 条结果</span>
      </div>

      {/* Bulk action */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-shrink-0">
          <span className="text-sm text-blue-700 font-medium">已选 {selectedIds.size} 条</span>
          <div className="flex-1" />
          <button onClick={() => updateStatus([...selectedIds], 'accepted')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"><Check className="w-3.5 h-3.5" />批量接受</button>
          <button onClick={() => updateStatus([...selectedIds], 'rejected')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"><X className="w-3.5 h-3.5" />批量拒绝</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
        <div className="flex items-center gap-3 px-4 py-2 text-[11px] text-gray-400 uppercase tracking-wider flex-shrink-0">
          <div onClick={toggleAll} className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center ${allPageSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-gray-500'}`}>
            {allPageSelected && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="flex-1">术语 / 领域</span>
          <span className="w-48">置信度</span>
          <span className="w-20 text-center">状态</span>
          <span className="w-32 text-center">操作</span>
        </div>

        {filtered.map(term => {
          const sc = scoreColor(term.confidenceScore);
          const sc2 = STATUS_CONFIG[term.status];
          const isExpanded = expandedId === term.id;
          const isSelected = selectedIds.has(term.id);
          return (
            <div key={term.id} className={`bg-white border rounded-xl overflow-hidden transition-colors flex-shrink-0 ${isSelected ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div onClick={() => toggleSelect(term.id)} className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-gray-500'}`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{term.term}</span>
                    {term.domain.map(d => <span key={d} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{d}</span>)}
                  </div>
                  <div className="text-[11px] text-gray-400">{term.source} · 出现 {term.frequency.toLocaleString()} 次 · {term.neighborCount} 个邻居影响</div>
                </div>
                <div className="w-48 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-semibold ${sc.text}`}>{(term.confidenceScore * 100).toFixed(0)}%</span>
                    <button onClick={() => setExpandedId(isExpanded ? null : term.id)} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                      <GitBranch className="w-3 h-3" />溯源<ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${term.confidenceScore * 100}%` }} /></div>
                </div>
                <div className="w-20 flex justify-center flex-shrink-0">
                  <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${sc2.color}`}><sc2.icon className="w-3 h-3" />{sc2.label}</span>
                </div>
                <div className="w-32 flex items-center gap-1.5 justify-center flex-shrink-0">
                  {term.status !== 'accepted' && <button onClick={() => updateStatus([term.id], 'accepted')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"><Check className="w-3 h-3" />接受</button>}
                  {term.status !== 'rejected' && <button onClick={() => updateStatus([term.id], 'rejected')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-3 h-3" />拒绝</button>}
                  {term.status !== 'pending' && <button onClick={() => updateStatus([term.id], 'pending')} className="text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1.5 rounded-lg">撤回</button>}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex gap-4">
                  {[{ label: '种子得分', value: term.seedScore, desc: '算法初始评分' }, { label: '图传播得分', value: term.propagatedScore, desc: `${term.neighborCount} 个相邻术语影响` }, { label: '最终得分', value: term.confidenceScore, desc: '综合置信度', highlight: true }].map(item => (
                    <div key={item.label} className={`flex-1 rounded-lg p-2.5 border ${item.highlight ? `${sc.bg} ${sc.border}` : 'bg-white border-gray-200'}`}>
                      <div className={`text-sm font-semibold mb-0.5 ${item.highlight ? sc.text : 'text-gray-700'}`}>{(item.value * 100).toFixed(1)}%</div>
                      <div className="text-[10px] text-gray-500 font-medium">{item.label}</div>
                      <div className="text-[10px] text-gray-400">{item.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hyponymy Panel ───────────────────────────────────────────────────────────

export function HyponymyPanel() {
  const [relations, setRelations] = useState<HyponymyRelation[]>(mockRelations);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [algoFilter, setAlgoFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const algos = ['all', ...Array.from(new Set(relations.map(r => r.algorithm)))];

  const filtered = useMemo(() => relations.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (algoFilter === 'all' || r.algorithm === algoFilter) &&
    (!searchQuery || r.child.includes(searchQuery) || r.parent.includes(searchQuery))
  ), [relations, statusFilter, algoFilter, searchQuery]);

  const stats = { pending: relations.filter(r => r.status === 'pending').length, accepted: relations.filter(r => r.status === 'accepted').length, rejected: relations.filter(r => r.status === 'rejected').length };

  const updateStatus = (ids: string[], status: ReviewStatus) => {
    setRelations(prev => prev.map(r => ids.includes(r.id) ? { ...r, status, reviewedAt: new Date().toLocaleString('zh-CN') } : r));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPageSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id));
  const toggleAll = () => {
    if (allPageSelected) setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(r => n.delete(r.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(r => n.add(r.id)); return n; });
  };

  const highlightEvidence = (text: string, highlight: string) => {
    const idx = text.indexOf(highlight);
    if (idx === -1) return <span className="text-xs text-gray-700 leading-relaxed">{text}</span>;
    return (
      <span className="text-xs text-gray-700 leading-relaxed">
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">{highlight}</mark>
        {text.slice(idx + highlight.length)}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: '待审核', value: stats.pending, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: '已接受', value: stats.accepted, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
          { label: '已拒绝', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-50', border: 'border-red-100' },
          { label: '候选关系总数', value: relations.length, icon: GitBranch, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-xl px-4 py-3 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div><div className="text-xl font-semibold text-gray-900">{s.value}</div><div className="text-xs text-gray-400">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索子概念或父概念…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-52 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:border-blue-400">
          <option value="all">全部状态</option>
          <option value="pending">待审核</option>
          <option value="accepted">已接受</option>
          <option value="rejected">已拒绝</option>
        </select>
        <select value={algoFilter} onChange={e => setAlgoFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:border-blue-400">
          {algos.map(a => <option key={a} value={a}>{a === 'all' ? '全部算法' : a}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} 条关系</span>
      </div>

      {/* Bulk action */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-shrink-0">
          <span className="text-sm text-blue-700 font-medium">已选 {selectedIds.size} 条</span>
          <div className="flex-1" />
          <button onClick={() => updateStatus([...selectedIds], 'accepted')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"><Check className="w-3.5 h-3.5" />批量接受</button>
          <button onClick={() => updateStatus([...selectedIds], 'rejected')} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"><X className="w-3.5 h-3.5" />批量拒绝</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table header */}
      <div className="flex items-center gap-3 px-4 py-2 text-[11px] text-gray-400 uppercase tracking-wider flex-shrink-0">
        <div onClick={toggleAll} className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center ${allPageSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-gray-500'}`}>
          {allPageSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        <span className="w-36">子概念</span>
        <span className="w-36">父概念</span>
        <span className="w-28">置信度</span>
        <span className="flex-1">证据句子（点击展开）</span>
        <span className="w-20 text-center">状态</span>
        <span className="w-32 text-center">操作</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <AlertCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">未找到匹配的关系</p>
          </div>
        ) : filtered.map(rel => {
          const sc = scoreColor(rel.confidenceScore);
          const sc2 = STATUS_CONFIG[rel.status];
          const isExpanded = expandedId === rel.id;
          const isSelected = selectedIds.has(rel.id);
          return (
            <div key={rel.id} className={`bg-white border rounded-xl overflow-hidden transition-colors flex-shrink-0 ${isSelected ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : rel.id)}>
                <div onClick={e => { e.stopPropagation(); toggleSelect(rel.id); }}
                  className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-gray-500'}`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Child concept */}
                <div className="w-36 flex-shrink-0">
                  <span className="text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">{rel.child}</span>
                </div>

                {/* Relation arrow + parent */}
                <div className="w-36 flex-shrink-0 flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-2 py-0.5 truncate">{rel.parent}</span>
                </div>

                {/* Score */}
                <div className="w-28 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-semibold ${sc.text}`}>{(rel.confidenceScore * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-gray-400">{rel.algorithm}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${sc.bar}`} style={{ width: `${rel.confidenceScore * 100}%` }} /></div>
                </div>

                {/* Evidence preview */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 line-clamp-1">{rel.evidence}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-blue-500">
                    <FileText className="w-3 h-3" />{rel.source}
                    <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Status */}
                <div className="w-20 flex justify-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${sc2.color}`}><sc2.icon className="w-3 h-3" />{sc2.label}</span>
                </div>

                {/* Actions */}
                <div className="w-32 flex items-center gap-1.5 justify-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {rel.status !== 'accepted' && <button onClick={() => updateStatus([rel.id], 'accepted')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"><Check className="w-3 h-3" />接受</button>}
                  {rel.status !== 'rejected' && <button onClick={() => updateStatus([rel.id], 'rejected')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-3 h-3" />拒绝</button>}
                  {rel.status !== 'pending' && <button onClick={() => updateStatus([rel.id], 'pending')} className="text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1.5 rounded-lg">撤回</button>}
                </div>
              </div>

              {/* Expanded: evidence + AI assist */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/60">
                  {/* Evidence */}
                  <div className="px-4 pt-3 pb-3">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />证据溯源 · {rel.source}
                    </div>
                    <div className="bg-white border border-amber-200 rounded-lg px-4 py-3 leading-relaxed">
                      {highlightEvidence(rel.evidence, rel.evidenceHighlight)}
                    </div>
                  </div>

                  {/* AI-assisted decision section */}
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3 h-3 text-blue-500" />智能辅助判定
                    </div>
                    <div className="grid grid-cols-2 gap-3">

                      {/* Similar cases */}
                      <div>
                        <div className="text-[11px] text-gray-500 font-medium mb-2 flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-blue-400" />相似已确认案例
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {rel.similarCases.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                              <span className="text-[11px] text-blue-600 font-medium">{c.child}</span>
                              <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-[11px] text-purple-600 font-medium flex-1">{c.parent}</span>
                              <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                {(c.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conflict detection */}
                      <div>
                        <div className="text-[11px] text-gray-500 font-medium mb-2 flex items-center gap-1.5">
                          {rel.conflict
                            ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            : <ShieldCheck className="w-3.5 h-3.5 text-green-500" />}
                          冲突检测
                        </div>
                        {rel.conflict ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex flex-col gap-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-[11px] font-semibold text-red-700 mb-0.5">
                                  {rel.conflict.type === 'circular' ? '⚠ 循环继承冲突' : '⚠ 层级不一致冲突'}
                                </div>
                                <p className="text-[11px] text-red-600 leading-relaxed">{rel.conflict.description}</p>
                              </div>
                            </div>
                            <div className="bg-red-100 rounded px-2.5 py-1.5 text-[10px] text-red-700 font-mono leading-relaxed">
                              {rel.conflict.path}
                            </div>
                            <div className="text-[10px] text-red-500">建议：接受前请先修正本体中已有的相关关系</div>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
                            <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div>
                              <div className="text-[11px] font-semibold text-green-700">无逻辑冲突</div>
                              <div className="text-[10px] text-green-600 mt-0.5">已检查循环继承、层级一致性，未发现问题</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {rel.reviewedAt && (
                      <div className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
                        <Clock className="w-3 h-3" />审核于 {rel.reviewedAt}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Conflict Management Panel ───────────────────────────────────────────────

type NERType = '人物' | '组织' | '技术' | '概念' | '地点' | '数据集';

const NER_COLORS: Record<NERType, { bg: string; text: string; border: string; dot: string }> = {
  '人物':  { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-500' },
  '组织':  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  '技术':  { bg: 'bg-cyan-100',   text: 'text-cyan-800',   border: 'border-cyan-300',   dot: 'bg-cyan-500' },
  '概念':  { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  dot: 'bg-amber-500' },
  '地点':  { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  dot: 'bg-green-500' },
  '数据集':{ bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
};

interface NEREntity {
  id: string;
  text: string;
  type: NERType;
  confidence: number;
  kbId?: string;
  kbLabel?: string;
  status: 'pending' | 'confirmed' | 'corrected' | 'deleted';
  ambiguous?: boolean;
  candidates?: { id: string; label: string; description: string; score: number }[];
}

interface NERDocument {
  id: string;
  title: string;
  text: string;
  entities: NEREntity[];
}

const mockNERDocs: NERDocument[] = [
  {
    id: 'D001', title: 'KG嵌入方法研究',
    text: '张明、李华和王强在清华大学完成了基于Transformer架构的知识图谱嵌入研究，并将方法TKGEmbed发表于IEEE TKDE期刊。实验在FB15k-237与WN18RR数据集上评估，链接预测任务的MRR达到0.383。',
    entities: [
      { id: 'EN001', text: '张明', type: '人物', confidence: 0.97, kbId: 'KG:P001', kbLabel: '张明（清华大学教授）', status: 'confirmed' },
      { id: 'EN002', text: '李华', type: '人物', confidence: 0.91, ambiguous: true, status: 'pending', candidates: [{ id: 'KG:P042', label: '李华（北京大学研究员）', description: '自然语言处理方向', score: 0.72 }, { id: 'KG:P078', label: '李华（中科院工程师）', description: '知识图谱应用', score: 0.61 }] },
      { id: 'EN003', text: '王强', type: '人物', confidence: 0.89, status: 'pending' },
      { id: 'EN004', text: '清华大学', type: '组织', confidence: 0.99, kbId: 'KG:O001', kbLabel: '清华大学', status: 'confirmed' },
      { id: 'EN005', text: 'Transformer', type: '技术', confidence: 0.98, kbId: 'KG:T010', kbLabel: 'Transformer（注意力架构）', status: 'confirmed' },
      { id: 'EN006', text: '知识图谱', type: '概念', confidence: 0.97, kbId: 'KG:C001', kbLabel: '知识图谱', status: 'confirmed' },
      { id: 'EN007', text: 'TKGEmbed', type: '技术', confidence: 0.84, status: 'pending' },
      { id: 'EN008', text: 'IEEE TKDE', type: '组织', confidence: 0.95, kbId: 'KG:O088', kbLabel: 'IEEE TKDE（期刊）', status: 'confirmed' },
      { id: 'EN009', text: 'FB15k-237', type: '数据集', confidence: 0.93, kbId: 'KG:DS003', kbLabel: 'FB15k-237（KG补全基准）', status: 'confirmed' },
      { id: 'EN010', text: 'WN18RR', type: '数据集', confidence: 0.92, kbId: 'KG:DS004', kbLabel: 'WN18RR（WordNet子集）', status: 'confirmed' },
      { id: 'EN011', text: '链接预测', type: '概念', confidence: 0.88, kbId: 'KG:C015', kbLabel: '链接预测任务', status: 'confirmed' },
    ],
  },
  {
    id: 'D002', title: 'GNN生物医学研究',
    text: 'Smith、Johnson和Brown在Stanford Medicine AI Lab提出了面向生物医学知识发现的图神经网络架构HeteroGNN，实验在DrugBank和OMIM数据库上验证，药物重定向AUROC达到0.94。',
    entities: [
      { id: 'EN020', text: 'Smith', type: '人物', confidence: 0.88, status: 'pending', ambiguous: true, candidates: [{ id: 'KG:P201', label: 'Smith J（斯坦福医学院）', description: '生物医学AI研究员', score: 0.85 }, { id: 'KG:P202', label: 'Smith R（MIT）', description: '计算生物学', score: 0.52 }] },
      { id: 'EN021', text: 'Stanford Medicine AI Lab', type: '组织', confidence: 0.96, kbId: 'KG:O205', kbLabel: 'Stanford Medicine AI Lab', status: 'confirmed' },
      { id: 'EN022', text: '图神经网络', type: '技术', confidence: 0.95, kbId: 'KG:T022', kbLabel: '图神经网络（GNN）', status: 'confirmed' },
      { id: 'EN023', text: 'HeteroGNN', type: '技术', confidence: 0.81, status: 'pending' },
      { id: 'EN024', text: 'DrugBank', type: '数据集', confidence: 0.94, kbId: 'KG:DS010', kbLabel: 'DrugBank药物数据库', status: 'confirmed' },
      { id: 'EN025', text: 'OMIM', type: '数据集', confidence: 0.92, kbId: 'KG:DS011', kbLabel: 'OMIM遗传病数据库', status: 'confirmed' },
    ],
  },
];

// ─── Conflict types ───────────────────────────────────────────────────────────

type ConflictKind = 'disambig' | 'low-conf' | 'pending' | 'unlinked';

interface ConflictItem {
  key: string;
  docId: string;
  docTitle: string;
  entity: NEREntity;
  kind: ConflictKind;
  priority: number;
}

function getConflictKind(entity: NEREntity): ConflictKind | null {
  if (entity.status === 'deleted' || entity.status === 'confirmed') return null;
  if (entity.ambiguous) return 'disambig';
  if (entity.confidence < 0.85) return 'low-conf';
  if (!entity.kbId) return 'unlinked';
  return 'pending';
}

const CONFLICT_META: Record<ConflictKind, { label: string; desc: string; bg: string; text: string; border: string; dotBg: string; priority: number }> = {
  disambig:  { label: '待消歧', desc: '存在多个候选实体，需手动选择正确指代', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dotBg: 'bg-amber-500',  priority: 1 },
  'low-conf':{ label: '低置信度', desc: '模型置信度低于阈值，需人工确认或拒绝', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dotBg: 'bg-orange-500', priority: 2 },
  unlinked:  { label: '未链接', desc: '实体未匹配到知识库条目，需手动链接或标记', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dotBg: 'bg-purple-500', priority: 3 },
  pending:   { label: '待审核', desc: '待人工确认是否接受该实体识别结果', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dotBg: 'bg-blue-500',   priority: 4 },
};

function buildConflicts(docs: NERDocument[]): ConflictItem[] {
  const items: ConflictItem[] = [];
  docs.forEach(doc => {
    doc.entities.forEach(entity => {
      const kind = getConflictKind(entity);
      if (!kind) return;
      items.push({ key: `${doc.id}:${entity.id}`, docId: doc.id, docTitle: doc.title, entity, kind, priority: CONFLICT_META[kind].priority });
    });
  });
  return items.sort((a, b) => a.priority - b.priority);
}

// ─── Resolution detail panel ──────────────────────────────────────────────────

function ResolutionPanel({
  item, docs, onUpdate, onClose,
}: { item: ConflictItem; docs: NERDocument[]; onUpdate: (docId: string, entityId: string, patch: Partial<NEREntity>) => void; onClose: () => void }) {
  const [editingType, setEditingType] = useState(false);
  const { entity, kind } = item;
  const meta = CONFLICT_META[kind];
  const doc = docs.find(d => d.id === item.docId)!;

  const confirmCandidate = (c: { id: string; label: string }) => {
    onUpdate(item.docId, entity.id, { kbId: c.id, kbLabel: c.label, status: 'confirmed', ambiguous: false });
    onClose();
  };
  const confirmEntity = () => { onUpdate(item.docId, entity.id, { status: 'confirmed' }); onClose(); };
  const rejectEntity = () => { onUpdate(item.docId, entity.id, { status: 'deleted' }); onClose(); };
  const setType = (t: NERType) => { onUpdate(item.docId, entity.id, { type: t, status: 'corrected' }); setEditingType(false); };
  const skipDisambig = () => { onUpdate(item.docId, entity.id, { ambiguous: false, status: 'confirmed' }); onClose(); };

  const c = NER_COLORS[entity.type];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.bg} ${meta.text} ${meta.border}`}>{meta.label}</span>
          <span className="text-sm font-semibold text-gray-800">冲突解决</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Entity info */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">识别实体</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold px-3 py-1 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>{entity.text}</span>
            <span className="text-xs text-gray-500">{doc.title}</span>
          </div>
        </div>

        {/* Context sentence */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">原文上下文</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 leading-relaxed">
            {doc.text.includes(entity.text)
              ? (() => {
                  const idx = doc.text.indexOf(entity.text);
                  const before = doc.text.slice(Math.max(0, idx - 40), idx);
                  const after = doc.text.slice(idx + entity.text.length, idx + entity.text.length + 40);
                  return <>{before.length < idx ? '…' : ''}{before}<mark className="bg-amber-200 text-amber-900 rounded px-0.5">{entity.text}</mark>{after}{'…'}</>;
                })()
              : doc.text.slice(0, 100) + '…'}
          </div>
        </div>

        {/* Confidence */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">模型置信度</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${entity.confidence >= 0.9 ? 'bg-green-500' : entity.confidence >= 0.75 ? 'bg-blue-500' : 'bg-amber-400'}`}
                style={{ width: `${entity.confidence * 100}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-700 w-10 text-right">{(entity.confidence * 100).toFixed(0)}%</span>
          </div>
          {kind === 'low-conf' && <p className="text-[11px] text-amber-600 mt-1">置信度低于阈值 85%，建议人工核查</p>}
        </div>

        {/* Entity type */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">实体类型</p>
            <button onClick={() => setEditingType(v => !v)} className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
              <Edit2 className="w-3 h-3" />{editingType ? '取消' : '修改类型'}
            </button>
          </div>
          {editingType ? (
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(NER_COLORS) as NERType[]).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors ${t === entity.type ? `${NER_COLORS[t].bg} ${NER_COLORS[t].text} ${NER_COLORS[t].border}` : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                  {t === entity.type ? '✓ ' : ''}{t}
                </button>
              ))}
            </div>
          ) : (
            <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${c.bg} ${c.text} ${c.border}`}>{entity.type}</span>
          )}
        </div>

        {/* KB linking */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Link2 className="w-3 h-3" />知识库链接</p>
          {entity.kbId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-[11px] text-green-700 font-medium">已链接</span></div>
              <div className="text-xs text-green-800 font-medium">{entity.kbLabel}</div>
              <div className="text-[10px] text-green-600 font-mono mt-0.5">{entity.kbId}</div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-[11px] text-gray-400">
              {kind === 'unlinked' ? '未匹配到知识库条目，可在消歧后自动链接' : '未链接'}
            </div>
          )}
        </div>

        {/* Disambiguation candidates */}
        {kind === 'disambig' && entity.candidates && entity.candidates.length > 0 && (
          <div>
            <p className="text-[10px] text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3 h-3" />实体消歧 — 请选择正确指代
            </p>
            <div className="space-y-2">
              {entity.candidates.map(c => (
                <div key={c.id} className="border border-gray-200 hover:border-blue-300 rounded-xl px-3 py-3 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-xs text-gray-900 font-semibold">{c.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{c.description}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.id}</div>
                    </div>
                    <div className={`text-[11px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full border ${c.score >= 0.8 ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                      {(c.score * 100).toFixed(0)}%
                    </div>
                  </div>
                  <button onClick={() => confirmCandidate(c)}
                    className="w-full text-xs py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    确认为此实体
                  </button>
                </div>
              ))}
              <button onClick={skipDisambig} className="w-full text-[11px] text-gray-400 hover:text-gray-600 py-1.5 border border-dashed border-gray-200 rounded-lg transition-colors">
                跳过消歧，直接确认识别结果
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-gray-100 flex gap-2 flex-wrap">
          {entity.status !== 'confirmed' && kind !== 'disambig' && (
            <button onClick={confirmEntity} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <Check className="w-3.5 h-3.5" />确认实体
            </button>
          )}
          <button onClick={rejectEntity} className="flex items-center gap-1.5 text-xs px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />拒绝删除
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main conflict list ───────────────────────────────────────────────────────

export function ConflictManagementPanel() {
  const [docs, setDocs] = useState<NERDocument[]>(mockNERDocs);
  const [kindFilter, setKindFilter] = useState<ConflictKind | 'all'>('all');
  const [docFilter, setDocFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const updateEntity = (docId: string, entityId: string, patch: Partial<NEREntity>) => {
    setDocs(prev => prev.map(d => d.id === docId
      ? { ...d, entities: d.entities.map(e => e.id === entityId ? { ...e, ...patch } : e) }
      : d
    ));
    const key = `${docId}:${entityId}`;
    setResolved(prev => { const n = new Set(prev); n.add(key); return n; });
    if (selectedKey === key) setSelectedKey(null);
  };

  const conflicts = buildConflicts(docs);
  const filtered = conflicts.filter(c =>
    (kindFilter === 'all' || c.kind === kindFilter) &&
    (docFilter === 'all' || c.docId === docFilter) &&
    (!search || c.entity.text.includes(search) || c.docTitle.includes(search))
  );

  const selectedItem = filtered.find(c => c.key === selectedKey) ?? null;

  const statCounts: Record<ConflictKind, number> = { disambig: 0, 'low-conf': 0, unlinked: 0, pending: 0 };
  conflicts.forEach(c => { statCounts[c.kind]++; });

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-gray-500" /></div>
          <div><div className="text-xl font-semibold text-gray-900">{conflicts.length}</div><div className="text-xs text-gray-400">总冲突数</div></div>
        </div>
        {(Object.keys(CONFLICT_META) as ConflictKind[]).map(k => {
          const m = CONFLICT_META[k];
          return (
            <button key={k} onClick={() => setKindFilter(prev => prev === k ? 'all' : k)}
              className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-all ${kindFilter === k ? `${m.border} ${m.bg} ring-2 ring-offset-1 ring-blue-300` : `${m.border} ${m.bg} hover:opacity-80`}`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${m.dotBg}`} />
              <div className="text-left"><div className={`text-xl font-semibold ${m.text}`}>{statCounts[k]}</div><div className="text-xs text-gray-500">{m.label}</div></div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索实体或文档名…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-48 bg-white" />
        </div>
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none">
          <option value="all">全部冲突类型</option>
          <option value="disambig">待消歧</option>
          <option value="low-conf">低置信度</option>
          <option value="unlinked">未链接</option>
          <option value="pending">待审核</option>
        </select>
        <select value={docFilter} onChange={e => setDocFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none">
          <option value="all">全部文档</option>
          {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} 个冲突 · {resolved.size} 已解决</span>
      </div>

      {/* Body: list + detail */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left: conflict list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mb-2 text-green-300" />
              <p className="text-sm font-medium text-gray-500">该筛选条件下无待处理冲突</p>
            </div>
          ) : filtered.map(item => {
            const m = CONFLICT_META[item.kind];
            const c = NER_COLORS[item.entity.type];
            const isSelected = selectedKey === item.key;
            const isResolved = resolved.has(item.key);
            return (
              <div key={item.key} onClick={() => setSelectedKey(isSelected ? null : item.key)}
                className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3.5 cursor-pointer transition-all flex-shrink-0
                  ${isSelected ? 'border-blue-400 shadow-sm bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}
                  ${isResolved ? 'opacity-50' : ''}`}>
                {/* Priority dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isResolved ? 'bg-green-400' : m.dotBg}`} />

                {/* Entity name + type */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{item.entity.text}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${c.bg} ${c.text} ${c.border}`}>{item.entity.type}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${m.bg} ${m.text} ${m.border}`}>{m.label}</span>
                    {isResolved && <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">已解决</span>}
                  </div>
                  <div className="text-[11px] text-gray-400">{item.docTitle} · {m.desc}</div>
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.entity.confidence >= 0.9 ? 'bg-green-400' : item.entity.confidence >= 0.75 ? 'bg-blue-400' : 'bg-amber-400'}`}
                      style={{ width: `${item.entity.confidence * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-7 text-right">{(item.entity.confidence * 100).toFixed(0)}%</span>
                </div>

                <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Right: resolution panel */}
        {selectedItem && (
          <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <ResolutionPanel item={selectedItem} docs={docs} onUpdate={updateEntity} onClose={() => setSelectedKey(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

// keep renderAnnotatedText for potential reuse elsewhere
function renderAnnotatedText(text: string, entities: NEREntity[], selectedId: string | null, onSelect: (id: string) => void) {
  // Build sorted non-overlapping spans
  const spans: { start: number; end: number; entity: NEREntity }[] = [];
  entities.filter(e => e.status !== 'deleted').forEach(entity => {
    const idx = text.indexOf(entity.text);
    if (idx !== -1) spans.push({ start: idx, end: idx + entity.text.length, entity });
  });
  spans.sort((a, b) => a.start - b.start);

  const parts: JSX.Element[] = [];
  let cursor = 0;
  spans.forEach((span, i) => {
    if (span.start < cursor) return;
    if (span.start > cursor) parts.push(<span key={`t${i}`}>{text.slice(cursor, span.start)}</span>);
    const c = NER_COLORS[span.entity.type];
    const isSelected = selectedId === span.entity.id;
    const isAmbiguous = span.entity.ambiguous;
    parts.push(
      <span key={span.entity.id}
        onClick={() => onSelect(span.entity.id)}
        className={`cursor-pointer rounded px-0.5 border ${c.bg} ${c.text} ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : c.border} ${isAmbiguous ? 'border-dashed' : ''} transition-all`}
        title={`${span.entity.type} · 置信度 ${(span.entity.confidence * 100).toFixed(0)}%${isAmbiguous ? ' · 存在歧义' : ''}`}>
        {span.entity.text}
        {isAmbiguous && <span className="text-[9px] ml-0.5 opacity-70">?</span>}
      </span>
    );
    cursor = span.end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return parts;
}

function EntityRecognitionPanel() {
  // kept for reference; UI replaced by ConflictManagementPanel
  const [docs] = useState<NERDocument[]>(mockNERDocs);
  void docs;
  return null;
}

// ─── Event Review Panel ───────────────────────────────────────────────────────

type ArgRole = '主体' | '客体' | '时间' | '地点' | '结果' | '工具' | '方式';

interface EventArg { role: ArgRole; value: string; }

interface ExtractedEvent {
  id: string;
  eventType: string;
  typeColor: string;
  sourceText: string;
  args: EventArg[];
  confidence: number;
  source: string;
  status: ReviewStatus;
}

interface MergeCandidate {
  id: string;
  eventA: ExtractedEvent;
  eventB: ExtractedEvent;
  similarity: number;
  decision: 'same' | 'different' | 'pending';
}

const mockEvents: ExtractedEvent[] = [
  { id: 'E001', eventType: '论文发表', typeColor: 'text-blue-600 bg-blue-50 border-blue-200', confidence: 0.93,
    source: '基于Transformer的知识图谱嵌入方法研究',
    sourceText: '张明等人于2024年在IEEE TKDE期刊发表了关于知识图谱Transformer嵌入的研究成果。',
    args: [{ role: '主体', value: '张明、李华、王强' }, { role: '客体', value: '知识图谱Transformer嵌入研究' }, { role: '时间', value: '2024年' }, { role: '地点', value: 'IEEE TKDE' }],
    status: 'pending' },
  { id: 'E002', eventType: '机构合作', typeColor: 'text-purple-600 bg-purple-50 border-purple-200', confidence: 0.87,
    source: '面向科研领域的知识图谱构建与应用综述',
    sourceText: '清华大学与北京大学联合开展了知识图谱领域的跨机构合作研究项目。',
    args: [{ role: '主体', value: '清华大学' }, { role: '主体', value: '北京大学' }, { role: '方式', value: '联合研究' }, { role: '结果', value: '知识图谱跨机构合作项目' }],
    status: 'accepted' },
  { id: 'E003', eventType: '奖项颁发', typeColor: 'text-yellow-600 bg-yellow-50 border-yellow-200', confidence: 0.82,
    source: 'Graph Neural Networks for Biomedical Knowledge Discovery',
    sourceText: 'Smith等人因在生物医学知识发现领域的突出贡献，于2024年获得Nature年度最佳论文奖。',
    args: [{ role: '主体', value: 'Nature编辑委员会' }, { role: '客体', value: 'Smith, Johnson, Brown' }, { role: '结果', value: '年度最佳论文奖' }, { role: '时间', value: '2024年' }],
    status: 'pending' },
  { id: 'E004', eventType: '论文发表', typeColor: 'text-blue-600 bg-blue-50 border-blue-200', confidence: 0.78,
    source: 'Large Language Models for Scientific Knowledge Extraction',
    sourceText: 'Chen Wei和Liu Yang在NeurIPS 2024大会上展示了利用大语言模型进行科学知识抽取的最新成果。',
    args: [{ role: '主体', value: 'Chen Wei, Liu Yang' }, { role: '客体', value: '科学知识抽取LLM方法' }, { role: '时间', value: '2024年' }, { role: '地点', value: 'NeurIPS大会' }],
    status: 'pending' },
  { id: 'E005', eventType: '技术应用', typeColor: 'text-green-600 bg-green-50 border-green-200', confidence: 0.75,
    source: '医学知识图谱辅助临床决策支持系统研究',
    sourceText: '中科院医学信息研究所将医学知识图谱系统部署于三家三甲医院的辅助诊断场景中。',
    args: [{ role: '主体', value: '中科院医学信息研究所' }, { role: '工具', value: '医学知识图谱系统' }, { role: '地点', value: '三家三甲医院' }, { role: '结果', value: '辅助诊断场景落地' }],
    status: 'pending' },
];

const mockMergeCandidates: MergeCandidate[] = [
  { id: 'M001', similarity: 0.91, decision: 'pending',
    eventA: mockEvents[0],
    eventB: { ...mockEvents[0], id: 'E001b', sourceText: '张明团队2024年发表了Transformer知识图谱嵌入新方法，刊登于IEEE期刊。', args: [{ role: '主体', value: '张明团队' }, { role: '客体', value: 'Transformer KG嵌入方法' }, { role: '时间', value: '2024年' }, { role: '地点', value: 'IEEE期刊' }], status: 'pending' } },
  { id: 'M002', similarity: 0.74, decision: 'pending',
    eventA: mockEvents[3],
    eventB: { ...mockEvents[3], id: 'E004b', sourceText: 'NeurIPS 2024收录了Chen Wei等关于LLM知识抽取的论文，系统评测表现优异。', args: [{ role: '主体', value: 'NeurIPS 2024' }, { role: '客体', value: 'LLM知识抽取论文' }, { role: '结果', value: '论文收录' }], status: 'pending' } },
];

export function EventReviewPanel({ initialSubTab }: { initialSubTab?: 'workbench' | 'merge' } = {}) {
  const [events, setEvents] = useState<ExtractedEvent[]>(mockEvents);
  const [mergeCandidates, setMergeCandidates] = useState<MergeCandidate[]>(mockMergeCandidates);
  const [subTab, setSubTab] = useState<'workbench' | 'merge'>(initialSubTab ?? 'workbench');
  const [expandedId, setExpandedId] = useState<string | null>('E001');

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);
  const [editingArg, setEditingArg] = useState<{ eventId: string; argIndex: number } | null>(null);
  const [editArgValue, setEditArgValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = events.filter(e => statusFilter === 'all' || e.status === statusFilter);
  const stats = { pending: events.filter(e => e.status === 'pending').length, accepted: events.filter(e => e.status === 'accepted').length, rejected: events.filter(e => e.status === 'rejected').length };

  const updateStatus = (ids: string[], status: ReviewStatus) => {
    setEvents(prev => prev.map(e => ids.includes(e.id) ? { ...e, status } : e));
    setSelectedIds(new Set());
  };

  const saveArg = (eventId: string, argIndex: number) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, args: e.args.map((a, i) => i === argIndex ? { ...a, value: editArgValue } : a) } : e));
    setEditingArg(null);
  };

  const deleteArg = (eventId: string, argIndex: number) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, args: e.args.filter((_, i) => i !== argIndex) } : e));
  };

  const addArg = (eventId: string) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, args: [...e.args, { role: '结果', value: '待填写' }] } : e));
  };

  const decideMerge = (candidateId: string, decision: 'same' | 'different') => {
    setMergeCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, decision } : c));
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const ARG_ICON: Partial<Record<ArgRole, any>> = { '主体': Users, '客体': Newspaper, '时间': Clock, '地点': MapPin };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: '待审核', value: stats.pending, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: '已接受', value: stats.accepted, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
          { label: '已拒绝', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-50', border: 'border-red-100' },
          { label: '待消解合并', value: mergeCandidates.filter(c => c.decision === 'pending').length, icon: Merge, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
        ].map(s => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-xl px-4 py-3 flex items-center gap-3`}>
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div><div className="text-xl font-semibold text-gray-900">{s.value}</div><div className="text-xs text-gray-400">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 flex-shrink-0 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ id: 'workbench', label: '事件审核与修正工作台' }, { id: 'merge', label: '事件合并与指代消解' }].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id as any)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors font-medium ${subTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Workbench ── */}
      {subTab === 'workbench' && (
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center gap-2 flex-shrink-0">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none">
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="accepted">已接受</option>
              <option value="rejected">已拒绝</option>
            </select>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm text-blue-700 font-medium">已选 {selectedIds.size}</span>
                <button onClick={() => updateStatus([...selectedIds], 'accepted')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg"><Check className="w-3 h-3" />批量接受</button>
                <button onClick={() => updateStatus([...selectedIds], 'rejected')} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg"><X className="w-3 h-3" />批量拒绝</button>
              </div>
            )}
            <span className="ml-auto text-xs text-gray-400">{filtered.length} 个事件</span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
            {filtered.map(ev => {
              const sc2 = STATUS_CONFIG[ev.status];
              const isExpanded = expandedId === ev.id;
              const isSelected = selectedIds.has(ev.id);
              return (
                <div key={ev.id} className={`bg-white border rounded-xl overflow-hidden flex-shrink-0 ${isSelected ? 'border-blue-300' : 'border-gray-200 hover:border-gray-300'} transition-colors`}>
                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ev.id)}>
                    <div onClick={e => { e.stopPropagation(); toggleSelect(ev.id); }}
                      className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-gray-500'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${ev.typeColor}`}>{ev.eventType}</span>
                    <p className="flex-1 text-sm text-gray-800 line-clamp-1">{ev.sourceText}</p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{ev.args.length} 个论元</span>
                    <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${sc2.color}`}><sc2.icon className="w-3 h-3" />{sc2.label}</span>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {ev.status !== 'accepted' && <button onClick={() => updateStatus([ev.id], 'accepted')} className="text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1"><Check className="w-3 h-3" />接受</button>}
                      {ev.status !== 'rejected' && <button onClick={() => updateStatus([ev.id], 'rejected')} className="text-xs px-2.5 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1"><X className="w-3 h-3" />拒绝</button>}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded: arguments editor */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/40">
                      {/* Source text */}
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />原始文本 · {ev.source}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 leading-relaxed mb-4">{ev.sourceText}</div>

                      {/* Arguments table */}
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" />事件论元（可修改/删除/补充）</span>
                        <button onClick={() => addArg(ev.id)} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-[11px] transition-colors">
                          <Plus className="w-3 h-3" />添加论元
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {ev.args.map((arg, i) => {
                          const ArgIc = ARG_ICON[arg.role] ?? Tag;
                          const isEditingThis = editingArg?.eventId === ev.id && editingArg?.argIndex === i;
                          return (
                            <div key={i} className="flex items-center gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2 group">
                              <ArgIc className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-[11px] text-gray-500 w-10 flex-shrink-0 font-medium">{arg.role}</span>
                              {isEditingThis ? (
                                <input autoFocus value={editArgValue} onChange={e => setEditArgValue(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveArg(ev.id, i); if (e.key === 'Escape') setEditingArg(null); }}
                                  className="flex-1 text-xs border border-blue-300 rounded px-2 py-0.5 focus:outline-none text-gray-800" />
                              ) : (
                                <span className="flex-1 text-xs text-gray-800">{arg.value}</span>
                              )}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                {isEditingThis ? (
                                  <>
                                    <button onClick={() => saveArg(ev.id, i)} className="p-1 text-green-500 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setEditingArg(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { setEditingArg({ eventId: ev.id, argIndex: i }); setEditArgValue(arg.value); }}
                                      className="p-1 text-gray-400 hover:text-blue-500"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deleteArg(ev.id, i)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Merge & Coreference ── */}
      {subTab === 'merge' && (
        <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto">
          <p className="text-xs text-gray-500 flex-shrink-0">系统检测到以下事件对可能描述同一事件，请判断是否需要合并。</p>
          {mergeCandidates.map(mc => {
            const simColor = mc.similarity >= 0.85 ? 'text-red-600 bg-red-50 border-red-200' : mc.similarity >= 0.70 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-gray-500 bg-gray-50 border-gray-200';
            return (
              <div key={mc.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Similarity header */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${simColor}`}>
                    相似度 {(mc.similarity * 100).toFixed(0)}%
                  </span>
                  {mc.decision === 'pending' ? (
                    <span className="text-xs text-gray-500">请判断以下两个事件是否为同一事件</span>
                  ) : mc.decision === 'same' ? (
                    <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />已标记为同一事件（将合并）</span>
                  ) : (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />已标记为不同事件</span>
                  )}
                  {mc.decision === 'pending' && (
                    <div className="ml-auto flex gap-2">
                      <button onClick={() => decideMerge(mc.id, 'same')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <Merge className="w-3.5 h-3.5" />是同一事件，合并
                      </button>
                      <button onClick={() => decideMerge(mc.id, 'different')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />不同事件，保留
                      </button>
                    </div>
                  )}
                  {mc.decision !== 'pending' && (
                    <button onClick={() => decideMerge(mc.id, 'pending')} className="ml-auto text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg">撤回判断</button>
                  )}
                </div>

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {[mc.eventA, mc.eventB].map((ev, side) => (
                    <div key={side} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${ev.typeColor}`}>{ev.eventType}</span>
                        <span className="text-[10px] text-gray-400">事件{String.fromCharCode(65 + side)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed mb-2 border-l-2 border-amber-300 pl-2">{ev.sourceText}</p>
                      <div className="flex flex-col gap-1">
                        {ev.args.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span className="text-gray-400 w-8 flex-shrink-0">{a.role}</span>
                            <span className="text-gray-700">{a.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TermReview() {
  const [activeType, setActiveType] = useState<ReviewType>('seed-term');

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">审核管理</h1>
          <p className="text-sm text-gray-500">对算法生成的候选数据进行人工审核，选择审核类型后操作</p>
        </div>
      </div>

      {/* Review type selector */}
      <div className="flex gap-2 flex-shrink-0">
        {REVIEW_TYPES.map(type => (
          <button key={type.id} onClick={() => setActiveType(type.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              activeType === type.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}>
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
        <div className="ml-2 flex items-center text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          更多审核类型即将上线
        </div>
      </div>

      {/* Panel */}
      {activeType === 'seed-term'    && <SeedTermPanel />}
      {activeType === 'hyponymy'     && <HyponymyPanel />}
      {activeType === 'event-review'       && <EventReviewPanel />}
      {activeType === 'entity-recognition' && <ConflictManagementPanel />}
    </div>
  );
}
