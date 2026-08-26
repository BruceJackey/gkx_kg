import { useState, useEffect } from 'react';
import { Play, Code2, BookOpen } from 'lucide-react';

export type EntityAttrApiTab = 'single' | 'batch';

const SAMPLE_SINGLE = {
  entity: 'Geoffrey Hinton',
  text: 'Geoffrey Hinton 就职于多伦多大学，出生于1947年，长期从事深度学习研究，曾获图灵奖。',
};

const SAMPLE_DOCS = [
  {
    doc_id: 'doc-001',
    text: 'Geoffrey Hinton 就职于多伦多大学，出生于1947年，长期从事深度学习研究。',
  },
  {
    doc_id: 'doc-002',
    text: 'Yoshua Bengio 创立了 MILA（蒙特利尔学习算法研究所），研究方向为深度学习与表示学习。',
  },
  {
    doc_id: 'doc-003',
    text: '卷积神经网络由 Yann LeCun 等人提出，广泛应用于图像识别领域。',
  },
].map((d) => JSON.stringify(d)).join('\n');

const SINGLE_PARAMS = [
  { name: 'entity', type: 'string', required: true, desc: '目标实体名称或提及文本' },
  { name: 'text', type: 'string', required: true, desc: '包含该实体描述的文本片段' },
  { name: 'lang', type: 'string', required: false, desc: '语言代码，默认 auto' },
];

const BATCH_PARAMS = [
  { name: 'documents', type: 'array<object>', required: true, desc: '文档列表，每项含 doc_id、text' },
  { name: 'documents[].doc_id', type: 'string', required: true, desc: '文档唯一标识' },
  { name: 'documents[].text', type: 'string', required: true, desc: '文档正文' },
  { name: 'max_entities', type: 'integer', required: false, desc: '单文档最多返回实体数，默认 50' },
];

function buildSingleResult(entity: string, text: string) {
  const lower = text.toLowerCase();
  const isHinton = entity.includes('Hinton') || text.includes('Hinton');
  const attrs = isHinton
    ? [
        { key: 'affiliation', value: '多伦多大学', span: text.includes('多伦多大学') ? '多伦多大学' : null, confidence: 0.94 },
        { key: 'birth_year', value: '1947', span: text.includes('1947') ? '1947年' : null, confidence: 0.91 },
        { key: 'research_field', value: '深度学习', span: text.includes('深度学习') ? '深度学习' : null, confidence: 0.88 },
        ...(text.includes('图灵奖')
          ? [{ key: 'award', value: '图灵奖', span: '图灵奖', confidence: 0.96 }]
          : []),
      ]
    : [
        { key: 'mentioned_as', value: entity, span: entity, confidence: 0.82 },
        { key: 'context_summary', value: text.slice(0, 40) + (text.length > 40 ? '…' : ''), span: null, confidence: 0.7 },
      ];

  return {
    status: 'ok',
    request_id: `attr_single_${Date.now()}`,
    endpoint: '/api/v1/entities/attributes/query',
    latency_ms: 28 + Math.floor(Math.random() * 35),
    input: { entity, text, lang: 'auto' },
    entity,
    attribute_count: attrs.length,
    attributes: attrs.filter((a) => a.value && (a.span === null || lower.length >= 0)),
  };
}

function buildBatchResult(raw: string) {
  const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean);
  const docs: Array<{ doc_id: string; text: string }> = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.text) docs.push({ doc_id: String(obj.doc_id ?? `doc-${docs.length + 1}`), text: String(obj.text) });
    } catch {
      docs.push({ doc_id: `doc-${docs.length + 1}`, text: line });
    }
  }

  const results = docs.map((doc) => {
    const entities: Array<{
      entity: string;
      type: string;
      attributes: Array<{ key: string; value: string; confidence: number }>;
    }> = [];

    if (doc.text.includes('Hinton') || doc.text.includes('多伦多')) {
      entities.push({
        entity: 'Geoffrey Hinton',
        type: '人物',
        attributes: [
          { key: 'affiliation', value: '多伦多大学', confidence: 0.93 },
          { key: 'research_field', value: '深度学习', confidence: 0.89 },
          ...(doc.text.includes('1947') ? [{ key: 'birth_year', value: '1947', confidence: 0.9 }] : []),
        ],
      });
    }
    if (doc.text.includes('Bengio') || doc.text.includes('MILA')) {
      entities.push({
        entity: 'Yoshua Bengio',
        type: '人物',
        attributes: [
          { key: 'founded', value: 'MILA', confidence: 0.92 },
          { key: 'research_field', value: '表示学习', confidence: 0.86 },
        ],
      });
      if (doc.text.includes('MILA')) {
        entities.push({
          entity: 'MILA',
          type: '机构',
          attributes: [
            { key: 'full_name', value: '蒙特利尔学习算法研究所', confidence: 0.95 },
            { key: 'location', value: '蒙特利尔', confidence: 0.8 },
          ],
        });
      }
    }
    if (doc.text.includes('LeCun') || doc.text.includes('卷积')) {
      entities.push({
        entity: 'Yann LeCun',
        type: '人物',
        attributes: [{ key: 'contribution', value: '卷积神经网络', confidence: 0.91 }],
      });
      entities.push({
        entity: '卷积神经网络',
        type: '概念',
        attributes: [
          { key: 'alias', value: 'CNN', confidence: 0.84 },
          { key: 'application', value: '图像识别', confidence: 0.88 },
        ],
      });
    }
    if (entities.length === 0) {
      const guess = doc.text.slice(0, 8).replace(/[，。、\s]/g, '') || '未知实体';
      entities.push({
        entity: guess,
        type: '概念',
        attributes: [{ key: 'mentioned_in', value: doc.doc_id, confidence: 0.55 }],
      });
    }

    return {
      doc_id: doc.doc_id,
      entity_count: entities.length,
      entities,
    };
  });

  return {
    status: 'ok',
    request_id: `attr_batch_${Date.now()}`,
    endpoint: '/api/v1/documents/attributes/extract',
    latency_ms: 60 + Math.floor(Math.random() * 50),
    document_count: docs.length,
    total_entities: results.reduce((s, r) => s + r.entity_count, 0),
    results,
  };
}

function ParamTable({ rows }: { rows: typeof SINGLE_PARAMS }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-800">请求参数说明</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
            <th className="px-4 py-2 font-medium">参数</th>
            <th className="px-4 py-2 font-medium">类型</th>
            <th className="px-4 py-2 font-medium">必填</th>
            <th className="px-4 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-2 font-mono text-xs text-blue-700">{r.name}</td>
              <td className="px-4 py-2 text-xs text-gray-500">{r.type}</td>
              <td className="px-4 py-2 text-xs">{r.required ? <span className="text-amber-600">是</span> : <span className="text-gray-400">否</span>}</td>
              <td className="px-4 py-2 text-xs text-gray-600">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SingleEntityApiPanel() {
  const [entity, setEntity] = useState(SAMPLE_SINGLE.entity);
  const [text, setText] = useState(SAMPLE_SINGLE.text);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      setResponse(JSON.stringify(buildSingleResult(entity.trim(), text.trim()), null, 2));
      setRunning(false);
    }, 850);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <ParamTable rows={SINGLE_PARAMS} />
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/entities/attributes/query</code>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">entity</label>
          <input
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setResponse(''); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-400 bg-gray-50"
            placeholder="实体名称"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">text</label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setResponse(''); }}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!entity.trim() || !text.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '请求中…' : '调用单实体属性查询 API'}
        </button>
      </div>
      {response && (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">响应 · JSON</span>
            <span className="text-[10px] text-blue-400 ml-auto">200 OK</span>
          </div>
          <pre className="p-4 text-xs font-mono whitespace-pre overflow-x-auto bg-gray-950 text-green-300 leading-relaxed max-h-[420px]">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

function BatchDocApiPanel() {
  const [docs, setDocs] = useState(SAMPLE_DOCS);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      setResponse(JSON.stringify(buildBatchResult(docs), null, 2));
      setRunning(false);
    }, 1000);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <ParamTable rows={BATCH_PARAMS} />
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/documents/attributes/extract</code>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">documents（每行一个 JSON：doc_id + text）</label>
          <textarea
            value={docs}
            onChange={(e) => { setDocs(e.target.value); setResponse(''); }}
            rows={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">也可直接粘贴纯文本行，系统将自动生成 doc_id</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!docs.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '请求中…' : '调用批量文档属性抽取 API'}
        </button>
      </div>
      {response && (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">响应 · JSON</span>
            <span className="text-[10px] text-blue-400 ml-auto">200 OK</span>
          </div>
          <pre className="p-4 text-xs font-mono whitespace-pre overflow-x-auto bg-gray-950 text-green-300 leading-relaxed max-h-[480px]">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function EntityAttributeExtractApi({ initialTab = 'single' }: { initialTab?: EntityAttrApiTab }) {
  const [tab, setTab] = useState<EntityAttrApiTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const title = tab === 'single' ? '单实体属性查询 API' : '批量文档属性抽取 API';
  const subtitle = tab === 'single'
    ? '输入一个实体与文本片段，返回该实体在文本中被描述的属性键值对'
    : '输入一批文档，返回文档中所有实体及其被提及的属性信息';

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
        {([
          { id: 'single' as const, label: '单实体属性查询 API' },
          { id: 'batch' as const, label: '批量文档属性抽取 API' },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors font-medium ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        {tab === 'single' ? <SingleEntityApiPanel /> : <BatchDocApiPanel />}
      </div>
    </div>
  );
}
