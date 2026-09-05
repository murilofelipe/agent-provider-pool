import type { CompletionRequest, Provider } from '../types.js';
export interface GroqProviderOptions {
    apiKey: string;
    baseUrl?: string;
}
/** Groq's chat completions API is OpenAI-compatible -- see
 * https://console.groq.com/docs/api-reference#chat-create */
export declare class GroqProvider implements Provider {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(options: GroqProviderOptions);
    complete({ prompt, model, temperature, image }: CompletionRequest): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=groq.d.ts.map