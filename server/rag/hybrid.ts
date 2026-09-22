import { DocumentChunk, RetrievedChunk, SearchFilter } from './types.js';
import { VectorStore } from './vectorstore.js';
import { BM25Engine } from './bm25.js';

export interface HybridSearchOptions {
  topK?: number;                 // Final chunks to return (default 5)
  candidatesK?: number;           // Initial candidates before rerank (default 12)
  vectorWeight?: number;          // Default 0.6
  bm25Weight?: number;            // Default 0.4
  minScoreThreshold?: number;     // Minimum score to consider relevant (e.g. 0.25)
}

export class HybridSearchEngine {
  private vectorStore: VectorStore;
  private bm25Engine: BM25Engine;

  constructor(vectorStore: VectorStore, bm25Engine: BM25Engine) {
    this.vectorStore = vectorStore;
    this.bm25Engine = bm25Engine;
  }

  public async search(
    query: string,
    filter?: SearchFilter,
    options: HybridSearchOptions = {}
  ): Promise<{
    retrievedChunks: RetrievedChunk[];
    topScore: number;
    searchLatencyMs: number;
  }> {
    const startTime = Date.now();
    const topK = options.topK || 5;
    const candidatesK = options.candidatesK || 12;
    const vectorWeight = options.vectorWeight ?? 0.55;
    const bm25Weight = options.bm25Weight ?? 0.45;

    // 1. Vector Search
    const vectorResults = await this.vectorStore.similarity_search_with_score(
      query,
      candidatesK,
      filter
    );

    // 2. BM25 Search
    const bm25Results = this.bm25Engine.search(
      query,
      filter?.property_name,
      candidatesK
    );

    // Normalize BM25 scores to [0, 1] range
    const maxBm25 = bm25Results.length > 0 ? Math.max(...bm25Results.map((r) => r.score), 1) : 1;

    // Map chunks by ID
    const candidateMap = new Map<string, {
      chunk: DocumentChunk;
      vectorScore: number;
      bm25Score: number;
      matchedTerms: string[];
    }>();

    for (const vr of vectorResults) {
      // Cosine similarity can be negative or slightly off 0..1, normalize to [0, 1]
      const normalizedVector = Math.max(0, Math.min(1, (vr.score + 1) / 2));
      candidateMap.set(vr.chunk.chunk_id, {
        chunk: vr.chunk,
        vectorScore: normalizedVector,
        bm25Score: 0,
        matchedTerms: [],
      });
    }

    for (const br of bm25Results) {
      const normalizedBm25 = Math.max(0, Math.min(1, br.score / maxBm25));
      if (candidateMap.has(br.chunk.chunk_id)) {
        const item = candidateMap.get(br.chunk.chunk_id)!;
        item.bm25Score = normalizedBm25;
        item.matchedTerms = br.matchedTerms;
      } else {
        candidateMap.set(br.chunk.chunk_id, {
          chunk: br.chunk,
          vectorScore: 0,
          bm25Score: normalizedBm25,
          matchedTerms: br.matchedTerms,
        });
      }
    }

    // 3. Reranking & Combined Scoring with Real Estate Heuristics
    const scoredList: RetrievedChunk[] = [];
    const queryLower = query.toLowerCase();

    for (const item of candidateMap.values()) {
      const matchReasons: string[] = [];

      // Base hybrid weighted score
      let combined = (item.vectorScore * vectorWeight) + (item.bm25Score * bm25Weight);

      if (item.vectorScore > 0.6) {
        matchReasons.push(`Semantic match (${(item.vectorScore * 100).toFixed(0)}%)`);
      }
      if (item.bm25Score > 0.4) {
        matchReasons.push(`Keywords matched: ${item.matchedTerms.slice(0, 4).join(', ')}`);
      }

      // RERANKER BOOST 1: Exact numeric / configuration matches (e.g. "3 BHK", "2 BHK", "Phase 2")
      const bhkMatch = queryLower.match(/(\d\s*bhk|\d\s*bedroom)/);
      if (bhkMatch && item.chunk.content.toLowerCase().includes(bhkMatch[1])) {
        combined += 0.15;
        matchReasons.push(`Exact configuration match: "${bhkMatch[1]}"`);
      }

      const phaseMatch = queryLower.match(/(phase\s*\d|tower\s*[a-z0-9])/i);
      if (phaseMatch && item.chunk.content.toLowerCase().includes(phaseMatch[1].toLowerCase())) {
        combined += 0.12;
        matchReasons.push(`Exact phase/tower match: "${phaseMatch[1]}"`);
      }

      // RERANKER BOOST 2: Pricing intent match
      if ((queryLower.includes('price') || queryLower.includes('cost') || queryLower.includes('payment') || queryLower.includes('rate')) &&
          (item.chunk.document_type === 'pricing_sheet' || item.chunk.content.includes('₹') || item.chunk.content.includes('crore') || item.chunk.content.includes('lakh'))) {
        combined += 0.10;
        matchReasons.push(`Pricing sheet priority`);
      }

      // RERANKER BOOST 3: Possession date intent match
      if ((queryLower.includes('possession') || queryLower.includes('handover') || queryLower.includes('completion')) &&
          (item.chunk.content.toLowerCase().includes('possession') || item.chunk.document_type === 'project_update')) {
        combined += 0.12;
        matchReasons.push(`Possession timeline priority`);
      }

      // RERANKER BOOST 4: Document freshness (prefer newer project updates for schedules)
      if (item.chunk.document_name.toLowerCase().includes('update') || item.chunk.document_name.toLowerCase().includes('2026')) {
        combined += 0.05;
      }

      scoredList.push({
        ...item.chunk,
        similarity_score: item.vectorScore,
        bm25_score: item.bm25Score,
        combined_score: Math.min(1, combined),
        match_reasons: matchReasons,
      });
    }

    scoredList.sort((a, b) => b.combined_score - a.combined_score);

    const filtered = scoredList.slice(0, topK);
    const topScore = filtered.length > 0 ? filtered[0].combined_score : 0;
    const searchLatencyMs = Date.now() - startTime;

    return {
      retrievedChunks: filtered,
      topScore,
      searchLatencyMs,
    };
  }
}
