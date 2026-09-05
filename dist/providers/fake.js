import { QuotaExceededError } from '../errors.js';
/**
 * Test double for `Provider` -- ships with the package so consumers can
 * unit-test failover-dependent code without a real network call, a real key,
 * or spending real quota. Configure per-model behavior; unconfigured models
 * default to `success`.
 */
export class FakeProvider {
    calls = [];
    behaviorByModel;
    constructor(behaviorByModel = {}) {
        this.behaviorByModel = new Map(Object.entries(behaviorByModel));
    }
    setBehavior(model, behavior) {
        this.behaviorByModel.set(model, behavior);
    }
    async complete(request) {
        this.calls.push(request);
        const behavior = this.behaviorByModel.get(request.model) ?? { type: 'success' };
        if (behavior.type === 'quota-exceeded')
            throw new QuotaExceededError();
        if (behavior.type === 'error')
            throw new Error(behavior.message ?? 'Fake provider error');
        return { text: behavior.text ?? `fake response for ${request.model}` };
    }
}
//# sourceMappingURL=fake.js.map