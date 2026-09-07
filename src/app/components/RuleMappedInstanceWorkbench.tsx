import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Play, Plus, Trash2, Zap } from 'lucide-react';

export type RuleMappedInstanceFocus = 'engine' | 'preview';

/** 与 auditCatalog 功能点 name 严格一致 */
const FOCUS_META: Record<
  RuleMappedInstanceFocus,
  { label: string; desc: string }
> = {
  engine: {
    label: '规则引擎执行',
    desc: '提供一个高效的规则匹配引擎，在海量语料上快速执行已定义的规则。',
  },
  preview: {
    label: '实例生成预览',
    desc: '在规则执行后，提供一个预览界面，展示所有通过规则发现的候选实例。',
  },
};

interface RuleDef {
  id: string;
  name: string;
  pattern: string;
  concept: string;
  enabled: boolean;
}

interface CandidateInstance {
  id: string;
  mention: string;
  concept: string;
  ruleId: string;
  ruleName: string;
  pattern: string;
  evidence: string;
  offset: number;
  confidence: number;
}

const DEFAULT_TEXT = `华为公司宣布推出新一代芯片架构，并将在深圳设立研发中心。
字节跳动总部位于北京，旗下产品覆盖全球市场。
李明就职于清华大学计算机系，研究方向为知识图谱。
腾讯公司宣布开源内部图数据库项目，并与复旦大学开展合作。
该公司宣布完成新一轮融资，估值达到百亿美元。
OpenAI总部位于旧金山，致力于通用人工智能研究。`;

const DEFAULT_RULES: RuleDef[] = [
  {
    id: 'r1',
    name: '公司宣布模式',
    pattern: '[INSTANCE]公司宣布',
    concept: '组织机构',
    enabled: true,
  },
  {
    id: 'r2',
    name: '总部所在地',
    pattern: '[INSTANCE]总部位于',
    concept: '组织机构',
    enabled: true,
  },
  {
    id: 'r3',
    name: '人物就职',
    pattern: '[INSTANCE]就职于',
    concept: '人物',
    enabled: true,
  },
];

function patternToRegex(pattern: string): RegExp | null {
  const idx = pattern.indexOf('[INSTANCE]');
  if (idx < 0) return null;
  const before = pattern.slice(0, idx);
  const after = pattern.slice(idx + '[INSTANCE]'.length);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 槽位：优先短实体（2–12 字），避免吞并后续上下文
  const body = `${esc(before)}([\\u4e00-\\u9fa5A-Za-z0-9·]{1,12})${esc(after)}`;
  try {
    return new RegExp(body, 'g');
  } catch {
    return null;
  }
}

function runEngine(text: string, rules: RuleDef[]): {
  candidates: CandidateInstance[];
  stats: { ruleCount: number; matchCount: number; elapsedMs: number; chars: number };
} {
  const t0 = performance.now();
  const enabled = rules.filter((r) => r.enabled && r.pattern.includes('[INSTANCE]'));
  const candidates: CandidateInstance[] = [];
  let seq = 1;

  for (const rule of enabled) {
    const re = patternToRegex(rule.pattern);
    if (!re) continue;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const mention = (m[1] ?? '').trim();
      if (!mention || mention === '该' || mention === '本') continue;
      const start = m.index;
      const end = start + m[0].length;
      const evidence = text.slice(Math.max(0, start - 4), Math.min(text.length, end + 8)).replace(/\n/g, ' ');
      candidates.push({
        id: `cand_${seq++}`,
        mention,
        concept: rule.concept,
        ruleId: rule.id,
        ruleName: rule.name,
        pattern: rule.pattern,
        evidence,
        offset: start,
        confidence: Number((0.72 + Math.min(0.2, mention.length * 0.02) + (rule.concept === '人物' ? 0.05 : 0)).toFixed(2)),
      });
    }
  }

  return {
    candidates,
    stats: {
      ruleCount: enabled.length,
      matchCount: candidates.length,
      elapsedMs: Math.max(1, Math.round(performance.now() - t0)),
      chars: text.length,
    },
  };
}

/**
 * 审计目录专用：概念实例生成 · 基于规则映射
 * 输入文本 + 配置规则 → 引擎执行 → 实例预览
 */
export default function RuleMappedInstanceWorkbench({
  initialFocus = 'engine',
}: {
  initialFocus?: RuleMappedInstanceFocus | null;
}) {
  const [focus, setFocus] = useState<RuleMappedInstanceFocus>(initialFocus ?? 'engine');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [rules, setRules] = useState<RuleDef[]>(DEFAULT_RULES);
  const [running, setRunning] = useState(false);
  const [candidates, setCandidates] = useState<CandidateInstance[] | null>(null);
  const [stats, setStats] = useState<{
    ruleCount: number;
    matchCount: number;
    elapsedMs: number;
    chars: number;
  } | null>(null);

  useEffect(() => {
    if (initialFocus) setFocus(initialFocus);
  }, [initialFocus]);

  const meta = FOCUS_META[focus];

  const enabledCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules]);

  const updateRule = (id: string, patch: Partial<RuleDef>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRule = () => {
    const id = `r${Date.now().toString(36)}`;
    setRules((prev) => [
      ...prev,
      {
        id,
        name: `规则 ${prev.length + 1}`,
        pattern: '[INSTANCE]',
        concept: '实体',
        enabled: true,
      },
    ]);
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const execute = () => {
    setRunning(true);
    window.setTimeout(() => {
      const result = runEngine(text, rules);
      setCandidates(result.candidates);
      setStats(result.stats);
      setRunning(false);
      if (focus === 'engine') {
        // 执行后便于查看结果
      }
    }, 320);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">概念实例生成 · 基于规则映射的方法</div>
          <h1 className="text-xl font-semibold text-gray-900">{meta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">{meta.desc}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0 w-fit">
        {(Object.keys(FOCUS_META) as RuleMappedInstanceFocus[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFocus(id)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
              focus === id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {FOCUS_META[id].label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-6xl">
          {/* 输入：语料 + 规则 */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">输入语料</h2>
                <span className="text-[11px] text-gray-400">{text.length} 字</span>
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400 min-h-[160px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="粘贴待匹配文本…"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  配置规则
                  <span className="ml-2 text-[11px] font-normal text-gray-400">
                    已启用 {enabledCount}/{rules.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={addRule}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:border-teal-300 text-gray-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加规则
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                模式中用 <code className="px-1 bg-slate-50 rounded">[INSTANCE]</code> 标记实例槽位，例如{' '}
                <code className="px-1 bg-slate-50 rounded">[INSTANCE]公司宣布</code>
              </p>

              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`border rounded-lg p-3 space-y-2 ${
                      rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                      />
                      <input
                        className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                        value={rule.name}
                        onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="sm:col-span-2 block space-y-0.5">
                        <span className="text-[10px] text-gray-400">pattern</span>
                        <input
                          className="w-full text-xs font-mono border border-gray-200 rounded px-2 py-1.5"
                          value={rule.pattern}
                          onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                        />
                      </label>
                      <label className="block space-y-0.5">
                        <span className="text-[10px] text-gray-400">目标概念</span>
                        <input
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
                          value={rule.concept}
                          onChange={(e) => updateRule(rule.id, { concept: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={execute}
                disabled={running || enabledCount === 0 || !text.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
              >
                {focus === 'engine' ? <Zap className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {running ? '执行中…' : focus === 'engine' ? '执行规则引擎' : '执行并预览实例'}
              </button>
            </div>
          </div>

          {/* 输出 */}
          <div className="space-y-4">
            {focus === 'engine' && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">引擎执行结果</h2>
                {!stats && (
                  <p className="text-sm text-gray-400 text-center py-10">配置规则后点击执行，查看匹配吞吐与命中概况</p>
                )}
                {stats && (
                  <>
                    <div className="flex items-start gap-2 mb-4 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-green-800">规则匹配完成</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          扫描 {stats.chars} 字 · {stats.ruleCount} 条规则 · 命中 {stats.matchCount} 处 · 耗时{' '}
                          {stats.elapsedMs} ms
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: '语料规模', value: `${stats.chars}` },
                        { label: '启用规则', value: String(stats.ruleCount) },
                        { label: '命中数', value: String(stats.matchCount) },
                        {
                          label: '吞吐(估)',
                          value: `${Math.max(1, Math.round(stats.chars / Math.max(stats.elapsedMs, 1)))} 字/ms`,
                        },
                      ].map((c) => (
                        <div key={c.label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide">{c.label}</div>
                          <div className="text-sm font-medium text-gray-900 mt-0.5">{c.value}</div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFocus('preview')}
                      className="mt-4 text-xs text-teal-700 hover:underline"
                    >
                      查看实例生成预览 →
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {FOCUS_META.preview.label}
                  {candidates && (
                    <span className="ml-2 text-[11px] font-normal text-gray-400">{candidates.length} 条候选</span>
                  )}
                </h2>
              </div>

              {!candidates && (
                <p className="text-sm text-gray-400 text-center py-12">执行规则后，在此预览候选实例</p>
              )}

              {candidates && candidates.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-12">未匹配到实例，请调整规则模式或语料</p>
              )}

              {candidates && candidates.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-100 bg-slate-50/80">
                        <th className="py-2.5 px-3 font-medium">实例</th>
                        <th className="py-2.5 px-3 font-medium">概念</th>
                        <th className="py-2.5 px-3 font-medium">规则</th>
                        <th className="py-2.5 px-3 font-medium">证据</th>
                        <th className="py-2.5 px-3 font-medium">置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c) => (
                        <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-gray-900">{c.mention}</td>
                          <td className="py-2.5 px-3 text-gray-600">{c.concept}</td>
                          <td className="py-2.5 px-3 text-gray-600">
                            <div>{c.ruleName}</div>
                            <code className="text-[10px] text-teal-700">{c.pattern}</code>
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 max-w-[200px] truncate" title={c.evidence}>
                            {c.evidence}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">{c.confidence.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
