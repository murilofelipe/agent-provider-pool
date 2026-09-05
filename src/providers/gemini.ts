import { QuotaExceededError } from '../errors.js';
import type { CompletionRequest, Provider } from '../types.js';

export interface GeminiProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
}

/** Google Generative Language API -- see
 * https://ai.google.dev/api/generate-content */
export class GeminiProvider implements Provider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: GeminiProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
  }

  async complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{ text: string }> {
    const parts: unknown[] = [{ text: prompt }];
    if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });

    const res = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature },
      }),
    });

    // Gemini surfaces quota exhaustion as 429 RESOURCE_EXHAUSTED.
    if (res.status === 429) throw new QuotaExceededError(`Gemini quota exceeded for model ${model}`);
    if (!res.ok) throw new Error(`Gemini request failed (${res.status}): ${await res.text()}`);

    const body = (await res.json()) as GeminiGenerateContentResponse;
    const text = body.candidates?.[0]?.content.parts[0]?.text;
    if (text === undefined) throw new Error('Gemini response had no completion content');
    return { text };
  }
}
