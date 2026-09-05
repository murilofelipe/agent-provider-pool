/** Thrown by a `Provider` adapter when a call fails because the underlying
 * account/key hit its rate limit or quota — the signal the pool escalates on.
 * Any other error propagates unchanged (the pool never swallows a real bug). */
export declare class QuotaExceededError extends Error {
    constructor(message?: string);
}
/** Thrown by `ProviderPool.complete()` when every (provider, model) pair in
 * the whole configured pool is exhausted. The caller decides what to do next
 * (queue, notify, wait) — the pool never retries or blocks on its own. */
export declare class PoolExhaustedError extends Error {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map