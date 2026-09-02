import { useState } from 'react';
import { Play, BookOpen, Link2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const MODULES_SAMPLE = JSON.stringify(
  [
    { id: 'M3', name: '关系感知注意力模块', keywords: ['图注意力', 'GAT', '异构图编码'] },
    { id: 'M4', name: '三元组解码输出模块', keywords: ['知识抽取', '三元组解码', '关系分类'] },
    { id: 'M5', name: '负采样与训练策略模块', keywords: ['负采样', '长尾关系', '类型约束'] },
  ],
  null,
  2,
);

const KEYWORDS_SAMPLE = '图注意力网络, 知识图谱补全, 稀疏关系, 链接预测';

interface LiteratureMatch {
  id: string;
  title: string;
  authors: string;
  year: number;
  matchType: '理论模型' | '实验数据' | '方法框架';
  matchedModule: string;
  matchedKeywords: string[];
  score: number;
  evidence: string;
  conversionHint: string;
}

const MOCK_MATCHES: LiteratureMatch[] = [
  {
    id: 'lit-001',
    title: 'Graph Attention Networks',
    authors: 'Veličković et al.',
    year: 2018,
    matchType: '理论模型',
    matchedModule: 'M3 · 关系感知注意力模块',
    matchedKeywords: ['图注意力', 'GAT'],
    score: 0.94,
    evidence: '提出 masked self-attention 聚合邻居特征，与专利 M3 多头关系感知注意力结构一致',
    conversionHint: '基础研究 → 专利 M3 可直接引用 GAT 作为图编码器替代方案',
  },
  {
    id: 'lit-002',
    title: 'Modeling Relational Data with Graph Convolutional Networks',
    authors: 'Schlichtkrull et al.',
    year: 2018,
    matchType: '理论模型',
    matchedModule: 'M3 · 关系感知注意力模块',
    matchedKeywords: ['异构图编码', '关系感知'],
    score: 0.89,
    evidence: 'R-GCN 对异构关系类型分别建模，支撑专利异构图构建与关系感知聚合',
    conversionHint: '理论层 R-GCN → 工程层可映射为 M2+M3 的组合实现路径',
  },
  {
    id: 'lit-003',
    title: 'OpenKG: A Benchmark for Knowledge Graph Completion',
    authors: 'Wang et al.',
    year: 2019,
    matchType: '实验数据',
    matchedModule: 'M5 · 负采样与训练策略模块',
    matchedKeywords: ['链接预测', '长尾关系'],
    score: 0.82,
    evidence: '提供标准链接预测评测集与长尾关系分布统计，可用于验证 M5 负采样策略',
    conversionHint: '实验数据可支撑专利方案在链接预测任务上的效果验证，揭示转化瓶颈在稀疏关系召回',
  },
  {
    id: 'lit-004',
    title: 'Joint Learning of Entity and Relation Extraction with Self-attention',
    authors: 'Wei et al.',
    year: 2020,
    matchType: '方法框架',
    matchedModule: 'M4 · 三元组解码输出模块',
    matchedKeywords: ['知识抽取', '三元组解码'],
    score: 0.86,
    evidence: '联合抽取框架中的关系分类头与专利 M4 三元组解码逻辑高度对应',
    conversionHint: '文献联合抽取范式 → 专利 M4 可借鉴其解码层设计，缩短基础研究到工程落地距离',
  },
];

/**
 * 审计目录专用：专利-文献自动匹配
 */
export default function PatentLiteratureMatch() {
  const [modulesJson, setModulesJson] = useState(MODULES_SAMPLE);
  const [keywords, setKeywords] = useState(KEYWORDS_SAMPLE);
  const [topK, setTopK] = useState(10);
  const [running, setRunning] = useState(false);
  const [matches, setMatches] = useState<LiteratureMatch[] | null>(null);
  const [bottleneck, setBottleneck] = useState<string | null>(null);

  const runMatch = () => {
    setRunning(true);
    setMatches(null);
    setBottleneck(null);
    setTimeout(() => {
      setMatches(MOCK_MATCHES.slice(0, Math.min(topK, MOCK_MATCHES.length)));
      setBottleneck(
        '转化瓶颈：M5 负采样策略缺乏针对工业级长尾关系的公开基准实验数据；建议优先补充链接预测评测集上的对比实验以验证「基础研究 → 专利方案」闭环。',
      );
      setRunning(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">专利-文献自动匹配</h1>
          <p className="text-sm text-gray-500">
            基于功能模块与技术关键词，在学术文献中自动匹配理论模型与实验数据，揭示「基础研究-技术开发」转化路径
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/cross-domain/patent-literature:match</code>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">
            功能模块（来自模块化拆解结果）
          </label>
          <textarea
            value={modulesJson}
            onChange={(e) => setModulesJson(e.target.value)}
            rows={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y"
          />
        </div>

        <div className="grid sm:grid-cols-[1fr_120px] gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">补充技术关键词</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="逗号分隔，如：图神经网络, 知识抽取"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Top-K</label>
            <input
              type="number"
              min={1}
              max={50}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={runMatch}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '匹配中…' : '执行专利-文献匹配'}
        </button>
      </div>

      {matches && (
        <div className="max-w-4xl space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            匹配完成 · {matches.length} 篇相关文献
          </div>

          {bottleneck && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">转化路径与瓶颈分析</div>
                <p className="text-xs leading-relaxed opacity-90">{bottleneck}</p>
              </div>
            </div>
          )}

          <ul className="space-y-3">
            {matches.map((m) => (
              <li key={m.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-start gap-3">
                  <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{m.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {m.authors} · {m.year}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        m.matchType === '理论模型'
                          ? 'bg-violet-100 text-violet-700'
                          : m.matchType === '实验数据'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {m.matchType}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">匹配度 {(m.score * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="px-4 py-3 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Link2 className="w-3.5 h-3.5" />
                    关联模块：{m.matchedModule}
                  </div>
                  <div className="text-gray-500">
                    命中关键词：{m.matchedKeywords.join('、')}
                  </div>
                  <p className="text-gray-700">{m.evidence}</p>
                  <p className="text-blue-700 bg-blue-50 rounded-lg px-3 py-2">{m.conversionHint}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
