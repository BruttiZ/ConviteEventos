param(
    [switch]$Fresh
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
}

if ($Fresh) {
    docker compose down -v
}

docker compose up -d --build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan db:seed --force

Write-Host ""
Write-Host "Invitely is ready:"
Write-Host "  App:        http://localhost:8080"
Write-Host "  Demo event: http://localhost:8080/events/invitely-launch-night"
Write-Host "  Admin:      http://localhost:8080/admin"
Write-Host "  Mailpit:    http://localhost:8025"
