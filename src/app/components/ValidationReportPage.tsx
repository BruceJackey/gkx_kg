import { ClipboardList } from 'lucide-react';
import { KGReviewPanel } from './HumanReview';

export default function ValidationReportPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-5 h-5 text-orange-600" />
          <h1 className="text-xl font-semibold text-gray-900">校验结果报告</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          以列表形式展示一致性扫描发现的所有潜在错误，支持一键定位到违规数据。
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <KGReviewPanel
          reportMode
          hideMappingRules
          labels={{ candidates: '扫描结果' }}
        />
      </div>
    </div>
  );
}
