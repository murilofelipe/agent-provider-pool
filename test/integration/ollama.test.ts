import { describe, expect, it } from 'vitest';
import { OllamaProvider } from '../../src/providers/ollama.js';

const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

const reachable = await isReachable();

describe.skipIf(!reachable)('OllamaProvider (real local server)', () => {
  it('completes a prompt against a local Ollama server', async () => {
    const provider = new OllamaProvider({ baseUrl });
    const { text } = await provider.complete({
      prompt: 'Reply with exactly the word: pong',
      model: 'llama3.2',
      temperature: 0,
    });
    expect(text.toLowerCase()).toContain('pong');
  });
});
