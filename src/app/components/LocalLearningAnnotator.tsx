import { useState, useEffect } from 'react';
import { Upload, Play, FileText, CheckCircle2, Sparkles, Code2, ListFilter } from 'lucide-react';

export type LocalLearningTab = 'local' | 'event-api' | 'optimize-api';

const SAMPLE_ANNOTATION_DOCS = [
  { id: 'ann-1', name: '事件标注种子样本_20条.jsonl' },
  { id: 'ann-2', name: '产品发布事件局部标注集.jsonl' },
  { id: 'ann-3', name: '投融资事件少样本标注.jsonl' },
];

const SAMPLE_EVENT_TEXTS = [
  '苹果公司于2024年3月在北京发布了新款芯片，该芯片由工程师团队历时三年研发完成。',
  '国家重点实验室联合高校于上月在上海举办了人工智能技术研讨会，来自全国的专家参与了讨论。',
  '该公司完成A轮融资后，团队规模迅速扩张，并于同年6月正式发布首款产品。',
];

const UNLABELED_CORPUS_SAMPLE = [
  '研究人员在实验室中成功合成了一种新型催化剂，该成果于本周在《自然》杂志上发表。',
  '政府宣布将在未来五年内投资建设新能源基础设施，推动碳中和目标的实现。',
  '华为技术有限公司申请了一项关于图神经网络加速的发明专利。',
  '会议定于下周三下午在上海举行，届时将发布年度技术白皮书。',
  '患者于1月5日出现发热症状，随后于1月7日进行血常规检查并收住院治疗。',
  '系统在凌晨2点检测到温度传感器异常，安全阀自动开启，生产线随之停机。',
  '该论文提出了一种基于注意力机制的关系抽取方法，在公开数据集上取得新的SOTA。',
  '董事会批准了与清华大学的联合实验室建设计划，首期投入5000万元。',
].join('\n');

function buildEventApiJson(text: string) {
  const isFinance = text.includes('融资');
  const isSeminar = text.includes('研讨会');
  const events = isFinance
    ? [
        {
          event_type: '融资完成',
          trigger: { text: '完成', start: text.indexOf('完成'), end: text.indexOf('完成') + 2 },
          arguments: [
            { role: 'Agent', text: '该公司' },
            { role: 'Patient', text: 'A轮融资' },
          ],
          confidence: 0.88,
        },
        {
          event_type: '产品发布',
          trigger: { text: '发布', start: text.indexOf('发布'), end: text.indexOf('发布') + 2 },
          arguments: [
            { role: 'Patient', text: '首款产品' },
            { role: 'Time', text: '同年6月' },
          ],
          confidence: 0.84,
        },
      ]
    : isSeminar
      ? [
          {
            event_type: '会议举办',
            trigger: { text: '举办', start: text.indexOf('举办'), end: text.indexOf('举办') + 2 },
            arguments: [
              { role: 'Agent', text: '国家重点实验室' },
              { role: 'Patient', text: '人工智能技术研讨会' },
              { role: 'Time', text: '上月' },
              { role: 'Location', text: '上海' },
            ],
            confidence: 0.91,
          },
        ]
      : [
          {
            event_type: '产品发布',
            trigger: { text: '发布', start: text.indexOf('发布'), end: text.indexOf('发布') + 2 },
            arguments: [
              { role: 'Agent', text: '苹果公司' },
              { role: 'Patient', text: '新款芯片' },
              { role: 'Time', text: '2024年3月' },
              { role: 'Location', text: '北京' },
            ],
            confidence: 0.86,
          },
          {
            event_type: '研发活动',
            trigger: { text: '研发', start: text.indexOf('研发'), end: text.indexOf('研发') + 2 },
            arguments: [
              { role: 'Agent', text: '工程师团队' },
              { role: 'Patient', text: '芯片' },
              { role: 'Time', text: '三年' },
            ],
            confidence: 0.79,
          },
        ];

  return {
    status: 'ok',
    request_id: `evt_${Date.now()}`,
    mode: 'api',
    text,
    event_count: events.length,
    latency_ms: 42 + Math.floor(Math.random() * 40),
    events,
  };
}

function buildOptimizeApiJson(corpus: string) {
  const lines = corpus.split('\n').map((s) => s.trim()).filter(Boolean);
  const scored = lines.map((text, i) => ({
    sentence_id: `s${String(i + 1).padStart(3, '0')}`,
    text,
    selection_score: Number((0.92 - i * 0.07 + Math.random() * 0.03).toFixed(3)),
    uncertainty: Number((0.35 + (i % 4) * 0.08).toFixed(3)),
    entity_density: Number((0.4 + (i % 3) * 0.15).toFixed(2)),
    reason: i % 3 === 0 ? '高不确定度 + 事件线索密集' : i % 3 === 1 ? '实体密度高，标注收益大' : '多样性采样补全覆盖',
  }));
  scored.sort((a, b) => b.selection_score - a.selection_score);
  const top = scored.slice(0, Math.min(5, scored.length));
  return {
    status: 'ok',
    request_id: `opt_${Date.now()}`,
    endpoint: '/api/v1/annotation/optimize',
    unlabeled_count: lines.length,
    suggested_count: top.length,
    latency_ms: 55 + Math.floor(Math.random() * 30),
    suggested_sentences: top,
  };
}

const MOCK_LOCAL_RESULT = `事件1
  类型：产品发布
  触发词：发布
  论元：
    - 施事(Agent)：苹果公司
    - 受事(Patient)：新款芯片
    - 时间(Time)：2024年3月
    - 地点(Location)：北京
  置信度：0.86

事件2
  类型：研发活动
  触发词：研发
  论元：
    - 施事(Agent)：工程师团队
    - 受事(Patient)：芯片
    - 时间(Time)：三年
  置信度：0.79

标注器状态：局部学习自举完成（种子样本 20 条）
模式：local（少样本局部学习）`;

function LocalAnnotatorPanel() {
  const [annDoc, setAnnDoc] = useState(SAMPLE_ANNOTATION_DOCS[0]);
  const [uploadAnnName, setUploadAnnName] = useState<string | null>(null);
  const [eventText, setEventText] = useState(SAMPLE_EVENT_TEXTS[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const annDisplayName = uploadAnnName ?? annDoc.name;

  const runAnnotate = () => {
    if (!annDisplayName || !eventText.trim()) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      const adapted = eventText.includes('融资')
        ? `事件1
  类型：融资完成
  触发词：完成
  论元：
    - 施事(Agent)：该公司
    - 受事(Patient)：A轮融资
  置信度：0.88

事件2
  类型：产品发布
  触发词：发布
  论元：
    - 受事(Patient)：首款产品
    - 时间(Time)：同年6月
  置信度：0.84

标注器状态：局部学习自举完成（种子样本来自「${annDisplayName}」）
模式：local（少样本局部学习）`
        : eventText.includes('研讨会')
          ? `事件1
  类型：会议举办
  触发词：举办
  论元：
    - 施事(Agent)：国家重点实验室
    - 受事(Patient)：人工智能技术研讨会
    - 时间(Time)：上月
    - 地点(Location)：上海
  置信度：0.91

事件2
  类型：参与活动
  触发词：参与
  论元：
    - 施事(Agent)：专家
    - 受事(Patient)：讨论
  置信度：0.77

标注器状态：局部学习自举完成（种子样本来自「${annDisplayName}」）
模式：local（少样本局部学习）`
          : MOCK_LOCAL_RESULT.replace('局部学习自举完成（种子样本 20 条）', `局部学习自举完成（种子样本来自「${annDisplayName}」）`);
      setResult(adapted);
      setRunning(false);
    }, 1400);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">上传标注数据文档</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-6 py-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            <Upload className="w-7 h-7 text-gray-300" />
            <span className="text-sm text-gray-600">点击上传标注样本（JSONL / JSON / TXT）</span>
            <span className="text-xs text-gray-400">用于局部学习自举，建议 20~50 条</span>
            <input
              type="file"
              accept=".jsonl,.json,.txt,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setUploadAnnName(f.name); setResult(null); }
              }}
            />
          </label>
          {annDisplayName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="truncate">{annDisplayName}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SAMPLE_ANNOTATION_DOCS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => { setAnnDoc(d); setUploadAnnName(null); setResult(null); }}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  annDoc.id === d.id && !uploadAnnName
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">输入事件文档</label>
          <textarea
            value={eventText}
            onChange={(e) => { setEventText(e.target.value); setResult(null); }}
            rows={4}
            placeholder="粘贴待标注的事件相关文本…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SAMPLE_EVENT_TEXTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setEventText(t); setResult(null); }}
                className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {t.length > 20 ? `${t.slice(0, 20)}…` : t}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={runAnnotate}
          disabled={!annDisplayName || !eventText.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '局部学习标注中…' : '执行标注'}
        </button>
      </div>

      {result && (
        <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">事件标注结果</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-green-700 bg-green-50/50 border-b border-green-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            标注完成 · 接口返回纯文本已填入下方结果框
          </div>
          <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed min-h-[160px]">{result}</pre>
        </div>
      )}
    </div>
  );
}

function EventRecognitionApiPanel() {
  const [text, setText] = useState(SAMPLE_EVENT_TEXTS[0]);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      setResponse(JSON.stringify(buildEventApiJson(text), null, 2));
      setRunning(false);
    }, 900);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/events/extract</code>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">请求体 · text</label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setResponse(''); }}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!text.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? '请求中…' : '调用事件识别 API'}
        </button>
      </div>
      {response && (
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">响应 · JSON</span>
            <span className="text-[10px] text-blue-400 ml-auto">200 OK</span>
          </div>
          <pre className="p-4 text-xs font-mono text-gray-800 whitespace-pre overflow-x-auto bg-gray-950 text-green-300 leading-relaxed max-h-[420px]">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

function AnnotationOptimizeApiPanel() {
  const [corpus, setCorpus] = useState(UNLABELED_CORPUS_SAMPLE);
  const [budget, setBudget] = useState(5);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');

  const run = () => {
    setRunning(true);
    setResponse('');
    setTimeout(() => {
      const body = buildOptimizeApiJson(corpus);
      body.suggested_count = Math.min(budget, body.suggested_sentences.length);
      body.suggested_sentences = body.suggested_sentences.slice(0, budget);
      setResponse(JSON.stringify(body, null, 2));
      setRunning(false);
    }, 1000);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/annotation/optimize</code>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">请求体 · 未标注句子（每行一句）</label>
          <textarea
            value={corpus}
            onChange={(e) => { setCorpus(e.target.value); setResponse(''); }}
            rows={8}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none focus:border-blue-400 resize-none bg-gray-50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">建议优先标注条数 budget = {budget}</label>
          <input
            type="range"
            min={1}
            max={8}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!corpus.trim() || running}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {running ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ListFilter className="w-4 h-4" />}
          {running ? '筛选中…' : '调用标注优化 API'}
        </button>
      </div>
      {response && (
        <div className="bg-white border border-violet-200 rounded-xl overflow-hidden">
          <div className="bg-violet-50 px-4 py-2.5 border-b border-violet-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-800">响应 · 建议优先标注句子列表（JSON）</span>
            <span className="text-[10px] text-violet-400 ml-auto">200 OK</span>
          </div>
          <pre className="p-4 text-xs font-mono whitespace-pre overflow-x-auto bg-gray-950 text-green-300 leading-relaxed max-h-[420px]">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * 审计目录专用：局部学习标注器 + 事件识别API + 标注优化API
 */
export default function LocalLearningAnnotator({ initialTab = 'local' }: { initialTab?: LocalLearningTab }) {
  const [tab, setTab] = useState<LocalLearningTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const title =
    tab === 'event-api' ? '事件识别 API'
      : tab === 'optimize-api' ? '标注优化 API'
        : '局部学习标注器';
  const desc =
    tab === 'event-api' ? '接收文本输入，返回结构化事件抽取结果（JSON）'
      : tab === 'optimize-api' ? '接收未标注数据，返回句子选择器建议优先标注的句子列表'
        : '上传少量标注数据，对事件文档进行局部学习标注';

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">{title}</h1>
          <p className="text-sm text-gray-500">{desc}</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
        {([
          { id: 'local' as const, label: '局部学习标注器' },
          { id: 'event-api' as const, label: '事件识别 API' },
          { id: 'optimize-api' as const, label: '标注优化 API' },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'local' && <LocalAnnotatorPanel />}
      {tab === 'event-api' && <EventRecognitionApiPanel />}
      {tab === 'optimize-api' && <AnnotationOptimizeApiPanel />}
    </div>
  );
}
