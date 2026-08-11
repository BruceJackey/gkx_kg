import React, { useState, useRef } from 'react';
import { Play } from 'lucide-react';

interface RGATModel {
  id: string; name: string; domain: string; relations: number;
  f1: string; version: string; status: '已部署' | '已停用' | '训练中';
  updatedAt: string; description: string;
}

const RGAT_MODELS: RGATModel[] = [
  { id: 'rgat-sci', name: 'RGAT-SciTech-v2', domain: '科技文献', relations: 18, f1: '95.2%', version: 'v2.0.0', status: '已部署', updatedAt: '2026-07-25', description: '覆盖科技论文中作者关系、方法引用、数据集使用等 18 类关系' },
  { id: 'rgat-patent', name: 'RGAT-Patent-v1', domain: '专利文档', relations: 12, f1: '93.8%', version: 'v1.3.0', status: '已部署', updatedAt: '2026-06-10', description: '针对专利权利要求书中技术主体与组成要素关系设计' },
  { id: 'rgat-bio', name: 'RGAT-BioMed-v1', domain: '生物医学', relations: 22, f1: '91.5%', version: 'v1.1.0', status: '已停用', updatedAt: '2026-04-18', description: '覆盖药物-靶点、疾病-基因等生物医学关系类型' },
  { id: 'rgat-fin', name: 'RGAT-Finance-v1', domain: '金融领域', relations: 10, f1: '—', version: 'v0.9.0', status: '训练中', updatedAt: '2026-07-28', description: '金融报告中企业投资、持股、合并等关系，训练中' },
];

const FINETUNE_PARAMS = [
  { key: 'lr', label: '学习率', type: 'select', options: ['1e-5', '2e-5', '5e-5', '1e-4'], default: '2e-5' },
  { key: 'batch', label: '批大小', type: 'select', options: ['8', '16', '32', '64'], default: '16' },
  { key: 'epochs', label: '训练轮次', type: 'select', options: ['3', '5', '10', '20'], default: '5' },
  { key: 'mode', label: '微调模式', type: 'select', options: ['全量微调', 'LoRA 高效微调'], default: 'LoRA 高效微调' },
  { key: 'earlystop', label: '早停轮次', type: 'select', options: ['2', '3', '5', '不启用'], default: '3' },
];

// Mock training curves: [loss_train, loss_val, acc_train, acc_val, f1_val]
const TRAINING_CURVES: number[][] = [
  [2.41, 2.38, 0.41, 0.39, 0.36],
  [1.82, 1.79, 0.59, 0.57, 0.54],
  [1.31, 1.28, 0.71, 0.69, 0.67],
  [0.97, 0.95, 0.79, 0.77, 0.75],
  [0.74, 0.73, 0.85, 0.83, 0.82],
  [0.58, 0.61, 0.89, 0.87, 0.86],
  [0.46, 0.52, 0.92, 0.89, 0.88],
  [0.38, 0.48, 0.94, 0.90, 0.89],
  [0.32, 0.47, 0.95, 0.90, 0.89],
  [0.28, 0.48, 0.96, 0.90, 0.90],
];

type MetricKey = 'loss' | 'acc' | 'f1';

function sparkPath(values: number[], minV: number, maxV: number, W: number, H: number): string {
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - minV) / (maxV - minV)) * H;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

function TrainingChart({ epochs, metric }: { epochs: number; metric: MetricKey }) {
  const sliced = TRAINING_CURVES.slice(0, epochs);
  const W = 340; const H = 110;

  let trainIdx: number, valIdx: number, label: string, yMin: number, yMax: number, colorTrain: string, colorVal: string;
  if (metric === 'loss') {
    trainIdx = 0; valIdx = 1; label = 'Loss'; yMin = 0.2; yMax = 2.6; colorTrain = '#ef4444'; colorVal = '#f97316';
  } else if (metric === 'acc') {
    trainIdx = 2; valIdx = 3; label = 'Accuracy'; yMin = 0.3; yMax = 1.0; colorTrain = '#3b82f6'; colorVal = '#6366f1';
  } else {
    trainIdx = 4; valIdx = 4; label = 'F1-Score (val)'; yMin = 0.3; yMax = 1.0; colorTrain = '#10b981'; colorVal = '#10b981';
  }

  const trainVals = sliced.map(r => r[trainIdx]);
  const valVals = sliced.map(r => r[valIdx]);
  const xTicks = sliced.map((_, i) => i + 1);
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  const trainPath = sparkPath(trainVals, yMin, yMax, W, H);
  const valPath = sparkPath(valVals, yMin, yMax, W, H);

  const lastTrain = trainVals[trainVals.length - 1];
  const lastVal = valVals[valVals.length - 1];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-700">{label}</div>
        <div className="flex items-center gap-3 text-[11px]">
          {metric !== 'f1' && <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block" style={{ background: colorTrain }} />训练集 <strong>{lastTrain.toFixed(metric === 'loss' ? 2 : 3)}</strong></span>}
          <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block border-t-2 border-dashed" style={{ borderColor: colorVal }} />验证集 <strong>{lastVal.toFixed(metric === 'loss' ? 2 : 3)}</strong></span>
        </div>
      </div>
      <svg viewBox={`-28 -8 ${W + 36} ${H + 28}`} className="w-full">
        {/* grid */}
        {yTicks.map((v, i) => {
          const y = H - ((v - yMin) / (yMax - yMin)) * H;
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={W} y2={y} stroke="#f3f4f6" strokeWidth={1} />
              <text x={-4} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af">{v.toFixed(1)}</text>
            </g>
          );
        })}
        {xTicks.map((ep, i) => {
          const x = (i / (xTicks.length - 1)) * W;
          return <text key={ep} x={x} y={H + 14} textAnchor="middle" fontSize={9} fill="#9ca3af">E{ep}</text>;
        })}
        {/* curves */}
        {metric !== 'f1' && <path d={trainPath} fill="none" stroke={colorTrain} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
        <path d={valPath} fill="none" stroke={colorVal} strokeWidth={2} strokeDasharray={metric === 'f1' ? '0' : '5 3'} strokeLinecap="round" strokeLinejoin="round" />
        {/* last point dot */}
        {sliced.length > 0 && (() => {
          const x = W; const y = H - ((lastVal - yMin) / (yMax - yMin)) * H;
          return <circle cx={x} cy={y} r={3.5} fill={colorVal} />;
        })()}
      </svg>
    </div>
  );
}

export function RGATDemo() {
  const [tab, setTab] = useState<'models' | 'finetune' | 'monitor'>('models');
  const [modelStatus, setModelStatus] = useState<Record<string, RGATModel['status']>>(
    Object.fromEntries(RGAT_MODELS.map(m => [m.id, m.status]))
  );
  const [params, setParams] = useState<Record<string, string>>(
    Object.fromEntries(FINETUNE_PARAMS.map(p => [p.key, p.default]))
  );
  const [baseModel, setBaseModel] = useState('rgat-sci');
  const [trainStep, setTrainStep] = useState<'idle' | 'running' | 'done'>('idle');
  const [trainEpoch, setTrainEpoch] = useState(0);
  const [trainProgress, setTrainProgress] = useState(0);
  const [metric, setMetric] = useState<MetricKey>('loss');
  const trainRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalEpochs = parseInt(params.epochs) || 5;

  const startTraining = () => {
    setTrainStep('running');
    setTrainEpoch(0);
    setTrainProgress(0);
    setTab('monitor');
    let epoch = 0;
    const stepMs = 800;
    trainRef.current = setInterval(() => {
      epoch += 1;
      setTrainEpoch(epoch);
      setTrainProgress((epoch / totalEpochs) * 100);
      if (epoch >= totalEpochs) {
        clearInterval(trainRef.current!);
        setTrainStep('done');
      }
    }, stepMs);
  };

  const resetTraining = () => {
    if (trainRef.current) clearInterval(trainRef.current);
    setTrainStep('idle'); setTrainEpoch(0); setTrainProgress(0);
  };

  const toggleStatus = (id: string) => {
    setModelStatus(prev => ({ ...prev, [id]: prev[id] === '已部署' ? '已停用' : '已部署' }));
  };

  const STATUS_STYLE: Record<string, string> = {
    '已部署': 'bg-green-100 text-green-700',
    '已停用': 'bg-gray-100 text-gray-500',
    '训练中': 'bg-amber-100 text-amber-700',
  };

  const displayedEpochs = Math.min(trainEpoch, TRAINING_CURVES.length);

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          ['models', '预训练模型管理'],
          ['finetune', '模型训练与微调'],
          ['monitor', '训练过程监控'],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${tab === k ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Models tab ── */}
      {tab === 'models' && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500">共 {RGAT_MODELS.length} 个预训练模型 · 点击状态按钮切换部署</div>
          {RGAT_MODELS.map(m => {
            const st = modelStatus[m.id];
            return (
              <div key={m.id} className={`border rounded-xl p-4 transition-all ${st === '已停用' ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{m.domain}</span>
                      <span className="text-[10px] text-gray-400">{m.version}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{m.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                      <span>关系类型 <strong className="text-gray-800">{m.relations}</strong> 种</span>
                      <span>F1 <strong className="text-gray-800">{m.f1}</strong></span>
                      <span>更新 {m.updatedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[st]}`}>{st}</span>
                    {st !== '训练中' && (
                      <button onClick={() => toggleStatus(m.id)}
                        className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        {st === '已部署' ? '停用' : '启用'}
                      </button>
                    )}
                    <button onClick={() => { setBaseModel(m.id); setTab('finetune'); }}
                      className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      微调
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fine-tune tab ── */}
      {tab === 'finetune' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            {/* Base model */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">基座模型</div>
              <select value={baseModel} onChange={e => setBaseModel(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
                {RGAT_MODELS.filter(m => m.status !== '训练中').map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.domain})</option>
                ))}
              </select>
            </div>

            {/* Data upload */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">标注数据集</div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">支持 CoNLL / JSON 关系标注格式</div>
                <button className="text-xs text-blue-600 hover:underline">上传标注文件</button>
                <div className="mt-2 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-medium text-gray-700">my_relations_train.json</span>
                  <span className="text-gray-400">1,240 条</span>
                </div>
              </div>
            </div>

            {/* Hyperparams */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">超参数配置</div>
              <div className="grid grid-cols-2 gap-2">
                {FINETUNE_PARAMS.map(p => (
                  <div key={p.key}>
                    <div className="text-[11px] text-gray-500 mb-1">{p.label}</div>
                    <select value={params[p.key]} onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400">
                      {p.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Config summary */}
            <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-blue-800 mb-3">任务配置摘要</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">基座模型</span><span className="font-medium text-gray-800">{RGAT_MODELS.find(m => m.id === baseModel)?.name}</span></div>
                {FINETUNE_PARAMS.map(p => (
                  <div key={p.key} className="flex justify-between">
                    <span className="text-gray-500">{p.label}</span>
                    <span className="font-medium text-gray-800">{params[p.key]}</span>
                  </div>
                ))}
                <div className="flex justify-between"><span className="text-gray-500">预计时长</span><span className="font-medium text-gray-800">~{totalEpochs * 4} 分钟</span></div>
              </div>
            </div>

            {/* Launch button */}
            <button onClick={startTraining} disabled={trainStep === 'running'}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl disabled:opacity-50 transition-colors">
              <Play className="w-4 h-4" />
              {trainStep === 'running' ? `训练中 (Epoch ${trainEpoch}/${totalEpochs})…` : trainStep === 'done' ? '重新训练' : '发起微调训练'}
            </button>

            {trainStep === 'done' && (
              <div className="border border-green-200 bg-green-50 rounded-xl p-3 text-xs">
                <div className="font-semibold text-green-800 mb-2">微调完成 · 最终指标</div>
                <div className="grid grid-cols-3 gap-2">
                  {[['F1-Score', '90.1%'], ['Accuracy', '90.2%'], ['Val Loss', '0.47']].map(([k, v]) => (
                    <div key={k} className="bg-white rounded-lg p-2 border border-green-100 text-center">
                      <div className="text-gray-500 text-[10px]">{k}</div>
                      <div className="font-bold text-green-700 mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Monitor tab ── */}
      {tab === 'monitor' && (
        <div className="space-y-4">
          {/* Status bar */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${trainStep === 'running' ? 'bg-blue-500 animate-pulse' : trainStep === 'done' ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-800">
                {trainStep === 'idle' ? '暂无训练任务 · 请在「模型训练与微调」tab 发起训练' : trainStep === 'running' ? `训练进行中 · Epoch ${trainEpoch} / ${totalEpochs}` : `训练完成 · 共 ${totalEpochs} 个 Epoch`}
              </div>
              {trainStep !== 'idle' && (
                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${trainStep === 'done' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${trainProgress}%` }} />
                </div>
              )}
            </div>
            {trainStep !== 'idle' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{Math.floor(trainProgress)}%</span>
                {trainStep === 'done' && (
                  <button onClick={resetTraining} className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-white transition-colors">重置</button>
                )}
              </div>
            )}
          </div>

          {/* Metric selector */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-gray-700">训练曲线</div>
            <div className="flex p-0.5 bg-gray-100 rounded-lg">
              {([['loss', 'Loss'], ['acc', 'Accuracy'], ['f1', 'F1-Score']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setMetric(k)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${metric === k ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            {displayedEpochs < 2 ? (
              <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                {trainStep === 'idle' ? '请先发起训练任务' : '等待第 2 个 Epoch 完成后显示曲线…'}
              </div>
            ) : (
              <TrainingChart epochs={displayedEpochs} metric={metric} />
            )}
          </div>

          {/* Per-epoch table */}
          {displayedEpochs >= 1 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-700">逐 Epoch 指标明细</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Epoch', 'Train Loss', 'Val Loss', 'Train Acc', 'Val Acc', 'Val F1'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {TRAINING_CURVES.slice(0, displayedEpochs).map((row, i) => (
                      <tr key={i} className={`hover:bg-gray-50 ${i === displayedEpochs - 1 && trainStep === 'running' ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-2 font-medium text-gray-800">{i + 1}</td>
                        <td className="px-4 py-2 text-red-600">{row[0].toFixed(3)}</td>
                        <td className="px-4 py-2 text-orange-500">{row[1].toFixed(3)}</td>
                        <td className="px-4 py-2 text-blue-600">{(row[2] * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2 text-indigo-500">{(row[3] * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2 text-green-600 font-medium">{(row[4] * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
