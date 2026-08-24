import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search, Circle, Link2, FileQuestion } from 'lucide-react';
import catalogRoot from '../data/auditCatalog.json';
import type { AuditCatalogNode, AuditFeatureSelection } from '../data/auditCatalogTypes';
import { resolveAuditPageId } from '../data/auditPageMap';

const LEVEL_LABEL: Record<string, string> = {
  level1: '一级',
  level2: '二级',
  level3: '三级',
  level4: '四级',
  level5: '五级',
  feature: '功能点',
};

interface AuditCatalogPanelProps {
  selectedFeatureId?: string;
  onSelectFeature: (feature: AuditFeatureSelection, pageId: string | null) => void;
}

function collectAncestorIds(
  node: AuditCatalogNode,
  targetId: string,
  trail: string[] = [],
): string[] | null {
  if (node.id === targetId) return trail;
  for (const child of node.children ?? []) {
    const found = collectAncestorIds(child, targetId, [...trail, node.id]);
    if (found) return found;
  }
  return null;
}

function filterTree(node: AuditCatalogNode, query: string): AuditCatalogNode | null {
  const q = query.trim().toLowerCase();
  if (!q) return node;
  if (node.type === 'feature') {
    const blob = `${node.name} ${node.featureDesc ?? ''} ${node.pagePath ?? ''}`.toLowerCase();
    return blob.includes(q) ? node : null;
  }
  const filteredChildren = (node.children ?? [])
    .map(c => filterTree(c, query))
    .filter((c): c is AuditCatalogNode => c !== null);
  if (filteredChildren.length === 0) return null;
  return { ...node, children: filteredChildren };
}

function defaultExpandedIds(root: AuditCatalogNode): string[] {
  const ids: string[] = [];
  const walk = (n: AuditCatalogNode, depth: number) => {
    if (n.type !== 'feature' && depth <= 4) ids.push(n.id);
    for (const c of n.children ?? []) walk(c, depth + 1);
  };
  walk(root, 0);
  return ids;
}

function buildFeatureSelection(node: AuditCatalogNode, pathLabels: string[]): AuditFeatureSelection {
  return {
    id: node.id,
    name: node.name,
    reqId: node.reqId ?? '',
    pagePath: node.pagePath ?? '',
    featureDesc: node.featureDesc ?? '',
    auditNote: node.auditNote ?? '',
    pathLabels,
  };
}

function CatalogNodeRow({
  node,
  depth,
  pathLabels,
  expandedIds,
  toggleExpand,
  selectedFeatureId,
  onSelectFeature,
}: {
  node: AuditCatalogNode;
  depth: number;
  pathLabels: string[];
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  selectedFeatureId?: string;
  onSelectFeature: (feature: AuditFeatureSelection, pageId: string | null) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const expanded = expandedIds.has(node.id);
  const isFeature = node.type === 'feature';
  const pageId = isFeature ? resolveAuditPageId(node.pagePath) : null;
  const isSelected = isFeature && selectedFeatureId === node.id;

  const handleClick = () => {
    if (isFeature) {
      onSelectFeature(buildFeatureSelection(node, pathLabels), pageId);
      return;
    }
    if (hasChildren) toggleExpand(node.id);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-start gap-1.5 py-1.5 pr-3 text-left transition-colors rounded-md ${
          isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'
        }`}
        style={{ paddingLeft: `${12 + depth * 10}px` }}
      >
        {!isFeature && hasChildren ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        {isFeature ? (
          pageId
            ? <Link2 className="w-3 h-3 flex-shrink-0 mt-1 opacity-70" />
            : <FileQuestion className="w-3 h-3 flex-shrink-0 mt-1 opacity-50" />
        ) : (
          <Circle className="w-2 h-2 flex-shrink-0 mt-1.5 fill-current opacity-40" />
        )}
        <span className="flex-1 min-w-0">
          {!isFeature && (
            <span className={`text-[10px] mr-1.5 ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
              {LEVEL_LABEL[node.type]}
            </span>
          )}
          <span className={`text-xs leading-snug ${isFeature ? 'font-medium' : ''}`}>{node.name}</span>
        </span>
      </button>
      {!isFeature && expanded && hasChildren && (
        <div>
          {(node.children ?? []).map(child => (
            <CatalogNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              pathLabels={[...pathLabels, node.name]}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={onSelectFeature}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditCatalogPanel({ selectedFeatureId, onSelectFeature }: AuditCatalogPanelProps) {
  const root = catalogRoot as AuditCatalogNode;
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(defaultExpandedIds(root)));

  const displayRoot = useMemo(() => (query ? filterTree(root, query) : root), [query, root]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (selectedFeatureId) {
      const ancestors = collectAncestorIds(root, selectedFeatureId);
      if (ancestors) {
        setExpandedIds(prev => {
          const next = new Set(prev);
          ancestors.forEach(id => next.add(id));
          return next;
        });
      }
    }
  }, [selectedFeatureId, root]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="text-xs text-gray-400 mb-2">需规目录 · 455 个功能点</div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索功能点…"
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#15171c] border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {displayRoot ? (
          (displayRoot.children ?? []).map(child => (
            <CatalogNodeRow
              key={child.id}
              node={child}
              depth={0}
              pathLabels={[]}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={onSelectFeature}
            />
          ))
        ) : (
          <div className="px-4 py-8 text-xs text-gray-500 text-center">无匹配功能点</div>
        )}
      </nav>
      <div className="px-4 py-2 border-t border-gray-700 text-[10px] text-gray-500 leading-relaxed">
        <Link2 className="w-3 h-3 inline mr-1" />已映射页面
        <FileQuestion className="w-3 h-3 inline mx-1" />待建设占位页
      </div>
    </div>
  );
}
