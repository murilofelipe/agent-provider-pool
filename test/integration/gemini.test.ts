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

  it('completes a vision request against the real Gemini API', async () => {
    const provider = new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY! });
    const { text } = await provider.complete({
      prompt: 'What color is this image? Reply with one word.',
      model: 'gemini-2.5-flash-lite',
      temperature: 0,
      image: { data: RED_PIXEL_PNG_BASE64, mimeType: 'image/png' },
    });
    expect(text.toLowerCase()).toContain('red');
  });
});

// A 1x1 solid red PNG, used to verify vision adapters without a real fixture file.
const RED_PIXEL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQAY3Y2wAAAAAElFTkSuQmCC';
