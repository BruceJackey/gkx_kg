import { RecognitionResultManagementPanel, type RecognitionFocus } from './RecognitionResultManagement';

export type { RecognitionFocus };

/**
 * 审计目录专用：实体对齐与消歧
 * 基于「实体链接与消歧」改名，入库前检测与图谱已有实体的重复，支持合并或创建新实体
 */
export default function EntityAlignmentDisambiguation({
  initialFocus,
}: {
  initialFocus?: RecognitionFocus | null;
}) {
  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">实体对齐与消歧</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          入库前自动检测新实例与知识图谱已有实体是否重复，选择合并到已有实体或创建新实体
        </p>
      </div>
      <RecognitionResultManagementPanel
        initialFocus={initialFocus ?? 'linking'}
        enableAlignmentActions
        labels={{
          highlight: '实例上下文',
          review: '实例信息修正',
          linking: '实体对齐与消歧',
          intro: '对齐与消歧：对疑似重复实例选择「合并」到已有图谱实体，或「创建新实体」独立入库',
        }}
      />
    </div>
  );
}
