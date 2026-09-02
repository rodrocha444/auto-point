# Diretrizes do Projeto (Auto Point)

## 🎯 Comunicação e Otimização de Tokens
- **Respostas Diretas e Concisas:** Seja objetivo. Evite explicações redundantes, repetições de código já existente ou textos introdutórios longos.
- **Foco na Resolução:** Priorize executar ações e retornar apenas o resumo essencial do que foi feito.
- **Linguagem:** Responder prioritariamente em Português (pt-BR).

## 🔒 Regras de Controle de Versão (Git)
- **Commits e Pushes sob Demanda:** NUNCA execute `git commit` ou `git push` automaticamente por iniciativa própria.
- **Apenas sob comando explícito:** Só crie commits ou envie alterações (push) quando o usuário solicitar expressamente (ex: "faça o commit", "comite tudo", "dê push").

## 🛠️ Stack e Ambiente de Desenvolvimento
- **Arquitetura:** PWA 100% Client-Side (sem backend intermediário).
- **Stack:** React 19, Vite, Tailwind CSS v4, TanStack Router, TanStack Query, Radix UI Themes.
- **Banco de Dados:** Turso (LibSQL) via `@libsql/client/web` e `Drizzle ORM` (`drizzle-orm/libsql/web`).
- **Execução:** O ambiente de desenvolvimento roda prioritariamente via Docker (`docker compose up -d`).
