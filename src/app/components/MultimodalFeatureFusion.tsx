import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Database, Layers, Play, Plus, Sparkles, Trash2, Zap } from 'lucide-react';
import type { MultimodalFeatureFusionFocus } from '../data/auditPageMap';

const TABS: Array<{ id: MultimodalFeatureFusionFocus; label: string; desc: string }> = [
  {
    id: 'coattn',
    label: '协同注意力融合机制',
    desc: '提供基于 Co-Attention 的模型，允许不同模态特征相互引导注意力，学习细粒度交互。',
  },
  {
    id: 'gate',
    label: '门控与双线性融合',
    desc: '提供门控机制或双线性池化，控制模态贡献度并捕捉相乘关系。',
  },
  {
    id: 'train',
    label: '融合模型训练与管理',
    desc: '提交图文匹配数据集、训练 BAN / MFB+GMU，并用同一 checkpoint 推理。',
  },
];

const MODELS = [
  {
    id: 'ban',
    tab: 'coattn' as const,
    name: 'BAN',
    family: '协同注意力',
    formula: 'A = softmax(X W Yᵀ)',
    desc: 'Bilinear Attention Networks：图文协同注意力 + 双线性交互',
  },
  {
    id: 'mfb_gmu',
    tab: 'gate' as const,
    name: 'MFB + GMU',
    family: '门控双线性',
    formula: 'MFB + GMU gate',
    desc: '因子分解双线性池化 + 门控多模态单元',
  },
];

type DataSource = 'demo' | 'inline' | 'registered';

type Pair = { id: string; text: string; image_hint: string; label: 0 | 1 };

const DEMO_PAIRS: Pair[] = [
  {
    id: 'p1',
    text: '多模态融合结合文本与视觉信息',
    image_hint: 'multimodal fusion text vision',
    label: 1,
  },
  {
    id: 'n1',
    text: '多模态融合结合文本与视觉信息',
    image_hint: 'unrelated noise',
    label: 0,
  },
  {
    id: 'p2',
    text: '知识图谱将实体与关系结构化表示',
    image_hint: 'knowledge graph structure',
    label: 1,
  },
  {
    id: 'n2',
    text: '知识图谱将实体与关系结构化表示',
    image_hint: 'random caption',
    label: 0,
  },
];

export default function MultimodalFeatureFusion({
  initialFocus = 'coattn',
}: {
  initialFocus?: MultimodalFeatureFusionFocus | null;
}) {
  const [tab, setTab] = useState<MultimodalFeatureFusionFocus>(initialFocus ?? 'coattn');
  const [modelId, setModelId] = useState(initialFocus === 'gate' ? 'mfb_gmu' : 'ban');
  const [dataSource, setDataSource] = useState<DataSource>('inline');
  const [pairs, setPairs] = useState<Pair[]>(() => DEMO_PAIRS.map(p => ({ ...p })));
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [epochs, setEpochs] = useState(16);
  const [dim, setDim] = useState(32);
  const [training, setTraining] = useState(false);
  const [ckpt, setCkpt] = useState<string | null>(null);
  const [text, setText] = useState('多模态融合结合文本与视觉信息');
  const [hint, setHint] = useState('multimodal fusion text vision');
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (initialFocus) {
      setTab(initialFocus);
      if (initialFocus === 'coattn') setModelId('ban');
      if (initialFocus === 'gate') setModelId('mfb_gmu');
    }
  }, [initialFocus]);

  const model = MODELS.find(item => item.id === modelId) ?? MODELS[0];
  const stats = useMemo(() => {
    const pos = pairs.filter(p => p.label === 1).length;
    return { total: pairs.length, pos, neg: pairs.length - pos };
  }, [pairs]);

  const handleRegister = () => {
    if (!stats.pos || !stats.neg) return;
    setDatasetId(`ds_${Date.now().toString(36).slice(-6)}`);
    setDataSource('registered');
  };

  const handleTrain = () => {
    if (dataSource === 'inline' && (!stats.pos || !stats.neg)) return;
    if (dataSource === 'registered' && !datasetId) return;
    setTraining(true);
    window.setTimeout(() => {
      setCkpt(`mm_${modelId}_${Date.now().toString(36).slice(-5)}`);
      setScore(null);
      setTraining(false);
    }, 800);
  };

  const handleInfer = () => {
    if (!ckpt) return;
    const overlap = [...text].filter(ch => hint.includes(ch)).length;
    setScore(Number(Math.min(0.97, 0.55 + overlap * 0.01 + (modelId === 'ban' ? 0.08 : 0.05)).toFixed(3)));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">数据的统一建模与表示融合 · 多模态特征融合</div>
          <h1 className="text-xl font-semibold text-gray-900">多模态特征融合</h1>
          <p className="text-sm text-gray-500 mt-1">
            BAN / MFB+GMU 可训练融合；支持内联 pairs、先注册 dataset，或不传走内置 demo。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3 py-2 rounded-lg text-left border ${
                tab === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">{item.label}</div>
              <div className="text-[11px] text-gray-500 max-w-[220px]">{item.desc}</div>
            </button>
          ))}
        </div>

        {(tab === 'coattn' || tab === 'gate') && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              {tab === 'coattn' ? '协同注意力融合机制' : '门控与双线性融合'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODELS.filter(item => item.tab === tab).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModelId(item.id)}
                  className={`text-left rounded-lg border px-3 py-3 ${
                    modelId === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-[11px] text-gray-400">{item.family}</div>
                  <code className="text-[10px] text-gray-500">{item.formula}</code>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
              onClick={() => setTab('train')}
            >
              下一步：训练与管理
            </button>
          </section>
        )}

        {tab === 'train' && (
          <section className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">1. 选择融合模型</h2>
              <p className="text-xs text-gray-500">
                当前 {model.name} · {dim}d · {epochs} epoch
                {dataSource === 'demo'
                  ? ' · 内置 demo'
                  : dataSource === 'inline'
                    ? ` · 内联 ${stats.total} pairs`
                    : ` · ${datasetId || '未选 dataset'}`}
                {ckpt ? ` · ${ckpt}` : ' · 尚未训练'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MODELS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setModelId(item.id);
                      setCkpt(null);
                      setScore(null);
                    }}
                    className={`text-left rounded-lg border px-3 py-2 ${
                      modelId === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-[11px] text-gray-400">{item.family}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" /> 2. 训练数据
              </h2>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['demo', '内置 demo'],
                    ['inline', '训练时内联'],
                    ['registered', '先注册再训'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDataSource(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs border ${
                      dataSource === key ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {dataSource === 'demo' ? (
                <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  训练请求不携带数据集，使用服务端内置 demo 样本。
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">
                      text_image_match · 正 {stats.pos} / 负 {stats.neg}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 border rounded-lg"
                        onClick={() => setPairs(DEMO_PAIRS.map(p => ({ ...p })))}
                      >
                        重置演示
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded-lg"
                        onClick={() =>
                          setPairs(prev => [
                            ...prev,
                            {
                              id: `pair_${Date.now().toString(36).slice(-4)}`,
                              text: '',
                              image_hint: '',
                              label: 1,
                            },
                          ])
                        }
                      >
                        <Plus className="w-3 h-3" /> 添加
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pairs.map((pair, index) => (
                      <div key={pair.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            className="text-xs border rounded px-2 py-1"
                            value={pair.label}
                            onChange={e =>
                              setPairs(prev =>
                                prev.map((item, i) =>
                                  i === index ? { ...item, label: Number(e.target.value) as 0 | 1 } : item
                                )
                              )
                            }
                          >
                            <option value={1}>label=1 match</option>
                            <option value={0}>label=0 mismatch</option>
                          </select>
                          <button
                            type="button"
                            className="ml-auto text-gray-400 hover:text-red-500"
                            onClick={() => setPairs(prev => prev.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={pair.text}
                          onChange={e =>
                            setPairs(prev =>
                              prev.map((item, i) => (i === index ? { ...item, text: e.target.value } : item))
                            )
                          }
                          placeholder="text"
                        />
                        <input
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={pair.image_hint}
                          onChange={e =>
                            setPairs(prev =>
                              prev.map((item, i) =>
                                i === index ? { ...item, image_hint: e.target.value } : item
                              )
                            )
                          }
                          placeholder="image_hint"
                        />
                      </div>
                    ))}
                  </div>
                  {dataSource === 'registered' ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRegister}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                      >
                        <Database className="w-3.5 h-3.5" /> 注册数据集
                      </button>
                      {datasetId ? (
                        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
                          {datasetId}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700">请先注册或选择 dataset_id</span>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">3. 训练超参</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500">
                  dim
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    value={dim}
                    onChange={e => setDim(Number(e.target.value) || 32)}
                  />
                </label>
                <label className="text-xs text-gray-500">
                  epochs
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    value={epochs}
                    onChange={e => setEpochs(Number(e.target.value) || 16)}
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={training}
                onClick={handleTrain}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
              >
                <Play className="w-4 h-4" />
                {training ? '训练中…' : `训练 ${model.name}`}
              </button>
              {ckpt ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  训练完成 · {ckpt}
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" /> 融合推理
              </h3>
              {!ckpt ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  请先完成训练后再推理。
                </p>
              ) : null}
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={hint}
                onChange={e => setHint(e.target.value)}
                placeholder="image_hint"
              />
              <button
                type="button"
                disabled={!ckpt}
                onClick={handleInfer}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" /> 执行推理
              </button>
              {score != null ? (
                <p className="text-sm text-indigo-700 font-semibold">融合得分 {score.toFixed(3)}</p>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
