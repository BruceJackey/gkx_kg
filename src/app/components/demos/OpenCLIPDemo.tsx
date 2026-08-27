import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader2, Play, Link2, Unlink } from 'lucide-react';

const TRAIN_LOGS = [
  '加载 SciPaper-CLIP-v2 训练集（128,640 已链接图文对）',
  '初始化 OpenCLIP ViT-B/32 · image encoder + text encoder',
  '对比损失 symmetric InfoNCE · τ=0.07 · batch=256',
  '正样本对：已链接跨模态知识点 → 向量拉近',
  '负样本对：batch 内未链接对 → 向量推远',
  'Epoch 1/20 · train_loss 2.712 · val_recall@1 0.428',
  'Epoch 8/20 · train_loss 1.104 · val_recall@1 0.582',
  'Epoch 15/20 · train_loss 0.521 · val_recall@1 0.611',
  'Epoch 20/20 · train_loss 0.341 · val_recall@1 0.624',
  '保存检查点 openclip-scipaper-v2.1.pt',
  '评估完成 · 链接对 Recall@1 62.4%',
];

interface OpenCLIPDemoProps {
  autoStartTraining?: boolean;
  onRequestTrainingModal?: () => void;
}

export function OpenCLIPDemo({ autoStartTraining, onRequestTrainingModal }: OpenCLIPDemoProps) {
  const [trainState, setTrainState] = useState<'idle' | 'running' | 'done'>(autoStartTraining ? 'running' : 'idle');
  const [trainLogs, setTrainLogs] = useState<string[]>([]);
  const [trainProgress, setTrainProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(256);
  const [temperature, setTemperature] = useState(0.07);
  const [backbone, setBackbone] = useState('ViT-B/32');
  const trainRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => () => {
    if (trainRef.current) clearInterval(trainRef.current);
  }, []);

  const startTraining = () => {
    if (trainRef.current) clearInterval(trainRef.current);
    setTrainState('running');
    setTrainLogs([]);
    setTrainProgress(0);
    let step = 0;
    trainRef.current = setInterval(() => {
      step += 1;
      setTrainLogs(prev => [...prev, TRAIN_LOGS[step - 1]]);
      setTrainProgress((step / TRAIN_LOGS.length) * 100);
      if (step >= TRAIN_LOGS.length) {
        clearInterval(trainRef.current!);
        setTrainState('done');
      }
    }, 550);
  };

  useEffect(() => {
    if (!autoStartTraining || startedRef.current) return;
    startedRef.current = true;
    startTraining();
  }, [autoStartTraining]);

  return (
    <div id="open-clip-training" className="space-y-6">
      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-xs text-violet-800">
        <span className="font-semibold">关联关系学习</span>：利用对称 InfoNCE 对比学习，使已链接的跨模态知识点在向量空间中彼此靠近，未链接的相互远离。
        训练数据来自多模态数据集中经「跨模态链接构建」标注的图文对。
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 mb-2">
            <Link2 size={14} /> 正样本对（已链接）
          </div>
          <p className="text-xs text-gray-500 mb-3">图表 ↔ 正文引用、figure ↔ caption 等跨模态链接</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">图像向量</span>
            <span className="text-emerald-500">↔ 拉近</span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">文本向量</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Unlink size={14} /> 负样本对（未链接）
          </div>
          <p className="text-xs text-gray-500 mb-3">batch 内随机配对，语义无关的图文组合</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">图像向量</span>
            <span className="text-gray-400">↔ 推远</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">文本向量</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="text-sm font-semibold text-gray-800">OpenCLIP 训练配置</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">视觉骨干</label>
            <select
              value={backbone}
              onChange={e => setBackbone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400"
            >
              <option value="ViT-B/32">ViT-B/32（512-d）</option>
              <option value="ViT-L/14">ViT-L/14（768-d）</option>
              <option value="ViT-B/16">ViT-B/16（512-d）</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Batch Size</label>
            <input
              type="number"
              value={batchSize}
              onChange={e => setBatchSize(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">温度 τ（InfoNCE）</label>
            <input
              type="number"
              step={0.01}
              value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startTraining}
            disabled={trainState === 'running'}
            className="text-sm px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-1.5"
          >
            {trainState === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            发起对比学习训练
          </button>
          {onRequestTrainingModal && (
            <button
              type="button"
              onClick={onRequestTrainingModal}
              className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              高级训练配置
            </button>
          )}
        </div>
      </div>

      {trainState !== 'idle' && (
        <div className="bg-gray-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              OpenCLIP 训练日志 · {backbone} · batch={batchSize} · τ={temperature}
            </span>
            {trainState === 'done' && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle size={12} /> 训练完成
              </span>
            )}
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${trainProgress}%` }} />
          </div>
          <div className="font-mono text-[11px] text-green-400 space-y-0.5 max-h-40 overflow-y-auto">
            {trainLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
