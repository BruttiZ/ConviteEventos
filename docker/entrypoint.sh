#!/usr/bin/env bash
set -e

if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
    echo "Installing PHP dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if ! grep -Eq '^APP_KEY=.+$' .env 2>/dev/null; then
    echo "Generating Laravel application key..."
    php artisan key:generate --force --no-interaction || true
fi

echo "Preparing Laravel runtime..."
mkdir -p storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rwX storage bootstrap/cache 2>/dev/null || true
php artisan optimize:clear --no-interaction || true
php artisan storage:link --force --no-interaction || true

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force --no-interaction || true
fi

if [ "${RUN_SEEDERS:-true}" = "true" ]; then
    echo "Seeding demo data..."
    php artisan db:seed --force --no-interaction || true
fi

exec "$@"
