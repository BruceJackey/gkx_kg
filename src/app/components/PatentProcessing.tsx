import { useEffect, useRef, useState } from 'react';
import {
  Upload, CheckCircle2, ChevronRight, Lightbulb, GitBranch, Cpu, Target,
  Layers, Image as ImageIcon, Play, Loader2,
} from 'lucide-react';
import type { PatentProcessingFocus } from '../data/auditPageMap';

interface PatentClaim {
  id: string; number: number; type: 'independent' | 'dependent';
  component: string; func: string; use: string; text: string;
}
interface TechNode {
  id: string; type: 'solution' | 'structure' | 'application';
  label: string; description: string; color: string;
}
interface ProcessedPatent {
  id: string; number: string; title: string; applicant: string;
  filingDate: string; ipc: string; claims: PatentClaim[];
  techPath: TechNode[];
  figureSummary: string;
}

const mockPatents: ProcessedPatent[] = [
  {
    id: 'p1', number: 'CN202410012345A', title: '一种基于深度学习的知识图谱自动构建方法及装置',
    applicant: '清华大学', filingDate: '2024-02-18', ipc: 'G06F 40/30 · G06N 3/08',
    figureSummary: '识别附图 4 张（结构图 1 · 流程图 2 · 示意图 1），完成附图与权利要求技术特征的初步关联。',
    claims: [
      { id: 'c1', number: 1, type: 'independent', component: '知识抽取模块', func: '对输入文本进行命名实体识别与关系抽取', use: '自动从非结构化文档中构建结构化知识三元组', text: '一种知识图谱自动构建方法，包括：对输入的非结构化文本，利用基于Transformer的命名实体识别模块进行实体识别…' },
      { id: 'c2', number: 2, type: 'independent', component: '图谱融合引擎', func: '对多源知识三元组进行去重与一致性校验', use: '建立跨数据源的统一知识表示与存储', text: '一种知识融合方法，包括：接收来自多个异构数据源的知识三元组，对实体进行跨源对齐…' },
      { id: 'c3', number: 3, type: 'dependent', component: '增量更新机制', func: '对新增知识进行差量计算与动态插入', use: '支持知识图谱的实时更新与版本管理', text: '根据权利要求1所述的方法，其特征在于，还包括增量更新步骤…' },
      { id: 'c4', number: 4, type: 'dependent', component: '查询推理接口', func: '在知识图谱上执行多跳推理查询', use: '为下游智能问答与决策系统提供推理能力', text: '根据权利要求2所述的装置，其特征在于，设有推理查询接口，支持 SPARQL 扩展语法…' },
      { id: 'c5', number: 5, type: 'independent', component: '可视化展示组件', func: '将知识图谱以交互式图形方式渲染', use: '辅助领域专家进行知识验证与编辑', text: '一种知识图谱可视化装置，包括力导向布局引擎和交互式编辑界面…' },
    ],
    techPath: [
      { id: 'n1', type: 'solution', label: '技术方案', description: '基于Transformer的端到端知识抽取与融合方法', color: '#3b82f6' },
      { id: 'n2', type: 'structure', label: '结构实现', description: 'NER模块 + 关系抽取器 + 图谱融合引擎 + 增量更新机制', color: '#8b5cf6' },
      { id: 'n3', type: 'application', label: '应用场景', description: '科研知识管理 · 智能问答 · 辅助决策 · 领域知识库建设', color: '#10b981' },
    ],
  },
  {
    id: 'p2', number: 'CN202310987654B', title: '多模态语义理解装置及其专利技术方案分析系统',
    applicant: '北京人工智能研究院', filingDate: '2023-11-05', ipc: 'G06V 10/80 · G06F 18/24',
    figureSummary: '识别附图 2 张（结构图 1 · 示意图 1），完成附图与权利要求技术特征的初步关联。',
    claims: [
      { id: 'c1', number: 1, type: 'independent', component: '多模态编码器', func: '对图像、文本、表格等多种模态数据进行联合编码', use: '实现跨模态语义对齐与统一表示', text: '一种多模态语义理解方法，包括：利用视觉Transformer对输入图像进行特征提取…' },
      { id: 'c2', number: 2, type: 'dependent', component: '跨模态注意力机制', func: '计算不同模态特征间的相关性权重', use: '增强模态间的语义关联与信息互补', text: '根据权利要求1所述的装置，设有跨模态注意力层…' },
      { id: 'c3', number: 3, type: 'independent', component: '专利图解析器', func: '对专利附图进行结构识别与语义标注', use: '自动理解专利技术方案的图示内容', text: '一种专利图自动解析方法，包括检测图中的功能模块框、连接线和文字标注…' },
    ],
    techPath: [
      { id: 'n1', type: 'solution', label: '技术方案', description: '跨模态联合编码与注意力融合技术', color: '#3b82f6' },
      { id: 'n2', type: 'structure', label: '结构实现', description: '视觉Transformer + 文本编码器 + 跨模态注意力层', color: '#8b5cf6' },
      { id: 'n3', type: 'application', label: '应用场景', description: '专利图解析 · 多模态检索 · 产品图文理解', color: '#10b981' },
    ],
  },
];

const CAPABILITIES = [
  {
    id: 'multimodal' as const,
    label: '专利多模态内容解析',
    desc: '支持对专利文件中的附图进行识别和初步理解。',
    icon: ImageIcon,
  },
  {
    id: 'claims' as const,
    label: '权利要求结构化抽取',
    desc: '抽取「权利部件-功能-用途」三元组。',
    icon: Layers,
  },
  {
    id: 'pathway' as const,
    label: '技术路径模型构建',
    desc: '技术方案 → 结构实现 → 应用场景。',
    icon: GitBranch,
  },
];

export default function PatentProcessing({
  initialFocus = 'multimodal',
}: {
  initialFocus?: PatentProcessingFocus | null;
}) {
  const [selectedId, setSelectedId] = useState('p1');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(
    () => initialFocus === 'claims' || initialFocus === 'pathway',
  );
  const claimsRef = useRef<HTMLDivElement>(null);
  const pathwayRef = useRef<HTMLDivElement>(null);

  const patent = mockPatents.find((p) => p.id === selectedId)!;

  const runParse = () => {
    setParsing(true);
    window.setTimeout(() => {
      setParsing(false);
      setParsed(true);
    }, 700);
  };

  const selectPatent = (id: string) => {
    setSelectedId(id);
    setParsed(false);
  };

  useEffect(() => {
    if (initialFocus === 'claims' || initialFocus === 'pathway') {
      setParsed(true);
      window.setTimeout(() => {
        const el = initialFocus === 'claims' ? claimsRef.current : pathwayRef.current;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [initialFocus]);

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden p-8">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">专利处理</div>
          <h1 className="text-xl font-semibold text-gray-900">专利多模态内容解析</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">
            对技术专利进行一次深度解析：识别附图后，同步输出权利要求结构化三元组与「技术方案—结构实现—应用场景」路径模型。
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      {/* 能力流水线（展示用，非多页切换） */}
      <div className="flex items-center gap-0 bg-white border border-gray-200 rounded-xl px-4 py-3 flex-shrink-0 overflow-x-auto">
        {CAPABILITIES.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 min-w-[150px]">
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
        {/* 左侧：选择专利 */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-3">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">上传专利文件</p>
            <div className="flex justify-center gap-1.5">
              {['XML', 'PDF', 'TXT'].map((f) => (
                <span key={f} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{f}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
            {mockPatents.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPatent(p.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedId === p.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="text-xs text-gray-800 leading-snug line-clamp-2 mb-1">{p.title}</p>
                <p className="text-[10px] text-gray-400 font-mono truncate">{p.number}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：介绍 + 一次解析 + 结果板块 */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm text-gray-900 font-medium mb-1">{patent.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-blue-600 font-mono">{patent.number}</span>
                <span className="text-xs text-gray-500">{patent.applicant}</span>
                <span className="text-xs text-gray-400">{patent.filingDate}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">{patent.ipc}</span>
              </div>
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

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            {/* 多模态：仅介绍 */}
            <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">专利多模态内容解析</h3>
              </div>
              <p className="text-xs text-blue-800/80 leading-relaxed">
                支持对专利文件中的附图（结构图、流程图、示意图等）进行识别和初步理解，作为后续权利要求抽取与技术路径构建的输入。
                点击「开始解析」后，一次完成附图理解、三元组抽取与路径建模。
              </p>
              {parsed && (
                <p className="mt-3 text-xs text-blue-700 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {patent.figureSummary}
                </p>
              )}
            </section>

            {!parsed && !parsing && (
              <div className="text-center py-12 text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                选择专利后点击「开始解析」，下方将展示权利要求结构化抽取与技术路径模型结果
              </div>
            )}

            {parsed && (
              <>
                {/* 权利要求结构化抽取 */}
                <section
                  id="patent-claims"
                  ref={claimsRef}
                  className={`flex flex-col gap-3 scroll-mt-4 ${
                    initialFocus === 'claims' ? 'ring-2 ring-blue-200 rounded-xl p-1' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">权利要求结构化抽取</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    利用 NLP 将复杂权利要求语句抽取为「权利部件 — 功能 — 用途」结构化三元组，共 {patent.claims.length} 项。
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {['#', '类型', '权利部件', '功能', '用途'].map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 text-gray-500 font-medium border-b border-gray-200">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {patent.claims.map((c) => (
                          <tr key={c.id} className="border-b border-gray-50">
                            <td className="px-3 py-3 text-gray-400 w-8">{c.number}</td>
                            <td className="px-3 py-3">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                c.type === 'independent' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {c.type === 'independent' ? '独立项' : '从属项'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-gray-800 font-medium">{c.component}</td>
                            <td className="px-3 py-3 text-gray-600">{c.func}</td>
                            <td className="px-3 py-3 text-gray-500">{c.use}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 技术路径模型构建 */}
                <section
                  id="patent-pathway"
                  ref={pathwayRef}
                  className={`flex flex-col gap-4 scroll-mt-4 ${
                    initialFocus === 'pathway' ? 'ring-2 ring-blue-200 rounded-xl p-1' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">技术路径模型构建</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    基于抽取结果，建立标准化知识路径：技术方案 → 结构实现 → 应用场景
                  </p>

                  <div className="flex items-stretch gap-0 bg-gray-50 border border-gray-200 rounded-xl p-5">
                    {patent.techPath.map((node, i) => (
                      <div key={node.id} className="flex items-center flex-1">
                        <div className="flex-1">
                          <div className="rounded-xl border-2 p-4 bg-white" style={{ borderColor: `${node.color}40` }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${node.color}20` }}
                              >
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

                  <div>
                    <div className="text-xs text-gray-500 mb-2">权利项路径映射</div>
                    {patent.claims.filter((c) => c.type === 'independent').map((c) => (
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
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
