import type { CompletionRequest, Provider } from '../types.js';

export interface OllamaProviderOptions {
  /** Defaults to the standard local Ollama server. */
  baseUrl?: string;
}

interface OllamaGenerateResponse {
  response: string;
}

/** Local Ollama server -- see https://github.com/ollama/ollama/blob/main/docs/api.md.
 * No API key, no rate limit -- this is the pool's zero-quota fallback, so it
 * never throws `QuotaExceededError`. */
export class OllamaProvider implements Provider {
  private readonly baseUrl: string;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'http://localhost:11434';
  }

  async complete({ prompt, model, temperature }: CompletionRequest): Promise<{ text: string }> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature },
      }),
    });

    if (!res.ok) throw new Error(`Ollama request failed (${res.status}): ${await res.text()}`);

    const body = (await res.json()) as OllamaGenerateResponse;
    return { text: body.response };
  }
}
