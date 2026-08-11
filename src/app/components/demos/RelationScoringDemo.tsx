import { useState } from 'react';
import {
  Save, Plus, Trash2, ChevronDown, ChevronUp, Copy, CheckCircle,
  Settings, BarChart2, Layers, GitBranch, Star,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RelationWeight {
  type: string;
  weight: number;
  description: string;
  color: string;
}

type AlgorithmId = 'path-length' | 'weight-product' | 'reliability' | 'harmonic';

interface PathAlgorithm {
  id: AlgorithmId;
  name: string;
  description: string;
  formula: string;
  enabled: boolean;
  coeff: number;
}

interface SavedModel {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  relations: number;
  algorithms: string[];
  ndcg: number;
  note: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_RELATIONS: RelationWeight[] = [
  { type: '就职于',     weight: 0.85, description: '人物与机构的就职关系，可信度高', color: '#3b82f6' },
  { type: '研究领域为',  weight: 0.78, description: '人物或机构的研究方向',           color: '#8b5cf6' },
  { type: '位于',       weight: 0.72, description: '实体的地理位置关系',              color: '#10b981' },
  { type: '资助',       weight: 0.90, description: '基金/项目对机构的资助关系',        color: '#f59e0b' },
  { type: '应用于',     weight: 0.65, description: '技术在领域中的应用关系',           color: '#ef4444' },
  { type: '上位概念',   weight: 0.60, description: '本体层级关系',                   color: '#6b7280' },
  { type: '合作方',     weight: 0.70, description: '机构间合作关系',                  color: '#14b8a6' },
  { type: '引用',       weight: 0.55, description: '文献引用关系',                   color: '#f97316' },
];

const SEED_ALGORITHMS: PathAlgorithm[] = [
  {
    id: 'path-length',
    name: '路径长度惩罚',
    description: '路径越长，得分衰减越快。适用于强调直接关联的场景。',
    formula: 'score = 1 / (1 + α·len)',
    enabled: true,
    coeff: 0.5,
  },
  {
    id: 'weight-product',
    name: '关系权重乘积',
    description: '路径上所有边权重的乘积，综合评估全路径可信度。',
    formula: 'score = Π wᵢ',
    enabled: true,
    coeff: 1.0,
  },
  {
    id: 'reliability',
    name: '路径可靠性',
    description: '基于来源置信度和数据新鲜度的综合可靠性评估。',
    formula: 'score = conf × freshness',
    enabled: false,
    coeff: 0.8,
  },
  {
    id: 'harmonic',
    name: '调和平均融合',
    description: '对多个子得分取调和平均，防止单一低分拉低总分。',
    formula: 'score = n / Σ(1/sᵢ)',
    enabled: false,
    coeff: 1.0,
  },
];

const SEED_MODELS: SavedModel[] = [
  {
    id: 'm1',
    name: '科研图谱默认评分',
    version: 'v1.2.0',
    createdAt: '2026-07-15',
    relations: 8,
    algorithms: ['路径长度惩罚', '关系权重乘积'],
    ndcg: 0.874,
    note: '科研知识图谱通用评分配置，已在 3 个分析任务中复用',
  },
  {
    id: 'm2',
    name: '医疗实体关系评分',
    version: 'v1.0.1',
    createdAt: '2026-06-22',
    relations: 6,
    algorithms: ['关系权重乘积', '路径可靠性'],
    ndcg: 0.841,
    note: '针对医疗知识图谱调整，提升药物-疾病关系权重',
  },
];

// ── Preview path simulation ───────────────────────────────────────────────────

const PREVIEW_PATHS = [
  { path: ['李明', '就职于', '北京AI研究院', '位于', '中关村科技园'], score: 0 },
  { path: ['深度学习', '应用于', 'Transformer', '引用', 'BERT论文'], score: 0 },
  { path: ['国家重点研发计划', '资助', '北京AI研究院', '研究领域为', '自然语言处理'], score: 0 },
];

function computeScore(
  path: string[],
  relations: RelationWeight[],
  algorithms: PathAlgorithm[]
): number {
  const edges = (path.length - 1) / 2;
  const relNames = path.filter((_, i) => i % 2 === 1);
  const weights = relNames.map(r => relations.find(x => x.type === r)?.weight ?? 0.5);

  let score = 1.0;

  const plAlgo = algorithms.find(a => a.id === 'path-length' && a.enabled);
  if (plAlgo) {
    score *= 1 / (1 + plAlgo.coeff * edges);
  }

  const wpAlgo = algorithms.find(a => a.id === 'weight-product' && a.enabled);
  if (wpAlgo) {
    const product = weights.reduce((a, b) => a * b, 1);
    score *= Math.pow(product, wpAlgo.coeff);
  }

  const relAlgo = algorithms.find(a => a.id === 'reliability' && a.enabled);
  if (relAlgo) {
    score *= relAlgo.coeff * 0.9;
  }

  return Math.min(1, Math.max(0, score));
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function WeightSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-blue-600"
      />
      <span className="text-xs font-mono w-10 text-right text-gray-700">{value.toFixed(2)}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RelationScoringDemo() {
  // ── Section 1: Relation weights ──────────────────────────────────────────
  const [relations, setRelations] = useState<RelationWeight[]>(SEED_RELATIONS);
  const [newRelType, setNewRelType] = useState('');
  const [newRelDesc, setNewRelDesc] = useState('');
  const [expandedSection, setExpandedSection] = useState<1 | 2 | 3>(1);

  const updateWeight = (idx: number, weight: number) =>
    setRelations(prev => prev.map((r, i) => i === idx ? { ...r, weight } : r));
  const removeRelation = (idx: number) =>
    setRelations(prev => prev.filter((_, i) => i !== idx));
  const addRelation = () => {
    if (!newRelType.trim()) return;
    const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#14b8a6','#f97316'];
    setRelations(prev => [...prev, {
      type: newRelType.trim(),
      weight: 0.70,
      description: newRelDesc.trim() || '自定义关系类型',
      color: colors[prev.length % colors.length],
    }]);
    setNewRelType('');
    setNewRelDesc('');
  };

  // ── Section 2: Path algorithms ───────────────────────────────────────────
  const [algorithms, setAlgorithms] = useState<PathAlgorithm[]>(SEED_ALGORITHMS);

  const toggleAlgo = (id: AlgorithmId) =>
    setAlgorithms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const updateCoeff = (id: AlgorithmId, coeff: number) =>
    setAlgorithms(prev => prev.map(a => a.id === id ? { ...a, coeff } : a));

  // preview scores
  const previewPaths = PREVIEW_PATHS.map(p => ({
    ...p,
    score: computeScore(p.path, relations, algorithms),
  }));

  // ── Section 3: Model save & manage ──────────────────────────────────────
  const [models, setModels] = useState<SavedModel[]>(SEED_MODELS);
  const [modelName, setModelName] = useState('');
  const [modelNote, setModelNote] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [copiedId, setCopiedId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  const enabledAlgoNames = algorithms.filter(a => a.enabled).map(a => a.name);

  const saveModel = () => {
    if (!modelName.trim()) return;
    const existingVersion = models.filter(m => m.name === modelName.trim()).length;
    const newModel: SavedModel = {
      id: `m_${Date.now()}`,
      name: modelName.trim(),
      version: `v1.${existingVersion}.0`,
      createdAt: new Date().toISOString().slice(0, 10),
      relations: relations.length,
      algorithms: enabledAlgoNames,
      ndcg: parseFloat((0.82 + Math.random() * 0.08).toFixed(3)),
      note: modelNote.trim() || '用户自定义评分模型',
    };
    setModels(prev => [newModel, ...prev]);
    setModelName('');
    setModelNote('');
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const deleteModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
    setConfirmDeleteId('');
  };

  const copyId = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1500);
  };

  // Section toggle helper
  const Section = ({
    idx, icon, title, subtitle, children,
  }: {
    idx: 1 | 2 | 3;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setExpandedSection(expandedSection === idx ? idx : idx)}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {expandedSection === idx
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expandedSection === idx && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900">关系评分模型构建</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          配置关系权重与路径评分算法，构建可复用的量化评分模型
        </p>
      </div>

      {/* ── Section 1: Relation type weights ── */}
      <Section idx={1} icon={<Layers className="w-4 h-4" />} title="① 关系类型权重配置" subtitle={`已配置 ${relations.length} 种关系类型`}>
        <div className="space-y-3">
          {relations.map((rel, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: rel.color }} />
                <span className="text-sm font-semibold text-gray-900 flex-1">{rel.type}</span>
                <span className="text-xs text-gray-400">{rel.description}</span>
                <button
                  onClick={() => removeRelation(i)}
                  className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-8">权重</span>
                <WeightSlider value={rel.weight} onChange={v => updateWeight(i, v)} />
                <div
                  className="h-2 rounded-full flex-shrink-0"
                  style={{ width: 48, background: `linear-gradient(to right, ${rel.color}44, ${rel.color})`, opacity: rel.weight }}
                />
              </div>
            </div>
          ))}

          {/* Add new relation */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 mb-2">添加自定义关系类型</p>
            <div className="flex gap-2">
              <input
                value={newRelType}
                onChange={e => setNewRelType(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addRelation()}
                placeholder="关系类型名称（如：负责人）"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
              <input
                value={newRelDesc}
                onChange={e => setNewRelDesc(e.target.value)}
                placeholder="描述（可选）"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={addRelation}
                disabled={!newRelType.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />添加
              </button>
            </div>
          </div>

          {/* Weight bar visualization */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">权重分布一览</p>
            <div className="space-y-1.5">
              {[...relations].sort((a, b) => b.weight - a.weight).map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20 text-right truncate">{r.type}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${r.weight * 100}%`, background: r.color }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 w-8">{r.weight.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Path scoring algorithms ── */}
      <Section idx={2} icon={<GitBranch className="w-4 h-4" />} title="② 路径评分算法自定义" subtitle={`已启用 ${algorithms.filter(a => a.enabled).length} / ${algorithms.length} 个算法`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {algorithms.map(algo => (
              <div
                key={algo.id}
                className={`border rounded-xl p-4 transition-colors ${algo.enabled ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={() => toggleAlgo(algo.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${algo.enabled ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}
                  >
                    {algo.enabled && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{algo.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{algo.description}</p>
                  </div>
                </div>
                <div className="bg-white/80 border border-gray-200 rounded-lg px-3 py-1.5 mb-3">
                  <code className="text-xs text-purple-700 font-mono">{algo.formula}</code>
                </div>
                {algo.enabled && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">系数 α</span>
                      <span className="text-xs font-mono text-gray-700">{algo.coeff.toFixed(2)}</span>
                    </div>
                    <WeightSlider value={algo.coeff} onChange={v => updateCoeff(algo.id, v)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Path score preview */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">路径得分预览</span>
              <span className="text-xs text-gray-400 ml-1">（实时计算）</span>
            </div>
            <div className="divide-y divide-gray-100">
              {previewPaths.map((pp, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {pp.path.map((node, j) => (
                      j % 2 === 0 ? (
                        <span key={j} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">{node}</span>
                      ) : (
                        <span key={j} className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          —[{node}]→
                        </span>
                      )
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pp.score * 100}%`,
                          background: pp.score > 0.6 ? '#10b981' : pp.score > 0.35 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold w-10 text-right" style={{ color: pp.score > 0.6 ? '#059669' : pp.score > 0.35 ? '#d97706' : '#dc2626' }}>
                      {pp.score.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Save & manage ── */}
      <Section idx={3} icon={<Star className="w-4 h-4" />} title="③ 模型保存与管理" subtitle={`已保存 ${models.length} 个评分模型`}>
        <div className="space-y-5">
          {/* Save form */}
          <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-700">保存当前配置为新模型</p>
            <div className="flex gap-2">
              <input
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                placeholder="模型名称（如：科研图谱评分 v2）"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <input
              value={modelNote}
              onChange={e => setModelNote(e.target.value)}
              placeholder="备注说明（可选）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>关系类型：{relations.length} 种 &nbsp;·&nbsp; 启用算法：{enabledAlgoNames.join('、') || '无'}</p>
              </div>
              <button
                onClick={saveModel}
                disabled={!modelName.trim() || savedFlash}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
              >
                {savedFlash ? <><CheckCircle className="w-4 h-4" />已保存</> : <><Save className="w-4 h-4" />保存模型</>}
              </button>
            </div>
          </div>

          {/* Model list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">已保存的模型</span>
              <span className="text-xs text-gray-400">{models.length} 个</span>
            </div>
            <div className="divide-y divide-gray-100">
              {models.map(m => (
                <div key={m.id} className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{m.version}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">NDCG@10: {m.ndcg}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{m.note}</p>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
                        <span>{m.createdAt}</span>
                        <span>·</span>
                        <span>{m.relations} 种关系</span>
                        <span>·</span>
                        <span>{m.algorithms.join(' + ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => copyId(m.id)}
                        title="复制模型 ID"
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {copiedId === m.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {confirmDeleteId === m.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteModel(m.id)}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId('')}
                            className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded-lg"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(m.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Version history (mock) */}
                  <div className="mt-3 ml-12 flex items-center gap-2 overflow-x-auto">
                    {[m.version, `v${parseInt(m.version.slice(1)) > 0 ? `${parseInt(m.version.slice(1)) - 0}.${parseInt(m.version.split('.')[1]) > 0 ? parseInt(m.version.split('.')[1]) - 1 : 0}.0` : '—'}`]
                      .filter(v => v !== '—')
                      .map((v, vi) => (
                        <span
                          key={vi}
                          className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded border font-mono transition-colors ${vi === 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                        >
                          {v} {vi === 0 ? '(当前)' : ''}
                        </span>
                      ))}
                    <span className="text-[10px] text-gray-300 flex-shrink-0">历史版本可回溯</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
