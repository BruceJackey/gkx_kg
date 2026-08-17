import { useState } from 'react';
import { CheckCircle, ChevronRight, Settings, Play, Info } from 'lucide-react';
import {
  EmbeddingSpaceSelector,
  embeddingSpaceLabel,
  type EmbeddingSpace,
} from './EmbeddingSpaceSelector';

type ModelId = 'transe' | 'transh' | 'transr' | 'rescal' | 'distmult' | 'complex' | 'conve' | 'graphsage';
type CategoryId = 'translation' | 'decomposition' | 'neural';

interface Model {
  id: ModelId;
  name: string;
  category: CategoryId;
  paper: string;
  year: number;
  desc: string;
  strengths: string[];
  limitations: string[];
  complexity: string;
  mrr: string;
  hits10: string;
  defaultDim: number;
  defaultLr: string;
  defaultBatch: number;
  preferredSpace: EmbeddingSpace;
  supportsSymmetry: boolean;
  supportsAntisymmetry: boolean;
  supportsInverse: boolean;
  supportsComposition: boolean;
}

const MODELS: Model[] = [
  {
    id: 'transe', name: 'TransE', category: 'translation', paper: 'Bordes et al. 2013', year: 2013,
    desc: '最经典的平移距离模型，将关系建模为头尾实体嵌入之间的平移向量 h + r ≈ t。',
    strengths: ['计算简单，训练快', '参数量少，内存友好', '适合层次关系建模'],
    limitations: ['无法处理 1-to-N 关系', '不支持反对称、对称关系'],
    complexity: 'O(N·d)', mrr: '0.347', hits10: '53.1', defaultDim: 200, defaultLr: '0.01', defaultBatch: 128,
    preferredSpace: 'real',
    supportsSymmetry: false, supportsAntisymmetry: false, supportsInverse: false, supportsComposition: true,
  },
  {
    id: 'transh', name: 'TransH', category: 'translation', paper: 'Wang et al. 2014', year: 2014,
    desc: '将实体投影到关系特定的超平面后再做平移，可处理 1-to-N、N-to-1、N-to-N 等复杂映射关系。',
    strengths: ['支持复杂映射关系', '对 TransE 的直接改进', '投影机制直观'],
    limitations: ['参数量稍多', '投影可能引入误差'],
    complexity: 'O(N·d + R·d)', mrr: '0.382', hits10: '58.4', defaultDim: 200, defaultLr: '0.005', defaultBatch: 256,
    preferredSpace: 'real',
    supportsSymmetry: false, supportsAntisymmetry: false, supportsInverse: false, supportsComposition: true,
  },
  {
    id: 'transr', name: 'TransR', category: 'translation', paper: 'Lin et al. 2015', year: 2015,
    desc: '为每种关系学习独立的投影矩阵，将实体嵌入映射到关系空间后再做平移，表达能力更强。',
    strengths: ['每关系独立空间', '表达能力更强', '对复杂关系建模更精准'],
    limitations: ['参数量大', '计算开销高', '易过拟合'],
    complexity: 'O(N·d + R·d·k)', mrr: '0.421', hits10: '61.2', defaultDim: 100, defaultLr: '0.001', defaultBatch: 128,
    preferredSpace: 'real',
    supportsSymmetry: true, supportsAntisymmetry: true, supportsInverse: false, supportsComposition: true,
  },
  {
    id: 'rescal', name: 'RESCAL', category: 'decomposition', paper: 'Nickel et al. 2011', year: 2011,
    desc: '使用全矩阵双线性分解，对每种关系学习 d×d 矩阵，可捕捉丰富的实体对交互语义。',
    strengths: ['表达能力最强', '捕捉复杂实体交互', '支持所有关系模式'],
    limitations: ['参数量随关系数平方增长', '易过拟合', '不适合大规模图谱'],
    complexity: 'O(N·d + R·d²)', mrr: '0.356', hits10: '51.7', defaultDim: 100, defaultLr: '0.001', defaultBatch: 64,
    preferredSpace: 'real',
    supportsSymmetry: true, supportsAntisymmetry: true, supportsInverse: true, supportsComposition: true,
  },
  {
    id: 'distmult', name: 'DistMult', category: 'decomposition', paper: 'Yang et al. 2015', year: 2015,
    desc: '对角双线性模型，每种关系用 d 维向量而非矩阵表示，计算效率极高。得分函数为 h⊤ diag(r) t。',
    strengths: ['参数量少，极高效率', '易于大规模扩展', '训练稳定'],
    limitations: ['只能建模对称关系', '表达能力受限'],
    complexity: 'O(N·d)', mrr: '0.241', hits10: '41.9', defaultDim: 256, defaultLr: '0.002', defaultBatch: 512,
    preferredSpace: 'real',
    supportsSymmetry: true, supportsAntisymmetry: false, supportsInverse: false, supportsComposition: false,
  },
  {
    id: 'complex', name: 'ComplEx', category: 'decomposition', paper: 'Trouillon et al. 2016', year: 2016,
    desc: '将实体和关系嵌入扩展到复数域，通过 Hermitian 内积的实部作为得分，可建模非对称关系。',
    strengths: ['支持非对称关系', '参数量与 DistMult 相当', '理论完备性强'],
    limitations: ['复数运算需额外开销', '可解释性稍弱'],
    complexity: 'O(N·d)', mrr: '0.247', hits10: '44.0', defaultDim: 256, defaultLr: '0.002', defaultBatch: 512,
    preferredSpace: 'complex',
    supportsSymmetry: true, supportsAntisymmetry: true, supportsInverse: true, supportsComposition: false,
  },
  {
    id: 'conve', name: 'ConvE', category: 'neural', paper: 'Dettmers et al. 2018', year: 2018,
    desc: '将头实体与关系向量 reshape 为 2D 特征图后用卷积提取交互特征，再与尾实体做内积打分。',
    strengths: ['非线性交互建模', '参数高效', '泛化能力强'],
    limitations: ['超参数较多', '训练较慢', '可解释性低'],
    complexity: 'O(N·d + k·f)', mrr: '0.325', hits10: '50.1', defaultDim: 200, defaultLr: '0.003', defaultBatch: 128,
    preferredSpace: 'real',
    supportsSymmetry: true, supportsAntisymmetry: true, supportsInverse: true, supportsComposition: true,
  },
  {
    id: 'graphsage', name: 'GraphSAGE', category: 'neural', paper: 'Hamilton et al. 2017', year: 2017,
    desc: '归纳式图神经网络，通过对邻居节点采样并聚合生成节点嵌入，支持对未见节点的泛化推断。',
    strengths: ['支持归纳学习', '可处理动态图', '利用图结构信息'],
    limitations: ['需要图结构输入', '训练复杂度较高', '对超参数敏感'],
    complexity: 'O(N·K·d²)', mrr: '0.289', hits10: '46.3', defaultDim: 256, defaultLr: '0.0005', defaultBatch: 64,
    preferredSpace: 'real',
    supportsSymmetry: true, supportsAntisymmetry: true, supportsInverse: true, supportsComposition: true,
  },
];

const CATEGORIES: { id: CategoryId; label: string; color: string; border: string; bg: string; badge: string }[] = [
  { id: 'translation', label: '平移距离模型', color: 'text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  { id: 'decomposition', label: '张量/矩阵分解模型', color: 'text-purple-700', border: 'border-purple-300', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  { id: 'neural', label: '神经网络模型', color: 'text-indigo-700', border: 'border-indigo-300', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
];

const RELATION_PATTERNS = [
  { key: 'supportsSymmetry' as keyof Model, label: '对称关系' },
  { key: 'supportsAntisymmetry' as keyof Model, label: '反对称关系' },
  { key: 'supportsInverse' as keyof Model, label: '互逆关系' },
  { key: 'supportsComposition' as keyof Model, label: '组合关系' },
];

interface HyperParams {
  space: EmbeddingSpace;
  dim: number;
  lr: string;
  batch: number;
  epochs: number;
  margin: number;
  optimizer: string;
  negSamples: number;
  regularization: string;
}

export function EncodingModelDemo() {
  const [activeSection, setActiveSection] = useState<'library' | 'config'>('library');
  const [selectedModel, setSelectedModel] = useState<ModelId>('transe');
  const [expandedCategory, setExpandedCategory] = useState<CategoryId | null>('translation');
  const [saved, setSaved] = useState(false);

  const model = MODELS.find(m => m.id === selectedModel)!;
  const cat = CATEGORIES.find(c => c.id === model.category)!;

  const [params, setParams] = useState<HyperParams>({
    space: model.preferredSpace,
    dim: model.defaultDim,
    lr: model.defaultLr,
    batch: model.defaultBatch,
    epochs: 200,
    margin: 1.0,
    optimizer: 'adam',
    negSamples: 64,
    regularization: 'l2',
  });

  const selectModel = (id: ModelId) => {
    const m = MODELS.find(x => x.id === id)!;
    setSelectedModel(id);
    setSaved(false);
    setParams(p => ({
      ...p,
      space: m.preferredSpace,
      dim: m.defaultDim,
      lr: m.defaultLr,
      batch: m.defaultBatch,
    }));
  };

  const spaceMismatch = model.preferredSpace === 'complex' && params.space === 'real';
  const paramDim = params.space === 'complex' ? params.dim * 2 : params.dim;

  const SECTIONS = [
    { id: 'library' as const, label: '① 模型库' },
    { id: 'config' as const, label: '② 模型选择与超参数配置' },
  ];

  return (
    <div className="space-y-5">
      {/* Section nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ① Model Library ── */}
      {activeSection === 'library' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">编码模型库</h3>
            <p className="text-sm text-gray-500 mt-0.5">三大类共 8 个主流知识图谱嵌入模型，点击模型卡片可展开详情并快速跳转至配置页</p>
          </div>

          {CATEGORIES.map(category => {
            const catModels = MODELS.filter(m => m.category === category.id);
            const isExpanded = expandedCategory === category.id;
            return (
              <div key={category.id} className={`border-2 rounded-xl overflow-hidden transition-all ${isExpanded ? category.border : 'border-gray-200'}`}>
                {/* Category header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className={`w-full flex items-center justify-between px-5 py-3.5 ${isExpanded ? category.bg : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${isExpanded ? category.color : 'text-gray-700'}`}>{category.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpanded ? category.badge : 'bg-gray-200 text-gray-500'}`}>{catModels.length} 个模型</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 ' + category.color : 'text-gray-400'}`} />
                </button>

                {/* Model cards */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {catModels.map(m => (
                      <div key={m.id} className={`p-5 transition-colors ${selectedModel === m.id ? category.bg + '/50' : 'bg-white'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-gray-900">{m.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${category.badge}`}>{m.paper}</span>
                            {selectedModel === m.id && (
                              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" />已选
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono">MRR {m.mrr}</span>
                            <span>·</span>
                            <span className="font-mono">Hits@10 {m.hits10}%</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{m.desc}</p>

                        {/* Relation pattern support */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {RELATION_PATTERNS.map(rp => {
                            const supported = m[rp.key] as boolean;
                            return (
                              <span key={rp.key} className={`text-xs px-2 py-0.5 rounded-full border ${supported ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200 line-through'}`}>
                                {rp.label}
                              </span>
                            );
                          })}
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200 font-mono">{m.complexity}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div>
                            <p className="text-gray-400 mb-1">优势</p>
                            <ul className="space-y-0.5">
                              {m.strengths.map(s => <li key={s} className="text-gray-700">+ {s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">局限</p>
                            <ul className="space-y-0.5">
                              {m.limitations.map(l => <li key={l} className="text-gray-500">− {l}</li>)}
                            </ul>
                          </div>
                        </div>

                        <button
                          onClick={() => { selectModel(m.id); setActiveSection('config'); }}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedModel === m.id ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                          {selectedModel === m.id ? '配置此模型' : '选择并配置'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Comparison table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mt-2">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">模型能力横向对比（FB15k-237 测试集）</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/60 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-24">模型</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">类别</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">MRR</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">Hits@10</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">对称</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">反对称</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">互逆</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">组合</th>
                    <th className="text-center px-2 py-2.5 text-gray-500 font-medium">复杂度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MODELS.map(m => {
                    const c = CATEGORIES.find(x => x.id === m.category)!;
                    return (
                      <tr key={m.id} onClick={() => selectModel(m.id)}
                        className={`cursor-pointer transition-colors ${selectedModel === m.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-3 py-2.5 font-semibold text-gray-900">{m.name}</td>
                        <td className="px-2 py-2.5 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] ${c.badge}`}>{c.label.replace('模型库', '').replace('模型', '')}</span></td>
                        <td className="px-2 py-2.5 text-center font-mono text-blue-700 font-semibold">{m.mrr}</td>
                        <td className="px-2 py-2.5 text-center font-mono text-indigo-700">{m.hits10}%</td>
                        {(['supportsSymmetry','supportsAntisymmetry','supportsInverse','supportsComposition'] as (keyof Model)[]).map(k => (
                          <td key={k} className={`px-2 py-2.5 text-center font-semibold ${m[k] ? 'text-green-600' : 'text-gray-300'}`}>{m[k] ? '✓' : '−'}</td>
                        ))}
                        <td className="px-2 py-2.5 text-center font-mono text-gray-500 text-[10px]">{m.complexity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ② Config ── */}
      {activeSection === 'config' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">模型选择与超参数配置</h3>
              <p className="text-sm text-gray-500 mt-0.5">选择编码模型、表示空间（实数 / 复数）并配置训练超参数，保存后可直接发起训练</p>
            </div>
            <button onClick={() => setActiveSection('library')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              ← 返回模型库
            </button>
          </div>

          {/* Model picker */}
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map(category => (
              <div key={category.id} className={`border-2 rounded-xl overflow-hidden ${category.border}`}>
                <div className={`px-3 py-2 ${category.bg}`}>
                  <p className={`text-xs font-semibold ${category.color}`}>{category.label}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {MODELS.filter(m => m.category === category.id).map(m => (
                    <button key={m.id} onClick={() => selectModel(m.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${selectedModel === m.id ? category.bg + ' font-semibold' : 'bg-white hover:bg-gray-50'}`}>
                      <span className={`text-sm ${selectedModel === m.id ? category.color : 'text-gray-700'}`}>{m.name}</span>
                      {selectedModel === m.id && <CheckCircle className={`w-4 h-4 ${category.color}`} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Selected model summary */}
          <div className={`rounded-xl p-4 border-2 ${cat.border} ${cat.bg}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-base font-bold ${cat.color}`}>{model.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cat.badge}`}>{cat.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${model.preferredSpace === 'complex' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                推荐{model.preferredSpace === 'complex' ? '复数空间' : '实数空间'}
              </span>
              <span className="text-xs text-gray-500 font-mono">MRR {model.mrr} · Hits@10 {model.hits10}%</span>
            </div>
            <p className="text-sm text-gray-600">{model.desc}</p>
          </div>

          {/* Representation space */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">表示空间</p>
            <EmbeddingSpaceSelector
              value={params.space}
              onChange={(space) => { setParams(p => ({ ...p, space })); setSaved(false); }}
              showHeader={false}
            />
            {spaceMismatch && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  {model.name} 依赖 Hermitian 内积，建议选择<strong>复数空间嵌入</strong>，否则无法完整建模反对称与互逆关系。
                </span>
              </div>
            )}
            {params.space === 'complex' && model.preferredSpace === 'real' && (
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  {model.name} 默认在实数域训练。选用复数空间后参数量约为原来的 2 倍（当前等效维度 {paramDim}），训练与显存开销会增加。
                </span>
              </div>
            )}
          </div>

          {/* Hyperparams */}
          <div className="grid grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">核心超参数</p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">嵌入维度 (d)</label>
                  <span className="text-sm font-bold text-gray-900">{params.dim}</span>
                </div>
                <input type="range" min={64} max={512} step={64} value={params.dim}
                  onChange={e => { setParams(p => ({...p, dim: +e.target.value})); setSaved(false); }}
                  className="w-full accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>64</span><span>128</span><span>256</span><span>384</span><span>512</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">学习率</label>
                <select value={params.lr} onChange={e => { setParams(p => ({...p, lr: e.target.value})); setSaved(false); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="0.0001">0.0001（保守）</option>
                  <option value="0.0005">0.0005</option>
                  <option value="0.001">0.001（推荐）</option>
                  <option value="0.002">0.002</option>
                  <option value="0.005">0.005</option>
                  <option value="0.01">0.01（激进）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">批大小 (Batch Size)</label>
                <select value={params.batch} onChange={e => { setParams(p => ({...p, batch: +e.target.value})); setSaved(false); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  {[64, 128, 256, 512, 1024].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">训练轮数 (Epochs)</label>
                  <span className="text-sm font-bold text-gray-900">{params.epochs}</span>
                </div>
                <input type="range" min={50} max={1000} step={50} value={params.epochs}
                  onChange={e => { setParams(p => ({...p, epochs: +e.target.value})); setSaved(false); }}
                  className="w-full accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>50</span><span>500</span><span>1000</span></div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">高级参数</p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Margin（间隔参数）</label>
                  <span className="text-sm font-bold text-gray-900">{params.margin.toFixed(1)}</span>
                </div>
                <input type="range" min={0.5} max={5} step={0.5} value={params.margin}
                  onChange={e => { setParams(p => ({...p, margin: +e.target.value})); setSaved(false); }}
                  className="w-full accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>0.5</span><span>2.5</span><span>5.0</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">优化器</label>
                <select value={params.optimizer} onChange={e => { setParams(p => ({...p, optimizer: e.target.value})); setSaved(false); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="adam">Adam（推荐）</option>
                  <option value="sgd">SGD</option>
                  <option value="adagrad">Adagrad</option>
                  <option value="adamw">AdamW</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">负采样数</label>
                <select value={params.negSamples} onChange={e => { setParams(p => ({...p, negSamples: +e.target.value})); setSaved(false); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  {[16, 32, 64, 128, 256].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">正则化</label>
                <select value={params.regularization} onChange={e => { setParams(p => ({...p, regularization: e.target.value})); setSaved(false); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="none">无</option>
                  <option value="l1">L1</option>
                  <option value="l2">L2（推荐）</option>
                  <option value="dropout">Dropout</option>
                </select>
              </div>
            </div>
          </div>

          {/* Config summary */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">配置预览</p>
            <div className="grid grid-cols-4 gap-3 text-sm">
              {[
                { label: '模型', value: model.name },
                { label: '表示空间', value: embeddingSpaceLabel(params.space) },
                { label: '嵌入维度', value: `${params.dim}d` },
                { label: '实际参数维度', value: `${paramDim}d` },
                { label: '学习率', value: params.lr },
                { label: '批大小', value: String(params.batch) },
                { label: '训练轮数', value: `${params.epochs}` },
                { label: '优化器', value: params.optimizer.toUpperCase() },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className="font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">配置将用于下一次训练任务，不影响当前已部署版本</p>
            <div className="flex gap-3">
              <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                {saved ? '✓ 已保存' : '保存配置'}
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white transition-colors">
                <Play className="w-4 h-4" />发起训练
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
