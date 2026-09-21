/**
 * 主题科技分析底部面板 — 静态适配网关返回
 * POST /api/v1/theme-tech/research-market-paths:analyze
 * POST /api/v1/theme-tech/tech-industry:analyze
 * 专利-产品映射：从转化路径中的 patent→product 边派生（网关暂无独立路由）
 */

export type ThemeTechDockTab = 'research-market' | 'tech-industry' | 'patent-product';

export type ThemeTechPath = {
  pathId: string;
  name: string;
  description: string;
  narrative: string;
  significance: number;
  yearRange: string;
  tags: string[];
  stages: string[];
  nodes: Array<{ id: string; name: string; type: string; typeLabel: string; year?: number | null }>;
  edges: Array<{ id: string; source: string; target: string; relation: string }>;
};

export type TechIndustryItem = {
  technology: string;
  industry: string;
  application: string;
  maturity: '实验室' | '中试' | '产业化' | '规模应用' | string;
  maturityScore: number;
  paperCount: number;
  patentCount: number;
  companies: string[];
  evidence?: string;
};

export type PatentProductLink = {
  id: string;
  patent: string;
  product: string;
  company: string;
  technology: string;
  relation: string;
  pathName: string;
};

/** 对齐 research-market-paths:analyze（graphSpace=gkx_rag → gkx_kg_rag） */
export const THEME_RESEARCH_MARKET = {
  graphSpace: 'gkx_kg_rag',
  requestedSpace: 'gkx_rag',
  topic: '炎症',
  mode: 'research-market' as const,
  nodeTypes: [
    { id: 'literature', label: '文献' },
    { id: 'technology', label: '技术' },
    { id: 'patent', label: '专利' },
    { id: 'product', label: '产品' },
    { id: 'industry', label: '产业' },
    { id: 'company', label: '企业' },
  ],
  overview:
    '炎症相关研究从基础文献出发，涉及胆汁酸分析与粪便菌群移植两大技术方向，但所检索到的专利与炎症领域技术关联较弱，存在明显的跨领域错配现象。两条路径均缺乏明确的商业化公司与产业转化实体，市场转化链条尚不完整。',
  paths: [
    {
      pathId: 'rmp_1',
      name: '胆汁酸分析-炎症标志物路径',
      description:
        '该路径旨在通过粪便和血清胆汁酸分析揭示酒精性肝硬化中结肠炎症的机制，为炎症相关肝肠轴疾病的诊断提供潜在生物标志物，但所链接专利属事务系统配置领域，与技术方向不匹配。',
      narrative:
        '文献研究酒精性肝硬化中结肠炎症与次级胆汁酸的关系，提出粪便与血清胆汁酸分析技术方向，但所检索专利为事务系统硬件软件配置方法，与炎症或胆汁酸分析无直接技术关联，且无公司承接转化，市场路径断裂。',
      significance: 0.84,
      yearRange: '2014',
      tags: ['炎症'],
      stages: ['文献', '技术', '专利', '产品', '产业'],
      nodes: [
        { id: 'paper:813148817724538881', name: '酒精性肝硬化中的结肠炎症与次级胆汁酸', type: 'literature', typeLabel: '文献', year: 2014 },
        { id: 'technique:fecal_and_serum_bile_acid_analysis', name: 'Fecal and serum bile acid analysis', type: 'technology', typeLabel: '技术', year: null },
        { id: 'patent:au-1190692-a', name: 'Determining transaction system hardware and software configurations', type: 'patent', typeLabel: '专利', year: null },
        { id: 'product:determining_transactio', name: 'Determining transactio…', type: 'product', typeLabel: '产品', year: null },
        { id: 'industry:fecal_and_serum_bile_acid_analysis', name: 'Fecal and serum bile acid analysis相关产业', type: 'industry', typeLabel: '产业', year: null },
      ],
      edges: [
        { id: 'e1', source: 'paper:813148817724538881', target: 'technique:fecal_and_serum_bile_acid_analysis', relation: '引用' },
        { id: 'e2', source: 'technique:fecal_and_serum_bile_acid_analysis', target: 'patent:au-1190692-a', relation: '专利化' },
        { id: 'e3', source: 'patent:au-1190692-a', target: 'product:determining_transactio', relation: '产品化' },
        { id: 'e4', source: 'product:determining_transactio', target: 'industry:fecal_and_serum_bile_acid_analysis', relation: '催生' },
      ],
    },
    {
      pathId: 'rmp_2',
      name: '粪便菌群移植-肠道炎症干预路径',
      description:
        '该路径聚焦结肠微生物群通过炎症调节、氧化还原状态及离子转运体基因表达改变宿主对感染性结肠炎易感性的机制，粪便菌群移植作为核心技术具有治疗炎症性肠病的潜力，但所链接专利属无线通信系统功率分配领域，与技术方向完全不相关。',
      narrative:
        '文献阐明结肠微生物群调控炎症与结肠炎易感性的机制，提出粪便菌群移植作为干预技术，但所检索专利为无线通信系统中时分功率分配方法，与炎症或菌群移植无技术关联，无公司介入商业化，从文献到市场的转化链条中断。',
      significance: 0.78,
      yearRange: '2011',
      tags: ['炎症'],
      stages: ['文献', '技术', '专利', '产品', '产业'],
      nodes: [
        { id: 'paper:811671348920188932', name: '结肠微生物群通过调节炎症、氧化还原状态和离子转运体基因表达来改变宿主对感染性结肠炎的易感性', type: 'literature', typeLabel: '文献', year: 2011 },
        { id: 'technique:粪便菌群移植', name: '粪便菌群移植', type: 'technology', typeLabel: '技术', year: null },
        { id: 'patent:wo-0219563-a2', name: 'Method and apparatus for time-division power assignments in a wireless communication system', type: 'patent', typeLabel: '专利', year: null },
        { id: 'product:method_and_apparatus_f', name: 'Method and apparatus f…', type: 'product', typeLabel: '产品', year: null },
        { id: 'industry:粪便菌群移植', name: '粪便菌群移植相关产业', type: 'industry', typeLabel: '产业', year: null },
      ],
      edges: [
        { id: 'e5', source: 'paper:811671348920188932', target: 'technique:粪便菌群移植', relation: '引用' },
        { id: 'e6', source: 'technique:粪便菌群移植', target: 'patent:wo-0219563-a2', relation: '专利化' },
        { id: 'e7', source: 'patent:wo-0219563-a2', target: 'product:method_and_apparatus_f', relation: '产品化' },
        { id: 'e8', source: 'product:method_and_apparatus_f', target: 'industry:粪便菌群移植', relation: '催生' },
      ],
    },
  ] as ThemeTechPath[],
};

/** 对齐 tech-industry:analyze */
export const THEME_TECH_INDUSTRY = {
  graphSpace: 'gkx_kg_rag',
  requestedSpace: 'gkx_rag',
  topic: '粪便菌群移植',
  mode: 'tech-industry' as const,
  overview:
    '粪便菌群移植（FMT）作为一种将健康供体粪便菌群引入患者肠道的治疗手段，主要应用于消化系统疾病领域，尤其在艰难梭菌感染（CDI）相关腹泻/结肠炎的治疗中已有较多临床实践。当前文献证据聚焦于结肠微生物群通过调节炎症反应、氧化还原状态及离子转运体基因表达来影响宿主对感染性结肠炎易感性的机制研究，表明该技术仍处于从实验室机制研究向临床转化推进的阶段。专利数据中未见与粪便菌群移植直接相关的技术保护布局，Companies 列表为空，进一步说明其产业化和商业化程度有限。',
  items: [
    {
      technology: '粪便菌群移植',
      industry: '消化系统疾病诊疗',
      application:
        '通过移植健康供体的粪便菌群至患者肠道，用于治疗艰难梭菌感染、感染性结肠炎等肠道菌群失调相关疾病，调节宿主炎症反应和氧化还原状态以降低对结肠炎的易感性。',
      maturity: '中试',
      maturityScore: 0.5,
      paperCount: 1,
      patentCount: 30,
      companies: [],
      evidence:
        '已有论文研究结肠微生物群对感染性结肠炎易感性的调节机制，涉及炎症、氧化还原状态和离子转运体基因表达，表明处于从实验室向临床转化的研究阶段；但无直接相关专利和企业布局，产业化程度有限。',
    },
  ] as TechIndustryItem[],
};

/** 专利→产品映射：从转化路径边 relation=产品化 派生 */
export const THEME_PATENT_PRODUCT: PatentProductLink[] = THEME_RESEARCH_MARKET.paths.flatMap((path) => {
  const byId = Object.fromEntries(path.nodes.map((n) => [n.id, n]));
  return path.edges
    .filter((e) => e.relation === '产品化')
    .map((e, i) => {
      const patent = byId[e.source];
      const product = byId[e.target];
      const tech = path.nodes.find((n) => n.type === 'technology');
      const company = path.nodes.find((n) => n.type === 'company');
      return {
        id: `${path.pathId}_pp_${i}`,
        patent: patent?.name ?? e.source,
        product: product?.name ?? e.target,
        company: company?.name ?? '—',
        technology: tech?.name ?? '—',
        relation: e.relation,
        pathName: path.name,
      };
    });
});

const MATURITY_COLOR: Record<string, string> = {
  实验室: 'bg-slate-100 text-slate-700 border-slate-200',
  中试: 'bg-amber-50 text-amber-700 border-amber-200',
  产业化: 'bg-blue-50 text-blue-700 border-blue-200',
  规模应用: 'bg-green-50 text-green-700 border-green-200',
};

const TYPE_COLOR: Record<string, string> = {
  literature: 'bg-violet-50 text-violet-700',
  technology: 'bg-indigo-50 text-indigo-700',
  patent: 'bg-amber-50 text-amber-700',
  company: 'bg-pink-50 text-pink-700',
  product: 'bg-emerald-50 text-emerald-700',
  industry: 'bg-sky-50 text-sky-700',
};

function truncate(text: string, n: number) {
  return text.length > n ? `${text.slice(0, n)}…` : text;
}

export function ThemeTechDockPanel({ tab }: { tab: ThemeTechDockTab }) {
  if (tab === 'research-market') {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-gray-800">科研-市场转化路径分析</span>
          <code className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
            POST /api/v1/theme-tech/research-market-paths:analyze
          </code>
          <span className="text-gray-400">
            graphSpace={THEME_RESEARCH_MARKET.requestedSpace} → {THEME_RESEARCH_MARKET.graphSpace} · topic={THEME_RESEARCH_MARKET.topic}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">{THEME_RESEARCH_MARKET.overview}</p>
        <div className="flex flex-wrap gap-1">
          {THEME_RESEARCH_MARKET.nodeTypes.map((t) => (
            <span key={t.id} className={`rounded px-1.5 py-0.5 text-[10px] ${TYPE_COLOR[t.id] ?? 'bg-gray-50 text-gray-600'}`}>
              {t.label}
            </span>
          ))}
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {THEME_RESEARCH_MARKET.paths.map((path) => (
            <div key={path.pathId} className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-medium text-gray-800">{path.name}</div>
                <span className="shrink-0 text-[10px] text-blue-600">显著性 {path.significance.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{path.description}</p>
              <div className="flex flex-wrap items-center gap-1">
                {path.nodes.map((n, i) => (
                  <span key={n.id} className="inline-flex items-center gap-1">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${TYPE_COLOR[n.type] ?? 'bg-gray-50 text-gray-600'}`}>
                      {n.typeLabel}·{truncate(n.name, 16)}
                    </span>
                    {i < path.nodes.length - 1 && <span className="text-gray-300 text-[10px]">→</span>}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {path.edges.map((e) => (
                  <span key={e.id} className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 border border-gray-100">
                    {e.relation}
                  </span>
                ))}
                <span className="text-[10px] text-gray-400 self-center">{path.yearRange}</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">{path.narrative}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tab === 'tech-industry') {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-gray-800">技术-产业关联分析</span>
          <code className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
            POST /api/v1/theme-tech/tech-industry:analyze
          </code>
          <span className="text-gray-400">
            graphSpace={THEME_TECH_INDUSTRY.requestedSpace} · technology={THEME_TECH_INDUSTRY.topic}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">{THEME_TECH_INDUSTRY.overview}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[10px] text-gray-400">
                <th className="py-1.5 pr-2">技术</th>
                <th className="py-1.5 pr-2">产业</th>
                <th className="py-1.5 pr-2">应用</th>
                <th className="py-1.5 pr-2">成熟度</th>
                <th className="py-1.5 pr-2">论文</th>
                <th className="py-1.5 pr-2">专利</th>
                <th className="py-1.5">企业</th>
              </tr>
            </thead>
            <tbody>
              {THEME_TECH_INDUSTRY.items.map((item) => (
                <tr key={`${item.technology}-${item.industry}`} className="border-b border-gray-50 align-top">
                  <td className="py-2 pr-2 font-medium text-gray-800 whitespace-nowrap">{item.technology}</td>
                  <td className="py-2 pr-2 text-gray-600 whitespace-nowrap">{item.industry}</td>
                  <td className="py-2 pr-2 text-gray-500 max-w-[280px] leading-relaxed">{item.application}</td>
                  <td className="py-2 pr-2">
                    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] ${MATURITY_COLOR[item.maturity] ?? 'bg-gray-50 text-gray-600'}`}>
                      {item.maturity} · {(item.maturityScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-gray-600">{item.paperCount}</td>
                  <td className="py-2 pr-2 text-gray-600">{item.patentCount}</td>
                  <td className="py-2 text-gray-500">{item.companies.length ? item.companies.join('、') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {THEME_TECH_INDUSTRY.items[0]?.evidence && (
          <p className="text-[10px] text-gray-400 leading-relaxed">证据：{THEME_TECH_INDUSTRY.items[0].evidence}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-gray-800">专利-产品映射</span>
        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
          由转化路径 patent→product（产品化）派生 · 暂无独立 analyze 路由
        </span>
      </div>
      <p className="text-[11px] text-gray-500">将企业专利布局与发布产品关联；边类型对齐「产品化 / 转化」。</p>
      <div className="grid gap-2 md:grid-cols-2">
        {THEME_PATENT_PRODUCT.map((row) => (
          <div key={row.id} className="rounded-xl border border-gray-200 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 shrink-0">专利</span>
              <span className="font-medium text-gray-800 truncate" title={row.patent}>{row.patent}</span>
            </div>
            <div className="text-[10px] text-gray-400">→ {row.relation} →</div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 shrink-0">产品</span>
              <span className="text-gray-700 truncate" title={row.product}>{row.product}</span>
            </div>
            <div className="text-[10px] text-gray-400">
              技术 {row.technology} · 企业 {row.company} · 路径「{row.pathName}」
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
