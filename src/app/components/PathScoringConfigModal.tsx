import { useEffect, useMemo, useState } from 'react';
import { Check, GitBranch, Plus, Save, Settings, Trash2, X } from 'lucide-react';

export type ScoringAlgoId = 'length' | 'weightProduct' | 'reliability';

export interface ScoringAlgoConfig {
  id: ScoringAlgoId;
  enabled: boolean;
  /** 组合时的贡献权重 */
  mixWeight: number;
  /** 算法系数（如路径长度衰减 α） */
  coeff: number;
}

export interface PathScoringModel {
  id: string;
  name: string;
  version: string;
  note: string;
  createdAt: string;
  algos: ScoringAlgoConfig[];
  /** 关系类型权重（用于权重积 / 可靠性） */
  relationWeights: Record<string, number>;
}

export const SCORING_ALGO_META: Record<
  ScoringAlgoId,
  { name: string; desc: string; formula: string }
> = {
  length: {
    name: '路径长度',
    desc: '路径越长得分越低，强调短路径直接关联。',
    formula: '1 / (1 + α·len)',
  },
  weightProduct: {
    name: '关系权重乘积',
    desc: '边上关系权重连乘，评估全路径综合可信度。',
    formula: 'Π wᵢ',
  },
  reliability: {
    name: '路径可靠性',
    desc: '边权均值近似来源置信度与稳定性。',
    formula: 'mean(wᵢ) × β',
  },
};

const DEFAULT_REL_WEIGHTS: Record<string, number> = {
  合作: 0.75, 研发: 0.9, 引用: 0.88, 提出: 0.85, 奠基: 0.8, 实现: 0.82,
  改进: 0.78, 推动: 0.7, 包含: 0.6, 演化: 0.88, 验证: 0.75,
};

export function defaultAlgos(): ScoringAlgoConfig[] {
  return [
    { id: 'length', enabled: true, mixWeight: 0.35, coeff: 0.6 },
    { id: 'weightProduct', enabled: true, mixWeight: 0.4, coeff: 1 },
    { id: 'reliability', enabled: true, mixWeight: 0.25, coeff: 1 },
  ];
}

export function createDefaultModels(): PathScoringModel[] {
  return [
    {
      id: 'scientific',
      name: '科研图谱评分',
      version: 'v1.2.0',
      note: '默认组合：长度 + 权重积 + 可靠性',
      createdAt: '2026-03-10',
      algos: defaultAlgos(),
      relationWeights: { ...DEFAULT_REL_WEIGHTS },
    },
    {
      id: 'default',
      name: '默认评分模型',
      version: 'v1.0.0',
      note: '均衡衰减系数',
      createdAt: '2026-02-18',
      algos: [
        { id: 'length', enabled: true, mixWeight: 0.4, coeff: 0.5 },
        { id: 'weightProduct', enabled: true, mixWeight: 0.4, coeff: 1 },
        { id: 'reliability', enabled: true, mixWeight: 0.2, coeff: 1 },
      ],
      relationWeights: {
        合作: 0.8, 研发: 0.85, 引用: 0.7, 提出: 0.8, 奠基: 0.75, 实现: 0.8,
        改进: 0.78, 推动: 0.65, 包含: 0.6, 演化: 0.82, 验证: 0.7,
      },
    },
    {
      id: 'influence',
      name: '影响力传播评分',
      version: 'v1.1.0',
      note: '偏重权重积与可靠性',
      createdAt: '2026-01-05',
      algos: [
        { id: 'length', enabled: true, mixWeight: 0.2, coeff: 0.4 },
        { id: 'weightProduct', enabled: true, mixWeight: 0.45, coeff: 1 },
        { id: 'reliability', enabled: true, mixWeight: 0.35, coeff: 1 },
      ],
      relationWeights: {
        合作: 0.9, 研发: 0.8, 引用: 0.92, 提出: 0.85, 奠基: 0.9, 实现: 0.75,
        改进: 0.8, 推动: 0.88, 包含: 0.65, 演化: 0.92, 验证: 0.78,
      },
    },
  ];
}

export function scorePathWithModel(
  path: { nodeIds: string[]; edgeTypes: string[] },
  model: PathScoringModel,
): {
  length: number;
  score: number;
  subScores: { label: string; value: number }[];
} {
  const len = Math.max(0, path.nodeIds.length - 1);
  const weights = path.edgeTypes.map(t => model.relationWeights[t] ?? 0.6);
  const lengthAlgo = model.algos.find(a => a.id === 'length');
  const wpAlgo = model.algos.find(a => a.id === 'weightProduct');
  const relAlgo = model.algos.find(a => a.id === 'reliability');

  const lenScore = 1 / (1 + (lengthAlgo?.coeff ?? 0.5) * len);
  const wpScore = weights.length ? weights.reduce((a, b) => a * b, 1) : 1;
  const relScore =
    (weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : 0.6) * (relAlgo?.coeff ?? 1);

  const parts: { id: ScoringAlgoId; label: string; value: number; mix: number }[] = [];
  if (lengthAlgo?.enabled) {
    parts.push({ id: 'length', label: '路径长度', value: lenScore, mix: lengthAlgo.mixWeight });
  }
  if (wpAlgo?.enabled) {
    parts.push({ id: 'weightProduct', label: '权重积', value: wpScore, mix: wpAlgo.mixWeight });
  }
  if (relAlgo?.enabled) {
    parts.push({ id: 'reliability', label: '可靠性', value: Math.min(1, relScore), mix: relAlgo.mixWeight });
  }

  const mixSum = parts.reduce((s, p) => s + p.mix, 0) || 1;
  const score = Math.min(
    1,
    parts.reduce((s, p) => s + p.value * (p.mix / mixSum), 0),
  );

  return {
    length: len,
    score,
    subScores: parts.map(p => ({ label: p.label, value: p.value })),
  };
}

function bumpVersion(version: string): string {
  const m = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/i);
  if (!m) return 'v1.0.1';
  return `v${m[1]}.${m[2]}.${Number(m[3]) + 1}`;
}

interface PathScoringConfigModalProps {
  open: boolean;
  models: PathScoringModel[];
  activeModelId: string;
  onClose: () => void;
  onChangeModels: (models: PathScoringModel[]) => void;
  onSelectModel: (id: string) => void;
}

/**
 * 路径评分算法后台：选择/组合算法，并保存为可复用的命名版本模型。
 */
export default function PathScoringConfigModal({
  open,
  models,
  activeModelId,
  onClose,
  onChangeModels,
  onSelectModel,
}: PathScoringConfigModalProps) {
  const [tab, setTab] = useState<'algo' | 'models'>('algo');
  const [draftId, setDraftId] = useState(activeModelId);
  const [saveName, setSaveName] = useState('');
  const [saveVersion, setSaveVersion] = useState('v1.0.0');
  const [saveNote, setSaveNote] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  useEffect(() => {
    if (open) {
      setDraftId(activeModelId);
      setTab('algo');
      setConfirmDeleteId('');
    }
  }, [open, activeModelId]);

  const draft = useMemo(
    () => models.find(m => m.id === draftId) ?? models[0],
    [models, draftId],
  );

  useEffect(() => {
    if (!draft) return;
    setSaveName(draft.name);
    setSaveVersion(bumpVersion(draft.version));
    setSaveNote(draft.note);
  }, [draft?.id]);

  if (!open || !draft) return null;

  const updateDraft = (patch: Partial<PathScoringModel>) => {
    onChangeModels(models.map(m => (m.id === draft.id ? { ...m, ...patch } : m)));
  };

  const updateAlgo = (id: ScoringAlgoId, patch: Partial<ScoringAlgoConfig>) => {
    const algos = draft.algos.map(a => (a.id === id ? { ...a, ...patch } : a));
    // 至少保留一个算法启用
    if (patch.enabled === false && algos.filter(a => a.enabled).length === 0) return;
    updateDraft({ algos });
  };

  const handleSaveAsNew = () => {
    const name = saveName.trim();
    if (!name) return;
    const id = `m_${Date.now()}`;
    const next: PathScoringModel = {
      id,
      name,
      version: saveVersion.trim() || 'v1.0.0',
      note: saveNote.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      algos: draft.algos.map(a => ({ ...a })),
      relationWeights: { ...draft.relationWeights },
    };
    onChangeModels([next, ...models]);
    onSelectModel(id);
    setDraftId(id);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    setTab('models');
  };

  const handleSaveNewVersion = () => {
    const version = saveVersion.trim() || bumpVersion(draft.version);
    updateDraft({
      name: saveName.trim() || draft.name,
      version,
      note: saveNote.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    setTab('models');
  };

  const handleDelete = (id: string) => {
    if (models.length <= 1) return;
    const next = models.filter(m => m.id !== id);
    onChangeModels(next);
    if (activeModelId === id) onSelectModel(next[0].id);
    if (draftId === id) setDraftId(next[0].id);
    setConfirmDeleteId('');
  };

  const enabledLabels = draft.algos
    .filter(a => a.enabled)
    .map(a => SCORING_ALGO_META[a.id].name);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="关闭" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              路径评分算法后台
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              选择或组合评分算法，保存为命名版本模型，供「所有路径」复用
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          {([
            { id: 'algo' as const, label: '算法自定义' },
            { id: 'models' as const, label: '模型保存与管理' },
          ]).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                tab === t.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {tab === 'algo' && (
            <>
              <div>
                <div className="text-xs text-gray-500 mb-1.5">编辑模型</div>
                <select
                  value={draft.id}
                  onChange={e => setDraftId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.version}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-gray-500">
                已启用：{enabledLabels.join(' + ') || '无'}（组合时按贡献权重归一化加权）
              </div>

              <div className="space-y-3">
                {draft.algos.map(algo => {
                  const meta = SCORING_ALGO_META[algo.id];
                  return (
                    <div
                      key={algo.id}
                      className={`border rounded-xl p-4 transition-colors ${
                        algo.enabled ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => updateAlgo(algo.id, { enabled: !algo.enabled })}
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 ${
                            algo.enabled ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                          }`}
                        >
                          {algo.enabled && <Check className="w-3 h-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{meta.name}</div>
                          <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                          <code className="inline-block mt-2 text-[11px] font-mono text-violet-700 bg-white/80 border border-gray-200 rounded px-2 py-0.5">
                            {meta.formula}
                          </code>
                          {algo.enabled && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <label className="block">
                                <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                                  <span>组合权重</span>
                                  <span className="font-mono">{algo.mixWeight.toFixed(2)}</span>
                                </div>
                                <input
                                  type="range"
                                  min={0.05}
                                  max={1}
                                  step={0.05}
                                  value={algo.mixWeight}
                                  onChange={e => updateAlgo(algo.id, { mixWeight: Number(e.target.value) })}
                                  className="w-full accent-blue-600"
                                />
                              </label>
                              <label className="block">
                                <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                                  <span>{algo.id === 'length' ? '衰减 α' : '系数 β'}</span>
                                  <span className="font-mono">{algo.coeff.toFixed(2)}</span>
                                </div>
                                <input
                                  type="range"
                                  min={0.1}
                                  max={1.5}
                                  step={0.05}
                                  value={algo.coeff}
                                  onChange={e => updateAlgo(algo.id, { coeff: Number(e.target.value) })}
                                  className="w-full accent-blue-600"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-blue-600" />
                  保存当前算法组合
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="模型名称"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <input
                    value={saveVersion}
                    onChange={e => setSaveVersion(e.target.value)}
                    placeholder="版本号，如 v1.3.0"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400"
                  />
                </div>
                <input
                  value={saveNote}
                  onChange={e => setSaveNote(e.target.value)}
                  placeholder="备注（可选）"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveNewVersion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {savedFlash ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    更新当前模型版本
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    另存为新模型
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'models' && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">共 {models.length} 个模型 · 点击「应用」后用于所有路径评分</div>
              {models.map(m => {
                const labels = m.algos.filter(a => a.enabled).map(a => SCORING_ALGO_META[a.id].name);
                const isActive = activeModelId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`border rounded-xl p-4 ${isActive ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <GitBranch className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {m.version}
                          </span>
                          {isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              当前使用
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1.5">{m.note || '无备注'}</p>
                        <div className="text-[11px] text-gray-400 flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>{m.createdAt}</span>
                          <span>·</span>
                          <span>{labels.join(' + ') || '未启用算法'}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto">
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-blue-50 border-blue-200 text-blue-700 font-mono flex-shrink-0">
                            {m.version} (当前)
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-400 font-mono flex-shrink-0">
                            历史版本可随保存递增
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectModel(m.id);
                            setDraftId(m.id);
                          }}
                          className={`px-2.5 py-1 text-[11px] rounded-lg ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isActive ? '已应用' : '应用'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftId(m.id);
                            setTab('algo');
                          }}
                          className="px-2.5 py-1 text-[11px] border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                        >
                          编辑
                        </button>
                        {confirmDeleteId === m.id ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(m.id)}
                              className="px-2 py-1 text-[11px] bg-red-600 text-white rounded-lg"
                            >
                              确认
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId('')}
                              className="px-2 py-1 text-[11px] border border-gray-200 rounded-lg"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={models.length <= 1}
                            onClick={() => setConfirmDeleteId(m.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 self-end"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white"
          >
            关闭
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectModel(draft.id);
              onClose();
            }}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            应用并关闭
          </button>
        </div>
      </div>
    </div>
  );
}
