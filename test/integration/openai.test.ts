import { describe, expect, it } from 'vitest';
import { OpenAIProvider } from '../../src/providers/openai.js';

describe.skipIf(!process.env.OPENAI_API_KEY)('OpenAIProvider (real API)', () => {
  it('completes a prompt against the real OpenAI API', async () => {
    const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! });
    const { text } = await provider.complete({
      prompt: 'Reply with exactly the word: pong',
      model: 'gpt-4o-mini',
      temperature: 0,
    });
    expect(text.toLowerCase()).toContain('pong');
  });
});
