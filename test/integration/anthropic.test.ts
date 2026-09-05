import { describe, expect, it } from 'vitest';
import { AnthropicProvider } from '../../src/providers/anthropic.js';

describe.skipIf(!process.env.ANTHROPIC_API_KEY)('AnthropicProvider (real API)', () => {
  it('completes a prompt against the real Anthropic API', async () => {
    const provider = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const { text } = await provider.complete({
      prompt: 'Reply with exactly the word: pong',
      model: 'claude-haiku-4-5-20251001',
      temperature: 0,
    });
    expect(text.toLowerCase()).toContain('pong');
  });
});
