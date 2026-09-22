import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, XCircle, Plus, Terminal,
  Loader2, HardDrive, Layers, Database, Library,
} from 'lucide-react';

type TaskStatus = 'idle' | 'running' | 'paused' | 'cancelled' | 'completed';

interface BilingualDoc {
  id: string;
  titleZh: string;
  titleEn: string;
  abstractZh: string;
  abstractEn: string;
  journal?: string;
  year?: number;
  type?: string;
}

interface KnowledgeBaseOption {
  id: string;
  name: string;
  desc: string;
  docs: BilingualDoc[];
}

interface AlignPair {
  zh: string;
  en: string;
  type?: string;
}

interface AlignTask {
  id: string;
  name: string;
  kbId: string;
  kbName: string;
  docs: BilingualDoc[];
  pairs: AlignPair[];
  status: TaskStatus;
  progress: number;
  aligned: number;
  createdAt: string;
  finishedAt?: string;
  stored: boolean;
}

const KNOWLEDGE_BASES: KnowledgeBaseOption[] = [
  {
    id: 'kb_ai',
    name: '人工智能前沿文献库',
    desc: '深度学习 / 大模型 / 知识图谱方向中英文献',
    docs: [
      {
        id: 'd1',
        titleZh: '大规模预训练语言模型综述',
        titleEn: 'A Survey of Large-Scale Pre-trained Language Models',
        abstractZh: '本文系统梳理了预训练语言模型的发展脉络，覆盖 BERT、GPT、T5 等代表性架构，并讨论其在自然语言理解与生成任务中的表现。',
        abstractEn: 'This survey reviews the evolution of pre-trained language models, covering BERT, GPT, T5 and related architectures, and discusses their performance on NLU and NLG tasks.',
        journal: '计算机学报',
        year: 2024,
        type: '综述',
      },
      {
        id: 'd2',
        titleZh: '图神经网络在知识图谱补全中的应用',
        titleEn: 'Graph Neural Networks for Knowledge Graph Completion',
        abstractZh: '针对知识图谱中缺失三元组问题，提出基于消息传递的图神经网络补全框架，在基准数据集上显著优于传统嵌入方法。',
        abstractEn: 'We propose a message-passing GNN framework for completing missing triples in knowledge graphs, outperforming classical embedding methods on standard benchmarks.',
        journal: 'AAAI',
        year: 2023,
        type: '论文',
      },
      {
        id: 'd3',
        titleZh: '跨语言实体对齐的多策略融合方法',
        titleEn: 'Multi-Strategy Fusion for Cross-Lingual Entity Alignment',
        abstractZh: '融合翻译增强、跨语言嵌入空间对齐与结构相似度三类信号，实现高精度的跨语言实体对齐。',
        abstractEn: 'We fuse translation enhancement, cross-lingual embedding alignment and structural similarity to achieve high-precision cross-lingual entity alignment.',
        journal: 'ACL',
        year: 2024,
        type: '论文',
      },
      {
        id: 'd4',
        titleZh: '联邦学习中的隐私保护机制',
        titleEn: 'Privacy-Preserving Mechanisms in Federated Learning',
        abstractZh: '分析差分隐私、安全聚合与同态加密在联邦学习中的权衡，给出面向科研场景的部署建议。',
        abstractEn: 'We analyze the trade-offs among differential privacy, secure aggregation and homomorphic encryption in federated learning, and provide deployment guidance for research settings.',
        journal: 'Nature Machine Intelligence',
        year: 2022,
        type: '论文',
      },
    ],
  },
  {
    id: 'kb_bio',
    name: '生物医学双语知识库',
    desc: '药物发现 / 分子活性相关中英文献',
    docs: [
      {
        id: 'b1',
        titleZh: '小分子药物虚拟筛选方法进展',
        titleEn: 'Advances in Virtual Screening for Small-Molecule Drugs',
        abstractZh: '综述基于结构与基于配体的虚拟筛选技术，比较对接打分与深度学习预测模型的精度与吞吐。',
        abstractEn: 'This review covers structure-based and ligand-based virtual screening, comparing docking scores with deep learning predictors in accuracy and throughput.',
        journal: '药学学报',
        year: 2023,
        type: '综述',
      },
      {
        id: 'b2',
        titleZh: '蛋白质-配体相互作用的图表示学习',
        titleEn: 'Graph Representation Learning for Protein–Ligand Interactions',
        abstractZh: '将蛋白质口袋与配体建模为异构图，通过图注意力网络预测结合亲和力。',
        abstractEn: 'We model protein pockets and ligands as heterogeneous graphs and predict binding affinity with graph attention networks.',
        journal: 'Bioinformatics',
        year: 2024,
        type: '论文',
      },
      {
        id: 'b3',
        titleZh: '多模态生物医学知识图谱构建',
        titleEn: 'Building Multimodal Biomedical Knowledge Graphs',
        abstractZh: '整合文献、实验数据与本体，构建覆盖疾病—基因—药物的多模态知识图谱。',
        abstractEn: 'We integrate literature, experimental data and ontologies to build a multimodal knowledge graph covering disease–gene–drug relations.',
        journal: 'Nucleic Acids Research',
        year: 2022,
        type: '论文',
      },
    ],
  },
  {
    id: 'kb_energy',
    name: '新能源材料知识库',
    desc: '电池 / 催化 / 光伏方向中英文献',
    docs: [
      {
        id: 'e1',
        titleZh: '固态锂电池电解质界面稳定性研究',
        titleEn: 'Interface Stability of Solid-State Lithium Battery Electrolytes',
        abstractZh: '通过原位表征与第一性原理计算，阐明固态电解质—电极界面副反应路径并提出抑制策略。',
        abstractEn: 'Combining in-situ characterization and first-principles calculations, we elucidate side-reaction pathways at the solid electrolyte–electrode interface and propose mitigation strategies.',
        journal: 'Advanced Energy Materials',
        year: 2024,
        type: '论文',
      },
      {
        id: 'e2',
        titleZh: '钙钛矿太阳能电池材料设计进展',
        titleEn: 'Progress in Materials Design for Perovskite Solar Cells',
        abstractZh: '总结组分工程与界面钝化对器件效率与稳定性的影响，展望产业化路径。',
        abstractEn: 'We summarize how compositional engineering and interface passivation affect device efficiency and stability, and outline paths toward industrialization.',
        journal: 'Science',
        year: 2023,
        type: '综述',
      },
    ],
  },
];

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  idle: { label: '待执行', color: 'text-gray-600', bg: 'bg-gray-100' },
  running: { label: '运行中', color: 'text-blue-700', bg: 'bg-blue-50' },
  paused: { label: '已暂停', color: 'text-amber-700', bg: 'bg-amber-50' },
  cancelled: { label: '已取消', color: 'text-red-600', bg: 'bg-red-50' },
  completed: { label: '已完成', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

function nowStr() {
  return new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
}

export type CrossLingualKbFocus = 'tasks' | 'storage';

export default function CrossLingualKbAlignment({
  initialFocus: _initialFocus,
}: {
  initialFocus?: CrossLingualKbFocus | null;
}) {
  const [selectedKbId, setSelectedKbId] = useState(KNOWLEDGE_BASES[0]?.id ?? '');
  const [tasks, setTasks] = useState<AlignTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedKb = KNOWLEDGE_BASES.find((k) => k.id === selectedKbId) ?? null;
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${nowStr()}] ${msg}`]);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const createTask = () => {
    if (!selectedKb) return;
    clearTimer();
    const id = `BAT-${Date.now().toString(36).toUpperCase()}`;
    const pairs = selectedKb.docs.map((d) => ({
      zh: d.titleZh,
      en: d.titleEn,
      type: d.type,
    }));
    const task: AlignTask = {
      id,
      name: `${selectedKb.name} · 跨语言对齐`,
      kbId: selectedKb.id,
      kbName: selectedKb.name,
      docs: selectedKb.docs,
      pairs,
      status: 'idle',
      progress: 0,
      aligned: 0,
      createdAt: nowStr(),
      stored: false,
    };
    setTasks((prev) => [task, ...prev]);
    setSelectedId(id);
    setLogs([]);
    appendLog(`已从知识库「${selectedKb.name}」创建任务（${selectedKb.docs.length} 篇文献）`);
  };

  const runTaskTick = (taskId: string) => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task || task.status !== 'running') {
          clearTimer();
          return prev;
        }
        const step = Math.max(1, Math.ceil(task.docs.length / 6));
        const nextAligned = Math.min(task.docs.length, task.aligned + step);
        const nextProgress = Math.round((nextAligned / task.docs.length) * 100);
        const done = nextAligned >= task.docs.length;

        if (done) {
          clearTimer();
          setLogs((prevLogs) => [
            ...prevLogs,
            `[${nowStr()}] 对齐完成：共 ${task.docs.length} 篇文献`,
            `[${nowStr()}] 正在写入对齐结果库…`,
            `[${nowStr()}] 入库成功：对齐关系已持久化存储`,
          ]);
          return prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  aligned: nextAligned,
                  progress: 100,
                  status: 'completed' as TaskStatus,
                  finishedAt: nowStr(),
                  stored: true,
                }
              : t,
          );
        }

        const doc = task.docs[nextAligned - 1];
        if (doc) {
          setLogs((prevLogs) => [
            ...prevLogs,
            `[${nowStr()}] 对齐 ${nextAligned}/${task.docs.length}：${doc.titleZh} ↔ ${doc.titleEn}`,
          ]);
        }

        return prev.map((t) =>
          t.id === taskId ? { ...t, aligned: nextAligned, progress: nextProgress } : t,
        );
      });
    }, 450);
  };

  const startTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === 'completed' || task.status === 'cancelled') return;
    setSelectedId(taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'running' as TaskStatus } : t)),
    );
    appendLog(task.status === 'paused' ? `任务恢复执行：${task.name}` : `开始执行任务：${task.name}`);
    runTaskTick(taskId);
  };

  const pauseTask = (taskId: string) => {
    clearTimer();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId && t.status === 'running' ? { ...t, status: 'paused' as TaskStatus } : t)),
    );
    appendLog('任务已暂停');
  };

  const cancelTask = (taskId: string) => {
    clearTimer();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId && (t.status === 'running' || t.status === 'paused' || t.status === 'idle')
          ? { ...t, status: 'cancelled' as TaskStatus, finishedAt: nowStr() }
          : t,
      ),
    );
    appendLog('任务已取消');
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">跨语言知识库生成与对齐</h1>
        <p className="text-sm text-gray-400">
          选择知识库创建对齐任务；点击任务列表中的任务，即可在右侧「对齐结果存储」中查看文献双语内容
        </p>
      </div>

      <div className="max-w-6xl space-y-4 pb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">创建对齐任务</div>
              <p className="text-xs text-gray-500">
                选择已有知识库即可，无需上传批量数据；创建后可执行 / 暂停 / 取消
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" />
                选择知识库
              </span>
              <select
                value={selectedKbId}
                onChange={(e) => setSelectedKbId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 bg-white"
              >
                {KNOWLEDGE_BASES.map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name}（{kb.docs.length} 篇）
                  </option>
                ))}
              </select>
            </label>
            {selectedKb && (
              <div className="rounded-lg border border-gray-100 bg-slate-50 px-3 py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{selectedKb.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {selectedKb.docs.length} 篇文献
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">zh ↔ en</span>
                </div>
                <p className="text-xs text-gray-500">{selectedKb.desc}</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {selectedKb.docs.slice(0, 3).map((d) => (
                    <li key={d.id}>
                      {d.titleZh}
                      <span className="text-gray-400"> / {d.titleEn}</span>
                    </li>
                  ))}
                  {selectedKb.docs.length > 3 && (
                    <li className="text-gray-400">… 共 {selectedKb.docs.length} 篇</li>
                  )}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={createTask}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建对齐任务
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-800">任务列表</span>
                <span className="text-xs text-gray-400 ml-auto">{tasks.length} 个任务</span>
              </div>
              <p className="px-4 pt-2 text-[11px] text-gray-400">点击任务查看对齐结果存储</p>
              {tasks.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-400">暂无任务，请先选择知识库并创建</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tasks.map((t) => {
                    const meta = STATUS_META[t.status];
                    const active = selectedId === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`px-4 py-3 space-y-2 cursor-pointer transition-colors ${active ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                        onClick={() => setSelectedId(t.id)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{t.name}</span>
                          <span className="text-[11px] font-mono text-gray-400">{t.id}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                          {t.stored && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                              <HardDrive className="w-3 h-3" /> 已入库
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {t.kbName} · {t.docs.length} 篇 · {t.createdAt}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                t.status === 'cancelled' ? 'bg-red-400' : t.status === 'paused' ? 'bg-amber-400' : t.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] tabular-nums text-gray-500 w-20 text-right">
                            {t.aligned}/{t.docs.length} ({t.progress}%)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {(t.status === 'idle' || t.status === 'paused') && (
                            <button
                              type="button"
                              onClick={() => startTask(t.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <Play className="w-3 h-3" /> {t.status === 'paused' ? '恢复' : '执行'}
                            </button>
                          )}
                          {t.status === 'running' && (
                            <button
                              type="button"
                              onClick={() => pauseTask(t.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            >
                              <Pause className="w-3 h-3" /> 暂停
                            </button>
                          )}
                          {(t.status === 'idle' || t.status === 'running' || t.status === 'paused') && (
                            <button
                              type="button"
                              onClick={() => cancelTask(t.id)}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                            >
                              <XCircle className="w-3 h-3" /> 取消
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">对齐结果存储</span>
              </div>
              {!selected ? (
                <div className="px-4 py-12 text-center text-sm text-gray-400">
                  点击左侧任务，查看该知识库文献的双语对齐结果
                </div>
              ) : (
                <div className="p-4 space-y-3 max-h-[560px] overflow-y-auto">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>
                      知识库：<strong className="text-gray-800">{selected.kbName}</strong>
                    </span>
                    <span className="font-mono text-gray-400">{selected.id}</span>
                    <span className={`px-2 py-0.5 rounded-full ${STATUS_META[selected.status].bg} ${STATUS_META[selected.status].color}`}>
                      {STATUS_META[selected.status].label}
                    </span>
                  </div>
                  {selected.docs.map((doc) => (
                    <article key={doc.id} className="rounded-lg border border-gray-100 p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                        {doc.year && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{doc.year}</span>}
                        {doc.journal && <span>{doc.journal}</span>}
                        {doc.type && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{doc.type}</span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] font-semibold text-blue-600 mb-1">中文</div>
                          <div className="text-sm font-medium text-gray-900 mb-1">{doc.titleZh}</div>
                          <p className="text-xs text-gray-600 leading-relaxed">{doc.abstractZh}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-blue-600 mb-1">English</div>
                          <div className="text-sm font-medium text-gray-900 mb-1">{doc.titleEn}</div>
                          <p className="text-xs text-gray-600 leading-relaxed">{doc.abstractEn}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-800">执行日志</span>
              {selected?.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin ml-1" />}
              {selected && <span className="ml-auto text-[11px] text-gray-400">{selected.id}</span>}
            </div>
            <div className="bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed px-4 py-3 max-h-56 overflow-y-auto min-h-[120px]">
              {logs.length === 0 ? (
                <span className="text-slate-500">创建并执行任务后，日志将在此滚动展示…</span>
              ) : (
                logs.map((line, i) => (
                  <div key={`${i}-${line}`} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
