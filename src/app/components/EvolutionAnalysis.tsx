import { useState, useMemo } from 'react';
import {
  RefreshCw,
  Download,
  TrendingUp,
  Sparkles,
  Waves,
  Network,
  Radar as RadarIcon,
  GitBranch,
  FlaskConical,
  LineChart as LineIcon,
  Layers,
  ChevronRight,
  Maximize2,
  Database,
  Table,
  Search,
  Loader2,
  ArrowRight,
  RouteIcon,
  FileText,
  Lightbulb,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

type ViewKey =
  | 'topic-shift'
  | 'trend'
  | 'theme-river'
  | 'discipline-cross'
  | 'radar'
  | 'achievement'
  | 'sandbox'
  | 'scenario'
  | 'cross-impact';

interface NavItem {
  id: ViewKey;
  label: string;
  subtitle: string;
  code: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: '演化回顾',
    items: [
      { id: 'topic-shift', label: '主题变迁分析', subtitle: '展示研究主题随时间的演变路径和继承结构', code: '1.2.1.1.4.5.2.1' },
      { id: 'trend', label: '趋势分析', subtitle: '识别短期突现关键词及跨学科交叉关键词', code: '1.2.1.1.4.5.2.2' },
      { id: 'theme-river', label: '动态主题演化图', subtitle: '以时序河流图展示主题兴起、衰落和变迁', code: '1.2.1.1.4.5.2.3' },
    ],
  },
  {
    title: '现状洞察',
    items: [
      { id: 'discipline-cross', label: '学科交叉分析', subtitle: '分析特定技术领域与其他学科的交叉融合', code: '1.2.1.1.4.5.2.4' },
      { id: 'radar', label: '竞争力雷达图', subtitle: '多维度对国家、机构或团队进行竞争力评估', code: '1.2.1.1.4.5.2.6' },
      { id: 'achievement', label: '科研成果关联', subtitle: '构建引证与影响网络，分析成果间的关联', code: '1.2.1.1.4.5.2.7' },
    ],
  },
  {
    title: '未来推演',
    items: [
      { id: 'sandbox', label: '发展推演沙盒', subtitle: '交互式模拟关键变量对未来发展路径的影响', code: '1.2.1.1.4.5.2.5' },
      { id: 'scenario', label: '科技发展情景模拟', subtitle: '基于历史数据生成多种未来情景预测', code: '1.2.1.1.4.5.2.8' },
      { id: 'cross-impact', label: '跨领域影响分析', subtitle: '分析关键技术对其他领域的颠覆性影响', code: '1.2.1.1.4.5.2.9' },
    ],
  },
];

const navIcons: Record<ViewKey, any> = {
  'topic-shift': GitBranch,
  trend: TrendingUp,
  'theme-river': Waves,
  'discipline-cross': Layers,
  radar: RadarIcon,
  achievement: Network,
  sandbox: FlaskConical,
  scenario: LineIcon,
  'cross-impact': Sparkles,
};

const insightsByView: Record<ViewKey, { findings: { tag: string; text: string }[]; suggestions: string[] }> = {
  'topic-shift': {
    findings: [
      { tag: '演化', text: '深度学习从计算机视觉延伸至生命科学，形成跨域继承链' },
      { tag: '突现', text: '大语言模型在 2022 年后成为绝对核心主题' },
      { tag: '边缘', text: '模糊逻辑等传统主题逐步边缘化' },
      { tag: '交叉', text: 'AI 与材料科学的主题继承关系显著增强' },
      { tag: '风险', text: '强化学习核心地位下降需关注' },
    ],
    suggestions: ['建议加强生成式模型与产业方向的衔接', '关注小样本/具身智能等新兴枝干', '布局多模态对齐相关的核心主题'],
  },
  trend: {
    findings: [
      { tag: '突现', text: '"扩散模型"在 24 月内频次增长 480%' },
      { tag: '交叉', text: '"图神经网络"与生物学交叉强度位居首位' },
      { tag: '突现', text: '"具身智能"快速进入 Top 5 突现词' },
      { tag: '演化', text: '"Transformer"已从突现转为稳定核心' },
      { tag: '竞争', text: '中美在量子机器学习交叉点竞争激烈' },
    ],
    suggestions: ['重点跟踪扩散模型在工程领域的落地', '建立 GNN × 生物的跨学科团队', '提前布局具身智能数据集'],
  },
  'theme-river': {
    findings: [
      { tag: '演化', text: '大模型主题流厚度 2023 年达到峰值' },
      { tag: '突现', text: '多模态主题流呈指数级上升' },
      { tag: '风险', text: '传统机器学习主题流持续收窄' },
      { tag: '交叉', text: '强化学习与机器人主题流出现并流' },
      { tag: '演化', text: '可解释 AI 形成稳定的中等厚度主题流' },
    ],
    suggestions: ['抓住多模态扩散的高速增长期', '审视传统机器学习方向的人才结构', '加大可解释性研究的持续投入'],
  },
  'discipline-cross': {
    findings: [
      { tag: '交叉', text: '计算机 × 生物 弦强度最大' },
      { tag: '突现', text: '材料 × 物理 共现频次同比上升 73%' },
      { tag: '交叉', text: '医学 × AI 桑基流量第一' },
      { tag: '演化', text: '化学 → 算法 → 材料 链路逐渐成型' },
      { tag: '风险', text: '部分基础学科与新兴技术脱节' },
    ],
    suggestions: ['推动计算机与生物的联合实验室建设', '布局材料 × 物理 的高密度合作项目', '加强基础学科与 AI 的桥梁课程'],
  },
  radar: {
    findings: [
      { tag: '竞争', text: '机构 A 在论文产出与高被引上均居首' },
      { tag: '风险', text: '机构 C 在产业转化维度显著偏低' },
      { tag: '竞争', text: '机构 B 国际合作维度增长最快' },
      { tag: '演化', text: '人才分布逐步从一线城市外溢' },
      { tag: '交叉', text: '专利数量与产业转化高度相关' },
    ],
    suggestions: ['推动机构 C 与产业方的成果转化合作', '为机构 B 配置更多国际化项目', '完善高被引成果的奖励机制'],
  },
  achievement: {
    findings: [
      { tag: '演化', text: '专利→产品 转化路径已形成稳定链条' },
      { tag: '交叉', text: '高被引论文围绕 5 个核心人才聚集' },
      { tag: '突现', text: '近 12 月项目→论文 转化效率提升' },
      { tag: '风险', text: '部分论文与项目缺乏明确引用关系' },
      { tag: '竞争', text: '关键人才节点掌握跨类型成果' },
    ],
    suggestions: ['强化项目-论文-专利的引用规范', '关注核心人才的备份机制', '识别尚未转化的高潜力专利'],
  },
  sandbox: {
    findings: [
      { tag: '推演', text: '政策投入提升 20% 可拉动技术影响 14%' },
      { tag: '推演', text: '关键技术突破对系统的乘数效应最高' },
      { tag: '风险', text: '人才流入下降会显著抑制传播' },
      { tag: '推演', text: '激进情景下临界点位于第 3 年' },
      { tag: '竞争', text: '国际合作对边缘节点带动明显' },
    ],
    suggestions: ['优先保障关键技术突破的资金强度', '在激进情景前部署人才储备', '为国际合作设置专项预算'],
  },
  scenario: {
    findings: [
      { tag: '推演', text: '基准情景概率 52% 增长最稳健' },
      { tag: '风险', text: '保守情景在 2028 年出现拐点' },
      { tag: '突现', text: '激进情景受关键技术驱动跃升' },
      { tag: '演化', text: '里程碑 M3-M5 决定中期走向' },
      { tag: '竞争', text: '里程碑 M7 是国际竞争分水岭' },
    ],
    suggestions: ['围绕 M3-M5 提前布局资源', '为保守情景准备风险缓释方案', '强化激进情景的关键技术储备'],
  },
  'cross-impact': {
    findings: [
      { tag: '交叉', text: '大模型对教育、医疗影响最深' },
      { tag: '突现', text: '机器人 × 制造 应用机会激增' },
      { tag: '演化', text: '量子计算开始进入金融领域' },
      { tag: '风险', text: '部分应用机会缺乏头部企业承接' },
      { tag: '交叉', text: '生物 × AI 涌现多个子领域' },
    ],
    suggestions: ['优先孵化大模型 × 教育的标杆项目', '建立机器人制造的产业联盟', '识别量子金融的合作生态'],
  },
};

const filterOptions = {
  domain: ['全部领域', '人工智能', '生命科学', '材料科学', '量子信息', '航天科技'],
  time: ['近 3 年', '近 5 年', '近 10 年', '2010-2030'],
  org: ['全部机构', '高校', '科研院所', '企业研发'],
  country: ['全部国家', '中国', '美国', '欧盟', '日本'],
  discipline: ['全部学科', '计算机', '生物', '化学', '物理', '工程'],
};

export function EvolutionAnalysis() {
  const [activeView, setActiveView] = useState<ViewKey>('topic-shift');
  const [viewMode, setViewMode] = useState<'main' | 'data'>('main');
  const [year, setYear] = useState(2024);
  const [filters, setFilters] = useState({
    domain: filterOptions.domain[1],
    time: filterOptions.time[2],
    org: filterOptions.org[0],
    country: filterOptions.country[0],
    discipline: filterOptions.discipline[0],
  });
  const [exportOpen, setExportOpen] = useState(false);
  const [drilledEntity, setDrilledEntity] = useState<string | null>(null);

  const currentNav = useMemo(() => {
    for (const sec of navSections) {
      const found = sec.items.find((i) => i.id === activeView);
      if (found) return found;
    }
    return navSections[0].items[0];
  }, [activeView]);

  const insights = insightsByView[activeView];

  const handleDrill = (label: string) => setDrilledEntity(label);

  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 leading-tight">亿级科技知识图谱 · 演化分析工作台</div>
            <div className="text-xs text-gray-500">Evolution Analytics Workbench</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(filterOptions) as (keyof typeof filterOptions)[]).map((key) => (
            <select
              key={key}
              value={(filters as any)[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {filterOptions[key].map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {navSections.map((sec) => (
              <div key={sec.title}>
                <div className="text-xs font-medium text-gray-400 uppercase px-2 mb-1.5">{sec.title}</div>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = navIcons[item.id];
                    const active = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-600' : 'bg-gray-300'}`}
                        />
                        <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="flex-1 truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 p-3 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>数据源：科技文献 · 专利 · 项目 · 政策</span>
            </div>
            <div className="pl-5">节点 12.4 亿 · 关系 38.7 亿</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-gray-900">{currentNav.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{currentNav.subtitle}</div>
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('main')}
                className={`px-3 py-1 text-xs rounded ${viewMode === 'main' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
              >
                主视图
              </button>
              <button
                onClick={() => setViewMode('data')}
                className={`px-3 py-1 text-xs rounded ${viewMode === 'data' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}
              >
                <Table className="w-3.5 h-3.5 inline mr-1" />
                数据视图
              </button>
              <button className="px-3 py-1 text-xs rounded text-gray-600 hover:bg-white">
                <Maximize2 className="w-3.5 h-3.5 inline mr-1" />
                全屏
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 transition-opacity duration-200">
            {viewMode === 'data' ? (
              <DataView viewKey={activeView} />
            ) : (
              <>
                {activeView === 'topic-shift' && <TopicShiftView onDrill={handleDrill} />}
                {activeView === 'trend' && <TrendView onDrill={handleDrill} />}
                {activeView === 'theme-river' && <ThemeRiverView year={year} />}
                {activeView === 'discipline-cross' && <DisciplineCrossView onDrill={handleDrill} />}
                {activeView === 'radar' && <RadarView onDrill={handleDrill} />}
                {activeView === 'achievement' && <AchievementView onDrill={handleDrill} />}
                {activeView === 'sandbox' && <SandboxView />}
                {activeView === 'scenario' && <ScenarioView onDrill={handleDrill} />}
                {activeView === 'cross-impact' && <CrossImpactView onDrill={handleDrill} />}
              </>
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <InsightsPanel insights={insights} drilledEntity={drilledEntity} />
        </div>
      </div>

      {/* Timeline */}
      <div className="h-14 bg-white border-t border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
        <span className="text-xs text-gray-500">过去</span>
        <input
          type="range"
          min={2010}
          max={2030}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs text-gray-500">未来</span>
        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium min-w-[60px] text-center">
          {year}
        </div>
      </div>

      {/* Export Drawer */}
      {exportOpen && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setExportOpen(false)}>
          <div
            className="w-96 bg-white rounded-lg shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-4">导出报告</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-700 mb-1.5">导出范围</div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5"><input type="radio" name="range" defaultChecked /> 当前视图</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name="range" /> 全部视图</label>
                </div>
              </div>
              <div>
                <div className="text-gray-700 mb-1.5">格式</div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5"><input type="radio" name="fmt" defaultChecked /> PDF</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name="fmt" /> PNG</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name="fmt" /> CSV</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setExportOpen(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">
                取消
              </button>
              <button onClick={() => setExportOpen(false)} className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded">
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightsPanel({
  insights,
  drilledEntity,
}: {
  insights: { findings: { tag: string; text: string }[]; suggestions: string[] };
  drilledEntity: string | null;
}) {
  const tagColors: Record<string, string> = {
    突现: 'bg-orange-100 text-orange-700',
    交叉: 'bg-purple-100 text-purple-700',
    演化: 'bg-blue-100 text-blue-700',
    竞争: 'bg-red-100 text-red-700',
    风险: 'bg-yellow-100 text-yellow-700',
    推演: 'bg-green-100 text-green-700',
    边缘: 'bg-gray-100 text-gray-700',
  };
  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2.5">关键发现</h3>
        <div className="space-y-2">
          {insights.findings.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`px-1.5 py-0.5 rounded text-[11px] flex-shrink-0 ${tagColors[f.tag] || 'bg-gray-100 text-gray-700'}`}>
                {f.tag}
              </span>
              <span className="text-gray-700 leading-relaxed">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2.5">钻取详情</h3>
        <div className="space-y-2">
          <EntityCard name={drilledEntity || '深度学习'} active />
          <EntityCard name="计算机视觉" dim />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2.5">推演建议</h3>
        <ul className="space-y-1.5 text-xs text-gray-700">
          {insights.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EntityCard({ name, active, dim }: { name: string; active?: boolean; dim?: boolean }) {
  const kpis = [
    { label: '论文', value: active ? '12.4k' : '5.8k' },
    { label: '专利', value: active ? '3.2k' : '1.7k' },
    { label: '高被引', value: active ? '486' : '212' },
    { label: '关联实体', value: active ? '92' : '47' },
  ];
  return (
    <div className={`border rounded-lg p-3 ${active ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'} ${dim ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{name}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {kpis.map((k) => (
          <div key={k.label} className="text-center">
            <div className="text-xs font-semibold text-gray-900">{k.value}</div>
            <div className="text-[10px] text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= View 1: 主题变迁 =============
function TopicShiftView({ onDrill }: { onDrill: (label: string) => void }) {
  const layers = [
    { name: '核心', y: 100, color: '#2563eb' },
    { name: '中间', y: 240, color: '#8b5cf6' },
    { name: '边缘', y: 380, color: '#94a3b8' },
  ];
  const nodes = [
    { id: '1', label: '神经网络', x: 80, y: 240, layer: 1, heat: 30 },
    { id: '2', label: '深度学习', x: 240, y: 100, layer: 0, heat: 60 },
    { id: '3', label: '计算机视觉', x: 400, y: 100, layer: 0, heat: 55 },
    { id: '4', label: 'Transformer', x: 560, y: 100, layer: 0, heat: 70 },
    { id: '5', label: '大语言模型', x: 720, y: 100, layer: 0, heat: 90 },
    { id: '6', label: '强化学习', x: 400, y: 240, layer: 1, heat: 40 },
    { id: '7', label: '多模态', x: 720, y: 240, layer: 1, heat: 55 },
    { id: '8', label: '模糊逻辑', x: 80, y: 380, layer: 2, heat: 15 },
    { id: '9', label: '专家系统', x: 240, y: 380, layer: 2, heat: 12 },
    { id: '10', label: '可解释 AI', x: 560, y: 380, layer: 2, heat: 28 },
  ];
  const edges = [
    ['1', '2'], ['2', '3'], ['2', '6'], ['3', '4'], ['4', '5'], ['4', '7'], ['5', '7'],
    ['1', '8'], ['8', '9'], ['2', '10'], ['5', '10'],
  ];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <svg viewBox="0 0 820 440" className="w-full h-full">
        {layers.map((l) => (
          <g key={l.name}>
            <line x1={0} x2={820} y1={l.y} y2={l.y} stroke="#f1f5f9" strokeDasharray="4 4" />
            <text x={10} y={l.y - 6} fill={l.color} fontSize="11" fontWeight="500">{l.name}主题</text>
          </g>
        ))}
        <defs>
          <marker id="arrow-ts" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>
        {edges.map(([s, t], i) => {
          const a = nodes.find((n) => n.id === s)!;
          const b = nodes.find((n) => n.id === t)!;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - 30;
          return (
            <path
              key={i}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#arrow-ts)"
            />
          );
        })}
        {nodes.map((n) => {
          const color = layers[n.layer].color;
          return (
            <g key={n.id} onClick={() => onDrill(n.label)} style={{ cursor: 'pointer' }}>
              <circle cx={n.x} cy={n.y} r={n.heat / 2 + 14} fill={color} opacity="0.9" />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
                {n.label}
              </text>
            </g>
          );
        })}
        {[2015, 2018, 2021, 2024].map((y, i) => (
          <text key={y} x={80 + i * 220} y={425} textAnchor="middle" fill="#64748b" fontSize="11">
            {y}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ============= View 2: 趋势分析 =============
function TrendView({ onDrill }: { onDrill: (label: string) => void }) {
  const burstData = [
    { word: '扩散模型', strength: 92, period: '2023-2024' },
    { word: '具身智能', strength: 78, period: '2023-2024' },
    { word: '多模态对齐', strength: 71, period: '2022-2024' },
    { word: 'AIGC', strength: 68, period: '2022-2023' },
    { word: 'RAG 检索增强', strength: 55, period: '2023-2024' },
    { word: '世界模型', strength: 48, period: '2024' },
    { word: 'MoE 专家', strength: 42, period: '2023-2024' },
  ];
  const crossData = [
    { x: 80, y: 60, z: 90, name: '图神经网络 × 生物' },
    { x: 60, y: 75, z: 78, name: 'NLP × 法律' },
    { x: 50, y: 50, z: 60, name: '强化学习 × 机器人' },
    { x: 85, y: 40, z: 55, name: 'CV × 医学影像' },
    { x: 35, y: 65, z: 48, name: '量子 × 机器学习' },
    { x: 70, y: 70, z: 70, name: '材料 × 物理' },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        <div className="text-sm font-medium text-gray-900 mb-3">突现词 Top</div>
        <div className="flex-1">
          <ResponsiveContainer>
            <BarChart data={burstData} layout="vertical" margin={{ left: 20, right: 60 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" horizontal={false} />
              <XAxis key="xaxis" type="number" tick={{ fontSize: 11 }} />
              <YAxis key="yaxis" type="category" dataKey="word" tick={{ fontSize: 11 }} width={90} />
              <RTooltip key="tooltip" />
              <Bar key="bar" dataKey="strength" fill="#2563eb" radius={[0, 4, 4, 0]} onClick={(d: any) => onDrill(d.word)}>
                {burstData.map((_, i) => (
                  <text key={i} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-gray-500 mt-2">条形长度 = 突现强度，时段标注于 Tooltip</div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        <div className="text-sm font-medium text-gray-900 mb-3">关键词跨学科交叉</div>
        <div className="flex-1">
          <ResponsiveContainer>
            <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 30 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="学科 A 强度" tick={{ fontSize: 11 }} label={{ value: '学科 A 强度', position: 'bottom', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="学科 B 强度" tick={{ fontSize: 11 }} label={{ value: '学科 B', angle: -90, position: 'left', fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[100, 800]} />
              <RTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, _n: any, p: any) => [v, p.payload.name]} />
              <Scatter data={crossData} fill="#8b5cf6" onClick={(d: any) => onDrill(d.name)} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ============= View 3: 动态主题演化（河流图） =============
function ThemeRiverView({ year }: { year: number }) {
  const data = Array.from({ length: 15 }, (_, i) => {
    const y = 2010 + i;
    return {
      year: y,
      大模型: Math.max(0, (y - 2018) * 18 + Math.random() * 10),
      计算机视觉: 40 + Math.sin(i / 2) * 15,
      强化学习: 20 + Math.cos(i / 2) * 10,
      多模态: Math.max(0, (y - 2019) * 12),
      传统机器学习: Math.max(5, 60 - (y - 2010) * 3),
      可解释AI: Math.max(0, (y - 2017) * 4 + 5),
    };
  });
  const themes = [
    { key: '大模型', color: '#2563eb' },
    { key: '计算机视觉', color: '#10b981' },
    { key: '强化学习', color: '#f59e0b' },
    { key: '多模态', color: '#8b5cf6' },
    { key: '传统机器学习', color: '#94a3b8' },
    { key: '可解释AI', color: '#ec4899' },
  ];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <div className="text-xs text-gray-500 mb-2">河流厚度 = 主题热度，当前聚焦年份 {year}</div>
      <div className="flex-1">
        <ResponsiveContainer>
          <AreaChart data={data} stackOffset="silhouette" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
            <XAxis key="xaxis" dataKey="year" tick={{ fontSize: 11 }} />
            <RTooltip key="tooltip" />
            <Legend key="legend" wrapperStyle={{ fontSize: 11 }} />
            {themes.map((t) => (
              <Area key={t.key} type="monotone" dataKey={t.key} stackId="1" stroke={t.color} fill={t.color} fillOpacity={0.75} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============= View 4: 学科交叉（和弦/桑基） =============
function DisciplineCrossView({ onDrill }: { onDrill: (label: string) => void }) {
  const [tab, setTab] = useState<'chord' | 'sankey'>('chord');
  const disciplines = ['计算机', '生物', '物理', '化学', '医学', '材料'];
  const chordLinks = [
    { a: 0, b: 1, w: 80 },
    { a: 0, b: 4, w: 70 },
    { a: 0, b: 2, w: 45 },
    { a: 2, b: 5, w: 55 },
    { a: 3, b: 5, w: 60 },
    { a: 1, b: 4, w: 50 },
  ];
  const cx = 220, cy = 200, r = 150;
  const angle = (i: number) => (i / disciplines.length) * Math.PI * 2 - Math.PI / 2;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab('chord')}
          className={`px-3 py-1 text-xs rounded ${tab === 'chord' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          和弦图
        </button>
        <button
          onClick={() => setTab('sankey')}
          className={`px-3 py-1 text-xs rounded ${tab === 'sankey' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          桑基图
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {tab === 'chord' ? (
          <svg viewBox="0 0 440 400" className="w-full h-full max-w-3xl">
            {chordLinks.map((l, i) => {
              const a1 = angle(l.a), a2 = angle(l.b);
              const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
              const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                  stroke="#3b82f6"
                  strokeWidth={l.w / 12}
                  fill="none"
                  opacity="0.4"
                />
              );
            })}
            {disciplines.map((d, i) => {
              const a = angle(i);
              const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
              const lx = cx + (r + 24) * Math.cos(a), ly = cy + (r + 24) * Math.sin(a);
              return (
                <g key={d} onClick={() => onDrill(d)} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r="14" fill="#2563eb" />
                  <text x={lx} y={ly + 4} fill="#1f2937" fontSize="12" textAnchor="middle" fontWeight="500">{d}</text>
                </g>
              );
            })}
          </svg>
        ) : (
          <svg viewBox="0 0 700 400" className="w-full h-full">
            {[
              { name: '物理', y: 60, color: '#3b82f6' },
              { name: '化学', y: 160, color: '#8b5cf6' },
              { name: '生物', y: 260, color: '#10b981' },
              { name: '计算机', y: 360, color: '#f59e0b' },
            ].map((s, i) => (
              <g key={s.name}>
                <rect x="40" y={s.y - 20} width="14" height="40" fill={s.color} />
                <text x="20" y={s.y + 5} fontSize="11" fill="#1f2937" textAnchor="end">{s.name}</text>
                {[
                  { name: '算法', y: 100 + i * 70 },
                  { name: '材料', y: 220 + i * 30 },
                  { name: '影像', y: 300 - i * 20 },
                ].map((m, j) => (
                  <path
                    key={j}
                    d={`M 54 ${s.y} C 250 ${s.y}, 250 ${m.y}, 320 ${m.y}`}
                    stroke={s.color}
                    strokeWidth="14"
                    fill="none"
                    opacity="0.35"
                  />
                ))}
              </g>
            ))}
            {[
              { name: '智能算法', y: 100 },
              { name: '新材料', y: 200 },
              { name: '医学影像', y: 300 },
            ].map((m) => (
              <g key={m.name}>
                <rect x="320" y={m.y - 20} width="14" height="40" fill="#1f2937" />
                <text x="345" y={m.y + 5} fontSize="11" fill="#1f2937">{m.name}</text>
              </g>
            ))}
            {[
              { name: '医疗应用', y: 120, color: '#ef4444' },
              { name: '能源应用', y: 220, color: '#eab308' },
              { name: '智能制造', y: 300, color: '#06b6d4' },
            ].map((d) => (
              <g key={d.name}>
                <path d={`M 480 ${d.y} L 620 ${d.y}`} stroke={d.color} strokeWidth="12" opacity="0.4" />
                <rect x="620" y={d.y - 20} width="14" height="40" fill={d.color} />
                <text x="640" y={d.y + 5} fontSize="11" fill="#1f2937">{d.name}</text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}

// ============= View 5: 发展推演沙盒 =============
function SandboxView() {
  const [vars, setVars] = useState({ policy: 60, breakthrough: 50, funding: 45, talent: 55, intl: 40 });
  const [scenario, setScenario] = useState<'baseline' | 'aggressive' | 'conservative' | 'custom'>('baseline');
  const [overlay, setOverlay] = useState(false);

  const intensity = (vars.policy + vars.breakthrough + vars.funding + vars.talent + vars.intl) / 5;
  const nodes = [
    { id: 'core', x: 250, y: 200, label: '核心技术', r: 32 },
    { id: 'a', x: 120, y: 100, label: '产业应用', r: 18 + intensity / 5 },
    { id: 'b', x: 380, y: 100, label: '基础研究', r: 18 + intensity / 5 },
    { id: 'c', x: 120, y: 300, label: '人才培养', r: 18 + vars.talent / 5 },
    { id: 'd', x: 380, y: 300, label: '国际合作', r: 18 + vars.intl / 5 },
    { id: 'e', x: 250, y: 60, label: '政策环境', r: 18 + vars.policy / 5 },
    { id: 'f', x: 250, y: 340, label: '资金投入', r: 18 + vars.funding / 5 },
  ];
  const edges = [['core', 'a'], ['core', 'b'], ['core', 'c'], ['core', 'd'], ['core', 'e'], ['core', 'f'], ['a', 'b'], ['c', 'f']];

  const sliders: { key: keyof typeof vars; label: string }[] = [
    { key: 'policy', label: '政策投入' },
    { key: 'breakthrough', label: '关键技术突破' },
    { key: 'funding', label: '资金强度' },
    { key: 'talent', label: '人才流入' },
    { key: 'intl', label: '国际合作' },
  ];

  const presets = {
    baseline: { policy: 60, breakthrough: 50, funding: 45, talent: 55, intl: 40 },
    aggressive: { policy: 85, breakthrough: 90, funding: 80, talent: 75, intl: 70 },
    conservative: { policy: 40, breakthrough: 30, funding: 35, talent: 40, intl: 30 },
  };

  return (
    <div className="grid grid-cols-[280px_1fr] gap-4 h-full">
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        <div className="text-sm font-medium text-gray-900 mb-3">关键变量</div>
        <div className="space-y-4 flex-1">
          {sliders.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700">{s.label}</span>
                <span className="text-xs font-semibold text-blue-600">{vars[s.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={vars[s.key]}
                onChange={(e) => {
                  setVars({ ...vars, [s.key]: Number(e.target.value) });
                  setScenario('custom');
                }}
                className="w-full accent-blue-600"
              />
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-700 mb-2">情景</div>
          <div className="flex flex-wrap gap-1.5">
            {(['baseline', 'aggressive', 'conservative'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setScenario(s);
                  setVars(presets[s]);
                }}
                className={`px-2 py-1 text-xs rounded ${scenario === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {s === 'baseline' ? '基准' : s === 'aggressive' ? '激进' : '保守'}
              </button>
            ))}
            <button className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">保存自定义</button>
          </div>
          <label className="flex items-center gap-1.5 mt-3 text-xs text-gray-700">
            <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
            叠加显示对比情景
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-900">影响传播图</div>
          <div className="flex gap-3 text-xs">
            <span className="text-gray-500">综合强度: <span className="text-blue-600 font-semibold">{intensity.toFixed(0)}</span></span>
            <span className="text-gray-500">情景: <span className="text-blue-600">{scenario === 'baseline' ? '基准' : scenario === 'aggressive' ? '激进' : scenario === 'conservative' ? '保守' : '自定义'}</span></span>
          </div>
        </div>
        <div className="flex-1">
          <svg viewBox="0 0 500 400" className="w-full h-full">
            {edges.map(([s, t], i) => {
              const a = nodes.find((n) => n.id === s)!;
              const b = nodes.find((n) => n.id === t)!;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#cbd5e1" strokeWidth="1.5" />;
            })}
            {nodes.map((n) => (
              <g key={n.id} style={{ transition: 'all 300ms' }}>
                <circle cx={n.x} cy={n.y} r={n.r} fill={`hsl(217, 91%, ${75 - intensity / 4}%)`} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="500">{n.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ============= View 6: 竞争力雷达 =============
function RadarView({ onDrill }: { onDrill: (label: string) => void }) {
  const [selected, setSelected] = useState(['机构 A', '机构 B', '机构 C']);
  const entities = ['机构 A', '机构 B', '机构 C', '机构 D'];
  const colors: Record<string, string> = {
    '机构 A': '#2563eb',
    '机构 B': '#ef4444',
    '机构 C': '#10b981',
    '机构 D': '#f59e0b',
  };
  const data = [
    { dim: '论文产出', '机构 A': 92, '机构 B': 78, '机构 C': 65, '机构 D': 55 },
    { dim: '专利数量', '机构 A': 85, '机构 B': 88, '机构 C': 60, '机构 D': 70 },
    { dim: '人才分布', '机构 A': 90, '机构 B': 75, '机构 C': 80, '机构 D': 50 },
    { dim: '高影响力成果', '机构 A': 88, '机构 B': 72, '机构 C': 68, '机构 D': 45 },
    { dim: '产业转化', '机构 A': 70, '机构 B': 82, '机构 C': 45, '机构 D': 65 },
    { dim: '国际合作', '机构 A': 80, '机构 B': 90, '机构 C': 72, '机构 D': 58 },
  ];
  const toggle = (e: string) =>
    setSelected((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {entities.map((e) => (
            <button
              key={e}
              onClick={() => toggle(e)}
              className={`px-2.5 py-1 text-xs rounded border ${
                selected.includes(e)
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: colors[e] }} />
              {e}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">悬停维度查看说明</span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid key="polargrid" />
            <PolarAngleAxis key="angleaxis" dataKey="dim" tick={{ fontSize: 11, cursor: 'pointer' }} onClick={(e: any) => onDrill(e.value)} />
            <PolarRadiusAxis key="radiusaxis" tick={{ fontSize: 10 }} />
            {selected.map((e) => (
              <Radar key={e} name={e} dataKey={e} stroke={colors[e]} fill={colors[e]} fillOpacity={0.15} />
            ))}
            <Legend key="legend" wrapperStyle={{ fontSize: 11 }} />
            <RTooltip key="tooltip" />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============= View 7: 科研成果关联 =============
function AchievementView({ onDrill }: { onDrill: (label: string) => void }) {
  const typeColors: Record<string, string> = {
    论文: '#2563eb',
    专利: '#10b981',
    人才: '#f59e0b',
    项目: '#8b5cf6',
    产品: '#ef4444',
  };
  const nodes = [
    { id: '1', label: '基础理论论文', type: '论文', x: 100, y: 100, size: 26 },
    { id: '2', label: '应用论文', type: '论文', x: 280, y: 80, size: 20 },
    { id: '3', label: '关键专利', type: '专利', x: 440, y: 120, size: 28 },
    { id: '4', label: '团队 A', type: '人才', x: 200, y: 220, size: 22 },
    { id: '5', label: '团队 B', type: '人才', x: 380, y: 260, size: 18 },
    { id: '6', label: '重大项目', type: '项目', x: 100, y: 330, size: 24 },
    { id: '7', label: '产品原型', type: '产品', x: 520, y: 300, size: 22 },
    { id: '8', label: '商业产品', type: '产品', x: 620, y: 200, size: 24 },
  ];
  const edges = [
    { s: '1', t: '2', type: 'ref' },
    { s: '2', t: '3', type: 'inherit' },
    { s: '4', t: '1', type: 'ref' },
    { s: '4', t: '3', type: 'inherit' },
    { s: '6', t: '4', type: 'ref' },
    { s: '6', t: '2', type: 'ref' },
    { s: '3', t: '7', type: 'transform' },
    { s: '7', t: '8', type: 'transform' },
    { s: '5', t: '7', type: 'inherit' },
  ];
  const dashFor = (t: string) => (t === 'ref' ? '0' : t === 'inherit' ? '6 3' : '2 3');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 mr-1">成果类型:</span>
          {Object.entries(typeColors).map(([t, c]) => (
            <button key={t} className="px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50">
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: c }} />{t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">关系:</span>
          <span><span className="inline-block w-4 h-0.5 bg-gray-500 align-middle mr-1" />引用</span>
          <span><span className="inline-block w-4 border-t border-dashed border-gray-500 align-middle mr-1" />继承</span>
          <span><span className="inline-block w-4 border-t border-dotted border-gray-500 align-middle mr-1" />转化</span>
          <label className="flex items-center gap-1 ml-2"><input type="checkbox" />社区检测</label>
          <input placeholder="起点" className="px-1.5 py-0.5 border rounded w-16 text-xs" />
          <input placeholder="终点" className="px-1.5 py-0.5 border rounded w-16 text-xs" />
          <button className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded">最短路径</button>
        </div>
      </div>
      <div className="flex-1">
        <svg viewBox="0 0 720 420" className="w-full h-full">
          {edges.map((e, i) => {
            const a = nodes.find((n) => n.id === e.s)!;
            const b = nodes.find((n) => n.id === e.t)!;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray={dashFor(e.type)}
              />
            );
          })}
          {nodes.map((n) => (
            <g key={n.id} onClick={() => onDrill(n.label)} style={{ cursor: 'pointer' }}>
              <circle cx={n.x} cy={n.y} r={n.size} fill={typeColors[n.type]} />
              <text x={n.x} y={n.y + n.size + 12} textAnchor="middle" fill="#1f2937" fontSize="11">{n.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ============= View 8: 情景模拟 =============
function ScenarioView({ onDrill }: { onDrill: (label: string) => void }) {
  const data = Array.from({ length: 11 }, (_, i) => {
    const y = 2024 + i;
    return {
      year: y,
      激进: 100 + i * 22 + Math.sin(i) * 4,
      基准: 100 + i * 12,
      保守: 100 + i * 5,
    };
  });
  const milestones = [
    { name: 'M1 基础算法突破', start: 2024, end: 2025, scenario: '基准', color: '#2563eb' },
    { name: 'M2 关键专利布局', start: 2024, end: 2026, scenario: '基准', color: '#2563eb' },
    { name: 'M3 大模型量产', start: 2025, end: 2027, scenario: '激进', color: '#ef4444' },
    { name: 'M4 产业链整合', start: 2026, end: 2029, scenario: '基准', color: '#2563eb' },
    { name: 'M5 国际标准制定', start: 2027, end: 2030, scenario: '激进', color: '#ef4444' },
    { name: 'M6 局部应用上线', start: 2025, end: 2028, scenario: '保守', color: '#10b981' },
    { name: 'M7 跨国合作落地', start: 2028, end: 2032, scenario: '激进', color: '#ef4444' },
  ];
  const minY = 2024, maxY = 2034;
  return (
    <div className="grid grid-rows-2 gap-4 h-full">
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        <div className="text-sm font-medium text-gray-900 mb-2">三情景增长曲线</div>
        <div className="flex-1">
          <ResponsiveContainer>
            <LineChart data={data} onClick={(e: any) => e?.activeLabel && onDrill(`${e.activeLabel} 年`)}>
              <CartesianGrid key="grid" strokeDasharray="3 3" />
              <XAxis key="xaxis" dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis key="yaxis" tick={{ fontSize: 11 }} />
              <RTooltip key="tooltip" />
              <Legend
                key="legend"
                wrapperStyle={{ fontSize: 11 }}
                formatter={(v: string) =>
                  `${v} · 概率 ${v === '激进' ? '28%' : v === '基准' ? '52%' : '20%'}`
                }
              />
              <Line key="line-激进" type="monotone" dataKey="激进" stroke="#ef4444" strokeWidth={2} />
              <Line key="line-基准" type="monotone" dataKey="基准" stroke="#2563eb" strokeWidth={2} />
              <Line key="line-保守" type="monotone" dataKey="保守" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
        <div className="text-sm font-medium text-gray-900 mb-2">关键路径与里程碑</div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1.5">
            {milestones.map((m, i) => {
              const left = ((m.start - minY) / (maxY - minY)) * 100;
              const width = ((m.end - m.start) / (maxY - minY)) * 100;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-44 truncate text-gray-700">{m.name}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded relative">
                    <div
                      onClick={() => onDrill(m.name)}
                      className="absolute h-full rounded cursor-pointer flex items-center px-2 text-white text-[10px] hover:opacity-80"
                      style={{ left: `${left}%`, width: `${width}%`, background: m.color }}
                    >
                      {m.scenario}
                    </div>
                  </div>
                  <div className="w-16 text-gray-500">{m.start}-{m.end}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= View 9: 跨领域影响（旭日/树图/路径发现） =============

type CrossImpactMode = 'sunburst' | 'tree' | 'path';

interface ImpactPathNode {
  name: string;
  type: 'technology' | 'concept' | 'application' | 'domain';
}
interface ImpactPathEdge { relation: string; }
interface ImpactPath {
  id: string;
  nodes: ImpactPathNode[];
  edges: ImpactPathEdge[];
  score: number;
  papers: number;
  patents: number;
  targetDomain: string;
  targetColor: string;
}

const DOMAIN_COLORS: Record<string, string> = {
  '医疗': '#10b981', '教育': '#2563eb', '金融': '#f59e0b',
  '制造': '#8b5cf6', '法律': '#ef4444', '农业': '#84cc16', '能源': '#f97316',
};

const IMPACT_PATH_DATA: Record<string, ImpactPath[]> = {
  '深度学习': [
    {
      id: 'dl-1', score: 0.94, papers: 1842, patents: 312, targetDomain: '医疗', targetColor: '#10b981',
      nodes: [
        { name: '深度学习', type: 'technology' },
        { name: '卷积神经网络', type: 'concept' },
        { name: '医学影像分析', type: 'concept' },
        { name: '辅助诊断', type: 'application' },
      ],
      edges: [{ relation: '催生' }, { relation: '应用于' }, { relation: '赋能' }],
    },
    {
      id: 'dl-2', score: 0.88, papers: 934, patents: 178, targetDomain: '教育', targetColor: '#2563eb',
      nodes: [
        { name: '深度学习', type: 'technology' },
        { name: '协同过滤', type: 'concept' },
        { name: '个性化推荐', type: 'concept' },
        { name: '智能自适应学习', type: 'application' },
      ],
      edges: [{ relation: '优化' }, { relation: '支撑' }, { relation: '驱动' }],
    },
    {
      id: 'dl-3', score: 0.82, papers: 721, patents: 203, targetDomain: '制造', targetColor: '#8b5cf6',
      nodes: [
        { name: '深度学习', type: 'technology' },
        { name: '强化学习', type: 'concept' },
        { name: '机器人路径规划', type: 'concept' },
        { name: '工业自动化', type: 'application' },
      ],
      edges: [{ relation: '赋能' }, { relation: '驱动' }, { relation: '进入' }],
    },
    {
      id: 'dl-4', score: 0.76, papers: 518, patents: 95, targetDomain: '金融', targetColor: '#f59e0b',
      nodes: [
        { name: '深度学习', type: 'technology' },
        { name: '时序预测模型', type: 'concept' },
        { name: '金融风险识别', type: 'concept' },
        { name: '智能投顾', type: 'application' },
      ],
      edges: [{ relation: '应用' }, { relation: '增强' }, { relation: '形成' }],
    },
    {
      id: 'dl-5', score: 0.71, papers: 389, patents: 61, targetDomain: '法律', targetColor: '#ef4444',
      nodes: [
        { name: '深度学习', type: 'technology' },
        { name: '自然语言理解', type: 'concept' },
        { name: '法律文本语义分析', type: 'concept' },
        { name: '合同审阅', type: 'application' },
      ],
      edges: [{ relation: '推动' }, { relation: '应用于' }, { relation: '改变' }],
    },
  ],
  '大模型': [
    {
      id: 'llm-1', score: 0.96, papers: 2103, patents: 421, targetDomain: '教育', targetColor: '#2563eb',
      nodes: [
        { name: '大模型', type: 'technology' },
        { name: '提示工程', type: 'concept' },
        { name: '知识自适应推理', type: 'concept' },
        { name: '个性化智能辅导', type: 'application' },
      ],
      edges: [{ relation: '催生' }, { relation: '支撑' }, { relation: '变革' }],
    },
    {
      id: 'llm-2', score: 0.91, papers: 1567, patents: 289, targetDomain: '医疗', targetColor: '#10b981',
      nodes: [
        { name: '大模型', type: 'technology' },
        { name: '医学知识图谱', type: 'concept' },
        { name: '临床决策支持', type: 'concept' },
        { name: '辅助诊断', type: 'application' },
      ],
      edges: [{ relation: '推动' }, { relation: '增强' }, { relation: '改变' }],
    },
    {
      id: 'llm-3', score: 0.85, papers: 823, patents: 134, targetDomain: '法律', targetColor: '#ef4444',
      nodes: [
        { name: '大模型', type: 'technology' },
        { name: '法律推理链', type: 'concept' },
        { name: '案例语义检索', type: 'concept' },
        { name: '司法决策辅助', type: 'application' },
      ],
      edges: [{ relation: '赋能' }, { relation: '支持' }, { relation: '进入' }],
    },
    {
      id: 'llm-4', score: 0.78, papers: 612, patents: 98, targetDomain: '金融', targetColor: '#f59e0b',
      nodes: [
        { name: '大模型', type: 'technology' },
        { name: '金融文本理解', type: 'concept' },
        { name: '舆情风险识别', type: 'concept' },
        { name: '智能风控', type: 'application' },
      ],
      edges: [{ relation: '应用' }, { relation: '增强' }, { relation: '形成' }],
    },
  ],
  '强化学习': [
    {
      id: 'rl-1', score: 0.91, papers: 1124, patents: 267, targetDomain: '制造', targetColor: '#8b5cf6',
      nodes: [
        { name: '强化学习', type: 'technology' },
        { name: '多智能体协作', type: 'concept' },
        { name: '柔性生产调度', type: 'concept' },
        { name: '智能制造', type: 'application' },
      ],
      edges: [{ relation: '催生' }, { relation: '优化' }, { relation: '进入' }],
    },
    {
      id: 'rl-2', score: 0.83, papers: 734, patents: 145, targetDomain: '医疗', targetColor: '#10b981',
      nodes: [
        { name: '强化学习', type: 'technology' },
        { name: '序列决策优化', type: 'concept' },
        { name: '个性化治疗方案', type: 'concept' },
        { name: '精准医疗', type: 'application' },
      ],
      edges: [{ relation: '赋能' }, { relation: '生成' }, { relation: '推动' }],
    },
    {
      id: 'rl-3', score: 0.74, papers: 421, patents: 82, targetDomain: '金融', targetColor: '#f59e0b',
      nodes: [
        { name: '强化学习', type: 'technology' },
        { name: '动态投资组合', type: 'concept' },
        { name: '量化交易策略', type: 'concept' },
        { name: '智能量化投资', type: 'application' },
      ],
      edges: [{ relation: '应用' }, { relation: '驱动' }, { relation: '形成' }],
    },
  ],
  '量子计算': [
    {
      id: 'qc-1', score: 0.87, papers: 512, patents: 203, targetDomain: '金融', targetColor: '#f59e0b',
      nodes: [
        { name: '量子计算', type: 'technology' },
        { name: '量子优化算法', type: 'concept' },
        { name: '投资组合优化', type: 'concept' },
        { name: '量子金融', type: 'application' },
      ],
      edges: [{ relation: '实现' }, { relation: '应用于' }, { relation: '开创' }],
    },
    {
      id: 'qc-2', score: 0.79, papers: 341, patents: 128, targetDomain: '医疗', targetColor: '#10b981',
      nodes: [
        { name: '量子计算', type: 'technology' },
        { name: '量子分子模拟', type: 'concept' },
        { name: '蛋白质折叠预测', type: 'concept' },
        { name: '新药研发', type: 'application' },
      ],
      edges: [{ relation: '催生' }, { relation: '加速' }, { relation: '进入' }],
    },
    {
      id: 'qc-3', score: 0.68, papers: 213, patents: 76, targetDomain: '制造', targetColor: '#8b5cf6',
      nodes: [
        { name: '量子计算', type: 'technology' },
        { name: '量子退火', type: 'concept' },
        { name: '组合优化问题', type: 'concept' },
        { name: '供应链调度', type: 'application' },
      ],
      edges: [{ relation: '赋能' }, { relation: '求解' }, { relation: '优化' }],
    },
  ],
  '自然语言处理': [
    {
      id: 'nlp-1', score: 0.93, papers: 1683, patents: 298, targetDomain: '法律', targetColor: '#ef4444',
      nodes: [
        { name: '自然语言处理', type: 'technology' },
        { name: '法律语义理解', type: 'concept' },
        { name: '裁判文书分析', type: 'concept' },
        { name: '智能法律咨询', type: 'application' },
      ],
      edges: [{ relation: '推动' }, { relation: '应用于' }, { relation: '变革' }],
    },
    {
      id: 'nlp-2', score: 0.88, papers: 1241, patents: 187, targetDomain: '教育', targetColor: '#2563eb',
      nodes: [
        { name: '自然语言处理', type: 'technology' },
        { name: '学习者画像建模', type: 'concept' },
        { name: '自动作文批改', type: 'concept' },
        { name: '智能教学评估', type: 'application' },
      ],
      edges: [{ relation: '赋能' }, { relation: '驱动' }, { relation: '形成' }],
    },
    {
      id: 'nlp-3', score: 0.79, papers: 876, patents: 142, targetDomain: '医疗', targetColor: '#10b981',
      nodes: [
        { name: '自然语言处理', type: 'technology' },
        { name: '电子病历挖掘', type: 'concept' },
        { name: '临床知识抽取', type: 'concept' },
        { name: '智能医疗记录', type: 'application' },
      ],
      edges: [{ relation: '应用' }, { relation: '增强' }, { relation: '改变' }],
    },
  ],
};

const NODE_STYLE: Record<ImpactPathNode['type'], { dot: string; bg: string; border: string; text: string; badge: string; label: string }> = {
  technology: { dot: 'bg-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-600',   label: '技术' },
  concept:    { dot: 'bg-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-600', label: '概念' },
  application:{ dot: 'bg-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-600',  label: '应用' },
  domain:     { dot: 'bg-emerald-500',bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-800',badge: 'bg-emerald-100 text-emerald-600',label: '领域' },
};

function PathChain({ path, onDrill }: { path: ImpactPath; onDrill: (label: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = path.score >= 0.9 ? 'bg-emerald-500' : path.score >= 0.75 ? 'bg-blue-500' : 'bg-amber-400';
  const scoreTx   = path.score >= 0.9 ? 'text-emerald-700' : path.score >= 0.75 ? 'text-blue-700' : 'text-amber-700';
  const domainBg  = `bg-[${path.targetColor}]`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Domain badge */}
        <span className="flex-shrink-0 text-xs font-semibold text-white px-2.5 py-1 rounded-full"
          style={{ background: path.targetColor }}>
          {path.targetDomain}
        </span>
        {/* Score bar */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${scoreColor}`} style={{ width: `${path.score * 100}%` }} />
          </div>
          <span className={`text-xs font-semibold w-10 text-right tabular-nums ${scoreTx}`}>
            {Math.round(path.score * 100)}%
          </span>
        </div>
        {/* Evidence */}
        <div className="flex-shrink-0 flex items-center gap-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-0.5"><FileText size={10} />{path.papers.toLocaleString()} 文</span>
          <span className="flex items-center gap-0.5"><Lightbulb size={10} />{path.patents} 专</span>
        </div>
        {/* Expand toggle */}
        <button onClick={() => setExpanded(v => !v)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
          <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Path chain */}
      <div className="px-4 pb-4 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {path.nodes.map((node, ni) => {
            const s = NODE_STYLE[node.type];
            return (
              <div key={ni} className="flex items-center gap-1">
                {/* Node pill */}
                <button
                  onClick={() => onDrill(node.name)}
                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg ${s.bg} ${s.border} hover:shadow-sm transition-all group`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div>
                    <div className={`text-xs font-semibold ${s.text} leading-tight whitespace-nowrap`}>{node.name}</div>
                    <div className={`text-[9px] px-1 rounded mt-0.5 ${s.badge} leading-tight`}>{s.label}</div>
                  </div>
                </button>
                {/* Edge arrow */}
                {ni < path.edges.length && (
                  <div className="flex flex-col items-center gap-0.5 px-1">
                    <span className="text-[9px] text-gray-400 whitespace-nowrap leading-none">{path.edges[ni].relation}</span>
                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-400 mb-1 font-medium">传播强度分析</div>
              <p className="text-gray-600 leading-relaxed">
                该路径在知识图谱中共经过 {path.nodes.length} 个节点，最短跳数为 {path.edges.length}，
                传播强度得分 {(path.score * 100).toFixed(0)}%，属于{path.score >= 0.9 ? '强' : path.score >= 0.75 ? '中等' : '弱'}影响路径。
              </p>
            </div>
            <div>
              <div className="text-gray-400 mb-1 font-medium">文献支撑</div>
              <div className="space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>相关论文</span><span className="font-semibold">{path.papers.toLocaleString()} 篇</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>相关专利</span><span className="font-semibold">{path.patents} 项</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>目标领域</span>
                  <span className="font-semibold" style={{ color: path.targetColor }}>{path.targetDomain}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SOURCE_TECHS = ['深度学习', '大模型', '强化学习', '量子计算', '自然语言处理'];

function PathDiscoveryPanel({ onDrill }: { onDrill: (label: string) => void }) {
  const [source, setSource] = useState('深度学习');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ImpactPath[] | null>(IMPACT_PATH_DATA['深度学习']);
  const [filterDomain, setFilterDomain] = useState('全部');

  const handleSearch = () => {
    setSearching(true);
    setResults(null);
    setFilterDomain('全部');
    setTimeout(() => {
      setResults(IMPACT_PATH_DATA[source] ?? []);
      setSearching(false);
    }, 1100);
  };

  const domains = results ? ['全部', ...Array.from(new Set(results.map(p => p.targetDomain)))] : ['全部'];
  const visible = results
    ? (filterDomain === '全部' ? results : results.filter(p => p.targetDomain === filterDomain))
        .sort((a, b) => b.score - a.score)
    : [];

  const domainCount = results ? new Set(results.map(p => p.targetDomain)).size : 0;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Search bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <RouteIcon size={12} className="text-blue-500" />
          在知识图谱中搜索传播路径
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[10px] text-gray-400 mb-1">起源技术</div>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
            >
              {SOURCE_TECHS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-shrink-0 pt-5">
            <ArrowRight size={16} className="text-gray-300" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-gray-400 mb-1">目标领域</div>
            <div className="border border-dashed border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">
              全部领域（自动发现）
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm rounded-lg transition-colors mt-5"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {searching ? '搜索中…' : '搜索路径'}
          </button>
        </div>
      </div>

      {/* Searching state */}
      {searching && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Loader2 size={20} className="text-blue-500 animate-spin" />
          </div>
          <p className="text-sm">正在知识图谱中搜索传播路径…</p>
          <p className="text-xs">遍历实体节点 · 计算传播强度 · 排序路径</p>
        </div>
      )}

      {/* Results */}
      {!searching && results && (
        <>
          {/* Summary + filter */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-sm text-gray-600">
              共发现 <span className="font-semibold text-gray-900">{results.length}</span> 条路径，
              跨越 <span className="font-semibold text-gray-900">{domainCount}</span> 个领域
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              {domains.map(d => (
                <button
                  key={d}
                  onClick={() => setFilterDomain(d)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${filterDomain === d ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  style={filterDomain === d ? { background: d === '全部' ? '#2563eb' : DOMAIN_COLORS[d] } : {}}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Path list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <RouteIcon size={32} className="mb-3 opacity-30" />
                <p className="text-sm">该领域暂无传播路径</p>
              </div>
            ) : (
              visible.map(p => <PathChain key={p.id} path={p} onDrill={onDrill} />)
            )}
          </div>
        </>
      )}

      {/* Empty initial state */}
      {!searching && results === null && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <RouteIcon size={36} className="opacity-20" />
          <p className="text-sm">选择起源技术后点击「搜索路径」</p>
        </div>
      )}
    </div>
  );
}

function CrossImpactView({ onDrill }: { onDrill: (label: string) => void }) {
  const [mode, setMode] = useState<CrossImpactMode>('sunburst');
  const center = '大模型';
  const layer1 = [
    { name: '教育', color: '#2563eb', children: ['个性化学习', '智能助教', '内容生成'] },
    { name: '医疗', color: '#10b981', children: ['辅助诊断', '药物研发', '医疗影像'] },
    { name: '金融', color: '#f59e0b', children: ['智能投顾', '风控建模', '智能客服'] },
    { name: '制造', color: '#8b5cf6', children: ['工艺优化', '质检自动化', '柔性制造'] },
    { name: '法律', color: '#ef4444', children: ['案例检索', '合同审阅', '判决预测'] },
  ];

  const modeToggle = (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button onClick={() => setMode('sunburst')} className={`px-2 py-1 text-xs rounded transition-colors ${mode === 'sunburst' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>旭日图</button>
      <button onClick={() => setMode('tree')} className={`px-2 py-1 text-xs rounded transition-colors ${mode === 'tree' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>树图</button>
      <button onClick={() => setMode('path')} className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${mode === 'path' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
        <RouteIcon size={11} />影响路径
      </button>
    </div>
  );

  if (mode === 'path') {
    return (
      <div className="h-full flex flex-col gap-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RouteIcon size={14} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">影响路径发现</span>
            <span className="text-xs text-gray-400">从源技术出发，探索知识在图谱中的跨领域传播链路</span>
          </div>
          {modeToggle}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <PathDiscoveryPanel onDrill={onDrill} />
        </div>
      </div>
    );
  }

  if (mode === 'tree') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500">面包屑：{center}</div>
          {modeToggle}
        </div>
        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            <div className="font-medium text-gray-900">{center}</div>
            {layer1.map((l) => (
              <div key={l.name} className="ml-4">
                <div className="flex items-center gap-2 py-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-sm text-gray-800">{l.name}</span>
                </div>
                <div className="ml-6 space-y-0.5">
                  {l.children.map((c) => (
                    <button key={c} onClick={() => onDrill(c)} className="block text-xs text-gray-600 hover:text-blue-600">
                      └ {c}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cx = 250, cy = 220;
  const innerR = 60, midR = 130, outerR = 200;
  const angleStep = (Math.PI * 2) / layer1.length;

  const arcPath = (r0: number, r1: number, a0: number, a1: number) => {
    const x0 = cx + r0 * Math.cos(a0); const y0 = cy + r0 * Math.sin(a0);
    const x1 = cx + r1 * Math.cos(a0); const y1 = cy + r1 * Math.sin(a0);
    const x2 = cx + r1 * Math.cos(a1); const y2 = cy + r1 * Math.sin(a1);
    const x3 = cx + r0 * Math.cos(a1); const y3 = cy + r0 * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} L ${x1} ${y1} A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r0} ${r0} 0 ${large} 0 ${x0} ${y0} Z`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500">面包屑：{center}</div>
        {modeToggle}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <svg viewBox="0 0 500 440" className="w-full h-full max-w-3xl">
          <circle cx={cx} cy={cy} r={innerR} fill="#1f2937" />
          <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{center}</text>
          {layer1.map((l, i) => {
            const a0 = i * angleStep - Math.PI / 2;
            const a1 = a0 + angleStep;
            const mid = (a0 + a1) / 2;
            const lx = cx + (midR - 30) * Math.cos(mid);
            const ly = cy + (midR - 30) * Math.sin(mid);
            return (
              <g key={l.name}>
                <path d={arcPath(innerR, midR, a0, a1)} fill={l.color} opacity="0.85" onClick={() => onDrill(l.name)} style={{ cursor: 'pointer' }} />
                <text x={lx} y={ly + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="500">{l.name}</text>
                {l.children.map((c, j) => {
                  const subStep = angleStep / l.children.length;
                  const sa0 = a0 + j * subStep;
                  const sa1 = sa0 + subStep;
                  const smid = (sa0 + sa1) / 2;
                  const slx = cx + (outerR + 14) * Math.cos(smid);
                  const sly = cy + (outerR + 14) * Math.sin(smid);
                  return (
                    <g key={c}>
                      <path d={arcPath(midR, outerR, sa0, sa1)} fill={l.color} opacity="0.5" onClick={() => onDrill(c)} style={{ cursor: 'pointer' }} />
                      <text x={slx} y={sly} textAnchor={Math.cos(smid) > 0 ? 'start' : 'end'} fill="#1f2937" fontSize="10">{c}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ============= 数据视图 =============
function DataView({ viewKey }: { viewKey: ViewKey }) {
  const data = [
    { name: '深度学习', papers: 12480, patents: 3210, hindex: 486, year: 2024 },
    { name: '大语言模型', papers: 8920, patents: 1820, hindex: 392, year: 2024 },
    { name: '多模态', papers: 5340, patents: 980, hindex: 215, year: 2024 },
    { name: '强化学习', papers: 4210, patents: 720, hindex: 178, year: 2023 },
    { name: '可解释 AI', papers: 2180, patents: 320, hindex: 95, year: 2023 },
  ];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <div className="text-xs text-gray-500 mb-3">视图：{viewKey} · 数据明细</div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th className="text-left px-3 py-2">主题</th>
            <th className="text-right px-3 py-2">论文</th>
            <th className="text-right px-3 py-2">专利</th>
            <th className="text-right px-3 py-2">h-index</th>
            <th className="text-right px-3 py-2">年份</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.name} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-900">{row.name}</td>
              <td className="px-3 py-2 text-right text-gray-700">{row.papers.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-gray-700">{row.patents.toLocaleString()}</td>
              <td className="px-3 py-2 text-right text-gray-700">{row.hindex}</td>
              <td className="px-3 py-2 text-right text-gray-700">{row.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
