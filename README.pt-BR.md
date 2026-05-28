# Invitely

Invitely é uma plataforma open source para convites digitais, RSVP, check-in por QR Code e páginas públicas de eventos. O projeto usa Laravel 12 no backend, React com TypeScript no frontend e um ambiente Docker com Nginx, PHP-FPM, PostgreSQL, Redis, Mailpit e MinIO.

## Como o projeto funciona

O Nginx recebe as requisições em `http://localhost:8080` e encaminha PHP para o container `app`, que roda Laravel em PHP 8.4-FPM. O Laravel entrega a SPA React pelo Blade em `resources/views/app.blade.php`; o React assume as rotas públicas e administrativas no navegador.

As rotas da API ficam em `routes/api.php` com prefixo `/api/v1`. A página pública busca os dados do evento em `/api/v1/events/{slug}` e registra RSVP em `/api/v1/events/{slug}/rsvp`. O painel administrativo em `/admin` é uma interface inicial; as rotas administrativas de API existem, mas exigem autenticação via Sanctum.

A experiência pública foi pensada mobile-first: hero responsivo, CTA fixo no celular, RSVP com feedback visual, countdown compacto, galeria fluida e microinterações suaves.

Os dados persistem no PostgreSQL. Redis é usado para cache, sessão e fila. O container `queue` roda `php artisan queue:work`. Mailpit recebe e-mails de desenvolvimento. MinIO fica disponível para compatibilidade com armazenamento S3.

## Serviços Docker

| Serviço    | Função                    | URL/porta padrão                                      |
| ---------- | ------------------------- | ----------------------------------------------------- |
| `nginx`    | Servidor web da aplicação | `http://localhost:8080`                               |
| `app`      | Laravel / PHP-FPM         | interno, porta `9000`                                 |
| `queue`    | Worker de filas Laravel   | interno                                               |
| `node`     | Vite, build e tooling JS  | `http://localhost:5173`                               |
| `postgres` | Banco de dados            | `localhost:5432`                                      |
| `redis`    | Cache, sessão e fila      | `localhost:6379`                                      |
| `mailpit`  | Caixa de e-mail local     | `http://localhost:8025`                               |
| `minio`    | Storage S3 local          | API `localhost:9000`, console `http://localhost:9001` |

## Requisitos

- Docker Desktop ou Docker Engine com Docker Compose.
- Portas livres: `8080`, `5173`, `5432`, `6379`, `8025`, `9000` e `9001`.
- Conexão com a internet na primeira build para baixar imagens e dependências.

Se alguma porta estiver ocupada, altere os valores no `.env`, por exemplo `APP_PORT=8081` ou `POSTGRES_PORT=5433`.

## Como rodar com Docker

Opção mais rápida no PowerShell:

```powershell
.\scripts\bootstrap.ps1
```

No Linux/macOS:

```bash
sh scripts/bootstrap.sh
```

Ou manualmente:

1. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

No PowerShell, se preferir:

```powershell
Copy-Item .env.example .env
```

2. Suba os containers:

```bash
docker compose up -d --build
```

3. Abra a aplicação:

- App: `http://localhost:8080`
- Evento demo: `http://localhost:8080/events/invitely-launch-night`
- Admin UI: `http://localhost:8080/admin`
- Mailpit: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

Usuário demo:

- E-mail: `admin@invitely.dev`
- Senha: `password`

## Comandos úteis

```bash
docker compose ps
docker compose config --quiet
docker compose logs -f app
docker compose logs -f queue
docker compose exec app php artisan route:list
docker compose exec app php artisan route:list --path=api
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec node npm run lint
docker compose exec node npm run format:check
docker compose exec node npm run typecheck
docker compose exec node npm run build
```

A especificação inicial da API está em `docs/api/openapi.yaml` e pode ser aberta em qualquer visualizador Swagger/OpenAPI.

Para recriar o banco do zero, apagando dados locais:

```bash
docker compose exec app php artisan migrate:fresh --seed
```

Para parar o ambiente:

```bash
docker compose down
```

Para parar e apagar volumes, incluindo banco, Redis, MinIO, `vendor` e build gerados:

```bash
docker compose down -v
```

## Desenvolvimento frontend fora do Docker

O Docker já instala dependências JS, gera os assets e mantém o Vite ativo no serviço `node`. Para desenvolver o frontend fora do container, use Node.js local:

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm run typecheck
```

## Padrão de commits

O projeto usa Conventional Commits em português brasileiro. Os hooks do Husky executam `lint-staged` antes do commit e `commitlint` na mensagem.

Exemplos válidos:

```text
feat: adiciona fluxo de RSVP
fix: corrige responsividade do painel admin
docs: melhora guia Docker
```

## Solução de problemas

Se `php artisan test`, `vendor/bin/pint` ou `vendor/bin/phpstan` não existirem depois de uma atualização do Dockerfile, provavelmente o volume `vendor-data` foi criado por uma versão antiga da imagem. Atualize o volume sem apagar o banco:

```bash
docker compose exec app composer install --no-interaction --prefer-dist --optimize-autoloader
```

Se quiser recriar todo o ambiente local do zero, use `docker compose down -v` e suba novamente. Esse comando apaga os volumes locais.

## Validação do ambiente Docker

Este passo a passo foi validado em Docker em 28/05/2026 com:

```bash
docker compose up -d
```

Também foram verificadas as URLs `http://localhost:8080`, `http://localhost:8080/events/invitely-launch-night`, `http://localhost:8080/admin`, `http://localhost:8025`, `http://localhost:9001` e a API `http://localhost:8080/api/v1/events/invitely-launch-night`.

Pontos corrigidos para tornar o ambiente reproduzível:

- O entrypoint agora só gera `APP_KEY` quando o `.env` ainda não tem uma chave.
- O entrypoint instala dependências Composer quando o volume `vendor-data` está vazio.
- O entrypoint executa limpeza de cache, `storage:link`, migrations e seeders automaticamente.
- O serviço `node` instala dependências JS, gera o build frontend e mantém o Vite ativo.
- A imagem Docker local inclui dependências Composer de desenvolvimento, permitindo rodar testes, Pint e PHPStan dentro do container.
- O `.env.example` não possui mais valores duplicados para `AWS_USE_PATH_STYLE_ENDPOINT`.

Com Docker funcionando, portas livres e internet disponível na primeira build, uma pessoa seguindo os passos acima deve conseguir rodar o projeto em ambiente Docker.
