import { describe, expect, it } from 'vitest';
import { GeminiProvider } from '../../src/providers/gemini.js';

describe.skipIf(!process.env.GEMINI_API_KEY)('GeminiProvider (real API)', () => {
  it('completes a prompt against the real Gemini API', async () => {
    const provider = new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY! });
    const { text } = await provider.complete({
      prompt: 'Reply with exactly the word: pong',
      model: 'gemini-2.5-flash-lite',
      temperature: 0,
    });
    expect(text.toLowerCase()).toContain('pong');
  });
});
