# Troubleshooting

## Porta ocupada

Altere a porta no `.env`:

```env
APP_PORT=8081
POSTGRES_PORT=5433
```

Depois rode:

```bash
docker compose up -d
```

## Dependências PHP ausentes no container

Se comandos como `php artisan test`, `vendor/bin/pint` ou `vendor/bin/phpstan` não existirem, atualize o volume:

```bash
docker compose exec app composer install --no-interaction --prefer-dist --optimize-autoloader
```

## Assets frontend não aparecem

Rode o build pelo container Node:

```bash
docker compose exec node npm run build
```

## Resetar tudo

```bash
docker compose down -v
docker compose up -d
```

Use com cuidado: isso apaga dados locais.
