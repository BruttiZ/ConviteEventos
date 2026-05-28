#!/usr/bin/env bash
set -e

if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
fi

if ! grep -Eq '^APP_KEY=.+$' .env 2>/dev/null; then
    php artisan key:generate --force --no-interaction || true
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force --no-interaction || true
fi

exec "$@"
