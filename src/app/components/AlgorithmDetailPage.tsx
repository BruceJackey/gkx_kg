import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Copy, Play, Settings, FileText, Eye, Database, Rocket, Download, TrendingUp, Calendar, Shuffle, GitBranch, Cpu, Network, Search, Check, X, Plus, Brain, CheckCircle, XCircle, Tag, Zap, Layers } from 'lucide-react';
import { ScoringFunctionDemo } from './demos/ScoringFunctionDemo';
import { SupervisedSimilarityDemo } from './demos/SupervisedSimilarityDemo';
import { RepresentationSpaceDemo } from './demos/RepresentationSpaceDemo';
import { EncodingModelDemo } from './demos/EncodingModelDemo';
import {
  EmbeddingSpaceSelector,
  supportsEmbeddingSpace,
  embeddingSpaceLabel,
  type EmbeddingSpace,
} from './demos/EmbeddingSpaceSelector';
import { NodeSimilarityDemo } from './demos/NodeSimilarityDemo';
import { SemanticRetrievalDemo } from './demos/SemanticRetrievalDemo';
import { RuleExtensionDemo } from './demos/RuleExtensionDemo';
import { FewShotTripleDemo } from './demos/FewShotTripleDemo';
import { RelationScoringDemo } from './demos/RelationScoringDemo';
import { AdversarialTransferDemo } from './demos/AdversarialTransferDemo';
import { TemporalRelationDependencyDemo } from './demos/TemporalRelationDependencyDemo';
import { StatInstanceGenerationDemo } from './demos/StatInstanceGenerationDemo';
import { InstanceMatchingDemo } from './demos/InstanceMatchingDemo';
import { RLDenoisingDemo } from './demos/RLDenoisingDemo';
import { EventRelationExtractionDemo } from './demos/EventRelationExtractionDemo';
import { EventRecognitionEngineDemo } from './demos/EventRecognitionEngineDemo';
import { RLSentenceSelectorDemo } from './demos/RLSentenceSelectorDemo';
import { TermEventRoughDemo } from './demos/TermEventRoughDemo';
import { HypernymDemo } from './demos/HypernymDemo';
import { RGATDemo } from './demos/RGATDemo';
import { TermVectorDemo } from './demos/TermVectorDemo';
import { DependencyTreeDemo } from './demos/DependencyTreeDemo';
import { CrossLingualAlignmentDemo } from './demos/CrossLingualAlignmentDemo';

interface AlgorithmDetailProps {
  algorithmId: string;
  onBack: () => void;
  onNavigateToService?: (algorithmId: string) => void;
}

const algorithmDetails: Record<string, any> = {
  'lstm-crf': {
    name: 'LSTM-CRF',
    englishName: 'Long Short-Term Memory - Conditional Random Field',
    category: '实体抽取',
    type: '序列标注',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v2.1.0',
    status: '已部署',
    owner: '张三',
    createdAt: '2025-06-10 10:00:00',
    updatedAt: '2026-03-15 14:30:00',
    id: 'ALG_LSTM_CRF_001',
    description: '基于长短期记忆网络和条件随机场的序列标注模型，通过LSTM捕捉长距离依赖，结合CRF进行全局最优标注。训练速度快，资源占用低，适合大规模数据处理。',
    intro: {
      summary: 'LSTM-CRF是经典的序列标注模型，在实体抽取任务中表现稳定。模型结构简洁高效，训练和推理速度快。',
      scenarios: [
        '大规模文本处理场景，需要快速训练和推理',
        '计算资源受限的环境',
        '实体类型相对固定的标注任务',
        '需要实时响应的在线服务',
      ],
      inputFormat: 'JSON格式，包含text字段（待标注文本）和可选的entity_types字段（实体类型列表）',
      outputFormat: 'JSON格式，返回entities数组，每个实体包含text、type、start、end、confidence字段',
      performance: {
        f1: '85-88%',
        precision: '86-89%',
        recall: '84-87%',
        speed: '~500 tokens/s',
      },
      notes: [
        '输入文本建议控制在256个token以内以获得最佳效果',
        '需要较多标注数据进行训练（建议5000+样本）',
        '对于新领域数据需要重新训练',
      ],
    },
  },
  'bert-lstm-crf': {
    name: 'BERT-LSTM-CRF',
    englishName: 'BERT - Long Short-Term Memory - Conditional Random Field',
    category: '实体抽取',
    type: '预训练模型',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v2.3.1',
    status: '已部署',
    owner: '李四',
    createdAt: '2025-08-20 09:00:00',
    updatedAt: '2026-04-10 16:00:00',
    id: 'ALG_BERT_LSTM_CRF_001',
    description: '结合BERT预训练语言模型的强大语义理解能力，通过LSTM捕捉序列特征，使用CRF进行全局优化。抽取精度更高，适用于复杂场景和专业领域。',
    intro: {
      summary: 'BERT-LSTM-CRF在LSTM-CRF基础上引入预训练语言模型，显著提升了模型的语义理解能力和抽取精度，是当前实体抽取的主流方案。',
      scenarios: [
        '精度要求较高的专业领域文本处理',
        '科技文献、医疗文本等复杂语义场景',
        '实体边界模糊或嵌套实体识别',
        '少样本学习场景（利用预训练知识）',
      ],
      inputFormat: 'JSON格式，包含text字段、可选的entity_types和max_length字段',
      outputFormat: 'JSON格式，返回entities数组，包含详细的实体信息和置信度',
      performance: {
        f1: '90-93%',
        precision: '91-94%',
        recall: '89-92%',
        speed: '~150 tokens/s',
      },
      notes: [
        '需要GPU支持以获得合理的推理速度',
        '模型体积较大（约400MB），部署时注意存储空间',
        '可通过领域数据微调进一步提升效果',
        '输入长度建议不超过512个token',
      ],
    },
  },
  'llm-entity': {
    name: 'LLM-Based Entity Extraction',
    englishName: 'Large Language Model Based Entity Extraction',
    category: '实体抽取',
    type: '大语言模型',
    algorithmType: 'llm',
    trainable: false,
    version: 'v1.5.0',
    status: '已部署',
    owner: '王五',
    createdAt: '2025-12-01 11:00:00',
    updatedAt: '2026-04-08 10:00:00',
    id: 'ALG_LLM_ENTITY_001',
    description: '基于大语言模型的实体抽取方案，具有强大的零样本和少样本学习能力。支持通过自然语言描述定义实体类型，无需大量标注数据即可快速适配新场景。',
    intro: {
      summary: 'LLM-Based方案利用大语言模型的强大理解和推理能力，通过prompt工程实现实体抽取。最大优势是灵活性高，可快速适应新任务和新实体类型。',
      scenarios: [
        '零样本或少样本场景，标注数据稀缺',
        '实体类型频繁变化的动态场景',
        '需要理解复杂语义和推理的任务',
        '探索性分析和快速原型验证',
      ],
      inputFormat: 'JSON格式，包含text、entity_definitions（实体类型的自然语言描述）和可选的examples字段',
      outputFormat: 'JSON格式，返回entities数组以及抽取理由（reasoning）',
      performance: {
        f1: '92-95%',
        precision: '93-96%',
        recall: '91-94%',
        speed: '~50 tokens/s',
      },
      notes: [
        '推理成本较高，建议用于关键任务或少样本场景',
        '需要精心设计prompt以获得最佳效果',
        '输出格式一致性需要通过few-shot示例保证',
        '建议配置较大的上下文窗口（4k+ tokens）',
      ],
    },
  },
  'cnn-relation': {
    name: 'CNN-based Relation Extraction',
    englishName: 'Convolutional Neural Network based Relation Extraction',
    category: '关系抽取',
    type: '卷积神经网络',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.8.0',
    status: '已部署',
    owner: '赵六',
    createdAt: '2025-07-05 14:00:00',
    updatedAt: '2026-03-20 11:00:00',
    id: 'ALG_CNN_RELATION_001',
    description: '基于卷积神经网络的关系抽取模型，通过卷积操作捕捉实体对之间的局部特征和位置信息，训练效率高，推理速度快。',
    intro: {
      summary: 'CNN-based关系抽取通过卷积层提取局部n-gram特征，结合位置嵌入和实体标记，适合固定关系类型的抽取任务。',
      scenarios: [
        '关系类型相对固定的场景',
        '需要快速训练和部署的项目',
        '中等规模标注数据集',
        '对推理速度有较高要求的应用',
      ],
      inputFormat: 'JSON格式，包含text、entity1、entity2和可选的relation_types字段',
      outputFormat: 'JSON格式，返回relation、confidence和supporting_evidence',
      performance: {
        f1: '82-85%',
        precision: '83-86%',
        recall: '81-84%',
        speed: '~400 tokens/s',
      },
      notes: [
        '对于远距离实体关系识别能力较弱',
        '需要明确的实体边界标注',
        '建议关系类型不超过50种以保证效果',
      ],
    },
  },
  'bert-relation': {
    name: 'BERT-based Relation Extraction',
    englishName: 'BERT based Relation Extraction',
    category: '关系抽取',
    type: '预训练模型',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.5.2',
    status: '已部署',
    owner: '李四',
    createdAt: '2025-09-10 10:00:00',
    updatedAt: '2026-04-05 15:00:00',
    id: 'ALG_BERT_RELATION_001',
    description: '基于BERT的关系抽取模型，利用预训练模型的语义理解能力，对实体对之间的关系进行分类，支持复杂语义和长距离依赖。',
    intro: {
      summary: 'BERT-based关系抽取利用预训练语言模型的上下文表示，通过特殊标记标识实体位置，实现高精度关系分类。',
      scenarios: [
        '复杂语义理解场景',
        '长距离实体关系识别',
        '专业领域知识抽取',
        '需要高精度的关键应用',
      ],
      inputFormat: 'JSON格式，包含text、entity1、entity2和relation_candidates',
      outputFormat: 'JSON格式，返回predicted_relation、confidence和attention_weights',
      performance: {
        f1: '88-91%',
        precision: '89-92%',
        recall: '87-90%',
        speed: '~120 tokens/s',
      },
      notes: [
        '需要GPU资源以获得较好的推理性能',
        '模型参数量较大（约110M），注意存储和内存',
        '可通过领域数据微调获得更好效果',
      ],
    },
  },
  'llm-relation': {
    name: 'LLM-based Relation Extraction',
    englishName: 'Large Language Model based Relation Extraction',
    category: '关系抽取',
    type: '大语言模型',
    algorithmType: 'llm',
    trainable: false,
    version: 'v1.2.0',
    status: '训练中',
    owner: '周八',
    createdAt: '2025-12-10 14:00:00',
    updatedAt: '2026-04-12 11:00:00',
    id: 'ALG_LLM_RELATION_001',
    description: '基于大语言模型的关系抽取，通过自然语言提示实现灵活的关系识别，支持复杂关系推理和少样本学习。',
    intro: {
      summary: 'LLM-based关系抽取通过精心设计的prompt引导大语言模型理解实体间的语义关系，特别适合关系类型动态变化或缺少标注数据的场景。',
      scenarios: [
        '关系类型不固定的探索性分析',
        '少样本或零样本关系抽取',
        '复杂推理和隐含关系识别',
        '跨语言关系抽取',
      ],
      inputFormat: 'JSON格式，包含text、entities、relation_definitions和可选的examples',
      outputFormat: 'JSON格式，返回relations数组，包含subject、predicate、object和reasoning',
      performance: {
        f1: '90-93%',
        precision: '91-94%',
        recall: '89-92%',
        speed: '~40 relations/s',
      },
      notes: [
        '推理成本较高，建议按需使用',
        'Prompt设计对效果影响较大',
        '支持中英文混合文本',
        '可通过few-shot提升一致性',
      ],
    },
  },
  'entity-linking': {
    name: 'Entity Linking',
    englishName: 'Entity Linking Algorithm',
    category: '实体消歧',
    type: '链接算法',
    algorithmType: 'rule-based',
    trainable: false,
    version: 'v3.1.0',
    status: '已部署',
    owner: '钱七',
    createdAt: '2025-05-15 09:00:00',
    updatedAt: '2026-03-28 13:00:00',
    id: 'ALG_ENTITY_LINKING_001',
    description: '实体链接算法，将文本中提到的实体mention链接到知识库中的标准实体，解决实体歧义问题。',
    intro: {
      summary: '实体链接通过候选生成、特征提取和排序三个步骤，将实体mention映射到知识库实体，是知识图谱构建的关键环节。',
      scenarios: [
        '文本实体标准化',
        '知识库对齐和融合',
        '实体消歧和去重',
        '语义搜索和问答系统',
      ],
      inputFormat: 'JSON格式，包含text、mentions和knowledge_base_id',
      outputFormat: 'JSON格式，返回linked_entities，包含kb_id、kb_name和linking_score',
      performance: {
        f1: '87-90%',
        precision: '88-91%',
        recall: '86-89%',
        speed: '~200 entities/s',
      },
      notes: [
        '依赖知识库的完整性和质量',
        '对于新实体可能无法链接',
        '建议结合上下文信息提高准确率',
      ],
    },
  },
  'dependency-graph': {
    name: '依存关系图构建',
    englishName: 'Dependency Graph Construction',
    category: '实体抽取',
    type: '语言学分析',
    algorithmType: 'rule-based',
    trainable: false,
    version: 'v1.2.0',
    status: '已部署',
    owner: '王五',
    createdAt: '2026-01-15 09:00:00',
    updatedAt: '2026-07-10 14:00:00',
    id: 'ALG_DEP_GRAPH_001',
    description: '对指定语料库进行深度语言学分析，将非结构化的自然语言句子转化为结构化的依存关系图谱，是识别实体间深层语法关系的前提。集成语料预处理流水线与交互式依存句法树抽样可视化，支持中文及多语言语料。',
    intro: {
      summary: '依存关系图构建通过对语料库的分句、分词、词性标注和依存句法分析，为每个句子生成以词为节点、以依存弧为边的有向图结构，揭示词语间的支配与依赖关系，为后续实体抽取和关系识别提供深层语法基础。',
      scenarios: [
        '需要捕捉实体间深层语法关系的知识图谱构建任务',
        '基于依存句法的属性值抽取与事件抽取',
        '复杂句型中主谓宾结构的精确识别',
        '多语言（中、英、日）学术文献的结构化分析',
      ],
      inputFormat: 'JSON格式，包含corpus_id（语料库ID或路径）、lang（语言代码，默认zh）和config（分析参数，含分词粒度、词性集等）',
      outputFormat: 'JSON格式，返回sentences数组，每条含tokens（词列表，附词性、位置）和arcs（依存弧列表，含head、dep、label字段）',
      performance: {
        f1: '—',
        precision: 'UAS: 92-95%',
        recall: 'LAS: 89-93%',
        speed: '~3000 句/分钟',
      },
      notes: [
        '长句（>80词）的依存分析精度会有所下降，建议预先进行句子拆分',
        '专业领域语料（如医学、法律）建议使用领域适配的预训练模型',
        '依存弧标签集基于 Universal Dependencies v2 规范',
        '语料预处理产生的中间结果可复用，无需重复运行',
      ],
    },
    features: [
      {
        title: '语料预处理',
        description: '对待处理语料自动执行完整 NLP 预处理流水线，包含：分句（基于规则与统计模型）、分词（支持细粒度/粗粒度切换）、词性标注（PTB / CTB 词性集）及命名实体预标注，所有步骤结果可分层缓存与复用。',
      },
      {
        title: '依存句法分析',
        description: '调用高精度依存解析器（支持 Biaffine Parser / Graph-based Parser）对预处理后的句子序列进行全量解析，输出以"词→词"弧关系为核心的依存树结构，弧标签遵循 UD v2 标准，覆盖主谓、动宾、定中等 30+ 关系类型。',
      },
      {
        title: '结果抽样可视化',
        description: '支持从解析结果中随机抽取句子，以交互式树状图展示其依存句法分析结果：节点为词汇（附词性标签），弧为依存关系（附弧标签），支持悬停高亮依存路径，帮助用户快速验证分析质量。',
      },
      {
        title: '图谱导出',
        description: '将全量依存关系图谱导出为结构化格式（CoNLL-U / JSON），可直接用于下游实体抽取、关系识别规则的编写与调试，或作为模型训练的语言学特征输入。',
      },
    ],
  },
  'temporal-relation-dependency': {
    name: '时序关系依赖',
    englishName: 'Temporal Relation Dependency',
    category: '实体抽取',
    type: '深度学习/时序建模',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '陈晨',
    createdAt: '2026-06-01 10:00:00',
    updatedAt: '2026-08-05 09:00:00',
    id: 'ALG_TEMPORAL_REL_DEP_001',
    description: '对事件或事实之间在时间上的先后、因果等依赖关系进行建模和分析。包含时序关系抽取与时序依赖分析两大子功能，支持从结构化时间戳序列或非结构化文本中发现显式与隐式时序依赖模式，广泛应用于事件链推理、风险预警与知识图谱时序增强。',
    intro: {
      summary: '时序关系依赖算法融合了自然语言理解与时间序列挖掘两条技术路线：时序关系抽取基于预训练语言模型对文本中的时序线索词进行分类标注；时序依赖分析则在大规模事件时间戳日志上运用条件概率建模与关联规则挖掘，输出形如"事件 A → 事件 B（Δt ≤ 3天，P=0.82）"的依赖规则，可直接写入知识图谱或用于下游推理。',
      scenarios: [
        '事件知识图谱中"发生先于"、"导致"等时序边的自动填充',
        '工业设备故障链溯源：挖掘报警事件的时序依赖，辅助根因分析',
        '金融风控：发现交易事件的时序异常模式，提前预警',
        '医疗诊疗路径分析：挖掘检查→诊断→治疗事件链的统计规律',
      ],
      inputFormat: 'JSON 格式，支持两种输入模式：(1) text_mode: 包含 text（原文）和 entities（事件候选列表）；(2) timestamp_mode: 包含 events（事件名称）和 timestamps（ISO 8601 时间戳序列）',
      outputFormat: 'JSON 格式，返回 relations 数组（时序关系抽取结果，每条含 event_a、relation_type、event_b、confidence）和 dependency_patterns 数组（依赖模式，含 antecedent、consequent、delta_t_days、probability）',
      performance: {
        f1: 'F1: 82-87%（时序关系抽取）',
        precision: '精确率: 85-90%',
        recall: '召回率: 78-84%',
        speed: '~500 事件对/秒',
      },
      notes: [
        '时序关系抽取对"之后"、"随后"等隐式表达的识别依赖上下文窗口，建议输入完整句子',
        '时序依赖分析需要至少 500 条事件时间戳记录才能输出可靠的概率估计',
        '模型在中文新闻与工业日志语料上经过微调，其他领域建议使用领域数据进行增量训练',
        'Δt 置信区间由自举采样（Bootstrap）估计，可在配置中调整采样次数',
      ],
    },
    features: [
      {
        title: '时序关系抽取',
        description: '基于 BERT + 分类头，从文本中自动识别事件对之间的显式时序关系，支持 before、after、during、includes、simultaneous、vague 六类标签。输入一段文本与事件候选列表，输出每对事件的时序关系类型及置信度。',
      },
      {
        title: '时序依赖分析',
        description: '通过分析大量事件的时间戳序列，运用 Apriori 关联规则挖掘与条件概率建模，输出形如"事件 A 发生后，事件 B 在 Δt 天内发生的概率为 P"的隐式依赖模式，并提供置信区间和支持度统计。',
      },
      {
        title: '时序图谱增强',
        description: '将抽取的时序关系与依赖模式自动写入知识图谱，为实体节点间添加带时间属性的有向边（如 <事件A, 先于, 事件B, {avg_delta: 2.3天}>），支持增量更新与冲突检测。',
      },
      {
        title: '可视化时序链',
        description: '交互式时序链展示界面，支持按事件类型过滤、按概率阈值筛选依赖模式，并以甘特图或时间轴形式展示事件序列，辅助人工验证发现的时序规律。',
      },
    ],
  },
  'stat-instance-generation': {
    name: '基于统计学习的实例生成',
    englishName: 'Statistical Learning-based Instance Generation',
    category: '知识推理',
    type: '统计学习/SVM',
    algorithmType: 'rule-based',
    trainable: true,
    version: 'v1.2.0',
    status: '已部署',
    owner: '周鑫',
    createdAt: '2026-03-01 09:00:00',
    updatedAt: '2026-07-20 11:00:00',
    id: 'ALG_STAT_INST_GEN_001',
    description: '将实例生成任务看作一个二分类问题，通过训练SVM（支持向量机）分类器来判断某个实体是否属于目标概念的实例。用户只需提供少量正负样本，系统即可完成特征工程、模型训练，并对海量候选实体进行批量预测与置信度筛选，无需深度学习基础设施。',
    intro: {
      summary: '基于统计学习的实例生成以SVM为核心分类器，利用实体的上下文特征（TF-IDF、词性分布、共现统计、词典匹配得分）构建特征向量，在少量正负样本下完成有监督训练。相较于神经网络方法，SVM在小样本场景下泛化能力更强、训练速度更快、结果可解释性更好，适合对标注资源受限但需要高精度实例发现的任务。',
      scenarios: [
        '小样本场景下的领域概念实例快速发现（正负样本各10~30条）',
        '本体扩充：向已有知识图谱中的概念节点批量补充实例',
        '候选实体集合的精排过滤，配合上游无监督候选生成算法使用',
        '需要可解释预测结果的场景，支持查看决策边界与支持向量',
      ],
      inputFormat: 'JSON格式，包含concept（目标概念名称）、positive_samples（正例实体列表）、negative_samples（负例实体列表）和candidates（待预测候选实体列表）',
      outputFormat: 'JSON格式，返回predictions数组，每条包含entity（实体名）、is_instance（布尔值）、confidence（置信度0-1）、feature_vector（特征值摘要）和support_vector（是否为支持向量）字段',
      performance: {
        f1: '85-91%',
        precision: '87-93%',
        recall: '83-89%',
        speed: '~5万实体/分钟（推理）',
      },
      notes: [
        '正负样本比例建议控制在1:1~1:3之间，过度不均衡会影响决策边界质量',
        '核函数默认使用RBF（径向基函数），对非线性可分数据效果更好',
        '置信度由SVM的决策函数距离经Platt缩放转换得到，具有概率意义',
        '建议正例样本数不少于10条，低于此数量时模型泛化能力较弱',
      ],
    },
    features: [
      {
        title: '分类模型训练',
        description: '用户提供目标概念的少量正例实体（如"深度学习"的实例：BERT、GPT、ResNet）和负例实体（如与概念无关的实体），系统自动抽取多维特征（上下文TF-IDF、共现频率、词性分布、词典匹配分）并训练SVM分类器，支持RBF/线性/多项式三种核函数选择和超参数C/gamma调优，训练完成后输出模型性能报告与支持向量统计。',
      },
      {
        title: '批量实例预测',
        description: '利用训练好的SVM模型，对海量候选实体（支持从语料库自动抽取或手动上传列表）进行大规模批量推理，异步任务模式支持百万级候选实体处理，实时展示预测进度，结果按置信度降序排列并支持分页浏览。',
      },
      {
        title: '置信度评估与筛选',
        description: '通过Platt缩放将SVM决策函数值转换为概率置信度（0~1），为每个预测结果附加置信度分数。提供交互式阈值滑块，用户可实时预览不同阈值下的保留数量与估算精度，系统自动输出置信度分布直方图和精度-召回率权衡曲线，帮助用户找到最优筛选阈值。',
      },
    ],
  },
  'event-recognition-engine': {
    name: '事件识别引擎接口',
    englishName: 'Event Recognition Engine Interface',
    category: '知识推理',
    type: '深度学习/主动学习',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v2.0.0',
    status: '已部署',
    owner: '刘畅',
    createdAt: '2026-02-20 09:00:00',
    updatedAt: '2026-08-01 14:00:00',
    id: 'ALG_EVT_REC_ENG_001',
    description: '提供一套先进的、可组合的事件识别算法模型，以适应不同场景下的事件抽取需求。引擎将事件触发词检测、论元角色标注与事件分类解耦为独立可插拔模块，支持全监督、半监督与少样本三种训练范式，内置局部学习标注器（Local Learning Annotator）可在缺乏大量标注数据的情况下快速构建可用的事件识别能力。',
    intro: {
      summary: '事件识别引擎接口以模块化架构将事件识别流程拆解为可独立配置的子模块，用户可按需组合触发词检测器、论元抽取器与事件分类器，并通过统一接口调用。核心亮点是内置的局部学习标注器——利用局部特征（词性、句法路径、词典匹配）在极少量标注样本（20~50条）下完成自举，使零资源冷启动成为可能。',
      scenarios: [
        '标注资源极度匮乏的新兴领域，需快速冷启动事件识别能力',
        '多类型事件并存的复杂文本（新闻、科技报告、医疗记录）',
        '需要持续迭代优化的生产系统，兼顾冷启动与精度提升',
        '与知识图谱事件节点构建流水线集成，实现自动化事件填充',
      ],
      inputFormat: 'JSON格式，包含text（原始文本）、event_schema（事件模式定义：事件类型及论元角色列表）和mode（"full"全监督/"local"局部学习/"zeroshot"零样本）',
      outputFormat: 'JSON格式，返回events数组，每条包含event_type、trigger（触发词及位置）、arguments（论元角色→实体映射）、confidence和mode字段',
      performance: {
        f1: '全监督模式: 85-89%',
        precision: '局部学习模式: 72-81%',
        recall: '零样本模式: 63-74%',
        speed: '~2000 句/分钟',
      },
      notes: [
        '局部学习标注器在20~50条标注样本下即可达到基本可用水平，建议冷启动后持续补充标注',
        '事件模式（Event Schema）设计质量对识别精度影响显著，建议结合领域专家完成定义',
        '全监督模式需每类事件至少200条标注样本，推荐使用局部学习模式作为数据积累期的过渡方案',
        '引擎接口兼容ACE/MAVEN/DuEE等主流事件数据集格式，支持直接迁移',
      ],
    },
    features: [
      {
        title: '局部学习标注器',
        description: '在缺乏大量标注数据的情况下，通过局部特征（词性模板、依存路径、领域词典匹配）进行自举，以20~50条人工标注样本为种子快速构建初版事件标注器。支持增量学习：每新增一批标注后自动更新局部模型，无需重新训练全量参数，标注效率高、迭代成本低。',
      },
      {
        title: '可组合事件识别模块',
        description: '将事件识别解耦为触发词检测（Trigger Detection）、论元角色标注（Argument Role Labeling）与事件类型分类（Event Classification）三个独立模块，每个模块可独立选择算法实现（规则/深度学习/大模型）并自由组合，通过统一引擎接口对外透出，便于针对特定场景调优单一模块而不影响其他部分。',
      },
    ],
  },
  'instance-matching': {
    name: '实例匹配',
    englishName: 'Instance Matching',
    category: '知识推理',
    type: '多策略融合',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v2.0.0',
    status: '已部署',
    owner: '陈宇',
    createdAt: '2026-05-10 09:00:00',
    updatedAt: '2026-08-03 10:00:00',
    id: 'ALG_INST_MATCH_001',
    description: '提供文本、结构、机器学习与多策略融合四种实例匹配策略，通过API中的 match_methods 字段灵活选择一种或多种匹配方式，判断跨知识图谱中的实体对是否指向同一真实世界对象，支持大规模批量匹配与交互式审核。',
    intro: {
      summary: '实例匹配（Instance Matching / Entity Alignment）旨在识别不同知识图谱中表示同一真实对象的实体对。本算法提供四种策略：文本匹配（字符串+向量）、结构匹配（邻居节点+关系路径）、机器学习匹配（多特征二分类器）、多策略融合（加权投票）。通过 API 的 match_methods 字段按需选择策略，兼顾精度与效率。',
      scenarios: [
        '跨图谱知识融合：将多源图谱中的同名或近名实体统一为单一权威节点',
        '知识补全：将外部百科实体与本地图谱实体对齐，自动补充缺失属性',
        '数据清洗：识别并合并图谱内部的重复实体（deduplication）',
        '实体链接前处理：为下游 EL 系统提供高召回的候选实体对',
      ],
      inputFormat: 'JSON格式，包含 entity_pairs（待匹配实体对列表，每对含 source_id/source_text/source_neighbors 与 target_id/target_text/target_neighbors）和 match_methods（选择列表：["text","structure","ml","fusion"]）',
      outputFormat: 'JSON格式，每对实体返回 is_match（布尔）、confidence（0-1）、strategy_scores（各策略得分明细）和 evidence（匹配依据片段）',
      performance: {
        f1: '多策略融合: 88-92%',
        precision: '文本匹配: 83-88%',
        recall: '结构匹配: 80-86%',
        speed: '~2万实体对/分钟（批量）',
      },
      notes: [
        'match_methods 推荐优先使用 "fusion"，在高精度场景可单独开启 "ml"',
        '文本向量相似度依赖预训练模型，冷启动时字符串相似度可独立运行',
        '结构匹配要求两个图谱有一定公共节点作为锚点（至少5个已知匹配对）',
        '机器学习模式需提供至少30对标注样本（正负各半），建议正负比1:2',
      ],
    },
    features: [
      {
        title: '文本实例匹配',
        description: '基于实例的文本类属性进行匹配。字符串相似度匹配利用 Levenshtein 编辑距离、Jaccard 集合重叠、N-gram 余弦等算法评估两个实例名称/描述的字面相似性；文本向量相似度匹配将实体文本经预训练语言模型编码为稠密向量，通过余弦相似度捕捉语义层面的等价关系，对别名、缩写、翻译等变体具有较强鲁棒性。',
      },
      {
        title: '结构实例匹配',
        description: '利用实例在各自知识图谱中的关联关系网络进行匹配。邻居节点相似性分析通过比较两个实例一阶/二阶邻居节点的重合度与相似性来推断实体对的等价概率；关系路径模式匹配则提取连接候选实体对的关系路径序列（如 A→工作于→机构→位于→城市），通过路径模式的一致性判断匹配可能性，对文本属性稀疏的实体尤为有效。',
      },
      {
        title: '机器学习实例匹配',
        description: '利用监督或半监督学习模型综合多维特征做出匹配判断。特征工程模块自动从实体对中抽取文本相似度、结构重叠度、数值属性差值、关系类型共现等特征向量；用户上传少量标注样本后，系统训练二元分类器（默认 XGBoost）并输出在留出验证集上的精度/召回/F1报告，支持特征重要性可视化以解释模型决策。',
      },
      {
        title: '多策略融合匹配',
        description: '将文本、结构、机器学习等多种策略的匹配结果进行加权融合。策略权重配置允许用户为不同策略分配权重（总和为1），权重可根据领域特性手动调节或由历史标注数据自动学习；结果投票与排序对各策略输出的置信度分数进行加权平均或 Borda 排名投票，给出最终匹配决策与综合置信度，并支持按阈值过滤和人工复核队列导出。',
      },
    ],
  },
  'rule-extension': {
    name: '规则扩展',
    englishName: 'Rule Extension',
    category: '知识推理',
    type: '规则/内置',
    algorithmType: 'rule',
    trainable: false,
    version: 'v1.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_RULE_EXT_001',
    description: '对已发现的规则进行泛化或特化，以探索更深层次的规律。规则泛化基于本体层级将规则中的具体实体向上推广至父类，生成覆盖范围更广的通用规则；规则特化将类别向下推至子类或增加额外约束条件，生成适用范围更窄但精确度更高的规则。',
    intro: {
      overview: '规则扩展是知识推理流水线中的规则优化环节，依赖预先构建的本体层级（概念树）对初始挖掘规则进行系统性改写。泛化操作沿本体向上遍历，每上升一层即生成一条更通用的规则变体，覆盖范围扩大 1.8–5 倍；特化操作沿本体向下钻取，或附加谓词-值约束，使规则在特定子群上的置信度提升 5–15 个百分点，但支持数相应减少 55–62%。两类操作均支持交互式探索，结果可一键注入规则库。',
      features: [
        {
          title: '规则泛化',
          description: '基于本体的层级关系，将规则条件中的具体实体类型（如"博士生"、"顶尖高校"）逐层向上推广至其父类（如"学生"→"人物"），自动生成多层泛化变体。每条变体保留置信度与支持数估算，辅助用户权衡通用性与准确性。',
        },
        {
          title: '规则特化',
          description: '将规则条件中的抽象类别下推至更具体的子类（如"大学"→"顶尖高校"），或在条件列表中追加额外谓词约束（如"引用量 ≥ 50"、"排名 Top-100"），生成在特定细分场景下置信度更高的精确规则。支持手动录入自定义约束条件。',
        },
      ],
      performance: {
        metrics: [
          { name: '泛化后覆盖率提升', value: '1.8–5×', trend: 'up' },
          { name: '特化后置信度提升', value: '+5–15%', trend: 'up' },
          { name: '特化后支持数保留', value: '38–45%', trend: 'stable' },
          { name: '单次扩展延迟', value: '< 200ms', trend: 'stable' },
        ],
        description: '覆盖率和置信度基于 FB15k-237 知识图谱规则库的实验统计，实际效果因本体深度与规则结构而异。',
      },
    },
  },
  'adversarial-transfer': {
    name: '基于对抗迁移学习的知识图谱补全',
    englishName: 'Adversarial Transfer Learning for KG Completion',
    category: '知识推理',
    type: '深度学习',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '知识推理团队',
    createdAt: '2026-08-04 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_ADV_TRANS_001',
    description: '利用对抗迁移学习技术，将数据丰富领域（如通用百科知识图谱）已习得的实体与关系表示知识，迁移到数据稀疏的目标领域（如生物医疗、金融），通过梯度反转层、领域判别器等对抗机制学习领域不变的特征，从而显著提升目标域知识图谱补全的整体性能。',
    intro: {
      overview: '知识图谱补全旨在预测图谱中缺失的三元组，但目标领域数据稀疏导致模型泛化能力差。本算法引入对抗迁移学习框架：在源域充分预训练嵌入表示后，通过梯度反转层迫使编码器学习领域不变特征，同时独立的领域判别器提供对抗信号；MMD 特征对齐进一步软性约束两域分布差异。三种策略可组合启用，在目标域仅需少量数据即可达到 Hits@10 = 0.91 的优秀性能。',
      features: [
        {
          title: '跨领域知识迁移',
          description: '支持从多个数据丰富源域（FB15k-237、WN18RR、YAGO3-10、NELL-995）迁移至数据稀疏目标域。用户可在界面选择源域与目标域，调整对抗损失权重（λ₁）、特征对齐权重（λ₂）和嵌入维度，并自由组合梯度反转层、领域判别器、MMD 对齐三种对抗策略，实时监控训练曲线（源域损失、对抗损失、目标域 Hits@10）。',
        },
        {
          title: '知识补全任务配置',
          description: '训练完成后，用户可通过任务配置界面发起补全任务：指定任务名称、使用已训练的迁移模型、选择目标关系类型子集、设定补全方向（预测头/尾/双向）、Top-K 候选数（3/5/10/20）及置信度阈值。提交后展示预估新增三元组数、平均置信度与预计耗时，支持导出补全结果。',
        },
      ],
      metrics: [
        { name: 'Hits@10（目标域）', value: '0.91', trend: 'up' },
        { name: 'MRR（目标域）', value: '0.62', trend: 'up' },
        { name: 'Hits@1（目标域）', value: '0.51', trend: 'up' },
        { name: '相对无迁移提升', value: '+43%', trend: 'up' },
      ],
      description: '评估基于目标域测试集（保留 20% 三元组），与无迁移（仅目标域训练）和直接迁移（无对抗对齐）方法对比。',
    },
  },
  'cross-lingual-alignment': {
    name: '跨语言知识库生成与对齐',
    englishName: 'Cross-lingual Knowledge Base Generation and Alignment',
    category: '知识推理',
    type: '深度学习',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '知识推理团队',
    createdAt: '2026-08-05 00:00:00',
    updatedAt: '2026-08-05 10:00:00',
    id: 'ALG_CROSS_LINGUAL_001',
    description: '提供工具和流程批量处理并对齐整个跨语言知识库，支持中英日韩等多语言实体与关系的大规模对齐任务管理，将对齐结果持久化存储，形成逻辑上统一的多语言知识库。通过翻译增强、跨语言嵌入空间对齐与结构相似度融合三种策略实现高精度跨语言对齐。',
    intro: {
      overview: '跨语言知识库对齐旨在发现不同语言知识库中指向同一真实世界对象的实体对，从而构建统一的多语言知识库。系统支持中文、英文、日文、韩文、法文、德文等主流语言，提供批量任务调度、进度监控与对齐结果持久化存储全流程工具链。',
      features: [
        {
          title: '批量对齐任务管理',
          description: '支持创建大规模跨语言对齐任务，可配置源语言知识库、目标语言知识库、对齐策略（翻译增强 / 嵌入空间对齐 / 结构融合 / 混合策略）、置信度阈值与批次大小。任务提交后后台异步执行，实时展示任务进度、已处理实体数、初步对齐率等运行指标，支持暂停、恢复与取消。',
        },
        {
          title: '对齐结果持久化存储',
          description: '将生成的跨语言对齐关系（等价关系 sameAs、近似对应 closeMatch、宽泛对应 relatedMatch）持久化写入对齐结果库，记录对齐置信度、来源任务、验证状态等元数据，支持按语言对、置信度、对齐类型多维检索，并提供导出为 N-Triples / CSV / JSON-LD 等格式的接口。',
        },
      ],
      metrics: [
        { name: 'Hits@1', value: '0.76', trend: 'up' },
        { name: 'Hits@10', value: '0.94', trend: 'up' },
        { name: 'MRR', value: '0.83', trend: 'up' },
        { name: '处理速度', value: '12k 实体对/分钟', trend: 'stable' },
      ],
      description: '评估基于 DBpedia 中英跨语言对齐测试集，混合策略下的性能表现。',
    },
  },
  'scoring-function': {
    name: '打分函数',
    englishName: 'Knowledge Graph Scoring Functions',
    category: '知识推理',
    type: '规则/内置',
    algorithmType: 'rule',
    trainable: false,
    version: 'v1.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-06-01 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_SCORE_FN_001',
    description: '提供多种用于衡量三元组 (h, r, t) 合理性的核心评分函数，覆盖基于距离与基于语义相似度两大类方案，并内置可视化解释工具，帮助用户直观理解不同打分函数的计算逻辑与得分差异。',
    intro: {
      overview: '打分函数（Scoring Function）是知识图谱嵌入模型的核心组件，用于为每个候选三元组 (h, r, t) 计算一个合理性得分。高质量的打分函数能够有效区分真实三元组与负样本三元组，是链接预测、关系推理等任务的基础。系统内置两大类打分函数，并提供可视化解释能力。',
      features: [
        {
          title: '基于距离的打分函数',
          description: '通过计算头实体经关系变换后与尾实体之间的向量距离来评估三元组合理性。TransE 采用 L1/L2 范数，得分越低表示三元组越合理；RotatE 在复数空间中将关系建模为旋转，兼顾对称、反对称、逆向等模式。',
        },
        {
          title: '基于语义相似度的打分函数',
          description: '通过向量内积或双线性运算衡量实体与关系向量之间的语义匹配度。DistMult 使用逐元素乘积后求和；ComplEx 将向量扩展至复数域以建模非对称关系；RESCAL 使用全矩阵捕捉丰富的关系交互。',
        },
        {
          title: '打分函数可视化解释',
          description: '提供交互式辅助工具，输入任意三元组后可同时计算多个打分函数的得分，并以雷达图、条形图、向量投影图等形式可视化解释各函数的得分原理与排名差异，辅助用户选择最适合的模型。',
        },
      ],
      performance: {
        metrics: [
          { name: 'TransE MRR (FB15k-237)', value: '0.347', trend: 'stable' },
          { name: 'RotatE MRR (FB15k-237)', value: '0.338', trend: 'stable' },
          { name: 'DistMult MRR (FB15k-237)', value: '0.241', trend: 'stable' },
          { name: 'ComplEx MRR (FB15k-237)', value: '0.247', trend: 'stable' },
        ],
        description: '以上指标在 FB15k-237 测试集上评估，均采用标准过滤设置（Filtered MRR）。',
      },
    },
  },
  'supervised-similarity': {
    name: '基于监督学习的相似度计算',
    englishName: 'Supervised Learning-based Similarity Computation',
    category: '知识推理',
    type: '监督学习',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '林晓',
    createdAt: '2026-07-01 09:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_SUP_SIM_001',
    description: '通过提供一批已标注的"相似"与"不相似"实体对，训练一个专门的、高精度的相似度计算模型。内置全流程工具链：标注工具支持对实体对逐一进行相似/不相似标注并管理样本集；训练模块基于标注数据训练孪生网络或度量学习模型；评估发布模块对模型进行全面性能评估并一键发布为可调用的相似度服务，适用于实体对齐、知识融合等高精度场景。',
    intro: {
      summary: '本算法将相似度计算转化为有监督的度量学习问题。用户通过内置标注工具构建相似/不相似实体对样本集，系统基于孪生网络（Siamese Network）或对比学习框架训练专用相似度模型，将通用预训练向量调整为适合当前领域的相似度判断器。与无监督方法相比，监督相似度模型在同领域场景下 AUC 可提升 8–15 个百分点。',
      scenarios: [
        '跨图谱实体对齐：为来自不同来源的同义实体打标，训练对齐模型',
        '知识融合去重：标注已知的重复实体对，训练领域定制去重服务',
        '候选排序优化：在实例匹配后对候选实体对进行精排打分',
        '低资源领域：仅需少量标注（约100对），即可超越通用相似度方法',
      ],
      inputFormat: 'JSON格式，包含 pairs（实体对列表，每对含 entity_a、entity_b 及可选的 features 字段）和 model_id（已发布的相似度模型ID）',
      outputFormat: 'JSON格式，返回每对实体的 similarity_score（0–1浮点数）、is_similar（按阈值的布尔判断）和 confidence 字段',
      performance: {
        f1: '91–95%',
        precision: 'AUC: 0.94–0.97',
        recall: 'Precision@0.9: 92%',
        speed: '~5000 实体对/秒',
      },
      notes: [
        '建议每类至少标注50对样本（相似/不相似各半），总量达200对可获得稳定效果',
        '标注时注意保持正负样本比例均衡，过度不均衡会导致模型偏置',
        '支持主动学习模式：优先对模型不确定的样本进行人工标注，加速收敛',
        '模型发布后可通过持续标注新样本进行在线增量更新',
      ],
    },
    features: [
      {
        title: '相似度样本标注工具',
        description: '提供结构化的实体对标注界面，支持快捷键操作（S=相似、D=不相似、Space=跳过）。内置不确定样本优先推送（基于模型不确定度的主动学习策略）、标注进度跟踪、标注结果审核与修正功能，以及样本集的导入/导出管理。',
      },
      {
        title: '相似度模型训练',
        description: '基于标注样本集，从孪生网络（BERT双塔）、对比学习（SimCSE）、交叉编码器（Cross-encoder）三种架构中选择，配置学习率、批大小、训练轮数等超参数后一键启动训练。支持训练过程实时监控（Loss/AUC曲线）与早停策略。',
      },
      {
        title: '模型评估与发布',
        description: '训练完成后自动在留出测试集上计算AUC、F1、Precision、Recall及混淆矩阵。提供阈值调节工具，可视化不同阈值下精度/召回权衡曲线（PR曲线）。确认指标达标后一键将模型发布为REST API服务，并自动生成调用文档与SDK代码片段。',
      },
    ],
  },
  'rl-denoising': {
    name: '基于强化学习的降噪模型',
    englishName: 'Reinforcement Learning-based Denoising Model',
    category: '知识推理',
    type: '强化学习/降噪',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.1.0',
    status: '已部署',
    owner: '赵磊',
    createdAt: '2026-05-12 09:00:00',
    updatedAt: '2026-07-28 10:00:00',
    id: 'ALG_RL_DENOISE_001',
    description: '利用强化学习训练一个降噪策略网络，自动识别并过滤那些在文本上存在关联但实际上没有真实语义关系的噪声句子。系统将关系抽取模型在验证集上的F1变化作为奖励信号，引导策略网络持续学习"什么样的句子是高质量的正例"，从根本上提升训练数据质量，进而提升关系抽取模型的精度。',
    intro: {
      summary: '基于强化学习的降噪模型以策略梯度优化为核心，将远程监督自动标注产生的噪声数据清洗问题建模为马尔可夫决策过程（MDP）。策略网络对每条句子输出保留/丢弃决策，下游关系抽取模型在清洗后数据上的性能提升作为奖励反馈，使策略网络与抽取模型在交替训练中协同优化。',
      scenarios: [
        '远程监督数据集中含大量噪声句子，直接训练关系抽取精度受限的场景',
        '知识图谱补全任务中对已有三元组进行支持句验证与质量评级',
        '构建高质量关系抽取训练集，降低人工标注成本',
        '与事件关系抽取流水线结合，提升事件论元的句子证据质量',
      ],
      inputFormat: 'JSON格式，包含sentences（候选句子列表，每条含sentence_id、text、entity_pair和distant_label字段）和relation_type（目标关系类型）',
      outputFormat: 'JSON格式，返回filtered_sentences（过滤后保留的句子列表，含quality_score质量分）和noise_rate（过滤比例）、f1_gain（预估F1增益）字段',
      performance: {
        f1: 'F1提升: +6-11%（相比无降噪基线）',
        precision: '噪声识别精度: 88-93%',
        recall: '真实正例保留率: 85-91%',
        speed: '~3万句/分钟（批量评分）',
      },
      notes: [
        '策略网络收敛依赖充足的奖励信号，建议验证集规模不低于500条三元组',
        '与远程监督数据结合使用效果最佳；若原始标注质量较高，降噪收益相对有限',
        '降噪比例过高（>60%）可能损失真实正例，建议从阈值0.5开始调参',
        '支持与实体消歧模块串联，先消歧再降噪可进一步提升效果',
      ],
    },
    features: [
      {
        title: '噪声句子识别',
        description: '策略网络综合句子与实体对的语义匹配度、句法特征（依存路径、实体间距）和词汇线索（触发词词典、否定词检测）为每条候选句子生成保留概率，自动剔除远程监督错误标注和偶发共现的噪声句子，噪声识别准确率达88-93%。',
      },
      {
        title: '强化学习策略优化',
        description: '采用策略梯度（REINFORCE）算法，以关系抽取模型在清洗后数据上验证集F1的变化量为奖励，交替训练降噪策略网络与关系抽取模型。策略网络持续学习"保留哪些句子能最大化下游任务收益"，实现降噪与抽取的协同优化，相比启发式过滤方法F1提升6-11%。',
      },
      {
        title: '质量分数与可解释过滤',
        description: '为每条句子输出质量分数（0~1），并提供句子级别的特征贡献分析，标注哪些词汇或句法结构触发了降噪决策。用户可设定质量分数阈值或按比例保留Top-K句子，系统实时展示过滤前后的数据规模、噪声率和预估F1增益，支持精细化数据治理。',
      },
    ],
  },
  'event-relation-extraction': {
    name: '事件关系提取接口',
    englishName: 'Event Relation Extraction Interface',
    category: '知识推理',
    type: '深度学习/关系抽取',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.3.0',
    status: '已部署',
    owner: '林晓东',
    createdAt: '2026-04-25 09:00:00',
    updatedAt: '2026-08-02 09:00:00',
    id: 'ALG_EVT_REL_EXT_001',
    description: '将事件关系抽取能力封装为标准化API服务，提供统一的调用接口与模型管理工具。输入包含事件或实体的文本，系统自动识别文本中的事件/实体对，并返回它们之间可能存在的关系类型与置信度分数，支持批量调用与实时流式返回，内置模型版本管理与A/B测试能力。',
    intro: {
      summary: '事件关系提取接口基于预训练语言模型（BERT/RoBERTa）的关系分类范式，将"事件-事件"和"事件-实体"关系检测统一为句子级别的分类任务。接口层提供标准REST API与批量异步调用，支持跨句关系（滑动窗口上下文融合）和关系链推理（多跳关系传播），适合与知识图谱事件节点构建流水线深度集成。',
      scenarios: [
        '知识图谱中事件节点之间因果、时序、共指关系的自动填充',
        '新闻/财报/科技文献中事件链路的自动梳理与可视化',
        '下游问答系统的证据链构建，识别事件关系支撑推理路径',
        '与事件识别引擎串联，形成"事件发现→关系推断"完整流水线',
      ],
      inputFormat: 'JSON格式，包含text（文本）、events（可选：预标注事件/实体列表）和relation_schema（目标关系类型列表，不传则使用默认图谱模式）',
      outputFormat: 'JSON格式，返回relations数组，每条包含subject（主体事件/实体）、relation（关系类型）、object（客体事件/实体）、confidence（置信度）、evidence_span（证据文本片段）字段',
      performance: {
        f1: '78-85%（标准关系分类）',
        precision: '跨句关系: 71-79%',
        recall: '吞吐量: ~3000 请求/分钟',
        speed: '单条延迟: <50ms（P99）',
      },
      notes: [
        '关系模式（relation_schema）建议与知识图谱本体保持一致，避免语义漂移',
        '跨句关系抽取依赖上下文窗口（默认3句），可调整window_size参数平衡精度与效率',
        '置信度阈值建议设为0.65以上，低于此值的关系准确率明显下降',
        '批量调用建议每批不超过200条文本，超过此限制时自动拆分为异步任务',
      ],
    },
    features: [
      {
        title: 'API接口服务',
        description: '提供标准REST API（POST /api/v1/event-relation/extract），支持单条实时调用（<50ms P99延迟）和批量异步调用（百万条级，Webhook回调）两种模式。接口遵循OpenAPI 3.0规范，提供SDK（Python/Java/Go），内置限流、鉴权与调用日志，支持私有化部署与公有云托管两种部署形态。',
      },
      {
        title: '关系类型识别与置信度评分',
        description: '基于BERT双向编码器对事件/实体对的上下文进行联合编码，输出多标签关系分类概率分布。支持因果（cause-effect）、时序（before/after）、共指（coreference）、上下位（hypernym）等20+标准关系类型，每条结果附带证据文本片段（evidence_span）和置信度分数，便于人工审核与下游筛选。',
      },
      {
        title: '模型管理工具',
        description: '提供可视化模型管理面板，支持多版本模型在线切换、A/B测试流量分配（灰度比例可配置）和自定义关系类型微调（Fine-tune）。内置调用统计（QPS、P50/P99延迟、错误率）和模型效果监控（准确率漂移告警），支持一键回滚至历史版本，保障生产环境稳定性。',
      },
    ],
  },
  'rl-sentence-selector': {
    name: '基于强化学习的句子选择器',
    englishName: 'Reinforcement Learning-based Sentence Selector',
    category: '实体抽取',
    type: '强化学习/主动学习',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.1.0',
    status: '已部署',
    owner: '陈建国',
    createdAt: '2026-04-10 09:00:00',
    updatedAt: '2026-07-28 15:00:00',
    id: 'ALG_RL_SENT_SEL_001',
    description: '利用强化学习技术，智能地从未标注的文本中挑选出最有价值的句子供人工标注。系统将标注员的标注行为和模型性能提升作为奖励信号，训练选择策略，使每一条标注数据的边际收益最大化，显著降低达到目标精度所需的标注成本。',
    intro: {
      summary: '基于强化学习的句子选择器将主动学习（Active Learning）与强化学习（Reinforcement Learning）相结合，以策略网络替代传统的不确定性采样启发式规则，动态学习"哪类句子标注后对模型提升最大"。与随机采样相比，在相同标注预算下可使实体抽取模型的F1提升10-15个百分点。',
      scenarios: [
        '标注预算有限、需以最少人工成本达到目标精度的项目',
        '领域语料规模庞大（百万句级）但标注资源稀缺的场景',
        '迭代式模型优化：已有初始模型，需持续以少量标注提升效果',
        '冷启动阶段后的精标注阶段，与种子术语生成算法配合使用',
      ],
      inputFormat: 'JSON格式，包含corpus_id（未标注语料库ID）、model_id（当前实体抽取模型ID）、budget（本轮标注句数上限）和可选的policy_checkpoint（RL策略检查点路径）',
      outputFormat: 'JSON格式，返回selected_sentences数组，每条包含sentence_id、text、predicted_entities（当前模型预测）、selection_score（选择价值分）和uncertainty（模型不确定度）字段',
      performance: {
        f1: '等效标注量节省: 40-55%',
        precision: '选句准确率: 82-88%',
        recall: '高价值句覆盖率: 79-85%',
        speed: '~1万句/秒（推理）',
      },
      notes: [
        '冷启动阶段（<500句标注）建议先用随机采样，策略网络无法有效训练',
        'RL策略每轮标注结束后更新，建议每批次不少于50句以保证奖励信号稳定',
        '选择器与下游实体抽取模型强耦合，切换模型架构需重新训练策略',
        '人工标注质量直接影响奖励信号，建议配合标注质量控制模块使用',
      ],
    },
    features: [
      {
        title: 'RL策略训练与管理',
        description: '以当前实体抽取模型的验证集F1提升量作为奖励，训练策略网络（Policy Network）学习句子选择的最优策略。支持策略版本管理、奖励曲线可视化与策略回滚，提供PPO与A2C两种训练算法供选择。',
      },
      {
        title: '候选句子打分与排序',
        description: '对未标注语料库中的句子进行批量推理，融合模型不确定度（Uncertainty）、实体密度（Entity Density）、句子多样性（Diversity）和RL策略分（Policy Score）四个维度，输出综合价值排序，供标注员优先处理高价值句子。',
      },
    ],
  },
  'term-event-rough': {
    name: '术语/事件粗提取',
    englishName: 'Term / Event Rough Extraction',
    category: '实体抽取',
    type: '规则/语言学',
    algorithmType: 'rule-based',
    trainable: false,
    version: 'v1.0.0',
    status: '已部署',
    owner: '王明',
    createdAt: '2026-06-15 09:00:00',
    updatedAt: '2026-08-01 10:00:00',
    id: 'ALG_TERM_EVENT_ROUGH_001',
    description: '利用依存句法分析等NLP技术，从文本中自动、快速地抽取出事件的关键元素，形成结构化的事件半成品。适合作为精细事件抽取的前置步骤，或用于大规模语料的初步事件挖掘。',
    intro: {
      summary: '术语/事件粗提取通过依存句法分析，自动识别文本中的事件触发词（动词/名词），并围绕触发词抽取核心论元（主语/参与者、宾语/承受者、时间状语、地点状语），输出结构化的事件半成品，为后续精细化处理提供高覆盖率的候选事件集合。',
      scenarios: [
        '大规模语料的快速事件初筛，减少后续精细抽取的处理量',
        '领域知识图谱中事件节点的批量预填充',
        '新闻、科技文献、专利中事件线索的自动发现',
        '与精细事件抽取模型配合，构建完整的事件抽取流水线',
      ],
      inputFormat: 'JSON格式，包含text（待处理文本）、lang（语言，默认zh）和可选的trigger_pos_filter（触发词词性过滤，默认["VV","NN"]）',
      outputFormat: 'JSON格式，返回events数组，每条包含trigger（触发词）、trigger_pos（词性）、agent（参与者，可为空）、patient（承受者，可为空）、time（时间，可为空）、location（地点，可为空）和sentence_id字段',
      performance: {
        f1: '触发词识别: 78-83%',
        precision: '论元精确率: 72-79%',
        recall: '论元召回率: 68-75%',
        speed: '~5000 句/分钟',
      },
      notes: [
        '粗提取侧重高召回率，会产生一定噪声，建议配合后置过滤或精细抽取模块',
        '依赖上游依存句法分析质量，专业领域语料建议使用领域适配的解析器',
        '复杂嵌套句型（如多重从句）的论元抽取准确率会有所下降',
        '输出为"事件半成品"，需人工审核或下游模型进一步验证',
      ],
    },
    features: [
      {
        title: '事件触发词识别',
        description: '自动扫描依存树中的词节点，根据词性标签（VV动词、NN名词）和语义规则，识别能够触发事件的核心词汇，并标注其词性、位置和语义类别。支持自定义触发词词性白名单与关键词过滤规则。',
      },
      {
        title: '事件论元抽取',
        description: '围绕识别出的触发词，通过依存弧路径（nsubj、dobj、obl、tmod、loc等）自动抽取事件的核心论元：参与者（主语/Agent）、承受者（宾语/Patient）、发生时间（时间状语）和发生地点（地点状语），形成结构化的论元框架。',
      },
    ],
  },
  'seed-term-generation': {
    name: '种子术语生成算法',
    englishName: 'Seed Term Generation Algorithm',
    category: '实体抽取',
    type: '无监督/规则',
    algorithmType: 'rule-based',
    trainable: false,
    version: 'v1.0.0',
    status: '已部署',
    owner: '刘九',
    createdAt: '2026-04-01 09:00:00',
    updatedAt: '2026-05-20 10:00:00',
    id: 'ALG_SEED_TERM_001',
    description: '种子术语生成作为概念抽取的起点，支持从海量、嘈杂的领域语料中，快速、准确地识别出一批核心的、高质量的种子术语。集成语料接入、外部词典导入、无监督算法发现与人工审核全流程能力。',
    intro: {
      summary: '种子术语生成通过多源语料接入、无监督候选发现和人工审核三阶段流水线，高效产出领域核心术语集合，为后续概念图谱构建奠定基础。不依赖标注数据，可快速冷启动。',
      scenarios: [
        '新领域知识图谱冷启动，缺乏先验术语表',
        '海量领域语料中的术语自动发现',
        '基于已有专家词表快速扩展术语覆盖',
        '术语规范化与去重清洗',
      ],
      inputFormat: 'JSON格式，包含corpus（语料路径或文本列表）、optional_lexicon（外部词典路径）和config（算法参数）',
      outputFormat: 'JSON格式，返回seed_terms数组，每条包含term、score、source（算法来源）、status（审核状态）字段',
      performance: {
        f1: '—（无监督，以覆盖率/准确率评估）',
        precision: '88-92%',
        recall: '85-90%',
        speed: '~10万字/分钟',
      },
      notes: [
        '无需标注数据，可直接从原始语料启动',
        '外部词典导入可显著提升冷启动质量',
        '建议人工审核环节至少抽样 20% 的候选术语',
        '多算法融合策略（TF-IDF + C-Value + PMI）效果优于单一算法',
      ],
    },
    features: [
      {
        title: '语料库接入与管理',
        description: '提供多种数据源接入方式（本地文件、知识库文档、API接入），支持 TXT、PDF、JSON 等格式，作为术语抽取的文本基础。',
      },
      {
        title: '外部词典导入',
        description: '支持导入领域专家已有的高质量词汇表（CSV / Excel / TXT），实现种子术语的冷启动，避免从零开始的高成本标注。',
      },
      {
        title: '无监督算法发现',
        description: '内置 TF-IDF、C-Value、PMI、TextRank 等多种自动化关键词提取算法，从纯文本中发现潜在的种子术语，支持多算法融合评分。',
      },
      {
        title: '种子术语审核与管理',
        description: '提供交互式审核界面，对生成的种子术语进行人工确认、拒绝、合并与编辑，支持批量操作和导出，确保术语质量。',
      },
    ],
  },
  'node2vec': {
    name: 'Node2Vec',
    englishName: 'Node2Vec Graph Embedding',
    category: '图嵌入',
    type: '随机游走/深度学习',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v2.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-01-15 09:00:00',
    updatedAt: '2026-03-25 14:00:00',
    id: 'ALG_NODE2VEC_001',
    description: '基于二阶随机游走的图嵌入算法，通过调节返回参数 p 与进出参数 q 在广度优先与深度优先之间权衡，学习节点的低维向量表示。训练时可选择实数空间或复数空间嵌入，以适应不同关系模式的建模需求。',
    intro: {
      summary: 'Node2Vec 将网络中的节点映射到连续向量空间，使拓扑邻近或结构等价的节点在嵌入中距离更近。训练阶段支持在实数空间（ℝᵈ）与复数空间（ℂᵈ）之间切换：实数空间计算高效，适合同质邻居聚合；复数空间可更好地区分有向边与反对称结构。',
      scenarios: [
        '大规模知识图谱或社交网络的节点表示学习',
        '链接预测、节点分类与社区发现的上游特征',
        '需要对比实数 / 复数嵌入对下游任务影响的消融实验',
      ],
      inputFormat: '边列表或三元组文件，包含 source、target 及可选 weight；训练配置需指定 space_type（real / complex）与 embedding_dim',
      outputFormat: 'JSON 或 NPY，返回每个节点的嵌入向量；复数空间下向量长度为 2d（实部 + 虚部）',
      performance: {
        f1: '—',
        precision: 'Link Prediction: 85%',
        recall: 'Hits@10: 0.78',
        speed: '~5000 节点/秒（实数）',
      },
      notes: [
        '实数空间为默认推荐，适合无向同质图',
        '有向图谱或存在互逆关系时建议选用复数空间',
        '切换表示空间后需重新训练，不可复用已有向量',
      ],
    },
    features: [
      {
        title: '随机游走采样',
        description: '可配置游走长度、窗口大小与 p/q 参数，灵活控制局部与全局结构的采样偏好。',
      },
      {
        title: '实数 / 复数空间训练',
        description: '发起训练时可选择将节点嵌入到实数空间或复数空间，系统按所选空间自动调整参数量、负采样与相似度计算。',
      },
    ],
  },
  'graph-sage': {
    name: 'GraphSAGE',
    englishName: 'Graph Sample and Aggregate',
    category: '图嵌入',
    type: '图神经网络',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.8.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-02-01 09:00:00',
    updatedAt: '2026-04-05 11:00:00',
    id: 'ALG_GRAPHSAGE_001',
    description: '归纳式图神经网络嵌入方法，通过对邻居节点采样并聚合生成节点表示，支持对未见节点的泛化推断。训练阶段可选择实数空间或复数空间嵌入，分别适用于同质聚合与复杂有向关系建模。',
    intro: {
      summary: 'GraphSAGE 通过多层邻居采样与聚合学习可泛化的节点编码器。表示空间可在训练前配置：实数空间下使用均值/池化/LSTM 聚合；复数空间下聚合在 Hermitian 内积意义下进行，更适合反对称、互逆等关系模式。',
      scenarios: [
        '动态图谱、增量节点上的归纳式嵌入',
        '节点分类、链接预测与图谱补全',
        '对比实数与复数空间对 GNN 聚合效果的影响',
      ],
      inputFormat: '图结构（邻接表）+ 节点特征；训练配置包含 space_type（real / complex）、embedding_dim 与聚合器类型',
      outputFormat: 'JSON，返回节点嵌入；复数空间下每个节点输出实部、虚部各 d 维',
      performance: {
        f1: 'Node Classification: 90%',
        precision: 'MRR: 0.289',
        recall: 'Hits@10: 46.3%',
        speed: '~2000 节点/秒（实数）',
      },
      notes: [
        '默认推荐实数空间 + mean 聚合，显存占用最低',
        '关系模式复杂的知识图谱可改用复数空间提升链接预测',
        '复数空间参数量约为实数空间的 2 倍，需预留显存',
      ],
    },
    features: [
      {
        title: '邻居采样与聚合',
        description: '支持 mean、max-pool、LSTM 三种聚合器，可配置每层采样邻居数与网络深度。',
      },
      {
        title: '实数 / 复数空间训练',
        description: '发起训练时可选择表示空间：实数空间适合节点分类基线；复数空间适合建模有向与反对称关系。',
      },
    ],
  },
  'term-vector': {
    name: '术语向量生成',
    englishName: 'Term Vector Generation',
    category: '图嵌入',
    type: '预训练模型/微调',
    algorithmType: 'llm',
    trainable: true,
    version: 'v1.3.0',
    status: '已部署',
    owner: '陈七',
    createdAt: '2026-02-10 09:00:00',
    updatedAt: '2026-07-20 15:30:00',
    id: 'ALG_TERM_VEC_001',
    description: '将所有候选术语映射到低维、稠密的向量空间中，使得语义上相近的术语在空间中的距离也相近。支持从业界主流预训练语言模型中选择基座，并可使用自有领域语料对模型进行微调，显著提升垂直领域专业性。生成的术语向量可直接用于术语聚类、相似度检索、关系推断等下游任务。',
    intro: {
      summary: '术语向量生成以预训练语言模型为基座，通过对候选术语列表进行批量编码，输出每个术语的高质量稠密向量表示。支持领域语料微调，解决通用预训练模型在专业领域语义漂移问题，是知识图谱实体对齐、术语消歧与语义检索的核心基础设施。',
      scenarios: [
        '候选术语语义聚类，辅助本体层级自动构建',
        '术语相似度检索与近义词自动发现',
        '跨领域知识图谱实体对齐与链接预测',
        '低资源领域专业术语的迁移学习与扩展',
      ],
      inputFormat: 'JSON格式，包含terms（术语字符串列表）、model_id（预训练模型标识）和可选的fine_tune_config（微调配置项）',
      outputFormat: 'JSON格式，返回vectors数组，每条包含term（术语）、vector（float列表，维度取决于所选模型）和norm（L2范数）字段',
      performance: {
        f1: '—',
        precision: 'MRR@10: 0.91',
        recall: '语义召回率: 87%',
        speed: '~2000 术语/秒',
      },
      notes: [
        '向量维度因所选模型而异（768 / 1024 / 4096），下游任务需注意维度一致性',
        '领域微调建议使用至少 5 万字以上的高质量领域语料',
        '微调后模型版本与基座独立保存，可随时切换对比',
        '大批量术语（>10 万）建议使用异步任务模式以避免超时',
      ],
    },
    features: [
      {
        title: '预训练模型选择',
        description: '内置业界主流预训练语言模型供选择，涵盖通用型（BERT、RoBERTa、BGE）与中文专用型（MacBERT、ERNIE 3.0、text2vec-chinese）。可按向量维度、推理速度与领域适配性进行筛选比较，一键切换并预览向量效果。',
      },
      {
        title: '模型领域微调',
        description: '支持用户上传自有领域语料（纯文本 / 术语对 / 标注句子对），选择微调策略（继续预训练 / 对比学习 / 监督微调），对所选预训练模型进行专业化微调。微调后自动生成领域适配版本，可通过语义相似度基准测试对比微调前后效果。',
      },
    ],
  },
  'representation-space': {
    name: '表示空间',
    englishName: 'Representation Space Embedding',
    category: '图嵌入',
    type: '向量空间嵌入',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '张明',
    createdAt: '2026-06-01 09:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_REPR_SPACE_001',
    description: '支持将实体和关系嵌入到不同的数学空间（实数空间、复数空间）中，以适应不同模型对关系模式表达能力的需求。实数空间适用于大多数基础嵌入模型，复数空间可更好地建模对称/反对称等复杂关系。提供空间类型选择与嵌入维度可视化配置界面，与现有图嵌入算法（Node2Vec、GraphSAGE、ComplEx、RotatE 等）无缝集成。',
    intro: {
      summary: '表示空间模块将知识图谱嵌入的数学基础空间抽象为可配置组件，支持实数空间（ℝᵈ）和复数空间（ℂᵈ）两种类型。通过统一接口对接 Node2Vec、GraphSAGE、ComplEx、RotatE 等主流图嵌入算法，用户可在模型训练前灵活切换嵌入空间，无需修改下游算法代码，显著降低模型调优成本。',
      scenarios: [
        '知识图谱包含大量对称/反对称关系时，选用复数空间提升建模精度',
        '资源受限场景优先选用实数空间，降低计算与存储开销',
        '多模型对比实验：固定其他超参数，仅切换表示空间进行消融研究',
        '大规模图谱场景下通过维度配置平衡精度与性能',
      ],
      inputFormat: 'JSON格式，包含 space_type（"real" 或 "complex"）、dimension（嵌入维度 d，默认256）和可选的 precision（"float32" 或 "float16"）字段',
      outputFormat: 'JSON格式，返回 entity_embeddings（实体嵌入矩阵）、relation_embeddings（关系嵌入矩阵）及 space_config（实际使用的空间配置信息）',
      performance: {
        f1: '—',
        precision: 'MRR: 0.38–0.42',
        recall: 'Hits@10: 0.54–0.58',
        speed: '~3000 实体/秒（实数）',
      },
      notes: [
        '复数空间参数量约为实数空间的 2 倍，训练时需相应增加显存预算',
        '维度建议：实数空间 128–512，复数空间 64–256（等效表达力）',
        '与 RotatE、ComplEx 配合使用时须选择复数空间',
        '切换空间类型后需重新训练，历史训练产物不可跨空间迁移',
      ],
    },
    features: [
      {
        title: '实数空间嵌入',
        description: '将实体和关系表示为传统实数向量（ℝᵈ），通过标准点积或 L2 距离计算相似度。支持 TransE、DistMult、Node2Vec、GraphSAGE 等基础模型，计算高效，适合大多数通用知识图谱补全任务。',
      },
      {
        title: '复数空间嵌入',
        description: '将实体和关系表示为复数向量（ℂᵈ），利用 Hermitian 内积或旋转操作建模复杂关系语义，能有效处理对称、反对称、互逆等关系模式。兼容 ComplEx、RotatE、QuatE 等模型，在关系多样的垂直领域图谱上精度更高。',
      },
    ],
  },
  'semantic-retrieval': {
    name: '语义检索与推荐应用',
    englishName: 'Semantic Retrieval & Recommendation',
    category: '图嵌入',
    type: '规则/内置',
    algorithmType: 'rule',
    trainable: false,
    version: 'v1.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_SEM_RETR_001',
    description: '将知识相关性计算能力封装为标准服务接口，提供语义检索（Top-N 实体）与推荐候选集生成（用户画像驱动）两类 API，并配备调用频率、响应时间等性能监控仪表盘。P99 延迟 < 80ms，日均调用 120 万次。',
    intro: {
      overview: '本模块将图嵌入向量的相关性计算能力封装为开箱即用的微服务接口，支撑上层语义检索和个性化推荐应用。语义检索接口通过向量近邻检索返回与查询实体最相关的 Top-N 实体；推荐接口基于用户画像（兴趣标签 + 历史行为）生成候选实体集合；监控仪表盘实时采集 QPS、P50/P99 延迟、错误率等指标，确保服务稳定运行。',
      features: [
        {
          title: '语义检索服务接口',
          description: '提供 RESTful API，输入一个实体 ID，返回与之语义最相关的 Top-N 实体列表，支持按实体类型过滤、设置相关性阈值、选择底层算法（PPR / 余弦相似度 / auto）及可选的相关性解释字段。P99 延迟 < 80ms。',
        },
        {
          title: '推荐候选集生成接口',
          description: '接收用户画像（兴趣标签数组 + 历史浏览实体列表），融合多路图嵌入相关性分数生成个性化候选实体集合，支持多样性系数调节（diversity 参数）。P99 延迟 < 120ms。',
        },
        {
          title: '应用调用监控',
          description: '内置可视化监控仪表盘，实时展示 QPS 趋势、P50/P99 响应时间分布、错误次数时序及接口调用明细日志，并配置告警规则（延迟超阈值、错误率超阈值、QPS 突增）。',
        },
      ],
      performance: {
        metrics: [
          { name: 'P99 延迟（检索接口）', value: '< 80ms', trend: 'stable' },
          { name: 'P99 延迟（推荐接口）', value: '< 120ms', trend: 'stable' },
          { name: '日均调用量', value: '120 万次', trend: 'up' },
          { name: '服务可用性 SLA', value: '99.95%', trend: 'stable' },
        ],
        description: '所有延迟指标基于线上实际流量的 P99 百分位统计，SLA 统计周期为近 30 天滚动窗口。',
      },
    },
  },
  'node-similarity': {
    name: '快速图节点相似度计算',
    englishName: 'Fast Graph Node Similarity',
    category: '图嵌入',
    type: '规则/内置',
    algorithmType: 'rule',
    trainable: false,
    version: 'v1.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-06-01 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_NODE_SIM_001',
    description: '提供多种无需训练、计算速度快的图节点相似度算法，包含基于路径的 PersonalizedPageRank、SimRank，以及基于已训练嵌入向量的余弦相似度方案。三类算法统一封装为低延迟 REST API，支持大规模图谱的实时相似度查询，延迟低至亚毫秒级（余弦）至 30ms（SimRank）。',
    intro: {
      overview: '在知识图谱应用场景中，图节点相似度计算是实体推荐、实体对齐、知识补全等任务的基础能力。本模块汇聚基于图结构的路径算法（无需向量化）与基于嵌入空间的相似度算法，用户可根据图谱规模、是否有预训练向量、对延迟的要求灵活选用，并统一通过低延迟 API 调用。',
      features: [
        {
          title: '基于路径的算法',
          description: '内置 PersonalizedPageRank（随机游走重启，~15ms）和 SimRank（结构等价递归定义，~30ms）。两者均不依赖预训练向量，直接利用图拓扑结构计算相关性，适合中小规模图谱的精确相似度查询。',
        },
        {
          title: '基于嵌入向量的算法',
          description: '支持直接使用任意已训练好的实体嵌入向量（TransE、ComplEx、RotatE 等），通过余弦相似度 cos(h,t)=(h·t)/(‖h‖·‖t‖) 实现亚毫秒级查询，可扩展至千万节点图谱，适合实时检索与批量对齐。',
        },
        {
          title: '实时计算接口',
          description: '三类算法统一封装为单一 POST /api/node-similarity 接口，支持 algorithm、source、top_k、filter_types、min_score 等参数，响应包含节点 ID、标签、相似度分数及实际延迟，配套交互式沙箱供调试。',
        },
      ],
      performance: {
        metrics: [
          { name: 'PPR P@10 (FB15k-237)', value: '0.867', trend: 'stable' },
          { name: 'SimRank P@10', value: '0.821', trend: 'stable' },
          { name: '余弦相似度 P@10', value: '0.912', trend: 'stable' },
          { name: '余弦延迟（千万节点）', value: '< 1ms', trend: 'stable' },
        ],
        description: '路径算法指标在 FB15k-237 上评估；延迟为单次查询 P99 延迟，在 32 核服务器上测定。',
      },
    },
  },
  'encoding-model': {
    name: '编码模型',
    englishName: 'Knowledge Graph Encoding Models',
    category: '图嵌入',
    type: '深度学习/规则',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-06-01 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_ENC_MODEL_001',
    description: '提供平移距离（TransE/TransH/TransR）、张量/矩阵分解（RESCAL/DistMult/ComplEx）、神经网络（ConvE/GraphSAGE）三大类共 8 个主流知识图谱嵌入编码模型。用户可根据图谱特点选择编码模型，并在训练前指定实数空间或复数空间嵌入，再统一配置向量维度、学习率、批大小等超参数后发起训练。',
    intro: {
      overview: '知识图谱嵌入编码模型是将图谱实体和关系映射到低维连续向量空间的核心方法，其选择直接决定了嵌入质量与下游任务（链接预测、关系推理、实体对齐）的性能上限。本模块汇聚三大模型族群，覆盖从轻量平移模型到表达能力最强的神经网络模型的完整谱系，并提供统一配置与训练入口。',
      features: [
        {
          title: '平移距离模型库',
          description: '提供 TransE、TransH、TransR 三种平移距离模型。TransE 将关系建模为平移向量；TransH 引入超平面投影处理复杂映射；TransR 为每种关系学习独立投影矩阵，表达力最强。适合对计算效率有要求的场景。',
        },
        {
          title: '张量/矩阵分解模型库',
          description: '提供 RESCAL、DistMult、ComplEx 三种双线性分解模型。RESCAL 使用全矩阵建模，表达力最强；DistMult 以对角矩阵简化计算；ComplEx 扩展至复数域以建模非对称关系。三者在 FB15k-237 上 MRR 0.24–0.36。',
        },
        {
          title: '神经网络模型库',
          description: '提供 ConvE 和 GraphSAGE 两种深度学习模型。ConvE 利用卷积提取实体-关系特征图的非线性交互；GraphSAGE 通过邻居聚合实现归纳式学习，支持对未见节点的泛化推断。',
        },
        {
          title: '模型选择与超参数配置',
          description: '提供清晰的模型对比界面（关系模式支持、MRR 基准、参数复杂度）。训练前可选择实数空间（ℝᵈ）或复数空间（ℂᵈ）嵌入，并统一配置向量维度、学习率、批大小、Margin、优化器、负采样数等超参数，配置预览后一键发起训练。',
        },
      ],
      performance: {
        metrics: [
          { name: 'TransE MRR (FB15k-237)', value: '0.347', trend: 'stable' },
          { name: 'ComplEx MRR (FB15k-237)', value: '0.247', trend: 'stable' },
          { name: 'RESCAL MRR (FB15k-237)', value: '0.356', trend: 'stable' },
          { name: 'ConvE MRR (FB15k-237)', value: '0.325', trend: 'stable' },
        ],
        description: '所有指标均在 FB15k-237 测试集上以过滤设置（Filtered MRR）评估。',
      },
    },
  },
  'rgat-relation': {
    name: '关系图注意力网络',
    englishName: 'Relational Graph Attention Network',
    category: '关系抽取',
    type: '图神经网络',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v2.0.0',
    status: '已部署',
    owner: '林八',
    createdAt: '2025-11-01 09:00:00',
    updatedAt: '2026-07-25 16:00:00',
    id: 'ALG_RGAT_REL_001',
    description: '基于关系图注意力网络（RGAT）的深度学习关系抽取引擎，通过多头注意力机制在实体-关系图上动态聚合上下文信息，精准识别实体对之间的语义关系类型。内置针对科技、学术、专利等领域预训练的关系抽取模型，支持用户使用自有标注数据进行微调，并提供训练过程的实时可视化监控，是构建高精度领域知识图谱关系层的核心引擎。',
    intro: {
      summary: 'RGAT 在传统图注意力网络基础上引入关系类型嵌入，对每种关系赋予独立的注意力权重矩阵，使模型能够同时建模实体的局部结构特征与全局语义依赖。与 BERT-based 方法相比，在关系密集的科技文献场景下 F1 提升约 4-6 个百分点，并支持少样本场景下的元学习微调。',
      scenarios: [
        '科技文献中作者-机构、方法-数据集、技术-应用等复杂关系抽取',
        '专利文档中发明主体与技术要素之间关系的自动识别',
        '多跳关系推断与知识图谱补全',
        '低资源垂直领域关系抽取（少样本微调）',
      ],
      inputFormat: 'JSON格式，包含 text（原文）、entities（实体列表，含 start/end/type）和可选的 relation_types（目标关系类型集合）',
      outputFormat: 'JSON格式，返回 relations 数组，每条包含 subject、object、relation_type、confidence 和 evidence_span 字段',
      performance: {
        f1: '93-96%',
        precision: '94-97%',
        recall: '91-95%',
        speed: '~180 句/秒',
      },
      notes: [
        '标注数据建议每类关系不少于 200 个样本以保证微调稳定性',
        '实体数超过 30 的超长句会触发实体对截断，建议预处理时限制句长',
        'RGAT 在关系类型不均衡数据上需配合 focal loss 使用',
        '预训练模型按领域隔离存储，跨领域部署前须进行领域适配评估',
      ],
    },
    features: [
      {
        title: '预训练模型管理',
        description: '内置多个针对科技、学术、专利、医疗等特定领域预训练完成的 RGAT 关系抽取模型，可按领域、关系类型数、版本日期进行筛选与对比。支持模型启用/停用、版本回滚及 API 端点一键切换，保证生产环境平滑升级。',
      },
      {
        title: '模型训练与微调',
        description: '提供完整的训练配置界面，允许用户上传 CoNLL / JSON 格式的自有标注数据，配置学习率、批大小、训练轮次、早停策略等超参数，对所选预训练模型发起微调任务。支持全量微调与 LoRA 高效参数微调两种模式。',
      },
      {
        title: '训练过程监控',
        description: '以折线图实时可视化训练过程中每个 Epoch 的 Loss、准确率（Accuracy）、F1-Score 等关键指标，支持训练集/验证集曲线对比，帮助用户及时发现过拟合与欠拟合，并提供提前停止与断点续训能力。',
      },
    ],
  },
  'few-shot-triple': {
    name: '少样本学习三元组生成',
    englishName: 'Few-Shot Triple Generation',
    category: '关系抽取',
    type: '深度学习',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_FEW_TRIPLE_001',
    description: '在数据稀疏的领域或对于新的关系类型，利用少样本学习技术，仅通过少量标注样本生成新三元组。内置元学习任务构建、原型网络等经典少样本算法，用户只需提供少量新关系样本，即可快速适配并预测该关系的新三元组。',
    intro: {
      overview: '少样本学习三元组生成解决了知识图谱构建中的长尾关系难题：大量低频关系因标注成本过高而数据稀疏，传统监督模型无法有效学习。本算法采用元学习（Meta-Learning）范式，先在丰富的既有关系上"学会学习"，再以极少量（1–10 个）新关系样本快速适配，实现对新关系类型的高精度三元组生成。',
      features: [
        {
          title: '元学习任务构建',
          description: '将现有知识图谱的关系数据自动转化为 N-way K-shot Episode，每个 Episode 包含支持集（K 个已标注样本/类）和查询集（用于计算元训练损失），使编码器学习到泛化的关系表示能力，而非仅针对特定关系过拟合。',
        },
        {
          title: '原型网络支持',
          description: '内置原型网络（Prototypical Network）作为默认少样本算法，为每个关系类计算支持集嵌入均值作为原型向量，通过欧式距离将查询样本归类到最近原型。同时提供匹配网络、MAML、Reptile 等算法供对比选择。',
        },
        {
          title: '新关系快速学习',
          description: '用户只需为新关系类型标注少量（≥3 条）正样本，系统即可在预训练元模型基础上快速适配（<1 分钟），输出新关系的预测三元组列表及置信度评分。支持用户自定义补充样本以进一步提升精度。',
        },
      ],
      performance: {
        metrics: [
          { name: 'F1 (1-shot)', value: '68–72%', trend: 'stable' },
          { name: 'F1 (5-shot)', value: '78–84%', trend: 'up' },
          { name: '适配耗时', value: '< 60s', trend: 'stable' },
          { name: '支持关系类型', value: '无限制', trend: 'stable' },
        ],
        description: 'F1 指标在 FewRel 基准数据集上评估，5-way K-shot 设置，过滤设置下统计。',
      },
    },
  },
  'relation-scoring': {
    name: '关系评分模型构建',
    englishName: 'Relation Scoring Model',
    category: '关系抽取',
    type: '规则/配置',
    algorithmType: 'rule-based',
    trainable: false,
    version: 'v1.0.0',
    status: '已部署',
    owner: '系统内置',
    createdAt: '2026-08-04 00:00:00',
    updatedAt: '2026-08-04 10:00:00',
    id: 'ALG_REL_SCORE_001',
    description: '支持用户为知识图谱中不同关系类型设置重要性权重，自定义路径评分算法（路径长度惩罚、关系权重乘积、路径可靠性、调和平均融合），并将配置好的评分模型命名、保存与版本管理，便于在不同分析任务中复用。',
    intro: {
      overview: '关系评分模型将知识图谱中的推理路径量化为可比较的得分，是路径排序、链路预测置信度评估、知识融合去重等任务的基础工具。本模块以无需训练的配置驱动方式，让领域专家直接将业务知识编码为权重和算法组合，无需标注数据即可快速落地。',
      features: [
        {
          title: '关系类型权重配置',
          description: '为图谱中每种关系类型指定 0–1 区间的重要性权重，通过可视化滑块实时调整，权重分布条形图同步更新。支持添加自定义关系类型，删除不需要的类型。',
        },
        {
          title: '路径评分算法自定义',
          description: '提供四种基础算法：路径长度惩罚（衰减系数可调）、关系权重乘积（全路径可信度累乘）、路径可靠性（基于来源置信度与数据新鲜度）、调和平均融合（防止单一低分拉低总分）。多算法可自由组合启用，实时预览典型路径得分。',
        },
        {
          title: '模型保存与管理',
          description: '将当前配置命名保存为独立模型，自动分配版本号（如 v1.0.0）。模型列表支持查看历史版本、复制模型 ID（用于 API 调用）、删除（带二次确认保护），NDCG@10 自动评估供参考。',
        },
      ],
      metrics: [
        { name: 'NDCG@10', value: '0.87', trend: 'stable' },
        { name: '支持关系类型', value: '无限制', trend: 'stable' },
        { name: '配置生效延迟', value: '< 1s', trend: 'stable' },
        { name: '模型数上限', value: '100 个', trend: 'stable' },
      ],
      description: 'NDCG@10 基于科研知识图谱评估集，对路径排序结果与人工标注顺序的一致性度量。',
    },
  },
  'hypernym-generation': {
    name: '上下位关系生成',
    englishName: 'Hypernym-Hyponym Relation Generation',
    category: '关系抽取',
    type: '批量推断/规则',
    algorithmType: 'rule-based',
    trainable: false,
    version: 'v1.1.0',
    status: '已部署',
    owner: '赵九',
    createdAt: '2026-03-20 09:00:00',
    updatedAt: '2026-07-30 11:00:00',
    id: 'ALG_HYPER_GEN_001',
    description: '调用训练好的关系分类模型（如 RGAT、BERT-Relation 等），对海量候选概念对子图进行批量预测，自动生成候选的上下位关系列表。支持创建异步批量预测任务、指定目标概念集与模型，并通过置信度阈值机制自动过滤低可信度结果，输出高质量的上下位关系候选列表供人工或自动审核使用。',
    intro: {
      summary: '上下位关系（Hypernym-Hyponym）是知识本体层级结构的核心骨架。本算法以已训练的关系分类模型为后端，对概念集两两组合生成的概念对进行大规模批量推断，结合可配置的置信度阈值筛选，将计算密集型任务异步化处理，使用户能够以流水线方式将海量语料转化为结构化的本体层级关系。',
      scenarios: [
        '从领域术语表中自动构建上下位层级结构，辅助本体建模',
        '知识图谱扩充：为现有本体批量补全缺失的上下位关系',
        '大规模概念集的关系矩阵批量计算（百万级概念对）',
        '与人工审核工作台配合，实现半自动本体构建流水线',
      ],
      inputFormat: 'JSON格式，包含 concept_set_id（概念集 ID 或概念字符串列表）、model_id（关系分类模型标识）、threshold（置信度阈值，0–1）和可选的 relation_type（默认 hypernym）',
      outputFormat: 'JSON格式，返回 relations 数组，每条包含 hyponym（下位词）、hypernym（上位词）、confidence（置信度）、model_id 和 status（pending/accepted/rejected）字段',
      performance: {
        f1: '—',
        precision: 'Precision@0.8: 91%',
        recall: 'Recall@0.8: 84%',
        speed: '~5000 概念对/秒',
      },
      notes: [
        '概念对数量呈平方增长，建议提前过滤无关概念以降低计算量',
        '阈值设为 0.75 时可在精度与召回率间取得较好平衡',
        '批量任务支持断点续算，异常中断后可从上次检查点恢复',
        '输出结果建议与人工审核工作台对接，最终确认后再写入图谱',
      ],
    },
    features: [
      {
        title: '批量预测任务',
        description: '支持用户创建异步批量预测任务，指定目标概念集（支持从本体库选取或手动上传术语列表）和所用关系分类模型，系统自动枚举概念对并调度模型推断。任务支持队列管理、优先级设置、进度监控与结果分批下载。',
      },
      {
        title: '置信度阈值过滤',
        description: '提供交互式阈值滑块，用户可实时预览不同阈值下的预测数量与精度估算。系统根据阈值自动过滤低置信度的候选关系，支持对保留结果按置信度排序，并输出过滤统计摘要（过滤前/后数量、阈值、平均置信度等）。',
      },
    ],
  },
  'candidate-term-generation': {
    name: '候选术语生成',
    englishName: 'Candidate Term Generation',
    category: '实体抽取',
    type: '统计与规则混合',
    algorithmType: 'rule-based',
    trainable: false,
    version: 'v1.1.0',
    status: '已部署',
    owner: '赵六',
    createdAt: '2026-05-10 09:00:00',
    updatedAt: '2026-08-06 10:00:00',
    id: 'ALG_CAND_TERM_GEN_001',
    description: '在种子术语的基础上，利用自然语言处理技术在整个语料库中进行扩展，大规模地挖掘出所有潜在的、相关的候选术语，构建全面的领域概念集合。支持基于统计的扩展（词共现、互信息）、基于规则的扩展（词性模式）以及候选术语去重与合并三大核心功能。',
    intro: {
      summary: '候选术语生成算法以种子术语为起点，通过统计学习与规则方法双轮驱动，系统性地从领域语料库中扩展出完整的候选术语集合。统计路径发现语义相关术语，规则路径覆盖复合术语结构，最终经去重合并生成高质量的唯一候选列表，为后续实体抽取与本体构建提供坚实的概念基础。',
      scenarios: [
        '领域本体冷启动：以少量专家提供的种子术语快速扩展出完整领域概念集',
        '新兴领域语料挖掘：从大规模未标注文本中发现尚未被收录的新兴术语',
        '术语库更新迭代：定期扫描新增语料，补充领域概念库的遗漏术语',
        '多源术语融合：整合词典、语料、规则三类来源后去重合并为统一术语列表',
      ],
      inputFormat: 'JSON格式，包含 seed_terms（种子术语列表）、corpus_id（语料库标识）、methods（启用的扩展方式，可选 statistical / rule-based / both）及可选的 pos_patterns（自定义词性模式列表）字段',
      outputFormat: 'JSON格式，返回 candidates 数组，每条包含 term（术语文本）、source（来源：statistical / rule / merged）、score（相关度分值）、frequency（语料频次）和 status（pending / accepted / rejected）字段',
      performance: {
        f1: '—',
        precision: '精确率: 85-90%',
        recall: '扩展召回率: 88-93%',
        speed: '~10万词/分钟（统计扩展）',
      },
      notes: [
        '种子术语质量直接影响扩展结果，建议提供覆盖核心概念的 20-50 个高质量种子',
        '互信息阈值默认为 3.0，可根据领域稀疏程度适当调低',
        '词性模式扩展依赖语料的分词与词性标注质量，建议先完成语料预处理',
        '去重合并阶段采用编辑距离与语义相似度双重比对，可通过参数控制合并粒度',
      ],
    },
    features: [
      {
        title: '基于统计的扩展',
        description: '利用词共现矩阵与点互信息（PMI）等统计指标，在语料库中自动发现与种子术语高度相关的候选术语。支持配置共现窗口大小、最低频次阈值与 PMI 下限，过滤低质量候选，同时输出每对术语的统计关联分值供下游排序使用。',
      },
      {
        title: '基于规则的扩展',
        description: '通过预定义或用户自定义的词性序列模式（如"形容词+名词"、"名词+名词"、"动词+名词"等）从语料中抽取复合术语候选。内置面向中英文的通用模式库，支持正则风格的模式语法与白名单/黑名单过滤，可快速适配垂直领域的术语构词规律。',
      },
      {
        title: '候选术语去重与合并',
        description: '对统计扩展与规则扩展产生的候选术语进行跨来源标准化处理：先执行字面归一化（繁简转换、大小写统一、全半角处理），再通过编辑距离与语义向量相似度识别近义重复项，最终生成每个概念唯一的规范形式，并保留原始变体作为同义词记录，输出去重后的候选术语唯一列表。',
      },
    ],
  },
  'event-annotation': {
    name: '事件标注算法',
    englishName: 'Event Annotation Algorithm',
    category: '实体抽取',
    type: '主动学习标注',
    algorithmType: 'deep-learning',
    trainable: true,
    version: 'v1.0.0',
    status: '已部署',
    owner: '王五',
    createdAt: '2026-06-01 09:00:00',
    updatedAt: '2026-08-05 10:00:00',
    id: 'ALG_EVENT_ANNO_001',
    description: '面向结构化事件知识构建的标注算法，支持事件触发词、论元角色（施事、受事、时间、地点、原因、结果等）的精细化标注，内置主动学习策略优先推送高价值待标注样本，配合可视化标注工作台与标注质量评估模块，显著提升事件语料的标注效率与一致性。',
    intro: {
      summary: '事件标注算法将主动学习与可视化标注工作台深度结合，通过不确定性采样与多样性采样策略从未标注语料中自动筛选高价值样本推送给标注员，在大幅减少标注工作量的同时保证模型训练数据质量。内置标注一致性评估（Cohen\'s κ）可实时监控多标注员之间的标注质量。',
      scenarios: [
        '从领域新闻、学术文献、事故报告中构建结构化事件知识库',
        '面向事件抽取模型的高质量训练数据集构建',
        '多标注员协作标注场景，需要一致性控制与仲裁机制',
        '主动学习迭代：标注→训练→推断→再标注的闭环流程',
      ],
      inputFormat: 'JSON格式，包含 text（待标注文本）、event_schema（事件模式定义，含触发词类型与论元角色列表）和可选的 pre_annotations（模型预标注结果）字段',
      outputFormat: 'JSON格式，返回 events 数组，每个事件包含 trigger（触发词及位置）、event_type（事件类型）、arguments（论元列表，含 role、text、start、end）和 confidence 字段',
      performance: {
        f1: '触发词 F1: 88-92%',
        precision: '论元角色 F1: 82-87%',
        recall: '标注效率提升: 45-60%',
        speed: '主动学习采样: ~1000 句/秒',
      },
      notes: [
        '事件模式（Event Schema）需在标注前完成定义，建议覆盖触发词类型与所有论元角色',
        '主动学习冷启动阶段需提供至少 50 条人工标注样本以初始化模型',
        '多标注员场景建议设置 κ ≥ 0.75 作为质量门控阈值',
        '预标注辅助模式下，标注员只需审核和修正模型输出，效率可提升约 3 倍',
      ],
    },
    features: [
      {
        title: '可视化标注工作台',
        description: '提供基于 Web 的事件标注界面，支持对文本中的触发词和论元进行跨度选取与角色分配，标注结果实时高亮展示。内置快捷键操作、标注历史回溯与一键提交功能，适合大规模标注流水线作业。',
      },
      {
        title: '主动学习样本推荐',
        description: '结合不确定性采样（Least Confidence、Margin Sampling）与多样性采样（CoreSet）策略，自动从未标注语料池中筛选最高信息增益的样本推送给标注员，有效降低达到目标性能所需的标注量。',
      },
      {
        title: '标注质量评估',
        description: '对多标注员的标注结果计算 Cohen\'s κ 系数，实时生成标注一致性报告，定位分歧样本并支持仲裁员裁决。同时提供触发词与各论元角色的分布统计，辅助发现标注偏差。',
      },
      {
        title: '事件模式管理',
        description: '支持用户自定义事件类型本体（Event Ontology），灵活配置触发词类型、论元角色约束与角色间互斥规则，模式变更后可对已标注数据进行批量迁移与兼容性检查。',
      },
    ],
  },
};

export function AlgorithmDetailPage({ algorithmId, onBack, onNavigateToService }: AlgorithmDetailProps) {
  const [activeTab, setActiveTab] = useState<'intro' | 'demo' | 'models' | 'training' | 'deployment'>('intro');
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const algo = algorithmDetails[algorithmId];

  if (!algo) {
    return <div>算法不存在</div>;
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(algo.id);
    alert('已复制算法ID');
  };

  const getAlgorithmTypeTag = () => {
    const tags: Record<string, { label: string; class: string }> = {
      'deep-learning': { label: '深度学习', class: 'bg-blue-100 text-blue-700' },
      'llm': { label: '大模型', class: 'bg-purple-100 text-purple-700' },
      'rule-based': { label: '规则算法', class: 'bg-green-100 text-green-700' },
    };
    return tags[algo.algorithmType] || tags['deep-learning'];
  };

  const typeTag = getAlgorithmTypeTag();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                返回列表
              </button>
              {algo.status === '已部署' && onNavigateToService && (
                <button
                  onClick={() => onNavigateToService(algorithmId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors"
                >
                  查看算法服务 →
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-gray-900">{algo.name}</h2>
              <span className={`px-2.5 py-0.5 text-sm rounded-full ${typeTag.class}`}>
                {typeTag.label}
              </span>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-sm rounded-full">
                {algo.category}
              </span>
              <span
                className={`px-2.5 py-0.5 text-sm rounded-full ${
                  algo.status === '已部署'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {algo.status}
              </span>
              {algo.trainable ? (
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                  支持训练
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full border border-gray-200">
                  不支持训练
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm mt-3">
              <div>
                <span className="text-gray-600">算法类型:</span>
                <span className="ml-2 text-gray-900">{algo.type}</span>
              </div>
              <div>
                <span className="text-gray-600">当前版本:</span>
                <span className="ml-2 text-gray-900">{algo.version}</span>
              </div>
              <div>
                <span className="text-gray-600">负责人:</span>
                <span className="ml-2 text-gray-900">{algo.owner}</span>
              </div>
              <div>
                <span className="text-gray-600">最近更新:</span>
                <span className="ml-2 text-gray-900">{algo.updatedAt}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => algo.trainable && setShowTrainingModal(true)}
              disabled={!algo.trainable}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                algo.trainable
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!algo.trainable ? '该算法不支持训练' : ''}
            >
              <Play className="w-4 h-4" />
              发起训练
            </button>
            <button
              onClick={() => setShowDeployModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Settings className="w-4 h-4" />
              发起部署
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('intro')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'intro'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              算法介绍
            </button>
            {algorithmId === 'dependency-graph' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />句法可视化
              </button>
            )}
            {algorithmId === 'term-vector' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-purple-600 text-purple-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />模型与微调
              </button>
            )}
            {algorithmId === 'rgat-relation' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />训练与监控
              </button>
            )}
            {algorithmId === 'hypernym-generation' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />批量预测与过滤
              </button>
            )}
            {algorithmId === 'few-shot-triple' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-purple-600 text-purple-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />少样本演示
              </button>
            )}
            {algorithmId === 'relation-scoring' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />评分模型配置
              </button>
            )}
            {algorithmId === 'adversarial-transfer' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />迁移学习配置
              </button>
            )}
            {algorithmId === 'term-event-rough' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-amber-600 text-amber-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />触发词与论元抽取
              </button>
            )}
            {algorithmId === 'rl-sentence-selector' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-green-600 text-green-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />智能选句演示
              </button>
            )}
            {algorithmId === 'event-recognition-engine' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-orange-600 text-orange-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />事件识别演示
              </button>
            )}
            {algorithmId === 'stat-instance-generation' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-purple-600 text-purple-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />实例生成演示
              </button>
            )}
            {algorithmId === 'instance-matching' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />实例匹配演示
              </button>
            )}
            {algorithmId === 'rl-denoising' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-purple-600 text-purple-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />降噪模型演示
              </button>
            )}
            {algorithmId === 'event-relation-extraction' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />关系提取演示
              </button>
            )}
            {algorithmId === 'temporal-relation-dependency' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />时序关系演示
              </button>
            )}
            {algorithmId === 'scoring-function' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />函数演示
              </button>
            )}
            {algorithmId === 'rule-extension' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />泛化与特化
              </button>
            )}
            {algorithmId === 'supervised-similarity' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-amber-600 text-amber-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />标注与训练
              </button>
            )}
            {algorithmId === 'node-similarity' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />相似度查询
              </button>
            )}
            {algorithmId === 'semantic-retrieval' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />检索与推荐
              </button>
            )}
            {algorithmId === 'encoding-model' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />模型库与配置
              </button>
            )}
            {algorithmId === 'representation-space' && (
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'demo'
                    ? 'border-indigo-600 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />空间类型配置
              </button>
            )}
            <button
              onClick={() => setActiveTab('models')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'models'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              模型版本
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'training'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              训练记录
            </button>
            <button
              onClick={() => setActiveTab('deployment')}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === 'deployment'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              部署管理
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'intro' && <IntroTab algo={algo} onCopyId={handleCopyId} />}
        {activeTab === 'demo' && algorithmId === 'dependency-graph' && <DependencyTreeDemo />}
        {activeTab === 'demo' && algorithmId === 'term-vector' && <TermVectorDemo />}
        {activeTab === 'demo' && algorithmId === 'rgat-relation' && <RGATDemo />}
        {activeTab === 'demo' && algorithmId === 'hypernym-generation' && <HypernymDemo />}
        {activeTab === 'demo' && algorithmId === 'few-shot-triple' && <FewShotTripleDemo />}
        {activeTab === 'demo' && algorithmId === 'relation-scoring' && <RelationScoringDemo />}
        {activeTab === 'demo' && algorithmId === 'adversarial-transfer' && <AdversarialTransferDemo />}
        {activeTab === 'demo' && algorithmId === 'term-event-rough' && <TermEventRoughDemo />}
        {activeTab === 'demo' && algorithmId === 'rl-sentence-selector' && <RLSentenceSelectorDemo />}
        {activeTab === 'demo' && algorithmId === 'event-recognition-engine' && <EventRecognitionEngineDemo />}
        {activeTab === 'demo' && algorithmId === 'stat-instance-generation' && <StatInstanceGenerationDemo />}
        {activeTab === 'demo' && algorithmId === 'instance-matching' && <InstanceMatchingDemo />}
        {activeTab === 'demo' && algorithmId === 'rl-denoising' && <RLDenoisingDemo />}
        {activeTab === 'demo' && algorithmId === 'node-similarity' && <NodeSimilarityDemo />}
        {activeTab === 'demo' && algorithmId === 'semantic-retrieval' && <SemanticRetrievalDemo />}
        {activeTab === 'demo' && algorithmId === 'encoding-model' && <EncodingModelDemo />}
        {activeTab === 'demo' && algorithmId === 'rule-extension' && <RuleExtensionDemo />}
        {activeTab === 'demo' && algorithmId === 'scoring-function' && <ScoringFunctionDemo />}
        {activeTab === 'demo' && algorithmId === 'supervised-similarity' && <SupervisedSimilarityDemo />}
        {activeTab === 'demo' && algorithmId === 'representation-space' && <RepresentationSpaceDemo />}
        {activeTab === 'demo' && algorithmId === 'event-relation-extraction' && <EventRelationExtractionDemo />}
        {activeTab === 'demo' && algorithmId === 'temporal-relation-dependency' && <TemporalRelationDependencyDemo />}
        {activeTab === 'demo' && algorithmId === 'cross-lingual-alignment' && <CrossLingualAlignmentDemo />}
        {activeTab === 'models' && <ModelsTab algorithmId={algorithmId} algorithmName={algo.name} />}
        {activeTab === 'training' && <TrainingRecordsTab algorithmId={algorithmId} />}
        {activeTab === 'deployment' && <DeploymentRecordsTab />}
      </div>

      {showTrainingModal && (
        <TrainingConfigModal
          algorithmId={algorithmId}
          algorithmName={algo.name}
          onClose={() => setShowTrainingModal(false)}
        />
      )}
      {showDeployModal && (
        <DeployConfigModal
          algorithmName={algo.name}
          onClose={() => setShowDeployModal(false)}
        />
      )}
    </div>
  );
}

function IntroTab({ algo, onCopyId }: { algo: any; onCopyId: () => void }) {
  const getAlgorithmTypeTag = () => {
    const tags: Record<string, { label: string; class: string }> = {
      'deep-learning': { label: '深度学习', class: 'bg-blue-100 text-blue-700' },
      'llm': { label: '大模型', class: 'bg-purple-100 text-purple-700' },
      'rule-based': { label: '规则算法', class: 'bg-green-100 text-green-700' },
    };
    return tags[algo.algorithmType] || tags['deep-learning'];
  };

  const typeTag = getAlgorithmTypeTag();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
          <button
            onClick={onCopyId}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" />
            复制算法ID
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">算法ID:</span>
              <span className="ml-2 text-gray-900 font-mono">{algo.id}</span>
            </div>
            <div>
              <span className="text-gray-600">英文名称:</span>
              <span className="ml-2 text-gray-900">{algo.englishName}</span>
            </div>
            <div>
              <span className="text-gray-600">算法类型:</span>
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${typeTag.class}`}>
                {typeTag.label}
              </span>
            </div>
            <div>
              <span className="text-gray-600">训练支持:</span>
              <span className="ml-2 text-gray-900">
                {algo.trainable ? '支持训练' : '不支持训练'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">创建时间:</span>
              <span className="ml-2 text-gray-900">{algo.createdAt}</span>
            </div>
            <div>
              <span className="text-gray-600">更新时间:</span>
              <span className="ml-2 text-gray-900">{algo.updatedAt}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-600">算法描述:</span>
            <p className="mt-1 text-gray-900">{algo.description}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">算法简介</h3>
        <p className="text-gray-700">{algo.intro.summary}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">适用场景</h3>
        <ul className="space-y-2">
          {algo.intro.scenarios.map((scenario: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2"></span>
              <span className="text-gray-700">{scenario}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">输入格式说明</h3>
          <p className="text-gray-700 text-sm">{algo.intro.inputFormat}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">输出格式说明</h3>
          <p className="text-gray-700 text-sm">{algo.intro.outputFormat}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">性能指标</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">F1-Score</div>
            <div className="text-2xl font-semibold text-blue-900">{algo.intro.performance.f1}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">Precision</div>
            <div className="text-2xl font-semibold text-green-900">{algo.intro.performance.precision}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">Recall</div>
            <div className="text-2xl font-semibold text-purple-900">{algo.intro.performance.recall}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-600 mb-1">推理速度</div>
            <div className="text-xl font-semibold text-orange-900">{algo.intro.performance.speed}</div>
          </div>
        </div>
      </div>

      {algo.features && algo.features.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">核心功能模块</h3>
          <div className="grid grid-cols-2 gap-4">
            {algo.features.map((f: { title: string; description: string }, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {i + 1}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">{f.title}</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">注意事项</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <ul className="space-y-2">
            {algo.intro.notes.map((note: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-yellow-800">
                <span className="mt-1">⚠️</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TrainingRecordsTab({ algorithmId }: { algorithmId: string }) {
  const isGraph = supportsEmbeddingSpace(algorithmId);
  const records = isGraph
    ? [
        {
          id: 'TRAIN_GE_002',
          version: 'v1.2.0',
          dataset: 'FB15k-237_triples.txt',
          space: 'complex' as EmbeddingSpace,
          initiator: '张三',
          startTime: '2026-08-12 09:20:00',
          endTime: '2026-08-12 14:05:00',
          status: '成功',
          result: 'MRR: 0.412',
        },
        {
          id: 'TRAIN_GE_001',
          version: 'v1.1.0',
          dataset: 'graph_embedding_samples.txt',
          space: 'real' as EmbeddingSpace,
          initiator: '李四',
          startTime: '2026-08-04 10:00:00',
          endTime: '2026-08-04 12:40:00',
          status: '成功',
          result: 'Hits@10: 0.54',
        },
      ]
    : [
        {
          id: 'TRAIN_001',
          version: 'v2.3.1',
          dataset: '文献数据集-v3',
          space: undefined as EmbeddingSpace | undefined,
          initiator: '张三',
          startTime: '2026-04-15 10:00:00',
          endTime: '2026-04-15 12:30:00',
          status: '成功',
          result: 'F1: 92.5%',
        },
      ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">训练数据格式要求</h4>
        <div className="space-y-4 text-sm text-blue-800">
          {isGraph ? (
            <>
              <div>
                <p className="font-medium mb-2">图嵌入训练数据格式 (三元组 TXT / JSONL):</p>
                <div className="bg-white rounded p-3 font-mono text-xs text-gray-800 overflow-x-auto">
                  {`head\trelation\ttail\n张三\twork_at\t北京大学`}
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• 每行一条三元组，使用 Tab 或空格分隔头实体、关系、尾实体</li>
                  <li>• 训练时须指定表示空间：<strong>real</strong>（实数空间 ℝᵈ）或 <strong>complex</strong>（复数空间 ℂᵈ）</li>
                  <li>• 复数空间下输出向量长度为 2d（实部 + 虚部）</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <p className="font-medium text-blue-900">空间选择提示:</p>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• 实数空间：TransE、DistMult、Node2Vec、GraphSAGE 的默认选择</li>
                  <li>• 复数空间：ComplEx、RotatE 等建模反对称/互逆关系时必选</li>
                  <li>• 切换空间后须重新训练，不可复用历史嵌入</li>
                </ul>
              </div>
            </>
          ) : (
            <>
          <div>
            <p className="font-medium mb-2">实体抽取算法数据格式 (JSONL):</p>
            <div className="bg-white rounded p-3 font-mono text-xs text-gray-800 overflow-x-auto">
              {`{"text": "苹果公司发布了新款iPhone", "entities": [{"text": "苹果公司", "type": "ORG", "start": 0, "end": 4}, {"text": "iPhone", "type": "PRODUCT", "start": 12, "end": 18}]}`}
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• <strong>text</strong>: 原始文本内容</li>
              <li>• <strong>entities</strong>: 实体标注列表，每个实体包含文本、类型、起始和结束位置</li>
              <li>• <strong>建议</strong>: 至少准备5000条标注样本，实体类型不超过20种</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-2">关系抽取算法数据格式 (JSONL):</p>
            <div className="bg-white rounded p-3 font-mono text-xs text-gray-800 overflow-x-auto">
              {`{"text": "张三在北京大学工作", "head_entity": {"text": "张三", "type": "PER", "start": 0, "end": 2}, "tail_entity": {"text": "北京大学", "type": "ORG", "start": 3, "end": 7}, "relation": "work_at"}`}
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• <strong>head_entity / tail_entity</strong>: 实体对的头尾实体信息</li>
              <li>• <strong>relation</strong>: 实体间的关系类型</li>
              <li>• <strong>建议</strong>: 每个关系类型至少100个样本，关系类型不超过50种</li>
            </ul>
          </div>

          <div>
            <p className="font-medium mb-2">实体消歧算法数据格式 (JSONL):</p>
            <div className="bg-white rounded p-3 font-mono text-xs text-gray-800 overflow-x-auto">
              {`{"mention": "苹果", "context": "我喜欢吃苹果", "candidates": ["entity_fruit_apple", "entity_company_apple"], "correct_entity": "entity_fruit_apple"}`}
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• <strong>mention</strong>: 待消歧的实体提及</li>
              <li>• <strong>context</strong>: 上下文文本</li>
              <li>• <strong>candidates</strong>: 候选实体ID列表</li>
              <li>• <strong>correct_entity</strong>: 正确的实体ID</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="font-medium text-blue-900">数据准备提示:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• 数据集应分为训练集和验证集，建议比例为 8:2 或 7:3</li>
              <li>• 确保数据标注质量，错误标注会严重影响模型效果</li>
              <li>• 每个文件一行一个JSON对象，使用UTF-8编码</li>
              <li>• 可在<a href="#" className="text-blue-600 underline">数据集管理</a>页面上传和管理训练数据</li>
            </ul>
          </div>
            </>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">训练历史记录</h4>
        {records.length > 0 ? (
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">任务ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">版本</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">训练数据集</th>
              {isGraph && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">表示空间</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">发起人</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">开始时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">结束时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">评估结果</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 text-sm">{r.id}</td>
                <td className="px-4 py-3 text-sm">{r.version}</td>
                <td className="px-4 py-3 text-sm">{r.dataset}</td>
                {isGraph && (
                  <td className="px-4 py-3 text-sm">
                    {r.space ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.space === 'complex' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {embeddingSpaceLabel(r.space)}
                      </span>
                    ) : '—'}
                  </td>
                )}
                <td className="px-4 py-3 text-sm">{r.initiator}</td>
                <td className="px-4 py-3 text-sm">{r.startTime}</td>
                <td className="px-4 py-3 text-sm">{r.endTime}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{r.result}</td>
                <td className="px-4 py-3 text-sm">
                  <button className="text-blue-600 hover:text-blue-800">查看详情</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">暂无训练记录</div>
      )}
      </div>
    </div>
  );
}

function DeploymentRecordsTab() {
  const records = [
    {
      id: 'DEPLOY_001',
      version: 'v2.3.1',
      serviceName: 'bert-lstm-crf-service',
      serviceUrl: 'http://api.example.com/entity-extract',
      status: '运行中',
      createdAt: '2026-04-15 14:00:00',
    },
  ];

  return (
    <div>
      {records.length > 0 ? (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">部署ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">版本</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">服务名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">服务地址</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">部署时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 text-sm">{r.id}</td>
                <td className="px-4 py-3 text-sm">{r.version}</td>
                <td className="px-4 py-3 text-sm">{r.serviceName}</td>
                <td className="px-4 py-3 text-sm text-blue-600">{r.serviceUrl}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{r.createdAt}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">查看API</button>
                  <button className="text-blue-600 hover:text-blue-800">重新部署</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-12 text-gray-500">暂无部署记录</div>
      )}
    </div>
  );
}

const BASE_MODELS = [
  {
    id: 'roberta-wwm-ext',
    name: 'RoBERTa-wwm-ext',
    provider: 'HFL · 哈工大',
    params: '110M',
    language: '中文',
    license: 'Apache 2.0',
    desc: '全词掩码预训练，中文命名实体识别基准任务最优，推荐作为实体抽取首选底座。',
    tags: ['推荐', 'NER 优先'],
    size: '392 MB',
    color: 'blue',
  },
  {
    id: 'bert-base-chinese',
    name: 'BERT-base-Chinese',
    provider: 'Google',
    params: '110M',
    language: '中文',
    license: 'Apache 2.0',
    desc: '经典中文通用预训练模型，社区资源丰富，训练稳定，适合快速基线实验。',
    tags: ['通用', '轻量'],
    size: '392 MB',
    color: 'slate',
  },
  {
    id: 'ernie-3',
    name: 'ERNIE 3.0-base',
    provider: 'Baidu',
    params: '260M',
    language: '中文',
    license: 'Apache 2.0',
    desc: '知识增强预训练，在医学、法律等专业领域表现优异，支持实体知识融合。',
    tags: ['领域适配', '知识增强'],
    size: '950 MB',
    color: 'amber',
  },
  {
    id: 'macbert-large',
    name: 'MacBERT-large',
    provider: 'HFL · 哈工大',
    params: '330M',
    language: '中文',
    license: 'Apache 2.0',
    desc: 'MLM-as-correction 预训练策略，序列标注任务精度更高，适合追求最优 F1 的场景。',
    tags: ['高精度', '大参数'],
    size: '1.2 GB',
    color: 'violet',
  },
  {
    id: 'mengzi-bert',
    name: 'Mengzi-BERT-base',
    provider: 'Langboat',
    params: '110M',
    language: '中文',
    license: 'Apache 2.0',
    desc: '面向金融、科技领域文本优化的轻量级预训练模型，训练速度较 BERT 提升约 15%。',
    tags: ['科技领域', '高效'],
    size: '388 MB',
    color: 'emerald',
  },
];

const GRAPH_KGE_MODELS: { id: string; name: string; desc: string; space: EmbeddingSpace }[] = [
  { id: 'transe', name: 'TransE', desc: '平移距离模型，推荐实数空间。', space: 'real' },
  { id: 'distmult', name: 'DistMult', desc: '对角双线性分解，推荐实数空间。', space: 'real' },
  { id: 'complex', name: 'ComplEx', desc: 'Hermitian 内积模型，须使用复数空间。', space: 'complex' },
  { id: 'rotate', name: 'RotatE', desc: '关系建模为复数旋转，须使用复数空间。', space: 'complex' },
  { id: 'node2vec', name: 'Node2Vec', desc: '基于随机游走的节点嵌入，默认可在实数或复数空间训练。', space: 'real' },
  { id: 'graph-sage', name: 'GraphSAGE', desc: '邻居采样聚合的归纳式图神经网络嵌入。', space: 'real' },
];

function graphModelsForAlgorithm(algorithmId: string) {
  if (algorithmId === 'node2vec') return GRAPH_KGE_MODELS.filter(m => m.id === 'node2vec');
  if (algorithmId === 'graph-sage') return GRAPH_KGE_MODELS.filter(m => m.id === 'graph-sage');
  if (algorithmId === 'encoding-model') return GRAPH_KGE_MODELS.filter(m => m.id !== 'node2vec');
  return GRAPH_KGE_MODELS;
}

const MODEL_COLOR: Record<string, { badge: string; card: string; border: string; dot: string }> = {
  blue:    { badge: 'bg-blue-100 text-blue-700',    card: 'bg-blue-50 border-blue-200',    border: 'border-blue-300',   dot: 'bg-blue-400'   },
  slate:   { badge: 'bg-slate-100 text-slate-700',  card: 'bg-slate-50 border-slate-200',  border: 'border-slate-300',  dot: 'bg-slate-400'  },
  amber:   { badge: 'bg-amber-100 text-amber-700',  card: 'bg-amber-50 border-amber-200',  border: 'border-amber-300',  dot: 'bg-amber-400'  },
  violet:  { badge: 'bg-violet-100 text-violet-700',card: 'bg-violet-50 border-violet-200',border: 'border-violet-300', dot: 'bg-violet-400' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', card: 'bg-emerald-50 border-emerald-200', border: 'border-emerald-300', dot: 'bg-emerald-400' },
};

function TrainingConfigModal({
  algorithmId,
  algorithmName,
  onClose,
}: {
  algorithmId: string;
  algorithmName: string;
  onClose: () => void;
}) {
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(BASE_MODELS[0].id);
  const [embeddingSpace, setEmbeddingSpace] = useState<EmbeddingSpace>('real');
  const [embeddingDim, setEmbeddingDim] = useState(256);
  const graphModels = graphModelsForAlgorithm(algorithmId);
  const [graphModelId, setGraphModelId] = useState(graphModels[0]?.id ?? 'transe');
  const graphModel = graphModels.find(m => m.id === graphModelId) ?? graphModels[0];

  const selectedModel = BASE_MODELS.find(m => m.id === selectedModelId) ?? BASE_MODELS[0];
  const modelColors = MODEL_COLOR[selectedModel.color];
  const showSpace = supportsEmbeddingSpace(algorithmId);
  const paramDim = embeddingSpace === 'complex' ? embeddingDim * 2 : embeddingDim;

  const nerDatasets = [
    {
      id: 'dataset-1',
      name: 'medical_entities_training.jsonl',
      records: 12500,
      size: '45.2 MB',
      type: '实体抽取',
      format: 'JSONL',
    },
    {
      id: 'dataset-2',
      name: 'relation_extraction_data.jsonl',
      records: 8300,
      size: '28.7 MB',
      type: '关系抽取',
      format: 'JSONL',
    },
    {
      id: 'dataset-3',
      name: 'tech_literature_entities.csv',
      records: 5600,
      size: '15.3 MB',
      type: '实体抽取',
      format: 'CSV',
    },
  ];
  const graphDatasets = [
    {
      id: 'dataset-5',
      name: 'graph_embedding_samples.txt',
      records: 35000,
      size: '102.5 MB',
      type: '图嵌入',
      format: 'TXT',
    },
    {
      id: 'dataset-11',
      name: 'knowledge_graph_structure.txt',
      records: 28000,
      size: '85.6 MB',
      type: '图嵌入',
      format: 'TXT',
    },
    {
      id: 'dataset-fb15k',
      name: 'FB15k-237_triples.txt',
      records: 310116,
      size: '24.1 MB',
      type: '知识图谱三元组',
      format: 'TXT',
    },
  ];
  const datasets = showSpace ? graphDatasets : nerDatasets;

  const selectedDatasetInfo = datasets.find((d) => d.id === selectedDataset);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">发起训练 - {algorithmName}</h3>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

          {showSpace && (
            <div>
              <EmbeddingSpaceSelector
                value={embeddingSpace}
                onChange={setEmbeddingSpace}
              />
              <p className="mt-2 text-xs text-gray-500">
                当前选择：{embeddingSpaceLabel(embeddingSpace)} · 配置维度 {embeddingDim}d
                {embeddingSpace === 'complex' ? `（实部+虚部，实际参数维度 ${paramDim}）` : ''}
              </p>
              {graphModel?.space === 'complex' && embeddingSpace === 'real' && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {graphModel.name} 依赖复数运算，请改选复数空间嵌入，否则无法完整建模反对称与互逆关系。
                </p>
              )}
            </div>
          )}

          {showSpace ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                编码 / 游走模型 <span className="text-red-500">*</span>
                <span className="ml-2 text-xs font-normal text-gray-400">
                  与表示空间一起决定本次训练的嵌入方案
                </span>
              </label>
              <select
                value={graphModelId}
                onChange={(e) => {
                  const next = e.target.value;
                  setGraphModelId(next);
                  const meta = GRAPH_KGE_MODELS.find(m => m.id === next);
                  if (meta?.space === 'complex') setEmbeddingSpace('complex');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-sm"
              >
                {graphModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — 推荐{m.space === 'complex' ? '复数空间' : '实数空间'}
                  </option>
                ))}
              </select>
              {graphModel && (
                <p className="mt-2 text-xs text-gray-500">{graphModel.desc}</p>
              )}
            </div>
          ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              基础模型 <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-normal text-gray-400">
                训练将以所选模型为底座进行微调
              </span>
            </label>
            <select
              value={selectedModelId}
              onChange={e => setSelectedModelId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-sm"
            >
              {BASE_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.params} 参数 · {m.provider}
                </option>
              ))}
            </select>

            {/* Selected model detail card */}
            <div className={`mt-3 p-4 rounded-xl border ${modelColors.card} ${modelColors.border}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${modelColors.dot} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-gray-900">{selectedModel.name}</span>
                    {selectedModel.tags.map(tag => (
                      <span key={tag} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${modelColors.badge}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{selectedModel.desc}</p>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span>提供方 <span className="font-medium text-gray-700">{selectedModel.provider}</span></span>
                    <span>参数量 <span className="font-medium text-gray-700">{selectedModel.params}</span></span>
                    <span>模型大小 <span className="font-medium text-gray-700">{selectedModel.size}</span></span>
                    <span>语言 <span className="font-medium text-gray-700">{selectedModel.language}</span></span>
                    <span>许可 <span className="font-medium text-gray-700">{selectedModel.license}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择训练数据集 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">请选择数据集</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.records.toLocaleString()}条, {dataset.size})
                </option>
              ))}
            </select>
            {selectedDatasetInfo && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>类型: <span className="text-gray-900 font-medium">{selectedDatasetInfo.type}</span></span>
                  <span>格式: <span className="text-gray-900 font-medium">{selectedDatasetInfo.format}</span></span>
                  <span>记录数: <span className="text-gray-900 font-medium">{selectedDatasetInfo.records.toLocaleString()}</span></span>
                  <span>大小: <span className="text-gray-900 font-medium">{selectedDatasetInfo.size}</span></span>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              未找到合适的数据集？<a href="#" className="text-blue-600 hover:underline">前往数据集管理上传</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型备注 <span className="text-xs text-gray-500">(可选)</span>
            </label>
            <textarea
              placeholder="例如：使用医疗数据集训练，针对长文本优化，实验性版本等..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="mt-1 text-xs text-gray-500">
              添加备注可以帮助您区分不同训练参数和数据集的模型版本
            </p>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">训练参数配置</h4>
            <div className="grid grid-cols-2 gap-4">
              {showSpace && (
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-gray-700">嵌入维度 (d)</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {embeddingDim}d
                      {embeddingSpace === 'complex' ? ` · 实际 ${paramDim}d` : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={64}
                    max={512}
                    step={64}
                    value={embeddingDim}
                    onChange={(e) => setEmbeddingDim(+e.target.value)}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>64</span><span>128</span><span>256</span><span>384</span><span>512</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-700 mb-1">训练轮数 (Epochs)</label>
                <input
                  type="number"
                  defaultValue={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">批次大小 (Batch Size)</label>
                <input
                  type="number"
                  defaultValue={32}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">学习率 (Learning Rate)</label>
                <input
                  type="text"
                  defaultValue="0.001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">优化器</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="adam">Adam</option>
                  <option value="sgd">SGD</option>
                  <option value="adamw">AdamW</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">验证集比例</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="0.1">10%</option>
                  <option value="0.2">20%</option>
                  <option value="0.3">30%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">早停轮数 (Early Stopping)</label>
                <input
                  type="number"
                  defaultValue={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">计算资源配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">GPU类型</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="v100">NVIDIA V100 (16GB)</option>
                  <option value="a100">NVIDIA A100 (40GB)</option>
                  <option value="t4">NVIDIA T4 (16GB)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">GPU数量</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-blue-600">💡</span>
              <div className="flex-1 text-sm text-blue-800">
                <div className="font-medium mb-1">训练建议</div>
                <ul className="space-y-1 text-xs">
                  {showSpace ? (
                    <>
                      <li>• 实数空间适合大多数同质图与平移模型，计算与显存开销更低</li>
                      <li>• 图谱含大量反对称、互逆关系时，优先选择复数空间（ComplEx / RotatE）</li>
                      <li>• 复数空间参数量约为实数空间的 2 倍，请相应提高 GPU 显存预算</li>
                      <li>• 切换表示空间后须重新训练，历史嵌入不可跨空间迁移</li>
                      <li>• 训练成功后，模型会自动保存到「模型版本」tab，可查看和部署</li>
                    </>
                  ) : (
                    <>
                      <li>• 建议使用至少5000条标注样本以获得较好效果</li>
                      <li>• 学习率过大可能导致训练不稳定，建议从0.001开始调整</li>
                      <li>• 开启早停可以防止过拟合，建议patience设置为3-5</li>
                      <li>• 建议添加备注说明此次训练的特点，方便后续区分不同版本的模型</li>
                      <li>• 训练成功后，模型会自动保存到"模型版本"tab，可查看和部署</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            开始训练
          </button>
        </div>
      </div>
    </div>
  );
}

function DeployConfigModal({ algorithmName, onClose }: { algorithmName: string; onClose: () => void }) {
  const [selectedModel, setSelectedModel] = useState('');

  // 模拟从模型管理获取可用模型
  const availableModels = [
    {
      id: 'MODEL_001',
      name: 'bert-lstm-crf-entity-v2.3.1',
      version: 'v2.3.1',
      f1: '92.5%',
      trainDate: '2026-04-19',
      modelSize: '428 MB',
    },
    {
      id: 'MODEL_006',
      name: 'bert-lstm-crf-entity-v2.3.0',
      version: 'v2.3.0',
      f1: '91.8%',
      trainDate: '2026-04-08',
      modelSize: '428 MB',
    },
    {
      id: 'MODEL_003',
      name: 'lstm-crf-entity-v2.1.5',
      version: 'v2.1.5',
      f1: '86.7%',
      trainDate: '2026-04-15',
      modelSize: '156 MB',
    },
  ];

  const selectedModelInfo = availableModels.find((m) => m.id === selectedModel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-2/3 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">发起部署 - {algorithmName}</h3>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择模型 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">请选择要部署的模型</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - F1: {model.f1} (训练于 {model.trainDate})
                </option>
              ))}
            </select>
            {selectedModelInfo && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-blue-700">模型版本:</span>
                    <span className="ml-2 text-blue-900 font-medium">{selectedModelInfo.version}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">F1-Score:</span>
                    <span className="ml-2 text-blue-900 font-medium">{selectedModelInfo.f1}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">训练日期:</span>
                    <span className="ml-2 text-blue-900 font-medium">{selectedModelInfo.trainDate}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">模型大小:</span>
                    <span className="ml-2 text-blue-900 font-medium">{selectedModelInfo.modelSize}</span>
                  </div>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              模型列表来自<a href="#" className="text-blue-600 hover:underline">模型管理</a>，包含所有已训练完成的模型
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例如: entity-extraction-service"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">部署配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">计算资源</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="cpu">CPU (2C4G)</option>
                  <option value="gpu-small">GPU - T4 (4C8G)</option>
                  <option value="gpu-large">GPU - V100 (8C16G)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">副本数量</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="1">1个副本</option>
                  <option value="2">2个副本 (推荐)</option>
                  <option value="3">3个副本</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">最大并发数</label>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">请求超时 (秒)</label>
                <input
                  type="number"
                  defaultValue={30}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">自动扩缩容</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">启用自动扩缩容</span>
              </label>
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">最小副本数</label>
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">最大副本数</label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-green-600">✓</span>
              <div className="flex-1 text-sm text-green-800">
                <div className="font-medium mb-1">部署说明</div>
                <ul className="space-y-1 text-xs">
                  <li>• 只能部署已训练完成的模型，所有可用模型列表来自模型管理</li>
                  <li>• 部署完成后将自动生成API接口地址，可在任务管理查看部署状态</li>
                  <li>• 建议至少部署2个副本以保证服务高可用</li>
                  <li>• GPU资源适合高并发场景，CPU适合低频调用</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            开始部署
          </button>
        </div>
      </div>
    </div>
  );
}

function ModelsTab({ algorithmId, algorithmName }: { algorithmId: string; algorithmName: string }) {
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  // 模拟该算法的所有训练模型版本
  const models = [
    {
      id: 'MODEL_001',
      name: 'bert-lstm-crf-entity-v2.3.1',
      version: 'v2.3.1',
      trainDate: '2026-04-19 11:30:00',
      trainTaskId: 'TRAIN_20260419_001',
      dataset: 'medical_entities_training.jsonl',
      remark: '使用医疗领域数据集训练，针对疾病、药物、症状实体识别优化',
      performance: {
        f1: '92.5%',
        precision: '93.2%',
        recall: '91.8%',
      },
      modelSize: '428 MB',
      status: 'deployed',
      deployCount: 2,
      lastDeployDate: '2026-04-19 12:00:00',
    },
    {
      id: 'MODEL_006',
      name: 'bert-lstm-crf-entity-v2.3.0',
      version: 'v2.3.0',
      trainDate: '2026-04-08 15:45:00',
      trainTaskId: 'TRAIN_20260408_006',
      dataset: 'medical_entities_training.jsonl',
      remark: '基线版本，使用默认参数训练',
      performance: {
        f1: '91.8%',
        precision: '92.5%',
        recall: '91.1%',
      },
      modelSize: '428 MB',
      status: 'ready',
      deployCount: 5,
      lastDeployDate: '2026-04-15 10:00:00',
    },
    {
      id: 'MODEL_009',
      name: 'bert-lstm-crf-entity-v2.2.8',
      version: 'v2.2.8',
      trainDate: '2026-03-25 09:20:00',
      trainTaskId: 'TRAIN_20260325_009',
      dataset: 'tech_literature_entities.csv',
      remark: '科技文献专用版本，针对方法名、领域术语识别优化',
      performance: {
        f1: '90.3%',
        precision: '91.0%',
        recall: '89.6%',
      },
      modelSize: '425 MB',
      status: 'ready',
      deployCount: 1,
      lastDeployDate: '2026-03-26 14:00:00',
    },
  ];

  const handleDeploy = (model: any) => {
    setSelectedModel(model);
    setShowDeployModal(true);
  };

  const handleViewDetail = (model: any) => {
    setSelectedModel(model);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-700';
      case 'ready':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'deployed':
        return '已部署';
      case 'ready':
        return '就绪';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">模型版本列表</h3>
          <p className="text-sm text-gray-600 mt-1">共 {models.length} 个训练完成的模型版本</p>
        </div>
      </div>

      {models.length > 0 ? (
        <div className="space-y-3">
          {models.map((model) => (
            <div
              key={model.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">{model.version}</h4>
                      <span className={`px-2.5 py-0.5 text-xs rounded-full ${getStatusBadge(model.status)}`}>
                        {getStatusText(model.status)}
                      </span>
                    </div>
                    {model.remark && (
                      <div className="mb-2 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                        <span className="text-amber-700 font-medium">备注: </span>
                        {model.remark}
                      </div>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>训练于 {model.trainDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database className="w-4 h-4" />
                        <span>{model.modelSize}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>F1: {model.performance.f1}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <div className="text-xs">
                        <span className="text-gray-500">Precision:</span>
                        <span className="ml-1 text-gray-900 font-medium">{model.performance.precision}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Recall:</span>
                        <span className="ml-1 text-gray-900 font-medium">{model.performance.recall}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">部署次数:</span>
                        <span className="ml-1 text-gray-900 font-medium">{model.deployCount} 次</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>训练任务: {model.trainTaskId}</span>
                      <span>数据集: {model.dataset}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetail(model)}
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    详情
                  </button>
                  <button
                    onClick={() => handleDeploy(model)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Rocket className="w-4 h-4" />
                    部署
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
          暂无训练完成的模型版本
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex gap-2">
          <span className="text-blue-600">💡</span>
          <div className="flex-1 text-sm text-blue-800">
            <div className="font-medium mb-1">模型版本说明</div>
            <ul className="space-y-1 text-xs">
              <li>• 每次训练成功后会自动生成一个新的模型版本</li>
              <li>• 模型版本号根据训练参数和数据集自动递增</li>
              <li>• 训练时添加的备注会显示在模型列表中，帮助您快速识别不同版本的特点</li>
              <li>• 可以部署任意历史版本的模型，支持多版本并存</li>
              <li>• 建议定期清理不再使用的旧版本模型以节省存储空间</li>
            </ul>
          </div>
        </div>
      </div>

      {showDeployModal && selectedModel && (
        <DeployModelModal model={selectedModel} onClose={() => setShowDeployModal(false)} />
      )}

      {showDetailModal && selectedModel && (
        <ModelDetailModal model={selectedModel} onClose={() => setShowDetailModal(false)} />
      )}
    </div>
  );
}

function DeployModelModal({ model, onClose }: { model: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-2/3 max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">部署模型</h3>
          <p className="text-sm text-gray-600 mt-1">版本: {model.version}</p>
        </div>
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">模型信息</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700">模型版本:</span>
                <span className="ml-2 text-blue-900 font-medium">{model.version}</span>
              </div>
              <div>
                <span className="text-blue-700">F1-Score:</span>
                <span className="ml-2 text-blue-900 font-medium">{model.performance.f1}</span>
              </div>
              <div>
                <span className="text-blue-700">训练日期:</span>
                <span className="ml-2 text-blue-900 font-medium">{model.trainDate}</span>
              </div>
              <div>
                <span className="text-blue-700">模型大小:</span>
                <span className="ml-2 text-blue-900 font-medium">{model.modelSize}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例如: entity-extraction-service"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">部署配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">计算资源</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="cpu">CPU (2C4G)</option>
                  <option value="gpu-small">GPU - T4 (4C8G)</option>
                  <option value="gpu-large">GPU - V100 (8C16G)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">副本数量</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="1">1个副本</option>
                  <option value="2">2个副本 (推荐)</option>
                  <option value="3">3个副本</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            开始部署
          </button>
        </div>
      </div>
    </div>
  );
}

function ModelDetailModal({ model, onClose }: { model: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">模型详情</h3>
              <p className="text-sm text-gray-600 mt-1">{model.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {model.remark && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">模型备注</h4>
              <p className="text-sm text-amber-800">{model.remark}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">基本信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">模型ID:</span>
                  <span className="text-gray-900 font-medium">{model.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">模型版本:</span>
                  <span className="text-gray-900 font-medium">{model.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">模型大小:</span>
                  <span className="text-gray-900 font-medium">{model.modelSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">部署次数:</span>
                  <span className="text-gray-900 font-medium">{model.deployCount} 次</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">训练信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">训练时间:</span>
                  <span className="text-gray-900 font-medium text-xs">{model.trainDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">训练任务:</span>
                  <span className="text-gray-900 font-medium text-xs">{model.trainTaskId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">训练数据集:</span>
                  <span className="text-gray-900 font-medium text-xs">{model.dataset}</span>
                </div>
                {model.lastDeployDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">最近部署:</span>
                    <span className="text-gray-900 font-medium text-xs">{model.lastDeployDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="text-sm font-semibold text-green-900 mb-3">性能指标</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{model.performance.f1}</div>
                <div className="text-xs text-green-700 mt-1">F1-Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{model.performance.precision}</div>
                <div className="text-xs text-green-700 mt-1">Precision</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">{model.performance.recall}</div>
                <div className="text-xs text-green-700 mt-1">Recall</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            关闭
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            部署此模型
          </button>
        </div>
      </div>
    </div>
  );
}
