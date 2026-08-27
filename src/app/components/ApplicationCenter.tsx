import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, FileSearch, Send, Plus, ArrowLeft,
  Bot, User, Loader2, GitMerge, Brain,
  Target, ShieldCheck, Search, Trash2, Clock,
  ChevronRight, Sparkles, MessageCircle, Network,
  ZoomIn, ZoomOut, Maximize2, X, CornerDownLeft,
  TrendingUp, SlidersHorizontal, FileText, BookOpen, Link2,
} from 'lucide-react';
import type { AppCenterFocus } from '../data/auditPageMap';

// ─── Assistant definitions ────────────────────────────────────────────────────

interface PromptTemplate {
  label: string;    // short name shown on card, e.g. "实体属性查询"
  pattern: string;  // template with [placeholder] slots
  hint: string;     // one-line tip explaining why this format works
}

interface Assistant {
  id: string; name: string; category: string; description: string;
  icon: any; color: string; bgColor: string; placeholder: string;
  promptTemplates: PromptTemplate[];
}

const ASSISTANTS: Assistant[] = [
  {
    id: 'kg-qa', name: '知识问答助手', category: '问答',
    description: '基于知识图谱回答学术问题，支持学者、机构、成果等多维度查询',
    icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50',
    placeholder: '按下方模板构建问题，或直接输入，例如："Transformer 在知识图谱中的作用是什么？"',
    promptTemplates: [
      { label: '三元组查询转换', pattern: '基于以下三元组查询生成自然语言问题并回答：\n(?, 研究方向, 知识图谱)\n(清华大学, 就职于, ?)\n请将上述 SPARQL 风格三元组转换为高质量提示词，并从图谱检索答案', hint: '将结构化三元组查询转换为自然语言提示词，提升大模型回答精度' },
      { label: '实体属性查询', pattern: '请介绍[实体名称]的基本信息，重点说明[属性A]、[属性B]，以及它在[所属领域]中的学术地位', hint: '明确实体名称和关注属性，可避免答案过于宽泛' },
      { label: '概念对比分析', pattern: '请比较[概念A]与[概念B]的核心区别与联系，从[技术原理]和[应用场景]两个维度展开', hint: '对比式问题比单独查询更能暴露两个概念的本质差异' },
      { label: '时序发展脉络', pattern: '[技术/领域]在近[N]年经历了哪些关键进展？请按时间线梳理，并指出当前最受关注的分支方向', hint: '加入时间范围约束，引导助手聚焦近期动态而非历史综述' },
    ],
  },
  {
    id: 'scholar-search', name: '学者检索系统', category: '检索',
    description: '智能检索学者信息、分析合作网络、推荐领域专家',
    icon: FileSearch, color: 'text-purple-600', bgColor: 'bg-purple-50',
    placeholder: '按模板构建检索条件，或直接输入学者姓名、机构、研究方向...',
    promptTemplates: [
      { label: '学者定向检索', pattern: '找从事[研究方向]的学者，机构范围限定为[机构名/国家]，按[h指数/近5年发文量]降序排列，返回前[N]条', hint: '给定排序维度和结果数量，输出更直接可用' },
      { label: '机构合作查询', pattern: '[机构A]与[机构B]在[具体领域]方向有哪些合作成果？列出代表性合作论文及主要合作学者', hint: '同时指定两个机构和领域，可精确定位合作交集' },
      { label: '专家推荐', pattern: '为[子方向]领域推荐权威专家，考察条件：近[N]年活跃、在[顶会/期刊名称]有发表记录，优先给出可联系的通讯方式', hint: '加入活跃度约束，优先返回仍在一线的学者' },
    ],
  },
  {
    id: 'paper-recommendation', name: '文献智能推荐', category: '检索',
    description: '根据研究兴趣个性化推荐相关学术文献，覆盖1.5亿+篇文献',
    icon: Search, color: 'text-cyan-600', bgColor: 'bg-cyan-50',
    placeholder: '按模板描述文献需求，或直接告知研究主题...',
    promptTemplates: [
      { label: '精准文献推荐', pattern: '推荐关于[具体主题]的论文，发表在[CCF-A类/SCI/顶会名称]，聚焦[核心问题]，优先[近N年]，按引用量降序', hint: '约束发表来源和引用量，直接锁定高质量文献' },
      { label: '交叉研究发现', pattern: '[方法/技术A]与[方法/技术B]结合的研究有哪些？列出关键文献，标注各文献的核心贡献和被引次数', hint: '揭示两条技术路线交汇处的空白与机会点' },
      { label: '综述快速入门', pattern: '[研究方向]有哪些高质量综述？请按发表年份从近到远排列，并注明综述覆盖的时间跨度', hint: '综述 + 时间排序，快速建立领域全貌认知' },
    ],
  },
  {
    id: 'relation-analysis', name: '关系分析助手', category: '分析',
    description: '量化计算知识实体间的关联强度，支持关系网络可视化与结果导出',
    icon: GitMerge, color: 'text-green-600', bgColor: 'bg-green-50',
    placeholder: '按模板指定分析目标，或直接描述需要分析的实体关系...',
    promptTemplates: [
      { label: '双实体关联分析', pattern: '计算[实体A]与[实体B]在知识图谱中的关联强度，分析主要关联路径，并列出共现证据（论文/事件/属性）', hint: '指定两个具体实体，助手将量化图谱距离和关联类型' },
      { label: '邻域扩展检索', pattern: '找出与[核心实体]关联最强的前[N]个[机构/学者/技术概念]，展示关联依据并说明关联类型（协作/引用/共属）', hint: '以某实体为中心，发现其在图谱中最紧密的邻域节点' },
      { label: '关系网络可视化', pattern: '展示[技术/概念]在[应用领域]内的完整关系网络，路径深度限制在[N]跳以内，过滤关联强度低于[阈值]的边', hint: '控制路径深度和阈值，避免图谱过于稠密而失去可读性' },
    ],
  },
  {
    id: 'inference-prediction', name: '推理预测助手', category: '推理',
    description: '从知识图谱中自动挖掘隐含规则，用于趋势预测与关系推断',
    icon: Brain, color: 'text-orange-600', bgColor: 'bg-orange-50',
    placeholder: '按模板描述挖掘目标，或直接提出推理需求...',
    promptTemplates: [
      { label: '关联规则挖掘', pattern: '挖掘图谱中[实体类型A]→[关系谓词]→[实体类型B]的关联规则，置信度阈值设为[N%]，按支持度降序输出前[K]条', hint: '给定路径模式和置信度阈值，输出结构化的可解释规则' },
      { label: '研究趋势预测', pattern: '基于[机构/学者/子领域]在过去[N]年的图谱数据，预测未来[M]年的研究重心迁移和热点方向变化', hint: '时序约束 + 明确预测窗口，让预测结论更有依据可追溯' },
      { label: '技术融合预判', pattern: '哪些新兴技术方向可能与[技术X]产生深度融合？请给出推理路径、图谱证据和概率估计', hint: '要求附推理路径和证据，区分有依据预测与泛泛猜测' },
    ],
  },
  {
    id: 'decision-support', name: '决策支持助手', category: '决策',
    description: '结合图谱数据与专家规则，为科研方向选择和资源配置提供建议',
    icon: Target, color: 'text-rose-600', bgColor: 'bg-rose-50',
    placeholder: '按模板描述决策场景，或直接提出资源配置问题...',
    promptTemplates: [
      { label: '方向竞争力评估', pattern: '请从[发文增长率/顶会接受率/产业落地需求/引用半衰期]四个维度，评估[研究方向]当前的综合竞争力', hint: '多维度量化可防止评估过度依赖单一指标' },
      { label: '合作伙伴推荐', pattern: '基于[机构名称]当前的知识图谱画像，推荐资源互补性最强的[N]家潜在合作机构，并说明互补依据', hint: '资源互补比单纯地域或规模匹配更能预测合作深度' },
      { label: '方向取舍分析', pattern: '对比[方向A]和[方向B]在[时间投入/学术影响/产业转化]三个维度的差异，给出面向[目标/约束条件]的选择建议', hint: '明确约束条件，助手会给出有针对性而非通用性结论' },
    ],
  },
  {
    id: 'knowledge-validation', name: '知识校验助手', category: '校验',
    description: '检测图谱结构异常、识别冗余节点、维护关系网络的准确性',
    icon: ShieldCheck, color: 'text-teal-600', bgColor: 'bg-teal-50',
    placeholder: '按模板描述校验范围，或直接指定需要检查的实体或关系...',
    promptTemplates: [
      { label: '节点质量扫描', pattern: '扫描图谱中[实体类型]节点，检测[必填属性缺失/孤立节点/属性值异常]问题，按严重程度分级输出', hint: '指定实体类型和问题类别，输出更聚焦，便于后续修复优先级排序' },
      { label: '关系链校验', pattern: '验证[实体A]→[关系类型]→[实体B]这条关系路径的完整性、本体一致性和来源可信度，并给出修复建议', hint: '同时校验结构完整性和语义一致性，比单纯检查存在性更严格' },
      { label: '重复实体检测', pattern: '找出图谱中与[实体名称]文本相似度超过[N%]或语义相似度超过[M%]的实体，标注是否为歧义实体或真实冗余', hint: '区分歧义（不同实体相似名称）和冗余（同一实体重复录入）' },
    ],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  '问答': 'bg-blue-100 text-blue-700', '检索': 'bg-purple-100 text-purple-700',
  '分析': 'bg-green-100 text-green-700', '推理': 'bg-orange-100 text-orange-700',
  '决策': 'bg-rose-100 text-rose-700', '校验': 'bg-teal-100 text-teal-700',
};

const PAPER_LLM_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'claude-35', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'qwen-max', name: '通义千问 Max', provider: '阿里云' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' },
];

const DEMO_PAPER_QUERY = '推荐关于知识图谱 Transformer 嵌入的高引论文，近5年，按引用量降序';
const DEMO_PAPER_RESULTS = `语义检索完成，共匹配 **42 篇**相关文献（1.5亿+ 文献库），按相关度与引用量综合排序，展示前 5 篇：

1. **基于Transformer的知识图谱嵌入方法研究** — IEEE TKDE 2024 · IF 8.9 · 引用 142
2. **Large Language Models for Scientific Knowledge Extraction** — NeurIPS 2024 · IF 12.4 · 引用 389
3. **面向科研领域的知识图谱构建与应用综述** — ACM SIGKDD 2023 · IF 7.2 · 引用 256
4. **Graph Neural Networks for Biomedical Knowledge Discovery** — Nature 2024 · IF 69.5 · 引用 1203
5. **Multimodal Knowledge Graphs for Scientific Discovery** — KDD 2023 · 引用 178

可在下方证据列表中查看原文片段，或继续追问以缩小范围。`;
const DEMO_PAPER_OUTPUT = `**AI 文献概括**（已索引至对应文献条目）

**主题：知识图谱 Transformer 嵌入**

近三年该方向的核心进展：Transformer 自注意力机制逐步取代 TransE 类平移模型，成为知识图谱嵌入的主流架构。TKGEmbed（IEEE TKDE 2024）提出关系感知位置编码，在 FB15k-237 上 MRR 提升 4.2%；BERT-KG（ACL 2023）将预训练语言模型与图谱结构联合建模，显著改善长尾关系预测。

**可索引摘要片段：**
- 论文 #1：关系感知位置编码策略为后续 KG+LLM 融合奠定基础
- 论文 #2：指令微调模型在科学 IE 任务上 F1 领先微调基线 11%
- 论文 #5：跨模态检索 NDCG@10 提升 5.8%，支持图文联合语义检索

概括内容已写入各文献 AI 摘要字段，可在知识库中直接检索。`;

// ─── KG Entity & Graph types ──────────────────────────────────────────────────

interface KGEntity { id: string; name: string; type: string; color: string; }
interface GraphNode { id: string; label: string; type: string; color: string; x: number; y: number; }
interface GraphEdge { id: string; from: string; to: string; label: string; }
interface EvidenceGraph { nodes: GraphNode[]; edges: GraphEdge[]; focusId: string; title: string; }

const ENTITY_TYPE_COLORS: Record<string, string> = {
  Technology: '#6366f1', Concept: '#0ea5e9', Model: '#8b5cf6',
  Algorithm: '#f59e0b', Field: '#10b981', Institution: '#ef4444',
  Metric: '#64748b', Venue: '#d97706', Direction: '#ec4899', Person: '#14b8a6',
};

const KG_ENTITIES: KGEntity[] = [
  { id: 'e1', name: 'Transformer', type: 'Technology', color: ENTITY_TYPE_COLORS.Technology },
  { id: 'e2', name: '知识图谱', type: 'Concept', color: ENTITY_TYPE_COLORS.Concept },
  { id: 'e3', name: 'TKGEmbed', type: 'Model', color: ENTITY_TYPE_COLORS.Model },
  { id: 'e4', name: 'BERT-KG', type: 'Model', color: ENTITY_TYPE_COLORS.Model },
  { id: 'e5', name: 'TransE', type: 'Algorithm', color: ENTITY_TYPE_COLORS.Algorithm },
  { id: 'e6', name: 'NLP', type: 'Field', color: ENTITY_TYPE_COLORS.Field },
  { id: 'e7', name: '清华大学', type: 'Institution', color: ENTITY_TYPE_COLORS.Institution },
  { id: 'e8', name: '北京大学', type: 'Institution', color: ENTITY_TYPE_COLORS.Institution },
  { id: 'e9', name: 'RAG', type: 'Technology', color: ENTITY_TYPE_COLORS.Technology },
  { id: 'e10', name: 'MRR', type: 'Metric', color: ENTITY_TYPE_COLORS.Metric },
  { id: 'e11', name: 'ACL', type: 'Venue', color: ENTITY_TYPE_COLORS.Venue },
  { id: 'e12', name: 'KG+LLM', type: 'Direction', color: ENTITY_TYPE_COLORS.Direction },
  { id: 'e13', name: '时序知识图谱', type: 'Concept', color: ENTITY_TYPE_COLORS.Concept },
  { id: 'e14', name: '多模态图谱', type: 'Concept', color: ENTITY_TYPE_COLORS.Concept },
  { id: 'e15', name: 'ICLR', type: 'Venue', color: ENTITY_TYPE_COLORS.Venue },
  { id: 'e16', name: '深度学习', type: 'Field', color: ENTITY_TYPE_COLORS.Field },
];

// Evidence subgraphs per entity
const EVIDENCE_GRAPHS: Record<string, EvidenceGraph> = {
  'Transformer': {
    title: 'Transformer 证据子图', focusId: 'n1',
    nodes: [
      { id: 'n1', label: 'Transformer', type: 'Technology', color: '#6366f1', x: 220, y: 150 },
      { id: 'n2', label: '知识图谱', type: 'Concept', color: '#0ea5e9', x: 80, y: 80 },
      { id: 'n3', label: 'TKGEmbed', type: 'Model', color: '#8b5cf6', x: 360, y: 70 },
      { id: 'n4', label: 'BERT-KG', type: 'Model', color: '#8b5cf6', x: 370, y: 230 },
      { id: 'n5', label: 'TransE', type: 'Algorithm', color: '#f59e0b', x: 80, y: 230 },
      { id: 'n6', label: 'MRR指标', type: 'Metric', color: '#64748b', x: 220, y: 280 },
    ],
    edges: [
      { id: 'eg1', from: 'n1', to: 'n2', label: '应用于' },
      { id: 'eg2', from: 'n3', to: 'n1', label: '基于' },
      { id: 'eg3', from: 'n4', to: 'n1', label: '基于' },
      { id: 'eg4', from: 'n3', to: 'n5', label: '优于' },
      { id: 'eg5', from: 'n3', to: 'n6', label: '评估指标' },
    ],
  },
  '知识图谱': {
    title: '知识图谱 证据子图', focusId: 'n1',
    nodes: [
      { id: 'n1', label: '知识图谱', type: 'Concept', color: '#0ea5e9', x: 220, y: 150 },
      { id: 'n2', label: 'KG+LLM', type: 'Direction', color: '#ec4899', x: 70, y: 80 },
      { id: 'n3', label: 'Transformer', type: 'Technology', color: '#6366f1', x: 370, y: 80 },
      { id: 'n4', label: '时序知识图谱', type: 'Concept', color: '#0ea5e9', x: 370, y: 230 },
      { id: 'n5', label: '多模态图谱', type: 'Concept', color: '#0ea5e9', x: 70, y: 230 },
      { id: 'n6', label: '图谱嵌入', type: 'Technology', color: '#6366f1', x: 220, y: 285 },
    ],
    edges: [
      { id: 'eg1', from: 'n1', to: 'n2', label: '演化方向' },
      { id: 'eg2', from: 'n3', to: 'n1', label: '增强' },
      { id: 'eg3', from: 'n4', to: 'n1', label: '子类' },
      { id: 'eg4', from: 'n5', to: 'n1', label: '子类' },
      { id: 'eg5', from: 'n1', to: 'n6', label: '核心方法' },
    ],
  },
  'KG+LLM': {
    title: 'KG+LLM 证据子图', focusId: 'n1',
    nodes: [
      { id: 'n1', label: 'KG+LLM', type: 'Direction', color: '#ec4899', x: 220, y: 145 },
      { id: 'n2', label: '知识图谱', type: 'Concept', color: '#0ea5e9', x: 75, y: 80 },
      { id: 'n3', label: 'RAG', type: 'Technology', color: '#6366f1', x: 360, y: 75 },
      { id: 'n4', label: 'NLP', type: 'Field', color: '#10b981', x: 360, y: 225 },
      { id: 'n5', label: '大语言模型', type: 'Technology', color: '#6366f1', x: 75, y: 225 },
      { id: 'n6', label: 'ICLR 2024', type: 'Venue', color: '#d97706', x: 220, y: 280 },
    ],
    edges: [
      { id: 'eg1', from: 'n2', to: 'n1', label: '融合' },
      { id: 'eg2', from: 'n5', to: 'n1', label: '融合' },
      { id: 'eg3', from: 'n1', to: 'n3', label: '增强' },
      { id: 'eg4', from: 'n1', to: 'n4', label: '应用于' },
      { id: 'eg5', from: 'n1', to: 'n6', label: '发表于' },
    ],
  },
  '清华大学': {
    title: '清华大学 证据子图', focusId: 'n1',
    nodes: [
      { id: 'n1', label: '清华大学', type: 'Institution', color: '#ef4444', x: 220, y: 145 },
      { id: 'n2', label: '北京大学', type: 'Institution', color: '#ef4444', x: 75, y: 90 },
      { id: 'n3', label: 'NLP研究', type: 'Field', color: '#10b981', x: 360, y: 70 },
      { id: 'n4', label: 'AI方向', type: 'Field', color: '#10b981', x: 360, y: 225 },
      { id: 'n5', label: '知识图谱', type: 'Concept', color: '#0ea5e9', x: 75, y: 225 },
      { id: 'n6', label: '合作论文', type: 'Concept', color: '#64748b', x: 220, y: 280 },
    ],
    edges: [
      { id: 'eg1', from: 'n1', to: 'n2', label: '合作' },
      { id: 'eg2', from: 'n1', to: 'n3', label: '研究' },
      { id: 'eg3', from: 'n1', to: 'n4', label: '布局' },
      { id: 'eg4', from: 'n1', to: 'n5', label: '应用' },
      { id: 'eg5', from: 'n1', to: 'n6', label: '发表' },
    ],
  },
};

// Default / fallback graph shown when no entity is hovered
const DEFAULT_GRAPH: EvidenceGraph = {
  title: '当前答案证据图谱', focusId: '',
  nodes: [
    { id: 'n1', label: '知识图谱', type: 'Concept', color: '#0ea5e9', x: 220, y: 145 },
    { id: 'n2', label: 'Transformer', type: 'Technology', color: '#6366f1', x: 80, y: 75 },
    { id: 'n3', label: 'KG+LLM', type: 'Direction', color: '#ec4899', x: 360, y: 75 },
    { id: 'n4', label: '时序图谱', type: 'Concept', color: '#0ea5e9', x: 365, y: 225 },
    { id: 'n5', label: '多模态图谱', type: 'Concept', color: '#0ea5e9', x: 80, y: 225 },
    { id: 'n6', label: '图谱嵌入', type: 'Technology', color: '#6366f1', x: 220, y: 285 },
    { id: 'n7', label: 'NLP', type: 'Field', color: '#10b981', x: 150, y: 55 },
  ],
  edges: [
    { id: 'e1', from: 'n2', to: 'n1', label: '增强' },
    { id: 'e2', from: 'n1', to: 'n3', label: '演化' },
    { id: 'e3', from: 'n4', to: 'n1', label: '子类' },
    { id: 'e4', from: 'n5', to: 'n1', label: '子类' },
    { id: 'e5', from: 'n1', to: 'n6', label: '方法' },
    { id: 'e6', from: 'n7', to: 'n2', label: '应用' },
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string; role: 'user' | 'assistant'; content: string;
  entities?: string[]; // detected KG entities in this message
  parsedTriples?: { subject: string; predicate: string; object: string; confidence: number }[];
  evidences?: EvidenceItem[];
}
interface Conversation { id: string; assistantId: string; title: string; messages: Message[]; createdAt: Date; }

interface EvidenceItem {
  id: string;
  type: 'paper' | 'triple' | 'patent' | 'report' | 'dataset';
  title: string;
  snippet: string;
  source: string;
  year?: string;
  confidence: number;
  keywords: string[];
}

const EVIDENCE_TYPE_META: Record<EvidenceItem['type'], { label: string; color: string; bg: string }> = {
  paper:   { label: '论文',     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  triple:  { label: '三元组',   color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  patent:  { label: '专利',     color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  report:  { label: '报告',     color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-200' },
  dataset: { label: '数据集',   color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200' },
};

const EVIDENCE_POOL: EvidenceItem[] = [
  {
    id: 'ev1', type: 'paper', title: 'TKGEmbed: Transformer-based Temporal Knowledge Graph Embedding',
    source: 'IEEE TKDE', year: '2024', confidence: 0.94,
    snippet: '利用多头自注意力聚合实体邻居，相比 TransE 在 MRR 上平均提升 7–12%。',
    keywords: ['transformer', '嵌入', 'tkg', '时序', 'mrr'],
  },
  {
    id: 'ev2', type: 'paper', title: 'BERT-KG: Pretrained Language Models for Knowledge Graph Completion',
    source: 'ACL', year: '2023', confidence: 0.91,
    snippet: '将实体描述编码为上下文向量，少样本关系补全 Hits@10 达到 0.68。',
    keywords: ['bert', 'kg', '补全', 'llm', 'transformer'],
  },
  {
    id: 'ev3', type: 'paper', title: 'Unify to Retrieve: Knowledge Graph Augmented Large Language Models',
    source: 'ICLR', year: '2024', confidence: 0.93,
    snippet: 'KG+LLM 融合架构使开放域问答 F1 提升 6.4%，幻觉率下降 18%。',
    keywords: ['kg+llm', 'llm', 'rag', '问答', '热点', '趋势'],
  },
  {
    id: 'ev4', type: 'triple', title: 'Transformer —应用于→ 知识图谱嵌入',
    source: '科技论文知识图谱', year: '2024', confidence: 0.96,
    snippet: '共现 1,203 次，路径：Transformer → 自注意力 → 邻居聚合 → 图谱嵌入。',
    keywords: ['transformer', '知识图谱', '关系', '关联'],
  },
  {
    id: 'ev5', type: 'triple', title: '清华大学 —合作→ 北京大学',
    source: '机构合作子图', year: '2023', confidence: 0.88,
    snippet: '近五年共同发表 47 篇 NLP / 知识图谱论文，主要合作学者 12 人。',
    keywords: ['清华', '北大', '机构', '合作', '学者'],
  },
  {
    id: 'ev6', type: 'triple', title: '知识图谱 —演化方向→ KG+LLM',
    source: '概念演化图谱', year: '2024', confidence: 0.90,
    snippet: '2022–2024 发文量年增超 40%，ICLR / ACL 均出现专题研讨。',
    keywords: ['kg+llm', '热点', '趋势', '知识图谱'],
  },
  {
    id: 'ev7', type: 'patent', title: '一种基于注意力机制的知识图谱补全方法',
    source: 'CN115862341A', year: '2023', confidence: 0.82,
    snippet: '公开了关系感知位置编码与多跳推理模块，已进入实质审查。',
    keywords: ['专利', '补全', 'transformer', '嵌入'],
  },
  {
    id: 'ev8', type: 'report', title: '全球知识图谱与大模型融合技术发展报告',
    source: '中国信通院', year: '2024', confidence: 0.86,
    snippet: '产业侧对 KG 增强检索、可解释问答的需求同比增长 67%。',
    keywords: ['产业', '决策', '趋势', '需求', '报告'],
  },
  {
    id: 'ev9', type: 'dataset', title: 'FB15k-237 / WN18RR 评测子集',
    source: '图谱评测库', year: '2024', confidence: 0.89,
    snippet: '标准链接预测基准，当前最佳 MRR 分别为 0.365 与 0.497。',
    keywords: ['数据集', '评测', '嵌入', 'mrr', '校验'],
  },
  {
    id: 'ev10', type: 'paper', title: 'Temporal Knowledge Graphs: A Survey of Recent Advances',
    source: 'ACM Computing Surveys', year: '2024', confidence: 0.87,
    snippet: '梳理时序图谱表示、外推与事件预测三类任务，并给出统一评测协议。',
    keywords: ['时序', '综述', '趋势', '知识图谱'],
  },
  {
    id: 'ev11', type: 'paper', title: 'Multimodal Knowledge Graphs for Scientific Discovery',
    source: 'KDD', year: '2023', confidence: 0.84,
    snippet: '融合论文全文、图表与实验表格，跨模态检索 NDCG@10 提升 5.8%。',
    keywords: ['多模态', '文献', '推荐', '检索'],
  },
  {
    id: 'ev12', type: 'report', title: '知识图谱节点质量扫描月报',
    source: '平台校验任务', year: '2026', confidence: 0.92,
    snippet: '6,204 个正常节点，89 个属性缺失警告，12 个孤立/关系错误异常。',
    keywords: ['校验', '异常', '质量', '冗余', '节点'],
  },
  {
    id: 'ev13', type: 'triple', title: '李明 —就职于→ 北京人工智能研究院',
    source: '学者画像库', year: '2024', confidence: 0.95,
    snippet: 'h 指数 42，近五年 ACL/EMNLP 发文 18 篇，研究方向为图谱嵌入。',
    keywords: ['学者', '专家', '检索', '李明'],
  },
  {
    id: 'ev14', type: 'paper', title: 'Rule Mining on Large-scale Knowledge Graphs',
    source: 'VLDB', year: '2023', confidence: 0.85,
    snippet: '在 1.2 亿三元组上挖掘置信度 ≥ 0.8 的关联规则 47 条，支持规则导出。',
    keywords: ['规则', '挖掘', '推理', '预测'],
  },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function detectEntities(text: string): string[] {
  return KG_ENTITIES.filter(e => text.includes(e.name)).map(e => e.name);
}

function parseStructuredTriples(content: string, entities: string[]): Message['parsedTriples'] {
  if (entities.length === 0) return undefined;
  const triples: NonNullable<Message['parsedTriples']> = [];
  if (content.includes('Transformer') && content.includes('知识图谱')) {
    triples.push({ subject: 'Transformer', predicate: '应用于', object: '知识图谱嵌入', confidence: 0.94 });
    triples.push({ subject: 'TKGEmbed', predicate: '发表期刊', object: 'IEEE TKDE', confidence: 0.91 });
  }
  if (content.includes('KG+LLM') || content.includes('大语言模型')) {
    triples.push({ subject: '知识图谱', predicate: '融合', object: '大语言模型', confidence: 0.93 });
    triples.push({ subject: 'KG+LLM', predicate: '研究热点', object: '知识补全', confidence: 0.88 });
  }
  if (triples.length === 0 && entities.length >= 2) {
    triples.push({ subject: entities[0], predicate: '关联', object: entities[1], confidence: 0.82 });
  }
  return triples.length > 0 ? triples : undefined;
}

function generateResponse(assistantId: string, question: string, llmModelId?: string): string {
  const q = question.toLowerCase();
  const modelName = PAPER_LLM_MODELS.find(m => m.id === llmModelId)?.name ?? 'GPT-4o';
  switch (assistantId) {
    case 'kg-qa':
      if (q.includes('transformer') || q.includes('嵌入')) return 'Transformer架构在知识图谱嵌入中已成为主流方法。代表性工作包括 TKGEmbed（IEEE TKDE 2024）、BERT-KG（ACL 2023）等，利用多头自注意力机制聚合实体邻居信息，相比传统 TransE 方法在 MRR 指标上平均提升7-12%。\n\n关键进展：\n• 关系感知位置编码成为重要方向\n• 多跳推理能力显著提升\n• 与大语言模型的融合（KG+LLM）是当前热点';
      if (q.includes('热点') || q.includes('趋势')) return '近三年知识图谱研究热点：\n\n1. KG+LLM 融合 — 用图谱增强大模型，2024年发文量增长超40%\n2. 时序知识图谱 — 处理随时间变化的知识，ICLR 2024有多篇高引论文\n3. 多模态图谱 — 融合文本、图像、表格等多模态信息\n4. 图谱嵌入 — 少样本、跨领域补全方法持续受关注';
      return `根据知识图谱数据，关于"${question}"的查询结果：\n\n图谱中包含与该主题相关的 847个实体、2,341条关系。核心节点包括代表性学者、机构和技术概念。如需深入分析某一方面，可以继续追问。`;
    case 'relation-analysis':
      return `关系分析结果\n\n已对图谱中相关实体进行多维度关联强度计算：\n\n知识图谱 ↔ Transformer  关联强度 0.94  共现 1,203次\n知识图谱 ↔ 深度学习     关联强度 0.88  共现 987次\n知识图谱 ↔ NLP         关联强度 0.82  共现 756次\n\n结论：知识图谱与Transformer关联最强，主要通过"嵌入方法"和"预训练模型"两条路径关联。可导出为CSV或图表报告。`;
    case 'inference-prediction':
      return `规则挖掘结果\n\n从图谱中挖掘到以下高置信度关联规则：\n\n规则 1（置信度 0.89）\n若：学者 发表 → Transformer论文 且 Transformer 应用于 → NLP\n则：学者 可能专注 → NLP研究\n\n规则 2（置信度 0.84）\n若：机构A 与 机构B 共同发表 → 3篇以上\n则：机构A 与 机构B 可能存在 → 长期合作关系\n\n共挖掘 47条有效规则，可按置信度筛选并导出。`;
    case 'decision-support':
      return `决策建议报告\n\n推荐研究方向（综合竞争力评分）\n1. KG+LLM 融合 — 评分 9.2/10，发文增长率 +67%\n2. 时序知识图谱 — 评分 8.7/10，应用场景广泛\n3. 多模态图谱 — 评分 8.3/10，交叉融合机会大\n\n核心依据：引用增长率、顶会接受率、产业应用需求三项综合评估。建议优先布局 KG+LLM 方向，同时关注时序知识图谱的跨领域应用。`;
    case 'knowledge-validation':
      return `图谱校验报告\n\n检测结果摘要\n• 正常节点：6,204 个\n• 警告（属性缺失）：89 个\n• 异常（孤立节点/关系错误）：12 个\n\n主要问题：\n1. 12个实体缺少必填属性（birth_date / founded）\n2. 5条关系的目标实体不存在于图谱中\n3. 3个节点疑似重复（相似度 > 95%）\n\n点击确认即可执行自动修复。`;
    case 'paper-recommendation':
      if (q.includes('推荐') || q.includes('论文') || q.includes('文献')) {
        return `使用 **${modelName}** 完成语义检索，共匹配 **42 篇**文献（1.5亿+ 库），展示前 5 篇：\n\n1. 基于Transformer的知识图谱嵌入方法研究 — IEEE TKDE 2024 · 引用 142\n2. Large Language Models for Scientific Knowledge Extraction — NeurIPS 2024 · 引用 389\n3. 面向科研领域的知识图谱构建与应用综述 — ACM SIGKDD 2023 · 引用 256\n4. Graph Neural Networks for Biomedical Knowledge Discovery — Nature 2024 · 引用 1203\n5. Multimodal Knowledge Graphs for Scientific Discovery — KDD 2023 · 引用 178`;
      }
      return `基于 **${modelName}** 与 1.5亿+ 文献库的语义检索，关于「${question}」共找到 42 篇相关文献。请说明发表年份、期刊等级或引用量等约束，以获得更精准的推荐列表。`;
    default:
      return `基于图谱数据，关于"${question}"的分析：\n\n已检索到相关实体 156个，关系路径 423条。如需具体维度的深入分析，请继续提问。`;
  }
}

function pickEvidences(assistantId: string, question: string): EvidenceItem[] {
  const q = question.toLowerCase();
  const scored = EVIDENCE_POOL.map(ev => {
    const hits = ev.keywords.filter(k => q.includes(k)).length;
    let bias = 0;
    if (assistantId === 'paper-recommendation' && ev.type === 'paper') bias += 2;
    if (assistantId === 'scholar-search' && (ev.type === 'triple' || ev.id === 'ev13')) bias += 2;
    if (assistantId === 'relation-analysis' && ev.type === 'triple') bias += 2;
    if (assistantId === 'inference-prediction' && (ev.type === 'paper' || ev.id === 'ev14')) bias += 1;
    if (assistantId === 'decision-support' && ev.type === 'report') bias += 2;
    if (assistantId === 'knowledge-validation' && (ev.type === 'dataset' || ev.id === 'ev12')) bias += 2;
    return { ev, score: hits * 3 + bias };
  }).sort((a, b) => b.score - a.score || b.ev.confidence - a.ev.confidence);

  const picked: EvidenceItem[] = [];
  for (const row of scored) {
    if (picked.length >= 4) break;
    if (row.score > 0 || picked.length < 3) picked.push(row.ev);
  }
  return picked.slice(0, 4);
}

function EvidenceList({ evidences }: { evidences: EvidenceItem[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-3 pt-2.5 border-t border-gray-100">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-800"
      >
        <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
        支撑证据
        <span className="text-[10px] text-gray-400 font-normal">{evidences.length} 条</span>
        <ChevronRight className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <ol className="mt-2 space-y-2">
          {evidences.map((ev, i) => {
            const meta = EVIDENCE_TYPE_META[ev.type];
            return (
              <li key={ev.id} className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-gray-100 text-[10px] text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5">
                    <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[12px] font-medium text-gray-800 leading-snug">{ev.title}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed pl-[18px]">{ev.snippet}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 pl-[18px]">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Link2 className="w-2.5 h-2.5" />{ev.source}{ev.year ? ` · ${ev.year}` : ''}
                    </span>
                    <span className="text-[10px] text-gray-400 tabular-nums">置信度 {(ev.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ─── Decision Orchestration Canvas ───────────────────────────────────────────

interface OrcheNode { id: string; modelId: string; weight: number; }

interface DecisionModel {
  id: string; name: string; color: string; hexBg: string;
  description: string; Icon: any;
}

const DECISION_MODELS: DecisionModel[] = [
  { id: 'citation-growth', name: '引用增长率',   color: '#2563eb', hexBg: '#eff6ff', description: '近5年引用增长趋势反映方向潜力',        Icon: TrendingUp  },
  { id: 'conference-rate', name: '顶会接受率',   color: '#8b5cf6', hexBg: '#f5f3ff', description: '顶会/顶刊接受情况衡量学术认可度',      Icon: ShieldCheck },
  { id: 'industry-demand', name: '产业应用需求', color: '#10b981', hexBg: '#ecfdf5', description: '产业落地及招聘需求所反映的技术热度',    Icon: Network     },
  { id: 'academic-impact', name: '学术影响力',   color: '#f59e0b', hexBg: '#fffbeb', description: 'h-index、引用量等传统学术影响力指标',   Icon: Brain       },
  { id: 'innovation',      name: '创新颠覆性',   color: '#f97316', hexBg: '#fff7ed', description: '方向颠覆性和跨领域融合创新机会评估',    Icon: Sparkles    },
  { id: 'resource-cost',   name: '资源投入成本', color: '#ef4444', hexBg: '#fef2f2', description: '计算资源、数据与人才成本（越低越好）',  Icon: Target      },
];

const DECISION_OPTIONS = [
  { id: 'opt1', name: 'KG+LLM 融合' },
  { id: 'opt2', name: '时序知识图谱' },
  { id: 'opt3', name: '多模态图谱' },
  { id: 'opt4', name: '图神经网络' },
];

const OPTION_SCORES: Record<string, Record<string, number>> = {
  opt1: { 'citation-growth': 92, 'conference-rate': 88, 'industry-demand': 95, 'academic-impact': 85, 'innovation': 90, 'resource-cost': 38 },
  opt2: { 'citation-growth': 78, 'conference-rate': 82, 'industry-demand': 72, 'academic-impact': 80, 'innovation': 75, 'resource-cost': 65 },
  opt3: { 'citation-growth': 85, 'conference-rate': 79, 'industry-demand': 68, 'academic-impact': 77, 'innovation': 88, 'resource-cost': 55 },
  opt4: { 'citation-growth': 65, 'conference-rate': 74, 'industry-demand': 58, 'academic-impact': 82, 'innovation': 62, 'resource-cost': 72 },
};

const DEFAULT_ORCH_NODES: OrcheNode[] = [
  { id: 'dn1', modelId: 'citation-growth', weight: 35 },
  { id: 'dn2', modelId: 'conference-rate', weight: 25 },
  { id: 'dn3', modelId: 'industry-demand', weight: 40 },
];

function computeCompositeScores(nodes: OrcheNode[]) {
  const totalW = nodes.reduce((s, n) => s + n.weight, 0) || 1;
  return DECISION_OPTIONS.map(opt => {
    const score = nodes.reduce((s, n) => {
      const raw = OPTION_SCORES[opt.id]?.[n.modelId] ?? 50;
      const adj = n.modelId === 'resource-cost' ? 100 - raw : raw;
      return s + adj * (n.weight / totalW);
    }, 0);
    return { ...opt, score: Math.round(score * 10) / 10 };
  }).sort((a, b) => b.score - a.score);
}

function DecisionOrchestrator({
  onApply,
  onSkip,
}: {
  onApply: (nodes: OrcheNode[]) => void;
  onSkip: () => void;
}) {
  const [nodes, setNodes] = useState<OrcheNode[]>(DEFAULT_ORCH_NODES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Layout constants
  const CARD_H = 86, CARD_W = 218, GAP = 10, PAD = 22;
  const CONN_W = 170, OUT_W = 224;

  const totalNodes = nodes.length;
  const canvasH = PAD * 2 + totalNodes * CARD_H + Math.max(0, totalNodes - 1) * GAP;
  const getNodeTopY  = (i: number) => PAD + i * (CARD_H + GAP);
  const getNodeCentY = (i: number) => getNodeTopY(i) + CARD_H / 2;
  const outputTopY   = (canvasH - CARD_H) / 2;
  const outputCentY  = canvasH / 2;

  const totalWeight = nodes.reduce((s, n) => s + n.weight, 0);
  const weightOk = Math.abs(totalWeight - 100) < 3;

  const addModel = (modelId: string) => {
    if (nodes.some(n => n.modelId === modelId) || nodes.length >= 6) return;
    setNodes(prev => [...prev, { id: uid(), modelId, weight: Math.round(100 / (prev.length + 1)) }]);
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateWeight = (id: string, w: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, weight: w } : n));
  };

  const normalize = () => {
    const total = nodes.reduce((s, n) => s + n.weight, 0);
    if (total === 0) return;
    let acc = 0;
    setNodes(prev => prev.map((n, i) => {
      if (i === prev.length - 1) return { ...n, weight: 100 - acc };
      const w = Math.round(n.weight / total * 100);
      acc += w;
      return { ...n, weight: w };
    }));
  };

  const scores = computeCompositeScores(nodes);
  const topScore = scores[0]?.score ?? 100;

  const RANK_COLORS = ['#f59e0b', '#6366f1', '#10b981', '#94a3b8'];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <SlidersHorizontal className="w-4.5 h-4.5 text-rose-600" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">决策评分流程编排</div>
            <div className="text-xs text-gray-400">
              配置决策模型及权重 — 助手将按此流程对决策选项进行二次加权评分，供参考
            </div>
          </div>
        </div>
        <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
          <X className="w-3.5 h-3.5" />跳过
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left: Model Palette */}
        <div className="w-44 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">模型库</div>
            <div className="text-[10px] text-gray-400 mt-0.5">点击 + 添加到画布</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {DECISION_MODELS.map(model => {
              const added = nodes.some(n => n.modelId === model.id);
              const maxed = nodes.length >= 6;
              return (
                <button
                  key={model.id}
                  onClick={() => addModel(model.id)}
                  disabled={added || maxed}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    added
                      ? 'border-gray-100 bg-gray-100 text-gray-400 cursor-default'
                      : maxed
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-white'
                        : 'border-gray-200 bg-white hover:shadow-sm hover:border-gray-300 cursor-pointer'
                  }`}
                  style={!added && !maxed ? { borderLeftColor: model.color, borderLeftWidth: 3 } : {}}
                >
                  <div className="flex items-center justify-between mb-1">
                    <model.Icon className="w-3.5 h-3.5" style={{ color: added ? '#9ca3af' : model.color }} />
                    {added
                      ? <span className="text-[9px] text-gray-400 bg-gray-200 px-1 py-0.5 rounded">已添加</span>
                      : <Plus className="w-3 h-3 text-gray-400" />
                    }
                  </div>
                  <div className={`font-semibold text-[11px] leading-tight ${added ? 'text-gray-400' : 'text-gray-700'}`}>
                    {model.name}
                  </div>
                  <div className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${added ? 'text-gray-300' : 'text-gray-400'}`}>
                    {model.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Orchestration Canvas */}
        <div className="flex-1 min-w-0 overflow-auto relative"
          style={{ background: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 relative z-10">
              <GitMerge className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">从左侧模型库添加决策模型</p>
              <p className="text-xs mt-1 text-gray-400">至少添加 1 个模型才能配置</p>
            </div>
          ) : (
            <div className="p-6 relative z-10">
              <div className="relative" style={{ height: canvasH, minWidth: CARD_W + CONN_W + OUT_W + 16 }}>

                {/* SVG connection layer */}
                <svg
                  className="absolute inset-0 pointer-events-none overflow-visible"
                  style={{ width: CARD_W + CONN_W + OUT_W + 16, height: canvasH }}
                >
                  <defs>
                    {nodes.map(node => {
                      const model = DECISION_MODELS.find(m => m.id === node.modelId)!;
                      return (
                        <marker key={`arr-${node.id}`} id={`arr-${node.id}`}
                          markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L7,3 z" fill={model.color} opacity="0.65" />
                        </marker>
                      );
                    })}
                  </defs>

                  {nodes.map((node, i) => {
                    const model = DECISION_MODELS.find(m => m.id === node.modelId)!;
                    const sx = CARD_W + 4, sy = getNodeCentY(i);
                    const dx = CARD_W + CONN_W + 4, dy = outputCentY;
                    const mx = (sx + dx) / 2;
                    const labelX = mx, labelY = (sy + dy) / 2;
                    const isSelected = selectedId === node.id;

                    return (
                      <g key={node.id}>
                        <path
                          d={`M ${sx} ${sy} C ${mx} ${sy} ${mx} ${dy} ${dx} ${dy}`}
                          stroke={model.color}
                          strokeWidth={isSelected ? 2.5 : 1.8}
                          fill="none"
                          opacity={isSelected ? 0.9 : 0.5}
                          markerEnd={`url(#arr-${node.id})`}
                        />
                        {/* Weight pill on edge */}
                        <rect x={labelX - 20} y={labelY - 10} width="40" height="20" rx="10"
                          fill="white" stroke={model.color} strokeWidth="1.5" opacity="0.95" />
                        <text x={labelX} y={labelY + 4} textAnchor="middle"
                          fill={model.color} fontSize="10" fontWeight="700">
                          {node.weight}%
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Model node cards */}
                {nodes.map((node, i) => {
                  const model = DECISION_MODELS.find(m => m.id === node.modelId)!;
                  const isSelected = selectedId === node.id;
                  return (
                    <div key={node.id} className="absolute"
                      style={{ left: 0, top: getNodeTopY(i), width: CARD_W }}>
                      <div
                        onClick={() => setSelectedId(isSelected ? null : node.id)}
                        className="bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
                        style={isSelected
                          ? { borderColor: model.color, boxShadow: `0 0 0 3px ${model.color}20` }
                          : { borderColor: '#e5e7eb' }
                        }
                      >
                        {/* Card top */}
                        <div className="flex items-center gap-2.5 px-3 pt-3 pb-1.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: model.hexBg }}>
                            <model.Icon className="w-3.5 h-3.5" style={{ color: model.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-800 truncate">{model.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{model.description}</div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); removeNode(node.id); }}
                            className="flex-shrink-0 p-0.5 text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Weight slider */}
                        <div className="px-3 pb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-gray-400">权重</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0} max={100}
                                value={node.weight}
                                onChange={e => { e.stopPropagation(); updateWeight(node.id, Math.max(0, Math.min(100, Number(e.target.value) || 0))); }}
                                onClick={e => e.stopPropagation()}
                                className="w-10 text-center text-[11px] font-bold border border-gray-200 rounded-md py-0.5 focus:outline-none focus:border-blue-400 tabular-nums"
                                style={{ color: model.color }}
                              />
                              <span className="text-[10px] text-gray-400">%</span>
                            </div>
                          </div>
                          <input
                            type="range" min={0} max={100} step={1}
                            value={node.weight}
                            onChange={e => { e.stopPropagation(); updateWeight(node.id, Number(e.target.value)); }}
                            onClick={e => e.stopPropagation()}
                            className="w-full h-1.5 rounded-full cursor-pointer appearance-none"
                            style={{ accentColor: model.color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Output (综合决策) node */}
                <div className="absolute" style={{ left: CARD_W + CONN_W + 8, top: outputTopY, width: OUT_W }}>
                  <div className="bg-gray-900 text-white rounded-xl border-2 border-gray-700 shadow-xl p-4 h-full"
                    style={{ minHeight: CARD_H }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                        <GitMerge className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">综合决策</div>
                        <div className="text-[10px] text-gray-400">{nodes.length} 模型 · 加权融合</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {scores.slice(0, 4).map((s, rank) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 w-3 text-right flex-shrink-0">{rank + 1}</span>
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(s.score / topScore) * 100}%`, background: RANK_COLORS[rank] }} />
                          </div>
                          <span className="text-[10px] text-gray-300 flex-shrink-0 w-12 truncate" title={s.name}>{s.name}</span>
                          <span className="text-[10px] font-mono text-gray-200 w-7 text-right flex-shrink-0">{s.score.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Right: Score Preview */}
        <div className="w-52 flex-shrink-0 border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">评分预览</div>
            <div className="text-[10px] text-gray-400 mt-0.5">基于当前权重实时计算</div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-28 text-gray-400 text-center">
                <p className="text-xs">添加模型后查看实时评分</p>
              </div>
            ) : (
              <>
                {/* Ranked bars */}
                <div className="space-y-2.5">
                  {scores.map((s, rank) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold w-4"
                            style={{ color: RANK_COLORS[rank] }}>#{rank + 1}</span>
                          <span className="text-[11px] text-gray-700 font-medium">{s.name}</span>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums text-gray-800">{s.score.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(s.score / topScore) * 100}%`, background: RANK_COLORS[rank] }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Per-model breakdown for top option */}
                {scores[0] && (
                  <div className="pt-2.5 border-t border-gray-100">
                    <div className="text-[10px] font-semibold text-gray-500 mb-2">
                      「{scores[0].name}」各模型得分
                    </div>
                    <div className="space-y-1.5">
                      {nodes.map(n => {
                        const model = DECISION_MODELS.find(m => m.id === n.modelId)!;
                        const raw = OPTION_SCORES[scores[0].id]?.[n.modelId] ?? 50;
                        const adj = n.modelId === 'resource-cost' ? 100 - raw : raw;
                        return (
                          <div key={n.id} className="flex items-center gap-1.5">
                            <model.Icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: model.color }} />
                            <span className="text-[10px] text-gray-500 flex-1 truncate">{model.name}</span>
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${adj}%`, background: model.color }} />
                            </div>
                            <span className="text-[10px] font-mono font-semibold w-6 text-right"
                              style={{ color: model.color }}>{adj}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                      资源投入成本已自动取反（越低越好）
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-3.5 flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-gray-500">权重合计</span>
          <span className={`font-bold tabular-nums ${weightOk ? 'text-emerald-600' : 'text-amber-600'}`}>
            {totalWeight}%
          </span>
          {!weightOk && totalWeight > 0 && (
            <button onClick={normalize}
              className="text-blue-600 hover:text-blue-700 hover:underline transition-colors flex-shrink-0">
              自动归一化
            </button>
          )}
          {weightOk && <span className="text-emerald-500 text-[10px]">✓ 权重正常</span>}
        </div>
        <div className="flex-1" />
        <button onClick={onSkip}
          className="text-sm px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
          跳过，直接对话
        </button>
        <button
          onClick={() => onApply(nodes)}
          disabled={nodes.length === 0}
          className="text-sm px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
        >
          应用配置并开始对话
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Prompt template pattern renderer ────────────────────────────────────────

function TemplatePattern({ pattern }: { pattern: string }) {
  const parts = pattern.split(/(\[[^\]]+\])/);
  return (
    <span className="font-mono text-[11px] leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith('[') ? (
          <span key={i} className="bg-blue-100 text-blue-700 rounded px-0.5 mx-px font-semibold">{part}</span>
        ) : (
          <span key={i} className="text-gray-600">{part}</span>
        )
      )}
    </span>
  );
}

// ─── Entity-highlighted text renderer ────────────────────────────────────────

function HighlightedText({
  text,
  onEntityHover,
  onEntityLeave,
}: {
  text: string;
  onEntityHover: (name: string) => void;
  onEntityLeave: () => void;
}) {
  // Collect all non-overlapping entity matches, preferring longer matches
  const matches: { start: number; end: number; entity: KGEntity }[] = [];
  for (const entity of KG_ENTITIES) {
    let idx = 0;
    while ((idx = text.indexOf(entity.name, idx)) !== -1) {
      matches.push({ start: idx, end: idx + entity.name.length, entity });
      idx += entity.name.length;
    }
  }
  // Sort by position; on tie prefer longer match
  matches.sort((a, b) => a.start - b.start || b.entity.name.length - a.entity.name.length);
  // Remove overlaps
  const filtered: typeof matches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.start >= lastEnd) { filtered.push(m); lastEnd = m.end; }
  }
  // Build segments
  const segments: { text: string; entity?: KGEntity }[] = [];
  let pos = 0;
  for (const m of filtered) {
    if (m.start > pos) segments.push({ text: text.slice(pos, m.start) });
    segments.push({ text: m.entity.name, entity: m.entity });
    pos = m.end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos) });

  return (
    <span>
      {segments.map((seg, i) =>
        seg.entity ? (
          <span
            key={i}
            className="cursor-pointer rounded px-0.5 font-medium transition-all"
            style={{
              color: seg.entity.color,
              backgroundColor: seg.entity.color + '18',
              borderBottom: `1.5px solid ${seg.entity.color}60`,
            }}
            onMouseEnter={() => onEntityHover(seg.entity!.name)}
            onMouseLeave={onEntityLeave}
            title={`${seg.entity.type} · 悬停查看证据图谱`}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

// ─── SVG Evidence Graph ───────────────────────────────────────────────────────

function EvidenceGraphSVG({
  graph,
  focusNodeId,
  onNodeClick,
}: {
  graph: EvidenceGraph;
  focusNodeId: string;
  onNodeClick: (label: string) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const getNeighborIds = (nodeId: string) => {
    const ids = new Set<string>();
    graph.edges.forEach(e => {
      if (e.from === nodeId) ids.add(e.to);
      if (e.to === nodeId) ids.add(e.from);
    });
    return ids;
  };

  const activeId = hoveredNode || focusNodeId;
  const neighbors = activeId ? getNeighborIds(activeId) : new Set<string>();

  const getNodeOpacity = (nodeId: string) => {
    if (!activeId) return 1;
    if (nodeId === activeId || neighbors.has(nodeId)) return 1;
    return 0.25;
  };

  const getEdgeOpacity = (edge: GraphEdge) => {
    if (!activeId) return 0.5;
    if (edge.from === activeId || edge.to === activeId) return 1;
    return 0.1;
  };

  // Edge midpoint for label
  const edgeMid = (e: GraphEdge) => {
    const from = graph.nodes.find(n => n.id === e.from)!;
    const to = graph.nodes.find(n => n.id === e.to)!;
    return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  };

  // Arrow endpoint (stop at node edge)
  const arrowEnd = (e: GraphEdge) => {
    const from = graph.nodes.find(n => n.id === e.from)!;
    const to = graph.nodes.find(n => n.id === e.to)!;
    const dx = to.x - from.x; const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = 26;
    return { x: to.x - (dx / dist) * r, y: to.y - (dy / dist) * r };
  };

  const arrowStart = (e: GraphEdge) => {
    const from = graph.nodes.find(n => n.id === e.from)!;
    const to = graph.nodes.find(n => n.id === e.to)!;
    const dx = to.x - from.x; const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = 26;
    return { x: from.x + (dx / dist) * r, y: from.y + (dy / dist) * r };
  };

  return (
    <svg viewBox="0 0 440 330" className="w-full h-full" style={{ userSelect: 'none' }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#6366f1" />
        </marker>
        {graph.nodes.map(node => (
          <filter key={`glow-${node.id}`} id={`glow-${node.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>

      {/* Edges */}
      {graph.edges.map(edge => {
        const start = arrowStart(edge);
        const end = arrowEnd(edge);
        const mid = edgeMid(edge);
        const isActive = activeId && (edge.from === activeId || edge.to === activeId);
        const opacity = getEdgeOpacity(edge);
        return (
          <g key={edge.id} opacity={opacity} className="transition-opacity duration-200">
            <line
              x1={start.x} y1={start.y} x2={end.x} y2={end.y}
              stroke={isActive ? '#6366f1' : '#94a3b8'}
              strokeWidth={isActive ? 1.8 : 1.2}
              markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow)'}
              strokeDasharray={isActive ? 'none' : '4 3'}
            />
            <rect
              x={mid.x - 22} y={mid.y - 9} width={44} height={18} rx={4}
              fill="white" opacity={0.92}
            />
            <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize={9} fill={isActive ? '#6366f1' : '#94a3b8'} fontWeight={isActive ? '600' : '400'}>
              {edge.label}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {graph.nodes.map(node => {
        const isFocus = node.id === focusNodeId;
        const isHovered = node.id === hoveredNode;
        const isActive = node.id === activeId;
        const nodeOpacity = getNodeOpacity(node.id);
        const r = isActive ? 30 : 26;
        return (
          <g
            key={node.id}
            className="cursor-pointer"
            opacity={nodeOpacity}
            style={{ transition: 'opacity 0.2s' }}
            onClick={() => onNodeClick(node.label)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Glow ring for focus */}
            {isFocus && (
              <circle cx={node.x} cy={node.y} r={r + 8} fill={node.color} opacity={0.15} className="animate-pulse" />
            )}
            {/* Node circle */}
            <circle
              cx={node.x} cy={node.y} r={r}
              fill={isActive ? node.color : 'white'}
              stroke={node.color}
              strokeWidth={isActive ? 0 : 2}
              filter={isActive ? `url(#glow-${node.id})` : undefined}
              style={{ transition: 'all 0.15s' }}
            />
            {/* Initials or short label */}
            <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={10}
              fill={isActive ? 'white' : node.color}
              fontWeight="700">
              {node.label.length <= 3 ? node.label : node.label.slice(0, 2)}
            </text>
            {/* Full label below */}
            <text x={node.x} y={node.y + r + 14} textAnchor="middle" fontSize={10}
              fill={isActive ? '#1e293b' : '#475569'} fontWeight={isActive ? '600' : '400'}>
              {node.label}
            </text>
            {/* Type badge */}
            <text x={node.x} y={node.y + r + 25} textAnchor="middle" fontSize={8} fill={node.color} opacity={0.8}>
              {node.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── KG Panel ─────────────────────────────────────────────────────────────────

function KGPanel({
  hoveredEntity,
  onNodeClick,
  onClose,
}: {
  hoveredEntity: string | null;
  onNodeClick: (label: string) => void;
  onClose: () => void;
}) {
  const graph = hoveredEntity ? (EVIDENCE_GRAPHS[hoveredEntity] ?? DEFAULT_GRAPH) : DEFAULT_GRAPH;
  const focusNode = hoveredEntity
    ? (graph.nodes.find(n => n.label === hoveredEntity || n.id === graph.focusId)?.id ?? '')
    : '';

  return (
    <div className="w-[380px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Network size={13} className="text-indigo-600" />
        </div>
        <span className="text-xs font-semibold text-gray-700 flex-1">可视化联动</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400">
          <X size={13} />
        </button>
      </div>

      {/* Entity focus indicator */}
      <div className="px-4 py-2 flex-shrink-0 border-b border-gray-50 min-h-[40px] flex items-center">
        {hoveredEntity ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: KG_ENTITIES.find(e => e.name === hoveredEntity)?.color ?? '#6366f1' }} />
            <span className="text-xs text-gray-500">证据图谱：</span>
            <span className="text-xs font-semibold" style={{ color: KG_ENTITIES.find(e => e.name === hoveredEntity)?.color ?? '#6366f1' }}>
              {hoveredEntity}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">将鼠标悬停在答案中的实体上查看证据子图</span>
        )}
      </div>

      {/* Graph canvas */}
      <div className="flex-1 overflow-hidden px-2 py-2 flex items-center justify-center min-h-0">
        <EvidenceGraphSVG graph={graph} focusNodeId={focusNode} onNodeClick={onNodeClick} />
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-50 flex-shrink-0">
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          {Object.entries(ENTITY_TYPE_COLORS).slice(0, 6).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400">{type}</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-400 flex items-center gap-1">
          <CornerDownLeft size={10} />
          点击节点可直接追问该实体
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ApplicationCenterProps {
  initialAssistantId?: string;
  initialFocus?: AppCenterFocus;
}

const DEMO_PARSE_QUESTION = 'Transformer 在知识图谱嵌入中有什么作用？请基于图谱回答。';
const DEMO_PARSE_ANSWER = 'Transformer架构在知识图谱嵌入中已成为主流方法。代表性工作包括 TKGEmbed（IEEE TKDE 2024）、BERT-KG（ACL 2023）等，利用多头自注意力机制聚合实体邻居信息，相比传统 TransE 方法在 MRR 指标上平均提升7-12%。\n\n关键进展：\n• 关系感知位置编码成为重要方向\n• 多跳推理能力显著提升\n• 与大语言模型的融合（KG+LLM）是当前热点';

export function ApplicationCenter({ initialAssistantId, initialFocus }: ApplicationCenterProps) {
  const [view, setView] = useState<'home' | 'configure' | 'chat'>('home');
  const [orchNodes, setOrchNodes] = useState<OrcheNode[]>([]);
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [kgPanelOpen, setKgPanelOpen] = useState(false);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const [selectedPaperModel, setSelectedPaperModel] = useState(PAPER_LLM_MODELS[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const paperFocusRing = (focus: AppCenterFocus) =>
    initialFocus === focus ? 'ring-2 ring-cyan-300 ring-offset-1 rounded-lg' : '';

  useEffect(() => {
    if (!initialAssistantId && !initialFocus) return;
    const assistant = ASSISTANTS.find(a => a.id === (initialAssistantId ?? 'kg-qa')) ?? ASSISTANTS[0];
    setActiveAssistant(assistant);
    if (initialFocus === 'response-parse') {
      const entities = detectEntities(DEMO_PARSE_ANSWER);
      const parsedTriples = parseStructuredTriples(DEMO_PARSE_ANSWER, entities);
      setMessages([
        { id: uid(), role: 'user', content: DEMO_PARSE_QUESTION, entities: [] },
        {
          id: uid(),
          role: 'assistant',
          content: DEMO_PARSE_ANSWER,
          entities,
          parsedTriples,
          evidences: pickEvidences(assistant.id, DEMO_PARSE_QUESTION),
        },
      ]);
      setKgPanelOpen(true);
    } else if (assistant.id === 'paper-recommendation' && initialFocus === 'results') {
      setMessages([
        { id: uid(), role: 'user', content: DEMO_PAPER_QUERY, entities: [] },
        {
          id: uid(),
          role: 'assistant',
          content: DEMO_PAPER_RESULTS,
          entities: [],
          evidences: pickEvidences('paper-recommendation', DEMO_PAPER_QUERY),
        },
      ]);
      setKgPanelOpen(false);
    } else if (assistant.id === 'paper-recommendation' && initialFocus === 'output') {
      setMessages([
        { id: uid(), role: 'user', content: DEMO_PAPER_QUERY, entities: [] },
        {
          id: uid(),
          role: 'assistant',
          content: DEMO_PAPER_OUTPUT,
          entities: detectEntities(DEMO_PAPER_OUTPUT),
          evidences: pickEvidences('paper-recommendation', DEMO_PAPER_QUERY),
        },
      ]);
      setKgPanelOpen(false);
    } else {
      setMessages([{
        id: uid(),
        role: 'assistant',
        content: `你好！我是${assistant.name}。${assistant.description}\n\n您可以直接提问，也可以选择下方的**提示词工程模板**（含三元组查询转换），填入具体参数后发送，往往能获得更准确的回答。`,
        entities: [],
      }]);
    }
    setView('chat');
  }, [initialAssistantId, initialFocus]);

  useEffect(() => {
    if (!initialFocus || view !== 'chat') return;
    const targetId =
      initialFocus === 'input' ? 'app-paper-input'
      : initialFocus === 'corpus' ? 'app-paper-corpus'
      : initialFocus === 'results' ? 'app-paper-results'
      : initialFocus === 'output' ? 'app-paper-output'
      : initialFocus === 'llm-model' ? 'app-paper-llm-model'
      : null;
    if (!targetId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [initialFocus, view]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNew = (assistant: Assistant) => {
    setActiveAssistant(assistant);
    setActiveConvId(null);
    setHoveredEntity(null);
    if (assistant.id === 'decision-support') {
      setView('configure');
    } else {
      setMessages([{ id: uid(), role: 'assistant', content: `你好！我是${assistant.name}。${assistant.description}\n\n您可以直接提问，也可以选择下方的提示词模板，填入具体参数后发送，往往能获得更准确的回答。`, entities: [] }]);
      setView('chat');
    }
  };

  const handleApplyConfig = (nodes: OrcheNode[]) => {
    setOrchNodes(nodes);
    const modelSummary = nodes.map(n => {
      const m = DECISION_MODELS.find(dm => dm.id === n.modelId);
      return `${m?.name ?? n.modelId}(${n.weight}%)`;
    }).join('、');
    const scores = computeCompositeScores(nodes);
    const rankSummary = scores.map((s, i) => `#${i + 1} ${s.name} ${s.score.toFixed(1)}分`).join('、');
    const initContent = `你好！我是决策支持助手。已为您加载决策评分流程配置：\n\n**已选模型**：${modelSummary}\n\n**初步评分排名**：${rankSummary}\n\n以上评分基于您设定的权重对各决策选项进行了综合计算，供您参考。您可以进一步提问、调整偏好，或直接告诉我您的决策背景，我将结合知识图谱为您深入分析。`;
    setMessages([{ id: uid(), role: 'assistant', content: initContent, entities: [] }]);
    setView('chat');
  };

  const openConv = (conv: Conversation) => {
    setActiveAssistant(ASSISTANTS.find(a => a.id === conv.assistantId)!);
    setActiveConvId(conv.id);
    setMessages(conv.messages);
    setView('chat');
    setHoveredEntity(null);
  };

  const sendMessage = (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || loading || !activeAssistant) return;
    const userMsg: Message = { id: uid(), role: 'user', content: text, entities: [] };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      const content = generateResponse(activeAssistant.id, userMsg.content, selectedPaperModel);
      const entities = detectEntities(content);
      const parsedTriples = parseStructuredTriples(content, entities);
      const evidences = pickEvidences(activeAssistant.id, userMsg.content);
      const reply: Message = { id: uid(), role: 'assistant', content, entities, parsedTriples, evidences };
      const final = [...next, reply];
      setMessages(final);
      setLoading(false);
      // Auto-open KG panel if entities found
      if (entities.length > 0) setKgPanelOpen(true);
      const title = userMsg.content.slice(0, 28) + (userMsg.content.length > 28 ? '…' : '');
      if (activeConvId) {
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: final } : c));
      } else {
        const id = uid();
        setConversations(prev => [{ id, assistantId: activeAssistant.id, title, messages: final, createdAt: new Date() }, ...prev]);
        setActiveConvId(id);
      }
    }, 700 + Math.random() * 500);
  };

  const handleNodeClick = (label: string) => {
    const q = `请告诉我更多关于「${label}」的信息，以及它在知识图谱中的关联关系`;
    setInput(q);
    inputRef.current?.focus();
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) { setView('home'); setActiveConvId(null); }
  };

  const hasAssistantMessages = messages.some(m => m.role === 'assistant' && (m.entities?.length ?? 0) > 0);

  return (
    <div className="h-full flex overflow-hidden bg-gray-50">

      {/* ── Left sidebar: history ── */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex-shrink-0">
          <button onClick={() => { setView('home'); setActiveConvId(null); setHoveredEntity(null); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />新建对话
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 px-4 text-center">
              <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs leading-relaxed">开始第一次对话后，历史记录将显示在这里</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 mb-1 text-[10px] text-gray-400 uppercase tracking-wider font-medium">历史对话</div>
              {conversations.map(conv => {
                const assistant = ASSISTANTS.find(a => a.id === conv.assistantId);
                const isActive = conv.id === activeConvId;
                return (
                  <div key={conv.id} onClick={() => openConv(conv)} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && openConv(conv)}
                    className={`w-full text-left px-3 py-2.5 transition-colors group flex items-start gap-2 cursor-pointer ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    {assistant && (
                      <div className={`w-5 h-5 rounded ${assistant.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <assistant.icon className={`w-3 h-3 ${assistant.color}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${isActive ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{conv.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{assistant?.name}</p>
                    </div>
                    <button onClick={e => deleteConv(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 flex-shrink-0 transition-all mt-0.5">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Center: home or chat ── */}
      <div className="flex-1 flex min-w-0 overflow-hidden">

        {/* Chat + KG panel wrapper */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {view === 'home' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-xl text-gray-900 font-semibold mb-1">选择助手，开始对话</h1>
                  <p className="text-sm text-gray-400">点击任意助手卡片，开始一次新的智能对话</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ASSISTANTS.map(app => (
                    <button key={app.id} onClick={() => startNew(app)}
                      className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl ${app.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <app.icon className={`w-5 h-5 ${app.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{app.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[app.category]}`}>{app.category}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{app.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5" />开始对话
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'configure' && activeAssistant && (
            <div className="flex-1 overflow-hidden">
              <DecisionOrchestrator
                onApply={handleApplyConfig}
                onSkip={() => {
                  setMessages([{ id: uid(), role: 'assistant', content: `你好！我是${activeAssistant.name}。${activeAssistant.description}\n\n您可以直接提问，也可以选择下方的提示词模板，填入具体参数后发送，往往能获得更准确的回答。`, entities: [] }]);
                  setView('chat');
                }}
              />
            </div>
          )}

          {view === 'chat' && activeAssistant && (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
                <div className={`w-8 h-8 rounded-xl ${activeAssistant.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <activeAssistant.icon className={`w-4 h-4 ${activeAssistant.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{activeAssistant.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[activeAssistant.category]}`}>{activeAssistant.category}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{activeAssistant.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* KG linkage toggle */}
                  <button
                    onClick={() => setKgPanelOpen(v => !v)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${kgPanelOpen ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50'}`}
                  >
                    <Network size={13} />
                    {kgPanelOpen ? '隐藏图谱联动' : '开启图谱联动'}
                    {hasAssistantMessages && !kgPanelOpen && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse ml-0.5" />
                    )}
                  </button>
                  <button onClick={() => startNew(activeAssistant)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" />新建
                  </button>
                </div>
              </div>

              {activeAssistant.id === 'paper-recommendation' && (
                <div className="px-5 py-2.5 bg-cyan-50/70 border-b border-cyan-100 flex flex-wrap items-center gap-4 flex-shrink-0">
                  <div id="app-paper-corpus" className={`flex items-center gap-2 ${paperFocusRing('corpus')}`}>
                    <BookOpen size={14} className="text-cyan-600" />
                    <span className="text-xs text-cyan-900">
                      检索库 · <strong className="font-semibold">1.5亿+</strong> 篇文献/专利
                    </span>
                  </div>
                  <div id="app-paper-llm-model" className={`flex items-center gap-2 ${paperFocusRing('llm-model')}`}>
                    <Bot size={14} className="text-cyan-600" />
                    <span className="text-xs text-gray-600">大模型</span>
                    <select
                      value={selectedPaperModel}
                      onChange={e => setSelectedPaperModel(e.target.value)}
                      className="text-xs border border-cyan-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:border-cyan-400"
                    >
                      {PAPER_LLM_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}（{m.provider}）</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-gray-400">{PAPER_LLM_MODELS.length} 种可选</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? activeAssistant.bgColor : 'bg-gray-200'}`}>
                      {msg.role === 'assistant'
                        ? <activeAssistant.icon className={`w-4 h-4 ${activeAssistant.color}`} />
                        : <User className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className={`max-w-[78%] text-sm leading-relaxed rounded-2xl px-4 py-3 ${msg.role === 'assistant' ? 'bg-white border border-gray-200 text-gray-700' : 'bg-blue-600 text-white'} ${msg.role === 'assistant' && initialFocus === 'output' && msg.content === DEMO_PAPER_OUTPUT ? paperFocusRing('output') : ''}`}
                      id={msg.role === 'assistant' && initialFocus === 'results' && msg.content === DEMO_PAPER_RESULTS ? 'app-paper-results' : msg.role === 'assistant' && initialFocus === 'output' && msg.content === DEMO_PAPER_OUTPUT ? 'app-paper-output' : undefined}
                    >
                      {msg.role === 'assistant' && (msg.entities?.length ?? 0) > 0 ? (
                        <HighlightedText
                          text={msg.content}
                          onEntityHover={name => setHoveredEntity(name)}
                          onEntityLeave={() => setHoveredEntity(null)}
                        />
                      ) : (
                        <span className="whitespace-pre-line">{msg.content}</span>
                      )}
                      {/* Entity chips below assistant message */}
                      {msg.role === 'assistant' && (msg.entities?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 w-full mb-0.5">结构化实体解析</span>
                          {msg.entities!.map(name => {
                            const entity = KG_ENTITIES.find(e => e.name === name);
                            return (
                              <button
                                key={name}
                                onClick={() => handleNodeClick(name)}
                                className="text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors hover:opacity-80"
                                style={{ color: entity?.color, borderColor: entity?.color + '60', backgroundColor: entity?.color + '10' }}
                              >
                                {name}
                              </button>
                            );
                          })}
                          <span className="text-[10px] text-gray-400 self-center ml-1">点击实体可继续追问</span>
                        </div>
                      )}
                      {msg.role === 'assistant' && (msg.parsedTriples?.length ?? 0) > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Link2 className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-[10px] font-semibold text-gray-600">生成结果解析与格式化</span>
                            <span className="text-[10px] text-gray-400">— 从自然语言回复提取结构化三元组</span>
                          </div>
                          <div className="rounded-lg border border-teal-100 bg-teal-50/50 overflow-hidden">
                            <div className="grid grid-cols-[1fr_auto_1fr_56px] gap-1 px-2.5 py-1.5 bg-teal-100/60 text-[10px] font-medium text-teal-800">
                              <span>主体</span><span>谓词</span><span>客体</span><span>置信度</span>
                            </div>
                            {msg.parsedTriples!.map((t, i) => (
                              <div key={i} className="grid grid-cols-[1fr_auto_1fr_56px] gap-1 px-2.5 py-1.5 text-[11px] border-t border-teal-100 items-center">
                                <span className="font-medium text-gray-800 truncate">{t.subject}</span>
                                <span className="text-teal-700 font-medium px-1">{t.predicate}</span>
                                <span className="font-medium text-gray-800 truncate">{t.object}</span>
                                <span className="text-gray-500 font-mono text-[10px]">{(t.confidence * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.role === 'assistant' && (msg.evidences?.length ?? 0) > 0 && (
                        <EvidenceList evidences={msg.evidences!} />
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${activeAssistant.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <activeAssistant.icon className={`w-4 h-4 ${activeAssistant.color}`} />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /><span className="text-sm text-gray-400">正在检索图谱…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {(messages.length <= 1 || initialFocus === 'prompt-template' || initialFocus === 'input') && (
                <div className="px-5 pb-3 flex-shrink-0 border-t border-gray-100 pt-3">
                  {initialFocus === 'prompt-template' && (
                    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      提示词工程模板：选择下方模板，将三元组查询或实体参数填入 <span className="font-mono bg-white px-1 rounded">[占位符]</span> 后发送
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-700">提示词工程模板</span>
                    <span className="text-xs text-gray-400">— 选择模板，替换 <span className="font-mono bg-blue-50 text-blue-600 px-1 rounded text-[10px]">[参数]</span> 后发送，可获得更精准的回答</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {activeAssistant.promptTemplates.map(tmpl => (
                      <button
                        key={tmpl.label}
                        onClick={() => { setInput(tmpl.pattern); setTimeout(() => inputRef.current?.focus(), 0); }}
                        className="text-left bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-3 transition-all group"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeAssistant.color.replace('text-', 'bg-').replace('-600', '-400')}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${activeAssistant.color}`}>{tmpl.label}</span>
                        </div>
                        <div className="mb-2 line-clamp-3">
                          <TemplatePattern pattern={tmpl.pattern} />
                        </div>
                        <div className="text-[10px] text-gray-400 leading-snug line-clamp-2">{tmpl.hint}</div>
                        <div className="mt-2 text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />点击插入模板
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div id="app-paper-input" className={`px-5 pb-5 flex-shrink-0 ${activeAssistant.id === 'paper-recommendation' ? paperFocusRing('input') : ''}`}>
                <div className="flex gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:shadow-sm transition-all">
                  <textarea
                    ref={inputRef}
                    value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={activeAssistant.placeholder}
                    rows={2}
                    className="flex-1 text-sm text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed bg-transparent" />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                    className={`self-end p-2 rounded-xl transition-colors flex-shrink-0 ${input.trim() && !loading ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right: KG Panel ── */}
        {view === 'chat' && kgPanelOpen && (
          <KGPanel
            hoveredEntity={hoveredEntity}
            onNodeClick={label => { handleNodeClick(label); }}
            onClose={() => setKgPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
