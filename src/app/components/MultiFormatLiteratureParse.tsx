import { useRef, useState } from 'react';
import {
  FileText,
  FileCode2,
  Globe,
  Upload,
  Play,
  CheckCircle2,
  Image as ImageIcon,
  Table2,
  Info,
  Layers,
} from 'lucide-react';

export type LitFormatTab = 'pdf' | 'jats' | 'html';

type UploadSlot = {
  name: string;
  sizeLabel: string;
  hint?: string;
};

const FORMAT_META: Record<
  LitFormatTab,
  {
    label: string;
    short: string;
    accept: string;
    desc: string;
    icon: typeof FileText;
    sample: UploadSlot;
  }
> = {
  pdf: {
    label: 'PDF解析',
    short: 'PDF',
    accept: '.pdf,application/pdf',
    desc: '从 PDF 提取文本、图片、表格与元数据',
    icon: FileText,
    sample: { name: 'RGAT_knowledge_graph_completion.pdf', sizeLabel: '2.4 MB' },
  },
  jats: {
    label: 'XML(JATS)解析',
    short: 'JATS',
    accept: '.xml,application/xml,text/xml',
    desc: '解析标准 JATS-XML，获得更精确的文献结构',
    icon: FileCode2,
    sample: { name: 'pmc_article_10.5555_3295222.jats.xml', sizeLabel: '486 KB' },
  },
  html: {
    label: 'HTML解析',
    short: 'HTML',
    accept: '.html,.htm,text/html',
    desc: '解析在线 / 离线 HTML 格式文献页面',
    icon: Globe,
    sample: {
      name: 'https://doi.org/10.5555/3295222.3295349',
      sizeLabel: 'URL',
      hint: '也可上传本地 .html 快照',
    },
  },
};

type ParseOutput = {
  meta: Array<{ key: string; value: string }>;
  sections: Array<{ title: string; paragraphs: number; preview: string }>;
  figures: Array<{ id: string; caption: string; page?: number }>;
  tables: Array<{ id: string; caption: string; rows: number; cols: number }>;
  structureNotes: string[];
  rawExcerpt: string;
};

const RESULTS: Record<LitFormatTab, ParseOutput> = {
  pdf: {
    meta: [
      { key: 'title', value: '基于图神经网络的知识图谱补全研究' },
      { key: 'authors', value: '张伟; 李娜; Geoffrey Hinton' },
      { key: 'year', value: '2024' },
      { key: 'pages', value: '12' },
      { key: 'doi', value: '10.1000/example.kg.2024.012' },
      { key: 'language', value: 'zh-CN' },
    ],
    sections: [
      { title: '摘要', paragraphs: 1, preview: '针对低资源场景下的知识图谱链接预测，本文提出类型感知的关系图注意力网络…' },
      { title: '1 引言', paragraphs: 4, preview: '知识图谱补全是下游问答与推荐的基础能力…' },
      { title: '2 相关工作', paragraphs: 5, preview: 'TransE、CompGCN 等嵌入模型在密集图上表现良好…' },
      { title: '3 方法', paragraphs: 8, preview: 'RGAT 编码器融合实体类型与关系路径特征…' },
      { title: '4 实验', paragraphs: 6, preview: '在 FB15k-237 与 WN18RR 上进行对比…' },
      { title: '5 结论', paragraphs: 2, preview: '所提方法在稀疏标注设定下仍保持稳定提升…' },
    ],
    figures: [
      { id: 'Fig.1', caption: 'RGAT 模型整体架构', page: 3 },
      { id: 'Fig.2', caption: '注意力权重可视化示例', page: 7 },
      { id: 'Fig.3', caption: '不同模型 MRR 对比柱状图', page: 8 },
    ],
    tables: [
      { id: 'Tab.1', caption: '数据集统计', rows: 4, cols: 5 },
      { id: 'Tab.2', caption: '主实验结果（MRR / Hits@10）', rows: 8, cols: 4 },
    ],
    structureNotes: [
      '版面分析识别双栏布局，正文区块 18 处',
      'OCR 回退：嵌入字体异常页 2 处已校正',
      '表格线框检测成功，单元格合并 3 处已还原',
    ],
    rawExcerpt:
      '知识图谱补全旨在预测缺失的三元组。本文提出 RGAT……在 FB15k-237 上 MRR 达到 0.412。',
  },
  jats: {
    meta: [
      { key: 'article-type', value: 'research-article' },
      { key: 'journal-title', value: 'Journal of Knowledge Engineering' },
      { key: 'article-title', value: 'Type-aware Relational Graph Attention for KG Completion' },
      { key: 'pub-date', value: '2024-03-15' },
      { key: 'doi', value: '10.5555/3295222.3295349' },
      { key: 'issn', value: '1234-5678' },
    ],
    sections: [
      { title: 'front / article-meta', paragraphs: 0, preview: '完整题名、作者贡献、基金、关键词已解析' },
      { title: 'abstract', paragraphs: 1, preview: 'We propose a type-aware relational graph attention network…' },
      { title: 'sec[@id=s1] Introduction', paragraphs: 3, preview: 'Knowledge graph completion remains challenging under sparsity…' },
      { title: 'sec[@id=s2] Method', paragraphs: 6, preview: 'The encoder aggregates neighbor messages conditioned on relation type…' },
      { title: 'sec[@id=s3] Experiments', paragraphs: 5, preview: 'We evaluate on FB15k-237 and WN18RR under filtered setting…' },
      { title: 'back / ref-list', paragraphs: 0, preview: '参考文献 42 条，含混合 DOI / PMID' },
    ],
    figures: [
      { id: 'fig1', caption: 'Model architecture (graphic)', page: undefined },
      { id: 'fig2', caption: 'Ablation study visualization', page: undefined },
    ],
    tables: [
      { id: 'table1', caption: 'Dataset statistics', rows: 3, cols: 6 },
      { id: 'table2', caption: 'Main results', rows: 7, cols: 5 },
    ],
    structureNotes: [
      'JATS 1.3 DTD 校验通过',
      'contrib-group / aff 机构归属完整关联',
      'xref 交叉引用解析：图表 9 处、文献 42 处',
      '命名内容对象（chem-struct / disp-formula）保留原标签',
    ],
    rawExcerpt:
      '<article-title>Type-aware Relational Graph Attention for KG Completion</article-title>\n<abstract><p>We propose…</p></abstract>',
  },
  html: {
    meta: [
      { key: 'url', value: 'https://doi.org/10.5555/3295222.3295349' },
      { key: 'og:title', value: 'Type-aware Relational Graph Attention for KG Completion' },
      { key: 'citation_author', value: 'Wei Zhang; Na Li' },
      { key: 'citation_publication_date', value: '2024/03/15' },
      { key: 'citation_doi', value: '10.5555/3295222.3295349' },
      { key: 'publisher', value: 'Example Academic Press' },
    ],
    sections: [
      { title: 'Header / Title', paragraphs: 1, preview: '页面主标题与副标题已抽取' },
      { title: 'Abstract block', paragraphs: 1, preview: 'We propose a type-aware relational graph attention network…' },
      { title: 'Main content', paragraphs: 14, preview: '按 heading 层级拆分为 Introduction / Method / Experiments…' },
      { title: 'References', paragraphs: 0, preview: '从 ol/li 与 cite 标签解析参考文献 38 条' },
    ],
    figures: [
      { id: 'img-hero', caption: 'Hero figure from article body', page: undefined },
      { id: 'img-fig2', caption: 'Results chart (lazy-loaded src resolved)', page: undefined },
    ],
    tables: [{ id: 'html-table-1', caption: 'Comparison table in article', rows: 6, cols: 4 }],
    structureNotes: [
      '识别 HighWire / citation_* meta 标签',
      '去除导航、页脚、推荐阅读噪声块',
      '相对图片 URL 已按页面 base 补全',
      'MathML / KaTeX 公式节点保留为结构占位',
    ],
    rawExcerpt:
      '<meta name="citation_title" content="Type-aware Relational Graph Attention for KG Completion" />\n<article><h1>…</h1><section id="abstract">…',
  },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MultiFormatLiteratureParse({
  initialTab = 'pdf',
}: {
  initialTab?: LitFormatTab;
}) {
  const [tab, setTab] = useState<LitFormatTab>(initialTab);
  const [file, setFile] = useState<UploadSlot | null>(null);
  const [htmlUrl, setHtmlUrl] = useState(FORMAT_META.html.sample.name);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ParseOutput | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const meta = FORMAT_META[tab];
  const Icon = meta.icon;

  const switchTab = (id: LitFormatTab) => {
    setTab(id);
    setFile(null);
    setResult(null);
    setProgress(0);
    setRunning(false);
    if (id === 'html') setHtmlUrl(FORMAT_META.html.sample.name);
  };

  const useSample = () => {
    setFile(FORMAT_META[tab].sample);
    setResult(null);
  };

  const onPickFile = (f: File | undefined) => {
    if (!f) return;
    setFile({ name: f.name, sizeLabel: formatFileSize(f.size) });
    setResult(null);
  };

  const canRun =
    tab === 'html'
      ? Boolean(htmlUrl.trim() || file)
      : Boolean(file);

  const runParse = () => {
    if (!canRun || running) return;
    setRunning(true);
    setResult(null);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 8 + Math.random() * 14;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setTimeout(() => {
          setResult(RESULTS[tab]);
          setRunning(false);
        }, 200);
      } else {
        setProgress(Math.min(p, 99));
      }
    }, 180);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">多格式文献解析模块</h1>
          <p className="text-sm text-gray-500">
            提供文献解析器，处理 PDF / JATS-XML / HTML 等主流学术文献格式，并完成初步结构化拆分
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
        {(['pdf', 'jats', 'html'] as const).map((id) => {
          const m = FORMAT_META[id];
          const TabIcon = m.icon;
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                on ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Left: upload + run */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{meta.desc}</p>

            {tab === 'html' && (
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-1">文献 URL</label>
                <input
                  value={htmlUrl}
                  onChange={(e) => {
                    setHtmlUrl(e.target.value);
                    setResult(null);
                  }}
                  placeholder="https://…"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400"
                />
              </div>
            )}

            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPickFile(e.dataTransfer.files?.[0]);
              }}
            >
              <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-600 mb-1">
                {tab === 'html' ? '或上传 HTML 快照' : '点击 / 拖拽上传文件'}
              </p>
              <p className="text-[10px] text-gray-400">接受 {meta.accept}</p>
              <input
                ref={inputRef}
                type="file"
                accept={meta.accept}
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-800 truncate font-medium">{file.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {file.sizeLabel}
                    {file.hint ? ` · ${file.hint}` : ''}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={useSample}
                className="flex-1 text-xs py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                使用示例{meta.short}
              </button>
              <button
                type="button"
                onClick={runParse}
                disabled={!canRun || running}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
              >
                {running ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {running ? '解析中…' : '开始解析'}
              </button>
            </div>

            {(running || progress > 0) && !result && (
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>
                    {tab === 'pdf' && '版面分析 · 文本/图表提取'}
                    {tab === 'jats' && 'JATS 结构校验 · 节点展开'}
                    {tab === 'html' && 'DOM 清洗 · meta / 正文抽取'}
                  </span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 text-[11px] text-gray-500 space-y-1.5">
            <p className="font-semibold text-gray-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              本格式能力要点
            </p>
            {tab === 'pdf' && (
              <>
                <p>· 文本流与版面区块</p>
                <p>· 嵌入图片 / 矢量图抽取</p>
                <p>· 表格线框与单元格还原</p>
                <p>· 文档元数据（标题、作者、页数等）</p>
              </>
            )}
            {tab === 'jats' && (
              <>
                <p>· article-meta / front 元数据</p>
                <p>· sec 章节树与段落</p>
                <p>· fig / table-wrap 精确绑定</p>
                <p>· ref-list 与 xref 交叉引用</p>
              </>
            )}
            {tab === 'html' && (
              <>
                <p>· citation_* / OpenGraph meta</p>
                <p>· 正文区块与标题层级</p>
                <p>· 去噪（导航 / 页脚 / 推荐）</p>
                <p>· 图片与 HTML 表格结构化</p>
              </>
            )}
          </div>
        </div>

        {/* Right: result */}
        <div className="col-span-8 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2 flex-shrink-0">
            <CheckCircle2 className={`w-4 h-4 ${result ? 'text-emerald-500' : 'text-gray-300'}`} />
            <span className="text-sm font-semibold text-gray-800">结构化解析结果</span>
            {result && (
              <span className="text-[11px] text-emerald-600 ml-auto">
                {meta.short} · 解析完成
              </span>
            )}
          </div>

          {!result ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              选择格式并上传文件后点击「开始解析」
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <section>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  元数据
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {result.meta.map((m) => (
                    <div key={m.key} className="border border-gray-100 rounded-lg px-3 py-2 bg-gray-50/80">
                      <p className="text-[10px] text-gray-400 font-mono mb-0.5">{m.key}</p>
                      <p className="text-xs text-gray-800 break-all">{m.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  章节 / 结构拆分
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-[11px] text-gray-400 border-b border-gray-100">
                        <th className="px-3 py-2 font-medium">结构节点</th>
                        <th className="px-3 py-2 font-medium w-20">段落数</th>
                        <th className="px-3 py-2 font-medium">内容预览</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.sections.map((s) => (
                        <tr key={s.title} className="border-b border-gray-50">
                          <td className="px-3 py-2.5 text-xs font-medium text-gray-800">{s.title}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-500">{s.paragraphs || '—'}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-500">{s.preview}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    图片 ({result.figures.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {result.figures.map((f) => (
                      <li
                        key={f.id}
                        className="text-xs border border-gray-100 rounded-lg px-3 py-2 flex gap-2"
                      >
                        <span className="font-mono text-indigo-600 shrink-0">{f.id}</span>
                        <span className="text-gray-700 flex-1">{f.caption}</span>
                        {f.page != null && (
                          <span className="text-[10px] text-gray-400 shrink-0">p.{f.page}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5" />
                    表格 ({result.tables.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {result.tables.map((t) => (
                      <li
                        key={t.id}
                        className="text-xs border border-gray-100 rounded-lg px-3 py-2"
                      >
                        <div className="flex gap-2 mb-0.5">
                          <span className="font-mono text-emerald-600">{t.id}</span>
                          <span className="text-gray-700">{t.caption}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {t.rows} × {t.cols} 单元格
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">解析说明</h3>
                <ul className="space-y-1">
                  {result.structureNotes.map((n) => (
                    <li key={n} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-emerald-500">✓</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">原文摘录</h3>
                <pre className="text-[11px] font-mono text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                  {result.rawExcerpt}
                </pre>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
