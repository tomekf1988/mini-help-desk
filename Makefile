.PHONY: check-env up down logs build seed reset

check-env:
	@missing=0; \
	for var in MINI_HELP_DESK_PORT_PREFIX MINI_HELP_DESK_DB_NAME MINI_HELP_DESK_DB_USER MINI_HELP_DESK_DB_PASSWORD LLM_API_KEY; do \
		val=$$(grep -E "^$$var=" .env 2>/dev/null | cut -d= -f2-); \
		if [ -z "$$val" ]; then \
			echo "ERROR: $$var is not set. See .env.example."; \
			missing=1; \
		fi; \
	done; \
	if [ "$$missing" = "1" ]; then exit 1; fi

up: check-env
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

seed:
	docker compose exec backend python -c "from app.database import SessionLocal; from app.seed import seed_if_empty; db = SessionLocal(); seed_if_empty(db); db.close()"

reset:
	docker compose down -v
