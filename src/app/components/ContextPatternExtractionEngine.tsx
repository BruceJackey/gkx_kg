import { ScanSearch, Braces, Network, Sparkles } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: ScanSearch,
    title: '上下文窗口抽取',
    desc: '围绕种子实例在语料中的出现位置，自动截取左右上下文文本窗口，保留触发词与邻近实体线索。',
  },
  {
    icon: Braces,
    title: '词性 / 句法泛化',
    desc: '对上下文做词性标注与依存/短语结构分析，将具体词例抽象为词性标签或句法槽位，提升模式泛化能力。',
  },
  {
    icon: Network,
    title: '候选模式生成',
    desc: '将泛化后的上下文归纳为可复用模式模板，例如「公司[INSTANCE]宣布…」「[INSTANCE]总部位于…」。',
  },
  {
    icon: Sparkles,
    title: '与上下游衔接',
    desc: '输入来自已选语料库与种子实例；输出候选模式进入「模式预览与管理」及后续自动评分、人工审核流程。',
  },
];

const EXAMPLES = [
  { raw: '华为公司宣布推出新一代芯片', pattern: '公司[INSTANCE]宣布…' },
  { raw: '字节跳动总部位于北京', pattern: '[INSTANCE]总部位于…' },
  { raw: '张三就职于清华大学计算机系', pattern: '[INSTANCE]就职于…' },
];

/**
 * 审计目录专用：上下文模式抽取引擎介绍
 */
export default function ContextPatternExtractionEngine() {
  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto p-1">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">上下文模式抽取引擎</h1>
          <p className="text-sm text-gray-500">
            自动提取种子实例周围的文本、词性或句法结构，并泛化为候选模式
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-4xl space-y-5">
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 leading-relaxed space-y-2">
          <p>
            引擎在已配置的文本语料库中检索种子实例提及，截取局部上下文，并结合词性与句法结构进行槽位化，
            生成可复用的候选抽取模式，支撑后续实体/关系学习。
          </p>
          <p className="text-slate-500 text-xs">
            本页为能力介绍；语料选择见「语料库选择与配置」，候选模式列表与评分见「模式预览与管理」。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 inline-flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-medium text-gray-900">{title}</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">模式泛化示例</div>
          <ul className="space-y-2">
            {EXAMPLES.map((ex) => (
              <li
                key={ex.pattern}
                className="text-sm border border-gray-100 rounded-lg px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
              >
                <span className="text-gray-500 flex-1">{ex.raw}</span>
                <span className="text-gray-300 hidden sm:inline">→</span>
                <code className="text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-xs font-mono">
                  {ex.pattern}
                </code>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">典型流程</div>
          <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
            <li>加载已选语料库与种子实例集合</li>
            <li>定位种子提及并抽取上下文窗口</li>
            <li>词性 / 句法分析后做槽位泛化</li>
            <li>去重合并，输出候选模式供预览与评分</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
