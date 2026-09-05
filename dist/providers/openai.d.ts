import type { CompletionRequest, Provider } from '../types.js';
export interface OpenAIProviderOptions {
    apiKey: string;
    baseUrl?: string;
}
/** OpenAI's Chat Completions API -- see
 * https://platform.openai.com/docs/api-reference/chat/create */
export declare class OpenAIProvider implements Provider {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(options: OpenAIProviderOptions);
    complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=openai.d.ts.map