import { CandidateTermGenerationDemo, type CandidateTermDemoTab } from './demos/CandidateTermGenerationDemo';

export type CandidateTermReviewFocus = CandidateTermDemoTab;

/**
 * 候选术语生成 · 审核页：仅保留原算法详情中的「测试接口」能力，
 * 用于接口联调与结果核对。
 */
export default function CandidateTermReview({
  initialFocus,
}: {
  initialFocus?: CandidateTermReviewFocus | null;
}) {
  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-gray-900 mb-1">候选术语生成审核</h1>
        <p className="text-sm text-gray-500">
          通过测试接口调用统计扩展、规则扩展与去重合并，核对请求体与响应结果
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-5xl">
        <CandidateTermGenerationDemo initialTab={initialFocus ?? undefined} />
      </div>
    </div>
  );
}
