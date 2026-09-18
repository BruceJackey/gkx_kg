import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Layers,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import type { AdversarialTransferFocus } from '../data/auditPageMap';

const TABS: Array<{ id: AdversarialTransferFocus; label: string; desc: string }> = [
  {
    id: 'transfer',
    label: '跨领域知识迁移',
    desc: '定义源/目标领域，对抗学习领域不变特征',
  },
  {
    id: 'task',
    label: '知识补全任务配置',
    desc: '指定对抗迁移模型并提交补全任务',
  },
  {
    id: 'review',
    label: '补全结果审核',
    desc: '待审核三元组列表，人工通过/拒绝',
  },
];

const SOURCE_DOMAINS = [
  { id: 'fb15k', label: 'FB15k-237（通用百科）', entities: 14541, triples: 310116 },
  { id: 'wn18', label: 'WN18RR（词汇语义）', entities: 40943, triples: 93003 },
  { id: 'yago', label: 'YAGO3-10（通用实体）', entities: 123182, triples: 1089040 },
];

const TARGET_DOMAINS = [
  { id: 'bio', label: '生物医疗图谱（BioKG）', entities: 3200, triples: 8400 },
  { id: 'finance', label: '金融实体图谱', entities: 2800, triples: 6100 },
  { id: 'sci', label: '科研知识图谱', entities: 4600, triples: 9800 },
];

const RELATIONS: Record<string, string[]> = {
  bio: ['疾病-症状', '药物-适应症', '基因-功能'],
  finance: ['公司-股东', '产品-竞品', '机构-投资'],
  sci: ['作者-论文', '概念-上位词', '方法-数据集'],
};

type Pending = {
  id: string;
  head: string;
  relation: string;
  tail: string;
  score: number;
};

const DEMO_PENDING: Pending[] = [
  { id: 'c1', head: '阿司匹林', relation: '药物-适应症', tail: '心肌梗死预防', score: 0.94 },
  { id: 'c2', head: 'EGFR', relation: '基因-功能', tail: '细胞增殖调控', score: 0.88 },
  { id: 'c3', head: 'BERT', relation: '方法-数据集', tail: 'GLUE', score: 0.91 },
  { id: 'c4', head: '华润医药', relation: '公司-股东', tail: '华润集团', score: 0.81 },
];

export default function AdversarialTransferKgc({
  initialFocus = 'transfer',
}: {
  initialFocus?: AdversarialTransferFocus | null;
}) {
  const [tab, setTab] = useState<AdversarialTransferFocus>(initialFocus ?? 'transfer');
  const [srcId, setSrcId] = useState('fb15k');
  const [tgtId, setTgtId] = useState('bio');
  const [strategies, setStrategies] = useState({
    grl: true,
    discriminator: true,
    mmd: false,
  });
  const [advWeight, setAdvWeight] = useState(0.7);
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [hits10, setHits10] = useState(0.91);

  const [taskName, setTaskName] = useState('');
  const [relations, setRelations] = useState<string[]>([]);
  const [mode, setMode] = useState<'tail' | 'head' | 'both'>('tail');
  const [topK, setTopK] = useState(5);
  const [thresh, setThresh] = useState(0.6);
  const [taskId, setTaskId] = useState<string | null>(null);

  const [pending, setPending] = useState<Pending[]>(() => [...DEMO_PENDING]);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (initialFocus) setTab(initialFocus);
  }, [initialFocus]);

  const src = SOURCE_DOMAINS.find(d => d.id === srcId) ?? SOURCE_DOMAINS[0];
  const tgt = TARGET_DOMAINS.find(d => d.id === tgtId) ?? TARGET_DOMAINS[0];
  const available = RELATIONS[tgtId] ?? [];
  const short = (label: string) => label.split('（')[0];

  const summary = useMemo(() => {
    const parts = [
      `${short(src.label)} → ${short(tgt.label)}`,
      trained ? `Hits@10 ${hits10}` : '尚未训练',
      taskId ? `任务 ${taskId}` : null,
      `待审核 ${pending.length}`,
    ];
    return parts.filter(Boolean).join(' · ');
  }, [src, tgt, trained, hits10, taskId, pending.length]);

  const startTrain = () => {
    if (training) return;
    setTraining(true);
    setTrained(false);
    window.setTimeout(() => {
      setTraining(false);
      setTrained(true);
      setHits10(0.91);
    }, 900);
  };

  const submitTask = () => {
    if (!trained || !taskName.trim()) return;
    const id = `kgc_${Date.now().toString(36).slice(-5)}`;
    setTaskId(id);
    setPending(prev => [
      {
        id: `gen_${id}`,
        head: tgtId === 'bio' ? '阿司匹林' : short(tgt.label),
        relation: relations[0] || available[0] || '相关',
        tail: '（模型候选）',
        score: Math.max(thresh, 0.72),
      },
      ...prev,
    ]);
    setTab('review');
  };

  const decide = (id: string) => {
    setPending(prev => prev.filter(item => item.id !== id));
    setDone(n => n + 1);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">
            数据的统一建模与表示融合 · 基于对抗迁移学习的知识图谱补全
          </div>
          <h1 className="text-xl font-semibold text-gray-900">基于对抗迁移学习的知识图谱补全</h1>
          <p className="text-sm text-gray-500 mt-1">
            将数据丰富领域知识迁移到稀疏目标域，通过对抗学习提升知识图谱补全性能。
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

        <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
          {summary}
        </div>

        {tab === 'transfer' ? (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">跨领域知识迁移</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-gray-500">
                源领域（数据丰富）
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={srcId}
                  onChange={e => {
                    setSrcId(e.target.value);
                    setTrained(false);
                  }}
                >
                  {SOURCE_DOMAINS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <span className="block mt-1 text-[11px] text-gray-400">
                  {src.entities.toLocaleString()} 实体 · {src.triples.toLocaleString()} 三元组
                </span>
              </label>
              <label className="text-xs text-gray-500">
                目标领域（数据稀疏）
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={tgtId}
                  onChange={e => {
                    setTgtId(e.target.value);
                    setTrained(false);
                    setRelations([]);
                  }}
                >
                  {TARGET_DOMAINS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <span className="block mt-1 text-[11px] text-gray-400">
                  {tgt.entities.toLocaleString()} 实体 · {tgt.triples.toLocaleString()} 三元组
                </span>
              </label>
            </div>

            <div className="flex items-center justify-center gap-3 py-1 text-sm">
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                {short(src.label)}
              </span>
              <ArrowRight className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium">对抗迁移</span>
              <ArrowRight className="w-4 h-4 text-indigo-500" />
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                {short(tgt.label)}
              </span>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">对抗学习策略</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {(
                  [
                    ['grl', '梯度反转层', '强迫编码器学习领域不变特征'],
                    ['discriminator', '领域判别器', '对抗对齐源/目标特征'],
                    ['mmd', 'MMD 特征对齐', '软性对齐两域分布'],
                  ] as const
                ).map(([key, label, desc]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setStrategies(p => ({ ...p, [key]: !p[key] }));
                      setTrained(false);
                    }}
                    className={`text-left rounded-lg border px-3 py-2 ${
                      strategies[key] ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-xs text-gray-500">
              对抗损失权重 λ₁ · {advWeight.toFixed(2)}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                className="mt-1 w-full accent-indigo-600"
                value={advWeight}
                onChange={e => {
                  setAdvWeight(Number(e.target.value));
                  setTrained(false);
                }}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={training}
                onClick={startTrain}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
              >
                {training ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {training ? '训练中…' : trained ? '重新训练' : '启动对抗迁移训练'}
              </button>
              {trained ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Hits@10 {hits10} · MRR 0.62
                </span>
              ) : null}
              {trained ? (
                <button
                  type="button"
                  className="ml-auto text-sm text-indigo-600"
                  onClick={() => setTab('task')}
                >
                  下一步：配置补全任务 →
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {tab === 'task' ? (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">知识补全任务配置</h2>
            {!trained ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                请先完成跨领域知识迁移训练。{' '}
                <button type="button" className="underline" onClick={() => setTab('transfer')}>
                  去训练
                </button>
              </p>
            ) : null}

            <label className="block text-xs text-gray-500">
              任务名称
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={taskName}
                placeholder={`例如：${short(tgt.label)} 补全任务`}
                onChange={e => setTaskName(e.target.value)}
              />
            </label>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <Layers className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-indigo-900">adversarial-transfer-kgc-v1</div>
                <div className="text-xs text-indigo-600">
                  {short(src.label)} → {short(tgt.label)}
                  {trained ? ` · Hits@10 ${hits10}` : ' · 待训练'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2">补全关系类型</div>
              <div className="flex flex-wrap gap-2">
                {available.map(rel => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() =>
                      setRelations(prev =>
                        prev.includes(rel) ? prev.filter(r => r !== rel) : [...prev, rel]
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs border ${
                      relations.includes(rel)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="text-xs text-gray-500">
                补全方向
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={mode}
                  onChange={e => setMode(e.target.value as typeof mode)}
                >
                  <option value="tail">预测尾实体</option>
                  <option value="head">预测头实体</option>
                  <option value="both">双向</option>
                </select>
              </label>
              <label className="text-xs text-gray-500">
                Top-K
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  value={topK}
                  onChange={e => setTopK(Number(e.target.value))}
                >
                  {[3, 5, 10, 20].map(k => (
                    <option key={k} value={k}>
                      Top-{k}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-500">
                置信度阈值 {thresh.toFixed(2)}
                <input
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  className="mt-2 w-full accent-indigo-600"
                  value={thresh}
                  onChange={e => setThresh(Number(e.target.value))}
                />
              </label>
            </div>

            <button
              type="button"
              disabled={!trained || !taskName.trim()}
              onClick={submitTask}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
            >
              <Play className="w-4 h-4" /> 发起知识补全任务
            </button>
          </section>
        ) : null}

        {tab === 'review' ? (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-indigo-600" /> 补全结果审核
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  待审核 {pending.length} · 已处理 {done}
                </p>
              </div>
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded-lg"
                onClick={() => {
                  setPending([...DEMO_PENDING]);
                  setDone(0);
                }}
              >
                重置演示
              </button>
            </div>

            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">暂无待审核三元组</p>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 font-medium">头实体</th>
                      <th className="text-left px-4 py-2.5 font-medium">关系</th>
                      <th className="text-left px-4 py-2.5 font-medium">尾实体</th>
                      <th className="text-left px-4 py-2.5 font-medium">置信度</th>
                      <th className="text-right px-4 py-2.5 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.head}</td>
                        <td className="px-4 py-3 text-indigo-700">{item.relation}</td>
                        <td className="px-4 py-3 text-gray-900">{item.tail}</td>
                        <td className="px-4 py-3 text-indigo-700 font-semibold">
                          {item.score.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => decide(item.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white"
                            >
                              <Check className="w-3 h-3" /> 通过
                            </button>
                            <button
                              type="button"
                              onClick={() => decide(item.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600"
                            >
                              <X className="w-3 h-3" /> 拒绝
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
