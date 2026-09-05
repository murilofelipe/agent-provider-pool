import { QuotaExceededError, PoolExhaustedError } from './errors.js';
import { QuotaStore } from './quota-store.js';
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
export class ProviderPool {
  private readonly registrations: ProviderRegistration[] = [];
  private readonly quota: QuotaStore;

  constructor(options: ProviderPoolOptions = {}) {
    this.quota = new QuotaStore(options.quotaStorePath ?? '.agent-provider-pool/quota.json');
  }

  addProvider(registration: ProviderRegistration): this {
    this.registrations.push(registration);
    return this;
  }

  /** Runs `prompt` (and, optionally, an image) against the first
   * non-exhausted (provider, model) pair, escalating on quota exhaustion
   * (proactive or reactive) until one succeeds. Throws `PoolExhaustedError`
   * when every pair is exhausted. A provider that can't handle the given
   * `image` throws a plain `Error`, which propagates immediately -- that's
   * a caller mistake (wrong provider for the job), not a reason to
   * escalate. */
  async complete(prompt: string, options: CompleteOptions = {}): Promise<CompletionResult> {
    for (const registration of this.registrations) {
      for (const modelConfig of registration.models) {
        if (this.quota.isExhausted(registration.name, modelConfig)) continue;

        try {
          const { text } = await registration.provider.complete({
            prompt,
            model: modelConfig.model,
            temperature: modelConfig.temperature,
            image: options.image,
          });
          this.quota.recordUsage(registration.name, modelConfig.model);
          return { text, provider: registration.name, model: modelConfig.model };
        } catch (err) {
          if (!(err instanceof QuotaExceededError)) throw err;
          this.quota.markExhausted(registration.name, modelConfig.model);
          // fall through to the next (provider, model) pair
        }
      }
    }
    throw new PoolExhaustedError();
  }
}
