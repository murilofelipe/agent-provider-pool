import { QuotaExceededError } from '../errors.js';
import type { CompletionRequest, Provider } from '../types.js';

export type FakeProviderBehavior =
  | { type: 'success'; text?: string }
  | { type: 'quota-exceeded' }
  | { type: 'error'; message?: string };

/**
 * Test double for `Provider` -- ships with the package so consumers can
 * unit-test failover-dependent code without a real network call, a real key,
 * or spending real quota. Configure per-model behavior; unconfigured models
 * default to `success`.
 */
export class FakeProvider implements Provider {
  readonly calls: CompletionRequest[] = [];
  private readonly behaviorByModel: Map<string, FakeProviderBehavior>;

  constructor(behaviorByModel: Record<string, FakeProviderBehavior> = {}) {
    this.behaviorByModel = new Map(Object.entries(behaviorByModel));
  }

  setBehavior(model: string, behavior: FakeProviderBehavior): void {
    this.behaviorByModel.set(model, behavior);
  }

  async complete(request: CompletionRequest): Promise<{ text: string }> {
    this.calls.push(request);
    const behavior = this.behaviorByModel.get(request.model) ?? { type: 'success' };
    if (behavior.type === 'quota-exceeded') throw new QuotaExceededError();
    if (behavior.type === 'error') throw new Error(behavior.message ?? 'Fake provider error');
    return { text: behavior.text ?? `fake response for ${request.model}` };
  }
}
