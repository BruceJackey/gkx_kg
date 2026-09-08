import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Combine,
  ImageIcon,
  Layers,
  Play,
  Scale,
  Sparkles,
  Split,
  Type,
  Upload,
  X,
} from 'lucide-react';

export type HeterogeneousFusionFocus = 'align' | 'early' | 'late';

const TABS: Array<{
  id: HeterogeneousFusionFocus;
  label: string;
  desc: string;
}> = [
  {
    id: 'align',
    label: '特征对齐与归一化',
    desc: '提供工具，在融合前对不同来源、不同维度的特征向量进行对齐、填充或降维处理，并进行归一化，解决异质性问题。',
  },
  {
    id: 'early',
    label: '早期融合策略',
    desc: '支持在模型输入的早期阶段，通过简单的拼接（Concatenation）或加权平均等方式，将不同模态的特征向量直接合并。',
  },
  {
    id: 'late',
    label: '晚期融合策略',
    desc: '支持分别为每个模态训练一个独立的模型，在模型的输出（预测）层，通过投票、取平均值或再训练一个元学习器的方式进行融合。',
  },
];

type AlignMode = 'pad' | 'truncate' | 'pca';
type NormMode = 'none' | 'l2' | 'minmax' | 'zscore';

const TEXT_NATIVE_DIM = 12;
const IMAGE_NATIVE_DIM = 8;

function l2Norm(v: number[]) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

function minMax(v: number[]) {
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const span = hi - lo || 1;
  return v.map((x) => (x - lo) / span);
}

function zScore(v: number[]) {
  const mean = v.reduce((s, x) => s + x, 0) / (v.length || 1);
  const std =
    Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (v.length || 1)) || 1;
  return v.map((x) => (x - mean) / std);
}

function alignVector(values: number[], targetDim: number, mode: AlignMode): number[] {
  if (mode === 'pad' || mode === 'truncate') {
    if (values.length >= targetDim) return values.slice(0, targetDim);
    return [...values, ...Array(targetDim - values.length).fill(0)];
  }
  const out: number[] = [];
  for (let i = 0; i < targetDim; i += 1) {
    let s = 0;
    for (let j = 0; j < values.length; j += 1) {
      const w = Math.cos((i + 1) * (j + 1) * 0.7) * 0.4 + 0.1;
      s += values[j] * w;
    }
    out.push(Number((s / Math.sqrt(values.length || 1)).toFixed(4)));
  }
  return out;
}

function normalize(values: number[], mode: NormMode): number[] {
  if (mode === 'l2') return l2Norm(values).map((x) => Number(x.toFixed(4)));
  if (mode === 'minmax') return minMax(values).map((x) => Number(x.toFixed(4)));
  if (mode === 'zscore') return zScore(values).map((x) => Number(x.toFixed(4)));
  return values.map((x) => Number(x.toFixed(4)));
}

/** 文本 → 伪嵌入（由正文内容决定，模拟文本编码器） */
function encodeText(text: string, dim = TEXT_NATIVE_DIM): number[] {
  const s = text.trim() || ' ';
  const vec = Array.from({ length: dim }, () => 0);
  for (let i = 0; i < s.length; i += 1) {
    const code = s.charCodeAt(i);
    const idx = (code * (i + 3)) % dim;
    vec[idx] += ((code % 97) / 97 - 0.5) * (1 + (i % 5) * 0.08);
  }
  // 长度 / 中文占比等统计特征混入前几维
  const cn = (s.match(/[\u4e00-\u9fa5]/g) || []).length;
  vec[0] += Math.log1p(s.length) * 0.15;
  vec[1] += cn / Math.max(s.length, 1);
  return vec.map((x) => Number(x.toFixed(4)));
}

/** 图像像素 → 伪嵌入（由上传图内容决定，模拟视觉编码器） */
function encodeImageFromCanvas(canvas: HTMLCanvasElement, dim = IMAGE_NATIVE_DIM): number[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return Array(dim).fill(0);
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const bins = Array.from({ length: dim }, () => 0);
  const counts = Array.from({ length: dim }, () => 0);
  const cell = Math.max(1, Math.floor(Math.sqrt(dim)));

  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 24))) {
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 24))) {
      const i = (y * width + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const gx = Math.min(cell - 1, Math.floor((x / width) * cell));
      const gy = Math.min(cell - 1, Math.floor((y / height) * cell));
      const idx = Math.min(dim - 1, gy * cell + gx);
      bins[idx] += 0.299 * r + 0.587 * g + 0.114 * b;
      counts[idx] += 1;
    }
  }

  return bins.map((v, i) => {
    const avg = counts[i] ? v / counts[i] : 0;
    return Number((avg * 2 - 1).toFixed(4));
  });
}

function loadImageToCanvas(file: File, canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxSide = 160;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('no ctx'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

function VecBar({ values, color }: { values: number[]; color: string }) {
  const maxAbs = Math.max(...values.map(Math.abs), 0.01);
  return (
    <div className="flex items-end gap-0.5 h-10 flex-wrap">
      {values.map((v, i) => (
        <div
          key={i}
          className={`w-2 rounded-sm ${color} opacity-80`}
          style={{ height: `${Math.max(8, (Math.abs(v) / maxAbs) * 100)}%` }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

function ArchBox({
  title,
  sub,
  className = '',
}: {
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white px-3 py-2.5 text-center min-w-[110px] ${className}`}>
      <div className="text-xs font-semibold text-gray-900">{title}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

/**
 * 审计目录专用：异质多模态特征融合
 * 对齐归一化：真实文本 + 上传图像 → 编码 → 对齐/归一化
 */
export default function HeterogeneousMultimodalFusion({
  initialFocus = 'align',
}: {
  initialFocus?: HeterogeneousFusionFocus | null;
}) {
  const [tab, setTab] = useState<HeterogeneousFusionFocus>(initialFocus ?? 'align');
  const [text, setText] = useState(
    '知识图谱将实体与关系结构化表示，支撑检索、推理与多模态理解。',
  );
  const [imageName, setImageName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [targetDim, setTargetDim] = useState(8);
  const [alignMode, setAlignMode] = useState<AlignMode>('pad');
  const [normMode, setNormMode] = useState<NormMode>('l2');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawFeats, setRawFeats] = useState<{
    text: number[];
    image: number[];
  } | null>(null);
  const [processed, setProcessed] = useState<Array<{
    id: string;
    name: string;
    beforeDim: number;
    after: number[];
    color: string;
  }> | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFocus) setTab(initialFocus);
  }, [initialFocus]);

  useEffect(() => {
    setProcessed(null);
    setRawFeats(null);
    setError(null);
  }, [tab]);

  const meta = TABS.find((t) => t.id === tab)!;

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    setError(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      await loadImageToCanvas(file, canvas);
      setImageName(file.name);
      setImagePreview(canvas.toDataURL('image/jpeg', 0.85));
      setProcessed(null);
      setRawFeats(null);
    } catch {
      setError('图片加载失败，请换一张重试');
    }
  };

  const clearImage = () => {
    setImageName(null);
    setImagePreview(null);
    setProcessed(null);
    setRawFeats(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const runAlign = async () => {
    setError(null);
    if (!text.trim()) {
      setError('请先输入文本');
      return;
    }
    if (!imagePreview || !canvasRef.current) {
      setError('请先上传图像');
      return;
    }

    setRunning(true);
    window.setTimeout(() => {
      const textVec = encodeText(text, TEXT_NATIVE_DIM);
      const imageVec = encodeImageFromCanvas(canvasRef.current!, IMAGE_NATIVE_DIM);
      setRawFeats({ text: textVec, image: imageVec });
      setProcessed([
        {
          id: 'text',
          name: '文本',
          beforeDim: textVec.length,
          after: normalize(alignVector(textVec, targetDim, alignMode), normMode),
          color: 'bg-sky-500',
        },
        {
          id: 'image',
          name: '图像',
          beforeDim: imageVec.length,
          after: normalize(alignVector(imageVec, targetDim, alignMode), normMode),
          color: 'bg-violet-500',
        },
      ]);
      setRunning(false);
    }, 360);
  };

  const fusedPreview = useMemo(() => {
    if (!processed || processed.length === 0) return null;
    return processed.flatMap((p) => p.after);
  }, [processed]);

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">数据的统一建模与表示融合 · 异质多模态特征融合</div>
          <h1 className="text-xl font-semibold text-gray-900">{meta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">{meta.desc}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink-0 w-fit max-w-full">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex-1 min-h-0 overflow-y-auto pb-6 max-w-5xl space-y-4">
        {tab === 'align' && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-900">多模态原始输入</h2>
                <span className="text-[11px] text-gray-400">文本 + 图像 · 异质来源</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-100 bg-sky-50/30 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <Type className="w-4 h-4 text-sky-600" />
                    文本
                  </div>
                  <textarea
                    className="w-full min-h-[120px] border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setProcessed(null);
                      setRawFeats(null);
                    }}
                    placeholder="输入待编码的文本内容…"
                  />
                  <p className="text-[11px] text-gray-400">
                    编码后原生维度 dim={TEXT_NATIVE_DIM}（由文本内容决定）
                  </p>
                </div>

                <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <ImageIcon className="w-4 h-4 text-violet-600" />
                      图像
                    </div>
                    {imageName && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="text-[11px] text-gray-400 hover:text-red-500 inline-flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" /> 清除
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />

                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="upload preview"
                        className="w-full max-h-40 object-contain rounded-lg border border-gray-200 bg-white"
                      />
                      <p className="text-[11px] text-gray-500 truncate">{imageName}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full min-h-[120px] rounded-lg border border-dashed border-violet-200 bg-white hover:bg-violet-50/50 flex flex-col items-center justify-center gap-2 text-sm text-gray-500"
                    >
                      <Upload className="w-5 h-5 text-violet-500" />
                      点击上传图片
                    </button>
                  )}

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-[11px] text-violet-700 hover:underline"
                    >
                      更换图片
                    </button>
                  )}
                  <p className="text-[11px] text-gray-400">
                    编码后原生维度 dim={IMAGE_NATIVE_DIM}（由像素网格决定）
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-900">对齐与归一化配置</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">目标维度</span>
                  <input
                    type="number"
                    min={2}
                    max={16}
                    value={targetDim}
                    onChange={(e) => setTargetDim(Number(e.target.value) || 8)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">对齐方式</span>
                  <select
                    value={alignMode}
                    onChange={(e) => setAlignMode(e.target.value as AlignMode)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                  >
                    <option value="pad">填充 (Padding) 到目标维</option>
                    <option value="truncate">截断 / 补齐到目标维</option>
                    <option value="pca">降维投影 (PCA 示意)</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">归一化</span>
                  <select
                    value={normMode}
                    onChange={(e) => setNormMode(e.target.value as NormMode)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white"
                  >
                    <option value="l2">L2 归一化</option>
                    <option value="minmax">Min-Max</option>
                    <option value="zscore">Z-Score</option>
                    <option value="none">不归一化</option>
                  </select>
                </label>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="button"
                onClick={runAlign}
                disabled={running}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
              >
                <Play className="w-4 h-4" />
                {running ? '编码并处理中…' : '编码 → 对齐与归一化'}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">处理结果</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  先对输入做模态编码，再对齐到统一维度并归一化
                </p>
              </div>
              {!processed && (
                <p className="text-sm text-gray-400 text-center py-10">
                  输入文本并上传图片后执行
                </p>
              )}
              {processed && rawFeats && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-3 space-y-2">
                      <div className="text-xs text-gray-400">编码后（对齐前）</div>
                      <div className="text-sm font-medium text-gray-900">
                        文本 · dim={rawFeats.text.length}
                      </div>
                      <VecBar values={rawFeats.text} color="bg-sky-400" />
                      <code className="block text-[10px] font-mono text-gray-500 break-all">
                        [{rawFeats.text.join(', ')}]
                      </code>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-slate-50/80 p-3 space-y-2">
                      <div className="text-xs text-gray-400">编码后（对齐前）</div>
                      <div className="text-sm font-medium text-gray-900">
                        图像 · dim={rawFeats.image.length}
                      </div>
                      <VecBar values={rawFeats.image} color="bg-violet-400" />
                      <code className="block text-[10px] font-mono text-gray-500 break-all">
                        [{rawFeats.image.join(', ')}]
                      </code>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {processed.map((p) => (
                      <div key={p.id} className="rounded-xl border border-teal-100 bg-teal-50/40 p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{p.name}（对齐后）</span>
                          <span className="text-[10px] text-teal-700">
                            {p.beforeDim} → {p.after.length}
                          </span>
                        </div>
                        <VecBar values={p.after} color={p.color} />
                        <code className="block text-[10px] font-mono text-gray-500 break-all">
                          [{p.after.join(', ')}]
                        </code>
                      </div>
                    ))}
                  </div>

                  {fusedPreview && (
                    <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2.5 text-xs text-teal-900">
                      文本与图像已对齐到同维，可进入早期融合（拼接维数 ≈ {fusedPreview.length}）
                      或分别送入晚期融合的文本 / 图像编码器。
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'early' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Combine className="w-4 h-4 text-sky-600" />
                <h2 className="text-sm font-semibold text-gray-900">早期融合 · 模型内部架构</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                早期融合发生在模型输入阶段：文本编码器与图像编码器输出的特征向量，
                经对齐归一化后，通过拼接（Concatenation）或加权平均合并为统一表示，再送入下游共享网络。
                该策略属于模型架构设计，而非独立业务操作界面。
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
              <div className="text-xs font-medium text-gray-500 mb-4">架构示意</div>
              <div className="flex flex-col gap-4 min-w-[560px]">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <ArchBox title="文本" sub="Text Encoder" className="border-sky-200" />
                  <ArchBox title="图像" sub="Vision Encoder" className="border-violet-200" />
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                  <ArrowRight className="w-4 h-4" /> 特征向量（可先对齐归一化）
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <ArchBox title="Concatenation" sub="拼接合并" className="border-amber-200 bg-amber-50/50" />
                  <span className="text-xs text-gray-400">或</span>
                  <ArchBox title="加权平均" sub="Σ wᵢ · fᵢ" className="border-amber-200 bg-amber-50/50" />
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                  <ArrowRight className="w-4 h-4" /> 统一融合向量
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex justify-center">
                  <ArchBox title="共享下游网络" sub="分类 / 检索 / 链接预测" className="border-slate-300 bg-slate-50" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Concatenation</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  将文本、图像向量首尾相接：f = [f_text ; f_image]。保留各模态全部信息，
                  融合维数随模态增加，后续层需能处理更高维输入。
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">加权平均</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  在同维对齐后计算 f = Σ wᵢ fᵢ。权重可固定或可学习，适合强调某一模态贡献、控制融合维数不变的场景。
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'late' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Split className="w-4 h-4 text-violet-600" />
                <h2 className="text-sm font-semibold text-gray-900">晚期融合 · 模型内部架构</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                晚期融合在各模态独立建模之后进行：文本编码器与图像编码器各自前向，
                在预测层再通过投票、平均或元学习器合并决策。本页以图示说明组织方式。
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
              <div className="text-xs font-medium text-gray-500 mb-4">架构示意（类比多模态大模型）</div>
              <div className="flex flex-col gap-4 min-w-[520px]">
                <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto w-full">
                  <div className="flex flex-col items-center gap-2">
                    <ArchBox title="文本输入" className="border-sky-200 w-full" />
                    <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                    <ArchBox title="文本编码器" sub="独立模型 A" className="border-sky-300 bg-sky-50/50 w-full" />
                    <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                    <ArchBox title="预测 ŷ_text" className="border-sky-100 w-full" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ArchBox title="图像输入" className="border-violet-200 w-full" />
                    <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                    <ArchBox title="图像编码器" sub="独立模型 B" className="border-violet-300 bg-violet-50/50 w-full" />
                    <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
                    <ArchBox title="预测 ŷ_image" className="border-violet-100 w-full" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Layers className="w-4 h-4" /> 输出层融合
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <ArchBox title="投票" sub="Voting" className="border-amber-200 bg-amber-50/40" />
                  <ArchBox title="取平均" sub="Averaging" className="border-amber-200 bg-amber-50/40" />
                  <ArchBox title="元学习器" sub="Meta-learner" className="border-amber-200 bg-amber-50/40" />
                </div>
                <div className="flex justify-center">
                  <ArchBox title="最终预测 ŷ" sub="融合决策" className="border-slate-300 bg-slate-50" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">投票</h3>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  各模态模型给出类别或候选，按多数票或置信度加权票决定最终结果。
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">取平均值</h3>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  对概率或打分向量做算术/加权平均，平滑单模态噪声。
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">元学习器</h3>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  再训练一层融合网络，以各模态输出为输入学习最优组合。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
