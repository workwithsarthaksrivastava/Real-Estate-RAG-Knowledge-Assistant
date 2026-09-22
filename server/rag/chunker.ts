import { DocumentChunk, DocumentMetadata } from './types.js';

export interface ChunkingOptions {
  chunkSizeTokens?: number;     // e.g. 600
  chunkOverlapTokens?: number;  // e.g. 80
  minChunkTokens?: number;      // e.g. 40
}

export class StructureAwareChunker {
  private chunkSizeTokens: number;
  private chunkOverlapTokens: number;
  private minChunkTokens: number;

  constructor(options: ChunkingOptions = {}) {
    this.chunkSizeTokens = options.chunkSizeTokens || 600;
    this.chunkOverlapTokens = options.chunkOverlapTokens || 80;
    this.minChunkTokens = options.minChunkTokens || 40;
  }

  // Simple token estimator: approx 4 characters per token
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public chunkDocument(
    rawText: string,
    metadata: DocumentMetadata,
    pageBreaks?: { pageNumber: number; text: string }[]
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];

    // If explicit page breaks are provided (from PDF extraction), chunk with page awareness
    if (pageBreaks && pageBreaks.length > 0) {
      for (const page of pageBreaks) {
        const pageChunks = this.chunkSection(page.text, metadata, page.pageNumber);
        chunks.push(...pageChunks);
      }
      return chunks;
    }

    // Check if it's an FAQ document (Question - Answer format)
    if (metadata.document_type === 'faq' || /^(Q:|Question:|### Q:|\*\*Q:)/im.test(rawText)) {
      const faqChunks = this.chunkFaqDocument(rawText, metadata);
      if (faqChunks.length > 0) return faqChunks;
    }

    // Check if markdown with headers
    const sections = this.splitByHeaders(rawText);
    if (sections.length > 1) {
      let currentPage = 1;
      for (const section of sections) {
        // Detect page markers if any (e.g., [Page 2] or <!-- Page 2 -->)
        const pageMatch = section.content.match(/(?:\[Page\s*(\d+)\]|<!--\s*Page\s*(\d+)\s*-->)/i);
        if (pageMatch) {
          currentPage = parseInt(pageMatch[1] || pageMatch[2], 10);
        }

        const sectionChunks = this.chunkSection(
          section.content,
          metadata,
          currentPage,
          section.title
        );
        chunks.push(...sectionChunks);
      }
      return chunks;
    }

    // Default structure-aware paragraph/table chunker
    return this.chunkSection(rawText, metadata, 1, 'General');
  }

  private splitByHeaders(text: string): { title: string; content: string }[] {
    const lines = text.split('\n');
    const sections: { title: string; content: string }[] = [];
    let currentTitle = 'Overview';
    let currentLines: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        if (currentLines.length > 0) {
          sections.push({
            title: currentTitle,
            content: currentLines.join('\n').trim(),
          });
          currentLines = [];
        }
        currentTitle = headingMatch[2].trim();
      } else {
        currentLines.push(line);
      }
    }

    if (currentLines.length > 0) {
      sections.push({
        title: currentTitle,
        content: currentLines.join('\n').trim(),
      });
    }

    return sections;
  }

  private chunkFaqDocument(text: string, metadata: DocumentMetadata): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    // Split by FAQ entries
    const regex = /(?:^|\n)(?:Q[:.]|\*\*Q[:.]|\#\#\# Q[:.]|\d+\.\s*Q[:.])\s*(.+?)(?=\n(?:Q[:.]|\*\*Q[:.]|\#\#\# Q[:.]|\d+\.\s*Q[:.])|$)/gis;
    let match: RegExpExecArray | null;
    let index = 1;

    while ((match = regex.exec(text)) !== null) {
      const faqText = match[0].trim();
      if (!faqText) continue;

      const lines = faqText.split('\n');
      const question = lines[0].replace(/^(?:Q[:.]|\*\*Q[:.]|\#\#\# Q[:.]|\d+\.\s*Q[:.])\s*/i, '').trim();

      const tokens = this.estimateTokens(faqText);
      chunks.push({
        chunk_id: `${metadata.id}_faq_${index}`,
        document_id: metadata.id,
        document_name: metadata.document_name,
        document_type: metadata.document_type,
        property_name: metadata.property_name,
        page_number: 1,
        section: `FAQ: ${question.slice(0, 60)}`,
        content: faqText,
        token_estimate: tokens,
        metadata: {
          is_faq: true,
          question,
        },
      });
      index++;
    }

    return chunks;
  }

  private chunkSection(
    text: string,
    metadata: DocumentMetadata,
    pageNumber: number,
    sectionTitle: string = 'General'
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    // Group paragraphs while preserving markdown tables intact
    const paragraphs = this.extractParagraphsAndTables(text);
    if (paragraphs.length === 0) return [];

    let currentChunkParagraphs: string[] = [];
    let currentTokens = 0;
    let chunkSeq = 1;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pTokens = this.estimateTokens(p);

      // If a single table or paragraph is huge, split sentences
      if (pTokens > this.chunkSizeTokens) {
        if (currentChunkParagraphs.length > 0) {
          const content = currentChunkParagraphs.join('\n\n').trim();
          chunks.push({
            chunk_id: `${metadata.id}_p${pageNumber}_c${chunkSeq++}`,
            document_id: metadata.id,
            document_name: metadata.document_name,
            document_type: metadata.document_type,
            property_name: metadata.property_name,
            page_number: pageNumber,
            section: sectionTitle,
            content,
            token_estimate: this.estimateTokens(content),
          });
          currentChunkParagraphs = [];
          currentTokens = 0;
        }

        const sentenceChunks = this.chunkBySentences(p, metadata, pageNumber, sectionTitle, chunkSeq);
        chunks.push(...sentenceChunks);
        chunkSeq += sentenceChunks.length;
        continue;
      }

      if (currentTokens + pTokens <= this.chunkSizeTokens) {
        currentChunkParagraphs.push(p);
        currentTokens += pTokens;
      } else {
        // Create chunk from current accumulation
        const content = currentChunkParagraphs.join('\n\n').trim();
        if (content.length > 0) {
          chunks.push({
            chunk_id: `${metadata.id}_p${pageNumber}_c${chunkSeq++}`,
            document_id: metadata.id,
            document_name: metadata.document_name,
            document_type: metadata.document_type,
            property_name: metadata.property_name,
            page_number: pageNumber,
            section: sectionTitle,
            content,
            token_estimate: this.estimateTokens(content),
          });
        }

        // Apply overlap from previous paragraph if reasonable
        if (currentChunkParagraphs.length > 0) {
          const lastP = currentChunkParagraphs[currentChunkParagraphs.length - 1];
          const lastTokens = this.estimateTokens(lastP);
          if (lastTokens <= this.chunkOverlapTokens) {
            currentChunkParagraphs = [lastP, p];
            currentTokens = lastTokens + pTokens;
          } else {
            currentChunkParagraphs = [p];
            currentTokens = pTokens;
          }
        } else {
          currentChunkParagraphs = [p];
          currentTokens = pTokens;
        }
      }
    }

    if (currentChunkParagraphs.length > 0) {
      const content = currentChunkParagraphs.join('\n\n').trim();
      if (this.estimateTokens(content) >= this.minChunkTokens || chunks.length === 0) {
        chunks.push({
          chunk_id: `${metadata.id}_p${pageNumber}_c${chunkSeq++}`,
          document_id: metadata.id,
          document_name: metadata.document_name,
          document_type: metadata.document_type,
          property_name: metadata.property_name,
          page_number: pageNumber,
          section: sectionTitle,
          content,
          token_estimate: this.estimateTokens(content),
        });
      } else if (chunks.length > 0) {
        // Merge tiny remainder to last chunk
        chunks[chunks.length - 1].content += '\n\n' + content;
        chunks[chunks.length - 1].token_estimate = this.estimateTokens(chunks[chunks.length - 1].content);
      }
    }

    return chunks;
  }

  private extractParagraphsAndTables(text: string): string[] {
    const rawBlocks = text.split(/\n\s*\n/);
    const blocks: string[] = [];
    let inTable = false;
    let tableBuffer: string[] = [];

    for (const block of rawBlocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;

      const isTableRow = trimmed.startsWith('|') || trimmed.includes(' | ');
      if (isTableRow) {
        tableBuffer.push(trimmed);
        inTable = true;
      } else {
        if (inTable) {
          blocks.push(tableBuffer.join('\n'));
          tableBuffer = [];
          inTable = false;
        }
        blocks.push(trimmed);
      }
    }

    if (tableBuffer.length > 0) {
      blocks.push(tableBuffer.join('\n'));
    }

    return blocks;
  }

  private chunkBySentences(
    text: string,
    metadata: DocumentMetadata,
    pageNumber: number,
    sectionTitle: string,
    startSeq: number
  ): DocumentChunk[] {
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
    const chunks: DocumentChunk[] = [];
    let curSentences: string[] = [];
    let curTokens = 0;
    let seq = startSeq;

    for (const s of sentences) {
      const sTokens = this.estimateTokens(s);
      if (curTokens + sTokens > this.chunkSizeTokens && curSentences.length > 0) {
        const content = curSentences.join(' ').trim();
        chunks.push({
          chunk_id: `${metadata.id}_p${pageNumber}_c${seq++}`,
          document_id: metadata.id,
          document_name: metadata.document_name,
          document_type: metadata.document_type,
          property_name: metadata.property_name,
          page_number: pageNumber,
          section: sectionTitle,
          content,
          token_estimate: this.estimateTokens(content),
        });
        curSentences = [];
        curTokens = 0;
      }
      curSentences.push(s.trim());
      curTokens += sTokens;
    }

    if (curSentences.length > 0) {
      const content = curSentences.join(' ').trim();
      chunks.push({
        chunk_id: `${metadata.id}_p${pageNumber}_c${seq++}`,
        document_id: metadata.id,
        document_name: metadata.document_name,
        document_type: metadata.document_type,
        property_name: metadata.property_name,
        page_number: pageNumber,
        section: sectionTitle,
        content,
        token_estimate: this.estimateTokens(content),
      });
    }

    return chunks;
  }
}
