.PHONY: up fresh down logs test analyse lint typecheck build quality

up:
	docker compose up -d --build

fresh:
	docker compose down -v
	docker compose up -d --build
	docker compose exec -T app php artisan migrate:fresh --seed

down:
	docker compose down

logs:
	docker compose logs -f app nginx node queue

test:
	docker compose exec -T app php artisan test

analyse:
	docker compose exec -T app vendor/bin/phpstan analyse --memory-limit=512M

lint:
	docker compose exec -T app vendor/bin/pint --test
	docker compose exec -T node npm run lint
	docker compose exec -T node npm run format:check

typecheck:
	docker compose exec -T node npm run typecheck

build:
	docker compose exec -T node npm run build

quality: lint analyse typecheck test build
