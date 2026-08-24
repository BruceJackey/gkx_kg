import { useState, type ReactNode } from 'react';
import { Play, CheckCircle, Copy, Zap } from 'lucide-react';

export type CandidateTermDemoTab = 'statistical' | 'rule-based' | 'dedup-merge';

const SEED_TERMS = ['知识图谱', '深度学习', '自然语言处理', 'Transformer', '实体对齐'];

const STAT_RESULTS = [
  { term: '图神经网络', pmi: 4.82, cooc: 1284, score: 0.91 },
  { term: '知识表示学习', pmi: 4.55, cooc: 982, score: 0.88 },
  { term: '语义网络', pmi: 3.98, cooc: 756, score: 0.84 },
  { term: '链接预测', pmi: 3.72, cooc: 645, score: 0.81 },
  { term: '表示学习', pmi: 3.45, cooc: 1102, score: 0.79 },
];

const RULE_RESULTS = [
  { term: '深度神经网络', pattern: '形容词+名词', pos: 'a+n', score: 0.89 },
  { term: '预训练语言模型', pattern: '动词+名词', pos: 'v+n', score: 0.86 },
  { term: '多模态知识图谱', pattern: '名词+名词', pos: 'n+n', score: 0.84 },
  { term: '大规模语料库', pattern: '形容词+名词', pos: 'a+n', score: 0.82 },
  { term: '事件抽取模型', pattern: '名词+名词', pos: 'n+n', score: 0.80 },
];

const MERGE_INPUT = [
  { term: '知识图谱', source: 'statistical', variants: ['Knowledge Graph', 'KG'] },
  { term: '知识图谱构建', source: 'rule-based', variants: ['知识图谱 构建'] },
  { term: '图神经网络', source: 'statistical', variants: ['GNN', '图神经网路'] },
  { term: '深度学习模型', source: 'rule-based', variants: ['深度学习 模型'] },
];

const MERGE_OUTPUT = [
  { canonical: '知识图谱', merged: 3, synonyms: ['Knowledge Graph', 'KG'] },
  { canonical: '知识图谱构建', merged: 2, synonyms: ['知识图谱 构建'] },
  { canonical: '图神经网络', merged: 3, synonyms: ['GNN', '图神经网路'] },
  { canonical: '深度学习模型', merged: 2, synonyms: ['深度学习 模型'] },
];

const SECTIONS: { id: CandidateTermDemoTab; label: string }[] = [
  { id: 'statistical', label: '① 基于统计的扩展' },
  { id: 'rule-based', label: '② 基于规则的扩展' },
  { id: 'dedup-merge', label: '③ 候选术语去重与合并' },
];

function ApiCard({
  method,
  path,
  title,
  desc,
  requestJson,
  onRun,
  running,
  latency,
  children,
}: {
  method: string;
  path: string;
  title: string;
  desc: string;
  requestJson: string;
  onRun: () => void;
  running: boolean;
  latency: number | null;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border-2 border-emerald-200 rounded-xl overflow-hidden">
      <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded font-bold">{method}</span>
          <code className="text-sm font-mono text-emerald-900 truncate">{path}</code>
        </div>
        <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
          <Zap className="w-3 h-3" />P99 &lt; 120ms
        </span>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
        {children}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-gray-600">请求体预览</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(requestJson);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {copied ? <><CheckCircle className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">已复制</span></> : <><Copy className="w-3.5 h-3.5" />复制</>}
            </button>
          </div>
          <pre className="bg-gray-950 text-green-400 rounded-xl px-4 py-3 text-xs font-mono overflow-x-auto">{requestJson}</pre>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          {running ? '调用中…' : '测试接口'}
        </button>
        {latency !== null && (
          <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5" />200 OK · {latency}ms
          </div>
        )}
      </div>
    </div>
  );
}

export function CandidateTermGenerationDemo({ initialTab }: { initialTab?: CandidateTermDemoTab }) {
  const [activeSection, setActiveSection] = useState<CandidateTermDemoTab>(initialTab ?? 'statistical');
  const [windowSize, setWindowSize] = useState(5);
  const [pmiMin, setPmiMin] = useState(3.0);
  const [pattern, setPattern] = useState('a+n');
  const [mergeThreshold, setMergeThreshold] = useState(0.85);
  const [statRunning, setStatRunning] = useState(false);
  const [ruleRunning, setRuleRunning] = useState(false);
  const [mergeRunning, setMergeRunning] = useState(false);
  const [statLatency, setStatLatency] = useState<number | null>(null);
  const [ruleLatency, setRuleLatency] = useState<number | null>(null);
  const [mergeLatency, setMergeLatency] = useState<number | null>(null);
  const [statDone, setStatDone] = useState(false);
  const [ruleDone, setRuleDone] = useState(false);
  const [mergeDone, setMergeDone] = useState(false);

  const statJson = JSON.stringify({
    seed_terms: SEED_TERMS,
    corpus_id: 'corpus_tech_papers_2024',
    window_size: windowSize,
    pmi_min: pmiMin,
    min_freq: 10,
  }, null, 2);

  const ruleJson = JSON.stringify({
    seed_terms: SEED_TERMS.slice(0, 3),
    corpus_id: 'corpus_tech_papers_2024',
    pos_pattern: pattern,
    max_candidates: 50,
  }, null, 2);

  const mergeJson = JSON.stringify({
    candidates: [
      { term: '知识图谱', source: 'statistical', score: 0.91 },
      { term: 'Knowledge Graph', source: 'statistical', score: 0.88 },
      { term: '图神经网络', source: 'rule-based', score: 0.86 },
      { term: 'GNN', source: 'rule-based', score: 0.84 },
    ],
    merge_threshold: mergeThreshold,
    normalize: true,
  }, null, 2);

  const runStat = () => {
    setStatRunning(true);
    setStatDone(false);
    setStatLatency(null);
    setTimeout(() => {
      setStatRunning(false);
      setStatDone(true);
      setStatLatency(68 + Math.floor(Math.random() * 40));
    }, 900);
  };

  const runRule = () => {
    setRuleRunning(true);
    setRuleDone(false);
    setRuleLatency(null);
    setTimeout(() => {
      setRuleRunning(false);
      setRuleDone(true);
      setRuleLatency(72 + Math.floor(Math.random() * 35));
    }, 850);
  };

  const runMerge = () => {
    setMergeRunning(true);
    setMergeDone(false);
    setMergeLatency(null);
    setTimeout(() => {
      setMergeRunning(false);
      setMergeDone(true);
      setMergeLatency(55 + Math.floor(Math.random() * 30));
    }, 800);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'statistical' && (
        <div className="space-y-5">
          <ApiCard
            method="POST"
            path="/api/candidate-term/statistical-expand"
            title="基于统计的扩展"
            desc="利用词共现、互信息（PMI）等统计指标，发现与种子术语紧密相关的候选术语"
            requestJson={statJson}
            onRun={runStat}
            running={statRunning}
            latency={statLatency}
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">共现窗口 (window_size)</label>
                <select value={windowSize} onChange={e => { setWindowSize(+e.target.value); setStatDone(false); setStatLatency(null); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400">
                  {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} 词</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">PMI 下限 (pmi_min)</label>
                <input type="number" step={0.1} value={pmiMin}
                  onChange={e => { setPmiMin(+e.target.value); setStatDone(false); setStatLatency(null); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">种子术语</label>
                <div className="flex flex-wrap gap-1">
                  {SEED_TERMS.slice(0, 3).map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </ApiCard>
          {statDone && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700">响应结果 · candidates</div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">术语</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">PMI</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">共现频次</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">相关度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {STAT_RESULTS.map(r => (
                    <tr key={r.term}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.term}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.pmi.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{r.cooc}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-700">{r.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === 'rule-based' && (
        <div className="space-y-5">
          <ApiCard
            method="POST"
            path="/api/candidate-term/rule-expand"
            title="基于规则的扩展"
            desc="通过预定义或自定义词性模式（如形容词+名词）从语料中抽取复合术语候选"
            requestJson={ruleJson}
            onRun={runRule}
            running={ruleRunning}
            latency={ruleLatency}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">词性模式 (pos_pattern)</label>
                <select value={pattern} onChange={e => { setPattern(e.target.value); setRuleDone(false); setRuleLatency(null); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400">
                  <option value="a+n">形容词 + 名词 (a+n)</option>
                  <option value="n+n">名词 + 名词 (n+n)</option>
                  <option value="v+n">动词 + 名词 (v+n)</option>
                  <option value="a+n+n">形容词 + 名词 + 名词</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">模式说明</label>
                <p className="text-xs text-gray-500 leading-relaxed pt-2">
                  从分词与词性标注结果中匹配序列模式，抽取符合领域构词规律的复合术语。
                </p>
              </div>
            </div>
          </ApiCard>
          {ruleDone && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700">响应结果 · candidates</div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">术语</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">匹配模式</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">词性序列</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">置信度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {RULE_RESULTS.map(r => (
                    <tr key={r.term}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.term}</td>
                      <td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{r.pattern}</span></td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{r.pos}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-700">{r.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === 'dedup-merge' && (
        <div className="space-y-5">
          <ApiCard
            method="POST"
            path="/api/candidate-term/dedup-merge"
            title="候选术语去重与合并"
            desc="对不同来源的候选术语进行标准化与近义合并，生成唯一候选列表"
            requestJson={mergeJson}
            onRun={runMerge}
            running={mergeRunning}
            latency={mergeLatency}
          >
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">合并相似度阈值 (merge_threshold)</label>
              <input type="range" min={0.7} max={0.95} step={0.01} value={mergeThreshold}
                onChange={e => { setMergeThreshold(+e.target.value); setMergeDone(false); setMergeLatency(null); }}
                className="w-full" />
              <div className="text-xs text-gray-500 mt-1">当前阈值：{mergeThreshold.toFixed(2)}（编辑距离 + 语义向量双重比对）</div>
            </div>
          </ApiCard>
          {mergeDone && (
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 border-b border-amber-100">合并前 · 多源候选</div>
                <div className="divide-y divide-gray-100">
                  {MERGE_INPUT.map(r => (
                    <div key={r.term} className="px-4 py-2.5 text-sm">
                      <div className="font-medium text-gray-800">{r.term}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.source} · 变体 {r.variants.join('、')}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 border-b border-emerald-100">合并后 · 唯一列表</div>
                <div className="divide-y divide-gray-100">
                  {MERGE_OUTPUT.map(r => (
                    <div key={r.canonical} className="px-4 py-2.5 text-sm">
                      <div className="font-medium text-gray-800">{r.canonical}</div>
                      <div className="text-xs text-gray-400 mt-0.5">合并 {r.merged} 条 · 同义词 {r.synonyms.join('、')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
