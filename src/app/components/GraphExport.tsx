import { useState, useEffect, useRef } from 'react';
import {
  X, Download, Copy, Check, ChevronDown, ChevronRight,
  FileCode2, FileJson2, FileText, Layers,
  Zap, Plus, Trash2, RotateCcw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RdfFormat = 'turtle' | 'ntriples' | 'jsonld' | 'rdfxml' | 'trig' | 'nquads';

interface PrefixRow { prefix: string; uri: string }

interface ExportConfig {
  baseUri: string;
  encoding: 'utf-8' | 'utf-16';
  compress: 'none' | 'gzip' | 'bzip2';
  splitMode: 'single' | 'byType' | 'byClass';
  includePrefixes: boolean;
  includeInferred: boolean;
  includeComments: boolean;
  prefixes: PrefixRow[];
}

interface GraphExportProps {
  graphId: string;
  graphName: string;
  entityCount: number;
  relationCount: number;
  targetSpace: string;
  onClose: () => void;
}

// ─── Format metadata ──────────────────────────────────────────────────────────

const FORMAT_META: Record<RdfFormat, {
  label: string; ext: string; mime: string; desc: string;
  longDesc: string; features: string[];
  sizeMultiplier: number; icon: React.ElementType; color: string;
  accentBg: string; accentText: string; accentBorder: string;
  supportsPrefixes: boolean; supportsNamedGraphs: boolean;
}> = {
  turtle: {
    label: 'Turtle', ext: '.ttl', mime: 'text/turtle',
    desc: '人类可读，支持命名空间前缀与嵌套语法',
    longDesc: 'Terse RDF Triple Language — W3C 推荐标准，语法简洁，支持前缀缩写，是目前社区最广泛使用的 RDF 序列化格式，适合人工查阅与版本控制。',
    features: ['可读性强', '前缀缩写', '嵌套写法', 'W3C 标准'],
    sizeMultiplier: 0.53, icon: FileCode2, color: 'indigo',
    accentBg: 'bg-indigo-50', accentText: 'text-indigo-600', accentBorder: 'border-indigo-400',
    supportsPrefixes: true, supportsNamedGraphs: false,
  },
  ntriples: {
    label: 'N-Triples', ext: '.nt', mime: 'application/n-triples',
    desc: '逐行三元组，最简格式，适合流式处理',
    longDesc: 'N-Triples — W3C 推荐标准，每行一个三元组，无需解析上下文，适合大规模流式处理、Hadoop/Spark 管道及简单 grep 查询。',
    features: ['行对齐', '流式友好', '无歧义', 'grep 友好'],
    sizeMultiplier: 1.0, icon: FileText, color: 'slate',
    accentBg: 'bg-slate-50', accentText: 'text-slate-600', accentBorder: 'border-slate-400',
    supportsPrefixes: false, supportsNamedGraphs: false,
  },
  jsonld: {
    label: 'JSON-LD', ext: '.jsonld', mime: 'application/ld+json',
    desc: 'JSON 兼容，适合 REST API 与 Web 应用',
    longDesc: 'JSON Linked Data — W3C 推荐标准，与 JSON 完全兼容，可直接被 JavaScript 解析，适合 REST API、Schema.org 标注与前端集成。',
    features: ['JSON 兼容', 'Web 友好', '@context', 'Schema.org'],
    sizeMultiplier: 0.78, icon: FileJson2, color: 'amber',
    accentBg: 'bg-amber-50', accentText: 'text-amber-600', accentBorder: 'border-amber-400',
    supportsPrefixes: true, supportsNamedGraphs: true,
  },
  rdfxml: {
    label: 'RDF/XML', ext: '.rdf', mime: 'application/rdf+xml',
    desc: 'W3C 原始标准，Protégé/Jena 兼容性最广',
    longDesc: 'RDF/XML — W3C 最初 RDF 标准，与 OWL 工具链（Protégé、Apache Jena、TopBraid）及 SPARQL 引擎有最广泛的原生兼容性。',
    features: ['原始标准', 'OWL 兼容', 'Protégé', 'Apache Jena'],
    sizeMultiplier: 1.08, icon: FileCode2, color: 'blue',
    accentBg: 'bg-blue-50', accentText: 'text-blue-600', accentBorder: 'border-blue-400',
    supportsPrefixes: true, supportsNamedGraphs: false,
  },
  trig: {
    label: 'TriG', ext: '.trig', mime: 'application/trig',
    desc: 'Turtle 的命名图扩展，支持数据集上下文',
    longDesc: 'TriG — W3C 推荐标准，Turtle 的超集，支持命名图（Named Graphs），适合多来源数据集管理、数据溯源与图级版本控制。',
    features: ['命名图', '数据集', 'Turtle 超集', '数据溯源'],
    sizeMultiplier: 0.57, icon: Layers, color: 'violet',
    accentBg: 'bg-violet-50', accentText: 'text-violet-600', accentBorder: 'border-violet-400',
    supportsPrefixes: true, supportsNamedGraphs: true,
  },
  nquads: {
    label: 'N-Quads', ext: '.nq', mime: 'application/n-quads',
    desc: 'N-Triples 命名图扩展，RDF 数据集流式存储',
    longDesc: 'N-Quads — W3C 推荐标准，N-Triples 的超集，每行增加图名四元组，兼顾流式处理效率与命名图支持，常用于 RDF 存储引擎批量加载。',
    features: ['命名图', '行对齐', '流式存储', '批量加载'],
    sizeMultiplier: 1.04, icon: Layers, color: 'emerald',
    accentBg: 'bg-emerald-50', accentText: 'text-emerald-600', accentBorder: 'border-emerald-400',
    supportsPrefixes: false, supportsNamedGraphs: true,
  },
};

const FORMAT_ORDER: RdfFormat[] = ['turtle', 'ntriples', 'jsonld', 'rdfxml', 'trig', 'nquads'];

const DEFAULT_PREFIXES: PrefixRow[] = [
  { prefix: 'rdf',   uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
  { prefix: 'rdfs',  uri: 'http://www.w3.org/2000/01/rdf-schema#' },
  { prefix: 'owl',   uri: 'http://www.w3.org/2002/07/owl#' },
  { prefix: 'xsd',   uri: 'http://www.w3.org/2001/XMLSchema#' },
  { prefix: 'kg',    uri: 'http://scikg.example.org/' },
  { prefix: 'paper', uri: 'http://scikg.example.org/paper/' },
  { prefix: 'author',uri: 'http://scikg.example.org/author/' },
  { prefix: 'inst',  uri: 'http://scikg.example.org/institution/' },
];

// ─── Preview content per format ───────────────────────────────────────────────

const PREVIEW: Record<RdfFormat, string> = {
  turtle: `@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:    <http://www.w3.org/2002/07/owl#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .
@prefix kg:     <http://scikg.example.org/> .
@prefix paper:  <http://scikg.example.org/paper/> .
@prefix author: <http://scikg.example.org/author/> .
@prefix inst:   <http://scikg.example.org/institution/> .

# ── 论文实体 (5,234 条) ──────────────────────────────────
paper:p4521
    a kg:Paper ;
    rdfs:label "深度学习框架在图神经网络中的应用"@zh ;
    kg:doi "10.1234/dl.2026.4521" ;
    kg:pubYear "2026"^^xsd:gYear ;
    kg:writtenBy author:a145 , author:a146 ;
    kg:hasConcept kg:concept/深度学习 , kg:concept/图神经网络 .

paper:p1892
    a kg:Paper ;
    rdfs:label "Attention Is All You Need"@en ;
    kg:doi "10.48550/arXiv.1706.03762" ;
    kg:pubYear "2017"^^xsd:gYear ;
    kg:writtenBy author:a201 .

# ── 作者实体 (4,102 条) ──────────────────────────────────
author:a145
    a kg:Author ;
    rdfs:label "Geoffrey Hinton"@en ;
    kg:orcid "0000-0002-1580-8801" ;
    kg:email "hinton@cs.toronto.edu" ;
    kg:affiliatedWith inst:i88 .

# ── 机构实体 (1,890 条) ──────────────────────────────────
inst:i88
    a kg:Institution ;
    rdfs:label "多伦多大学"@zh , "University of Toronto"@en ;
    kg:country "CA" ;
    kg:city "Toronto" .

# ... 共 128,340 实体 · 89,201 关系 · 602,561 三元组`,

  ntriples: `# N-Triples 格式 — 每行一条三元组
<http://scikg.example.org/paper/p4521> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Paper> .
<http://scikg.example.org/paper/p4521> <http://www.w3.org/2000/01/rdf-schema#label> "深度学习框架在图神经网络中的应用"@zh .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/doi> "10.1234/dl.2026.4521" .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/pubYear> "2026"^^<http://www.w3.org/2001/XMLSchema#gYear> .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/writtenBy> <http://scikg.example.org/author/a145> .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/writtenBy> <http://scikg.example.org/author/a146> .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/hasConcept> <http://scikg.example.org/concept/%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0> .
<http://scikg.example.org/paper/p1892> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Paper> .
<http://scikg.example.org/paper/p1892> <http://www.w3.org/2000/01/rdf-schema#label> "Attention Is All You Need"@en .
<http://scikg.example.org/paper/p1892> <http://scikg.example.org/doi> "10.48550/arXiv.1706.03762" .
<http://scikg.example.org/author/a145> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Author> .
<http://scikg.example.org/author/a145> <http://www.w3.org/2000/01/rdf-schema#label> "Geoffrey Hinton"@en .
<http://scikg.example.org/author/a145> <http://scikg.example.org/orcid> "0000-0002-1580-8801" .
<http://scikg.example.org/author/a145> <http://scikg.example.org/email> "hinton@cs.toronto.edu" .
<http://scikg.example.org/author/a145> <http://scikg.example.org/affiliatedWith> <http://scikg.example.org/institution/i88> .
<http://scikg.example.org/institution/i88> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Institution> .
<http://scikg.example.org/institution/i88> <http://www.w3.org/2000/01/rdf-schema#label> "多伦多大学"@zh .
<http://scikg.example.org/institution/i88> <http://www.w3.org/2000/01/rdf-schema#label> "University of Toronto"@en .
<http://scikg.example.org/institution/i88> <http://scikg.example.org/country> "CA" .
# ... 602,561 条三元组`,

  jsonld: `{
  "@context": {
    "@vocab":  "http://scikg.example.org/",
    "rdf":     "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs":    "http://www.w3.org/2000/01/rdf-schema#",
    "xsd":     "http://www.w3.org/2001/XMLSchema#",
    "label":   "rdfs:label",
    "type":    "@type"
  },
  "@graph": [
    {
      "@id":    "http://scikg.example.org/paper/p4521",
      "@type":  "Paper",
      "label": [
        { "@value": "深度学习框架在图神经网络中的应用", "@language": "zh" }
      ],
      "doi":     "10.1234/dl.2026.4521",
      "pubYear": { "@type": "xsd:gYear", "@value": "2026" },
      "writtenBy": [
        { "@id": "http://scikg.example.org/author/a145" },
        { "@id": "http://scikg.example.org/author/a146" }
      ],
      "hasConcept": [
        { "@id": "http://scikg.example.org/concept/深度学习" }
      ]
    },
    {
      "@id":   "http://scikg.example.org/author/a145",
      "@type": "Author",
      "label": { "@value": "Geoffrey Hinton", "@language": "en" },
      "orcid": "0000-0002-1580-8801",
      "email": "hinton@cs.toronto.edu",
      "affiliatedWith": { "@id": "http://scikg.example.org/institution/i88" }
    },
    {
      "@id":   "http://scikg.example.org/institution/i88",
      "@type": "Institution",
      "label": [
        { "@value": "多伦多大学", "@language": "zh" },
        { "@value": "University of Toronto", "@language": "en" }
      ],
      "country": "CA",
      "city":    "Toronto"
    }
  ]
  // ... 128,340 实体对象
}`,

  rdfxml: `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:owl="http://www.w3.org/2002/07/owl#"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
  xmlns:kg="http://scikg.example.org/">

  <!-- 论文实体 (5,234 条) -->
  <kg:Paper rdf:about="http://scikg.example.org/paper/p4521">
    <rdfs:label xml:lang="zh">深度学习框架在图神经网络中的应用</rdfs:label>
    <kg:doi>10.1234/dl.2026.4521</kg:doi>
    <kg:pubYear rdf:datatype="&xsd;gYear">2026</kg:pubYear>
    <kg:writtenBy rdf:resource="http://scikg.example.org/author/a145"/>
    <kg:writtenBy rdf:resource="http://scikg.example.org/author/a146"/>
    <kg:hasConcept rdf:resource="http://scikg.example.org/concept/深度学习"/>
  </kg:Paper>

  <!-- 作者实体 (4,102 条) -->
  <kg:Author rdf:about="http://scikg.example.org/author/a145">
    <rdfs:label xml:lang="en">Geoffrey Hinton</rdfs:label>
    <kg:orcid>0000-0002-1580-8801</kg:orcid>
    <kg:email>hinton@cs.toronto.edu</kg:email>
    <kg:affiliatedWith rdf:resource="http://scikg.example.org/institution/i88"/>
  </kg:Author>

  <!-- 机构实体 (1,890 条) -->
  <kg:Institution rdf:about="http://scikg.example.org/institution/i88">
    <rdfs:label xml:lang="zh">多伦多大学</rdfs:label>
    <rdfs:label xml:lang="en">University of Toronto</rdfs:label>
    <kg:country>CA</kg:country>
    <kg:city>Toronto</kg:city>
  </kg:Institution>

  <!-- ... 共 128,340 个实体元素 -->
</rdf:RDF>`,

  trig: `@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .
@prefix kg:     <http://scikg.example.org/> .
@prefix paper:  <http://scikg.example.org/paper/> .
@prefix author: <http://scikg.example.org/author/> .
@prefix inst:   <http://scikg.example.org/institution/> .
@prefix graphs: <http://scikg.example.org/graphs/> .

# ── 命名图: 论文 ──────────────────────────────────────────
graphs:papers {
    paper:p4521 a kg:Paper ;
        rdfs:label "深度学习框架在图神经网络中的应用"@zh ;
        kg:doi "10.1234/dl.2026.4521" ;
        kg:pubYear "2026"^^xsd:gYear ;
        kg:writtenBy author:a145 , author:a146 .

    paper:p1892 a kg:Paper ;
        rdfs:label "Attention Is All You Need"@en ;
        kg:doi "10.48550/arXiv.1706.03762" ;
        kg:pubYear "2017"^^xsd:gYear .
}

# ── 命名图: 作者 ──────────────────────────────────────────
graphs:authors {
    author:a145 a kg:Author ;
        rdfs:label "Geoffrey Hinton"@en ;
        kg:orcid "0000-0002-1580-8801" ;
        kg:affiliatedWith inst:i88 .
}

# ── 命名图: 机构 ──────────────────────────────────────────
graphs:institutions {
    inst:i88 a kg:Institution ;
        rdfs:label "多伦多大学"@zh , "University of Toronto"@en ;
        kg:country "CA" ; kg:city "Toronto" .
}

# ── 命名图: 关系 ──────────────────────────────────────────
graphs:relations {
    paper:p4521 kg:CITES paper:p1892 .
    author:a145 kg:AFFILIATED_WITH inst:i88 .
}
# ... 共 4 个命名图 · 602,561 四元组`,

  nquads: `# N-Quads 格式 — 每行一条四元组 (三元组 + 命名图 URI)
<http://scikg.example.org/paper/p4521> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Paper> <http://scikg.example.org/graphs/papers> .
<http://scikg.example.org/paper/p4521> <http://www.w3.org/2000/01/rdf-schema#label> "深度学习框架在图神经网络中的应用"@zh <http://scikg.example.org/graphs/papers> .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/doi> "10.1234/dl.2026.4521" <http://scikg.example.org/graphs/papers> .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/pubYear> "2026"^^<http://www.w3.org/2001/XMLSchema#gYear> <http://scikg.example.org/graphs/papers> .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/writtenBy> <http://scikg.example.org/author/a145> <http://scikg.example.org/graphs/papers> .
<http://scikg.example.org/paper/p1892> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Paper> <http://scikg.example.org/graphs/papers> .
<http://scikg.example.org/paper/p1892> <http://www.w3.org/2000/01/rdf-schema#label> "Attention Is All You Need"@en <http://scikg.example.org/graphs/papers> .
<http://scikg.example.org/author/a145> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Author> <http://scikg.example.org/graphs/authors> .
<http://scikg.example.org/author/a145> <http://www.w3.org/2000/01/rdf-schema#label> "Geoffrey Hinton"@en <http://scikg.example.org/graphs/authors> .
<http://scikg.example.org/author/a145> <http://scikg.example.org/orcid> "0000-0002-1580-8801" <http://scikg.example.org/graphs/authors> .
<http://scikg.example.org/author/a145> <http://scikg.example.org/affiliatedWith> <http://scikg.example.org/institution/i88> <http://scikg.example.org/graphs/authors> .
<http://scikg.example.org/institution/i88> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://scikg.example.org/Institution> <http://scikg.example.org/graphs/institutions> .
<http://scikg.example.org/institution/i88> <http://www.w3.org/2000/01/rdf-schema#label> "多伦多大学"@zh <http://scikg.example.org/graphs/institutions> .
<http://scikg.example.org/institution/i88> <http://www.w3.org/2000/01/rdf-schema#label> "University of Toronto"@en <http://scikg.example.org/graphs/institutions> .
<http://scikg.example.org/paper/p4521> <http://scikg.example.org/CITES> <http://scikg.example.org/paper/p1892> <http://scikg.example.org/graphs/relations> .
# ... 共 602,561 条四元组`,
};

// ─── Syntax highlighting ─────────────────────────────────────────────────────

type TokenType = 'comment' | 'prefix' | 'uri' | 'literal' | 'keyword' |
  'tag' | 'attr' | 'punct' | 'default';

function tokenizeLine(line: string, format: RdfFormat): Array<{ text: string; type: TokenType }> {
  const trim = line.trim();

  // Comments
  if (trim.startsWith('#') || trim.startsWith('//')) {
    return [{ text: line, type: 'comment' }];
  }

  if (format === 'turtle' || format === 'trig') {
    if (trim.startsWith('@prefix')) {
      return [
        { text: '@prefix', type: 'prefix' },
        { text: line.slice('@prefix'.length), type: 'default' },
      ];
    }
    if (trim === '{' || trim === '}') return [{ text: line, type: 'keyword' }];
    if (trim.endsWith('{') && !trim.startsWith('@')) return [{ text: line, type: 'keyword' }];
  }

  if (format === 'rdfxml') {
    if (trim.startsWith('<?xml')) return [{ text: line, type: 'comment' }];
    if (trim.startsWith('<!--') || trim.startsWith('//')) return [{ text: line, type: 'comment' }];
    if (trim.startsWith('<') || trim.startsWith('</') || trim.startsWith('</rdf') || trim.startsWith('<rdf') || trim.startsWith('<kg:')) {
      return [{ text: line, type: 'tag' }];
    }
    return [{ text: line, type: 'default' }];
  }

  if (format === 'jsonld') {
    if (trim === '{' || trim === '}' || trim === '[' || trim === ']' ||
        trim === '{' || trim.startsWith(']')) {
      return [{ text: line, type: 'punct' }];
    }
    if (trim.startsWith('"@')) return [{ text: line, type: 'keyword' }];
    if (trim.startsWith('"')) return [{ text: line, type: 'attr' }];
  }

  if (format === 'ntriples' || format === 'nquads') {
    if (trim.startsWith('<') || trim.startsWith('"')) {
      return [{ text: line, type: 'uri' }];
    }
  }

  return [{ text: line, type: 'default' }];
}

const TOKEN_CLASS: Record<TokenType, string> = {
  comment: 'text-slate-500 italic',
  prefix:  'text-violet-400',
  uri:     'text-sky-300',
  literal: 'text-amber-300',
  keyword: 'text-amber-300',
  tag:     'text-sky-300',
  attr:    'text-amber-200',
  punct:   'text-slate-400',
  default: 'text-slate-200',
};

function CodePreview({ content, format }: { content: string; format: RdfFormat }) {
  const lines = content.split('\n');
  return (
    <code className="block whitespace-pre text-[11px] leading-[1.7] font-mono">
      {lines.map((line, i) => {
        const tokens = tokenizeLine(line, format);
        return (
          <span key={i} className="block">
            {tokens.map((tok, j) => (
              <span key={j} className={TOKEN_CLASS[tok.type]}>{tok.text}</span>
            ))}
          </span>
        );
      })}
    </code>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function fmtBytes(mb: number): string {
  if (mb < 1) return `${Math.round(mb * 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

function estimateSize(totalTriples: number, mult: number, compress: string): string {
  const raw = (totalTriples * 140 * mult) / 1_000_000; // bytes → MB
  const final = compress === 'none' ? raw : raw * 0.22;
  return fmtBytes(final);
}

function estimateTime(totalTriples: number): string {
  const secs = Math.round(totalTriples / 180_000); // ~180k triples/sec
  if (secs < 60) return `~${secs}s`;
  return `~${Math.ceil(secs / 60)}min`;
}

// ─── Main export panel ────────────────────────────────────────────────────────

export function RdfExportPanel({
  graphId, graphName, entityCount, relationCount, targetSpace, onClose,
}: GraphExportProps) {
  const totalTriples = Math.round(entityCount * 4.7 + relationCount);

  const [format, setFormat] = useState<RdfFormat>('turtle');
  const [config, setConfig] = useState<ExportConfig>({
    baseUri: `http://scikg.example.org/`,
    encoding: 'utf-8',
    compress: 'none',
    splitMode: 'single',
    includePrefixes: true,
    includeInferred: false,
    includeComments: true,
    prefixes: DEFAULT_PREFIXES,
  });
  const [optOpen, setOptOpen] = useState<Record<string, boolean>>({
    basic: true, prefixes: false, output: true, content: false,
  });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchProgress, setBatchProgress] = useState<Record<RdfFormat, number>>({} as any);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const meta = FORMAT_META[format];

  const handleExport = () => {
    setExporting(true);
    setDone(false);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += (Math.random() * 12 + 4);
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setTimeout(() => { setDone(true); setExporting(false); }, 300);
      }
      setProgress(Math.min(p, 100));
    }, 250);
  };

  const handleBatchExport = () => {
    setBatchMode(true);
    setDone(false);
    const init: Record<RdfFormat, number> = {} as any;
    FORMAT_ORDER.forEach(f => { init[f] = 0; });
    setBatchProgress(init);

    FORMAT_ORDER.forEach((f, i) => {
      const delay = i * 800;
      const startTime = Date.now() + delay;
      const iv = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < 0) return;
        const p = Math.min((elapsed / 2400) * 100, 100);
        setBatchProgress(prev => ({ ...prev, [f]: p }));
        if (p >= 100) clearInterval(iv);
      }, 100);
    });

    setTimeout(() => { setDone(true); }, FORMAT_ORDER.length * 800 + 2600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PREVIEW[format]).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOpt = (key: string) => setOptOpen(o => ({ ...o, [key]: !o[key] }));

  const addPrefix = () =>
    setConfig(c => ({ ...c, prefixes: [...c.prefixes, { prefix: '', uri: '' }] }));

  const updatePrefix = (i: number, field: 'prefix' | 'uri', val: string) =>
    setConfig(c => {
      const p = [...c.prefixes];
      p[i] = { ...p[i], [field]: val };
      return { ...c, prefixes: p };
    });

  const removePrefix = (i: number) =>
    setConfig(c => ({ ...c, prefixes: c.prefixes.filter((_, j) => j !== i) }));

  const sizeEst = estimateSize(totalTriples, meta.sizeMultiplier, config.compress);
  const timeEst = estimateTime(totalTriples);
  const outFilename = `${targetSpace.replace('kg:', '').replace(/[/:]/g, '-')}${meta.ext}${config.compress === 'gzip' ? '.gz' : config.compress === 'bzip2' ? '.bz2' : ''}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50 shrink-0">
        <FileCode2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-900">{graphName}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">RDF 结构化输出</span>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span><span className="font-semibold text-gray-800">{entityCount.toLocaleString()}</span> 实体</span>
            <span><span className="font-semibold text-gray-800">{relationCount.toLocaleString()}</span> 关系</span>
            <span><span className="font-semibold text-indigo-600">{totalTriples.toLocaleString()}</span> 三元组</span>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0" style={{ height: 620 }}>

        {/* ── Left: format + config ─────────────────────────────── */}
        <div className="w-[360px] shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">

            {/* Format selection */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-3">序列化格式</p>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_ORDER.map(f => {
                  const m = FORMAT_META[f];
                  const selected = format === f;
                  return (
                    <button key={f} onClick={() => { setFormat(f); setDone(false); setProgress(0); setBatchMode(false); }}
                      className={`group text-left p-3 rounded-xl border-2 transition-all ${selected ? `${m.accentBg} ${m.accentBorder}` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <m.icon size={14} className={selected ? m.accentText : 'text-gray-400'} />
                        <span className={`text-[11px] font-bold ${selected ? m.accentText : 'text-gray-700'}`}>
                          {m.label}
                        </span>
                        <span className={`ml-auto text-[9px] font-mono px-1 py-px rounded ${selected ? `${m.accentBg} ${m.accentText}` : 'bg-gray-100 text-gray-400'}`}>
                          {m.ext}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-gray-100 mx-4" />

            {/* Config sections */}
            <div className="px-4 py-3 space-y-0">

              {/* Basic */}
              <Accordion label="基础配置" open={optOpen.basic} onToggle={() => toggleOpt('basic')}>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 block mb-1">Base URI</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-400 bg-white"
                      value={config.baseUri}
                      onChange={e => setConfig(c => ({ ...c, baseUri: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 block mb-1">字符编码</label>
                    <div className="flex gap-1.5">
                      {(['utf-8', 'utf-16'] as const).map(enc => (
                        <button key={enc} onClick={() => setConfig(c => ({ ...c, encoding: enc }))}
                          className={`flex-1 py-1.5 text-[11px] rounded-lg border transition-colors ${config.encoding === enc ? 'border-blue-400 bg-blue-50 text-blue-600 font-semibold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                          {enc.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Accordion>

              {/* Namespace prefixes (Turtle / TriG / JSON-LD / RDF-XML only) */}
              {meta.supportsPrefixes && (
                <Accordion label="命名空间前缀" open={optOpen.prefixes} onToggle={() => toggleOpt('prefixes')}
                  badge={config.prefixes.length.toString()}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Toggle
                        label="输出前缀声明"
                        checked={config.includePrefixes}
                        onChange={v => setConfig(c => ({ ...c, includePrefixes: v }))}
                      />
                    </div>
                    {config.includePrefixes && (
                      <div className="space-y-1.5">
                        {config.prefixes.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <input value={p.prefix}
                              onChange={e => updatePrefix(i, 'prefix', e.target.value)}
                              className="w-16 border border-gray-200 rounded-md px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-blue-400"
                              placeholder="pfx"
                            />
                            <span className="text-gray-300 text-[10px]">→</span>
                            <input value={p.uri}
                              onChange={e => updatePrefix(i, 'uri', e.target.value)}
                              className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-blue-400 truncate"
                              placeholder="http://..."
                            />
                            <button onClick={() => removePrefix(i)}
                              className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                        <button onClick={addPrefix}
                          className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 mt-1">
                          <Plus size={10} /> 添加前缀
                        </button>
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Output options */}
              <Accordion label="输出选项" open={optOpen.output} onToggle={() => toggleOpt('output')}>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 block mb-1.5">文件分割</label>
                    <div className="space-y-1">
                      {([
                        ['single',  '单文件输出'],
                        ['byType',  '按实体类型分割'],
                        ['byClass', '按实体类分割'],
                      ] as const).map(([val, lbl]) => (
                        <label key={val} onClick={() => setConfig(c => ({ ...c, splitMode: val }))}
                          className="flex items-center gap-2 cursor-pointer">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${config.splitMode === val ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                            {config.splitMode === val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-[11px] text-gray-600">{lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 block mb-1.5">压缩格式</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-400 bg-white"
                      value={config.compress}
                      onChange={e => setConfig(c => ({ ...c, compress: e.target.value as any }))}>
                      <option value="none">不压缩</option>
                      <option value="gzip">gzip (.gz) — 约缩小 78%</option>
                      <option value="bzip2">bzip2 (.bz2) — 约缩小 82%</option>
                    </select>
                  </div>
                </div>
              </Accordion>

              {/* Content options */}
              <Accordion label="内容选项" open={optOpen.content} onToggle={() => toggleOpt('content')}>
                <div className="space-y-2.5">
                  <Toggle label="包含推断三元组" checked={config.includeInferred}
                    onChange={v => setConfig(c => ({ ...c, includeInferred: v }))} />
                  <Toggle label="包含元数据注释" checked={config.includeComments}
                    onChange={v => setConfig(c => ({ ...c, includeComments: v }))} />
                </div>
              </Accordion>
            </div>
          </div>

          {/* Export footer */}
          <div className="border-t border-gray-100 p-4 space-y-2.5 shrink-0 bg-white">
            {/* Progress bar */}
            {(exporting || done) && !batchMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500">
                    {done ? '导出完成' : `正在序列化 ${meta.label}…`}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${done ? 'bg-emerald-500' : `bg-${meta.color}-500`}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {done && (
                  <button className={`mt-2 w-full flex items-center justify-center gap-2 py-2 text-xs rounded-lg ${meta.accentBg} ${meta.accentText} border ${meta.accentBorder} hover:opacity-80 transition-opacity font-semibold`}>
                    <Download size={12} /> 下载 {outFilename} ({sizeEst})
                  </button>
                )}
              </div>
            )}

            {/* Batch progress */}
            {batchMode && (
              <div className="space-y-1.5">
                {FORMAT_ORDER.map(f => {
                  const m = FORMAT_META[f];
                  const p = batchProgress[f] || 0;
                  return (
                    <div key={f} className="flex items-center gap-2">
                      <span className={`text-[10px] w-16 shrink-0 ${m.accentText} font-medium`}>{m.label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1">
                        <div className={`h-1 rounded-full transition-all ${p >= 100 ? 'bg-emerald-400' : `bg-${m.color}-400`}`}
                          style={{ width: `${p}%` }} />
                      </div>
                      <span className="text-[10px] w-7 text-right text-gray-400 font-mono">
                        {p >= 100 ? '✓' : `${Math.round(p)}%`}
                      </span>
                    </div>
                  );
                })}
                {done && (
                  <button className="mt-1 w-full flex items-center justify-center gap-2 py-2 text-xs rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors font-semibold">
                    <Download size={12} /> 下载全部格式 (.zip)
                  </button>
                )}
              </div>
            )}

            {!exporting && !batchMode && !done && (
              <>
                <button onClick={handleExport}
                  className={`w-full py-2.5 text-sm rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${meta.accentBg} ${meta.accentText} border-2 ${meta.accentBorder} hover:opacity-90 active:scale-[0.98]`}>
                  <Zap size={14} /> 导出 {meta.label} ({sizeEst})
                </button>
                <button onClick={handleBatchExport}
                  className="w-full py-2 text-xs rounded-xl font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                  <Layers size={12} /> 批量导出全部 6 种格式
                </button>
              </>
            )}

            {done && !exporting && (
              <button onClick={() => { setDone(false); setBatchMode(false); setProgress(0); }}
                className="w-full py-2 text-xs rounded-xl font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                <RotateCcw size={11} /> 重新配置
              </button>
            )}
          </div>
        </div>

        {/* ── Right: preview ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Format info bar */}
          <div className="flex items-start gap-4 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60 shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-bold ${meta.accentText}`}>{meta.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${meta.accentBg} ${meta.accentText}`}>{meta.mime}</span>
                {meta.supportsNamedGraphs && (
                  <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-medium">命名图</span>
                )}
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">W3C</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{meta.longDesc}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {meta.features.map(f => (
                  <span key={f} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>
            {/* Stats */}
            <div className="flex gap-3 shrink-0">
              {[
                { label: '预估大小', value: sizeEst },
                { label: '预估耗时', value: timeEst },
                { label: '三元组', value: totalTriples.toLocaleString() },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-sm font-bold text-gray-800 tabular-nums">{s.value}</div>
                  <div className="text-[10px] text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview header */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 bg-slate-950 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono ${meta.accentText}`}>{outFilename}</span>
              <span className="text-[10px] text-slate-600">· 预览 (前 {PREVIEW[format].split('\n').length} 行)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors">
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          {/* Code preview */}
          <div ref={previewRef} className="flex-1 overflow-auto bg-slate-950 px-5 py-4">
            <CodePreview content={PREVIEW[format]} format={format} />
          </div>

          {/* Format comparison footer */}
          <div className="shrink-0 border-t border-gray-100 px-5 py-2.5 bg-white flex items-center gap-0 overflow-x-auto">
            <span className="text-[10px] text-gray-400 mr-3 shrink-0">格式对比</span>
            {FORMAT_ORDER.map((f, i) => {
              const m = FORMAT_META[f];
              const size = estimateSize(totalTriples, m.sizeMultiplier, config.compress);
              const isSelected = f === format;
              return (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 shrink-0 border-r border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${isSelected ? m.accentBg : ''}`}>
                  <span className={`text-[10px] font-semibold ${isSelected ? m.accentText : 'text-gray-600'}`}>{m.label}</span>
                  <span className="text-[10px] text-gray-400">{size}</span>
                  {isSelected && <span className={`w-1 h-1 rounded-full inline-block ${m.accentText.replace('text-', 'bg-')}`} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small reusable sub-components ───────────────────────────────────────────

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}>
        <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-all shadow-sm ${checked ? 'ml-[18px]' : 'ml-0.5'}`} />
      </div>
      <span className="text-[11px] text-gray-600">{label}</span>
    </label>
  );
}

function Accordion({
  label, open, onToggle, children, badge,
}: {
  label: string; open: boolean; onToggle: () => void; children: React.ReactNode; badge?: string;
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full py-2.5 text-left">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-600">{label}</span>
          {badge && (
            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{badge}</span>
          )}
        </div>
        {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}
