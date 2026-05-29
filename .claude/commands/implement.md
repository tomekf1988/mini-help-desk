Read .claude/CLAUDE.md first.

Implement milestone: $ARGUMENTS

## Task tracking

At the start:
1. Read the milestone spec from docs/milestones/ (match by name or number)
2. Extract the scope items and acceptance criteria as tasks
3. Write them all to tasks/todo.md

During implementation:
- Move each task to tasks/in_progress.md when you start it
- Move each task to tasks/done.md when it is complete
- Never leave tasks/in_progress.md with stale entries — complete or revert them

## Agents

- Use python-dev agent for all backend work (models, migrations, repos, API, tests)
- Use react-dev agent for all frontend work (components, pages, hooks, streaming UI)

## Docker commands

Always use Docker — never run Python, pytest, or alembic directly on the host:
- `docker compose exec backend pytest` — run tests
- `docker compose exec backend alembic upgrade head` — run migrations manually
- `docker compose exec <service> <command>` — any other command
- `make up`, `make down`, `make logs` — for lifecycle

Tests must always run inside the container where the correct Python version,
virtualenv, and database connection are available.

## After implementation

1. Run `make down`
2. Run `make up --detach` (or `docker compose up --build -d`) in background
3. Wait 10 seconds, then run `docker compose logs --tail=50` to check for errors
4. If no ERROR/FATAL lines appear → startup OK; proceed
5. If errors found → fix and retry
3. Summarize completed work, technical decisions, and any tradeoffs
4. List remaining milestones

## Requirements

- Keep architecture simple, avoid overengineering
- Prefer readability over abstractions
- Add automated tests where reasonable
- Do not introduce unnecessary libraries or complex patterns
