import React, { useState, useCallback } from 'react';
import { Play, Database, GitBranch, Shuffle } from 'lucide-react';

interface DepToken { id: number; word: string; pos: string; head: number; dep: string; }
interface DepSentence { text: string; tokens: DepToken[]; }

const DEP_SAMPLES: DepSentence[] = [
  {
    text: '苹果公司发布了新款芯片。',
    tokens: [
      { id: 1, word: '苹果公司', pos: 'NR', head: 2, dep: 'nsubj' },
      { id: 2, word: '发布', pos: 'VV', head: 0, dep: 'root' },
      { id: 3, word: '了', pos: 'AS', head: 2, dep: 'asp' },
      { id: 4, word: '新款', pos: 'JJ', head: 5, dep: 'amod' },
      { id: 5, word: '芯片', pos: 'NN', head: 2, dep: 'dobj' },
      { id: 6, word: '。', pos: 'PU', head: 2, dep: 'punct' },
    ],
  },
  {
    text: '张三在北京大学研究人工智能算法。',
    tokens: [
      { id: 1, word: '张三', pos: 'NR', head: 5, dep: 'nsubj' },
      { id: 2, word: '在', pos: 'P', head: 3, dep: 'case' },
      { id: 3, word: '北京大学', pos: 'NR', head: 5, dep: 'obl' },
      { id: 4, word: '研究', pos: 'VV', head: 5, dep: 'dep' },
      { id: 5, word: '人工智能', pos: 'NN', head: 6, dep: 'compound' },
      { id: 6, word: '算法', pos: 'NN', head: 4, dep: 'dobj' },
      { id: 7, word: '。', pos: 'PU', head: 4, dep: 'punct' },
    ],
  },
  {
    text: '该技术由国家重点实验室联合开发。',
    tokens: [
      { id: 1, word: '该', pos: 'DT', head: 2, dep: 'det' },
      { id: 2, word: '技术', pos: 'NN', head: 4, dep: 'nsubjpass' },
      { id: 3, word: '由', pos: 'P', head: 4, dep: 'auxpass' },
      { id: 4, word: '国家', pos: 'NN', head: 6, dep: 'compound' },
      { id: 5, word: '重点实验室', pos: 'NN', head: 6, dep: 'nmod' },
      { id: 6, word: '联合', pos: 'AD', head: 7, dep: 'advmod' },
      { id: 7, word: '开发', pos: 'VV', head: 0, dep: 'root' },
      { id: 8, word: '。', pos: 'PU', head: 7, dep: 'punct' },
    ],
  },
  {
    text: '新能源汽车的电池续航能力大幅提升。',
    tokens: [
      { id: 1, word: '新能源', pos: 'NN', head: 2, dep: 'compound' },
      { id: 2, word: '汽车', pos: 'NN', head: 4, dep: 'nmod' },
      { id: 3, word: '的', pos: 'DEG', head: 2, dep: 'case' },
      { id: 4, word: '电池', pos: 'NN', head: 5, dep: 'compound' },
      { id: 5, word: '续航能力', pos: 'NN', head: 7, dep: 'nsubj' },
      { id: 6, word: '大幅', pos: 'AD', head: 7, dep: 'advmod' },
      { id: 7, word: '提升', pos: 'VV', head: 0, dep: 'root' },
      { id: 8, word: '。', pos: 'PU', head: 7, dep: 'punct' },
    ],
  },
  {
    text: '论文作者提出了一种基于图神经网络的知识融合方法。',
    tokens: [
      { id: 1, word: '论文', pos: 'NN', head: 2, dep: 'compound' },
      { id: 2, word: '作者', pos: 'NN', head: 3, dep: 'nsubj' },
      { id: 3, word: '提出', pos: 'VV', head: 0, dep: 'root' },
      { id: 4, word: '了', pos: 'AS', head: 3, dep: 'asp' },
      { id: 5, word: '一种', pos: 'CD', head: 9, dep: 'nummod' },
      { id: 6, word: '基于', pos: 'P', head: 7, dep: 'case' },
      { id: 7, word: '图神经网络', pos: 'NN', head: 9, dep: 'nmod' },
      { id: 8, word: '的', pos: 'DEG', head: 7, dep: 'case' },
      { id: 9, word: '知识融合方法', pos: 'NN', head: 3, dep: 'dobj' },
      { id: 10, word: '。', pos: 'PU', head: 3, dep: 'punct' },
    ],
  },
];

const DEP_COLORS: Record<string, string> = {
  root: '#2563eb', nsubj: '#7c3aed', dobj: '#059669', obl: '#d97706',
  amod: '#db2777', compound: '#0891b2', advmod: '#65a30d', nmod: '#dc2626',
  case: '#9333ea', det: '#0284c7', asp: '#16a34a', punct: '#9ca3af',
  auxpass: '#c2410c', nsubjpass: '#7c3aed', dep: '#6b7280',
};

function depColor(dep: string) { return DEP_COLORS[dep] ?? '#6b7280'; }

function DependencyTreeViz({ sentence }: { sentence: DepSentence }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const tokens = sentence.tokens;
  const W = 88;
  const colX = (i: number) => 48 + i * W;
  const tokenY = 220;
  const boxH = 44;

  // compute arc heights — stack arcs by span length
  const arcs = tokens
    .filter(t => t.head !== 0)
    .map(t => ({ from: t.head, to: t.id, dep: t.dep, token: t }))
    .sort((a, b) => Math.abs(a.from - a.to) - Math.abs(b.from - b.to));

  const arcRows: number[] = new Array(arcs.length).fill(0);
  const rowUsed: { min: number; max: number; row: number }[] = [];
  for (let i = 0; i < arcs.length; i++) {
    const mn = Math.min(arcs[i].from, arcs[i].to);
    const mx = Math.max(arcs[i].from, arcs[i].to);
    let row = 1;
    while (rowUsed.some(r => r.row === row && r.min < mx && r.max > mn)) row++;
    arcRows[i] = row;
    rowUsed.push({ min: mn, max: mx, row });
  }

  const maxRow = Math.max(...arcRows, 1);
  const arcBaseY = tokenY - 14;
  const arcStep = 28;
  const svgH = arcBaseY + maxRow * arcStep + 40;

  const isHighlighted = (t: DepToken) =>
    hovered !== null && (t.id === hovered || t.head === hovered || (tokens.find(x => x.id === hovered)?.head === t.id));

  return (
    <svg width="100%" viewBox={`0 0 ${colX(tokens.length - 1) + 80} ${svgH + 10}`} className="overflow-visible">
      {/* Arcs */}
      {arcs.map((arc, i) => {
        const x1 = colX(arc.from - 1);
        const x2 = colX(arc.to - 1);
        const arcY = arcBaseY - arcRows[i] * arcStep;
        const mx = (x1 + x2) / 2;
        const color = depColor(arc.dep);
        const dim = hovered !== null && !isHighlighted(arc.token);
        return (
          <g key={i} opacity={dim ? 0.18 : 1} style={{ transition: 'opacity 0.15s' }}>
            <path
              d={`M ${x1} ${arcBaseY} C ${x1} ${arcY} ${x2} ${arcY} ${x2} ${arcBaseY}`}
              fill="none" stroke={color} strokeWidth={hovered !== null && isHighlighted(arc.token) ? 2.5 : 1.5}
              markerEnd={`url(#arr-${arc.dep})`}
            />
            <text x={mx} y={arcY - 5} textAnchor="middle" fontSize={9} fill={color} fontWeight="600">{arc.dep}</text>
          </g>
        );
      })}

      {/* Arrow markers */}
      <defs>
        {Object.entries(DEP_COLORS).map(([dep, color]) => (
          <marker key={dep} id={`arr-${dep}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={color} />
          </marker>
        ))}
        <marker id="arr-default" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#6b7280" />
        </marker>
      </defs>

      {/* Tokens */}
      {tokens.map((t, i) => {
        const x = colX(i);
        const hl = isHighlighted(t);
        const dim = hovered !== null && !hl;
        const isRoot = t.head === 0;
        return (
          <g key={t.id} onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer', transition: 'opacity 0.15s' }} opacity={dim ? 0.2 : 1}>
            {/* root label */}
            {isRoot && <text x={x} y={tokenY - 6} textAnchor="middle" fontSize={9} fill="#2563eb" fontWeight="700">ROOT</text>}
            {/* box */}
            <rect x={x - 28} y={tokenY} width={56} height={boxH} rx={6}
              fill={hl ? '#eff6ff' : '#f9fafb'} stroke={hl ? '#3b82f6' : '#d1d5db'} strokeWidth={hl ? 2 : 1} />
            {/* word */}
            <text x={x} y={tokenY + 17} textAnchor="middle" fontSize={13} fontWeight={hl ? '700' : '500'} fill={hl ? '#1e40af' : '#111827'}>{t.word}</text>
            {/* pos badge */}
            <rect x={x - 16} y={tokenY + 25} width={32} height={13} rx={4} fill={isRoot ? '#dbeafe' : '#f3f4f6'} />
            <text x={x} y={tokenY + 35} textAnchor="middle" fontSize={9} fill={isRoot ? '#1d4ed8' : '#6b7280'} fontWeight="600">{t.pos}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DependencyTreeDemo() {
  const [sampleIdx, setSampleIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [preprocessDone, setPreprocessDone] = useState(false);
  const [preprocessing, setPreprocessing] = useState(false);

  const sample = DEP_SAMPLES[sampleIdx];

  const randomSample = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setSampleIdx(Math.floor(Math.random() * DEP_SAMPLES.length));
      setAnimating(false);
    }, 220);
  }, []);

  const runPreprocess = () => {
    setPreprocessing(true);
    setPreprocessDone(false);
    setTimeout(() => { setPreprocessing(false); setPreprocessDone(true); }, 1800);
  };

  const PREPROCESS_STEPS = [
    { key: '分句', desc: '基于规则 + HMM 切分长段落', result: '3,241 句' },
    { key: '分词', desc: '细粒度分词（最大熵模型）', result: '68,904 词次' },
    { key: '词性标注', desc: 'CTB 词性集，精度 97.2%', result: '28 词性类' },
    { key: '命名实体预标注', desc: '识别人名 / 机构 / 地名', result: '4,890 实体' },
  ];

  return (
    <div className="space-y-6">
      {/* Preprocessing panel */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">语料预处理</span>
            <span className="text-xs text-gray-400 ml-1">corpus_001 · 科技硬件文献 · 3,241 条</span>
          </div>
          <button onClick={runPreprocess} disabled={preprocessing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">
            {preprocessing
              ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />处理中…</>
              : <><Play className="w-3 h-3" />执行预处理</>}
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {PREPROCESS_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center gap-4 px-5 py-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold
                ${preprocessDone ? 'bg-green-500 text-white' : preprocessing ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                {preprocessDone ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">{step.key}</span>
                <span className="text-xs text-gray-400 ml-2">{step.desc}</span>
              </div>
              {preprocessDone && <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{step.result}</span>}
              {!preprocessDone && <span className="text-xs text-gray-300">—</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Sampling viz panel */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">结果抽样可视化</span>
            <span className="text-xs text-gray-400">依存句法树 · 鼠标悬停高亮依存路径</span>
          </div>
          <button onClick={randomSample}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg transition-colors">
            <Shuffle className="w-3.5 h-3.5" />随机抽样
          </button>
        </div>
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <span className="text-xs text-blue-600 font-medium">原句：</span>
          <span className="text-sm text-blue-900 font-medium">{sample.text}</span>
        </div>
        <div className={`px-4 py-5 bg-white overflow-x-auto transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
          <DependencyTreeViz sentence={sample} />
        </div>
        {/* Legend */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
          {['root', 'nsubj', 'dobj', 'compound', 'amod', 'advmod', 'nmod', 'obl'].map(dep => (
            <span key={dep} className="flex items-center gap-1 text-[11px] text-gray-600">
              <span className="w-4 h-1 rounded-full inline-block" style={{ background: depColor(dep) }} />
              {dep}
            </span>
          ))}
          <span className="text-[11px] text-gray-400 ml-auto">共 {DEP_SAMPLES.length} 个样本，点击「随机抽样」切换</span>
        </div>
      </div>
    </div>
  );
}
