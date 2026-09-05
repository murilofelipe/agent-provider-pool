import { describe, expect, it } from 'vitest';
import { DeepSeekProvider } from '../../src/providers/deepseek.js';

describe.skipIf(!process.env.DEEPSEEK_API_KEY)('DeepSeekProvider (real API)', () => {
  it('completes a prompt against the real DeepSeek API', async () => {
    const provider = new DeepSeekProvider({ apiKey: process.env.DEEPSEEK_API_KEY! });
    const { text } = await provider.complete({
      prompt: 'Reply with exactly the word: pong',
      model: 'deepseek-v4-flash',
      temperature: 0,
    });
    expect(text.toLowerCase()).toContain('pong');
  });
});
