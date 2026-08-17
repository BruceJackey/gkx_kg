import { useState, useMemo } from 'react';
import {
  Search, Edit2, Save, X, ChevronLeft, ChevronRight, Tag, Hash, FileText,
  Calendar, ChevronDown, Database, Plus, Trash2, AlertTriangle, Link,
  Filter, Clock, Info, RotateCcw, CheckCircle2, ArrowRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';

// ── Interfaces ─────────────────────────────────────────────────────────────────

interface Property {
  key: string;
  label: string;
  value: string;
  type: 'string' | 'number' | 'date' | 'text';
}

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: Property[];
  aliases?: string[];
}

interface GraphSpace {
  id: string;
  name: string;
  description: string;
  entityCount: number;
  color: string;
}

interface Relation {
  id: string;
  sourceId: string;
  sourceName: string;
  relationType: string;
  targetId: string;
  targetName: string;
  attributes: { key: string; label: string; value: string }[];
}

// ── Static data ─────────────────────────────────────────────────────────────────

const graphSpaces: GraphSpace[] = [
  { id: 'gs1', name: '科研知识图谱', description: '覆盖科研人员、机构、技术、成果等核心实体', entityCount: 128450, color: '#3b82f6' },
  { id: 'gs2', name: '医疗健康图谱', description: '涵盖疾病、药物、症状、基因等医疗领域实体', entityCount: 87320, color: '#10b981' },
  { id: 'gs3', name: '专利技术图谱', description: '覆盖专利申请人、技术方向、IPC分类等专利实体', entityCount: 56780, color: '#f59e0b' },
];

interface OntoPropSchema {
  key: string;
  label: string;
  type: Property['type'];
  required?: boolean;
}

interface OntoClass {
  type: string;
  description: string;
  properties: OntoPropSchema[];
}

const GRAPH_ONTOLOGY: Record<string, { ontologyName: string; classes: OntoClass[] }> = {
  gs1: {
    ontologyName: '科技论文知识图谱本体',
    classes: [
      { type: '人物', description: '科研人员、作者、学者', properties: [
        { key: 'birth_date', label: '出生日期', type: 'date' },
        { key: 'nationality', label: '国籍', type: 'string' },
        { key: 'affiliation', label: '所属机构', type: 'string', required: true },
        { key: 'research_field', label: '研究领域', type: 'string' },
        { key: 'h_index', label: 'H指数', type: 'number' },
        { key: 'publications', label: '发表论文数', type: 'number' },
      ]},
      { type: '组织', description: '科研院所、高校、企业', properties: [
        { key: 'founded', label: '成立时间', type: 'date' },
        { key: 'location', label: '所在地', type: 'string', required: true },
        { key: 'employee_count', label: '员工人数', type: 'number' },
        { key: 'research_areas', label: '研究方向', type: 'string' },
        { key: 'website', label: '官网', type: 'string' },
      ]},
      { type: '概念', description: '学科概念与知识主题', properties: [
        { key: 'coined_year', label: '提出年份', type: 'number' },
        { key: 'parent_concept', label: '上位概念', type: 'string' },
        { key: 'key_models', label: '关键模型', type: 'string' },
        { key: 'applications', label: '应用场景', type: 'text' },
      ]},
      { type: '事件', description: '科研计划、会议、项目事件', properties: [
        { key: 'start_date', label: '启动日期', type: 'date', required: true },
        { key: 'budget', label: '总经费(亿元)', type: 'number' },
        { key: 'lead_agency', label: '主管部门', type: 'string' },
        { key: 'focus_areas', label: '重点领域', type: 'text' },
      ]},
      { type: '地点', description: '园区、城市、地理单元', properties: [
        { key: 'area_km2', label: '占地面积(km²)', type: 'number' },
        { key: 'established', label: '建立时间', type: 'date' },
        { key: 'companies', label: '入驻企业数', type: 'number' },
        { key: 'address', label: '地址', type: 'string', required: true },
      ]},
      { type: '技术', description: '模型、算法、技术框架', properties: [
        { key: 'proposed_year', label: '提出年份', type: 'number' },
        { key: 'authors', label: '提出者', type: 'string' },
        { key: 'paper', label: '原始论文', type: 'string' },
        { key: 'key_mechanism', label: '核心机制', type: 'string' },
        { key: 'variants', label: '衍生模型', type: 'text' },
      ]},
    ],
  },
  gs2: {
    ontologyName: '医疗健康本体',
    classes: [
      { type: '疾病', description: '疾病与综合征', properties: [
        { key: 'icd_code', label: 'ICD-10编码', type: 'string', required: true },
        { key: 'prevalence', label: '全球患病率', type: 'string' },
        { key: 'onset_age', label: '常见发病年龄', type: 'string' },
        { key: 'complication', label: '主要并发症', type: 'text' },
      ]},
      { type: '药物', description: '药品与制剂', properties: [
        { key: 'drug_class', label: '药物类别', type: 'string', required: true },
        { key: 'mechanism', label: '作用机制', type: 'text' },
        { key: 'dosage', label: '常用剂量', type: 'string' },
        { key: 'approval_year', label: '上市年份', type: 'number' },
      ]},
      { type: '症状', description: '临床表现', properties: [
        { key: 'severity', label: '严重程度', type: 'string' },
        { key: 'related_disease', label: '相关疾病', type: 'string' },
      ]},
      { type: '基因', description: '基因与位点', properties: [
        { key: 'chromosome', label: '染色体位置', type: 'string', required: true },
        { key: 'function', label: '功能', type: 'text' },
        { key: 'mutation_risk', label: '突变携带者患癌风险', type: 'string' },
      ]},
    ],
  },
  gs3: {
    ontologyName: '专利技术本体',
    classes: [
      { type: '专利', description: '专利申请与授权', properties: [
        { key: 'applicant', label: '申请人', type: 'string', required: true },
        { key: 'filing_date', label: '申请日', type: 'date', required: true },
        { key: 'ipc', label: 'IPC分类', type: 'string' },
        { key: 'claims_count', label: '权利要求数', type: 'number' },
      ]},
      { type: '发明人', description: '专利发明人', properties: [
        { key: 'affiliation', label: '所属机构', type: 'string', required: true },
        { key: 'patent_count', label: '专利申请数', type: 'number' },
        { key: 'research_area', label: '研究方向', type: 'string' },
      ]},
      { type: '技术方向', description: '技术领域分类', properties: [
        { key: 'ipc_codes', label: '相关IPC', type: 'string' },
        { key: 'patent_count_5y', label: '近5年专利量', type: 'number' },
        { key: 'growth_rate', label: '年增长率', type: 'string' },
      ]},
      { type: '申请人', description: '机构申请人', properties: [
        { key: 'founded', label: '成立年份', type: 'number' },
        { key: 'total_patents', label: '专利总量', type: 'number' },
        { key: 'main_field', label: '主要技术方向', type: 'text' },
      ]},
    ],
  },
};

const graphSpaceEntities: Record<string, Entity[]> = {
  gs1: [],
  gs2: [
    { id: 'M001', name: '2型糖尿病', type: '疾病', description: '一种以胰岛素抵抗为主的慢性代谢性疾病，全球患病率约8.5%。', properties: [{ key: 'icd_code', label: 'ICD-10编码', value: 'E11', type: 'string' }, { key: 'prevalence', label: '全球患病率', value: '8.5%', type: 'string' }, { key: 'onset_age', label: '常见发病年龄', value: '40-60岁', type: 'string' }, { key: 'complication', label: '主要并发症', value: '心血管疾病、肾病、视网膜病变', type: 'text' }] },
    { id: 'M002', name: '二甲双胍', type: '药物', description: '临床一线口服降糖药，通过抑制肝糖输出和改善胰岛素敏感性降低血糖。', properties: [{ key: 'drug_class', label: '药物类别', value: '双胍类', type: 'string' }, { key: 'mechanism', label: '作用机制', value: '抑制肝糖异生', type: 'text' }, { key: 'dosage', label: '常用剂量', value: '500-2000mg/天', type: 'string' }, { key: 'approval_year', label: '上市年份', value: '1957', type: 'number' }] },
    { id: 'M003', name: '多饮多尿', type: '症状', description: '糖尿病典型三多一少症状之一，因高血糖引起渗透性利尿所致。', properties: [{ key: 'severity', label: '严重程度', value: '轻度至重度', type: 'string' }, { key: 'related_disease', label: '相关疾病', value: '糖尿病、尿崩症', type: 'string' }] },
    { id: 'M004', name: 'BRCA1基因', type: '基因', description: '乳腺癌易感基因，其突变显著增加乳腺癌和卵巢癌风险。', properties: [{ key: 'chromosome', label: '染色体位置', value: '17q21.31', type: 'string' }, { key: 'function', label: '功能', value: 'DNA损伤修复', type: 'text' }, { key: 'mutation_risk', label: '突变携带者患癌风险', value: '乳腺癌 55-65%', type: 'string' }] },
    { id: 'M005', name: '胰岛素', type: '药物', description: '胰腺B细胞分泌的多肽激素，用于治疗1型和部分2型糖尿病。', properties: [{ key: 'type', label: '类型', value: '速效/短效/中效/长效', type: 'string' }, { key: 'route', label: '给药途径', value: '皮下注射', type: 'string' }, { key: 'discovery_year', label: '发现年份', value: '1921', type: 'number' }] },
  ],
  gs3: [
    { id: 'P001', name: 'CN202410012345A', type: '专利', description: '一种基于深度学习的知识图谱自动构建方法及装置', properties: [{ key: 'applicant', label: '申请人', value: '清华大学', type: 'string' }, { key: 'filing_date', label: '申请日', value: '2024-02-18', type: 'date' }, { key: 'ipc', label: 'IPC分类', value: 'G06F 40/30', type: 'string' }, { key: 'claims_count', label: '权利要求数', value: '8', type: 'number' }] },
    { id: 'P002', name: '张伟', type: '发明人', description: '清华大学计算机系教授，专注知识图谱与自然语言处理研究。', properties: [{ key: 'affiliation', label: '所属机构', value: '清华大学', type: 'string' }, { key: 'patent_count', label: '专利申请数', value: '23', type: 'number' }, { key: 'research_area', label: '研究方向', value: '知识图谱、NLP', type: 'string' }] },
    { id: 'P003', name: '知识图谱构建', type: '技术方向', description: '通过信息抽取、实体对齐等手段构建结构化知识图谱的技术领域。', properties: [{ key: 'ipc_codes', label: '相关IPC', value: 'G06F 40/30, G06N 5/04', type: 'string' }, { key: 'patent_count_5y', label: '近5年专利量', value: '12450', type: 'number' }, { key: 'growth_rate', label: '年增长率', value: '34.2%', type: 'string' }] },
    { id: 'P004', name: '北京智源人工智能研究院', type: '申请人', description: '专注于前沿AI研究的国家级研究机构，专利布局以NLP和CV为主。', properties: [{ key: 'founded', label: '成立年份', value: '2018', type: 'number' }, { key: 'total_patents', label: '专利总量', value: '1240', type: 'number' }, { key: 'main_field', label: '主要技术方向', value: 'NLP、计算机视觉、知识图谱', type: 'text' }] },
  ],
};

const entityTypeColors: Record<string, string> = {
  '人物': 'bg-blue-500/20 text-blue-400',
  '组织': 'bg-purple-500/20 text-purple-400',
  '地点': 'bg-green-500/20 text-green-400',
  '事件': 'bg-yellow-500/20 text-yellow-400',
  '概念': 'bg-orange-500/20 text-orange-400',
  '技术': 'bg-cyan-500/20 text-cyan-400',
  '疾病': 'bg-red-500/20 text-red-500',
  '药物': 'bg-emerald-500/20 text-emerald-600',
  '症状': 'bg-amber-500/20 text-amber-600',
  '基因': 'bg-indigo-500/20 text-indigo-500',
  '专利': 'bg-sky-500/20 text-sky-600',
  '发明人': 'bg-blue-500/20 text-blue-500',
  '技术方向': 'bg-teal-500/20 text-teal-600',
  '申请人': 'bg-violet-500/20 text-violet-600',
};

const entityNodeStyle: Record<string, { fill: string; stroke: string; text: string }> = {
  '人物':  { fill: '#dbeafe', stroke: '#93c5fd', text: '#1d4ed8' },
  '组织':  { fill: '#ede9fe', stroke: '#c4b5fd', text: '#6d28d9' },
  '地点':  { fill: '#dcfce7', stroke: '#86efac', text: '#15803d' },
  '事件':  { fill: '#fef9c3', stroke: '#fde047', text: '#a16207' },
  '概念':  { fill: '#ffedd5', stroke: '#fdba74', text: '#c2410c' },
  '技术':  { fill: '#cffafe', stroke: '#67e8f9', text: '#0e7490' },
};

const mockEntities: Entity[] = [
  {
    id: 'E001', name: '李明', type: '人物',
    aliases: ['李教授', 'Li Ming'],
    description: '知名人工智能研究员，专注于自然语言处理领域。',
    properties: [
      { key: 'birth_date', label: '出生日期', value: '1980-03-15', type: 'date' },
      { key: 'nationality', label: '国籍', value: '中国', type: 'string' },
      { key: 'affiliation', label: '所属机构', value: '清华大学', type: 'string' },
      { key: 'research_field', label: '研究领域', value: '自然语言处理、知识图谱', type: 'string' },
      { key: 'h_index', label: 'H指数', value: '42', type: 'number' },
      { key: 'publications', label: '发表论文数', value: '186', type: 'number' },
    ],
  },
  {
    id: 'E002', name: '北京人工智能研究院', type: '组织',
    aliases: ['BIARI', '北京AI研究院'],
    description: '专注于人工智能基础研究与应用开发的国家级科研机构。',
    properties: [
      { key: 'founded', label: '成立时间', value: '2018-04-23', type: 'date' },
      { key: 'location', label: '所在地', value: '北京市海淀区', type: 'string' },
      { key: 'employee_count', label: '员工人数', value: '1240', type: 'number' },
      { key: 'research_areas', label: '研究方向', value: '机器学习、计算机视觉、自然语言处理', type: 'string' },
      { key: 'website', label: '官网', value: 'https://biari.example.com', type: 'string' },
    ],
  },
  {
    id: 'E003', name: '深度学习', type: '概念',
    aliases: ['Deep Learning', 'DL'],
    description: '机器学习的一个子领域，使用多层神经网络进行表示学习。',
    properties: [
      { key: 'coined_year', label: '提出年份', value: '2006', type: 'number' },
      { key: 'parent_concept', label: '上位概念', value: '机器学习', type: 'string' },
      { key: 'key_models', label: '关键模型', value: 'CNN、RNN、Transformer', type: 'string' },
      { key: 'applications', label: '应用场景', value: '图像识别、语音识别、自然语言处理', type: 'text' },
    ],
  },
  {
    id: 'E004', name: '国家重点研发计划', type: '事件',
    aliases: ['重点研发计划'],
    description: '国家级科技研发支持项目，推动前沿技术突破与产业化应用。',
    properties: [
      { key: 'start_date', label: '启动日期', value: '2016-01-01', type: 'date' },
      { key: 'budget', label: '总经费(亿元)', value: '36.5', type: 'number' },
      { key: 'lead_agency', label: '主管部门', value: '科学技术部', type: 'string' },
      { key: 'focus_areas', label: '重点领域', value: '新一代信息技术、先进制造、现代农业', type: 'text' },
    ],
  },
  {
    id: 'E005', name: '中关村科技园', type: '地点',
    aliases: ['中关村', 'ZGC'],
    description: '中国最具影响力的科技创新中心，聚集了大量高科技企业与研究机构。',
    properties: [
      { key: 'area_km2', label: '占地面积(km²)', value: '488', type: 'number' },
      { key: 'established', label: '建立时间', value: '1988-05-10', type: 'date' },
      { key: 'companies', label: '入驻企业数', value: '22000', type: 'number' },
      { key: 'address', label: '地址', value: '北京市海淀区中关村大街', type: 'string' },
    ],
  },
  {
    id: 'E006', name: 'Transformer', type: '技术',
    aliases: ['注意力机制模型', 'Self-Attention'],
    description: '基于注意力机制的神经网络架构，广泛应用于自然语言处理任务。',
    properties: [
      { key: 'proposed_year', label: '提出年份', value: '2017', type: 'number' },
      { key: 'authors', label: '提出者', value: 'Vaswani et al.', type: 'string' },
      { key: 'paper', label: '原始论文', value: 'Attention Is All You Need', type: 'string' },
      { key: 'key_mechanism', label: '核心机制', value: '多头自注意力', type: 'string' },
      { key: 'variants', label: '衍生模型', value: 'BERT、GPT、T5、LLaMA', type: 'text' },
    ],
  },
];

// ── Relation data ───────────────────────────────────────────────────────────────

const ONTOLOGY_RELATION_TYPES = [
  '就职于', '隶属于', '位于', '研究领域为', '创立于', '合作方',
  '引用', '应用于', '上位概念', '提出', '资助', '参与', '拥有', '发现于',
];

const SEED_RELATIONS: Relation[] = [
  { id: 'r1', sourceId: 'E001', sourceName: '李明', relationType: '就职于', targetId: 'E002', targetName: '北京人工智能研究院', attributes: [{ key: 'since', label: '起始时间', value: '2018-03' }, { key: 'source', label: '来源', value: 'Wikidata' }] },
  { id: 'r2', sourceId: 'E001', sourceName: '李明', relationType: '研究领域为', targetId: 'E003', targetName: '深度学习', attributes: [{ key: 'source', label: '来源', value: '学术主页' }] },
  { id: 'r3', sourceId: 'E002', sourceName: '北京人工智能研究院', relationType: '位于', targetId: 'E005', targetName: '中关村科技园', attributes: [{ key: 'since', label: '起始时间', value: '2018' }] },
  { id: 'r4', sourceId: 'E001', sourceName: '李明', relationType: '提出', targetId: 'E006', targetName: 'Transformer', attributes: [{ key: 'year', label: '年份', value: '2017' }, { key: 'source', label: '来源', value: 'arXiv' }] },
  { id: 'r5', sourceId: 'E003', sourceName: '深度学习', relationType: '应用于', targetId: 'E006', targetName: 'Transformer', attributes: [{ key: 'source', label: '来源', value: '教科书' }] },
  { id: 'r6', sourceId: 'E004', sourceName: '国家重点研发计划', relationType: '资助', targetId: 'E002', targetName: '北京人工智能研究院', attributes: [{ key: 'amount', label: '金额(万元)', value: '3500' }] },
];

// Fixed node positions for the visual graph canvas (490×270 viewBox)
const NODE_POS: Record<string, { x: number; y: number }> = {
  E001: { x: 110, y: 85 },
  E002: { x: 275, y: 55 },
  E003: { x: 370, y: 145 },
  E004: { x: 275, y: 215 },
  E005: { x: 110, y: 205 },
  E006: { x: 230, y: 140 },
};

// ── Stats data ──────────────────────────────────────────────────────────────────

const H_VALUES = [8, 11, 12, 15, 18, 19, 23, 25, 28, 29, 31, 33, 34, 41, 42, 45, 62, 67, 72, 88];

function buildHistogram(vals: number[], binCount = 7) {
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const step = (hi - lo) / binCount;
  return Array.from({ length: binCount }, (_, i) => {
    const binLo = lo + i * step, binHi = binLo + step;
    const count = vals.filter(v => v >= binLo && (i === binCount - 1 ? v <= binHi : v < binHi)).length;
    return { name: `${Math.round(binLo)}-${Math.round(binHi)}`, count, outlier: binLo >= 65 };
  });
}

const HIST_BINS = buildHistogram(H_VALUES);
const sortedH = [...H_VALUES].sort((a, b) => a - b);
const Q1 = sortedH[Math.floor(sortedH.length * 0.25)];
const Q3 = sortedH[Math.floor(sortedH.length * 0.75)];
const IQR = Q3 - Q1;
const whiskerLo = Math.max(sortedH[0], Q1 - 1.5 * IQR);
const whiskerHi = Math.min(sortedH[sortedH.length - 1], Q3 + 1.5 * IQR);
const OUTLIER_VALS = sortedH.filter(v => v > Q3 + 1.5 * IQR || v < Q1 - 1.5 * IQR);
const medianH = sortedH[Math.floor(sortedH.length / 2)];
const meanH = Math.round(H_VALUES.reduce((a, b) => a + b, 0) / H_VALUES.length);

// ── Time-series data ────────────────────────────────────────────────────────────

const TS_PAPERS_RAW = [
  { date: '2019-Q1', v: 8 }, { date: '2019-Q2', v: 11 }, { date: '2019-Q3', v: 9 },  { date: '2019-Q4', v: 14 },
  { date: '2020-Q1', v: 12 }, { date: '2020-Q2', v: 6 },  { date: '2020-Q3', v: 10 }, { date: '2020-Q4', v: 13 },
  { date: '2021-Q1', v: 11 }, { date: '2021-Q2', v: 15 }, { date: '2021-Q3', v: 42 }, { date: '2021-Q4', v: 16 },
  { date: '2022-Q1', v: 14 }, { date: '2022-Q2', v: 17 }, { date: '2022-Q3', v: 13 }, { date: '2022-Q4', v: 18 },
  { date: '2023-Q1', v: 15 }, { date: '2023-Q2', v: 19 }, { date: '2023-Q3', v: 16 }, { date: '2023-Q4', v: 21 },
];

const TS_EMP_RAW = [
  { date: '2018', v: 120 }, { date: '2019', v: 340 }, { date: '2020', v: 680 },
  { date: '2021', v: 890 }, { date: '2022', v: 1050 }, { date: '2023', v: 1240 }, { date: '2024', v: 1280 },
];

function detectAnomalies(raw: { date: string; v: number }[]) {
  return raw.map((d, i) => {
    const window = raw.slice(Math.max(0, i - 4), i).map(x => x.v);
    if (window.length < 2) return { date: d.date, value: d.v, anomaly: false };
    const wMean = window.reduce((a, b) => a + b, 0) / window.length;
    const wStd = Math.sqrt(window.reduce((a, b) => a + (b - wMean) ** 2, 0) / window.length) || 1;
    return { date: d.date, value: d.v, anomaly: Math.abs(d.v - wMean) > 2.5 * wStd };
  });
}

const TS_PAPERS = detectAnomalies(TS_PAPERS_RAW);
const TS_EMP = detectAnomalies(TS_EMP_RAW);

// ── Utility ─────────────────────────────────────────────────────────────────────

const propertyTypeIcon = (type: Property['type']) => {
  if (type === 'number') return <Hash className="w-3.5 h-3.5" />;
  if (type === 'date')   return <Calendar className="w-3.5 h-3.5" />;
  if (type === 'text')   return <FileText className="w-3.5 h-3.5" />;
  return <Tag className="w-3.5 h-3.5" />;
};

// ── Tab definitions ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'entity',          label: '实体属性' },
  { id: 'search',          label: '检索设置' },
  { id: 'add-relation',    label: '添加关键词关系' },
  { id: 'delete-entity',   label: '删除关键词' },
  { id: 'delete-relation', label: '删除关键词间关系' },
  { id: 'stats',           label: '图谱统计' },
  { id: 'timeseries',      label: '时序可视化' },
] as const;

type TabId = typeof TABS[number]['id'];

// ══════════════════════════════════════════════════════════════════════════════
// Panel: 检索设置
// ══════════════════════════════════════════════════════════════════════════════

function SearchPanel({ entities }: { entities: Entity[] }) {
  // ── ① fuzzy search
  const [fuzzy, setFuzzy] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [picked, setPicked] = useState<Entity | null>(null);

  // ── ② advanced query state
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [entityNameKw, setEntityNameKw] = useState('');
  const [attrConds, setAttrConds] = useState<Array<{ id: string; key: string; op: string; value: string }>>([
    { id: 'a1', key: '', op: 'contains', value: '' },
  ]);
  const [attrLogic, setAttrLogic] = useState<'AND' | 'OR'>('AND');
  const [relConds, setRelConds] = useState<Array<{ id: string; relType: string; direction: 'any' | 'source' | 'target' }>>([]);
  const [advResults, setAdvResults] = useState<Entity[] | null>(null);

  const suggestions = useMemo(() => {
    const q = fuzzy.toLowerCase().trim();
    if (!q) return [] as Entity[];
    return entities.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      (e.aliases ?? []).some(a => a.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [fuzzy, entities]);

  const entityTypes = useMemo(() => Array.from(new Set(entities.map(e => e.type))), [entities]);

  const allAttrKeys = useMemo(() => {
    const map = new Map<string, { label: string; type: Property['type'] }>();
    entities.forEach(e => e.properties.forEach(p => { if (!map.has(p.key)) map.set(p.key, { label: p.label, type: p.type }); }));
    return Array.from(map.entries()).map(([key, meta]) => ({ key, ...meta }));
  }, [entities]);

  const runAdvanced = () => {
    let res = entities;
    if (selectedTypes.size > 0) res = res.filter(e => selectedTypes.has(e.type));
    if (entityNameKw.trim()) res = res.filter(e => e.name.includes(entityNameKw) || (e.aliases ?? []).some(a => a.includes(entityNameKw)));
    const activeAttr = attrConds.filter(c => c.key && (c.op === 'not_empty' || c.value.trim()));
    if (activeAttr.length > 0) {
      res = res.filter(e => {
        const checks = activeAttr.map(c => {
          if (c.op === 'not_empty') return e.properties.some(p => p.key === c.key && !!p.value);
          const p = e.properties.find(p => p.key === c.key);
          if (!p) return false;
          if (c.op === 'contains') return p.value.toLowerCase().includes(c.value.toLowerCase());
          if (c.op === 'equals') return p.value === c.value;
          if (c.op === 'gt') return Number(p.value) > Number(c.value);
          if (c.op === 'lt') return Number(p.value) < Number(c.value);
          return false;
        });
        return attrLogic === 'AND' ? checks.every(Boolean) : checks.some(Boolean);
      });
    }
    const activeRel = relConds.filter(c => c.relType);
    if (activeRel.length > 0) {
      res = res.filter(e => activeRel.every(c =>
        SEED_RELATIONS.some(r => {
          if (r.relationType !== c.relType) return false;
          if (c.direction === 'source') return r.sourceId === e.id;
          if (c.direction === 'target') return r.targetId === e.id;
          return r.sourceId === e.id || r.targetId === e.id;
        })
      ));
    }
    setAdvResults(res);
  };

  const resetAdvanced = () => {
    setSelectedTypes(new Set());
    setEntityNameKw('');
    setAttrConds([{ id: 'a1', key: '', op: 'contains', value: '' }]);
    setRelConds([]);
    setAdvResults(null);
  };

  const queryTags: string[] = [
    ...(selectedTypes.size > 0 ? [`类型: ${Array.from(selectedTypes).join(' / ')}`] : []),
    ...(entityNameKw.trim() ? [`名称包含: ${entityNameKw}`] : []),
    ...attrConds.filter(c => c.key && (c.op === 'not_empty' || c.value.trim())).map(c => {
      const meta = allAttrKeys.find(k => k.key === c.key);
      const opLabel: Record<string, string> = { contains: '包含', equals: '=', gt: '>', lt: '<', not_empty: '非空' };
      return `${meta?.label ?? c.key} ${opLabel[c.op] ?? ''}${c.op !== 'not_empty' ? ' ' + c.value : ''}`;
    }),
    ...relConds.filter(c => c.relType).map(c => {
      const dirLabel: Record<string, string> = { any: '任意', source: '作为源', target: '作为目标' };
      return `关系: ${c.relType} (${dirLabel[c.direction]})`;
    }),
  ];

  const GroupLabel = ({ letter, color, title }: { letter: string; color: string; title: string }) => (
    <div className={`flex items-center gap-2 mb-3`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${color}`}>{letter}</span>
      <span className="text-xs font-semibold text-gray-700">{title}</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ① Fuzzy search */}
      <div className="border border-gray-200 rounded-xl overflow-visible">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
          <p className="text-sm font-semibold text-gray-800">① 实体模糊搜索</p>
          <p className="text-xs text-gray-400 mt-0.5">按名称或别名模糊匹配，支持自动补全</p>
        </div>
        <div className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={fuzzy}
              onChange={e => { setFuzzy(e.target.value); setShowDrop(true); setPicked(null); }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="输入实体名称、别名或 ID…"
              className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
            {showDrop && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {suggestions.map(e => (
                  <button
                    key={e.id}
                    onMouseDown={() => { setFuzzy(e.name); setPicked(e); setShowDrop(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-900">{e.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${entityTypeColors[e.type] ?? 'bg-gray-100 text-gray-500'}`}>{e.type}</span>
                    {(e.aliases ?? []).some(a => a.toLowerCase().includes(fuzzy.toLowerCase())) && (
                      <span className="text-xs text-gray-400">别名: {e.aliases?.find(a => a.toLowerCase().includes(fuzzy.toLowerCase()))}</span>
                    )}
                    <span className="ml-auto text-xs text-gray-400">{e.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {picked && (
            <div className="mt-3 p-4 border border-blue-200 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-semibold text-gray-900">{picked.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${entityTypeColors[picked.type] ?? 'bg-gray-100 text-gray-500'}`}>{picked.type}</span>
                <span className="text-xs text-gray-400">{picked.id}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{picked.description}</p>
              <p className="text-xs text-gray-400">别名：{picked.aliases?.join('、') ?? '—'} · {picked.properties.length} 个属性</p>
            </div>
          )}
          {!picked && fuzzy && suggestions.length === 0 && (
            <p className="mt-3 text-sm text-gray-400">未找到匹配实体</p>
          )}
        </div>
      </div>

      {/* ② Advanced structured query */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">② 高级条件查询</p>
            <p className="text-xs text-gray-400 mt-0.5">从实体类型、属性值、关系类型三个维度组合精准定位知识</p>
          </div>
          <button onClick={resetAdvanced} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-0.5 flex-shrink-0">
            <RotateCcw className="w-3 h-3" />重置
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* ── Group A: Entity conditions ── */}
          <div>
            <GroupLabel letter="A" color="bg-blue-100 text-blue-600" title="实体条件" />
            <div className="space-y-3 pl-7">
              {/* Type chips */}
              <div>
                <div className="text-xs text-gray-500 mb-2">实体类型（可多选）</div>
                <div className="flex flex-wrap gap-1.5">
                  {entityTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTypes(prev => {
                        const next = new Set(prev);
                        next.has(t) ? next.delete(t) : next.add(t);
                        setAdvResults(null);
                        return next;
                      })}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        selectedTypes.has(t)
                          ? (entityTypeColors[t] ?? 'bg-blue-100 text-blue-600') + ' border-current font-medium'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {selectedTypes.has(t) && <CheckCircle2 className="inline w-3 h-3 mr-1 -mt-0.5" />}
                      {t}
                    </button>
                  ))}
                  {selectedTypes.size > 0 && (
                    <button onClick={() => { setSelectedTypes(new Set()); setAdvResults(null); }}
                      className="text-xs px-2.5 py-1 text-gray-400 hover:text-red-500 border border-dashed border-gray-200 rounded-full transition-colors">
                      清空
                    </button>
                  )}
                </div>
              </div>
              {/* Name filter */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 flex-shrink-0">实体名称</span>
                <input
                  value={entityNameKw}
                  onChange={e => { setEntityNameKw(e.target.value); setAdvResults(null); }}
                  placeholder="包含关键词，支持别名…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200" />

          {/* ── Group B: Attribute conditions ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">B</span>
              <span className="text-xs font-semibold text-gray-700">属性条件</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-xs text-gray-400">条件间逻辑</span>
                {(['AND', 'OR'] as const).map(l => (
                  <button key={l} onClick={() => { setAttrLogic(l); setAdvResults(null); }}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${attrLogic === l ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="pl-7 space-y-2">
              {attrConds.map((cond, i) => {
                const keyMeta = allAttrKeys.find(k => k.key === cond.key);
                const isNum = keyMeta?.type === 'number';
                return (
                  <div key={cond.id} className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 w-7 text-center flex-shrink-0">{attrLogic}</span>
                    )}
                    {i === 0 && <span className="w-7 flex-shrink-0" />}
                    <select value={cond.key}
                      onChange={e => { const next = attrConds.map((c, j) => j === i ? { ...c, key: e.target.value, value: '' } : c); setAttrConds(next); setAdvResults(null); }}
                      className="w-36 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                      <option value="">选择属性…</option>
                      {allAttrKeys.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
                    </select>
                    <select value={cond.op}
                      onChange={e => { const next = attrConds.map((c, j) => j === i ? { ...c, op: e.target.value } : c); setAttrConds(next); setAdvResults(null); }}
                      className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                      <option value="contains">包含</option>
                      <option value="equals">等于</option>
                      {isNum && <option value="gt">大于</option>}
                      {isNum && <option value="lt">小于</option>}
                      <option value="not_empty">非空</option>
                    </select>
                    {cond.op !== 'not_empty' ? (
                      <input value={cond.value} type={isNum ? 'number' : 'text'}
                        onChange={e => { const next = attrConds.map((c, j) => j === i ? { ...c, value: e.target.value } : c); setAttrConds(next); setAdvResults(null); }}
                        placeholder="输入值…"
                        className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
                    ) : (
                      <span className="flex-1 text-xs text-gray-400 italic">属性存在且不为空即匹配</span>
                    )}
                    <button onClick={() => { setAttrConds(prev => prev.length > 1 ? prev.filter((_, j) => j !== i) : prev); setAdvResults(null); }}
                      className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => { setAttrConds(prev => [...prev, { id: `a${Date.now()}`, key: '', op: 'contains', value: '' }]); }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mt-1">
                <Plus className="w-3.5 h-3.5" />添加属性条件
              </button>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200" />

          {/* ── Group C: Relation conditions ── */}
          <div>
            <GroupLabel letter="C" color="bg-green-100 text-green-600" title="关系条件" />
            <div className="pl-7 space-y-2">
              {relConds.length === 0 && (
                <p className="text-xs text-gray-400 mb-2">实体必须参与以下关系类型</p>
              )}
              {relConds.map((cond, i) => (
                <div key={cond.id} className="flex items-center gap-2">
                  <select value={cond.relType}
                    onChange={e => { const next = relConds.map((c, j) => j === i ? { ...c, relType: e.target.value } : c); setRelConds(next); setAdvResults(null); }}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                    <option value="">选择关系类型…</option>
                    {ONTOLOGY_RELATION_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  <select value={cond.direction}
                    onChange={e => { const next = relConds.map((c, j) => j === i ? { ...c, direction: e.target.value as any } : c); setRelConds(next); setAdvResults(null); }}
                    className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400">
                    <option value="any">任意方向</option>
                    <option value="source">作为源实体</option>
                    <option value="target">作为目标</option>
                  </select>
                  <button onClick={() => { setRelConds(prev => prev.filter((_, j) => j !== i)); setAdvResults(null); }}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setRelConds(prev => [...prev, { id: `r${Date.now()}`, relType: '', direction: 'any' }])}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                <Plus className="w-3.5 h-3.5" />添加关系条件
              </button>
            </div>
          </div>

          {/* ── Query preview ── */}
          {queryTags.length > 0 && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3">
              <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />查询预览
                {attrConds.filter(c => c.key).length > 1 && (
                  <span className="ml-1 text-blue-500 font-normal">（属性条件间逻辑：{attrLogic}）</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {queryTags.map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Action row ── */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-gray-400">
              {queryTags.length > 0
                ? `已配置 ${queryTags.length} 个条件`
                : '请在上方配置至少一个查询条件'}
            </span>
            <button
              onClick={runAdvanced}
              className="ml-auto flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Filter className="w-4 h-4" />执行查询
            </button>
          </div>

          {/* ── Results ── */}
          {advResults !== null && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">查询结果</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${advResults.length > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {advResults.length} 个实体
                </span>
              </div>
              {advResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  无匹配实体，请调整查询条件
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {advResults.map(e => {
                    const activeAttr = attrConds.filter(c => c.key && (c.op === 'not_empty' || c.value.trim()));
                    const matchedProps = e.properties.filter(p => activeAttr.some(c => c.key === p.key));
                    const relCount = SEED_RELATIONS.filter(r => r.sourceId === e.id || r.targetId === e.id).length;
                    return (
                      <div key={e.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-gray-900">{e.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${entityTypeColors[e.type] ?? 'bg-gray-100 text-gray-500'}`}>{e.type}</span>
                          <span className="text-xs text-gray-300">{e.id}</span>
                          <div className="ml-auto flex items-center gap-3">
                            <span className="text-xs text-gray-400">{e.properties.length} 属性</span>
                            {relCount > 0 && (
                              <span className="text-xs text-indigo-500 flex items-center gap-0.5">
                                <Link className="w-3 h-3" />{relCount} 关系
                              </span>
                            )}
                          </div>
                        </div>
                        {matchedProps.length > 0 && (
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                            {matchedProps.map(p => (
                              <span key={p.key} className="text-xs text-gray-500">
                                <span className="text-gray-400">{p.label}: </span>
                                <span className="text-blue-600 font-medium">{p.value}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        {e.aliases && e.aliases.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">别名: {e.aliases.join('、')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Panel: 添加关键词关系
// ══════════════════════════════════════════════════════════════════════════════

function AddRelationPanel({ entities, onAdd }: { entities: Entity[]; onAdd: (r: Relation) => void }) {
  const [step, setStep] = useState<'src' | 'tgt' | 'form'>('src');
  const [srcId, setSrcId] = useState('');
  const [tgtId, setTgtId] = useState('');
  const [relType, setRelType] = useState('');
  const [relSearch, setRelSearch] = useState('');
  const [showRelDrop, setShowRelDrop] = useState(false);
  const [attrs, setAttrs] = useState([{ key: 'since', label: '起始时间', value: '' }, { key: 'source', label: '来源', value: '' }]);
  const [done, setDone] = useState(false);

  const src = entities.find(e => e.id === srcId);
  const tgt = entities.find(e => e.id === tgtId);
  const filteredTypes = ONTOLOGY_RELATION_TYPES.filter(r => r.includes(relSearch));

  const reset = () => {
    setStep('src'); setSrcId(''); setTgtId(''); setRelType('');
    setRelSearch(''); setDone(false);
    setAttrs([{ key: 'since', label: '起始时间', value: '' }, { key: 'source', label: '来源', value: '' }]);
  };

  const clickNode = (id: string) => {
    if (step === 'src') { setSrcId(id); setStep('tgt'); }
    else if (step === 'tgt' && id !== srcId) { setTgtId(id); setStep('form'); }
  };

  const save = () => {
    if (!srcId || !tgtId || !relType || !src || !tgt) return;
    onAdd({ id: `r_${Date.now()}`, sourceId: srcId, sourceName: src.name, relationType: relType, targetId: tgtId, targetName: tgt.name, attributes: attrs.filter(a => a.value) });
    setDone(true);
    setTimeout(() => { setDone(false); reset(); }, 1400);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <p className="text-base font-semibold text-gray-900">添加关键词关系</p>
        <p className="text-sm text-gray-500 mt-0.5">在图中依次点击两个实体节点，建立语义关系</p>
      </div>

      {/* Step chips */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {[
          { key: 'src',  label: '① 选择起点', done: !!srcId },
          { key: 'tgt',  label: '② 选择终点', done: !!tgtId },
          { key: 'form', label: '③ 配置关系', done: done },
        ].map(s => (
          <span
            key={s.key}
            className={`px-3 py-1 rounded-full border font-medium transition-colors ${
              s.done ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : step === s.key ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            {s.label}
          </span>
        ))}
        <button onClick={reset} className="ml-auto text-xs text-gray-400 hover:text-gray-600">重置</button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Graph canvas */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
            {step === 'src' ? '点击选择起点' : step === 'tgt' ? '点击选择终点' : '路径已确定'}
          </div>
          <svg viewBox="0 0 490 270" className="w-full" style={{ height: 250 }}>
            <rect width="490" height="270" fill="#f9fafb" />
            {/* background edges */}
            {SEED_RELATIONS.map(r => {
              const s = NODE_POS[r.sourceId], t = NODE_POS[r.targetId];
              if (!s || !t) return null;
              return <line key={r.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#e2e8f0" strokeWidth="1.5" />;
            })}
            {/* new edge preview */}
            {srcId && tgtId && (() => {
              const s = NODE_POS[srcId], t = NODE_POS[tgtId];
              return s && t ? <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 3" /> : null;
            })()}
            {/* pulse ring on source */}
            {srcId && !tgtId && (() => {
              const s = NODE_POS[srcId];
              return s ? (
                <circle cx={s.x} cy={s.y} r={30} fill="none" stroke="#3b82f6" strokeWidth="2" opacity={0.5} strokeDasharray="5 4" />
              ) : null;
            })()}
            {/* nodes */}
            {entities.map(e => {
              const pos = NODE_POS[e.id];
              if (!pos) return null;
              const ns = entityNodeStyle[e.type] ?? { fill: '#f3f4f6', stroke: '#d1d5db', text: '#374151' };
              const isSrc = e.id === srcId, isTgt = e.id === tgtId;
              return (
                <g
                  key={e.id}
                  onClick={() => step !== 'form' && clickNode(e.id)}
                  style={{ cursor: step === 'form' ? 'default' : 'pointer' }}
                >
                  <circle cx={pos.x} cy={pos.y} r={22} fill={ns.fill} stroke={isSrc ? '#2563eb' : isTgt ? '#059669' : ns.stroke} strokeWidth={isSrc || isTgt ? 3 : 1.5} />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="10" fill={ns.text} fontWeight="600">{e.name.slice(0, 3)}</text>
                  <text x={pos.x} y={pos.y + 34} textAnchor="middle" fontSize="9" fill="#94a3b8">{e.name}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Form */}
        <div>
          {step === 'form' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                <span className="font-semibold text-gray-900">{src?.name}</span>
                <span className="text-blue-500 font-mono text-xs">—→</span>
                <span className="font-semibold text-gray-900">{tgt?.name}</span>
              </div>

              {/* Searchable relation type dropdown */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">关系类型 <span className="text-red-500">*</span></label>
                <input
                  value={relType || relSearch}
                  onChange={e => { setRelSearch(e.target.value); setRelType(''); setShowRelDrop(true); }}
                  onFocus={() => setShowRelDrop(true)}
                  onBlur={() => setTimeout(() => setShowRelDrop(false), 150)}
                  placeholder="搜索本体中的合法关系…"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
                {showRelDrop && filteredTypes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-44 overflow-y-auto">
                    {filteredTypes.map(r => (
                      <button
                        key={r}
                        onMouseDown={() => { setRelType(r); setRelSearch(''); setShowRelDrop(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Relation attributes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">关系属性（可选）</label>
                <div className="space-y-2">
                  {attrs.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={a.label}
                        onChange={e => setAttrs(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        placeholder="属性名"
                        className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <input
                        value={a.value}
                        onChange={e => setAttrs(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                        placeholder="属性值"
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <button onClick={() => setAttrs(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setAttrs(prev => [...prev, { key: `a${prev.length}`, label: '', value: '' }])}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />添加属性
                  </button>
                </div>
              </div>

              <button
                onClick={save}
                disabled={!relType || done}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium"
              >
                <Link className="w-4 h-4" />{done ? '已创建' : '创建关系'}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16 text-center">
              <Link className="w-10 h-10 mb-3 opacity-25" />
              <p className="text-sm">{step === 'src' ? '在左侧图中点击选择起点' : '继续点击选择终点'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Panel: 删除关键词
// ══════════════════════════════════════════════════════════════════════════════

function DeleteEntityPanel({ entities, relations, onDelete }: {
  entities: Entity[];
  relations: Relation[];
  onDelete: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [flash, setFlash] = useState(false);

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = selected.size === entities.length && entities.length > 0;

  const affected = relations.filter(r => selected.has(r.sourceId) || selected.has(r.targetId));

  const confirm = () => {
    onDelete([...selected]);
    setSelected(new Set());
    setShowConfirm(false);
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <p className="text-base font-semibold text-gray-900">删除关键词（实体节点）</p>
        <p className="text-sm text-gray-500 mt-0.5">勾选实体后删除，所有关联关系将同步级联删除</p>
      </div>

      {flash && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          删除成功
        </div>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">实体列表</span>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={() => setSelected(allChecked ? new Set() : new Set(entities.map(e => e.id)))}
              className="rounded border-gray-300"
            />
            全选
          </label>
        </div>
        <div className="divide-y divide-gray-100">
          {entities.map(e => {
            const relCount = relations.filter(r => r.sourceId === e.id || r.targetId === e.id).length;
            return (
              <label key={e.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected.has(e.id)}
                  onChange={() => toggle(e.id)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{e.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{e.id}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${entityTypeColors[e.type] ?? 'bg-gray-100 text-gray-500'}`}>{e.type}</span>
                {relCount > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{relCount} 条关联关系</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        disabled={selected.size === 0}
        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />删除所选实体（{selected.size}）
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">确认级联删除</p>
                <p className="text-sm text-gray-500 mt-1">以下操作<strong className="text-red-600">不可撤销</strong></p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 space-y-1.5 text-sm max-h-52 overflow-y-auto">
              <p className="font-semibold text-red-800">将删除实体（{selected.size} 个）：</p>
              {entities.filter(e => selected.has(e.id)).map(e => (
                <p key={e.id} className="text-red-700 pl-2">· {e.name}（{e.id}）</p>
              ))}
              {affected.length > 0 && (
                <>
                  <p className="font-semibold text-red-800 pt-1">同时级联删除关系（{affected.length} 条）：</p>
                  {affected.map(r => (
                    <p key={r.id} className="text-red-700 pl-2 text-xs">· {r.sourceName} —[{r.relationType}]→ {r.targetName}</p>
                  ))}
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">取消</button>
              <button onClick={confirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Panel: 删除关键词间关系
// ══════════════════════════════════════════════════════════════════════════════

function DeleteRelationPanel({ relations, onDelete }: {
  relations: Relation[];
  onDelete: (id: string) => void;
}) {
  const [selId, setSelId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [flash, setFlash] = useState('');

  const selRel = relations.find(r => r.id === selId);

  const confirm = () => {
    if (!selRel) return;
    setFlash(selRel.relationType);
    onDelete(selId);
    setSelId('');
    setShowConfirm(false);
    setTimeout(() => setFlash(''), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-base font-semibold text-gray-900">删除关键词间关系</p>
        <p className="text-sm text-gray-500 mt-0.5">在图中点击关系连线选中，然后确认删除</p>
      </div>

      {flash && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          关系「{flash}」已删除
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Graph canvas */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">点击连线选中关系</div>
          <svg viewBox="0 0 490 270" className="w-full" style={{ height: 250 }}>
            <rect width="490" height="270" fill="#f9fafb" />
            {relations.map(r => {
              const s = NODE_POS[r.sourceId], t = NODE_POS[r.targetId];
              if (!s || !t) return null;
              const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
              const isSelected = r.id === selId;
              return (
                <g key={r.id} onClick={() => setSelId(r.id === selId ? '' : r.id)} style={{ cursor: 'pointer' }}>
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={isSelected ? '#ef4444' : '#cbd5e1'} strokeWidth={isSelected ? 3 : 2} />
                  <circle cx={mx} cy={my} r={9} fill={isSelected ? '#ef4444' : 'white'} stroke={isSelected ? '#ef4444' : '#cbd5e1'} strokeWidth="1.5" />
                  {isSelected && <text x={mx} y={my + 4} textAnchor="middle" fontSize="9" fill="white">✕</text>}
                  <text x={mx} y={my - 13} textAnchor="middle" fontSize="9" fill={isSelected ? '#ef4444' : '#94a3b8'}>{r.relationType}</text>
                </g>
              );
            })}
            {mockEntities.slice(0, 6).map(e => {
              const pos = NODE_POS[e.id];
              if (!pos) return null;
              const ns = entityNodeStyle[e.type] ?? { fill: '#f3f4f6', stroke: '#d1d5db', text: '#374151' };
              return (
                <g key={e.id}>
                  <circle cx={pos.x} cy={pos.y} r={20} fill={ns.fill} stroke={ns.stroke} strokeWidth="1.5" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="9" fill={ns.text} fontWeight="600">{e.name.slice(0, 3)}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Relation list */}
        <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">
            关系列表（{relations.length} 条）
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100" style={{ maxHeight: 200 }}>
            {relations.map(r => (
              <button
                key={r.id}
                onClick={() => setSelId(r.id === selId ? '' : r.id)}
                className={`w-full text-left px-4 py-3 transition-colors ${selId === r.id ? 'bg-red-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-medium text-gray-900">{r.sourceName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${selId === r.id ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{r.relationType}</span>
                  <span className="font-medium text-gray-900">{r.targetName}</span>
                </div>
                {r.attributes.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{r.attributes.map(a => `${a.label}: ${a.value}`).join(' · ')}</p>
                )}
              </button>
            ))}
          </div>
          {selId && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />删除所选关系
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirm && selRel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">确认删除关系</p>
                <p className="text-sm text-gray-500 mt-1">此操作不可撤销</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800 text-center">
              <span className="font-semibold">{selRel.sourceName}</span>
              <span className="mx-2 text-amber-600">—[{selRel.relationType}]→</span>
              <span className="font-semibold">{selRel.targetName}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">取消</button>
              <button onClick={confirm} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Panel: 图谱统计数据可视化
// ══════════════════════════════════════════════════════════════════════════════

function StatsPanel() {
  const [drillOpen, setDrillOpen] = useState(false);

  const svgW = 300;
  const toX = (v: number) => ((v - 0) / 100) * svgW;
  const outlierEntities = mockEntities.filter(e => {
    const p = e.properties.find(x => x.key === 'h_index');
    return p && OUTLIER_VALS.includes(Number(p.value));
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-base font-semibold text-gray-900">图谱统计数据可视化</p>
        <p className="text-sm text-gray-500 mt-0.5">属性值分布直方图与箱线图，自动识别离群点</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">分析属性</label>
        <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400">
          <option>H指数（人物 · 数值型）</option>
          <option>员工人数（组织 · 数值型）</option>
        </select>
        <span className="ml-auto text-xs text-gray-400">{H_VALUES.length} 个样本</span>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Histogram */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">值分布直方图</span>
            {OUTLIER_VALS.length > 0 && (
              <button
                onClick={() => setDrillOpen(true)}
                className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
              >
                {OUTLIER_VALS.length} 个离群点 →
              </button>
            )}
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={HIST_BINS} margin={{ top: 4, right: 4, bottom: 22, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(v: number) => [`${v} 个实体`, '数量']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {HIST_BINS.map((b, i) => <Cell key={i} fill={b.outlier ? '#f59e0b' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-end gap-4 text-[10px] text-gray-400 mt-1">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 bg-blue-500 rounded-sm" />正常</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2.5 bg-amber-400 rounded-sm" />离群</span>
            </div>
          </div>
        </div>

        {/* Box plot */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">箱线图</div>
          <div className="p-4">
            <svg viewBox="0 0 320 110" className="w-full" style={{ height: 110 }}>
              {/* whisker line */}
              <line x1={toX(whiskerLo)} y1={55} x2={toX(whiskerHi)} y2={55} stroke="#94a3b8" strokeWidth="1.5" />
              <line x1={toX(whiskerLo)} y1={45} x2={toX(whiskerLo)} y2={65} stroke="#94a3b8" strokeWidth="1.5" />
              <line x1={toX(whiskerHi)} y1={45} x2={toX(whiskerHi)} y2={65} stroke="#94a3b8" strokeWidth="1.5" />
              {/* box */}
              <rect x={toX(Q1)} y={40} width={toX(Q3) - toX(Q1)} height={30} fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="3" />
              {/* median */}
              <line x1={toX(medianH)} y1={40} x2={toX(medianH)} y2={70} stroke="#1d4ed8" strokeWidth="2.5" />
              {/* outlier dots */}
              {OUTLIER_VALS.map((v, i) => (
                <circle key={i} cx={toX(v)} cy={55} r={5} fill="#f59e0b" stroke="white" strokeWidth="1.5" />
              ))}
              {/* labels */}
              {[
                { v: whiskerLo, label: `Min\n${Math.round(whiskerLo)}` },
                { v: Q1,        label: `Q1\n${Q1}` },
                { v: medianH,   label: `中\n${medianH}` },
                { v: Q3,        label: `Q3\n${Q3}` },
                { v: whiskerHi, label: `Max\n${Math.round(whiskerHi)}` },
              ].map(p => (
                <g key={p.label}>
                  <text x={toX(p.v)} y={86} textAnchor="middle" fontSize="8" fill="#64748b">{p.label.split('\n')[0]}</text>
                  <text x={toX(p.v)} y={97} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="700">{p.label.split('\n')[1]}</text>
                </g>
              ))}
            </svg>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[{ label: '均值', v: meanH }, { label: 'IQR', v: IQR }, { label: '离群点', v: OUTLIER_VALS.length }].map(s => (
                <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold text-gray-800">{s.v}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down modal */}
      {drillOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold text-gray-900">离群点详情 · H指数</p>
              <button onClick={() => setDrillOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              超出正常范围（Q3 + 1.5×IQR = {Math.round(Q3 + 1.5 * IQR)}）的实体：
            </p>
            <div className="space-y-2">
              {outlierEntities.length === 0 ? (
                <p className="text-sm text-gray-400">无实体记录匹配离群值</p>
              ) : outlierEntities.map(e => {
                const val = e.properties.find(p => p.key === 'h_index')?.value;
                return (
                  <div key={e.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-sm font-semibold text-gray-900">{e.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entityTypeColors[e.type] ?? 'bg-gray-100 text-gray-500'}`}>{e.type}</span>
                    <span className="ml-auto text-sm font-bold text-amber-700">H={val}</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                );
              })}
            </div>
            <button onClick={() => setDrillOpen(false)} className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Panel: 时序可视化
// ══════════════════════════════════════════════════════════════════════════════

type TsKey = 'papers' | 'employees';

interface TsPoint { date: string; value: number; anomaly: boolean }

function renderTimeSeriesDot(props: { cx?: number; cy?: number; payload?: TsPoint }, onClick: (p: TsPoint) => void) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  if (!payload.anomaly) {
    return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" stroke="white" strokeWidth="1" />;
  }
  return (
    <g onClick={() => onClick(payload)} style={{ cursor: 'pointer' }}>
      <circle cx={cx} cy={cy} r={9} fill="#fef9c3" stroke="#f59e0b" strokeWidth="2.5" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill="#b45309" fontWeight="700">!</text>
    </g>
  );
}

function TimeSeriesPanel() {
  const [tsKey, setTsKey] = useState<TsKey>('papers');
  const [drillPoint, setDrillPoint] = useState<TsPoint | null>(null);

  const data: TsPoint[] = tsKey === 'papers' ? TS_PAPERS : TS_EMP;
  const label = tsKey === 'papers' ? '发表论文数（季度）' : '员工人数（年度）';
  const entityName = tsKey === 'papers' ? '李明' : '北京人工智能研究院';
  const anomalies = data.filter(d => d.anomaly);
  const avg = Math.round(data.reduce((a, d) => a + d.value, 0) / data.length);

  const handleDotClick = (p: TsPoint) => setDrillPoint(d => d?.date === p.date ? null : p);

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <p className="text-base font-semibold text-gray-900">时序可视化</p>
        <p className="text-sm text-gray-500 mt-0.5">属性随时间变化的折线图，自动检测异常突变点</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs font-medium text-gray-600">实体</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {([['papers', '李明 · 论文数'], ['employees', '北京AI研究院 · 员工数']] as const).map(([k, n]) => (
            <button
              key={k}
              onClick={() => { setTsKey(k); setDrillPoint(null); }}
              className={`px-4 py-1.5 transition-colors ${tsKey === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {n}
            </button>
          ))}
        </div>
        {anomalies.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />{anomalies.length} 个异常点
          </span>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">
          {entityName} · {label}
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right: 20, bottom: 22, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" interval={Math.floor(data.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(v: number) => [v, label]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <ReferenceLine
                y={avg}
                stroke="#94a3b8"
                strokeDasharray="4 3"
                label={{ value: `均值 ${avg}`, position: 'right', fontSize: 9, fill: '#94a3b8' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props: any) => renderTimeSeriesDot(props, handleDotClick) as any}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-end gap-4 text-[10px] text-gray-400 mt-1">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500" />正常数据点</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-400" />异常突变（点击查看）</span>
          </div>
        </div>
      </div>

      {/* Anomaly list */}
      {anomalies.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-gray-700">自动检测到的异常变化点</span>
          </div>
          <div className="divide-y divide-gray-100">
            {anomalies.map((a, idx) => (
              <div
                key={idx}
                onClick={() => setDrillPoint(d => d?.date === a.date ? null : a)}
                className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${drillPoint?.date === a.date ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-800 w-24">{a.date}</span>
                <span className="text-sm text-gray-700">值 <span className="font-mono font-bold text-amber-700">{a.value}</span></span>
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">显著突变</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drill-down inline detail */}
      {drillPoint && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">异常点详情：{drillPoint.date}</span>
            <button onClick={() => setDrillPoint(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-amber-800">
            该时间点{label}为 <span className="font-bold">{drillPoint.value}</span>，与前期滚动均值偏差超过 2.5σ，可能存在数据录入错误或实际突变事件，建议人工校验。
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg text-xs hover:bg-amber-100">
              <Info className="w-3.5 h-3.5" />标记为已知异常
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg text-xs hover:bg-amber-100">
              <Edit2 className="w-3.5 h-3.5" />前往属性编辑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddOntologyNodeDialog({
  graphName,
  ontologyName,
  classes,
  existingCount,
  onClose,
  onAdd,
}: {
  graphName: string;
  ontologyName: string;
  classes: OntoClass[];
  existingCount: number;
  onClose: () => void;
  onAdd: (entity: Entity) => void;
}) {
  const [classType, setClassType] = useState(classes[0]?.type ?? '');
  const schema = classes.find(c => c.type === classType) ?? classes[0];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aliases, setAliases] = useState('');
  const [propValues, setPropValues] = useState<Record<string, string>>({});

  const setClass = (type: string) => {
    setClassType(type);
    setPropValues({});
  };

  const missingRequired = (schema?.properties ?? []).filter(p => p.required && !(propValues[p.key] ?? '').trim());
  const canSubmit = name.trim() && schema && missingRequired.length === 0;

  const handleAdd = () => {
    if (!canSubmit || !schema) return;
    const prefix = classType.slice(0, 1).toUpperCase();
    onAdd({
      id: `${prefix}${String(existingCount + 101).padStart(3, '0')}`,
      name: name.trim(),
      type: schema.type,
      description: description.trim() || `从「${ontologyName}」的「${schema.type}」类添加的节点`,
      aliases: aliases.split(/[,，、]/).map(s => s.trim()).filter(Boolean),
      properties: schema.properties.map(p => ({
        key: p.key,
        label: p.label,
        type: p.type,
        value: (propValues[p.key] ?? '').trim(),
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[640px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">从本体添加节点</h3>
            <p className="text-xs text-gray-400 mt-0.5">目标图谱「{graphName}」· 本体「{ontologyName}」</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">选择本体类</div>
            <div className="flex flex-wrap gap-2">
              {classes.map(c => (
                <button key={c.type} type="button" onClick={() => setClass(c.type)}
                  className={`text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                    classType === c.type ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-200'
                  }`}>
                  <div className="font-medium">{c.type}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{c.properties.length} 个属性</div>
                </button>
              ))}
            </div>
            {schema && <p className="text-xs text-gray-400 mt-2">{schema.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">节点名称 <span className="text-red-400">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="输入实体名称…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">描述</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="可为空，默认带上本体类说明"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">别名（逗号分隔）</label>
              <input value={aliases} onChange={e => setAliases(e.target.value)} placeholder="可选"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2">本体属性（按 Schema 预填字段）</div>
            <div className="space-y-2">
              {(schema?.properties ?? []).map(p => (
                <div key={p.key} className="grid grid-cols-[140px_1fr] gap-2 items-center">
                  <div>
                    <div className="text-xs text-gray-700">
                      {p.label}{p.required && <span className="text-red-400 ml-0.5">*</span>}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400">{p.key}</div>
                  </div>
                  {p.type === 'text' ? (
                    <textarea rows={2} value={propValues[p.key] ?? ''} onChange={e => setPropValues(v => ({ ...v, [p.key]: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
                  ) : (
                    <input
                      type={p.type === 'number' ? 'number' : p.type === 'date' ? 'date' : 'text'}
                      value={propValues[p.key] ?? ''}
                      onChange={e => setPropValues(v => ({ ...v, [p.key]: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg">取消</button>
          <button onClick={handleAdd} disabled={!canSubmit}
            className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg flex items-center gap-1.5">
            <Plus className="w-4 h-4" />添加节点
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════

export default function PropertyManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('entity');
  const [activeSpaceId, setActiveSpaceId] = useState('gs1');
  const [spaceDropOpen, setSpaceDropOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [entitiesBySpace, setEntitiesBySpace] = useState<Record<string, Entity[]>>({
    gs1: mockEntities,
    gs2: graphSpaceEntities.gs2,
    gs3: graphSpaceEntities.gs3,
  });
  const [entityPage, setEntityPage] = useState(1);
  const [filterType, setFilterType] = useState('全部');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [relations, setRelations] = useState<Relation[]>(SEED_RELATIONS);
  const [showAddNode, setShowAddNode] = useState(false);

  const activeSpace = graphSpaces.find(s => s.id === activeSpaceId)!;
  const ontologyMeta = GRAPH_ONTOLOGY[activeSpaceId];
  const spaceEntities: Entity[] = entitiesBySpace[activeSpaceId] ?? [];

  const updateSpaceEntities = (updater: (list: Entity[]) => Entity[]) => {
    setEntitiesBySpace(prev => ({
      ...prev,
      [activeSpaceId]: updater(prev[activeSpaceId] ?? []),
    }));
  };

  const pageSize = 5;
  const entityTypes = ['全部', ...Array.from(new Set(spaceEntities.map(e => e.type)))];
  const filtered = spaceEntities.filter(e => {
    const mSearch = !searchQuery || e.name.includes(searchQuery) || e.id.includes(searchQuery);
    const mType = filterType === '全部' || e.type === filterType;
    return mSearch && mType;
  });
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((entityPage - 1) * pageSize, entityPage * pageSize);

  const saveEdit = () => {
    if (!selectedEntity || !editingKey) return;
    const updatedList = spaceEntities.map(e =>
      e.id === selectedEntity.id
        ? { ...e, properties: e.properties.map(p => p.key === editingKey ? { ...p, value: editValue } : p) }
        : e
    );
    updateSpaceEntities(() => updatedList);
    setSelectedEntity(updatedList.find(e => e.id === selectedEntity.id) ?? null);
    setEditingKey(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteEntities = (ids: string[]) => {
    updateSpaceEntities(list => list.filter(e => !ids.includes(e.id)));
    setRelations(prev => prev.filter(r => !ids.includes(r.sourceId) && !ids.includes(r.targetId)));
    if (selectedEntity && ids.includes(selectedEntity.id)) setSelectedEntity(null);
  };

  const handleAddOntologyNode = (entity: Entity) => {
    updateSpaceEntities(list => [entity, ...list]);
    setSelectedEntity(entity);
    setFilterType('全部');
    setSearchQuery('');
    setEntityPage(1);
    setShowAddNode(false);
  };

  return (
    <div className="h-full flex flex-col" onClick={() => spaceDropOpen && setSpaceDropOpen(false)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-0 flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">属性管理</h1>
          <p className="text-sm text-gray-500">检索知识图谱中的实体，查看、编辑属性与关系</p>
        </div>
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setSpaceDropOpen(v => !v)}
            className="flex items-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2.5 text-sm min-w-[220px]"
          >
            <Database className="w-4 h-4 flex-shrink-0" style={{ color: activeSpace.color }} />
            <div className="flex-1 text-left">
              <div className="text-gray-900 font-medium leading-tight">{activeSpace.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{activeSpace.entityCount.toLocaleString()} 个实体</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${spaceDropOpen ? 'rotate-180' : ''}`} />
          </button>
          {spaceDropOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1.5">
              {graphSpaces.map(space => (
                <button
                  key={space.id}
                  onClick={() => { setActiveSpaceId(space.id); setSpaceDropOpen(false); setSelectedEntity(null); setFilterType('全部'); setEntityPage(1); }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-start gap-3 ${activeSpaceId === space.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: space.color + '20' }}>
                    <Database className="w-4 h-4" style={{ color: space.color }} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${activeSpaceId === space.id ? 'text-blue-700' : 'text-gray-800'}`}>{space.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{space.description}</p>
                    <p className="text-[11px] mt-1 font-medium" style={{ color: space.color }}>{space.entityCount.toLocaleString()} 个实体</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 px-6 mt-4 flex-shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-1 mr-5 border-b-2 text-sm font-medium whitespace-nowrap transition-colors -mb-px flex-shrink-0 ${
              activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">

        {/* ── 实体属性 ── */}
        {activeTab === 'entity' && (
          <div className="flex gap-4 h-full min-h-0">
            {/* Entity list */}
            <div className="w-80 flex flex-col gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAddNode(true)}
                className="w-full text-sm px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />从本体添加节点
              </button>
              {ontologyMeta && (
                <p className="text-[11px] text-gray-400 -mt-1">基于「{ontologyMeta.ontologyName}」· {ontologyMeta.classes.length} 个实体类</p>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索实体名称或ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setEntityPage(1)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button onClick={() => setEntityPage(1)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">搜索</button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {entityTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); setEntityPage(1); }}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${filterType === type ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
                {paginated.length === 0
                  ? <p className="text-center text-gray-400 text-sm py-8">未找到匹配实体</p>
                  : paginated.map(entity => (
                    <button
                      key={entity.id}
                      onClick={() => { setSelectedEntity(entity); setEditingKey(null); }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedEntity?.id === entity.id ? 'bg-blue-50/50 border-blue-500/50' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">{entity.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${entityTypeColors[entity.type] ?? 'bg-gray-100 text-gray-600'}`}>{entity.type}</span>
                      </div>
                      <p className="text-xs text-gray-400">{entity.id} · {entity.properties.length} 个属性</p>
                    </button>
                  ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
                  <span>{filtered.length} 个</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEntityPage(p => Math.max(1, p - 1))} disabled={entityPage === 1} className="p-1 hover:text-gray-900 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-1">{entityPage}/{totalPages}</span>
                    <button onClick={() => setEntityPage(p => Math.min(totalPages, p + 1))} disabled={entityPage === totalPages} className="p-1 hover:text-gray-900 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Property editor */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
              {selectedEntity ? (
                <>
                  <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg text-gray-900">{selectedEntity.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded ${entityTypeColors[selectedEntity.type] ?? 'bg-gray-100 text-gray-600'}`}>{selectedEntity.type}</span>
                        <span className="text-xs text-gray-400">{selectedEntity.id}</span>
                      </div>
                      <p className="text-sm text-gray-500">{selectedEntity.description}</p>
                    </div>
                    {saveSuccess && (
                      <div className="flex items-center gap-1.5 text-green-600 text-sm bg-green-50 px-3 py-1.5 rounded-lg flex-shrink-0">
                        <Save className="w-4 h-4" />已保存
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-xs text-gray-400 px-6 py-3 w-8">类型</th>
                          <th className="text-left text-xs text-gray-400 px-3 py-3 w-36">属性名称</th>
                          <th className="text-left text-xs text-gray-400 px-3 py-3">属性值</th>
                          <th className="text-left text-xs text-gray-400 px-6 py-3 w-24">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntity.properties.map(prop => (
                          <tr key={prop.key} className="border-b border-gray-100">
                            <td className="px-6 py-3 text-gray-400">{propertyTypeIcon(prop.type)}</td>
                            <td className="px-3 py-3">
                              <p className="text-sm text-gray-600">{prop.label}</p>
                              <p className="text-xs text-gray-400">{prop.key}</p>
                            </td>
                            <td className="px-3 py-3">
                              {editingKey === prop.key ? (
                                prop.type === 'text'
                                  ? <textarea value={editValue} onChange={e => setEditValue(e.target.value)} rows={2} autoFocus className="w-full bg-gray-50 border border-blue-400 rounded px-2 py-1.5 text-sm focus:outline-none resize-none" />
                                  : <input type={prop.type === 'number' ? 'number' : prop.type === 'date' ? 'date' : 'text'} value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="w-full bg-gray-50 border border-blue-400 rounded px-2 py-1.5 text-sm focus:outline-none" />
                              ) : (
                                <span className="text-sm text-gray-900">{prop.value}</span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              {editingKey === prop.key ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={saveEdit} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"><Save className="w-3.5 h-3.5" />保存</button>
                                  <button onClick={() => setEditingKey(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingKey(prop.key); setEditValue(prop.value); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600">
                                  <Edit2 className="w-3.5 h-3.5" />编辑
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <Search className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">搜索并选择一个实体，或从本体添加节点</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && <SearchPanel entities={spaceEntities} />}

        {activeTab === 'add-relation' && (
          <AddRelationPanel
            entities={spaceEntities.slice(0, 8)}
            onAdd={r => setRelations(prev => [r, ...prev])}
          />
        )}

        {activeTab === 'delete-entity' && (
          <DeleteEntityPanel
            entities={spaceEntities}
            relations={relations}
            onDelete={handleDeleteEntities}
          />
        )}

        {activeTab === 'delete-relation' && (
          <DeleteRelationPanel
            relations={relations}
            onDelete={id => setRelations(prev => prev.filter(r => r.id !== id))}
          />
        )}

        {activeTab === 'stats' && <StatsPanel />}

        {activeTab === 'timeseries' && <TimeSeriesPanel />}
      </div>

      {showAddNode && ontologyMeta && (
        <AddOntologyNodeDialog
          graphName={activeSpace.name}
          ontologyName={ontologyMeta.ontologyName}
          classes={ontologyMeta.classes}
          existingCount={spaceEntities.length}
          onClose={() => setShowAddNode(false)}
          onAdd={handleAddOntologyNode}
        />
      )}
    </div>
  );
}
