import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Share2, Search, Activity, Users, BarChart3, Map, Filter, Palette, Play, Pause,
  Camera, FileText, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Plus, Trash2, GripVertical, RotateCcw, Wand2, MousePointer, Square, Lasso,
  Move, ZoomIn, ZoomOut, Minimize2, Ruler, GitBranch, Network as NetIcon,
  Circle as CircleIcon, Grid3x3, Layers, Sparkles, Tag, Eye, Save, Share,
  PanelLeft, PanelRight, Layout, X, Star, TrendingUp, Route, BookOpen, Zap,
} from 'lucide-react';

// ── Knowledge graph types ────────────────────────────────────────────────────
type AcademicNodeType = 'concept' | 'paper' | 'method' | 'dataset' | 'researcher' | 'venue';
type TechNodeType = 'technology' | 'patent' | 'product' | 'industry' | 'literature' | 'company';
type GNodeType = AcademicNodeType | TechNodeType;

type AcademicEdgeType = '提出' | '奠基' | '实现' | '改进' | '推动' | '包含' | '演化' | '验证';
type TechEdgeType = '专利化' | '产品化' | '催生' | '研发' | '应用' | '引用' | '竞合' | '转化';
type GEdgeType = AcademicEdgeType | TechEdgeType;

interface GNode {
  id: string;
  label: string;
  type: GNodeType;
  x: number;
  y: number;
  community?: number;
  region?: string;
  year?: number;
  degree?: number;
  betweenness?: number;
  closeness?: number;
  pagerank?: number;
}

interface GEdge {
  id: string;
  source: string;
  target: string;
  type: GEdgeType;
  weight: number;
  year?: number;
}

type GraphTheme = 'academic' | 'tech';

interface CriticalPath {
  id: string;
  name: string;
  category: '技术演进' | '范式革命' | '学者影响' | '技术溯源' | '跨域融合';
  significance: number;
  description: string;
  nodeIds: string[];
  edgeIds: string[];
  tags: string[];
  yearRange: string;
  color: string;
}

interface Snapshot {
  id: string;
  name: string;
  caption: string;
  createdAt: Date;
  thumbnail: string;
  mode: string;
  state: any;
}

interface FilterRule {
  id: string;
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'regex';
  value: string;
  logic: 'AND' | 'OR' | 'NOT';
}

interface StyleRule {
  id: string;
  target: 'node' | 'edge';
  field: string;
  value: string;
  style: 'color' | 'size' | 'shape';
  styleValue: string;
}

// ── Academic AI/ML research knowledge graph data ─────────────────────────────
const initialNodes: GNode[] = [
  { id: 'n1',  label: 'Geoffrey Hinton', type: 'researcher', x: 100, y: 195, community: 0, region: '学术机构', year: 1986, degree: 5, betweenness: 0.58, closeness: 0.72, pagerank: 0.18 },
  { id: 'n2',  label: 'Yann LeCun',      type: 'researcher', x: 100, y: 375, community: 0, region: '学术机构', year: 1989, degree: 4, betweenness: 0.42, closeness: 0.62, pagerank: 0.14 },
  { id: 'n3',  label: 'Vaswani et al.',  type: 'researcher', x: 130, y: 510, community: 1, region: '科技企业', year: 2017, degree: 2, betweenness: 0.28, closeness: 0.50, pagerank: 0.10 },
  { id: 'n4',  label: '反向传播算法',    type: 'method',     x: 265, y: 195, community: 0, region: '基础理论', year: 1986, degree: 4, betweenness: 0.45, closeness: 0.65, pagerank: 0.13 },
  { id: 'n5',  label: '深度学习',        type: 'concept',    x: 260, y: 330, community: 0, region: '基础理论', year: 2006, degree: 5, betweenness: 0.50, closeness: 0.68, pagerank: 0.15 },
  { id: 'n6',  label: '卷积神经网络',    type: 'method',     x: 415, y: 255, community: 0, region: '基础理论', year: 1989, degree: 7, betweenness: 0.62, closeness: 0.78, pagerank: 0.19 },
  { id: 'n7',  label: 'LeNet-5',         type: 'paper',      x: 500, y: 155, community: 0, region: '学术机构', year: 1998, degree: 2, betweenness: 0.15, closeness: 0.45, pagerank: 0.07 },
  { id: 'n8',  label: 'ImageNet数据集',  type: 'dataset',    x: 510, y: 80,  community: 0, region: '学术机构', year: 2009, degree: 2, betweenness: 0.18, closeness: 0.48, pagerank: 0.08 },
  { id: 'n9',  label: 'AlexNet',         type: 'paper',      x: 610, y: 225, community: 0, region: '学术机构', year: 2012, degree: 4, betweenness: 0.40, closeness: 0.63, pagerank: 0.13 },
  { id: 'n10', label: 'ResNet',          type: 'paper',      x: 745, y: 185, community: 0, region: '科技企业', year: 2015, degree: 3, betweenness: 0.32, closeness: 0.58, pagerank: 0.11 },
  { id: 'n11', label: '计算机视觉',      type: 'concept',    x: 870, y: 180, community: 0, region: '前沿领域', year: 2015, degree: 2, betweenness: 0.12, closeness: 0.42, pagerank: 0.07 },
  { id: 'n12', label: 'Attention机制',   type: 'concept',    x: 375, y: 435, community: 1, region: '科技企业', year: 2015, degree: 4, betweenness: 0.44, closeness: 0.64, pagerank: 0.14 },
  { id: 'n13', label: 'Transformer',     type: 'paper',      x: 530, y: 450, community: 1, region: '科技企业', year: 2017, degree: 6, betweenness: 0.60, closeness: 0.75, pagerank: 0.20 },
  { id: 'n14', label: 'BERT',            type: 'paper',      x: 670, y: 380, community: 1, region: '科技企业', year: 2018, degree: 3, betweenness: 0.35, closeness: 0.60, pagerank: 0.12 },
  { id: 'n15', label: 'GPT系列',         type: 'paper',      x: 675, y: 510, community: 1, region: '科技企业', year: 2020, degree: 3, betweenness: 0.38, closeness: 0.62, pagerank: 0.13 },
  { id: 'n16', label: '大语言模型LLM',   type: 'concept',    x: 810, y: 445, community: 1, region: '前沿领域', year: 2023, degree: 4, betweenness: 0.48, closeness: 0.68, pagerank: 0.16 },
  { id: 'n17', label: '自然语言处理',    type: 'concept',    x: 900, y: 365, community: 1, region: '前沿领域', year: 2023, degree: 2, betweenness: 0.14, closeness: 0.44, pagerank: 0.07 },
];

const initialEdges: GEdge[] = [
  { id: 'e1',  source: 'n1',  target: 'n4',  type: '提出', weight: 3, year: 1986 },
  { id: 'e2',  source: 'n1',  target: 'n5',  type: '奠基', weight: 4, year: 2006 },
  { id: 'e3',  source: 'n4',  target: 'n6',  type: '奠基', weight: 3, year: 1989 },
  { id: 'e4',  source: 'n2',  target: 'n6',  type: '提出', weight: 3, year: 1989 },
  { id: 'e5',  source: 'n2',  target: 'n7',  type: '提出', weight: 2, year: 1998 },
  { id: 'e6',  source: 'n6',  target: 'n9',  type: '演化', weight: 5, year: 2012 },
  { id: 'e7',  source: 'n8',  target: 'n9',  type: '验证', weight: 4, year: 2012 },
  { id: 'e8',  source: 'n9',  target: 'n10', type: '改进', weight: 4, year: 2015 },
  { id: 'e9',  source: 'n10', target: 'n11', type: '推动', weight: 3, year: 2015 },
  { id: 'e10', source: 'n12', target: 'n13', type: '实现', weight: 5, year: 2017 },
  { id: 'e11', source: 'n3',  target: 'n13', type: '提出', weight: 4, year: 2017 },
  { id: 'e12', source: 'n13', target: 'n14', type: '改进', weight: 4, year: 2018 },
  { id: 'e13', source: 'n13', target: 'n15', type: '改进', weight: 4, year: 2018 },
  { id: 'e14', source: 'n14', target: 'n16', type: '演化', weight: 4, year: 2020 },
  { id: 'e15', source: 'n15', target: 'n16', type: '演化', weight: 5, year: 2023 },
  { id: 'e16', source: 'n16', target: 'n17', type: '推动', weight: 3, year: 2023 },
  { id: 'e17', source: 'n5',  target: 'n6',  type: '包含', weight: 2, year: 2012 },
  { id: 'e18', source: 'n5',  target: 'n12', type: '包含', weight: 2, year: 2017 },
];

// ── Tech science-to-market knowledge graph data ──────────────────────────────
const techNodes: GNode[] = [
  // LLM 产业链
  { id: 't1',  label: 'Transformer论文',    type: 'literature',  x: 100, y: 120, community: 0, region: '科研院所', year: 2017, degree: 3, betweenness: 0.40, closeness: 0.60, pagerank: 0.12 },
  { id: 't2',  label: '大语言模型技术',     type: 'technology',  x: 280, y: 120, community: 0, region: '前沿技术', year: 2020, degree: 6, betweenness: 0.68, closeness: 0.80, pagerank: 0.22 },
  { id: 't3',  label: 'GPT-4专利族',        type: 'patent',      x: 460, y: 80,  community: 0, region: '知识产权', year: 2022, degree: 3, betweenness: 0.35, closeness: 0.55, pagerank: 0.11 },
  { id: 't4',  label: 'ChatGPT',            type: 'product',     x: 620, y: 120, community: 0, region: '商业产品', year: 2022, degree: 4, betweenness: 0.45, closeness: 0.65, pagerank: 0.16 },
  { id: 't5',  label: 'AI大模型产业',       type: 'industry',    x: 820, y: 120, community: 0, region: '产业集群', year: 2023, degree: 3, betweenness: 0.30, closeness: 0.50, pagerank: 0.10 },
  { id: 't6',  label: 'OpenAI',             type: 'company',     x: 460, y: 220, community: 0, region: '科技企业', year: 2015, degree: 4, betweenness: 0.50, closeness: 0.70, pagerank: 0.18 },
  // CRISPR 产业链
  { id: 't7',  label: 'CRISPR-Cas9论文',   type: 'literature',  x: 100, y: 360, community: 1, region: '科研院所', year: 2012, degree: 2, betweenness: 0.32, closeness: 0.52, pagerank: 0.09 },
  { id: 't8',  label: 'CRISPR基因编辑',    type: 'technology',  x: 280, y: 360, community: 1, region: '前沿技术', year: 2014, degree: 5, betweenness: 0.58, closeness: 0.73, pagerank: 0.18 },
  { id: 't9',  label: '基因编辑专利族',    type: 'patent',      x: 460, y: 320, community: 1, region: '知识产权', year: 2016, degree: 3, betweenness: 0.38, closeness: 0.58, pagerank: 0.12 },
  { id: 't10', label: '基因治疗产品',      type: 'product',     x: 620, y: 360, community: 1, region: '商业产品', year: 2020, degree: 3, betweenness: 0.28, closeness: 0.48, pagerank: 0.09 },
  { id: 't11', label: '生物医药产业',      type: 'industry',    x: 820, y: 360, community: 1, region: '产业集群', year: 2020, degree: 3, betweenness: 0.25, closeness: 0.45, pagerank: 0.08 },
  { id: 't12', label: 'Moderna',           type: 'company',     x: 460, y: 450, community: 1, region: '科技企业', year: 2010, degree: 4, betweenness: 0.42, closeness: 0.62, pagerank: 0.14 },
  // 钙钛矿 产业链
  { id: 't13', label: '钙钛矿光伏论文',   type: 'literature',  x: 100, y: 570, community: 2, region: '科研院所', year: 2009, degree: 2, betweenness: 0.22, closeness: 0.42, pagerank: 0.07 },
  { id: 't14', label: '钙钛矿太阳能',     type: 'technology',  x: 280, y: 570, community: 2, region: '前沿技术', year: 2014, degree: 4, betweenness: 0.44, closeness: 0.62, pagerank: 0.14 },
  { id: 't15', label: '钙钛矿电池专利',   type: 'patent',      x: 460, y: 530, community: 2, region: '知识产权', year: 2018, degree: 3, betweenness: 0.30, closeness: 0.50, pagerank: 0.09 },
  { id: 't16', label: '钙钛矿组件产品',   type: 'product',     x: 620, y: 570, community: 2, region: '商业产品', year: 2022, degree: 3, betweenness: 0.26, closeness: 0.46, pagerank: 0.09 },
  { id: 't17', label: '新能源产业',       type: 'industry',    x: 820, y: 570, community: 2, region: '产业集群', year: 2022, degree: 3, betweenness: 0.22, closeness: 0.42, pagerank: 0.07 },
  { id: 't18', label: '隆基绿能',         type: 'company',     x: 460, y: 650, community: 2, region: '科技企业', year: 2000, degree: 4, betweenness: 0.38, closeness: 0.55, pagerank: 0.12 },
];

const techEdges: GEdge[] = [
  // LLM 科研→市场路径
  { id: 'te1',  source: 't1',  target: 't2',  type: '引用',   weight: 4, year: 2020 },
  { id: 'te2',  source: 't2',  target: 't3',  type: '专利化', weight: 4, year: 2022 },
  { id: 'te3',  source: 't3',  target: 't4',  type: '产品化', weight: 5, year: 2022 },
  { id: 'te4',  source: 't4',  target: 't5',  type: '催生',   weight: 4, year: 2023 },
  { id: 'te5',  source: 't6',  target: 't2',  type: '研发',   weight: 5, year: 2020 },
  { id: 'te6',  source: 't6',  target: 't4',  type: '转化',   weight: 5, year: 2022 },
  // CRISPR 科研→市场路径
  { id: 'te7',  source: 't7',  target: 't8',  type: '引用',   weight: 4, year: 2014 },
  { id: 'te8',  source: 't8',  target: 't9',  type: '专利化', weight: 4, year: 2016 },
  { id: 'te9',  source: 't9',  target: 't10', type: '产品化', weight: 4, year: 2020 },
  { id: 'te10', source: 't10', target: 't11', type: '应用',   weight: 3, year: 2021 },
  { id: 'te11', source: 't12', target: 't8',  type: '研发',   weight: 4, year: 2016 },
  { id: 'te12', source: 't12', target: 't10', type: '转化',   weight: 4, year: 2020 },
  // 钙钛矿 科研→市场路径
  { id: 'te13', source: 't13', target: 't14', type: '引用',   weight: 3, year: 2014 },
  { id: 'te14', source: 't14', target: 't15', type: '专利化', weight: 3, year: 2018 },
  { id: 'te15', source: 't15', target: 't16', type: '产品化', weight: 4, year: 2022 },
  { id: 'te16', source: 't16', target: 't17', type: '催生',   weight: 3, year: 2023 },
  { id: 'te17', source: 't18', target: 't14', type: '研发',   weight: 3, year: 2018 },
  { id: 'te18', source: 't18', target: 't16', type: '转化',   weight: 4, year: 2022 },
  // 跨链关系
  { id: 'te19', source: 't5',  target: 't11', type: '竞合',   weight: 2, year: 2023 },
  { id: 'te20', source: 't5',  target: 't17', type: '竞合',   weight: 2, year: 2023 },
];

const TECH_CRITICAL_PATHS: CriticalPath[] = [
  {
    id: 'tcp1', name: 'LLM商业化转化路径', category: '技术演进', significance: 0.97,
    description: '从Transformer基础论文到ChatGPT产品，再到AI大模型产业的完整科研-市场转化链条，揭示生成式AI的商业化路径',
    nodeIds: ['t1', 't2', 't3', 't4', 't5'],
    edgeIds: ['te1', 'te2', 'te3', 'te4'],
    tags: ['LLM', '生成AI', '商业化'], yearRange: '2017–2023', color: '#6366f1',
  },
  {
    id: 'tcp2', name: 'CRISPR医疗转化路径', category: '技术演进', significance: 0.93,
    description: 'CRISPR-Cas9学术论文到基因治疗产品的转化历程，代表生命科学领域科研成果商业化的典型路径',
    nodeIds: ['t7', 't8', 't9', 't10', 't11'],
    edgeIds: ['te7', 'te8', 'te9', 'te10'],
    tags: ['基因编辑', '生物医药', 'FDA'], yearRange: '2012–2021', color: '#10b981',
  },
  {
    id: 'tcp3', name: '钙钛矿光伏转化路径', category: '技术演进', significance: 0.89,
    description: '钙钛矿太阳能从实验室论文到量产组件的产业转化路径，聚焦专利布局与市场落地的关键节点',
    nodeIds: ['t13', 't14', 't15', 't16', 't17'],
    edgeIds: ['te13', 'te14', 'te15', 'te16'],
    tags: ['钙钛矿', '光伏', '新能源'], yearRange: '2009–2023', color: '#f59e0b',
  },
  {
    id: 'tcp4', name: 'OpenAI企业研发路径', category: '学者影响', significance: 0.95,
    description: 'OpenAI从核心技术研发到专利申请再到ChatGPT产品推出的企业科研-商业转化全链路',
    nodeIds: ['t6', 't2', 't3', 't4'],
    edgeIds: ['te5', 'te2', 'te3'],
    tags: ['OpenAI', '企业研发', '转化'], yearRange: '2020–2022', color: '#ec4899',
  },
];

const TECH_STATS_DATA = [
  { region: 'AI大模型',  count: 6, nodeIds: ['t1', 't2', 't3', 't4', 't5', 't6'] },
  { region: '生物医药',  count: 6, nodeIds: ['t7', 't8', 't9', 't10', 't11', 't12'] },
  { region: '新能源光伏', count: 6, nodeIds: ['t13', 't14', 't15', 't16', 't17', 't18'] },
];

// ── Recommended critical research paths ──────────────────────────────────────
const CRITICAL_PATHS: CriticalPath[] = [
  {
    id: 'cp1',
    name: '深度学习视觉演进路径',
    category: '技术演进',
    significance: 0.96,
    description: '从反向传播算法到计算机视觉突破的核心技术演进链，涵盖CNN、AlexNet、ResNet等里程碑节点，揭示深度学习在视觉领域的完整传承逻辑',
    nodeIds: ['n1', 'n4', 'n6', 'n9', 'n10', 'n11'],
    edgeIds: ['e1', 'e3', 'e6', 'e8', 'e9'],
    tags: ['视觉AI', '卷积网络', 'ImageNet'],
    yearRange: '1986–2015',
    color: '#2563eb',
  },
  {
    id: 'cp2',
    name: '语言模型范式革命路径',
    category: '范式革命',
    significance: 0.98,
    description: 'Attention机制到大语言模型的技术传承，代表NLP领域最具颠覆性的研究范式转变，引发全球AI竞赛',
    nodeIds: ['n12', 'n13', 'n14', 'n16', 'n17'],
    edgeIds: ['e10', 'e12', 'e14', 'e16'],
    tags: ['Transformer', 'BERT', 'LLM', 'NLP'],
    yearRange: '2017–2023',
    color: '#10b981',
  },
  {
    id: 'cp3',
    name: 'Hinton深度学习影响链',
    category: '学者影响',
    significance: 0.94,
    description: 'Geoffrey Hinton从反向传播到深度学习范式的影响传播路径，展示图灵奖得主的科研遗产与知识辐射',
    nodeIds: ['n1', 'n5', 'n6', 'n9', 'n10'],
    edgeIds: ['e2', 'e17', 'e6', 'e8'],
    tags: ['图灵奖', '深度学习', '奠基人'],
    yearRange: '2006–2015',
    color: '#8b5cf6',
  },
  {
    id: 'cp4',
    name: 'GPT系列技术溯源路径',
    category: '技术溯源',
    significance: 0.95,
    description: '从Vaswani et al.提出Transformer到GPT系列演化的完整技术传承路径，揭示现代LLM核心技术的起源与演化机制',
    nodeIds: ['n3', 'n13', 'n15', 'n16', 'n17'],
    edgeIds: ['e11', 'e13', 'e15', 'e16'],
    tags: ['GPT', 'Transformer', '生成模型'],
    yearRange: '2017–2024',
    color: '#f59e0b',
  },
  {
    id: 'cp5',
    name: 'LeCun视觉奠基路径',
    category: '学者影响',
    significance: 0.90,
    description: 'Yann LeCun对卷积神经网络的奠基性贡献与视觉任务的演化路径，体现基础科研到工程突破的转化链',
    nodeIds: ['n2', 'n6', 'n9', 'n10', 'n11'],
    edgeIds: ['e4', 'e6', 'e8', 'e9'],
    tags: ['图灵奖', 'CNN', 'LeNet'],
    yearRange: '1989–2015',
    color: '#ec4899',
  },
];

const TYPE_META: Record<GNodeType, { color: string; label: string; shape: 'circle' | 'square' | 'diamond' }> = {
  // Academic theme
  concept:    { color: '#8b5cf6', label: '概念',    shape: 'diamond' },
  paper:      { color: '#10b981', label: '论文',    shape: 'circle' },
  method:     { color: '#3b82f6', label: '方法',    shape: 'square' },
  dataset:    { color: '#f59e0b', label: '数据集',  shape: 'diamond' },
  researcher: { color: '#ec4899', label: '研究者',  shape: 'circle' },
  venue:      { color: '#ef4444', label: '期刊会议', shape: 'square' },
  // Tech theme
  technology: { color: '#6366f1', label: '技术',    shape: 'diamond' },
  patent:     { color: '#f59e0b', label: '专利',    shape: 'square' },
  product:    { color: '#10b981', label: '产品',    shape: 'circle' },
  industry:   { color: '#0ea5e9', label: '产业',    shape: 'square' },
  literature: { color: '#8b5cf6', label: '文献',    shape: 'circle' },
  company:    { color: '#ec4899', label: '企业',    shape: 'diamond' },
};

const EDGE_META: Record<GEdgeType, { color: string; dash: string }> = {
  // Academic
  提出: { color: '#ec4899', dash: '0' },
  奠基: { color: '#8b5cf6', dash: '4 3' },
  实现: { color: '#2563eb', dash: '0' },
  改进: { color: '#10b981', dash: '0' },
  推动: { color: '#f59e0b', dash: '2 3' },
  包含: { color: '#64748b', dash: '4 3' },
  演化: { color: '#ef4444', dash: '0' },
  验证: { color: '#06b6d4', dash: '2 3' },
  // Tech
  专利化: { color: '#f59e0b', dash: '0' },
  产品化: { color: '#10b981', dash: '0' },
  催生:   { color: '#0ea5e9', dash: '0' },
  研发:   { color: '#ec4899', dash: '4 3' },
  应用:   { color: '#6366f1', dash: '2 3' },
  引用:   { color: '#8b5cf6', dash: '4 3' },
  竞合:   { color: '#64748b', dash: '2 3' },
  转化:   { color: '#ef4444', dash: '0' },
};

const COMMUNITY_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

const STATS_DATA = [
  { region: '计算机视觉',  count: 5, nodeIds: ['n6', 'n7', 'n9', 'n10', 'n11'] },
  { region: '自然语言处理', count: 5, nodeIds: ['n12', 'n13', 'n14', 'n15', 'n17'] },
  { region: '基础理论',    count: 4, nodeIds: ['n1', 'n2', 'n4', 'n5'] },
];

type Mode = 'explore' | 'analysis' | 'story';
type Tool = 'select' | 'box' | 'lasso' | 'pan' | 'measure';
type LayoutMode = 'force' | 'hierarchical' | 'concentric' | 'grid' | 'circle' | 'tree';
type RightTab = 'entity' | 'critical' | 'analysis' | 'filter' | 'style' | 'snapshot' | 'story';
type DockTab = 'timeline' | 'schools' | 'topic' | 'stats' | 'map';

type GraphVizDockFocus = 'timeline' | 'schools' | 'topic' | 'stats' | 'map';

export function GraphVisualization({ initialDockTab }: { initialDockTab?: GraphVizDockFocus | null } = {}) {
  const [graphTheme, setGraphTheme] = useState<GraphTheme>('academic');
  const [nodes, setNodes] = useState<GNode[]>(initialNodes);
  const [edges, setEdges] = useState<GEdge[]>(initialEdges);

  const switchTheme = (theme: GraphTheme) => {
    setGraphTheme(theme);
    setNodes(theme === 'tech' ? techNodes : initialNodes);
    setEdges(theme === 'tech' ? techEdges : initialEdges);
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
    setSelectedNodes([]);
    setActiveCriticalPath(null);
    setPathEndpoints([]);
    setAnalysisActive(null);
    setSubgraphCenter(null);
    setSelectedNodeTypes(new Set());
    setSelectedEdgeTypes(new Set());
  };
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  const [pathEndpoints, setPathEndpoints] = useState<[string?, string?]>([]);
  const [activeCriticalPath, setActiveCriticalPath] = useState<string | null>(null);

  // Mode & UI
  const [mode, setMode] = useState<Mode>('explore');
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>('critical');
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [dockTab, setDockTab] = useState<DockTab | null>(initialDockTab ?? 'timeline');
  const [topicQuery, setTopicQuery] = useState('大语言模型');
  const [topicTracked, setTopicTracked] = useState(false);

  useEffect(() => {
    if (initialDockTab) {
      setDockTab(initialDockTab);
      if (initialDockTab === 'topic') setTopicTracked(false);
    }
  }, [initialDockTab]);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [activeLayout, setActiveLayout] = useState<LayoutMode>('force');
  const [showLegend, setShowLegend] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);

  // Analysis
  const [centralityMode, setCentralityMode] = useState<'none' | 'degree' | 'betweenness' | 'closeness' | 'pagerank'>('none');
  const [showCommunity, setShowCommunity] = useState(false);
  const [communityAlgo, setCommunityAlgo] = useState<'louvain' | 'lp' | 'cc'>('louvain');
  const [pathMode, setPathMode] = useState<'shortest' | 'all'>('shortest');
  const [analysisActive, setAnalysisActive] = useState<'path' | 'centrality' | 'community' | null>(null);

  // Filter / Style
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [styleRules, setStyleRules] = useState<StyleRule[]>([]);

  // Timeline
  const [timelineYear, setTimelineYear] = useState(2024);
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  // Snapshots / Stories
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [stories, setStories] = useState<{ id: string; title: string; summary: string; snapshots: string[] }[]>([]);
  const [draggingSnap, setDraggingSnap] = useState<string | null>(null);

  // Canvas zoom/pan
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Subgraph mode
  const [subgraphCenter, setSubgraphCenter] = useState<string | null>(null);
  const [subgraphHops, setSubgraphHops] = useState(1);

  // Linkage
  const [activeStats, setActiveStats] = useState<string | null>(null);
  const [mapSelection, setMapSelection] = useState<string | null>(null);

  // Export
  const [exportOpen, setExportOpen] = useState(false);

  // Multi-select type filters (empty set = show all)
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<Set<GNodeType>>(new Set());
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<Set<GEdgeType>>(new Set());

  // User-editable colors (initialised from TYPE_META / EDGE_META)
  const [nodeColors, setNodeColors] = useState<Record<GNodeType, string>>(
    () => Object.fromEntries(Object.entries(TYPE_META).map(([k, v]) => [k, v.color])) as Record<GNodeType, string>
  );
  const [edgeColors, setEdgeColors] = useState<Record<GEdgeType, string>>(
    () => Object.fromEntries(Object.entries(EDGE_META).map(([k, v]) => [k, v.color])) as Record<GEdgeType, string>
  );

  // Drag handling for nodes
  useEffect(() => {
    if (!draggingId) return;
    const handleMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - dragOffset.x - transform.x) / transform.k;
      const y = (e.clientY - rect.top - dragOffset.y - transform.y) / transform.k;
      setNodes((prev) => prev.map((n) => (n.id === draggingId ? { ...n, x, y } : n)));
    };
    const handleUp = () => setDraggingId(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [draggingId, dragOffset, transform]);

  // Pan handling
  useEffect(() => {
    if (!panning) return;
    const handleMove = (e: MouseEvent) => {
      setTransform((t) => ({ ...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
    };
    const handleUp = () => setPanning(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [panning, panStart]);

  // Timeline playback
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setTimelineYear((y) => (y >= 2024 ? 1986 : y + 1));
    }, 1000 / playSpeed);
    return () => clearInterval(t);
  }, [playing, playSpeed]);

  const handleNodeMouseDown = (e: React.MouseEvent, node: GNode) => {
    e.stopPropagation();
    if (activeTool !== 'select' && activeTool !== 'pan') return;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - (node.x * transform.k + transform.x),
      y: e.clientY - rect.top - (node.y * transform.k + transform.y),
    });
    setDraggingId(node.id);
  };

  const handleNodeClick = (e: React.MouseEvent, node: GNode) => {
    e.stopPropagation();
    setSelectedNodes((prev) => prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]);
    setRightTab('entity');
    if (!rightPanelOpen) setRightPanelOpen(true);
  };

  const computeSubgraph = (centerId: string, hops: number) => {
    const nodeSet = new Set<string>([centerId]);
    const edgeSet = new Set<string>();
    let frontier = new Set<string>([centerId]);
    for (let h = 0; h < hops; h++) {
      const next = new Set<string>();
      edges.forEach((ed) => {
        const inFrontier = frontier.has(ed.source) || frontier.has(ed.target);
        if (!inFrontier) return;
        const other = frontier.has(ed.source) ? ed.target : ed.source;
        if (!nodeSet.has(other)) { nodeSet.add(other); next.add(other); }
        edgeSet.add(ed.id);
      });
      frontier = next;
      if (frontier.size === 0) break;
    }
    return { nodeSet, edgeSet };
  };

  const applySubgraph = (centerId: string, hops: number) => {
    const { nodeSet, edgeSet } = computeSubgraph(centerId, hops);
    setHighlightedNodes(nodeSet);
    setHighlightedEdges(edgeSet);
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, node: GNode) => {
    e.stopPropagation();
    const newCenter = subgraphCenter === node.id ? null : node.id;
    if (!newCenter) { setSubgraphCenter(null); clearHighlights(); }
    else {
      setSubgraphCenter(newCenter);
      applySubgraph(newCenter, subgraphHops);
      setRightTab('entity');
      if (!rightPanelOpen) setRightPanelOpen(true);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan') {
      setPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    } else {
      setSelectedNodes([]);
    }
  };

  // Path finding
  const findShortestPath = (from: string, to: string): string[] => {
    const adj: Record<string, string[]> = {};
    edges.forEach((e) => {
      adj[e.source] = adj[e.source] || [];
      adj[e.target] = adj[e.target] || [];
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    });
    const visited = new Set([from]);
    const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];
    while (queue.length) {
      const { node, path } = queue.shift()!;
      if (node === to) return path;
      for (const next of adj[node] || []) {
        if (!visited.has(next)) { visited.add(next); queue.push({ node: next, path: [...path, next] }); }
      }
    }
    return [];
  };

  const findAllPaths = (from: string, to: string, maxLen = 5): string[][] => {
    const adj: Record<string, string[]> = {};
    edges.forEach((e) => {
      adj[e.source] = adj[e.source] || [];
      adj[e.target] = adj[e.target] || [];
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    });
    const paths: string[][] = [];
    const dfs = (cur: string, path: string[]) => {
      if (path.length > maxLen) return;
      if (cur === to) { paths.push([...path]); return; }
      for (const next of adj[cur] || []) {
        if (!path.includes(next)) dfs(next, [...path, next]);
      }
    };
    dfs(from, [from]);
    return paths;
  };

  const runPathFinding = () => {
    const [a, b] = pathEndpoints;
    if (!a || !b) return;
    setAnalysisActive('path');
    setRightTab('analysis');
    if (pathMode === 'shortest') {
      const path = findShortestPath(a, b);
      const nodeSet = new Set(path);
      const edgeSet = new Set<string>();
      for (let i = 0; i < path.length - 1; i++) {
        const ed = edges.find((e) => (e.source === path[i] && e.target === path[i + 1]) || (e.target === path[i] && e.source === path[i + 1]));
        if (ed) edgeSet.add(ed.id);
      }
      setHighlightedNodes(nodeSet);
      setHighlightedEdges(edgeSet);
    } else {
      const paths = findAllPaths(a, b);
      const nodeSet = new Set<string>();
      const edgeSet = new Set<string>();
      paths.forEach((path) => {
        path.forEach((n) => nodeSet.add(n));
        for (let i = 0; i < path.length - 1; i++) {
          const ed = edges.find((e) => (e.source === path[i] && e.target === path[i + 1]) || (e.target === path[i] && e.source === path[i + 1]));
          if (ed) edgeSet.add(ed.id);
        }
      });
      setHighlightedNodes(nodeSet);
      setHighlightedEdges(edgeSet);
    }
  };

  // Critical path selection
  const selectCriticalPath = (cp: CriticalPath) => {
    if (activeCriticalPath === cp.id) {
      setActiveCriticalPath(null);
      clearHighlights();
    } else {
      setActiveCriticalPath(cp.id);
      setActiveCriticalPath(cp.id);
      setHighlightedNodes(new Set(cp.nodeIds));
      setHighlightedEdges(new Set(cp.edgeIds));
    }
  };

  const clearHighlights = () => {
    setHighlightedNodes(new Set());
    setHighlightedEdges(new Set());
    setSelectedNodes([]);
    setActiveStats(null);
    setMapSelection(null);
    setPathEndpoints([]);
    setAnalysisActive(null);
    setSubgraphCenter(null);
    setActiveCriticalPath(null);
  };

  // Apply layout
  const applyLayout = (l: LayoutMode) => {
    setActiveLayout(l);
    setNodes((prev) => {
      const n = prev.length;
      return prev.map((node, i) => {
        if (l === 'circle') {
          const a = (i / n) * Math.PI * 2;
          return { ...node, x: 500 + 240 * Math.cos(a), y: 300 + 200 * Math.sin(a) };
        }
        if (l === 'grid') {
          const cols = Math.ceil(Math.sqrt(n));
          return { ...node, x: 100 + (i % cols) * 150, y: 80 + Math.floor(i / cols) * 120 };
        }
        if (l === 'concentric') {
          const ring = node.degree && node.degree >= 4 ? 0 : 1;
          const inRing = prev.filter((p) => ((p.degree || 0) >= 4) === (ring === 0));
          const idx = inRing.indexOf(node);
          const a = (idx / inRing.length) * Math.PI * 2;
          const r = ring === 0 ? 120 : 260;
          return { ...node, x: 500 + r * Math.cos(a), y: 280 + r * Math.sin(a) };
        }
        if (l === 'hierarchical') {
          const layerMap: Record<GNode['type'], number> = { researcher: 0, method: 1, dataset: 1, concept: 2, paper: 3, venue: 4 };
          const layer = layerMap[node.type];
          const inLayer = prev.filter((p) => layerMap[p.type] === layer);
          const idx = inLayer.indexOf(node);
          return { ...node, x: 100 + idx * 160, y: 80 + layer * 110 };
        }
        if (l === 'tree') {
          const layer = node.community || 0;
          const inLayer = prev.filter((p) => (p.community || 0) === layer);
          const idx = inLayer.indexOf(node);
          return { ...node, x: 100 + idx * 150, y: 80 + layer * 140 };
        }
        return node;
      });
    });
  };

  // Filter & style
  const visibleNodes = useMemo(() => {
    let list = nodes;
    if (selectedNodeTypes.size > 0) {
      list = list.filter(n => selectedNodeTypes.has(n.type));
    }
    if (filters.length > 0) {
      list = list.filter((n) => {
        const checks = filters.map((f) => {
          const v = String((n as any)[f.field] ?? '');
          let match = false;
          if (f.op === 'eq') match = v === f.value;
          else if (f.op === 'neq') match = v !== f.value;
          else if (f.op === 'contains') match = v.includes(f.value);
          else if (f.op === 'gt') match = Number(v) > Number(f.value);
          else if (f.op === 'lt') match = Number(v) < Number(f.value);
          else if (f.op === 'regex') { try { match = new RegExp(f.value).test(v); } catch { match = false; } }
          return f.logic === 'NOT' ? !match : match;
        });
        const hasOr = filters.some((f) => f.logic === 'OR');
        return hasOr ? checks.some(Boolean) : checks.every(Boolean);
      });
    }
    return list;
  }, [nodes, filters, selectedNodeTypes]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => edges.filter((e) => {
      if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) return false;
      if (e.year && e.year > timelineYear) return false;
      if (selectedEdgeTypes.size > 0 && !selectedEdgeTypes.has(e.type)) return false;
      return true;
    }),
    [edges, visibleNodeIds, timelineYear, selectedEdgeTypes]
  );

  const getNodeColor = (n: GNode) => {
    for (const rule of styleRules) {
      if (rule.target === 'node' && rule.style === 'color' && String((n as any)[rule.field] ?? '') === rule.value)
        return rule.styleValue;
    }
    if (showCommunity && n.community !== undefined) return COMMUNITY_COLORS[n.community];
    return nodeColors[n.type];
  };

  const getNodeSize = (n: GNode) => {
    let base = 22;
    if (centralityMode === 'degree') base = 14 + (n.degree || 0) * 3;
    else if (centralityMode === 'betweenness') base = 14 + (n.betweenness || 0) * 30;
    else if (centralityMode === 'closeness') base = 14 + (n.closeness || 0) * 18;
    else if (centralityMode === 'pagerank') base = 14 + (n.pagerank || 0) * 80;
    for (const rule of styleRules) {
      if (rule.target === 'node' && rule.style === 'size' && String((n as any)[rule.field] ?? '') === rule.value)
        base = Number(rule.styleValue) || base;
    }
    return base;
  };

  const selectedNode = selectedNodes.length > 0 ? nodes.find((n) => n.id === selectedNodes[0]) : null;

  const setPathEndpoint = (slot: 0 | 1, id: string) => {
    setPathEndpoints((prev) => {
      const next: [string?, string?] = [prev[0], prev[1]];
      next[slot] = id;
      return next;
    });
  };

  // Snapshots
  const createSnapshot = () => {
    const snap: Snapshot = {
      id: Date.now().toString(),
      name: `快照 ${snapshots.length + 1}`,
      caption: '',
      createdAt: new Date(),
      thumbnail: `${visibleNodes.length}节点·${visibleEdges.length}边`,
      mode,
      state: { nodes: JSON.parse(JSON.stringify(nodes)), centralityMode, showCommunity, timelineYear, highlightedNodes: Array.from(highlightedNodes), highlightedEdges: Array.from(highlightedEdges) },
    };
    setSnapshots((prev) => [...prev, snap]);
  };
  const deleteSnapshot = (id: string) => { setSnapshots((prev) => prev.filter((s) => s.id !== id)); setStories((prev) => prev.map((st) => ({ ...st, snapshots: st.snapshots.filter((x) => x !== id) }))); };
  const restoreSnapshot = (snap: Snapshot) => { setNodes(snap.state.nodes); setCentralityMode(snap.state.centralityMode); setShowCommunity(snap.state.showCommunity); setTimelineYear(snap.state.timelineYear); setHighlightedNodes(new Set(snap.state.highlightedNodes)); setHighlightedEdges(new Set(snap.state.highlightedEdges)); };
  const renameSnapshot = (id: string, name: string) => setSnapshots((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  const updateSnapshotCaption = (id: string, caption: string) => setSnapshots((prev) => prev.map((s) => (s.id === id ? { ...s, caption } : s)));

  // Stories
  const createStory = () => setStories((prev) => [...prev, { id: Date.now().toString(), title: `故事 ${prev.length + 1}`, summary: '', snapshots: [] }]);
  const addSnapshotToStory = (storyId: string, snapId: string) => setStories((prev) => prev.map((s) => (s.id === storyId && !s.snapshots.includes(snapId) ? { ...s, snapshots: [...s.snapshots, snapId] } : s)));
  const removeSnapshotFromStory = (storyId: string, snapId: string) => setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, snapshots: s.snapshots.filter((x) => x !== snapId) } : s)));
  const handleStoryDragStart = (id: string) => setDraggingSnap(id);
  const handleStoryDrop = (storyId: string, targetId: string) => {
    if (!draggingSnap || draggingSnap === targetId) return;
    setStories((prev) => prev.map((s) => {
      if (s.id !== storyId) return s;
      const next = s.snapshots.filter((x) => x !== draggingSnap);
      const idx = next.indexOf(targetId);
      next.splice(idx, 0, draggingSnap!);
      return { ...s, snapshots: next };
    }));
    setDraggingSnap(null);
  };

  // Linkage
  const activeStatsData = graphTheme === 'tech' ? TECH_STATS_DATA : STATS_DATA;
  const activeCriticalPaths = graphTheme === 'tech' ? TECH_CRITICAL_PATHS : CRITICAL_PATHS;

  const handleStatsClick = (region: string) => {
    if (activeStats === region) { setActiveStats(null); clearHighlights(); return; }
    setActiveStats(region);
    const item = activeStatsData.find((s) => s.region === region);
    if (item) {
      const nodeSet = new Set(item.nodeIds);
      const edgeSet = new Set<string>();
      edges.forEach((e) => { if (nodeSet.has(e.source) && nodeSet.has(e.target)) edgeSet.add(e.id); });
      setHighlightedNodes(nodeSet);
      setHighlightedEdges(edgeSet);
    }
  };

  const handleMapClick = (region: string) => {
    if (mapSelection === region) { setMapSelection(null); clearHighlights(); return; }
    setMapSelection(region);
    const regionNodes = nodes.filter((n) => n.region === region).map((n) => n.id);
    const nodeSet = new Set(regionNodes);
    const edgeSet = new Set<string>();
    edges.forEach((e) => { if (nodeSet.has(e.source) && nodeSet.has(e.target)) edgeSet.add(e.id); });
    setHighlightedNodes(nodeSet);
    setHighlightedEdges(edgeSet);
  };

  // Filter mutators
  const addFilter = () => setFilters((prev) => [...prev, { id: Date.now().toString(), field: 'type', op: 'eq', value: 'paper', logic: 'AND' }]);
  const removeFilter = (id: string) => setFilters((prev) => prev.filter((f) => f.id !== id));
  const updateFilter = (id: string, patch: Partial<FilterRule>) => setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const addStyleRule = () => setStyleRules((prev) => [...prev, { id: Date.now().toString(), target: 'node', field: 'type', value: 'researcher', style: 'color', styleValue: '#ec4899' }]);
  const removeStyleRule = (id: string) => setStyleRules((prev) => prev.filter((r) => r.id !== id));
  const updateStyleRule = (id: string, patch: Partial<StyleRule>) => setStyleRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Centrality rankings
  const centralityRanking = useMemo(() => {
    if (centralityMode === 'none') return [];
    const key = centralityMode === 'degree' ? 'degree' : centralityMode === 'betweenness' ? 'betweenness' : centralityMode === 'closeness' ? 'closeness' : 'pagerank';
    return [...nodes].sort((a, b) => ((b as any)[key] || 0) - ((a as any)[key] || 0)).slice(0, 20);
  }, [nodes, centralityMode]);

  const communities = useMemo(() => {
    const groups: Record<number, GNode[]> = {};
    nodes.forEach((n) => { if (n.community !== undefined) { groups[n.community] = groups[n.community] || []; groups[n.community].push(n); } });
    return Object.entries(groups).map(([id, ns]) => ({ id: Number(id), size: ns.length, key: ns[0]?.label, nodes: ns }));
  }, [nodes]);

  const neighbors = (id: string) => {
    const r: GNode[] = [];
    edges.forEach((e) => {
      if (e.source === id) { const n = nodes.find((x) => x.id === e.target); if (n) r.push(n); }
      else if (e.target === id) { const n = nodes.find((x) => x.id === e.source); if (n) r.push(n); }
    });
    return r.slice(0, 10);
  };

  const exportReport = (format: 'pdf' | 'html' | 'png') => {
    if (format === 'html') {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>科研知识图谱分析报告</title>
<style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;color:#1f2937}h1{border-bottom:2px solid #2563eb;padding-bottom:8px}.snap{margin:24px 0;padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb}.snap h3{margin:0 0 8px;color:#2563eb}.meta{color:#6b7280;font-size:13px}</style></head><body>
<h1>科研知识图谱分析报告</h1><p class="meta">生成时间：${new Date().toLocaleString('zh-CN')}</p>
${snapshots.map((s, i) => `<div class="snap"><h3>${i + 1}. ${s.name}</h3><p class="meta">${s.thumbnail} · ${s.mode} · ${s.createdAt.toLocaleString('zh-CN')}</p><p>${s.caption || '（无说明）'}</p></div>`).join('')}
</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `graph-report-${Date.now()}.html`; a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`已导出 ${format.toUpperCase()} 报告（模拟），共 ${snapshots.length} 个快照。`);
    }
    setExportOpen(false);
  };

  const zoomIn = () => setTransform((t) => ({ ...t, k: Math.min(3, t.k * 1.2) }));
  const zoomOut = () => setTransform((t) => ({ ...t, k: Math.max(0.3, t.k / 1.2) }));
  const resetView = () => setTransform({ x: 0, y: 0, k: 1 });

  const navTools: { id: Tool; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer, label: '选择' },
    { id: 'box', icon: Square, label: '框选' },
    { id: 'lasso', icon: Lasso, label: '套索' },
    { id: 'pan', icon: Move, label: '平移' },
    { id: 'measure', icon: Ruler, label: '距离测量' },
  ];
  const layoutTools: { id: LayoutMode; icon: any; label: string }[] = [
    { id: 'force', icon: NetIcon, label: '力导布局' },
    { id: 'hierarchical', icon: Layers, label: '层次布局' },
    { id: 'concentric', icon: CircleIcon, label: '同心圆' },
    { id: 'grid', icon: Grid3x3, label: '网格布局' },
    { id: 'circle', icon: CircleIcon, label: '圆形布局' },
    { id: 'tree', icon: GitBranch, label: '树状布局' },
  ];

  // Get the currently active critical path object
  const activeCriticalPathObj = activeCriticalPath ? activeCriticalPaths.find(cp => cp.id === activeCriticalPath) : null;

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
            <Route className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 leading-tight">
              {graphTheme === 'tech' ? '科技知识图谱分析' : '科研知识图谱'}
            </div>
            <button className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-0.5">
              {graphTheme === 'tech' ? '技术·专利·产品·产业 · 科研-市场转化' : 'AI/ML领域 · 关键路径视图'}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <div className="flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200">
            <button
              onClick={() => switchTheme('academic')}
              className={`px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-colors ${graphTheme === 'academic' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BookOpen className="w-3 h-3" /> 学术科研
            </button>
            <button
              onClick={() => switchTheme('tech')}
              className={`px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-colors ${graphTheme === 'tech' ? 'bg-white text-indigo-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Zap className="w-3 h-3" /> 科技知识图谱
            </button>
          </div>
          <div className="w-px h-5 bg-gray-200" />
          <select className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
            <option>AI/ML领域</option><option>NLP方向</option><option>计算机视觉</option>
          </select>
          <MultiTypeSelect
            options={
              (graphTheme === 'academic'
                ? ['concept', 'paper', 'method', 'dataset', 'researcher', 'venue']
                : ['technology', 'patent', 'product', 'industry', 'literature', 'company']
              ).map(k => ({ value: k as GNodeType, label: TYPE_META[k as GNodeType].label }))
            }
            selected={selectedNodeTypes}
            onChange={setSelectedNodeTypes}
            allLabel="全部实体类型"
            colorMap={nodeColors}
          />
          <MultiTypeSelect
            options={
              (graphTheme === 'academic'
                ? ['提出', '奠基', '实现', '改进', '推动', '包含', '演化', '验证']
                : ['专利化', '产品化', '催生', '研发', '应用', '引用', '竞合', '转化']
              ).map(k => ({ value: k as GEdgeType, label: k }))
            }
            selected={selectedEdgeTypes}
            onChange={setSelectedEdgeTypes}
            allLabel="全部关系类型"
            colorMap={edgeColors}
          />
          <select className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg">
            <option>1986–2024</option><option>2010–2024</option><option>2017–2024</option>
          </select>
          <div className="flex items-center p-0.5 bg-gray-100 rounded-lg ml-1">
            {([['explore', '探索'], ['analysis', '分析'], ['story', '故事板']] as const).map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); if (m === 'analysis') setRightTab('critical'); if (m === 'story') setRightTab('story'); }}
                className={`px-2.5 py-1 text-xs rounded ${mode === m ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>
                {l}模式
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg"><Save className="w-3.5 h-3.5" />保存视图</button>
          <button onClick={createSnapshot} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg"><Camera className="w-3.5 h-3.5" />快照 +</button>
          <button onClick={() => setExportOpen(true)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg"><FileText className="w-3.5 h-3.5" />生成报告</button>
          <button className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg"><Share className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Toolbar */}
        <div className={`${toolbarExpanded ? 'w-60' : 'w-14'} border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0 transition-all duration-200`}>
          <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
            {toolbarExpanded && <span className="text-xs font-medium text-gray-500 ml-1">工具栏</span>}
            <button onClick={() => setToolbarExpanded(!toolbarExpanded)} className="p-1 hover:bg-gray-200 rounded ml-auto">
              <PanelLeft className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <ToolGroup title="选择与导航" expanded={toolbarExpanded}>
              {navTools.map((t) => (
                <ToolButton key={t.id} icon={t.icon} label={t.label} active={activeTool === t.id} expanded={toolbarExpanded} onClick={() => setActiveTool(t.id)} />
              ))}
              <ToolButton icon={ZoomIn} label="放大" expanded={toolbarExpanded} onClick={zoomIn} />
              <ToolButton icon={ZoomOut} label="缩小" expanded={toolbarExpanded} onClick={zoomOut} />
              <ToolButton icon={RotateCcw} label="重置视图" expanded={toolbarExpanded} onClick={resetView} />
            </ToolGroup>
            <ToolGroup title="布局算法" expanded={toolbarExpanded}>
              {layoutTools.map((t) => (
                <ToolButton key={t.id} icon={t.icon} label={t.label} active={activeLayout === t.id} expanded={toolbarExpanded} onClick={() => applyLayout(t.id)} />
              ))}
              <ToolButton icon={Wand2} label="自定义布局" expanded={toolbarExpanded} />
            </ToolGroup>
            <ToolGroup title="关键路径" expanded={toolbarExpanded}>
              <ToolButton icon={Route} label="关键路径推荐" active={rightTab === 'critical'} expanded={toolbarExpanded} onClick={() => { setRightTab('critical'); setRightPanelOpen(true); }} />
              <ToolButton icon={TrendingUp} label="路径分析" active={analysisActive === 'path'} expanded={toolbarExpanded} onClick={() => { setAnalysisActive('path'); setRightTab('analysis'); }} />
            </ToolGroup>
            <ToolGroup title="图谱分析" expanded={toolbarExpanded}>
              <ToolButton icon={Search} label="路径发现" active={analysisActive === 'path'} expanded={toolbarExpanded} onClick={() => { setAnalysisActive('path'); setRightTab('analysis'); }} />
              <ToolButton icon={Activity} label="中心性分析" active={analysisActive === 'centrality'} expanded={toolbarExpanded} onClick={() => { setAnalysisActive('centrality'); setRightTab('analysis'); }} />
              <ToolButton icon={Users} label="社群检测" active={analysisActive === 'community'} expanded={toolbarExpanded} onClick={() => { setAnalysisActive('community'); setShowCommunity(true); setRightTab('analysis'); }} />
              <ToolButton icon={Star} label="关键节点" expanded={toolbarExpanded} />
              <ToolButton icon={Sparkles} label="桥接节点" expanded={toolbarExpanded} />
            </ToolGroup>
            <ToolGroup title="筛选与样式" expanded={toolbarExpanded}>
              <ToolButton icon={Filter} label="高级筛选器" expanded={toolbarExpanded} onClick={() => { setRightTab('filter'); setRightPanelOpen(true); }} />
              <ToolButton icon={Palette} label="样式规则" expanded={toolbarExpanded} onClick={() => { setRightTab('style'); setRightPanelOpen(true); }} />
              <ToolButton icon={Tag} label={showLabels ? '隐藏标签' : '显示标签'} expanded={toolbarExpanded} onClick={() => setShowLabels(!showLabels)} />
            </ToolGroup>
            <ToolGroup title="联动面板" expanded={toolbarExpanded}>
              <ToolButton icon={BarChart3} label="统计图联动" active={dockTab === 'stats'} expanded={toolbarExpanded} onClick={() => setDockTab(dockTab === 'stats' ? null : 'stats')} />
              <ToolButton icon={Map} label="地图联动" active={dockTab === 'map'} expanded={toolbarExpanded} onClick={() => setDockTab(dockTab === 'map' ? null : 'map')} />
              <ToolButton icon={Play} label="技术演进路径展示" active={dockTab === 'timeline'} expanded={toolbarExpanded} onClick={() => setDockTab(dockTab === 'timeline' ? null : 'timeline')} />
              <ToolButton icon={Users} label="学派关联与学术交叉点分析" active={dockTab === 'schools'} expanded={toolbarExpanded} onClick={() => setDockTab(dockTab === 'schools' ? null : 'schools')} />
              <ToolButton icon={BookOpen} label="动态主题追踪" active={dockTab === 'topic'} expanded={toolbarExpanded} onClick={() => setDockTab(dockTab === 'topic' ? null : 'topic')} />
            </ToolGroup>
            <ToolGroup title="快照与报告" expanded={toolbarExpanded}>
              <ToolButton icon={Camera} label="创建快照" expanded={toolbarExpanded} onClick={createSnapshot} />
              <ToolButton icon={Layout} label="快照库" expanded={toolbarExpanded} onClick={() => { setRightTab('snapshot'); setRightPanelOpen(true); }} />
              <ToolButton icon={FileText} label="故事板模式" expanded={toolbarExpanded} onClick={() => { setMode('story'); setRightTab('story'); }} />
            </ToolGroup>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ cursor: activeTool === 'pan' ? (panning ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={handleCanvasMouseDown}
            >
              <defs>
                {Object.keys(EDGE_META).map((t) => (
                  <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColors[t as GEdgeType]} />
                  </marker>
                ))}
                {activeCriticalPaths.map(cp => (
                  <marker key={cp.id} id={`arrow-cp-${cp.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={cp.color} />
                  </marker>
                ))}
                <filter id="glow-blue" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {activeCriticalPaths.map(cp => (
                  <filter key={cp.id} id={`glow-${cp.id}`} x="-40%" y="-40%" width="180%" height="180%">
                    <feColorMatrix type="matrix" values={`0 0 0 0 ${parseInt(cp.color.slice(1,3),16)/255} 0 0 0 0 ${parseInt(cp.color.slice(3,5),16)/255} 0 0 0 0 ${parseInt(cp.color.slice(5,7),16)/255} 0 0 0 1 0`} result="colored" />
                    <feGaussianBlur in="colored" stdDeviation="5" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                ))}
              </defs>
              <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
                {/* Edges */}
                {visibleEdges.map((edge) => {
                  const s = visibleNodes.find((n) => n.id === edge.source);
                  const t = visibleNodes.find((n) => n.id === edge.target);
                  if (!s || !t) return null;
                  const isCritical = highlightedEdges.has(edge.id);
                  const dim = highlightedEdges.size > 0 && !isCritical;
                  const edgeDash = EDGE_META[edge.type].dash;
                  const edgeColor = edgeColors[edge.type];
                  const cpColor = activeCriticalPathObj && isCritical ? activeCriticalPathObj.color : undefined;
                  return (
                    <g key={edge.id}>
                      {isCritical && activeCriticalPathObj && (
                        <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={activeCriticalPathObj.color} strokeWidth="8" opacity="0.25" filter={`url(#glow-${activeCriticalPathObj.id})`} />
                      )}
                      <line
                        x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                        stroke={cpColor || (isCritical ? '#2563eb' : edgeColor)}
                        strokeWidth={isCritical ? 3.5 : 1.5}
                        strokeDasharray={isCritical ? '0' : edgeDash}
                        opacity={dim ? 0.12 : 0.85}
                        markerEnd={isCritical && activeCriticalPathObj ? `url(#arrow-cp-${activeCriticalPathObj.id})` : `url(#arrow-${edge.type})`}
                      />
                      {showEdgeLabels && !dim && (
                        <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 5} fill={cpColor || (isCritical ? '#2563eb' : '#64748b')} fontSize="10" textAnchor="middle"
                          style={{ userSelect: 'none', pointerEvents: 'none' }}>
                          {edge.type}
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* Nodes */}
                {visibleNodes.map((node) => {
                  const r = getNodeSize(node);
                  const isSelected = selectedNodes.includes(node.id);
                  const isCritical = highlightedNodes.has(node.id);
                  const dim = highlightedNodes.size > 0 && !isCritical;
                  const isPathStart = pathEndpoints[0] === node.id;
                  const isPathEnd = pathEndpoints[1] === node.id;
                  const isSubCenter = subgraphCenter === node.id;
                  const shape = TYPE_META[node.type].shape;
                  const cpColor = activeCriticalPathObj && isCritical ? activeCriticalPathObj.color : undefined;
                  const strokeColor = cpColor || (isSubCenter ? '#f97316' : isSelected ? '#fbbf24' : isCritical ? '#2563eb' : '#fff');
                  const strokeW = (isCritical && activeCriticalPathObj) ? 4 : isSubCenter ? 4 : isSelected || isCritical ? 4 : 2;

                  // Determine step number in critical path
                  const criticalStepIdx = activeCriticalPathObj ? activeCriticalPathObj.nodeIds.indexOf(node.id) : -1;

                  return (
                    <g key={node.id} onMouseDown={(e) => handleNodeMouseDown(e, node)} onClick={(e) => handleNodeClick(e, node)} onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
                      style={{ cursor: 'grab' }} opacity={dim ? 0.18 : 1}>
                      {/* Critical path pulse ring */}
                      {isCritical && activeCriticalPathObj && (
                        <>
                          <circle cx={node.x} cy={node.y} r={r + 12} fill="none" stroke={activeCriticalPathObj.color} strokeWidth="2.5" opacity="0.35" strokeDasharray="4 3" />
                          <circle cx={node.x} cy={node.y} r={r + 6} fill={activeCriticalPathObj.color} opacity="0.12" />
                        </>
                      )}
                      {isSubCenter && !activeCriticalPathObj && (
                        <circle cx={node.x} cy={node.y} r={r + 9} fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4 3" opacity="0.7" />
                      )}
                      {shape === 'circle' && <circle cx={node.x} cy={node.y} r={r} fill={getNodeColor(node)} stroke={strokeColor} strokeWidth={strokeW} filter={isCritical && activeCriticalPathObj ? `url(#glow-${activeCriticalPathObj.id})` : undefined} />}
                      {shape === 'square' && <rect x={node.x - r} y={node.y - r} width={r * 2} height={r * 2} rx="4" fill={getNodeColor(node)} stroke={strokeColor} strokeWidth={strokeW} filter={isCritical && activeCriticalPathObj ? `url(#glow-${activeCriticalPathObj.id})` : undefined} />}
                      {shape === 'diamond' && <polygon points={`${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`} fill={getNodeColor(node)} stroke={strokeColor} strokeWidth={strokeW} filter={isCritical && activeCriticalPathObj ? `url(#glow-${activeCriticalPathObj.id})` : undefined} />}
                      {showLabels && (
                        <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="600" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                          {node.label.length > 7 ? node.label.slice(0, 7) + '…' : node.label}
                        </text>
                      )}
                      {/* Critical path step badge */}
                      {criticalStepIdx >= 0 && activeCriticalPathObj && (
                        <g style={{ pointerEvents: 'none' }}>
                          <circle cx={node.x + r - 2} cy={node.y - r + 2} r="10" fill={activeCriticalPathObj.color} stroke="white" strokeWidth="1.5" />
                          <text x={node.x + r - 2} y={node.y - r + 6} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{criticalStepIdx + 1}</text>
                        </g>
                      )}
                      {(isPathStart || isPathEnd) && !activeCriticalPathObj && (
                        <g style={{ pointerEvents: 'none' }}>
                          <circle cx={node.x + r - 4} cy={node.y - r + 4} r="9" fill={isPathStart ? '#10b981' : '#ef4444'} />
                          <text x={node.x + r - 4} y={node.y - r + 7} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{isPathStart ? '起' : '终'}</text>
                        </g>
                      )}
                      {centralityMode !== 'none' && (
                        <text x={node.x} y={node.y + r + 14} textAnchor="middle" fill="#1f2937" fontSize="10" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                          {centralityMode === 'degree' && `度:${node.degree}`}
                          {centralityMode === 'betweenness' && `介:${(node.betweenness || 0).toFixed(2)}`}
                          {centralityMode === 'closeness' && `接:${(node.closeness || 0).toFixed(2)}`}
                          {centralityMode === 'pagerank' && `PR:${(node.pagerank || 0).toFixed(2)}`}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Selection Info */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow border border-gray-200 px-3 py-1.5 text-xs text-gray-700">
              已选中 <span className="text-blue-600 font-medium">{selectedNodes.length}</span> 节点 · 工具：
              <span className="text-blue-600 ml-1">{navTools.find((t) => t.id === activeTool)?.label}</span>
              {activeCriticalPathObj && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-white text-[10px]" style={{ background: activeCriticalPathObj.color }}>
                  {activeCriticalPathObj.name}
                </span>
              )}
            </div>

            {/* Mode Indicator */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs shadow">
              {mode === 'explore' ? '探索模式' : mode === 'analysis' ? `分析模式${analysisActive ? ' · ' + (analysisActive === 'path' ? '路径' : analysisActive === 'centrality' ? '中心性' : '社群') : ''}` : '故事板模式'}
              {activeCriticalPathObj && <span className="ml-2 opacity-80">· 关键路径高亮</span>}
            </div>

            {/* Path bar */}
            {analysisActive === 'path' && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 flex items-center gap-2 text-xs">
                <select value={pathEndpoints[0] || ''} onChange={(e) => setPathEndpoint(0, e.target.value)} className="border rounded px-1 py-0.5">
                  <option value="">起点</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <span className="text-gray-400">→</span>
                <select value={pathEndpoints[1] || ''} onChange={(e) => setPathEndpoint(1, e.target.value)} className="border rounded px-1 py-0.5">
                  <option value="">终点</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <div className="flex items-center p-0.5 bg-gray-100 rounded">
                  <button onClick={() => setPathMode('shortest')} className={`px-2 py-0.5 rounded ${pathMode === 'shortest' ? 'bg-white text-blue-700' : 'text-gray-600'}`}>最短</button>
                  <button onClick={() => setPathMode('all')} className={`px-2 py-0.5 rounded ${pathMode === 'all' ? 'bg-white text-blue-700' : 'text-gray-600'}`}>全部</button>
                </div>
                <button onClick={runPathFinding} disabled={!pathEndpoints[0] || !pathEndpoints[1]} className="px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-40">查询</button>
                <button onClick={clearHighlights} className="text-gray-400 hover:text-gray-700"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Subgraph panel */}
            {subgraphCenter && (() => {
              const centerNode = nodes.find(n => n.id === subgraphCenter)!;
              const { nodeSet, edgeSet } = computeSubgraph(subgraphCenter, subgraphHops);
              return (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-orange-200 px-4 py-2.5 flex items-center gap-4 text-xs z-20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TYPE_META[centerNode.type].color }} />
                    <span className="font-semibold text-gray-900">{centerNode.label}</span>
                    <span className="text-gray-400 text-[11px]">子图视图</span>
                  </div>
                  <div className="w-px h-5 bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 whitespace-nowrap">跳数</span>
                    <input type="range" min={1} max={4} step={1} value={subgraphHops}
                      onChange={e => { const h = Number(e.target.value); setSubgraphHops(h); applySubgraph(subgraphCenter, h); }}
                      className="w-20 accent-blue-600" />
                    <span className="w-4 text-center font-semibold text-blue-600">{subgraphHops}</span>
                  </div>
                  <div className="w-px h-5 bg-gray-200" />
                  <div className="flex items-center gap-2.5 text-gray-500">
                    <span><span className="font-semibold text-gray-800">{nodeSet.size}</span> 节点</span>
                    <span><span className="font-semibold text-gray-800">{edgeSet.size}</span> 边</span>
                  </div>
                  <button onClick={clearHighlights} className="ml-1 p-0.5 text-gray-400 hover:text-gray-700"><X className="w-3.5 h-3.5" /></button>
                </div>
              );
            })()}

            {/* Critical path active banner */}
            {activeCriticalPathObj && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-xl shadow-lg border px-4 py-2.5 flex items-center gap-4 text-xs z-20 bg-white" style={{ borderColor: activeCriticalPathObj.color + '40' }}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: activeCriticalPathObj.color }} />
                <div>
                  <span className="font-semibold text-gray-900">{activeCriticalPathObj.name}</span>
                  <span className="ml-2 text-gray-400">{activeCriticalPathObj.yearRange}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  {activeCriticalPathObj.nodeIds.map((nid, i) => {
                    const n = nodes.find(x => x.id === nid);
                    return (
                      <span key={nid} className="flex items-center gap-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: activeCriticalPathObj.color }}>
                          {n?.label.slice(0, 5)}
                        </span>
                        {i < activeCriticalPathObj.nodeIds.length - 1 && <span style={{ color: activeCriticalPathObj.color }}>→</span>}
                      </span>
                    );
                  })}
                </div>
                <button onClick={clearHighlights} className="ml-1 p-0.5 text-gray-400 hover:text-gray-700"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Community bar */}
            {showCommunity && (
              <div className="absolute top-12 right-56 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-1.5 text-xs flex items-center gap-3">
                <span className="text-gray-700">社群数: <span className="font-semibold text-blue-600">{communities.length}</span></span>
                {communities.map((c) => (
                  <span key={c.id} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: COMMUNITY_COLORS[c.id] }} />{c.size}
                  </span>
                ))}
              </div>
            )}

            {/* Mini map */}
            <div className="absolute top-3 right-3 w-40 h-28 bg-white/95 rounded-lg shadow border border-gray-200 p-1">
              <div className="text-[10px] text-gray-500 px-1">缩略图</div>
              <svg viewBox="0 0 1000 600" className="w-full h-[88%]">
                {visibleEdges.map((e) => {
                  const s = visibleNodes.find((n) => n.id === e.source);
                  const t = visibleNodes.find((n) => n.id === e.target);
                  if (!s || !t) return null;
                  return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={highlightedEdges.has(e.id) ? (activeCriticalPathObj?.color || '#2563eb') : '#cbd5e1'} strokeWidth={highlightedEdges.has(e.id) ? 3 : 1} />;
                })}
                {visibleNodes.map((n) => (
                  <circle key={n.id} cx={n.x} cy={n.y} r="12" fill={TYPE_META[n.type].color} opacity={highlightedNodes.size > 0 && !highlightedNodes.has(n.id) ? 0.3 : 1} />
                ))}
                <rect x={-transform.x / transform.k} y={-transform.y / transform.k} width={900 / transform.k} height={480 / transform.k} fill="none" stroke="#2563eb" strokeWidth="3" />
              </svg>
            </div>

            {/* Legend */}
            {showLegend && (() => {
              const themeNodeTypes = graphTheme === 'academic'
                ? ['concept', 'paper', 'method', 'dataset', 'researcher', 'venue'] as GNodeType[]
                : ['technology', 'patent', 'product', 'industry', 'literature', 'company'] as GNodeType[];
              const themeEdgeTypes = graphTheme === 'academic'
                ? ['提出', '奠基', '实现', '改进', '推动', '包含', '演化', '验证'] as GEdgeType[]
                : ['专利化', '产品化', '催生', '研发', '应用', '引用', '竞合', '转化'] as GEdgeType[];
              return (
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-lg shadow border border-gray-200 p-2 text-xs select-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-gray-700">图例</span>
                    <div className="flex items-center gap-1.5 ml-3">
                      <span className="text-[10px] text-gray-400">点击色块修改颜色</span>
                      <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                  {/* Node types */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {themeNodeTypes.map(k => {
                      const active = selectedNodeTypes.size === 0 || selectedNodeTypes.has(k);
                      return (
                        <div key={k} className={`flex items-center gap-1.5 transition-opacity ${active ? '' : 'opacity-35'}`}>
                          <label className="relative w-3 h-3 rounded-full cursor-pointer flex-shrink-0 group" title="点击修改颜色">
                            <span
                              className="block w-3 h-3 rounded-full ring-1 ring-inset ring-black/10 group-hover:ring-2 group-hover:ring-blue-400 transition-all"
                              style={{ background: nodeColors[k] }}
                            />
                            <input
                              type="color"
                              value={nodeColors[k]}
                              onChange={e => setNodeColors(prev => ({ ...prev, [k]: e.target.value }))}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </label>
                          <span className="text-gray-600">{TYPE_META[k].label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Edge types */}
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 grid grid-cols-2 gap-x-3 gap-y-1">
                    {themeEdgeTypes.map(k => {
                      const active = selectedEdgeTypes.size === 0 || selectedEdgeTypes.has(k);
                      return (
                        <div key={k} className={`flex items-center gap-1.5 transition-opacity ${active ? '' : 'opacity-35'}`}>
                          <label className="relative cursor-pointer flex-shrink-0 group" title="点击修改颜色" style={{ width: 18, height: 10 }}>
                            <span
                              className="block rounded-sm ring-1 ring-inset ring-black/10 group-hover:ring-blue-400 transition-all"
                              style={{ background: edgeColors[k], width: 18, height: 4, marginTop: 3 }}
                            />
                            <input
                              type="color"
                              value={edgeColors[k]}
                              onChange={e => setEdgeColors(prev => ({ ...prev, [k]: e.target.value }))}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </label>
                          <span className="text-gray-600">{k}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {!showLegend && (
              <button onClick={() => setShowLegend(true)} className="absolute bottom-3 left-3 bg-white/95 rounded-lg shadow border border-gray-200 px-2 py-1 text-xs text-gray-600">
                显示图例
              </button>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-3 right-3 flex flex-col bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <button onClick={zoomIn} className="p-1.5 hover:bg-gray-100 border-b"><ZoomIn className="w-4 h-4 text-gray-700" /></button>
              <button onClick={zoomOut} className="p-1.5 hover:bg-gray-100 border-b"><ZoomOut className="w-4 h-4 text-gray-700" /></button>
              <button onClick={resetView} className="p-1.5 hover:bg-gray-100 border-b"><RotateCcw className="w-4 h-4 text-gray-700" /></button>
              <button onClick={resetView} className="p-1.5 hover:bg-gray-100"><Minimize2 className="w-4 h-4 text-gray-700" /></button>
            </div>
          </div>

          {/* Bottom Dock */}
          <div className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center bg-white border-b border-gray-200 px-2">
              {([
                ['timeline', '技术演进路径展示', Play],
                ['schools', '学派关联与学术交叉点分析', Users],
                ['topic', '动态主题追踪', BookOpen],
                ['stats', '研究领域联动', BarChart3],
                ['map', '机构分布', Map],
              ] as const).map(([k, l, Ic]) => (
                <button key={k} onClick={() => setDockTab(dockTab === k ? null : k)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs ${dockTab === k ? 'text-blue-700 border-b-2 border-blue-600 -mb-px' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Ic className="w-3.5 h-3.5" />{l}
                </button>
              ))}
              <div className="flex-1" />
              {dockTab && <button onClick={() => setDockTab(null)} className="text-xs text-gray-500 px-2 hover:text-gray-700"><ChevronDown className="w-4 h-4 inline" />收起</button>}
              {!dockTab && <button onClick={() => setDockTab('timeline')} className="text-xs text-gray-500 px-2 hover:text-gray-700"><ChevronUp className="w-4 h-4 inline" />展开</button>}
            </div>
            {dockTab && (
              <div className="h-[200px] overflow-y-auto bg-white px-4 py-3">
                {dockTab === 'timeline' && (
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-gray-700">技术演进路径展示</div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPlaying(!playing)} className="p-1.5 bg-blue-600 text-white rounded">
                        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                      <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button>
                      <input type="range" min="1986" max="2024" value={timelineYear} onChange={(e) => setTimelineYear(Number(e.target.value))} className="flex-1 accent-blue-600" />
                      <span className="text-sm font-semibold text-blue-600 w-12 text-center">{timelineYear}</span>
                      <div className="flex p-0.5 bg-gray-100 rounded">
                        {[0.5, 1, 2, 4].map((s) => (
                          <button key={s} onClick={() => setPlaySpeed(s)} className={`px-1.5 py-0.5 text-xs rounded ${playSpeed === s ? 'bg-white text-blue-700' : 'text-gray-600'}`}>{s}×</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">科研里程碑 · 技术起源与关键节点</div>
                      <div className="relative h-10 bg-gray-100 rounded overflow-hidden">
                        {[
                          { y: 1986, label: '反向传播' }, { y: 1998, label: 'LeNet-5' },
                          { y: 2006, label: '深度学习' }, { y: 2012, label: 'AlexNet' },
                          { y: 2017, label: 'Transformer' }, { y: 2023, label: 'LLM爆发' },
                        ].map((m) => (
                          <div key={m.y} className="absolute -top-1 group" style={{ left: `${((m.y - 1986) / 38) * 100}%` }}>
                            <div className={`w-2 h-2 rounded-full ${m.y <= timelineYear ? 'bg-blue-500' : 'bg-gray-400'}`} />
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 whitespace-nowrap">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">当前 {visibleNodes.length} 节点 · {visibleEdges.length} 边 · 可沿时间轴观察技术演进路径</div>
                  </div>
                )}
                {dockTab === 'schools' && (
                  <div className="space-y-2 text-xs text-gray-700 leading-relaxed max-w-4xl">
                    <div className="font-medium text-gray-800">学派关联与学术交叉点分析</div>
                    <p>
                      基于学者间的引用网络与合作共著关系，系统识别出当前图谱中的主要学术流派：
                      <span className="text-blue-700">连接主义 / 深度学习流派</span>（以反向传播、深度网络与大规模预训练为核心）、
                      <span className="text-violet-700">符号与知识表示流派</span>（以知识图谱、逻辑推理与结构化表示为纽带），以及
                      <span className="text-emerald-700">多模态与跨域融合流派</span>（衔接视觉、语言与科学计算）。
                    </p>
                    <p>
                      交叉热点集中在「预训练大模型 × 知识增强」「图神经网络 × 科学发现」「多模态对齐 × 领域图谱」等节点簇：
                      这些区域同时具有较高的跨社群边密度与近年增量引用，适合作为学科交叉选题与合作推荐的候选切入点。
                    </p>
                    <p className="text-gray-500">
                      分析依据：引用边、合作边与共现边的社群划分结果；交叉点按跨流派边权重与时间衰减综合排序。
                    </p>
                  </div>
                )}
                {dockTab === 'topic' && (
                  <div className="space-y-3 max-w-4xl">
                    <div className="font-medium text-xs text-gray-800">动态主题追踪</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={topicQuery}
                        onChange={(e) => { setTopicQuery(e.target.value); setTopicTracked(false); }}
                        placeholder="输入主题词，如：大语言模型、知识图谱补全"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setTopicTracked(true)}
                        disabled={!topicQuery.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded-lg"
                      >
                        开始追踪
                      </button>
                    </div>
                    {topicTracked && (
                      <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
                        <p>
                          <span className="font-medium text-gray-800">主题「{topicQuery.trim()}」热度轨迹：</span>
                          2018–2020 年处于萌芽期（相关论文占比约 3%–6%）；2021–2022 年快速上升；
                          2023–2024 年进入高位平台，季度热度指数维持在 0.78–0.92，并与「多模态」「智能体」主题出现同步抬升。
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">关键研究成果：</span>
                          《Attention Is All You Need》(2017) 奠定架构基础；后续代表性工作覆盖指令微调、检索增强生成、以及面向科学文献的领域适配模型；
                          在图谱中对应从 Transformer → 预训练语言模型 → 应用落地节点的主演进链。
                        </p>
                        <p>
                          <span className="font-medium text-gray-800">领军人物与团队：</span>
                          以高被引作者与高频合作子图识别，当前主题核心人物簇覆盖架构提出者、规模化训练实践者与领域落地研究者；
                          机构侧以顶尖高校实验室与科技企业研究院共同主导该主题的近期产出。
                        </p>
                      </div>
                    )}
                    {!topicTracked && (
                      <p className="text-xs text-gray-400">输入主题词后点击「开始追踪」，将以文本形式展示热度、成果与领军人物。</p>
                    )}
                  </div>
                )}
                {dockTab === 'stats' && (
                  <div className="grid grid-cols-[160px_1fr] gap-3 h-full">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 mb-1">研究方向</div>
                      {[{ k: 'bar', l: '节点分布', Ic: BarChart3 }, { k: 'pie', l: '类型占比', Ic: CircleIcon }, { k: 'line', l: '时序趋势', Ic: Activity }].map((c) => (
                        <button key={c.k} className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-left rounded hover:bg-gray-50">
                          <c.Ic className="w-3.5 h-3.5 text-blue-600" />{c.l}
                        </button>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">点击联动高亮图谱 · 维度：研究方向</div>
                      <div className="space-y-2">
                        {activeStatsData.map((s) => {
                          const max = Math.max(...activeStatsData.map((x) => x.count));
                          const isActive = activeStats === s.region;
                          return (
                            <button key={s.region} onClick={() => handleStatsClick(s.region)} className={`w-full text-left p-2 rounded border ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">{s.region}</span>
                                <span className="text-gray-500">{s.count} 节点</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded">
                                <div className={`h-2 rounded ${isActive ? 'bg-blue-600' : 'bg-blue-400'}`} style={{ width: `${(s.count / max) * 100}%` }} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {dockTab === 'map' && (
                  <div className="grid grid-cols-[1fr_180px] gap-3 h-full">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">点击机构类型，联动显示该类别实体</div>
                      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-lg h-32">
                        {[{ region: '学术机构', left: '25%', top: '35%' }, { region: '科技企业', left: '65%', top: '30%' }, { region: '前沿领域', left: '80%', top: '65%' }].map((p) => (
                          <button key={p.region} onClick={() => handleMapClick(p.region)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.left, top: p.top }}>
                            <div className={`flex flex-col items-center ${mapSelection === p.region ? 'scale-110' : ''} transition-transform`}>
                              <div className={`w-3 h-3 rounded-full ring-4 ${mapSelection === p.region ? 'bg-blue-600 ring-blue-200' : 'bg-violet-500 ring-violet-100'}`} />
                              <span className="text-xs text-gray-700 mt-0.5 whitespace-nowrap">{p.region}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="text-gray-500 mb-1">框选工具</div>
                      <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded border border-gray-200 hover:bg-gray-50"><Square className="w-3.5 h-3.5" />矩形框选</button>
                      <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded border border-gray-200 hover:bg-gray-50"><CircleIcon className="w-3.5 h-3.5" />圆形框选</button>
                      <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded border border-gray-200 hover:bg-gray-50"><Lasso className="w-3.5 h-3.5" />多边形框选</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={`${rightPanelOpen ? 'w-[340px]' : 'w-10'} border-l border-gray-200 bg-white flex flex-col flex-shrink-0 transition-all`}>
          {!rightPanelOpen ? (
            <button onClick={() => setRightPanelOpen(true)} className="w-full py-3 hover:bg-gray-100">
              <PanelRight className="w-4 h-4 text-gray-500 mx-auto" />
            </button>
          ) : (
            <>
              <div className="flex items-center border-b border-gray-200 overflow-x-auto">
                {([['critical', '关键路径'], ['entity', '详情'], ['analysis', '分析'], ['filter', '筛选'], ['style', '样式'], ['snapshot', '快照'], ['story', '故事板']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setRightTab(k)}
                    className={`px-2.5 py-2 text-xs whitespace-nowrap ${rightTab === k ? 'text-blue-700 border-b-2 border-blue-600 -mb-px' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {k === 'critical' && <Route className="w-3 h-3 inline mr-0.5" />}
                    {l}
                  </button>
                ))}
                <button onClick={() => setRightPanelOpen(false)} className="ml-auto px-1.5 text-gray-400 hover:text-gray-700 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {rightTab === 'critical' && (
                  <CriticalPathTab paths={activeCriticalPaths} activePath={activeCriticalPath} nodes={nodes} onSelect={selectCriticalPath} onClear={clearHighlights} />
                )}
                {rightTab === 'entity' && (
                  <EntityTab node={selectedNode} neighbors={selectedNode ? neighbors(selectedNode.id) : []} multi={selectedNodes.length > 1} count={selectedNodes.length} />
                )}
                {rightTab === 'analysis' && (
                  <AnalysisTab analysisActive={analysisActive} centralityMode={centralityMode} setCentralityMode={setCentralityMode} centralityRanking={centralityRanking}
                    showCommunity={showCommunity} setShowCommunity={setShowCommunity} communityAlgo={communityAlgo} setCommunityAlgo={setCommunityAlgo} communities={communities}
                    pathMode={pathMode} setPathMode={setPathMode} pathEndpoints={pathEndpoints} setAnalysisActive={setAnalysisActive} nodes={nodes} edges={edges} />
                )}
                {rightTab === 'filter' && (
                  <FilterTab filters={filters} addFilter={addFilter} removeFilter={removeFilter} updateFilter={updateFilter} />
                )}
                {rightTab === 'style' && (
                  <StyleTab styleRules={styleRules} addStyleRule={addStyleRule} removeStyleRule={removeStyleRule} updateStyleRule={updateStyleRule} />
                )}
                {rightTab === 'snapshot' && (
                  <SnapshotTab snapshots={snapshots} createSnapshot={createSnapshot} deleteSnapshot={deleteSnapshot} restoreSnapshot={restoreSnapshot} renameSnapshot={renameSnapshot} updateSnapshotCaption={updateSnapshotCaption} />
                )}
                {rightTab === 'story' && (
                  <StoryTab stories={stories} snapshots={snapshots} createStory={createStory} addSnapshotToStory={addSnapshotToStory} removeSnapshotFromStory={removeSnapshotFromStory}
                    onDragStart={handleStoryDragStart} onDrop={handleStoryDrop} onExport={() => setExportOpen(true)} />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export modal */}
      {exportOpen && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setExportOpen(false)}>
          <div className="w-96 bg-white rounded-lg shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4">生成分析报告</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-700 mb-1.5">选择内容</div>
                <select className="w-full px-2 py-1.5 border rounded">
                  <option>所有快照</option>
                  {stories.map((s) => <option key={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <div className="text-gray-700 mb-1.5">导出格式</div>
                <div className="flex gap-2">
                  <button onClick={() => exportReport('pdf')} className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded">PDF</button>
                  <button onClick={() => exportReport('html')} className="flex-1 px-2 py-1.5 text-xs bg-gray-700 text-white rounded">HTML</button>
                  <button onClick={() => exportReport('png')} className="flex-1 px-2 py-1.5 text-xs bg-gray-700 text-white rounded">PNG 序列</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tool components ──────────────────────────────────────────────────────────
function ToolGroup({ title, expanded, children }: { title: string; expanded: boolean; children: any }) {
  return (
    <div className="mb-2 pb-2 border-b border-gray-200 last:border-b-0">
      {expanded && <div className="px-3 text-[10px] font-medium text-gray-400 uppercase mb-1">{title}</div>}
      <div className={expanded ? 'space-y-0.5' : 'flex flex-col items-center gap-1'}>{children}</div>
    </div>
  );
}

function ToolButton({ icon: Icon, label, active, expanded, onClick }: { icon: any; label: string; active?: boolean; expanded: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={label}
      className={`${expanded ? 'w-full px-3 py-1.5 justify-start' : 'w-10 h-10 justify-center'} flex items-center gap-2 rounded text-xs ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-200'}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {expanded && <span className="truncate">{label}</span>}
    </button>
  );
}

// ── Multi-select type dropdown ───────────────────────────────────────────────
function MultiTypeSelect<T extends string>({
  options, selected, onChange, allLabel, colorMap,
}: {
  options: { value: T; label: string }[];
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
  allLabel: string;
  colorMap?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const count = selected.size;
  const allSelected = count === options.length;

  const toggle = (v: T) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v); else next.add(v);
    onChange(next);
  };

  const toggleAll = () => {
    if (allSelected || count === 0) {
      onChange(new Set());
    } else {
      onChange(new Set(options.map(o => o.value)));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-lg transition-colors ${
          count > 0
            ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-3 h-3 flex-shrink-0" />
        <span className="max-w-[90px] truncate">{count === 0 ? allLabel : `已选 ${count} 种`}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-50 bg-white rounded-lg border border-gray-200 shadow-lg min-w-[148px] py-1 overflow-hidden">
            <button
              onClick={toggleAll}
              className="w-full text-left px-3 py-1.5 text-[11px] text-blue-600 hover:bg-blue-50 font-semibold border-b border-gray-100 transition-colors"
            >
              {count === 0 ? '全选' : '清空筛选'}
            </button>
            <div className="max-h-52 overflow-y-auto">
              {options.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="w-3.5 h-3.5 rounded flex-shrink-0"
                    style={{ accentColor: colorMap?.[opt.value] ?? '#3b82f6' }}
                  />
                  {colorMap && (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: colorMap[opt.value] }}
                    />
                  )}
                  <span className="text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Critical Path Tab ────────────────────────────────────────────────────────
const CATEGORY_META: Record<CriticalPath['category'], { color: string; bg: string; icon: any }> = {
  '技术演进': { color: '#2563eb', bg: '#eff6ff', icon: TrendingUp },
  '范式革命': { color: '#10b981', bg: '#ecfdf5', icon: Zap },
  '学者影响': { color: '#8b5cf6', bg: '#f5f3ff', icon: Users },
  '技术溯源': { color: '#f59e0b', bg: '#fffbeb', icon: Search },
  '跨域融合': { color: '#ec4899', bg: '#fdf2f8', icon: GitBranch },
};

function CriticalPathTab({ paths, activePath, nodes, onSelect, onClear }: {
  paths: CriticalPath[];
  activePath: string | null;
  nodes: GNode[];
  onSelect: (cp: CriticalPath) => void;
  onClear: () => void;
}) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Route className="w-4 h-4 text-blue-600" />
            推荐科研知识路径
          </div>
          {activePath && (
            <button onClick={onClear} className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5">
              <X className="w-3 h-3" />清除
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          基于图谱结构、文献影响力与引用传播自动推荐的典型科研传承路径，揭示知识演化脉络
        </p>
      </div>

      <div className="space-y-2.5">
        {paths.map((cp) => {
          const isActive = activePath === cp.id;
          const catMeta = CATEGORY_META[cp.category];
          const CatIcon = catMeta.icon;
          return (
            <div key={cp.id}
              className={`rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${isActive ? 'shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
              style={isActive ? { borderColor: cp.color, boxShadow: `0 4px 16px ${cp.color}25` } : {}}
              onClick={() => onSelect(cp)}
            >
              {/* Header */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap flex-shrink-0"
                      style={{ background: catMeta.bg, color: catMeta.color }}>
                      <CatIcon className="w-2.5 h-2.5" />{cp.category}
                    </span>
                    <span className="text-xs font-semibold text-gray-900 truncate">{cp.name}</span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <span className="text-[10px] text-gray-400">{cp.yearRange}</span>
                    <span className="text-[11px] font-bold" style={{ color: cp.color }}>
                      {(cp.significance * 100).toFixed(0)}分
                    </span>
                  </div>
                </div>

                {/* Significance bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${cp.significance * 100}%`, background: cp.color }} />
                  </div>
                  <span className="text-[10px] text-gray-400">科研意义值</span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{cp.description}</p>
              </div>

              {/* Node chain */}
              <div className="px-3 pb-2">
                <div className="flex items-center flex-wrap gap-1">
                  {cp.nodeIds.map((nid, i) => {
                    const n = nodeMap[nid];
                    if (!n) return null;
                    return (
                      <span key={nid} className="flex items-center gap-0.5">
                        <span className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 text-white font-medium"
                          style={{ background: isActive ? cp.color : TYPE_META[n.type].color }}>
                          <span className="text-[8px] opacity-80 font-bold">{i + 1}</span>
                          {n.label.slice(0, 7)}{n.label.length > 7 ? '…' : ''}
                        </span>
                        {i < cp.nodeIds.length - 1 && (
                          <span className="text-[10px] font-medium" style={{ color: isActive ? cp.color : '#9ca3af' }}>→</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Tags & action */}
              <div className="px-3 pb-2.5 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {cp.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{tag}</span>
                  ))}
                </div>
                <button
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors flex-shrink-0"
                  style={isActive ? { background: cp.color, color: '#fff' } : { background: catMeta.bg, color: catMeta.color }}
                >
                  {isActive ? <><X className="w-3 h-3" />取消</>  : <><Eye className="w-3 h-3" />高亮显示</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="pt-2 border-t border-gray-100">
        <div className="text-[10px] text-gray-400 mb-2">路径类型分布</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(
            paths.reduce((acc, cp) => { acc[cp.category] = (acc[cp.category] || 0) + 1; return acc; }, {} as Record<string, number>)
          ).map(([cat, count]) => {
            const m = CATEGORY_META[cat as CriticalPath['category']];
            return (
              <div key={cat} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: m.bg }}>
                <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                <span className="text-[10px] text-gray-700">{cat}</span>
                <span className="ml-auto text-[10px] font-bold" style={{ color: m.color }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Right Panel Tabs ─────────────────────────────────────────────────────────
function EntityTab({ node, neighbors, multi, count }: { node: GNode | null; neighbors: GNode[]; multi: boolean; count: number }) {
  if (multi) {
    return (
      <div className="text-sm">
        <div className="text-gray-900 font-medium mb-2">多选汇总</div>
        <div className="text-xs text-gray-700 mb-3">共选中 <span className="text-blue-600 font-semibold">{count}</span> 个节点</div>
        <div className="space-y-1.5">
          <button className="w-full px-2 py-1.5 text-xs text-left rounded border border-gray-200 hover:bg-gray-50">汇总聚类</button>
          <button className="w-full px-2 py-1.5 text-xs text-left rounded border border-gray-200 hover:bg-gray-50">导出节点列表</button>
          <button className="w-full px-2 py-1.5 text-xs text-left rounded border border-gray-200 hover:bg-gray-50">在新视图打开</button>
        </div>
      </div>
    );
  }
  if (!node) return <div className="text-xs text-gray-400 text-center py-6">点击节点查看详情</div>;
  const meta = TYPE_META[node.type];
  return (
    <div className="text-sm space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[11px] text-white" style={{ background: meta.color }}>{meta.label}</span>
          <span className="font-semibold text-gray-900">{node.label}</span>
        </div>
        <div className="text-xs text-gray-500">机构类型：{node.region} · 年份：{node.year}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-700 mb-1.5">属性</div>
        <div className="space-y-1 text-xs">
          {[['ID', node.id], ['类型', meta.label], ['社群', node.community], ['度中心性', node.degree],
            ['介数中心性', node.betweenness?.toFixed(3)], ['PageRank', node.pagerank?.toFixed(3)]].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between border-b border-gray-50 py-0.5">
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-800">{v ?? '-'}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-700 mb-1.5">关联节点 Top {neighbors.length}</div>
        <div className="space-y-1">
          {neighbors.map((n) => (
            <button key={n.id} className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-left rounded hover:bg-gray-50">
              <span className="w-2 h-2 rounded-full" style={{ background: TYPE_META[n.type].color }} />
              <span className="text-gray-700">{n.label}</span>
              <span className="ml-auto text-[10px] text-gray-400">{TYPE_META[n.type].label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
        <button className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">以此为中心展开</button>
        <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">隐藏节点</button>
        <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">收藏</button>
      </div>
    </div>
  );
}

// ── Path scoring ─────────────────────────────────────────────────────────────
interface ScoredPath {
  nodeIds: string[];
  nodeLabels: string[];
  edgeTypes: string[];
  length: number;
  score: number;
  subScores: { label: string; value: number }[];
}

const SCORING_MODELS = [
  { id: 'scientific', name: '科研图谱评分 v1.2', weights: { 合作: 0.75, 研发: 0.90, 引用: 0.88, 提出: 0.85, 奠基: 0.80, 实现: 0.82, 改进: 0.78, 推动: 0.70, 包含: 0.60, 演化: 0.88, 验证: 0.75 }, lengthAlpha: 0.6 },
  { id: 'default',    name: '默认评分模型',      weights: { 合作: 0.80, 研发: 0.85, 引用: 0.70, 提出: 0.80, 奠基: 0.75, 实现: 0.80, 改进: 0.78, 推动: 0.65, 包含: 0.60, 演化: 0.82, 验证: 0.70 }, lengthAlpha: 0.5 },
  { id: 'influence',  name: '影响力传播评分',    weights: { 合作: 0.90, 研发: 0.80, 引用: 0.92, 提出: 0.85, 奠基: 0.90, 实现: 0.75, 改进: 0.80, 推动: 0.88, 包含: 0.65, 演化: 0.92, 验证: 0.78 }, lengthAlpha: 0.4 },
];

function computeRawPaths(edgeList: GEdge[], srcId: string, tgtId: string): Array<{ nodeIds: string[]; edgeTypes: string[] }> {
  const results: Array<{ nodeIds: string[]; edgeTypes: string[] }> = [];
  function dfs(cur: string, path: string[], rels: string[], visited: Set<string>) {
    if (cur === tgtId) { results.push({ nodeIds: [...path], edgeTypes: [...rels] }); return; }
    if (path.length >= 7 || results.length >= 20) return;
    for (const e of edgeList) {
      let next = '', rel = e.type;
      if (e.source === cur && !visited.has(e.target)) next = e.target;
      else if (e.target === cur && !visited.has(e.source)) next = e.source;
      if (next) { visited.add(next); dfs(next, [...path, next], [...rels, rel], visited); visited.delete(next); }
    }
  }
  const vis = new Set([srcId]);
  dfs(srcId, [srcId], [], vis);
  return results;
}

function scorePath(path: { nodeIds: string[]; edgeTypes: string[] }, model: typeof SCORING_MODELS[0]): ScoredPath {
  const len = path.nodeIds.length - 1;
  const lenScore = 1 / (1 + model.lengthAlpha * len);
  const weights = path.edgeTypes.map(t => (model.weights as any)[t] ?? 0.6);
  const wpScore = weights.length ? weights.reduce((a: number, b: number) => a * b, 1) : 1;
  const relScore = weights.length ? weights.reduce((a: number, b: number) => a + b, 0) / weights.length : 0.6;
  const score = Math.min(1, lenScore * 0.35 + wpScore * 0.40 + relScore * 0.25);
  return {
    nodeIds: path.nodeIds, nodeLabels: path.nodeIds, edgeTypes: path.edgeTypes, length: len, score,
    subScores: [{ label: '长度得分', value: lenScore }, { label: '权重积', value: wpScore }, { label: '平均权重', value: relScore }],
  };
}

function exportCSV(paths: ScoredPath[], nodeMap: Record<string, string>) {
  const header = ['序号', '路径', '路径长度', '综合评分', '长度得分', '权重积', '平均权重'];
  const rows = paths.map((p, i) => {
    const pathStr = p.nodeIds.map((id, j) => j === 0 ? (nodeMap[id] ?? id) : `--[${p.edgeTypes[j - 1]}]-->${nodeMap[id] ?? id}`).join('');
    return [i + 1, `"${pathStr}"`, p.length, p.score.toFixed(4), ...p.subScores.map(s => s.value.toFixed(4))].join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'path_scoring_results.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── 群体对比分析面板 ──────────────────────────────────────────────────────────

const COMPARE_METRICS = [
  { key: 'degree',      label: '度中心性',   fmt: (v: number) => v.toFixed(1) },
  { key: 'betweenness', label: '介数中心性', fmt: (v: number) => v.toFixed(2) },
  { key: 'closeness',   label: '接近中心性', fmt: (v: number) => v.toFixed(2) },
  { key: 'pagerank',    label: 'PageRank',   fmt: (v: number) => v.toFixed(2) },
] as const;

type MetricKey = (typeof COMPARE_METRICS)[number]['key'];

function CommunityComparePanel({ communities }: { communities: any[] }) {
  const [open, setOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey>('betweenness');

  // Compute per-community mean for every metric
  const stats = communities.map((c) => {
    const ns: any[] = c.nodes ?? [];
    const mean = (key: MetricKey) =>
      ns.length === 0 ? 0 : ns.reduce((s: number, n: any) => s + (n[key] ?? 0), 0) / ns.length;
    return {
      id: c.id,
      size: c.size,
      means: Object.fromEntries(COMPARE_METRICS.map((m) => [m.key, mean(m.key)])) as Record<MetricKey, number>,
    };
  });

  // Global max for the active metric (for bar scaling)
  const maxVal = Math.max(...stats.map((s) => s.means[activeMetric]), 0.001);

  const activeMeta = COMPARE_METRICS.find((m) => m.key === activeMetric)!;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header – toggles open/closed */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-gray-700">群体对比分析</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="p-3 space-y-3">
          {/* Metric selector */}
          <div className="flex flex-wrap gap-1">
            {COMPARE_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                  activeMetric === m.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Bar chart comparison */}
          <div className="space-y-2">
            {stats.map((s) => {
              const val = s.means[activeMetric];
              const pct = (val / maxVal) * 100;
              const color = COMMUNITY_COLORS[s.id] ?? '#94a3b8';
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[11px] text-gray-600">社群 {s.id + 1}</span>
                      <span className="text-[10px] text-gray-400">({s.size} 节点)</span>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>
                      {activeMeta.fmt(val)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary table: all metrics × all communities */}
          <div className="mt-1 overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1 text-gray-400 font-medium pr-2">指标</th>
                  {stats.map((s) => (
                    <th key={s.id} className="text-right py-1 font-medium" style={{ color: COMMUNITY_COLORS[s.id] }}>
                      C{s.id + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COMPARE_METRICS.map((m) => {
                  const rowMax = Math.max(...stats.map((s) => s.means[m.key]));
                  return (
                    <tr key={m.key} className={activeMetric === m.key ? 'bg-blue-50/60' : ''}>
                      <td className="py-1 text-gray-500 pr-2 whitespace-nowrap">{m.label}</td>
                      {stats.map((s) => {
                        const v = s.means[m.key];
                        const isTop = v === rowMax && stats.length > 1;
                        return (
                          <td
                            key={s.id}
                            className={`text-right py-1 tabular-nums font-medium ${isTop ? 'text-blue-700' : 'text-gray-600'}`}
                          >
                            {m.fmt(v)}
                            {isTop && <span className="ml-0.5 text-[8px] text-blue-400">▲</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            均值基于社群内所有节点的中心性指标计算，▲ 表示该指标在所有社群中最高。
          </p>
        </div>
      )}
    </div>
  );
}

function AnalysisTab({ analysisActive, centralityMode, setCentralityMode, centralityRanking, showCommunity, setShowCommunity, communityAlgo, setCommunityAlgo, communities, pathMode, setPathMode, pathEndpoints, setAnalysisActive, nodes, edges }: any) {
  const [scoringModel, setScoringModel] = useState('scientific');
  const [sortBy, setSortBy] = useState<'score' | 'length'>('score');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [maxLen, setMaxLen] = useState(5);
  const [includeNode, setIncludeNode] = useState('');
  const [excludeNode, setExcludeNode] = useState('');
  const [includeRel, setIncludeRel] = useState('');
  const [excludeRel, setExcludeRel] = useState('');
  const [rawPaths, setRawPaths] = useState<ScoredPath[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [exportFlash, setExportFlash] = useState('');
  const [expandedPath, setExpandedPath] = useState<number | null>(null);

  const nodeMap: Record<string, string> = useMemo(() => Object.fromEntries((nodes ?? []).map((n: GNode) => [n.id, n.label])), [nodes]);
  const edgeRelTypes: string[] = useMemo(() => Array.from(new Set((edges ?? []).map((e: GEdge) => e.type))), [edges]);
  const nodeLabels: string[] = useMemo(() => (nodes ?? []).map((n: GNode) => n.label), [nodes]);

  const runScoring = () => {
    if (!pathEndpoints[0] || !pathEndpoints[1]) return;
    const model = SCORING_MODELS.find(m => m.id === scoringModel) ?? SCORING_MODELS[0];
    const raw = computeRawPaths(edges ?? [], pathEndpoints[0], pathEndpoints[1]);
    const scored = raw.map(p => { const sp = scorePath(p, model); return { ...sp, nodeLabels: sp.nodeIds.map(id => nodeMap[id] ?? id) }; });
    setRawPaths(scored); setHasRun(true); setExpandedPath(null);
  };

  const displayPaths = useMemo(() => {
    let list = [...rawPaths];
    if (maxLen < 5) list = list.filter(p => p.length <= maxLen);
    if (includeNode) list = list.filter(p => p.nodeLabels.some(l => l.includes(includeNode)));
    if (excludeNode) list = list.filter(p => !p.nodeLabels.some(l => l.includes(excludeNode)));
    if (includeRel) list = list.filter(p => p.edgeTypes.includes(includeRel));
    if (excludeRel) list = list.filter(p => !p.edgeTypes.includes(excludeRel));
    list.sort((a, b) => { const key = sortBy === 'score' ? 'score' : 'length'; const diff = a[key] - b[key]; return sortDir === 'desc' ? -diff : diff; });
    return list;
  }, [rawPaths, maxLen, includeNode, excludeNode, includeRel, excludeRel, sortBy, sortDir]);

  const handleExport = (fmt: 'csv' | 'excel') => { exportCSV(displayPaths, nodeMap); setExportFlash(fmt); setTimeout(() => setExportFlash(''), 2000); };
  const srcLabel = nodeMap[pathEndpoints[0]] ?? pathEndpoints[0];
  const tgtLabel = nodeMap[pathEndpoints[1]] ?? pathEndpoints[1];

  return (
    <div className="text-sm space-y-4">
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded">
        {(['path', 'centrality', 'community'] as const).map((m) => (
          <button key={m} onClick={() => setAnalysisActive(m)} className={`flex-1 px-2 py-1 text-xs rounded ${analysisActive === m ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>
            {m === 'path' ? '路径' : m === 'centrality' ? '中心性' : '社群'}
          </button>
        ))}
      </div>

      {analysisActive === 'path' && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500">在画布顶部下拉选择起点和终点</div>
          <div className="flex gap-1">
            {(['shortest', 'all'] as const).map((m) => (
              <button key={m} onClick={() => setPathMode(m)} className={`flex-1 px-2 py-1 text-xs rounded ${pathMode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {m === 'shortest' ? '最短路径' : '所有路径 + 评分'}
              </button>
            ))}
          </div>

          {pathEndpoints[0] && pathEndpoints[1] && (
            <div className="text-xs text-gray-700 bg-blue-50 border border-blue-100 rounded p-2">
              <span className="font-medium text-blue-700">{srcLabel}</span>
              <span className="text-gray-400 mx-1">→</span>
              <span className="font-medium text-blue-700">{tgtLabel}</span>
            </div>
          )}

          {pathMode === 'all' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-700">评分模型</div>
                <select value={scoringModel} onChange={e => { setScoringModel(e.target.value); setHasRun(false); }}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400">
                  {SCORING_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-700">路径筛选</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5">最大路径长度</div>
                    <div className="flex items-center gap-1.5">
                      <input type="range" min={1} max={5} value={maxLen} onChange={e => setMaxLen(Number(e.target.value))} className="flex-1 accent-blue-600 h-1" />
                      <span className="text-[10px] font-mono w-4 text-gray-600">{maxLen}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5">包含关系类型</div>
                    <select value={includeRel} onChange={e => setIncludeRel(e.target.value)} className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px] focus:outline-none">
                      <option value="">全部</option>
                      {edgeRelTypes.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5">包含节点</div>
                    <input value={includeNode} onChange={e => setIncludeNode(e.target.value)} placeholder="节点名..." list="node-list-include"
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px] focus:outline-none" />
                    <datalist id="node-list-include">{nodeLabels.map(l => <option key={l} value={l} />)}</datalist>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5">排除节点</div>
                    <input value={excludeNode} onChange={e => setExcludeNode(e.target.value)} placeholder="节点名..." list="node-list-exclude"
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px] focus:outline-none" />
                    <datalist id="node-list-exclude">{nodeLabels.map(l => <option key={l} value={l} />)}</datalist>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-gray-400 mb-0.5">排除关系类型</div>
                    <select value={excludeRel} onChange={e => setExcludeRel(e.target.value)} className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px] focus:outline-none">
                      <option value="">不排除</option>
                      {edgeRelTypes.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={runScoring} disabled={!pathEndpoints[0] || !pathEndpoints[1]}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                <GitBranch className="w-3.5 h-3.5" />查询并评分
              </button>
              {hasRun && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">排序</span>
                  {(['score', 'length'] as const).map(k => (
                    <button key={k} onClick={() => { if (sortBy === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(k); setSortDir('desc'); } }}
                      className={`flex items-center gap-0.5 px-2 py-0.5 text-[10px] rounded border transition-colors ${sortBy === k ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                      {k === 'score' ? '综合评分' : '路径长度'}
                      {sortBy === k && (sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />)}
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] text-gray-400">{displayPaths.length} 条</span>
                </div>
              )}
              {hasRun && (
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {displayPaths.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4">无满足条件的路径</div>
                  ) : displayPaths.map((p, i) => (
                    <div key={i} onClick={() => setExpandedPath(expandedPath === i ? null : i)}
                      className={`border rounded-lg p-2 cursor-pointer transition-colors ${expandedPath === i ? 'border-blue-300 bg-blue-50/40' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-center flex-wrap gap-0.5 mb-1.5">
                        {p.nodeLabels.map((lbl, j) => (
                          <span key={j} className="flex items-center gap-0.5">
                            <span className="text-[10px] font-medium text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded-full">{lbl}</span>
                            {j < p.edgeTypes.length && <span className="text-[9px] text-blue-500 font-medium">—{p.edgeTypes[j]}→</span>}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.score * 100}%`, background: p.score > 0.6 ? '#10b981' : p.score > 0.35 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-[10px] font-mono font-semibold w-9 text-right" style={{ color: p.score > 0.6 ? '#059669' : p.score > 0.35 ? '#d97706' : '#dc2626' }}>
                          {p.score.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{p.length}跳</span>
                      </div>
                      {expandedPath === i && (
                        <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-1">
                          {p.subScores.map(s => (
                            <div key={s.label} className="text-center">
                              <div className="text-[10px] font-bold text-gray-700">{s.value.toFixed(3)}</div>
                              <div className="text-[9px] text-gray-400">{s.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {hasRun && displayPaths.length > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 flex-1">导出分析结果</span>
                  <button onClick={() => handleExport('csv')} className={`flex items-center gap-1 px-2 py-1 text-[10px] border rounded transition-colors ${exportFlash === 'csv' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    <Download className="w-3 h-3" />{exportFlash === 'csv' ? '已导出' : 'CSV'}
                  </button>
                  <button onClick={() => handleExport('excel')} className={`flex items-center gap-1 px-2 py-1 text-[10px] border rounded transition-colors ${exportFlash === 'excel' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    <Download className="w-3 h-3" />{exportFlash === 'excel' ? '已导出' : 'Excel'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {analysisActive === 'centrality' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            {(['none', 'degree', 'betweenness', 'closeness', 'pagerank'] as const).map((m) => (
              <button key={m} onClick={() => setCentralityMode(m)} className={`px-2 py-1 text-xs rounded ${centralityMode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {m === 'none' ? '关闭' : m === 'degree' ? '度' : m === 'betweenness' ? '介数' : m === 'closeness' ? '接近' : 'PageRank'}
              </button>
            ))}
          </div>
          {centralityMode !== 'none' && (
            <>
              <div className="text-xs font-medium text-gray-700">排行榜 Top 20</div>
              <div className="space-y-0.5 max-h-64 overflow-y-auto">
                {centralityRanking.map((n: GNode, i: number) => {
                  const key = centralityMode === 'degree' ? 'degree' : centralityMode === 'betweenness' ? 'betweenness' : centralityMode === 'closeness' ? 'closeness' : 'pagerank';
                  return (
                    <div key={n.id} className="flex items-center justify-between text-xs px-2 py-1 hover:bg-gray-50 rounded">
                      <span className="text-gray-500 w-4">{i + 1}</span>
                      <span className="flex-1 text-gray-800">{n.label}</span>
                      <span className="text-blue-600 font-semibold">{typeof (n as any)[key] === 'number' ? (n as any)[key].toFixed(2) : (n as any)[key]}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {analysisActive === 'community' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1">
            {(['louvain', 'lp', 'cc'] as const).map((m) => (
              <button key={m} onClick={() => setCommunityAlgo(m)} className={`px-1 py-1 text-[11px] rounded ${communityAlgo === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {m === 'louvain' ? 'Louvain' : m === 'lp' ? 'LP' : 'CC'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-gray-700">
            <input type="checkbox" checked={showCommunity} onChange={(e) => setShowCommunity(e.target.checked)} />社群着色
          </label>

          {/* Community list */}
          <div className="text-xs font-medium text-gray-700">社群列表</div>
          <div className="space-y-1">
            {communities.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-xs px-2 py-1 border border-gray-100 rounded">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COMMUNITY_COLORS[c.id] }} />
                  <span className="text-gray-700">社群 {c.id + 1}</span>
                </div>
                <div className="text-gray-500">{c.size} 节点 · {c.key}</div>
              </div>
            ))}
          </div>

          {/* ── 群体对比分析 ── */}
          <CommunityComparePanel communities={communities} />
        </div>
      )}
    </div>
  );
}

function FilterTab({ filters, addFilter, removeFilter, updateFilter }: any) {
  return (
    <div className="text-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">基于属性的复杂逻辑筛选</span>
        <button onClick={addFilter} className="text-xs text-blue-600"><Plus className="w-3.5 h-3.5 inline" />添加</button>
      </div>
      {filters.length === 0 && <div className="text-xs text-gray-400 text-center py-4">暂无筛选规则</div>}
      <div className="space-y-1.5">
        {filters.map((f: FilterRule, idx: number) => (
          <div key={f.id} className="flex items-center gap-1 text-xs">
            {idx > 0 ? (
              <select value={f.logic} onChange={(e) => updateFilter(f.id, { logic: e.target.value })} className="border rounded px-1 py-0.5 w-12">
                <option>AND</option><option>OR</option><option>NOT</option>
              </select>
            ) : <span className="w-12 text-center text-gray-400">WHERE</span>}
            <select value={f.field} onChange={(e) => updateFilter(f.id, { field: e.target.value })} className="border rounded px-1 py-0.5 flex-1">
              <option value="type">类型</option><option value="region">机构类别</option><option value="community">社群</option><option value="year">年份</option>
            </select>
            <select value={f.op} onChange={(e) => updateFilter(f.id, { op: e.target.value })} className="border rounded px-1 py-0.5">
              <option value="eq">=</option><option value="neq">≠</option><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="contains">含</option><option value="regex">正则</option>
            </select>
            <input value={f.value} onChange={(e) => updateFilter(f.id, { value: e.target.value })} className="border rounded px-1 py-0.5 w-14" />
            <button onClick={() => removeFilter(f.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button className="flex-1 px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded">保存为模板</button>
        <button className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded">应用</button>
      </div>
    </div>
  );
}

function StyleTab({ styleRules, addStyleRule, removeStyleRule, updateStyleRule }: any) {
  return (
    <div className="text-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">属性 → 样式映射规则</span>
        <button onClick={addStyleRule} className="text-xs text-blue-600"><Plus className="w-3.5 h-3.5 inline" />添加</button>
      </div>
      {styleRules.length === 0 && <div className="text-xs text-gray-400 text-center py-4">暂无样式规则</div>}
      <div className="space-y-1.5">
        {styleRules.map((r: StyleRule) => (
          <div key={r.id} className="border border-gray-100 rounded p-2 space-y-1">
            <div className="flex items-center gap-1 text-xs">
              <select value={r.target} onChange={(e) => updateStyleRule(r.id, { target: e.target.value })} className="border rounded px-1 py-0.5">
                <option value="node">节点</option><option value="edge">边</option>
              </select>
              <span>当</span>
              <select value={r.field} onChange={(e) => updateStyleRule(r.id, { field: e.target.value })} className="border rounded px-1 py-0.5 flex-1">
                <option value="type">类型</option><option value="region">机构</option>
              </select>
              <span>=</span>
              <input value={r.value} onChange={(e) => updateStyleRule(r.id, { value: e.target.value })} className="border rounded px-1 py-0.5 w-14" />
              <button onClick={() => removeStyleRule(r.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex items-center gap-1 text-xs pl-2">
              <span>→ 设置</span>
              <select value={r.style} onChange={(e) => updateStyleRule(r.id, { style: e.target.value })} className="border rounded px-1 py-0.5">
                <option value="color">颜色</option><option value="size">大小</option><option value="shape">形状</option>
              </select>
              <span>=</span>
              <input value={r.styleValue} onChange={(e) => updateStyleRule(r.id, { styleValue: e.target.value })} className="border rounded px-1 py-0.5 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SnapshotTab({ snapshots, createSnapshot, deleteSnapshot, restoreSnapshot, renameSnapshot, updateSnapshotCaption }: any) {
  return (
    <div className="text-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">共 {snapshots.length} 个快照</span>
        <button onClick={createSnapshot} className="text-xs text-white bg-blue-600 px-2 py-1 rounded flex items-center gap-1"><Camera className="w-3 h-3" />快照</button>
      </div>
      {snapshots.length === 0 && <div className="text-xs text-gray-400 text-center py-6 border border-dashed rounded">暂无快照，点击右上「快照 +」或上方按钮</div>}
      <div className="grid grid-cols-2 gap-2">
        {snapshots.map((s: Snapshot) => (
          <div key={s.id} className="border border-gray-200 rounded p-2 space-y-1">
            <div className="h-16 bg-gradient-to-br from-gray-100 to-blue-100 rounded flex items-center justify-center text-[10px] text-gray-500">{s.thumbnail}</div>
            <input value={s.name} onChange={(e) => renameSnapshot(s.id, e.target.value)} className="w-full text-xs border-b border-transparent focus:border-gray-300 outline-none" />
            <div className="text-[10px] text-gray-500">{s.mode} · {s.createdAt.toLocaleDateString('zh-CN')}</div>
            <input value={s.caption} onChange={(e) => updateSnapshotCaption(s.id, e.target.value)} placeholder="说明..." className="w-full text-[11px] border rounded px-1 py-0.5" />
            <div className="flex gap-1">
              <button onClick={() => restoreSnapshot(s)} className="flex-1 text-[11px] bg-blue-50 text-blue-700 rounded py-0.5">还原</button>
              <button onClick={() => deleteSnapshot(s.id)} className="text-gray-400 hover:text-red-500 px-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryTab({ stories, snapshots, createStory, addSnapshotToStory, removeSnapshotFromStory, onDragStart, onDrop, onExport }: any) {
  return (
    <div className="text-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">共 {stories.length} 个故事</span>
        <div className="flex gap-1">
          <button onClick={createStory} className="text-xs text-blue-600"><Plus className="w-3.5 h-3.5 inline" />新建</button>
          <button onClick={onExport} className="text-xs text-white bg-blue-600 px-2 py-0.5 rounded">导出</button>
        </div>
      </div>
      {stories.length === 0 && <div className="text-xs text-gray-400 text-center py-6 border border-dashed rounded">暂无故事，点击「新建」开始</div>}
      <div className="space-y-3">
        {stories.map((st: any) => (
          <div key={st.id} className="border border-gray-200 rounded p-2 space-y-2">
            <input value={st.title} className="w-full text-sm font-medium border-b border-transparent focus:border-gray-300 outline-none" readOnly />
            <input placeholder="摘要..." className="w-full text-xs border rounded px-1.5 py-0.5" />
            <div className="space-y-1">
              {st.snapshots.map((sid: string) => {
                const snap = snapshots.find((x: any) => x.id === sid);
                if (!snap) return null;
                return (
                  <div key={sid} draggable onDragStart={() => onDragStart(sid)} onDragOver={(e: any) => e.preventDefault()} onDrop={() => onDrop(st.id, sid)}
                    className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded cursor-move">
                    <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-800 flex-1 truncate">{snap.name}</span>
                    <button onClick={() => removeSnapshotFromStory(st.id, sid)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                );
              })}
            </div>
            <select onChange={(e) => { addSnapshotToStory(st.id, e.target.value); (e.target as HTMLSelectElement).value = ''; }} className="w-full text-xs border rounded px-1 py-0.5">
              <option value="">+ 加入快照</option>
              {snapshots.filter((s: any) => !st.snapshots.includes(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className="w-full text-xs bg-gray-100 text-gray-700 rounded py-1"><Eye className="w-3 h-3 inline mr-1" />演示模式</button>
          </div>
        ))}
      </div>
    </div>
  );
}
