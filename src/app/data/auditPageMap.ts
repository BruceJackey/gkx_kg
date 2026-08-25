/**
 * 审计表「页面」列 → 原型路由 ID 映射（与开发进度记录表.xlsx 列 I 对齐）
 */
export const AUDIT_PAGE_MAP: Record<string, string> = {
  '图谱构造引擎/数据源管理': 'kg-datasource',
  '图谱构造引擎/数据源管理/种子实例': 'kg-datasource',
  '图谱构造引擎/数据源管理/外部词典导入': 'kg-datasource',
  '图谱构造引擎/本体管理': 'kg-ontology',
  '知识图谱构造引擎/数据管理/本体管理': 'kg-ontology',
  '知识图谱构造引擎/本体管理/上下位关系预测': 'kg-ontology',
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
};

export type AuditAlgorithmDemoTab = 'statistical' | 'rule-based' | 'dedup-merge';

export type AuditAlgorithmTab = 'intro' | 'demo' | 'models' | 'training' | 'deployment';

export type GraphConstructionTab = 'data' | 'scope' | 'rules' | 'threshold';

export type GraphStrategyFocus = 'rule' | 'dict' | 'ml' | 'fusion';

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
  if (path.includes('用户标注与纠错') || path.includes('跨用户共识算法') || path.includes('跨用户识别算法') || path.includes('知识可信度分层')) {
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
  ) return 'threshold';
  return null;
}

/** 图谱构造 · 策略配置：聚焦具体策略行 */
export function resolveGraphStrategyFocus(pagePath: string | undefined): GraphStrategyFocus | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
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
