#!/usr/bin/env bash
set -e

if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if ! grep -Eq '^APP_KEY=.+$' .env 2>/dev/null; then
    php artisan key:generate --force --no-interaction || true
fi

php artisan optimize:clear --no-interaction || true
php artisan storage:link --force --no-interaction || true

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force --no-interaction || true
fi

if [ "${RUN_SEEDERS:-true}" = "true" ]; then
    php artisan db:seed --force --no-interaction || true
fi

exec "$@"
