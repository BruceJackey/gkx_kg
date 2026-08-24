import { useState } from 'react';
import { Play, AlertTriangle } from 'lucide-react';

const GRAPH_LIBRARIES = [
  { id: 'kg-research', name: '科研知识图谱' },
  { id: 'kg-patent', name: '专利技术图谱' },
  { id: 'kg-medical', name: '医疗健康图谱' },
];

type Violation = {
  id: string;
  entity: string;
  rule: string;
  issue: string;
};

const MOCK_VIOLATIONS: Record<string, Violation[]> = {
  'kg-research': [
    { id: 'v1', entity: '论文《Attention Is All You Need》', rule: '发表年份取值范围', issue: '属性 year=2018，超出约束范围 [2020, 2026]' },
    { id: 'v2', entity: '作者：李明', rule: 'ORCID唯一性', issue: 'ORCID 0000-0002-1825-0097 与实体「李明（清华）」重复' },
    { id: 'v3', entity: '关系：张伟 → 隶属于 → 北京大学', rule: '组织关系完整性', issue: '目标机构缺少必填属性「国家」' },
  ],
  'kg-patent': [
    { id: 'v4', entity: '专利 CN112345678A', rule: '申请号格式', issue: '申请号格式不符合 CN + 数字 规范' },
    { id: 'v5', entity: '申请人：华为技术有限公司', rule: '实体名称非空', issue: '英文名称字段为空' },
  ],
  'kg-medical': [
    { id: 'v6', entity: '疾病：2型糖尿病', rule: 'ICD编码必填', issue: '缺少 icd_code 属性' },
  ],
};

/**
 * 审计目录专用：知识一致性自动校验简易页
 */
export default function KnowledgeConsistencyValidation() {
  const [graphId, setGraphId] = useState(GRAPH_LIBRARIES[0].id);
  const [running, setRunning] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [ran, setRan] = useState(false);

  const runValidation = () => {
    setRunning(true);
    setRan(false);
    setViolations([]);
    setTimeout(() => {
      setViolations(MOCK_VIOLATIONS[graphId] ?? []);
      setRunning(false);
      setRan(true);
    }, 800);
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">知识一致性自动校验</h1>
          <p className="text-sm text-gray-500">选择图库并执行校验，扫描违反约束规则的数据</p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          审计目录专用页
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-3xl">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1.5 block">图库选择</label>
          <select
            value={graphId}
            onChange={(e) => setGraphId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          >
            {GRAPH_LIBRARIES.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={runValidation}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? '校验中…' : '知识一致性自动校验'}
        </button>

        {ran && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              违反规则的数据 · {violations.length} 条
            </div>
            {violations.length === 0 ? (
              <p className="text-sm text-green-600">未发现违反约束的数据</p>
            ) : (
              <ul className="divide-y border border-gray-200 rounded-lg overflow-hidden">
                {violations.map((v) => (
                  <li key={v.id} className="px-4 py-3 text-sm bg-white">
                    <div className="font-medium text-gray-800">{v.entity}</div>
                    <div className="text-xs text-red-600 mt-0.5">违反规则：{v.rule}</div>
                    <div className="text-xs text-gray-500 mt-1">{v.issue}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
