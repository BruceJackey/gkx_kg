import React from 'react';
import { Play, Plus } from 'lucide-react';

const EVENT_SCHEMA_PRESETS = [
  {
    id: 'tech',
    label: '科技发布',
    eventTypes: [
      { type: '产品发布', roles: ['发布方', '产品名称', '发布时间', '发布地点'] },
      { type: '技术突破', roles: ['研究机构', '技术名称', '发布时间'] },
    ],
  },
  {
    id: 'org',
    label: '组织变动',
    eventTypes: [
      { type: '人员任命', roles: ['任命方', '被任命人', '职位', '时间'] },
      { type: '合并收购', roles: ['收购方', '被收购方', '金额', '时间'] },
    ],
  },
  {
    id: 'disaster',
    label: '突发事件',
    eventTypes: [
      { type: '自然灾害', roles: ['灾害类型', '地点', '时间', '伤亡情况'] },
      { type: '事故', roles: ['事故类型', '地点', '时间', '责任方'] },
    ],
  },
];

interface ExtractedEventResult { id: string; eventType: string; trigger: string; arguments: Record<string, string>; confidence: number; mode: string; }

const LOCAL_LEARNING_SAMPLES = [
  { text: '苹果公司昨日在旧金山正式发布了iPhone 16系列。', label: '产品发布' },
  { text: '华为于北京时间今日上午发布了鸿蒙OS 5.0系统。', label: '产品发布' },
  { text: '特斯拉宣布推出全新自动驾驶芯片FSD 4.0。', label: '产品发布' },
];

const DEMO_TEXTS = [
  '谷歌DeepMind团队于2024年5月在伦敦发布了新一代蛋白质结构预测模型AlphaFold 3，该成果标志着AI在生物医学领域取得重大突破。',
  '阿里巴巴集团宣布任命蔡崇信为新任董事局主席，接替即将卸任的张勇，该人事变动将于下月正式生效。',
  '国家气象局发布橙色预警，台风"杜苏芮"预计将于周五登陆福建沿海地区，风力可达12级以上。',
];

const MOCK_RESULTS: Record<string, ExtractedEventResult[]> = {
  '0': [
    { id: 'r1', eventType: '产品发布', trigger: '发布', arguments: { 发布方: 'DeepMind团队', 产品名称: 'AlphaFold 3', 发布时间: '2024年5月', 发布地点: '伦敦' }, confidence: 0.91, mode: 'full' },
    { id: 'r2', eventType: '技术突破', trigger: '突破', arguments: { 研究机构: 'DeepMind团队', 技术名称: 'AI生物医学', 发布时间: '2024年5月' }, confidence: 0.78, mode: 'local' },
  ],
  '1': [
    { id: 'r3', eventType: '人员任命', trigger: '任命', arguments: { 任命方: '阿里巴巴集团', 被任命人: '蔡崇信', 职位: '董事局主席', 时间: '下月' }, confidence: 0.94, mode: 'full' },
  ],
  '2': [
    { id: 'r4', eventType: '自然灾害', trigger: '登陆', arguments: { 灾害类型: '台风', 地点: '福建沿海地区', 时间: '周五' }, confidence: 0.87, mode: 'local' },
  ],
};

const MODE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  full: { label: '全监督', color: 'bg-blue-100 text-blue-700', desc: '大量标注数据训练' },
  local: { label: '局部学习', color: 'bg-amber-100 text-amber-700', desc: '20~50条种子样本' },
  zeroshot: { label: '零样本', color: 'bg-purple-100 text-purple-700', desc: '无需标注数据' },
};

export function EventRecognitionEngineDemo() {
  const [tab, setTab] = React.useState<'local' | 'extract' | 'schema'>('local');
  const [schemaPreset, setSchemaPreset] = React.useState('tech');
  const [mode, setMode] = React.useState<'full' | 'local' | 'zeroshot'>('local');
  const [selectedText, setSelectedText] = React.useState(0);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [results, setResults] = React.useState<ExtractedEventResult[] | null>(null);
  const [annotations, setAnnotations] = React.useState<{ text: string; label: string }[]>(LOCAL_LEARNING_SAMPLES);
  const [newAnnotationText, setNewAnnotationText] = React.useState('');
  const [newAnnotationLabel, setNewAnnotationLabel] = React.useState('产品发布');
  const [learnerTrained, setLearnerTrained] = React.useState(false);
  const [isTraining, setIsTraining] = React.useState(false);
  const [trainProgress, setTrainProgress] = React.useState(0);

  const preset = EVENT_SCHEMA_PRESETS.find(p => p.id === schemaPreset)!;

  const handleExtract = () => {
    setIsExtracting(true);
    setResults(null);
    setTimeout(() => {
      setResults(MOCK_RESULTS[String(selectedText)] || []);
      setIsExtracting(false);
    }, 1000);
  };

  const handleAddAnnotation = () => {
    if (!newAnnotationText.trim()) return;
    setAnnotations(prev => [...prev, { text: newAnnotationText.trim(), label: newAnnotationLabel }]);
    setNewAnnotationText('');
    setLearnerTrained(false);
  };

  const handleTrain = () => {
    setIsTraining(true);
    setTrainProgress(0);
    setLearnerTrained(false);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 5;
      setTrainProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(iv);
        setIsTraining(false);
        setLearnerTrained(true);
      }
    }, 150);
  };

  const confColor = (c: number) => c >= 0.88 ? 'text-green-700' : c >= 0.75 ? 'text-blue-700' : 'text-amber-700';

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {([
          ['local', '局部学习标注器'],
          ['extract', '事件识别演示'],
          ['schema', '事件模式配置'],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${tab === k ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Local Learning Annotator tab ── */}
      {tab === 'local' && (
        <div className="space-y-4">
          {/* Intro banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <span className="text-amber-500 text-base flex-shrink-0">⚡</span>
            <div>
              <span className="font-semibold">局部学习标注器</span>利用词性模板、依存路径和领域词典，仅需
              <strong> 20~50 </strong>条标注种子，即可自举构建初版事件标注器，无需大规模标注数据。
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left: annotation pool */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">标注种子样本</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{annotations.length} 条</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {annotations.map((a, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-start gap-2">
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5">{a.label}</span>
                    <span className="text-xs text-gray-700 leading-relaxed">{a.text}</span>
                  </div>
                ))}
              </div>
              {/* Add annotation */}
              <div className="border-t border-gray-200 p-3 space-y-2 bg-gray-50">
                <div className="text-xs font-medium text-gray-600">新增标注样本</div>
                <textarea
                  value={newAnnotationText}
                  onChange={e => setNewAnnotationText(e.target.value)}
                  placeholder="输入一条包含事件的句子…"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none h-16 focus:outline-none focus:border-blue-400"
                />
                <div className="flex gap-2">
                  <select value={newAnnotationLabel} onChange={e => setNewAnnotationLabel(e.target.value)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400">
                    {preset.eventTypes.map(et => <option key={et.type} value={et.type}>{et.type}</option>)}
                  </select>
                  <button onClick={handleAddAnnotation}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
                    <Plus className="w-3 h-3" />添加
                  </button>
                </div>
              </div>
            </div>

            {/* Right: training */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-800">局部学习配置</span>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: '特征类型', value: '词性模板 + 依存路径 + 词典匹配' },
                    { label: '分类器', value: '最大熵 (MaxEnt)' },
                    { label: '窗口大小', value: '±3 词' },
                    { label: '自举轮次', value: '3 轮' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-medium text-gray-800">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Train button + progress */}
              <button onClick={handleTrain} disabled={isTraining || annotations.length < 3}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm rounded-xl transition-colors">
                {isTraining ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />自举训练中…</> : <><Play className="w-3.5 h-3.5" />启动局部学习自举</>}
              </button>

              {(isTraining || learnerTrained) && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${learnerTrained ? 'bg-green-500' : 'bg-amber-400'}`}
                      style={{ width: `${trainProgress}%` }} />
                  </div>
                  {learnerTrained && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-green-700">✓ 局部学习标注器构建完成</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[['触发词P', '76%'], ['触发词R', '71%'], ['F1', '73%']].map(([k, v]) => (
                          <div key={k} className="bg-green-50 border border-green-100 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-500">{k}</div>
                            <div className="text-base font-bold text-green-700">{v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400">基于 {annotations.length} 条种子样本 · 可继续补充标注以提升效果</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Extract tab ── */}
      {tab === 'extract' && (
        <div className="space-y-4">
          {/* Config bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">识别模式</span>
              <div className="flex p-0.5 bg-gray-100 rounded-lg">
                {(['full', 'local', 'zeroshot'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${mode === m ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                    {MODE_LABELS[m].label}
                  </button>
                ))}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${MODE_LABELS[mode].color}`}>{MODE_LABELS[mode].desc}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">事件模式</span>
              <select value={schemaPreset} onChange={e => { setSchemaPreset(e.target.value); setResults(null); }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400">
                {EVENT_SCHEMA_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Text picker */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-800">待识别文本</span>
              <div className="flex gap-1.5">
                {DEMO_TEXTS.map((_, i) => (
                  <button key={i} onClick={() => { setSelectedText(i); setResults(null); }}
                    className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-colors ${selectedText === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'}`}>
                    示例 {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-800 leading-loose">{DEMO_TEXTS[selectedText]}</p>
            </div>
          </div>

          <button onClick={handleExtract} disabled={isExtracting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm rounded-lg transition-colors">
            {isExtracting ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />识别中…</> : <><Play className="w-3.5 h-3.5" />执行事件识别</>}
          </button>

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="border border-gray-200 rounded-xl py-8 text-center text-gray-400 text-sm">未识别到当前模式下的事件</div>
              ) : results.map(ev => (
                <div key={ev.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">{ev.eventType}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">触发词：<strong>{ev.trigger}</strong></span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${MODE_LABELS[ev.mode].color}`}>{MODE_LABELS[ev.mode].label}</span>
                    <span className={`ml-auto text-xs font-bold ${confColor(ev.confidence)}`}>置信度 {(ev.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(ev.arguments).map(([role, val]) => (
                        <div key={role} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 w-20 flex-shrink-0">{role}</span>
                          <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Schema tab ── */}
      {tab === 'schema' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {EVENT_SCHEMA_PRESETS.map(p => (
              <button key={p.id} onClick={() => setSchemaPreset(p.id)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${schemaPreset === p.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {preset.eventTypes.map(et => (
            <div key={et.type} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{et.type}</span>
                <span className="text-[10px] text-gray-400">{et.roles.length} 个论元角色</span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {et.roles.map(role => (
                  <div key={role} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-blue-800 font-medium">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <div className="font-medium text-gray-700 mb-1.5">事件模式（Event Schema）说明</div>
            <div>• 每个事件类型由<strong>触发词集合</strong>（系统自动学习）和<strong>论元角色列表</strong>定义</div>
            <div>• 论元角色对应事件的参与要素，引擎将自动尝试从文本中填充每个角色</div>
            <div>• 局部学习模式下，建议每个事件类型提供至少 15~20 条含触发词的标注样本</div>
          </div>
        </div>
      )}
    </div>
  );
}
