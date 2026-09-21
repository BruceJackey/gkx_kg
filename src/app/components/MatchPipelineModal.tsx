import { useEffect, useState } from 'react';
import {
  BookmarkPlus, Check, CheckCircle2, GitMerge,
  Loader2, Play, Settings2, X, Sliders,
} from 'lucide-react';

/** 主流程固定；文本/结构是同级可选块，插在加载本体与配置映射之间 */
export type PipelineStageId = 'load' | 'text' | 'structure' | 'mapping' | 'execute' | 'review';

export type AttrMapping = { id: string; sourceAttr: string; targetAttr: string };
export type EntityMapping = {
  id: string;
  source: string;
  target: string;
  /** 属性名可不一一对应，需显式配置 */
  attributes: AttrMapping[];
};

export type PipelineConfig = {
  sourceOntology: string;
  targetOntology: string;
  scope: 'checked' | 'starred' | 'all';
  useTextMatch: boolean;
  useStructureMatch: boolean;
  mappings: EntityMapping[];
  reviewPolicy: 'auto-high' | 'sample' | 'all-manual';
  reviewThreshold: number;
};

export type PipelineRunResult = {
  executedAt: string;
  triples: Array<{ subject: string; predicate: string; object: string }>;
  conflicts: Array<{ id: string; triple: string; existing: string; type: string }>;
  reviews: Array<{ src: string; tgt: string; relation: string; status: '待审核' | '已接受' }>;
};

export type PipelineTemplate = {
  id: string;
  name: string;
  savedAt: string;
  config: PipelineConfig;
  result?: PipelineRunResult | null;
};

const FLOW: Array<{ id: PipelineStageId; label: string; optional?: boolean }> = [
  { id: 'load', label: '加载本体' },
  { id: 'text', label: '文本匹配', optional: true },
  { id: 'structure', label: '结构匹配', optional: true },
  { id: 'mapping', label: '配置映射' },
  { id: 'review', label: '人工审核' },
  { id: 'execute', label: '执行流程' },
];

const SOURCE_CLASSES = ['人物', '组织', '技术', '事件', '数据集'] as const;
const TARGET_CLASSES = ['Person', 'Organization', 'Technology', 'Event', 'Dataset'] as const;

const SOURCE_ATTRS: Record<(typeof SOURCE_CLASSES)[number], string[]> = {
  人物: ['姓名', '所属机构', '出生地', '职称'],
  组织: ['机构名称', '成立年份', '所在地'],
  技术: ['技术名称', '技术领域', '成熟度'],
  事件: ['事件名称', '发生时间', '地点'],
  数据集: ['数据集名称', '规模', '许可协议'],
};

const TARGET_ATTRS: Record<(typeof TARGET_CLASSES)[number], string[]> = {
  Person: ['name', 'affiliation', 'birthPlace', 'title'],
  Organization: ['legalName', 'foundingDate', 'location'],
  Technology: ['label', 'domain', 'maturity'],
  Event: ['name', 'startDate', 'location'],
  Dataset: ['name', 'size', 'license'],
};

type Atom = {
  id: string;
  group: string;
  label: string;
  kind: 'noop' | 'text' | 'structure' | 'review';
  policy?: PipelineConfig['reviewPolicy'];
};

const ATOMS: Atom[] = [
  { id: 'load', group: '固定步骤', label: '加载本体', kind: 'noop' },
  { id: 'text', group: '可选步骤', label: '文本匹配', kind: 'text' },
  { id: 'structure', group: '可选步骤', label: '结构匹配', kind: 'structure' },
  { id: 'rv-auto', group: '人工审核', label: '高分自动通过', kind: 'review', policy: 'auto-high' },
  { id: 'rv-sample', group: '人工审核', label: '抽样复核', kind: 'review', policy: 'sample' },
  { id: 'rv-all', group: '人工审核', label: '全部人工', kind: 'review', policy: 'all-manual' },
];

const ATOM_GROUPS = ['固定步骤', '可选步骤', '人工审核'];

function defaultAttrs(source: string, target: string): AttrMapping[] {
  const srcList = SOURCE_ATTRS[source as keyof typeof SOURCE_ATTRS] ?? ['名称'];
  const tgtList = TARGET_ATTRS[target as keyof typeof TARGET_ATTRS] ?? ['name'];
  const count = Math.min(srcList.length, tgtList.length, 3);
  return Array.from({ length: count }, (_, i) => ({
    id: `a-${source}-${i}`,
    sourceAttr: srcList[i],
    targetAttr: tgtList[i],
  }));
}

const DEFAULT_MAPPINGS: EntityMapping[] = [
  { id: 'm1', source: '人物', target: 'Person', attributes: defaultAttrs('人物', 'Person') },
  { id: 'm2', source: '组织', target: 'Organization', attributes: defaultAttrs('组织', 'Organization') },
  { id: 'm3', source: '技术', target: 'Technology', attributes: defaultAttrs('技术', 'Technology') },
];

function cloneMappings(list: EntityMapping[]): EntityMapping[] {
  return list.map((m) => ({
    ...m,
    attributes: m.attributes.map((a) => ({ ...a })),
  }));
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  sourceOntology: '科研知识图谱 v2.1',
  targetOntology: 'W3C SOSA Ontology',
  scope: 'checked',
  useTextMatch: false,
  useStructureMatch: false,
  mappings: cloneMappings(DEFAULT_MAPPINGS),
  reviewPolicy: 'auto-high',
  reviewThreshold: 0.85,
};

function demoResult(config: PipelineConfig, executedAt: string): PipelineRunResult {
  const triples = config.mappings.flatMap((m) => [
    { subject: `src:${m.source}`, predicate: 'owl:equivalentClass', object: `tgt:${m.target}` },
    { subject: `src:${m.source}_001`, predicate: 'rdf:type', object: `tgt:${m.target}` },
    ...m.attributes.map((a) => ({
      subject: `src:${m.source}.${a.sourceAttr}`,
      predicate: 'owl:equivalentProperty',
      object: `tgt:${m.target}.${a.targetAttr}`,
    })),
  ]);
  const conflicts = [
    { id: 'C1', triple: 'src:人物.所属机构 → tgt:Person.affiliation', existing: '属性名不一致，已手工映射', type: '属性名不对齐' },
    { id: 'C2', triple: 'src:组织.成立年份 → tgt:Organization.foundingDate', existing: '粒度：年份 vs 日期', type: '属性粒度冲突' },
    { id: 'C3', triple: 'src:人物_001 bornIn "Toronto"', existing: 'tgt:Person birthPlace "多伦多"', type: '跨语言值冲突' },
  ];
  const reviews = config.mappings.flatMap((m) => [
    {
      src: m.source,
      tgt: m.target,
      relation: '实体等价',
      status: (config.reviewPolicy === 'all-manual' ? '待审核' : '已接受') as '待审核' | '已接受',
    },
    ...m.attributes.slice(0, 1).map((a) => ({
      src: `${m.source}.${a.sourceAttr}`,
      tgt: `${m.target}.${a.targetAttr}`,
      relation: '属性映射',
      status: '待审核' as const,
    })),
  ]);
  return { executedAt, triples, conflicts, reviews };
}

export const SEED_PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'tpl-std',
    name: '科研→SOSA 标准流水线',
    savedAt: '2026-07-15 10:30',
    config: { ...DEFAULT_PIPELINE_CONFIG, useTextMatch: true, mappings: cloneMappings(DEFAULT_MAPPINGS) },
    result: demoResult(
      { ...DEFAULT_PIPELINE_CONFIG, useTextMatch: true, mappings: cloneMappings(DEFAULT_MAPPINGS) },
      '2026-07-15 10:32',
    ),
  },
  {
    id: 'tpl-strict',
    name: '高精度全量审核',
    savedAt: '2026-07-22 14:05',
    config: {
      ...DEFAULT_PIPELINE_CONFIG,
      targetOntology: 'Schema.org',
      useTextMatch: true,
      useStructureMatch: true,
      reviewPolicy: 'all-manual',
      reviewThreshold: 0.9,
      mappings: cloneMappings([
        ...DEFAULT_MAPPINGS,
        { id: 'm4', source: '事件', target: 'Event', attributes: defaultAttrs('事件', 'Event') },
      ]),
    },
    result: demoResult(
      {
        ...DEFAULT_PIPELINE_CONFIG,
        reviewPolicy: 'all-manual',
        mappings: cloneMappings([
          ...DEFAULT_MAPPINGS,
          { id: 'm4', source: '事件', target: 'Event', attributes: defaultAttrs('事件', 'Event') },
        ]),
      },
      '2026-07-22 14:08',
    ),
  },
];

function blockEnabled(config: PipelineConfig, id: PipelineStageId): boolean {
  if (id === 'text') return config.useTextMatch;
  if (id === 'structure') return config.useStructureMatch;
  return true;
}

function stageCaption(config: PipelineConfig, id: PipelineStageId): string {
  if (id === 'load') return '必选';
  if (id === 'text') return config.useTextMatch ? '已加入' : '拖入加入';
  if (id === 'structure') return config.useStructureMatch ? '已加入' : '拖入加入';
  if (id === 'mapping') {
    const attrCount = config.mappings.reduce((sum, m) => sum + m.attributes.length, 0);
    return `${config.mappings.length} 实体 · ${attrCount} 属性`;
  }
  if (id === 'review') {
    return { 'auto-high': '高分自动通过', sample: '抽样复核', 'all-manual': '全部人工' }[config.reviewPolicy];
  }
  if (id === 'execute') return '查看配置并执行';
  return '';
}

function nowLabel() {
  return new Date().toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).replace(/\//g, '-');
}

export default function MatchPipelineModal({
  open,
  onClose,
  initialTab = 'canvas',
  templates,
  onSaveTemplate,
  onApplyTemplate,
  sourceOntology,
  targetOntology,
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: 'canvas' | 'atoms' | 'templates';
  templates: PipelineTemplate[];
  onSaveTemplate: (name: string, config: PipelineConfig, result: PipelineRunResult) => void;
  onApplyTemplate: (tpl: PipelineTemplate) => void;
  sourceOntology?: string;
  targetOntology?: string;
}) {
  const [config, setConfig] = useState<PipelineConfig>(() => ({
    ...DEFAULT_PIPELINE_CONFIG,
    mappings: cloneMappings(DEFAULT_PIPELINE_CONFIG.mappings),
    sourceOntology: sourceOntology || DEFAULT_PIPELINE_CONFIG.sourceOntology,
    targetOntology: targetOntology || DEFAULT_PIPELINE_CONFIG.targetOntology,
  }));
  const [activeStage, setActiveStage] = useState<PipelineStageId>(initialTab === 'atoms' ? 'text' : 'load');
  const [view, setView] = useState<'pipeline' | 'templates'>(initialTab === 'templates' ? 'templates' : 'pipeline');
  const [running, setRunning] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [pickedTemplateId, setPickedTemplateId] = useState(templates[0]?.id ?? '');
  const [highlightName, setHighlightName] = useState<string | null>(null);
  const [dragAtomId, setDragAtomId] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<PipelineStageId | null>(null);
  const [dropHint, setDropHint] = useState('');
  const [executeError, setExecuteError] = useState('');

  useEffect(() => {
    if (!open) return;
    setView(initialTab === 'templates' ? 'templates' : 'pipeline');
    setActiveStage(initialTab === 'atoms' ? 'text' : 'load');
    setRunning(false);
    setExecuted(false);
  }, [open, initialTab]);

  useEffect(() => {
    if (!highlightName) return;
    const found = templates.find((tpl) => tpl.name === highlightName);
    if (!found) return;
    setPickedTemplateId(found.id);
    setHighlightName(null);
  }, [templates, highlightName]);

  if (!open) return null;

  const patch = (partial: Partial<PipelineConfig>) => setConfig((prev) => ({ ...prev, ...partial }));
  const dragAtom = ATOMS.find((atom) => atom.id === dragAtomId) ?? null;

  const applyDrop = (stageId: PipelineStageId) => {
    const dropped = ATOMS.find((atom) => atom.id === dragAtomId);
    setHoverStage(null);
    setDragAtomId(null);
    if (!dropped) return;
    if (dropped.kind === 'noop') {
      setDropHint('加载本体是固定第一步，拖入不会改变流程');
      return;
    }
    if (dropped.kind === 'text') {
      if (stageId !== 'text') {
        setDropHint('文本匹配与主流程同级，请拖到「加载本体」和「配置映射」之间的文本匹配位置');
        return;
      }
      patch({ useTextMatch: true });
      setActiveStage('text');
      setDropHint('已在主流程中加入「文本匹配」');
      return;
    }
    if (dropped.kind === 'structure') {
      if (stageId !== 'structure') {
        setDropHint('结构匹配与主流程同级，请拖到文本匹配之后、配置映射之前的位置');
        return;
      }
      patch({ useStructureMatch: true });
      setActiveStage('structure');
      setDropHint('已在主流程中加入「结构匹配」');
      return;
    }
    if (stageId !== 'review' || !dropped.policy) {
      setDropHint(`「${dropped.label}」请拖到「人工审核」`);
      return;
    }
    patch({ reviewPolicy: dropped.policy });
    setActiveStage('review');
    setDropHint(`人工审核策略：${dropped.label}`);
  };

  const saveAndRun = () => {
    if (running) return;
    if (!templateName.trim()) {
      setExecuteError('请先填写模版名称');
      return;
    }
    if (config.mappings.length === 0) {
      setExecuteError('请至少配置一对实体映射（含属性）');
      setActiveStage('mapping');
      return;
    }
    setExecuteError('');
    setRunning(true);
    window.setTimeout(() => {
      const result = demoResult(config, nowLabel());
      onSaveTemplate(templateName.trim(), config, result);
      setHighlightName(templateName.trim());
      setTemplateName('');
      setRunning(false);
      setExecuted(true);
      setView('templates');
    }, 700);
  };

  const picked = templates.find((tpl) => tpl.id === pickedTemplateId) ?? templates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-[1120px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3.5">
          <GitMerge className="h-4 w-4 text-blue-600" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">本体匹配流程组件</div>
            <div className="text-[11px] text-gray-400">文本/结构匹配拖到主流程对应空位，成为同级步骤；配置映射只配置实体对应关系</div>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
            {([
              ['pipeline', '流水线'],
              ['templates', '流程模版管理'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`rounded-md px-3 py-1 text-xs ${view === id ? 'bg-white font-medium text-blue-600 shadow-sm' : 'text-gray-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {view === 'pipeline' ? (
          <div className="flex min-h-0 flex-1">
            <aside className="w-44 flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-slate-50 px-3 py-3">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-400">原子组件库</div>
              <p className="mb-3 text-[10px] leading-relaxed text-gray-400">拖到画布上的对应位置。加载本体仅展示。</p>
              {ATOM_GROUPS.map((group) => (
                <div key={group} className="mb-3">
                  <div className="mb-1 text-[10px] text-gray-500">{group}</div>
                  <div className="space-y-1">
                    {ATOMS.filter((atom) => atom.group === group).map((atom) => (
                      <div
                        key={atom.id}
                        draggable
                        onDragStart={() => { setDragAtomId(atom.id); setDropHint(''); }}
                        onDragEnd={() => { setDragAtomId(null); setHoverStage(null); }}
                        className={`rounded-md border px-2 py-1.5 text-[11px] ${
                          atom.kind === 'noop'
                            ? 'cursor-grab border-dashed border-gray-200 bg-gray-50 text-gray-400'
                            : 'cursor-grab border-gray-200 bg-white text-gray-700 active:cursor-grabbing'
                        }`}
                      >
                        {atom.label}
                        {atom.kind === 'noop' && <div className="text-[10px] text-gray-400">固定第一步</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <div
                className="relative h-[188px] flex-shrink-0 overflow-hidden border-b border-gray-100"
                style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '16px 16px', backgroundColor: '#f8fafc' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropHint('请拖到对应步骤的位置，不能在空白处新建节点');
                  setDragAtomId(null);
                  setHoverStage(null);
                }}
              >
                <div className="absolute left-3 top-2 text-[11px] font-medium text-slate-500">可视化流程画布</div>
                <div className="absolute inset-x-3 top-9 flex items-stretch gap-2">
                  {FLOW.map((stage, index) => {
                    const on = blockEnabled(config, stage.id);
                    const selected = activeStage === stage.id;
                    const hot = hoverStage === stage.id;
                    const compatible = dragAtom
                      ? (dragAtom.kind === 'text' && stage.id === 'text')
                        || (dragAtom.kind === 'structure' && stage.id === 'structure')
                        || (dragAtom.kind === 'review' && stage.id === 'review')
                      : false;
                    return (
                      <div key={stage.id} className="flex min-w-0 flex-1 items-center gap-2">
                        <div
                          key={stage.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveStage(stage.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setActiveStage(stage.id); }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setHoverStage(stage.id);
                          }}
                          onDragLeave={() => setHoverStage((prev) => (prev === stage.id ? null : prev))}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            applyDrop(stage.id);
                          }}
                          className={`relative min-w-0 flex-1 cursor-pointer rounded-xl border px-2.5 py-2.5 text-left ${
                            !on
                              ? 'border-dashed border-gray-300 bg-white/70'
                              : hot && compatible
                                ? 'border-blue-500 bg-white ring-2 ring-blue-200'
                                : hot && dragAtom && !compatible
                                  ? 'border-red-300 bg-white ring-2 ring-red-100'
                                  : selected
                                    ? 'border-blue-400 bg-white ring-2 ring-blue-100'
                                    : 'border-gray-200 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                              executed && on ? 'bg-green-100 text-green-700' : on ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {executed && on ? <Check className="h-3 w-3" /> : index + 1}
                            </span>
                            <span className={`truncate text-xs font-medium ${on ? 'text-gray-800' : 'text-gray-400'}`}>{stage.label}</span>
                            {stage.optional && on && (
                              <span
                                role="presentation"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (stage.id === 'text') patch({ useTextMatch: false });
                                  if (stage.id === 'structure') patch({ useStructureMatch: false });
                                }}
                                className="ml-auto text-gray-300 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <div className="mt-1 truncate text-[10px] text-gray-400">{stageCaption(config, stage.id)}</div>
                        </div>
                        {index < FLOW.length - 1 && <span className="text-gray-300">→</span>}
                      </div>
                    );
                  })}
                </div>
                {dropHint && <div className="absolute bottom-2 left-3 right-3 truncate text-[10px] text-gray-500">{dropHint}</div>}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {activeStage === 'load' && (
                  <StagePanel title="加载本体" desc="第一步固定加载源本体与目标本体，组件库中的同名卡片拖入无效。">
                    <Field label="源本体">
                      <select value={config.sourceOntology} onChange={(e) => patch({ sourceOntology: e.target.value })} className={selectCls}>
                        <option>科研知识图谱 v2.1</option>
                        <option>医疗本体 v1.0</option>
                      </select>
                    </Field>
                    <Field label="目标本体">
                      <select value={config.targetOntology} onChange={(e) => patch({ targetOntology: e.target.value })} className={selectCls}>
                        <option>W3C SOSA Ontology</option>
                        <option>Schema.org</option>
                        <option>Dublin Core</option>
                      </select>
                    </Field>
                    <Field label="参与范围">
                      <select value={config.scope} onChange={(e) => patch({ scope: e.target.value as PipelineConfig['scope'] })} className={selectCls}>
                        <option value="checked">已勾选子集</option>
                        <option value="starred">仅核心概念</option>
                        <option value="all">全部实体类</option>
                      </select>
                    </Field>
                  </StagePanel>
                )}

                {activeStage === 'text' && (
                  <StagePanel
                    title="文本匹配"
                    desc={config.useTextMatch
                      ? '已作为主流程同级步骤，位于加载本体之后。不再拆成具体算法。'
                      : '从左侧拖到画布上的「文本匹配」空位，即可加入主流程。不会挂进配置映射。'}
                  >
                    {config.useTextMatch && (
                      <button type="button" onClick={() => patch({ useTextMatch: false })} className="w-fit rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600">
                        从流程中移除
                      </button>
                    )}
                  </StagePanel>
                )}

                {activeStage === 'structure' && (
                  <StagePanel
                    title="结构匹配"
                    desc={config.useStructureMatch
                      ? '已作为主流程同级步骤，位于文本匹配之后、配置映射之前。'
                      : '从左侧拖到画布上的「结构匹配」空位加入主流程。'}
                  >
                    {config.useStructureMatch && (
                      <button type="button" onClick={() => patch({ useStructureMatch: false })} className="w-fit rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600">
                        从流程中移除
                      </button>
                    )}
                  </StagePanel>
                )}

                {activeStage === 'mapping' && (
                  <StagePanel title="配置映射" desc="先对齐实体类，再配置属性映射。属性名往往不一致（如「所属机构」↔ affiliation），需显式指定，不必一一同名对应。">
                    <div className="space-y-3">
                      {config.mappings.map((row) => {
                        const srcAttrs = SOURCE_ATTRS[row.source as keyof typeof SOURCE_ATTRS] ?? ['名称'];
                        const tgtAttrs = TARGET_ATTRS[row.target as keyof typeof TARGET_ATTRS] ?? ['name'];
                        return (
                          <div key={row.id} className="rounded-xl border border-gray-200 bg-white p-3 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-10 flex-shrink-0">实体</span>
                              <select
                                value={row.source}
                                onChange={(e) => {
                                  const source = e.target.value;
                                  patch({
                                    mappings: config.mappings.map((item) => item.id === row.id
                                      ? { ...item, source, attributes: defaultAttrs(source, item.target) }
                                      : item),
                                  });
                                }}
                                className={selectCls}
                              >
                                {SOURCE_CLASSES.map((name) => <option key={name}>{name}</option>)}
                              </select>
                              <span className="text-xs text-gray-400">→</span>
                              <select
                                value={row.target}
                                onChange={(e) => {
                                  const target = e.target.value;
                                  patch({
                                    mappings: config.mappings.map((item) => item.id === row.id
                                      ? { ...item, target, attributes: defaultAttrs(item.source, target) }
                                      : item),
                                  });
                                }}
                                className={selectCls}
                              >
                                {TARGET_CLASSES.map((name) => <option key={name}>{name}</option>)}
                              </select>
                              <button
                                type="button"
                                onClick={() => patch({ mappings: config.mappings.filter((item) => item.id !== row.id) })}
                                className="text-gray-300 hover:text-red-500"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2.5 py-2 space-y-1.5">
                              <div className="text-[10px] text-gray-400">属性映射（可不一一同名）</div>
                              {row.attributes.map((attr) => (
                                <div key={attr.id} className="flex items-center gap-2">
                                  <select
                                    value={attr.sourceAttr}
                                    onChange={(e) => patch({
                                      mappings: config.mappings.map((item) => item.id !== row.id ? item : {
                                        ...item,
                                        attributes: item.attributes.map((a) => a.id === attr.id ? { ...a, sourceAttr: e.target.value } : a),
                                      }),
                                    })}
                                    className={selectCls}
                                  >
                                    {srcAttrs.map((name) => <option key={name}>{name}</option>)}
                                  </select>
                                  <span className="text-[10px] text-gray-400">→</span>
                                  <select
                                    value={attr.targetAttr}
                                    onChange={(e) => patch({
                                      mappings: config.mappings.map((item) => item.id !== row.id ? item : {
                                        ...item,
                                        attributes: item.attributes.map((a) => a.id === attr.id ? { ...a, targetAttr: e.target.value } : a),
                                      }),
                                    })}
                                    className={selectCls}
                                  >
                                    {tgtAttrs.map((name) => <option key={name}>{name}</option>)}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => patch({
                                      mappings: config.mappings.map((item) => item.id !== row.id ? item : {
                                        ...item,
                                        attributes: item.attributes.filter((a) => a.id !== attr.id),
                                      }),
                                    })}
                                    className="text-gray-300 hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => patch({
                                  mappings: config.mappings.map((item) => item.id !== row.id ? item : {
                                    ...item,
                                    attributes: [
                                      ...item.attributes,
                                      {
                                        id: `a-${Date.now()}`,
                                        sourceAttr: srcAttrs[0],
                                        targetAttr: tgtAttrs[Math.min(1, tgtAttrs.length - 1)],
                                      },
                                    ],
                                  }),
                                })}
                                className="text-[11px] text-blue-600"
                              >
                                + 添加属性映射
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => patch({
                          mappings: [
                            ...config.mappings,
                            {
                              id: `m-${Date.now()}`,
                              source: SOURCE_CLASSES[0],
                              target: TARGET_CLASSES[0],
                              attributes: defaultAttrs(SOURCE_CLASSES[0], TARGET_CLASSES[0]),
                            },
                          ],
                        })}
                        className="text-xs text-blue-600"
                      >
                        + 添加实体映射
                      </button>
                    </div>
                  </StagePanel>
                )}

                {activeStage === 'review' && (
                  <StagePanel title="人工审核" desc="审核策略属于执行前配置。用左侧三张卡片拖到本步骤，或在下方直接选择。">
                    <StrategyCards
                      value={config.reviewPolicy}
                      onChange={(reviewPolicy) => patch({ reviewPolicy: reviewPolicy as PipelineConfig['reviewPolicy'] })}
                      options={[
                        { id: 'auto-high', label: '高分自动通过', desc: '高于阈值直接采纳' },
                        { id: 'sample', label: '抽样复核', desc: '自动通过后抽查' },
                        { id: 'all-manual', label: '全部人工', desc: '映射全部进入审核' },
                      ]}
                    />
                    <Threshold
                      label="自动通过阈值"
                      value={config.reviewThreshold}
                      onChange={(reviewThreshold) => patch({ reviewThreshold })}
                      min={0.6}
                    />
                  </StagePanel>
                )}

                {activeStage === 'execute' && (
                  <StagePanel title="执行流程" desc="汇总前面各步配置（含映射与审核策略）。保存为模版并执行后，到「流程模版管理」查看三元组、冲突和待审核条目。">
                    <div className="space-y-1 rounded-xl border border-gray-100 bg-slate-50 px-3 py-2.5 text-xs text-gray-600">
                      <div>本体：{config.sourceOntology} → {config.targetOntology}</div>
                      <div>
                        步骤：加载本体
                        {config.useTextMatch ? ' → 文本匹配' : ''}
                        {config.useStructureMatch ? ' → 结构匹配' : ''}
                        {' → 配置映射 → 人工审核 → 执行流程'}
                      </div>
                      <div>
                        映射：{config.mappings.map((m) => `${m.source}→${m.target}（${m.attributes.length} 属性）`).join('、') || '无'}
                      </div>
                      <div>审核：{stageCaption(config, 'review')} · 阈值 {config.reviewThreshold.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="模版名称"
                        className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={saveAndRun}
                        disabled={running}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs text-white disabled:opacity-50"
                      >
                        {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                        {running ? '执行中…' : '保存模版并执行'}
                      </button>
                    </div>
                    {executeError && <p className="text-xs text-red-600">{executeError}</p>}
                  </StagePanel>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto border-r border-gray-100 px-3 py-3">
              <p className="text-[11px] text-gray-500">每次「保存模版并执行」都会留下任务结果。</p>
              {templates.map((tpl) => {
                const on = picked?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setPickedTemplateId(tpl.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left ${on ? 'border-blue-400 bg-blue-50/60' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-medium text-gray-800">{tpl.name}</span>
                      {on && <CheckCircle2 className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-blue-600" />}
                    </div>
                    <div className="mt-1 text-[10px] text-gray-400">{tpl.savedAt}{tpl.result ? ` · 执行于 ${tpl.result.executedAt}` : ' · 未执行'}</div>
                  </button>
                );
              })}
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
              {picked?.result ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{picked.name}</div>
                    <p className="mt-1 text-xs text-gray-500">
                      {picked.config.sourceOntology} → {picked.config.targetOntology}
                      {' · '}
                      {picked.config.mappings.map((m) => `${m.source}→${m.target}（${m.attributes.length}属）`).join('、')}
                    </p>
                  </div>
                  <ResultBlock title={`三元组 · ${picked.result.triples.length}`}>
                    {picked.result.triples.map((triple, index) => (
                      <div key={`${triple.subject}-${index}`} className="font-mono text-[11px] text-gray-700">
                        {triple.subject} {triple.predicate} {triple.object}
                      </div>
                    ))}
                  </ResultBlock>
                  <ResultBlock title={`冲突检测 · ${picked.result.conflicts.length}`}>
                    {picked.result.conflicts.map((item) => (
                      <div key={item.id} className="text-[11px] text-gray-700">
                        <span className="mr-1 rounded bg-amber-50 px-1 text-amber-700">{item.type}</span>
                        {item.triple}
                        <span className="text-gray-400"> ≠ {item.existing}</span>
                      </div>
                    ))}
                  </ResultBlock>
                  <ResultBlock title={`人工审核 · ${picked.result.reviews.filter((item) => item.status === '待审核').length} 待审`}>
                    {picked.result.reviews.map((item) => (
                      <div key={`${item.src}-${item.tgt}`} className="flex items-center gap-2 text-[11px] text-gray-700">
                        <span>{item.src} → {item.tgt}</span>
                        <span className="text-gray-400">{item.relation}</span>
                        <span className={item.status === '待审核' ? 'text-amber-600' : 'text-green-600'}>{item.status}</span>
                      </div>
                    ))}
                  </ResultBlock>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-400">该模版还没有执行结果</div>
              )}
            </div>
          </div>
        )}

        {view === 'templates' && (
          <div className="flex justify-end border-t border-gray-200 px-5 py-3">
            <button
              type="button"
              disabled={!picked}
              onClick={() => {
                if (!picked) return;
                setConfig({
                  ...picked.config,
                  mappings: cloneMappings(picked.config.mappings),
                });
                onApplyTemplate(picked);
                setView('pipeline');
                setActiveStage('load');
                setExecuted(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs text-white disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" />
              用此模版预填
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const selectCls = 'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800';

function StagePanel({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        <p className="mt-1 text-xs text-gray-500">{desc}</p>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
        <Settings2 className="h-3 w-3 text-gray-400" />
        {label}
      </span>
      {children}
    </label>
  );
}

function StrategyCards({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (id: string) => void;
  options: Array<{ id: string; label: string; desc: string }>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const on = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-xl border px-3 py-2.5 text-left ${on ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-xs font-medium text-gray-800">{opt.label}</div>
            <div className="mt-0.5 text-[10px] text-gray-400">{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function Threshold({
  label,
  value,
  onChange,
  min = 0.5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
        <Sliders className="h-3 w-3 text-gray-400" />
        {label}
        <span className="ml-auto font-mono text-gray-800">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={0.95}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
    </label>
  );
}

function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200">
      <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-800">{title}</div>
      <div className="space-y-1.5 px-3 py-2">{children}</div>
    </div>
  );
}
