# Frontend

O frontend usa React, TypeScript, Vite, TailwindCSS e Framer Motion.

## Organizacao

```text
resources/js/
  app/auth/              Sessao local, usuario autenticado e papeis
  app/features/auth/     Login, cadastro e atalhos de demo
  app/features/public/   Convite publico, RSVP, QR Code e compartilhamento
  app/features/admin/    Dashboard interativo por perfil
  components/ui/         Componentes reutilizaveis de interface
  lib/                   Utilitarios compartilhados
```

## Rotas principais

- `/login`: tela de login/cadastro com tres perfis de teste.
- `/events/invitely-launch-night`: convite publico com RSVP, compartilhamento, tema e QR Code.
- `/admin`: dashboard interativo que muda a navegacao conforme o papel do usuario.

## Contas demo

Todas usam a senha `password`.

| Perfil              | E-mail               |
| ------------------- | -------------------- |
| Dono do evento      | `host@invitely.dev`  |
| Convidado           | `guest@invitely.dev` |
| Admin da plataforma | `admin@invitely.dev` |

## Principios

- Mobile-first.
- Estados explicitos de loading, erro e sucesso.
- Componentes visuais pequenos.
- Logica de API isolada por feature.
- Acessibilidade desde o inicio.
- Tipagem estrita.

## Experiencia publica mobile

A landing publica prioriza celulares:

- hero com titulo legivel em telas pequenas;
- CTA primario visivel no primeiro viewport;
- navegacao fixa inferior para confirmacao e compartilhamento;
- areas tocaveis com altura estavel;
- feedback visual para sucesso, erro e envio de RSVP;
- galerias e cards fluidos entre celular, tablet e desktop;
- service worker desabilitado em ambiente local para evitar cache antigo.

## Comandos

```bash
docker compose exec node npm run typecheck
docker compose exec node npm run lint
docker compose exec node npm run format:check
docker compose exec node npm run build
```

## Guardrails

- ESLint valida TypeScript/TSX.
- Prettier mantem CSS, React, JSON e Markdown consistentes.
- `lint-staged` roda correcoes nos arquivos alterados antes do commit.
- `commitlint` bloqueia mensagens fora do padrao Conventional Commits.
