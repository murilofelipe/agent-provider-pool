import { QuotaExceededError } from '../errors.js';
import type { CompletionRequest, Provider } from '../types.js';

export interface OpenAIProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

interface OpenAIChatCompletionResponse {
  choices: Array<{ message: { content: string } }>;
}

/** OpenAI's Chat Completions API -- see
 * https://platform.openai.com/docs/api-reference/chat/create */
export class OpenAIProvider implements Provider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: OpenAIProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
  }

  async complete({ prompt, model, temperature }: CompletionRequest): Promise<{ text: string }> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.status === 429) throw new QuotaExceededError(`OpenAI rate limit hit for model ${model}`);
    if (!res.ok) throw new Error(`OpenAI request failed (${res.status}): ${await res.text()}`);

    const body = (await res.json()) as OpenAIChatCompletionResponse;
    const text = body.choices[0]?.message.content;
    if (text === undefined) throw new Error('OpenAI response had no completion content');
    return { text };
  }
}
