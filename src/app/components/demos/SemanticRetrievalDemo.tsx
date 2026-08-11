import { useState, useRef, useEffect } from 'react';
import { Search, Star, Activity, Copy, CheckCircle, Zap, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

// ── demo data ────────────────────────────────────────────────────────────────

const ENTITY_LIST = [
  { id: 'tsinghua', label: '清华大学', type: 'org' },
  { id: 'pku', label: '北京大学', type: 'org' },
  { id: 'ustc', label: '中科大', type: 'org' },
  { id: 'zhangming', label: '张明', type: 'person' },
  { id: 'lihua', label: '李华', type: 'person' },
  { id: 'ai', label: '人工智能', type: 'concept' },
  { id: 'kg', label: '知识图谱', type: 'concept' },
  { id: 'nlp', label: '自然语言处理', type: 'concept' },
  { id: 'ml', label: '机器学习', type: 'concept' },
  { id: 'ieee_tkde', label: 'IEEE TKDE', type: 'venue' },
  { id: 'acl', label: 'ACL', type: 'venue' },
  { id: 'transe', label: 'TransE', type: 'concept' },
  { id: 'bert', label: 'BERT', type: 'concept' },
];

const RETRIEVAL_RESULTS: Record<string, { id: string; label: string; type: string; score: number; reason: string }[]> = {
  tsinghua: [
    { id: 'pku', label: '北京大学', type: 'org', score: 0.912, reason: '同类顶尖学府，共同关联大量研究者与概念' },
    { id: 'ustc', label: '中科大', type: 'org', score: 0.867, reason: '高校机构类型相同，研究领域高度重叠' },
    { id: 'zhangming', label: '张明', type: 'person', score: 0.841, reason: '直接关联：就职于清华大学' },
    { id: 'lihua', label: '李华', type: 'person', score: 0.823, reason: '直接关联：就职于清华大学' },
    { id: 'kg', label: '知识图谱', type: 'concept', score: 0.798, reason: '清华大学知识图谱相关研究成果丰富' },
    { id: 'ai', label: '人工智能', type: 'concept', score: 0.781, reason: '清华大学 AI 研究院直接关联' },
    { id: 'nlp', label: '自然语言处理', type: 'concept', score: 0.734, reason: '重要研究方向关联' },
    { id: 'ieee_tkde', label: 'IEEE TKDE', type: 'venue', score: 0.698, reason: '清华学者高频发表期刊' },
  ],
  kg: [
    { id: 'ai', label: '人工智能', type: 'concept', score: 0.943, reason: '知识图谱是 AI 的核心技术之一' },
    { id: 'nlp', label: '自然语言处理', type: 'concept', score: 0.921, reason: '实体识别、关系抽取与 KG 深度耦合' },
    { id: 'ml', label: '机器学习', type: 'concept', score: 0.887, reason: '图神经网络等 ML 方法用于 KG 补全' },
    { id: 'transe', label: 'TransE', type: 'concept', score: 0.856, reason: '经典知识图谱嵌入模型' },
    { id: 'tsinghua', label: '清华大学', type: 'org', score: 0.812, reason: '国内 KG 研究主要高校' },
    { id: 'zhangming', label: '张明', type: 'person', score: 0.789, reason: '知识图谱领域研究者' },
    { id: 'ieee_tkde', label: 'IEEE TKDE', type: 'venue', score: 0.761, reason: 'KG 论文主要发表期刊' },
    { id: 'bert', label: 'BERT', type: 'concept', score: 0.734, reason: '用于 KG 实体表示学习' },
  ],
  zhangming: [
    { id: 'lihua', label: '李华', type: 'person', score: 0.889, reason: '同机构同领域研究者' },
    { id: 'tsinghua', label: '清华大学', type: 'org', score: 0.867, reason: '就职机构' },
    { id: 'kg', label: '知识图谱', type: 'concept', score: 0.845, reason: '主要研究方向' },
    { id: 'ai', label: '人工智能', type: 'concept', score: 0.812, reason: '研究领域' },
    { id: 'ieee_tkde', label: 'IEEE TKDE', type: 'venue', score: 0.798, reason: '主要发表期刊' },
    { id: 'transe', label: 'TransE', type: 'concept', score: 0.754, reason: '研究涉及的嵌入方法' },
    { id: 'nlp', label: '自然语言处理', type: 'concept', score: 0.712, reason: '相关研究方向' },
    { id: 'pku', label: '北京大学', type: 'org', score: 0.668, reason: '合作机构' },
  ],
};

const USER_PROFILES = [
  {
    id: 'researcher',
    name: '知识图谱研究者',
    interests: ['知识图谱', '图嵌入', '关系推理'],
    history: ['知识图谱', 'TransE', 'BERT'],
    icon: '🔬',
  },
  {
    id: 'engineer',
    name: '算法工程师',
    interests: ['机器学习', '自然语言处理', '深度学习'],
    history: ['机器学习', 'BERT', '自然语言处理'],
    icon: '⚙️',
  },
  {
    id: 'student',
    name: '高校在读学生',
    interests: ['人工智能', '清华大学', '北京大学'],
    history: ['清华大学', '人工智能', '机器学习'],
    icon: '🎓',
  },
];

const RECOMMENDATION_RESULTS: Record<string, { id: string; label: string; type: string; score: number; reason: string }[]> = {
  researcher: [
    { id: 'transe', label: 'TransE', type: 'concept', score: 0.934, reason: '高度匹配：图嵌入核心方法' },
    { id: 'kg', label: '知识图谱', type: 'concept', score: 0.921, reason: '主兴趣方向直接匹配' },
    { id: 'ieee_tkde', label: 'IEEE TKDE', type: 'venue', score: 0.898, reason: '顶级 KG 论文发表期刊' },
    { id: 'zhangming', label: '张明', type: 'person', score: 0.876, reason: '知识图谱领域活跃研究者' },
    { id: 'tsinghua', label: '清华大学', type: 'org', score: 0.854, reason: 'KG 研究重镇' },
    { id: 'bert', label: 'BERT', type: 'concept', score: 0.831, reason: '与 KG 结合的预训练模型' },
  ],
  engineer: [
    { id: 'bert', label: 'BERT', type: 'concept', score: 0.951, reason: 'NLP 工程首选预训练模型' },
    { id: 'nlp', label: '自然语言处理', type: 'concept', score: 0.934, reason: '主兴趣方向直接匹配' },
    { id: 'ml', label: '机器学习', type: 'concept', score: 0.918, reason: '主兴趣方向' },
    { id: 'acl', label: 'ACL', type: 'venue', score: 0.871, reason: 'NLP 顶会，工程实践论文丰富' },
    { id: 'kg', label: '知识图谱', type: 'concept', score: 0.845, reason: 'ML 工程师常用知识管理工具' },
    { id: 'tsinghua', label: '清华大学', type: 'org', score: 0.798, reason: 'NLP 开源项目发源地' },
  ],
  student: [
    { id: 'ai', label: '人工智能', type: 'concept', score: 0.943, reason: '学生主兴趣方向' },
    { id: 'pku', label: '北京大学', type: 'org', score: 0.921, reason: '目标高校相似机构推荐' },
    { id: 'ustc', label: '中科大', type: 'org', score: 0.898, reason: '顶尖高校群体偏好' },
    { id: 'ml', label: '机器学习', type: 'concept', score: 0.876, reason: 'AI 学习必备基础知识' },
    { id: 'nlp', label: '自然语言处理', type: 'concept', score: 0.845, reason: 'AI 热门子领域' },
    { id: 'bert', label: 'BERT', type: 'concept', score: 0.812, reason: '入门 NLP 的标杆模型' },
  ],
};

// ── monitoring data ───────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  org: 'bg-blue-100 text-blue-700',
  person: 'bg-green-100 text-green-700',
  concept: 'bg-purple-100 text-purple-700',
  venue: 'bg-orange-100 text-orange-700',
};

// generate sparkline-style time series
function makeTimeSeries(base: number, variance: number, len = 24) {
  return Array.from({ length: len }, (_, i) => {
    const trend = Math.sin(i / 4) * variance * 0.5;
    const noise = (Math.random() - 0.5) * variance;
    return Math.max(0, Math.round(base + trend + noise));
  });
}

const MOCK_METRICS = {
  retrieval: {
    qps: makeTimeSeries(280, 60),
    latency: makeTimeSeries(42, 12),
    errors: makeTimeSeries(2, 3),
  },
  recommendation: {
    qps: makeTimeSeries(180, 40),
    latency: makeTimeSeries(68, 15),
    errors: makeTimeSeries(1, 2),
  },
};

function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  const w = 200; const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function SemanticRetrievalDemo() {
  const [activeSection, setActiveSection] = useState<'retrieval' | 'recommendation' | 'monitor'>('retrieval');

  // retrieval state
  const [sourceEntity, setSourceEntity] = useState('tsinghua');
  const [topN, setTopN] = useState(5);
  const [retrievalRunning, setRetrievalRunning] = useState(false);
  const [retrievalLatency, setRetrievalLatency] = useState<number | null>(null);
  const [retrievalCopied, setRetrievalCopied] = useState(false);

  // recommendation state
  const [profileId, setProfileId] = useState('researcher');
  const [recTopN, setRecTopN] = useState(5);
  const [recRunning, setRecRunning] = useState(false);
  const [recLatency, setRecLatency] = useState<number | null>(null);

  // monitor state
  const [monitorApi, setMonitorApi] = useState<'retrieval' | 'recommendation'>('retrieval');
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const entity = ENTITY_LIST.find(e => e.id === sourceEntity)!;
  const profile = USER_PROFILES.find(p => p.id === profileId)!;
  const retrievalResults = (RETRIEVAL_RESULTS[sourceEntity] || RETRIEVAL_RESULTS['tsinghua']).slice(0, topN);
  const recResults = RECOMMENDATION_RESULTS[profileId].slice(0, recTopN);

  const runRetrieval = () => {
    setRetrievalRunning(true); setRetrievalLatency(null);
    timerRef.current = setTimeout(() => {
      setRetrievalRunning(false);
      setRetrievalLatency(Math.round(Math.random() * 20 + 30));
    }, 600);
  };

  const runRecommendation = () => {
    setRecRunning(true); setRecLatency(null);
    timerRef.current = setTimeout(() => {
      setRecRunning(false);
      setRecLatency(Math.round(Math.random() * 25 + 50));
    }, 700);
  };

  const refreshMetrics = () => {
    setRefreshing(true);
    timerRef.current = setTimeout(() => {
      setMetrics({
        retrieval: { qps: makeTimeSeries(280, 60), latency: makeTimeSeries(42, 12), errors: makeTimeSeries(2, 3) },
        recommendation: { qps: makeTimeSeries(180, 40), latency: makeTimeSeries(68, 15), errors: makeTimeSeries(1, 2) },
      });
      setRefreshing(false);
    }, 800);
  };

  const SECTIONS = [
    { id: 'retrieval' as const, label: '① 语义检索接口' },
    { id: 'recommendation' as const, label: '② 推荐候选集接口' },
    { id: 'monitor' as const, label: '③ 调用监控' },
  ];

  const mon = metrics[monitorApi];
  const avgQps = Math.round(mon.qps.reduce((a, b) => a + b, 0) / mon.qps.length);
  const avgLatency = Math.round(mon.latency.reduce((a, b) => a + b, 0) / mon.latency.length);
  const p99Latency = Math.round(Math.max(...mon.latency) * 1.2);
  const totalErrors = mon.errors.reduce((a, b) => a + b, 0);
  const totalCalls = mon.qps.reduce((a, b) => a + b, 0) * 3600;

  const retrievalApiJson = JSON.stringify({ entity: sourceEntity, top_n: topN, include_score: true, include_reason: false }, null, 2);

  return (
    <div className="space-y-5">
      {/* Section nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeSection === s.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── ① Semantic Retrieval ── */}
      {activeSection === 'retrieval' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">语义检索服务接口</h3>
            <p className="text-sm text-gray-500 mt-0.5">输入一个实体，返回与之语义最相关的 Top-N 实体列表，支持按类型过滤与相关性解释</p>
          </div>

          {/* API card */}
          <div className="border-2 border-indigo-200 rounded-xl overflow-hidden">
            <div className="bg-indigo-50 border-b border-indigo-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded font-bold">POST</span>
                <code className="text-sm font-mono text-indigo-900">/api/semantic-retrieval/search</code>
              </div>
              <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />P99 &lt; 80ms
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">查询实体 (entity)</label>
                  <select value={sourceEntity} onChange={e => { setSourceEntity(e.target.value); setRetrievalLatency(null); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    {ENTITY_LIST.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">返回数量 (top_n)</label>
                  <select value={topN} onChange={e => setTopN(+e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    {[3, 5, 8, 10].map(k => <option key={k} value={k}>Top-{k}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={runRetrieval} disabled={retrievalRunning}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                    <Search className="w-4 h-4" />{retrievalRunning ? '检索中…' : '语义检索'}
                  </button>
                </div>
              </div>

              {/* Request preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-600">请求体预览</p>
                  <button onClick={() => { navigator.clipboard.writeText(retrievalApiJson); setRetrievalCopied(true); setTimeout(() => setRetrievalCopied(false), 1500); }}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                    {retrievalCopied ? <><CheckCircle className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">已复制</span></> : <><Copy className="w-3.5 h-3.5" />复制</>}
                  </button>
                </div>
                <pre className="bg-gray-950 text-green-400 rounded-xl px-4 py-3 text-xs font-mono">{retrievalApiJson}</pre>
              </div>

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600">
                    与 <span className="font-semibold text-gray-900">{entity.label}</span> 最相关的 {topN} 个实体
                  </p>
                  {retrievalLatency !== null && (
                    <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />200 OK · {retrievalLatency}ms
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {retrievalResults.map(({ id, label, type, score, reason }, rank) => (
                    <div key={id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="text-xs text-gray-400 font-mono w-4 text-center mt-0.5">{rank + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">{label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLOR[type]}`}>{type}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-mono font-semibold text-indigo-700">{score.toFixed(3)}</span>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${score * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint params */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">接口参数</div>
            <div className="divide-y divide-gray-100">
              {[
                { field: 'entity', type: 'string', req: true, desc: '查询实体 ID 或名称' },
                { field: 'top_n', type: 'integer', req: false, desc: '返回数量，默认 10，最大 100' },
                { field: 'filter_types', type: 'string[]', req: false, desc: '过滤实体类型，如 ["person", "org"]' },
                { field: 'min_score', type: 'float', req: false, desc: '分数阈值，低于此值不返回' },
                { field: 'include_reason', type: 'boolean', req: false, desc: '是否返回相关性解释，默认 false' },
                { field: 'algorithm', type: 'string', req: false, desc: '"ppr" | "cosine" | "auto"（默认）' },
              ].map(p => (
                <div key={p.field} className="flex items-center gap-4 px-4 py-2.5 text-sm">
                  <code className="font-mono text-indigo-700 w-28 flex-shrink-0">{p.field}</code>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono w-16 text-center">{p.type}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded w-10 text-center ${p.req ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>{p.req ? '必填' : '可选'}</span>
                  <span className="text-gray-600 flex-1">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ② Recommendation ── */}
      {activeSection === 'recommendation' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">推荐候选集生成接口</h3>
            <p className="text-sm text-gray-500 mt-0.5">输入用户画像（兴趣标签 + 历史行为），返回个性化推荐的候选实体集合</p>
          </div>

          {/* Profile selector */}
          <div className="grid grid-cols-3 gap-3">
            {USER_PROFILES.map(p => (
              <button key={p.id} onClick={() => { setProfileId(p.id); setRecLatency(null); }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${profileId === p.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                <div className="text-2xl mb-2">{p.icon}</div>
                <p className={`text-sm font-semibold mb-1.5 ${profileId === p.id ? 'text-indigo-900' : 'text-gray-900'}`}>{p.name}</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">兴趣标签</p>
                  <div className="flex flex-wrap gap-1">
                    {p.interests.map(i => (
                      <span key={i} className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{i}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* API call */}
          <div className="border-2 border-indigo-200 rounded-xl overflow-hidden">
            <div className="bg-indigo-50 border-b border-indigo-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded font-bold">POST</span>
                <code className="text-sm font-mono text-indigo-900">/api/semantic-retrieval/recommend</code>
              </div>
              <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />P99 &lt; 120ms
              </span>
            </div>
            <div className="p-5 space-y-4">
              <pre className="bg-gray-950 text-green-400 rounded-xl px-4 py-3 text-xs font-mono">
                {JSON.stringify({
                  user_profile: { interests: profile.interests, history: profile.history },
                  top_n: recTopN,
                  diversity: 0.3,
                }, null, 2)}
              </pre>

              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">返回数量</label>
                  <select value={recTopN} onChange={e => setRecTopN(+e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    {[3, 5, 8, 10].map(k => <option key={k} value={k}>Top-{k}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={runRecommendation} disabled={recRunning}
                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                    <Star className="w-4 h-4" />{recRunning ? '生成中…' : '生成推荐'}
                  </button>
                </div>
                {recLatency !== null && (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />200 OK · {recLatency}ms
                  </span>
                )}
              </div>

              {/* Results */}
              <div className="space-y-1.5">
                {recResults.map(({ id, label, type, score, reason }, rank) => (
                  <div key={id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex-shrink-0 mt-0.5">{rank + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLOR[type]}`}>{type}</span>
                      </div>
                      <p className="text-xs text-gray-500">{reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-mono font-semibold text-indigo-700">{score.toFixed(3)}</span>
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${score * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ③ Monitor ── */}
      {activeSection === 'monitor' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">应用调用监控仪表盘</h3>
              <p className="text-sm text-gray-500 mt-0.5">实时追踪接口调用频率、响应时间、错误率等关键性能指标</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                {(['retrieval', 'recommendation'] as const).map(api => (
                  <button key={api} onClick={() => setMonitorApi(api)}
                    className={`px-3 py-1.5 transition-colors ${monitorApi === api ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {api === 'retrieval' ? '语义检索' : '推荐候选'}
                  </button>
                ))}
              </div>
              <button onClick={refreshMetrics} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />刷新
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '平均 QPS', value: `${avgQps}`, sub: '请求/秒', icon: <Activity className="w-4 h-4" />, color: 'text-blue-700 bg-blue-50 border-blue-200' },
              { label: 'P50 延迟', value: `${avgLatency}ms`, sub: '中位响应时间', icon: <Zap className="w-4 h-4" />, color: 'text-green-700 bg-green-50 border-green-200' },
              { label: 'P99 延迟', value: `${p99Latency}ms`, sub: '长尾响应时间', icon: <TrendingUp className="w-4 h-4" />, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
              { label: '24h 错误', value: `${totalErrors}`, sub: `总调用 ${(totalCalls / 10000).toFixed(0)}万次`, icon: <AlertCircle className="w-4 h-4" />, color: totalErrors > 10 ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700 bg-gray-50 border-gray-200' },
            ].map(m => (
              <div key={m.label} className={`rounded-xl p-4 border ${m.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="opacity-60">{m.icon}</span>
                  <span className="text-xs opacity-60">{m.sub}</span>
                </div>
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs font-semibold mt-0.5 opacity-80">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: '调用频率（QPS）', data: mon.qps, color: '#6366f1', unit: 'req/s', max: Math.max(...mon.qps) },
              { title: '响应时间（ms）', data: mon.latency, color: '#22c55e', unit: 'ms', max: Math.max(...mon.latency) },
              { title: '错误次数（次/小时）', data: mon.errors, color: '#ef4444', unit: '次', max: Math.max(...mon.errors, 1) },
            ].map(chart => (
              <div key={chart.title} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-700">{chart.title}</p>
                  <span className="text-xs text-gray-400">近24小时</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">{chart.data[chart.data.length - 1]}</span>
                  <span className="text-xs text-gray-400">{chart.unit}</span>
                </div>
                <Sparkline data={chart.data} color={chart.color} height={48} />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0 {chart.unit}</span><span>{chart.max} {chart.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent call log */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">最近调用记录</span>
              <span className="text-xs text-gray-400">最近 10 条</span>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { time: '08:04:12.831', entity: '知识图谱', topN: 10, latency: 38, status: 200 },
                { time: '08:04:11.204', entity: '清华大学', topN: 5, latency: 42, status: 200 },
                { time: '08:04:09.776', entity: '人工智能', topN: 8, latency: 35, status: 200 },
                { time: '08:04:08.312', entity: '张明', topN: 5, latency: 71, status: 200 },
                { time: '08:04:06.891', entity: '机器学习', topN: 10, latency: 44, status: 200 },
                { time: '08:04:05.203', entity: 'BERT', topN: 5, latency: 39, status: 200 },
                { time: '08:04:03.897', entity: '北京大学', topN: 3, latency: 29, status: 200 },
                { time: '08:04:02.445', entity: '自然语言处理', topN: 10, latency: 58, status: 200 },
                { time: '08:04:00.913', entity: 'TransE', topN: 5, latency: 33, status: 200 },
                { time: '08:03:59.201', entity: 'ACL', topN: 8, latency: 112, status: 500 },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-2.5 text-xs hover:bg-gray-50">
                  <span className="font-mono text-gray-400 w-24 flex-shrink-0">{row.time}</span>
                  <span className="text-gray-700 flex-1 font-medium">{row.entity}</span>
                  <span className="text-gray-400">top_n={row.topN}</span>
                  <span className={`font-mono w-12 text-right ${row.latency > 80 ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>{row.latency}ms</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold w-10 text-center ${row.status === 200 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alert rules */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700">告警规则</div>
            <div className="divide-y divide-gray-100">
              {[
                { name: 'P99 延迟超阈值', condition: 'P99 > 200ms', window: '5分钟', severity: 'warning', active: false },
                { name: '错误率超阈值', condition: '错误率 > 1%', window: '1分钟', severity: 'critical', active: false },
                { name: 'QPS 突增', condition: 'QPS > 1000', window: '1分钟', severity: 'info', active: true },
                { name: '服务不可用', condition: '成功率 < 99%', window: '30秒', severity: 'critical', active: false },
              ].map(rule => {
                const colors = { warning: 'text-amber-600 bg-amber-50', critical: 'text-red-600 bg-red-50', info: 'text-blue-600 bg-blue-50' };
                return (
                  <div key={rule.name} className="flex items-center gap-4 px-4 py-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rule.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">条件：{rule.condition} · 窗口：{rule.window}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[rule.severity as keyof typeof colors]}`}>{rule.severity}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rule.active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>{rule.active ? '触发中' : '正常'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
