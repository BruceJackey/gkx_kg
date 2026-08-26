import { useEffect, useState } from 'react';
import { Play, GitCompare, Lightbulb, CheckCircle2 } from 'lucide-react';

export type UpperToolTab = 'analogy' | 'question';

const ANALOGY_ANSWERS = [
  {
    entity: 'Yann LeCun',
    score: 0.91,
    reason: '与 C（Yoshua Bengio）同属「深度学习奠基人」簇，且相对 A–B 的「人物–机构」结构映射到「人物–研究机构」',
    path: 'Geoffrey Hinton → 多伦多大学  ≈  Yoshua Bengio → MILA  ⇒  Yann LeCun → FAIR / NYU',
  },
  {
    entity: '纽约大学',
    score: 0.84,
    reason: '保持「研究者 ↔ 所属机构」关系类型一致，作为机构侧补全候选',
    path: 'Hinton–UofT 结构对齐 → LeCun–NYU',
  },
  {
    entity: '卷积神经网络',
    score: 0.72,
    reason: '弱类比：从「人物对机构」偏移到「人物对代表贡献」，供扩展探索',
    path: '贡献关系旁路召回',
  },
];

const QUESTION_RESULT = [
  {
    id: 'q1',
    gap: '长尾关系「CITES」在生物医学子图覆盖率仅 12%',
    question: '如何在标注稀疏的生物医学引用网络上，提升长尾 CITES 关系的链接预测召回？',
    value: '高',
    evidence: '子图密度热力 · 薄弱边类型 Top-3',
  },
  {
    id: 'q2',
    gap: '「材料–机制」槽位在高熵合金簇缺失率 41%',
    question: '高熵合金文献中，何种实验表征手段最常与「固溶强化」机制共现但尚未形成稳定三元组？',
    value: '高',
    evidence: '四元组抽取空槽统计',
  },
  {
    id: 'q3',
    gap: '实体「多模态预训练」缺少与下游任务的评估边',
    question: '多模态预训练实体与具体下游评测基准之间，是否存在可验证的性能迁移路径？',
    value: '中',
    evidence: '孤立概念簇 · 度数 < 2',
  },
  {
    id: 'q4',
    gap: '时序属性「pub_year」与「研究范式演进」边未对齐',
    question: '2018–2024 年间，图神经网络范式在论文图谱中的主题漂移是否可由缺失的「influenced_by」边解释？',
    value: '中',
    evidence: '时序切片对比 · 主题漂移指标',
  },
];

function AnalogyPanel() {
  const [a, setA] = useState('Geoffrey Hinton');
  const [b, setB] = useState('多伦多大学');
  const [c, setC] = useState('Yoshua Bengio');
  const [space, setSpace] = useState('kg:sci-paper-v3');
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  const run = () => {
    setRunning(true);
    setReady(false);
    setTimeout(() => {
      setReady(true);
      setRunning(false);
    }, 900);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          类比查询形式：<span className="font-medium text-gray-700">A 对于 B，相当于 C 对于 ？</span>
          。工具在图谱中检索保持关系结构相似的补全实体。
        </p>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            value={a}
            onChange={(e) => {
              setA(e.target.value);
              setReady(false);
            }}
            className="w-36 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            placeholder="A"
          />
          <span className="text-gray-400">对于</span>
          <input
            value={b}
            onChange={(e) => {
              setB(e.target.value);
              setReady(false);
            }}
            className="w-36 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            placeholder="B"
          />
          <span className="text-gray-400">，相当于</span>
          <input
            value={c}
            onChange={(e) => {
              setC(e.target.value);
              setReady(false);
            }}
            className="w-36 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            placeholder="C"
          />
          <span className="text-gray-400">对于</span>
          <span className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
            ？
          </span>
        </div>

        <div className="w-64">
          <label className="text-[11px] font-medium text-gray-500 mb-1 block">图谱空间</label>
          <input
            value={space}
            onChange={(e) => setSpace(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-400"
          />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!a.trim() || !b.trim() || !c.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          {running ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? '检索中…' : '执行类比搜索'}
        </button>
      </div>

      {ready && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-800">类比补全候选</span>
            <span className="text-[11px] text-gray-400 ml-auto">
              {a} : {b} :: {c} : ?
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {ANALOGY_ANSWERS.map((ans, i) => (
              <div key={ans.entity} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400">#{i + 1}</span>
                  <span className="text-sm font-semibold text-gray-900">{ans.entity}</span>
                  <span className="text-[11px] text-emerald-600 ml-auto">
                    {(ans.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{ans.reason}</p>
                <p className="text-[11px] font-mono text-gray-400">{ans.path}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionPanel() {
  const [domain, setDomain] = useState('科技论文知识图谱');
  const [focus, setFocus] = useState('长尾关系与空槽');
  const [maxQ, setMaxQ] = useState(4);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);

  const run = () => {
    setRunning(true);
    setReady(false);
    setTimeout(() => {
      setReady(true);
      setRunning(false);
    }, 1100);
  };

  const list = QUESTION_RESULT.slice(0, maxQ);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          扫描图谱中的知识空白与薄弱环节（低覆盖关系、空槽、孤立概念等），自动生成有研究价值的科研问题，便于选题与实验设计。
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1 block">目标图谱</label>
            <select
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setReady(false);
              }}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              <option>科技论文知识图谱</option>
              <option>生物医学知识图谱</option>
              <option>新能源产业图谱</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1 block">空白聚焦</label>
            <select
              value={focus}
              onChange={(e) => {
                setFocus(e.target.value);
                setReady(false);
              }}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              <option>长尾关系与空槽</option>
              <option>孤立概念簇</option>
              <option>时序对齐缺口</option>
            </select>
          </div>
        </div>

        <div className="w-40">
          <label className="text-[11px] font-medium text-gray-500 mb-1 block">生成数量</label>
          <input
            type="number"
            min={1}
            max={4}
            value={maxQ}
            onChange={(e) => {
              setMaxQ(Math.min(4, Math.max(1, Number(e.target.value) || 4)));
              setReady(false);
            }}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          {running ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? '分析图谱空白…' : '生成科研问题'}
        </button>
      </div>

      {ready && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-800">生成的科研问题</span>
            <span className="text-[11px] text-gray-400 ml-auto">
              {domain} · {focus}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {list.map((q) => (
              <div key={q.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-indigo-600">{q.id}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      q.value === '高'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    研究价值 {q.value}
                  </span>
                </div>
                <p className="text-sm text-gray-900 leading-snug">{q.question}</p>
                <p className="text-[11px] text-gray-500">
                  空白依据：{q.gap}
                </p>
                <p className="text-[10px] text-gray-400">证据来源：{q.evidence}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UpperIntelligentTools({
  initialTab = 'analogy',
}: {
  initialTab?: UpperToolTab;
}) {
  const [tab, setTab] = useState<UpperToolTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">上层智能应用工具</h1>
          <p className="text-sm text-gray-500">图谱类比搜索与科研问题生成，可在线调试</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
        {(
          [
            { id: 'analogy' as const, label: '图谱类比搜索工具', icon: GitCompare },
            { id: 'question' as const, label: '科研问题生成工具', icon: Lightbulb },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm transition-colors ${
                on ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-2">
        {tab === 'analogy' ? <AnalogyPanel /> : <QuestionPanel />}
      </div>
    </div>
  );
}
