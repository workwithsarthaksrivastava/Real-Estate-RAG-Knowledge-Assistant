import React from 'react';
import { Building2, ShieldCheck, Database, BarChart3, Settings, Sparkles } from 'lucide-react';
import { KnowledgeStats } from '../types/rag';

interface HeaderProps {
  stats: KnowledgeStats | null;
  selectedProperty: string;
  onSelectProperty: (property: string) => void;
  onOpenAdmin: () => void;
  onOpenEval: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  selectedProperty,
  onSelectProperty,
  onOpenAdmin,
  onOpenEval,
}) => {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-5 flex items-center justify-between z-20 shrink-0">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-semibold text-neutral-100 tracking-tight">
              EstateRAG
            </h1>
            <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Grounded
            </span>
          </div>
          <p className="text-xs text-neutral-400 truncate max-w-xs sm:max-w-md">
            Traceable Real Estate Retrieval-Augmented Knowledge Assistant
          </p>
        </div>
      </div>

      {/* Property Selector & Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Active Property Scope Dropdown */}
        <div className="hidden md:flex items-center space-x-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5">
          <span className="text-xs text-neutral-400 font-medium">Scope:</span>
          <select
            value={selectedProperty}
            onChange={(e) => onSelectProperty(e.target.value)}
            className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer font-medium"
          >
            <option value="All Properties" className="bg-neutral-900 text-neutral-200">
              All Properties ({stats?.totalProperties || 3})
            </option>
            {stats?.properties?.map((prop) => (
              <option key={prop} value={prop} className="bg-neutral-900 text-neutral-200">
                {prop}
              </option>
            ))}
          </select>
        </div>

        {/* Knowledge Base Status Pill */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/50 text-xs text-neutral-300">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>{stats?.totalDocuments ?? 0} Docs</span>
          <span className="text-neutral-500">•</span>
          <span>{stats?.totalChunks ?? 0} Chunks</span>
        </div>

        {/* Evaluation Suite Button */}
        <button
          onClick={onOpenEval}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-xs font-medium text-neutral-200 transition-colors shadow-sm cursor-pointer"
          title="Run RAG Evaluation Benchmark on real queries"
        >
          <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">RAG Benchmark</span>
        </button>

        {/* Admin Knowledge Base Manager Button */}
        <button
          onClick={onOpenAdmin}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 transition-colors shadow-sm cursor-pointer"
          title="Manage documents, upload new brochures, and inspect chunks"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Manage Docs</span>
        </button>
      </div>
    </header>
  );
};
