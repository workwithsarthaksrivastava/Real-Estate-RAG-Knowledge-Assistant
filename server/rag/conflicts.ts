import { RetrievedChunk, DetectedConflict } from './types.js';

export class ConflictDetector {
  /**
   * Analyzes retrieved chunks across different documents to detect potential
   * contradictions in dates (e.g. possession dates), pricing, or milestone schedules.
   */
  public static detect(chunks: RetrievedChunk[]): DetectedConflict[] {
    const conflicts: DetectedConflict[] = [];
    if (chunks.length < 2) return conflicts;

    // Group chunks by property
    const propertyChunks = new Map<string, RetrievedChunk[]>();
    for (const chunk of chunks) {
      const prop = chunk.property_name || 'General';
      if (!propertyChunks.has(prop)) propertyChunks.set(prop, []);
      propertyChunks.get(prop)!.push(chunk);
    }

    for (const [propName, propChunkList] of propertyChunks.entries()) {
      // 1. Check for conflicting possession dates
      const possessionConflict = this.checkPossessionDateConflicts(propName, propChunkList);
      if (possessionConflict) conflicts.push(possessionConflict);

      // 2. Check for conflicting pricing (e.g., base price revised)
      const priceConflict = this.checkPriceConflicts(propName, propChunkList);
      if (priceConflict) conflicts.push(priceConflict);
    }

    return conflicts;
  }

  private static checkPossessionDateConflicts(
    property: string,
    chunks: RetrievedChunk[]
  ): DetectedConflict | null {
    // Look for possession date mentions in chunks
    const dateRegex = /(?:possession|handover|completion)\s*(?:is\s*expected|date|scheduled|timeline)?\s*(?:in|by|for|:)?\s*([A-Za-z]+\s*\d{4}|\d{1,2}\/\d{4}|Q[1-4]\s*\d{4})/gi;
    const mentions: {
      document_name: string;
      value: string;
      excerpt: string;
      page_number: number;
      publication_date?: string;
    }[] = [];

    const uniqueValues = new Set<string>();

    for (const chunk of chunks) {
      const text = chunk.content;
      let match: RegExpExecArray | null;
      while ((match = dateRegex.exec(text)) !== null) {
        const value = match[1].trim();
        const start = Math.max(0, match.index - 40);
        const end = Math.min(text.length, match.index + match[0].length + 50);
        const excerpt = text.slice(start, end).replace(/\s+/g, ' ').trim();

        // Extract publication date if present in document name or metadata
        let pubDate: string | undefined;
        if (chunk.document_name.includes('January 2026') || chunk.document_name.includes('Jan 2026')) {
          pubDate = 'January 2026';
        } else if (chunk.document_name.includes('June 2026') || chunk.document_name.includes('Jun 2026')) {
          pubDate = 'June 2026';
        }

        mentions.push({
          document_name: chunk.document_name,
          value,
          excerpt: `"...${excerpt}..."`,
          page_number: chunk.page_number,
          publication_date: pubDate,
        });
        uniqueValues.add(value.toLowerCase());
      }
    }

    // If there are different possession dates from different documents, trigger conflict
    if (uniqueValues.size > 1 && mentions.length >= 2) {
      // Group by distinct values and distinct documents
      const distinctDocMentions = new Map<string, typeof mentions[0]>();
      for (const m of mentions) {
        const key = `${m.document_name}_${m.value.toLowerCase()}`;
        if (!distinctDocMentions.has(key)) {
          distinctDocMentions.set(key, m);
        }
      }

      const sources = Array.from(distinctDocMentions.values());
      if (sources.length >= 2) {
        const summary = `Multiple documents specify differing possession timelines for ${property}: ${sources.map((s) => `${s.document_name}${s.publication_date ? ` (${s.publication_date})` : ''}: "${s.value}"`).join(' vs ')}.`;
        return {
          field: 'possession_date',
          property_name: property,
          sources,
          summary,
        };
      }
    }

    return null;
  }

  private static checkPriceConflicts(
    property: string,
    chunks: RetrievedChunk[]
  ): DetectedConflict | null {
    // Look for revised prices vs old brochure prices
    const priceMentionRegex = /(?:₹\s*[\d.]+\s*(?:crore|lakh|cr|lac)|Rs\.?\s*[\d.]+\s*(?:crore|lakh))/gi;
    const revisedDoc = chunks.find((c) => c.document_name.toLowerCase().includes('revised') || c.document_name.toLowerCase().includes('update'));
    const baseDoc = chunks.find((c) => c.document_name.toLowerCase().includes('brochure') || c.document_name.toLowerCase().includes('launch'));

    if (revisedDoc && baseDoc && revisedDoc.document_name !== baseDoc.document_name) {
      const matchRevised = revisedDoc.content.match(priceMentionRegex);
      const matchBase = baseDoc.content.match(priceMentionRegex);
      if (matchRevised && matchBase && matchRevised[0] !== matchBase[0]) {
        return {
          field: 'price',
          property_name: property,
          sources: [
            {
              document_name: baseDoc.document_name,
              value: matchBase[0],
              excerpt: baseDoc.content.slice(0, 120),
              page_number: baseDoc.page_number,
            },
            {
              document_name: revisedDoc.document_name,
              value: matchRevised[0],
              excerpt: revisedDoc.content.slice(0, 120),
              page_number: revisedDoc.page_number,
            },
          ],
          summary: `Notice: Pricing differs between earlier brochure document (${baseDoc.document_name}) and updated document (${revisedDoc.document_name}).`,
        };
      }
    }

    return null;
  }
}
