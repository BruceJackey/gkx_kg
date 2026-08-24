import { useState, useRef, useEffect } from 'react';
import { Upload, Play, FileText, FlaskConical, BarChart3, Sigma, CheckCircle2 } from 'lucide-react';

type ParseFocus = 'core' | 'experiment' | 'chart' | 'formula';

const SAMPLE_LITERATURE = [
  { id: 'paper-1', name: '基于图神经网络的知识图谱补全研究.pdf', size: '2.4 MB' },
  { id: 'paper-2', name: 'Transformer在生物医学文献实体识别中的应用.pdf', size: '1.8 MB' },
  { id: 'paper-3', name: '多模态专利文献结构化解析方法.pdf', size: '3.1 MB' },
];

interface CoreElements {
  researchObject: string;
  methods: string[];
  conclusions: string[];
  innovations: string[];
}

interface ExperimentStep {
  step: number;
  action: string;
  materials: string[];
  parameters: Record<string, string>;
}

interface ChartItem {
  id: string;
  caption: string;
  type: 'line' | 'bar' | 'table';
  data: Record<string, string | number>[];
}

interface FormulaItem {
  id: string;
  latex: string;
  description: string;
  variables: Array<{ symbol: string; meaning: string; context: string }>;
}

interface ParseResult {
  core: CoreElements;
  experiments: ExperimentStep[];
  charts: ChartItem[];
  formulas: FormulaItem[];
}

const MOCK_RESULT: ParseResult = {
  core: {
    researchObject: '面向低资源领域的知识图谱关系补全任务，重点评估稀疏标注场景下的链接预测性能。',
    methods: [
      'RGAT（关系图注意力网络）作为编码器，融合实体类型与关系路径特征',
      '负采样策略结合类型约束，减少无效候选三元组',
      '在 FB15k-237 与 WN18RR 基准上进行对比实验',
    ],
    conclusions: [
      '所提模型在 FB15k-237 上 MRR 达到 0.412，Hits@10 为 0.587，较基线提升 3.2%',
      '在低资源（10% 标注）设定下仍保持 Hits@10 > 0.51，泛化性优于 TransE 与 CompGCN',
      '消融实验表明关系路径特征对长尾关系预测贡献最大（+1.8% MRR）',
    ],
    innovations: [
      '提出类型感知的注意力聚合机制，缓解异构关系下的表示混淆',
      '引入置信度校准模块，使预测分数可与人工审核阈值对齐',
    ],
  },
  experiments: [
    {
      step: 1,
      action: '数据预处理与划分',
      materials: ['FB15k-237 原始三元组', '实体/关系类型词典'],
      parameters: { '训练/验证/测试': '80% / 10% / 10%', '随机种子': '42' },
    },
    {
      step: 2,
      action: '模型训练',
      materials: ['PyTorch 2.1', 'NVIDIA A100 × 2'],
      parameters: { '学习率': '1e-3', 'Batch Size': '1024', 'Epochs': '500', 'Dropout': '0.2' },
    },
    {
      step: 3,
      action: '链接预测评估',
      materials: ['Filtered 设置评估脚本', 'MRR / Hits@k 指标'],
      parameters: { 'k': '1, 3, 10', '负样本数': '50' },
    },
    {
      step: 4,
      action: '消融与可视化',
      materials: ['注意力权重导出模块', 'TensorBoard'],
      parameters: { '消融维度': '路径特征 / 类型嵌入 / 校准模块', '可视化样本': '200 条' },
    },
  ],
  charts: [
    {
      id: 'Fig.3',
      caption: '不同模型在 FB15k-237 上的 MRR 对比',
      type: 'bar',
      data: [
        { model: 'TransE', MRR: 0.294 },
        { model: 'CompGCN', MRR: 0.355 },
        { model: 'RGAT (Ours)', MRR: 0.412 },
      ],
    },
    {
      id: 'Table 2',
      caption: '低资源设定下 Hits@10 结果（%）',
      type: 'table',
      data: [
        { setting: '100% 标注', TransE: 46.3, CompGCN: 52.1, Ours: 58.7 },
        { setting: '10% 标注', TransE: 38.9, CompGCN: 44.6, Ours: 51.2 },
      ],
    },
  ],
  formulas: [
    {
      id: 'Eq.(1)',
      latex: 'h_r = \\mathrm{softmax}\\left(\\frac{Q K^\\top}{\\sqrt{d_k}}\\right) V',
      description: '关系感知的图注意力聚合，对邻居实体表示进行加权求和。',
      variables: [
        { symbol: 'Q, K, V', meaning: '查询/键/值投影矩阵', context: '第 3.2 节「关系图注意力层」' },
        { symbol: 'd_k', meaning: '键向量维度', context: '用于缩放注意力分数，防止梯度消失' },
        { symbol: 'h_r', meaning: '关系 r 下的实体表示', context: '作为链接预测解码器输入' },
      ],
    },
    {
      id: 'Eq.(5)',
      latex: 'P(h, r, t) = \\sigma\\left( \\mathbf{w}^\\top \\phi([\\mathbf{h}_h; \\mathbf{h}_r; \\mathbf{h}_t]) \\right)',
      description: '三元组得分函数，经 Sigmoid 映射为链接存在概率。',
      variables: [
        { symbol: 'P(h,r,t)', meaning: '三元组置信度', context: '第 4.1 节「链接预测目标」' },
        { symbol: 'φ(·)', meaning: '非线性变换（MLP）', context: '融合头实体、关系、尾实体向量' },
        { symbol: 'σ', meaning: 'Sigmoid 激活', context: '输出范围 [0,1]，便于阈值过滤' },
      ],
    },
  ],
};

const FOCUS_SECTIONS: Record<ParseFocus, { id: string; label: string }> = {
  core: { id: 'parse-core', label: '核心要素抽取' },
  experiment: { id: 'parse-experiment', label: '实验步骤解析' },
  chart: { id: 'parse-chart', label: '图表内容结构化' },
  formula: { id: 'parse-formula', label: '数理模型解析' },
};

/**
 * 审计目录专用：文献多维度解析（核心要素 / 实验 / 图表 / 公式一次抽取）
 */
export default function LiteratureMultidimensionalParse({ initialFocus }: { initialFocus?: ParseFocus }) {
  const [selectedFile, setSelectedFile] = useState<typeof SAMPLE_LITERATURE[0] | null>(SAMPLE_LITERATURE[0]);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayName = uploadName ?? selectedFile?.name ?? '';

  useEffect(() => {
    if (!initialFocus || result) return;
    setSelectedFile(SAMPLE_LITERATURE[0]);
    setUploadName(null);
    setRunning(true);
    const timer = window.setTimeout(() => {
      setResult(MOCK_RESULT);
      setRunning(false);
    }, 1200);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- audit deep-link: run once on mount
  }, [initialFocus]);

  useEffect(() => {
    if (!initialFocus || !result) return;
    const timer = window.setTimeout(() => {
      scrollRef.current?.querySelector(`#${FOCUS_SECTIONS[initialFocus].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [initialFocus, result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadName(file.name);
      setSelectedFile(null);
      setResult(null);
    }
  };

  const runParse = () => {
    if (!displayName) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setResult(MOCK_RESULT);
      setRunning(false);
    }, 1800);
  };

  return (
    <div ref={scrollRef} className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">多维度文献解析引擎</h1>
          <p className="text-sm text-gray-500">上传文献后一次抽取，统一返回核心要素、实验步骤、图表与数理模型</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-3xl space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">上传文献</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-6 py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <Upload className="w-8 h-8 text-gray-300" />
            <span className="text-sm text-gray-600">点击上传 PDF / Word / TXT</span>
            <span className="text-xs text-gray-400">或将下方示例文献作为输入</span>
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />
          </label>
          {displayName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate">{displayName}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_LITERATURE.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setSelectedFile(p); setUploadName(null); setResult(null); }}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                selectedFile?.id === p.id && !uploadName
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {p.name.replace('.pdf', '')}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={runParse}
          disabled={!displayName || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {running ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? '解析中…' : '启动多维度解析'}
        </button>
      </div>

      {result && (
        <div className="space-y-4 max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            解析完成 · 共识别 {result.experiments.length} 个实验步骤、{result.charts.length} 个图表、{result.formulas.length} 条公式
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 核心要素 */}
            <section id="parse-core" className="bg-white border border-violet-200 rounded-xl overflow-hidden">
              <div className="bg-violet-50 px-4 py-2.5 border-b border-violet-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-800">核心要素抽取</span>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">研究对象</div>
                  <p className="text-gray-800">{result.core.researchObject}</p>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">所用方法</div>
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {result.core.methods.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">主要结论</div>
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {result.core.conclusions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">创新点</div>
                  <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                    {result.core.innovations.map((inv, i) => <li key={i}>{inv}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            {/* 实验步骤 */}
            <section id="parse-experiment" className="bg-white border border-emerald-200 rounded-xl overflow-hidden">
              <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">实验步骤解析</span>
              </div>
              <div className="p-4 space-y-3">
                {result.experiments.map((exp) => (
                  <div key={exp.step} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">{exp.step}</span>
                      <span className="text-sm font-medium text-gray-800">{exp.action}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1.5">
                      <span className="text-gray-400">材料：</span>{exp.materials.join(' · ')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(exp.parameters).map(([k, v]) => (
                        <span key={k} className="text-[10px] bg-white border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 图表结构化 */}
            <section id="parse-chart" className="bg-white border border-blue-200 rounded-xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">图表内容结构化</span>
              </div>
              <div className="p-4 space-y-4">
                {result.charts.map((chart) => (
                  <div key={chart.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 border-b border-gray-100">
                      <span className="font-medium text-gray-800">{chart.id}</span> · {chart.caption}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-white border-b border-gray-100">
                          <tr>
                            {Object.keys(chart.data[0]).map((col) => (
                              <th key={col} className="text-left px-3 py-2 text-gray-500 font-medium">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {chart.data.map((row, ri) => (
                            <tr key={ri}>
                              {Object.values(row).map((val, ci) => (
                                <td key={ci} className="px-3 py-2 text-gray-800">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 数理模型 */}
            <section id="parse-formula" className="bg-white border border-amber-200 rounded-xl overflow-hidden">
              <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center gap-2">
                <Sigma className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">数理模型解析</span>
              </div>
              <div className="p-4 space-y-4">
                {result.formulas.map((f) => (
                  <div key={f.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-700">{f.id}</span>
                      <span className="text-xs text-gray-500">{f.description}</span>
                    </div>
                    <pre className="text-sm font-mono bg-gray-900 text-green-300 rounded-lg px-4 py-3 overflow-x-auto">{f.latex}</pre>
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">变量关联</div>
                      {f.variables.map((v) => (
                        <div key={v.symbol} className="text-xs flex gap-2 flex-wrap">
                          <code className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-100">{v.symbol}</code>
                          <span className="text-gray-600">{v.meaning}</span>
                          <span className="text-gray-400">— {v.context}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export type LiteratureParseFocus = 'core' | 'experiment' | 'chart' | 'formula';
