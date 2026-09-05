import { QuotaExceededError } from '../errors.js';
/** Google Generative Language API -- see
 * https://ai.google.dev/api/generate-content */
export class GeminiProvider {
    apiKey;
    baseUrl;
    constructor(options) {
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    }
    async complete({ prompt, model, temperature, image }) {
        const parts = [{ text: prompt }];
        if (image)
            parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
        const res = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { temperature },
            }),
        });
        // Gemini surfaces quota exhaustion as 429 RESOURCE_EXHAUSTED.
        if (res.status === 429)
            throw new QuotaExceededError(`Gemini quota exceeded for model ${model}`);
        if (!res.ok)
            throw new Error(`Gemini request failed (${res.status}): ${await res.text()}`);
        const body = (await res.json());
        const text = body.candidates?.[0]?.content.parts[0]?.text;
        if (text === undefined)
            throw new Error('Gemini response had no completion content');
        return { text };
    }
}
//# sourceMappingURL=gemini.js.map