import type { CompletionRequest, Provider } from '../types.js';
export interface OllamaProviderOptions {
    /** Defaults to the standard local Ollama server. */
    baseUrl?: string;
}
/** Local Ollama server -- see https://github.com/ollama/ollama/blob/main/docs/api.md.
 * No API key, no rate limit -- this is the pool's zero-quota fallback, so it
 * never throws `QuotaExceededError`. */
export declare class OllamaProvider implements Provider {
    private readonly baseUrl;
    constructor(options?: OllamaProviderOptions);
    complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=ollama.d.ts.map