import { useState } from 'react';
import { Bot, Play, CheckCircle2, Settings, Zap, Copy, Eye, EyeOff } from 'lucide-react';

interface LlmModelConfig {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  modelId: string;
  contextWindow: string;
  priceHint: string;
  enabled: boolean;
  apiKey: string;
  status: 'connected' | 'idle' | 'error';
  latencyMs?: number;
}

const INITIAL_MODELS: LlmModelConfig[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    modelId: 'gpt-4o',
    contextWindow: '128K',
    priceHint: '¥0.035 / 1K tokens',
    enabled: true,
    apiKey: 'sk-proj-••••••••••••••••',
    status: 'connected',
    latencyMs: 820,
  },
  {
    id: 'claude-35',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    modelId: 'claude-3-5-sonnet-20241022',
    contextWindow: '200K',
    priceHint: '¥0.028 / 1K tokens',
    enabled: true,
    apiKey: 'sk-ant-••••••••••••••••',
    status: 'connected',
    latencyMs: 940,
  },
  {
    id: 'qwen-max',
    name: '通义千问 Max',
    provider: '阿里云',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelId: 'qwen-max',
    contextWindow: '32K',
    priceHint: '¥0.020 / 1K tokens',
    enabled: true,
    apiKey: 'sk-••••••••••••••••',
    status: 'idle',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    provider: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    modelId: 'deepseek-chat',
    contextWindow: '64K',
    priceHint: '¥0.008 / 1K tokens',
    enabled: false,
    apiKey: '',
    status: 'idle',
  },
  {
    id: 'glm-4',
    name: 'GLM-4',
    provider: '智谱 AI',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    modelId: 'glm-4',
    contextWindow: '128K',
    priceHint: '¥0.015 / 1K tokens',
    enabled: true,
    apiKey: '••••••••••••••••',
    status: 'connected',
    latencyMs: 680,
  },
];

const TEST_PROMPT = '请用一句话介绍知识图谱与大语言模型融合的核心价值。';

export default function LlmApiIntegrationPage() {
  const [models, setModels] = useState<LlmModelConfig[]>(INITIAL_MODELS);
  const [selectedId, setSelectedId] = useState('gpt-4o');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ modelId: string; text: string; latency: number } | null>(null);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  const selected = models.find(m => m.id === selectedId)!;
  const enabledCount = models.filter(m => m.enabled).length;

  const toggleEnabled = (id: string) => {
    setModels(prev => prev.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
  };

  const updateApiKey = (id: string, apiKey: string) => {
    setModels(prev => prev.map(m => (m.id === id ? { ...m, apiKey } : m)));
  };

  const runTest = (id: string) => {
    setTestingId(id);
    setTestResult(null);
    setTimeout(() => {
      const latency = Math.round(Math.random() * 400 + 500);
      setModels(prev =>
        prev.map(m =>
          m.id === id ? { ...m, status: 'connected' as const, latencyMs: latency } : m,
        ),
      );
      setTestResult({
        modelId: id,
        text: '知识图谱为大语言模型提供结构化事实约束与可溯源证据，显著降低幻觉并增强复杂问答的可解释性。',
        latency,
      });
      setTestingId(null);
    }, 1100);
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-purple-600" />
          多模型 API 集成
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          统一配置和调用 GPT-4o、Claude、通义千问、DeepSeek、GLM 等主流大模型 API
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '已接入模型', value: models.length },
          { label: '已启用', value: enabledCount },
          { label: '连通正常', value: models.filter(m => m.status === 'connected').length },
          { label: '今日调用', value: '12,480' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Model list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">模型列表</h3>
          {models.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${
                selectedId === m.id
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.provider}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  m.status === 'connected'
                    ? 'bg-green-100 text-green-700'
                    : m.enabled
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {m.status === 'connected' ? '已连通' : m.enabled ? '待测试' : '未启用'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Config panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selected.provider} · 上下文 {selected.contextWindow}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.enabled}
                  onChange={() => toggleEnabled(selected.id)}
                  className="rounded"
                />
                启用
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">API Endpoint</label>
                <code className="block text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-800 break-all">
                  {selected.endpoint}
                </code>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Model ID</label>
                <code className="block text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-800">
                  {selected.modelId}
                </code>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showKeys.has(selected.id) ? 'text' : 'password'}
                  value={selected.apiKey}
                  onChange={e => updateApiKey(selected.id, e.target.value)}
                  placeholder="输入 API Key…"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility(selected.id)}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  {showKeys.has(selected.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selected.apiKey)}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Settings className="w-3.5 h-3.5" />{selected.priceHint}</span>
              {selected.latencyMs && (
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />最近延迟 {selected.latencyMs}ms</span>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">连通性测试</p>
              <div className="flex gap-2 items-start">
                <div className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
                  {TEST_PROMPT}
                </div>
                <button
                  type="button"
                  onClick={() => runTest(selected.id)}
                  disabled={!selected.enabled || testingId === selected.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg flex-shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testingId === selected.id ? '调用中…' : '测试调用'}
                </button>
              </div>
              {testResult?.modelId === selected.id && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800 flex items-center gap-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    调用成功 · {testResult.latency}ms
                  </p>
                  <p className="text-sm text-gray-800">{testResult.text}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">统一调用接口</p>
            <code className="text-xs font-mono text-gray-800 block">
              POST /api/v1/llm/chat/completions
            </code>
            <pre className="mt-2 text-[11px] font-mono text-gray-600 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">{`{
  "model": "${selected.modelId}",
  "messages": [{ "role": "user", "content": "..." }],
  "temperature": 0.7
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
