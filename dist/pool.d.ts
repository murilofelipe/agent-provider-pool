import type { CompletionImage, CompletionResult, ProviderRegistration } from './types.js';
export interface CompleteOptions {
    image?: CompletionImage;
}
export interface ProviderPoolOptions {
    /** Where quota usage persists across restarts. Defaults to
     * `.agent-provider-pool/quota.json` in the current working directory. */
    quotaStorePath?: string;
}
/**
 * Manages a priority list of providers, each with its own simplest→most
 * capable model ladder. Exactly one (provider, model) pair is active at a
 * time -- the first one, in registration order, that isn't exhausted.
 *
 * Escalation is quota-triggered only: exhausting the active model moves to
 * the next model in the SAME provider's ladder; only once that whole ladder
 * is exhausted does the pool move to the next provider. Detection is both
 * proactive (a configured daily/monthly limit) and reactive (a real
 * `QuotaExceededError` from the provider, which forces escalation even if
 * the configured limit hadn't been nominally reached).
 */
export declare class ProviderPool {
    private readonly registrations;
    private readonly quota;
    constructor(options?: ProviderPoolOptions);
    addProvider(registration: ProviderRegistration): this;
    /** Runs `prompt` (and, optionally, an image) against the first
     * non-exhausted (provider, model) pair, escalating on quota exhaustion
     * (proactive or reactive) until one succeeds. Throws `PoolExhaustedError`
     * when every pair is exhausted. A provider that can't handle the given
     * `image` throws a plain `Error`, which propagates immediately -- that's
     * a caller mistake (wrong provider for the job), not a reason to
     * escalate. */
    complete(prompt: string, options?: CompleteOptions): Promise<CompletionResult>;
}
//# sourceMappingURL=pool.d.ts.map