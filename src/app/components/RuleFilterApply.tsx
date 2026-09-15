import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  BarChart3,
  BookMarked,
  CheckCircle2,
  Filter,
  Library,
  Loader2,
  Search,
  Tag,
} from 'lucide-react';
import type { RuleFilterApplyFocus } from '../data/auditPageMap';
import {
  ruleFilterApplyApi,
  type EvaluatedRule,
  type LibraryRule,
} from '../api/ruleFilterApplyApi';

type Tab = RuleFilterApplyFocus;

const TABS: { id: Tab; label: string; desc: string; icon: typeof BarChart3 }[] = [
  {
    id: 'metrics',
    label: '规则评估指标展示',
    desc: '支持度 · 置信度 · 提升度等多指标筛选',
    icon: BarChart3,
  },
  {
    id: 'library',
    label: '规则库管理',
    desc: '入库 · 分类 · 搜索 · 版本',
    icon: Library,
  },
];

function fmt(n: number, digits = 3) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}

function ruleText(r: Pick<EvaluatedRule, 'antecedent' | 'consequent' | 'antecedent_display' | 'consequent_display'>) {
  const left = r.antecedent_display || `{${r.antecedent.join(', ')}}`;
  const right = r.consequent_display || `{${r.consequent.join(', ')}}`;
  return `${left} ⇒ ${right}`;
}

export default function RuleFilterApply({
  initialFocus = 'metrics',
}: {
  initialFocus?: RuleFilterApplyFocus | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialFocus ?? 'metrics');
  const [rules, setRules] = useState<EvaluatedRule[]>([]);
  const [library, setLibrary] = useState<LibraryRule[]>([]);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [minSupport, setMinSupport] = useState(0.05);
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [minLift, setMinLift] = useState(1.5);
  const [metricsQuery, setMetricsQuery] = useState('');

  const [libCategory, setLibCategory] = useState('全部');
  const [libStatus, setLibStatus] = useState('全部');
  const [libQuery, setLibQuery] = useState('');
  const [selectedLibId, setSelectedLibId] = useState<string | null>(null);
  const [saveCategory, setSaveCategory] = useState('推荐');

  const categories = useMemo(() => ['全部', ...ruleFilterApplyApi.listCategories()], [library]);

  useEffect(() => {
    if (initialFocus) setActiveTab(initialFocus);
  }, [initialFocus]);

  const refreshLibrary = () => {
    setLibrary(
      ruleFilterApplyApi.listLibrary({
        category: libCategory,
        status: libStatus,
        q: libQuery,
      }),
    );
  };

  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ruleFilterApplyApi.listEvaluatedRules({
        min_support: minSupport,
        min_confidence: minConfidence,
        min_lift: minLift,
        q: metricsQuery,
      });
      setRules(res.rules);
      setSource(res.source);
      setMsg(`已加载 ${res.rules.length} 条规则（${res.source === 'api' ? '网关' : '本地演示'}）`);
      window.setTimeout(() => setMsg(''), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [libCategory, libStatus, libQuery]);

  const tabMeta = TABS.find((t) => t.id === activeTab)!;
  const selectedLib = library.find((r) => r.library_id === selectedLibId) || null;

  const saveRule = async (rule: EvaluatedRule) => {
    setError('');
    try {
      const res = await ruleFilterApplyApi.saveToLibrary(rule, {
        category: saveCategory || rule.category_hint || '通用',
        note: '从评估列表入库',
      });
      refreshLibrary();
      setMsg(`已保存到规则库 ${res.rule.library_id} · v${res.rule.version}`);
      setActiveTab('library');
      setSelectedLibId(res.rule.library_id);
      window.setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '入库失败');
    }
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden p-8">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">规则筛选与应用</div>
          <h1 className="text-xl font-semibold text-gray-900">{tabMeta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">{tabMeta.desc}</p>
          <p className="text-[11px] text-gray-400 mt-1 font-mono truncate">
            API {ruleFilterApplyApi.base} · 数据源 {source === 'api' ? '网关' : '本地演示/规则库'}
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-2 flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
              activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <div>
              <div className="text-sm font-medium">{tab.label}</div>
              <div className="text-[11px] text-gray-400">{tab.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {msg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {msg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'metrics' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-500">
                为挖掘出的规则计算并展示支持度、置信度、提升度、确信度、杠杆率等评估指标，支持阈值筛选后入库。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <label className="text-xs text-gray-600 flex flex-col gap-1">
                  最小支持度 ≥ {minSupport.toFixed(2)}
                  <input
                    type="range"
                    min={0.01}
                    max={0.3}
                    step={0.01}
                    value={minSupport}
                    onChange={(e) => setMinSupport(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs text-gray-600 flex flex-col gap-1">
                  最小置信度 ≥ {minConfidence.toFixed(2)}
                  <input
                    type="range"
                    min={0.3}
                    max={0.95}
                    step={0.01}
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs text-gray-600 flex flex-col gap-1">
                  最小提升度 ≥ {minLift.toFixed(1)}
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.1}
                    value={minLift}
                    onChange={(e) => setMinLift(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs text-gray-600 flex flex-col gap-1 md:col-span-1">
                  关键词
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                    <input
                      className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm"
                      value={metricsQuery}
                      placeholder="实体 / 关系"
                      onChange={(e) => setMetricsQuery(e.target.value)}
                    />
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => void loadMetrics()}
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                  筛选规则
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>入库默认分类</span>
                <select
                  className="border border-gray-200 rounded-lg px-2 py-1"
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value)}
                >
                  {ruleFilterApplyApi.listCategories().map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">规则</th>
                      <th className="text-right px-3 py-2 font-medium">支持度</th>
                      <th className="text-right px-3 py-2 font-medium">置信度</th>
                      <th className="text-right px-3 py-2 font-medium">提升度</th>
                      <th className="text-right px-3 py-2 font-medium">确信度</th>
                      <th className="text-right px-3 py-2 font-medium">杠杆率</th>
                      <th className="text-right px-3 py-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!rules.length ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                          {loading ? '加载中…' : '无符合条件的规则'}
                        </td>
                      </tr>
                    ) : (
                      rules.map((r) => (
                        <tr key={r.rule_id} className="border-t border-gray-50 hover:bg-gray-50/60">
                          <td className="px-3 py-3">
                            <div className="font-mono text-xs text-gray-800">{ruleText(r)}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {r.rule_id}
                              {r.category_hint ? ` · 建议分类 ${r.category_hint}` : ''}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">{fmt(r.support)}</td>
                          <td className="px-3 py-3 text-right tabular-nums font-medium text-blue-700">
                            {fmt(r.confidence)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">{fmt(r.lift, 2)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-500">
                            {r.conviction != null ? fmt(r.conviction, 2) : '—'}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-500">
                            {r.leverage != null ? fmt(r.leverage) : '—'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => void saveRule(r)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <BookMarked className="w-3.5 h-3.5" />
                              入库
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs text-gray-500">
                将有价值的规则保存到规则库，支持分类、搜索与版本管理；可供推荐 / 预警系统通过应用接口调用。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="text-xs text-gray-600 flex flex-col gap-1">
                  分类
                  <select
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    value={libCategory}
                    onChange={(e) => setLibCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-gray-600 flex flex-col gap-1">
                  状态
                  <select
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    value={libStatus}
                    onChange={(e) => setLibStatus(e.target.value)}
                  >
                    {['全部', 'active', 'draft', 'archived'].map((s) => (
                      <option key={s} value={s}>
                        {s === '全部' ? '全部' : s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-gray-600 flex flex-col gap-1 md:col-span-2">
                  搜索
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                    <input
                      className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm"
                      value={libQuery}
                      placeholder="规则内容 / 标签 / ID"
                      onChange={(e) => setLibQuery(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[320px]">
                <div className="lg:col-span-3 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                    规则库（{library.length}）
                  </div>
                  {!library.length ? (
                    <div className="py-16 text-center text-sm text-gray-400">
                      暂无入库规则，请先在「规则评估指标展示」中筛选并入库
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                      {library.map((r) => (
                        <li key={r.library_id}>
                          <button
                            type="button"
                            onClick={() => setSelectedLibId(r.library_id)}
                            className={`w-full text-left px-3 py-3 hover:bg-blue-50/40 ${
                              selectedLibId === r.library_id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-mono text-xs text-gray-800">{ruleText(r)}</div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 flex-shrink-0">
                                v{r.version}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-gray-400">
                              <span className="inline-flex items-center gap-0.5">
                                <Tag className="w-3 h-3" />
                                {r.category}
                              </span>
                              <span>{r.status}</span>
                              <span>{r.library_id}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="lg:col-span-2 border border-gray-100 rounded-xl p-4">
                  {!selectedLib ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      选择左侧规则查看版本与管理操作
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">规则详情</div>
                        <div className="font-mono text-sm text-gray-900">{ruleText(selectedLib)}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          ['支持度', fmt(selectedLib.support)],
                          ['置信度', fmt(selectedLib.confidence)],
                          ['提升度', fmt(selectedLib.lift, 2)],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-gray-50 px-2 py-2">
                            <div className="text-[10px] text-gray-400">{k}</div>
                            <div className="text-sm font-semibold text-gray-800">{v}</div>
                          </div>
                        ))}
                      </div>
                      <label className="text-xs text-gray-600 flex flex-col gap-1">
                        分类
                        <select
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                          value={selectedLib.category}
                          onChange={(e) => {
                            ruleFilterApplyApi.updateLibraryMeta(selectedLib.library_id, {
                              category: e.target.value,
                            });
                            refreshLibrary();
                          }}
                        >
                          {ruleFilterApplyApi.listCategories().map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                          onClick={() => {
                            const note = window.prompt('版本说明', `手工发布 v${selectedLib.version + 1}`);
                            if (note == null) return;
                            ruleFilterApplyApi.bumpVersion(selectedLib.library_id, note);
                            refreshLibrary();
                            setMsg('已创建新版本');
                            window.setTimeout(() => setMsg(''), 2000);
                          }}
                        >
                          发布新版本
                        </button>
                        <button
                          type="button"
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-1"
                          onClick={() => {
                            ruleFilterApplyApi.updateLibraryMeta(selectedLib.library_id, {
                              status: selectedLib.status === 'archived' ? 'active' : 'archived',
                            });
                            refreshLibrary();
                          }}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          {selectedLib.status === 'archived' ? '恢复启用' : '归档'}
                        </button>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1.5">版本历史</div>
                        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                          {selectedLib.versions.map((v) => (
                            <li
                              key={`${selectedLib.library_id}-v${v.version}`}
                              className="text-xs border border-gray-100 rounded-lg px-2.5 py-2"
                            >
                              <div className="font-medium text-gray-700">v{v.version}</div>
                              <div className="text-gray-500">{v.note}</div>
                              <div className="text-gray-400 mt-0.5">{v.saved_at}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
