# Integration tests

These hit each real provider's API. They never run as part of `npm test`,
the git hooks, or the default local CI — opt in explicitly with:

```bash
npm run test:integration
```

Each test skips itself (rather than failing) when the credentials/server it
needs aren't present:

- `groq.test.ts` — needs `GROQ_API_KEY`.
- `gemini.test.ts` — needs `GEMINI_API_KEY`.
- `ollama.test.ts` — needs a local Ollama server running (`ollama serve`)
  with the model used by the test already pulled.

This keeps development, and the default hooks, free of real network calls,
real spent quota, or a hard requirement on secrets just to work on the
library.
