# Invitely

Invitely is an open source platform for digital invitations, RSVP, QR Code check-in, and public event pages. The project uses Laravel 12 for the backend, React with TypeScript for the frontend, and a Docker environment with Nginx, PHP-FPM, PostgreSQL, Redis, Mailpit, and MinIO.

## How the project works

Nginx receives requests at `http://localhost:8080` and forwards PHP requests to the `app` container, which runs Laravel on PHP 8.4-FPM. Laravel serves the React SPA through the Blade view in `resources/views/app.blade.php`; React then handles the public and admin routes in the browser.

API routes live in `routes/api.php` under the `/api/v1` prefix. The public event page fetches event data from `/api/v1/events/{slug}` and submits RSVP data to `/api/v1/events/{slug}/rsvp`. The admin page at `/admin` is an initial UI shell; admin API routes exist, but require Sanctum authentication.

Data is stored in PostgreSQL. Redis is used for cache, sessions, and queues. The `queue` container runs `php artisan queue:work`. Mailpit receives local development email. MinIO is available as an S3-compatible storage service.

## Docker services

| Service    | Purpose                     | Default URL/port                                      |
| ---------- | --------------------------- | ----------------------------------------------------- |
| `nginx`    | Application web server      | `http://localhost:8080`                               |
| `app`      | Laravel / PHP-FPM           | internal, port `9000`                                 |
| `queue`    | Laravel queue worker        | internal                                              |
| `postgres` | Database                    | `localhost:5432`                                      |
| `redis`    | Cache, sessions, and queues | `localhost:6379`                                      |
| `mailpit`  | Local email inbox           | `http://localhost:8025`                               |
| `minio`    | Local S3-compatible storage | API `localhost:9000`, console `http://localhost:9001` |

## Requirements

- Docker Desktop or Docker Engine with Docker Compose.
- Free ports: `8080`, `5432`, `6379`, `8025`, `9000`, and `9001`.
- Internet access during the first build to download images and dependencies.

If a port is already in use, change the values in `.env`, for example `APP_PORT=8081` or `POSTGRES_PORT=5433`.

## Run with Docker

1. Create the environment file:

```bash
cp .env.example .env
```

On PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

2. Start the containers:

```bash
docker compose up -d --build
```

3. Seed the database with demo data:

```bash
docker compose exec app php artisan db:seed --force
```

4. Open the application:

- App: `http://localhost:8080`
- Demo event: `http://localhost:8080/events/invitely-launch-night`
- Admin UI: `http://localhost:8080/admin`
- Mailpit: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

Demo user:

- Email: `admin@invitely.dev`
- Password: `password`

## Useful commands

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f queue
docker compose exec app php artisan route:list
docker compose exec app php artisan test
docker compose exec app vendor/bin/pint --test
docker compose exec app vendor/bin/phpstan analyse --memory-limit=512M
docker compose exec node npm run lint
docker compose exec node npm run format:check
docker compose exec node npm run typecheck
docker compose exec node npm run build
```

To recreate the database from scratch, deleting local data:

```bash
docker compose exec app php artisan migrate:fresh --seed
```

To stop the environment:

```bash
docker compose down
```

To stop everything and remove volumes, including the database, Redis, MinIO, `vendor`, and generated build files:

```bash
docker compose down -v
```

## Frontend development outside Docker

Docker already builds production assets during the image build. To work on the frontend with hot reload outside the container, use local Node.js:

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm run typecheck
```

## Commit standard

The project uses Conventional Commits written in Brazilian Portuguese. Husky hooks run `lint-staged` before each commit and `commitlint` against the commit message.

Valid examples:

```text
feat: adiciona fluxo de RSVP
fix: corrige responsividade do painel admin
docs: melhora guia Docker
```

## Troubleshooting

If `php artisan test`, `vendor/bin/pint`, or `vendor/bin/phpstan` do not exist after a Dockerfile update, the `vendor-data` volume was probably created by an older image version. Update the volume without deleting the database:

```bash
docker compose exec app composer install --no-interaction --prefer-dist --optimize-autoloader
```

To recreate the whole local environment from scratch, run `docker compose down -v` and start it again. That command deletes local volumes.

## Docker environment validation

This walkthrough was validated with Docker on 2026-05-28 using:

```bash
docker compose up -d --build
docker compose exec app php artisan db:seed --force
```

The following URLs were also checked: `http://localhost:8080`, `http://localhost:8080/events/invitely-launch-night`, `http://localhost:8080/admin`, `http://localhost:8025`, `http://localhost:9001`, and the API endpoint `http://localhost:8080/api/v1/events/invitely-launch-night`.

Fixes made to keep the environment reproducible:

- The entrypoint now generates `APP_KEY` only when the `.env` file does not already have one.
- The local Docker image installs Composer development dependencies so tests, Pint, and PHPStan can run inside the container.
- `.env.example` no longer has conflicting duplicate values for `AWS_USE_PATH_STYLE_ENDPOINT`.

With Docker available, the required ports free, and internet access for the first build, someone following the steps above should be able to run the project in Docker.
