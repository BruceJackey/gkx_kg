import { useState } from 'react';
import { Play, CheckCircle2 } from 'lucide-react';

const MATCHES_SAMPLE = JSON.stringify(
  [
    {
      matchId: 'm1',
      patternId: 'CP001',
      pattern: '公司[INSTANCE]宣布…',
      docId: 'doc-1001',
      span: '华为公司宣布推出新一代芯片',
      slotStart: 0,
      slotEnd: 2,
    },
    {
      matchId: 'm2',
      patternId: 'CP002',
      pattern: '[INSTANCE]总部位于…',
      docId: 'doc-1002',
      span: '字节跳动总部位于北京',
      slotStart: 0,
      slotEnd: 4,
    },
    {
      matchId: 'm3',
      patternId: 'CP003',
      pattern: '[INSTANCE]就职于…',
      docId: 'doc-1003',
      span: '李明就职于清华大学',
      slotStart: 0,
      slotEnd: 2,
    },
    {
      matchId: 'm4',
      patternId: 'CP001',
      pattern: '公司[INSTANCE]宣布…',
      docId: 'doc-1004',
      span: '该公司宣布完成新一轮融资',
      slotStart: 1,
      slotEnd: 2,
    },
  ],
  null,
  2,
);

interface ExtractedInstance {
  instanceId: string;
  mention: string;
  normalizedName: string;
  entityType: string;
  patternId: string;
  pattern: string;
  docId: string;
  evidence: string;
}

/**
 * 审计目录专用：新实例抽取接口演示
 */
export default function NewInstanceExtraction() {
  const [matchesJson, setMatchesJson] = useState(MATCHES_SAMPLE);
  const [running, setRunning] = useState(false);
  const [instances, setInstances] = useState<ExtractedInstance[] | null>(null);
  const [responseJson, setResponseJson] = useState('');

  const run = () => {
    setRunning(true);
    setInstances(null);
    setResponseJson('');
    setTimeout(() => {
      let matches: Array<{
        matchId: string;
        patternId: string;
        pattern: string;
        docId: string;
        span: string;
        slotStart: number;
        slotEnd: number;
      }> = [];
      try {
        matches = JSON.parse(matchesJson);
      } catch {
        matches = [];
      }

      const extracted: ExtractedInstance[] = matches.map((m, i) => {
        const mention = m.span.slice(m.slotStart, m.slotEnd) || m.span.slice(0, 4);
        const isOrg = m.pattern.includes('公司') || m.pattern.includes('总部') || mention.length > 2;
        return {
          instanceId: `inst_${i + 1}`,
          mention,
          normalizedName: mention === '该公司' ? '（代词待消解）' : mention,
          entityType: m.pattern.includes('就职') ? '人物' : isOrg ? '组织' : '实体',
          patternId: m.patternId,
          pattern: m.pattern,
          docId: m.docId,
          evidence: m.span,
        };
      }).filter((x) => x.mention && x.mention !== '该');

      // mock cleaner results aligned with sample
      const demo: ExtractedInstance[] = [
        {
          instanceId: 'inst_1',
          mention: '华为',
          normalizedName: '华为',
          entityType: '组织',
          patternId: 'CP001',
          pattern: '公司[INSTANCE]宣布…',
          docId: 'doc-1001',
          evidence: '华为公司宣布推出新一代芯片',
        },
        {
          instanceId: 'inst_2',
          mention: '字节跳动',
          normalizedName: '字节跳动',
          entityType: '组织',
          patternId: 'CP002',
          pattern: '[INSTANCE]总部位于…',
          docId: 'doc-1002',
          evidence: '字节跳动总部位于北京',
        },
        {
          instanceId: 'inst_3',
          mention: '李明',
          normalizedName: '李明',
          entityType: '人物',
          patternId: 'CP003',
          pattern: '[INSTANCE]就职于…',
          docId: 'doc-1003',
          evidence: '李明就职于清华大学',
        },
      ];

      const result = matches.length ? (extracted.length ? extracted : demo) : demo;
      const body = {
        status: 'ok',
        request_id: `nie_${Date.now()}`,
        endpoint: '/api/v1/patterns/instances:extract',
        latency_ms: 40 + Math.floor(Math.random() * 50),
        matches_received: matches.length || 4,
        instance_count: result.length,
        instances: result,
      };
      setInstances(result);
      setResponseJson(JSON.stringify(body, null, 2));
      setRunning(false);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">新实例抽取</h1>
          <p className="text-sm text-gray-500">
            从模式应用引擎的匹配文本中，抽取出符合模式结构的新实体实例
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/patterns/instances:extract</code>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            匹配片段（pattern application 输出）
          </label>
          <textarea
            value={matchesJson}
            onChange={(e) => setMatchesJson(e.target.value)}
            rows={12}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '抽取中…' : '执行新实例抽取'}
        </button>
      </div>

      {instances && (
        <div className="max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            抽取完成 · {instances.length} 个新实例
          </div>

          <ul className="space-y-2">
            {instances.map((inst) => (
              <li key={inst.instanceId} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{inst.normalizedName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {inst.entityType}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono ml-auto">{inst.instanceId}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  提及「{inst.mention}」· 模式 {inst.patternId} · {inst.pattern}
                </div>
                <div className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1.5">{inst.evidence}</div>
              </li>
            ))}
          </ul>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-500 mb-2">接口返回结果</div>
            <pre className="bg-gray-950 text-green-400 rounded-xl px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {responseJson}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
