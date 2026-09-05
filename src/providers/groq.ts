import { QuotaExceededError } from '../errors.js';
import type { CompletionRequest, Provider } from '../types.js';

export interface GroqProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

interface GroqChatCompletionResponse {
  choices: Array<{ message: { content: string } }>;
}

/** Groq's chat completions API is OpenAI-compatible -- see
 * https://console.groq.com/docs/api-reference#chat-create */
export class GroqProvider implements Provider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: GroqProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.groq.com/openai/v1';
  }

  async complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{ text: string }> {
    // ponytail: no vision-capable Groq model is wired up yet -- fail loud
    // and specific rather than silently sending only the text half.
    if (image) throw new Error(`GroqProvider does not support image input (model ${model})`);

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

    if (res.status === 429) throw new QuotaExceededError(`Groq rate limit hit for model ${model}`);
    if (!res.ok) throw new Error(`Groq request failed (${res.status}): ${await res.text()}`);

    const body = (await res.json()) as GroqChatCompletionResponse;
    const text = body.choices[0]?.message.content;
    if (text === undefined) throw new Error('Groq response had no completion content');
    return { text };
  }
}
