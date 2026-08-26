import { KGReviewPanel } from './HumanReview';

export type LinkAnnotationFocus = 'workbench' | 'mapping';

/** 链接标注与映射生成：用户标注与纠错页的审计副本 */
export default function LinkAnnotationMapping({
  initialFocus,
}: {
  initialFocus?: LinkAnnotationFocus | null;
}) {
  const innerTab = initialFocus === 'mapping' ? 'mapping-rules' : 'candidates';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-5 pb-3 bg-gray-900">
        <h1 className="text-2xl text-white mb-1">链接标注与映射生成</h1>
        <p className="text-sm text-gray-400">
          对实体链接结果进行人工标注与修正，并将确认的链接保存为映射规则
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden bg-gray-50">
        <KGReviewPanel
          key={initialFocus ?? 'default'}
          initialInnerTab={innerTab}
          labels={{
            candidates: '人工标注工作台',
            mappingRules: '映射规则生成',
          }}
        />
      </div>
    </div>
  );
}
