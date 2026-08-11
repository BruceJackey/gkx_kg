import { useState } from 'react';
import {
  Upload, FileText, CheckCircle2, ChevronRight, Plus, Trash2,
  Tag, Lightbulb, Settings2, FolderOpen, Zap, ToggleLeft, ToggleRight,
  Edit2, Check, X, GitBranch, Cpu, Target, Layers, AlertCircle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatentClaim {
  id: string; number: number; type: 'independent' | 'dependent';
  component: string; func: string; use: string; text: string;
}
interface PatentFigure {
  id: string; number: string; description: string;
  figType: 'structural' | 'flowchart' | 'schematic'; color: string;
}
interface TechNode {
  id: string; type: 'solution' | 'structure' | 'application';
  label: string; description: string; color: string;
}
interface ProcessedPatent {
  id: string; number: string; title: string; applicant: string;
  filingDate: string; ipc: string; claims: PatentClaim[];
  figures: PatentFigure[]; techPath: TechNode[];
  keywords: string[]; suggestedTags: string[];
}
interface AutoRule {
  id: string;
  condition: { field: 'title' | 'keywords' | 'applicant' | 'ipc'; operator: 'contains' | 'equals'; value: string };
  action: { folderName: string };
  enabled: boolean;
}

type PatentTab = 'overview' | 'claims' | 'pathway' | 'tagging';
const uid = () => Math.random().toString(36).slice(2, 9);

const FIELD_LABEL: Record<string, string> = { title: '标题', keywords: '关键词', applicant: '申请人', ipc: 'IPC分类' };
const OP_LABEL: Record<string, string> = { contains: '包含', equals: '等于' };

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockPatents: ProcessedPatent[] = [
  {
    id: 'p1', number: 'CN202410012345A', title: '一种基于深度学习的知识图谱自动构建方法及装置',
    applicant: '清华大学', filingDate: '2024-02-18', ipc: 'G06F 40/30 · G06N 3/08',
    claims: [
      { id: 'c1', number: 1, type: 'independent', component: '知识抽取模块', func: '对输入文本进行命名实体识别与关系抽取', use: '自动从非结构化文档中构建结构化知识三元组', text: '一种知识图谱自动构建方法，包括：对输入的非结构化文本，利用基于Transformer的命名实体识别模块进行实体识别…' },
      { id: 'c2', number: 2, type: 'independent', component: '图谱融合引擎', func: '对多源知识三元组进行去重与一致性校验', use: '建立跨数据源的统一知识表示与存储', text: '一种知识融合方法，包括：接收来自多个异构数据源的知识三元组，对实体进行跨源对齐…' },
      { id: 'c3', number: 3, type: 'dependent', component: '增量更新机制', func: '对新增知识进行差量计算与动态插入', use: '支持知识图谱的实时更新与版本管理', text: '根据权利要求1所述的方法，其特征在于，还包括增量更新步骤…' },
      { id: 'c4', number: 4, type: 'dependent', component: '查询推理接口', func: '在知识图谱上执行多跳推理查询', use: '为下游智能问答与决策系统提供推理能力', text: '根据权利要求2所述的装置，其特征在于，设有推理查询接口，支持 SPARQL 扩展语法…' },
      { id: 'c5', number: 5, type: 'independent', component: '可视化展示组件', func: '将知识图谱以交互式图形方式渲染', use: '辅助领域专家进行知识验证与编辑', text: '一种知识图谱可视化装置，包括力导向布局引擎和交互式编辑界面…' },
    ],
    figures: [
      { id: 'f1', number: '附图1', description: '系统整体架构图，展示文本输入至图谱存储的完整数据流', figType: 'structural', color: '#3b82f6' },
      { id: 'f2', number: '附图2', description: '知识抽取流程图，包含预处理、NER、RE三个阶段', figType: 'flowchart', color: '#10b981' },
      { id: 'f3', number: '附图3', description: '图谱融合算法示意图，展示实体对齐与冲突消解步骤', figType: 'schematic', color: '#8b5cf6' },
      { id: 'f4', number: '附图4', description: '增量更新时序图，说明知识变更的传播与同步机制', figType: 'flowchart', color: '#f59e0b' },
    ],
    techPath: [
      { id: 'n1', type: 'solution', label: '技术方案', description: '基于Transformer的端到端知识抽取与融合方法', color: '#3b82f6' },
      { id: 'n2', type: 'structure', label: '结构实现', description: 'NER模块 + 关系抽取器 + 图谱融合引擎 + 增量更新机制', color: '#8b5cf6' },
      { id: 'n3', type: 'application', label: '应用场景', description: '科研知识管理 · 智能问答 · 辅助决策 · 领域知识库建设', color: '#10b981' },
    ],
    keywords: ['知识图谱', '深度学习', '知识抽取', '实体识别', '关系抽取'],
    suggestedTags: ['自然语言处理', '图神经网络', '知识工程', '信息抽取', 'BERT', '智能问答'],
  },
  {
    id: 'p2', number: 'CN202310987654B', title: '多模态语义理解装置及其专利技术方案分析系统',
    applicant: '北京人工智能研究院', filingDate: '2023-11-05', ipc: 'G06V 10/80 · G06F 18/24',
    claims: [
      { id: 'c1', number: 1, type: 'independent', component: '多模态编码器', func: '对图像、文本、表格等多种模态数据进行联合编码', use: '实现跨模态语义对齐与统一表示', text: '一种多模态语义理解方法，包括：利用视觉Transformer对输入图像进行特征提取…' },
      { id: 'c2', number: 2, type: 'dependent', component: '跨模态注意力机制', func: '计算不同模态特征间的相关性权重', use: '增强模态间的语义关联与信息互补', text: '根据权利要求1所述的装置，设有跨模态注意力层…' },
      { id: 'c3', number: 3, type: 'independent', component: '专利图解析器', func: '对专利附图进行结构识别与语义标注', use: '自动理解专利技术方案的图示内容', text: '一种专利图自动解析方法，包括检测图中的功能模块框、连接线和文字标注…' },
    ],
    figures: [
      { id: 'f1', number: '附图1', description: '多模态编码架构，展示视觉与文本特征的融合路径', figType: 'structural', color: '#06b6d4' },
      { id: 'f2', number: '附图2', description: '跨模态注意力矩阵可视化示意图', figType: 'schematic', color: '#ec4899' },
    ],
    techPath: [
      { id: 'n1', type: 'solution', label: '技术方案', description: '跨模态联合编码与注意力融合技术', color: '#3b82f6' },
      { id: 'n2', type: 'structure', label: '结构实现', description: '视觉Transformer + 文本编码器 + 跨模态注意力层', color: '#8b5cf6' },
      { id: 'n3', type: 'application', label: '应用场景', description: '专利图解析 · 多模态检索 · 产品图文理解', color: '#10b981' },
    ],
    keywords: ['多模态学习', '语义理解', '视觉Transformer', '跨模态注意力'],
    suggestedTags: ['计算机视觉', '文本图像匹配', '表示学习', 'ViT'],
  },
];

const FOLDERS = ['知识图谱研究', '自然语言处理', '高影响力文献', '计算机视觉', '新建文件夹…'];

const TABS: { id: PatentTab; label: string; icon: any }[] = [
  { id: 'overview', label: '专利概览', icon: FileText },
  { id: 'claims', label: '权利要求', icon: Layers },
  { id: 'pathway', label: '技术路径', icon: GitBranch },
  { id: 'tagging', label: '自动标签', icon: Tag },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatentProcessing() {
  const [selectedId, setSelectedId] = useState('p1');
  const [activeTab, setActiveTab] = useState<PatentTab>('overview');
  const [userTags, setUserTags] = useState<Record<string, string[]>>({
    p1: ['知识图谱', '深度学习', '知识抽取'],
    p2: ['多模态学习', '语义理解'],
  });
  const [newTagInput, setNewTagInput] = useState('');
  const [autoRules, setAutoRules] = useState<AutoRule[]>([
    { id: 'r1', condition: { field: 'title', operator: 'contains', value: '知识图谱' }, action: { folderName: '知识图谱研究' }, enabled: true },
    { id: 'r2', condition: { field: 'keywords', operator: 'contains', value: 'Transformer' }, action: { folderName: '自然语言处理' }, enabled: true },
    { id: 'r3', condition: { field: 'ipc', operator: 'contains', value: 'G06V' }, action: { folderName: '计算机视觉' }, enabled: false },
  ]);
  const [newRule, setNewRule] = useState({ field: 'title' as const, operator: 'contains' as const, value: '', folderName: '' });
  const [addingRule, setAddingRule] = useState(false);

  const patent = mockPatents.find(p => p.id === selectedId)!;
  const tags = userTags[selectedId] ?? [];

  const addTag = (tag: string) => {
    if (!tag.trim() || tags.includes(tag.trim())) return;
    setUserTags(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), tag.trim()] }));
    setNewTagInput('');
  };

  const removeTag = (tag: string) => setUserTags(prev => ({ ...prev, [selectedId]: prev[selectedId].filter(t => t !== tag) }));

  const toggleRule = (id: string) => setAutoRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = (id: string) => setAutoRules(prev => prev.filter(r => r.id !== id));

  const saveNewRule = () => {
    if (!newRule.value.trim() || !newRule.folderName) return;
    setAutoRules(prev => [...prev, { id: uid(), condition: { field: newRule.field, operator: newRule.operator, value: newRule.value }, action: { folderName: newRule.folderName }, enabled: true }]);
    setNewRule({ field: 'title', operator: 'contains', value: '', folderName: '' });
    setAddingRule(false);
  };

  const TYPE_COLOR = { structural: '#3b82f6', flowchart: '#10b981', schematic: '#8b5cf6' };
  const TYPE_LABEL = { structural: '结构图', flowchart: '流程图', schematic: '示意图' };

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl text-gray-900 mb-1">专利处理</h1>
        <p className="text-sm text-gray-500">解析专利附图与权利要求，构建技术路径模型，自动提取标签并归档至知识仓库</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left panel */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-3">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">上传专利文件</p>
            <div className="flex justify-center gap-1.5">
              {['XML', 'PDF', 'TXT'].map(f => <span key={f} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{f}</span>)}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
            {mockPatents.map(p => (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedId === p.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${selectedId === p.id ? 'text-blue-500' : 'text-green-500'}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-800 leading-snug line-clamp-2 mb-1">{p.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{p.number}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.applicant}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-w-0">
          {/* Patent header */}
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm text-gray-900 font-medium mb-1">{patent.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-blue-600 font-mono">{patent.number}</span>
                  <span className="text-xs text-gray-500">{patent.applicant}</span>
                  <span className="text-xs text-gray-400">{patent.filingDate}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{patent.ipc}</span>
                </div>
              </div>
            </div>
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

          <div className="flex-1 overflow-y-auto p-5">

            {/* ── 专利概览 ── */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '权利要求', value: patent.claims.length + ' 项' },
                    { label: '附图数量', value: patent.figures.length + ' 张' },
                    { label: '独立权项', value: patent.claims.filter(c => c.type === 'independent').length + ' 项' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-center">
                      <div className="text-lg text-gray-900 font-semibold">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5" />专利附图识别
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {patent.figures.map(fig => {
                      const c = TYPE_COLOR[fig.figType];
                      return (
                        <div key={fig.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="h-24 flex flex-col items-center justify-center gap-1" style={{ background: `linear-gradient(135deg, ${c}18, ${c}08)` }}>
                            <div className="text-xs font-semibold" style={{ color: c }}>{TYPE_LABEL[fig.figType]}</div>
                            <div className="text-[10px] text-gray-400">{fig.number}</div>
                          </div>
                          <div className="p-2.5">
                            <p className="text-[11px] text-gray-600 leading-relaxed">{fig.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── 权利要求 ── */}
            {activeTab === 'claims' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  已提取「权利部件 — 功能 — 用途」三元组，共 {patent.claims.length} 项权利要求
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        {['#', '类型', '权利部件', '功能', '用途'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-gray-500 font-medium border-b border-gray-200">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {patent.claims.map(c => (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-3 text-gray-400 w-8">{c.number}</td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.type === 'independent' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                              {c.type === 'independent' ? '独立项' : '从属项'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-800 font-medium">{c.component}</td>
                          <td className="px-3 py-3 text-gray-600 max-w-[160px]">{c.func}</td>
                          <td className="px-3 py-3 text-gray-500 max-w-[180px]">{c.use}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-2 font-medium">第1项原文（示例）</div>
                  <p className="text-xs text-gray-600 leading-relaxed">{patent.claims[0]?.text}</p>
                </div>
              </div>
            )}

            {/* ── 技术路径 ── */}
            {activeTab === 'pathway' && (
              <div className="flex flex-col gap-6">
                <div className="text-xs text-gray-500">基于权利要求抽取结果，建立标准化技术路径：<span className="text-gray-700">技术方案 → 结构实现 → 应用场景</span></div>

                {/* Visual flow */}
                <div className="flex items-stretch gap-0 bg-gray-50 border border-gray-200 rounded-xl p-5">
                  {patent.techPath.map((node, i) => (
                    <div key={node.id} className="flex items-center flex-1">
                      <div className="flex-1">
                        <div className="rounded-xl border-2 p-4 bg-white" style={{ borderColor: node.color + '40' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: node.color + '20' }}>
                              {node.type === 'solution' && <Lightbulb className="w-3.5 h-3.5" style={{ color: node.color }} />}
                              {node.type === 'structure' && <Cpu className="w-3.5 h-3.5" style={{ color: node.color }} />}
                              {node.type === 'application' && <Target className="w-3.5 h-3.5" style={{ color: node.color }} />}
                            </div>
                            <span className="text-xs font-semibold" style={{ color: node.color }}>{node.label}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{node.description}</p>
                        </div>
                      </div>
                      {i < patent.techPath.length - 1 && (
                        <div className="flex-shrink-0 px-2">
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Claims mapping */}
                <div>
                  <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">权利项路径映射</div>
                  {patent.claims.filter(c => c.type === 'independent').map(c => (
                    <div key={c.id} className="flex items-center gap-2 mb-2 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium flex-shrink-0">权{c.number}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{c.component}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-500 flex-shrink-0">{c.func}</span>
                      <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate">{c.use}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 自动标签 ── */}
            {activeTab === 'tagging' && (
              <div className="flex flex-col gap-6">
                {/* Extracted keywords */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-700 font-medium">内容关键词提取</span>
                    <span className="text-xs text-gray-400">（{patent.keywords.length} 个核心关键词）</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {patent.keywords.map(k => (
                      <span key={k} className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full">
                        <Tag className="w-3 h-3" />{k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Smart recommendations */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700 font-medium">智能标签推荐</span>
                    <span className="text-xs text-gray-400">基于历史标签行为</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {patent.suggestedTags.map(t => (
                      <button key={t} onClick={() => addTag(t)}
                        disabled={tags.includes(t)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${tags.includes(t) ? 'bg-blue-50 text-blue-600 border-blue-200 cursor-default' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'}`}>
                        <Plus className={`w-3 h-3 ${tags.includes(t) ? 'rotate-45' : ''}`} />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* My tags */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 font-medium">已添加标签</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(t => (
                      <span key={t} className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {t}
                        <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input value={newTagInput} onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTag(newTagInput)}
                        placeholder="添加标签…"
                        className="text-xs border border-dashed border-gray-300 rounded-full px-2.5 py-1 w-24 focus:outline-none focus:border-blue-400 text-gray-600 placeholder-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Auto-archiving rules */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium">自动归档规则</span>
                    </div>
                    <button onClick={() => setAddingRule(true)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors">
                      <Plus className="w-3.5 h-3.5" />新建规则
                    </button>
                  </div>

                  {/* New rule form */}
                  {addingRule && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                      <div className="text-xs text-blue-700 font-medium mb-3">IF … THEN 规则配置</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600 font-medium">若</span>
                        <select value={newRule.field} onChange={e => setNewRule(r => ({ ...r, field: e.target.value as any }))}
                          className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400">
                          {Object.entries(FIELD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <select value={newRule.operator} onChange={e => setNewRule(r => ({ ...r, operator: e.target.value as any }))}
                          className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400">
                          {Object.entries(OP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <input value={newRule.value} onChange={e => setNewRule(r => ({ ...r, value: e.target.value }))}
                          placeholder="值…" className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400 w-28" />
                        <span className="text-xs text-gray-600 font-medium">则移入</span>
                        <select value={newRule.folderName} onChange={e => setNewRule(r => ({ ...r, folderName: e.target.value }))}
                          className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400">
                          <option value="">选择文件夹…</option>
                          {FOLDERS.filter(f => f !== '新建文件夹…').map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={saveNewRule} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                          <Check className="w-3.5 h-3.5" />保存规则
                        </button>
                        <button onClick={() => setAddingRule(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors">取消</button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {autoRules.map(rule => (
                      <div key={rule.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-gray-500">若</span>
                            <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{FIELD_LABEL[rule.condition.field]}</span>
                            <span className="text-[11px] text-gray-500">{OP_LABEL[rule.condition.operator]}</span>
                            <span className="text-[11px] font-medium text-gray-700">「{rule.condition.value}」</span>
                            <span className="text-[11px] text-gray-500">则移入</span>
                            <span className="text-[11px] flex items-center gap-1 text-blue-600">
                              <FolderOpen className="w-3 h-3" />{rule.action.folderName}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => toggleRule(rule.id)} className="flex-shrink-0">
                          {rule.enabled
                            ? <ToggleRight className="w-5 h-5 text-blue-500" />
                            : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className="flex-shrink-0 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                    规则按顺序执行，命中后文献将自动保存至对应知识仓库文件夹。可在「知识仓库」页面查看归档结果。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
