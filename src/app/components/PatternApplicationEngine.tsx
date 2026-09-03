import { Layers, Database, Search, Workflow } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Layers,
    title: '高质量模式输入',
    desc: '接收经评分与人工阈值筛选后的候选模式集合，仅对达到质量门槛的模式执行大规模匹配。',
  },
  {
    icon: Database,
    title: '指定语料库扫描',
    desc: '将模式应用于用户在「语料库选择与配置」中选定的一个或多个文本语料库，支持批量子集与全库扫描。',
  },
  {
    icon: Search,
    title: '大规模文本匹配',
    desc: '按模式槽位与字面/词性约束在语料中检索命中片段，输出匹配位置、上下文窗口与命中模式 ID。',
  },
  {
    icon: Workflow,
    title: '下游衔接',
    desc: '匹配结果交给「新实例抽取」解析实体槽位，再由「实例置信度评估」综合模式质量与命中次数打分。',
  },
];

/**
 * 审计目录专用：模式应用引擎介绍
 */
export default function PatternApplicationEngine() {
  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">模式应用引擎</h1>
          <p className="text-sm text-gray-500">
            将筛选出的高质量模式应用于指定语料库，进行大规模文本匹配
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-4xl space-y-5">
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 leading-relaxed space-y-2">
          <p>
            模式应用引擎是实体学习流水线中的执行层：在候选模式完成自动评分与人工阈值筛选后，
            引擎把这些模式批量部署到目标语料库，完成大规模字符串 / 槽位匹配，为新实例发现提供证据片段。
          </p>
          <p className="text-xs text-slate-500">
            本页为能力介绍；实际抽取与置信度计算见「新实例抽取」「实例置信度评估」接口演示页。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 inline-flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-medium text-gray-900">{title}</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">典型流程</div>
          <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
            <li>加载阈值以上的高质量模式集合</li>
            <li>绑定目标语料库与扫描范围</li>
            <li>并行匹配并汇总命中片段</li>
            <li>将匹配结果送入新实例抽取与置信度评估</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
