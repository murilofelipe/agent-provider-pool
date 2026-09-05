# agent-provider-pool

[🇧🇷 Português](./README.pt-BR.md)

An embeddable LLM provider pool with **quota-aware automatic failover**.

Configure each provider once — an API key and a ladder of models from
simplest to most capable, each with its own temperature. Call
`pool.complete(prompt)`. When the active model's quota runs out, the pool
escalates: first to the next model in the *same* provider's ladder, then to
the next provider, entirely on its own. Quota usage persists locally, so a
process restart doesn't forget what's already been spent today.

```ts
import { ProviderPool, GroqProvider, GeminiProvider, OllamaProvider } from 'agent-provider-pool';

const pool = new ProviderPool()
  .addProvider({
    name: 'groq',
    provider: new GroqProvider({ apiKey: process.env.GROQ_API_KEY! }),
    models: [
      { model: 'llama-3.1-8b-instant', temperature: 0.2, dailyLimit: 14_000 },
      { model: 'llama-3.3-70b-versatile', temperature: 0.4, dailyLimit: 1_000 },
    ],
  })
  .addProvider({
    name: 'gemini',
    provider: new GeminiProvider({ apiKey: process.env.GEMINI_API_KEY! }),
    models: [{ model: 'gemini-2.5-flash-lite', temperature: 0.3, dailyLimit: 20 }],
  })
  .addProvider({
    name: 'ollama',
    provider: new OllamaProvider(),
    models: [{ model: 'llama3.2', temperature: 0.5 }], // no limit -- local
  });

const result = await pool.complete('Extract the exercise name, sets, reps and weight from this line.');
console.log(result.text, result.provider, result.model);
```

## Why

Free-tier LLM API quotas are small, inconsistent across providers, and easy
to exhaust mid-session — every call then fails until you notice and manually
switch. This library is a bring-your-own-key alternative to hosted routers
(OpenRouter's Auto Router) or cost/latency-only routers (LiteLLM Router,
Portkey Gateway): it tracks quota per (provider, model) **proactively**
(against a configured daily/monthly limit, so it never wastes a call it
already knows would fail) **and reactively** (catching a real 429/quota
error, in case the configured number was wrong), and always exhausts a
provider's own model ladder before moving to the next provider.

## What this is *not*

- **Not a task classifier.** The pool never inspects prompt content to
  decide which provider is "better" at a task — it always tries providers
  in the order you registered them. Task-aware routing is a deliberately
  separate, future concern.
- **Not a hosted service.** This is an embedded library (`import`), not an
  HTTP server. No admin UI, no config file parsing — configuration is code,
  via the builder shown above.

## Providers

| Provider | Adapter | Notes |
|---|---|---|
| [Groq](https://groq.com) | `GroqProvider` | OpenAI-compatible chat completions API |
| [Gemini](https://ai.google.dev) | `GeminiProvider` | Google Generative Language API |
| [Ollama](https://ollama.com) | `OllamaProvider` | Local server, no API key, no quota |
| [OpenAI](https://platform.openai.com) | `OpenAIProvider` | Chat Completions API |

Anthropic and DeepSeek adapters are planned — see `BACKLOG.md`.

## Testing your own code against this library

`FakeProvider` ships with the package — a test double that never makes a
real network call:

```ts
import { ProviderPool, FakeProvider } from 'agent-provider-pool';

const fake = new FakeProvider({ 'my-model': { type: 'quota-exceeded' } });
const pool = new ProviderPool({ quotaStorePath: '.test-quota.json' })
  .addProvider({ name: 'test', provider: fake, models: [{ model: 'my-model', temperature: 0 }] });
```

## Development

```bash
npm install
make hooks   # activates the local git pre-push gate (lint + type-check + unit tests)
make check   # run that same gate manually
make test-integration   # opt-in only: hits real provider APIs, needs real keys/a local Ollama server
```

There is deliberately **no GitHub Actions workflow** in this repository —
quality checks run locally, on push, via a git hook.

## License

MIT
