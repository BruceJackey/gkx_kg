import { useState, useMemo, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Upload, Search, FolderOpen, FolderClosed, Plus, X,
  FileText, ScrollText, StickyNote, BookOpen, Cpu, GalleryHorizontal,
  ChevronRight, ChevronDown, MoreVertical, Trash2, Edit2, FolderPlus,
  Check, TrendingUp, Quote, Loader2, Tag, ChevronUp, CheckCircle2, Sparkles, Link,
  Workflow, Play, Power,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocType = '文献' | '专利' | '笔记';
type DocFormat = 'PDF' | 'XML' | 'HTML' | 'TXT';
type DocStatus = 'ready' | 'processing' | 'parsing';

interface KnowledgeDoc {
  id: string; type: DocType; format: DocFormat; title: string;
  authors?: string[]; journal?: string; year?: number;
  impactFactor?: number; citations?: number; doi?: string;
  patentNumber?: string; applicant?: string; filingDate?: string;
  abstract?: string; tags: string[]; folderId: string;
  uploadedAt: string; status: DocStatus;
  metadataAutoFilled?: boolean;
  autoArchivedBy?: string;
}

interface Folder {
  id: string; name: string; parentId?: string; color: string;
}

type RuleField = 'title' | 'tags' | 'authors' | 'journal' | 'abstract' | 'type' | 'doi';
type RuleOp = 'contains' | 'not_contains' | 'equals' | 'starts_with';

interface ArchiveRule {
  id: string;
  enabled: boolean;
  ifField: RuleField;
  ifOp: RuleOp;
  ifValue: string;
  thenFolderId: string;
}

const RULE_FIELDS: { id: RuleField; label: string }[] = [
  { id: 'title', label: '标题' },
  { id: 'tags', label: '标签' },
  { id: 'authors', label: '作者' },
  { id: 'journal', label: '期刊' },
  { id: 'abstract', label: '摘要' },
  { id: 'type', label: '类型' },
  { id: 'doi', label: 'DOI' },
];

const RULE_OPS: { id: RuleOp; label: string }[] = [
  { id: 'contains', label: '包含' },
  { id: 'not_contains', label: '不包含' },
  { id: 'equals', label: '等于' },
  { id: 'starts_with', label: '开头是' },
];

function fieldLabel(id: RuleField) {
  return RULE_FIELDS.find(f => f.id === id)?.label ?? id;
}
function opLabel(id: RuleOp) {
  return RULE_OPS.find(o => o.id === id)?.label ?? id;
}

function getDocFieldText(doc: KnowledgeDoc, field: RuleField): string {
  switch (field) {
    case 'title': return doc.title ?? '';
    case 'tags': return (doc.tags ?? []).join(' ');
    case 'authors': return (doc.authors ?? []).join(' ');
    case 'journal': return doc.journal ?? '';
    case 'abstract': return doc.abstract ?? '';
    case 'type': return doc.type ?? '';
    case 'doi': return doc.doi ?? '';
  }
}

function matchArchiveRule(doc: KnowledgeDoc, rule: ArchiveRule): boolean {
  if (!rule.enabled || !rule.ifValue.trim() || !rule.thenFolderId) return false;
  const raw = getDocFieldText(doc, rule.ifField);
  const hay = raw.toLowerCase();
  const needle = rule.ifValue.trim().toLowerCase();
  switch (rule.ifOp) {
    case 'contains': return hay.includes(needle);
    case 'not_contains': return !hay.includes(needle);
    case 'equals': return hay === needle;
    case 'starts_with': return hay.startsWith(needle);
  }
}

/** First matching enabled rule wins. */
function applyArchiveRules(doc: KnowledgeDoc, rules: ArchiveRule[]): ArchiveRule | null {
  return rules.find(r => matchArchiveRule(doc, r)) ?? null;
}

interface UploadFile {
  id: string; file: File; progress: number; done: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extToFormat = (name: string): DocFormat => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xml') return 'XML';
  if (ext === 'html') return 'HTML';
  if (ext === 'txt') return 'TXT';
  return 'PDF';
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const initFolders: Folder[] = [
  { id: 'f1', name: '知识图谱研究', color: '#3b82f6' },
  { id: 'f2', name: '自然语言处理', color: '#8b5cf6' },
  { id: 'f3', name: '专利库', color: '#f59e0b' },
  { id: 'f3a', name: 'AI专利', parentId: 'f3', color: '#f59e0b' },
  { id: 'f3b', name: '医疗专利', parentId: 'f3', color: '#ef4444' },
  { id: 'f4', name: '高影响力文献', color: '#10b981' },
  { id: 'f5', name: '人工智能', color: '#6366f1' },
];

const initArchiveRules: ArchiveRule[] = [
  { id: 'ar1', enabled: true, ifField: 'title', ifOp: 'contains', ifValue: 'AI', thenFolderId: 'f5' },
  { id: 'ar2', enabled: false, ifField: 'title', ifOp: 'contains', ifValue: '知识图谱', thenFolderId: 'f1' },
  { id: 'ar3', enabled: false, ifField: 'journal', ifOp: 'equals', ifValue: 'Nature', thenFolderId: 'f4' },
];

const initDocs: KnowledgeDoc[] = [
  {
    id: 'd1', type: '文献', format: 'PDF', title: '基于Transformer的知识图谱嵌入方法研究',
    authors: ['张明', '李华', '王强'], journal: 'IEEE TKDE', year: 2024,
    impactFactor: 8.9, citations: 142, doi: '10.1109/TKDE.2024.001',
    tags: ['知识图谱', 'Transformer', '嵌入'],
    folderId: 'f1', uploadedAt: '2026-06-01', status: 'ready',
    abstract: '本文提出了一种新的基于Transformer架构的知识图谱嵌入方法，有效解决了传统方法在长距离依赖建模方面的不足。实验结果表明，该方法在多个标准知识图谱补全数据集上均取得了优于现有方法的性能。',
  },
  {
    id: 'd2', type: '文献', format: 'XML', title: 'Large Language Models for Scientific Knowledge Extraction',
    authors: ['Chen Wei', 'Liu Yang'], journal: 'NeurIPS', year: 2024,
    impactFactor: 12.4, citations: 389, doi: '10.5555/NeurIPS.2024.002',
    tags: ['LLM', 'NLP', '知识抽取'],
    folderId: 'f2', uploadedAt: '2026-06-03', status: 'ready',
    abstract: 'We present a comprehensive study on leveraging large language models for automated scientific knowledge extraction from research papers.',
  },
  {
    id: 'd3', type: '文献', format: 'HTML', title: '面向科研领域的知识图谱构建与应用综述',
    authors: ['刘芳', '陈志远'], journal: 'ACM SIGKDD', year: 2023,
    impactFactor: 7.2, citations: 256,
    tags: ['知识图谱', '综述'],
    folderId: 'f1', uploadedAt: '2026-06-05', status: 'ready',
    abstract: '本文系统综述了近年来面向科研领域的知识图谱构建技术与应用场景。',
  },
  {
    id: 'd4', type: '专利', format: 'PDF', title: '一种基于深度学习的知识图谱自动构建方法及装置',
    applicant: '清华大学', patentNumber: 'CN202410012345A', filingDate: '2024-02-18',
    tags: ['知识图谱', '深度学习', '自动构建'],
    folderId: 'f3a', uploadedAt: '2026-06-07', status: 'ready',
    abstract: '本发明涉及一种基于深度学习的知识图谱自动构建方法，包括知识抽取、融合和存储三个核心模块。',
  },
  {
    id: 'd5', type: '专利', format: 'TXT', title: '多模态语义理解装置及其专利技术方案分析系统',
    applicant: '北京人工智能研究院', patentNumber: 'CN202310987654B', filingDate: '2023-11-05',
    tags: ['多模态', '语义理解'],
    folderId: 'f3a', uploadedAt: '2026-06-08', status: 'ready',
    abstract: '本发明涉及多模态语义理解装置，能够处理图像、文本、表格等多种模态的专利文件内容。',
  },
  {
    id: 'd6', type: '文献', format: 'PDF', title: 'Graph Neural Networks for Biomedical Knowledge Discovery',
    authors: ['Smith J', 'Johnson M'], journal: 'Nature', year: 2024,
    impactFactor: 69.5, citations: 1203, doi: '10.1038/nature.2024.004',
    tags: ['GNN', '生物医学', 'Nature'],
    folderId: 'f4', uploadedAt: '2026-06-10', status: 'ready',
    abstract: 'This paper introduces a novel graph neural network architecture specifically designed for biomedical knowledge discovery.',
  },
  {
    id: 'd7', type: '文献', format: 'PDF', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Lewis P', 'Perez E'], journal: 'NeurIPS', year: 2022,
    impactFactor: 12.4, citations: 2341, doi: '10.48550/NeurIPS.2022.013',
    tags: ['RAG', 'NLP', '检索增强'],
    folderId: 'f2', uploadedAt: '2026-06-02', status: 'ready',
    abstract: 'We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) for knowledge-intensive NLP tasks.',
  },
  {
    id: 'd8', type: '专利', format: 'PDF', title: '医学知识图谱辅助临床决策系统及其数据处理方法',
    applicant: '中科院医学信息研究所', patentNumber: 'CN202211234567A', filingDate: '2022-09-15',
    tags: ['医疗', '临床决策', '知识图谱'],
    folderId: 'f3b', uploadedAt: '2026-06-11', status: 'ready',
    abstract: '本发明提供一种医学知识图谱辅助临床决策系统，通过整合疾病、症状、药物等知识实体。',
  },
  {
    id: 'd9', type: '笔记', format: 'TXT', title: '知识图谱领域2024年研究进展整理',
    tags: ['知识图谱', '研究笔记'],
    folderId: 'f1', uploadedAt: '2026-06-15', status: 'ready',
    abstract: '整理了2024年知识图谱领域的主要研究进展，包括嵌入方法、推理、多模态等方向。',
  },
];

const TYPE_CONFIG: Record<DocType, { icon: any; color: string; bg: string; border: string; label: string }> = {
  '文献': { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: '文献' },
  '专利': { icon: ScrollText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: '专利' },
  '笔记': { icon: StickyNote, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: '笔记' },
};

const FORMAT_COLORS: Record<DocFormat, string> = {
  PDF: 'bg-red-100 text-red-600',
  XML: 'bg-orange-100 text-orange-600',
  HTML: 'bg-blue-100 text-blue-600',
  TXT: 'bg-gray-100 text-gray-500',
};

const SORT_OPTIONS = ['最近上传', '标题', '影响因子', '引用数'] as const;

// ─── AI Badge ─────────────────────────────────────────────────────────────────

function AIBadge() {
  return (
    <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded ml-1 font-medium">AI</span>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (files: File[]) => void;
}

function UploadModal({ open, onOpenChange, onUploadComplete }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !existing.has(f.name))];
    });
  };

  const removeFile = (name: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const startUpload = () => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    const items: UploadFile[] = selectedFiles.map(f => ({ id: uid(), file: f, progress: 0, done: false }));
    setUploadItems(items);

    let completedCount = 0;
    items.forEach(item => {
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 20 + 10;
        if (p >= 100) {
          p = 100;
          clearInterval(iv);
          setUploadItems(prev => prev.map(u => u.id === item.id ? { ...u, progress: 100, done: true } : u));
          completedCount++;
          if (completedCount === items.length) {
            setTimeout(() => {
              onUploadComplete(selectedFiles);
              onOpenChange(false);
              // reset state after close
              setTimeout(() => {
                setSelectedFiles([]);
                setUploadItems([]);
                setIsUploading(false);
              }, 300);
            }, 600);
          }
        } else {
          setUploadItems(prev => prev.map(u => u.id === item.id ? { ...u, progress: Math.floor(p) } : u));
        }
      }, 80);
    });
  };

  const handleOpenChange = (v: boolean) => {
    if (!isUploading) {
      onOpenChange(v);
      if (!v) {
        setTimeout(() => { setSelectedFiles([]); setUploadItems([]); }, 300);
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[520px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col outline-none">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <Dialog.Title className="text-base font-semibold text-gray-900">上传文档</Dialog.Title>
            <Dialog.Close asChild>
              <button disabled={isUploading} className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 min-h-0">

            {!isUploading ? (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-10 gap-3 transition-colors cursor-default
                    ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Upload className={`w-7 h-7 transition-colors ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium transition-colors ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>拖拽文件到此处</p>
                    <p className="text-xs text-gray-400 mt-1">支持 PDF · XML · HTML · TXT</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    或点击选择文件
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.xml,.html,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Selected files list */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-gray-500 font-medium">已选择 {selectedFiles.length} 个文件</p>
                    {selectedFiles.map(f => (
                      <div key={f.name} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{f.name}</p>
                          <p className="text-[11px] text-gray-400">{formatBytes(f.size || Math.floor(Math.random() * 5 * 1024 * 1024 + 200 * 1024))}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${FORMAT_COLORS[extToFormat(f.name)]}`}>
                          {extToFormat(f.name)}
                        </span>
                        <button onClick={() => removeFile(f.name)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Upload progress */
              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-500 font-medium">正在上传...</p>
                {uploadItems.map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    {u.done
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate">{u.file.name}</span>
                        <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">{u.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-100 ${u.done ? 'bg-green-400' : 'bg-blue-500'}`}
                          style={{ width: `${u.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isUploading && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  取消
                </button>
              </Dialog.Close>
              <button
                onClick={startUpload}
                disabled={selectedFiles.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                开始上传
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Archive Rules Modal ──────────────────────────────────────────────────────

interface ArchiveRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: ArchiveRule[];
  folders: Folder[];
  onChange: (rules: ArchiveRule[]) => void;
  onRunNow: () => number;
}

function ArchiveRulesModal({ open, onOpenChange, rules, folders, onChange, onRunNow }: ArchiveRulesModalProps) {
  const [draft, setDraft] = useState<Omit<ArchiveRule, 'id' | 'enabled'>>({
    ifField: 'title', ifOp: 'contains', ifValue: '', thenFolderId: folders[0]?.id ?? '',
  });
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const folderName = (id: string) => folders.find(f => f.id === id)?.name ?? '未知文件夹';

  const addRule = () => {
    if (!draft.ifValue.trim() || !draft.thenFolderId) return;
    onChange([{ id: uid(), enabled: true, ...draft, ifValue: draft.ifValue.trim() }, ...rules]);
    setDraft({ ifField: 'title', ifOp: 'contains', ifValue: '', thenFolderId: draft.thenFolderId });
  };

  const handleRun = () => {
    const n = onRunNow();
    setRunMsg(n > 0 ? `已按规则归档 ${n} 篇文档` : '没有文档匹配当前启用的规则');
    setTimeout(() => setRunMsg(null), 2500);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[640px] max-h-[82vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
            <div>
              <Dialog.Title className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-blue-600" />自动化归档规则
              </Dialog.Title>
              <p className="text-xs text-gray-400 mt-1">用「若 IF … 则 THEN …」把文献自动分到文件夹。上传完成或点击立即执行时生效，按列表从上到下命中第一条。</p>
            </div>
            <Dialog.Close className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></Dialog.Close>
          </div>

          <div className="px-5 py-4 border-b border-gray-100 bg-slate-50 flex-shrink-0">
            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">新建规则</div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">IF</span>
              <select
                value={draft.ifField}
                onChange={e => setDraft(d => ({ ...d, ifField: e.target.value as RuleField }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
              >
                {RULE_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <select
                value={draft.ifOp}
                onChange={e => setDraft(d => ({ ...d, ifOp: e.target.value as RuleOp }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
              >
                {RULE_OPS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <input
                value={draft.ifValue}
                onChange={e => setDraft(d => ({ ...d, ifValue: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addRule(); }}
                placeholder="例如 AI"
                className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400"
              />
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">THEN</span>
              <span className="text-xs text-gray-500">移入</span>
              <select
                value={draft.thenFolderId}
                onChange={e => setDraft(d => ({ ...d, thenFolderId: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400 max-w-[160px]"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.parentId ? `└ ${f.name}` : f.name}</option>
                ))}
              </select>
              <button
                onClick={addRule}
                disabled={!draft.ifValue.trim() || !draft.thenFolderId}
                className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />添加
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              预览：若{fieldLabel(draft.ifField)}{opLabel(draft.ifOp)}「{draft.ifValue.trim() || '…'}」，则自动移入「{folderName(draft.thenFolderId)}」
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
            {rules.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">还没有规则，先在上方创建一条</div>
            ) : (
              <ul className="space-y-2">
                {rules.map(rule => (
                  <li key={rule.id} className={`border rounded-xl px-3 py-2.5 flex items-start gap-3 ${rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                    <button
                      onClick={() => onChange(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                      title={rule.enabled ? '停用' : '启用'}
                      className={`mt-0.5 p-1 rounded-md transition-colors ${rule.enabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-300 hover:bg-gray-100'}`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 min-w-0 text-xs text-gray-700 leading-relaxed">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">IF</span>
                        <span>{fieldLabel(rule.ifField)}</span>
                        <span className="text-gray-400">{opLabel(rule.ifOp)}</span>
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">「{rule.ifValue}」</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">THEN</span>
                        <span>移入</span>
                        <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: folders.find(f => f.id === rule.thenFolderId)?.color }} />
                          {folderName(rule.thenFolderId)}
                        </span>
                      </div>
                      {!rule.enabled && <div className="text-[10px] text-gray-400 mt-1">已停用，不会自动执行</div>}
                    </div>
                    <button
                      onClick={() => onChange(rules.filter(r => r.id !== rule.id))}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
            {runMsg && <span className="text-xs text-emerald-600 flex-1">{runMsg}</span>}
            {!runMsg && <span className="text-[11px] text-gray-400 flex-1">{rules.filter(r => r.enabled).length} 条规则启用中</span>}
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" />对现有文档立即执行
            </button>
            <Dialog.Close className="text-xs px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              完成
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props { onNavigate: (page: string) => void; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function KnowledgeBase({ onNavigate }: Props) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(initDocs);
  const [folders, setFolders] = useState<Folder[]>(initFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['f3']));
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<DocType>>(new Set(['文献', '专利', '笔记']));
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('最近上传');
  const [selectedDocId, setSelectedDocId] = useState<string | null>('d1');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editingTagDocId, setEditingTagDocId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [archiveRules, setArchiveRules] = useState<ArchiveRule[]>(initArchiveRules);
  const [archiveRulesOpen, setArchiveRulesOpen] = useState(false);
  const [archiveToast, setArchiveToast] = useState<string | null>(null);

  const showArchiveToast = (msg: string) => {
    setArchiveToast(msg);
    setTimeout(() => setArchiveToast(null), 2800);
  };

  const classifyDoc = useCallback((doc: KnowledgeDoc, rules: ArchiveRule[] = archiveRules): KnowledgeDoc => {
    const hit = applyArchiveRules(doc, rules);
    if (!hit) return doc;
    return { ...doc, folderId: hit.thenFolderId, autoArchivedBy: hit.id };
  }, [archiveRules]);

  const runArchiveRules = useCallback(() => {
    let moved = 0;
    setDocs(prev => prev.map(d => {
      const next = classifyDoc(d);
      if (next.folderId !== d.folderId) moved += 1;
      return next;
    }));
    return moved;
  }, [classifyDoc]);

  // ── Computed ──────────────────────────────────────────────────────────────

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => d.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [docs]);

  const filteredDocs = useMemo(() => {
    let list = docs.filter(d => {
      const inFolder = selectedFolderId === 'all' || d.folderId === selectedFolderId ||
        (folders.find(f => f.id === d.folderId)?.parentId === selectedFolderId);
      const matchType = typeFilter.has(d.type);
      const matchSearch = !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.authors?.join(' ').toLowerCase().includes(searchQuery.toLowerCase())) ||
        d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = activeTags.size === 0 || d.tags.some(t => activeTags.has(t));
      return inFolder && matchType && matchSearch && matchTag;
    });
    if (sortBy === '影响因子') list = [...list].sort((a, b) => (b.impactFactor || 0) - (a.impactFactor || 0));
    else if (sortBy === '引用数') list = [...list].sort((a, b) => (b.citations || 0) - (a.citations || 0));
    else if (sortBy === '标题') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else list = [...list].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return list;
  }, [docs, selectedFolderId, typeFilter, searchQuery, activeTags, sortBy, folders]);

  const selectedDoc = docs.find(d => d.id === selectedDocId);
  const counts = {
    total: docs.length,
    文献: docs.filter(d => d.type === '文献').length,
    专利: docs.filter(d => d.type === '专利').length,
    笔记: docs.filter(d => d.type === '笔记').length,
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUploadComplete = useCallback((files: File[]) => {
    const today = new Date().toISOString().slice(0, 10);
    let autoMoved = 0;
    files.forEach(file => {
      const isPatent = file.name.includes('专利') || file.name.toLowerCase().includes('patent');
      const rawDoc: KnowledgeDoc = {
        id: uid(),
        type: isPatent ? '专利' : '文献',
        format: extToFormat(file.name),
        title: file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
        tags: [],
        folderId: selectedFolderId === 'all' ? 'f1' : selectedFolderId,
        uploadedAt: today,
        status: 'parsing',
        metadataAutoFilled: false,
      };
      const newDoc = classifyDoc(rawDoc);
      if (newDoc.folderId !== rawDoc.folderId) autoMoved += 1;
      setDocs(prev => [newDoc, ...prev]);
      setTimeout(() => {
        setDocs(prev => prev.map(d => {
          if (d.id !== newDoc.id) return d;
          const filled: KnowledgeDoc = {
            ...d,
            status: 'ready',
            metadataAutoFilled: true,
            authors: isPatent ? undefined : ['AI Author', '自动识别'],
            applicant: isPatent ? 'AI识别申请人' : undefined,
            journal: isPatent ? undefined : 'AI识别期刊',
            patentNumber: isPatent ? `CN${Date.now().toString().slice(-10)}A` : undefined,
            filingDate: isPatent ? today : undefined,
            year: isPatent ? undefined : new Date().getFullYear(),
            tags: ['AI识别', isPatent ? '专利' : '文献'],
            abstract: 'AI自动识别摘要：本文档经过AI自动分析，提取了关键信息并生成了结构化元数据。',
          };
          return classifyDoc(filled);
        }));
      }, 2000);
    });
    if (autoMoved > 0) showArchiveToast(`已按归档规则自动分类 ${autoMoved} 篇文档`);
  }, [selectedFolderId, classifyDoc]);

  const handlePageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    // Just open the modal on page drop too
    setUploadModalOpen(true);
  }, []);

  const addTag = (docId: string, tag: string) => {
    if (!tag.trim()) return;
    setDocs(prev => prev.map(d =>
      d.id === docId && !d.tags.includes(tag.trim()) ? { ...d, tags: [...d.tags, tag.trim()] } : d
    ));
    setNewTagInput('');
  };
  const removeTag = (docId: string, tag: string) =>
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, tags: d.tags.filter(t => t !== tag) } : d));
  const deleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    if (selectedDocId === id) setSelectedDocId(null);
  };
  const changeType = (id: string, type: DocType) =>
    setDocs(prev => prev.map(d => d.id === id ? { ...d, type } : d));
  const toggleFolder = (id: string) =>
    setExpandedFolders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const addFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders(prev => [...prev, { id: uid(), name: newFolderName.trim(), color: '#6366f1' }]);
    setNewFolderName(''); setCreatingFolder(false);
  };
  const toggleTag = (tag: string) =>
    setActiveTags(prev => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });
  const toggleType = (t: DocType) =>
    setTypeFilter(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const rootFolders = folders.filter(f => !f.parentId);
  const getChildren = (pid: string) => folders.filter(f => f.parentId === pid);
  const folderCount = (fid: string) => {
    const children = getChildren(fid);
    return docs.filter(d => d.folderId === fid || children.some(c => c.id === d.folderId)).length;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col bg-gray-50 min-h-0 overflow-hidden">

        {/* ── Upload Modal ── */}
        <UploadModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          onUploadComplete={handleUploadComplete}
        />
        <ArchiveRulesModal
          open={archiveRulesOpen}
          onOpenChange={setArchiveRulesOpen}
          rules={archiveRules}
          folders={folders}
          onChange={setArchiveRules}
          onRunNow={() => {
            const n = runArchiveRules();
            if (n > 0) showArchiveToast(`已按归档规则自动分类 ${n} 篇文档`);
            return n;
          }}
        />
        {archiveToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
            {archiveToast}
          </div>
        )}

        {/* ── Header ── */}
        <div className="px-8 pt-6 pb-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl text-gray-900 font-semibold mb-0.5">知识库</h1>
              <p className="text-sm text-gray-400">上传、管理与检索你的文献、专利和笔记，一键跳转阅读与处理</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setArchiveRulesOpen(true)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 text-sm rounded-lg transition-colors"
              >
                <Workflow className="w-4 h-4 text-blue-600" />归档规则
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  {archiveRules.filter(r => r.enabled).length}
                </span>
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />上传文档
              </button>
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter(new Set(['文献', '专利', '笔记']))}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${typeFilter.size === 3 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              全部 {counts.total}
            </button>
            {([
              ['文献', 'text-blue-600', 'bg-blue-50', 'border-blue-200'],
              ['专利', 'text-amber-600', 'bg-amber-50', 'border-amber-200'],
              ['笔记', 'text-green-600', 'bg-green-50', 'border-green-200'],
            ] as const).map(([t, tc, bg, bc]) => (
              <button
                key={t}
                onClick={() => setTypeFilter(new Set([t as DocType]))}
                className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${typeFilter.size === 1 && typeFilter.has(t as DocType) ? `${bg} ${tc} ${bc}` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
              >
                <span className={`font-medium ${tc}`}>{counts[t as DocType]}</span> {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Left Sidebar ── */}
          <div className="w-52 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto py-3 min-h-0">
              {/* Folder section header */}
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">文件夹</span>
                <button onClick={() => setCreatingFolder(true)} className="text-gray-400 hover:text-blue-500 transition-colors">
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* New folder inline form */}
              {creatingFolder && (
                <div className="mx-3 mb-2 flex gap-1">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addFolder(); if (e.key === 'Escape') setCreatingFolder(false); }}
                    placeholder="文件夹名称"
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                  />
                  <button onClick={addFolder} className="p-1 bg-blue-600 text-white rounded"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setCreatingFolder(false)} className="p-1 text-gray-400"><X className="w-3 h-3" /></button>
                </div>
              )}

              {/* All docs */}
              <button
                onClick={() => setSelectedFolderId('all')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${selectedFolderId === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FolderOpen className={`w-4 h-4 flex-shrink-0 ${selectedFolderId === 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="flex-1 text-left text-sm">全部文档</span>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{docs.length}</span>
              </button>

              {/* Folder tree */}
              {rootFolders.map(folder => {
                const children = getChildren(folder.id);
                const expanded = expandedFolders.has(folder.id);
                const cnt = folderCount(folder.id);
                const isSel = selectedFolderId === folder.id;
                return (
                  <div key={folder.id}>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer transition-colors ${isSel ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                      onClick={() => setSelectedFolderId(folder.id)}
                    >
                      {children.length > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); toggleFolder(folder.id); }}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0 -ml-0.5"
                        >
                          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}
                      {children.length === 0 && <div className="w-3 flex-shrink-0" />}
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: folder.color }} />
                      <span className="flex-1 truncate">{folder.name}</span>
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">{cnt}</span>
                    </div>
                    {expanded && children.map(child => {
                      const cSel = selectedFolderId === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => setSelectedFolderId(child.id)}
                          className={`w-full flex items-center gap-1.5 pl-8 pr-3 py-1.5 text-xs transition-colors ${cSel ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: child.color }} />
                          <span className="flex-1 text-left truncate">{child.name}</span>
                          <span className="text-[10px] text-gray-400">{folderCount(child.id)}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Tags section */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setTagsExpanded(v => !v)}
                  className="w-full flex items-center justify-between px-3 mb-1.5"
                >
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">标签</span>
                  <div className="flex items-center gap-1">
                    {activeTags.size > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); setActiveTags(new Set()); }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 mr-1"
                      >
                        清除
                      </button>
                    )}
                    {tagsExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                  </div>
                </button>
                {tagsExpanded && (
                  <div className="px-3 flex flex-col gap-0.5">
                    {allTags.map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`flex items-center justify-between py-1 px-2 rounded-md text-xs transition-colors ${activeTags.has(tag) ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTags.has(tag) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setArchiveRulesOpen(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Workflow className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">归档规则</span>
                <span className="text-[10px] text-gray-400">{archiveRules.filter(r => r.enabled).length} 启用</span>
              </button>
            </div>
          </div>

          {/* ── Center: doc list ── */}
          <div
            className="flex-1 flex flex-col min-h-0 overflow-hidden relative"
            onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handlePageDrop}
          >
            {/* Drop overlay */}
            {isDraggingOver && (
              <div className="absolute inset-0 z-20 bg-blue-50/90 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Upload className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-600 font-medium">松开以上传文档</p>
                </div>
              </div>
            )}

            {/* Search + filter bar */}
            <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索文档标题、作者、标签..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                />
              </div>
              <div className="flex gap-1">
                {(['文献', '专利', '笔记'] as DocType[]).map(t => {
                  const cfg = TYPE_CONFIG[t];
                  const active = typeFilter.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                      <cfg.icon className="w-3.5 h-3.5" />{t}
                    </button>
                  );
                })}
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-600 focus:outline-none focus:border-blue-400"
              >
                {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{filteredDocs.length} 个结果</span>
            </div>

            {/* Doc list */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-3 flex flex-col gap-2">
              {filteredDocs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Upload className="w-10 h-10 opacity-30" />
                  <p className="text-sm">拖拽文档到此处，或点击上方「上传文档」</p>
                  <p className="text-xs text-gray-300">支持 PDF · XML · HTML · TXT</p>
                </div>
              )}

              {filteredDocs.map(doc => {
                const cfg = TYPE_CONFIG[doc.type];
                const isSelected = selectedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`bg-white rounded-xl border cursor-pointer transition-all relative group ${isSelected ? 'border-blue-400 shadow-sm ring-1 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                  >
                    {/* Selected left accent */}
                    {isSelected && <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-blue-500 rounded-full" />}

                    <div className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1.5">
                            <p className={`text-sm leading-snug flex-1 font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{doc.title}</p>
                            {doc.status === 'parsing' && (
                              <span className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />AI 识别中...
                              </span>
                            )}
                            {doc.status === 'ready' && doc.metadataAutoFilled && (
                              <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                <Sparkles className="w-2.5 h-2.5" />AI 已标注
                              </span>
                            )}
                            {doc.autoArchivedBy && (
                              <span className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                <Workflow className="w-2.5 h-2.5" />自动归档
                              </span>
                            )}
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${FORMAT_COLORS[doc.format]}`}>{doc.format}</span>
                            {doc.authors && <span className="text-xs text-gray-400">{doc.authors.slice(0, 2).join(', ')}{doc.authors.length > 2 ? ' et al.' : ''}</span>}
                            {doc.applicant && <span className="text-xs text-gray-500">{doc.applicant}</span>}
                            {doc.journal && <span className="text-xs text-blue-500 font-medium">{doc.journal}</span>}
                            {doc.patentNumber && <span className="text-xs text-gray-400 font-mono">{doc.patentNumber}</span>}
                            {doc.year && <span className="text-xs text-gray-400">{doc.year}</span>}
                            {doc.impactFactor && (
                              <span className="flex items-center gap-0.5 text-xs text-yellow-500 font-medium">
                                <TrendingUp className="w-3 h-3" />IF {doc.impactFactor}
                              </span>
                            )}
                            {doc.citations && (
                              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                <Quote className="w-3 h-3" />{doc.citations}
                              </span>
                            )}
                            {doc.doi && (
                              <a
                                href={`https://doi.org/${doc.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-600 font-mono hover:underline transition-colors"
                                title={`DOI: ${doc.doi}`}
                              >
                                <Link className="w-3 h-3 flex-shrink-0" />
                                {doc.doi}
                              </a>
                            )}
                            <span className="text-xs text-gray-300 ml-auto flex-shrink-0">{doc.uploadedAt}</span>
                          </div>

                          {/* Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {doc.tags.map(tag => (
                              <span
                                key={tag}
                                className={`flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full group/tag ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                              >
                                {tag}
                                <button
                                  onClick={e => { e.stopPropagation(); removeTag(doc.id, tag); }}
                                  className="opacity-0 group-hover/tag:opacity-100 hover:text-red-400 transition-all ml-0.5"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                            {editingTagDocId === doc.id ? (
                              <input
                                autoFocus
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') addTag(doc.id, newTagInput);
                                  if (e.key === 'Escape') setEditingTagDocId(null);
                                }}
                                onBlur={() => { if (newTagInput) addTag(doc.id, newTagInput); setEditingTagDocId(null); setNewTagInput(''); }}
                                onClick={e => e.stopPropagation()}
                                placeholder="添加标签"
                                className="text-[11px] border border-dashed border-blue-400 rounded-full px-2 py-0.5 w-20 focus:outline-none bg-white"
                              />
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); setEditingTagDocId(doc.id); setNewTagInput(''); }}
                                className="text-[11px] text-gray-300 hover:text-blue-500 border border-dashed border-gray-200 hover:border-blue-400 rounded-full px-1.5 py-0.5 transition-colors"
                              >
                                + 添加标签
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Actions menu */}
                        <div
                          className="flex-shrink-0 relative opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === doc.id && (
                            <div
                              className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1"
                              onMouseLeave={() => setOpenMenuId(null)}
                            >
                              <button
                                onClick={() => { onNavigate('literature-reader'); setOpenMenuId(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <BookOpen className="w-3.5 h-3.5" />打开阅读
                              </button>
                              <button
                                onClick={() => { onNavigate(doc.type === '专利' ? 'patent-processing' : 'literature-processing'); setOpenMenuId(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Cpu className="w-3.5 h-3.5" />深度处理
                              </button>
                              <button
                                onClick={() => { onNavigate('academic-poster'); setOpenMenuId(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <GalleryHorizontal className="w-3.5 h-3.5" />生成海报 / 音频
                              </button>
                              <div className="h-px bg-gray-100 my-1" />
                              {(['文献', '专利', '笔记'] as DocType[]).map(t => (
                                <button
                                  key={t}
                                  onClick={() => { changeType(doc.id, t); setOpenMenuId(null); }}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${doc.type === t ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
                                >
                                  {doc.type === t ? <Check className="w-3 h-3" /> : <div className="w-3" />}
                                  标记为{t}
                                </button>
                              ))}
                              <div className="h-px bg-gray-100 my-1" />
                              <button
                                onClick={() => { deleteDoc(doc.id); setOpenMenuId(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />删除
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: detail panel ── */}
          <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            {selectedDoc ? (
              <>
                {/* Doc header */}
                <div className="p-4 border-b border-gray-100 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug mb-3 line-clamp-3">{selectedDoc.title}</p>

                  {/* Type tabs */}
                  <div className="flex gap-1 mb-3">
                    {(['文献', '专利', '笔记'] as DocType[]).map(t => {
                      const cfg = TYPE_CONFIG[t];
                      const active = selectedDoc.type === t;
                      return (
                        <button
                          key={t}
                          onClick={() => changeType(selectedDoc.id, t)}
                          className={`flex-1 text-[11px] py-1 rounded-lg border font-medium transition-colors ${active ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  {/* Metadata with AI badges */}
                  <dl className="space-y-1.5">
                    {selectedDoc.authors && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">作者</dt>
                        <dd className="text-gray-700 flex items-center flex-wrap">
                          {selectedDoc.authors.slice(0, 2).join(', ')}
                          {selectedDoc.metadataAutoFilled && <AIBadge />}
                        </dd>
                      </div>
                    )}
                    {selectedDoc.journal && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">期刊</dt>
                        <dd className="text-blue-600 flex items-center">
                          {selectedDoc.journal}
                          {selectedDoc.metadataAutoFilled && <AIBadge />}
                        </dd>
                      </div>
                    )}
                    {selectedDoc.patentNumber && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">专利号</dt>
                        <dd className="text-gray-700 font-mono text-[11px] flex items-center">
                          {selectedDoc.patentNumber}
                          {selectedDoc.metadataAutoFilled && <AIBadge />}
                        </dd>
                      </div>
                    )}
                    {selectedDoc.applicant && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">申请人</dt>
                        <dd className="text-gray-700 flex items-center">
                          {selectedDoc.applicant}
                          {selectedDoc.metadataAutoFilled && <AIBadge />}
                        </dd>
                      </div>
                    )}
                    {selectedDoc.year && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">年份</dt>
                        <dd className="text-gray-700 flex items-center">
                          {selectedDoc.year}
                          {selectedDoc.metadataAutoFilled && <AIBadge />}
                        </dd>
                      </div>
                    )}
                    {selectedDoc.type === '文献' && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">DOI</dt>
                        <dd className="text-gray-700 break-all">
                          {selectedDoc.doi ? (
                            <a
                              href={`https://doi.org/${selectedDoc.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-mono text-[11px]"
                            >
                              {selectedDoc.doi}
                            </a>
                          ) : (
                            <span className="text-gray-400">无</span>
                          )}
                        </dd>
                      </div>
                    )}
                    {selectedDoc.filingDate && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">申请日</dt>
                        <dd className="text-gray-700 flex items-center">
                          {selectedDoc.filingDate}
                          {selectedDoc.metadataAutoFilled && <AIBadge />}
                        </dd>
                      </div>
                    )}
                    {selectedDoc.impactFactor && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">影响因子</dt>
                        <dd className="text-yellow-600 font-medium">IF {selectedDoc.impactFactor}</dd>
                      </div>
                    )}
                    {selectedDoc.citations && (
                      <div className="flex gap-2 text-xs">
                        <dt className="text-gray-400 w-14 flex-shrink-0">引用数</dt>
                        <dd className="text-gray-700">{selectedDoc.citations}</dd>
                      </div>
                    )}
                    <div className="flex gap-2 text-xs">
                      <dt className="text-gray-400 w-14 flex-shrink-0">上传</dt>
                      <dd className="text-gray-700">{selectedDoc.uploadedAt}</dd>
                    </div>
                    <div className="flex gap-2 text-xs items-center">
                      <dt className="text-gray-400 w-14 flex-shrink-0">格式</dt>
                      <dd className={`font-medium text-[11px] px-1.5 py-0.5 rounded ${FORMAT_COLORS[selectedDoc.format]}`}>{selectedDoc.format}</dd>
                    </div>
                    <div className="flex gap-2 text-xs items-start">
                      <dt className="text-gray-400 w-14 flex-shrink-0">文件夹</dt>
                      <dd className="text-gray-700">
                        {folders.find(f => f.id === selectedDoc.folderId)?.name ?? '—'}
                        {selectedDoc.autoArchivedBy && (
                          <span className="ml-1 text-[10px] text-indigo-500">（规则归档）</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Abstract */}
                {selectedDoc.abstract && (
                  <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      摘要
                      {selectedDoc.metadataAutoFilled && <AIBadge />}
                    </div>
                    <p className="text-[11.5px] text-gray-600 leading-relaxed line-clamp-4">{selectedDoc.abstract}</p>
                  </div>
                )}

                {/* Tags */}
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    标签
                    {selectedDoc.metadataAutoFilled && <AIBadge />}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags.map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-0.5 text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full group"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(selectedDoc.id, tag)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setEditingTagDocId(selectedDoc.id)}
                      className="text-[11px] text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 hover:border-blue-400 rounded-full px-2 py-0.5 transition-colors flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />添加标签
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-4 flex flex-col gap-2">
                  <button
                    onClick={() => onNavigate('literature-reader')}
                    className="flex items-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    <BookOpen className="w-4 h-4" />打开阅读
                  </button>
                  <button
                    onClick={() => onNavigate(selectedDoc.type === '专利' ? 'patent-processing' : 'literature-processing')}
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    <Cpu className="w-4 h-4 text-gray-400" />深度处理
                  </button>
                  <button
                    onClick={() => onNavigate('academic-poster')}
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    <GalleryHorizontal className="w-4 h-4 text-gray-400" />生成海报 / 音频
                  </button>
                  <button
                    onClick={() => onNavigate('knowledge-search')}
                    className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-400" />检索相关文献
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm text-center">选择文档查看详情与快捷操作</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
