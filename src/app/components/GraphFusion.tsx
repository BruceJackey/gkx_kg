import OntologyEditor from './OntologyEditor';

export default function GraphFusion() {
  return (
    <div className="h-full flex flex-col gap-5">
      <div className="flex-shrink-0">
        <h1 className="text-2xl text-white mb-1">图谱融合</h1>
        <p className="text-sm text-gray-400">跨本体 Schema 匹配与实体对齐，将多源本体融合为统一图谱</p>
      </div>
      <div className="flex-1 min-h-0">
        <OntologyEditor initialMode="schema-match" lockMode={true} />
      </div>
    </div>
  );
}
