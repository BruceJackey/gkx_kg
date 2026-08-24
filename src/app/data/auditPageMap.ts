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
  '图谱构造引擎/人工审核/种子术语审核': 'term-review',
  '知识图谱构造引擎/人工审核': 'human-review',
  '知识图谱构造引擎/人工审核/上下位关系审核': 'human-review',
  '知识图谱构造引擎/人工审核/识别管理': 'human-review',
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取': 'algorithm-detail',
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
  '约束规则建模与校验/知识一致性自动校验': 'knowledge-consistency-validation',
};

/** 审计页面路径 → 算法详情 ID（直达 algorithm-detail） */
export const AUDIT_ALGORITHM_MAP: Record<string, string> = {
  '算法管理/算法仓库/抽取类算法/术语/事件粗抽取': 'seed-term-generation',
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

export type RuleEditorMode = 'visual' | 'manual';

export type RuleCategoryFilter = '分类规则建模' | '属性值推断规则' | '数据质量约束定义';

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
  return null;
}

/** 图谱构造：审计目录跳转到指定配置 Tab */
export function resolveGraphConstructionTab(pagePath: string | undefined): GraphConstructionTab | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('抽取任务配置')) return 'data';
  if (path.includes('基于规则映射的抽取策略') || path.includes('规则配置')) return 'rules';
  if (path.includes('基于统计学习的抽取策略') || path.includes('策略配置') || path.includes('阈值策略')) return 'threshold';
  return null;
}

/** 规则管理：审计目录跳转到新增规则编辑器模式 */
export function resolveRuleEditorMode(pagePath: string | undefined): RuleEditorMode | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('规则文本编辑器')) return 'manual';
  if (path.includes('可视化规则编辑器')) return 'visual';
  return null;
}

/** 规则管理：审计目录跳转到规则类型筛选 */
export function resolveRuleCategoryFilter(pagePath: string | undefined): RuleCategoryFilter | null {
  const path = (pagePath ?? '').trim();
  if (!path) return null;
  if (path.includes('分类规则建模')) return '分类规则建模';
  if (path.includes('属性值推断规则')) return '属性值推断规则';
  if (path.includes('数据质量约束定义')) return '数据质量约束定义';
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
