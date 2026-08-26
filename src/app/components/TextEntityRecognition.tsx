import { RecognitionResultManagementPanel, type RecognitionFocus } from './RecognitionResultManagement';

export type { RecognitionFocus };

/** 文本实体识别：识别结果管理页的审计副本 */
export default function TextEntityRecognition({
  initialFocus,
}: {
  initialFocus?: RecognitionFocus | null;
}) {
  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">文本实体识别</h1>
        <p className="text-sm text-gray-400">
          从文本中自动识别实体对象，支持原文高亮展示与边界人工修正
        </p>
      </div>
      <RecognitionResultManagementPanel
        initialFocus={initialFocus ?? undefined}
        showLinking={false}
        labels={{
          highlight: '命名体识别',
          review: '命名体识别',
          intro: '从文本中识别实体并高亮展示；可在下方对实体边界与分类进行人工修正',
        }}
      />
    </div>
  );
}
