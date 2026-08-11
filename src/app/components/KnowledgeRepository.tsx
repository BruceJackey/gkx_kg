import { useState } from 'react';
import {
  FolderOpen, FolderPlus, Trash2, Edit2, Check, X,
  BookOpen, ExternalLink, TrendingUp, Quote, Search,
  MoreVertical, Plus, FolderClosed, ChevronRight,
  FileText, Calendar
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedLiterature {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  impactFactor: number;
  citations: number;
  keywords: string[];
  savedAt: string;
}

interface Folder {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  color: string;
  items: SavedLiterature[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const FOLDER_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444',
];

const initFolders: Folder[] = [
  {
    id: 'f1', name: '知识图谱研究', description: '知识图谱构建、嵌入与推理相关文献',
    createdAt: '2026-05-12', color: '#3b82f6',
    items: [
      { id: 'L001', title: '基于Transformer的知识图谱嵌入方法研究', authors: ['张明', '李华', '王强'], journal: 'IEEE TKDE', year: 2024, impactFactor: 8.9, citations: 142, keywords: ['知识图谱', '嵌入', 'Transformer'], savedAt: '2026-06-01 14:23' },
      { id: 'L003', title: '面向科研领域的知识图谱构建与应用综述', authors: ['刘芳', '陈志远', '赵磊'], journal: 'ACM SIGKDD', year: 2023, impactFactor: 7.2, citations: 256, keywords: ['知识图谱', '综述', '科研'], savedAt: '2026-06-01 14:23' },
      { id: 'L010', title: 'Temporal Knowledge Graph Reasoning with Dynamic Entity Representations', authors: ['Garcia A', 'Martinez B'], journal: 'ICLR', year: 2024, impactFactor: 11.2, citations: 234, keywords: ['temporal', 'knowledge graph', 'reasoning'], savedAt: '2026-06-03 09:15' },
      { id: 'L011', title: '基于强化学习的知识图谱关系路径推理', authors: ['赵强', '周晓', '林伟'], journal: 'AAAI', year: 2022, impactFactor: 6.8, citations: 178, keywords: ['强化学习', '知识图谱', '推理'], savedAt: '2026-06-03 09:15' },
    ],
  },
  {
    id: 'f2', name: '自然语言处理', description: '预训练模型与语言理解前沿研究',
    createdAt: '2026-05-18', color: '#8b5cf6',
    items: [
      { id: 'L007', title: '知识增强预训练语言模型研究进展', authors: ['李明', '张伟', '钱晨'], journal: 'ACL', year: 2023, impactFactor: 9.1, citations: 445, keywords: ['预训练模型', '知识增强', 'NLP'], savedAt: '2026-05-20 16:44' },
      { id: 'L016', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', authors: ['Lewis P', 'Perez E', 'Piktus A'], journal: 'NeurIPS', year: 2022, impactFactor: 12.4, citations: 2341, keywords: ['RAG', 'retrieval', 'generation'], savedAt: '2026-05-22 11:30' },
      { id: 'L008', title: 'Cross-lingual Knowledge Graph Alignment via Contrastive Learning', authors: ['Wang X', 'Chen Y', 'Li Z'], journal: 'EMNLP', year: 2023, impactFactor: 7.8, citations: 167, keywords: ['knowledge graph', 'alignment', 'multilingual'], savedAt: '2026-05-22 11:30' },
    ],
  },
  {
    id: 'f3', name: '高影响力文献', description: 'Nature / Science 发表的重要研究成果',
    createdAt: '2026-06-05', color: '#f59e0b',
    items: [
      { id: 'L004', title: 'Graph Neural Networks for Biomedical Knowledge Discovery', authors: ['Smith J', 'Johnson M', 'Brown K'], journal: 'Nature', year: 2024, impactFactor: 69.5, citations: 1203, keywords: ['GNN', 'biomedical', 'drug discovery'], savedAt: '2026-06-05 10:00' },
      { id: 'L006', title: 'Automated Hypothesis Generation from Scientific Literature', authors: ['Patel R', 'Kumar S', 'Lee H'], journal: 'Science', year: 2024, impactFactor: 56.9, citations: 892, keywords: ['hypothesis generation', 'AI', 'materials science'], savedAt: '2026-06-05 10:02' },
      { id: 'L013', title: '医学知识图谱辅助临床决策支持系统研究', authors: ['陈丽', '徐明', '潘洋'], journal: 'Nature', year: 2023, impactFactor: 69.5, citations: 567, keywords: ['医学知识图谱', '临床决策', '诊断'], savedAt: '2026-06-07 14:18' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function KnowledgeRepository() {
  const [folders, setFolders] = useState<Folder[]>(initFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f1');
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Folder create/edit
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Item menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const filteredItems = selectedFolder?.items.filter(item =>
    !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.authors.join(' ').toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const f: Folder = {
      id: uid(), name: newFolderName.trim(), description: newFolderDesc.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      color: newFolderColor, items: [],
    };
    setFolders(prev => [...prev, f]);
    setSelectedFolderId(f.id);
    setCreatingFolder(false);
    setNewFolderName('');
    setNewFolderDesc('');
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    if (selectedFolderId === id) setSelectedFolderId(folders.find(f => f.id !== id)?.id ?? '');
  };

  const startEditFolder = (f: Folder) => {
    setEditingFolderId(f.id);
    setEditFolderName(f.name);
  };

  const saveEditFolder = (id: string) => {
    if (!editFolderName.trim()) return;
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: editFolderName.trim() } : f));
    setEditingFolderId(null);
  };

  const removeItems = (itemIds: string[]) => {
    setFolders(prev => prev.map(f => f.id === selectedFolderId
      ? { ...f, items: f.items.filter(i => !itemIds.includes(i.id)) }
      : f
    ));
    setSelectedItems(prev => { const n = new Set(prev); itemIds.forEach(id => n.delete(id)); return n; });
  };

  const toggleItem = (id: string) => setSelectedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = filteredItems.length > 0 && filteredItems.every(i => selectedItems.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelectedItems(prev => { const n = new Set(prev); filteredItems.forEach(i => n.delete(i.id)); return n; });
    else setSelectedItems(prev => { const n = new Set(prev); filteredItems.forEach(i => n.add(i.id)); return n; });
  };

  const totalItems = folders.reduce((s, f) => s + f.items.length, 0);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">知识仓库</h1>
          <p className="text-sm text-gray-500">管理个人文献收藏，创建文件夹分类整理来自知识搜索的文献</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2">
          <BookOpen className="w-4 h-4" />
          <span>共 <span className="text-gray-900">{totalItems}</span> 篇文献 · <span className="text-gray-900">{folders.length}</span> 个文件夹</span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* ── Left: folder list ── */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setCreatingFolder(true)}
            className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-gray-200 hover:border-[#2563eb]/50 hover:text-[#60a5fa] text-gray-400 text-sm rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            新建文件夹
          </button>

          {/* New folder form */}
          {creatingFolder && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
              <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createFolder()}
                placeholder="文件夹名称..." className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb]" />
              <input value={newFolderDesc} onChange={e => setNewFolderDesc(e.target.value)}
                placeholder="描述（选填）..." className="w-full bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb]" />
              <div className="flex gap-1.5">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setNewFolderColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform ${newFolderColor === c ? 'scale-125 ring-2 ring-gray-400/30' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={createFolder} className="flex-1 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs rounded transition-colors">创建</button>
                <button onClick={() => setCreatingFolder(false)} className="flex-1 py-1.5 border border-gray-200 text-gray-500 text-xs rounded hover:border-gray-400 transition-colors">取消</button>
              </div>
            </div>
          )}

          {/* Folder list */}
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            {folders.map(f => (
              <div key={f.id} className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${selectedFolderId === f.id ? 'bg-white border border-gray-200' : 'hover:bg-gray-50'}`}
                onClick={() => { setSelectedFolderId(f.id); setSearch(''); setSelectedItems(new Set()); }}>
                {selectedFolderId === f.id
                  ? <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: f.color }} />
                  : <FolderClosed className="w-4 h-4 flex-shrink-0 text-gray-400" />
                }

                {editingFolderId === f.id ? (
                  <input autoFocus value={editFolderName} onChange={e => setEditFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditFolder(f.id); if (e.key === 'Escape') setEditingFolderId(null); }}
                    onBlur={() => saveEditFolder(f.id)}
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none border-b border-[#2563eb]"
                    onClick={e => e.stopPropagation()} />
                ) : (
                  <span className={`flex-1 text-sm truncate ${selectedFolderId === f.id ? 'text-gray-900' : 'text-gray-500'}`}>{f.name}</span>
                )}

                <span className="text-[11px] text-gray-400 flex-shrink-0">{f.items.length}</span>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => startEditFolder(f)} className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteFolder(f.id)} className="p-0.5 text-gray-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: folder contents ── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden min-w-0">
          {selectedFolder ? (
            <>
              {/* Folder header */}
              <div className="px-5 py-4 border-b border-gray-200 flex items-start gap-3 flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selectedFolder.color + '22' }}>
                  <FolderOpen className="w-5 h-5" style={{ color: selectedFolder.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base text-gray-900">{selectedFolder.name}</h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{selectedFolder.items.length} 篇</span>
                  </div>
                  {selectedFolder.description && <p className="text-xs text-gray-400 mt-0.5">{selectedFolder.description}</p>}
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-400">
                    <Calendar className="w-3 h-3" />创建于 {selectedFolder.createdAt}
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 flex-shrink-0">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="在此文件夹中搜索..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2563eb]" />
                </div>

                {selectedItems.size > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-500">已选 {selectedItems.size} 篇</span>
                    <button onClick={() => removeItems([...selectedItems])}
                      className="flex items-center gap-1.5 text-xs text-red-400 border border-red-900/40 hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />移除
                    </button>
                    <button onClick={() => setSelectedItems(new Set())} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* List header */}
              <div className="flex items-center gap-3 px-5 py-2 text-[11px] text-gray-400 border-b border-gray-100 flex-shrink-0">
                <div onClick={toggleAll}
                  className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors ${allSelected ? 'bg-[#2563eb] border-[#2563eb]' : 'border-gray-200 hover:border-gray-400'}`}>
                  {allSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="flex-1">标题 / 作者</span>
                <span className="w-24 text-center hidden md:block">期刊</span>
                <span className="w-12 text-center">年份</span>
                <span className="w-14 text-center">IF</span>
                <span className="w-14 text-center">引用</span>
                <span className="w-28 hidden lg:block">保存时间</span>
                <span className="w-8" />
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">{search ? '未找到匹配文献' : '此文件夹暂无文献，前往知识搜索保存'}</p>
                  </div>
                ) : (
                  filteredItems.map((item, idx) => (
                    <div key={item.id}
                      className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50/30 transition-colors ${idx % 2 !== 0 ? 'bg-gray-50/30' : ''} ${selectedItems.has(item.id) ? 'bg-blue-50/50' : ''}`}>
                      <div onClick={() => toggleItem(item.id)}
                        className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors ${selectedItems.has(item.id) ? 'bg-[#2563eb] border-[#2563eb]' : 'border-gray-200 hover:border-gray-400'}`}>
                        {selectedItems.has(item.id) && <Check className="w-3 h-3 text-white" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate leading-snug">{item.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{item.authors.slice(0, 2).join(', ')}{item.authors.length > 2 ? ' et al.' : ''}</p>
                      </div>

                      <span className="w-24 text-xs text-blue-400 truncate text-center hidden md:block">{item.journal}</span>
                      <span className="w-12 text-xs text-gray-400 text-center">{item.year}</span>
                      <span className="w-14 text-xs text-yellow-500 text-center flex items-center justify-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />{item.impactFactor}
                      </span>
                      <span className="w-14 text-xs text-gray-400 text-center flex items-center justify-center gap-0.5">
                        <Quote className="w-3 h-3" />{item.citations}
                      </span>
                      <span className="w-28 text-[11px] text-gray-400 hidden lg:block text-center">{item.savedAt}</span>

                      <div className="w-8 flex items-center justify-center relative">
                        <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 top-7 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-10 py-1"
                            onMouseLeave={() => setOpenMenuId(null)}>
                            <button className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-2">
                              <ExternalLink className="w-3.5 h-3.5" />查看原文
                            </button>
                            <button onClick={() => { removeItems([item.id]); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-50 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" />移除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">选择左侧文件夹查看内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
