import { useState } from 'react';
import {
  Plus, Trash2, CheckCircle, XCircle, Loader2, Database, BookOpen, FileText,
} from 'lucide-react';

type ConnStatus = 'idle' | 'testing' | 'ok' | 'failed';
type CorpusType = 'news' | 'paper' | 'patent' | 'web' | 'custom';

interface Corpus {
  id: string;
  name: string;
  type: CorpusType;
  description: string;
  source: string;
  docCount: number;
  selected: boolean;
  connStatus: ConnStatus;
}

const TYPE_LABEL: Record<CorpusType, string> = {
  news: '新闻语料',
  paper: '科技论文',
  patent: '专利文本',
  web: '网页抓取',
  custom: '自定义语料',
};

const INITIAL: Corpus[] = [
  {
    id: 'c1',
    name: '科技新闻语料库 2024',
    type: 'news',
    description: '国内科技媒体公开报道文本，用于公司/产品类模式发现',
    source: 'minio://corpus/tech-news-2024',
    docCount: 128400,
    selected: true,
    connStatus: 'ok',
  },
  {
    id: 'c2',
    name: 'ACL / EMNLP 论文摘要集',
    type: 'paper',
    description: '计算语言学会议论文摘要与引言段落',
    source: 'oss://kg-corpus/nlp-papers',
    docCount: 45200,
    selected: true,
    connStatus: 'ok',
  },
  {
    id: 'c3',
    name: '中国发明专利说明书抽样',
    type: 'patent',
    description: 'IPC G06 相关专利权利要求与说明书片段',
    source: 'trs://patent/g06-sample',
    docCount: 31800,
    selected: false,
    connStatus: 'idle',
  },
  {
    id: 'c4',
    name: '企业官网关于页抓取',
    type: 'web',
    description: '上市公司「关于我们 / 总部地址」类页面正文',
    source: 'cos://web-crawl/about-pages',
    docCount: 9600,
    selected: false,
    connStatus: 'idle',
  },
];

/**
 * 审计目录专用：语料库选择与配置
 * 交互形态参考数据源管理，面向模式发现的文本语料选择
 */
export default function CorpusSelectionConfig() {
  const [list, setList] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(INITIAL[0].id);
  const [testingId, setTestingId] = useState<string | null>(null);

  const selected = list.find((c) => c.id === selectedId) ?? list[0];
  const selectedCount = list.filter((c) => c.selected).length;

  const update = (next: Corpus) => {
    setList((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  const addCorpus = () => {
    const id = `c${Date.now()}`;
    const item: Corpus = {
      id,
      name: '新建语料库',
      type: 'custom',
      description: '',
      source: '',
      docCount: 0,
      selected: false,
      connStatus: 'idle',
    };
    setList((prev) => [item, ...prev]);
    setSelectedId(id);
  };

  const remove = (id: string) => {
    setList((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? '');
      return next;
    });
  };

  const testConn = (id: string) => {
    setTestingId(id);
    setList((prev) => prev.map((c) => (c.id === id ? { ...c, connStatus: 'testing' } : c)));
    setTimeout(() => {
      setList((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, connStatus: Math.random() > 0.15 ? 'ok' : 'failed' } : c,
        ),
      );
      setTestingId(null);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <div>
          <h1 className="text-lg text-gray-900 font-medium">语料库选择与配置</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            选择一个或多个文本语料库，作为候选模式发现的数据源 · 已选 {selectedCount} 个
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ml-2">
          审计目录专用页
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={addCorpus}
          className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5"
        >
          <Plus size={14} /> 新增语料库
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden p-6">
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 min-h-0 overflow-y-auto">
          {list.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`bg-white border rounded-xl px-3 py-2.5 cursor-pointer flex items-center gap-2 transition-colors ${
                selectedId === c.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={c.selected}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => update({ ...c, selected: e.target.checked })}
                className="rounded border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{c.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                    {TYPE_LABEL[c.type]}
                  </span>
                  <span className="text-[10px] text-gray-400">{c.docCount.toLocaleString()} 篇</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(c.id);
                }}
                className="p-1 text-gray-300 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {selected ? (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-900">
                勾选左侧语料库即可纳入模式发现数据源；可配置连接信息并测试可用性，形态参考数据源管理。
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Database size={15} className="text-blue-500" />
                  语料库配置
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">语料库名称</div>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-blue-400"
                    value={selected.name}
                    onChange={(e) => update({ ...selected, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">语料类型</div>
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full bg-white"
                      value={selected.type}
                      onChange={(e) => update({ ...selected, type: e.target.value as CorpusType })}
                    >
                      {(Object.keys(TYPE_LABEL) as CorpusType[]).map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">文档规模</div>
                    <input
                      type="number"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                      value={selected.docCount}
                      onChange={(e) => update({ ...selected, docCount: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">存储路径 / 连接串</div>
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full font-mono"
                    value={selected.source}
                    onChange={(e) => update({ ...selected, source: e.target.value })}
                    placeholder="如 minio://bucket/path"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">描述</div>
                  <textarea
                    rows={2}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full resize-none"
                    value={selected.description}
                    onChange={(e) => update({ ...selected, description: e.target.value })}
                  />
                </div>

                {selected.connStatus === 'ok' && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    <CheckCircle size={14} /> 连接正常，可用于模式发现
                  </div>
                )}
                {selected.connStatus === 'failed' && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <XCircle size={14} /> 连接失败，请检查路径或权限
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    保存语料库配置
                  </button>
                  <button
                    type="button"
                    onClick={() => testConn(selected.id)}
                    className="text-sm px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1.5"
                  >
                    {testingId === selected.id ? <Loader2 size={13} className="animate-spin" /> : null}
                    测试连接
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ ...selected, selected: true })}
                    className="text-sm px-4 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-1.5"
                  >
                    <BookOpen size={13} />
                    加入模式发现数据源
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={15} className="text-gray-500" />
                  已选数据源汇总
                </div>
                {selectedCount === 0 ? (
                  <p className="text-sm text-gray-400">尚未勾选语料库</p>
                ) : (
                  <ul className="space-y-2">
                    {list
                      .filter((c) => c.selected)
                      .map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2"
                        >
                          <span className="text-gray-800">{c.name}</span>
                          <span className="text-xs text-gray-400">
                            {TYPE_LABEL[c.type]} · {c.docCount.toLocaleString()} 篇
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400 py-12 text-center">请新增语料库</div>
          )}
        </div>
      </div>
    </div>
  );
}
