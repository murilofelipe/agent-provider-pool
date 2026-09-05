import type { CompletionRequest, Provider } from '../types.js';
export type FakeProviderBehavior = {
    type: 'success';
    text?: string;
} | {
    type: 'quota-exceeded';
} | {
    type: 'error';
    message?: string;
};
/**
 * Test double for `Provider` -- ships with the package so consumers can
 * unit-test failover-dependent code without a real network call, a real key,
 * or spending real quota. Configure per-model behavior; unconfigured models
 * default to `success`.
 */
export declare class FakeProvider implements Provider {
    readonly calls: CompletionRequest[];
    private readonly behaviorByModel;
    constructor(behaviorByModel?: Record<string, FakeProviderBehavior>);
    setBehavior(model: string, behavior: FakeProviderBehavior): void;
    complete(request: CompletionRequest): Promise<{
        text: string;
    }>;
}
//# sourceMappingURL=fake.d.ts.map