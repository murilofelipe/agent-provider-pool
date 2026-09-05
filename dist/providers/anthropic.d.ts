import type { CompletionRequest, Provider } from '../types.js';
export interface AnthropicProviderOptions {
    apiKey: string;
    baseUrl?: string;
}
/** Anthropic's Messages API -- see
 * https://docs.anthropic.com/en/api/messages
 * Distinct shape from the OpenAI-compatible family: `x-api-key`/
 * `anthropic-version` headers, and the response text lives in a `content`
 * block array rather than a flat string. */
export declare class AnthropicProvider implements Provider {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(options: AnthropicProviderOptions);
    complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=anthropic.d.ts.map