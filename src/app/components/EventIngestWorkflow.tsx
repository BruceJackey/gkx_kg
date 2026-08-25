import { EventReviewPanel } from './TermReview';

/**
 * 审计目录专用：审核与入库工作流
 * 完全复用「事件审核与修正工作台」，改名并增加一键入库
 */
export default function EventIngestWorkflow() {
  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">审核与入库工作流</h1>
          <p className="text-sm text-gray-500">
            对机器抽取的事件结果进行人工审核，并将确认无误的事件知识一键导入知识库
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>
      <EventReviewPanel
        initialSubTab="workbench"
        workbenchLabel="审核与入库工作流"
        hideMerge
        showIngest
      />
    </div>
  );
}
