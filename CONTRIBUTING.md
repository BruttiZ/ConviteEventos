# Guia de contribuição

Obrigado por querer contribuir com o Invitely. A prioridade do projeto é manter uma experiência simples para quem instala, segura para quem usa e sustentável para quem mantém.

## Como rodar localmente

```bash
cp .env.example .env
docker compose up -d
```

Depois acesse:

- App: `http://localhost:8080`
- Evento demo: `http://localhost:8080/events/invitely-launch-night`
- Admin: `http://localhost:8080/admin`

## Antes de abrir um pull request

Rode os comandos abaixo:

```bash
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec node npm run typecheck
docker compose exec node npm run build
```

## Padrão de commits

Use Conventional Commits em português brasileiro:

```text
feat: adiciona sistema de RSVP
fix: corrige responsividade do menu mobile
refactor: separa lógica de convidados em action
docs: atualiza guia de instalação Docker
chore: configura eslint e prettier
test: adiciona testes do fluxo público
```

Evite mensagens genéricas como `ajustes`, `update`, `mudanças`, `teste` ou `fix`.

## Padrões de backend

- Controllers devem ser finos.
- Regras de negócio devem viver em Actions.
- Use Form Requests para validação.
- Use Policies para recursos protegidos por tenant ou usuário.
- Prefira DTOs tipados em vez de arrays grandes de request.
- Repositórios devem esconder detalhes de persistência.
- Testes devem cobrir comportamento de produto.

## Padrões de frontend

- Estruture por feature.
- Componentes visuais não devem concentrar regra de negócio.
- Toda tela deve ter estado de carregamento e erro quando depender de API.
- Priorize mobile-first.
- Garanta navegação por teclado e atributos acessíveis.
- Use TypeScript de forma estrita.

## Pull requests

Inclua:

- O que mudou.
- Por que mudou.
- Como testar.
- Screenshots ou vídeo curto para mudanças de UI.
- Riscos conhecidos ou dívida técnica criada.

Pull requests pequenos são mais fáceis de revisar e manter.
