# Mini Help Desk

A minimal help desk application with AI-powered ticket summaries.

## Setup

1. Clone the repo
2. Copy the env template and fill in values:
   ```bash
   cp .env.example .env
   ```
3. Start all services:
   ```bash
   make up
   ```

## URLs (with default `MINI_HELP_DESK_PORT_PREFIX=1`)

- Backend API: http://localhost:18000
- Frontend: http://localhost:15173
- Health check: http://localhost:18000/api/health

## Commands

```bash
make up       # build and start all services
make down     # stop all services
make logs     # tail logs
make build    # rebuild images
make seed     # seed database with sample data
make reset    # stop and delete all volumes
```

## Running tests

```bash
docker compose exec backend pytest tests/
```
