import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Upload,
  Play,
  Image as ImageIcon,
  Table2,
  Sigma,
  Link2,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export type MultimodalFocus = 'image' | 'table' | 'latex' | 'caption';

type UploadSlot = { name: string; sizeLabel: string };

const SAMPLE: UploadSlot = {
  name: 'paper_figures_and_tables.pdf',
  sizeLabel: '3.2 MB',
};

const MOCK = {
  image: {
    type: '折线/柱状混合实验图',
    typeConfidence: 0.93,
    ocrLines: [
      'Fig. 3  Different models on FB15k-237 (MRR)',
      'TransE  0.294',
      'CompGCN  0.355',
      'RGAT (Ours)  0.412',
      'x-axis: Model   y-axis: MRR',
    ],
    series: [
      { label: 'TransE', value: 0.294 },
      { label: 'CompGCN', value: 0.355 },
      { label: 'RGAT (Ours)', value: 0.412 },
    ],
  },
  table: {
    caption: 'Tab. 2  Main results (MRR / Hits@10)',
    headers: ['Model', 'MRR', 'Hits@1', 'Hits@10'],
    rows: [
      ['TransE', '0.294', '0.189', '0.465'],
      ['RotatE', '0.338', '0.241', '0.533'],
      ['CompGCN', '0.355', '0.264', '0.550'],
      ['RGAT (Ours)', '0.412', '0.301', '0.587'],
    ],
  },
  latex: [
    {
      id: 'eq.1',
      source: '公式图片 / page 4',
      code: 'h_{(u,r)} = \\sigma\\Big(\\sum_{v \\in \\mathcal{N}_r(u)} \\alpha_{uv}^{r}\\, W_r e_v\\Big)',
    },
    {
      id: 'eq.2',
      source: 'MathType 对象',
      code: '\\mathcal{L} = -\\sum_{(h,r,t)\\in \\mathcal{T}} \\log \\sigma\\big(f(h,r,t) - \\gamma\\big)',
    },
  ],
  captions: [
    {
      figId: 'Fig.1',
      caption: 'RGAT 模型整体架构',
      note: '实线为消息传递，虚线为类型嵌入拼接',
      refs: ['第 3 节第 2 段', '第 5 节讨论'],
    },
    {
      figId: 'Fig.3',
      caption: '不同模型在 FB15k-237 上的 MRR 对比',
      note: '误差棒为 5 次随机种子标准差',
      refs: ['第 4.2 节', '摘要末句'],
    },
    {
      figId: 'Tab.2',
      caption: '主实验结果（MRR / Hits@k）',
      note: '加粗为最优结果',
      refs: ['第 4.1 节', '表注下方说明'],
    },
  ],
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Panel({
  title,
  desc,
  icon: Icon,
  highlight,
  panelRef,
  children,
  ready,
}: {
  title: string;
  desc: string;
  icon: typeof ImageIcon;
  highlight?: boolean;
  panelRef?: (el: HTMLDivElement | null) => void;
  children: ReactNode;
  ready: boolean;
}) {
  return (
    <div
      ref={panelRef}
      className={`bg-white border rounded-xl overflow-hidden flex flex-col min-h-0 ${
        highlight ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-gray-200'
      }`}
    >
      <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50 flex items-start gap-2 shrink-0">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-indigo-600' : 'text-gray-400'}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-[11px] text-gray-400 leading-snug">{desc}</p>
        </div>
        {ready && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0 mt-0.5" />}
      </div>
      <div className="p-3 flex-1 overflow-y-auto text-sm min-h-[140px]">
        {children}
      </div>
    </div>
  );
}

export default function MultimodalContentTranscribe({
  initialFocus,
}: {
  initialFocus?: MultimodalFocus | null;
}) {
  const [file, setFile] = useState<UploadSlot | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState<MultimodalFocus | null>(initialFocus ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRefs = useRef<Partial<Record<MultimodalFocus, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (!initialFocus || !ready) return;
    const el = panelRefs.current[initialFocus];
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [initialFocus, ready]);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    setFile({ name: f.name, sizeLabel: formatSize(f.size) });
    setReady(false);
    setProgress(0);
  };

  const run = () => {
    if (!file || running) return;
    setRunning(true);
    setReady(false);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 10 + Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => {
          setReady(true);
          setRunning(false);
          setFocus(initialFocus ?? null);
        }, 180);
      } else {
        setProgress(Math.min(p, 99));
      }
    }, 160);
  };

  const empty = (
    <p className="text-xs text-gray-400 h-full flex items-center justify-center">等待识别结果…</p>
  );

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">多模态内容识别与转写</h1>
          <p className="text-sm text-gray-500">
            对解析出的非文本内容进行深度识别与结构化转写：图像、表格、公式与图注索引
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-shrink-0 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <div
          className="flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors min-w-[240px]"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onPick(e.dataTransfer.files?.[0]);
          }}
        >
          <Upload className="w-4 h-4 text-gray-400" />
          <div className="min-w-0">
            {file ? (
              <>
                <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">{file.sizeLabel}</p>
              </>
            ) : (
              <p className="text-xs text-gray-500">上传图像或 PDF</p>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf,image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setFile(SAMPLE);
            setReady(false);
            setProgress(0);
          }}
          className="text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          使用示例文件
        </button>

        <button
          type="button"
          onClick={run}
          disabled={!file || running}
          className="flex items-center gap-1.5 text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
        >
          {running ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {running ? '识别中…' : '开始识别与转写'}
        </button>

        {(running || (progress > 0 && !ready)) && (
          <div className="flex-1 min-w-[160px] max-w-xs">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>图像 · 表格 · 公式 · 图注</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {ready && (
          <span className="text-[11px] text-emerald-600 flex items-center gap-1 ml-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            四项结果已填入下方对应区域
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 overflow-y-auto content-start pb-1">
        <Panel
          title="图像识别与内容提取"
          desc="识别图像类型，并提取图中的文字和数据"
          icon={ImageIcon}
          highlight={focus === 'image'}
          panelRef={(el) => {
            panelRefs.current.image = el;
          }}
          ready={ready}
        >
          {!ready ? (
            empty
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">类型</span>
                <span className="font-medium text-gray-900">{MOCK.image.type}</span>
                <span className="text-[10px] text-emerald-600 ml-auto">
                  {(MOCK.image.typeConfidence * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 mb-1">OCR 文字</p>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 space-y-0.5">
                  {MOCK.image.ocrLines.map((l) => (
                    <p key={l} className="text-[11px] font-mono text-gray-700">
                      {l}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 mb-1">提取数据序列</p>
                <div className="flex flex-wrap gap-1.5">
                  {MOCK.image.series.map((s) => (
                    <span
                      key={s.label}
                      className="text-[11px] px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {s.label}: {s.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="表格结构还原"
          desc="将图片或 PDF 中的表格还原为可编辑行列结构"
          icon={Table2}
          highlight={focus === 'table'}
          panelRef={(el) => {
            panelRefs.current.table = el;
          }}
          ready={ready}
        >
          {!ready ? (
            empty
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-500">{MOCK.table.caption}</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {MOCK.table.headers.map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-semibold text-gray-600">
                          <input
                            defaultValue={h}
                            className="w-full bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-0.5"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK.table.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-2 py-1">
                            <input
                              defaultValue={cell}
                              className={`w-full bg-transparent focus:outline-none focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-300 rounded px-0.5 ${
                                j === 0 ? 'font-medium text-gray-800' : 'font-mono text-gray-700'
                              }`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-400">单元格可直接编辑</p>
            </div>
          )}
        </Panel>

        <Panel
          title="LaTeX公式转写"
          desc="将公式图片或 MathType 对象转写为标准 LaTeX"
          icon={Sigma}
          highlight={focus === 'latex'}
          panelRef={(el) => {
            panelRefs.current.latex = el;
          }}
          ready={ready}
        >
          {!ready ? (
            empty
          ) : (
            <div className="space-y-2.5">
              {MOCK.latex.map((eq) => (
                <div key={eq.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-indigo-600">{eq.id}</span>
                    <span className="text-[10px] text-gray-400">{eq.source}</span>
                  </div>
                  <pre className="px-2.5 py-2 text-[11px] font-mono text-gray-800 whitespace-pre-wrap leading-relaxed bg-white">
                    {eq.code}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="图注/文中索引识别"
          desc="关联图表标题、注释以及正文中对图表的引用"
          icon={Link2}
          highlight={focus === 'caption'}
          panelRef={(el) => {
            panelRefs.current.caption = el;
          }}
          ready={ready}
        >
          {!ready ? (
            empty
          ) : (
            <div className="space-y-2">
              {MOCK.captions.map((c) => (
                <div key={c.figId} className="border border-gray-100 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="text-[11px] font-mono text-emerald-600">{c.figId}</span>
                    <span className="text-xs font-medium text-gray-800">{c.caption}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 pl-5">注释：{c.note}</p>
                  <div className="pl-5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-gray-400 mr-1">正文引用</span>
                    {c.refs.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
