import { useState } from 'react';
import { Play, BookOpen, CheckCircle2, XCircle } from 'lucide-react';

const ONTOLOGY_OPTIONS = [
  { id: 'sci-paper', name: '科技论文知识图谱本体', targetSpace: 'kg:sci-paper-v3' },
  { id: 'energy', name: '新能源产业图谱本体', targetSpace: 'kg:energy-v1' },
  { id: 'medical', name: '医学知识图谱本体', targetSpace: 'kg:medical-v2' },
];

const SAMPLE_TRIPLES = `<Geoffrey Hinton> <就职于> <多伦多大学>
<papers#4521> <WRITTEN_BY> <Geoffrey Hinton>
<papers#4521> <pub_year> "2026"^^xsd:gYear`;

const ALLOWED_PREDICATES = new Set([
  '就职于', 'WRITTEN_BY', 'pub_year', 'CITES', 'AFFILIATED_WITH', 'HAS_CONCEPT', '位于', '研究方向',
]);

interface ParsedTriple {
  subject: string;
  predicate: string;
  object: string;
  line: number;
}

function stripBrackets(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/^"|"$/g, '').replace(/\^\^xsd:\w+$/, '').trim();
}

function parseTriples(raw: string): { triples: ParsedTriple[]; errors: string[] } {
  const lines = raw.split('\n');
  const triples: ParsedTriple[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const parts = trimmed.match(/(?:<[^>]+>|"[^"]*"(?:\^\^xsd:\w+)?|[^\s<>"]+)/g);
    if (!parts || parts.length < 3) {
      errors.push(`第 ${index + 1} 行格式无效：需包含主语、谓语、宾语`);
      return;
    }

    triples.push({
      subject: stripBrackets(parts[0]),
      predicate: stripBrackets(parts[1]),
      object: stripBrackets(parts.slice(2).join(' ')),
      line: index + 1,
    });
  });

  return { triples, errors };
}

function buildWriteResult(ontologyId: string, raw: string) {
  const ontology = ONTOLOGY_OPTIONS.find(o => o.id === ontologyId);
  if (!ontology) {
    return {
      status: 'failure',
      message: '未选择有效的目标本体',
      errors: [{ field: 'ontology_id', detail: 'ontology_id 为必填项' }],
    };
  }

  const { triples, errors: parseErrors } = parseTriples(raw);
  if (!raw.trim()) {
    return {
      status: 'failure',
      message: '三元组输入为空',
      errors: [{ field: 'triples', detail: '至少输入一条审核通过的三元组' }],
    };
  }
  if (parseErrors.length > 0) {
    return {
      status: 'failure',
      message: '三元组解析失败',
      errors: parseErrors.map(detail => ({ field: 'triples', detail })),
    };
  }

  const schemaErrors: Array<{ field: string; detail: string }> = [];
  triples.forEach(t => {
    if (!ALLOWED_PREDICATES.has(t.predicate)) {
      schemaErrors.push({
        field: 'triples',
        detail: `第 ${t.line} 行谓语「${t.predicate}」不在本体「${ontology.name}」的定义范围内`,
      });
    }
    if (!t.subject || !t.object) {
      schemaErrors.push({
        field: 'triples',
        detail: `第 ${t.line} 行主语或宾语不能为空`,
      });
    }
  });

  if (schemaErrors.length > 0) {
    return {
      status: 'failure',
      message: 'Schema 校验未通过，入库失败',
      ontology: ontology.name,
      target_space: ontology.targetSpace,
      errors: schemaErrors,
    };
  }

  return {
    status: 'success',
    message: '审核通过的三元组已成功写入知识库',
    request_id: `vk_write_${Date.now()}`,
    endpoint: '/api/v1/knowledge/verified/write',
    latency_ms: 42 + Math.floor(Math.random() * 30),
    ontology: ontology.name,
    ontology_id: ontology.id,
    target_space: ontology.targetSpace,
    written_count: triples.length,
    triples: triples.map(t => ({
      subject: t.subject,
      predicate: t.predicate,
      object: t.object,
    })),
  };
}

const PARAMS = [
  { name: 'ontology_id', type: 'string', required: true, desc: '目标本体 ID，决定写入的图空间与 Schema 约束' },
  { name: 'triples', type: 'string', required: true, desc: '审核通过的三元组，每行一条：主语 谓语 宾语（支持 <> 包裹）' },
  { name: 'source', type: 'string', required: false, desc: '反馈来源标识，如 human-review / feedback-loop' },
];

function ParamTable() {
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
          {PARAMS.map(r => (
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

export default function VerifiedKnowledgeWritePage() {
  const [ontologyId, setOntologyId] = useState(ONTOLOGY_OPTIONS[0].id);
  const [triples, setTriples] = useState(SAMPLE_TRIPLES);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const result = response ? JSON.parse(response) as ReturnType<typeof buildWriteResult> : null;

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      setResponse(JSON.stringify(buildWriteResult(ontologyId, triples), null, 2));
      setRunning(false);
    }, 900);
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">已验证知识写入模块</h1>
          <p className="text-sm text-gray-500 mt-1">
            将通过人工审核的三元组写入指定本体的知识库，返回入库成功或失败结果。
          </p>
        </div>

        <ParamTable />

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
            <code className="font-mono text-gray-700">/api/v1/knowledge/verified/write</code>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">ontology_id · 目标本体</label>
            <select
              value={ontologyId}
              onChange={e => { setOntologyId(e.target.value); setResponse(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              {ONTOLOGY_OPTIONS.map(o => (
                <option key={o.id} value={o.id}>{o.name}（{o.targetSpace}）</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">triples · 审核通过的三元组</label>
            <textarea
              value={triples}
              onChange={e => { setTriples(e.target.value); setResponse(''); }}
              rows={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
              placeholder="每行一条：&lt;主语&gt; &lt;谓语&gt; &lt;宾语&gt;"
            />
            <p className="text-[11px] text-gray-400 mt-1">示例：<code className="font-mono">&lt;张明&gt; &lt;就职于&gt; &lt;清华大学&gt;</code></p>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={!triples.trim() || running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? '写入中…' : '调用已验证知识写入 API'}
          </button>
        </div>

        {response && (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
              result?.status === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {result?.status === 'success'
                ? <><CheckCircle2 className="w-4 h-4" /> 入库成功</>
                : <><XCircle className="w-4 h-4" /> 入库失败</>}
              <span className="font-normal text-gray-600 ml-1">{result?.message}</span>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{response}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
