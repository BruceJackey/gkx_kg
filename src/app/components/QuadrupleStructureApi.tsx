import { useEffect, useState } from 'react';
import { CheckCircle2, FileImage, GitBranch, Play, Type } from 'lucide-react';

export type QuadrupleStructureFocus = 'extract' | 'predict';

const BASE_URL = 'http://113.57.198.122:30080';
const EXTRACT_ENDPOINT = '/api/v1/extract/quadruples:extract';
const PREDICT_ENDPOINT = '/api/v1/relations/cross-resource:predict';

type ExtractMode = 'text' | 'file';

const SAMPLE_TEXT = 'TransE 用于知识图谱补全，提出年份为2013。';
const SAMPLE_LITERATURE = '结肠炎症与微生物群紊乱密切相关，研究显示菌群多样性下降会加重黏膜炎症反应。';
const SAMPLE_PATENT = '一种炎症检测装置，包括采样模块与微生物标志物传感单元，用于肠道炎症快速筛查。';

interface Quadruple {
  subject: string;
  relation: string;
  object: string;
  attribute: string;
  confidence: number;
  source: 'text' | 'image';
}

interface PredictedRelation {
  head: string;
  relation: string;
  tail: string;
  score: number;
  evidence: string;
  from_resources: string[];
}

function mockExtractFromText(text: string) {
  const lower = text.toLowerCase();
  const isTransE = lower.includes('transe') || text.includes('知识图谱补全');
  const quadruples: Quadruple[] = isTransE
    ? [
        {
          subject: 'TransE',
          relation: '用于',
          object: '知识图谱补全',
          attribute: '提出年份=2013',
          confidence: 0.93,
          source: 'text',
        },
        {
          subject: 'TransE',
          relation: '提出年份',
          object: '2013',
          attribute: '类型=时间属性',
          confidence: 0.9,
          source: 'text',
        },
      ]
    : [
        {
          subject: text.slice(0, 12) || '实体A',
          relation: '关联',
          object: '实体B',
          attribute: '来源=文本抽取',
          confidence: 0.72,
          source: 'text',
        },
      ];

  return {
    status: 'ok',
    request_id: `qe_${Date.now()}`,
    base_url: BASE_URL,
    endpoint: EXTRACT_ENDPOINT,
    content_type: 'application/json',
    request: { text },
    latency_ms: 22 + Math.floor(Math.random() * 30),
    quadruple_count: quadruples.length,
    quadruples,
  };
}

function mockExtractFromFile(fileName: string) {
  const quadruples: Quadruple[] = [
    {
      subject: '炎症标志物面板',
      relation: '包含',
      object: 'CRP',
      attribute: '单位=mg/L',
      confidence: 0.88,
      source: 'image',
    },
    {
      subject: '检测装置',
      relation: '适用于',
      object: '肠道炎症筛查',
      attribute: '模态=表格图像',
      confidence: 0.84,
      source: 'image',
    },
  ];

  return {
    status: 'ok',
    request_id: `qe_${Date.now()}`,
    base_url: BASE_URL,
    endpoint: EXTRACT_ENDPOINT,
    content_type: 'multipart/form-data',
    request: { file: fileName, type: 'image/png' },
    latency_ms: 48 + Math.floor(Math.random() * 40),
    quadruple_count: quadruples.length,
    quadruples,
  };
}

function mockPredict(literature: string, patent: string) {
  const predictions: PredictedRelation[] = [
    {
      head: '结肠炎症',
      relation: '可用装置检测',
      tail: '炎症检测装置',
      score: 0.86,
      evidence: '文献病症与专利装置在「炎症/检测」语义共现',
      from_resources: ['literature', 'patent'],
    },
    {
      head: '微生物群',
      relation: '关联标志物',
      tail: '微生物标志物传感单元',
      score: 0.79,
      evidence: '文献微生物群 ↔ 专利传感单元跨资源共现',
      from_resources: ['literature', 'patent'],
    },
    {
      head: '黏膜炎症反应',
      relation: '筛查场景',
      tail: '肠道炎症快速筛查',
      score: 0.74,
      evidence: '症状描述与专利权利要求场景对齐',
      from_resources: ['literature', 'patent'],
    },
  ];

  return {
    status: 'ok',
    request_id: `cr_${Date.now()}`,
    base_url: BASE_URL,
    endpoint: PREDICT_ENDPOINT,
    content_type: 'application/json',
    request: { literature, patent },
    latency_ms: 30 + Math.floor(Math.random() * 40),
    prediction_count: predictions.length,
    predictions,
  };
}

/**
 * 审计目录专用：四元结构自动提取与建模
 * 对齐网关：http://113.57.198.122:30080
 */
export default function QuadrupleStructureApi({
  initialFocus,
}: {
  initialFocus?: QuadrupleStructureFocus | null;
}) {
  const [focus, setFocus] = useState<QuadrupleStructureFocus>(initialFocus ?? 'extract');
  const [extractMode, setExtractMode] = useState<ExtractMode>('text');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [fileName, setFileName] = useState('table.png');
  const [literature, setLiterature] = useState(SAMPLE_LITERATURE);
  const [patent, setPatent] = useState(SAMPLE_PATENT);
  const [running, setRunning] = useState(false);
  const [extractResult, setExtractResult] = useState<
    ReturnType<typeof mockExtractFromText> | ReturnType<typeof mockExtractFromFile> | null
  >(null);
  const [predictResult, setPredictResult] = useState<ReturnType<typeof mockPredict> | null>(null);
  const [responseJson, setResponseJson] = useState('');
  const [requestPreview, setRequestPreview] = useState('');

  useEffect(() => {
    if (initialFocus) setFocus(initialFocus);
  }, [initialFocus]);

  useEffect(() => {
    if (focus === 'extract') {
      if (extractMode === 'text') {
        setRequestPreview(
          [
            `curl -X POST "${BASE_URL}${EXTRACT_ENDPOINT}" \\`,
            `  -H "Authorization: Bearer $TOKEN" \\`,
            `  -H "Content-Type: application/json" \\`,
            `  -d '{"text":${JSON.stringify(text)}}'`,
          ].join('\n'),
        );
      } else {
        setRequestPreview(
          [
            `curl -X POST "${BASE_URL}${EXTRACT_ENDPOINT}" \\`,
            `  -H "Authorization: Bearer $TOKEN" \\`,
            `  -F "file=@${fileName || 'table.png'};type=image/png"`,
          ].join('\n'),
        );
      }
    } else {
      setRequestPreview(
        [
          `curl -X POST "${BASE_URL}${PREDICT_ENDPOINT}" \\`,
          `  -H "Authorization: Bearer $TOKEN" \\`,
          `  -H "Content-Type: application/json" \\`,
          `  -d '${JSON.stringify({ literature, patent })}'`,
        ].join('\n'),
      );
    }
  }, [focus, extractMode, text, fileName, literature, patent]);

  const run = () => {
    setRunning(true);
    setExtractResult(null);
    setPredictResult(null);
    setResponseJson('');
    window.setTimeout(() => {
      if (focus === 'extract') {
        const body =
          extractMode === 'text'
            ? mockExtractFromText(text.trim() || SAMPLE_TEXT)
            : mockExtractFromFile(fileName.trim() || 'table.png');
        setExtractResult(body);
        setResponseJson(JSON.stringify(body, null, 2));
      } else {
        const body = mockPredict(literature.trim(), patent.trim());
        setPredictResult(body);
        setResponseJson(JSON.stringify(body, null, 2));
      }
      setRunning(false);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">四元结构自动提取与建模</h1>
          <p className="text-sm text-gray-500">
            网关 {BASE_URL} · 文本/表格图抽取四元组，并基于文献-专利共现预测跨资源关系
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
        <button
          type="button"
          onClick={() => {
            setFocus('extract');
            setExtractResult(null);
            setPredictResult(null);
            setResponseJson('');
          }}
          className={`text-left bg-white border rounded-xl p-4 ${
            focus === 'extract' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200'
          }`}
        >
          <div className="text-sm font-semibold text-gray-900 mb-1">结构化信息抽取</div>
          <p className="text-xs text-gray-500 font-mono">{EXTRACT_ENDPOINT}</p>
          <p className="text-[11px] text-gray-400 mt-1">JSON text 或 multipart file=@*.png</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setFocus('predict');
            setExtractResult(null);
            setPredictResult(null);
            setResponseJson('');
          }}
          className={`text-left bg-white border rounded-xl p-4 ${
            focus === 'predict' ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200'
          }`}
        >
          <div className="text-sm font-semibold text-gray-900 mb-1">跨资源关系预测</div>
          <p className="text-xs text-gray-500 font-mono">{PREDICT_ENDPOINT}</p>
          <p className="text-[11px] text-gray-400 mt-1">{`{"literature","patent"}`}</p>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">
            {BASE_URL}
            {focus === 'extract' ? EXTRACT_ENDPOINT : PREDICT_ENDPOINT}
          </code>
        </div>

        {focus === 'extract' && (
          <>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              <button
                type="button"
                onClick={() => setExtractMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md ${
                  extractMode === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                application/json · text
              </button>
              <button
                type="button"
                onClick={() => setExtractMode('file')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md ${
                  extractMode === 'file' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                multipart · file
              </button>
            </div>

            {extractMode === 'text' ? (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">text</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  file（演示填文件名，真实调用为 -F file=@table.png）
                </label>
                <input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="table.png"
                />
              </div>
            )}
          </>
        )}

        {focus === 'predict' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">literature</label>
              <textarea
                value={literature}
                onChange={(e) => setLiterature(e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">patent</label>
              <textarea
                value={patent}
                onChange={(e) => setPatent(e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        )}

        <div>
          <div className="text-[11px] font-medium text-gray-500 mb-1">请求示例</div>
          <pre className="text-[11px] font-mono bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700 whitespace-pre-wrap">
            {requestPreview}
          </pre>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running
            ? '调用中…'
            : focus === 'extract'
              ? extractMode === 'text'
                ? '抽取四元组（text）'
                : '抽取四元组（file）'
              : '预测跨资源关系'}
        </button>
      </div>

      {extractResult && focus === 'extract' && (
        <div className="max-w-4xl space-y-4 pb-6">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            抽取完成 · {extractResult.quadruple_count} 条 · {extractResult.content_type} ·{' '}
            {extractResult.latency_ms} ms
          </div>
          <ul className="space-y-3">
            {extractResult.quadruples.map((q, i) => (
              <li key={`${q.subject}-${i}`} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-2 text-sm flex-wrap">
                  <span className="font-medium text-gray-900">{q.subject}</span>
                  <span className="text-blue-600 font-medium">[{q.relation}]</span>
                  <span className="font-medium text-gray-900">{q.object}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-100 bg-amber-50 text-amber-700">
                    {q.attribute}
                  </span>
                  <span className="ml-auto tabular-nums text-blue-700 text-xs">
                    {(q.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1.5">source={q.source}</div>
              </li>
            ))}
          </ul>
          <pre className="text-xs font-mono bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700 max-h-64">
            {responseJson}
          </pre>
        </div>
      )}

      {predictResult && focus === 'predict' && (
        <div className="max-w-4xl space-y-4 pb-6">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            <GitBranch className="w-4 h-4" />
            预测完成 · {predictResult.prediction_count} 条 · {predictResult.latency_ms} ms
          </div>
          <ul className="space-y-3">
            {predictResult.predictions.map((p, i) => (
              <li key={`${p.head}-${i}`} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-2 text-sm flex-wrap">
                  <span className="font-medium text-gray-900">{p.head}</span>
                  <span className="text-blue-600 font-medium">[{p.relation}]</span>
                  <span className="font-medium text-gray-900">{p.tail}</span>
                  <span className="ml-auto tabular-nums text-blue-700 text-xs font-medium">
                    {(p.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">{p.evidence}</p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, p.score * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <pre className="text-xs font-mono bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700 max-h-64">
            {responseJson}
          </pre>
        </div>
      )}
    </div>
  );
}
