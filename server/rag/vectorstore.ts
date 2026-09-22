import { DocumentChunk, SearchFilter } from './types.js';
import { EmbeddingProvider, cosineSimilarity } from './embeddings.js';

export interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export class VectorStore {
  private chunks: Map<string, DocumentChunk> = new Map();
  private embeddingProvider: EmbeddingProvider;

  constructor(embeddingProvider: EmbeddingProvider) {
    this.embeddingProvider = embeddingProvider;
  }

  public setEmbeddingProvider(provider: EmbeddingProvider) {
    this.embeddingProvider = provider;
  }

  public getEmbeddingProvider(): EmbeddingProvider {
    return this.embeddingProvider;
  }

  public async add_documents(chunks: DocumentChunk[]): Promise<void> {
    // Generate embeddings for chunks that don't have them
    const needsEmbedding: DocumentChunk[] = [];
    for (const chunk of chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        needsEmbedding.push(chunk);
      } else {
        this.chunks.set(chunk.chunk_id, chunk);
      }
    }

    if (needsEmbedding.length > 0) {
      const texts = needsEmbedding.map((c) => `${c.property_name} | ${c.section} | ${c.content}`);
      const embeddings = await this.embeddingProvider.embedBatch(texts);
      for (let i = 0; i < needsEmbedding.length; i++) {
        needsEmbedding[i].embedding = embeddings[i];
        this.chunks.set(needsEmbedding[i].chunk_id, needsEmbedding[i]);
      }
    }
  }

  public delete_documents(documentId: string): void {
    const toDelete: string[] = [];
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.document_id === documentId) {
        toDelete.push(chunkId);
      }
    }
    for (const id of toDelete) {
      this.chunks.delete(id);
    }
  }

  public async similarity_search_with_score(
    query: string,
    topK: number = 5,
    filter?: SearchFilter
  ): Promise<VectorSearchResult[]> {
    const queryVector = await this.embeddingProvider.embedText(query);
    const results: VectorSearchResult[] = [];

    for (const chunk of this.chunks.values()) {
      if (!chunk.embedding) continue;

      if (filter) {
        if (filter.property_name && chunk.property_name.toLowerCase() !== filter.property_name.toLowerCase()) {
          continue;
        }
        if (filter.document_type && chunk.document_type.toLowerCase() !== filter.document_type.toLowerCase()) {
          continue;
        }
        if (filter.document_id && chunk.document_id !== filter.document_id) {
          continue;
        }
      }

      const score = cosineSimilarity(queryVector, chunk.embedding);
      results.push({ chunk, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  public async similarity_search(
    query: string,
    topK: number = 5,
    filter?: SearchFilter
  ): Promise<DocumentChunk[]> {
    const withScores = await this.similarity_search_with_score(query, topK, filter);
    return withScores.map((r) => r.chunk);
  }

  public getAllChunks(): DocumentChunk[] {
    return Array.from(this.chunks.values());
  }

  public getChunk(chunkId: string): DocumentChunk | undefined {
    return this.chunks.get(chunkId);
  }

  public clear(): void {
    this.chunks.clear();
  }

  public persist(): { count: number; timestamp: string } {
    return {
      count: this.chunks.size,
      timestamp: new Date().toISOString(),
    };
  }
}
