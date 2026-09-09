import { useEffect, useRef, useState } from 'react';
import {
  Upload, FileText, CheckCircle2, Loader2, ChevronRight,
  Image as ImageIcon, Table2, Sigma, BrainCircuit, BookOpen, Network,
  FlaskConical, FileCode, Globe, Hash, GitBranch, Layers, Play,
} from 'lucide-react';
import type { LiteratureProcessingFocus } from '../data/auditPageMap';

type DocFormat = 'PDF' | 'XML' | 'HTML';

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
  authors: string[]; year: number; journal: string;
  sections: DocSection[]; figures: DocFigure[]; tables: DocTable[];
  formulas: DocFormula[]; concepts: DocConcept[]; variables: DocVariable[];
  experiments: DocExperiment[]; citations: DocCitation[];
  structureSummary: string;
}

const mockDocs: ProcessedDoc[] = [
  {
    id: 'd1', filename: 'KG_Embedding_Transformer.pdf', format: 'PDF',
    title: '基于Transformer的知识图谱嵌入方法研究',
    authors: ['张明', '李华', '王强'], year: 2024, journal: 'IEEE TKDE',
    structureSummary: '已提取正文与章节结构：6 个一级章节、约 4,200 词，元数据（作者 / 期刊 / 年份）完整。',
    sections: [
      { id: 's1', title: 'Abstract', level: 1, wordCount: 248, summary: '提出基于Transformer的KG嵌入方法TKGEmbed，在FB15k-237和WN18RR数据集上MRR较最优基线分别提升8.3%和3.2%。' },
      { id: 's2', title: '1. Introduction', level: 1, wordCount: 876, summary: '知识图谱嵌入旨在将实体和关系映射至低维向量空间，传统方法难以建模长距离语义依赖，本文引入Transformer解决该问题。' },
      { id: 's3', title: '2. Related Work', level: 1, wordCount: 654, summary: '综述TransE、RotatE等传统嵌入方法及近期预训练模型方法，分析各自在复杂关系建模上的局限性。' },
      { id: 's4', title: '3. Methodology', level: 1, wordCount: 1234, summary: '提出TKGEmbed：多头自注意力编码实体上下文，关系感知位置编码，自适应负采样策略联合优化。' },
      { id: 's5', title: '4. Experiments', level: 1, wordCount: 987, summary: '三个标准数据集验证，消融实验证明各模块贡献，超参分析显示d=256时性能最优。' },
      { id: 's6', title: '5. Conclusion', level: 1, wordCount: 198, summary: '总结贡献，指出多模态知识图谱扩展与大规模图上效率是未来方向。' },
    ],
    figures: [
      { id: 'f1', number: 'Figure 1', caption: 'TKGEmbed模型整体架构图', figType: '架构图', color: '#3b82f6', relatedText: '第3.1节描述了图示编码器结构：实体嵌入经多头注意力聚合邻居信息后，通过投影头映射至关系空间。' },
      { id: 'f2', number: 'Figure 2', caption: '各方法在FB15k-237上MRR对比柱状图', figType: '柱状图', color: '#10b981', relatedText: '图2表明本方法在所有链接预测指标上均优于RotatE和CompGCN基线（见第4节）。' },
    ],
    tables: [
      {
        id: 't1', number: 'Table 1', caption: 'FB15k-237数据集链接预测结果对比',
        headers: ['方法', 'MRR', 'Hits@1', 'Hits@10'],
        rows: [
          ['TransE', '0.279', '0.198', '0.441'],
          ['RotatE', '0.338', '0.241', '0.533'],
          ['TKGEmbed（本文）', '0.383', '0.289', '0.567'],
        ],
      },
    ],
    formulas: [
      { id: 'eq1', number: 'Eq.(1)', expr: 'ℒ = Σ max(0, γ + d(h,r,t) − d(h,r,t′))', description: 'Margin-based ranking loss，γ 为边界超参数。' },
    ],
    concepts: [
      { term: '知识图谱嵌入', definition: '将KG中实体与关系映射至连续低维向量空间，以支持推理与补全任务。', section: '1. Introduction' },
      { term: '多头自注意力', definition: '并行计算多组注意力权重，捕获序列不同位置依赖。', section: '3. Methodology' },
      { term: '链接预测', definition: '在已知部分三元组的前提下，预测缺失实体或关系。', section: '4. Experiments' },
    ],
    variables: [
      { symbol: 'h, r, t', meaning: '头实体、关系、尾实体嵌入向量', relatedTo: ['Eq.(1)'] },
      { symbol: 'γ', meaning: 'Margin超参数，控制正负样本评分差下界', relatedTo: ['Eq.(1)'] },
    ],
    experiments: [
      { dataset: 'FB15k-237', metric: 'MRR', result: '0.383', baseline: 'CompGCN 0.355（↑7.9%）' },
      { dataset: 'WN18RR', metric: 'MRR', result: '0.491', baseline: 'RotatE 0.476（↑3.2%）' },
    ],
    citations: [
      { ref: '[1]', title: 'Translating Embeddings for Modeling Multi-relational Data (TransE)', context: '第2节对比分析了本方法与TransE的差异。' },
      { ref: '[12]', title: 'Attention Is All You Need (Vaswani et al., 2017)', context: '第3节沿用多头注意力公式设计。' },
    ],
  },
  {
    id: 'd2', filename: 'LLM_KnowledgeExtraction.xml', format: 'XML',
    title: 'Large Language Models for Scientific Knowledge Extraction',
    authors: ['Chen Wei', 'Liu Yang'], year: 2024, journal: 'NeurIPS',
    structureSummary: '已提取 JATS/XML 正文与章节结构：5 个一级章节，元数据完整。',
    sections: [
      { id: 's1', title: 'Abstract', level: 1, wordCount: 312, summary: 'Surveys LLM applications for scientific IE; proposes a benchmark evaluation framework.' },
      { id: 's2', title: '1. Introduction', level: 1, wordCount: 1020, summary: 'Motivates LLM-based scientific IE across biology and chemistry domains.' },
      { id: 's3', title: '3. Methods', level: 1, wordCount: 1100, summary: 'Compares prompt engineering, LoRA fine-tuning, and RAG-augmented pipelines.' },
      { id: 's4', title: '4. Results', level: 1, wordCount: 876, summary: 'RAG-augmented GPT-4 achieves best overall F1 on specialized corpora.' },
    ],
    figures: [
      { id: 'f1', number: 'Figure 1', caption: 'LLM-based scientific IE pipeline overview', figType: '流程图', color: '#f59e0b', relatedText: 'Figure 1 illustrates the end-to-end pipeline described in Section 3.' },
    ],
    tables: [
      {
        id: 't1', number: 'Table 1', caption: 'NER performance on SciERC',
        headers: ['Model', 'SciERC F1', 'ChemNER F1'],
        rows: [
          ['SciBERT', '72.1', '74.8'],
          ['GPT-4 + RAG (Ours)', '76.8', '79.3'],
        ],
      },
    ],
    formulas: [],
    concepts: [
      { term: 'Information Extraction (IE)', definition: 'Automatically extracting structured information from unstructured text.', section: '1. Introduction' },
      { term: 'RAG', definition: 'Augments LLM generation with retrieved documents to improve factual accuracy.', section: '3. Methods' },
    ],
    variables: [],
    experiments: [
      { dataset: 'SciERC', metric: 'NER F1', result: '76.8%', baseline: 'SciBERT 72.1%（↑6.5%）' },
    ],
    citations: [
      { ref: '[2]', title: 'GPT-4 Technical Report (OpenAI, 2023)', context: 'Section 3 evaluates GPT-4 under zero-shot settings.' },
    ],
  },
];

const FORMAT_ICON: Record<DocFormat, typeof FileText> = { PDF: FileText, XML: FileCode, HTML: Globe };
const FORMAT_COLOR: Record<DocFormat, string> = {
  PDF: 'text-red-500 bg-red-50',
  XML: 'text-orange-500 bg-orange-50',
  HTML: 'text-blue-500 bg-blue-50',
};

const CAPABILITIES = [
  { id: 'structure' as const, label: '多格式正文解析', desc: '正文 · 章节 · 元数据', icon: Layers },
  { id: 'modal' as const, label: '多模态内容解析', desc: '图像 · 表格 · 公式', icon: ImageIcon },
  { id: 'semantic' as const, label: '深度语义解析', desc: '段落摘要 · 图注关联', icon: BrainCircuit },
  { id: 'output' as const, label: '结构化内容输出', desc: '概念 · 变量 · 实验 · 引用', icon: Network },
];

export default function LiteratureProcessing({
  initialFocus = 'structure',
}: {
  initialFocus?: LiteratureProcessingFocus | null;
}) {
  const needsResult =
    initialFocus === 'modal' || initialFocus === 'semantic' || initialFocus === 'output';

  const [selectedDocId, setSelectedDocId] = useState('d1');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(() => needsResult);

  const modalRef = useRef<HTMLDivElement>(null);
  const semanticRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const doc = mockDocs.find((d) => d.id === selectedDocId)!;

  const runParse = () => {
    setParsing(true);
    window.setTimeout(() => {
      setParsing(false);
      setParsed(true);
    }, 700);
  };

  const selectDoc = (id: string) => {
    setSelectedDocId(id);
    setParsed(false);
  };

  useEffect(() => {
    if (needsResult) {
      setParsed(true);
      window.setTimeout(() => {
        const el =
          initialFocus === 'modal'
            ? modalRef.current
            : initialFocus === 'semantic'
              ? semanticRef.current
              : outputRef.current;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [initialFocus, needsResult]);

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden p-8">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">文献处理</div>
          <h1 className="text-xl font-semibold text-gray-900">多格式正文解析</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">
            支持对 PDF、JATS XML、HTML 等格式文献进行正文与元数据提取；一次解析后同步输出多模态内容、深度语义与结构化结果。
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex items-center gap-0 bg-white border border-gray-200 rounded-xl px-4 py-3 flex-shrink-0 overflow-x-auto">
        {CAPABILITIES.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 min-w-[140px]">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <step.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{step.label}</div>
                <div className="text-xs text-gray-400">{step.desc}</div>
              </div>
            </div>
            {i < CAPABILITIES.length - 1 && (
              <div className="flex-1 flex items-center justify-center px-1">
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-64 flex-shrink-0 flex flex-col gap-3">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">拖拽或点击上传文献</p>
            <div className="flex justify-center gap-1.5">
              {(['PDF', 'XML', 'HTML'] as DocFormat[]).map((f) => (
                <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FORMAT_COLOR[f]}`}>{f}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
            {mockDocs.map((d) => {
              const FmtIcon = FORMAT_ICON[d.format];
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => selectDoc(d.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDocId === d.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FmtIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${selectedDocId === d.id ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-800 leading-snug line-clamp-2">{d.title}</p>
                      <span className={`inline-block mt-1 text-[10px] px-1 py-0.5 rounded font-medium ${FORMAT_COLOR[d.format]}`}>{d.format}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${FORMAT_COLOR[doc.format]}`}>{doc.format}</span>
                <h2 className="text-sm text-gray-900 font-medium leading-snug">{doc.title}</h2>
              </div>
              <p className="text-xs text-gray-500">{doc.authors.join(', ')} · {doc.journal} · {doc.year}</p>
            </div>
            <button
              type="button"
              onClick={runParse}
              disabled={parsing}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg flex-shrink-0 transition-colors"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {parsing ? '解析中…' : parsed ? '重新解析' : '开始解析'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {/* 多格式正文解析：介绍 + 支持说明 */}
            <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">多格式正文解析</h3>
              </div>
              <p className="text-xs text-blue-800/80 leading-relaxed">
                支持对 PDF、JATS XML、HTML 等多种格式文献进行正文文本、章节结构和元数据提取，作为后续多模态、语义与结构化解析的输入基础。
                点击「开始解析」后一次完成全部下游能力。
              </p>
              {parsed && (
                <p className="mt-3 text-xs text-blue-700 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {doc.structureSummary}
                </p>
              )}
            </section>

            {!parsed && !parsing && (
              <div className="text-center py-12 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                选择文献后点击「开始解析」，下方将展示多模态内容、深度语义与结构化输出
              </div>
            )}

            {parsed && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* 多模态内容解析 */}
                <section
                  ref={modalRef}
                  className={`border border-gray-200 rounded-xl p-4 flex flex-col gap-3 scroll-mt-4 ${
                    initialFocus === 'modal' ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">多模态内容解析</h3>
                  </div>
                  <p className="text-[11px] text-gray-500">图像识别 · 表格还原 · 公式识别</p>

                  <div className="flex flex-col gap-2 flex-1">
                    {doc.figures.slice(0, 2).map((fig) => (
                      <div key={fig.id} className="rounded-lg border border-gray-100 p-2.5 bg-gray-50/80">
                        <div className="text-[10px] font-medium mb-0.5" style={{ color: fig.color }}>{fig.figType} · {fig.number}</div>
                        <div className="text-xs text-gray-700">{fig.caption}</div>
                      </div>
                    ))}
                    {doc.tables[0] && (
                      <div className="rounded-lg border border-gray-100 p-2.5">
                        <div className="flex items-center gap-1 text-[10px] text-green-600 mb-1">
                          <Table2 className="w-3 h-3" />{doc.tables[0].number}
                        </div>
                        <div className="text-xs text-gray-700 line-clamp-2">{doc.tables[0].caption}</div>
                      </div>
                    )}
                    {doc.formulas[0] && (
                      <div className="rounded-lg border border-gray-100 p-2.5">
                        <div className="flex items-center gap-1 text-[10px] text-purple-600 mb-1">
                          <Sigma className="w-3 h-3" />{doc.formulas[0].number}
                        </div>
                        <div className="font-mono text-[11px] text-gray-800 truncate">{doc.formulas[0].expr}</div>
                      </div>
                    )}
                    {!doc.formulas.length && !doc.tables.length && doc.figures.length === 0 && (
                      <p className="text-xs text-gray-400">暂无多模态内容</p>
                    )}
                  </div>
                </section>

                {/* 深度语义解析 */}
                <section
                  ref={semanticRef}
                  className={`border border-gray-200 rounded-xl p-4 flex flex-col gap-3 scroll-mt-4 ${
                    initialFocus === 'semantic' ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">深度语义解析</h3>
                  </div>
                  <p className="text-[11px] text-gray-500">段落级摘要 · 图注关联</p>

                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                    <div className="text-[10px] text-blue-600 font-medium mb-1">全文摘要</div>
                    <p className="text-xs text-blue-900/80 leading-relaxed line-clamp-4">
                      {doc.sections.find((s) => s.id === 's1')?.summary}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    {doc.sections.filter((s) => s.level === 1 && s.id !== 's1').slice(0, 3).map((s) => (
                      <div key={s.id}>
                        <div className="text-[11px] font-medium text-gray-700 mb-0.5">{s.title}</div>
                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{s.summary}</p>
                      </div>
                    ))}
                  </div>

                  {doc.figures[0] && (
                    <div className="rounded-lg border border-gray-100 p-2.5 bg-gray-50/80 mt-auto">
                      <div className="text-[10px] text-gray-500 mb-1">图注关联 · {doc.figures[0].number}</div>
                      <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">{doc.figures[0].relatedText}</p>
                    </div>
                  )}
                </section>

                {/* 结构化内容输出 */}
                <section
                  ref={outputRef}
                  className={`border border-gray-200 rounded-xl p-4 flex flex-col gap-3 scroll-mt-4 ${
                    initialFocus === 'output' ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">结构化内容输出</h3>
                  </div>
                  <p className="text-[11px] text-gray-500">概念 · 变量 · 实验 · 引用</p>

                  {doc.concepts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-[10px] text-blue-600 mb-1.5">
                        <BookOpen className="w-3 h-3" />概念定义
                      </div>
                      {doc.concepts.slice(0, 2).map((c) => (
                        <div key={c.term} className="mb-2 last:mb-0">
                          <div className="text-xs font-medium text-gray-800">{c.term}</div>
                          <p className="text-[11px] text-gray-500 line-clamp-2">{c.definition}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {doc.variables.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-[10px] text-purple-600 mb-1.5">
                        <Hash className="w-3 h-3" />变量关系
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.variables.map((v) => (
                          <span key={v.symbol} className="text-[11px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                            {v.symbol}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {doc.experiments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 text-[10px] text-green-600 mb-1.5">
                        <FlaskConical className="w-3 h-3" />实验过程
                      </div>
                      {doc.experiments.slice(0, 2).map((e, i) => (
                        <div key={i} className="text-[11px] text-gray-600 mb-1">
                          {e.dataset} · {e.metric} = <span className="font-semibold text-green-700">{e.result}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {doc.citations.length > 0 && (
                    <div className="mt-auto">
                      <div className="flex items-center gap-1 text-[10px] text-orange-600 mb-1.5">
                        <GitBranch className="w-3 h-3" />引用路径
                      </div>
                      {doc.citations.slice(0, 2).map((c) => (
                        <div key={c.ref} className="text-[11px] text-gray-600 mb-1 line-clamp-1">
                          <span className="text-orange-500 font-mono mr-1">{c.ref}</span>
                          {c.title}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
