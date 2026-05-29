# Milestone 2 Review

## Verdict: Shipped (after fixes)

## Issues found and fixed

### Fixed: `env.py` read `os.environ` directly
`alembic/env.py` called `os.environ["DATABASE_URL"]` instead of using `settings.database_url`.
Fixed to use `app.config.settings` per project convention.

### Fixed: Test state leakage between tests
`db_session` fixture was `scope="module"` sharing one session across all tests. Tests left rows
in the DB that caused later tests to get false positives (e.g., `test_all_statuses_and_priorities`
matched rows inserted by earlier tests). Fixed with:
- `scope="session"` engine (DB setup once per session)
- `scope="function"` connection + per-test transaction rollback
- Assertions use inserted ticket IDs, not status/priority filters

## Deferred (acceptable for this milestone)

- **`onupdate` is ORM-level only**: `updated_at` won't auto-update for bulk `session.execute(update(...))`. Documented in milestone doc. Milestone 3+ service layer should use ORM-style updates.
- **Migration enum `checkfirst=True`**: Downgrade drops enums with `checkfirst=True`; if enums were created outside this migration, they'll be silently left behind. Acceptable until a second migration exists.
- **`seed.py` idempotency**: Checks `Ticket.first()` — skips if any ticket exists, not if seed data specifically exists. Acceptable for development use.
