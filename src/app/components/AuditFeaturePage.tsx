import { FileSearch, MapPin, AlertCircle } from 'lucide-react';
import type { AuditFeatureSelection } from '../data/auditCatalogTypes';

export function AuditFeaturePage({ feature }: { feature: AuditFeatureSelection }) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
          {feature.pathLabels.map((label, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              <span>{label}</span>
            </span>
          ))}
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{feature.name}</h1>
        <p className="text-sm text-gray-500 mt-1">需规编号 {feature.reqId} · 审计目录功能点</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-3xl">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            该功能点在审计表中尚未绑定原型页面（或标注为接口形式）。当前为目录占位页，后续可在此实现或跳转到对应模块。
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">功能点需求描述</div>
            <p className="text-sm text-gray-700 leading-relaxed">{feature.featureDesc || '—'}</p>
          </div>
          {feature.pagePath && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />审计表页面列
              </div>
              <p className="text-sm font-mono text-gray-600">{feature.pagePath}</p>
            </div>
          )}
          {feature.auditNote && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <FileSearch className="w-3.5 h-3.5" />审计功能调整
              </div>
              <p className="text-sm text-gray-700">{feature.auditNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
