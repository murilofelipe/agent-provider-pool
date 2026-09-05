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

async function hasModel(model: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) return false;
    const body = (await res.json()) as { models?: Array<{ name: string }> };
    return (body.models ?? []).some((m) => m.name.startsWith(model));
  } catch {
    return false;
  }
}

const reachable = await isReachable();
const visionModel = process.env.OLLAMA_VISION_MODEL ?? 'llava';
const hasVisionModel = reachable && (await hasModel(visionModel));

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

describe.skipIf(!hasVisionModel)('OllamaProvider vision (real local server)', () => {
  it('completes a vision request against a local Ollama server', async () => {
    const provider = new OllamaProvider({ baseUrl });
    const { text } = await provider.complete({
      prompt: 'What color is this image? Reply with one word.',
      model: visionModel,
      temperature: 0,
      image: { data: RED_PIXEL_PNG_BASE64, mimeType: 'image/png' },
    });
    expect(text.toLowerCase()).toContain('red');
  });
});

// A 1x1 solid red PNG, used to verify vision adapters without a real fixture file.
const RED_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQAY3Y2wAAAAAElFTkSuQmCC';
