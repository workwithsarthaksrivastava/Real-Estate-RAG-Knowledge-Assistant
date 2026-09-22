export interface DocumentMetadata {
  id: string;
  document_name: string;
  document_type: 'brochure' | 'pricing_sheet' | 'floor_plan' | 'faq' | 'project_update' | 'legal_rera';
  property_name: string;
  version?: string;
  publication_date?: string; // e.g. "2026-01-15" or "2026-06-10"
  author?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  status: 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  error_message?: string;
  chunk_count: number;
}

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  document_name: string;
  document_type: string;
  property_name: string;
  page_number: number;
  section: string;
  content: string;
  embedding?: number[];
  token_estimate: number;
  metadata?: Record<string, any>;
}

export interface SearchFilter {
  property_name?: string;
  document_type?: string;
  document_id?: string;
}

export interface RetrievedChunk extends DocumentChunk {
  similarity_score: number;
  bm25_score: number;
  combined_score: number;
  match_reasons: string[];
}

export interface SourceCitation {
  citation_id: string;
  document_name: string;
  document_type: string;
  property_name: string;
  page_number: number;
  section: string;
  excerpt: string;
  similarity_score: number;
  chunk_id: string;
  publication_date?: string;
}

export interface DetectedConflict {
  field: 'possession_date' | 'price' | 'payment_plan' | 'specifications';
  property_name: string;
  sources: {
    document_name: string;
    publication_date?: string;
    value: string;
    excerpt: string;
    page_number: number;
  }[];
  summary: string;
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RAGResponse {
  answer: string;
  confidence: ConfidenceLevel;
  confidence_score: number;
  citations: SourceCitation[];
  conflicts: DetectedConflict[];
  is_refusal: boolean;
  refusal_reason?: string;
  metrics: {
    retrieval_time_ms: number;
    generation_time_ms: number;
    total_time_ms: number;
    chunks_evaluated: number;
    chunks_provided_to_llm: number;
    tokens_used_estimate: number;
    model: string;
  };
  retrieved_chunks: RetrievedChunk[];
}

export interface EvaluationTestCase {
  id: string;
  category: 'exact_factual' | 'paraphrased' | 'multi_turn' | 'missing_info' | 'out_of_scope' | 'conflicting' | 'multi_property' | 'pricing';
  question: string;
  property_context?: string;
  expected_answer_keywords: string[];
  should_refuse: boolean;
  expected_conflict?: boolean;
  description: string;
}

export interface EvaluationResult {
  test_case_id: string;
  question: string;
  category: string;
  passed: boolean;
  actual_answer: string;
  confidence: ConfidenceLevel;
  refusal_matched: boolean;
  keywords_matched: boolean;
  citations_count: number;
  latency_ms: number;
  notes: string;
}

export type ChatbotRole = 'verification' | 'investment' | 'legal_rera' | 'concierge' | 'custom';
export type ReasoningMode = 'fast' | 'balanced' | 'complex';

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  propertyContext?: string;
}

export interface ChatRequestOptions {
  role?: ChatbotRole;
  mode?: ReasoningMode;
  customSystemInstruction?: string;
}

export interface EvaluationReport {
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: string;
    avgLatencyMs: number;
    totalDurationMs: number;
  };
  results: EvaluationResult[];
}

