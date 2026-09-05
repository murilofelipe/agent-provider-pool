import { QuotaExceededError } from '../errors.js';
/** OpenAI's Chat Completions API -- see
 * https://platform.openai.com/docs/api-reference/chat/create */
export class OpenAIProvider {
    apiKey;
    baseUrl;
    constructor(options) {
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
    }
    async complete({ prompt, model, temperature, image }) {
        const content = image
            ? [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.data}` } },
            ]
            : prompt;
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model,
                temperature,
                messages: [{ role: 'user', content }],
            }),
        });
        if (res.status === 429)
            throw new QuotaExceededError(`OpenAI rate limit hit for model ${model}`);
        if (!res.ok)
            throw new Error(`OpenAI request failed (${res.status}): ${await res.text()}`);
        const body = (await res.json());
        const text = body.choices[0]?.message.content;
        if (text === undefined)
            throw new Error('OpenAI response had no completion content');
        return { text };
    }
}
//# sourceMappingURL=openai.js.map