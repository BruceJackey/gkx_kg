import { useState, useRef, useEffect } from 'react';
import { Upload, Play, FileText, Grid3x3, Tag, CheckCircle2, Link2, Boxes } from 'lucide-react';

export type PatentParseFocus = 'claims' | 'matrix' | 'annotation' | 'modules';

const SAMPLE_PATENTS = [
  { id: 'pat-1', name: '一种基于图注意力的知识抽取方法及装置.pdf' },
  { id: 'pat-2', name: '一种有机发光材料及其制备方法.pdf' },
  { id: 'pat-3', name: '一种低功耗传感器电路及芯片.pdf' },
];

/** 模拟解析接口返回的纯文本字段 */
interface ParseApiResponse {
  claims_text: string;
  matrix_text: string;
  annotation_text: string;
  modules_text: string;
}

const MOCK_API_RESPONSE: ParseApiResponse = {
  claims_text: `权利要求1（独立权利要求）
F1：获取待抽取文本语料（限定：输入端）
F2：构建实体-关系异构图（限定：依存于F1）
F3：通过图注意力网络聚合邻居特征（限定：依存于F2；注意力头数≥4）
F4：输出结构化三元组集合（限定：依存于F3）

权利要求2（从属权利要求）
F5：所述注意力网络采用多头关系感知注意力（限定：限定F3）
F6：对长尾关系施加类型约束负采样（限定：限定F4）`,

  matrix_text: `技术特征\t技术功效\t关联强度
图注意力聚合\t提升稀疏关系召回率\t强
类型约束负采样\t降低无效候选比例\t中
多头关系感知\t区分异构邻域语义\t强
结构化三元组输出\t便于下游图谱入库\t中`,

  annotation_text: `化学分子式：C18H14N2O2 — 有机发光主体材料骨架（说明书实施例3）
电路图元件：Q1 / 低噪声放大器 — 前端射频放大级（附图2电路框图）
电路图信号：CLK_EN — 时钟门控使能信号（权利要求4、附图3）
参数标注：Vdd = 1.2V — 核心供电电压约束（说明书第42段）`,

  modules_text: `模块M1：语料接入模块 — 接收并预处理待抽取文本，支持批量与流式输入
模块M2：异构图构建模块 — 将实体与关系组织为可计算的图结构，可复用于其他抽取任务
模块M3：关系感知注意力模块 — 多头聚合邻居特征，可独立替换为其他图编码器
模块M4：三元组解码输出模块 — 将编码结果映射为结构化三元组并校验类型约束
模块M5：负采样与训练策略模块 — 提供类型约束负采样，可复用于链接预测场景`,
};

const FOCUS_IDS: Record<PatentParseFocus, string> = {
  claims: 'patent-parse-claims',
  matrix: 'patent-parse-matrix',
  annotation: 'patent-parse-annotation',
  modules: 'patent-parse-modules',
};

function TextBox({ text }: { text: string }) {
  return (
    <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed bg-white min-h-[120px]">
      {text}
    </pre>
  );
}

/**
 * 审计目录专用：专利技术要素解构
 * 解析接口返回纯文本，分别填入三个结果框
 */
export default function PatentTechnicalElementParse({ initialFocus }: { initialFocus?: PatentParseFocus }) {
  const [selected, setSelected] = useState(SAMPLE_PATENTS[0]);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ParseApiResponse | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayName = uploadName ?? selected.name;

  const applyMockResponse = () => {
    setResult(MOCK_API_RESPONSE);
  };

  useEffect(() => {
    if (!initialFocus || result) return;
    setRunning(true);
    const timer = window.setTimeout(() => {
      applyMockResponse();
      setRunning(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFocus]);

  useEffect(() => {
    if (!initialFocus || !result) return;
    const timer = window.setTimeout(() => {
      scrollRef.current?.querySelector(`#${FOCUS_IDS[initialFocus]}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [initialFocus, result]);

  const runParse = () => {
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      applyMockResponse();
      setRunning(false);
    }, 1400);
  };

  return (
    <div ref={scrollRef} className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">技术要素解构框架</h1>
          <p className="text-sm text-gray-500">上传专利后执行解析，将接口返回的纯文本分别展示在四个结果框中</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-3xl space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">上传专利</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-6 py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <Upload className="w-8 h-8 text-gray-300" />
            <span className="text-sm text-gray-600">点击上传专利 PDF / DOC</span>
            <span className="text-xs text-gray-400">或选择下方示例专利</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setUploadName(f.name);
                  setResult(null);
                }
              }}
            />
          </label>
          {displayName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate">{displayName}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PATENTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setSelected(p); setUploadName(null); setResult(null); }}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                selected.id === p.id && !uploadName
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
          {running ? '解析中…' : '执行解析'}
        </button>
      </div>

      {result && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            解析完成 · 已将接口返回文本填入下方四个结果框
          </div>

          <section id="patent-parse-claims" className="bg-white border border-violet-200 rounded-xl overflow-hidden">
            <div className="bg-violet-50 px-4 py-2.5 border-b border-violet-100 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-800">权利要求深度解析</span>
              <span className="text-[10px] text-violet-400 ml-auto">claims_text</span>
            </div>
            <TextBox text={result.claims_text} />
          </section>

          <section id="patent-parse-matrix" className="bg-white border border-emerald-200 rounded-xl overflow-hidden">
            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">技术功效矩阵自动生成</span>
              <span className="text-[10px] text-emerald-400 ml-auto">matrix_text</span>
            </div>
            <TextBox text={result.matrix_text} />
          </section>

          <section id="patent-parse-annotation" className="bg-white border border-blue-200 rounded-xl overflow-hidden">
            <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">专业内容语义化标注</span>
              <span className="text-[10px] text-blue-400 ml-auto">annotation_text</span>
            </div>
            <TextBox text={result.annotation_text} />
          </section>

          <section id="patent-parse-modules" className="bg-white border border-amber-200 rounded-xl overflow-hidden">
            <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">技术方案模块化拆解</span>
              <span className="text-[10px] text-amber-400 ml-auto">modules_text</span>
            </div>
            <TextBox text={result.modules_text} />
          </section>
        </div>
      )}
    </div>
  );
}
