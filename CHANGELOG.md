# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.4.0] - 2026-09-05

### Fixed

- `dist/` is now committed (no longer gitignored) and rebuilt as part of
  every tagged release. A plain GitHub tarball URL install -- the only
  option that doesn't need the `git` binary on the installing machine --
  never triggers `scripts.prepare` (only a `git+` dependency does, and
  that needs `git` for real). Since this package isn't on npm yet,
  committed `dist/` is the only way a tarball-URL consumer gets something
  that actually imports.

## [0.3.0] - 2026-09-05

### Fixed

- `dist/` is gitignored, so installing this package via a GitHub tarball
  URL or `git+` dependency (the only options before this is published to
  npm) downloaded only the source and left `main`/`exports` pointing at a
  `dist/` that didn't exist. Added `scripts.prepare`, which npm runs
  automatically for git-referenced dependencies, so `dist/` now gets
  built as part of the install.

## [0.2.0] - 2026-09-05

### Added

- Vision (image) support: `CompletionRequest.image?: { data, mimeType }`
  and `ProviderPool.complete(prompt, { image })`. `GeminiProvider`,
  `OpenAIProvider`, `AnthropicProvider`, and `OllamaProvider` (with a
  vision-capable model) all accept it. `GroqProvider` and `DeepSeekProvider`
  throw a plain `Error` (never `QuotaExceededError`) if given an image,
  since neither has a vision-capable model configured.

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
