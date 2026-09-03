import { useState } from 'react';
import { Play, CheckCircle2 } from 'lucide-react';

const INSTANCES_SAMPLE = JSON.stringify(
  [
    {
      instanceId: 'inst_1',
      mention: '华为',
      normalizedName: '华为',
      entityType: '组织',
      supportingPatterns: [
        { patternId: 'CP001', pattern: '公司[INSTANCE]宣布…', qualityScore: 0.89 },
        { patternId: 'CP006', pattern: '[INSTANCE]应用于…领域', qualityScore: 0.85 },
      ],
    },
    {
      instanceId: 'inst_2',
      mention: '字节跳动',
      normalizedName: '字节跳动',
      entityType: '组织',
      supportingPatterns: [
        { patternId: 'CP002', pattern: '[INSTANCE]总部位于…', qualityScore: 0.82 },
      ],
    },
    {
      instanceId: 'inst_3',
      mention: '李明',
      normalizedName: '李明',
      entityType: '人物',
      supportingPatterns: [
        { patternId: 'CP003', pattern: '[INSTANCE]就职于…', qualityScore: 0.91 },
        { patternId: 'CP005', pattern: '[INSTANCE]表示将…', qualityScore: 0.61 },
      ],
    },
  ],
  null,
  2,
);

interface ScoredInstance {
  instanceId: string;
  normalizedName: string;
  entityType: string;
  patternCount: number;
  avgPatternQuality: number;
  confidence: number;
  formula: string;
  supportingPatterns: Array<{ patternId: string; pattern: string; qualityScore: number }>;
}

function scoreInstance(raw: {
  instanceId: string;
  normalizedName: string;
  entityType: string;
  supportingPatterns: Array<{ patternId: string; pattern: string; qualityScore: number }>;
}): ScoredInstance {
  const patterns = raw.supportingPatterns ?? [];
  const n = Math.max(1, patterns.length);
  const avg = patterns.reduce((s, p) => s + p.qualityScore, 0) / n;
  // 置信度 = 平均模式质量 × (1 - e^{-k·模式数})，演示用 k=0.7
  const diversity = 1 - Math.exp(-0.7 * n);
  const confidence = Math.min(0.99, avg * (0.55 + 0.45 * diversity));
  return {
    instanceId: raw.instanceId,
    normalizedName: raw.normalizedName,
    entityType: raw.entityType,
    patternCount: n,
    avgPatternQuality: avg,
    confidence,
    formula: 'confidence ≈ avg(patternQuality) × (0.55 + 0.45×(1−e^{−0.7·n}))',
    supportingPatterns: patterns,
  };
}

/**
 * 审计目录专用：实例置信度评估接口演示
 */
export default function InstanceConfidenceEvaluation() {
  const [instancesJson, setInstancesJson] = useState(INSTANCES_SAMPLE);
  const [running, setRunning] = useState(false);
  const [scored, setScored] = useState<ScoredInstance[] | null>(null);
  const [responseJson, setResponseJson] = useState('');

  const run = () => {
    setRunning(true);
    setScored(null);
    setResponseJson('');
    setTimeout(() => {
      let raw: Array<{
        instanceId: string;
        normalizedName: string;
        entityType: string;
        supportingPatterns: Array<{ patternId: string; pattern: string; qualityScore: number }>;
      }> = [];
      try {
        raw = JSON.parse(instancesJson);
      } catch {
        raw = [];
      }
      const results = (raw.length ? raw : JSON.parse(INSTANCES_SAMPLE)).map(scoreInstance);
      const body = {
        status: 'ok',
        request_id: `ice_${Date.now()}`,
        endpoint: '/api/v1/patterns/instances:score',
        latency_ms: 18 + Math.floor(Math.random() * 30),
        formula: 'confidence ≈ avg(patternQuality) × (0.55 + 0.45×(1−e^{−0.7·n}))',
        instance_count: results.length,
        instances: results.map((r) => ({
          instanceId: r.instanceId,
          normalizedName: r.normalizedName,
          entityType: r.entityType,
          patternCount: r.patternCount,
          avgPatternQuality: Number(r.avgPatternQuality.toFixed(4)),
          confidence: Number(r.confidence.toFixed(4)),
          supportingPatterns: r.supportingPatterns,
        })),
      };
      setScored(results);
      setResponseJson(JSON.stringify(body, null, 2));
      setRunning(false);
    }, 700);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">实例置信度评估</h1>
          <p className="text-sm text-gray-500">
            根据发现该实例的模式数量与模式质量分，为每个新抽取实例计算置信度
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/patterns/instances:score</code>
        </div>

        <div className="text-xs text-gray-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          评分依据：支持模式数量 n、各模式 qualityScore；演示公式
          <code className="mx-1 text-blue-700">confidence ≈ avg(q) × (0.55 + 0.45×(1−e^{−0.7n}))</code>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            待评估实例（含 supportingPatterns）
          </label>
          <textarea
            value={instancesJson}
            onChange={(e) => setInstancesJson(e.target.value)}
            rows={14}
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
          {running ? '评估中…' : '执行置信度评估'}
        </button>
      </div>

      {scored && (
        <div className="max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            评估完成 · {scored.length} 个实例
          </div>

          <ul className="space-y-3">
            {scored.map((s) => {
              const pct = Math.round(s.confidence * 1000) / 10;
              return (
                <li key={s.instanceId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{s.normalizedName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {s.entityType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        支持模式 {s.patternCount} 个 · 平均模式质量 {(s.avgPatternQuality * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold tabular-nums text-blue-700">{pct.toFixed(1)}%</div>
                      <div className="text-[10px] text-gray-400">confidence</div>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-2">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.supportingPatterns.map((p) => (
                        <span
                          key={p.patternId}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50"
                        >
                          {p.patternId} · q={(p.qualityScore * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
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
