# Backlog — agent-provider-pool

## 🎯 Épico 1: MVP — pool de providers com escada e failover por cota

**Objetivo:** camada embutível (npm, TypeScript) que gerencia um pool de
provedores de LLM, cada um com sua própria escada de modelos simples→complexo,
escalando automaticamente por cota esgotada (proativa + reativa), sem nenhuma
noção de classificação de tarefa — essa inteligência fica pro futuro
"gerente" (plugin) que vai consumir esta biblioteca. Origem: motivado pela
issue #167 do `fitness-web` (Fase 3 do módulo de OCR/IA), mas construído
100% genérico — o `fitness-web` é só um futuro consumidor, quando existir
modo servidor. Spec completa: [issue #1](https://github.com/murilofelipe/agent-provider-pool/issues/1).

### 🎫 Story 1.1: `Provider` interface + `ProviderPool` (escada + failover) + `QuotaStore` (persistência JSON) ✅ [CONCLUÍDA]
- **Descrição:** núcleo da biblioteca — `src/types.ts` (`Provider`,
  `ModelConfig`, `ProviderRegistration`), `src/pool.ts` (`ProviderPool`:
  escalona modelo→modelo no mesmo provider antes de provider→provider,
  detecção proativa + reativa), `src/quota-store.ts` (persistência em JSON
  local, granularidade por par (provider, modelo), rollover diário/mensal).
- **Não-Objetivos:** sem classificação de tarefa, sem modo servidor HTTP,
  sem múltiplas credenciais por provider, sem SQLite/concorrência — tudo
  isso é decisão explícita da spec (issue #1), não corte por pressa.
- **Complexidade:** Média | **Peso:** 5
- **Justificativa do Peso:** lógica de escalonamento em duas dimensões
  (modelo dentro do provider, depois provider) + persistência com rollover
  de data é mais que trivial, mas é uma seam só (`Provider`), sem I/O externo
  na lógica central — mantém o peso moderado.
- **Tarefas:**
  - [x] `Provider` interface (a seam única, confirmada com o dono antes de
    implementar).
  - [x] `QuotaExceededError`/`PoolExhaustedError` (`src/errors.ts`).
  - [x] `QuotaStore`: `isExhausted`/`recordUsage`/`markExhausted`, rollover
    diário e mensal, persistência em arquivo JSON local.
  - [x] `ProviderPool.complete()`: escaneia a lista de providers em ordem,
    dentro de cada um a escada de modelos em ordem, pulando o que já está
    exhausted; captura `QuotaExceededError` do provider real e marca
    exhausted antes de escalonar; propaga qualquer outro erro sem escalonar.
  - [x] `FakeProvider` (test double, ships com o pacote).
  - [x] Testes unitários cobrindo: pair inicial, escada mesmo provider,
    troca de provider, pool inteiro esgotado, erro não-quota propaga sem
    escalonar, corte proativo por limite configurado, persistência
    sobrevive a nova instância, 429 reativo mesmo com limite configurado
    errado.

### 🎫 Story 1.2: Adapters reais — Groq, Gemini, Ollama ✅ [CONCLUÍDA]
- **Descrição:** os três providers "grátis" que motivaram o projeto (Groq e
  Gemini pelos free tiers reais que já bateram 429 em produção no
  `equipe-agentes-docker`; Ollama como fallback local sem limite nenhum).
- **Não-Objetivos:** OpenAI/Anthropic/DeepSeek ficam pra Stories seguintes
  (decisão explícita da spec, não esquecimento).
- **Complexidade:** Baixa | **Peso:** 3
- **Justificativa do Peso:** três chamadas HTTP simples via `fetch` nativo
  (sem SDK novo como dependência), cada uma só traduzindo request/response
  pro formato de `Provider` — repetitivo, não complexo.
- **Tarefas:**
  - [x] `GroqProvider` (chat completions compatível com OpenAI).
  - [x] `GeminiProvider` (Generative Language API).
  - [x] `OllamaProvider` (servidor local, sem API key).
  - [x] Testes de integração reais (opt-in, `npm run test:integration`,
    cada um se auto-pula sem a chave/servidor correspondente) — nunca
    rodam no hook local nem em CI nenhum.

### 🎫 Story 1.3: Bootstrap do repositório ✅ [CONCLUÍDA]
- **Descrição:** `package.json`/`tsconfig.json`/ESLint/Vitest, `LICENSE`
  (MIT), `README.md` (inglês) + `README.pt-BR.md`, `BACKLOG.md` (este
  arquivo), git hooks locais (`make hooks`, pre-push roda lint+type-check+
  testes unitários).
- **Não-Objetivos:** **sem GitHub Actions** — decisão explícita do dono
  (quota mensal de Actions já travou outro projeto antes); CI é só local.
- **Complexidade:** Baixa | **Peso:** 2
- **Tarefas:**
  - [x] Estrutura TypeScript ESM-only, `strict`, `noUncheckedIndexedAccess`.
  - [x] ESLint (`typescript-eslint` recommended + `no-explicit-any`).
  - [x] Vitest (unitário default; integração em config separada, nunca
    roda sem opt-in explícito).
  - [x] `Makefile` + `.githooks/pre-push` (mesmo padrão do `fitness-web`:
    `make hooks` ativa, `make check` roda tudo, escape via `--no-verify`).
  - [x] Branches `main` + `develop` (git-flow).

### 🎫 Story 1.4: Adapters pagos — OpenAI, Anthropic, DeepSeek ✅ [CONCLUÍDA]
- **Descrição:** rede de segurança final da escada — pool com só providers
  grátis/local (1.1-1.3) não tem "último recurso" de verdade: quando Groq,
  Gemini e o Ollama local (se estiver rodando) se esgotam, `complete()`
  lança `PoolExhaustedError` sem mais pra onde escalonar. Estes três
  adapters entram tipicamente por ÚLTIMO na ordem de prioridade — só
  chamados quando não sobra nada grátis. Spec completa:
  [issue #2](https://github.com/murilofelipe/agent-provider-pool/issues/2).
- **Não-Objetivos:** nenhuma mudança em `ProviderPool`/`QuotaStore` —
  Story só adiciona adapters ao catálogo, mesma seam `Provider` de sempre.
  Sem streaming, sem tracking de custo/orçamento (a cota continua sendo só
  contagem de chamadas, não gasto em dinheiro).
- **Complexidade:** Baixa | **Peso:** 3
- **Justificativa do Peso:** mesmo raciocínio da Story 1.2 — chamadas HTTP
  via `fetch` nativo, cada uma só traduzindo request/response; Anthropic
  tem shape de request/response mais distinto (Messages API, blocos de
  `content`) que OpenAI/DeepSeek (mesma família compatível com OpenAI,
  igual Groq).
- **Tarefas:**
  - [x] `OpenAIProvider` (Chat Completions API) — [#3](https://github.com/murilofelipe/agent-provider-pool/issues/3), PR #7.
  - [x] `AnthropicProvider` (Messages API, shape distinto) — [#4](https://github.com/murilofelipe/agent-provider-pool/issues/4), PR #8.
  - [x] `DeepSeekProvider` (compatível com OpenAI) — [#5](https://github.com/murilofelipe/agent-provider-pool/issues/5), PR #9.
  - [x] Testes de integração reais (opt-in) pros três, mesmo padrão das
    Stories anteriores.
  - [x] Tabela de providers dos dois READMEs atualizada.

### 🎫 Story 1.5: Suporte a imagem (visão) no `CompletionRequest` ✅ [CONCLUÍDA]
- **Descrição:** gap real descoberto ao voltar pro `fitness-web` (issue
  #167, Fase 3): `Provider.complete()` só aceitava `prompt: string`, sem
  jeito de mandar uma imagem pra um modelo de visão. `CompletionRequest`
  ganha `image?: { data, mimeType }` opcional; `ProviderPool.complete()`
  ganha um segundo argumento opcional `{ image }`.
- **Não-Objetivos:** sem mudança na lógica de escada/failover/quota — a
  imagem é só mais um campo do request, não afeta escalonamento nenhum.
- **Complexidade:** Baixa | **Peso:** 3
- **Justificativa do Peso:** mudança de tipo pequena + 4 adapters
  ganhando o bloco de imagem no formato próprio de cada API (`inlineData`
  no Gemini, `image_url` no OpenAI, bloco `image`/`source` no Anthropic,
  `images: [base64]` no Ollama) — repetitivo, não complexo.
- **Tarefas:**
  - [x] `CompletionRequest.image`/`CompletionImage` (`src/types.ts`).
  - [x] `ProviderPool.complete(prompt, { image })`.
  - [x] `GeminiProvider`/`OpenAIProvider`/`AnthropicProvider`/`OllamaProvider`
    passam a imagem quando presente.
  - [x] `GroqProvider`/`DeepSeekProvider` lançam `Error` simples (nunca
    `QuotaExceededError`) se receberem imagem — nenhum modelo configurado
    tem visão; "não sei fazer isso" não é "tenta o próximo".
  - [x] Testes unitários (passthrough de imagem, omissão quando ausente,
    guarda de Groq/DeepSeek) + testes de integração reais (opt-in) pros 4
    adapters com visão, usando um PNG 1x1 embutido no teste (sem fixture
    binária nova versionada).
  - [x] READMEs (EN + pt-BR) documentam o uso com imagem.

## 🔭 Backlog futuro (fora do MVP, sem Peso ainda)

- **Múltiplas credenciais por provider** (pool de chaves do MESMO provider,
  ex. 3 chaves Gemini free tier somando cota) — explicitamente adiado no
  MVP (issue #1).
- **Modo servidor HTTP** — quando existir um consumidor real de rede (ex.
  `fitness-web`), sem reescrever a lógica central: o servidor só expõe
  `ProviderPool.complete()` por HTTP.
- **Persistência com segurança de concorrência** (SQLite) — só quando o
  modo servidor permitir múltiplos processos escrevendo o mesmo estado.
- **Camada de "gerente"/plugin** — quando um agente orquestrador (ex.
  Claude Code) decide os parâmetros de tarefa/capacidade dinamicamente,
  consumindo esta biblioteca como o substrato de pool/quota por baixo. Ver
  achado da pesquisa de mercado (issue #1): `sampling` do MCP está
  deprecated desde a versão de protocolo 2026-07-28 — a integração com
  ferramentas de agente deve expor uma tool MCP normal que chama o
  provider direto, não depender de `sampling`.
