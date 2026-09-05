import type { CompletionRequest, Provider } from '../types.js';
export interface DeepSeekProviderOptions {
    apiKey: string;
    baseUrl?: string;
}
/** DeepSeek's API is OpenAI-compatible -- see
 * https://api-docs.deepseek.com/api/create-chat-completion
 * Same shape as GroqProvider/OpenAIProvider, just a different base URL and
 * model names. */
export declare class DeepSeekProvider implements Provider {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(options: DeepSeekProviderOptions);
    complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=deepseek.d.ts.map