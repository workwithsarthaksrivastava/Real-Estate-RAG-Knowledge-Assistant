import Groq from 'groq-sdk';
import { ChatHistoryEntry, ChatRequestOptions, RetrievedChunk } from './types.js';

export interface LLMProvider {
  name: string;
  generateGroundedAnswer(
    systemPrompt: string,
    query: string,
    contextText: string,
    conflictNote: string,
    history: ChatHistoryEntry[],
    options?: ChatRequestOptions
  ): Promise<string | null>;
  isAvailable(): boolean;
  getModelName(mode?: string): string;
}

export class GroqLLMProvider implements LLMProvider {
  public name = 'Groq';
  private groq: Groq | null = null;
  private defaultModel: string;

  constructor() {
    this.defaultModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'MY_GROQ_API_KEY') {
      try {
        this.groq = new Groq({ apiKey });
      } catch (err) {
        console.warn('Groq client initialization warning:', err);
      }
    }
  }

  public isAvailable(): boolean {
    const apiKey = process.env.GROQ_API_KEY;
    return !!(this.groq && apiKey && apiKey.trim().length > 0 && apiKey !== 'MY_GROQ_API_KEY');
  }

  public getModelName(mode?: string): string {
    const envModel = process.env.GROQ_MODEL;
    if (envModel && envModel.trim().length > 0) {
      return envModel.trim();
    }
    return this.defaultModel;
  }

  public async generateGroundedAnswer(
    systemPrompt: string,
    query: string,
    contextText: string,
    conflictNote: string,
    history: ChatHistoryEntry[] = [],
    options?: ChatRequestOptions
  ): Promise<string | null> {
    if (!this.isAvailable() || !this.groq) {
      return null;
    }

    const model = this.getModelName(options?.mode);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    const recentHistory = history.slice(-6);
    for (const entry of recentHistory) {
      messages.push({
        role: entry.role === 'assistant' ? 'assistant' : 'user',
        content: entry.content,
      });
    }

    messages.push({
      role: 'user',
      content: `VERIFIED PROPERTY DOCUMENTS CONTEXT:\n${contextText}${conflictNote}\n\nUSER QUESTION: ${query}\n\nPlease provide a strictly grounded, accurate response following your role:`,
    });

    try {
      const completion = await this.groq.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
      });

      const responseText = completion.choices?.[0]?.message?.content;
      if (responseText && responseText.trim().length > 0) {
        return responseText.trim();
      }
    } catch (err) {
      console.warn(`[Groq Provider] Generation error using model ${model}:`, err);
    }

    return null;
  }
}
