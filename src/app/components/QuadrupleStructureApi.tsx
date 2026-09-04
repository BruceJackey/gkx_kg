import { useEffect, useState } from 'react';
import { CheckCircle2, GitBranch, Play, Table2 } from 'lucide-react';

export type QuadrupleStructureFocus = 'extract' | 'predict';

const EXTRACT_ENDPOINT = '/api/v1/mmkg/quadruples:extract';
const PREDICT_ENDPOINT = '/api/v1/mmkg/relations:predict-cross-resource';

const SAMPLE_TEXT = `华为技术有限公司于2023年发布昇腾910B芯片，应用于大模型训练场景。
相关专利 CN202310123456.7 披露了张量核心与高带宽内存的耦合设计。
实验数据库 AscendBench 记录了训练吞吐与能效比指标。`;

const SAMPLE_TABLE = JSON.stringify(
  [
    { subject: '昇腾910B', predicate: '生产商', object: '华为', attribute: '发布年=2023' },
    { subject: 'CN202310123456.7', predicate: '保护技术', object: '张量核心', attribute: '类型=发明专利' },
  ],
  null,
  2,
);

interface Quadruple {
  id: string;
  subject: { id: string; name: string; type: string; resource: string };
  relation: string;
  object: { id: string; name: string; type: string; resource: string };
  attributes: Record<string, string>;
  confidence: number;
  evidence: string;
}

interface PredictedRelation {
  id: string;
  head: { name: string; resource: string };
  relation: string;
  tail: { name: string; resource: string };
  score: number;
  cooccurrence_count: number;
  path_hint: string;
  latent: boolean;
}

function extractQuadruples(text: string, tableJson: string) {
  const fromText: Quadruple[] = [
    {
      id: 'q1',
      subject: { id: 'org:huawei', name: '华为技术有限公司', type: 'Organization', resource: 'literature' },
      relation: '发布',
      object: { id: 'chip:ascend-910b', name: '昇腾910B', type: 'Product', resource: 'literature' },
      attributes: { 时间: '2023', 应用场景: '大模型训练' },
      confidence: 0.91,
      evidence: text.split('\n')[0] ?? text.slice(0, 80),
    },
    {
      id: 'q2',
      subject: { id: 'pat:CN202310123456.7', name: 'CN202310123456.7', type: 'Patent', resource: 'patent' },
      relation: '披露技术',
      object: { id: 'tech:tensor-core', name: '张量核心', type: 'Technology', resource: 'patent' },
      attributes: { 关联组件: '高带宽内存', 设计: '耦合' },
      confidence: 0.87,
      evidence: text.split('\n')[1] ?? '',
    },
    {
      id: 'q3',
      subject: { id: 'db:AscendBench', name: 'AscendBench', type: 'Dataset', resource: 'database' },
      relation: '记录指标',
      object: { id: 'metric:throughput', name: '训练吞吐', type: 'Metric', resource: 'database' },
      attributes: { 伴随指标: '能效比' },
      confidence: 0.82,
      evidence: text.split('\n')[2] ?? '',
    },
  ];

  let fromTable: Quadruple[] = [];
  try {
    const rows = JSON.parse(tableJson) as Array<{
      subject: string;
      predicate: string;
      object: string;
      attribute?: string;
    }>;
    fromTable = rows.map((r, i) => {
      const attrs: Record<string, string> = {};
      if (r.attribute) {
        const [k, v] = r.attribute.split('=');
        if (k && v) attrs[k.trim()] = v.trim();
        else attrs['备注'] = r.attribute;
      }
      return {
        id: `t${i + 1}`,
        subject: { id: `tbl:s${i}`, name: r.subject, type: 'Entity', resource: 'table' },
        relation: r.predicate,
        object: { id: `tbl:o${i}`, name: r.object, type: 'Entity', resource: 'table' },
        attributes: attrs,
        confidence: 0.95,
        evidence: `table_row_${i + 1}`,
      };
    });
  } catch {
    fromTable = [];
  }

  return {
    status: 'ok',
    request_id: `qe_${Date.now()}`,
    endpoint: EXTRACT_ENDPOINT,
    latency_ms: 28 + Math.floor(Math.random() * 40),
    capability: {
      id: 'extract',
      name: '结构化信息抽取',
      description: '从文本、表格自动提取「实体-关系-实体+属性」四元组知识。',
    },
    quadruple_count: fromText.length + fromTable.length,
    quadruples: [...fromText, ...fromTable],
  };
}

function predictRelations() {
  const predictions: PredictedRelation[] = [
    {
      id: 'pr1',
      head: { name: '昇腾910B', resource: 'literature' },
      relation: '验证于',
      tail: { name: 'AscendBench', resource: 'database' },
      score: 0.86,
      cooccurrence_count: 14,
      path_hint: '文献产品 → 共现指标 → 数据库基准',
      latent: true,
    },
    {
      id: 'pr2',
      head: { name: 'CN202310123456.7', resource: 'patent' },
      relation: '支撑产品',
      tail: { name: '昇腾910B', resource: 'literature' },
      score: 0.81,
      cooccurrence_count: 9,
      path_hint: '专利技术 → 共现芯片实体 → 文献产品',
      latent: true,
    },
    {
      id: 'pr3',
      head: { name: '张量核心', resource: 'patent' },
      relation: '影响指标',
      tail: { name: '训练吞吐', resource: 'database' },
      score: 0.74,
      cooccurrence_count: 6,
      path_hint: '专利组件 → 共现实验 → 数据库指标',
      latent: true,
    },
  ];

  return {
    status: 'ok',
    request_id: `rp_${Date.now()}`,
    endpoint: PREDICT_ENDPOINT,
    latency_ms: 35 + Math.floor(Math.random() * 50),
    capability: {
      id: 'predict',
      name: '跨资源关系预测',
      description: '基于跨资源共现分析，预测文献 / 专利 / 数据库之间的隐含关联。',
    },
    model: 'cross-resource-cooccurrence-v1',
    prediction_count: predictions.length,
    predictions,
  };
}

const RESOURCE_LABEL: Record<string, string> = {
  literature: '文献',
  patent: '专利',
  database: '数据库',
  table: '表格',
};

/**
 * 审计目录专用：四元结构自动提取与建模接口演示
 */
export default function QuadrupleStructureApi({
  initialFocus,
}: {
  initialFocus?: QuadrupleStructureFocus | null;
}) {
  const [focus, setFocus] = useState<QuadrupleStructureFocus>(initialFocus ?? 'extract');
  const [text, setText] = useState(SAMPLE_TEXT);
  const [tableJson, setTableJson] = useState(SAMPLE_TABLE);
  const [running, setRunning] = useState(false);
  const [extractResult, setExtractResult] = useState<ReturnType<typeof extractQuadruples> | null>(null);
  const [predictResult, setPredictResult] = useState<ReturnType<typeof predictRelations> | null>(null);
  const [responseJson, setResponseJson] = useState('');

  useEffect(() => {
    if (initialFocus) setFocus(initialFocus);
  }, [initialFocus]);

  const run = () => {
    setRunning(true);
    setExtractResult(null);
    setPredictResult(null);
    setResponseJson('');
    window.setTimeout(() => {
      if (focus === 'extract') {
        const body = extractQuadruples(text, tableJson);
        setExtractResult(body);
        setResponseJson(JSON.stringify(body, null, 2));
      } else {
        const body = predictRelations();
        setPredictResult(body);
        setResponseJson(JSON.stringify(body, null, 2));
      }
      setRunning(false);
    }, 550);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">四元结构自动提取与建模</h1>
          <p className="text-sm text-gray-500">
            从多源数据抽取「实体-关系-实体+属性」四元组，并基于跨资源共现预测隐含关联
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
          <div className="flex items-center gap-2 mb-1">
            <Table2 className={`w-4 h-4 ${focus === 'extract' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-semibold text-gray-900">结构化信息抽取</span>
          </div>
          <p className="text-xs text-gray-500">文本 / 表格 → 四元组流水线</p>
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
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className={`w-4 h-4 ${focus === 'predict' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-semibold text-gray-900">跨资源关系预测</span>
          </div>
          <p className="text-xs text-gray-500">共现分析 → 隐含关系发现</p>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">
            {focus === 'extract' ? EXTRACT_ENDPOINT : PREDICT_ENDPOINT}
          </code>
        </div>

        {focus === 'extract' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">文本输入</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">表格输入（JSON 行）</label>
              <textarea
                value={tableJson}
                onChange={(e) => setTableJson(e.target.value)}
                rows={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            基于已抽取四元组与跨资源共现统计，预测文献 / 专利 / 数据库之间的隐含关系（演示固定样例）。
          </div>
        )}

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '执行中…' : focus === 'extract' ? '抽取四元组' : '预测跨资源关系'}
        </button>
      </div>

      {extractResult && focus === 'extract' && (
        <div className="max-w-4xl space-y-4 pb-6">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            抽取完成 · {extractResult.quadruple_count} 条四元组 · latency {extractResult.latency_ms} ms
          </div>
          <ul className="space-y-3">
            {extractResult.quadruples.map((q) => (
              <li key={q.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-gray-900">{q.subject.name}</span>
                  <span className="text-blue-600 font-medium">[{q.relation}]</span>
                  <span className="font-medium text-gray-900">{q.object.name}</span>
                  <span className="ml-auto tabular-nums text-blue-700 text-xs">
                    {(q.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-teal-50 text-teal-700 border-teal-100">
                    {RESOURCE_LABEL[q.subject.resource] ?? q.subject.resource}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-100">
                    {RESOURCE_LABEL[q.object.resource] ?? q.object.resource}
                  </span>
                  {Object.entries(q.attributes).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600"
                    >
                      {k}={v}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-2">{q.evidence}</p>
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
            预测完成 · {predictResult.prediction_count} 条 · model {predictResult.model}
          </div>
          <ul className="space-y-3">
            {predictResult.predictions.map((p) => (
              <li key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-gray-900">{p.head.name}</span>
                  <span className="text-blue-600 font-medium">[{p.relation}]</span>
                  <span className="font-medium text-gray-900">{p.tail.name}</span>
                  {p.latent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                      隐含
                    </span>
                  )}
                  <span className="ml-auto tabular-nums text-blue-700 text-xs font-medium">
                    {(p.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded border bg-teal-50 text-teal-700 border-teal-100">
                    {RESOURCE_LABEL[p.head.resource] ?? p.head.resource}
                  </span>
                  <span className="px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-100">
                    {RESOURCE_LABEL[p.tail.resource] ?? p.tail.resource}
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 bg-gray-50">
                    共现 {p.cooccurrence_count}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">{p.path_hint}</p>
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
