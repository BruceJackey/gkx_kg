import { useState } from 'react';
import { Play } from 'lucide-react';

const FACTS_SAMPLE = JSON.stringify([
  { subject: '作者:张三', predicate: 'WRITTEN_BY', object: '论文:深度学习新进展', properties: { order: 1 } },
  { subject: '作者:李四', predicate: 'WRITTEN_BY', object: '论文:深度学习新进展', properties: { order: 2 } },
  { subject: '作者:王五', predicate: 'WRITTEN_BY', object: '论文:图神经网络综述', properties: { order: 1 } },
  { subject: '作者:张三', predicate: 'WRITTEN_BY', object: '论文:图神经网络综述', properties: { order: 2 } },
], null, 2);

const AVAILABLE_RULES = [
  { id: 'coauthor_relation_infer', name: '论文合著者关系推断' },
  { id: 'R005', name: '项目成员同事关系推断' },
  { id: 'R001', name: '人物实体质量检测' },
  { id: 'R006', name: '论文学科领域分类' },
];

/**
 * 审计目录专用：API 集成接口简易演示
 */
export default function ApiIntegrationInference() {
  const [factsJson, setFactsJson] = useState(FACTS_SAMPLE);
  const [selectedRules, setSelectedRules] = useState<string[]>(['coauthor_relation_infer']);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');
  const [ran, setRan] = useState(false);

  const toggleRule = (id: string) => {
    setSelectedRules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runInference = () => {
    setRunning(true);
    setRan(false);
    setResponse('');
    setTimeout(() => {
      let factsCount = 0;
      try {
        factsCount = JSON.parse(factsJson).length;
      } catch {
        factsCount = 0;
      }
      const rules = AVAILABLE_RULES.filter((r) => selectedRules.includes(r.id));
      const inferences = rules.flatMap((rule, ri) => {
        if (rule.id === 'coauthor_relation_infer' || rule.id === 'R005') {
          return [
            {
              rule_id: rule.id,
              rule_name: rule.name,
              action: 'create_relation',
              subject: '作者:张三',
              predicate: '合作者',
              object: '作者:李四',
              confidence: 0.95,
              evidence: '共同作者于同一论文',
            },
            {
              rule_id: rule.id,
              rule_name: rule.name,
              action: 'create_relation',
              subject: '作者:王五',
              predicate: '合作者',
              object: '作者:张三',
              confidence: 0.92,
              evidence: '共同作者于同一论文',
            },
          ];
        }
        if (rule.id === 'R001') {
          return [{
            rule_id: rule.id,
            rule_name: rule.name,
            action: 'mark_review',
            subject: '作者:张三',
            reason: '低置信度实体待审核',
            confidence: 0.58,
          }];
        }
        return [{
          rule_id: rule.id,
          rule_name: rule.name,
          action: 'set_property',
          subject: '论文:深度学习新进展',
          property: '学科领域',
          value: '计算机科学',
          confidence: 0.88,
        }];
      });

      const body = {
        status: 'ok',
        request_id: `req_${Date.now()}`,
        facts_received: factsCount,
        rules_applied: rules.map((r) => r.id),
        inference_count: inferences.length,
        latency_ms: 48 + Math.floor(Math.random() * 30),
        inferences,
      };
      setResponse(JSON.stringify(body, null, 2));
      setRunning(false);
      setRan(true);
    }, 900);
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">API 集成接口</h1>
          <p className="text-sm text-gray-500">提交事实数据，选择规则，执行推理并获取 RESTful 接口结果</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/inference</code>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">事实数据（facts JSON）</label>
          <textarea
            value={factsJson}
            onChange={(e) => setFactsJson(e.target.value)}
            rows={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">选择规则</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_RULES.map((rule) => {
              const on = selectedRules.includes(rule.id);
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    on ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {rule.name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={runInference}
          disabled={running || selectedRules.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '推理中…' : '执行推理'}
        </button>

        {ran && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">接口返回结果</div>
            <pre className="bg-gray-950 text-green-400 rounded-xl px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
