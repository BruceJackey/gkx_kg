import { useState } from 'react';
import { Check, CheckCircle, XCircle } from 'lucide-react';

const SPACE_OPTIONS = [
  {
    id: 'real' as const,
    name: '实数空间嵌入', symbol: 'ℝ', badge: '推荐',
    badgeClass: 'bg-blue-100 text-blue-700',
    cardClass: 'border-blue-200 bg-blue-50/60',
    selectedClass: 'border-blue-500 bg-blue-50 ring-2 ring-blue-400',
    description: '将实体和关系表示为传统实数向量，计算高效，适用于大多数基础模型，是通用知识图谱任务的推荐选择。',
    models: ['TransE', 'DistMult', 'Node2Vec', 'GraphSAGE'],
    mathProps: [
      { label: '向量空间', value: 'ℝᵈ' }, { label: '内积运算', value: '标准点积' },
      { label: '关系变换', value: '加性 / 乘性' }, { label: '参数规模', value: '2N·d' },
    ],
    supported: ['对称关系', '传递关系', '层次关系'],
    unsupported: ['反对称关系', '互逆关系'],
    pros: ['计算效率高', '显存占用低', '可解释性强', '兼容模型多'],
    cons: ['无法建模反对称关系', '关系模式表达有限'],
  },
  {
    id: 'complex' as const,
    name: '复数空间嵌入', symbol: 'ℂ', badge: '高精度',
    badgeClass: 'bg-purple-100 text-purple-700',
    cardClass: 'border-purple-200 bg-purple-50/60',
    selectedClass: 'border-purple-500 bg-purple-50 ring-2 ring-purple-400',
    description: '将实体和关系表示为复数向量，实部与虚部协同建模，能有效处理对称/反对称/互逆等复杂关系语义模式。',
    models: ['ComplEx', 'RotatE', 'QuatE', 'HolE'],
    mathProps: [
      { label: '向量空间', value: 'ℂᵈ（实+虚）' }, { label: '内积运算', value: 'Hermitian 内积' },
      { label: '关系变换', value: '旋转 / 反射' }, { label: '参数规模', value: '4N·d' },
    ],
    supported: ['对称关系', '反对称关系', '互逆关系', '传递关系'],
    unsupported: [],
    pros: ['支持反对称关系', '建模互逆关系', '关系模式丰富', '理论表达力更强'],
    cons: ['参数量约为实数空间2倍', '训练时间更长', '可解释性稍弱'],
  },
];

export function RepresentationSpaceDemo() {
  const [selectedSpace, setSelectedSpace] = useState<'real' | 'complex'>('real');
  const [dimension, setDimension] = useState(256);
  const [saved, setSaved] = useState(false);

  const sel = SPACE_OPTIONS.find(s => s.id === selectedSpace)!;
  const memMB = ((selectedSpace === 'complex' ? 2 : 1) * dimension * 100000 * 4 / 1024 / 1024).toFixed(0);
  const expressLevel = dimension < 128 ? '基础' : dimension < 256 ? '均衡' : dimension < 512 ? '高效' : '极强';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">表示空间类型选择</h3>
        <p className="text-sm text-gray-500">为模型训练选择实体与关系的嵌入空间类型。空间类型直接决定模型可建模的关系模式范围与计算开销。</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SPACE_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => { setSelectedSpace(opt.id); setSaved(false); }}
            className={`text-left p-5 rounded-xl border-2 transition-all ${selectedSpace === opt.id ? opt.selectedClass : opt.cardClass + ' hover:border-gray-300'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center text-xl font-bold text-gray-700 select-none">{opt.symbol}</div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${opt.badgeClass}`}>{opt.badge}</span>
            </div>
            <p className="font-semibold text-gray-900 text-[14px] mb-1.5">{opt.name}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{opt.description}</p>
          </button>
        ))}
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 select-none">{sel.symbol}</div>
          <div>
            <p className="text-sm font-medium text-gray-900">{sel.name}</p>
            <p className="text-xs text-gray-400">当前选择 · 切换后需重新训练</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">数学特性</p>
            <div className="grid grid-cols-2 gap-2">
              {sel.mathProps.map(p => (
                <div key={p.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{p.label}</p>
                  <p className="text-sm font-medium text-gray-800">{p.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">关系模式支持</p>
            <div className="space-y-1.5">
              {sel.supported.map(r => (
                <div key={r} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /><span className="text-gray-700">{r}</span>
                </div>
              ))}
              {sel.unsupported.map(r => (
                <div key={r} className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" /><span className="text-gray-400">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">优势</p>
            <ul className="space-y-1.5">
              {sel.pros.map(p => (<li key={p} className="flex items-start gap-1.5 text-sm text-gray-600"><span className="text-green-500 font-bold flex-shrink-0">+</span>{p}</li>))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">局限</p>
            <ul className="space-y-1.5">
              {sel.cons.map(c => (<li key={c} className="flex items-start gap-1.5 text-sm text-gray-600"><span className="text-amber-500 font-bold flex-shrink-0">−</span>{c}</li>))}
            </ul>
          </div>
        </div>
        <div className="px-6 pb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">适配模型</p>
          <div className="flex flex-wrap gap-2">
            {sel.models.map(m => (<span key={m} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm rounded-full">{m}</span>))}
          </div>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl p-6 space-y-5">
        <p className="text-sm font-semibold text-gray-900">嵌入维度配置</p>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600">向量维度 d</label>
            <span className="text-sm font-semibold text-gray-900">{dimension} 维</span>
          </div>
          <input type="range" min={64} max={1024} step={64} value={dimension} onChange={e => { setDimension(+e.target.value); setSaved(false); }} className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>64 轻量</span><span>256 均衡</span><span>512 高精</span><span>1024 最大</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">实际参数维度</p>
            <p className="text-sm font-semibold text-gray-900">{selectedSpace === 'complex' ? dimension * 2 : dimension} 维</p>
            <p className="text-xs text-gray-400">{selectedSpace === 'complex' ? `实虚各 ${dimension}` : '实数'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">显存估算（10万实体）</p>
            <p className="text-sm font-semibold text-gray-900">{memMB} MB</p>
            <p className="text-xs text-gray-400">float32 精度</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">表达能力评级</p>
            <p className="text-sm font-semibold text-gray-900">{expressLevel}</p>
            <p className="text-xs text-gray-400">综合评估</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {saved ? <><Check className="w-4 h-4" />已保存</> : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
