import { DocumentChunk } from './types.js';

export interface BM25Result {
  chunk: DocumentChunk;
  score: number;
  matchedTerms: string[];
}

export class BM25Engine {
  private k1: number;
  private b: number;
  private docLengths: Map<string, number> = new Map();
  private avgDocLength: number = 0;
  private docFrequencies: Map<string, number> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private chunkMap: Map<string, DocumentChunk> = new Map();
  private totalDocs: number = 0;

  constructor(k1: number = 1.5, b: number = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s₹\.,\-\/]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  public indexChunks(chunks: DocumentChunk[]): void {
    this.chunkMap.clear();
    this.docLengths.clear();
    this.docFrequencies.clear();
    this.invertedIndex.clear();
    this.totalDocs = chunks.length;

    let totalLength = 0;

    for (const chunk of chunks) {
      this.chunkMap.set(chunk.chunk_id, chunk);
      // Boost section headers and metadata keywords
      const fullText = `${chunk.property_name} ${chunk.section} ${chunk.content}`;
      const tokens = this.tokenize(fullText);
      const docLen = tokens.length;
      this.docLengths.set(chunk.chunk_id, docLen);
      totalLength += docLen;

      const uniqueTerms = new Set(tokens);
      for (const term of uniqueTerms) {
        this.docFrequencies.set(term, (this.docFrequencies.get(term) || 0) + 1);
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Set());
        }
        this.invertedIndex.get(term)!.add(chunk.chunk_id);
      }
    }

    this.avgDocLength = this.totalDocs > 0 ? totalLength / this.totalDocs : 1;
  }

  public search(query: string, filterProperty?: string, topK: number = 10): BM25Result[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0 || this.totalDocs === 0) return [];

    const scores = new Map<string, number>();
    const matchedTermsMap = new Map<string, Set<string>>();

    for (const term of queryTokens) {
      const docIds = this.invertedIndex.get(term);
      if (!docIds) continue;

      const df = this.docFrequencies.get(term) || 0;
      // Robertson-Spärck Jones IDF
      const idf = Math.log((this.totalDocs - df + 0.5) / (df + 0.5) + 1);

      for (const docId of docIds) {
        const chunk = this.chunkMap.get(docId);
        if (!chunk) continue;

        if (filterProperty && chunk.property_name.toLowerCase() !== filterProperty.toLowerCase()) {
          continue;
        }

        const tokens = this.tokenize(`${chunk.property_name} ${chunk.section} ${chunk.content}`);
        let tf = 0;
        for (const t of tokens) {
          if (t === term) tf++;
        }

        const docLen = this.docLengths.get(docId) || this.avgDocLength;
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
        const termScore = idf * (numerator / denominator);

        scores.set(docId, (scores.get(docId) || 0) + termScore);
        if (!matchedTermsMap.has(docId)) {
          matchedTermsMap.set(docId, new Set());
        }
        matchedTermsMap.get(docId)!.add(term);
      }
    }

    const results: BM25Result[] = [];
    for (const [docId, score] of scores.entries()) {
      const chunk = this.chunkMap.get(docId);
      if (chunk) {
        results.push({
          chunk,
          score,
          matchedTerms: Array.from(matchedTermsMap.get(docId) || []),
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}
