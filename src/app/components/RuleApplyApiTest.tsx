import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Play, PlugZap } from 'lucide-react';
import { ruleFilterApplyApi } from '../api/ruleFilterApplyApi';

const ENDPOINT = '/api/v1/rule-library/apply';

const SAMPLE_FACTS = `知识图谱
嵌入
Transformer
预训练`;

/**
 * 审计目录专用：规则库应用接口联调页
 * POST /api/v1/rule-library/apply
 */
export default function RuleApplyApiTest() {
  const [factsText, setFactsText] = useState(SAMPLE_FACTS);
  const [category, setCategory] = useState('');
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [topK, setTopK] = useState(10);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [responseJson, setResponseJson] = useState('');
  const [hits, setHits] = useState<
    Array<{
      library_id: string;
      rule_id: string;
      version: number;
      category: string;
      confidence: number;
      lift: number;
      antecedent: string[];
      consequent: string[];
      inferred: string[];
    }>
  >([]);
  const [inferences, setInferences] = useState<string[]>([]);
  const [meta, setMeta] = useState<{ source?: string; latency_ms?: number; matched_count?: number }>({});

  const categories = useMemo(() => ['', ...ruleFilterApplyApi.listCategories()], []);

  useEffect(() => {
    // 保证页面打开时至少有本地演示数据可测
    if (!ruleFilterApplyApi.listLibrary().length) {
      /* apply 会回落到 SEED 规则 */
    }
  }, []);

  const run = async () => {
    const facts = factsText
      .split(/[\n,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!facts.length) {
      setError('请至少输入一条事实项');
      return;
    }
    setRunning(true);
    setError('');
    setOkMsg('');
    setResponseJson('');
    setHits([]);
    setInferences([]);
    try {
      const body = {
        facts,
        category: category || undefined,
        min_confidence: minConfidence,
        top_k: topK,
      };
      const data = await ruleFilterApplyApi.apply(body);
      setHits(data.hits);
      setInferences(data.inferences);
      setMeta({
        source: data.source,
        latency_ms: data.latency_ms,
        matched_count: data.matched_count,
      });
      setResponseJson(
        JSON.stringify(
          {
            status: 'ok',
            data: {
              request_id: data.request_id,
              matched_count: data.matched_count,
              inferences: data.inferences,
              hits: data.hits,
              latency_ms: data.latency_ms,
              source: data.source,
            },
            error: null,
            endpoint: ENDPOINT,
            request: body,
          },
          null,
          2,
        ),
      );
      setOkMsg(
        `命中 ${data.matched_count} 条规则 · ${data.source === 'api' ? '网关' : '本地演示'} · ${data.latency_ms}ms`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : '调用失败');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto p-8">
      <div className="flex items-start justify-between gap-3 flex-shrink-0">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">规则筛选与应用</div>
          <h1 className="text-xl font-semibold text-gray-900">应用接口</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">
            提供 API，供推荐系统或预警系统调用规则库进行推理。本页用于快速联调{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">{ENDPOINT}</code>。
          </p>
          <p className="text-[11px] text-gray-400 mt-1 font-mono">
            {ruleFilterApplyApi.base}
            {ENDPOINT}
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0 inline-flex items-center gap-1">
          <PlugZap className="w-3.5 h-3.5" />
          接口测试页
        </span>
      </div>

      {okMsg && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {okMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">请求参数</h2>
          <label className="text-xs text-gray-600 flex flex-col gap-1">
            事实项集 facts（每行或逗号分隔）
            <textarea
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono min-h-[140px]"
              value={factsText}
              onChange={(e) => setFactsText(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs text-gray-600 flex flex-col gap-1">
              category（可选）
              <select
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">不限</option>
                {categories
                  .filter(Boolean)
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs text-gray-600 flex flex-col gap-1">
              min_confidence ≥ {minConfidence.toFixed(2)}
              <input
                type="range"
                min={0.3}
                max={0.95}
                step={0.01}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-gray-600 flex flex-col gap-1">
              top_k
              <input
                type="number"
                min={1}
                max={50}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value) || 10)}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-700 disabled:opacity-60"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            调用应用接口
          </button>
          <div className="text-[11px] text-gray-400 leading-relaxed">
            提示：可先在「规则评估指标展示」入库规则，再在本页用相同前件事实验证命中；无入库时会回落到演示规则集。
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 min-h-[360px]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">响应结果</h2>
            {meta.matched_count != null && (
              <span className="text-[11px] text-gray-400">
                matched={meta.matched_count} · {meta.source} · {meta.latency_ms}ms
              </span>
            )}
          </div>
          {!!inferences.length && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5">推断结论 inferences</div>
              <div className="flex flex-wrap gap-1.5">
                {inferences.map((item) => (
                  <span
                    key={item}
                    className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!!hits.length && (
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-2 py-1.5">规则</th>
                    <th className="text-right px-2 py-1.5">置信度</th>
                    <th className="text-right px-2 py-1.5">提升度</th>
                    <th className="text-left px-2 py-1.5">分类</th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((h) => (
                    <tr key={`${h.library_id}-${h.rule_id}`} className="border-t border-gray-50">
                      <td className="px-2 py-1.5 font-mono">
                        {`{${h.antecedent.join(', ')}} ⇒ {${h.consequent.join(', ')}}`}
                        <div className="text-[10px] text-gray-400">
                          {h.library_id} · v{h.version}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-blue-700">
                        {h.confidence.toFixed(3)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{h.lift.toFixed(2)}</td>
                      <td className="px-2 py-1.5">{h.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <pre className="flex-1 text-[11px] bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-auto text-gray-700 min-h-[180px]">
            {responseJson || '// 点击「调用应用接口」后展示 JSON 响应'}
          </pre>
        </section>
      </div>
    </div>
  );
}
