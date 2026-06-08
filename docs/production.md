# Deploy em produção

Este projeto é Laravel + React/Vite. Isso significa que existem dois caminhos de produção.

## Caminho recomendado para SaaS completo

Suba o Laravel como backend completo em uma plataforma que rode PHP, filas e banco:

- VPS com Docker;
- Railway;
- Render;
- Fly.io;
- DigitalOcean;
- AWS/GCP/Azure.

Nesse modelo, o Laravel serve:

- API `/api/v1`;
- autenticação Sanctum;
- migrations e seeders;
- filas;
- cache;
- build React em `public/build`.

Comandos principais:

```bash
docker compose up -d --build
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
docker compose exec node npm run build
```

## Caminho Vercel

A Vercel é excelente para o frontend estático React/Vite. Ela não executa este backend Laravel completo com PHP-FPM, filas e migrations.

Por isso, no deploy Vercel deste repositório:

- a Vercel publica somente a SPA React;
- o Laravel precisa estar publicado em outro lugar;
- o frontend deve apontar para a URL pública do backend usando `VITE_API_URL`.

## Configuração na Vercel

Use:

| Campo            | Valor                  |
| ---------------- | ---------------------- |
| Framework Preset | `Vite`                 |
| Install Command  | `npm install`          |
| Build Command    | `npm run build:vercel` |
| Output Directory | `dist`                 |

O arquivo `vercel.json` já define:

- `buildCommand`;
- `outputDirectory`;
- rewrite de SPA para `index.html`.

## Variáveis na Vercel

Configure:

```env
VITE_API_URL=https://sua-api-laravel.com
VITE_APP_NAME=Invitely
```

Se usar Supabase no frontend:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Importante: `VITE_API_URL` deve apontar para a raiz do backend, sem `/api` no final.

Correto:

```env
VITE_API_URL=https://api.invitely.com
```

Errado:

```env
VITE_API_URL=https://api.invitely.com/api
```

## Teste local do build Vercel

```bash
npm run build:vercel
npx vite preview --host 0.0.0.0 --port 4173
```

Arquivos esperados:

```text
dist/
  index.html
  assets/
```

## Por que o 404 acontecia

O build Laravel padrão gera assets em:

```text
public/build
```

Esse diretório é correto para o Laravel, mas não é uma SPA Vite completa para a Vercel.

Para a Vercel abrir uma SPA, ela precisa encontrar:

```text
dist/index.html
```

E para rotas como `/login`, `/admin` e `/events/invitely-launch-night` funcionarem ao recarregar a página, a Vercel precisa redirecionar essas rotas para `index.html`. Isso é feito pelo `vercel.json`.

## Checklist rápido

Antes de fazer deploy:

```bash
npm run typecheck
npm run lint
npm run build:vercel
```

Depois confira:

```bash
dir dist
```

No Linux/macOS:

```bash
ls -la dist
```

Se não existir `dist/index.html`, a Vercel vai continuar retornando `404 NOT_FOUND`.
