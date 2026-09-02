# Diretrizes do Projeto (Auto Point)

## 🎯 Comunicação e Otimização de Tokens
- **Respostas Ultraconcisas:** Seja direto e objetivo. Sem saudações, introduções, conclusões ou cortesias redundantes.
- **Economia Máxima de Tokens:** Nunca reproduza arquivos inteiros ou blocos grandes de código na resposta sem necessidade; apresente apenas resumos em tópicos ou trechos estritamente alterados.
- **Ação sobre Explicação:** Priorize executar ações diretamente com ferramentas e retorne apenas o resumo essencial do que foi feito.
- **Linguagem:** Responder prioritariamente em Português (pt-BR).

## 🔒 Regras de Controle de Versão (Git)
- **Commits e Pushes sob Demanda:** NUNCA execute `git commit` ou `git push` automaticamente por iniciativa própria.
- **Apenas sob comando explícito:** Só crie commits ou envie alterações (push) quando o usuário solicitar expressamente (ex: "faça o commit", "comite tudo", "dê push").

## 🛠️ Stack e Padrões Técnicos
- **Gerenciador de Pacotes:** `pnpm`.
- **Arquitetura:** PWA 100% Client-Side (sem backend intermediário).
- **Core:** React 19, Vite (SWC), TypeScript (~5.9), Tailwind CSS v4, Radix UI Themes.
- **Roteamento & Estado:** TanStack Router (file-based routing; `src/routeTree.gen.ts` é autogerado via `pnpm generate:routes`), TanStack Query, TanStack Form.
- **Banco de Dados:** Turso (LibSQL) via `@libsql/client/web` e `Drizzle ORM` (`drizzle-orm/libsql/web`). Schemas/migrações via `drizzle-kit`.
- **Estrutura de Pastas (`src/`):**
  - `atomic/`: Componentes UI seguindo Atomic Design.
  - `routes/`: Rotas do TanStack Router.
  - `db/`: Schema e cliente Drizzle/LibSQL.
  - `hooks/`: Hooks customizados e queries do TanStack Query.
  - `services/`: Serviços e utilitários de integração.
- **Ambiente de Desenvolvimento:** Roda prioritariamente via Docker (`docker compose up -d`).
