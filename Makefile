.PHONY: check-env up up-for-dev down logs build seed seed-force reset reset-dev

check-env:
	@missing=0; \
	for var in MINI_HELP_DESK_PORT_PREFIX MINI_HELP_DESK_DB_NAME MINI_HELP_DESK_DB_USER MINI_HELP_DESK_DB_PASSWORD MINI_HELP_DESK_DB_HOST LLM_API_KEY; do \
		val=$$(grep -E "^$$var=" .env 2>/dev/null | cut -d= -f2-); \
		if [ -z "$$val" ]; then \
			echo "ERROR: $$var is not set. See .env.example."; \
			missing=1; \
		fi; \
	done; \
	if [ "$$missing" = "1" ]; then exit 1; fi

up: check-env
	docker compose up --build

up-for-dev: check-env
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

logs:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

build:
	docker compose build

seed:
	docker compose exec backend python -m app.seed

seed-force:
	docker compose exec backend python -m app.seed --force

reset:
	docker compose down -v

reset-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
