import type { CompletionRequest, Provider } from '../types.js';
export interface GeminiProviderOptions {
    apiKey: string;
    baseUrl?: string;
}
/** Google Generative Language API -- see
 * https://ai.google.dev/api/generate-content */
export declare class GeminiProvider implements Provider {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(options: GeminiProviderOptions);
    complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=gemini.d.ts.map