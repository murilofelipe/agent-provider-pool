import { QuotaExceededError } from '../errors.js';
/** DeepSeek's API is OpenAI-compatible -- see
 * https://api-docs.deepseek.com/api/create-chat-completion
 * Same shape as GroqProvider/OpenAIProvider, just a different base URL and
 * model names. */
export class DeepSeekProvider {
    apiKey;
    baseUrl;
    constructor(options) {
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl ?? 'https://api.deepseek.com/v1';
    }
    async complete({ prompt, model, temperature, image }) {
        // ponytail: no vision-capable DeepSeek model is wired up yet -- fail loud
        // and specific rather than silently sending only the text half.
        if (image)
            throw new Error(`DeepSeekProvider does not support image input (model ${model})`);
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
        if (res.status === 429)
            throw new QuotaExceededError(`DeepSeek rate limit hit for model ${model}`);
        if (!res.ok)
            throw new Error(`DeepSeek request failed (${res.status}): ${await res.text()}`);
        const body = (await res.json());
        const text = body.choices[0]?.message.content;
        if (text === undefined)
            throw new Error('DeepSeek response had no completion content');
        return { text };
    }
}
//# sourceMappingURL=deepseek.js.map