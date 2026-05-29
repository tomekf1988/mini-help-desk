# PR: feat: milestone 4 — frontend list and detail

## Summary

Implements the full React + TypeScript frontend for the mini-help-desk app. Delivers a Backlog list page with live filtering, an inline ticket creation form, a two-column ticket detail page with inline editing, and a standalone create page — all styled with inline styles matching the reference design.

## Changes

### Backend
- No backend changes in this milestone.

### Frontend
- `src/index.css` — global CSS reset, system font, `#F4F5F7` background, `@keyframes spin`
- `src/types.ts` — `Ticket`, `TicketStatus`, `TicketPriority` TypeScript types
- `src/api/tickets.ts` — `getAllTickets`, `getTicketById`, `createTicket`, `updateTicket`
- `src/components/Layout.tsx` — full-height wrapper
- `src/components/Spinner.tsx` — CSS-animated loading spinner (keyframes in index.css)
- `src/components/StatusBadge.tsx` — color-coded status pill (open/in_progress/closed)
- `src/components/PriorityBadge.tsx` — color-coded priority pill (low/medium/high)
- `src/components/TicketCard.tsx` — clickable list row with status icon, badges, date, hover state
- `src/components/TicketForm.tsx` — create form with focus rings and error feedback
- `src/pages/TicketListPage.tsx` — sticky glass header, segmented pill filters, embedded create form, sorted ticket list
- `src/pages/TicketDetailPage.tsx` — two-column layout, editable sidebar, status cycle on click, discard changes, AI summary placeholder
- `src/pages/TicketCreatePage.tsx` — standalone create page wrapping `TicketForm`
- `src/utils/dates.ts` — shared date helpers (`parseDueDate`, `formatDueDate`, `isOverdue`, `isDueThisWeek`)
- `src/App.tsx` — `ErrorBoundary` + routes: `/`, `/tickets/new`, `/tickets/:id`
- `src/main.tsx` — imports `index.css`
- `src/test/setup.ts` — `@testing-library/jest-dom`
- `src/test/TicketListPage.test.tsx` — 3 tests: renders list, empty state, form POST
- `src/test/TicketCreatePage.test.tsx` — 1 test: form submit calls POST

### Infrastructure
- `docker-compose.yml` — added `BACKEND_URL: http://backend:8000` to frontend service environment
- `frontend/vite.config.ts` — added `/api` proxy (`process.env.BACKEND_URL ?? 'http://localhost:8000'`); added `setupFiles` for tests

## Acceptance criteria

- [x] `GET /` — TicketListPage renders all tickets with status badges
- [x] `GET /tickets/new` — TicketCreatePage form renders (title, description, priority, status, estimated time, due date)
- [x] `GET /tickets/:id` — TicketDetailPage shows full detail with inline status editor
- [x] `frontend/src/api/tickets.ts` — all four functions implemented
- [x] `frontend/src/components/StatusBadge.tsx` — color-coded pill
- [x] `frontend/src/App.tsx` — router configured with all three routes
- [x] `frontend/src/test/TicketListPage.test.tsx` — passes (3 tests)
- [x] `frontend/src/test/TicketCreatePage.test.tsx` — passes (1 test)

## Technical decisions

- **Title is read-only on detail page** — `PATCH /api/tickets/:id` does not accept `title` (milestone 3 schema), so the field is displayed as static text rather than an editable input.
- **`PriorityBadge` in its own file** — originally lived in `TicketCard.tsx` causing a confusing import in `TicketDetailPage`; extracted to `src/components/PriorityBadge.tsx`.
- **Shared date utils** — `parseDueDate`, `isOverdue`, `formatDueDate`, `isDueThisWeek` extracted to `src/utils/dates.ts`; were previously duplicated across three files.
- **Vite proxy via env var** — `http://backend:8000` lives in `docker-compose.yml` as `BACKEND_URL`; `vite.config.ts` reads `process.env.BACKEND_URL` with a localhost fallback for running outside Docker.
- **`@keyframes spin` in `index.css`** — moved from an inline `<style>` tag in `Spinner.tsx` that re-injected on every mount.
- **`useCallback` removed** — plain `async function` + `void loadTickets()` inside `useEffect` is simpler and equally correct when deps are stable.
- **Discard changes button** — shown when `isDirty` is true on detail page, giving users a recovery path after a failed save.

## Testing

```bash
docker compose exec frontend npm test -- --run   # 4/4 pass
docker compose exec frontend npm run build       # clean, 45 modules, 0 TS errors
```

Manual:
- `http://localhost:35173` — Backlog loads seeded tickets, filters work, create form toggles
- `/tickets/new` — standalone create page
- Click any ticket → detail page, edit fields, save/discard

## Remaining work

- Milestone 5 — LLM integration and SSE streaming (`GET /api/tickets/{id}/summary/stream`, `useStreamingSummary` hook, streaming UI in `TicketDetailPage`)
- Milestone 6 — Finalization and delivery (seed data, README, one-command startup verification)
