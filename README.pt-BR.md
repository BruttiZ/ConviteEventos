# Invitely

Invitely e uma plataforma open source para convites digitais, RSVP, check-in por QR Code e gerenciamento de eventos. O projeto usa Laravel 12 no backend, React com TypeScript no frontend e Docker com Nginx, PHP-FPM, PostgreSQL, Redis, Mailpit e MinIO.

## Como o projeto funciona

O Nginx recebe as requisicoes em `http://localhost:8080` e encaminha PHP para o container `app`, que roda Laravel em PHP 8.4-FPM. O Laravel entrega a SPA React pelo Blade em `resources/views/app.blade.php`; o React assume as rotas publicas, login/cadastro e dashboard no navegador.

As rotas da API ficam em `routes/api.php` com prefixo `/api/v1`. A pagina publica busca dados em `/api/v1/events/{slug}` e registra RSVP em `/api/v1/events/{slug}/rsvp`. O fluxo de login/cadastro emite tokens Sanctum e o dashboard em `/admin` muda conforme o papel do usuario.

## Fluxo demo

Abra:

- Landing page: `http://localhost:8080`
- Convite demo: `http://localhost:8080/events/invitely-launch-night`
- Login / cadastro: `http://localhost:8080/login`
- Dashboard: `http://localhost:8080/admin`
- Mailpit: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

Contas locais, todas com senha `password`:

| Perfil              | E-mail               | O que testa                                  |
| ------------------- | -------------------- | -------------------------------------------- |
| Dono do evento      | `host@invitely.dev`  | Eventos, convidados, temas, RSVP e check-in. |
| Convidado           | `guest@invitely.dev` | Convite publico, confirmacao e QR Code.      |
| Admin da plataforma | `admin@invitely.dev` | Visao operacional de tenants e plataforma.   |

## Redesign atual

O app foi redesenhado para uma estética dark premium de SaaS moderno:

- Landing page com hero "Eventos incríveis. Conexões reais. Resultados extraordinários.".
- Mockup flutuante do dashboard na hero.
- Dashboard com sidebar desktop, bottom navigation mobile, métricas, gráfico de linha e distribuição de RSVP.
- Eventos em cards com imagem, status, data, local, confirmados, taxa de RSVP e CTA.
- Convite público com imagem de fundo, overlay escuro, countdown, formulário confortável e QR Code.
- Paleta baseada em `#060B1A`, `#0B0F1A`, `#121827`, `#263247`, `#8B5CF6`, `#22D3EE` e `#0EA5E9`.

## Servicos Docker

| Servico    | Funcao                               | URL/porta padrao                                      |
| ---------- | ------------------------------------ | ----------------------------------------------------- |
| `nginx`    | Servidor web da aplicacao            | `http://localhost:8080`                               |
| `app`      | Laravel / PHP-FPM                    | interno, porta `9000`                                 |
| `queue`    | Worker de filas Laravel              | interno                                               |
| `node`     | Instala dependencias JS e gera build | interno                                               |
| `postgres` | Banco de dados                       | `localhost:5432`                                      |
| `redis`    | Cache, sessao e filas                | `localhost:6379`                                      |
| `mailpit`  | Caixa de e-mail local                | `http://localhost:8025`                               |
| `minio`    | Storage S3 local                     | API `localhost:9000`, console `http://localhost:9001` |

## Como rodar com Docker

```bash
cp .env.example .env
docker compose up -d --build
```

No PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

O container `app` prepara o Laravel automaticamente: gera `APP_KEY` quando necessario, limpa cache, cria `storage:link`, roda migrations e seeders. O container `node` instala dependencias JS, gera `public/build` e remove `public/hot` para garantir que o Nginx sirva os assets estaticos do build.

## Comandos uteis

```bash
docker compose ps
docker compose logs -f app
docker compose exec app php artisan route:list --path=api
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec node npm run lint
docker compose exec node npm run format:check
docker compose exec node npm run typecheck
docker compose exec node npm run build
```

Para recriar o banco do zero:

```bash
docker compose exec app php artisan migrate:fresh --seed
```

Para parar tudo:

```bash
docker compose down
```

Para parar e apagar volumes locais:

```bash
docker compose down -v
```

## Desenvolvimento frontend

No fluxo Docker padrao, abra sempre `http://localhost:8080`. O navegador nao precisa acessar uma porta Vite separada. O service worker fica desabilitado em ambiente local para evitar cache antigo durante desenvolvimento.

Se quiser rodar ferramentas JS:

```bash
docker compose exec node npm run typecheck
docker compose exec node npm run build
```

## Padrao de commits

O projeto usa Conventional Commits em portugues brasileiro.

Exemplos validos:

```text
feat: adiciona fluxo de RSVP
fix: corrige responsividade do painel admin
docs: melhora guia Docker
```

## Solucao de problemas

Se a tela ficar branca, rode:

```bash
docker compose exec node npm run build
docker compose restart nginx
```

Depois abra novamente `http://localhost:8080` com reload forte no navegador.

Se o login retornar erro de banco, confirme que o Docker esta usando PostgreSQL:

```bash
docker compose exec app php artisan tinker --execute="dump(config('database.default'));"
```

O valor esperado no Docker e `pgsql`.
