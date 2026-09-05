import { QuotaExceededError } from '../errors.js';
import type { CompletionRequest, Provider } from '../types.js';

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

interface AnthropicMessagesResponse {
  content: Array<{ type: string; text?: string }>;
}

// Anthropic requires max_tokens; the Provider interface has no such
// parameter, so this is a fixed, generous default -- not configurable in
// this MVP.
const MAX_TOKENS = 4096;

/** Anthropic's Messages API -- see
 * https://docs.anthropic.com/en/api/messages
 * Distinct shape from the OpenAI-compatible family: `x-api-key`/
 * `anthropic-version` headers, and the response text lives in a `content`
 * block array rather than a flat string. */
export class AnthropicProvider implements Provider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: AnthropicProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.anthropic.com/v1';
  }

  async complete({ prompt, model, temperature }: CompletionRequest): Promise<{ text: string }> {
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (res.status === 429) throw new QuotaExceededError(`Anthropic rate limit hit for model ${model}`);
    if (!res.ok) throw new Error(`Anthropic request failed (${res.status}): ${await res.text()}`);

    const body = (await res.json()) as AnthropicMessagesResponse;
    const text = body.content.find((block) => block.type === 'text')?.text;
    if (text === undefined) throw new Error('Anthropic response had no text content block');
    return { text };
  }
}
