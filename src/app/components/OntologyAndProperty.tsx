import { useState } from 'react';
import { Layers, Tag } from 'lucide-react';
import OntologyEditor from './OntologyEditor';
import PropertyManagement from './PropertyManagement';

export default function OntologyAndProperty() {
  const [tab, setTab] = useState<'ontology' | 'property'>('ontology');

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl text-white mb-1">本体与属性管理</h1>
          <p className="text-sm text-gray-400">定义科研领域的实体类型、关系结构及属性层级，并对图谱实体进行属性编辑</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-700 flex-shrink-0">
        {[
          { id: 'ontology', label: '本体设计', icon: Layers },
          { id: 'property', label: '属性管理', icon: Tag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-[#2563eb] text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0">
        {tab === 'ontology' ? <OntologyEditor /> : <PropertyManagement />}
      </div>
    </div>
  );
}
