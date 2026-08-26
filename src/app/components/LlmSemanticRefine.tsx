import { useEffect, useRef, useState } from 'react';
import { Play, FileText, GitBranch, CheckCircle2, Sparkles } from 'lucide-react';

export type LlmSemanticFocus = 'summary' | 'relation';

const SAMPLE_TEXT = `知识图谱补全旨在预测缺失的三元组，是下游问答与推荐系统的重要基础能力。传统嵌入模型如 TransE、RotatE 在稠密图上表现良好，但在低资源、长尾关系场景下性能显著下降。

本文提出类型感知的关系图注意力网络（RGAT），在消息传递过程中融合实体类型与关系路径特征，以缓解异构关系下的表示混淆。编码器对每个邻居按关系类型计算注意力权重，并将类型嵌入与实体表示拼接后聚合。

我们在 FB15k-237 与 WN18RR 基准上进行对比实验。所提模型在 FB15k-237 上 MRR 达到 0.412，Hits@10 为 0.587，较 CompGCN 基线提升约 3.2%。消融实验表明关系路径特征对长尾关系预测贡献最大。

此外，引入置信度校准模块，使预测分数可与人工审核阈值对齐，便于接入图谱构造流水线中的候选审核环节。`;

const SUMMARY_RESULT = [
  {
    para: 1,
    text: '知识图谱补全旨在预测缺失的三元组，是下游问答与推荐系统的重要基础能力。传统嵌入模型如 TransE、RotatE 在稠密图上表现良好，但在低资源、长尾关系场景下性能显著下降。',
    summary: '知识图谱补全对下游应用关键，但传统嵌入模型在低资源与长尾关系上表现不足。',
  },
  {
    para: 2,
    text: '本文提出类型感知的关系图注意力网络（RGAT），在消息传递过程中融合实体类型与关系路径特征，以缓解异构关系下的表示混淆。编码器对每个邻居按关系类型计算注意力权重，并将类型嵌入与实体表示拼接后聚合。',
    summary: '提出 RGAT，通过类型与路径特征及关系注意力缓解异构表示混淆。',
  },
  {
    para: 3,
    text: '我们在 FB15k-237 与 WN18RR 基准上进行对比实验。所提模型在 FB15k-237 上 MRR 达到 0.412，Hits@10 为 0.587，较 CompGCN 基线提升约 3.2%。消融实验表明关系路径特征对长尾关系预测贡献最大。',
    summary: '在标准基准上优于 CompGCN，路径特征对长尾关系提升最明显。',
  },
  {
    para: 4,
    text: '此外，引入置信度校准模块，使预测分数可与人工审核阈值对齐，便于接入图谱构造流水线中的候选审核环节。',
    summary: '置信度校准使预测可对接人工审核阈值与构造流水线。',
  },
];

const RELATION_RESULT = [
  { subject: '知识图谱补全', predicate: '支撑', object: '问答与推荐系统', evidence: '第1段' },
  { subject: 'TransE', predicate: '属于', object: '传统嵌入模型', evidence: '第1段' },
  { subject: 'RGAT', predicate: '融合', object: '实体类型与关系路径特征', evidence: '第2段' },
  { subject: 'RGAT', predicate: '缓解', object: '异构关系表示混淆', evidence: '第2段' },
  { subject: 'RGAT', predicate: '在…上达到MRR', object: 'FB15k-237 / 0.412', evidence: '第3段' },
  { subject: 'RGAT', predicate: '优于', object: 'CompGCN', evidence: '第3段' },
  { subject: '关系路径特征', predicate: '提升', object: '长尾关系预测', evidence: '第3段' },
  { subject: '置信度校准模块', predicate: '对齐', object: '人工审核阈值', evidence: '第4段' },
];

export default function LlmSemanticRefine({
  initialFocus,
}: {
  initialFocus?: LlmSemanticFocus | null;
}) {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState<LlmSemanticFocus | null>(initialFocus ?? null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const relationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !initialFocus) return;
    const el = initialFocus === 'summary' ? summaryRef.current : relationRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setFocus(initialFocus);
  }, [ready, initialFocus]);

  const run = () => {
    if (!text.trim() || running) return;
    setRunning(true);
    setReady(false);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 9 + Math.random() * 14;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => {
          setReady(true);
          setRunning(false);
          setFocus(initialFocus ?? null);
        }, 200);
      } else {
        setProgress(Math.min(p, 99));
      }
    }, 160);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">大语言模型语义提炼</h1>
          <p className="text-sm text-gray-500">
            利用大语言模型对文献内容进行更高层次的语义概括与关系提炼
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Input */}
        <div className="col-span-5 flex flex-col gap-3 min-h-0">
          <div className="bg-white border border-gray-200 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">输入论文文本</span>
              <span className="text-[10px] text-gray-400 ml-auto">段落以空行分隔</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setReady(false);
                setProgress(0);
              }}
              className="flex-1 min-h-0 p-4 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none"
              placeholder="粘贴文献正文段落…"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setText(SAMPLE_TEXT);
                setReady(false);
                setProgress(0);
              }}
              className="text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              恢复示例文本
            </button>
            <button
              type="button"
              onClick={run}
              disabled={!text.trim() || running}
              className="flex items-center gap-1.5 text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
            >
              {running ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {running ? '提炼中…' : '执行语义提炼'}
            </button>
            {(running || (progress > 0 && !ready)) && (
              <div className="flex-1 max-w-[180px]">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    LLM
                  </span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outputs */}
        <div className="col-span-7 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div
            ref={summaryRef}
            className={`bg-white border rounded-xl overflow-hidden flex flex-col shrink-0 ${
              focus === 'summary' ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-gray-200'
            }`}
          >
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FileText className={`w-4 h-4 ${focus === 'summary' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">段落级摘要生成</p>
                <p className="text-[11px] text-gray-400">为每个重要段落生成一句话核心摘要</p>
              </div>
              {ready && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
            </div>
            <div className="p-3 max-h-[280px] overflow-y-auto">
              {!ready ? (
                <p className="text-xs text-gray-400 text-center py-8">执行后在此展示段落摘要</p>
              ) : (
                <div className="space-y-2.5">
                  {SUMMARY_RESULT.map((s) => (
                    <div key={s.para} className="border border-gray-100 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          §{s.para}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate flex-1">{s.text.slice(0, 48)}…</span>
                      </div>
                      <p className="text-sm text-gray-900 leading-snug">{s.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            ref={relationRef}
            className={`bg-white border rounded-xl overflow-hidden flex flex-col flex-1 min-h-[200px] ${
              focus === 'relation' ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-gray-200'
            }`}
          >
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0">
              <GitBranch className={`w-4 h-4 ${focus === 'relation' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-semibold text-gray-900">关系语义提炼</p>
                <p className="text-[11px] text-gray-400">从长句或段落中提炼实体关系三元组</p>
              </div>
              {ready && (
                <span className="text-[11px] text-emerald-600 ml-auto flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {RELATION_RESULT.length} 条
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {!ready ? (
                <p className="text-xs text-gray-400 text-center py-8">执行后在此展示关系三元组</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] text-gray-400 bg-gray-50/80">
                      <th className="px-3 py-2 font-medium">主语</th>
                      <th className="px-3 py-2 font-medium">谓语</th>
                      <th className="px-3 py-2 font-medium">宾语</th>
                      <th className="px-3 py-2 font-medium w-16">出处</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RELATION_RESULT.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-3 py-2.5 text-xs font-medium text-gray-900">{r.subject}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {r.predicate}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{r.object}</td>
                        <td className="px-3 py-2.5 text-[10px] text-gray-400">{r.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
