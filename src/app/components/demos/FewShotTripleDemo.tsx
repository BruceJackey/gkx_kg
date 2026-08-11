import { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle, Plus, X, Trash2, Zap, Info, ChevronRight, Star } from 'lucide-react';

// ── domain data ───────────────────────────────────────────────────────────────

const EXISTING_RELATIONS = [
  { id: 'work_at', label: '就职于', triples: 1820, domain: '人物-机构' },
  { id: 'located_in', label: '位于', triples: 2340, domain: '地点-地点' },
  { id: 'founded_by', label: '创立于', triples: 980, domain: '机构-人物' },
  { id: 'graduated_from', label: '毕业于', triples: 1150, domain: '人物-高校' },
  { id: 'partner_of', label: '合作方', triples: 670, domain: '机构-机构' },
];

const META_TASK_TEMPLATES = [
  {
    id: 't1', relation: '就职于', support: 5, query: 15,
    supportExamples: [
      { h: '张明', r: '就职于', t: '清华大学', label: 1 },
      { h: '李华', r: '就职于', t: '北京大学', label: 1 },
      { h: '王芳', r: '就职于', t: '中科院', label: 1 },
      { h: '陈刚', r: '位于', t: '北京', label: 0 },
      { h: '刘敏', r: '创立于', t: '2010年', label: 0 },
    ],
  },
  {
    id: 't2', relation: '位于', support: 5, query: 15,
    supportExamples: [
      { h: '清华大学', r: '位于', t: '北京', label: 1 },
      { h: '浦东新区', r: '位于', t: '上海', label: 1 },
      { h: '中关村', r: '位于', t: '海淀区', label: 1 },
      { h: '张明', r: '就职于', t: '清华大学', label: 0 },
      { h: '苹果', r: '创立于', t: '乔布斯', label: 0 },
    ],
  },
  {
    id: 't3', relation: '创立于', support: 5, query: 15,
    supportExamples: [
      { h: '字节跳动', r: '创立于', t: '张一鸣', label: 1 },
      { h: '阿里巴巴', r: '创立于', t: '马云', label: 1 },
      { h: '腾讯', r: '创立于', t: '马化腾', label: 1 },
      { h: '北京', r: '位于', t: '中国', label: 0 },
      { h: '李华', r: '毕业于', t: '复旦大学', label: 0 },
    ],
  },
];

// ── prototype network visualiser ──────────────────────────────────────────────

interface ProtoPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'support' | 'query' | 'proto';
  relationClass: number;
}

const RELATION_CONFIGS = [
  { name: '就职于', color: '#6366f1', bg: '#eef2ff' },
  { name: '位于',   color: '#22c55e', bg: '#f0fdf4' },
  { name: '创立于', color: '#f59e0b', bg: '#fffbeb' },
];

function makePoints(nShot: number): ProtoPoint[] {
  const pts: ProtoPoint[] = [];
  const clusters = [
    { cx: 100, cy: 90,  cls: 0, supports: [{ x: 85, y: 80, l: '(张明,清华)' }, { x: 115, y: 75, l: '(李华,北大)' }, { x: 95, y: 105, l: '(王芳,中科院)' }, { x: 108, y: 95, l: '(陈刚,复旦)' }, { x: 90, y: 112, l: '(刘敏,南大)' }] },
    { cx: 260, cy: 80,  cls: 1, supports: [{ x: 248, y: 68, l: '(清华,北京)' }, { x: 272, y: 74, l: '(浦东,上海)' }, { x: 255, y: 92, l: '(中关村,海淀)' }, { x: 268, y: 85, l: '(西湖,杭州)' }, { x: 250, y: 98, l: '(滴水湖,临港)' }] },
    { cx: 185, cy: 165, cls: 2, supports: [{ x: 172, y: 155, l: '(字节,张一鸣)' }, { x: 196, y: 150, l: '(阿里,马云)' }, { x: 180, y: 175, l: '(腾讯,马化腾)' }, { x: 195, y: 168, l: '(百度,李彦宏)' }, { x: 174, y: 178, l: '(京东,刘强东)' }] },
  ];

  clusters.forEach(cl => {
    const slice = cl.supports.slice(0, nShot);
    slice.forEach((s, i) => {
      pts.push({ id: `s_${cl.cls}_${i}`, label: s.l, x: s.x, y: s.y, type: 'support', relationClass: cl.cls });
    });
    const protoX = slice.reduce((a, b) => a + b.x, 0) / slice.length;
    const protoY = slice.reduce((a, b) => a + b.y, 0) / slice.length;
    pts.push({ id: `p_${cl.cls}`, label: RELATION_CONFIGS[cl.cls].name, x: protoX, y: protoY, type: 'proto', relationClass: cl.cls });
  });

  // query points
  const queries = [
    { x: 88, y: 88, cls: 0, l: 'Q1' }, { x: 280, y: 72, cls: 1, l: 'Q2' }, { x: 200, y: 160, cls: 2, l: 'Q3' },
    { x: 105, y: 118, cls: 0, l: 'Q4' }, { x: 250, y: 105, cls: 1, l: 'Q5' },
  ];
  queries.forEach((q, i) => pts.push({ id: `q_${i}`, label: q.l, x: q.x, y: q.y, type: 'query', relationClass: q.cls }));
  return pts;
}

function ProtoNetViz({ nShot }: { nShot: number }) {
  const pts = makePoints(nShot);
  const protos = pts.filter(p => p.type === 'proto');
  const queries = pts.filter(p => p.type === 'query');

  return (
    <svg viewBox="0 0 360 240" className="w-full border border-gray-200 rounded-xl bg-gray-50" style={{ maxHeight: 220 }}>
      {/* cluster regions */}
      {RELATION_CONFIGS.map((rc, i) => {
        const proto = protos.find(p => p.relationClass === i);
        if (!proto) return null;
        return <circle key={`region_${i}`} cx={proto.x} cy={proto.y} r={46} fill={rc.bg} stroke={rc.color} strokeWidth="1" strokeDasharray="4 3" opacity={0.7} />;
      })}
      {/* lines: query → nearest proto */}
      {queries.map(q => {
        const proto = protos.find(p => p.relationClass === q.relationClass);
        if (!proto) return null;
        return <line key={`l_${q.id}`} x1={q.x} y1={q.y} x2={proto.x} y2={proto.y} stroke={RELATION_CONFIGS[q.relationClass].color} strokeWidth="1" strokeDasharray="3 2" opacity={0.5} />;
      })}
      {/* support points */}
      {pts.filter(p => p.type === 'support').map(p => (
        <circle key={p.id} cx={p.x} cy={p.y} r={5} fill={RELATION_CONFIGS[p.relationClass].color} opacity={0.7} />
      ))}
      {/* query points */}
      {queries.map(q => (
        <g key={q.id}>
          <circle cx={q.x} cy={q.y} r={5} fill="white" stroke={RELATION_CONFIGS[q.relationClass].color} strokeWidth="2" />
          <text x={q.x + 7} y={q.y + 4} fontSize="8" fill="#64748b">{q.label}</text>
        </g>
      ))}
      {/* prototype points */}
      {protos.map(p => {
        const rc = RELATION_CONFIGS[p.relationClass];
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={9} fill={rc.color} stroke="white" strokeWidth="2" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">P</text>
            <text x={p.x} y={p.y + 20} textAnchor="middle" fontSize="9" fill={rc.color} fontWeight="600">{p.label}</text>
          </g>
        );
      })}
      {/* legend */}
      <g transform="translate(8, 8)">
        {[{ r: 5, fill: '#6366f1', label: '支持集样本' }, { r: 5, fill: 'white', stroke: '#6366f1', label: '查询样本' }, { r: 9, fill: '#6366f1', label: '原型向量 P' }].map((item, i) => (
          <g key={i} transform={`translate(0, ${i * 16})`}>
            <circle cx={6} cy={6} r={item.r} fill={item.fill} stroke={item.stroke ?? item.fill} strokeWidth={item.stroke ? 1.5 : 0} />
            <text x={18} y={10} fontSize="9" fill="#475569">{item.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── fast learning data ────────────────────────────────────────────────────────

const NEW_RELATION_EXAMPLES = {
  'advisedBy': {
    label: '指导',
    description: '学术导师与学生之间的指导关系',
    examples: [
      { h: '王教授', t: '张博士', correct: true },
      { h: '李院士', t: '陈硕士', correct: true },
      { h: '刘博导', t: '赵博士', correct: true },
    ],
  },
  'investedIn': {
    label: '投资了',
    description: '投资者与被投企业的投资关系',
    examples: [
      { h: '红杉资本', t: '字节跳动', correct: true },
      { h: '高瓴资本', t: '美团', correct: true },
      { h: '软银', t: '阿里巴巴', correct: true },
    ],
  },
  'memberOf': {
    label: '成员隶属',
    description: '个人与组织委员会/学会的隶属关系',
    examples: [
      { h: '张明', t: 'ACL 委员会', correct: true },
      { h: '李华', t: 'IEEE 学会', correct: true },
      { h: '王芳', t: '中国计算机学会', correct: true },
    ],
  },
};

type NewRelKey = keyof typeof NEW_RELATION_EXAMPLES;

const TRAIN_LOGS_TEMPLATE = (rel: string, nShot: number) => [
  `[初始化] 加载元训练好的编码器权重 (ProtoNet)`,
  `[数据] 支持集：${nShot} 个"${rel}"正样本 + ${nShot} 个负样本`,
  `[Episode 1/30] Support loss: 1.842  Query acc: 52.0%`,
  `[Episode 5/30] Support loss: 1.321  Query acc: 63.5%`,
  `[Episode 10/30] Support loss: 0.987  Query acc: 71.2%`,
  `[Episode 15/30] Support loss: 0.712  Query acc: 76.8%`,
  `[Episode 20/30] Support loss: 0.534  Query acc: 79.4%`,
  `[Episode 25/30] Support loss: 0.398  Query acc: 81.7%`,
  `[Episode 30/30] Support loss: 0.312  Query acc: 83.1%`,
  `[评估] 验证集 F1: ${(73 + nShot * 2.1).toFixed(1)}%  Precision: ${(76 + nShot * 1.8).toFixed(1)}%  Recall: ${(71 + nShot * 2.3).toFixed(1)}%`,
  `[完成] 新关系"${rel}"适配完成，模型已就绪`,
];

const PREDICT_RESULTS: Record<NewRelKey, { h: string; t: string; score: number }[]> = {
  advisedBy: [
    { h: '吴教授', t: '郑博士', score: 0.921 },
    { h: '孙导师', t: '林硕士', score: 0.887 },
    { h: '周博导', t: '徐博士', score: 0.856 },
    { h: '赵研究员', t: '钱博士', score: 0.734 },
    { h: '钱教授', t: '孙同学', score: 0.612 },
  ],
  investedIn: [
    { h: 'IDG资本', t: '滴滴出行', score: 0.943 },
    { h: '腾讯', t: '京东', score: 0.912 },
    { h: '阿里巴巴', t: '饿了么', score: 0.878 },
    { h: '字节跳动', t: '知乎', score: 0.745 },
    { h: '小米', t: '顺为资本', score: 0.623 },
  ],
  memberOf: [
    { h: '陈研究员', t: 'AAAI 委员会', score: 0.934 },
    { h: '刘博士', t: 'NeurIPS 程序委员会', score: 0.901 },
    { h: '黄教授', t: 'CCF 理事会', score: 0.867 },
    { h: '杨院士', t: '中国科学院', score: 0.812 },
    { h: '马研究员', t: 'ICML 组委会', score: 0.754 },
  ],
};

// ── main component ────────────────────────────────────────────────────────────

export function FewShotTripleDemo() {
  const [activeSection, setActiveSection] = useState<'meta' | 'proto' | 'fastlearn'>('meta');

  // ── meta learning state ──
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set(['t1', 't2']));
  const [nWay, setNWay] = useState(3);
  const [nShot, setNShot] = useState(5);
  const [nQuery, setNQuery] = useState(15);
  const [metaBuilt, setMetaBuilt] = useState(false);
  const [metaBuilding, setMetaBuilding] = useState(false);

  // ── proto network state ──
  const [protoShot, setProtoShot] = useState(3);
  const [protoTrained, setProtoTrained] = useState(false);
  const [protoTraining, setProtoTraining] = useState(false);
  const [protoAcc, setProtoAcc] = useState(0);

  // ── fast learn state ──
  const [newRelKey, setNewRelKey] = useState<NewRelKey>('advisedBy');
  const [fastShot, setFastShot] = useState(3);
  const [userExamples, setUserExamples] = useState<{ h: string; t: string }[]>([]);
  const [newH, setNewH] = useState('');
  const [newT, setNewT] = useState('');
  const [fastRunning, setFastRunning] = useState(false);
  const [fastLogs, setFastLogs] = useState<string[]>([]);
  const [fastDone, setFastDone] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const SECTIONS = [
    { id: 'meta' as const, label: '① 元学习任务构建' },
    { id: 'proto' as const, label: '② 原型网络' },
    { id: 'fastlearn' as const, label: '③ 新关系快速学习' },
  ];

  // meta build
  const buildMeta = () => {
    setMetaBuilding(true); setMetaBuilt(false);
    timerRef.current = setTimeout(() => { setMetaBuilding(false); setMetaBuilt(true); }, 800);
  };

  // proto train
  const trainProto = () => {
    setProtoTraining(true); setProtoTrained(false); setProtoAcc(0);
    let step = 0;
    const target = 58 + protoShot * 8;
    const tick = () => {
      step++;
      setProtoAcc(Math.min(target, Math.round(target * step / 8)));
      if (step < 8) { timerRef.current = setTimeout(tick, 180); }
      else { setProtoTraining(false); setProtoTrained(true); }
    };
    timerRef.current = setTimeout(tick, 180);
  };

  // fast learn
  const startFastLearn = () => {
    const rel = NEW_RELATION_EXAMPLES[newRelKey];
    const logs = TRAIN_LOGS_TEMPLATE(rel.label, fastShot + userExamples.length);
    setFastRunning(true); setFastDone(false); setFastLogs([]);
    let i = 0;
    const pushLog = () => {
      if (i < logs.length) {
        setFastLogs(prev => [...prev, logs[i]]);
        i++;
        timerRef.current = setTimeout(pushLog, 280);
        setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 50);
      } else { setFastRunning(false); setFastDone(true); }
    };
    timerRef.current = setTimeout(pushLog, 200);
  };

  const addExample = () => {
    if (!newH.trim() || !newT.trim()) return;
    setUserExamples(prev => [...prev, { h: newH.trim(), t: newT.trim() }]);
    setNewH(''); setNewT(''); setFastDone(false);
  };

  const relInfo = NEW_RELATION_EXAMPLES[newRelKey];
  const builtTaskCount = selectedTasks.size * Math.ceil(1000 / nShot);
  const totalEpisodes = builtTaskCount * 5;

  return (
    <div className="space-y-5">
      {/* section nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ① Meta Learning ── */}
      {activeSection === 'meta' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">元学习任务构建</h3>
            <p className="text-sm text-gray-500 mt-0.5">将现有知识图谱中的关系数据转化为 N-way K-shot 元学习 Episode，使模型"学会如何学习新关系"</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* left: config */}
            <div className="space-y-4">
              {/* relation source selector */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">选择元训练关系（知识来源）</div>
                <div className="divide-y divide-gray-100">
                  {EXISTING_RELATIONS.map(r => {
                    const checked = selectedTasks.has(r.id);
                    return (
                      <label key={r.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={checked}
                          onChange={() => {
                            setSelectedTasks(prev => {
                              const next = new Set(prev);
                              next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                              return next;
                            });
                            setMetaBuilt(false);
                          }}
                          className="rounded border-gray-300 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{r.label}</p>
                          <p className="text-xs text-gray-400">{r.domain} · {r.triples.toLocaleString()} 条三元组</p>
                        </div>
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{r.triples.toLocaleString()} 条</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* episode config */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700">Episode 参数配置</p>
                {[
                  { label: 'N-way（关系类别数）', value: nWay, set: setNWay, min: 2, max: 5, hint: '每个 Episode 包含的关系类别数' },
                  { label: 'K-shot（每类支持样本）', value: nShot, set: setNShot, min: 1, max: 10, hint: '每个关系类别的标注样本数' },
                  { label: 'Q-query（每类查询样本）', value: nQuery, set: setNQuery, min: 5, max: 30, hint: '用于元训练损失计算的查询样本数' },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{p.label}</span>
                      <span className="text-xs font-mono font-semibold text-gray-900">{p.value}</span>
                    </div>
                    <input type="range" min={p.min} max={p.max} value={p.value}
                      onChange={e => { p.set(+e.target.value); setMetaBuilt(false); }}
                      className="w-full h-1.5 accent-purple-600" />
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.hint}</p>
                  </div>
                ))}
              </div>

              <button onClick={buildMeta} disabled={metaBuilding || selectedTasks.size === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
                <Play className="w-4 h-4" />{metaBuilding ? '构建中…' : '构建元学习任务'}
              </button>
            </div>

            {/* right: preview & stats */}
            <div className="space-y-4">
              {/* diagram */}
              <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-purple-800 mb-3">N-way K-shot Episode 结构</p>
                <div className="space-y-2">
                  {Array.from({ length: Math.min(nWay, 3) }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-20 text-purple-700 font-medium flex-shrink-0">关系类 {i + 1}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: nShot }).map((_, j) => (
                          <div key={j} className="w-5 h-5 bg-purple-500 rounded text-white text-[9px] flex items-center justify-center">S</div>
                        ))}
                        <div className="w-px bg-purple-300 mx-1" />
                        {Array.from({ length: Math.min(nQuery, 5) }).map((_, j) => (
                          <div key={j} className="w-5 h-5 bg-white border border-purple-400 rounded text-purple-600 text-[9px] flex items-center justify-center">Q</div>
                        ))}
                        {nQuery > 5 && <span className="text-xs text-purple-500 self-center">+{nQuery - 5}</span>}
                      </div>
                    </div>
                  ))}
                  {nWay > 3 && <p className="text-xs text-purple-500 pl-22">…共 {nWay} 个关系类</p>}
                  <div className="flex gap-3 mt-2 text-[10px] text-purple-600">
                    <span className="flex items-center gap-1"><span className="w-4 h-4 bg-purple-500 rounded text-white text-[8px] flex items-center justify-center">S</span>支持集</span>
                    <span className="flex items-center gap-1"><span className="w-4 h-4 bg-white border border-purple-400 rounded text-purple-600 text-[8px] flex items-center justify-center">Q</span>查询集</span>
                  </div>
                </div>
              </div>

              {/* stats */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">任务统计预览</div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: '已选关系数', value: `${selectedTasks.size} 种` },
                    { label: 'N-way K-shot 配置', value: `${nWay}-way ${nShot}-shot` },
                    { label: '预计 Episode 数', value: `${builtTaskCount.toLocaleString()} 个` },
                    { label: '总元训练步数', value: `${totalEpisodes.toLocaleString()} 步` },
                    { label: '每 Episode 样本量', value: `${nWay * (nShot + nQuery)} 条` },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-600">{r.label}</span>
                      <span className="font-semibold text-gray-900">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {metaBuilt && (
                <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold">元学习任务构建完成</span>
                  </div>
                  <div className="space-y-1 text-xs text-emerald-800">
                    <p>· 共生成 <span className="font-semibold">{builtTaskCount.toLocaleString()}</span> 个元学习 Episode</p>
                    <p>· 已写入元训练数据集，可进入"原型网络"标签开始训练</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ② Prototype Network ── */}
      {activeSection === 'proto' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">原型网络（Prototypical Network）</h3>
            <p className="text-sm text-gray-500 mt-0.5">为每个关系类计算支持集样本的向量均值作为原型，通过欧式距离将查询样本归类到最近的原型</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              {/* algorithm card */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700">编码器与距离配置</p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">文本编码器</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
                    <option>BERT (bert-base-chinese)</option>
                    <option>RoBERTa (hfl/chinese-roberta)</option>
                    <option>MacBERT (hfl/chinese-macbert)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">距离度量</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['欧式距离', '余弦相似度', 'Mahalanobis'].map((m, i) => (
                      <button key={m} className={`py-1.5 text-xs rounded-lg border transition-colors ${i === 0 ? 'border-purple-400 bg-purple-50 text-purple-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">K-shot（支持集大小）</span>
                    <span className="text-xs font-mono font-semibold">{protoShot}</span>
                  </div>
                  <input type="range" min={1} max={5} value={protoShot}
                    onChange={e => { setProtoShot(+e.target.value); setProtoTrained(false); setProtoAcc(0); }}
                    className="w-full h-1.5 accent-purple-600" />
                </div>
              </div>

              {/* algorithm comparison */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">少样本算法对比</div>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-gray-500 font-medium">算法</th>
                    <th className="text-center px-3 py-2 text-gray-500 font-medium">1-shot</th>
                    <th className="text-center px-3 py-2 text-gray-500 font-medium">5-shot</th>
                    <th className="text-center px-3 py-2 text-gray-500 font-medium">复杂度</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { name: '原型网络 ★', f1: '68.2', f5: '81.4', complexity: '低' },
                      { name: '匹配网络', f1: '65.1', f5: '78.6', complexity: '低' },
                      { name: 'MAML', f1: '71.3', f5: '83.7', complexity: '高' },
                      { name: 'Reptile', f1: '69.8', f5: '82.1', complexity: '中' },
                    ].map(row => (
                      <tr key={row.name} className={row.name.includes('★') ? 'bg-purple-50' : ''}>
                        <td className={`px-4 py-2 font-medium ${row.name.includes('★') ? 'text-purple-700' : 'text-gray-700'}`}>{row.name}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.f1}%</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.f5}%</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${row.complexity === '低' ? 'bg-green-100 text-green-700' : row.complexity === '中' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{row.complexity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={trainProto} disabled={protoTraining}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
                <Play className="w-4 h-4" />{protoTraining ? `训练中… ${protoAcc}%` : '启动原型网络训练'}
              </button>

              {protoTrained && (
                <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-xs text-emerald-800">
                  <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="font-semibold">训练完成</span></div>
                  <p>验证集 F1: <span className="font-semibold">{(58 + protoShot * 8)}%</span>  ·  {protoShot}-shot 精度</p>
                </div>
              )}
            </div>

            {/* right: visualization */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-700">嵌入空间可视化（{protoShot}-shot）</p>
              <ProtoNetViz nShot={protoShot} />
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">原型向量计算方式</p>
                    <p className="text-purple-700">每类原型 P = (1/K) Σ f(xᵢ)，其中 f 为编码器，xᵢ 为该类支持集样本。查询样本被归类至欧式距离最近的原型所在类别。</p>
                    <p className="text-purple-700 mt-1">K-shot 越大，原型估计越稳定，F1 通常随 K 线性提升约 {Math.round(protoShot * 0.8 + 2)}%/shot。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ③ Fast Learn ── */}
      {activeSection === 'fastlearn' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">新关系快速学习</h3>
            <p className="text-sm text-gray-500 mt-0.5">选择一个新关系类型，提供少量标注样本，基于预训练的原型网络快速适配并生成新三元组</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* left: setup */}
            <div className="space-y-4">
              {/* relation selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">选择新关系类型</label>
                <div className="space-y-2">
                  {(Object.entries(NEW_RELATION_EXAMPLES) as [NewRelKey, typeof NEW_RELATION_EXAMPLES[NewRelKey]][]).map(([key, info]) => (
                    <button key={key} onClick={() => { setNewRelKey(key); setFastDone(false); setFastLogs([]); }}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${newRelKey === key ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-2">
                        <Zap className={`w-3.5 h-3.5 ${newRelKey === key ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-semibold ${newRelKey === key ? 'text-purple-800' : 'text-gray-800'}`}>{info.label}</span>
                        <span className="text-xs text-gray-400 ml-auto">新关系</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 ml-5">{info.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* built-in examples */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">
                  内置支持集样本（{relInfo.examples.length} 条）
                </div>
                <div className="divide-y divide-gray-100">
                  {relInfo.examples.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                      <span className="font-mono font-medium text-gray-800">{ex.h}</span>
                      <ChevronRight className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-700 font-medium">「{relInfo.label}」</span>
                      <ChevronRight className="w-3 h-3 text-purple-400" />
                      <span className="font-mono font-medium text-gray-800">{ex.t}</span>
                      <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">正样本</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* user custom examples */}
              <div className="border border-purple-200 rounded-xl overflow-hidden">
                <div className="bg-purple-50 border-b border-purple-200 px-4 py-2.5 text-xs font-semibold text-purple-800">
                  添加自定义样本（可选）
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <input placeholder="头实体" value={newH} onChange={e => setNewH(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-400" />
                    <input placeholder="尾实体" value={newT} onChange={e => setNewT(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addExample()}
                      className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-400" />
                    <button onClick={addExample} disabled={!newH.trim() || !newT.trim()}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 disabled:opacity-40 text-white rounded-lg text-xs">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {userExamples.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs">
                      <span className="font-mono text-purple-900 flex-1">{ex.h} → {ex.t}</span>
                      <button onClick={() => setUserExamples(prev => prev.filter((_, j) => j !== i))}>
                        <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={startFastLearn} disabled={fastRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
                <Zap className="w-4 h-4" />
                {fastRunning ? '适配中…' : `快速适配（${relInfo.examples.length + userExamples.length} 个样本）`}
              </button>
            </div>

            {/* right: logs + results */}
            <div className="space-y-4">
              {/* training log */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">训练日志</span>
                  {fastRunning && <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />运行中</span>}
                  {fastDone && <span className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle className="w-3 h-3" />完成</span>}
                </div>
                <div ref={logRef} className="bg-gray-950 px-4 py-3 h-44 overflow-y-auto font-mono text-xs space-y-0.5">
                  {fastLogs.length === 0 && <span className="text-gray-600">等待启动…</span>}
                  {fastLogs.map((log, i) => (
                    <div key={i} className={`${log.includes('完成') || log.includes('评估') ? 'text-green-400' : log.includes('Error') ? 'text-red-400' : 'text-gray-300'}`}>{log}</div>
                  ))}
                </div>
              </div>

              {/* generated triples */}
              {fastDone && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">生成的新三元组（Top-5）</span>
                    <span className="text-xs text-gray-400">「{relInfo.label}」关系</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {PREDICT_RESULTS[newRelKey].map(({ h, t, score }, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                        <div className="flex items-center gap-1.5 flex-1 text-sm">
                          <span className="font-medium text-gray-900">{h}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-purple-700 font-medium text-xs">「{relInfo.label}」</span>
                          <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                          <span className="font-medium text-gray-900">{t}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="text-xs font-mono font-semibold text-purple-700">{score.toFixed(3)}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${score * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!fastDone && !fastRunning && (
                <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-400">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  点击"快速适配"后将在此展示生成的新三元组
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
