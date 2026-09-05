import type { ModelConfig } from './types.js';
/**
 * Persists per-(provider, model) quota usage to a local JSON file, so a
 * process restart doesn't forget what's already been spent today -- single
 * process is the assumed usage pattern for this phase (no file-locking).
 */
export declare class QuotaStore {
    private readonly path;
    private data;
    constructor(path: string);
    private load;
    private save;
    private record;
    /** Proactive check: would the next call already exceed a configured
     * limit, or is this pair still marked exhausted from a recent reactive
     * 429? Does not itself make a network call. */
    isExhausted(providerName: string, config: ModelConfig): boolean;
    /** Call after a successful completion, so the next proactive check sees
     * accurate usage. */
    recordUsage(providerName: string, model: string): void;
    /** Call when a provider throws `QuotaExceededError` -- forces this pair
     * to read as exhausted for the rest of the day even if the configured
     * limit hadn't nominally been reached (covers a wrong/stale number). */
    markExhausted(providerName: string, model: string): void;
}
//# sourceMappingURL=quota-store.d.ts.map