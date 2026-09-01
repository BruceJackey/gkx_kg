import { useState } from 'react';
import { Play, TrendingUp, Link2, CheckCircle2 } from 'lucide-react';

const HISTORY_SAMPLE = JSON.stringify(
  {
    entityId: 'E001',
    entityName: '李明',
    attributeSeries: [
      { time: '2023-01-01', attribute: 'h_index', value: 36 },
      { time: '2023-07-01', attribute: 'h_index', value: 38 },
      { time: '2024-01-01', attribute: 'h_index', value: 40 },
      { time: '2024-07-01', attribute: 'h_index', value: 42 },
      { time: '2025-01-01', attribute: 'h_index', value: 44 },
      { time: '2023-01-01', attribute: 'publications', value: 152 },
      { time: '2024-01-01', attribute: 'publications', value: 168 },
      { time: '2025-01-01', attribute: 'publications', value: 186 },
      { time: '2024-01-01', attribute: 'affiliation', value: '清华大学' },
      { time: '2025-01-01', attribute: 'affiliation', value: '清华大学' },
    ],
    relationSeries: [
      { time: '2023-06-01', subject: '李明', predicate: '合作者', object: '张伟', active: true },
      { time: '2024-03-01', subject: '李明', predicate: '合作者', object: '王芳', active: true },
      { time: '2024-09-01', subject: '李明', predicate: '参与项目', object: '国家重点研发计划', active: true },
    ],
  },
  null,
  2,
);

const DEPENDENCY_SAMPLE = JSON.stringify(
  [
    {
      antecedent: '发表论文数↑',
      consequent: 'H指数↑',
      deltaT: '≤ 6个月',
      probability: 0.82,
    },
    {
      antecedent: '参与国家级项目',
      consequent: '新增合作者关系',
      deltaT: '≤ 90天',
      probability: 0.71,
    },
    {
      antecedent: 'H指数≥45',
      consequent: '就职机构变更风险',
      deltaT: '≤ 12个月',
      probability: 0.38,
    },
  ],
  null,
  2,
);

type ModelId = 'timeseries' | 'dynamic_graph' | 'hybrid';

const MODEL_OPTIONS: Array<{ id: ModelId; label: string; desc: string }> = [
  { id: 'timeseries', label: '时间序列分析', desc: 'ARIMA / Prophet 类属性轨迹外推' },
  { id: 'dynamic_graph', label: '动态图模型', desc: '基于时序边演化预测关系' },
  { id: 'hybrid', label: '混合模型', desc: '属性序列 + 时序依赖联合预测' },
];

interface AttrPrediction {
  attribute: string;
  predictedValue: string | number;
  confidence: number;
  method: string;
  rationale: string;
}

interface RelPrediction {
  subject: string;
  predicate: string;
  object: string;
  probability: number;
  status: 'likely_new' | 'likely_persist' | 'likely_end';
  rationale: string;
}

/**
 * 审计目录专用：未来状态预测接口演示
 * 输入历史数据 + 时序依赖 → 输出未来属性/关系预测
 */
export default function FutureStatePrediction() {
  const [historyJson, setHistoryJson] = useState(HISTORY_SAMPLE);
  const [dependencyJson, setDependencyJson] = useState(DEPENDENCY_SAMPLE);
  const [horizon, setHorizon] = useState('2026-07-01');
  const [model, setModel] = useState<ModelId>('hybrid');
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [attrs, setAttrs] = useState<AttrPrediction[]>([]);
  const [rels, setRels] = useState<RelPrediction[]>([]);
  const [meta, setMeta] = useState<{ requestId: string; latencyMs: number } | null>(null);

  const runPredict = () => {
    setRunning(true);
    setRan(false);
    setAttrs([]);
    setRels([]);
    setMeta(null);

    setTimeout(() => {
      let entityName = '李明';
      try {
        const hist = JSON.parse(historyJson);
        entityName = hist.entityName || hist.entityId || entityName;
      } catch {
        /* keep default */
      }

      let deps: Array<{ antecedent: string; consequent: string; probability: number; deltaT: string }> = [];
      try {
        deps = JSON.parse(dependencyJson);
      } catch {
        deps = [];
      }

      const useTs = model === 'timeseries' || model === 'hybrid';
      const useDg = model === 'dynamic_graph' || model === 'hybrid';

      const nextAttrs: AttrPrediction[] = [];
      if (useTs) {
        nextAttrs.push({
          attribute: 'h_index',
          predictedValue: 47,
          confidence: 0.86,
          method: '时间序列外推',
          rationale: '历史 H 指数近似线性上升（约 +2 / 半年），外推至目标时点约为 47',
        });
        nextAttrs.push({
          attribute: 'publications',
          predictedValue: 204,
          confidence: 0.81,
          method: '时间序列外推',
          rationale: '年发表量增速约 +18，外推至目标时点约 204',
        });
        nextAttrs.push({
          attribute: 'affiliation',
          predictedValue: '清华大学',
          confidence: 0.74,
          method: model === 'hybrid' ? '混合（序列稳定 + 依赖弱信号）' : '时间序列外推',
          rationale:
            deps.find((d) => d.consequent.includes('就职')) && model === 'hybrid'
              ? '属性序列稳定为清华大学；依赖「H指数≥45 → 机构变更」概率较低，维持原机构'
              : '历史 affiliation 无变更，预测维持',
        });
      }

      const nextRels: RelPrediction[] = [];
      if (useDg || model === 'hybrid') {
        nextRels.push({
          subject: entityName,
          predicate: '合作者',
          object: '张伟',
          probability: 0.88,
          status: 'likely_persist',
          rationale: '历史合作关系持续活跃，动态图边强度未衰减',
        });
        nextRels.push({
          subject: entityName,
          predicate: '合作者',
          object: '（新）陈凯',
          probability: 0.69,
          status: 'likely_new',
          rationale:
            deps.find((d) => d.consequent.includes('合作者'))
              ? `依赖「${deps.find((d) => d.consequent.includes('合作者'))!.antecedent} → 新增合作者」P=${deps.find((d) => d.consequent.includes('合作者'))!.probability}，结合项目参与预测新增合作边`
              : '项目参与活跃，动态图模型预测新增合作边',
        });
        nextRels.push({
          subject: entityName,
          predicate: '参与项目',
          object: '国家重点研发计划',
          probability: 0.77,
          status: 'likely_persist',
          rationale: '项目周期覆盖目标时点，关系边保持激活',
        });
      }

      if (model === 'timeseries') {
        // 纯时序模型弱化关系预测，仅保留一条示意
        nextRels.splice(1);
      }

      setAttrs(nextAttrs);
      setRels(nextRels);
      setMeta({
        requestId: `fsp_${Date.now()}`,
        latencyMs: 60 + Math.floor(Math.random() * 80),
      });
      setRunning(false);
      setRan(true);
    }, 850);
  };

  const statusLabel: Record<RelPrediction['status'], string> = {
    likely_new: '预计新增',
    likely_persist: '预计延续',
    likely_end: '预计结束',
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">未来状态预测</h1>
          <p className="text-sm text-gray-500">
            基于历史数据与时序依赖关系，预测实体在未来时点的属性值或关系
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/temporal/future-state:predict</code>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">预测目标时点</label>
            <input
              type="date"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">预测模型</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.desc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">历史数据（属性序列 + 关系序列）</label>
          <textarea
            value={historyJson}
            onChange={(e) => setHistoryJson(e.target.value)}
            rows={10}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">时序依赖关系</label>
          <textarea
            value={dependencyJson}
            onChange={(e) => setDependencyJson(e.target.value)}
            rows={7}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-y"
          />
        </div>

        <button
          type="button"
          onClick={runPredict}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '预测中…' : '执行未来状态预测'}
        </button>
      </div>

      {ran && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            预测结果
            <span className="text-xs font-normal text-gray-400 ml-1">
              目标时点 {horizon}
              {meta ? ` · ${meta.requestId} · ${meta.latencyMs}ms` : ''}
            </span>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              属性值预测 · {attrs.length}
            </div>
            {attrs.length === 0 ? (
              <p className="text-sm text-gray-400">当前模型未输出属性预测</p>
            ) : (
              <ul className="divide-y border border-gray-200 rounded-lg overflow-hidden">
                {attrs.map((a) => (
                  <li key={a.attribute} className="px-4 py-3 text-sm bg-white">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{a.attribute}</span>
                      <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                        {String(a.predictedValue)}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-auto">
                        置信度 {(a.confidence * 100).toFixed(0)}% · {a.method}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{a.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" />
              关系预测 · {rels.length}
            </div>
            {rels.length === 0 ? (
              <p className="text-sm text-gray-400">当前模型未输出关系预测</p>
            ) : (
              <ul className="divide-y border border-gray-200 rounded-lg overflow-hidden">
                {rels.map((r, i) => (
                  <li key={`${r.subject}-${r.predicate}-${r.object}-${i}`} className="px-4 py-3 text-sm bg-white">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-800">
                        ({r.subject}, {r.predicate}, {r.object})
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          r.status === 'likely_new'
                            ? 'bg-green-100 text-green-700'
                            : r.status === 'likely_end'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {statusLabel[r.status]}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-auto">
                        P={(r.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
