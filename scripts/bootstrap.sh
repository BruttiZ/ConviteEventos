#!/usr/bin/env sh
set -eu

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

if [ "${1:-}" = "--fresh" ]; then
    docker compose down -v
fi

docker compose up -d --build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan db:seed --force

echo ""
echo "Invitely is ready:"
echo "  App:        http://localhost:8080"
echo "  Demo event: http://localhost:8080/events/invitely-launch-night"
echo "  Admin:      http://localhost:8080/admin"
echo "  Mailpit:    http://localhost:8025"
