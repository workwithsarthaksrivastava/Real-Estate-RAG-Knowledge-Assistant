// @ts-ignore
import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

export interface ExtractedDocument {
  text: string;
  pages: { pageNumber: number; text: string }[];
  detectedType: 'brochure' | 'pricing_sheet' | 'floor_plan' | 'faq' | 'project_update' | 'legal_rera';
  propertyName?: string;
  metadata: Record<string, any>;
}

export class DocumentExtractor {
  public static async extractFromBuffer(
    buffer: Buffer,
    filename: string,
    mimeType?: string
  ): Promise<ExtractedDocument> {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return this.extractFromPdf(buffer, filename);
    } else if (ext === 'csv') {
      const text = buffer.toString('utf-8');
      return this.extractFromCsv(text, filename);
    } else if (ext === 'json') {
      const text = buffer.toString('utf-8');
      return this.extractFromJson(text, filename);
    } else {
      // txt, md, markdown
      const text = buffer.toString('utf-8');
      return this.extractFromText(text, filename);
    }
  }

  public static async extractFromPdf(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
    try {
      const pages: { pageNumber: number; text: string }[] = [];
      const data = await pdfParse(buffer, {
        pagerender: (pageData: any) => {
          return pageData.getTextContent().then((textContent: any) => {
            let lastY: number | null = null;
            let text = '';
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || lastY === null) {
                text += item.str + ' ';
              } else {
                text += '\n' + item.str + ' ';
              }
              lastY = item.transform[5];
            }
            return text;
          });
        },
      });

      // Split or parse pages if page markers present, or split roughly by page text
      const fullText = data.text || '';
      const totalPages = data.numpages || 1;

      // When pagerender text is returned, let's create structured page objects
      if (totalPages > 1) {
        // Look for form feed or page boundaries or split proportionally
        const rawPages = fullText.split(/\f|\n--- Page \d+ ---\n/);
        if (rawPages.length >= totalPages) {
          rawPages.slice(0, totalPages).forEach((pageText: string, idx: number) => {
            pages.push({
              pageNumber: idx + 1,
              text: pageText.trim(),
            });
          });
        } else {
          // Approximate pages if form feed wasn't present
          const charsPerPage = Math.ceil(fullText.length / totalPages);
          for (let p = 0; p < totalPages; p++) {
            pages.push({
              pageNumber: p + 1,
              text: fullText.slice(p * charsPerPage, (p + 1) * charsPerPage).trim(),
            });
          }
        }
      } else {
        pages.push({ pageNumber: 1, text: fullText.trim() });
      }

      const detected = this.detectTypeAndProperty(fullText, filename);

      return {
        text: fullText,
        pages,
        detectedType: detected.type,
        propertyName: detected.propertyName,
        metadata: {
          totalPages,
          pdfInfo: data.info || {},
        },
      };
    } catch (err) {
      console.warn("PDF extraction fallback:", err);
      const text = buffer.toString('utf-8');
      return this.extractFromText(text, filename);
    }
  }

  public static extractFromCsv(csvText: string, filename: string): ExtractedDocument {
    // Parse CSV into structured markdown table representation
    const lines = csvText.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return {
        text: '',
        pages: [{ pageNumber: 1, text: '' }],
        detectedType: 'pricing_sheet',
        metadata: {},
      };
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    let markdownTable = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      markdownTable += `| ${cols.join(' | ')} |\n`;
    }

    const fullText = `# Pricing & Inventory Data: ${filename}\n\n${markdownTable}`;
    const detected = this.detectTypeAndProperty(fullText, filename);

    return {
      text: fullText,
      pages: [{ pageNumber: 1, text: fullText }],
      detectedType: 'pricing_sheet',
      propertyName: detected.propertyName,
      metadata: { rowCount: lines.length - 1 },
    };
  }

  public static extractFromJson(jsonText: string, filename: string): ExtractedDocument {
    try {
      const parsed = JSON.parse(jsonText);
      let formattedText = '';
      let detectedType: any = 'faq';

      if (Array.isArray(parsed)) {
        // Could be FAQs or pricing list
        const isFaq = parsed.some((item) => item.question || item.q);
        if (isFaq) {
          detectedType = 'faq';
          formattedText = `# Property FAQs: ${filename}\n\n`;
          parsed.forEach((item, idx) => {
            const q = item.question || item.q || `Question ${idx + 1}`;
            const a = item.answer || item.a || '';
            formattedText += `### Q: ${q}\n**A:** ${a}\n\n`;
          });
        } else {
          formattedText = `# Structured Property Document\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
        }
      } else {
        formattedText = `# ${parsed.title || filename}\n\n`;
        for (const [key, val] of Object.entries(parsed)) {
          formattedText += `### ${key}\n${typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}\n\n`;
        }
      }

      const detected = this.detectTypeAndProperty(formattedText, filename);

      return {
        text: formattedText,
        pages: [{ pageNumber: 1, text: formattedText }],
        detectedType,
        propertyName: detected.propertyName,
        metadata: { jsonKeys: typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : [] },
      };
    } catch (e) {
      return this.extractFromText(jsonText, filename);
    }
  }

  public static extractFromText(text: string, filename: string): ExtractedDocument {
    // Check for page markers like [Page 1], --- Page 2 ---, etc.
    const pageRegex = /(?:\[Page\s*(\d+)\]|---\s*Page\s*(\d+)\s*---)/gi;
    const pages: { pageNumber: number; text: string }[] = [];

    const matches = Array.from(text.matchAll(pageRegex));
    if (matches.length > 1) {
      for (let i = 0; i < matches.length; i++) {
        const pageNum = parseInt(matches[i][1] || matches[i][2], 10);
        const startIdx = matches[i].index! + matches[i][0].length;
        const endIdx = i < matches.length - 1 ? matches[i + 1].index! : text.length;
        const pageContent = text.slice(startIdx, endIdx).trim();
        pages.push({ pageNumber: pageNum, text: pageContent });
      }
    } else {
      pages.push({ pageNumber: 1, text: text.trim() });
    }

    const detected = this.detectTypeAndProperty(text, filename);

    return {
      text,
      pages,
      detectedType: detected.type,
      propertyName: detected.propertyName,
      metadata: {},
    };
  }

  public static detectTypeAndProperty(
    text: string,
    filename: string
  ): { type: 'brochure' | 'pricing_sheet' | 'floor_plan' | 'faq' | 'project_update' | 'legal_rera'; propertyName?: string } {
    const lower = (filename + ' ' + text.slice(0, 800)).toLowerCase();

    // Property name detection
    let propertyName: string | undefined;
    if (lower.includes('green valley')) {
      propertyName = 'Green Valley Residency';
    } else if (lower.includes('skyline heights')) {
      propertyName = 'Skyline Heights';
    } else if (lower.includes('azure bay')) {
      propertyName = 'Azure Bay Luxury Residences';
    }

    // Document type detection
    let type: 'brochure' | 'pricing_sheet' | 'floor_plan' | 'faq' | 'project_update' | 'legal_rera' = 'brochure';
    if (lower.includes('pricing') || lower.includes('cost sheet') || lower.includes('payment schedule') || filename.endsWith('.csv')) {
      type = 'pricing_sheet';
    } else if (lower.includes('faq') || lower.includes('frequently asked') || lower.includes('q&a')) {
      type = 'faq';
    } else if (lower.includes('floor plan') || lower.includes('carpet area') || lower.includes('unit plan')) {
      type = 'floor_plan';
    } else if (lower.includes('construction status') || lower.includes('project schedule') || lower.includes('project update') || lower.includes('progress report')) {
      type = 'project_update';
    } else if (lower.includes('rera') || lower.includes('deed') || lower.includes('title deed') || lower.includes('legal approval')) {
      type = 'legal_rera';
    }

    return { type, propertyName };
  }
}
