.PHONY: help install hooks check lint lint-fix build test test-integration

help: ## Lista os alvos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Instala as dependências
	npm install

hooks: ## Ativa os git hooks locais (lint + type-check + test no pre-push)
	git config core.hooksPath .githooks
	chmod +x .githooks/*
	@echo "Hooks ativos. Sem GitHub Actions neste repo -- CI é só local (pre-push)."

check: ## Roda tudo que o pre-push roda -- lint, type-check, testes unitários
	@$(MAKE) lint
	@npx tsc --noEmit
	@$(MAKE) test

lint: ## ESLint
	npx eslint src test

lint-fix: ## ESLint com --fix
	npx eslint src test --fix

build: ## Compila pra dist/
	npx tsc -p tsconfig.json

test: ## Testes unitários (FakeProvider only, sem rede)
	npx vitest run

test-integration: ## Testes de integração reais (opt-in, precisa de chaves/servidor local) -- NUNCA roda no hook
	npx vitest run --config vitest.integration.config.ts
