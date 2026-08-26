/**
 * 审计表「页面」列 → 原型路由 ID 映射（与开发进度记录表.xlsx 列 I 对齐）
 */
export const AUDIT_PAGE_MAP: Record<string, string> = {
  '图谱构造引擎/数据源管理': 'kg-datasource',
  '图谱构造引擎/数据源管理/种子实例': 'kg-datasource',
  '图谱构造引擎/数据源管理/种子实例输入': 'kg-datasource',
  '图谱构造引擎/数据源管理/种子集管理': 'kg-datasource',
  '种子实例输入': 'kg-datasource',
  '种子集管理': 'kg-datasource',
  '新实例发现/数据标注/文本高亮标注': 'text-highlight-seed',
  '文本高亮标注': 'text-highlight-seed',
  '图谱构造引擎/数据源管理/外部词典导入': 'kg-datasource',
  '图谱构造引擎/本体管理': 'kg-ontology',
  '知识图谱构造引擎/数据管理/本体管理': 'kg-ontology',
  '知识图谱构造引擎/本体管理/上下位关系预测': 'kg-ontology',
  '本体管理/标准数据模型/RDF模型': 'kg-ontology',
  '本体管理/标准数据模型/RDFS模型扩展': 'kg-ontology',
  '本体管理/标准数据模型/OWL模型扩展': 'kg-ontology',
  'RDF模型': 'kg-ontology',
  'RDFS模型扩展': 'kg-ontology',
  'OWL模型扩展': 'kg-ontology',
  '图谱构造引擎/图谱构造': 'graph-construction',
  '图谱构造引擎/图谱构造/规则配置': 'graph-construction',
  '图谱构造引擎/图谱构造/抽取任务配置': 'graph-construction',
  '图谱构造引擎/图谱构造/基于规则映射的抽取策略': 'graph-construction',
  '图谱构造引擎/图谱构造/策略配置': 'graph-construction',
  '图谱构造引擎/图谱构造/基于统计学习的抽取策略': 'graph-construction',
  '图谱构造引擎/图谱构造/策略配置/基于规则的识别': 'graph-construction',
  '图谱构造引擎/图谱构造/策略配置/基于机器学习的识别': 'graph-construction',
  '图谱构造引擎/图谱构造/策略配置/多策略融合识别': 'graph-construction',
  '图谱构造引擎/图谱构造/策略配置/基于词典的识别': 'graph-construction',
  '图谱构造引擎/图谱构造/策略配置/句法增强表示模块': 'graph-construction',
  '图谱构造引擎/图谱构造/自动化任务生成': 'graph-construction',
  '自动化任务生成': 'graph-construction',
  '图谱任务': 'graph-tasks',
  '任务调度与执行': 'graph-tasks',
  '图谱任务/实时执行监控': 'graph-tasks',
  '实时执行监控': 'graph-tasks',
  '图谱任务/任务日志与告警': 'graph-tasks',
  '任务日志与告警': 'graph-tasks',
  '实体识别/基于规则的识别': 'graph-construction',
  '实体识别/基于机器学习的识别': 'graph-construction',
  '实体识别/多策略融合识别': 'graph-construction',
  '实体识别/基于词典的识别': 'graph-construction',
  '图谱构造引擎/人工审核/种子术语审核': 'term-review',
  '知识图谱构造引擎/人工审核': 'human-review',
  '知识图谱构造引擎/人工审核/上下位关系审核': 'human-review',
  '知识图谱构造引擎/人工审核/识别管理': 'human-review',
  '知识图谱构造引擎/人工审核/识别结果管理': 'human-review',
  '知识图谱构造引擎/人工审核/识别结果管理/结果可视化与高亮': 'human-review',
  '知识图谱构造引擎/人工审核/识别结果管理/人工审核与修正界面': 'human-review',
  '知识图谱构造引擎/人工审核/识别结果管理/实体链接与消歧': 'human-review',
  '知识图谱构造引擎/人工审核/术语/事件优化': 'human-review',
  '知识图谱构造引擎/人工审核/术语/事件优化/事件审核与修正工作台': 'human-review',
  '知识图谱构造引擎/人工审核/术语/事件优化/事件合并与指代消解': 'human-review',
  '知识图谱构造引擎/人工审核/用户标注与纠错': 'human-review',
  '知识图谱构造引擎/人工审核/用户标注与纠错/跨用户共识算法': 'human-review',
  '知识图谱构造引擎/人工审核/用户标注与纠错/知识可信度分层': 'human-review',
  '知识图谱构造引擎/人工审核/候选属性审核界面': 'human-review',
  '候选属性审核界面': 'human-review',
  '一键入库': 'human-review',
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取/事件触发词识别': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取/事件论元抽取': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/无监督算法发现': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/候选术语生成': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/候选术语生成/基于统计的扩展': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/候选术语生成/基于规则的扩展': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/候选术语生成/候选术语去重与合并': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/基于置信度图传播的术语排序': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/基于置信度图传播的术语排序/语义相似度图构建': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/基于置信度图传播的术语排序/置信度计算与排序': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/LAC': 'algorithm-list',
  '算法管理/算法仓库/抽取类算法/关系图注意网络': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/关系图注意网络/预训练模型管理': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/关系图注意网络/模型训练与微调': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/关系图注意网络/训练过程监控': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/依存关系图构建': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/依存关系图构建/句法分析任务管理': 'algorithm-detail',
  '算法管理/算法仓库/抽取类算法/依存关系图构建/结果抽样可视化': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/术语向量生成': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/术语向量生成/预训练模型选择': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/术语向量生成/模型领域微调': 'algorithm-detail',
  '算法仓库/计算类算法': 'algorithm-list',
  '算法任务/部署任务': 'algorithm-tasks',
  '算法任务/训练任务/查看日志': 'algorithm-tasks',
  '图谱应用中心/图谱可视化': 'graph-visualization',
  '图谱应用中心/图谱可视化/分析/路径溯源': 'graph-visualization',
  '图谱应用中心/应用中心': 'app-center',
  '知识图谱构造引擎/知识资产管理/知识搜索': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/检索输入': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/检索库': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/结果输出': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/文献列表筛选': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/深入对话': 'knowledge-search',
  '基于置信度图传播的术语排序/交互式审核与采纳': 'interactive-review-adoption',
  '子图生成/概念对共现索引': 'concept-cooccurrence-index',
  '上下位关系生成/批量预测任务': 'hypernym-generation-audit',
  '上下位关系生成/置信度阈值过滤': 'hypernym-generation-audit',
  '图谱构造引擎/本体管理/概念及属性管理': 'kg-ontology',
  '图谱构造引擎/本体管理/概念及属性管理/属性定义与编辑': 'kg-ontology',
  '图谱构造引擎/本体管理/概念及属性管理/概念属性关联': 'kg-ontology',
  '图谱构造引擎/本体管理/概念及属性管理/属性层级管理': 'kg-ontology',
  '图谱构造引擎/本体管理/概念及属性管理/属性继承与查看': 'kg-ontology',
  '数据概览/属性管理': 'kg-ontology',
  '图谱构造引擎/规则管理/可视化规则编辑器': 'rule-management',
  '图谱构造引擎/规则管理/规则文本编辑器': 'rule-management',
  '图谱构造引擎/规则管理/规则库管理': 'rule-management',
  '图谱构造引擎/规则管理/分类规则建模': 'rule-management',
  '图谱构造引擎/规则管理/属性值推断规则': 'rule-management',
  '图谱构造引擎/规则管理/数据质量约束定义': 'rule-management',
  '图谱构造引擎/规则管理/时序推理规则': 'rule-management',
  '图谱构造引擎/规则管理/时序推理规则引擎': 'rule-management',
  '图谱构造引擎/规则管理/规则断点与单步执行': 'rule-management',
  '图谱构造引擎/规则管理/规则单元测试框架': 'rule-management',
  '图谱构造引擎/规则管理/推理过程可视化': 'rule-management',
  '图谱构造引擎/规则管理/推理结果溯源': 'rule-management',
  '约束规则建模与校验/知识一致性自动校验': 'knowledge-consistency-validation',
  '规则执行与推理引擎集成/API集成接口': 'api-integration-inference',
  '时空建模/时序信息嵌入/时间实体识别与标准化': 'time-entity-normalization',
  '时空建模/时序关系依赖/时序关系抽取': 'temporal-relation-audit',
  '时空建模/时序关系依赖/时序依赖分析': 'temporal-relation-audit',
  '文献知识建模/多维度解析引擎/核心要素抽取': 'literature-multidim-parse',
  '文献知识建模/多维度解析引擎/实验步骤解析': 'literature-multidim-parse',
  '文献知识建模/多维度解析引擎/图表内容结构化': 'literature-multidim-parse',
  '文献知识建模/多维度解析引擎/数理模型解析': 'literature-multidim-parse',
  '专利知识建模/技术要素解构框架/权利要求深度解析': 'patent-technical-parse',
  '专利知识建模/技术要素解构框架/技术功效矩阵自动生成': 'patent-technical-parse',
  '专利知识建模/技术要素解构框架/专业内容语义化标注': 'patent-technical-parse',
  '专利知识建模/跨域知识融合/技术方案模块化拆解': 'patent-technical-parse',
  '事件知识学习/事件识别引擎接口/局部学习标注器': 'local-learning-annotator',
  '局部学习标注器': 'local-learning-annotator',
  '事件知识学习/引擎接口与管理/事件识别API': 'local-learning-annotator',
  '事件知识学习/引擎接口与管理/标注优化API': 'local-learning-annotator',
  '事件识别API': 'local-learning-annotator',
  '标注优化API': 'local-learning-annotator',
  '事件知识学习/事件识别管理/事件标注项目管理': 'event-annotation-mgmt',
  '事件知识学习/事件识别管理/模型训练与迭代': 'event-annotation-mgmt',
  '事件知识学习/事件识别管理/审核与入库工作流': 'event-ingest-workflow',
  '审核与入库工作流': 'event-ingest-workflow',
  '事件标注项目管理': 'event-annotation-mgmt',
  '模型训练与迭代': 'event-annotation-mgmt',
  '图谱任务/实例生成预览': 'graph-tasks',
  '实例生成预览': 'graph-tasks',
  '图谱任务/RDF三元组生成': 'graph-tasks',
  'RDF三元组生成': 'graph-tasks',
  '图谱任务/多格式结构化输出': 'graph-tasks',
  '多格式结构化输出': 'graph-tasks',
  '图谱任务/自定义图谱上传': 'graph-tasks',
  '自定义图谱上传': 'graph-tasks',
  '用户自定义图谱空间/自定义图谱上传': 'graph-tasks',
  '属性抽取与结构化输出/属性信息精确抽取': 'attribute-precise-extract',
  '属性信息精确抽取': 'attribute-precise-extract',
  '多格式文献解析模块/PDF解析': 'multi-format-lit-parse',
  '多格式文献解析模块/XML(JATS)解析': 'multi-format-lit-parse',
  '多格式文献解析模块/HTML解析': 'multi-format-lit-parse',
  'PDF解析': 'multi-format-lit-parse',
  'XML(JATS)解析': 'multi-format-lit-parse',
  'HTML解析': 'multi-format-lit-parse',
  '多模态内容识别与转写/图像识别与内容提取': 'multimodal-content-transcribe',
  '多模态内容识别与转写/表格结构还原': 'multimodal-content-transcribe',
  '多模态内容识别与转写/LaTeX公式转写': 'multimodal-content-transcribe',
  '多模态内容识别与转写/图注文中索引识别': 'multimodal-content-transcribe',
  '图像识别与内容提取': 'multimodal-content-transcribe',
  '表格结构还原': 'multimodal-content-transcribe',
  'LaTeX公式转写': 'multimodal-content-transcribe',
  '图注/文中索引识别': 'multimodal-content-transcribe',
  '图注文中索引识别': 'multimodal-content-transcribe',
  '大语言模型语义提炼/段落级摘要生成': 'llm-semantic-refine',
  '大语言模型语义提炼/关系语义提炼': 'llm-semantic-refine',
  '段落级摘要生成': 'llm-semantic-refine',
  '关系语义提炼': 'llm-semantic-refine',
  '科研核心元组抽取/抽取流程标准化': 'sci-core-tuple-extract',
  '科研核心元组抽取/方法-材料-性能-机制抽取': 'sci-core-tuple-extract',
  '抽取流程标准化': 'sci-core-tuple-extract',
  '方法-材料-性能-机制抽取': 'sci-core-tuple-extract',
  '标准化API服务/图谱查询API': 'standard-graph-api',
  '标准化API服务/路径检索API': 'standard-graph-api',
  '标准化API服务/语义匹配API': 'standard-graph-api',
  '图谱查询API': 'standard-graph-api',
  '路径检索API': 'standard-graph-api',
  '语义匹配API': 'standard-graph-api',
  '上层智能应用工具/图谱类比搜索工具': 'upper-intelligent-tools',
  '上层智能应用工具/科研问题生成工具': 'upper-intelligent-tools',
  '图谱类比搜索工具': 'upper-intelligent-tools',
  '科研问题生成工具': 'upper-intelligent-tools',
  '学术海报与音频概览生成/学术海报音频概览自动生成': 'academic-poster',
  '学术海报、音频概览自动生成': 'academic-poster',
  '学术海报与音频概览生成/一键生成笔记': 'academic-poster',
  '一键生成笔记': 'academic-poster',
  '多模态知识图谱相关数据集/数据集构建/数据导入与整合': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集构建/可视化构建向导': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集构建/数据集版本管理': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集分类/多维度标签分类': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集分类/数据集元数据管理': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集分类/分类目录与搜索': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集评估/统计特征自动评估': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集评估/数据质量与完整性报告': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集评估/评估基准对比': 'multimodal-dataset',
  '多模态知识图谱相关数据集/多模态完备表示/跨模态表示学习模型': 'multimodal-dataset',
  '多模态知识图谱相关数据集/多模态完备表示/统一语义空间映射': 'multimodal-dataset',
  '多模态知识图谱相关数据集/多模态完备表示/表示模型管理与训练': 'multimodal-dataset',
  '数据导入与整合': 'multimodal-dataset',
  '可视化构建向导': 'multimodal-dataset',
  '数据集版本管理': 'multimodal-dataset',
  '多维度标签分类': 'multimodal-dataset',
  '数据集元数据管理': 'multimodal-dataset',
  '分类目录与搜索': 'multimodal-dataset',
  '统计特征自动评估': 'multimodal-dataset',
  '数据质量与完整性报告': 'multimodal-dataset',
  '评估基准对比': 'multimodal-dataset',
  '跨模态表示学习模型': 'multimodal-dataset',
  '统一语义空间映射': 'multimodal-dataset',
  '表示模型管理与训练': 'multimodal-dataset',
  '多模态数据集管理/数据版本控制': 'multimodal-dataset',
  '多模态数据集管理/数据预处理与对齐工具': 'multimodal-dataset',
  '多模态数据集管理/高效数据存储与索引': 'multimodal-dataset',
  '数据版本控制': 'multimodal-dataset',
  '数据预处理与对齐工具': 'multimodal-dataset',
  '高效数据存储与索引': 'multimodal-dataset',
  '实例属性关系抽取/实体的属性提取接口/单实体属性查询API': 'entity-attr-api',
  '实例属性关系抽取/实体的属性提取接口/批量文档属性抽取API': 'entity-attr-api',
  '单实体属性查询API': 'entity-attr-api',
  '批量文档属性抽取API': 'entity-attr-api',
  '图谱构造引擎/映射管理/属性值标准化与清洗': 'kg-mapping',
  '属性值标准化与清洗': 'kg-mapping',
  '图谱构造引擎/映射配置解析与保存': 'kg-mapping',
  '图谱构造引擎/映射配置解析与保存/可视化映射规则配置': 'kg-mapping',
  '可视化映射规则配置': 'kg-mapping',
  '映射配置解析与保存': 'kg-mapping',
  '图谱构造引擎/映射配置解析与保存/转换函数支持': 'mapping-transform-fn',
  '转换函数支持': 'mapping-transform-fn',
};

/** 审计页面路径 → 算法详情 ID（直达 algorithm-detail） */
export const AUDIT_ALGORITHM_MAP: Record<string, string> = {
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取': 'term-event-rough',
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取/事件触发词识别': 'term-event-rough',
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取/事件论元抽取': 'term-event-rough',
  '算法管理/算法仓库/抽取类算法/无监督算法发现': 'seed-term-generation',
  '算法管理/算法仓库/抽取类算法/候选术语生成': 'candidate-term-generation',
  '算法管理/算法仓库/抽取类算法/候选术语生成/基于统计的扩展': 'candidate-term-generation',
  '算法管理/算法仓库/抽取类算法/候选术语生成/基于规则的扩展': 'candidate-term-generation',
  '算法管理/算法仓库/抽取类算法/候选术语生成/候选术语去重与合并': 'candidate-term-generation',
  '算法管理/算法仓库/知识推理/基于置信度图传播的术语排序': 'confidence-graph-term-ranking',
  '算法管理/算法仓库/知识推理/基于置信度图传播的术语排序/语义相似度图构建': 'confidence-graph-term-ranking',
  '算法管理/算法仓库/知识推理/基于置信度图传播的术语排序/置信度计算与排序': 'confidence-graph-term-ranking',
  '算法管理/算法仓库/抽取类算法/依存关系图构建': 'dependency-graph',
  '算法管理/算法仓库/抽取类算法/依存关系图构建/句法分析任务管理': 'dependency-graph',
  '算法管理/算法仓库/抽取类算法/依存关系图构建/结果抽样可视化': 'dependency-graph',
  '算法管理/算法仓库/抽取类算法/关系图注意网络': 'rgat-relation',
  '算法管理/算法仓库/抽取类算法/关系图注意网络/预训练模型管理': 'rgat-relation',
  '算法管理/算法仓库/抽取类算法/关系图注意网络/模型训练与微调': 'rgat-relation',
  '算法管理/算法仓库/抽取类算法/关系图注意网络/训练过程监控': 'rgat-relation',
  '算法管理/算法仓库/图嵌入/术语向量生成': 'term-vector',
  '算法管理/算法仓库/图嵌入/术语向量生成/预训练模型选择': 'term-vector',
  '算法管理/算法仓库/图嵌入/术语向量生成/模型领域微调': 'term-vector',
};

export type AuditAlgorithmDemoTab = 'statistical' | 'rule-based' | 'dedup-merge';

export type AuditAlgorithmTab = 'intro' | 'demo' | 'models' | 'training' | 'deployment';

export type GraphConstructionTab = 'data' | 'scope' | 'rules' | 'threshold';

export type GraphStrategyFocus = 'rule' | 'dict' | 'ml' | 'fusion' | 'syntax';

/** 本体管理：标准数据模型聚焦 */
export type OntologyModelFocus = 'rdf' | 'rdfs' | 'owl';

export function resolveOntologyModelFocus(pagePath: string | undefined): OntologyModelFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('OWL模型') || path.includes('OWL模型扩展')) return 'owl';
  if (path.includes('RDFS模型') || path.includes('RDFS模型扩展')) return 'rdfs';
  if (path.includes('RDF模型')) return 'rdf';
  return null;
}

/** 映射配置页：列表 / 可视化模式 */
export type MappingViewMode = 'list' | 'visual';

export function resolveMappingViewMode(pagePath: string | undefined): MappingViewMode | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('可视化映射规则配置')) return 'visual';
  if (path.includes('映射配置解析与保存') || path.includes('属性值标准化与清洗')) return 'list';
  return null;
}

export type RuleEditorMode = 'visual' | 'manual';

export type RuleCategoryFilter = '分类规则建模' | '属性值推断规则' | '数据质量约束定义' | '时序推理规则';

export type HumanReviewTab = 'kg-review' | 'seed-term' | 'hyponymy' | 'event-review' | 'conflict';

export type EventReviewSubTab = 'workbench' | 'merge';

export type RecognitionFocus = 'highlight' | 'review' | 'linking';

/** 识别结果管理：审计目录聚焦子模块 */
export function resolveRecognitionFocus(pagePath: string | undefined): RecognitionFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('结果可视化与高亮')) return 'highlight';
  if (path.includes('人工审核与修正界面')) return 'review';
  if (path.includes('实体链接与消歧')) return 'linking';
  return null;
}

export type TemporalAuditMode = 'extraction' | 'dependency';

export type LiteratureParseFocus = 'core' | 'experiment' | 'chart' | 'formula';

export type PatentParseFocus = 'claims' | 'matrix' | 'annotation' | 'modules';

export type LocalLearningTab = 'local' | 'event-api' | 'optimize-api';

export type EventAnnotationMgmtTab = 'projects' | 'training';

export type EntityAttrApiTab = 'single' | 'batch';

/** 实体属性提取 API 页：审计目录跳转 Tab */
export function resolveEntityAttrApiTab(pagePath: string | undefined): EntityAttrApiTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('批量文档属性抽取')) return 'batch';
  if (path.includes('单实体属性查询')) return 'single';
  return null;
}

/** 事件标注管理页：审计目录跳转 Tab */
export function resolveEventAnnotationMgmtTab(pagePath: string | undefined): EventAnnotationMgmtTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('模型训练与迭代')) return 'training';
  if (path.includes('事件标注项目管理')) return 'projects';
  return null;
}

/** 局部学习 / 事件 API 页：审计目录跳转 Tab */
export function resolveLocalLearningTab(pagePath: string | undefined): LocalLearningTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('标注优化API') || path.includes('标注优化 API')) return 'optimize-api';
  if (path.includes('事件识别API') || path.includes('事件识别 API')) return 'event-api';
  if (path.includes('局部学习标注器')) return 'local';
  return null;
}

/** 文献多维度解析：审计目录跳转到结果区块 */
export function resolveLiteratureParseFocus(pagePath: string | undefined): LiteratureParseFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('核心要素抽取')) return 'core';
  if (path.includes('实验步骤解析')) return 'experiment';
  if (path.includes('图表内容结构化')) return 'chart';
  if (path.includes('数理模型解析')) return 'formula';
  return null;
}

/** 多格式文献解析模块：PDF / JATS / HTML */
export type MultiFormatLitTab = 'pdf' | 'jats' | 'html';

export function resolveMultiFormatLitTab(pagePath: string | undefined): MultiFormatLitTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('XML') || path.includes('JATS')) return 'jats';
  if (path.includes('HTML')) return 'html';
  if (path.includes('PDF')) return 'pdf';
  return null;
}

/** 多模态内容识别与转写：聚焦结果区块 */
export type MultimodalTranscribeFocus = 'image' | 'table' | 'latex' | 'caption';

export function resolveMultimodalTranscribeFocus(
  pagePath: string | undefined,
): MultimodalTranscribeFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('图像识别')) return 'image';
  if (path.includes('表格结构')) return 'table';
  if (path.includes('LaTeX') || path.includes('公式转写')) return 'latex';
  if (path.includes('图注') || path.includes('索引识别')) return 'caption';
  return null;
}

/** 大语言模型语义提炼：聚焦摘要 / 关系 */
export type LlmSemanticFocus = 'summary' | 'relation';

export function resolveLlmSemanticFocus(pagePath: string | undefined): LlmSemanticFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('段落级摘要') || path.includes('摘要生成')) return 'summary';
  if (path.includes('关系语义') || path.includes('关系提炼')) return 'relation';
  return null;
}

/** 科研核心元组抽取：流程 / 四元组 */
export type SciCoreFocus = 'pipeline' | 'tuple';

export function resolveSciCoreFocus(pagePath: string | undefined): SciCoreFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('流程标准化') || path.includes('抽取流程')) return 'pipeline';
  if (path.includes('方法-材料') || path.includes('性能-机制') || path.includes('四元组')) return 'tuple';
  return null;
}

/** 标准化 API 服务：图谱查询 / 路径 / 语义匹配 */
export type StandardApiTab = 'query' | 'path' | 'semantic';

export function resolveStandardApiTab(pagePath: string | undefined): StandardApiTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('路径检索')) return 'path';
  if (path.includes('语义匹配')) return 'semantic';
  if (path.includes('图谱查询')) return 'query';
  return null;
}

/** 上层智能应用工具 */
export type UpperToolTab = 'analogy' | 'question';

export function resolveUpperToolTab(pagePath: string | undefined): UpperToolTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('类比搜索') || path.includes('类比查询')) return 'analogy';
  if (path.includes('科研问题') || path.includes('问题生成')) return 'question';
  return null;
}

/** 学术海报与音频：海报/音频 / 一键笔记 */
export type AcademicPosterTab = 'poster' | 'audio' | 'notes';

export function resolveAcademicPosterTab(pagePath: string | undefined): AcademicPosterTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('一键生成笔记') || path.includes('生成笔记')) return 'notes';
  if (path.includes('学术海报') || path.includes('音频概览')) return 'poster';
  return null;
}

/** 多模态数据集：审计目录跳转聚焦 */
export type MultimodalDatasetFocus =
  | 'import'
  | 'wizard'
  | 'version'
  | 'metadata-tags'
  | 'metadata-form'
  | 'catalog'
  | 'eval-stats'
  | 'eval-quality'
  | 'eval-benchmark'
  | 'representation'
  | 'preprocess'
  | 'index';

/** @deprecated 使用 MultimodalDatasetFocus */
export type MultimodalBuildFocus = MultimodalDatasetFocus;

export function resolveMultimodalDatasetFocus(
  pagePath: string | undefined,
): MultimodalDatasetFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('分类目录') || path.includes('目录与搜索')) return 'catalog';
  if (path.includes('多维度标签')) return 'metadata-tags';
  if (path.includes('元数据管理')) return 'metadata-form';
  if (path.includes('统计特征')) return 'eval-stats';
  if (path.includes('质量与完整性') || path.includes('完整性报告')) return 'eval-quality';
  if (path.includes('评估基准') || path.includes('基准对比')) return 'eval-benchmark';
  if (
    path.includes('跨模态表示') ||
    path.includes('统一语义') ||
    path.includes('表示模型') ||
    path.includes('完备表示')
  ) {
    return 'representation';
  }
  if (path.includes('预处理') || path.includes('对齐工具')) return 'preprocess';
  if (path.includes('存储与索引') || path.includes('高效数据')) return 'index';
  if (path.includes('版本管理') || path.includes('版本控制')) return 'version';
  if (path.includes('可视化构建') || path.includes('构建向导')) return 'wizard';
  if (path.includes('数据导入') || path.includes('导入与整合')) return 'import';
  return null;
}

export function resolveMultimodalBuildFocus(
  pagePath: string | undefined,
): MultimodalDatasetFocus | null {
  return resolveMultimodalDatasetFocus(pagePath);
}

/** 专利技术要素解构：审计目录跳转到结果区块 */
export function resolvePatentParseFocus(pagePath: string | undefined): PatentParseFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('权利要求深度解析')) return 'claims';
  if (path.includes('技术功效矩阵')) return 'matrix';
  if (path.includes('专业内容语义化标注')) return 'annotation';
  if (path.includes('技术方案模块化拆解')) return 'modules';
  return null;
}

/** 时序关系审计页：跳转到抽取或依赖分析模式 */
export function resolveTemporalAuditMode(pagePath: string | undefined): TemporalAuditMode | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('时序依赖分析')) return 'dependency';
  if (path.includes('时序关系抽取')) return 'extraction';
  return null;
}

/** 人工审核：审计目录跳转到指定顶部 Tab */
export function resolveHumanReviewTab(pagePath: string | undefined): HumanReviewTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('术语/事件优化') || path.includes('事件审核') || path.includes('事件合并') || path.includes('指代消解')) {
    return 'event-review';
  }
  if (path.includes('上下位关系')) return 'hyponymy';
  if (path.includes('种子术语')) return 'seed-term';
  if (path.includes('冲突管理') || path.includes('识别管理') || path.includes('识别结果管理') || path.includes('结果可视化与高亮') || path.includes('人工审核与修正界面') || path.includes('实体链接与消歧')) {
    return 'conflict';
  }
  if (path.includes('用户标注与纠错') || path.includes('跨用户共识算法') || path.includes('跨用户识别算法') || path.includes('知识可信度分层') || path.includes('候选属性审核') || path.includes('一键入库')) {
    return 'kg-review';
  }
  return null;
}

/** 用户标注与纠错：是否聚焦跨用户共识算法列 */
export function resolveKgReviewConsensusFocus(pagePath: string | undefined): boolean {
  const path = (pagePath ?? '').trim();
  return path.includes('跨用户共识算法') || path.includes('跨用户识别算法');
}

/** 术语/事件优化：审计目录跳转到子 Tab */
export function resolveEventReviewSubTab(pagePath: string | undefined): EventReviewSubTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('事件合并') || path.includes('指代消解')) return 'merge';
  if (path.includes('事件审核')) return 'workbench';
  return null;
}

/** 页面路径前缀兜底（列 I 为空或未录入精确路径时） */
const AUDIT_PAGE_PREFIX: Array<{ prefix: string; pageId: string }> = [
  { prefix: '图谱构造引擎/数据源', pageId: 'kg-datasource' },
  { prefix: '图谱构造引擎/本体', pageId: 'kg-ontology' },
  { prefix: '知识图谱构造引擎/数据管理/本体', pageId: 'kg-ontology' },
  { prefix: '图谱构造引擎/图谱构造', pageId: 'graph-construction' },
  { prefix: '图谱构造引擎/人工审核/种子', pageId: 'term-review' },
  { prefix: '知识图谱构造引擎/人工审核', pageId: 'human-review' },
  { prefix: '算法管理/算法仓库', pageId: 'algorithm-list' },
  { prefix: '算法仓库/', pageId: 'algorithm-list' },
  { prefix: '算法任务/', pageId: 'algorithm-tasks' },
  { prefix: '图谱应用中心/图谱可视化', pageId: 'graph-visualization' },
  { prefix: '图谱应用中心/应用中心', pageId: 'app-center' },
  { prefix: '知识图谱构造引擎/知识资产管理/知识搜索', pageId: 'knowledge-search' },
  { prefix: '数据概览/属性', pageId: 'kg-ontology' },
  { prefix: '图谱构造引擎/本体管理/概念及属性管理', pageId: 'kg-ontology' },
  { prefix: '图谱构造引擎/映射', pageId: 'kg-mapping' },
  { prefix: '映射配置解析与保存', pageId: 'kg-mapping' },
  { prefix: '图谱构造引擎/规则', pageId: 'rule-management' },
  { prefix: '图谱任务', pageId: 'graph-tasks' },
  { prefix: '图谱融合', pageId: 'graph-fusion' },
  { prefix: '多模态', pageId: 'multimodal-dataset' },
  { prefix: '应用中心', pageId: 'app-center' },
  { prefix: '演化分析', pageId: 'evolution-analysis' },
  { prefix: '垂直领域', pageId: 'vertical-domain-graph' },
  { prefix: '知识库', pageId: 'knowledge-base' },
  { prefix: 'API', pageId: 'api-keys' },
];

export function resolveAuditAlgorithmId(pagePath: string | undefined): string | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (AUDIT_ALGORITHM_MAP[path]) return AUDIT_ALGORITHM_MAP[path];
  if (path.includes('无监督算法发现')) return 'seed-term-generation';
  if (path.includes('候选术语生成') || path.includes('基于统计的扩展') || path.includes('基于规则的扩展') || path.includes('候选术语去重与合并')) {
    return 'candidate-term-generation';
  }
  if (path.includes('置信度图传播') || path.includes('语义相似度图构建') || path.includes('置信度计算与排序')) {
    if (path.includes('交互式审核')) return null;
    return 'confidence-graph-term-ranking';
  }
  if (path.includes('依存关系图构建')) {
    return 'dependency-graph';
  }
  if (path.includes('关系图注意网络') || path.includes('关系图注意力网络')) {
    return 'rgat-relation';
  }
  if (path.includes('术语/事件粗抽取') || path.includes('术语/事件粗提取')) {
    return 'term-event-rough';
  }
  if (path.includes('术语向量生成')) {
    return 'term-vector';
  }
  return null;
}

export function resolveAuditAlgorithmDemoTab(pagePath: string | undefined): AuditAlgorithmDemoTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('基于统计的扩展')) return 'statistical';
  if (path.includes('基于规则的扩展')) return 'rule-based';
  if (path.includes('候选术语去重与合并') || path.includes('去重与合并')) return 'dedup-merge';
  return null;
}

/** 依存关系图等：审计目录跳转到算法页时打开指定 Tab */
export function resolveAuditAlgorithmTab(pagePath: string | undefined): AuditAlgorithmTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('句法分析任务管理')) return 'deployment';
  if (path.includes('结果抽样可视化')) return 'demo';
  if (path.includes('依存关系图构建')) return 'intro';
  // 关系图注意网络：预训练 / 微调 / 监控均在「训练与监控」Tab
  if (path.includes('关系图注意网络') || path.includes('关系图注意力网络')) return 'demo';
  if (path.includes('术语/事件粗抽取') || path.includes('术语/事件粗提取')) return 'demo';
  if (path.includes('术语向量生成')) return 'demo';
  return null;
}

/** 图谱构造：审计目录跳转到指定配置 Tab */
export function resolveGraphConstructionTab(pagePath: string | undefined): GraphConstructionTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('抽取任务配置')) return 'data';
  if (path.includes('基于规则映射的抽取策略') || path.includes('规则配置')) return 'rules';
  if (
    path.includes('基于统计学习的抽取策略')
    || path.includes('策略配置')
    || path.includes('阈值策略')
    || path.includes('基于规则的识别')
    || path.includes('基于机器学习的识别')
    || path.includes('多策略融合识别')
    || path.includes('基于词典的识别')
    || path.includes('句法增强表示')
  ) return 'threshold';
  return null;
}

/** 图谱构造 · 策略配置：聚焦具体策略行 */
export function resolveGraphStrategyFocus(pagePath: string | undefined): GraphStrategyFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('句法增强表示')) return 'syntax';
  if (path.includes('多策略融合识别')) return 'fusion';
  if (path.includes('基于规则的识别')) return 'rule';
  if (path.includes('基于机器学习的识别')) return 'ml';
  if (path.includes('基于词典的识别')) return 'dict';
  return null;
}

export type RuleDrawerFocus = 'debug' | 'unit-test';

export type RuleListFocus = 'reasoning-chain' | 'reasoning-trace';

/** 演示用：优先展开含依赖链的推理记录 */
export const RULE_REASONING_DEMO_RULE_ID = 'R005';

/** 规则管理：审计目录跳转到新增规则编辑器模式 */
export function resolveRuleEditorMode(pagePath: string | undefined): RuleEditorMode | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('规则文本编辑器')) return 'manual';
  if (path.includes('可视化规则编辑器')) return 'visual';
  return null;
}

/** 规则管理：审计目录跳转到新增规则抽屉内的调试/测试区块 */
export function resolveRuleDrawerFocus(pagePath: string | undefined): RuleDrawerFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('规则断点与单步执行')) return 'debug';
  if (path.includes('规则单元测试框架')) return 'unit-test';
  return null;
}

/** 规则管理：审计目录跳转到规则列表内的推理可视化/溯源区块 */
export function resolveRuleListFocus(pagePath: string | undefined): RuleListFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('推理结果溯源')) return 'reasoning-trace';
  if (path.includes('推理过程可视化')) return 'reasoning-chain';
  return null;
}

/** 规则管理：审计目录跳转到规则类型筛选 */
export function resolveRuleCategoryFilter(pagePath: string | undefined): RuleCategoryFilter | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('分类规则建模')) return '分类规则建模';
  if (path.includes('属性值推断规则')) return '属性值推断规则';
  if (path.includes('数据质量约束定义')) return '数据质量约束定义';
  if (path.includes('时序推理规则')) return '时序推理规则';
  return null;
}

/** 图谱任务：审计目录跳转到仪表盘子 Tab / 日志区 / 结构化输出 / 自定义上传 */
export type GraphTasksDashTabFocus =
  | 'candidates'
  | 'monitor'
  | 'logs'
  | 'export-rdf'
  | 'export-formats'
  | 'custom-upload';

export function resolveGraphTasksDashTab(pagePath: string | undefined): GraphTasksDashTabFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('实例生成预览') || path.includes('候选预览')) return 'candidates';
  if (path.includes('任务日志与告警') || path.includes('执行日志')) return 'logs';
  if (path.includes('实时执行监控')) return 'monitor';
  if (path.includes('RDF三元组生成')) return 'export-rdf';
  if (path.includes('多格式结构化输出')) return 'export-formats';
  if (path.includes('自定义图谱上传')) return 'custom-upload';
  return null;
}

/** 图谱构造：聚焦自动化任务生成按钮 */
export function resolveGraphConstructionAutoTask(pagePath: string | undefined): boolean {
  const path = (pagePath ?? '').trim();
  return path.includes('自动化任务生成');
}

export function resolveAuditPageId(pagePath: string | undefined): string | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (AUDIT_PAGE_MAP[path]) return AUDIT_PAGE_MAP[path];
  if (resolveAuditAlgorithmId(path)) return 'algorithm-detail';
  for (const { prefix, pageId } of AUDIT_PAGE_PREFIX) {
    if (path.startsWith(prefix)) return pageId;
  }
  return null;
}
