import { useEffect, useState } from 'react';
import { CheckCircle2, Play, Settings2, Sparkles, Zap } from 'lucide-react';
import type { AuxiliaryInfoFocus } from '../data/auditPageMap';

type Triple = { h: string; r: string; t: string; score: number; reason: string };

const MODELS = [
  { id: 'transe', name: 'TransE', family: '平移距离', formula: 'h + r ≈ t' },
  { id: 'distmult', name: 'DistMult', family: '张量分解', formula: 'h⊤ diag(r) t' },
  { id: 'complex', name: 'ComplEx', family: '张量分解', formula: 'Re(⟨h, r, t̄⟩)' },
  { id: 'conve', name: 'ConvE', family: '神经网络', formula: 'conv([h; r]) · t' },
];

const DEFAULT_TEXT =
  '清华大学\t中国顶尖综合性大学，位于北京\n北京大学\t中国著名高等学府\n李明\t知识图谱研究者';
const DEFAULT_TYPE = '清华大学\t机构\n北京大学\t机构\n李明\t人物';
const DEFAULT_MM =
  '清华大学\thttps://example.com/tsinghua.png\t\n李明\t\thttps://example.com/liming.wav';

function parseRows(text: string): Array<{ entity: string; extra: string }> {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [entity, ...rest] = line.split(/\t|,|，/).map(part => part.trim());
      return { entity: entity ?? '', extra: rest.filter(Boolean).join(' ') };
    })
    .filter(row => row.entity && row.extra);
}

export default function AuxiliaryInfoEncoding({
  initialFocus = 'text',
}: {
  initialFocus?: AuxiliaryInfoFocus | null;
}) {
  const [modelId, setModelId] = useState('transe');
  const [dim, setDim] = useState(200);
  const [epochs, setEpochs] = useState(50);
  const [useText, setUseText] = useState(initialFocus === 'text' || !initialFocus);
  const [useType, setUseType] = useState(initialFocus === 'type');
  const [useMm, setUseMm] = useState(initialFocus === 'mm');
  const [textInput, setTextInput] = useState(DEFAULT_TEXT);
  const [typeInput, setTypeInput] = useState(DEFAULT_TYPE);
  const [mmInput, setMmInput] = useState(DEFAULT_MM);
  const [training, setTraining] = useState(false);
  const [ckpt, setCkpt] = useState<string | null>(null);
  const [mrr, setMrr] = useState<number | null>(null);
  const [head, setHead] = useState('李明');
  const [rel, setRel] = useState('就职于');
  const [hits, setHits] = useState<Triple[] | null>(null);

  useEffect(() => {
    if (initialFocus === 'text') setUseText(true);
    if (initialFocus === 'type') setUseType(true);
    if (initialFocus === 'mm') setUseMm(true);
  }, [initialFocus]);

  const model = MODELS.find(item => item.id === modelId) ?? MODELS[0];
  const textRows = parseRows(textInput);
  const typeRows = parseRows(typeInput);
  const mmRows = parseRows(mmInput);

  const invalidate = () => {
    setCkpt(null);
    setHits(null);
    setMrr(null);
  };

  const handleTrain = () => {
    if (useText && !textRows.length) {
      window.alert('已启用文本描述信息融合，请填写至少一条实体描述');
      return;
    }
    if (useType && !typeRows.length) {
      window.alert('已启用实体类型信息融合，请填写至少一条实体类型');
      return;
    }
    if (useMm && !mmRows.length) {
      window.alert('已启用多模态信息集成，请填写至少一条图像/音频资源');
      return;
    }
    setTraining(true);
    window.setTimeout(() => {
      const n = Number(useText) + Number(useType) + Number(useMm);
      setCkpt(`enc_${modelId}_${Date.now().toString(36).slice(-5)}`);
      setMrr(Number((0.36 + n * 0.02 + epochs * 0.001).toFixed(3)));
      setTraining(false);
      setHits(null);
    }, 900);
  };

  const handleInfer = () => {
    if (!ckpt) return;
    const typeHit = useType && typeRows.some(row => row.entity === head);
    const textHit = useText && textRows.some(row => row.entity === head);
    const mmHit = useMm && mmRows.some(row => row.entity === head);
    setHits([
      {
        h: head,
        r: rel,
        t: '清华大学',
        score: Number((0.78 + (typeHit ? 0.05 : 0) + (textHit ? 0.04 : 0) + (mmHit ? 0.03 : 0)).toFixed(3)),
        reason: [model.name, typeHit && '类型约束', textHit && '文本描述', mmHit && '多模态'].filter(Boolean).join(' · '),
      },
      {
        h: head,
        r: rel,
        t: '北京大学',
        score: 0.61,
        reason: `${model.name} 结构打分`,
      },
    ]);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">知识表示学习 · 辅助信息</div>
          <h1 className="text-xl font-semibold text-gray-900">编码模型训练</h1>
          <p className="text-sm text-gray-500 mt-1">
            三类辅助信息可独立启用；启用后必须填写对应输入，再发起训练，并用已训练模型推理。
          </p>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">1. 选择编码模型</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MODELS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setModelId(item.id);
                  invalidate();
                }}
                className={`text-left rounded-lg border px-3 py-2 ${
                  modelId === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                <div className="text-[11px] text-gray-400">{item.family}</div>
                <code className="text-[10px] text-gray-500">{item.formula}</code>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">
              嵌入维度
              <input
                type="number"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={dim}
                onChange={e => {
                  setDim(Number(e.target.value) || 200);
                  invalidate();
                }}
              />
            </label>
            <label className="text-xs text-gray-500">
              训练轮数
              <input
                type="number"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={epochs}
                onChange={e => {
                  setEpochs(Number(e.target.value) || 50);
                  invalidate();
                }}
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-600" /> 2. 辅助信息（可选启用）
          </h2>

          {(
            [
              {
                id: 'text' as const,
                title: '文本描述信息融合',
                desc: '将实体文本描述作为输入，与结构信息共同学习',
                on: useText,
                set: (v: boolean) => {
                  setUseText(v);
                  invalidate();
                },
                value: textInput,
                setValue: setTextInput,
                hint: '每行：实体{TAB}描述',
                count: textRows.length,
                highlight: initialFocus === 'text',
              },
              {
                id: 'type' as const,
                title: '实体类型信息融合',
                desc: '将实体类别作为约束或特征，指导向量学习',
                on: useType,
                set: (v: boolean) => {
                  setUseType(v);
                  invalidate();
                },
                value: typeInput,
                setValue: setTypeInput,
                hint: '每行：实体{TAB}类型',
                count: typeRows.length,
                highlight: initialFocus === 'type',
              },
              {
                id: 'mm' as const,
                title: '多模态信息集成',
                desc: '集成与实体关联的图像、音频等模态',
                on: useMm,
                set: (v: boolean) => {
                  setUseMm(v);
                  invalidate();
                },
                value: mmInput,
                setValue: setMmInput,
                hint: '每行：实体{TAB}图像URL{TAB}音频URL',
                count: mmRows.length,
                highlight: initialFocus === 'mm',
              },
            ] as const
          ).map(block => (
            <div
              key={block.id}
              className={`rounded-lg border p-4 ${
                block.highlight ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{block.title}</div>
                  <p className="text-xs text-gray-500 mt-0.5">{block.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => block.set(!block.on)}
                  className={`shrink-0 text-xs px-3 py-1 rounded-full ${
                    block.on ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {block.on ? '已启用' : '未启用'}
                </button>
              </div>
              {block.on ? (
                <label className="block mt-3 text-xs text-gray-500">
                  {block.hint} · 已解析 {block.count} 条
                  <textarea
                    rows={4}
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    value={block.value}
                    onChange={e => {
                      block.setValue(e.target.value);
                      invalidate();
                    }}
                  />
                </label>
              ) : null}
            </div>
          ))}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">3. 发起训练</h2>
          <p className="text-xs text-gray-500">
            {model.name} · {dim}d · {epochs} epoch · 辅助信息
            {useText || useType || useMm
              ? ` ${[useText && '文本', useType && '类型', useMm && '多模态'].filter(Boolean).join('+')}`
              : ' 关闭（仅结构）'}
          </p>
          <button
            type="button"
            onClick={handleTrain}
            disabled={training}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
          >
            <Play className="w-4 h-4" />
            {training ? '训练中…' : '发起训练'}
          </button>
          {ckpt ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />
              训练完成 · {ckpt} · MRR {mrr}
            </div>
          ) : null}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" /> 4. 用已训练模型推理
          </h2>
          {!ckpt ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              请先完成训练后再推理。
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              value={head}
              onChange={e => setHead(e.target.value)}
              placeholder="头实体"
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              value={rel}
              onChange={e => setRel(e.target.value)}
              placeholder="关系"
            />
          </div>
          <button
            type="button"
            disabled={!ckpt}
            onClick={handleInfer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" /> 执行推理
          </button>
          {hits ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="py-2">三元组</th>
                  <th>得分</th>
                  <th>依据</th>
                </tr>
              </thead>
              <tbody>
                {hits.map((item, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-2 font-mono text-xs">
                      ({item.h}, {item.r}, {item.t})
                    </td>
                    <td className="text-indigo-600 font-semibold">{item.score.toFixed(3)}</td>
                    <td className="text-xs text-gray-500">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
      </div>
    </div>
  );
}
