import { useState } from 'react';
import { Upload, Play, FileText, Boxes, CheckCircle2 } from 'lucide-react';

const SAMPLE_PATENTS = [
  { id: 'pat-1', name: '一种基于图注意力的知识抽取方法及装置.pdf' },
  { id: 'pat-2', name: '一种有机发光材料及其制备方法.pdf' },
  { id: 'pat-3', name: '一种低功耗传感器电路及芯片.pdf' },
];

interface TechModule {
  id: string;
  name: string;
  function: string;
  inputs: string;
  outputs: string;
  reusable: boolean;
  dependsOn: string[];
}

const MOCK_MODULES: TechModule[] = [
  {
    id: 'M1',
    name: '语料接入模块',
    function: '接收并预处理待抽取文本，支持批量与流式输入',
    inputs: '原始文本语料、编码格式',
    outputs: '分词/句法预处理后的文本流',
    reusable: true,
    dependsOn: [],
  },
  {
    id: 'M2',
    name: '异构图构建模块',
    function: '将实体与关系组织为可计算的图结构',
    inputs: '预处理文本、实体/关系候选',
    outputs: '实体-关系异构图 G=(V,E,R)',
    reusable: true,
    dependsOn: ['M1'],
  },
  {
    id: 'M3',
    name: '关系感知注意力模块',
    function: '多头聚合邻居特征，区分异构邻域语义',
    inputs: '异构图、节点/边特征',
    outputs: '节点上下文表示向量',
    reusable: true,
    dependsOn: ['M2'],
  },
  {
    id: 'M4',
    name: '三元组解码输出模块',
    function: '将编码结果映射为结构化三元组并校验类型约束',
    inputs: '节点表示、关系类型集合',
    outputs: '结构化三元组集合',
    reusable: false,
    dependsOn: ['M3'],
  },
  {
    id: 'M5',
    name: '负采样与训练策略模块',
    function: '类型约束负采样，降低无效候选比例',
    inputs: '正样本三元组、关系类型约束',
    outputs: '训练批次、损失权重',
    reusable: true,
    dependsOn: ['M4'],
  },
];

/**
 * 审计目录专用：技术方案模块化拆解
 */
export default function PatentModuleDecomposition() {
  const [selected, setSelected] = useState(SAMPLE_PATENTS[0]);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [modules, setModules] = useState<TechModule[] | null>(null);

  const displayName = uploadName ?? selected.name;

  const runDecompose = () => {
    setRunning(true);
    setModules(null);
    setTimeout(() => {
      setModules(MOCK_MODULES);
      setRunning(false);
    }, 1200);
  };

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">技术方案模块化拆解</h1>
          <p className="text-sm text-gray-500">
            将专利中的技术方案拆解为标准化的、可复用的功能模块，支撑跨域知识融合与文献匹配
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-green-500 text-white rounded font-bold">POST</span>
          <code className="font-mono text-gray-700">/api/v1/patent/modules:decompose</code>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">上传专利</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-6 py-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30">
            <Upload className="w-7 h-7 text-gray-300" />
            <span className="text-sm text-gray-600">点击上传专利 PDF / DOC</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setUploadName(f.name);
                  setModules(null);
                }
              }}
            />
          </label>
          {displayName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="truncate">{displayName}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PATENTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setSelected(p); setUploadName(null); setModules(null); }}
              className={`text-[11px] px-2.5 py-1 rounded-full border ${
                selected.id === p.id && !uploadName
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {p.name.replace('.pdf', '')}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={runDecompose}
          disabled={!displayName || running}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-4 h-4" />
          {running ? '拆解中…' : '执行模块化拆解'}
        </button>
      </div>

      {modules && (
        <div className="max-w-4xl space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            拆解完成 · 共 {modules.length} 个标准化功能模块
          </div>

          <ul className="space-y-3">
            {modules.map((m) => (
              <li key={m.id} className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-900">
                    {m.id} · {m.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${
                      m.reusable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {m.reusable ? '可复用' : '专利专用'}
                  </span>
                </div>
                <div className="p-4 text-sm space-y-2">
                  <p className="text-gray-700">{m.function}</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-400">输入</span>
                      <div className="text-gray-700 mt-0.5">{m.inputs}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-400">输出</span>
                      <div className="text-gray-700 mt-0.5">{m.outputs}</div>
                    </div>
                  </div>
                  {m.dependsOn.length > 0 && (
                    <div className="text-xs text-gray-500">
                      依赖模块：{m.dependsOn.join(' → ')}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
