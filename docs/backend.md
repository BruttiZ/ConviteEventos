# Backend

O backend usa Laravel com uma organizacao inspirada em Clean Architecture e DDD pragmatico.

## Camadas

- `app/Http`: entrada HTTP, validacao, recursos e middleware.
- `app/Domain`: actions, DTOs e contratos.
- `app/Infrastructure`: implementacoes acopladas ao framework ou banco.
- `app/Models`: modelos Eloquent.
- `app/Support`: infraestrutura transversal.

## Autenticacao e papeis

As rotas de autenticacao ficam em `/api/v1/auth`.

- `POST /api/v1/auth/login`: emite token Sanctum.
- `POST /api/v1/auth/register`: cria usuario demo e emite token Sanctum.
- `GET /api/v1/admin/me`: retorna o usuario autenticado.
- `POST /api/v1/admin/logout`: revoga o token atual.

Papeis usados na demo:

- `owner`: dono do evento, gerencia eventos, convidados e RSVP.
- `guest`: convidado, acessa convite e QR Code.
- `platform_admin`: administra a plataforma e tenants.

As abilities do token sao emitidas conforme o papel:

- `tenant:owner`
- `event:guest`
- `platform:admin`

## Regras

- Controllers orquestram, mas nao concentram regra de negocio.
- Actions executam casos de uso.
- DTOs carregam dados validados para a camada de dominio.
- Repositories escondem persistencia.
- Policies controlam autorizacao.
- Form Requests validam entrada HTTP.

## Qualidade

```bash
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
```
