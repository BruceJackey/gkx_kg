import { useState, useMemo, type ReactNode } from 'react';
import {
  ArrowRight, Play, Plus, X, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Layers, RefreshCw, Download, Info,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, BarChart, Bar,
} from 'recharts';

// ── mock data ─────────────────────────────────────────────────────────────────

const SOURCE_DOMAINS = [
  { id: 'fb15k', label: 'FB15k-237（通用百科）', entities: 14541, triples: 310116, density: 0.032 },
  { id: 'wn18',  label: 'WN18RR（词汇语义）',   entities: 40943, triples: 93003,  density: 0.011 },
  { id: 'yago',  label: 'YAGO3-10（通用实体）',  entities: 123182, triples: 1089040, density: 0.072 },
  { id: 'nell',  label: 'NELL-995（网络学习）',  entities: 75492, triples: 154213, density: 0.021 },
];

const TARGET_DOMAINS = [
  { id: 'bio',     label: '生物医疗图谱（BioKG）', entities: 3200,  triples: 8400,  density: 0.008 },
  { id: 'finance', label: '金融实体图谱',           entities: 2800,  triples: 6100,  density: 0.006 },
  { id: 'law',     label: '法律概念图谱',            entities: 1900,  triples: 4200,  density: 0.012 },
  { id: 'sci',     label: '科研知识图谱',             entities: 4600,  triples: 9800,  density: 0.005 },
];

const RELATION_TYPES_BY_TARGET: Record<string, string[]> = {
  bio:     ['疾病-症状', '药物-适应症', '基因-功能', '蛋白质-相互作用'],
  finance: ['公司-股东', '产品-竞品', '机构-投资'],
  law:     ['法规-适用范围', '案件-判决依据', '主体-权利'],
  sci:     ['作者-论文', '机构-研究方向', '概念-上位词', '方法-数据集'],
};

const TRAINING_CURVE: { epoch: number; src_loss: number; adv_loss: number; tgt_hits10: number }[] = [
  { epoch: 1,  src_loss: 1.82, adv_loss: 0.89, tgt_hits10: 0.31 },
  { epoch: 5,  src_loss: 1.41, adv_loss: 0.72, tgt_hits10: 0.48 },
  { epoch: 10, src_loss: 1.12, adv_loss: 0.61, tgt_hits10: 0.62 },
  { epoch: 20, src_loss: 0.86, adv_loss: 0.52, tgt_hits10: 0.74 },
  { epoch: 30, src_loss: 0.71, adv_loss: 0.48, tgt_hits10: 0.81 },
  { epoch: 40, src_loss: 0.62, adv_loss: 0.50, tgt_hits10: 0.87 },
  { epoch: 50, src_loss: 0.58, adv_loss: 0.51, tgt_hits10: 0.89 },
  { epoch: 60, src_loss: 0.55, adv_loss: 0.50, tgt_hits10: 0.91 },
];

const COMPLETION_EXAMPLES = [
  { head: '阿司匹林', relation: '药物-适应症', tail: '?', candidates: ['心肌梗死预防', '头痛缓解', '发热治疗', '血栓预防'], answer: 0, score: 0.94 },
  { head: '张三', relation: '就职于', tail: '?', candidates: ['北京大学', '清华大学', '中科院', '腾讯研究院'], answer: 2, score: 0.88 },
  { head: 'BERT', relation: '用于任务', tail: '?', candidates: ['文本分类', '命名实体识别', '机器翻译', '图像识别'], answer: 1, score: 0.91 },
];

const BENCHMARK_COMPARE = [
  { method: '无迁移（仅目标域）', hits1: 0.23, hits10: 0.48, mrr: 0.31 },
  { method: '直接迁移（无对抗）', hits1: 0.35, hits10: 0.64, mrr: 0.44 },
  { method: '对抗迁移（本模型）', hits1: 0.51, hits10: 0.91, mrr: 0.62 },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function Section({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <span className="font-medium text-gray-800">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function AdversarialTransferDemo() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transfer: true, task: false,
  });
  const toggle = (s: string) => setOpenSections(p => ({ ...p, [s]: !p[s] }));

  // ── Section 1: 跨领域知识迁移 ──
  const [srcId, setSrcId] = useState('fb15k');
  const [tgtId, setTgtId] = useState('bio');
  const [advWeight, setAdvWeight] = useState(0.7);
  const [alignWeight, setAlignWeight] = useState(0.5);
  const [embedDim, setEmbedDim] = useState(256);
  const [strategyEnabled, setStrategyEnabled] = useState({ gradient_reversal: true, domain_discriminator: true, feature_alignment: false });
  const [trained, setTrained] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainEpoch, setTrainEpoch] = useState(0);

  const srcDomain = SOURCE_DOMAINS.find(d => d.id === srcId)!;
  const tgtDomain = TARGET_DOMAINS.find(d => d.id === tgtId)!;

  const startTraining = () => {
    if (training || trained) return;
    setTraining(true);
    setTrainEpoch(0);
    let ep = 0;
    const interval = setInterval(() => {
      ep += 1;
      setTrainEpoch(ep);
      if (ep >= TRAINING_CURVE.length) {
        clearInterval(interval);
        setTraining(false);
        setTrained(true);
      }
    }, 300);
  };

  const curveData = useMemo(() => TRAINING_CURVE.slice(0, trainEpoch + 1), [trainEpoch]);
  const latestMetric = curveData[curveData.length - 1] ?? TRAINING_CURVE[0];

  // ── Section 2: 知识补全任务配置 ──
  const [taskName, setTaskName] = useState('');
  const [taskRelations, setTaskRelations] = useState<string[]>([]);
  const [taskMode, setTaskMode] = useState<'tail' | 'head' | 'both'>('tail');
  const [taskTopK, setTaskTopK] = useState(5);
  const [taskThresh, setTaskThresh] = useState(0.6);
  const [taskSubmitted, setTaskSubmitted] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);

  const availableRelations = RELATION_TYPES_BY_TARGET[tgtId] ?? [];
  const toggleTaskRelation = (r: string) => setTaskRelations(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);

  const submitTask = () => {
    if (!taskName.trim()) return;
    setTaskSubmitted(true);
  };

  const demoExample = COMPLETION_EXAMPLES[demoIdx];

  return (
    <div className="space-y-4">
      {/* ── Section 1: 跨领域知识迁移 ── */}
      <Section title="跨领域知识迁移" open={openSections.transfer} onToggle={() => toggle('transfer')}>
        <div className="space-y-6">
          {/* domain pair */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">源领域（数据丰富）</label>
              <select value={srcId} onChange={e => { setSrcId(e.target.value); setTrained(false); setTrainEpoch(0); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                {SOURCE_DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span>{srcDomain.entities.toLocaleString()} 实体</span>
                <span>{srcDomain.triples.toLocaleString()} 三元组</span>
                <span>密度 {srcDomain.density}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">目标领域（数据稀疏）</label>
              <select value={tgtId} onChange={e => { setTgtId(e.target.value); setTrained(false); setTrainEpoch(0); setTaskRelations([]); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                {TARGET_DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span>{tgtDomain.entities.toLocaleString()} 实体</span>
                <span>{tgtDomain.triples.toLocaleString()} 三元组</span>
                <span>密度 {tgtDomain.density}</span>
              </div>
            </div>
          </div>

          {/* domain arrow */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-800">{srcDomain.label.split('（')[0]}</div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-6 h-6 text-indigo-500" />
              <span className="text-xs text-indigo-500 font-medium mt-0.5">对抗迁移</span>
            </div>
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800">{tgtDomain.label.split('（')[0]}</div>
          </div>

          {/* adversarial strategies */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">对抗学习策略</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'gradient_reversal' as const,   label: '梯度反转层',     desc: '反转领域分类梯度，强迫编码器提取领域不变特征' },
                { key: 'domain_discriminator' as const, label: '领域判别器',     desc: '独立判别器区分源/目标领域特征，对抗训练对齐' },
                { key: 'feature_alignment' as const,   label: 'MMD 特征对齐',   desc: '最小化最大均值差异，软性对齐两域分布' },
              ] as const).map(s => (
                <button key={s.key}
                  onClick={() => setStrategyEnabled(p => ({ ...p, [s.key]: !p[s.key] }))}
                  className={`text-left p-3 rounded-xl border transition-all ${strategyEnabled[s.key] ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${strategyEnabled[s.key] ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`} />
                    <span className={`text-xs font-medium ${strategyEnabled[s.key] ? 'text-indigo-800' : 'text-gray-600'}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* hyperparams */}
          <div className="grid grid-cols-3 gap-5">
            {([
              { label: '对抗损失权重 λ₁', val: advWeight, set: setAdvWeight, min: 0, max: 1, step: 0.05 },
              { label: '对齐损失权重 λ₂', val: alignWeight, set: setAlignWeight, min: 0, max: 1, step: 0.05 },
              { label: '嵌入维度 d', val: embedDim, set: setEmbedDim, min: 64, max: 512, step: 64 },
            ]).map(p => (
              <div key={p.label}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600">{p.label}</label>
                  <span className="text-xs font-mono font-semibold text-gray-800">{p.val}</span>
                </div>
                <input type="range" min={p.min} max={p.max} step={p.step} value={p.val}
                  onChange={e => { p.set(Number(e.target.value) as any); setTrained(false); setTrainEpoch(0); }}
                  className="w-full h-1.5 rounded-full accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-300 mt-0.5"><span>{p.min}</span><span>{p.max}</span></div>
              </div>
            ))}
          </div>

          {/* training button + status */}
          <div className="flex items-center gap-4">
            <button onClick={startTraining} disabled={training || trained}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${training || trained ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {training ? <RefreshCw className="w-4 h-4 animate-spin" /> : trained ? <CheckCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {training ? `训练中… (Epoch ${TRAINING_CURVE[trainEpoch - 1]?.epoch ?? 1})` : trained ? '训练完成' : '启动对抗迁移训练'}
            </button>
            {trained && (
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">Hits@10 <span className="font-bold text-emerald-600">{latestMetric.tgt_hits10}</span></span>
                <span className="text-gray-500">MRR <span className="font-bold text-emerald-600">0.62</span></span>
              </div>
            )}
            {trained && (
              <button onClick={() => { setTrained(false); setTrainEpoch(0); }}
                className="ml-auto px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50">
                重置
              </button>
            )}
          </div>

          {/* training curve */}
          {(training || trained) && curveData.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-3">训练过程监控</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={curveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="epoch" tick={{ fontSize: 10 }} label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="src_loss" stroke="#6366f1" dot={false} name="源域损失" strokeWidth={2} />
                  <Line type="monotone" dataKey="adv_loss" stroke="#f59e0b" dot={false} name="对抗损失" strokeWidth={2} />
                  <Line type="monotone" dataKey="tgt_hits10" stroke="#22c55e" dot={false} name="目标域 Hits@10" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* benchmark comparison */}
          {trained && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-700 mb-3">方法对比（目标域评估）</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={BENCHMARK_COMPARE} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 1]} />
                  <YAxis type="category" dataKey="method" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="hits10" fill="#6366f1" name="Hits@10" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="mrr" fill="#22c55e" name="MRR" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Section>

      {/* ── Section 2: 知识补全任务配置 ── */}
      <Section title="知识补全任务配置" open={openSections.task} onToggle={() => toggle('task')}>
        {!trained && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            请先在"跨领域知识迁移"中完成训练，再发起补全任务。
          </div>
        )}
        <div className={`space-y-5 ${!trained ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* task form */}
          {!taskSubmitted ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">任务名称</label>
                <input value={taskName} onChange={e => setTaskName(e.target.value)}
                  placeholder={`例如：${tgtDomain.label.split('（')[0]} 补全任务 2026-08`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">指定补全模型</label>
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <Layers className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-indigo-800">基于对抗迁移学习的知识图谱补全 v1.0.0</div>
                    <div className="text-xs text-indigo-500">
                      源域: {srcDomain.label.split('（')[0]} → 目标域: {tgtDomain.label.split('（')[0]} · Hits@10: {latestMetric.tgt_hits10}
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  补全关系类型 <span className="text-gray-400">（留空表示全部）</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableRelations.map(r => (
                    <button key={r} onClick={() => toggleTaskRelation(r)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${taskRelations.includes(r) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                      {taskRelations.includes(r) && <span className="mr-1">✓</span>}{r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">补全方向</label>
                  <select value={taskMode} onChange={e => setTaskMode(e.target.value as typeof taskMode)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    <option value="tail">预测尾实体（h, r, ?）</option>
                    <option value="head">预测头实体（?, r, t）</option>
                    <option value="both">双向补全</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Top-K 候选数</label>
                  <select value={taskTopK} onChange={e => setTaskTopK(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                    {[3, 5, 10, 20].map(k => <option key={k} value={k}>Top-{k}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-gray-600">置信度阈值</label>
                    <span className="text-xs font-mono font-semibold text-gray-800">{taskThresh.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.3} max={0.95} step={0.05} value={taskThresh}
                    onChange={e => setTaskThresh(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-indigo-600" />
                </div>
              </div>

              <button onClick={submitTask} disabled={!taskName.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${taskName.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                <Play className="w-4 h-4" />发起知识补全任务
              </button>
            </div>
          ) : (
            /* task submitted state */
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-medium text-emerald-800">任务已提交：{taskName}</div>
                  <div className="text-xs text-emerald-600 mt-0.5">
                    模型: 对抗迁移 v1.0.0 · 方向: {taskMode === 'tail' ? '预测尾实体' : taskMode === 'head' ? '预测头实体' : '双向'} · Top-{taskTopK} · 阈值 {taskThresh.toFixed(2)}
                  </div>
                </div>
                <button onClick={() => { setTaskSubmitted(false); setAnswered(null); }} className="ml-auto px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-lg text-xs hover:bg-emerald-100">
                  重新配置
                </button>
              </div>

              {/* interactive completion demo */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-800">交互式补全示例</p>
                  <div className="flex gap-1.5">
                    {COMPLETION_EXAMPLES.map((_, i) => (
                      <button key={i} onClick={() => { setDemoIdx(i); setAnswered(null); }}
                        className={`w-6 h-6 rounded-full text-xs border transition-colors ${demoIdx === i ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">{demoExample.head}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-800 text-sm rounded-lg">{demoExample.relation}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="px-3 py-1.5 bg-gray-200 text-gray-500 text-sm rounded-lg font-medium">?</span>
                  <span className="ml-auto text-xs text-gray-400">模型置信度 {demoExample.score}</span>
                </div>

                <p className="text-xs text-gray-500 mb-3">请选择你认为正确的候选答案：</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoExample.candidates.map((c, i) => {
                    const isCorrect = i === demoExample.answer;
                    const isSelected = answered === i;
                    return (
                      <button key={i} onClick={() => answered === null && setAnswered(i)}
                        className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          answered === null ? 'hover:border-blue-300 hover:bg-blue-50 border-gray-200' :
                          isCorrect ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-medium' :
                          isSelected ? 'bg-red-50 border-red-300 text-red-700' :
                          'border-gray-100 text-gray-400'
                        }`}>
                        <span className="mr-2 font-mono text-xs text-gray-400">{String.fromCharCode(65 + i)}.</span>
                        {c}
                        {answered !== null && isCorrect && <span className="ml-2 text-xs">✓ 模型首选</span>}
                      </button>
                    );
                  })}
                </div>
                {answered !== null && (
                  <div className={`mt-3 p-3 rounded-xl text-sm ${answered === demoExample.answer ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {answered === demoExample.answer ? '✓ 正确！模型预测与你选择一致。' : `模型首选「${demoExample.candidates[demoExample.answer]}」（置信度 ${demoExample.score}），你的选择也有参考价值。`}
                  </div>
                )}
              </div>

              {/* task result summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-800">预估任务结果</p>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-white">
                    <Download className="w-3.5 h-3.5" />导出结果
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '待补全三元组', value: tgtDomain.triples.toLocaleString() },
                    { label: '预计新增三元组', value: Math.round(tgtDomain.triples * 0.23).toLocaleString() },
                    { label: '平均置信度', value: demoExample.score },
                    { label: '预计时长', value: `~${Math.round(tgtDomain.triples / 1000 * 2.4)} 分钟` },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                      <div className="font-bold text-gray-900">{s.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
