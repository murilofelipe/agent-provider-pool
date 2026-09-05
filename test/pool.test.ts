import { existsSync, rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ProviderPool } from '../src/pool.js';
import { PoolExhaustedError } from '../src/errors.js';
import { FakeProvider } from '../src/providers/fake.js';

const QUOTA_PATH = '.test-quota/pool.test.json';

function pool(): ProviderPool {
  return new ProviderPool({ quotaStorePath: QUOTA_PATH });
}

beforeEach(() => {
  if (existsSync('.test-quota')) rmSync('.test-quota', { recursive: true, force: true });
});
afterEach(() => {
  if (existsSync('.test-quota')) rmSync('.test-quota', { recursive: true, force: true });
});

describe('ProviderPool', () => {
  it('uses the first configured (provider, model) pair when nothing is exhausted', async () => {
    const fake = new FakeProvider();
    const result = await pool()
      .addProvider({ name: 'groq', provider: fake, models: [{ model: 'simple', temperature: 0.2 }] })
      .complete('hello');

    expect(result).toMatchObject({ provider: 'groq', model: 'simple' });
    expect(fake.calls).toHaveLength(1);
  });

  it('escalates to the next model in the SAME provider before trying another provider', async () => {
    const groqFake = new FakeProvider({ simple: { type: 'quota-exceeded' } });
    const geminiFake = new FakeProvider();

    const result = await pool()
      .addProvider({
        name: 'groq',
        provider: groqFake,
        models: [
          { model: 'simple', temperature: 0.2 },
          { model: 'complex', temperature: 0.5 },
        ],
      })
      .addProvider({ name: 'gemini', provider: geminiFake, models: [{ model: 'flash', temperature: 0.3 }] })
      .complete('hello');

    // The complex model of the SAME provider (groq) is tried before gemini.
    expect(result).toMatchObject({ provider: 'groq', model: 'complex' });
    expect(geminiFake.calls).toHaveLength(0);
  });

  it('moves to the next provider once the whole ladder of the current one is exhausted', async () => {
    const groqFake = new FakeProvider({
      simple: { type: 'quota-exceeded' },
      complex: { type: 'quota-exceeded' },
    });
    const geminiFake = new FakeProvider();

    const result = await pool()
      .addProvider({
        name: 'groq',
        provider: groqFake,
        models: [
          { model: 'simple', temperature: 0.2 },
          { model: 'complex', temperature: 0.5 },
        ],
      })
      .addProvider({ name: 'gemini', provider: geminiFake, models: [{ model: 'flash', temperature: 0.3 }] })
      .complete('hello');

    expect(result).toMatchObject({ provider: 'gemini', model: 'flash' });
  });

  it('throws PoolExhaustedError when every provider/model is exhausted', async () => {
    const fake = new FakeProvider({ simple: { type: 'quota-exceeded' } });
    await expect(
      pool()
        .addProvider({ name: 'groq', provider: fake, models: [{ model: 'simple', temperature: 0.2 }] })
        .complete('hello'),
    ).rejects.toThrow(PoolExhaustedError);
  });

  it('propagates a non-quota error without escalating (a real bug is not "try the next one")', async () => {
    const fake = new FakeProvider({ simple: { type: 'error', message: 'boom' } });
    await expect(
      pool()
        .addProvider({ name: 'groq', provider: fake, models: [{ model: 'simple', temperature: 0.2 }] })
        .complete('hello'),
    ).rejects.toThrow('boom');
  });

  it('proactively skips a model whose configured daily limit is already reached', async () => {
    const fake = new FakeProvider();
    const p = pool().addProvider({
      name: 'groq',
      provider: fake,
      models: [
        { model: 'simple', temperature: 0.2, dailyLimit: 1 },
        { model: 'complex', temperature: 0.5 },
      ],
    });

    await p.complete('call 1'); // uses up the daily limit of "simple"
    const second = await p.complete('call 2');

    // No 429 was ever thrown for "simple" -- the proactive check skipped it.
    expect(second).toMatchObject({ provider: 'groq', model: 'complex' });
    expect(fake.calls.filter((c) => c.model === 'simple')).toHaveLength(1);
  });

  it('persists quota usage across ProviderPool instances (survives a process restart)', async () => {
    const fake = new FakeProvider();
    await pool()
      .addProvider({
        name: 'groq',
        provider: fake,
        models: [{ model: 'simple', temperature: 0.2, dailyLimit: 1 }],
      })
      .complete('call 1');

    // A brand new ProviderPool instance, same quota file, same fake provider.
    const secondFake = new FakeProvider();
    await expect(
      pool()
        .addProvider({
          name: 'groq',
          provider: secondFake,
          models: [{ model: 'simple', temperature: 0.2, dailyLimit: 1 }],
        })
        .complete('call 2'),
    ).rejects.toThrow(PoolExhaustedError);

    // The second instance never even called the fake provider -- the
    // persisted count already showed the daily limit as reached.
    expect(secondFake.calls).toHaveLength(0);
  });

  it('a reactive 429 marks the pair exhausted even below a configured limit that turned out to be wrong', async () => {
    const fake = new FakeProvider({ simple: { type: 'quota-exceeded' } });
    const p = pool().addProvider({
      name: 'groq',
      provider: fake,
      // Configured limit says 100/day, but the real provider already 429s.
      models: [
        { model: 'simple', temperature: 0.2, dailyLimit: 100 },
        { model: 'complex', temperature: 0.5 },
      ],
    });

    const result = await p.complete('hello');
    expect(result).toMatchObject({ provider: 'groq', model: 'complex' });

    // A second call should skip straight to "complex" -- "simple" stays
    // marked exhausted for the rest of the day without hitting it again.
    fake.calls.length = 0;
    await p.complete('hello again');
    expect(fake.calls.every((c) => c.model !== 'simple')).toBe(true);
  });
});
