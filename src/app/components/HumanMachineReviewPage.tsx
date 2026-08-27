import { KGReviewPanel, type KGReviewInnerTab } from './HumanReview';
import type { HumanMachineReviewFocus } from '../data/auditPageMap';

function resolveInnerTab(focus?: HumanMachineReviewFocus): KGReviewInnerTab {
  if (focus === 'feedback-loop') return 'feedback-loop';
  return 'candidates';
}

export default function HumanMachineReviewPage({
  initialFocus,
}: {
  initialFocus?: HumanMachineReviewFocus;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">人机协同审核队列</h1>
        <p className="text-sm text-gray-500 mt-1">
          系统自动将需要验证的三元组作为任务推送给在线审核员，结构化采集反馈数据并分析审核员一致性。
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KGReviewPanel
          initialInnerTab={resolveInnerTab(initialFocus)}
          focusConsensus={initialFocus === 'consensus'}
          focusActions={initialFocus === 'feedback-collection'}
          hideMappingRules
          enableFeedbackLoop
          labels={{
            candidates: '人机协同审核队列',
            feedbackLoop: '反馈数据闭环',
            consensus: '审核员一致性分析',
            actions: '反馈数据采集',
          }}
        />
      </div>
    </div>
  );
}
