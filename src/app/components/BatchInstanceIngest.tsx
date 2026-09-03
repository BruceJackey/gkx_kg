import { useState } from 'react';
import { Check, Database, Loader2 } from 'lucide-react';

type IngestStatus = 'ready' | 'ingested' | 'skipped';

interface ConfirmedInstance {
  id: string;
  name: string;
  entityType: string;
  alignment: 'merge' | 'create';
  targetConcept: string;
  ontologyId: string;
  confidence: number;
  status: IngestStatus;
}

const INITIAL: ConfirmedInstance[] = [
  {
    id: 'pi1',
    name: '多伦多大学',
    entityType: '机构',
    alignment: 'merge',
    targetConcept: '研究机构',
    ontologyId: 'onto:org/utoronto',
    confidence: 0.92,
    status: 'ready',
  },
  {
    id: 'pi2',
    name: 'Yoshua Bengio',
    entityType: '作者',
    alignment: 'merge',
    targetConcept: '学者',
    ontologyId: 'onto:person/bengio-y',
    confidence: 0.88,
    status: 'ready',
  },
  {
    id: 'pi3',
    name: '卷积神经网络',
    entityType: '概念',
    alignment: 'create',
    targetConcept: '深度学习模型',
    ontologyId: 'onto:new/卷积神经网络',
    confidence: 0.81,
    status: 'ready',
  },
  {
    id: 'pi4',
    name: 'Facebook AI Research',
    entityType: '机构',
    alignment: 'merge',
    targetConcept: '研究机构',
    ontologyId: 'onto:org/fair',
    confidence: 0.79,
    status: 'ready',
  },
];

const CONCEPTS = ['研究机构', '学者', '深度学习模型', '论文', '技术术语'];

/**
 * 审计目录专用：批量入库操作
 * 将审核通过并对齐完成的新实例一键批量写入知识图谱目标概念
 */
export default function BatchInstanceIngest() {
  const [items, setItems] = useState<ConfirmedInstance[]>(INITIAL);
  const [targetConcept, setTargetConcept] = useState('研究机构');
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState('');

  const readyCount = items.filter((i) => i.status === 'ready').length;
  const ingestedCount = items.filter((i) => i.status === 'ingested').length;

  const ingestAll = () => {
    if (readyCount === 0 || running) return;
    setRunning(true);
    setMsg('');
    window.setTimeout(() => {
      setItems((prev) =>
        prev.map((i) =>
          i.status === 'ready'
            ? { ...i, status: 'ingested', targetConcept: targetConcept || i.targetConcept }
            : i,
        ),
      );
      setMsg(`已将 ${readyCount} 个确认实例批量入库至目标概念「${targetConcept}」`);
      setRunning(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">批量入库操作</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            将审核通过并对齐完成的新实例，一键批量添加到知识图谱的目标概念下
          </p>
        </div>
        <button
          type="button"
          onClick={ingestAll}
          disabled={readyCount === 0 || running}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex-shrink-0"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          一键入库（{readyCount}）
        </button>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        <label className="text-sm text-gray-600">目标概念</label>
        <select
          value={targetConcept}
          onChange={(e) => setTargetConcept(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-teal-400"
        >
          {CONCEPTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          待入库 {readyCount} · 已入库 {ingestedCount}
        </span>
      </div>

      {msg && (
        <div className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 flex-shrink-0 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          {msg}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs sticky top-0">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">实例</th>
              <th className="text-left font-medium px-4 py-2.5">类型</th>
              <th className="text-left font-medium px-4 py-2.5">对齐</th>
              <th className="text-left font-medium px-4 py-2.5">目标概念</th>
              <th className="text-left font-medium px-4 py-2.5">本体 ID</th>
              <th className="text-left font-medium px-4 py-2.5">置信度</th>
              <th className="text-left font-medium px-4 py-2.5">状态</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-slate-50/60">
                <td className="px-4 py-2.5 font-medium text-gray-800">{row.name}</td>
                <td className="px-4 py-2.5 text-gray-600">{row.entityType}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded border ${
                      row.alignment === 'merge'
                        ? 'bg-teal-50 text-teal-700 border-teal-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}
                  >
                    {row.alignment === 'merge' ? '合并' : '新建'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {row.status === 'ingested' ? row.targetConcept : targetConcept || row.targetConcept}
                </td>
                <td className="px-4 py-2.5">
                  <code className="text-[11px] text-gray-500">{row.ontologyId}</code>
                </td>
                <td className="px-4 py-2.5 text-gray-600">{(row.confidence * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5">
                  {row.status === 'ingested' ? (
                    <span className="text-[11px] text-green-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> 已入库
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600">待入库</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
