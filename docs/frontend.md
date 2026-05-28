# Frontend

O frontend usa React, TypeScript, Vite, TailwindCSS e Framer Motion.

## Organização

```text
resources/js/
  app/features/          Funcionalidades por área de produto
  components/ui/         Componentes reutilizáveis de interface
  lib/                   Utilitários compartilhados
```

## Princípios

- Mobile-first.
- Estados explícitos de loading, erro e vazio.
- Componentes visuais pequenos.
- Lógica de API em hooks ou módulos de feature.
- Acessibilidade desde o início.
- Tipagem estrita.

## Comandos

```bash
docker compose exec node npm run dev
docker compose exec node npm run typecheck
docker compose exec node npm run lint
docker compose exec node npm run format:check
docker compose exec node npm run build
```

## Guardrails

- ESLint valida TypeScript/TSX com regras tipadas.
- Prettier mantém CSS, React, JSON e Markdown consistentes.
- `lint-staged` roda correções nos arquivos alterados antes do commit.
- `commitlint` bloqueia mensagens fora do padrão Conventional Commits.
