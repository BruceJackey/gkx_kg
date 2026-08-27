import { ShieldCheck } from 'lucide-react';
import OntologyManagement from './OntologyManagement';

export default function SchemaConstraintRulesPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Schema约束规则定义</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          允许管理员在本体编辑器中，为属性定义值域、基数限制、数据类型等约束条件。
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <OntologyManagement variant="schema-constraints" />
      </div>
    </div>
  );
}
