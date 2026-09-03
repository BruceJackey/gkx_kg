import { RecognitionResultManagementPanel, type RecognitionFocus } from './RecognitionResultManagement';

export type { RecognitionFocus };

/**
 * 审计目录专用：待入库实例审核
 * 复制「识别结果管理」，改名为待入库实例审核，供入库前最终确认
 */
export default function PendingInstanceReview({
  initialFocus,
}: {
  initialFocus?: RecognitionFocus | null;
}) {
  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">待入库实例审核</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          对所有待添加的新实例进行最终确认：原文高亮、修正边界与分类，确认后再进入对齐与入库
        </p>
      </div>
      <RecognitionResultManagementPanel
        initialFocus={initialFocus ?? 'review'}
        labels={{
          highlight: '实例原文高亮',
          review: '待入库实例确认',
          linking: '对齐预览',
          intro: '最终审核界面：确认待入库新实例的文本、类型与原文上下文，通过后再进入对齐与批量入库',
        }}
      />
    </div>
  );
}
