import { useState } from 'react';
import { Check } from 'lucide-react';

const SCORE_FNS = [
  { id: 'transe', name: 'TransE', type: 'distance', formula: '‖h + r − t‖', norm: 'L1 / L2', color: 'blue', desc: '将关系建模为头尾实体嵌入的平移，距离越小得分越高，适合 1-to-1 关系。' },
  { id: 'rotate', name: 'RotatE', type: 'distance', formula: '‖h ∘ r − t‖', norm: 'L2（复数）', color: 'indigo', desc: '在复数空间中将关系建模为旋转，可建模对称、反对称、逆向、组合等模式。' },
  { id: 'distmult', name: 'DistMult', type: 'similarity', formula: '⟨h, r, t⟩', norm: '双线性点积', color: 'purple', desc: '对角双线性模型，计算逐元素乘积后求和，简单高效但只能建模对称关系。' },
  { id: 'complex', name: 'ComplEx', type: 'similarity', formula: 'Re(⟨h, r, t̄⟩)', norm: '复数双线性', color: 'violet', desc: '将嵌入扩展至复数域，取实部作为得分，可建模非对称关系。' },
  { id: 'rescal', name: 'RESCAL', type: 'similarity', formula: 'hᵀ Mᵣ t', norm: '全矩阵双线性', color: 'fuchsia', desc: '每种关系使用独立矩阵，捕捉丰富实体交互，表达能力强但参数量大。' },
];

const SAMPLE_TRIPLES = [
  { h: '清华大学', r: '位于', t: '北京', isTrue: true },
  { h: '李明', r: '就职于', t: '清华大学', isTrue: true },
  { h: '知识图谱', r: '子领域', t: '人工智能', isTrue: true },
  { h: '苹果公司', r: '位于', t: '上海', isTrue: false },
  { h: 'TransE', r: '提出者', t: 'Bordes等', isTrue: true },
  { h: 'FB15k-237', r: '用于评测', t: '链接预测', isTrue: true },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  purple: 'bg-purple-100 text-purple-800 border-purple-300',
  violet: 'bg-violet-100 text-violet-800 border-violet-300',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
};
const BAR_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500', indigo: 'bg-indigo-500', purple: 'bg-purple-500',
  violet: 'bg-violet-500', fuchsia: 'bg-fuchsia-500',
};

const SCORES: Record<string, number[]> = {
  transe:   [0.82, 0.76, 0.88, 0.23, 0.91, 0.79],
  rotate:   [0.79, 0.81, 0.85, 0.19, 0.88, 0.83],
  distmult: [0.71, 0.68, 0.77, 0.31, 0.74, 0.70],
  complex:  [0.74, 0.72, 0.80, 0.28, 0.77, 0.73],
  rescal:   [0.85, 0.83, 0.90, 0.18, 0.93, 0.86],
};

function getScore(fnId: string, idx: number) {
  return (SCORES[fnId]?.[idx] ?? 0.5).toFixed(3);
}

export function ScoringFunctionDemo() {
  const [activeSection, setActiveSection] = useState<'distance' | 'similarity' | 'visualize'>('distance');
  const [selectedFn, setSelectedFn] = useState('transe');
  const [normType, setNormType] = useState<'L1' | 'L2'>('L1');
  const [dim, setDim] = useState(4);
  const [selectedTriple, setSelectedTriple] = useState(0);
  const [vizFns, setVizFns] = useState<string[]>(['transe', 'distmult', 'complex']);

  const distanceFns = SCORE_FNS.filter(f => f.type === 'distance');
  const similarityFns = SCORE_FNS.filter(f => f.type === 'similarity');
  const fn = SCORE_FNS.find(f => f.id === selectedFn)!;
  const triple = SAMPLE_TRIPLES[selectedTriple];

  const toggleVizFn = (id: string) =>
    setVizFns(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const SECTIONS = [
    { id: 'distance' as const, label: '① 距离打分函数' },
    { id: 'similarity' as const, label: '② 语义相似度打分' },
    { id: 'visualize' as const, label: '③ 可视化解释' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'distance' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">基于距离的打分函数</h3>
            <p className="text-sm text-gray-500 mt-0.5">通过计算变换后头实体与尾实体向量之间的距离来评估三元组合理性，距离越小得分越高</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {distanceFns.map(f => (
              <button key={f.id} onClick={() => setSelectedFn(f.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${selectedFn === f.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">{f.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${COLOR_MAP[f.color]}`}>{f.norm}</span>
                </div>
                <p className="text-lg font-mono text-gray-700 mb-1">{f.formula}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">范数类型</label>
              <div className="flex gap-2">
                {(['L1', 'L2'] as const).map(n => (
                  <button key={n} onClick={() => setNormType(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${normType === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'}`}>
                    {n} 范数
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">嵌入维度示例：{dim}d</label>
              <input type="range" min={2} max={8} step={2} value={dim} onChange={e => setDim(+e.target.value)} className="w-full accent-blue-600 mt-1" />
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">计算示例：(清华大学, 位于, 北京)</p>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              {['h（头实体）', 'r（关系）', 't（尾实体）'].map((label, i) => {
                const vecs = [
                  Array.from({length: dim}, (_, j) => ((j * 3 + 7) % 10 * 0.1 - 0.45).toFixed(2)),
                  Array.from({length: dim}, (_, j) => ((j * 5 + 2) % 10 * 0.1 - 0.35).toFixed(2)),
                  Array.from({length: dim}, (_, j) => ((j * 3 + 7 + j * 5 + 2) % 10 * 0.1 - 0.30).toFixed(2)),
                ];
                return (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">{label}</p>
                    <div className="font-mono text-xs text-gray-800 space-y-0.5">
                      {vecs[i].map((v, j) => <div key={j}>{v}</div>)}
                      {dim < 8 && <div className="text-gray-400">…</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
              <span className="font-mono">{fn.formula}</span>
              {' '}= {normType} 距离 ≈ <span className="font-bold">0.{dim === 2 ? '14' : dim === 4 ? '23' : '31'}</span>&nbsp;（越小越合理）
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">批量三元组打分（{fn.name}）</p>
            <div className="space-y-2">
              {SAMPLE_TRIPLES.map((t, i) => {
                const score = parseFloat(getScore(selectedFn, i));
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 text-sm"><span className="font-medium text-gray-900">({t.h}, {t.r}, {t.t})</span></div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${t.isTrue ? 'bg-blue-500' : 'bg-red-400'}`} style={{ width: `${score * 100}%` }} />
                    </div>
                    <span className={`text-sm font-mono w-14 text-right font-semibold ${t.isTrue ? 'text-blue-700' : 'text-red-500'}`}>{score}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{t.isTrue ? '真实' : '负样本'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'similarity' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">基于语义相似度的打分函数</h3>
            <p className="text-sm text-gray-500 mt-0.5">通过向量内积或双线性运算衡量实体与关系的语义匹配度，得分越高表示三元组越合理</p>
          </div>
          <div className="space-y-3">
            {similarityFns.map(f => (
              <button key={f.id} onClick={() => setSelectedFn(f.id)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selectedFn === f.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{f.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${COLOR_MAP[f.color]}`}>{f.norm}</span>
                      <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{f.formula}</code>
                    </div>
                    <p className="text-sm text-gray-600">{f.desc}</p>
                  </div>
                  {selectedFn === f.id && <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />}
                </div>
                {selectedFn === f.id && (
                  <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-purple-200">
                    <div className="text-sm">
                      <p className="text-xs text-gray-500 mb-1">优势</p>
                      <ul className="space-y-0.5 text-gray-700">
                        {f.id === 'distmult' && <><li>• 参数量少，计算高效</li><li>• 适合大规模知识图谱</li></>}
                        {f.id === 'complex' && <><li>• 可建模非对称关系</li><li>• 参数量适中</li></>}
                        {f.id === 'rescal' && <><li>• 表达能力最强</li><li>• 可捕捉复杂关系交互</li></>}
                      </ul>
                    </div>
                    <div className="text-sm">
                      <p className="text-xs text-gray-500 mb-1">局限</p>
                      <ul className="space-y-0.5 text-gray-700">
                        {f.id === 'distmult' && <><li>• 只能建模对称关系</li><li>• 表达能力有限</li></>}
                        {f.id === 'complex' && <><li>• 需要处理复数运算</li><li>• 训练略慢于 DistMult</li></>}
                        {f.id === 'rescal' && <><li>• 参数量随关系数平方增长</li><li>• 易过拟合</li></>}
                      </ul>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">模型</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">FB15k-237 MRR</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">对称关系</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">反对称关系</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">参数复杂度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'DistMult', mrr: '0.241', sym: '✓', asym: '✗', params: 'O(n·d)' },
                  { name: 'ComplEx',  mrr: '0.247', sym: '✓', asym: '✓', params: 'O(n·d)' },
                  { name: 'RESCAL',   mrr: '0.356', sym: '✓', asym: '✓', params: 'O(n·d + r·d²)' },
                ].map(row => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-blue-700 font-mono">{row.mrr}</td>
                    <td className={`px-4 py-3 font-semibold ${row.sym === '✓' ? 'text-green-600' : 'text-red-400'}`}>{row.sym}</td>
                    <td className={`px-4 py-3 font-semibold ${row.asym === '✓' ? 'text-green-600' : 'text-red-400'}`}>{row.asym}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-xs">{row.params}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'visualize' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">打分函数可视化解释</h3>
            <p className="text-sm text-gray-500 mt-0.5">选择三元组与打分函数，直观对比各函数的得分与排名差异</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">选择三元组</p>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_TRIPLES.map((t, i) => (
                <button key={i} onClick={() => setSelectedTriple(i)}
                  className={`text-left p-3 rounded-lg border-2 text-sm transition-colors ${selectedTriple === i ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="font-medium text-gray-900">({t.h}, {t.r}, {t.t})</span>
                  <span className={`ml-2 text-xs ${t.isTrue ? 'text-green-600' : 'text-red-500'}`}>{t.isTrue ? '真实' : '负样本'}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">选择打分函数（可多选）</p>
            <div className="flex flex-wrap gap-2">
              {SCORE_FNS.map(f => (
                <button key={f.id} onClick={() => toggleVizFn(f.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${vizFns.includes(f.id) ? COLOR_MAP[f.color] + ' border-current' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              得分对比：<span className="text-gray-900">({triple.h}, {triple.r}, {triple.t})</span>
            </p>
            <p className="text-xs text-gray-400 mb-4">距离类函数越小越好 · 相似度类函数越大越好</p>
            <div className="space-y-3">
              {SCORE_FNS.filter(f => vizFns.includes(f.id)).map(f => {
                const score = parseFloat(getScore(f.id, selectedTriple));
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="w-20 text-right">
                      <span className="text-sm font-semibold text-gray-700">{f.name}</span>
                      <span className="block text-[10px] text-gray-400">{f.type === 'distance' ? '距离↓' : '相似↑'}</span>
                    </div>
                    <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR_MAP[f.color]}`} style={{ width: `${score * 100}%` }} />
                      <span className="absolute right-2 top-0 h-full flex items-center text-xs font-mono text-gray-700">{score}</span>
                    </div>
                    <code className="text-xs text-gray-500 w-24 text-right font-mono">{f.formula}</code>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">全三元组得分热力表（已选打分函数）</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium min-w-[220px]">三元组</th>
                    {SCORE_FNS.filter(f => vizFns.includes(f.id)).map(f => (
                      <th key={f.id} className="px-3 py-2.5 text-gray-500 font-medium text-center">{f.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {SAMPLE_TRIPLES.map((t, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${i === selectedTriple ? 'bg-blue-50/60' : ''}`}>
                      <td className="px-3 py-2.5 text-gray-800">
                        ({t.h}, {t.r}, {t.t})
                        <span className={`ml-1 text-xs ${t.isTrue ? 'text-green-600' : 'text-red-500'}`}>{t.isTrue ? '✓' : '✗'}</span>
                      </td>
                      {SCORE_FNS.filter(f => vizFns.includes(f.id)).map(f => {
                        const score = parseFloat(getScore(f.id, i));
                        const intensity = Math.round(score * 100);
                        return (
                          <td key={f.id} className="px-3 py-2.5 text-center">
                            <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-semibold"
                              style={{ background: `hsl(${t.isTrue ? 220 : 0}, 70%, ${95 - intensity * 0.3}%)`, color: `hsl(${t.isTrue ? 220 : 0}, 70%, ${30 + intensity * 0.1}%)` }}>
                              {score}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
