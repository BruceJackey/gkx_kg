import { useState } from 'react';
import {
  Upload, FileText, CheckCircle2, Clock, Loader2, ChevronRight, ChevronDown,
  Image as ImageIcon, Table2, Sigma, BrainCircuit, BookOpen, Network,
  FlaskConical, Quote, Tag, AlertCircle, FileCode, Globe, Hash,
  Variable, Microscope, GitBranch, Layers
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocFormat = 'PDF' | 'XML' | 'HTML';
type DocStatus = 'done' | 'processing' | 'pending';
type AnalysisTab = 'structure' | 'modal' | 'semantic' | 'output';

interface DocSection { id: string; title: string; level: number; wordCount: number; summary: string; }
interface DocFigure { id: string; number: string; caption: string; figType: string; relatedText: string; color: string; }
interface DocTable { id: string; number: string; caption: string; headers: string[]; rows: string[][]; }
interface DocFormula { id: string; number: string; expr: string; description: string; }
interface DocConcept { term: string; definition: string; section: string; }
interface DocVariable { symbol: string; meaning: string; relatedTo: string[]; }
interface DocExperiment { dataset: string; metric: string; result: string; baseline: string; }
interface DocCitation { ref: string; title: string; context: string; }

interface ProcessedDoc {
  id: string; filename: string; format: DocFormat; title: string;
  authors: string[]; year: number; journal: string; status: DocStatus;
  sections: DocSection[]; figures: DocFigure[]; tables: DocTable[];
  formulas: DocFormula[]; concepts: DocConcept[]; variables: DocVariable[];
  experiments: DocExperiment[]; citations: DocCitation[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockDocs: ProcessedDoc[] = [
  {
    id: 'd1', filename: 'KG_Embedding_Transformer.pdf', format: 'PDF',
    title: '基于Transformer的知识图谱嵌入方法研究',
    authors: ['张明', '李华', '王强'], year: 2024, journal: 'IEEE TKDE', status: 'done',
    sections: [
      { id: 's1', title: 'Abstract', level: 1, wordCount: 248, summary: '提出基于Transformer的KG嵌入方法TKGEmbed，在FB15k-237和WN18RR数据集上MRR较最优基线分别提升8.3%和3.2%。' },
      { id: 's2', title: '1. Introduction', level: 1, wordCount: 876, summary: '知识图谱嵌入旨在将实体和关系映射至低维向量空间，传统方法难以建模长距离语义依赖，本文引入Transformer解决该问题。' },
      { id: 's3', title: '2. Related Work', level: 1, wordCount: 654, summary: '综述TransE、RotatE等传统嵌入方法及近期预训练模型方法，分析各自在复杂关系建模上的局限性。' },
      { id: 's4', title: '3. Methodology', level: 1, wordCount: 1234, summary: '提出TKGEmbed：多头自注意力编码实体上下文，关系感知位置编码，自适应负采样策略联合优化。' },
      { id: 's4a', title: '  3.1 Model Architecture', level: 2, wordCount: 489, summary: '编码器层级结构：实体嵌入层 → Transformer块 → 投影头，关系类型作为条件注入。' },
      { id: 's4b', title: '  3.2 Training Objective', level: 2, wordCount: 312, summary: 'Margin-based ranking loss 与自监督对比损失联合训练，有效缓解稀疏三元组问题。' },
      { id: 's5', title: '4. Experiments', level: 1, wordCount: 987, summary: '三个标准数据集验证，消融实验证明各模块贡献，超参分析显示d=256时性能最优。' },
      { id: 's6', title: '5. Conclusion', level: 1, wordCount: 198, summary: '总结贡献，指出多模态知识图谱扩展与大规模图上效率是未来方向。' },
    ],
    figures: [
      { id: 'f1', number: 'Figure 1', caption: 'TKGEmbed模型整体架构图', figType: '架构图', color: '#3b82f6', relatedText: '第3.1节描述了图示编码器结构：实体嵌入经多头注意力聚合邻居信息后，通过投影头映射至关系空间。' },
      { id: 'f2', number: 'Figure 2', caption: '各方法在FB15k-237上MRR对比柱状图', figType: '柱状图', color: '#10b981', relatedText: '图2表明本方法在所有链接预测指标上均优于RotatE和CompGCN基线（见第4节）。' },
      { id: 'f3', number: 'Figure 3', caption: '嵌入空间t-SNE可视化', figType: '散点图', color: '#8b5cf6', relatedText: '图3展示本方法学到的实体嵌入具有明显语义聚类特性，同类实体在空间中更邻近。' },
    ],
    tables: [
      {
        id: 't1', number: 'Table 1', caption: 'FB15k-237数据集链接预测结果对比',
        headers: ['方法', 'MRR', 'Hits@1', 'Hits@3', 'Hits@10'],
        rows: [
          ['TransE', '0.279', '0.198', '0.376', '0.441'],
          ['RotatE', '0.338', '0.241', '0.375', '0.533'],
          ['CompGCN', '0.355', '0.264', '0.390', '0.535'],
          ['TKGEmbed（本文）', '0.383', '0.289', '0.419', '0.567'],
        ],
      },
      {
        id: 't2', number: 'Table 2', caption: '消融实验结果（FB15k-237 MRR）',
        headers: ['模型变体', 'MRR', '说明'],
        rows: [
          ['w/o Transformer', '0.321', '替换为双线性编码器'],
          ['w/o Rel-PE', '0.361', '移除关系感知位置编码'],
          ['w/o Contrastive', '0.371', '移除对比损失项'],
          ['Full Model（本文）', '0.383', '完整模型'],
        ],
      },
    ],
    formulas: [
      { id: 'eq1', number: 'Eq.(1)', expr: 'ℒ = Σ max(0, γ + d(h,r,t) − d(h,r,t′))', description: 'Margin-based ranking loss，γ 为边界超参数，d(·) 为三元组评分函数，t′ 为负采样尾实体。' },
      { id: 'eq2', number: 'Eq.(2)', expr: "e'ᵢ = Σⱼ αᵢⱼ · Wᵥeⱼ,   αᵢⱼ = softmax(Qᵢ · Kⱼ / √d_k)", description: '多头自注意力：Q/K/V 为可学习投影矩阵，d_k 为键向量维度，起缩放稳定作用。' },
    ],
    concepts: [
      { term: '知识图谱嵌入', definition: '将KG中实体与关系映射至连续低维向量空间，以支持推理与补全任务的技术方法。', section: '1. Introduction' },
      { term: '多头自注意力', definition: '并行计算多组注意力权重，捕获序列不同位置依赖，是Transformer的核心机制。', section: '3.1 Architecture' },
      { term: '链接预测', definition: '在已知部分三元组的前提下，预测缺失实体或关系，是KG补全的标准评测任务。', section: '4. Experiments' },
      { term: '负采样', definition: '为正样本三元组随机替换实体构造负样本，为对比训练提供监督信号。', section: '3.2 Training' },
    ],
    variables: [
      { symbol: 'h, r, t', meaning: '头实体、关系、尾实体嵌入向量', relatedTo: ['Eq.(1)', '3.1'] },
      { symbol: 'γ', meaning: 'Margin超参数，控制正负样本评分差下界', relatedTo: ['Eq.(1)'] },
      { symbol: 'd_k', meaning: '注意力键向量维度，用于缩放点积防梯度消失', relatedTo: ['Eq.(2)', '3.1'] },
      { symbol: 'αᵢⱼ', meaning: '位置i对位置j的注意力权重（softmax归一化）', relatedTo: ['Eq.(2)'] },
    ],
    experiments: [
      { dataset: 'FB15k-237', metric: 'MRR', result: '0.383', baseline: 'CompGCN 0.355（↑7.9%）' },
      { dataset: 'WN18RR', metric: 'MRR', result: '0.491', baseline: 'RotatE 0.476（↑3.2%）' },
      { dataset: 'YAGO3-10', metric: 'Hits@10', result: '0.687', baseline: 'TransE 0.654（↑5.0%）' },
    ],
    citations: [
      { ref: '[1]', title: 'Translating Embeddings for Modeling Multi-relational Data (TransE)', context: '第2节对比分析了本方法与TransE在评分函数设计上的差异。' },
      { ref: '[5]', title: 'RotatE: Knowledge Graph Embedding by Relational Rotation in Complex Space', context: '第4节以RotatE为主要基线，本文MRR在FB15k-237上提升13.3%。' },
      { ref: '[12]', title: 'Attention Is All You Need (Vaswani et al., 2017)', context: '第3节引用原始Transformer论文，直接沿用其多头注意力公式设计。' },
      { ref: '[18]', title: 'CompGCN: Composition-based Multi-Relational GCN', context: '第2节与4节与CompGCN进行了详细对比，分析图卷积vs注意力的差异。' },
    ],
  },
  {
    id: 'd2', filename: 'LLM_KnowledgeExtraction.xml', format: 'XML',
    title: 'Large Language Models for Scientific Knowledge Extraction',
    authors: ['Chen Wei', 'Liu Yang', 'Zhang Fang'], year: 2024, journal: 'NeurIPS', status: 'done',
    sections: [
      { id: 's1', title: 'Abstract', level: 1, wordCount: 312, summary: 'Surveys LLM applications for scientific IE covering NER, RE, and event extraction; proposes a benchmark evaluation framework.' },
      { id: 's2', title: '1. Introduction', level: 1, wordCount: 1020, summary: 'Motivates LLM-based scientific IE, comparing zero-shot, few-shot, and fine-tuned paradigms across biology and chemistry domains.' },
      { id: 's3', title: '2. Tasks and Datasets', level: 1, wordCount: 789, summary: 'Categorizes scientific IE tasks and reviews 12 benchmark datasets spanning biology, chemistry, and materials science.' },
      { id: 's4', title: '3. Methods', level: 1, wordCount: 1100, summary: 'Compares prompt engineering, LoRA fine-tuning, and RAG-augmented pipelines on GPT-4, LLaMA-3, and domain-specific models.' },
      { id: 's5', title: '4. Results', level: 1, wordCount: 876, summary: 'RAG-augmented GPT-4 achieves best overall F1; domain-specific models outperform on specialized corpora.' },
    ],
    figures: [
      { id: 'f1', number: 'Figure 1', caption: 'LLM-based scientific IE pipeline overview', figType: '流程图', color: '#f59e0b', relatedText: 'Figure 1 illustrates the end-to-end pipeline from raw PDF ingestion to structured knowledge output described in Section 3.' },
    ],
    tables: [
      {
        id: 't1', number: 'Table 1', caption: 'NER performance on SciERC and ChemNER benchmarks',
        headers: ['Model', 'SciERC F1', 'ChemNER F1', 'Avg'],
        rows: [
          ['BERT-base', '68.4', '71.2', '69.8'],
          ['SciBERT', '72.1', '74.8', '73.5'],
          ['GPT-4 (0-shot)', '69.3', '70.1', '69.7'],
          ['GPT-4 + RAG (Ours)', '76.8', '79.3', '78.1'],
        ],
      },
    ],
    formulas: [],
    concepts: [
      { term: 'Information Extraction (IE)', definition: 'The task of automatically extracting structured information (entities, relations, events) from unstructured text.', section: '1. Introduction' },
      { term: 'Retrieval-Augmented Generation (RAG)', definition: 'A technique that augments LLM generation with retrieved relevant documents to improve factual accuracy.', section: '3. Methods' },
    ],
    variables: [],
    experiments: [
      { dataset: 'SciERC', metric: 'NER F1', result: '76.8%', baseline: 'SciBERT 72.1%（↑6.5%）' },
      { dataset: 'ChemNER', metric: 'NER F1', result: '79.3%', baseline: 'SciBERT 74.8%（↑6.0%）' },
    ],
    citations: [
      { ref: '[2]', title: 'GPT-4 Technical Report (OpenAI, 2023)', context: 'Section 3 evaluates GPT-4 under zero-shot and few-shot settings for scientific NER.' },
      { ref: '[7]', title: 'LLaMA 3: Open Foundation LLMs (Meta, 2024)', context: 'Section 4 fine-tunes LLaMA-3-8B with LoRA for domain-specific IE.' },
    ],
  },
  {
    id: 'd3', filename: '医学知识图谱临床决策.html', format: 'HTML',
    title: '医学知识图谱辅助临床决策支持系统研究',
    authors: ['陈丽', '徐明', '潘洋'], year: 2023, journal: 'Nature', status: 'processing',
    sections: [], figures: [], tables: [], formulas: [],
    concepts: [], variables: [], experiments: [], citations: [],
  },
];

const FORMAT_ICON: Record<DocFormat, any> = { PDF: FileText, XML: FileCode, HTML: Globe };
const FORMAT_COLOR: Record<DocFormat, string> = { PDF: 'text-red-500 bg-red-50', XML: 'text-orange-500 bg-orange-50', HTML: 'text-blue-500 bg-blue-50' };

const PIPELINE_STEPS = [
  { id: 1, label: '格式解析', desc: '正文 · 章节 · 元数据', icon: Layers },
  { id: 2, label: '模态识别', desc: '图表 · 公式 · 图像', icon: ImageIcon },
  { id: 3, label: '语义理解', desc: 'LLM摘要 · 关联建立', icon: BrainCircuit },
  { id: 4, label: '结构输出', desc: '概念 · 变量 · 实验', icon: Network },
];

const TABS: { id: AnalysisTab; label: string; icon: any }[] = [
  { id: 'structure', label: '章节结构', icon: Layers },
  { id: 'modal', label: '多模态内容', icon: ImageIcon },
  { id: 'semantic', label: '语义分析', icon: BrainCircuit },
  { id: 'output', label: '结构化输出', icon: Network },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiteratureProcessing() {
  const [selectedDocId, setSelectedDocId] = useState('d1');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('structure');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['s4']));

  const doc = mockDocs.find(d => d.id === selectedDocId);
  const toggleSection = (id: string) => setExpandedSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-gray-900 mb-1">文献处理</h1>
        <p className="text-sm text-gray-500">对学术文献进行多格式解析、多模态内容提取与深度语义理解，输出结构化知识</p>
      </div>

      {/* Pipeline */}
      <div className="flex items-center gap-0 bg-white border border-gray-200 rounded-xl px-6 py-4 flex-shrink-0">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-800 font-medium">{step.label}</div>
                <div className="text-xs text-gray-400">{step.desc}</div>
              </div>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="flex-1 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: document list */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-3">
          {/* Upload zone */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">拖拽或点击上传文献</p>
            <div className="flex justify-center gap-1.5">
              {(['PDF', 'XML', 'HTML'] as DocFormat[]).map(f => (
                <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FORMAT_COLOR[f]}`}>{f}</span>
              ))}
            </div>
          </div>

          {/* Doc list */}
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
            {mockDocs.map(d => {
              const FmtIcon = FORMAT_ICON[d.format];
              return (
                <button key={d.id} onClick={() => setSelectedDocId(d.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedDocId === d.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-2">
                    <FmtIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selectedDocId === d.id ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-snug line-clamp-2">{d.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${FORMAT_COLOR[d.format]}`}>{d.format}</span>
                        {d.status === 'done' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        {d.status === 'processing' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                        {d.status === 'pending' && <Clock className="w-3 h-3 text-gray-400" />}
                        <span className={`text-[10px] ${d.status === 'done' ? 'text-green-600' : d.status === 'processing' ? 'text-blue-600' : 'text-gray-400'}`}>
                          {d.status === 'done' ? '已完成' : d.status === 'processing' ? '处理中' : '待处理'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: analysis results */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-w-0">
          {doc ? (
            doc.status !== 'done' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-10 h-10 mb-3 text-blue-400 animate-spin" />
                <p className="text-sm text-gray-500">正在解析文献，请稍候…</p>
                <div className="mt-4 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            ) : (
              <>
                {/* Doc header */}
                <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${FORMAT_COLOR[doc.format]}`}>{doc.format}</span>
                    <h2 className="text-sm text-gray-900 font-medium leading-snug">{doc.title}</h2>
                  </div>
                  <p className="text-xs text-gray-500">{doc.authors.join(', ')} · {doc.journal} · {doc.year}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 flex-shrink-0 px-4">
                  {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-5">
                  {/* ── 章节结构 ── */}
                  {activeTab === 'structure' && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: '章节数', value: doc.sections.filter(s => s.level === 1).length },
                          { label: '总词数', value: doc.sections.reduce((s, x) => s + x.wordCount, 0).toLocaleString() },
                          { label: '文件格式', value: doc.format },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-50 rounded-lg px-4 py-3 text-center">
                            <div className="text-lg text-gray-900 font-semibold">{s.value}</div>
                            <div className="text-xs text-gray-400">{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">章节树</div>
                        <div className="flex flex-col gap-0.5">
                          {doc.sections.map(s => (
                            <div key={s.id}>
                              <div
                                className={`flex items-start gap-2 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${s.level === 2 ? 'ml-4' : ''}`}
                                onClick={() => s.summary && toggleSection(s.id)}
                              >
                                {s.summary ? (
                                  expandedSections.has(s.id) ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                ) : <div className="w-3.5" />}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${s.level === 1 ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>{s.title}</span>
                                    <span className="text-[10px] text-gray-400">{s.wordCount.toLocaleString()} 词</span>
                                  </div>
                                  {expandedSections.has(s.id) && s.summary && (
                                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-blue-50 border border-blue-100 rounded px-2.5 py-2">
                                      <span className="text-blue-600 font-medium mr-1">摘要：</span>{s.summary}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 多模态内容 ── */}
                  {activeTab === 'modal' && (
                    <div className="flex flex-col gap-6">
                      {/* Figures */}
                      {doc.figures.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700 font-medium">图像识别结果（{doc.figures.length}张）</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {doc.figures.map(fig => (
                              <div key={fig.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="h-24 flex items-center justify-center text-white text-xs font-medium" style={{ background: `linear-gradient(135deg, ${fig.color}33, ${fig.color}11)`, borderBottom: `1px solid ${fig.color}22` }}>
                                  <div className="text-center">
                                    <div style={{ color: fig.color }} className="text-sm font-semibold">{fig.figType}</div>
                                    <div className="text-gray-400 text-[10px] mt-0.5">[图像内容]</div>
                                  </div>
                                </div>
                                <div className="p-2.5">
                                  <div className="text-[11px] text-gray-500 font-medium mb-1">{fig.number}</div>
                                  <div className="text-xs text-gray-700 mb-1.5">{fig.caption}</div>
                                  <div className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-1.5">{fig.relatedText}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tables */}
                      {doc.tables.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Table2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700 font-medium">表格结构还原（{doc.tables.length}张）</span>
                          </div>
                          {doc.tables.map(tbl => (
                            <div key={tbl.id} className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 font-medium">{tbl.number}：{tbl.caption}</div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-gray-50/60">
                                      {tbl.headers.map(h => <th key={h} className="text-left px-3 py-2 text-gray-600 font-medium border-b border-gray-100">{h}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tbl.rows.map((row, i) => (
                                      <tr key={i} className={`${i === tbl.rows.length - 1 ? 'font-semibold text-blue-700 bg-blue-50/40' : 'text-gray-600'} border-b border-gray-50`}>
                                        {row.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulas */}
                      {doc.formulas.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Sigma className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-700 font-medium">公式结构识别（{doc.formulas.length}个）</span>
                          </div>
                          {doc.formulas.map(eq => (
                            <div key={eq.id} className="mb-2 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-mono">{eq.number}</span>
                              </div>
                              <div className="font-mono text-sm text-gray-800 bg-gray-50 rounded px-3 py-2 mb-2 leading-relaxed">{eq.expr}</div>
                              <p className="text-xs text-gray-500 leading-relaxed">{eq.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 语义分析 ── */}
                  {activeTab === 'semantic' && (
                    <div className="flex flex-col gap-5">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BrainCircuit className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-blue-700 font-medium">全文段落级摘要</span>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          {doc.sections.find(s => s.id === 's1')?.summary || '摘要生成中…'}
                        </p>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <BrainCircuit className="w-3.5 h-3.5" />各章节 LLM 摘要
                        </div>
                        {doc.sections.filter(s => s.level === 1 && s.summary).map(s => (
                          <div key={s.id} className="flex gap-3 mb-3">
                            <div className="w-px bg-blue-200 flex-shrink-0 ml-1" />
                            <div>
                              <div className="text-xs text-gray-600 font-medium mb-1">{s.title}</div>
                              <p className="text-xs text-gray-500 leading-relaxed">{s.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {doc.figures.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" />图注关联（Figure-Text Association）
                          </div>
                          {doc.figures.map(fig => (
                            <div key={fig.id} className="flex gap-3 mb-2.5 bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: fig.color + '22', color: fig.color }}>
                                {fig.number.replace('Figure ', 'F')}
                              </div>
                              <div>
                                <div className="text-xs text-gray-700 font-medium mb-1">{fig.caption}</div>
                                <p className="text-[11px] text-gray-500 leading-relaxed">{fig.relatedText}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 结构化输出 ── */}
                  {activeTab === 'output' && (
                    <div className="flex flex-col gap-5">
                      {/* Concepts */}
                      {doc.concepts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700 font-medium">概念定义（{doc.concepts.length}个）</span>
                          </div>
                          {doc.concepts.map(c => (
                            <div key={c.term} className="flex gap-3 mb-2 border-b border-gray-50 pb-2 last:border-0">
                              <div className="w-1 bg-blue-400 rounded flex-shrink-0 self-stretch" />
                              <div>
                                <span className="text-xs text-gray-800 font-medium">{c.term}</span>
                                <span className="text-[10px] text-gray-400 ml-2">§ {c.section}</span>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.definition}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Variables */}
                      {doc.variables.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Hash className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-700 font-medium">变量关系（{doc.variables.length}个）</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {doc.variables.map(v => (
                              <div key={v.symbol} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                <div className="font-mono text-sm text-purple-600 mb-1">{v.symbol}</div>
                                <div className="text-xs text-gray-600">{v.meaning}</div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {v.relatedTo.map(r => <span key={r} className="text-[10px] bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded">{r}</span>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experiments */}
                      {doc.experiments.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FlaskConical className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700 font-medium">实验过程（{doc.experiments.length}组）</span>
                          </div>
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50">
                                  {['数据集', '指标', '本文结果', '基线对比'].map(h => <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium border-b border-gray-200">{h}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {doc.experiments.map((exp, i) => (
                                  <tr key={i} className="border-b border-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-700">{exp.dataset}</td>
                                    <td className="px-3 py-2 text-gray-500">{exp.metric}</td>
                                    <td className="px-3 py-2 font-semibold text-green-600">{exp.result}</td>
                                    <td className="px-3 py-2 text-gray-400">{exp.baseline}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Citations */}
                      {doc.citations.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <GitBranch className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700 font-medium">引用路径（{doc.citations.length}条）</span>
                          </div>
                          {doc.citations.map(c => (
                            <div key={c.ref} className="flex gap-2.5 mb-2.5 last:mb-0">
                              <span className="text-[11px] text-orange-500 font-mono bg-orange-50 px-1.5 py-0.5 rounded h-fit flex-shrink-0">{c.ref}</span>
                              <div>
                                <div className="text-xs text-gray-700">{c.title}</div>
                                <div className="text-[11px] text-gray-400 mt-0.5">{c.context}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-sm">选择左侧文献查看解析结果</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
