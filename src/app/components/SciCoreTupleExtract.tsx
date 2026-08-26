import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Play,
  CheckCircle2,
  Workflow,
  Beaker,
  FileText,
} from 'lucide-react';

export type SciCoreFocus = 'pipeline' | 'tuple';

type UploadSlot = { name: string; sizeLabel: string };

const SAMPLE: UploadSlot = {
  name: 'high_entropy_alloy_mechanical_properties.pdf',
  sizeLabel: '2.1 MB',
};

const PIPELINE_STEPS = [
  { id: 1, name: '文献切分', desc: '按章节/段落切块，保留图表上下文' },
  { id: 2, name: '领域槽位识别', desc: '定位方法、材料、性能、机制候选提及' },
  { id: 3, name: '四元组装填', desc: '按「方法→材料→性能→机制」槽位对齐填充' },
  { id: 4, name: '一致性校验', desc: '单位归一、同义归并、冲突标记' },
  { id: 5, name: '结构化输出', desc: '导出标准四元组及证据句' },
];

const TUPLE_RESULT = [
  {
    id: 't1',
    method: '真空电弧熔炼 + 均匀化退火',
    material: 'CoCrFeNiMn 高熵合金',
    property: '屈服强度 520 MPa，延伸率 38%',
    mechanism: '多主元固溶强化与形变孪晶协同',
    evidence: '§3.2 / Fig.4',
    confidence: 0.92,
  },
  {
    id: 't2',
    method: '火花等离子体烧结（SPS）',
    material: '纳米 TiB2 增强 Al 基复合材料',
    property: '硬度提升至 128 HV，相对密度 >98%',
    mechanism: '纳米颗粒钉扎晶界抑制晶粒长大',
    evidence: '§4.1 / Tab.2',
    confidence: 0.88,
  },
  {
    id: 't3',
    method: '化学气相沉积（CVD）',
    material: '单层 MoS2 / SiO2 异质结构',
    property: '室温开关比 >10^6，迁移率 45 cm²/V·s',
    mechanism: '缺陷钝化降低散射中心密度',
    evidence: '§3.4 / Fig.6',
    confidence: 0.85,
  },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SciCoreTupleExtract({
  initialFocus,
}: {
  initialFocus?: SciCoreFocus | null;
}) {
  const [file, setFile] = useState<UploadSlot | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState<SciCoreFocus | null>(initialFocus ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const tupleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !initialFocus) return;
    const el = initialFocus === 'pipeline' ? pipelineRef.current : tupleRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setFocus(initialFocus);
  }, [ready, initialFocus]);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    setFile({ name: f.name, sizeLabel: formatSize(f.size) });
    setReady(false);
    setProgress(0);
    setActiveStep(0);
  };

  const run = () => {
    if (!file || running) return;
    setRunning(true);
    setReady(false);
    setProgress(0);
    setActiveStep(1);
    let p = 0;
    let step = 1;
    const iv = setInterval(() => {
      p += 8 + Math.random() * 10;
      const nextStep = Math.min(5, Math.ceil((p / 100) * 5));
      if (nextStep !== step) {
        step = nextStep;
        setActiveStep(step);
      }
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProgress(100);
        setActiveStep(5);
        setTimeout(() => {
          setReady(true);
          setRunning(false);
          setFocus(initialFocus ?? null);
        }, 220);
      } else {
        setProgress(Math.min(p, 99));
      }
    }, 150);
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">科研核心元组抽取</h1>
          <p className="text-sm text-gray-500">
            面向材料科学等科研范式的标准化三元组 / 四元组抽取流程
          </p>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          审计目录专用页
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 flex-shrink-0 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <div
          className="flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors min-w-[240px]"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onPick(e.dataTransfer.files?.[0]);
          }}
        >
          <Upload className="w-4 h-4 text-gray-400" />
          <div className="min-w-0">
            {file ? (
              <>
                <p className="text-xs font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">{file.sizeLabel}</p>
              </>
            ) : (
              <p className="text-xs text-gray-500">上传文献（PDF / 文本）</p>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf,.txt,.md,text/plain"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setFile(SAMPLE);
            setReady(false);
            setProgress(0);
            setActiveStep(0);
          }}
          className="text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          使用示例文献
        </button>

        <button
          type="button"
          onClick={run}
          disabled={!file || running}
          className="flex items-center gap-1.5 text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
        >
          {running ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {running ? '抽取中…' : '执行标准抽取流程'}
        </button>

        {(running || (progress > 0 && !ready)) && (
          <div className="flex-1 min-w-[140px] max-w-xs">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>流程步骤 {activeStep}/5</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Pipeline */}
        <div
          ref={pipelineRef}
          className={`col-span-4 bg-white border rounded-xl overflow-hidden flex flex-col min-h-0 ${
            focus === 'pipeline' ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-gray-200'
          }`}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0">
            <Workflow className={`w-4 h-4 ${focus === 'pipeline' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-semibold text-gray-900">抽取流程标准化</p>
              <p className="text-[11px] text-gray-400">固化标准流程，保证结果一致性</p>
            </div>
            {ready && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {PIPELINE_STEPS.map((s) => {
              const done = ready || (running && activeStep > s.id);
              const current = running && activeStep === s.id;
              return (
                <div
                  key={s.id}
                  className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                    current
                      ? 'border-blue-300 bg-blue-50/60'
                      : done
                        ? 'border-emerald-100 bg-emerald-50/40'
                        : 'border-gray-100 bg-gray-50/50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      done
                        ? 'bg-emerald-500 text-white'
                        : current
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {done && !current ? '✓' : s.id}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
            <div className="text-[11px] text-gray-400 px-1 pt-1 flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              范式：材料科学 · 槽位模板固定为「方法 / 材料 / 性能 / 机制」
            </div>
          </div>
        </div>

        {/* Tuples */}
        <div
          ref={tupleRef}
          className={`col-span-8 bg-white border rounded-xl overflow-hidden flex flex-col min-h-0 ${
            focus === 'tuple' ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-gray-200'
          }`}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2 shrink-0">
            <Beaker className={`w-4 h-4 ${focus === 'tuple' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-semibold text-gray-900">方法-材料-性能-机制抽取</p>
              <p className="text-[11px] text-gray-400">
                （使用）方法 →（作用于）材料 →（得到）性能 →（机制是）…
              </p>
            </div>
            {ready && (
              <span className="text-[11px] text-emerald-600 ml-auto flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {TUPLE_RESULT.length} 条四元组
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {!ready ? (
              <p className="text-xs text-gray-400 text-center py-16">
                上传文献并执行后，在此输出材料领域核心四元组
              </p>
            ) : (
              <div className="space-y-3">
                {TUPLE_RESULT.map((t) => (
                  <div key={t.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <span className="text-[11px] font-mono text-indigo-600">{t.id}</span>
                      <span className="text-[10px] text-gray-400">{t.evidence}</span>
                      <span className="text-[10px] text-emerald-600 ml-auto">
                        {(t.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-gray-100">
                      {(
                        [
                          { key: '方法', val: t.method, color: 'text-blue-700 bg-blue-50/80' },
                          { key: '材料', val: t.material, color: 'text-violet-700 bg-violet-50/80' },
                          { key: '性能', val: t.property, color: 'text-emerald-700 bg-emerald-50/80' },
                          { key: '机制', val: t.mechanism, color: 'text-amber-800 bg-amber-50/80' },
                        ] as const
                      ).map((slot) => (
                        <div key={slot.key} className={`p-3 ${slot.color}`}>
                          <p className="text-[10px] font-semibold opacity-70 mb-1">{slot.key}</p>
                          <p className="text-xs leading-snug">{slot.val}</p>
                        </div>
                      ))}
                    </div>
                    <p className="px-3 py-2 text-[11px] text-gray-500 bg-white border-t border-gray-100">
                      使用「{t.method}」作用于「{t.material}」，得到「{t.property}」，其内在机制是「
                      {t.mechanism}」。
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
