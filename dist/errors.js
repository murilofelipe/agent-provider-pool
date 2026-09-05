/** Thrown by a `Provider` adapter when a call fails because the underlying
 * account/key hit its rate limit or quota — the signal the pool escalates on.
 * Any other error propagates unchanged (the pool never swallows a real bug). */
export class QuotaExceededError extends Error {
    constructor(message = 'Quota or rate limit exceeded') {
        super(message);
        this.name = 'QuotaExceededError';
    }
}
/** Thrown by `ProviderPool.complete()` when every (provider, model) pair in
 * the whole configured pool is exhausted. The caller decides what to do next
 * (queue, notify, wait) — the pool never retries or blocks on its own. */
export class PoolExhaustedError extends Error {
    constructor(message = 'Every provider/model in the pool is exhausted') {
        super(message);
        this.name = 'PoolExhaustedError';
    }
}
//# sourceMappingURL=errors.js.map