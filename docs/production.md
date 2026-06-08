# Deploy em producao

Este projeto e Laravel + React/Vite. Isso significa que existem dois caminhos de producao.

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
- autenticacao Sanctum;
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

A Vercel e excelente para o frontend estatico React/Vite. Ela nao executa este backend Laravel completo com PHP-FPM, filas e migrations.

Por isso, no deploy Vercel deste repositorio:

- a Vercel publica somente a SPA React;
- o Laravel precisa estar publicado em outro lugar;
- o frontend deve apontar para a URL publica do backend usando `VITE_API_URL`, quando a API Laravel estiver publicada;
- o login/cadastro de portfolio usa Supabase Auth com variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Configuracao na Vercel

Use:

| Campo            | Valor                  |
| ---------------- | ---------------------- |
| Framework Preset | `Vite`                 |
| Install Command  | `npm install`          |
| Build Command    | `npm run build:vercel` |
| Output Directory | `dist`                 |

O arquivo `vercel.json` ja define:

- `buildCommand`;
- `outputDirectory`;
- rewrite de SPA para `index.html`.

## Variaveis na Vercel

Configure:

```env
VITE_API_URL=https://sua-api-laravel.com
VITE_APP_NAME=Invitely
VITE_SITE_URL=https://seu-projeto.vercel.app
NEXT_PUBLIC_SITE_URL=https://seu-projeto.vercel.app
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publicavel
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publicavel
```

`VITE_API_URL` e necessario quando a SPA publicada na Vercel precisa consumir uma API Laravel publicada separadamente.

`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sao necessarios para login e cadastro reais com Supabase Auth. Use a chave publica/publishable do Supabase, nunca a `service_role`.

`VITE_SITE_URL` e `NEXT_PUBLIC_SITE_URL` documentam a URL publica usada nos links de e-mail. No app Vite, `VITE_SITE_URL` e a variavel lida pelo browser. `NEXT_PUBLIC_SITE_URL` fica disponivel para compatibilidade com uma futura migracao Next.js.

`SUPABASE_URL` e `SUPABASE_ANON_KEY` sao usadas pelo backend Laravel quando ele precisa chamar a API publica do Supabase, por exemplo para reenviar confirmacao de cadastro.

## Supabase Auth

No Supabase, habilite autenticacao por e-mail/senha em `Authentication > Providers > Email`.

Configure tambem `Authentication > URL Configuration`:

| Campo         | Valor recomendado                                                   |
| ------------- | ------------------------------------------------------------------- |
| Site URL      | URL publica da Vercel, por exemplo `https://seu-projeto.vercel.app` |
| Redirect URLs | URL publica da Vercel e URLs locais usadas no desenvolvimento       |

Exemplo de Redirect URLs:

```text
https://seu-projeto.vercel.app/**
http://localhost:8080/**
http://localhost:4173/**
```

O cadastro envia `emailRedirectTo` usando a origem atual do app. Em producao, isso faz o e-mail voltar para a URL da Vercel. Em desenvolvimento, volta para a porta local que estiver aberta.

Se o navegador mostrar `otp_expired`, o link de confirmacao expirou ou ja foi usado. Gere um novo cadastro, solicite um novo e-mail de confirmacao no Supabase ou desative temporariamente a confirmacao de e-mail apenas para testes locais.

Se houver templates de e-mail customizados no Supabase, revise `Authentication > Email Templates`. Use variaveis oficiais do Supabase para manter o link de confirmacao gerado pela plataforma, e evite inserir `localhost` manualmente no template.

## RSVP publico com codigo

O RSVP publico sem senha usa a tabela `public_rsvp_otps`. No Laravel, rode as migrations normalmente:

```bash
docker compose exec app php artisan migrate
```

Se o banco estiver hospedado no Supabase e voce preferir criar a tabela manualmente, use o script:

```text
docs/sql/public_rsvp_otps.sql
```

Recomendacao de seguranca:

- mantenha RLS habilitado na tabela de OTP;
- nao crie policy anon/authenticated para leitura ou escrita direta;
- gere e valide codigos apenas pela API confiavel;
- o codigo deve expirar em 10 minutos e e salvo apenas como hash.

O cadastro publico salva no metadata:

- `name`: nome informado no formulario;
- `role`: `owner` ou `guest`.

Para testar administracao da plataforma, edite o metadata do usuario no Supabase para:

```json
{
    "role": "platform_admin"
}
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

O build Laravel padrao gera assets em:

```text
public/build
```

Esse diretorio e correto para o Laravel, mas nao e uma SPA Vite completa para a Vercel.

Para a Vercel abrir uma SPA, ela precisa encontrar:

```text
dist/index.html
```

E para rotas como `/login`, `/admin` e `/events/invitely-launch-night` funcionarem ao recarregar a pagina, a Vercel precisa redirecionar essas rotas para `index.html`. Isso e feito pelo `vercel.json`.

## Checklist rapido

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

Se nao existir `dist/index.html`, a Vercel vai continuar retornando `404 NOT_FOUND`.
