import { useEffect, useRef } from 'react';
import {
  Workflow, BrainCircuit, LayoutDashboard, ArrowRight, Share2, TrendingUp, GitBranch,
} from 'lucide-react';

export type IntegratedWorkbenchModule = 'construction' | 'inference' | 'visualization';

const MODULES: Array<{
  id: IntegratedWorkbenchModule;
  title: string;
  subtitle: string;
  icon: typeof Workflow;
  accent: string;
  iconBg: string;
  intro: string[];
  capabilities: string[];
  links?: Array<{ pageId: string; label: string; desc: string; icon: typeof Share2 }>;
}> = [
  {
    id: 'construction',
    title: '图谱构建模块',
    subtitle: 'ETL 与知识抽取流程编排',
    icon: Workflow,
    accent: 'border-blue-200',
    iconBg: 'bg-blue-50 text-blue-600',
    intro: [
      '集成数据接入、映射配置、本体管理与知识抽取等图谱构建能力，形成一站式构建工作台。',
      '提供可视化的 ETL 流水线与抽取策略编排，支持规则、统计学习等多策略组合，降低构建门槛。',
    ],
    capabilities: [
      '数据源接入与字段映射',
      '可视化 ETL / 抽取流程编排',
      '规则与机器学习抽取策略配置',
      '自动化任务生成与构造引擎联动',
    ],
    links: [
      {
        pageId: 'graph-construction',
        label: '进入图谱构造',
        desc: '打开图谱构造页面，编排抽取与构建流程',
        icon: Workflow,
      },
    ],
  },
  {
    id: 'inference',
    title: '推理引擎模块',
    subtitle: '规则学习与知识推理',
    icon: BrainCircuit,
    accent: 'border-violet-200',
    iconBg: 'bg-violet-50 text-violet-600',
    intro: [
      '集成规则学习、条件驱动推理与知识补全等计算引擎，支撑事实驱动的前向链与一致性校验。',
      '本模块以能力说明为主，聚焦推理内核、规则执行与任务调度的一体化接入方式。',
    ],
    capabilities: [
      'Rete / Leaps 等高性能推理内核',
      '规则学习与规则库管理',
      '事实变更触发的增量推理',
      '推理任务启停、调度与结果回流',
    ],
  },
  {
    id: 'visualization',
    title: '可视化 UI 模块',
    subtitle: '图谱浏览、演化与关系分析',
    icon: LayoutDashboard,
    accent: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    intro: [
      '集成图谱可视化、演化分析、关系分析等界面，支持探索式浏览与分析联动。',
      '用户可在统一入口进入各可视化能力，完成路径溯源、主题演进与关系洞察。',
    ],
    capabilities: [
      '交互式图谱可视化与路径探索',
      '技术演进 / 主题演化分析',
      '关系分析与关联发现',
      '统计联动、时间轴与快照报告',
    ],
    links: [
      {
        pageId: 'graph-visualization',
        label: '图谱可视化',
        desc: '交互式浏览节点、边与关键路径',
        icon: Share2,
      },
      {
        pageId: 'evolution-analysis',
        label: '演化分析',
        desc: '观察主题与技术随时间的演化趋势',
        icon: TrendingUp,
      },
      {
        pageId: 'relation-analysis',
        label: '关系分析',
        desc: '分析实体间关系模式与关联强度',
        icon: GitBranch,
      },
    ],
  },
];

/**
 * 审计目录专用：知识图谱一体化工作平台
 */
export default function KgIntegratedWorkbench({
  initialModule,
  onNavigate,
}: {
  initialModule?: IntegratedWorkbenchModule | null;
  onNavigate?: (pageId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialModule) return;
    const timer = window.setTimeout(() => {
      scrollRef.current
        ?.querySelector(`#workbench-${initialModule}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [initialModule]);

  return (
    <div ref={scrollRef} className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">知识图谱一体化工作平台</h1>
          <p className="text-sm text-gray-500">
            集成图谱构建、推理引擎与可视化 UI 的统一 Web 操作平台，提供一站式知识图谱构建与分析体验
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 max-w-4xl leading-relaxed">
        平台将核心能力划分为三大模块：构建侧完成数据到知识的编排落地，推理侧提供规则与计算引擎支撑，
        可视化侧承接探索分析。以下为各模块介绍；可跳转入口已标注在对应模块中。
      </div>

      <div className="space-y-4 max-w-4xl">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const highlighted = initialModule === mod.id;
          return (
            <section
              key={mod.id}
              id={`workbench-${mod.id}`}
              className={`bg-white border rounded-xl overflow-hidden ${mod.accent} ${
                highlighted ? 'ring-2 ring-blue-400/40' : ''
              }`}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
                <span className={`w-10 h-10 rounded-lg inline-flex items-center justify-center flex-shrink-0 ${mod.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg text-gray-900 font-medium">{mod.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{mod.subtitle}</p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                  {mod.intro.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">能力要点</div>
                  <ul className="grid sm:grid-cols-2 gap-1.5">
                    {mod.capabilities.map((c) => (
                      <li key={c} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {mod.links && mod.links.length > 0 && (
                  <div className="pt-1 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-2">快捷入口</div>
                    <div className="flex flex-col gap-2">
                      {mod.links.map((link) => {
                        const LinkIcon = link.icon;
                        return (
                          <button
                            key={link.pageId}
                            type="button"
                            onClick={() => onNavigate?.(link.pageId)}
                            className="flex items-center gap-3 text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
                          >
                            <LinkIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800">{link.label}</div>
                              <div className="text-[11px] text-gray-500">{link.desc}</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!mod.links && (
                  <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                    本模块为能力介绍，暂不提供页面跳转
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
