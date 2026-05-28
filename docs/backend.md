# Backend

O backend usa Laravel com uma organização inspirada em Clean Architecture e DDD pragmático.

## Camadas

- `app/Http`: entrada HTTP, validação, recursos e middleware.
- `app/Domain`: ações, DTOs e contratos.
- `app/Infrastructure`: implementações acopladas ao framework ou banco.
- `app/Models`: modelos Eloquent.
- `app/Support`: infraestrutura transversal.

## Regras

- Controllers orquestram, mas não concentram regra de negócio.
- Actions executam casos de uso.
- DTOs carregam dados validados para a camada de domínio.
- Repositories escondem persistência.
- Policies controlam autorização.
- Form Requests validam entrada HTTP.

## Qualidade

```bash
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
```
