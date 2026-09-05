import { describe, expect, it } from 'vitest';
import { GroqProvider } from '../../src/providers/groq.js';

describe.skipIf(!process.env.GROQ_API_KEY)('GroqProvider (real API)', () => {
  it('completes a prompt against the real Groq API', async () => {
    const provider = new GroqProvider({ apiKey: process.env.GROQ_API_KEY! });
    const { text } = await provider.complete({
      prompt: 'Reply with exactly the word: pong',
      model: 'llama-3.1-8b-instant',
      temperature: 0,
    });
    expect(text.toLowerCase()).toContain('pong');
  });
});
