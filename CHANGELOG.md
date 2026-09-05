# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-09-05

### Added

- `ProviderPool` — an embeddable pool of LLM providers with quota-aware
  automatic failover. Each provider registers an ordered ladder of models
  (simplest to most capable, each with its own temperature); the pool
  escalates within the same provider's ladder before moving to the next
  provider, on quota exhaustion detected both proactively (a configured
  daily/monthly limit) and reactively (a real 429/quota error from the
  provider).
- Quota usage persists per (provider, model) pair to a local JSON file, so
  a process restart doesn't forget what's already been spent today.
- Provider adapters: `GroqProvider`, `GeminiProvider`, `OllamaProvider`
  (the free/local tier), plus `OpenAIProvider`, `AnthropicProvider`, and
  `DeepSeekProvider` (paid fallback tier).
- `FakeProvider` test double, shipped with the package, for testing
  failover-dependent code without real network calls or spent quota.
- `README.md` (English) and `README.pt-BR.md` (Portuguese).
