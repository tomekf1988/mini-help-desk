# Review: Milestone 7 — Docker Compose Split

## Critical issues

### 1. `make up` silently connects to the wrong host when `MINI_HELP_DESK_DB_HOST` is not set

`docker-compose.yml` builds `DATABASE_URL` with `${MINI_HELP_DESK_DB_HOST}` and no default fallback:

```
DATABASE_URL: postgresql://...@${MINI_HELP_DESK_DB_HOST}:${MINI_HELP_DESK_DB_PORT:-5432}/...
```

If a developer copies `.env.example` as-is, `MINI_HELP_DESK_DB_HOST=db` is the default value, which will silently produce a URL pointing at `db` — a hostname that does not exist when running `make up` (no local `db` service). The backend will start, fail to connect, and log a confusing error rather than refusing to start with a clear message.

`check-env` does not validate `MINI_HELP_DESK_DB_HOST`, so the misconfiguration is not caught at startup.

**Fix**: Add `MINI_HELP_DESK_DB_HOST` to the `check-env` required list, or add a `:-` fallback that makes the intent obvious (e.g. `${MINI_HELP_DESK_DB_HOST:?MINI_HELP_DESK_DB_HOST must be set}`). This is a real operational hazard for anyone using `make up` against an external DB.

---

### 2. `make down` and `make logs` operate only on the base compose file

`down` and `logs` do not accept a `-f` flag variant. A developer who started the stack with `make up-for-dev` and then runs `make down` will only stop the `backend` and `frontend` services. The `db` container defined in `docker-compose.dev.yml` will remain running.

The same applies to `make logs` — it will not show `db` logs after `make up-for-dev`.

**Fix**: Either add `down-dev` / `logs-dev` targets that pass both `-f` flags, or make `down` and `logs` always include the dev file (it is safe — if the `db` service is not running, compose simply skips it).

---

## Suggestions

### 3. `force_seed` uses the legacy `Query.delete()` API

`db.query(Ticket).delete()` is the SQLAlchemy 1.x ORM-level delete. In SQLAlchemy 2.x the idiomatic form is:

```python
from sqlalchemy import delete
db.execute(delete(Ticket))
db.commit()
```

Both work today because SA 2.x still supports the legacy interface, but the rest of the codebase uses the 2.x `select(...)` style (see `seed_if_empty`). The inconsistency is minor but worth aligning.

---

### 4. `reset` vs `reset-dev` naming could cause accidental volume loss

`make reset` (base file only) removes the `db_data` volume declared in `docker-compose.dev.yml` — except it cannot, because the volume is not declared in `docker-compose.yml`. This means `make reset` will do nothing to the volume even if someone ran `make up-for-dev` first.

The behavior is actually safe, but the name `reset` implies a full teardown. A short comment in the Makefile would prevent confusion.

---

### 5. `.env.example` default for `MINI_HELP_DESK_DB_HOST` is `db`

The default `MINI_HELP_DESK_DB_HOST=db` makes sense for `make up-for-dev` but is wrong for `make up` against an external DB. A developer who copies the file without reading the comment will get the silent connection failure described in issue 1. The comment is there, but the default value itself is misleading for the `make up` workflow.

Consider leaving `MINI_HELP_DESK_DB_HOST=` (empty) in `.env.example` so it is obviously incomplete and must be filled in.

---

### 6. `seed-force` has no guard against running against an empty table

`force_seed` deletes all rows then re-inserts. Running it against an empty table is harmless — `DELETE` on zero rows succeeds, then the seeds are inserted. This is correct behavior, no action needed.

---

## Verdict

PASS WITH FIXES

Issue 1 (silent connection failure when `MINI_HELP_DESK_DB_HOST` is not set) and issue 2 (`make down` leaving the `db` container running after `make up-for-dev`) are real operational problems that will confuse the first developer who tries to use `make up` against an external database. Both are small fixes. The core compose split logic, the overlay merge, and the seed changes are all correct.
