import { TemporalRelationDependencyDemo } from './demos/TemporalRelationDependencyDemo';

export type TemporalAuditMode = 'extraction' | 'dependency';

/**
 * 审计目录专用：时序关系抽取 & 时序依赖分析
 */
export default function TemporalRelationAudit({ initialMode = 'extraction' }: { initialMode?: TemporalAuditMode }) {
  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">
            {initialMode === 'dependency' ? '时序依赖分析' : '时序关系抽取'}
          </h1>
          <p className="text-sm text-gray-500">
            {initialMode === 'dependency'
              ? '输入事件时间戳序列，挖掘隐含的概率性时序依赖模式'
              : '输入文本，自动抽取 before / after / during 等时序关系'}
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-4xl">
        <TemporalRelationDependencyDemo initialTab={initialMode} standalone />
      </div>
    </div>
  );
}
