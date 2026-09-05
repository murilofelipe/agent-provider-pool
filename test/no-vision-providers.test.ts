import { describe, expect, it } from 'vitest';
import { GroqProvider } from '../src/providers/groq.js';
import { DeepSeekProvider } from '../src/providers/deepseek.js';
import { QuotaExceededError } from '../src/errors.js';

const image = { data: 'ZmFrZS1pbWFnZS1ieXRlcw==', mimeType: 'image/png' };

describe('providers without a configured vision-capable model', () => {
  it('GroqProvider throws a plain Error (not QuotaExceededError) when given an image', async () => {
    const provider = new GroqProvider({ apiKey: 'unused' });
    await expect(
      provider.complete({ prompt: 'x', model: 'llama-3.1-8b-instant', temperature: 0, image }),
    ).rejects.toThrow(/does not support image input/);
    await expect(
      provider.complete({ prompt: 'x', model: 'llama-3.1-8b-instant', temperature: 0, image }),
    ).rejects.not.toBeInstanceOf(QuotaExceededError);
  });

  it('DeepSeekProvider throws a plain Error (not QuotaExceededError) when given an image', async () => {
    const provider = new DeepSeekProvider({ apiKey: 'unused' });
    await expect(
      provider.complete({ prompt: 'x', model: 'deepseek-v4-flash', temperature: 0, image }),
    ).rejects.toThrow(/does not support image input/);
    await expect(
      provider.complete({ prompt: 'x', model: 'deepseek-v4-flash', temperature: 0, image }),
    ).rejects.not.toBeInstanceOf(QuotaExceededError);
  });
});
