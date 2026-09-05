# agent-provider-pool

[🇺🇸 English](./README.md)

Um pool embutível de provedores de LLM com **failover automático sensível a cota**.

Configure cada provider uma vez — uma API key e uma escada de modelos do
mais simples ao mais capaz, cada um com seu próprio `temperature`. Chame
`pool.complete(prompt)`. Quando a cota do modelo ativo se esgota, o pool
escalona sozinho: primeiro pro próximo modelo da escada do MESMO provider,
depois pro próximo provider. O uso de cota persiste localmente, então um
restart do processo não "esquece" o que já foi gasto hoje.

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
    models: [{ model: 'llama3.2', temperature: 0.5 }], // sem limite -- local
  });

const result = await pool.complete('Extraia o exercício, séries, repetições e carga desta linha.');
console.log(result.text, result.provider, result.model);
```

## Por quê

Cota de free tier de LLM é pequena, inconsistente entre provedores, e fácil
de esgotar no meio de uma sessão — toda chamada seguinte falha até alguém
perceber e trocar manualmente. Esta biblioteca é uma alternativa
"bring-your-own-key" a roteadores hospedados (Auto Router da OpenRouter) ou
a roteadores só de custo/latência (Router do LiteLLM, Portkey Gateway): ela
rastreia cota por par (provider, modelo) de forma **proativa** (contra um
limite diário/mensal configurado, pra nunca gastar uma chamada que já sabe
que vai falhar) **e reativa** (capturando um erro real de 429/cota, caso o
número configurado estivesse errado), e sempre esgota a escada de modelos
de um provider antes de passar pro próximo.

## O que isto NÃO é

- **Não é um classificador de tarefa.** O pool nunca olha o conteúdo do
  prompt pra decidir qual provider é "melhor" pra aquilo — ele sempre
  tenta os providers na ordem em que você os registrou. Roteamento
  consciente de tarefa é uma preocupação futura, deliberadamente separada.
- **Não é um serviço hospedado.** É uma biblioteca embutida (`import`), não
  um servidor HTTP. Sem UI de admin, sem parsing de arquivo de config —
  configuração é código, via o builder acima.

## Providers

| Provider | Adapter | Observação |
|---|---|---|
| [Groq](https://groq.com) | `GroqProvider` | API de chat completions compatível com OpenAI |
| [Gemini](https://ai.google.dev) | `GeminiProvider` | Google Generative Language API |
| [Ollama](https://ollama.com) | `OllamaProvider` | Servidor local, sem API key, sem cota |
| [OpenAI](https://platform.openai.com) | `OpenAIProvider` | API de Chat Completions |
| [Anthropic](https://www.anthropic.com) | `AnthropicProvider` | Messages API |
| [DeepSeek](https://www.deepseek.com) | `DeepSeekProvider` | API de chat completions compatível com OpenAI |

## Testando seu próprio código contra esta biblioteca

`FakeProvider` já vem no pacote — um dublê de teste que nunca faz chamada
de rede real:

```ts
import { ProviderPool, FakeProvider } from 'agent-provider-pool';

const fake = new FakeProvider({ 'meu-modelo': { type: 'quota-exceeded' } });
const pool = new ProviderPool({ quotaStorePath: '.test-quota.json' })
  .addProvider({ name: 'teste', provider: fake, models: [{ model: 'meu-modelo', temperature: 0 }] });
```

## Desenvolvimento

```bash
npm install
make hooks   # ativa o guard local de pre-push (lint + type-check + testes unitários)
make check   # roda o mesmo guard manualmente
make test-integration   # opt-in, bate API real -- precisa de chaves reais/Ollama local
```

Este repositório **não tem workflow de GitHub Actions de propósito** — as
checagens de qualidade rodam só localmente, no push, via git hook.

## Licença

MIT
