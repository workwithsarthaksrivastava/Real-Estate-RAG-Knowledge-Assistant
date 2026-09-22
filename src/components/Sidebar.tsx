import React from 'react';
import {
  FileText,
  DollarSign,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Sparkles,
  Search,
} from 'lucide-react';
import { DocumentMetadata } from '../types/rag';

interface SidebarProps {
  documents: DocumentMetadata[];
  selectedProperty: string;
  onSelectProperty: (property: string) => void;
  selectedDocType: string;
  onSelectDocType: (docType: string) => void;
  onInspectDocument: (doc: DocumentMetadata) => void;
  onClearChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  selectedProperty,
  onSelectProperty,
  selectedDocType,
  onSelectDocType,
  onInspectDocument,
  onClearChat,
}) => {
  // Filter documents based on property and doc type
  const filteredDocs = documents.filter((doc) => {
    const matchesProperty =
      selectedProperty === 'All Properties' || doc.property_name === selectedProperty;
    const matchesType =
      selectedDocType === 'all' || doc.document_type === selectedDocType;
    return matchesProperty && matchesType;
  });

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing_sheet':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'faq':
        return <HelpCircle className="w-3.5 h-3.5 text-sky-400" />;
      case 'project_update':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'floor_plan':
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-neutral-300" />;
    }
  };

  const docTypes = [
    { id: 'all', label: 'All' },
    { id: 'brochure', label: 'Brochures' },
    { id: 'pricing_sheet', label: 'Pricing' },
    { id: 'project_update', label: 'Updates' },
    { id: 'faq', label: 'FAQs' },
  ];

  return (
    <aside className="w-80 border-r border-neutral-800 bg-neutral-900/60 flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Property Switcher Cards */}
      <div className="p-3.5 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Property Filter
          </span>
          <button
            onClick={onClearChat}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center space-x-1 cursor-pointer transition-colors"
            title="Clear current conversation and memory"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Chat</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {['All Properties', 'Green Valley Residency', 'Skyline Heights', 'Azure Bay Luxury Residences'].map((prop) => {
            const isSelected = selectedProperty === prop;
            return (
              <button
                key={prop}
                onClick={() => onSelectProperty(prop)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-sm'
                    : 'bg-neutral-800/40 hover:bg-neutral-800/80 border border-transparent text-neutral-300'
                }`}
              >
                <span className="truncate">{prop}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Type Category Filter */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/30">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
          {docTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectDocType(t.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedDocType === t.id
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Source Documents List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-medium px-1 mb-1">
          <span>Verified Documents ({filteredDocs.length})</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Grounded
          </span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
            No documents match current filters.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onInspectDocument(doc)}
              className="p-2.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group"
            >
              <div className="flex items-start space-x-2">
                <div className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 mt-0.5 shrink-0">
                  {getDocTypeIcon(doc.document_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-medium text-neutral-200 truncate group-hover:text-amber-300 transition-colors">
                    {doc.document_name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-1">
                    <span className="truncate">{doc.property_name}</span>
                    <span>•</span>
                    <span className="text-neutral-400 shrink-0">{doc.chunk_count} chunks</span>
                  </div>
                  {doc.publication_date && (
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Date: {doc.publication_date} {doc.version ? `(v${doc.version})` : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RAG Pipeline Config Info Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/60 text-[11px] text-neutral-400 space-y-1.5">
        <div className="flex items-center justify-between text-neutral-300 font-medium">
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-amber-400" /> Pipeline Parameters
          </span>
          <span className="text-[10px] text-neutral-500">v2.4 Grounded</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-neutral-400">
          <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
            <div className="text-neutral-500">Retrieval</div>
            <div className="text-neutral-200 font-medium">Dense + BM25</div>
          </div>
          <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
            <div className="text-neutral-500">Top-K Chunks</div>
            <div className="text-neutral-200 font-medium">4 Contextual</div>
          </div>
          <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
            <div className="text-neutral-500">Reranker</div>
            <div className="text-neutral-200 font-medium">Entity & Recency</div>
          </div>
          <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
            <div className="text-neutral-500">Safeguards</div>
            <div className="text-emerald-400 font-medium">Anti-Hallucination</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
