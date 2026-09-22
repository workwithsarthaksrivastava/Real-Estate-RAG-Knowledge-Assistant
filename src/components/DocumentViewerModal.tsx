import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Layers,
  Calendar,
  Hash,
  Copy,
  Check,
  Search,
  Code,
  Eye,
} from 'lucide-react';
import { DocumentMetadata, DocumentChunk } from '../types/rag';
import { FormattedMessage } from './FormattedMessage';

interface DocumentViewerModalProps {
  document: DocumentMetadata | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  useEffect(() => {
    if (document && isOpen) {
      setIsLoading(true);
      fetch(`/api/documents/${document.id}/chunks`)
        .then((res) => res.json())
        .then((data: DocumentChunk[]) => {
          setChunks(data);
          if (data.length > 0) setSelectedChunk(data[0]);
        })
        .catch((err) => console.error('Failed to load chunks:', err))
        .finally(() => setIsLoading(false));
    }
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredChunks = chunks.filter(
    (c) =>
      c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 truncate max-w-md">
                {document.document_name}
              </h2>
              <div className="flex items-center space-x-3 text-xs text-neutral-400 mt-0.5">
                <span>{document.property_name}</span>
                <span>•</span>
                <span className="capitalize">{document.document_type}</span>
                {document.publication_date && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {document.publication_date}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{chunks.length} Chunks</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chunk List */}
          <div className="w-80 border-r border-neutral-800 bg-neutral-950/40 flex flex-col shrink-0">
            <div className="p-3 border-b border-neutral-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search in chunks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                <div className="p-4 text-center text-xs text-neutral-500">Loading chunk indices...</div>
              ) : filteredChunks.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">No chunks match query.</div>
              ) : (
                filteredChunks.map((chunk, idx) => {
                  const isSelected = selectedChunk?.chunk_id === chunk.chunk_id;
                  return (
                    <button
                      key={chunk.chunk_id}
                      onClick={() => setSelectedChunk(chunk)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-neutral-800 border-amber-500/50 text-neutral-100 shadow-sm'
                          : 'bg-neutral-900/40 hover:bg-neutral-800/40 border-neutral-800/80 text-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-neutral-200 truncate max-w-[160px]">
                          Chunk #{idx + 1}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          P.{chunk.page_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 truncate mb-1">
                        {chunk.section}
                      </div>
                      <div className="text-[10px] text-neutral-500 line-clamp-2">
                        {chunk.content}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Chunk Full Preview & Metadata */}
          <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
            {selectedChunk ? (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-200">
                      Chunk Preview: {selectedChunk.section}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-neutral-500 mt-1 font-mono">
                      <span>ID: {selectedChunk.chunk_id}</span>
                      <span>•</span>
                      <span>Page: {selectedChunk.page_number}</span>
                      <span>•</span>
                      <span>Tokens (est): ~{selectedChunk.token_estimate}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => setViewMode('formatted')}
                        className={`px-2 py-1 rounded flex items-center space-x-1 cursor-pointer transition-colors ${
                          viewMode === 'formatted'
                            ? 'bg-neutral-800 text-amber-300 font-medium'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Formatted</span>
                      </button>
                      <button
                        onClick={() => setViewMode('raw')}
                        className={`px-2 py-1 rounded flex items-center space-x-1 cursor-pointer transition-colors ${
                          viewMode === 'raw'
                            ? 'bg-neutral-800 text-amber-300 font-medium'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        <span>Raw</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopy(selectedChunk.content, selectedChunk.chunk_id)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors cursor-pointer"
                    >
                      {copiedId === selectedChunk.chunk_id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === selectedChunk.chunk_id ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mt-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 leading-relaxed select-text">
                  {viewMode === 'formatted' ? (
                    <FormattedMessage content={selectedChunk.content} />
                  ) : (
                    <pre className="font-mono whitespace-pre-wrap text-neutral-300">{selectedChunk.content}</pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-500">
                Select a chunk from the list to view full extracted grounding text.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Structure-Aware Chunk Inspector</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
