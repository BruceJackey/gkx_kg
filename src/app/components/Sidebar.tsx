import { useState } from 'react';
import {
  Database,
  Bot,
  GitBranch,
  Network,
  ChevronDown,
  ChevronRight,
  BarChart3,
  List,
  PlayCircle,
  Settings,
  Globe,
  AppWindow,
  Boxes,
  Share2,
  TrendingUp,
  FolderOpen,
  Activity,
  Key,
  ClipboardList,
  CheckSquare,
  Tag,
  Shield,
  BookOpen,
  Search,
  GitMerge,
  Brain,
  Target,
  ShieldCheck,
  GalleryHorizontal,
  AlertTriangle,
  Layers,
  Images,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: MenuItem[];
}

const allMenuItems: MenuItem[] = [
  {
    id: 'kg-construction',
    label: '知识图谱构造引擎',
    icon: Network,
    children: [
      { id: 'kg-ontology', label: '本体管理', icon: Layers },
      { id: 'kg-datasource', label: '数据源管理', icon: Database },
      { id: 'kg-mapping', label: '映射管理', icon: GitMerge },
      { id: 'rule-management', label: '规则管理', icon: Shield },
      { id: 'graph-construction', label: '图谱构造', icon: PlayCircle },
      { id: 'graph-tasks', label: '图谱任务', icon: Activity },
      { id: 'human-review', label: '人工审核', icon: CheckSquare },
    ],
  },
  {
    id: 'data',
    label: '数据管理',
    icon: Database,
    children: [
      { id: 'data-dashboard', label: '数据看板', icon: BarChart3 },
      { id: 'knowledge-graph-dashboard', label: '知识图谱看板', icon: Activity },
      { id: 'graph-fusion', label: '图谱融合', icon: GitMerge },
      { id: 'property-management', label: '属性管理', icon: Tag },
    ],
  },
  {
    id: 'algorithm',
    label: '算法管理',
    icon: Bot,
    children: [
      { id: 'algorithm-list', label: '算法列表', icon: List },
      { id: 'algorithm-dataset', label: '数据集管理', icon: FolderOpen },
      { id: 'multimodal-dataset', label: '多模态数据集', icon: Images },
      { id: 'algorithm-tasks', label: '任务管理', icon: PlayCircle },
    ],
  },
  {
    id: 'service-management',
    label: '服务管理',
    icon: Network,
    children: [
      { id: 'algorithm-service-list', label: '算法服务', icon: Bot },
      // { id: 'pipeline-service-list', label: '流程服务', icon: GitBranch },
      { id: 'api-keys', label: 'API 密钥', icon: Key },
    ],
  },
  {
    id: 'knowledge',
    label: '知识库',
    icon: BookOpen,
    children: [
      { id: 'knowledge-base', label: '知识库', icon: BookOpen },
      { id: 'knowledge-search', label: '知识搜索', icon: Search },
      { id: 'academic-poster', label: '学术海报与音频', icon: GalleryHorizontal },
    ],
  },
  {
    id: 'app',
    label: '图谱应用',
    icon: AppWindow,
    children: [
      { id: 'app-center', label: '应用中心', icon: Boxes },
      { id: 'graph-visualization', label: '图谱可视化', icon: Share2 },
      { id: 'evolution-analysis', label: '演化分析', icon: TrendingUp },
      { id: 'vertical-domain-graph', label: '垂直领域图谱', icon: Globe },
    ],
  },
  {
    id: 'system',
    label: '系统管理',
    icon: Settings,
    children: [
      { id: 'call-logs', label: '调用日志', icon: ClipboardList },
    ],
  },
];

import { AuditCatalogPanel } from './AuditCatalogPanel';
import type { AuditFeatureSelection } from '../data/auditCatalogTypes';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  selectedAuditFeatureId?: string;
  onAuditFeatureSelect?: (feature: AuditFeatureSelection, pageId: string | null) => void;
}

export function Sidebar({
  currentPage,
  onNavigate,
  selectedAuditFeatureId,
  onAuditFeatureSelect,
}: SidebarProps) {
  const [sidebarMode, setSidebarMode] = useState<'product' | 'catalog'>('product');
  const [expandedItems, setExpandedItems] = useState<string[]>(['kg-construction', 'data', 'algorithm', 'service-management', 'knowledge', 'app', 'system']);

  const menuItems = allMenuItems;

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      toggleExpand(item.id);
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <div className="h-full w-64 bg-[#1a1d24] text-gray-300 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-gray-700">
        <h1 className="font-semibold text-white text-sm leading-tight">亿级科技知识图谱引擎</h1>
      </div>

      <div className="flex border-b border-gray-700">
        <button
          type="button"
          onClick={() => setSidebarMode('product')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            sidebarMode === 'product' ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          产品
        </button>
        <button
          type="button"
          onClick={() => setSidebarMode('catalog')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            sidebarMode === 'catalog' ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          目录
        </button>
      </div>

      {sidebarMode === 'catalog' && onAuditFeatureSelect ? (
        <AuditCatalogPanel
          selectedFeatureId={selectedAuditFeatureId}
          onSelectFeature={onAuditFeatureSelect}
        />
      ) : (
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center justify-between px-6 py-2.5 transition-colors ${
                !item.children && currentPage === item.id
                  ? 'bg-[#2563eb] text-white'
                  : 'hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.children && (
                expandedItems.includes(item.id) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )
              )}
            </button>

            {item.children && expandedItems.includes(item.id) && (
              <div className="bg-[#15171c]">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleItemClick(child)}
                    className={`w-full flex items-center gap-3 px-6 pl-14 py-2 text-sm transition-colors ${
                      currentPage === child.id
                        ? 'bg-[#2563eb] text-white'
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <child.icon className="w-4 h-4" />
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      )}
    </div>
  );
}
