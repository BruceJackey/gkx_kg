import { Cpu, GitBranch, Layers, Zap } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: 'Rete 匹配网络',
    desc: '将规则条件编译为共享的 α/β 网络，事实增量进入后只对受影响节点重算，避免全量重扫规则库。',
  },
  {
    icon: GitBranch,
    title: 'Leaps 前向链',
    desc: '在冲突集上按优先级与新近性调度规则点火，支持大规模规则集下的高效前向链推理。',
  },
  {
    icon: Layers,
    title: '事实驱动触发',
    desc: '当知识库事实满足规则 IF 条件时，自动触发 THEN 动作（断言、收回、告警或创建关系）。',
  },
  {
    icon: Cpu,
    title: '内核能力边界',
    desc: '面向大规模事实与规则匹配优化；事实变更监听与任务调度由上层服务接入本内核。',
  },
];

/**
 * 审计目录专用：高性能推理内核介绍页
 */
export default function HighPerformanceInferenceKernel() {
  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">高性能推理内核</h1>
          <p className="text-sm text-gray-500">
            条件驱动结果推理基于业界高效的 Rete / Leaps 算法，实现事实驱动的前向链推理引擎
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-4xl space-y-5">
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 leading-relaxed">
          <p className="mb-3">
            内核将规则编译为可增量更新的匹配网络。当事实发生增、删、改时，仅传播变更相关的部分匹配结果；
            一旦某条规则的全部 IF 条件被满足，即加入冲突集，由调度器决定 THEN 动作的执行顺序。
          </p>
          <p>
            本页为能力说明；事实变更监听可将属性增删改过程送入本内核，推理任务管理则对图谱三元组批量调度规则执行。
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
            <li>规则库加载并编译为 Rete / Leaps 网络</li>
            <li>工作记忆写入初始事实（实体、属性、关系三元组）</li>
            <li>监听事实变更，增量送入匹配网络</li>
            <li>条件满足时触发 THEN：告警、补全或标记问题事实</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
