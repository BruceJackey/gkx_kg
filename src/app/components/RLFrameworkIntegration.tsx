import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Box,
  CheckCircle2,
  Network,
  Play,
  Settings2,
  Square,
} from 'lucide-react';

export type RLFrameworkFocus = 'env' | 'policy' | 'monitor';

const TABS: Array<{ id: RLFrameworkFocus; label: string; desc: string }> = [
  {
    id: 'env',
    label: 'RL环境定义',
    desc: '提供界面让用户定义强化学习的环境要素，如状态、动作和奖励函数。',
  },
  {
    id: 'policy',
    label: '策略网络训练与管理',
    desc: '支持选择并训练不同的策略网络模型。',
  },
  {
    id: 'monitor',
    label: '训练过程监控',
    desc: '以图表形式实时展示智能体的累计奖励、成功率等训练指标。',
  },
];

const POLICY_MODELS = [
  {
    id: 'dqn',
    name: 'DQN',
    desc: '深度 Q 网络，离散动作空间，适合出边选择式路径游走。',
  },
  {
    id: 'ppo',
    name: 'PPO',
    desc: '近端策略优化，稳定、样本效率较好，适合中等规模图谱。',
  },
  {
    id: 'reinforce',
    name: 'REINFORCE',
    desc: '经典策略梯度，实现简单，适合可解释路径推理演示。',
  },
  {
    id: 'actor-critic',
    name: 'Actor-Critic',
    desc: '策略与价值网络联合更新，兼顾探索与方差控制。',
  },
];

type TrainPoint = { episode: number; reward: number; success: number };

function genCurve(seed: number, episodes: number): TrainPoint[] {
  const out: TrainPoint[] = [];
  let reward = -2 + (seed % 5) * 0.1;
  let success = 0.08;
  for (let i = 1; i <= episodes; i += 1) {
    reward += 0.12 + Math.sin(i / 7 + seed) * 0.05 + (i % 11 === 0 ? 0.2 : 0);
    success = Math.min(0.92, success + 0.012 + Math.cos(i / 9) * 0.004);
    out.push({
      episode: i,
      reward: Number(reward.toFixed(2)),
      success: Number(success.toFixed(3)),
    });
  }
  return out;
}

function LineChart({
  points,
  valueKey,
  color,
  yLabel,
  formatY,
}: {
  points: TrainPoint[];
  valueKey: 'reward' | 'success';
  color: string;
  yLabel: string;
  formatY: (v: number) => string;
}) {
  const w = 520;
  const h = 160;
  const pad = { t: 12, r: 12, b: 24, l: 40 };
  const values = points.map((p) => p[valueKey]);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV || 1;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const coords = points.map((p, i) => {
    const x = pad.l + (i / Math.max(points.length - 1, 1)) * innerW;
    const y = pad.t + (1 - (p[valueKey] - minV) / span) * innerH;
    return `${x},${y}`;
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="text-xs font-medium text-gray-600 mb-2">{yLabel}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#e5e7eb" />
        <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#e5e7eb" />
        <polyline fill="none" stroke={color} strokeWidth="2" points={coords.join(' ')} />
        <text x={4} y={pad.t + 8} className="fill-gray-400" fontSize="10">
          {formatY(maxV)}
        </text>
        <text x={4} y={h - pad.b} className="fill-gray-400" fontSize="10">
          {formatY(minV)}
        </text>
        <text x={pad.l} y={h - 6} className="fill-gray-400" fontSize="10">
          ep.1
        </text>
        <text x={w - pad.r - 28} y={h - 6} className="fill-gray-400" fontSize="10">
          ep.{points[points.length - 1]?.episode ?? 0}
        </text>
      </svg>
    </div>
  );
}

/**
 * 审计目录专用：强化学习框架集成（知识补全路径搜索）
 */
export default function RLFrameworkIntegration({
  initialFocus = 'env',
}: {
  initialFocus?: RLFrameworkFocus | null;
}) {
  const [tab, setTab] = useState<RLFrameworkFocus>(initialFocus ?? 'env');

  // env
  const [stateDesc, setStateDesc] = useState(
    '当前实体节点 + 已走过路径 + 查询 (h, r, ?)',
  );
  const [actionSpace, setActionSpace] = useState('出边选择（邻接关系 / 尾实体）');
  const [maxHops, setMaxHops] = useState(3);
  const [rewardHit, setRewardHit] = useState(1.0);
  const [rewardStep, setRewardStep] = useState(-0.05);
  const [rewardFail, setRewardFail] = useState(-0.5);
  const [envSaved, setEnvSaved] = useState(false);

  // policy
  const [policyId, setPolicyId] = useState('ppo');
  const [lr, setLr] = useState(0.0003);
  const [batch, setBatch] = useState(64);
  const [episodes, setEpisodes] = useState(80);
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [curve, setCurve] = useState<TrainPoint[] | null>(null);

  useEffect(() => {
    if (initialFocus) setTab(initialFocus);
  }, [initialFocus]);

  const meta = TABS.find((t) => t.id === tab)!;
  const policy = POLICY_MODELS.find((p) => p.id === policyId)!;

  const latest = useMemo(() => {
    if (!curve || curve.length === 0) return null;
    return curve[curve.length - 1];
  }, [curve]);

  const saveEnv = () => {
    setEnvSaved(true);
    window.setTimeout(() => setEnvSaved(false), 2000);
  };

  const startTrain = () => {
    setTraining(true);
    setTrained(false);
    setCurve(null);
    window.setTimeout(() => {
      const data = genCurve(policyId.length * 17 + batch, episodes);
      setCurve(data);
      setTraining(false);
      setTrained(true);
      setTab('monitor');
    }, 900);
  };

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400';

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-[11px] text-gray-400 mb-0.5">知识补全 · 强化学习框架集成</div>
          <h1 className="text-xl font-semibold text-gray-900">{meta.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl leading-relaxed">{meta.desc}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto flex-shrink-0 w-fit max-w-full">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6 max-w-5xl space-y-4">
        {tab === 'env' && (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed">
              将知识补全建模为马尔可夫决策过程：智能体从查询头实体出发，在图谱上逐步选择出边，
              在限定跳数内到达正确尾实体即获得正向奖励。下方可配置状态、动作与奖励要素。
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-900">环境要素</h2>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] text-gray-500">状态 (State)</span>
                <textarea
                  className={`${inputCls} min-h-[64px]`}
                  value={stateDesc}
                  onChange={(e) => setStateDesc(e.target.value)}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] text-gray-500">动作空间 (Action)</span>
                <input
                  className={inputCls}
                  value={actionSpace}
                  onChange={(e) => setActionSpace(e.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">最大跳数</span>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    className={inputCls}
                    value={maxHops}
                    onChange={(e) => setMaxHops(Number(e.target.value) || 3)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">命中奖励</span>
                  <input
                    type="number"
                    step={0.1}
                    className={inputCls}
                    value={rewardHit}
                    onChange={(e) => setRewardHit(Number(e.target.value))}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">逐步代价</span>
                  <input
                    type="number"
                    step={0.01}
                    className={inputCls}
                    value={rewardStep}
                    onChange={(e) => setRewardStep(Number(e.target.value))}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">失败惩罚</span>
                  <input
                    type="number"
                    step={0.1}
                    className={inputCls}
                    value={rewardFail}
                    onChange={(e) => setRewardFail(Number(e.target.value))}
                  />
                </label>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-gray-600 font-mono">
                R = {rewardHit}·𝟙_hit + {rewardStep}·steps + {rewardFail}·𝟙_fail ，horizon ≤ {maxHops}
              </div>

              <button
                type="button"
                onClick={saveEnv}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg font-medium"
              >
                <Settings2 className="w-4 h-4" />
                保存环境定义
              </button>
              {envSaved && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 已保存（演示）
                </span>
              )}
            </div>
          </>
        )}

        {tab === 'policy' && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-gray-900">策略网络选择</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {POLICY_MODELS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPolicyId(p.id)}
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      policyId === p.id
                        ? 'border-indigo-400 bg-indigo-50/60'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">训练配置 · {policy.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">学习率</span>
                  <input
                    type="number"
                    step={0.0001}
                    className={inputCls}
                    value={lr}
                    onChange={(e) => setLr(Number(e.target.value))}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">batch size</span>
                  <input
                    type="number"
                    className={inputCls}
                    value={batch}
                    onChange={(e) => setBatch(Number(e.target.value) || 64)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-gray-500">训练 episodes</span>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    className={inputCls}
                    value={episodes}
                    onChange={(e) => setEpisodes(Number(e.target.value) || 80)}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startTrain}
                  disabled={training}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium"
                >
                  {training ? (
                    <>
                      <Square className="w-4 h-4 animate-pulse" /> 训练中…
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {trained ? '重新训练' : '启动训练'}
                    </>
                  )}
                </button>
                {trained && (
                  <span className="text-xs text-green-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {policy.name} 训练完成 · 可在「训练过程监控」查看曲线
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-medium text-gray-500 mb-2">模型管理（演示列表）</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="py-2 pr-3 font-medium">模型</th>
                    <th className="py-2 pr-3 font-medium">状态</th>
                    <th className="py-2 pr-3 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {POLICY_MODELS.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2 pr-3 font-medium text-gray-800">{p.name}</td>
                      <td className="py-2 pr-3">
                        {p.id === policyId && trained ? (
                          <span className="text-green-700">已训练</span>
                        ) : p.id === policyId && training ? (
                          <span className="text-amber-600">训练中</span>
                        ) : (
                          <span className="text-gray-400">未训练</span>
                        )}
                      </td>
                      <td className="py-2 text-gray-500">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'monitor' && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4 text-teal-600" />
              {curve
                ? `当前策略 ${policy.name} · ${curve.length} episodes`
                : '尚未有训练曲线，请先在「策略网络训练与管理」启动训练'}
            </div>

            {latest && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '最新累计奖励', value: String(latest.reward) },
                  { label: '最新成功率', value: `${(latest.success * 100).toFixed(1)}%` },
                  { label: 'episodes', value: String(latest.episode) },
                  { label: '策略', value: policy.name },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <div className="text-[10px] text-gray-400">{c.label}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5">{c.value}</div>
                  </div>
                ))}
              </div>
            )}

            {!curve && (
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center text-sm text-gray-400">
                训练完成后将在此展示累计奖励与成功率曲线
              </div>
            )}

            {curve && (
              <div className="grid grid-cols-1 gap-4">
                <LineChart
                  points={curve}
                  valueKey="reward"
                  color="#0d9488"
                  yLabel="累计奖励 (Cumulative Reward)"
                  formatY={(v) => v.toFixed(1)}
                />
                <LineChart
                  points={curve}
                  valueKey="success"
                  color="#4f46e5"
                  yLabel="成功率 (Success Rate)"
                  formatY={(v) => `${(v * 100).toFixed(0)}%`}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
