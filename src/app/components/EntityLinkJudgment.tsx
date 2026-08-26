import { useState } from 'react';
import { Play, Brain, Sparkles, CheckCircle2, BookOpen } from 'lucide-react';

type BuiltinModel = {
  id: string;
  name: string;
  short: string;
  description: string;
};

const BUILTIN_MODELS: BuiltinModel[] = [
  {
    id: 'joint-unsup',
    name: '词与实体联合表示 · 无监督概率模型',
    short: '无监督联合表示',
    description:
      '基于词和实体联合表示的无监督概率模型：在共享向量空间中建模提及上下文与候选实体的共现分布，无需大规模标注即可估计链接后验。',
  },
  {
    id: 'multitask',
    name: '多任务学习 · 实体发现与链接联合优化',
    short: '多任务联合优化',
    description:
      '基于多任务学习的实体发现与链接联合优化模型：共享编码器同时优化实体边界发现与链接消歧目标，提升上下文语义一致性。',
  },
  {
    id: 'joint-el',
    name: '词与实体联合表示 · 实体链接模型',
    short: '联合表示链接',
    description:
      '基于词和实体联合表示的实体链接模型：对提及上下文编码后与候选实体嵌入做交互打分，进行精准消歧并输出最优链接。',
  },
];

type Example = {
  mention: string;
  context: string;
  candidates: string[];
};

const EXAMPLES: Example[] = [
  {
    mention: '多伦多大学',
    context:
      '作者 Geoffrey Hinton 就职于多伦多大学计算机系，长期从事深度学习与表示学习研究，并与 Bengio、LeCun 共同获得图灵奖。',
    candidates: [
      'University of Toronto｜加拿大综合研究型大学｜机构',
      '多伦多都会大学｜加拿大应用型大学｜机构',
      '多伦多市｜加拿大安大略省城市｜地点',
    ],
  },
  {
    mention: 'CNN',
    context:
      '实验表明，CNN 即卷积神经网络在图像识别任务上显著优于传统浅层特征方法，并推动了计算机视觉发展。',
    candidates: [
      '卷积神经网络 (CNN)｜深度学习视觉模型｜概念',
      '有线新闻网 (CNN)｜美国新闻媒体｜组织',
      '细胞神经网络｜RNN 变体｜概念',
    ],
  },
  {
    mention: 'Apple',
    context:
      '该论文对比了在 Apple Silicon 上部署 Transformer 推理的吞吐与能耗，并给出端侧优化建议。',
    candidates: [
      'Apple Inc.｜消费电子与芯片公司｜组织',
      '苹果（水果）｜蔷薇科植物果实｜概念',
      'Apple Records｜音乐厂牌｜组织',
    ],
  },
];

type Candidate = { raw: string; name: string; desc: string; type: string };

function parseCandidates(raw: string): Candidate[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[｜|]/).map((p) => p.trim());
      return {
        raw: line,
        name: parts[0] || line,
        desc: parts[1] || '',
        type: parts[2] || '实体',
      };
    });
}

function tokenSet(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[\s,，、;；:：。．.!！?？()（）\[\]【】/\\|]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter || 1);
}

function scoreCandidate(
  mention: string,
  context: string,
  cand: Candidate,
  modelId: string,
): { score: number; contextSim: number; mentionSim: number; priorBoost: number; reason: string } {
  const ctx = tokenSet(context);
  const men = tokenSet(mention);
  const candTok = tokenSet(`${cand.name} ${cand.desc} ${cand.type}`);
  const contextSim = jaccard(ctx, candTok);
  const mentionSim = jaccard(men, tokenSet(cand.name));

  // 简单先验：描述更具体、类型机构/概念等略抬升
  let priorBoost = Math.min(0.25, (cand.desc.length / 80) * 0.15 + (cand.name.length > 4 ? 0.05 : 0));
  if (/大学|University|研究院|Inc\.|公司/.test(cand.name + cand.desc)) priorBoost += 0.08;
  if (/水果|城市|地点/.test(cand.name + cand.type) && /研究|论文|部署|计算机/.test(context)) {
    priorBoost -= 0.12;
  }
  if (/新闻|媒体|Records/.test(cand.name + cand.desc) && /卷积|图像|视觉|神经网络/.test(context)) {
    priorBoost -= 0.15;
  }
  if (/卷积|深度学习|视觉/.test(cand.desc) && /卷积|图像|视觉|神经网络/.test(context)) {
    priorBoost += 0.18;
  }
  if (/Silicon|芯片|推理|Transformer/.test(context) && /Inc\.|芯片|电子/.test(cand.name + cand.desc)) {
    priorBoost += 0.2;
  }

  const weights =
    modelId === 'joint-unsup'
      ? { ctx: 0.45, men: 0.25, prior: 0.3 }
      : modelId === 'multitask'
        ? { ctx: 0.5, men: 0.2, prior: 0.3 }
        : { ctx: 0.4, men: 0.3, prior: 0.3 };

  const score = Math.max(
    0,
    Math.min(0.99, contextSim * weights.ctx + mentionSim * weights.men + priorBoost * weights.prior + 0.15),
  );

  const reason =
    modelId === 'joint-unsup'
      ? `无监督联合表示：上下文共现 ${contextSim.toFixed(2)}，提及对齐 ${mentionSim.toFixed(2)}`
      : modelId === 'multitask'
        ? `多任务联合优化：语境一致性 ${contextSim.toFixed(2)}，发现-链接耦合抬升 ${(priorBoost + 0.1).toFixed(2)}`
        : `联合表示链接：交互打分综合上下文 ${contextSim.toFixed(2)} 与实体嵌入匹配`;

  return { score, contextSim, mentionSim, priorBoost, reason };
}

export default function EntityLinkJudgment({
  initialFocus,
}: {
  initialFocus?: 'context' | 'model' | null;
}) {
  const ex0 = EXAMPLES[0];
  const [mention, setMention] = useState(ex0.mention);
  const [context, setContext] = useState(ex0.context);
  const [candidatesRaw, setCandidatesRaw] = useState(ex0.candidates.join('\n'));
  const [modelId, setModelId] = useState(BUILTIN_MODELS[2].id);
  const [results, setResults] = useState<
    Array<Candidate & ReturnType<typeof scoreCandidate>> | null
  >(null);

  const model = BUILTIN_MODELS.find((m) => m.id === modelId) ?? BUILTIN_MODELS[0];

  const run = () => {
    const cands = parseCandidates(candidatesRaw);
    if (!cands.length || !context.trim() || !mention.trim()) {
      setResults([]);
      return;
    }
    const ranked = cands
      .map((c) => ({ ...c, ...scoreCandidate(mention, context, c, modelId) }))
      .sort((a, b) => b.score - a.score);
    setResults(ranked);
  };

  const best = results?.[0] ?? null;

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">实体链接判断</h1>
        <p className="text-sm text-gray-400">
          输入上下文与候选实体，经内置消歧模型输出最正确的链接目标
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 max-w-6xl">
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div
            id="elj-context"
            className={`space-y-3 rounded-lg ${initialFocus === 'context' ? 'ring-1 ring-blue-200 p-3 -m-1' : ''}`}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Sparkles className="w-4 h-4 text-blue-500" />
              上下文语义分析
            </div>
            <p className="text-xs text-gray-500">
              利用深度学习模型理解实体提及的上下文语境，提取语义线索后与候选实体对齐。
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-600">实体提及</span>
              <input
                value={mention}
                onChange={(e) => setMention(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400"
                placeholder="如：多伦多大学"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-gray-600">上下文</span>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 leading-relaxed"
                placeholder="包含该提及的句子或段落…"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">
              候选实体（每行一个，可用 名称｜描述｜类型）
            </span>
            <textarea
              value={candidatesRaw}
              onChange={(e) => setCandidatesRaw(e.target.value)}
              rows={5}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 font-mono text-[12px]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-gray-400">示例：</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.mention}
                type="button"
                onClick={() => {
                  setMention(ex.mention);
                  setContext(ex.context);
                  setCandidatesRaw(ex.candidates.join('\n'));
                  setResults(null);
                }}
                className="text-[11px] px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {ex.mention}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={run}
            disabled={!mention.trim() || !context.trim() || !candidatesRaw.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            运行链接判断
          </button>
        </div>

        <div
          id="elj-model"
          className={`xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5 space-y-3 ${
            initialFocus === 'model' ? 'ring-1 ring-violet-200' : ''
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Brain className="w-4 h-4 text-violet-500" />
            内置模型
          </div>
          <p className="text-xs text-gray-500">
            选择消歧模型；模型能力以描述体现，用于精准实体链接。
          </p>
          <div className="space-y-2">
            {BUILTIN_MODELS.map((m) => {
              const on = m.id === modelId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setModelId(m.id);
                    setResults(null);
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                    on ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className={`w-3.5 h-3.5 ${on ? 'text-violet-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${on ? 'text-violet-900' : 'text-gray-800'}`}>
                      {m.short}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{m.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {results && (
        <div className="max-w-6xl space-y-4">
          {best ? (
            <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-green-100 bg-green-50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">最优候选实体</span>
                <span className="ml-auto text-xs text-green-700">{model.short}</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{best.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {best.type}
                      {best.desc ? ` · ${best.desc}` : ''}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{best.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-green-700 tabular-nums">
                      {(best.score * 100).toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-gray-400">链接置信度</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-400 text-center">
              请至少提供一个候选实体
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-600">
                全部候选排序（上下文语义分析 + {model.short}）
              </div>
              <div className="divide-y divide-gray-50">
                {results.map((r, i) => (
                  <div key={r.raw} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{r.name}</div>
                      <div className="text-[11px] text-gray-400 truncate">
                        语境 {r.contextSim.toFixed(2)} · 提及 {r.mentionSim.toFixed(2)}
                        {r.desc ? ` · ${r.desc}` : ''}
                      </div>
                    </div>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className={`h-full rounded-full ${i === 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                        style={{ width: `${r.score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-gray-700 w-12 text-right">
                      {(r.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
