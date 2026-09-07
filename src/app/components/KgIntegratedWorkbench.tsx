import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  GitBranch,
  LayoutDashboard,
  Share2,
  TrendingUp,
  Workflow,
} from 'lucide-react';

export type IntegratedWorkbenchModule = 'construction' | 'inference' | 'visualization';

/** 与 auditCatalog 功能点 name / featureDesc 严格对齐 */
const MODULES: Array<{
  id: IntegratedWorkbenchModule;
  title: string;
  featureDesc: string;
  icon: typeof Workflow;
  tone: {
    card: string;
    icon: string;
    badge: string;
    cta: string;
  };
  bullets: string[];
  links?: Array<{ pageId: string; label: string; desc: string; icon: typeof Share2 }>;
  introOnly?: boolean;
}> = [
  {
    id: 'construction',
    title: '图谱构建模块',
    featureDesc: '集成所有图谱构建相关的功能，提供可视化的ETL和知识抽取流程编排。',
    icon: Workflow,
    tone: {
      card: 'border-sky-200 hover:border-sky-300',
      icon: 'bg-sky-50 text-sky-700',
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
      cta: 'bg-sky-600 hover:bg-sky-700',
    },
    bullets: [
      '数据源接入、映射配置与本体管理一体化编排',
      '可视化 ETL / 知识抽取流水线',
      '规则、统计学习等多策略抽取组合',
      '与图谱构造、图谱任务联动落地',
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
    featureDesc: '集成规则学习、知识推理等计算引擎。',
    icon: BrainCircuit,
    tone: {
      card: 'border-indigo-200 hover:border-indigo-300',
      icon: 'bg-indigo-50 text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      cta: 'bg-indigo-600 hover:bg-indigo-700',
    },
    bullets: [
      '规则学习流水线接入',
      '知识推理 / 条件驱动前向链',
      '事实变更触发的增量推理',
      '推理任务调度与结果回流',
    ],
    introOnly: true,
  },
  {
    id: 'visualization',
    title: '可视化UI模块',
    featureDesc: '集成图谱可视化、演化分析、关系分析等可视化界面。',
    icon: LayoutDashboard,
    tone: {
      card: 'border-teal-200 hover:border-teal-300',
      icon: 'bg-teal-50 text-teal-700',
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      cta: 'bg-teal-600 hover:bg-teal-700',
    },
    bullets: [
      '交互式图谱可视化与路径探索',
      '技术 / 主题演化分析',
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
 * 审计目录专用：知识图谱一体化工作平台（门户页）
 * 三个模块介绍；构建 → 图谱构造；推理仅介绍；可视化 → 可视化/演化/关系分析
 */
export default function KgIntegratedWorkbench({
  initialModule,
  onNavigate,
}: {
  initialModule?: IntegratedWorkbenchModule | null;
  onNavigate?: (pageId: string) => void;
}) {
  const [active, setActive] = useState<IntegratedWorkbenchModule | null>(initialModule ?? null);

  useEffect(() => {
    setActive(initialModule ?? null);
  }, [initialModule]);

  const activeMod = MODULES.find((m) => m.id === active) ?? null;
  const pageTitle = activeMod?.title ?? '知识图谱一体化工作平台';
  const pageDesc =
    activeMod?.featureDesc ??
    '构建一个集成了所有核心功能的、统一的Web操作平台，为用户提供一站式的知识图谱构建与分析体验。';

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pb-6">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          {activeMod && (
            <button
              type="button"
              onClick={() => setActive(null)}
              className="text-[11px] text-gray-400 hover:text-teal-700 mb-0.5"
            >
              知识图谱一体化工作平台
            </button>
          )}
          <h1 className="text-2xl text-gray-900 mb-1">{pageTitle}</h1>
          <p className="text-sm text-gray-500 max-w-3xl leading-relaxed">{pageDesc}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      {/* 门户三模块 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const selected = active === mod.id;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => setActive(mod.id)}
              className={`text-left bg-white border rounded-2xl p-5 transition-all ${mod.tone.card} ${
                selected ? 'ring-2 ring-offset-1 ring-slate-300 shadow-sm' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`w-10 h-10 rounded-xl inline-flex items-center justify-center ${mod.tone.icon}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${mod.tone.badge}`}>
                  {mod.introOnly ? '仅介绍' : '可跳转'}
                </span>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-1.5">{mod.title}</h2>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{mod.featureDesc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs text-gray-600">
                查看模块
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 模块详情 */}
      {activeMod && (() => {
        const ActiveIcon = activeMod.icon;
        return (
        <section className={`bg-white border rounded-2xl overflow-hidden max-w-5xl ${activeMod.tone.card}`}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <span className={`w-9 h-9 rounded-lg inline-flex items-center justify-center ${activeMod.tone.icon}`}>
              <ActiveIcon className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{activeMod.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{activeMod.featureDesc}</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-2">能力要点</div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {activeMod.bullets.map((b) => (
                  <li key={b} className="text-sm text-gray-700 flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {activeMod.introOnly && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                本模块为能力介绍，不提供页面跳转。规则学习、知识推理等计算引擎在平台内统一接入。
              </div>
            )}

            {activeMod.links && activeMod.links.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">快捷入口</div>
                <div className="flex flex-col gap-2">
                  {activeMod.links.map((link) => {
                    const LinkIcon = link.icon;
                    return (
                      <button
                        key={link.pageId}
                        type="button"
                        onClick={() => onNavigate?.(link.pageId)}
                        className="flex items-center gap-3 text-left px-3 py-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/40 transition-colors"
                      >
                        <span className={`w-9 h-9 rounded-lg inline-flex items-center justify-center flex-shrink-0 ${activeMod.tone.icon}`}>
                          <LinkIcon className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{link.label}</div>
                          <div className="text-[11px] text-gray-500">{link.desc}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
        );
      })()}

      {!activeMod && (
        <div className="max-w-5xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed">
          请选择上方模块卡片查看介绍。图谱构建模块可进入图谱构造；推理引擎模块仅介绍；可视化UI模块可跳转图谱可视化、演化分析与关系分析。
        </div>
      )}
    </div>
  );
}
