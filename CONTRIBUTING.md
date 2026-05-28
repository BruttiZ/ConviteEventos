# Contributing

Thanks for helping improve Invitely.

## Local Setup

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app php artisan db:seed
```

## Quality Gate

Before opening a pull request, run:

```bash
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint
docker compose exec app vendor/bin/phpstan analyse
```

## Standards

- Keep controllers thin.
- Put business rules in Actions.
- Use Form Requests for validation.
- Protect tenant-owned resources with policies.
- Prefer typed DTOs over passing large request arrays.
- Add tests for product behavior, not framework internals.

## Pull Requests

Include:

- What changed.
- Why it changed.
- Screenshots for UI changes.
- Test coverage or a note explaining the residual risk.
