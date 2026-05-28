# Docker

O ambiente Docker foi pensado para onboarding rápido e previsível.

## Serviços

- `nginx`: expõe a aplicação em `APP_PORT`, por padrão `8080`.
- `app`: Laravel em PHP-FPM.
- `queue`: worker de filas Laravel.
- `node`: servidor Vite para desenvolvimento frontend.
- `postgres`: banco principal.
- `redis`: cache, sessão e filas.
- `mailpit`: caixa de e-mail local.
- `minio`: storage compatível com S3.

## Primeiro uso

```bash
cp .env.example .env
docker compose up -d
```

O container `app` executa automaticamente:

- instalação Composer quando `vendor/autoload.php` não existe;
- geração de `APP_KEY` quando necessário;
- limpeza de cache;
- link de storage;
- migrations;
- seeders.

O serviço `node` executa automaticamente:

- `npm install` quando o volume `node-modules` ainda está vazio;
- `npm run build` para popular `public/build`;
- `npm run dev -- --host 0.0.0.0` para manter o Vite disponível em `VITE_PORT`, por padrão `5173`.

## Comandos úteis

```bash
docker compose ps
docker compose logs -f app
docker compose exec app php artisan migrate:fresh --seed
docker compose exec app php artisan test
docker compose exec node npm run dev
```

## Reset completo

```bash
docker compose down -v
docker compose up -d
```

Esse comando remove volumes locais, incluindo banco, Redis, MinIO, dependências Composer e build frontend.
