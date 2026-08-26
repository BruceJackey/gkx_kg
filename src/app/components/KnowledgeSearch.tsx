import { useState, useMemo, useRef, type ChangeEvent } from 'react';
import {
  Search, MessageSquare, BookmarkPlus, X, ChevronDown,
  ExternalLink, Quote, Loader2, FolderOpen, FileText, Check,
  Plus, Sparkles, Link, SlidersHorizontal, ChevronUp, BarChart3,
  ChevronRight, Filter, TrendingUp, Trash2, Bot, Send, User,
  Image as ImageIcon, Table2, Sigma, Layers, Upload,
} from 'lucide-react';
import NoteGenerationDialog from './NoteGenerationDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryRef {
  label: string;
  section: string;
}

type DocKind = '文献' | '专利';
type ModalityKind = 'image' | 'table' | 'formula';

interface Literature {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  impactFactor: number;
  citations: number;
  abstract: string;
  aiSummary: string;
  relevanceScore: number;
  summaryRefs: SummaryRef[];
  keywords: string[];
  doi: string;
  docKind?: DocKind;
  /** Mock modalities this paper can be retrieved by in reverse/hybrid search */
  modalityHints?: ModalityKind[];
}

interface ModalAttachment {
  id: string;
  kind: ModalityKind;
  name: string;
  preview?: string; // object URL for images
  note?: string;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const MODALITY_META: Record<ModalityKind, { label: string; accept: string; Icon: typeof ImageIcon; color: string; bg: string; border: string }> = {
  image: { label: '图片', accept: 'image/*', Icon: ImageIcon, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  table: { label: '表格', accept: '.csv,.tsv,.xlsx,.xls,.tsv,text/csv', Icon: Table2, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  formula: { label: '公式', accept: '.tex,.mml,.mathml,image/*,.svg', Icon: Sigma, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const JOURNALS = ['Nature', 'Science', 'IEEE TKDE', 'NeurIPS', 'ACL', 'AAAI', 'ICLR', 'ACM SIGKDD', 'EMNLP', 'Cell', 'PNAS', 'WWW'];

const mockLiterature: Literature[] = [
  {
    id: 'L001',
    title: '基于Transformer的知识图谱嵌入方法研究',
    authors: ['张明', '李华', '王强', '陈志远'],
    journal: 'IEEE TKDE',
    year: 2024,
    impactFactor: 8.9,
    citations: 142,
    abstract: '本文提出了一种新的基于Transformer架构的知识图谱嵌入方法，有效解决了传统方法在长距离依赖建模方面的不足。实验结果表明，该方法在多个标准知识图谱补全数据集上均取得了优于现有方法的性能。',
    aiSummary: '该研究将Transformer的自注意力机制引入知识图谱嵌入，突破了TransE等方法在捕捉复杂关系时的局限性。作者在FB15k-237和WN18RR基准上分别提升了MRR指标4.2%和3.8%，验证了架构选择的合理性。核心贡献在于提出的「关系感知位置编码」策略，为后续研究提供了新的方向。',
    relevanceScore: 0.96,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第3节', section: 'Section 3' }, { label: '§实验', section: 'Experiments' }],
    keywords: ['知识图谱', '嵌入', 'Transformer', '表示学习'],
    doi: '10.1109/TKDE.2024.001',
  },
  {
    id: 'L002',
    title: 'Large Language Models for Scientific Knowledge Extraction',
    authors: ['Chen Wei', 'Liu Yang', 'Zhang Fang'],
    journal: 'NeurIPS',
    year: 2024,
    impactFactor: 12.4,
    citations: 389,
    abstract: 'We present a comprehensive study on leveraging large language models for automated scientific knowledge extraction from research papers. Our method achieves state-of-the-art performance across multiple benchmarks while maintaining interpretability.',
    aiSummary: 'This work systematically benchmarks GPT-4, Claude-3, and Llama-2 on scientific IE tasks, revealing that instruction-tuned models outperform fine-tuned baselines by 11% F1 on relation extraction. The authors introduce a novel chain-of-thought prompting strategy that grounds extractions in explicit evidence spans, substantially reducing hallucination rates. These findings have direct implications for building reliable scientific knowledge graph pipelines.',
    relevanceScore: 0.94,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§实验', section: 'Experiments' }],
    keywords: ['LLM', 'knowledge extraction', 'NLP', 'scientific IE'],
    doi: '10.5555/NeurIPS.2024.002',
  },
  {
    id: 'L003',
    title: '面向科研领域的知识图谱构建与应用综述',
    authors: ['刘芳', '陈志远', '赵磊'],
    journal: 'ACM SIGKDD',
    year: 2023,
    impactFactor: 7.2,
    citations: 256,
    abstract: '本文系统综述了近年来面向科研领域的知识图谱构建技术与应用场景，重点分析了实体识别、关系抽取、知识融合等核心技术的研究进展，并对未来发展方向进行了展望。',
    aiSummary: '综述覆盖2015-2023年间约400篇文献，将科研知识图谱的构建流程划分为数据获取、实体识别、关系抽取和知识融合四个阶段，并逐一梳理了各阶段的代表性方法。值得注意的是，作者指出跨领域知识融合仍是最大技术瓶颈，当前最优方法在异构本体对齐上的准确率仅达72%。该综述可作为新研究者进入该领域的权威入门参考。',
    relevanceScore: 0.91,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第2节', section: 'Section 2' }, { label: '§结论', section: 'Conclusion' }],
    keywords: ['知识图谱', '综述', '实体识别', '关系抽取'],
    doi: '10.1145/KDD.2023.003',
  },
  {
    id: 'L004',
    title: 'Graph Neural Networks for Biomedical Knowledge Discovery',
    authors: ['Smith J', 'Johnson M', 'Brown K', 'Davis L'],
    journal: 'Nature',
    year: 2024,
    impactFactor: 69.5,
    citations: 1203,
    abstract: 'This paper introduces a novel graph neural network architecture specifically designed for biomedical knowledge discovery. The model integrates heterogeneous biomedical data sources and demonstrates superior performance in drug-target interaction prediction.',
    aiSummary: 'The proposed HeteroGNN architecture jointly models protein-protein interactions, drug-disease associations, and gene expression networks within a unified message-passing framework. Evaluated on the DrugBank and OMIM databases, it achieves AUROC of 0.94 for drug repurposing — outperforming previous GNN baselines by 8 points. Notably, three of the model\'s top-10 predicted novel drug-target pairs were subsequently validated in wet-lab assays.',
    relevanceScore: 0.88,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§方法', section: 'Methods' }],
    keywords: ['GNN', 'biomedical', 'drug discovery', 'knowledge graph'],
    doi: '10.1038/nature.2024.004',
  },
  {
    id: 'L005',
    title: '基于多模态融合的科研文献推荐系统',
    authors: ['王磊', '孙晓明', '林青'],
    journal: 'AAAI',
    year: 2023,
    impactFactor: 6.8,
    citations: 98,
    abstract: '提出了一种融合文本、图结构和引用网络的多模态科研文献推荐方法。通过引入注意力机制对不同模态特征进行自适应加权，在真实学术数据集上验证了方法的有效性。',
    aiSummary: '本文的核心创新是设计了一种「模态门控注意力」机制，使模型能够动态选择不同信息源（全文语义、共引网络、关键词图）的贡献比例。在AMiner和Semantic Scholar数据集上，NDCG@10相比最强基线提升了6.1%。该工作对构建个性化学术助手系统具有较高的工程参考价值。',
    relevanceScore: 0.85,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§实验', section: 'Experiments' }],
    keywords: ['推荐系统', '多模态', '引用网络', '注意力机制'],
    doi: '10.1609/AAAI.2023.005',
  },
  {
    id: 'L006',
    title: 'Automated Hypothesis Generation from Scientific Literature',
    authors: ['Patel R', 'Kumar S', 'Lee H'],
    journal: 'Science',
    year: 2024,
    impactFactor: 56.9,
    citations: 892,
    abstract: 'We demonstrate an AI-driven system capable of generating novel scientific hypotheses by mining relationships across millions of research papers. The system successfully predicted several experimentally validated findings in materials science.',
    aiSummary: 'The system, called HypoGen, applies a two-stage pipeline: first extracting latent relational embeddings from 4.2M papers, then using a constrained generative model to propose novel entity-relation-entity triples ranked by a novelty-plausibility score. In a blind evaluation by domain experts, 23% of top-50 hypotheses were rated as genuinely novel and testable. This represents a significant step toward AI-augmented scientific discovery.',
    relevanceScore: 0.87,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第3节', section: 'Section 3' }, { label: '§结论', section: 'Conclusion' }],
    keywords: ['hypothesis generation', 'AI', 'materials science', 'knowledge mining'],
    doi: '10.1126/science.2024.006',
  },
  {
    id: 'L007',
    title: 'BERT-KG: Pre-trained Language Models Meet Knowledge Graphs',
    authors: ['Wang Fei', 'Zhang Li', 'Chen Ming', 'Zhao Hui'],
    journal: 'ACL',
    year: 2023,
    impactFactor: 9.3,
    citations: 445,
    abstract: 'We propose BERT-KG, a framework that seamlessly integrates structured knowledge from knowledge graphs into pre-trained language models. Our approach enables knowledge-enriched representations that improve performance on knowledge-intensive NLP tasks.',
    aiSummary: 'BERT-KG injects entity embeddings from Wikidata directly into BERT\'s attention layers via a novel entity-span alignment mechanism, avoiding the need for additional entity-linking supervision. On KILT and FEVER benchmarks, it surpasses vanilla BERT by 9.4% and 7.1% F1 respectively. The integration strategy is lightweight (adds only 3% parameters) and generalizable to any PLM backbone.',
    relevanceScore: 0.93,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第4节', section: 'Section 4' }],
    keywords: ['BERT', 'knowledge graph', 'pre-training', 'NLP'],
    doi: '10.18653/ACL.2023.007',
  },
  {
    id: 'L008',
    title: '大语言模型在医疗知识图谱构建中的应用研究',
    authors: ['周晨', '吴浩然', '徐静'],
    journal: 'PNAS',
    year: 2024,
    impactFactor: 11.2,
    citations: 187,
    abstract: '本文探讨了大语言模型（LLM）在医疗领域知识图谱自动化构建中的能力与局限性，构建了包含280万医疗实体和1200万关系三元组的知识图谱，并评估了其在临床决策支持中的应用效果。',
    aiSummary: '研究采用GPT-4对电子病历、诊疗指南和生物医学文献进行联合信息抽取，构建的医疗知识图谱在疾病-症状关系的准确率达到89.3%，优于先前基于规则的系统。但作者同时指出，LLM在罕见疾病实体识别上的召回率仅53%，提示领域知识注入仍是关键挑战。该图谱已在三家三甲医院的辅助诊断系统中部署验证。',
    relevanceScore: 0.9,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§实验', section: 'Experiments' }, { label: '§结论', section: 'Conclusion' }],
    keywords: ['大语言模型', '医疗知识图谱', '临床决策', '信息抽取'],
    doi: '10.1073/PNAS.2024.008',
  },
  {
    id: 'L009',
    title: 'Contrastive Learning for Knowledge Graph Completion',
    authors: ['Liu Xin', 'Park J', 'Tanaka Y'],
    journal: 'ICLR',
    year: 2024,
    impactFactor: 10.6,
    citations: 312,
    abstract: 'We introduce a contrastive learning framework for knowledge graph completion that learns discriminative entity and relation representations without requiring negative sampling heuristics. Our method significantly reduces training instability common in existing approaches.',
    aiSummary: 'The key insight is treating each entity\'s neighborhood subgraph as a natural positive example and leveraging in-batch negatives to avoid manual negative sampling biases. This contrastive objective yields representations that are more uniformly distributed in embedding space, mitigating the notorious "hub entity" problem in KGC. Results on ogbl-wikikg2 show 2.3% MRR improvement over the previous best with 40% faster convergence.',
    relevanceScore: 0.92,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第3节', section: 'Section 3' }],
    keywords: ['contrastive learning', 'knowledge graph completion', 'representation learning'],
    doi: '10.48550/ICLR.2024.009',
  },
  {
    id: 'L010',
    title: '基于图神经网络的科技文献关联分析',
    authors: ['赵鑫', '刘知远', '孙茂松'],
    journal: 'AAAI',
    year: 2023,
    impactFactor: 6.8,
    citations: 203,
    abstract: '本文提出了一种基于异质图神经网络的科技文献关联分析框架，能够同时建模作者、机构、关键词和引用等多种异质信息，实现高质量的文献聚类和趋势分析。',
    aiSummary: '该框架构建了包含作者合作、引用、关键词共现三类边的异质图，并设计了类型特定的消息传递机制以区分不同语义关系。在清华AMiner数据集上，文献聚类纯净度达0.81，较同期方法提升显著。作者还展示了该框架在识别新兴研究方向方面的应用潜力，为科研管理部门提供决策支持。',
    relevanceScore: 0.86,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§实验', section: 'Experiments' }],
    keywords: ['图神经网络', '异质图', '文献分析', '科技情报'],
    doi: '10.1609/AAAI.2023.010',
  },
  {
    id: 'L011',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP',
    authors: ['Lewis P', 'Perez E', 'Piktus A', 'Petroni F'],
    journal: 'NeurIPS',
    year: 2023,
    impactFactor: 12.4,
    citations: 2841,
    abstract: 'We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) — models which combine pre-trained parametric and non-parametric memory for language generation. Our models achieve state-of-the-art results on knowledge-intensive NLP tasks.',
    aiSummary: 'RAG combines a dense retriever (DPR) with a seq2seq generator (BART), allowing the model to condition on retrieved Wikipedia passages at generation time. The framework achieves new SoTA on Natural Questions, WebQuestions, and CuratedTrec without task-specific fine-tuning of the retriever. This seminal work established the RAG paradigm that now underpins most production LLM systems for factual question answering.',
    relevanceScore: 0.89,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第2节', section: 'Section 2' }, { label: '§实验', section: 'Experiments' }],
    keywords: ['RAG', 'retrieval augmentation', 'NLP', 'question answering'],
    doi: '10.5555/NeurIPS.2023.011',
  },
  {
    id: 'L012',
    title: '材料科学知识图谱的自动化构建与推理',
    authors: ['高峰', '陈磊', '张伟', '李明'],
    journal: 'Nature',
    year: 2023,
    impactFactor: 69.5,
    citations: 567,
    abstract: '本文报道了一种针对材料科学领域的大规模知识图谱自动化构建方法，通过对300万篇材料科研论文进行深度信息抽取，建立了涵盖材料组成、结构、性能和制备工艺的综合知识库。',
    aiSummary: '研究团队开发了专为材料科学定制的NLP管线，能够从文献中自动抽取"材料-属性-数值"三元组，准确率达91.4%。构建的MatKG包含1.2M个材料实体和8.7M条关系，支持多步推理查询（如"找出带隙在1.1-1.4eV且稳定性高于Si的钙钛矿材料"）。该成果已被用于加速新型光伏材料的筛选，缩短实验周期约60%。',
    relevanceScore: 0.83,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§方法', section: 'Methods' }, { label: '§结论', section: 'Conclusion' }],
    keywords: ['材料科学', '知识图谱', '自动化构建', '知识推理'],
    doi: '10.1038/nature.2023.012',
  },
  {
    id: 'L013',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    authors: ['Wei J', 'Wang X', 'Schuurmans D', 'Bosma M'],
    journal: 'NeurIPS',
    year: 2022,
    impactFactor: 12.4,
    citations: 5203,
    abstract: 'We explore how generating a chain of thought — a series of intermediate reasoning steps — significantly improves the ability of large language models to perform complex reasoning. Experiments on arithmetic, commonsense, and symbolic reasoning tasks demonstrate large performance gains.',
    aiSummary: 'Chain-of-thought prompting provides step-by-step reasoning exemplars in few-shot prompts, enabling emergent multi-step reasoning in models above ~100B parameters. On GSM8K math word problems, GPT-3 with CoT improves from 17% to 57% solve rate — a dramatic jump attributable to the serialized reasoning format. This work fundamentally shifted how researchers think about eliciting complex reasoning from LLMs, spawning the entire "reasoning" sub-field.',
    relevanceScore: 0.82,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§实验', section: 'Experiments' }],
    keywords: ['chain-of-thought', 'LLM', 'reasoning', 'prompting'],
    doi: '10.5555/NeurIPS.2022.013',
  },
  {
    id: 'L014',
    title: '联邦学习在医疗数据知识挖掘中的隐私保护研究',
    authors: ['郑浩', '吴涛', '刘思远'],
    journal: 'Cell',
    year: 2024,
    impactFactor: 66.9,
    citations: 134,
    abstract: '针对医疗数据隐私敏感性问题，本文提出了一种基于联邦学习的医疗知识图谱协同构建框架，在不共享原始数据的前提下，实现了多机构医疗知识的安全融合与共享。',
    aiSummary: '该框架将差分隐私噪声注入到联邦聚合过程，并设计了自适应隐私预算分配策略，在隐私保护强度和模型效用之间取得了更优平衡（ε=1.0时准确率损失仅3.2%）。跨10家医院的真实场景实验表明，联邦版本的知识图谱质量接近集中式训练的98%。该工作为合规医疗AI系统的实际落地提供了重要技术支撑。',
    relevanceScore: 0.79,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§方法', section: 'Methods' }],
    keywords: ['联邦学习', '隐私保护', '医疗AI', '知识图谱'],
    doi: '10.1016/Cell.2024.014',
  },
  {
    id: 'L015',
    title: 'Temporal Knowledge Graph Reasoning with Recurrent Architecture',
    authors: ['Trivedi R', 'Dai H', 'Wang Y', 'Song L'],
    journal: 'ICLR',
    year: 2023,
    impactFactor: 10.6,
    citations: 678,
    abstract: 'We study reasoning over temporal knowledge graphs where facts are associated with timestamps. Our recurrent event network (RE-NET) models the occurrence of events as a recurrent process and achieves significant improvements on temporal KG completion benchmarks.',
    aiSummary: 'RE-NET decomposes temporal KG reasoning into two tasks: predicting which entities will interact next and predicting the nature of future interactions. By modeling the global event graph evolution with graph aggregation and the local entity history with RNNs, it outperforms static KGE baselines by 13.7% MRR on ICEWS14. The recurrent formulation elegantly handles both interpolation (filling in missing past facts) and extrapolation (predicting future events).',
    relevanceScore: 0.88,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第3节', section: 'Section 3' }, { label: '§实验', section: 'Experiments' }],
    keywords: ['temporal knowledge graph', 'reasoning', 'recurrent network'],
    doi: '10.48550/ICLR.2023.015',
  },
  {
    id: 'L016',
    title: '基于强化学习的知识图谱多跳推理路径发现',
    authors: ['杨帆', '周旭', '蒋毅'],
    journal: 'ACL',
    year: 2023,
    impactFactor: 9.3,
    citations: 321,
    abstract: '本文将多跳知识图谱推理形式化为序列决策问题，通过强化学习训练智能体在图上逐步游走，发现可解释的推理路径。方法在多个多跳QA数据集上取得了最优性能。',
    aiSummary: '该方法将知识图谱路径推理建模为有限视野的马尔可夫决策过程，奖励信号基于终点实体与正确答案的语义相似度。与此前的束搜索方法相比，RL策略产生了更多样化且逻辑连贯的推理路径。在MetaQA 3-hop和WebQSP上的结果验证了可解释性的重要性，模型在错误案例的溯源上也更加直观。',
    relevanceScore: 0.91,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§方法', section: 'Methods' }, { label: '§分析', section: 'Analysis' }],
    keywords: ['强化学习', '多跳推理', '知识图谱', '可解释AI'],
    doi: '10.18653/ACL.2023.016',
  },
  {
    id: 'L017',
    title: 'Foundation Models for Protein Structure and Function Prediction',
    authors: ['Jumper J', 'Evans R', 'Pritzel A', 'Green T'],
    journal: 'Nature',
    year: 2023,
    impactFactor: 69.5,
    citations: 4120,
    abstract: 'We present AlphaFold2-based foundation model extensions that enable zero-shot protein function prediction by integrating structural representations with biochemical knowledge graphs. The approach generalizes across protein families not seen during training.',
    aiSummary: 'Building on AlphaFold2 structural embeddings, this work constructs a protein-centric knowledge graph linking structural motifs, functional annotations (GO terms), and interaction partners. A heterogeneous GNN trained on this graph achieves 0.88 AUPR on zero-shot function prediction for orphan proteins. The work demonstrates the power of coupling structural AI with symbolic knowledge representations for biological discovery.',
    relevanceScore: 0.76,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§结论', section: 'Conclusion' }],
    keywords: ['protein structure', 'foundation model', 'knowledge graph', 'bioinformatics'],
    doi: '10.1038/nature.2023.017',
  },
  {
    id: 'L018',
    title: '零样本跨语言知识图谱对齐方法',
    authors: ['钱程', '刘洋', '何克清', '董启明'],
    journal: 'EMNLP',
    year: 2024,
    impactFactor: 8.1,
    citations: 89,
    abstract: '本文提出了一种基于大语言模型的零样本跨语言知识图谱对齐方法，无需任何人工标注的跨语言实体对齐种子集，在多个跨语言对齐基准上显著超越了现有有监督方法。',
    aiSummary: '研究利用多语言LLM（mBERT和XLM-R）的跨语言迁移能力，结合图结构信息提出了「双渠道对齐」策略，同时考虑语义相似性和邻域结构相似性。在DBP15K（ZH-EN、JA-EN、FR-EN）三个数据集上，零样本版本的Hits@1超过了有监督基线1.8-4.3%，挑战了领域内对标注数据必要性的认知。',
    relevanceScore: 0.87,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§第4节', section: 'Section 4' }],
    keywords: ['跨语言', '知识图谱对齐', '零样本', '多语言模型'],
    doi: '10.18653/EMNLP.2024.018',
  },
  {
    id: 'L019',
    title: 'Scaling Laws for Knowledge Graph Embedding Models',
    authors: ['Hassan M', 'Welch M', 'Peng H'],
    journal: 'WWW',
    year: 2024,
    impactFactor: 5.9,
    citations: 156,
    abstract: 'We systematically study how knowledge graph embedding model performance scales with the number of parameters, training triples, and compute budget. We identify clear power-law relationships and derive optimal scaling recipes for practitioners.',
    aiSummary: 'Across 12 KGE architectures and 5 benchmark datasets, the authors find that entity embedding dimension and training data volume follow predictable power-law scaling, similar to findings in LLM scaling laws. A key practical finding: doubling embedding dimension yields +3.1% MRR on average but with diminishing returns beyond 1024 dimensions. The derived "compute-optimal" frontiers provide actionable guidance for resource-constrained KGE deployments.',
    relevanceScore: 0.84,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§实验', section: 'Experiments' }, { label: '§分析', section: 'Analysis' }],
    keywords: ['scaling laws', 'knowledge graph embedding', 'benchmark'],
    doi: '10.1145/WWW.2024.019',
  },
  {
    id: 'L020',
    title: '基于因果推断的知识图谱可信度评估框架',
    authors: ['林晓东', '宋义', '贾云飞'],
    journal: 'AAAI',
    year: 2024,
    impactFactor: 6.8,
    citations: 72,
    abstract: '本文从因果推断视角出发，提出了一种可信度感知的知识图谱质量评估框架，能够区分相关性驱动的虚假知识和因果性支撑的可信知识，为知识图谱清洗提供了理论依据。',
    aiSummary: '该框架借鉴Pearl的do-calculus，将知识三元组的可信度定义为干预实验下的因果效应强度，而非单纯的统计共现频率。在含有人工植入噪声的FreeBase子图上，该方法识别虚假三元组的精确率达95.1%，比基于统计置信度的方法高出18个百分点。这一思路为知识图谱的自动化清洗和持续维护开辟了新路径。',
    relevanceScore: 0.83,
    summaryRefs: [{ label: '§摘要', section: 'Abstract' }, { label: '§方法', section: 'Methods' }, { label: '§结论', section: 'Conclusion' }],
    keywords: ['因果推断', '知识图谱', '可信度评估', '知识清洗'],
    doi: '10.1609/AAAI.2024.020',
  },
  {
    id: 'P001',
    title: '一种多模态科学文献图表反向检索方法及系统',
    authors: ['李研', '周凯'],
    journal: 'CN专利',
    year: 2024,
    impactFactor: 0,
    citations: 18,
    abstract: '本发明公开了一种支持以图片、表格、公式为查询条件的多模态反向检索方法，可从大规模文献与专利库中召回语义相关文档。',
    aiSummary: '专利提出图像-文本联合编码与公式结构树匹配两条通路，支持单模态反向检索与跨模态混合查询，适用于科研知识库检索场景。',
    relevanceScore: 0.97,
    summaryRefs: [{ label: '§权利要求', section: 'Claims' }, { label: '§实施例', section: 'Embodiments' }],
    keywords: ['多模态', '反向检索', '图表', '专利'],
    doi: 'CN202410998877A',
    docKind: '专利',
    modalityHints: ['image', 'table', 'formula'],
  },
  {
    id: 'P002',
    title: '基于公式结构的科技文献语义检索装置',
    authors: ['韩雪', '丁磊'],
    journal: 'CN专利',
    year: 2023,
    impactFactor: 0,
    citations: 11,
    abstract: '本发明涉及一种将 LaTeX / MathML 公式解析为结构图并与全文语义联合检索的装置。',
    aiSummary: '通过公式 AST 与段落嵌入的双塔检索，可定位包含等价变换或同义公式的文献段落，支撑科研人员以公式找文。',
    relevanceScore: 0.93,
    summaryRefs: [{ label: '§说明书', section: 'Description' }],
    keywords: ['公式检索', 'LaTeX', '语义检索', '专利'],
    doi: 'CN202310556612B',
    docKind: '专利',
    modalityHints: ['formula', 'table'],
  },
];

function enrichLiterature(papers: Literature[]): Literature[] {
  return papers.map(p => {
    if (p.modalityHints?.length) return { ...p, docKind: p.docKind ?? '文献' };
    const blob = `${p.title} ${p.abstract} ${p.keywords.join(' ')}`.toLowerCase();
    const hints: ModalityKind[] = [];
    if (/多模态|image|visual|图|cnn|chart|figure|推荐/.test(blob)) hints.push('image');
    if (/table|实验|benchmark|数据集|指标|result|评估|清洗/.test(blob)) hints.push('table');
    if (/transformer|embedding|公式|attention|mrr|loss|数学|因果|对齐/.test(blob)) hints.push('formula');
    if (hints.length === 0) hints.push('image', 'table');
    return { ...p, docKind: p.docKind ?? '文献', modalityHints: hints };
  });
}

const literatureIndex = enrichLiterature(mockLiterature);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relevanceBadgeColor(score: number) {
  if (score >= 0.9) return 'bg-green-100 text-green-700 border border-green-200';
  if (score >= 0.8) return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-orange-100 text-orange-700 border border-orange-200';
}

function ifBadgeColor(factor: number) {
  if (factor >= 40) return 'bg-purple-100 text-purple-700';
  if (factor >= 10) return 'bg-blue-100 text-blue-700';
  if (factor >= 5) return 'bg-cyan-100 text-cyan-700';
  return 'bg-gray-100 text-gray-600';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, count, open, onToggle }: { title: string; count?: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
      onClick={onToggle}
    >
      <span className="flex items-center gap-1.5">
        {title}
        {count !== undefined && <span className="text-xs font-normal text-gray-400">({count})</span>}
      </span>
      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );
}

function RangeSlider({ min, max, value, onChange, label }: {
  min: number; max: number; value: [number, number];
  onChange: (v: [number, number]) => void; label: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label(value[0])}</span>
        <span>{label(value[1])}</span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-y-0 left-0 right-0 bg-gray-200 rounded-full" />
        <div
          className="absolute inset-y-0 bg-blue-500 rounded-full"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${((max - value[1]) / (max - min)) * 100}%`,
          }}
        />
        <input
          type="range" min={min} max={max} value={value[0]}
          onChange={e => onChange([Math.min(Number(e.target.value), value[1]), value[1]])}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
        <input
          type="range" min={min} max={max} value={value[1]}
          onChange={e => onChange([value[0], Math.max(Number(e.target.value), value[0])])}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
        />
      </div>
    </div>
  );
}

function kbSourceLabel(title: string): '中文知识库' | '英文知识库' {
  return /[\u4e00-\u9fff]/.test(title) ? '中文知识库' : '英文知识库';
}

export type KnowledgeSearchVariant = 'default' | 'cross-db-fusion';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KnowledgeSearch({ variant = 'default' }: { variant?: KnowledgeSearchVariant }) {
  const isCrossDbFusion = variant === 'cross-db-fusion';
  // Search
  const [searchMode, setSearchMode] = useState<'text' | 'multimodal'>('text');
  const [searchQuery, setSearchQuery] = useState('知识图谱 Transformer 嵌入');
  const [appliedQuery, setAppliedQuery] = useState('知识图谱 Transformer 嵌入');
  const [attachments, setAttachments] = useState<ModalAttachment[]>([]);
  const [appliedAttachments, setAppliedAttachments] = useState<ModalAttachment[]>([]);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingKind, setPendingKind] = useState<ModalityKind>('image');

  // Filters
  const [yearRange, setYearRange] = useState<[number, number]>([2018, 2024]);
  const [selectedJournals, setSelectedJournals] = useState<string[]>([]);
  const [ifRange, setIfRange] = useState<[number, number]>([0, 70]);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'citations' | 'if'>('relevance');

  // Sidebar collapse states
  const [yearOpen, setYearOpen] = useState(true);
  const [journalOpen, setJournalOpen] = useState(true);
  const [ifOpen, setIfOpen] = useState(true);
  const [docTypeOpen, setDocTypeOpen] = useState(true);

  // UI state
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  const PAGE_SIZE = 8;
  const activeModalities = useMemo(
    () => [...new Set(appliedAttachments.map(a => a.kind))],
    [appliedAttachments],
  );
  const isHybridQuery = appliedAttachments.length > 0 && !!appliedQuery.trim();
  const isReverseOnly = appliedAttachments.length > 0 && !appliedQuery.trim();

  // Filter & sort
  const filteredResults = useMemo(() => {
    let items = literatureIndex.filter(p =>
      p.year >= yearRange[0] && p.year <= yearRange[1] &&
      (p.impactFactor >= ifRange[0] && p.impactFactor <= ifRange[1] || p.docKind === '专利') &&
      (selectedJournals.length === 0 || selectedJournals.includes(p.journal)) &&
      (selectedDocTypes.length === 0 || selectedDocTypes.includes(p.docKind ?? '文献'))
    );

    if (activeModalities.length > 0) {
      items = items
        .filter(p => (p.modalityHints ?? []).some(m => activeModalities.includes(m)))
        .map(p => {
          const hitCount = (p.modalityHints ?? []).filter(m => activeModalities.includes(m)).length;
          const boost = 0.04 * hitCount + (isHybridQuery ? 0.03 : 0.06);
          return { ...p, relevanceScore: Math.min(0.99, p.relevanceScore + boost) };
        });
    }

    if (sortBy === 'date') items = [...items].sort((a, b) => b.year - a.year);
    else if (sortBy === 'citations') items = [...items].sort((a, b) => b.citations - a.citations);
    else if (sortBy === 'if') items = [...items].sort((a, b) => b.impactFactor - a.impactFactor);
    else items = [...items].sort((a, b) => b.relevanceScore - a.relevanceScore);
    return items;
  }, [yearRange, ifRange, selectedJournals, selectedDocTypes, sortBy, activeModalities, isHybridQuery]);

  const totalPages = Math.ceil(filteredResults.length / PAGE_SIZE);
  const pageItems = filteredResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }

  function pickFile(kind: ModalityKind) {
    setPendingKind(kind);
    if (fileInputRef.current) {
      fileInputRef.current.accept = MODALITY_META[kind].accept;
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  function onFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = pendingKind;
    const id = Math.random().toString(36).slice(2, 9);
    const preview = kind === 'image' ? URL.createObjectURL(file) : undefined;
    setAttachments(prev => [...prev, { id, kind, name: file.name, preview }]);
    if (searchMode !== 'multimodal') setSearchMode('multimodal');
  }

  function removeAttachment(id: string) {
    setAttachments(prev => {
      const target = prev.find(a => a.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter(a => a.id !== id);
    });
  }

  function handleSearch() {
    if (searchMode === 'multimodal' && !searchQuery.trim() && attachments.length === 0) {
      showToast('请输入文本或上传图片/表格/公式');
      return;
    }
    setSearching(true);
    setAppliedQuery(searchQuery.trim());
    setAppliedAttachments([...attachments]);
    setPage(1);
    setTimeout(() => setSearching(false), 600);
  }

  function toggleSummary(id: string) {
    setExpandedSummaries(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (pageItems.every(p => selectedIds.has(p.id))) {
      const next = new Set(selectedIds);
      pageItems.forEach(p => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      pageItems.forEach(p => next.add(p.id));
      setSelectedIds(next);
    }
  }

  function toggleJournal(j: string) {
    setSelectedJournals(prev =>
      prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]
    );
  }

  function toggleDocType(t: string) {
    setSelectedDocTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  function saveItem(id: string) {
    setSavedIds(prev => { const n = new Set(prev); n.add(id); return n; });
    showToast('已保存到知识库');
  }

  function saveBulk() {
    setSavedIds(prev => { const n = new Set(prev); selectedIds.forEach(id => n.add(id)); return n; });
    showToast(`已批量保存 ${selectedIds.size} 篇文献到知识库`);
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChosen} />

      {/* ── TOP SEARCH AREA ── */}
      <div className="bg-white border-b border-gray-200 px-8 pt-5 pb-4 space-y-3">
        {/* Mode tabs */}
        {!isCrossDbFusion && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchMode('text')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${searchMode === 'text' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              文本检索
            </button>
            <button
              onClick={() => setSearchMode('multimodal')}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${searchMode === 'multimodal' ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <Layers size={14} />
              多模态交叉检索
            </button>
          </div>
        )}
        {isCrossDbFusion && (
          <div className="text-sm font-medium text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
            跨库结果融合 · 并行检索中文 / 英文知识库，融合去重后统一返回
          </div>
        )}

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="ml-4 text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 px-3 py-3 text-gray-900 placeholder-gray-400 text-sm outline-none bg-transparent"
              placeholder={
                isCrossDbFusion
                  ? '输入查询意图，将并行检索中/英知识库并融合结果…'
                  : searchMode === 'multimodal'
                    ? '可选：输入文本，与下方图片/表格/公式组成混合检索…'
                    : '输入研究问题或关键概念，如「知识图谱 Transformer 嵌入」...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {isCrossDbFusion ? '跨库检索' : '检索'}
          </button>
        </div>

        {/* Multimodal panel */}
        {!isCrossDbFusion && searchMode === 'multimodal' && (
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3 space-y-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-violet-800 mb-1">多模态反向检索</div>
                <p className="text-[11px] text-violet-700/80 leading-relaxed">
                  上传一张图片、一个表格或一个公式，在知识库中检索包含该内容或语义相关的文献与专利。
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-violet-800 mb-1">跨资源混合检索</div>
                <p className="text-[11px] text-violet-700/80 leading-relaxed">
                  一次查询可同时组合文本 + 多种模态附件（如图片+公式+关键词），联合召回。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(MODALITY_META) as ModalityKind[]).map(kind => {
                const meta = MODALITY_META[kind];
                return (
                  <button
                    key={kind}
                    onClick={() => pickFile(kind)}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border bg-white hover:bg-white transition-colors ${meta.border} ${meta.color}`}
                  >
                    <Upload size={12} />
                    <meta.Icon size={13} />
                    上传{meta.label}
                  </button>
                );
              })}
            </div>

            {attachments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {attachments.map(att => {
                  const meta = MODALITY_META[att.kind];
                  return (
                    <div
                      key={att.id}
                      className={`flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg border bg-white ${meta.border}`}
                    >
                      {att.preview ? (
                        <img src={att.preview} alt="" className="w-8 h-8 rounded object-cover border border-gray-100" />
                      ) : (
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${meta.bg}`}>
                          <meta.Icon size={14} className={meta.color} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</div>
                        <div className="text-[11px] text-gray-600 truncate max-w-[140px]">{att.name}</div>
                      </div>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-violet-500/80 border border-dashed border-violet-200 rounded-lg px-3 py-2.5 bg-white/60">
                尚未添加模态附件。仅上传附件 = 反向检索；附件 + 文本 = 混合检索。
              </div>
            )}
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
            <span>
              {isCrossDbFusion ? (
                <>
                  跨库结果融合 · 中/英知识库已去重合并，当前统一结果{' '}
                  <strong className="text-teal-700">{filteredResults.length}</strong> 条
                </>
              ) : (
                <>
                  共检索到 <strong className="text-gray-900">1.5亿+</strong> 篇文献/专利，当前筛选结果{' '}
                  <strong className="text-blue-600">{filteredResults.length}</strong> 篇
                </>
              )}
            </span>
            {appliedQuery && (
              <span className="text-gray-400">· 文本：<span className="text-gray-600">"{appliedQuery}"</span></span>
            )}
            {appliedAttachments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-violet-600">
                · {isHybridQuery ? '混合检索' : isReverseOnly ? '反向检索' : '多模态'}：
                {activeModalities.map(m => MODALITY_META[m].label).join(' + ')}
                <span className="text-violet-400">（{appliedAttachments.length} 个附件）</span>
              </span>
            )}
          </div>
          {!isCrossDbFusion && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400">排序</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none"
              >
                <option value="relevance">相关度</option>
                <option value="date">发表时间</option>
                <option value="citations">引用数</option>
                <option value="if">影响因子</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── LEFT SIDEBAR ── */}
        {!isCrossDbFusion && (
          <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto px-4 py-4">
            <div className="flex items-center gap-1.5 mb-3 text-gray-700">
              <SlidersHorizontal size={14} />
              <span className="text-sm font-semibold">筛选条件</span>
            </div>

            {/* Year range */}
            <div className="border-b border-gray-100 pb-3 mb-3">
              <SectionHeader title="发表时间" open={yearOpen} onToggle={() => setYearOpen(v => !v)} />
              {yearOpen && (
                <div className="mt-2">
                  <RangeSlider min={2018} max={2024} value={yearRange} onChange={setYearRange} label={v => String(v)} />
                </div>
              )}
            </div>

            {/* Journals */}
            <div className="border-b border-gray-100 pb-3 mb-3">
              <SectionHeader title="期刊/会议" count={selectedJournals.length || undefined} open={journalOpen} onToggle={() => setJournalOpen(v => !v)} />
              {journalOpen && (
                <div className="mt-1 space-y-1">
                  {JOURNALS.map(j => (
                    <label key={j} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                        selectedJournals.includes(j) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {selectedJournals.includes(j) && <Check size={9} className="text-white" />}
                      </div>
                      <span className="text-xs text-gray-600 group-hover:text-gray-900 flex-1">{j}</span>
                      <span className="text-xs text-gray-400">
                        {literatureIndex.filter(p => p.journal === j).length}
                      </span>
                      <input type="checkbox" className="sr-only" checked={selectedJournals.includes(j)} onChange={() => toggleJournal(j)} />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* IF range */}
            <div className="border-b border-gray-100 pb-3 mb-3">
              <SectionHeader title="影响因子" open={ifOpen} onToggle={() => setIfOpen(v => !v)} />
              {ifOpen && (
                <div className="mt-2">
                  <RangeSlider min={0} max={70} value={ifRange} onChange={setIfRange} label={v => v === 70 ? '70+' : String(v)} />
                </div>
              )}
            </div>

            {/* Doc types */}
            <div>
              <SectionHeader title="文档类型" open={docTypeOpen} onToggle={() => setDocTypeOpen(v => !v)} />
              {docTypeOpen && (
                <div className="mt-1 space-y-1">
                  {['文献', '专利', '数据集'].map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                        selectedDocTypes.includes(t) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {selectedDocTypes.includes(t) && <Check size={9} className="text-white" />}
                      </div>
                      <span className="text-xs text-gray-600 group-hover:text-gray-900 flex-1">{t}</span>
                      <input type="checkbox" className="sr-only" checked={selectedDocTypes.includes(t)} onChange={() => toggleDocType(t)} />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {(selectedJournals.length > 0 || selectedDocTypes.length > 0) && (
              <button
                onClick={() => { setSelectedJournals([]); setSelectedDocTypes([]); setYearRange([2018, 2024]); setIfRange([0, 70]); }}
                className="mt-4 w-full text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1"
              >
                <X size={11} /> 清除所有筛选
              </button>
            )}
          </aside>
        )}

        {/* ── MAIN RESULTS ── */}
        <main className="flex-1 overflow-y-auto px-6 py-4 pb-24">
          {isCrossDbFusion && (
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-900">
              <Layers size={15} className="text-teal-600" />
              跨库结果融合
            </div>
          )}
          {/* Select-all bar */}
          <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  pageItems.length > 0 && pageItems.every(p => selectedIds.has(p.id)) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}
                onClick={toggleSelectAll}
              >
                {pageItems.length > 0 && pageItems.every(p => selectedIds.has(p.id)) && <Check size={9} className="text-white" />}
              </div>
              全选本页
            </label>
            <span className="text-gray-300">|</span>
            <span>共 {filteredResults.length} 篇，第 {page}/{totalPages} 页</span>
          </div>

          <div className="space-y-3">
            {pageItems.map(paper => {
              const expanded = expandedSummaries.has(paper.id);
              const selected = selectedIds.has(paper.id);
              const saved = savedIds.has(paper.id);

              return (
                <article
                  key={paper.id}
                  className={`bg-white rounded-xl border transition-all hover:shadow-md ${
                    selected ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  {/* Header row */}
                  <div className="px-5 pt-4 flex items-start gap-3">
                    {/* Checkbox */}
                    <div
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                        selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 hover:border-blue-400'
                      }`}
                      onClick={() => toggleSelect(paper.id)}
                    >
                      {selected && <Check size={10} className="text-white" />}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      {isCrossDbFusion && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          {kbSourceLabel(paper.title)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${relevanceBadgeColor(paper.relevanceScore)}`}>
                        相关度 {Math.round(paper.relevanceScore * 100)}%
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        paper.docKind === '专利' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {paper.docKind ?? '文献'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{paper.journal}</span>
                      <span className="text-xs text-gray-400">{paper.year}</span>
                      {paper.docKind !== '专利' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ifBadgeColor(paper.impactFactor)}`}>
                          IF {paper.impactFactor}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 flex items-center gap-0.5 border border-gray-200">
                        <Quote size={9} /> {paper.citations.toLocaleString()}
                      </span>
                      {activeModalities.length > 0 && (paper.modalityHints ?? [])
                        .filter(m => activeModalities.includes(m))
                        .map(m => {
                          const meta = MODALITY_META[m];
                          return (
                            <span key={m} className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex items-center gap-0.5 ${meta.bg} ${meta.color} ${meta.border}`}>
                              <meta.Icon size={10} />
                              {isHybridQuery ? `混合·${meta.label}` : `反向·${meta.label}`}
                            </span>
                          );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => saveItem(paper.id)}
                        title="保存到知识库"
                        className={`p-1.5 rounded-lg transition-colors ${
                          saved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <BookmarkPlus size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <ExternalLink size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="px-5 pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug">
                      {paper.title}
                    </h3>
                  </div>

                  {/* Authors + DOI */}
                  <div className="px-5 pt-1 flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 && ' 等'}
                    </span>
                    {paper.doi && (
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline font-mono transition-colors"
                        title={`DOI: ${paper.doi}`}
                      >
                        <Link size={10} className="flex-shrink-0" />
                        {paper.doi}
                      </a>
                    )}
                  </div>

                  {/* AI Summary */}
                  <div className="px-5 pt-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3">
                      {/* Label row */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 text-blue-700">
                          <Sparkles size={13} />
                          <span className="text-xs font-semibold">AI 摘要</span>
                        </div>
                      </div>

                      {/* Summary text with §-links */}
                      <p className={`text-xs text-gray-700 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
                        {paper.aiSummary}
                        {' '}
                        {paper.summaryRefs.map((ref, i) => (
                          <button
                            key={i}
                            className="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-700 hover:underline font-medium ml-0.5 transition-colors"
                            title={`定位原文 · ${ref.section}`}
                          >
                            <Link size={9} />
                            {ref.label}
                          </button>
                        ))}
                      </p>

                      {/* Expand toggle */}
                      <button
                        onClick={() => toggleSummary(paper.id)}
                        className="mt-1.5 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5 transition-colors"
                      >
                        {expanded ? <><ChevronUp size={11} /> 收起</> : <><ChevronDown size={11} /> 展开完整摘要</>}
                      </button>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="px-5 pt-2.5 flex flex-wrap gap-1.5">
                    {paper.keywords.map(kw => (
                      <span key={kw} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 cursor-pointer transition-colors">
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Action row */}
                  <div className="px-5 py-3 flex items-center gap-2 border-t border-gray-100 mt-3">
                    <button
                      onClick={() => saveItem(paper.id)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        saved
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {saved ? <Check size={12} /> : <BookmarkPlus size={12} />}
                      {saved ? '已保存' : '保存到知识库'}
                    </button>
                    <button className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <MessageSquare size={12} /> 加入对话
                    </button>
                    <button
                      onClick={() => setNoteDialogOpen(true)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <FileText size={12} /> 一键笔记
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                    page === n ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ── BULK ACTION BAR ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm">
          <span className="text-gray-300">已选 <strong className="text-white">{selectedIds.size}</strong> 篇</span>
          <div className="w-px h-4 bg-gray-600" />
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium text-sm"
          >
            <MessageSquare size={14} /> 深入对话
          </button>
          <button
            onClick={saveBulk}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            <BookmarkPlus size={14} /> 保存到知识库
          </button>
          <button
            onClick={() => setNoteDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            <FileText size={14} /> 生成笔记
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── TOAST ── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl animate-fade-in">
          <Check size={14} className="text-green-400" />
          {toastMsg}
        </div>
      )}

      {/* ── NOTE DIALOG ── */}
      <NoteGenerationDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        selectedPapers={literatureIndex.filter(p => selectedIds.has(p.id)).map(p => ({
          id: p.id, title: p.title, authors: p.authors, journal: p.journal,
          year: p.year, impactFactor: p.impactFactor, citations: p.citations,
          abstract: p.abstract, keywords: p.keywords,
        }))}
      />
    </div>
  );
}
