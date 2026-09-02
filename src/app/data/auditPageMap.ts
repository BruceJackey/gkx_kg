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
  '算法管理/算法仓库/图嵌入/表示空间/实数空间嵌入': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/表示空间/复数空间嵌入': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/表示空间/空间类型选择与配置': 'algorithm-detail',
  '知识表示学习/表示空间/实数空间嵌入': 'algorithm-detail',
  '知识表示学习/表示空间/复数空间嵌入': 'algorithm-detail',
  '知识表示学习/表示空间/空间类型选择与配置': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/打分函数/基于距离的打分函数': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/打分函数/基于语义相似度的打分函数': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/打分函数/打分函数可视化解释': 'algorithm-detail',
  '知识表示学习/打分函数/基于距离的打分函数': 'algorithm-detail',
  '知识表示学习/打分函数/基于语义相似度的打分函数': 'algorithm-detail',
  '知识表示学习/打分函数/打分函数可视化解释': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/编码模型/平移距离模型库': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/编码模型/张量/矩阵分解模型库': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/编码模型/神经网络模型库': 'algorithm-detail',
  '算法管理/算法仓库/图嵌入/编码模型/模型选择与超参数配置': 'algorithm-detail',
  '知识表示学习/编码模型/平移距离模型库': 'algorithm-detail',
  '知识表示学习/编码模型/张量/矩阵分解模型库': 'algorithm-detail',
  '知识表示学习/编码模型/神经网络模型库': 'algorithm-detail',
  '知识表示学习/编码模型/模型选择与超参数配置': 'algorithm-detail',
  '知识相关性计算/基于监督学习的相似度计算/相似度样本标注工具': 'dataset-category-detail',
  '数据集管理/相似度计算数据集/相似度样本标注工具': 'dataset-category-detail',
  '知识相关性计算/基于监督学习的相似度计算/相似度模型训练': 'algorithm-detail',
  '知识相关性计算/基于监督学习的相似度计算/模型评估与发布': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/基于监督学习的相似度计算/相似度模型训练': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/基于监督学习的相似度计算/模型评估与发布': 'algorithm-detail',
  '知识相关性计算/快速图节点相似度计算/基于路径的算法': 'algorithm-detail',
  '知识相关性计算/快速图节点相似度计算/基于嵌入向量的算法': 'algorithm-detail',
  '知识相关性计算/快速图节点相似度计算/实时计算接口': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/快速图节点相似度计算/基于路径的算法': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/快速图节点相似度计算/基于嵌入向量的算法': 'algorithm-detail',
  '算法管理/算法仓库/知识推理/快速图节点相似度计算/实时计算接口': 'algorithm-detail',
  '知识相关性计算/关联强度量化/得分归一化': 'knowledge-graph-dashboard',
  '知识相关性计算/关联强度量化/强度等级划分': 'knowledge-graph-dashboard',
  '知识相关性计算/关联强度量化/量化结果可视化': 'knowledge-graph-dashboard',
  '知识图谱看板/关联强度量化': 'knowledge-graph-dashboard',
  '知识相关性计算/语义检索与推荐应用支持/应用调用监控': 'call-logs',
  '算法管理/算法仓库/知识推理/语义检索与推荐应用支持/应用调用监控': 'call-logs',
  '调用日志': 'call-logs',
  '知识推理模型/关系推理/基于规则的推理': 'relation-reasoning',
  '知识推理模型/关系推理/基于路径的推理': 'relation-reasoning',
  '知识推理模型/关系推理/推理结果审核': 'relation-reasoning',
  '算法管理/算法仓库/知识推理/关系推理/基于规则的推理': 'relation-reasoning',
  '算法管理/算法仓库/知识推理/关系推理/基于路径的推理': 'relation-reasoning',
  '算法管理/算法仓库/知识推理/关系推理/推理结果审核': 'relation-reasoning',
  '知识补全/大模型生成能力接口/多模型API集成': 'llm-api-integration',
  '知识补全/大模型生成能力接口/提示词工程模板': 'app-center',
  '知识补全/大模型生成能力接口/生成结果解析与格式化': 'app-center',
  '算法管理/算法仓库/知识补全/大模型生成能力接口/多模型API集成': 'llm-api-integration',
  '算法管理/算法仓库/知识补全/大模型生成能力接口/提示词工程模板': 'app-center',
  '算法管理/算法仓库/知识补全/大模型生成能力接口/生成结果解析与格式化': 'app-center',
  '知识补全/分层置信标注集管理/数据源置信度评级': 'dataset-category-detail',
  '知识补全/分层置信标注集管理/标注数据版本控制': 'dataset-category-detail',
  '知识补全/分层置信标注集管理/数据集构建与划分': 'dataset-category-detail',
  '数据集管理/分层置信标注集管理/数据源置信度评级': 'dataset-category-detail',
  '数据集管理/分层置信标注集管理/标注数据版本控制': 'dataset-category-detail',
  '数据集管理/分层置信标注集管理/数据集构建与划分': 'dataset-category-detail',
  '知识补全/多源人工验证数据反馈机制/人机协同审核队列': 'human-machine-review',
  '知识补全/多源人工验证数据反馈机制/反馈数据采集': 'human-machine-review',
  '知识补全/多源人工验证数据反馈机制/审核员一致性分析': 'human-machine-review',
  '知识补全/多源人工验证数据反馈机制/反馈数据闭环': 'human-machine-review',
  '算法仓库/计算类算法': 'algorithm-list',
  '算法任务/部署任务': 'algorithm-tasks',
  '算法任务/训练任务/查看日志': 'algorithm-tasks',
  '图谱应用中心/图谱可视化': 'graph-visualization',
  '图谱应用中心/图谱可视化/分析/路径溯源': 'graph-visualization',
  '图谱应用中心/图谱可视化/技术演进路径展示': 'graph-visualization',
  '图谱应用中心/图谱可视化/学派关联与学术交叉点分析': 'graph-visualization',
  '图谱应用中心/图谱可视化/动态主题追踪': 'graph-visualization',
  '图谱应用中心/应用中心': 'app-center',
  '图谱应用中心/应用中心/文献智能推荐': 'app-center',
  '图谱应用中心/应用中心/文献智能推荐/检索输入': 'app-center',
  '图谱应用中心/应用中心/文献智能推荐/检索库': 'app-center',
  '图谱应用中心/应用中心/文献智能推荐/检索结果': 'app-center',
  '图谱应用中心/应用中心/文献智能推荐/结果输出': 'app-center',
  '图谱应用中心/应用中心/文献智能推荐/大模型': 'app-center',
  '图谱应用/语义搜索/检索输入': 'app-center',
  '图谱应用/语义搜索/检索库': 'app-center',
  '图谱应用/语义搜索/检索结果': 'app-center',
  '图谱应用/语义搜索/结果输出': 'app-center',
  '图谱应用/语义搜索/大模型': 'app-center',
  '知识图谱构造引擎/知识资产管理/知识搜索': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/检索输入': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/检索库': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/结果输出': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/文献列表筛选': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/深入对话': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/检索结果': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/保存': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/多模态反向检索': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/知识搜索/跨资源混合检索': 'knowledge-search',
  '图谱应用/多模态语义检索与路径导航/多模态反向检索': 'knowledge-search',
  '图谱应用/多模态语义检索与路径导航/跨资源混合检索': 'knowledge-search',
  '多模态反向检索': 'knowledge-search',
  '跨资源混合检索': 'knowledge-search',
  '检索结果': 'knowledge-search',
  '知识图谱构造引擎/知识资产管理/属性管理': 'property-management',
  '知识图谱构造引擎/知识资产管理/属性管理/知识校验': 'property-management',
  '属性管理/知识校验': 'property-management',
  '知识图谱构造引擎/知识资产管理/属性管理/知识校验/结构校验/Schema约束规则定义': 'schema-constraint-rules',
  '知识图谱构造引擎/知识资产管理/属性管理/知识校验/结构校验/数据一致性自动扫描': 'data-consistency-scan',
  '知识图谱构造引擎/知识资产管理/属性管理/知识校验/结构校验/校验结果报告': 'validation-report',
  'Schema约束规则定义': 'schema-constraint-rules',
  '数据一致性自动扫描': 'data-consistency-scan',
  '校验结果报告': 'validation-report',
  '数据的统一建模与表示融合/基于对抗迁移学习的知识图谱补全/补全结果审核': 'completion-result-review',
  '基于对抗迁移学习的知识图谱补全/补全结果审核': 'completion-result-review',
  '补全结果审核': 'completion-result-review',
  '语义理解模型/实体定位/文本实体定位': 'text-entity-localization',
  '语义理解模型/实体定位/视觉实体定位': 'visual-entity-localization',
  '实体定位/文本实体定位': 'text-entity-localization',
  '实体定位/视觉实体定位': 'visual-entity-localization',
  '文本实体定位': 'text-entity-localization',
  '视觉实体定位': 'visual-entity-localization',
  '复杂多样的知识定位/概念定位/文本概念定位': 'text-concept-localization',
  '复杂多样的知识定位/概念定位/视觉概念定位': 'visual-concept-localization',
  '概念定位/文本概念定位': 'text-concept-localization',
  '概念定位/视觉概念定位': 'visual-concept-localization',
  '文本概念定位': 'text-concept-localization',
  '视觉概念定位': 'visual-concept-localization',
  '复杂多样的知识定位/关系定位/关系定位': 'relation-localization',
  '复杂多样的知识定位/关系定位/文本关系定位': 'text-relation-localization',
  '复杂多样的知识定位/关系定位/视觉关系定位': 'visual-relation-localization',
  '关系定位/关系定位': 'relation-localization',
  '关系定位/文本关系定位': 'text-relation-localization',
  '关系定位/视觉关系定位': 'visual-relation-localization',
  '文本关系定位': 'text-relation-localization',
  '视觉关系定位': 'visual-relation-localization',
  '关系定位': 'relation-localization',
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
  '条件驱动结果推理/高性能推理内核': 'high-performance-inference-kernel',
  '条件驱动结果推理/事实变更监听': 'fact-change-listening',
  '规则执行与推理引擎集成/推理任务管理': 'inference-task-management',
  '规则执行与推理引擎集成/API集成接口': 'api-integration-inference',
  '时空建模/时序信息嵌入/时间实体识别与标准化': 'time-entity-normalization',
  '时空建模/时序关系依赖/时序关系抽取': 'temporal-relation-audit',
  '时空建模/时序关系依赖/时序依赖分析': 'temporal-relation-audit',
  '时空建模/时序逻辑推理/未来状态预测': 'future-state-prediction',
  '文献知识建模/多维度解析引擎/核心要素抽取': 'literature-multidim-parse',
  '文献知识建模/多维度解析引擎/实验步骤解析': 'literature-multidim-parse',
  '文献知识建模/多维度解析引擎/图表内容结构化': 'literature-multidim-parse',
  '文献知识建模/多维度解析引擎/数理模型解析': 'literature-multidim-parse',
  '专利知识建模/技术要素解构框架/权利要求深度解析': 'patent-technical-parse',
  '专利知识建模/技术要素解构框架/技术功效矩阵自动生成': 'patent-technical-parse',
  '专利知识建模/技术要素解构框架/专业内容语义化标注': 'patent-technical-parse',
  '专利知识建模/跨域知识融合/技术方案模块化拆解': 'patent-module-decomposition',
  '专利知识建模/跨域知识融合/专利-文献自动匹配': 'patent-literature-match',
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
  '图谱任务/增量更新': 'graph-tasks',
  '知识存储/增量更新': 'graph-tasks',
  '增量更新': 'graph-tasks',
  '图谱增量更新': 'graph-tasks',
  '图谱任务/变更日志与版本回滚': 'graph-tasks',
  '变更日志与版本回滚': 'graph-tasks',
  '知识补全/知识图谱迭代修正/图谱增量更新': 'graph-tasks',
  '知识补全/知识图谱迭代修正/变更日志与版本回滚': 'graph-tasks',
  '知识补全/知识图谱迭代修正/已验证知识写入模块': 'verified-knowledge-write',
  '已验证知识写入模块': 'verified-knowledge-write',
  '图谱融合/逻辑关系构建': 'graph-fusion',
  '图谱融合/模糊关系构建': 'graph-fusion',
  '图谱融合/关系可视化': 'graph-fusion',
  '逻辑关系构建': 'graph-fusion',
  '模糊关系构建': 'graph-fusion',
  '关系可视化': 'graph-fusion',
  '跨本体实体模糊关系与逻辑关系构建/逻辑关系构建': 'graph-fusion',
  '跨本体实体模糊关系与逻辑关系构建/模糊关系构建': 'graph-fusion',
  '跨本体实体模糊关系与逻辑关系构建/关系可视化': 'graph-fusion',
  '图谱融合/智能匹配推荐': 'graph-fusion',
  '图谱融合/人工审核与反馈': 'graph-fusion',
  '智能匹配推荐': 'graph-fusion',
  '人工审核与反馈': 'graph-fusion',
  '本体匹配关系智能构建/智能匹配推荐': 'graph-fusion',
  '本体匹配关系智能构建/人工审核与反馈': 'graph-fusion',
  '图谱融合/本体子集选择': 'graph-fusion',
  '图谱融合/核心概念定义': 'graph-fusion',
  '图谱融合/可视化流程画布': 'graph-fusion',
  '本体子集选择': 'graph-fusion',
  '核心概念定义': 'graph-fusion',
  '可视化流程画布': 'graph-fusion',
  '本体匹配主体/本体子集选择': 'graph-fusion',
  '本体匹配主体/核心概念定义': 'graph-fusion',
  '本体匹配流程组件/可视化流程画布': 'graph-fusion',
  '图谱融合/原子组件库': 'graph-fusion',
  '图谱融合/流程模板管理': 'graph-fusion',
  '原子组件库': 'graph-fusion',
  '流程模板管理': 'graph-fusion',
  '流程模版管理': 'graph-fusion',
  '本体匹配流程组件/原子组件库': 'graph-fusion',
  '本体匹配流程组件/流程模板管理': 'graph-fusion',
  '本体匹配流程组件/流程模版管理': 'graph-fusion',
  '图谱融合/策略权重配置': 'graph-fusion',
  '图谱融合/结果投票与排序': 'graph-fusion',
  '图谱融合/多策略融合匹配': 'graph-fusion',
  '策略权重配置': 'graph-fusion',
  '结果投票与排序': 'graph-fusion',
  '多策略融合匹配': 'graph-fusion',
  '多策略融合匹配/策略权重配置': 'graph-fusion',
  '多策略融合匹配/结果投票与排序': 'graph-fusion',
  '图谱融合/三元组生成': 'graph-fusion',
  '图谱融合/冲突检测': 'graph-fusion',
  '三元组生成': 'graph-fusion',
  '冲突检测': 'graph-fusion',
  '文本实体识别/命名实体识别': 'text-entity-recognition',
  '文本实体识别/实体边界修正': 'text-entity-recognition',
  '文本实体识别/命名体识别': 'text-entity-recognition',
  '命名实体识别': 'text-entity-recognition',
  '命名体识别': 'text-entity-recognition',
  '实体边界修正': 'text-entity-recognition',
  '实体链接判断/上下文语义分析': 'entity-link-judgment',
  '实体链接判断/模型': 'entity-link-judgment',
  '上下文语义分析': 'entity-link-judgment',
  '链接标注与映射生成/人工标注工作台': 'link-annotation-mapping',
  '链接标注与映射生成/映射规则生成': 'link-annotation-mapping',
  '人工标注工作台': 'link-annotation-mapping',
  '映射规则生成': 'link-annotation-mapping',
  '文档实体高亮与交互展示/实体高亮': 'literature-reader',
  '文档实体高亮与交互展示/实体信息浮窗': 'literature-reader',
  '知识库/文档阅读器/实体高亮': 'literature-reader',
  '知识库/文档阅读器/实体信息浮窗': 'literature-reader',
  '实体高亮': 'literature-reader',
  '实体信息浮窗': 'literature-reader',
  '跨语言实例匹配/跨语言词向量匹配': 'cross-lingual-instance-matching',
  '跨语言实例匹配/翻译服务集成': 'cross-lingual-instance-matching',
  '跨语言词向量匹配': 'cross-lingual-instance-matching',
  '翻译服务集成': 'cross-lingual-instance-matching',
  '查询驱动的实例匹配/查询意图翻译': 'cross-lingual-query-fusion',
  '查询驱动的实例匹配/跨库结果融合': 'cross-lingual-query-fusion',
  '查询意图翻译': 'cross-lingual-query-fusion',
  '跨库结果融合': 'cross-lingual-query-fusion',
  '跨语言属性对齐/属性名称翻译与匹配': 'cross-lingual-attribute-alignment',
  '跨语言属性对齐/基于实例值的属性对齐': 'cross-lingual-attribute-alignment',
  '属性名称翻译与匹配': 'cross-lingual-attribute-alignment',
  '基于实例值的属性对齐': 'cross-lingual-attribute-alignment',
  '跨语言知识库生成与对齐/批量对齐任务管理': 'cross-lingual-kb-alignment',
  '跨语言知识库生成与对齐/对齐结果存储': 'cross-lingual-kb-alignment',
  '批量对齐任务管理': 'cross-lingual-kb-alignment',
  '对齐结果存储': 'cross-lingual-kb-alignment',
  '数据语义链接/语义关联与消歧/批量实体链接': 'kg-mapping',
  '语义关联与消歧/批量实体链接': 'kg-mapping',
  '批量实体链接': 'kg-mapping',
  '图谱构造引擎/映射配置解析与保存/批量实体链接': 'kg-mapping',
  '实体匹配消歧/候选实体列表': 'entity-matching-disambiguation',
  '实体匹配消歧/人工裁决界面': 'entity-matching-disambiguation',
  '候选实体列表': 'entity-matching-disambiguation',
  '人工裁决界面': 'entity-matching-disambiguation',
  '文本实例匹配/字符串相似度匹配': 'text-instance-matching',
  '文本实例匹配/文本向量相似度匹配': 'text-instance-matching',
  '字符串相似度匹配': 'text-instance-matching',
  '文本向量相似度匹配': 'text-instance-matching',
  '结构实例匹配/邻居节点相似性分析': 'structure-instance-matching',
  '结构实例匹配/关系路径模式匹配': 'structure-instance-matching',
  '邻居节点相似性分析': 'structure-instance-matching',
  '关系路径模式匹配': 'structure-instance-matching',
  '机器学习实例匹配/特征工程': 'instance-feature-engineering',
  '特征工程': 'instance-feature-engineering',
  '候选实体生成/索引与召回': 'candidate-entity-generation',
  '候选实体生成/候选实体排序': 'candidate-entity-generation',
  '索引与召回': 'candidate-entity-generation',
  '候选实体排序': 'candidate-entity-generation',
  '候选实体生成': 'candidate-entity-generation',
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
  '学术海报与音频概览生成/学术海报生成': 'academic-poster',
  '学术海报与音频概览生成/音频概览生成': 'academic-poster',
  '学术海报、音频概览自动生成': 'academic-poster',
  '知识库/文档阅读器/一键生成笔记': 'literature-reader',
  '学术海报与音频概览生成/一键生成笔记': 'literature-reader',
  '一键生成笔记': 'literature-reader',
  '多模态知识图谱相关数据集/数据集构建/数据导入与整合': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集构建/可视化构建向导': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集构建/数据集版本管理': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集分类/多维度标签分类': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集分类/数据集元数据管理': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集分类/分类目录与搜索': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集评估/统计特征自动评估': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集评估/数据质量与完整性报告': 'multimodal-dataset',
  '多模态知识图谱相关数据集/数据集评估/评估基准对比': 'multimodal-dataset',
  '数据导入与整合': 'multimodal-dataset',
  '可视化构建向导': 'multimodal-dataset',
  '数据集版本管理': 'multimodal-dataset',
  '多维度标签分类': 'multimodal-dataset',
  '数据集元数据管理': 'multimodal-dataset',
  '分类目录与搜索': 'multimodal-dataset',
  '统计特征自动评估': 'multimodal-dataset',
  '数据质量与完整性报告': 'multimodal-dataset',
  '评估基准对比': 'multimodal-dataset',
  '多模态知识图谱相关数据集/多模态数据集管理/数据版本控制': 'multimodal-dataset',
  '多模态知识图谱相关数据集/多模态数据集管理/数据预处理与对齐工具': 'multimodal-dataset',
  '多模态知识图谱相关数据集/多模态数据集管理/高效数据存储与索引': 'multimodal-dataset',
  '多模态数据集管理/数据版本控制': 'multimodal-dataset',
  '多模态数据集管理/数据预处理与对齐工具': 'multimodal-dataset',
  '多模态数据集管理/高效数据存储与索引': 'multimodal-dataset',
  '数据版本控制': 'multimodal-dataset',
  '数据预处理与对齐工具': 'multimodal-dataset',
  '高效数据存储与索引': 'multimodal-dataset',
  '跨模态链接构建': 'multimodal-dataset',
  '关联关系推理与补全': 'multimodal-dataset',
  '多模态知识图谱相关数据集/知识点关联/跨模态链接构建': 'multimodal-dataset',
  '数据的统一建模与表示融合/知识点关联/跨模态链接构建': 'multimodal-dataset',
  '多模态知识图谱相关数据集/知识点关联/关联关系推理与补全': 'multimodal-dataset',
  '数据的统一建模与表示融合/知识点关联/关联关系推理与补全': 'multimodal-dataset',
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
  '算法管理/算法仓库/图嵌入/表示空间/实数空间嵌入': 'representation-space',
  '算法管理/算法仓库/图嵌入/表示空间/复数空间嵌入': 'representation-space',
  '算法管理/算法仓库/图嵌入/表示空间/空间类型选择与配置': 'representation-space',
  '知识表示学习/表示空间/实数空间嵌入': 'representation-space',
  '知识表示学习/表示空间/复数空间嵌入': 'representation-space',
  '知识表示学习/表示空间/空间类型选择与配置': 'representation-space',
  '算法管理/算法仓库/知识推理/打分函数/基于距离的打分函数': 'scoring-function',
  '算法管理/算法仓库/知识推理/打分函数/基于语义相似度的打分函数': 'scoring-function',
  '算法管理/算法仓库/知识推理/打分函数/打分函数可视化解释': 'scoring-function',
  '知识表示学习/打分函数/基于距离的打分函数': 'scoring-function',
  '知识表示学习/打分函数/基于语义相似度的打分函数': 'scoring-function',
  '知识表示学习/打分函数/打分函数可视化解释': 'scoring-function',
  '算法管理/算法仓库/图嵌入/编码模型/平移距离模型库': 'encoding-model',
  '算法管理/算法仓库/图嵌入/编码模型/张量/矩阵分解模型库': 'encoding-model',
  '算法管理/算法仓库/图嵌入/编码模型/神经网络模型库': 'encoding-model',
  '算法管理/算法仓库/图嵌入/编码模型/模型选择与超参数配置': 'encoding-model',
  '知识表示学习/编码模型/平移距离模型库': 'encoding-model',
  '知识表示学习/编码模型/张量/矩阵分解模型库': 'encoding-model',
  '知识表示学习/编码模型/神经网络模型库': 'encoding-model',
  '知识表示学习/编码模型/模型选择与超参数配置': 'encoding-model',
  '知识相关性计算/基于监督学习的相似度计算/相似度模型训练': 'supervised-similarity',
  '知识相关性计算/基于监督学习的相似度计算/模型评估与发布': 'supervised-similarity',
  '算法管理/算法仓库/知识推理/基于监督学习的相似度计算/相似度模型训练': 'supervised-similarity',
  '算法管理/算法仓库/知识推理/基于监督学习的相似度计算/模型评估与发布': 'supervised-similarity',
  '知识相关性计算/快速图节点相似度计算/基于路径的算法': 'node-similarity',
  '知识相关性计算/快速图节点相似度计算/基于嵌入向量的算法': 'node-similarity',
  '知识相关性计算/快速图节点相似度计算/实时计算接口': 'node-similarity',
  '算法管理/算法仓库/知识推理/快速图节点相似度计算/基于路径的算法': 'node-similarity',
  '算法管理/算法仓库/知识推理/快速图节点相似度计算/基于嵌入向量的算法': 'node-similarity',
  '算法管理/算法仓库/知识推理/快速图节点相似度计算/实时计算接口': 'node-similarity',
  '知识相关性计算/语义检索与推荐应用支持/语义检索服务接口': 'semantic-retrieval',
  '知识相关性计算/语义检索与推荐应用支持/推荐候选集生成接口': 'semantic-retrieval',
  '算法管理/算法仓库/知识推理/语义检索与推荐应用支持/语义检索服务接口': 'semantic-retrieval',
  '算法管理/算法仓库/知识推理/语义检索与推荐应用支持/推荐候选集生成接口': 'semantic-retrieval',
  '算法管理/算法仓库/图嵌入/多模态完备表示/跨模态表示学习模型': 'multimodal-representation',
  '算法管理/算法仓库/图嵌入/多模态完备表示/统一语义空间映射': 'multimodal-representation',
  '算法管理/算法仓库/图嵌入/多模态完备表示/表示模型管理与训练': 'multimodal-representation',
  '多模态知识图谱相关数据集/多模态完备表示/跨模态表示学习模型': 'multimodal-representation',
  '多模态知识图谱相关数据集/多模态完备表示/统一语义空间映射': 'multimodal-representation',
  '多模态知识图谱相关数据集/多模态完备表示/表示模型管理与训练': 'multimodal-representation',
  '跨模态表示学习模型': 'multimodal-representation',
  '统一语义空间映射': 'multimodal-representation',
  '表示模型管理与训练': 'multimodal-representation',
  '算法管理/算法仓库/图嵌入/Open CLIP/关联关系学习': 'open-clip',
  '算法管理/算法仓库/图嵌入/Open CLIP/对比学习训练': 'open-clip',
  '数据的统一建模与表示融合/知识点关联/关联关系学习': 'open-clip',
  '关联关系学习': 'open-clip',
};

export type SemanticRetrievalFocus = 'retrieval' | 'recommendation';

export type MultimodalRepresentationFocus = 'models' | 'semantic-space' | 'model-mgmt';

/** 多模态完备表示：跨模态模型 / 统一语义空间 / 模型管理与训练聚焦 */
export function resolveMultimodalRepresentationFocus(
  pagePath: string | undefined,
): MultimodalRepresentationFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('跨模态表示学习模型') || path.includes('跨模态表示学习')) return 'models';
  if (path.includes('统一语义空间映射') || path.includes('统一语义空间')) return 'semantic-space';
  if (path.includes('表示模型管理与训练') || path.includes('模型管理与训练')) return 'model-mgmt';
  return null;
}

/** 语义检索与推荐应用：检索 API 或推荐 API 聚焦 */
export function resolveSemanticRetrievalFocus(pagePath: string | undefined): SemanticRetrievalFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('语义检索服务接口')) return 'retrieval';
  if (path.includes('推荐候选集生成接口')) return 'recommendation';
  return null;
}

export type CallLogsFocus = 'semantic-retrieval';

/** 调用日志：语义检索与推荐接口监控聚焦 */
export function resolveCallLogsFocus(pagePath: string | undefined): CallLogsFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('语义检索与推荐') || path.includes('应用调用监控')) return 'semantic-retrieval';
  return null;
}

export type AppCenterFocus =
  | 'prompt-template'
  | 'response-parse'
  | 'input'
  | 'corpus'
  | 'results'
  | 'output'
  | 'llm-model';

/** 应用中心：提示词模板 / 结果解析 / 文献智能推荐各区域聚焦 */
export function resolveAppCenterFocus(pagePath: string | undefined): AppCenterFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('大模型') && (path.includes('文献智能推荐') || path.includes('语义搜索'))) return 'llm-model';
  if (path.includes('提示词工程模板')) return 'prompt-template';
  if (path.includes('生成结果解析与格式化')) return 'response-parse';
  if (path.includes('检索输入')) return 'input';
  if (path.includes('检索库')) return 'corpus';
  if (path.includes('检索结果')) return 'results';
  if (path.includes('结果输出')) return 'output';
  return null;
}

/** 应用中心：打开对应助手（语义搜索 → 文献智能推荐） */
export function resolveAppCenterAssistantId(pagePath: string | undefined): string {
  const path = (pagePath ?? '').trim();
  if (!path) return 'kg-qa';
  if (
    path.includes('文献智能推荐') ||
    path.includes('语义搜索') ||
    (path.includes('检索输入') && path.includes('应用中心')) ||
    (path.includes('检索库') && path.includes('应用中心')) ||
    (path.includes('检索结果') && path.includes('应用中心')) ||
    (path.includes('结果输出') && path.includes('应用中心'))
  ) {
    return 'paper-recommendation';
  }
  return 'kg-qa';
}

export type RelationReasoningFocus = 'rule' | 'path' | 'review';

/** 关系推理页：规则 / 路径 / 审核队列聚焦 */
export function resolveRelationReasoningFocus(pagePath: string | undefined): RelationReasoningFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('基于规则的推理')) return 'rule';
  if (path.includes('基于路径的推理')) return 'path';
  if (path.includes('推理结果审核')) return 'review';
  return null;
}

export type HumanMachineReviewFocus = 'queue' | 'feedback-collection' | 'consensus' | 'feedback-loop';

/** 多源人工验证：审核队列 / 反馈采集 / 一致性分析 / 反馈闭环聚焦 */
export function resolveHumanMachineReviewFocus(pagePath: string | undefined): HumanMachineReviewFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('反馈数据闭环')) return 'feedback-loop';
  if (path.includes('审核员一致性分析')) return 'consensus';
  if (path.includes('反馈数据采集')) return 'feedback-collection';
  if (path.includes('人机协同审核队列')) return 'queue';
  return null;
}

export type KnowledgeSearchFocus =
  | 'input'
  | 'corpus'
  | 'results'
  | 'output'
  | 'filter'
  | 'chat'
  | 'save'
  | 'multimodal-reverse'
  | 'multimodal-hybrid';

/** 知识搜索页：检索输入 / 检索库 / 结果 / 筛选 / 对话等聚焦 */
export function resolveKnowledgeSearchFocus(pagePath: string | undefined): KnowledgeSearchFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('多模态反向检索')) return 'multimodal-reverse';
  if (path.includes('跨资源混合检索')) return 'multimodal-hybrid';
  if (path.includes('检索输入')) return 'input';
  if (path.includes('检索库')) return 'corpus';
  if (path.includes('检索结果')) return 'results';
  if (path.includes('结果输出')) return 'output';
  if (path.includes('文献列表筛选')) return 'filter';
  if (path.includes('深入对话')) return 'chat';
  if (path.includes('/保存') || path.endsWith('保存')) return 'save';
  return null;
}

export type PropertyManagementTab =
  | 'entity'
  | 'search'
  | 'add-relation'
  | 'delete-entity'
  | 'delete-relation'
  | 'validation'
  | 'stats'
  | 'timeseries';

export type PropertyManagementFocus =
  | 'fuzzy-search'
  | 'advanced-query'
  | 'relation-create'
  | 'relation-type'
  | 'relation-attrs'
  | 'entity-delete'
  | 'cascade-delete'
  | 'relation-select'
  | 'relation-delete-confirm'
  | 'schema-constraints'
  | 'consistency-scan'
  | 'validation-report'
  | 'value-distribution'
  | 'outlier-drill'
  | 'timeseries-curve'
  | 'anomaly-detect';

/** 属性管理：审计目录跳转到 Tab */
export function resolvePropertyManagementTab(pagePath: string | undefined): PropertyManagementTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('检索设置') || path.includes('实体模糊搜索') || path.includes('高级条件查询')) return 'search';
  if (path.includes('添加关键词关系') || path.includes('可视化关系') || path.includes('关系类型选择') || path.includes('关系属性编辑')) return 'add-relation';
  if (path.includes('删除关键词间关系') || path.includes('关系选择与定位') || path.includes('删除操作确认')) return 'delete-relation';
  if (path.includes('删除关键词') || path.includes('节点选择与删除') || path.includes('级联删除确认')) return 'delete-entity';
  if (path.includes('Schema约束规则定义')) return null;
  if (path.includes('数据一致性自动扫描')) return null;
  if (path.includes('校验结果报告')) return null;
  if (path.includes('结构校验') || path.includes('Schema约束') || path.includes('一致性自动扫描')) return 'validation';
  if (path.includes('图谱统计') || path.includes('属性值分布') || path.includes('异常点高亮')) return 'stats';
  if (path.includes('时序可视化') || path.includes('时序变化曲线') || path.includes('异常变化点')) return 'timeseries';
  if (path.includes('知识校验') || path.includes('属性管理')) return 'search';
  return null;
}

/** 属性管理：子区域聚焦 */
export function resolvePropertyManagementFocus(pagePath: string | undefined): PropertyManagementFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('实体模糊搜索')) return 'fuzzy-search';
  if (path.includes('高级条件查询')) return 'advanced-query';
  if (path.includes('可视化关系创建')) return 'relation-create';
  if (path.includes('关系类型选择')) return 'relation-type';
  if (path.includes('关系属性编辑')) return 'relation-attrs';
  if (path.includes('节点选择与删除')) return 'entity-delete';
  if (path.includes('级联删除确认')) return 'cascade-delete';
  if (path.includes('关系选择与定位')) return 'relation-select';
  if (path.includes('删除操作确认')) return 'relation-delete-confirm';
  if (path.includes('Schema约束规则定义')) return 'schema-constraints';
  if (path.includes('数据一致性自动扫描')) return 'consistency-scan';
  if (path.includes('校验结果报告')) return 'validation-report';
  if (path.includes('属性值分布分析')) return 'value-distribution';
  if (path.includes('异常点高亮')) return 'outlier-drill';
  if (path.includes('属性时序变化曲线')) return 'timeseries-curve';
  if (path.includes('异常变化点检测')) return 'anomaly-detect';
  return null;
}

export type NodeSimilarityFocus = 'path' | 'embedding' | 'api';

/** 快速图节点相似度：路径 / 嵌入 / 统一 API 接口聚焦 */
export function resolveNodeSimilarityFocus(pagePath: string | undefined): NodeSimilarityFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('基于路径的算法')) return 'path';
  if (path.includes('基于嵌入向量的算法')) return 'embedding';
  if (path.includes('实时计算接口')) return 'api';
  return null;
}

export type AssociationStrengthFocus = 'normalize' | 'threshold' | 'visualization';

/** 知识图谱看板 · 关联强度量化聚焦 */
export function resolveAssociationStrengthFocus(pagePath: string | undefined): AssociationStrengthFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('得分归一化')) return 'normalize';
  if (path.includes('强度等级划分')) return 'threshold';
  if (path.includes('量化结果可视化')) return 'visualization';
  return null;
}

export type DatasetCategoryTab = 'list' | 'confidence' | 'split' | 'annotation';

export type DatasetCategoryFocus = 'version-control';

/** 数据集分类页：审计目录跳转到指定分类 */
export function resolveDatasetCategoryId(pagePath: string | undefined): string | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('相似度样本标注工具') || path.includes('相似度计算数据集')) {
    return 'entity-similarity';
  }
  if (
    path.includes('分层置信标注集')
    || path.includes('数据源置信度评级')
    || path.includes('标注数据版本控制')
    || path.includes('数据集构建与划分')
  ) {
    return 'entity-extraction';
  }
  return null;
}

/** 数据集分类页：打开指定 Tab */
export function resolveDatasetCategoryTab(pagePath: string | undefined): DatasetCategoryTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('相似度样本标注工具')) return 'annotation';
  if (path.includes('数据源置信度评级')) return 'confidence';
  if (path.includes('标注数据版本控制')) return 'list';
  if (path.includes('数据集构建与划分')) return 'split';
  return null;
}

/** 数据集分类页：列表 Tab 内聚焦（如自动展开版本控制） */
export function resolveDatasetCategoryFocus(pagePath: string | undefined): DatasetCategoryFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('标注数据版本控制')) return 'version-control';
  return null;
}

export type SupervisedSimilarityFocus = 'train' | 'evaluate';

/** 监督相似度算法：训练或评估与发布 */
export function resolveSupervisedSimilarityFocus(pagePath: string | undefined): SupervisedSimilarityFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('相似度模型训练')) return 'train';
  if (path.includes('模型评估与发布')) return 'evaluate';
  return null;
}

export type EncodingModelFocus = 'translation' | 'decomposition' | 'neural' | 'config';

/** 编码模型算法：模型库分类聚焦或超参数配置（含发起训练） */
export function resolveEncodingModelFocus(pagePath: string | undefined): EncodingModelFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('平移距离模型库')) return 'translation';
  if (path.includes('张量/矩阵分解模型库') || path.includes('矩阵分解模型库')) return 'decomposition';
  if (path.includes('神经网络模型库')) return 'neural';
  if (path.includes('模型选择与超参数配置')) return 'config';
  return null;
}

export type ScoringFunctionFocus = 'distance' | 'similarity' | 'visualize';

/** 打分函数算法：审计目录聚焦距离 / 相似度 / 可视化解释 */
export function resolveScoringFunctionFocus(pagePath: string | undefined): ScoringFunctionFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('基于距离的打分函数')) return 'distance';
  if (path.includes('基于语义相似度的打分函数')) return 'similarity';
  if (path.includes('打分函数可视化解释')) return 'visualize';
  return null;
}

export type RepresentationSpaceFocus = 'real' | 'complex' | 'config';

/** 表示空间算法：审计目录聚焦实数 / 复数 / 配置界面 */
export function resolveRepresentationSpaceFocus(pagePath: string | undefined): RepresentationSpaceFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('实数空间嵌入')) return 'real';
  if (path.includes('复数空间嵌入')) return 'complex';
  if (path.includes('空间类型选择与配置')) return 'config';
  return null;
}

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
  if (path.includes('批量实体链接') || path.includes('映射配置解析与保存') || path.includes('属性值标准化与清洗')) return 'list';
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

/** 文本实体识别审计页聚焦 */
export function resolveTextEntityRecognitionFocus(pagePath: string | undefined): RecognitionFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('实体边界修正')) return 'review';
  if (path.includes('命名实体识别') || path.includes('命名体识别')) return 'highlight';
  return null;
}

export type EntityLinkJudgmentFocus = 'context' | 'model';

export function resolveEntityLinkJudgmentFocus(pagePath: string | undefined): EntityLinkJudgmentFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('上下文语义分析')) return 'context';
  if (path.endsWith('/模型') || path.includes('实体链接判断/模型')) return 'model';
  return null;
}

export type LinkAnnotationFocus = 'workbench' | 'mapping';

export function resolveLinkAnnotationFocus(pagePath: string | undefined): LinkAnnotationFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('映射规则生成')) return 'mapping';
  if (path.includes('人工标注工作台')) return 'workbench';
  return null;
}

export type LiteratureReaderFocus = 'highlight' | 'popup' | 'generate-notes';

export function resolveLiteratureReaderFocus(pagePath: string | undefined): LiteratureReaderFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('一键生成笔记') || path.includes('智能笔记')) return 'generate-notes';
  if (path.includes('实体信息浮窗')) return 'popup';
  if (path.includes('实体高亮')) return 'highlight';
  return null;
}

export type CrossLingualFocus = 'vector' | 'translate';

export function resolveCrossLingualFocus(pagePath: string | undefined): CrossLingualFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('翻译服务集成')) return 'translate';
  if (path.includes('跨语言词向量匹配')) return 'vector';
  return null;
}

export type CrossLingualQueryFocus = 'translate' | 'fusion';

export function resolveCrossLingualQueryFocus(pagePath: string | undefined): CrossLingualQueryFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('跨库结果融合')) return 'fusion';
  if (path.includes('查询意图翻译')) return 'translate';
  return null;
}

export type CrossLingualAttributeFocus = 'name' | 'value';

export function resolveCrossLingualAttributeFocus(pagePath: string | undefined): CrossLingualAttributeFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('基于实例值的属性对齐')) return 'value';
  if (path.includes('属性名称翻译与匹配')) return 'name';
  return null;
}

export type CrossLingualKbFocus = 'tasks' | 'storage';

export function resolveCrossLingualKbFocus(pagePath: string | undefined): CrossLingualKbFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('对齐结果存储')) return 'storage';
  if (path.includes('批量对齐任务管理')) return 'tasks';
  return null;
}

export type EntityMatchingDisambiguationFocus = 'adjudicate' | 'candidates';

export function resolveEntityMatchingDisambiguationFocus(
  pagePath: string | undefined,
): EntityMatchingDisambiguationFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('人工裁决界面')) return 'adjudicate';
  if (path.includes('候选实体列表')) return 'candidates';
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
  if (path.includes('音频概览') || path.includes('音频概览生成')) return 'audio';
  if (path.includes('学术海报') || path.includes('海报生成')) return 'poster';
  if (path.includes('学术海报音频概览自动生成')) return 'poster';
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
  | 'index'
  | 'cross-modal-link'
  | 'link-inference';

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
  if (path.includes('存储与索引') || path.includes('高效数据')) return 'index';
  if (path.includes('预处理') || path.includes('对齐工具')) return 'preprocess';
  if (path.includes('版本管理') || path.includes('版本控制')) return 'version';
  if (path.includes('可视化构建') || path.includes('构建向导')) return 'wizard';
  if (path.includes('数据导入') || path.includes('导入与整合')) return 'import';
  if (path.includes('跨模态链接构建') || path.includes('跨模态链接')) return 'cross-modal-link';
  if (path.includes('关联关系推理与补全') || path.includes('关联关系推理')) return 'link-inference';
  return null;
}

export function resolveMultimodalBuildFocus(
  pagePath: string | undefined,
): MultimodalDatasetFocus | null {
  return resolveMultimodalDatasetFocus(pagePath);
}

/** Open CLIP：审计跳转时自动启动对比学习训练演示 */
export function resolveOpenClipAutoStartTraining(pagePath: string | undefined): boolean {
  const path = (pagePath ?? '').trim();
  return path.includes('关联关系学习');
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

/** 图谱可视化底部模块：技术演进 / 学派关联 / 动态主题 */
export type GraphVizDockFocus = 'timeline' | 'schools' | 'topic';

export function resolveGraphVizDockFocus(pagePath: string | undefined): GraphVizDockFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('学派关联') || path.includes('学术交叉')) return 'schools';
  if (path.includes('动态主题追踪')) return 'topic';
  if (path.includes('技术演进路径') || path.includes('时间轴播放器')) return 'timeline';
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
  { prefix: '候选实体生成', pageId: 'candidate-entity-generation' },
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
  { prefix: '图谱应用中心/应用中心/文献智能推荐', pageId: 'app-center' },
  { prefix: '图谱应用/语义搜索', pageId: 'app-center' },
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
  { prefix: '多模态知识图谱相关数据集', pageId: 'multimodal-dataset' },
  { prefix: '多模态数据集管理', pageId: 'multimodal-dataset' },
  { prefix: '学术海报与音频概览生成', pageId: 'academic-poster' },
  { prefix: '知识图谱构造引擎/知识资产管理/属性管理', pageId: 'property-management' },
  { prefix: '属性管理/知识校验', pageId: 'property-management' },
  { prefix: '关联强度量化', pageId: 'knowledge-graph-dashboard' },
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
  if (
    path.includes('实数空间嵌入')
    || path.includes('复数空间嵌入')
    || (path.includes('表示空间') && path.includes('空间类型选择与配置'))
  ) {
    return 'representation-space';
  }
  if (
    path.includes('基于距离的打分函数')
    || path.includes('基于语义相似度的打分函数')
    || path.includes('打分函数可视化解释')
  ) {
    return 'scoring-function';
  }
  if (
    path.includes('平移距离模型库')
    || path.includes('张量/矩阵分解模型库')
    || path.includes('矩阵分解模型库')
    || path.includes('神经网络模型库')
    || path.includes('模型选择与超参数配置')
  ) {
    return 'encoding-model';
  }
  if (path.includes('相似度模型训练') || path.includes('模型评估与发布')) {
    return 'supervised-similarity';
  }
  if (
    path.includes('基于路径的算法')
    || path.includes('基于嵌入向量的算法')
    || path.includes('实时计算接口')
  ) {
    return 'node-similarity';
  }
  if (path.includes('语义检索服务接口') || path.includes('推荐候选集生成接口')) {
    return 'semantic-retrieval';
  }
  if (
    path.includes('多模态完备表示')
    || path.includes('跨模态表示学习模型')
    || path.includes('统一语义空间映射')
    || (path.includes('表示模型管理与训练') && !path.includes('数据集'))
  ) {
    return 'multimodal-representation';
  }
  if (path.includes('关联关系学习') || (path.includes('Open CLIP') && path.includes('对比学习'))) {
    return 'open-clip';
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
  if (
    path.includes('实数空间嵌入')
    || path.includes('复数空间嵌入')
    || (path.includes('表示空间') && path.includes('空间类型选择与配置'))
  ) {
    return 'demo';
  }
  if (
    path.includes('基于距离的打分函数')
    || path.includes('基于语义相似度的打分函数')
    || path.includes('打分函数可视化解释')
  ) {
    return 'demo';
  }
  if (
    path.includes('平移距离模型库')
    || path.includes('张量/矩阵分解模型库')
    || path.includes('矩阵分解模型库')
    || path.includes('神经网络模型库')
    || path.includes('模型选择与超参数配置')
  ) {
    return 'demo';
  }
  if (path.includes('相似度模型训练') || path.includes('模型评估与发布')) {
    return 'demo';
  }
  if (
    path.includes('基于路径的算法')
    || path.includes('基于嵌入向量的算法')
    || path.includes('实时计算接口')
  ) {
    return 'demo';
  }
  if (path.includes('语义检索服务接口') || path.includes('推荐候选集生成接口')) {
    return 'demo';
  }
  if (
    path.includes('多模态完备表示')
    || path.includes('跨模态表示学习模型')
    || path.includes('统一语义空间映射')
    || path.includes('表示模型管理与训练')
  ) {
    return 'demo';
  }
  if (path.includes('关联关系学习') || path.includes('Open CLIP')) {
    return 'demo';
  }
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
  | 'custom-upload'
  | 'incremental-update'
  | 'version-rollback';

export function resolveGraphTasksDashTab(pagePath: string | undefined): GraphTasksDashTabFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('变更日志') || path.includes('版本回滚')) return 'version-rollback';
  if (path.includes('增量更新') || path.includes('图谱增量更新')) return 'incremental-update';
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

/** 图谱融合：逻辑/模糊/可视化/智能推荐/人工审核/子集/核心概念/流程画布/原子组件/模板 */
export type GraphFusionFocus =
  | 'logic'
  | 'fuzzy'
  | 'viz'
  | 'smart'
  | 'review'
  | 'subset'
  | 'core'
  | 'canvas'
  | 'atoms'
  | 'templates'
  | 'fusion'
  | 'fusion-weight'
  | 'fusion-vote'
  | 'triple-gen'
  | 'conflict-detect';

export function resolveGraphFusionFocus(pagePath: string | undefined): GraphFusionFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('智能匹配推荐')) return 'smart';
  if (path.includes('人工审核与反馈')) return 'review';
  if (path.includes('本体子集选择')) return 'subset';
  if (path.includes('核心概念定义')) return 'core';
  if (path.includes('可视化流程画布')) return 'canvas';
  if (path.includes('原子组件库')) return 'atoms';
  if (path.includes('流程模板管理') || path.includes('流程模版管理')) return 'templates';
  if (path.includes('策略权重配置')) return 'fusion-weight';
  if (path.includes('结果投票与排序')) return 'fusion-vote';
  if (path.includes('三元组生成')) return 'triple-gen';
  if (path.includes('冲突检测') && path.includes('图谱融合')) return 'conflict-detect';
  if (path.includes('多策略融合')) return 'fusion';
  if (path.includes('模糊关系')) return 'fuzzy';
  if (path.includes('逻辑关系')) return 'logic';
  if (path.includes('关系可视化')) return 'viz';
  return null;
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
