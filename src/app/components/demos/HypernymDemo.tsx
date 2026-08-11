import React, { useState, useRef } from 'react';
import { Play, Plus, Check, X, Search } from 'lucide-react';

type JobStatus = 'queued' | 'running' | 'done' | 'failed';

interface PredJob {
  id: string; name: string; conceptCount: number; modelId: string;
  threshold: number; status: JobStatus; progress: number;
  totalPairs: number; donePairs: number; createdAt: string;
  resultCount?: number; filteredCount?: number;
}

interface HyponymPair {
  id: string; hyponym: string; hypernym: string; confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const AVAIL_MODELS = [
  { id: 'rgat-sci', name: 'RGAT-SciTech-v2', domain: '科技文献', f1: '95.2%' },
  { id: 'bert-relation', name: 'BERT-Relation v1.5', domain: '通用', f1: '88.6%' },
  { id: 'rgat-patent', name: 'RGAT-Patent-v1', domain: '专利文档', f1: '93.8%' },
];

const AVAIL_CONCEPT_SETS = [
  { id: 'cs1', name: '芯片领域术语表', count: 1240 },
  { id: 'cs2', name: '人工智能概念集', count: 860 },
  { id: 'cs3', name: '新能源技术词汇', count: 530 },
];

function genPairs(seed: number, threshold: number): HyponymPair[] {
  const pairs: [string, string][] = [
    ['卷积神经网络', '深度学习'], ['Transformer', '深度学习'], ['BERT', 'Transformer'],
    ['GPT', 'Transformer'], ['ResNet', '卷积神经网络'], ['目标检测', '计算机视觉'],
    ['图像分类', '计算机视觉'], ['语义分割', '计算机视觉'], ['情感分析', '自然语言处理'],
    ['机器翻译', '自然语言处理'], ['命名实体识别', '信息抽取'], ['关系抽取', '信息抽取'],
    ['知识图谱', '人工智能'], ['深度学习', '机器学习'], ['强化学习', '机器学习'],
    ['联邦学习', '机器学习'], ['迁移学习', '机器学习'], ['随机森林', '集成学习'],
    ['梯度提升', '集成学习'], ['支持向量机', '分类算法'],
  ];
  const rng = (i: number) => Math.abs(Math.sin(seed * 13 + i * 7)) * 0.35 + 0.62;
  return pairs.map((([hypo, hyper], i) => ({
    id: `p${seed}-${i}`,
    hyponym: hypo, hypernym: hyper,
    confidence: Math.min(0.99, rng(i)),
    status: 'pending' as const,
  }))).filter(p => p.confidence >= threshold);
}

export function HypernymDemo() {
  const [tab, setTab] = useState<'tasks' | 'results'>('tasks');

  // Task creation form
  const [selConceptSet, setSelConceptSet] = useState('cs1');
  const [selModel, setSelModel] = useState('rgat-sci');
  const [threshold, setThreshold] = useState(0.75);
  const [jobs, setJobs] = useState<PredJob[]>([
    { id: 'j0', name: '芯片术语·RGAT·0.8', conceptCount: 1240, modelId: 'rgat-sci', threshold: 0.80, status: 'done', progress: 100, totalPairs: 766080, donePairs: 766080, createdAt: '2026-07-29 14:30', resultCount: 1842, filteredCount: 984 },
  ]);
  const jobRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Results
  const [openJobId, setOpenJobId] = useState<string | null>('j0');
  const [resultThreshold, setResultThreshold] = useState(0.80);
  const [pairs, setPairs] = useState<HyponymPair[]>(() => genPairs(0, 0.80));
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const openJob = jobs.find(j => j.id === openJobId);

  const createJob = () => {
    const cs = AVAIL_CONCEPT_SETS.find(c => c.id === selConceptSet)!;
    const totalPairs = Math.floor(cs.count * (cs.count - 1) / 2);
    const jobId = `j${Date.now()}`;
    const newJob: PredJob = {
      id: jobId, name: `${cs.name.slice(0, 6)}·${AVAIL_MODELS.find(m => m.id === selModel)!.name.slice(0, 4)}·${threshold}`,
      conceptCount: cs.count, modelId: selModel, threshold, status: 'queued',
      progress: 0, totalPairs, donePairs: 0, createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
    };
    setJobs(prev => [newJob, ...prev]);
    // Animate progress
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'running' } : j));
      let done = 0;
      jobRef.current[jobId] = setInterval(() => {
        done += Math.random() * 8 + 3;
        const pct = Math.min(done, 100);
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, progress: pct, donePairs: Math.floor(totalPairs * pct / 100) } : j));
        if (pct >= 100) {
          clearInterval(jobRef.current[jobId]);
          const raw = Math.floor(totalPairs * threshold * 0.003);
          const filtered = Math.floor(raw * threshold);
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'done', progress: 100, donePairs: totalPairs, resultCount: raw, filteredCount: filtered } : j));
        }
      }, 300);
    }, 600);
  };

  const openResults = (job: PredJob) => {
    setOpenJobId(job.id);
    setResultThreshold(job.threshold);
    setPairs(genPairs(job.id.length, job.threshold));
    setTab('results');
  };

  const filteredPairs = pairs
    .filter(p => p.confidence >= resultThreshold)
    .filter(p => reviewFilter === 'all' || p.status === reviewFilter)
    .filter(p => !search || p.hyponym.includes(search) || p.hypernym.includes(search))
    .sort((a, b) => b.confidence - a.confidence);

  const setStatus = (id: string, s: HyponymPair['status']) =>
    setPairs(prev => prev.map(p => p.id === id ? { ...p, status: s } : p));

  const aboveThreshold = pairs.filter(p => p.confidence >= resultThreshold).length;

  const STATUS_STYLE: Record<JobStatus, string> = {
    queued: 'bg-gray-100 text-gray-500',
    running: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-600',
  };
  const STATUS_LABEL: Record<JobStatus, string> = { queued: '排队中', running: '运行中', done: '已完成', failed: '失败' };

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([['tasks', '批量预测任务'], ['results', '预测结果与过滤']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${tab === k ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Tasks tab ── */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          {/* Create form */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">创建批量预测任务</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">目标概念集</label>
                  <select value={selConceptSet} onChange={e => setSelConceptSet(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
                    {AVAIL_CONCEPT_SETS.map(c => (
                      <option key={c.id} value={c.id}>{c.name}（{c.count} 个概念）</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">关系分类模型</label>
                  <select value={selModel} onChange={e => setSelModel(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
                    {AVAIL_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}（{m.domain} · F1 {m.f1}）</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 flex justify-between">
                    <span>置信度阈值</span>
                    <span className="font-semibold text-blue-600">{threshold.toFixed(2)}</span>
                  </label>
                  <input type="range" min={0.5} max={0.95} step={0.05} value={threshold}
                    onChange={e => setThreshold(parseFloat(e.target.value))}
                    className="w-full accent-blue-600" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>宽松 0.5</span><span>严格 0.95</span></div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                  {(() => {
                    const cs = AVAIL_CONCEPT_SETS.find(c => c.id === selConceptSet)!;
                    const totalPairsCount = Math.floor(cs.count * (cs.count - 1) / 2);
                    return <>概念对总数 <strong>{totalPairsCount.toLocaleString()}</strong>，预计过滤后保留 <strong>~{Math.floor(totalPairsCount * threshold * 0.003)}</strong> 条</>;
                  })()}
                </div>
                <button onClick={createJob}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl transition-colors">
                  <Play className="w-4 h-4" />提交批量预测任务
                </button>
              </div>
            </div>
          </div>

          {/* Job list */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">任务列表</span>
              <span className="text-xs text-gray-400">{jobs.length} 个任务</span>
            </div>
            <div className="divide-y divide-gray-100">
              {jobs.map(job => (
                <div key={job.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">{job.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLE[job.status]}`}>
                          {STATUS_LABEL[job.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span>{job.conceptCount.toLocaleString()} 概念</span>
                        <span>{job.totalPairs.toLocaleString()} 概念对</span>
                        <span>阈值 {job.threshold}</span>
                        <span>{job.createdAt}</span>
                      </div>
                      {job.status === 'running' && (
                        <div className="mt-1.5">
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }} />
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {job.donePairs.toLocaleString()} / {job.totalPairs.toLocaleString()} 对 · {Math.floor(job.progress)}%
                          </div>
                        </div>
                      )}
                      {job.status === 'done' && (
                        <div className="text-[11px] text-green-700 mt-0.5">
                          原始预测 {job.resultCount?.toLocaleString()} 条 → 阈值过滤后 <strong>{job.filteredCount?.toLocaleString()}</strong> 条
                        </div>
                      )}
                    </div>
                    {job.status === 'done' && (
                      <button onClick={() => openResults(job)}
                        className="text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0">
                        查看结果
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Results tab ── */}
      {tab === 'results' && (
        <div className="space-y-4">
          {/* Threshold filter panel */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-56">
                <span className="text-xs text-gray-600 whitespace-nowrap">置信度阈值</span>
                <input type="range" min={0.5} max={0.95} step={0.05} value={resultThreshold}
                  onChange={e => setResultThreshold(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-600" />
                <span className="text-sm font-bold text-blue-600 w-10 text-right">{resultThreshold.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>全部 <strong className="text-gray-800">{pairs.length}</strong> 条</span>
                <span className="text-blue-600">≥阈值 <strong>{aboveThreshold}</strong> 条</span>
                <span className="text-red-500">过滤掉 <strong>{pairs.length - aboveThreshold}</strong> 条</span>
              </div>
              {/* Confidence distribution mini bar */}
              <div className="flex items-end gap-0.5 h-8">
                {[0.5, 0.6, 0.7, 0.8, 0.9].map(band => {
                  const cnt = pairs.filter(p => p.confidence >= band && p.confidence < band + 0.1).length;
                  const max = pairs.length / 4;
                  const ht = Math.max(4, Math.round((cnt / max) * 28));
                  const active = band >= resultThreshold;
                  return (
                    <div key={band} title={`${band.toFixed(1)}-${(band + 0.1).toFixed(1)}: ${cnt}条`}
                      style={{ height: ht }}
                      className={`w-5 rounded-sm transition-colors ${active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-3 py-1.5 flex-1 min-w-48">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索上位词或下位词…"
                className="text-sm flex-1 focus:outline-none bg-transparent" />
            </div>
            <div className="flex p-0.5 bg-gray-100 rounded-lg">
              {([['all', '全部'], ['pending', '待审核'], ['accepted', '已接受'], ['rejected', '已拒绝']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setReviewFilter(k)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${reviewFilter === k ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Results table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">下位词（Hyponym）</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-3 py-3 w-6">→</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">上位词（Hypernym）</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-36">置信度</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-20">状态</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPairs.map(p => {
                  const pct = p.confidence * 100;
                  const barColor = p.confidence >= 0.9 ? 'bg-green-400' : p.confidence >= 0.75 ? 'bg-blue-400' : 'bg-amber-400';
                  const statusStyle = { pending: 'bg-amber-100 text-amber-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600' }[p.status];
                  const statusLabel = { pending: '待审核', accepted: '已接受', rejected: '已拒绝' }[p.status];
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.status === 'rejected' ? 'opacity-45' : ''}`}>
                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium text-gray-900 bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">{p.hyponym}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">上位于</td>
                      <td className="px-4 py-2.5">
                        <span className="text-sm text-gray-700 bg-purple-50 text-purple-800 px-2 py-0.5 rounded">{p.hypernym}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-600 font-medium">{(p.confidence).toFixed(3)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusStyle}`}>{statusLabel}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {p.status === 'pending' ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setStatus(p.id, 'accepted')} title="接受" className="p-1 text-gray-400 hover:text-green-500 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setStatus(p.id, 'rejected')} title="拒绝" className="p-1 text-gray-400 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setStatus(p.id, 'pending')} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">撤销</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredPairs.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">暂无匹配结果</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
