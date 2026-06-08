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

## Login com Supabase não entra

Confira se as variáveis do Supabase estão configuradas:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Depois gere o build novamente:

```bash
docker compose exec node npm run build
```

No painel do Supabase, confirme tambem:

- `Authentication > Providers > Email` habilitado.
- URL do projeto configurada corretamente.
- Usuario criado em `Authentication > Users`.
- Se confirmacao de e-mail estiver ativa, o e-mail precisa ser confirmado antes do login.

## Resetar tudo

```bash
docker compose down -v
docker compose up -d
```

Use com cuidado: isso apaga dados locais.
