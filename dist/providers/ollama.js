/** Local Ollama server -- see https://github.com/ollama/ollama/blob/main/docs/api.md.
 * No API key, no rate limit -- this is the pool's zero-quota fallback, so it
 * never throws `QuotaExceededError`. */
export class OllamaProvider {
    baseUrl;
    constructor(options = {}) {
        this.baseUrl = options.baseUrl ?? 'http://localhost:11434';
    }
    async complete({ prompt, model, temperature, image }) {
        const res = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                options: { temperature },
                ...(image ? { images: [image.data] } : {}),
            }),
        });
        if (!res.ok)
            throw new Error(`Ollama request failed (${res.status}): ${await res.text()}`);
        const body = (await res.json());
        return { text: body.response };
    }
}
//# sourceMappingURL=ollama.js.map