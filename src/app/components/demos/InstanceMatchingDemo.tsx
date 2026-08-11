import React from 'react';
import { Play, Check } from 'lucide-react';

const MATCH_METHOD_OPTIONS = [
  { id: 'text',      label: '文本匹配',     color: 'blue',   desc: '字符串相似度 + 向量语义' },
  { id: 'structure', label: '结构匹配',     color: 'purple', desc: '邻居节点 + 关系路径模式' },
  { id: 'ml',        label: '机器学习',     color: 'green',  desc: 'XGBoost 多特征二分类' },
  { id: 'fusion',    label: '多策略融合',   color: 'orange', desc: '加权投票综合决策' },
] as const;

type MatchMethodId = 'text' | 'structure' | 'ml' | 'fusion';

const ENTITY_PAIRS = [
  {
    id: 'p1',
    srcId: 'E_001', srcText: '清华大学', srcNeighbors: ['北京市', '教育部', '薛其坤', '姚期智'],
    tgtId: 'E_A01', tgtText: 'Tsinghua University', tgtNeighbors: ['Beijing', 'Ministry of Education', 'Andrew Chi-Chih Yao'],
    trueMatch: true,
  },
  {
    id: 'p2',
    srcId: 'E_002', srcText: '北京大学', srcNeighbors: ['北京市', '教育部', '李彦宏', '屠呦呦'],
    tgtId: 'E_A02', tgtText: 'Peking University', tgtNeighbors: ['Beijing', 'Ministry of Education', 'Tu Youyou'],
    trueMatch: true,
  },
  {
    id: 'p3',
    srcId: 'E_003', srcText: '腾讯', srcNeighbors: ['深圳市', '马化腾', '微信', 'QQ'],
    tgtId: 'E_A03', tgtText: 'Alibaba Group', tgtNeighbors: ['Hangzhou', 'Jack Ma', 'Taobao', 'Alipay'],
    trueMatch: false,
  },
  {
    id: 'p4',
    srcId: 'E_004', srcText: '中科院自动化研究所', srcNeighbors: ['北京市', '中国科学院', '谭铁牛'],
    tgtId: 'E_A04', tgtText: 'Institute of Automation, CAS', tgtNeighbors: ['Beijing', 'Chinese Academy of Sciences', 'Tan Tieniu'],
    trueMatch: true,
  },
  {
    id: 'p5',
    srcId: 'E_005', srcText: '百度', srcNeighbors: ['北京市', '李彦宏', '搜索引擎', '文心一言'],
    tgtId: 'E_A05', tgtText: 'ByteDance', tgtNeighbors: ['Beijing', 'Zhang Yiming', 'TikTok', 'Toutiao'],
    trueMatch: false,
  },
];

function strSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const cost = Array.from({ length: shorter.length + 1 }, (_, i) => i);
  for (let i = 1; i <= longer.length; i++) {
    let prev = i;
    for (let j = 1; j <= shorter.length; j++) {
      const val = longer[i - 1] === shorter[j - 1] ? cost[j - 1] : Math.min(cost[j - 1], cost[j], prev) + 1;
      cost[j - 1] = prev; prev = val;
    }
    cost[shorter.length] = prev;
  }
  return (longer.length - cost[shorter.length]) / longer.length;
}

function neighborOverlap(a: string[], b: string[]): number {
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  const inter = [...setA].filter(x => setB.has(x)).length;
  return inter / Math.max(setA.size + setB.size - inter, 1);
}

function computeScores(pair: typeof ENTITY_PAIRS[0]) {
  const strSim = Math.min(0.99, strSimilarity(pair.srcText, pair.tgtText) * 0.6 + (pair.trueMatch ? 0.35 : 0.05));
  const vecSim = pair.trueMatch ? 0.78 + Math.abs(Math.sin(pair.id.charCodeAt(1))) * 0.18 : 0.12 + Math.abs(Math.cos(pair.id.charCodeAt(1))) * 0.22;
  const neighSim = Math.min(0.99, neighborOverlap(pair.srcNeighbors, pair.tgtNeighbors) * 0.5 + (pair.trueMatch ? 0.42 : 0.06));
  const pathSim = pair.trueMatch ? 0.74 + Math.abs(Math.sin(pair.id.charCodeAt(1) * 2)) * 0.2 : 0.08 + Math.abs(Math.cos(pair.id.charCodeAt(1) * 3)) * 0.18;
  const mlSim = pair.trueMatch ? 0.85 + Math.abs(Math.sin(pair.id.charCodeAt(1) * 1.5)) * 0.12 : 0.07 + Math.abs(Math.cos(pair.id.charCodeAt(1) * 2)) * 0.15;
  return { strSim, vecSim, neighSim, pathSim, mlSim };
}

function fusionScore(scores: ReturnType<typeof computeScores>, weights: Record<string, number>) {
  const text = (scores.strSim + scores.vecSim) / 2;
  const struct = (scores.neighSim + scores.pathSim) / 2;
  return text * weights.text + struct * weights.structure + scores.mlSim * weights.ml;
}

export function InstanceMatchingDemo() {
  const [selectedMethods, setSelectedMethods] = React.useState<MatchMethodId[]>(['text', 'fusion']);
  const [activeMethod, setActiveMethod] = React.useState<MatchMethodId>('text');
  const [matchStep, setMatchStep] = React.useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = React.useState(0);
  const [revealedCount, setRevealedCount] = React.useState(0);
  const [weights, setWeights] = React.useState({ text: 0.3, structure: 0.3, ml: 0.4 });
  const [threshold, setThreshold] = React.useState(0.65);
  const [mlTrained, setMlTrained] = React.useState(false);
  const [mlTraining, setMlTraining] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleMethod = (id: MatchMethodId) => {
    setSelectedMethods(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(m => m !== id) : prev) : [...prev, id]
    );
  };

  const handleMatch = () => {
    setMatchStep('running');
    setProgress(0);
    setRevealedCount(0);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += Math.random() * 15 + 8;
      const pct = Math.min(p, 100);
      setProgress(pct);
      setRevealedCount(Math.floor(ENTITY_PAIRS.length * pct / 100));
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        setMatchStep('done');
        setRevealedCount(ENTITY_PAIRS.length);
      }
    }, 200);
  };

  const handleMlTrain = () => {
    setMlTraining(true);
    setTimeout(() => { setMlTraining(false); setMlTrained(true); }, 1800);
  };

  const totalW = weights.text + weights.structure + weights.ml;
  const normW = { text: weights.text / totalW, structure: weights.structure / totalW, ml: weights.ml / totalW };

  const confColor = (c: number) => c >= 0.7 ? 'text-green-700 bg-green-50 border-green-200' : c >= 0.45 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';
  const barColor = (c: number) => c >= 0.7 ? 'bg-green-500' : c >= 0.45 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="space-y-4">

      {/* API field selector */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 font-mono">match_methods</span>
          <span className="text-[10px] text-gray-400">— API 字段：选择启用的匹配策略（可多选）</span>
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          {MATCH_METHOD_OPTIONS.map(m => {
            const on = selectedMethods.includes(m.id);
            const colorMap = { blue: on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50', purple: on ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50', green: on ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-300 hover:bg-green-50', orange: on ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50' };
            return (
              <button key={m.id} onClick={() => toggleMethod(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${colorMap[m.color]}`}>
                <span className="font-mono font-semibold">"{m.id}"</span>
                <span className={on ? 'opacity-80' : 'text-gray-400'}>{m.label}</span>
                {on && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
        <div className="border-t border-gray-100 bg-gray-900 px-4 py-2 font-mono text-[11px] text-green-300">
          {`{ "match_methods": [${selectedMethods.map(m => `"${m}"`).join(', ')}] }`}
        </div>
      </div>

      {/* Strategy sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {MATCH_METHOD_OPTIONS.filter(m => selectedMethods.includes(m.id)).map(m => (
          <button key={m.id} onClick={() => setActiveMethod(m.id)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${activeMethod === m.id && selectedMethods.includes(m.id) ? 'bg-white font-medium shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Text matching tab ── */}
      {activeMethod === 'text' && selectedMethods.includes('text') && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* String similarity */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100">
                <span className="text-xs font-semibold text-blue-800">字符串相似度匹配</span>
              </div>
              <div className="p-3 space-y-2">
                {ENTITY_PAIRS.slice(0, 4).map(pair => {
                  const s = strSimilarity(pair.srcText, pair.tgtText) * 0.6 + (pair.trueMatch ? 0.35 : 0.05);
                  const score = Math.min(0.99, s);
                  return (
                    <div key={pair.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-16 truncate">{pair.srcText}</span>
                      <span className="text-[10px] text-gray-300">↔</span>
                      <span className="text-[10px] text-gray-500 w-24 truncate">{pair.tgtText}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${score * 100}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold w-8 text-right ${score >= 0.7 ? 'text-green-600' : 'text-red-500'}`}>{(score * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Vector similarity */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100">
                <span className="text-xs font-semibold text-blue-800">文本向量相似度匹配（余弦）</span>
              </div>
              <div className="p-3 space-y-2">
                {ENTITY_PAIRS.slice(0, 4).map(pair => {
                  const score = computeScores(pair).vecSim;
                  return (
                    <div key={pair.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-16 truncate">{pair.srcText}</span>
                      <span className="text-[10px] text-gray-300">↔</span>
                      <span className="text-[10px] text-gray-500 w-24 truncate">{pair.tgtText}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${score * 100}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold w-8 text-right ${score >= 0.7 ? 'text-green-600' : 'text-red-500'}`}>{(score * 100).toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Structure matching tab ── */}
      {activeMethod === 'structure' && selectedMethods.includes('structure') && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Neighbor overlap */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100">
                <span className="text-xs font-semibold text-purple-800">邻居节点相似性分析</span>
              </div>
              <div className="divide-y divide-gray-100">
                {ENTITY_PAIRS.slice(0, 4).map(pair => {
                  const score = computeScores(pair).neighSim;
                  const common = pair.srcNeighbors.filter(n => pair.tgtNeighbors.some(t => t.toLowerCase().includes(n.toLowerCase().slice(0, 3)) || n.toLowerCase().includes(t.toLowerCase().slice(0, 3))));
                  return (
                    <div key={pair.id} className="px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-medium text-gray-700">{pair.srcText} ↔ {pair.tgtText}</span>
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded border ${confColor(score)}`}>{(score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {pair.srcNeighbors.slice(0, 3).map(n => (
                          <span key={n} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${common.includes(n) ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{n}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Path pattern */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100">
                <span className="text-xs font-semibold text-purple-800">关系路径模式匹配</span>
              </div>
              <div className="divide-y divide-gray-100">
                {ENTITY_PAIRS.slice(0, 4).map(pair => {
                  const score = computeScores(pair).pathSim;
                  return (
                    <div key={pair.id} className="px-3 py-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-gray-700">{pair.srcText}</span>
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded border ${confColor(score)}`}>{(score * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-400">
                        <span>→位于→城市</span>
                        <span className={score >= 0.7 ? 'text-purple-500' : 'text-gray-300'}>✓</span>
                        <span className="mx-1">·</span>
                        <span>→隶属于→机构</span>
                        <span className={score >= 0.6 ? 'text-purple-500' : 'text-gray-300'}>✓</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ML matching tab ── */}
      {activeMethod === 'ml' && selectedMethods.includes('ml') && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Feature engineering */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-green-50 px-4 py-2.5 border-b border-green-100">
                <span className="text-xs font-semibold text-green-800">特征工程（自动抽取）</span>
              </div>
              <div className="p-3 space-y-1.5">
                {[
                  { name: 'str_similarity', type: '文本', importance: 0.28 },
                  { name: 'vec_cosine',     type: '向量', importance: 0.32 },
                  { name: 'neighbor_iou',   type: '结构', importance: 0.21 },
                  { name: 'path_pattern',   type: '结构', importance: 0.12 },
                  { name: 'num_diff',       type: '数值', importance: 0.07 },
                ].map(f => (
                  <div key={f.name} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-600 w-28 truncate">{f.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border w-10 text-center ${f.type === '文本' ? 'text-blue-600 bg-blue-50 border-blue-200' : f.type === '向量' ? 'text-purple-600 bg-purple-50 border-purple-200' : f.type === '结构' ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>{f.type}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${f.importance * 100 / 0.32}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-8 text-right">{(f.importance * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Model training */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-green-50 px-4 py-2.5 border-b border-green-100">
                <span className="text-xs font-semibold text-green-800">模型训练与评估（XGBoost）</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>标注样本</span>
                  <span className="font-medium text-gray-800">42对（正:负 = 1:2）</span>
                </div>
                <button onClick={handleMlTrain} disabled={mlTraining || mlTrained}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs rounded-lg transition-colors">
                  {mlTraining ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />训练中…</> : mlTrained ? '✓ 训练完成' : <><Play className="w-3 h-3" />训练分类器</>}
                </button>
                {mlTrained && (
                  <div className="grid grid-cols-2 gap-2">
                    {[['精度 Precision', '89.2%', 'text-green-700'], ['召回 Recall', '86.5%', 'text-blue-700'], ['F1 Score', '87.8%', 'text-purple-700'], ['AUC-ROC', '0.934', 'text-orange-600']].map(([k, v, cls]) => (
                      <div key={k} className="bg-gray-50 border border-gray-100 rounded-lg p-2 text-center">
                        <div className="text-[9px] text-gray-400">{k}</div>
                        <div className={`text-sm font-bold ${cls}`}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fusion tab ── */}
      {activeMethod === 'fusion' && selectedMethods.includes('fusion') && (
        <div className="space-y-4">
          {/* Weight config */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-orange-50 px-4 py-2.5 border-b border-orange-100">
              <span className="text-xs font-semibold text-orange-800">策略权重配置</span>
            </div>
            <div className="p-4 space-y-3">
              {([['text', '文本匹配', 'blue'], ['structure', '结构匹配', 'purple'], ['ml', '机器学习', 'green']] as const).map(([k, l, c]) => {
                const colorMap = { blue: 'accent-blue-600', purple: 'accent-purple-600', green: 'accent-green-600' };
                const textColorMap = { blue: 'text-blue-700', purple: 'text-purple-700', green: 'text-green-700' };
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{l}</span>
                      <span className={`font-bold ${textColorMap[c]}`}>{(normW[k] * 100).toFixed(0)}%（原始 {weights[k].toFixed(1)}）</span>
                    </div>
                    <input type="range" min={0.1} max={1} step={0.1} value={weights[k]}
                      onChange={e => setWeights(w => ({ ...w, [k]: parseFloat(e.target.value) }))}
                      className={`w-full h-1.5 ${colorMap[c]}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threshold + run */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs text-gray-600 whitespace-nowrap">判定阈值</span>
              <input type="range" min={0.3} max={0.9} step={0.05} value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} className="flex-1 accent-orange-500" />
              <span className="text-sm font-bold text-orange-600 w-10 text-right">{threshold.toFixed(2)}</span>
            </div>
            <button onClick={handleMatch} disabled={matchStep === 'running'}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm rounded-lg transition-colors whitespace-nowrap">
              {matchStep === 'running' ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />匹配中…</> : <><Play className="w-3.5 h-3.5" />{matchStep === 'done' ? '重新匹配' : '执行融合匹配'}</>}
            </button>
          </div>

          {/* Progress */}
          {matchStep !== 'idle' && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>匹配进度</span>
                <span>{revealedCount} / {ENTITY_PAIRS.length} 对</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${matchStep === 'done' ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Result table */}
          {revealedCount > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 grid grid-cols-12 gap-2 text-[10px] font-medium text-gray-500">
                <span className="col-span-2">源实体</span>
                <span className="col-span-2">目标实体</span>
                <span className="col-span-2 text-center">文本</span>
                <span className="col-span-2 text-center">结构</span>
                <span className="col-span-2 text-center">融合分</span>
                <span className="col-span-2 text-center">判定</span>
              </div>
              <div className="divide-y divide-gray-100">
                {ENTITY_PAIRS.slice(0, revealedCount).map(pair => {
                  const s = computeScores(pair);
                  const textAvg = (s.strSim + s.vecSim) / 2;
                  const structAvg = (s.neighSim + s.pathSim) / 2;
                  const fusion = fusionScore(s, normW);
                  const isMatch = fusion >= threshold;
                  return (
                    <div key={pair.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                      <span className="col-span-2 text-xs text-gray-800 font-medium truncate">{pair.srcText}</span>
                      <span className="col-span-2 text-xs text-gray-800 truncate">{pair.tgtText}</span>
                      <div className="col-span-2 flex items-center gap-1 justify-center">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor(textAvg)}`} style={{ width: `${textAvg * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500">{(textAvg * 100).toFixed(0)}%</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1 justify-center">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor(structAvg)}`} style={{ width: `${structAvg * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-500">{(structAvg * 100).toFixed(0)}%</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className={`text-xs font-bold border px-2 py-0.5 rounded ${confColor(fusion)}`}>{(fusion * 100).toFixed(0)}%</span>
                      </div>
                      <div className="col-span-2 text-center">
                        {isMatch
                          ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">匹配</span>
                          : <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">不匹配</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
