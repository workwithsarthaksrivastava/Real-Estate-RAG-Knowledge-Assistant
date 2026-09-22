import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { SourcesDrawer } from './components/SourcesDrawer';
import { AdminModal } from './components/AdminModal';
import { EvaluationModal } from './components/EvaluationModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import {
  DocumentMetadata,
  KnowledgeStats,
  ChatMessage,
  SourceCitation,
  RAGResponse,
  ChatRequestOptions,
} from './types/rag';

export function App() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('All Properties');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals & Drawers state
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDocForViewer, setActiveDocForViewer] = useState<DocumentMetadata | null>(null);
  const [activeCitationForDrawer, setActiveCitationForDrawer] = useState<SourceCitation | null>(null);
  const [lastRAGResponse, setLastRAGResponse] = useState<RAGResponse | null>(null);

  // Initial fetch on mount
  useEffect(() => {
    fetchStats();
    fetchDocuments();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    }
  };

  // Send Chat Message to RAG endpoint with multi-turn options
  const handleSendMessage = async (queryText: string, options?: ChatRequestOptions) => {
    const userMsgId = `msg_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      propertyContext: selectedProperty !== 'All Properties' ? selectedProperty : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build previous message history for context resolution
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
        propertyContext: m.propertyContext,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          history,
          selectedProperty: selectedProperty !== 'All Properties' ? selectedProperty : undefined,
          role: options?.role,
          mode: options?.mode,
          customSystemInstruction: options?.customSystemInstruction,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process query');
      }

      const ragResponse: RAGResponse = await res.json();
      setLastRAGResponse(ragResponse);

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: ragResponse.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragResponse,
        roleBadge: options?.role,
        modeBadge: options?.mode,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically open sources drawer if retrieved chunks are available
      if (ragResponse.retrieved_chunks && ragResponse.retrieved_chunks.length > 0) {
        setIsDrawerOpen(true);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'An unexpected error occurred while querying the knowledge base.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCitation = (citation: SourceCitation) => {
    setActiveCitationForDrawer(citation);
    setIsDrawerOpen(true);
  };

  const handleInspectDocument = (doc: DocumentMetadata) => {
    setActiveDocForViewer(doc);
    setIsViewerOpen(true);
  };

  const handleClearChat = () => {
    setMessages([]);
    setLastRAGResponse(null);
    setIsDrawerOpen(false);
  };

  const handleFeedback = async (messageId: string, feedback: 'helpful' | 'unhelpful') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );
    const targetMsg = messages.find((m) => m.id === messageId);
    if (targetMsg) {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            feedback,
            query: targetMsg.content,
            answer: targetMsg.content,
          }),
        });
      } catch (e) {
        console.error('Feedback recording failed:', e);
      }
    }
  };

  // Document management operations
  const handleUploadDocument = async (file: File, propertyName: string, docType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('property_name', propertyName);
    formData.append('document_type', docType);

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }

    await fetchDocuments();
    await fetchStats();
  };

  const handleDeleteDocument = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    await fetchDocuments();
    await fetchStats();
  };

  const handleReindexDocument = async (id: string) => {
    const res = await fetch(`/api/documents/${id}/reindex`, { method: 'POST' });
    if (!res.ok) throw new Error('Re-index failed');
    await fetchDocuments();
    await fetchStats();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Top Application Header */}
      <Header
        stats={stats}
        selectedProperty={selectedProperty}
        onSelectProperty={setSelectedProperty}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenEval={() => setIsEvalOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Document Knowledge Sidebar */}
        <Sidebar
          documents={documents}
          selectedProperty={selectedProperty}
          onSelectProperty={setSelectedProperty}
          selectedDocType={selectedDocType}
          onSelectDocType={setSelectedDocType}
          onInspectDocument={handleInspectDocument}
          onClearChat={handleClearChat}
        />

        {/* Center Grounded Chat Stream & Prompt Interface */}
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onSelectCitation={handleSelectCitation}
          selectedProperty={selectedProperty}
          onFeedback={handleFeedback}
          onClearChat={handleClearChat}
        />

        {/* Right Grounding Provenance Drawer */}
        <SourcesDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeResponse={lastRAGResponse}
          activeCitation={activeCitationForDrawer}
        />
      </div>

      {/* Admin Knowledge Base Manager Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        documents={documents}
        onUpload={handleUploadDocument}
        onDelete={handleDeleteDocument}
        onReindex={handleReindexDocument}
        onInspectDocument={handleInspectDocument}
      />

      {/* Evaluation Benchmark Modal */}
      <EvaluationModal
        isOpen={isEvalOpen}
        onClose={() => setIsEvalOpen(false)}
      />

      {/* Document Chunk Inspector Modal */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={activeDocForViewer}
      />
    </div>
  );
}
export default App;
