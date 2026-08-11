import { ConflictManagementPanel } from './TermReview';
import { GitMerge } from 'lucide-react';

export default function ConflictManagementPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="flex items-center gap-2 text-gray-900">
            <GitMerge className="w-5 h-5 text-orange-500" />
            冲突管理
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">处理实体抽取过程中的消歧、低置信度与待审核实体</p>
        </div>
      </div>
      <ConflictManagementPanel />
    </div>
  );
}
