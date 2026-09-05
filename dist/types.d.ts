/** A single completion request handed to whichever (provider, model) pair is
 * currently active. The pool decides `model`/`temperature`; the caller only
 * supplies the prompt (and, optionally, an image). */
export interface CompletionRequest {
    prompt: string;
    model: string;
    temperature: number;
    /** Optional image input for vision-capable models. Omit for text-only
     * requests. A provider/model that doesn't support vision should throw a
     * plain `Error` (never `QuotaExceededError`) when it receives one --
     * "can't do this" is not "try the next one". */
    image?: CompletionImage;
}
export interface CompletionImage {
    /** Base64-encoded image bytes -- no `data:` URL prefix. */
    data: string;
    mimeType: string;
}
export interface CompletionResult {
    text: string;
    /** Which provider/model actually served this call — lets the caller log
     * or inspect what the pool picked, without needing to ask beforehand. */
    provider: string;
    model: string;
}
/**
 * The seam between `ProviderPool`'s escalation/quota logic and any real
 * provider's API. Implement this once per provider (Groq, Gemini, Ollama,
 * `FakeProvider` for tests) — the pool never talks to a provider-specific
 * detail directly.
 *
 * A `complete()` call MUST throw `QuotaExceededError` (from `./errors.js`)
 * when the failure is a rate-limit/quota rejection from the provider — any
 * other error propagates unchanged and is never treated as "try the next
 * one".
 */
export interface Provider {
    complete(request: CompletionRequest): Promise<{
        text: string;
    }>;
}
/** One rung of a provider's model ladder — simplest first. `dailyLimit`/
 * `monthlyLimit` are optional: omit either to rely on reactive detection
 * alone for that dimension (the provider's real 429 is still always
 * honored regardless of what's configured here). */
export interface ModelConfig {
    model: string;
    temperature: number;
    dailyLimit?: number;
    monthlyLimit?: number;
}
export interface ProviderRegistration {
    name: string;
    provider: Provider;
    /** Ordered simplest → most capable. The pool exhausts this ladder before
     * moving to the next registered provider. */
    models: ModelConfig[];
}
//# sourceMappingURL=types.d.ts.map