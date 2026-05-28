# Invitely

[![CI](https://github.com/BruttiZ/ConviteEventos/actions/workflows/ci.yml/badge.svg)](https://github.com/BruttiZ/ConviteEventos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.4-777bb4.svg)](composer.json)
[![Laravel](https://img.shields.io/badge/Laravel-12-ff2d20.svg)](composer.json)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](package.json)

Invitely is an open source, SaaS-ready platform for digital invitations, RSVP, event landing pages, QR Code check-in, and event operations.

It is built with Laravel, React, TypeScript, PostgreSQL, Redis, TailwindCSS, and Docker. The goal is to feel like a polished startup product while remaining simple enough for contributors to run locally in minutes.

> Documentation is also available in [Portuguese (Brazil)](README.pt-BR.md) and [English (US)](README.en-US.md).

## Preview

Screenshots and a short demo GIF will live in `docs/assets` as the UI stabilizes. The current demo can be opened locally after the Docker setup:

- Public event: `http://localhost:8080/events/invitely-launch-night`
- Login / register: `http://localhost:8080/login`
- Interactive dashboard: `http://localhost:8080/admin`

## Highlights

- Public event pages with countdown, gallery, map area, Spotify playlist, QR Code, and RSVP.
- Login and register screens with demo roles for event owner, guest, and platform admin.
- Interactive dashboard demo with role-aware navigation, check-in simulation, templates, guests, and platform view.
- Laravel API structured around Actions, DTOs, repositories, form requests, policies, and resources.
- Multi-tenant data model prepared for SaaS growth.
- Docker stack with Nginx, PHP 8.4-FPM, PostgreSQL, Redis, Mailpit, MinIO, and Vite.
- Quality gate with Pest, PHPStan/Larastan, Laravel Pint, TypeScript, and GitHub Actions.
- Contributor-focused docs, conventional commits, and security policy.

## Stack

| Area        | Technology                                                |
| ----------- | --------------------------------------------------------- |
| Backend     | Laravel 12, PHP 8.4, Sanctum                              |
| Frontend    | React 19, TypeScript, Vite, TailwindCSS, Framer Motion    |
| Data        | PostgreSQL, Redis                                         |
| Local infra | Docker, Nginx, Mailpit, MinIO                             |
| Quality     | PestPHP, PHPStan/Larastan, Laravel Pint, ESLint, Prettier |

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```

Open:

- App: `http://localhost:8080`
- Demo event: `http://localhost:8080/events/invitely-launch-night`
- Login / register: `http://localhost:8080/login`
- Dashboard: `http://localhost:8080/admin`
- Mailpit: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

Demo users:

| Profile        | Email                | Password   | Purpose                                                |
| -------------- | -------------------- | ---------- | ------------------------------------------------------ |
| Event owner    | `host@invitely.dev`  | `password` | Manage events, guests, themes, RSVP, and check-in.     |
| Guest          | `guest@invitely.dev` | `password` | Open the invitation, RSVP, and simulate QR Code usage. |
| Platform admin | `admin@invitely.dev` | `password` | Inspect platform-level operation and tenants.          |

## Development Commands

```bash
docker compose ps
docker compose logs -f app
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec node npm run typecheck
docker compose exec node npm run build
```

## Architecture

The backend is organized around feature and domain boundaries:

- `app/Domain`: use cases, DTOs, and repository contracts.
- `app/Infrastructure`: Eloquent implementations of domain contracts.
- `app/Http`: controllers, middleware, form requests, and API resources.
- `app/Support/Tenancy`: tenant resolution context.
- `database`: tenant, event, guest, RSVP, check-in, and operational schemas.
- `resources/js/app/features`: frontend features grouped by product area.

Controllers stay thin. Business behavior lives in Actions such as `ConfirmRsvpAction` and `CreateEventAction`. Persistence details stay behind repository contracts so future storage and tenancy strategies can evolve without rewriting HTTP behavior.

See [Architecture Overview](docs/architecture/overview.md).

## Project Structure

```text
app/
  Domain/                 Business actions, DTOs, and contracts
  Infrastructure/         Framework-specific implementations
  Http/                   API layer, requests, resources, middleware
resources/
  js/app/features/        React features by product area
docker/
  nginx/                  Web server configuration
docs/
  architecture/           Technical documentation
tests/
  Feature/                Product behavior tests
```

## Current Demo Flow

1. Open `http://localhost:8080/login`.
2. Choose one of the three demo profiles.
3. Sign in with password `password`.
4. Explore the dashboard tabs and actions.
5. Open the public event from the dashboard or directly at `/events/invitely-launch-night`.

In local Docker, the React app is served from the generated Vite build through Nginx. The service worker is disabled locally to avoid stale JavaScript while developing.

## Roadmap

- Event and guest CRUD in the admin UI.
- CSV import/export for guests.
- Image upload pipeline backed by MinIO.
- QR scanner check-in interface.
- Theme builder and template marketplace.
- Email notification jobs and RSVP reminders.
- Public screenshots and demo GIF.
- OpenAPI/Swagger documentation.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md) before opening issues or pull requests.

This repository uses Conventional Commits. Commit messages should be written in Brazilian Portuguese, for example:

```text
feat: adiciona fluxo de RSVP
fix: corrige responsividade do painel admin
docs: melhora guia de instalação Docker
```

## License

Invitely is open source software licensed under the [MIT license](LICENSE).
