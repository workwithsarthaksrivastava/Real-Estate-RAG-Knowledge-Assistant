import { GoogleGenAI } from "@google/genai";

export interface EmbeddingProvider {
  name: string;
  dimension: number;
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// Fallback high-entropy semantic feature projector for zero-latency local embedding
export class LocalSemanticEmbeddingProvider implements EmbeddingProvider {
  public name = "Local-Semantic-Dense";
  public dimension = 384;

  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();

  constructor() {
    // Seed key real-estate domain concepts into anchor weights
    const domainAnchors = [
      'property', 'price', 'pricing', 'bhk', 'sqft', 'possession', 'date', 'phase',
      'tower', 'floor', 'carpet', 'area', 'payment', 'plan', 'booking', 'amenity',
      'amenities', 'pool', 'gym', 'clubhouse', 'rera', 'approval', 'location',
      'developer', 'construction', 'specification', 'luxury', 'balcony', 'bedroom',
      'bathroom', 'parking', 'deposit', 'installment', 'handover', 'completion'
    ];
    domainAnchors.forEach((term, idx) => {
      this.vocabulary.set(term, idx);
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s₹$%.,-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  public async embedText(text: string): Promise<number[]> {
    const tokens = this.tokenize(text);
    const vector = new Array(this.dimension).fill(0);

    if (tokens.length === 0) return vector;

    // Term frequencies and deterministic hashed feature projections
    const counts = new Map<string, number>();
    for (const t of tokens) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }

    for (const [token, count] of counts.entries()) {
      const tf = Math.log(1 + count);
      // Hash to multiple bucket dimensions to capture n-gram & word semantics
      for (let h = 0; h < 3; h++) {
        let hash = 2166136261 ^ h;
        for (let i = 0; i < token.length; i++) {
          hash ^= token.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        const index = Math.abs(hash) % this.dimension;
        const sign = (hash & 1) === 0 ? 1 : -1;
        vector[index] += sign * tf;
      }

      // Domain anchor weighting
      if (this.vocabulary.has(token)) {
        const anchorIdx = this.vocabulary.get(token)! % this.dimension;
        vector[anchorIdx] += tf * 2.5;
      }
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < this.dimension; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embedText(t)));
  }
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  public name = "Gemini-Embedding-2";
  public dimension = 768;
  private ai: GoogleGenAI | null = null;
  private fallback: LocalSemanticEmbeddingProvider;

  constructor() {
    this.fallback = new LocalSemanticEmbeddingProvider();
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (e) {
        console.warn("Gemini client initialization warning:", e);
      }
    }
  }

  public async embedText(text: string): Promise<number[]> {
    if (!this.ai || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return this.fallback.embedText(text);
    }

    try {
      // Use gemini-embedding-2-preview or fallback gracefully
      const response = await (this.ai.models as any).embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text,
      });

      if (response?.embedding?.values) {
        return response.embedding.values;
      }
    } catch (err) {
      console.warn("Gemini embedding call failed, using fallback:", err);
    }

    return this.fallback.embedText(text);
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embedText(text));
    }
    return results;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
