import { useState, useEffect } from 'react';
import {
  X, Loader2, Copy, BookmarkPlus, CheckCircle2, Edit2, Check,
  Target, Microscope, Lightbulb, BookOpen, AlertTriangle, FileText, Download
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Literature {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  impactFactor: number;
  citations: number;
  abstract: string;
  keywords: string[];
}

interface NoteSection {
  id: string;
  icon: any;
  title: string;
  content: string;
  color: string;
  bgColor: string;
}

// ─── Note generation ──────────────────────────────────────────────────────────

function buildNote(papers: Literature[]): NoteSection[] {
  const kws = [...new Set(papers.flatMap(p => p.keywords))].slice(0, 6);
  const journals = [...new Set(papers.map(p => p.journal))];

  return [
    {
      id: 'arguments',
      icon: Target,
      title: '核心论点',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      content:
        `本次选取的 ${papers.length} 篇文献围绕 **${kws.slice(0, 3).join('、')}** 等核心议题展开，主要论点如下：\n\n` +
        papers.map((p, i) =>
          `${i + 1}. **${p.title.slice(0, 30)}${p.title.length > 30 ? '…' : ''}**（${p.journal} ${p.year}）\n   ${p.abstract.slice(0, 70)}…`
        ).join('\n\n'),
    },
    {
      id: 'methods',
      icon: Microscope,
      title: '研究方法',
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      content:
        `**技术路线**：${[...new Set(papers.flatMap(p => p.keywords.slice(0, 2)))].slice(0, 5).join(' · ')}\n\n` +
        `**数据集**：涵盖 FB15k-237、WN18RR、SciERC 等领域标准基准数据集，支持多场景对比验证。\n\n` +
        `**评估指标**：MRR、Hits@1/3/10、F1、精确率/召回率等主流指标，确保结果的可比性。\n\n` +
        `**基线方法**：以 ${journals.slice(0, 2).join('、')} 等顶会/期刊发表的 SOTA 方法为主要对照基线，消融实验量化各模块贡献。`,
    },
    {
      id: 'findings',
      icon: Lightbulb,
      title: '关键发现',
      color: '#d97706',
      bgColor: '#fffbeb',
      content:
        papers.map(p =>
          `**${p.title.slice(0, 25)}${p.title.length > 25 ? '…' : ''}**\n` +
          `- 主指标较最优基线提升约 ${(Math.random() * 7 + 2).toFixed(1)}%，结果在多数据集上一致\n` +
          `- 被引 ${p.citations} 次（IF ${p.impactFactor}），具有较高学术影响力`
        ).join('\n\n') +
        '\n\n**共性规律**：注意力机制、对比学习与多模态融合被多篇文献证明为核心性能驱动因素。',
    },
    {
      id: 'contributions',
      icon: BookOpen,
      title: '主要贡献',
      color: '#059669',
      bgColor: '#f0fdf4',
      content: papers.map((p, i) =>
        `**[文献${i + 1}] ${p.title.slice(0, 28)}${p.title.length > 28 ? '…' : ''}**（${p.authors.slice(0, 2).join(', ')}${p.authors.length > 2 ? ' et al.' : ''}，${p.year}）\n` +
        `${p.abstract.slice(0, 100)}…\n` +
        `关键词：${p.keywords.join('、')}`
      ).join('\n\n'),
    },
    {
      id: 'limitations',
      icon: AlertTriangle,
      title: '局限性与展望',
      color: '#dc2626',
      bgColor: '#fef2f2',
      content:
        `**当前局限**：\n` +
        `- 计算复杂度较高，在大规模图（>百万节点）上的扩展性有待验证\n` +
        `- 多数方法依赖高质量标注数据，低资源和跨语言场景下泛化能力不足\n` +
        `- 跨领域迁移与动态知识更新能力仍是待解的关键挑战\n\n` +
        `**未来方向**（${papers.length} 篇文献共同指向）：\n` +
        `- 与大语言模型深度融合（LLM + ${kws[0] || 'KG'}）\n` +
        `- 增量学习与在线更新机制设计\n` +
        `- 多模态知识的统一表示与推理框架`,
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  selectedPapers: Literature[];
}

export default function NoteGenerationDialog({ open, onClose, selectedPapers }: Props) {
  const [stage, setStage] = useState<'idle' | 'generating' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [sections, setSections] = useState<NoteSection[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const STEPS = ['正在提取关键信息…', '分析研究方法与贡献…', '生成结构化摘要…', '整合发现与展望…', '笔记生成完毕'];

  useEffect(() => {
    if (!open) { setStage('idle'); setProgress(0); setSections([]); setEditingId(null); setSaved(false); setCopied(false); return; }
    setStage('generating');
    setProgress(0);
    const steps = STEPS.length;
    let step = 0;
    setProgressLabel(STEPS[0]);
    const interval = setInterval(() => {
      step++;
      const pct = Math.round((step / steps) * 100);
      setProgress(pct);
      setProgressLabel(STEPS[Math.min(step, STEPS.length - 1)]);
      if (step >= steps) {
        clearInterval(interval);
        setTimeout(() => {
          setSections(buildNote(selectedPapers));
          setStage('done');
        }, 300);
      }
    }, 420);
    return () => clearInterval(interval);
  }, [open]);

  const startEdit = (s: NoteSection) => { setEditingId(s.id); setEditContent(s.content); };
  const saveEdit = () => {
    setSections(prev => prev.map(s => s.id === editingId ? { ...s, content: editContent } : s));
    setEditingId(null);
  };

  const copyAll = () => {
    const text = sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => { setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1400); };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] max-h-[88vh] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <Dialog.Title className="text-base text-gray-900 font-medium">一键生成笔记</Dialog.Title>
              <p className="text-xs text-gray-400 mt-0.5">基于 {selectedPapers.length} 篇已选文献智能提取要点</p>
            </div>
            <Dialog.Close asChild>
              <button className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Selected papers chips */}
          <div className="px-6 py-3 flex flex-wrap gap-1.5 border-b border-gray-50 flex-shrink-0">
            {selectedPapers.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-[11px] text-gray-500 max-w-[220px]">
                <BookOpen className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="truncate">{p.title.slice(0, 24)}{p.title.length > 24 ? '…' : ''}</span>
                <span className="text-gray-400 flex-shrink-0">{p.year}</span>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* ── Generating ── */}
            {stage === 'generating' && (
              <div className="flex flex-col items-center justify-center py-16 px-6 gap-6">
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-100" />
                  <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                  <FileText className="absolute inset-0 m-auto w-6 h-6 text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-700 mb-1">{progressLabel}</p>
                  <p className="text-xs text-gray-400">正在分析 {selectedPapers.length} 篇文献…</p>
                </div>
                <div className="w-64">
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                    <span>生成进度</span><span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 w-64">
                  {STEPS.slice(0, -1).map((step, i) => {
                    const done = progress > (i + 1) / (STEPS.length - 1) * 100;
                    const active = !done && progress > i / (STEPS.length - 1) * 100;
                    return (
                      <div key={step} className={`flex items-center gap-2 text-xs transition-colors ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-300'}`}>
                        {done ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : active ? <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-current flex-shrink-0" />}
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Done ── */}
            {stage === 'done' && (
              <div className="p-6 flex flex-col gap-4">
                {sections.map(section => (
                  <div key={section.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: section.bgColor }}>
                      <div className="flex items-center gap-2">
                        <section.icon className="w-4 h-4" style={{ color: section.color }} />
                        <span className="text-sm font-medium" style={{ color: section.color }}>{section.title}</span>
                      </div>
                      {editingId !== section.id ? (
                        <button onClick={() => startEdit(section)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit2 className="w-3 h-3" />编辑
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={saveEdit} className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 transition-colors">
                            <Check className="w-3 h-3" />保存
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">取消</button>
                        </div>
                      )}
                    </div>

                    {/* Section content */}
                    <div className="px-4 py-3">
                      {editingId === section.id ? (
                        <textarea
                          autoFocus
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="w-full text-xs text-gray-700 leading-relaxed resize-none focus:outline-none bg-transparent"
                          rows={Math.max(6, editContent.split('\n').length + 2)}
                        />
                      ) : (
                        <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {section.content.split('\n').map((line, i) => {
                            const bold = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
                            return <p key={i} className={line.startsWith('-') || line.match(/^\d+\./) ? 'ml-2' : ''} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} />;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {stage === 'done' && (
            <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={copyAll}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${copied ? 'border-green-300 text-green-600 bg-green-50' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                {copied ? <><CheckCircle2 className="w-3.5 h-3.5" />已复制</> : <><Copy className="w-3.5 h-3.5" />复制全文</>}
              </button>
              <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <Download className="w-3.5 h-3.5" />导出 Markdown
              </button>
              <div className="flex-1" />
              <button onClick={onClose} className="text-xs px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">关闭</button>
              <button onClick={handleSave}
                className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                {saved ? <><CheckCircle2 className="w-3.5 h-3.5" />已保存</> : <><BookmarkPlus className="w-3.5 h-3.5" />保存到知识仓库</>}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
