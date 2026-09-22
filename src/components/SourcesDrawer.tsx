import React, { useState } from 'react';
import {
  X,
  FileText,
  Search,
  CheckCircle2,
  Activity,
  Cpu,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { RetrievedChunk, SourceCitation, RAGResponse } from '../types/rag';
import { FormattedMessage } from './FormattedMessage';

interface SourcesDrawerProps {
  activeResponse: RAGResponse | null;
  activeCitation: SourceCitation | null;
  onClose: () => void;
  isOpen: boolean;
}

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({
  activeResponse,
  activeCitation,
  onClose,
  isOpen,
}) => {
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);

  if (!isOpen) return null;

  const chunks = activeResponse?.retrieved_chunks || [];
  const metrics = activeResponse?.metrics;
  const conflicts = activeResponse?.conflicts || [];

  // If a specific citation was clicked, highlight that chunk
  const activeChunk = selectedChunkId
    ? chunks.find((c) => c.chunk_id === selectedChunkId)
    : activeCitation
    ? chunks.find((c) => c.chunk_id === activeCitation.chunk_id) || chunks[0]
    : chunks[0];

  return (
    <aside className="w-96 border-l border-neutral-800 bg-neutral-900/90 flex flex-col h-full shrink-0 select-none overflow-hidden z-20">
      {/* Drawer Header */}
      <div className="h-14 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-neutral-950/40">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-neutral-200 tracking-tight">
            Traceable Source Provenance
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* RAG Observability & Latency Bar */}
      {metrics && (
        <div className="p-3 border-b border-neutral-800 bg-neutral-950/70 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-neutral-400 font-medium">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-sky-400" /> Pipeline Observability
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Total: {metrics.total_time_ms}ms
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800/80">
              <div className="text-neutral-500">Retrieval</div>
              <div className="text-neutral-200 font-medium font-mono">
                {metrics.retrieval_time_ms}ms
              </div>
            </div>
            <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800/80">
              <div className="text-neutral-500">Generation</div>
              <div className="text-neutral-200 font-medium font-mono">
                {metrics.generation_time_ms}ms
              </div>
            </div>
            <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800/80">
              <div className="text-neutral-500">Tokens (est.)</div>
              <div className="text-neutral-200 font-medium font-mono">
                {metrics.tokens_used_estimate}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Retrieved Chunks List & Detailed Excerpt */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chunks.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
            <Search className="w-8 h-8 mx-auto text-neutral-700 stroke-1" />
            <p>No query context retrieved yet.</p>
            <p className="text-[11px] text-neutral-600">
              Submit a question in chat to inspect retrieved chunks and similarity scoring.
            </p>
          </div>
        ) : (
          <>
            {/* Conflict Banner if applicable */}
            {conflicts.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Cross-Document Conflict</span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  {conflicts[0].summary}
                </p>
              </div>
            )}

            {/* Chunk Selector Tabs */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Retrieved Context Chunks ({chunks.length})
              </div>
              <div className="space-y-1.5">
                {chunks.map((chunk, idx) => {
                  const isSelected = activeChunk?.chunk_id === chunk.chunk_id;
                  return (
                    <button
                      key={chunk.chunk_id}
                      onClick={() => setSelectedChunkId(chunk.chunk_id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-neutral-800 border-amber-500/50 text-neutral-100 shadow-sm'
                          : 'bg-neutral-900/60 hover:bg-neutral-800/60 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate max-w-[190px]">
                          {idx + 1}. {chunk.document_name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950 text-amber-400 border border-neutral-800">
                          Score: {(chunk.combined_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-neutral-500">
                        <span>Page {chunk.page_number}</span>
                        <span>•</span>
                        <span className="truncate">{chunk.section}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Chunk Inspection Card */}
            {activeChunk && (
              <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3.5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between border-b border-neutral-800/80 pb-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400">
                      {activeChunk.document_name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Section: <strong className="text-neutral-300">{activeChunk.section}</strong> (Page {activeChunk.page_number})
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300">
                    {activeChunk.document_type}
                  </span>
                </div>

                {/* Match Reasons Heuristics */}
                {activeChunk.match_reasons && activeChunk.match_reasons.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                      Match Rationale:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeChunk.match_reasons.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-300"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Grounding Text */}
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                    Extracted Grounding Text:
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200 leading-relaxed font-sans max-h-72 overflow-y-auto select-text">
                    <FormattedMessage content={activeChunk.content} />
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500 flex items-center justify-between pt-1">
                  <span>ID: {activeChunk.chunk_id}</span>
                  <span>~{activeChunk.token_estimate} tokens</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
