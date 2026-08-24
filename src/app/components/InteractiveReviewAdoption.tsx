import { SeedTermPanel } from './TermReview';

/**
 * 审计专用页：复制种子术语审核交互能力，独立命名为「交互式审核与采纳」。
 * 仅从审计目录进入，不出现在产品侧边栏。
 */
export default function InteractiveReviewAdoption() {
  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">交互式审核与采纳</h1>
          <p className="text-sm text-gray-500">
            对基于置信度图传播排序后的术语列表进行人工审核，支持「接受」或「拒绝」操作
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>
      <SeedTermPanel />
    </div>
  );
}
