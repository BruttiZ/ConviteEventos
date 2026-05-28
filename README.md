# Invitely

Invitely is an open source, SaaS-ready platform for digital invitations, RSVP, QR Code check-in and event landing pages.

It is built as a professional portfolio-grade product: Laravel 12, React, TypeScript, PostgreSQL, Redis, Docker, Clean Architecture boundaries and a premium UI inspired by Linear, Stripe, Vercel and Apple.

Documentation:

- [Português (Brasil)](README.pt-BR.md)
- [English (US)](README.en-US.md)

## Highlights

- Multi-tenant data model prepared for SaaS monetization.
- Public event landing page with countdown, gallery, map area, Spotify playlist and RSVP.
- Admin console foundation for events, guests, analytics, visual customization, templates and exports.
- API-first Laravel backend with Actions, DTOs, repositories, policies, form requests and resources.
- Docker stack with Nginx, PHP 8.4-FPM, PostgreSQL, Redis, Mailpit and MinIO.
- Quality tooling with Pest, PHPStan/Larastan, Laravel Pint and GitHub Actions.

## Stack

- Backend: Laravel 12, PHP 8.4, Sanctum, PostgreSQL, Redis.
- Frontend: React, TypeScript, Vite, TailwindCSS, shadcn/ui conventions, TanStack Query, React Router, Framer Motion.
- Infra: Docker, Docker Compose, Nginx, Mailpit, MinIO.
- Quality: PestPHP, PHPStan/Larastan, Pint, GitHub Actions.

## Quick Start

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app php artisan db:seed
```

Open:

- App: http://localhost:8080
- Demo event: http://localhost:8080/events/invitely-launch-night
- Admin UI shell: http://localhost:8080/admin
- Mailpit: http://localhost:8025
- MinIO Console: http://localhost:9001

Demo admin user:

- Email: `admin@invitely.dev`
- Password: `password`

## Development Commands

```bash
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec app php artisan queue:work
```

For frontend iteration inside a Node-enabled environment:

```bash
npm install
npm run dev
npm run typecheck
```

## Architecture

The backend is organized around feature/domain boundaries:

- `app/Domain`: use cases, DTOs and repository contracts.
- `app/Infrastructure`: Eloquent implementations of those contracts.
- `app/Http`: controllers, form requests and API resources.
- `app/Support/Tenancy`: tenant resolution context.
- `database`: tenant, event, guest, RSVP, check-in and audit schemas.

Controllers stay thin. Business rules live in Actions such as `ConfirmRsvpAction` and `CreateEventAction`. Persistence details stay behind repository contracts so future storage or tenant strategies can evolve without rewriting HTTP behavior.

See [Architecture](docs/architecture/overview.md).

## Product Roadmap

- Auth screens and complete Sanctum session flow.
- Image upload pipeline backed by MinIO.
- Template marketplace and theme builder.
- CSV import/export for guests.
- QR scanner check-in interface.
- Email notification jobs and RSVP reminders.
- Tenant billing hooks and plan limits.
- Public screenshot set for the README.

## License

MIT. See [LICENSE](LICENSE).
