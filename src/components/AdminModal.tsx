import React, { useState } from 'react';
import {
  X,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  DollarSign,
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Search,
  Eye,
} from 'lucide-react';
import { DocumentMetadata } from '../types/rag';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentMetadata[];
  onUpload: (file: File, propertyName: string, docType: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReindex: (id: string) => Promise<void>;
  onInspectDocument: (doc: DocumentMetadata) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  documents,
  onUpload,
  onDelete,
  onReindex,
  onInspectDocument,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [propertyName, setPropertyName] = useState('Green Valley Residency');
  const [docType, setDocType] = useState('brochure');
  const [isUploading, setIsUploading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await onUpload(selectedFile, propertyName, docType);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document from the vector knowledge base?')) return;
    setActionInProgress(id);
    try {
      await onDelete(id);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReindex = async (id: string) => {
    setActionInProgress(id);
    try {
      await onReindex(id);
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = documents.filter(
    (d) =>
      d.document_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.property_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Document Knowledge Base Management
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Upload, re-index, and manage source property brochures, pricing sheets, and project updates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Form Card */}
          <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileUp className="w-4 h-4 text-amber-400" />
              Upload New Knowledge Document
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 font-medium mb-1">
                    Property Association
                  </label>
                  <select
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Green Valley Residency">Green Valley Residency</option>
                    <option value="Skyline Heights">Skyline Heights</option>
                    <option value="Azure Bay Luxury Residences">Azure Bay Luxury Residences</option>
                    <option value="General Portfolio">General Portfolio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 font-medium mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="brochure">Master Brochure</option>
                    <option value="pricing_sheet">Pricing & Cost Sheet</option>
                    <option value="project_update">Project Progress Update</option>
                    <option value="faq">FAQ / Q&A Sheet</option>
                    <option value="floor_plan">Floor Plan & Area Specs</option>
                    <option value="legal_rera">Legal & RERA Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 font-medium mb-1">
                    File (PDF, TXT, MD, CSV, JSON)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,.csv,.json"
                    onChange={handleFileChange}
                    className="w-full text-xs text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
                  />
                </div>
              </div>

              {uploadError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-medium text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Extracting & Ingesting...' : 'Ingest to Vector DB'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Indexed Documents Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Indexed Documents ({documents.length})
              </div>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
                />
              </div>
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/40">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-3 font-medium">Document Name</th>
                    <th className="p-3 font-medium">Property</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Chunks</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-neutral-500">
                        No documents found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((doc) => (
                      <tr key={doc.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="p-3 font-medium text-neutral-200 max-w-xs truncate">
                          {doc.document_name}
                        </td>
                        <td className="p-3 text-neutral-400 max-w-[140px] truncate">
                          {doc.property_name}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 border border-neutral-700 text-neutral-300">
                            {doc.document_type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-neutral-300">
                          {doc.chunk_count}
                        </td>
                        <td className="p-3">
                          {doc.status === 'INDEXED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Indexed
                            </span>
                          ) : doc.status === 'PROCESSING' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 w-fit">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Processing
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => onInspectDocument(doc)}
                            className="p-1.5 hover:text-neutral-100 rounded hover:bg-neutral-800 text-neutral-400 transition-colors cursor-pointer"
                            title="Inspect Chunks"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReindex(doc.id)}
                            disabled={actionInProgress === doc.id}
                            className="p-1.5 hover:text-neutral-100 rounded hover:bg-neutral-800 text-neutral-400 transition-colors cursor-pointer disabled:opacity-40"
                            title="Re-index Document"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                actionInProgress === doc.id ? 'animate-spin' : ''
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={actionInProgress === doc.id}
                            className="p-1.5 hover:text-rose-400 rounded hover:bg-neutral-800 text-neutral-500 transition-colors cursor-pointer disabled:opacity-40"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Metadata & Chunks Persisted in Memory Store</span>
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
