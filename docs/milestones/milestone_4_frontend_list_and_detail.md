# Milestone 4 — Frontend List & Detail

## Goal

Working UI: list all tickets, view one ticket, create a ticket.

## Pages & components

| Route | Component | Description |
|---|---|---|
| `/` | `TicketListPage` | Table/list of all tickets with status badges |
| `/tickets/new` | `TicketCreatePage` | Form: title, description, priority |
| `/tickets/:id` | `TicketDetailPage` | Full detail view; status update dropdown |

## Deliverables

| File | Description |
|---|---|
| `frontend/src/api/tickets.ts` | `fetchTickets`, `fetchTicket`, `createTicket`, `updateTicket` |
| `frontend/src/pages/TicketListPage.tsx` | List view |
| `frontend/src/pages/TicketDetailPage.tsx` | Detail + inline status editor |
| `frontend/src/pages/TicketCreatePage.tsx` | Create form |
| `frontend/src/components/StatusBadge.tsx` | Color-coded status pill |
| `frontend/src/App.tsx` | Router configuration |

## Style rules

- Inline styles only (no CSS modules, no Tailwind, no external CSS files)
- No UI library dependencies

## Tests

- `frontend/src/pages/TicketListPage.test.tsx` — renders tickets, shows empty state
- `frontend/src/pages/TicketCreatePage.test.tsx` — form submit calls API

## Additional files built

| File | Description |
|---|---|
| `frontend/src/index.css` | Global CSS reset, system font, #F4F5F7 background |
| `frontend/src/types.ts` | Ticket, TicketStatus, TicketPriority TypeScript types |
| `frontend/src/components/Layout.tsx` | Full-height wrapper div |
| `frontend/src/components/Spinner.tsx` | CSS-animated loading spinner |
| `frontend/src/components/TicketCard.tsx` | List row — also exports PriorityBadge, PRIORITY_ICON_COLOR |
| `frontend/src/components/TicketForm.tsx` | Inline create form — used by both TicketListPage and TicketCreatePage |

## Architectural decisions

- **Title is read-only on detail page**: `PATCH /api/tickets/:id` (milestone 3) does not accept `title`, so the title field on `TicketDetailPage` is displayed as text rather than an editable input.
- **Inline create form on list page**: `TicketListPage` embeds `TicketForm` in a collapsible panel; `/tickets/new` wraps the same `TicketForm` as a standalone page.
- **Status cycle on click**: `TicketDetailPage` uses `cycleStatus()` (open → in_progress → closed) on badge click rather than a dropdown, matching the reference design.
- **AI Summary placeholder**: `TicketDetailPage` sidebar shows an "AI Summary" section with a disabled "Available in next milestone" button; full SSE streaming is milestone 5.
- **Style system**: 100% inline styles, color palette #172B4D / #0052CC / #F4F5F7 / #DFE1E6 / #6B778C / #DE350B — matches the claude-skill-lab reference frontend exactly.
- **Filter pill rows**: Status, Priority, Due date filters rendered as segmented pill controls, not native selects.
- **Due date parsing**: Dates parsed as local (not UTC) to avoid day-offset issues: `new Date(year, month-1, day)`.

## Test files

| File | Tests |
|---|---|
| `frontend/src/test/setup.ts` | @testing-library/jest-dom import |
| `frontend/src/test/TicketListPage.test.tsx` | 3 tests: renders tickets, empty state, form submit calls POST |
| `frontend/src/test/TicketCreatePage.test.tsx` | 1 test: form submit calls POST /api/tickets |

`vite.config.ts` updated with `setupFiles: ['./src/test/setup.ts']`.

## Verification

```bash
docker compose exec frontend npm test -- --run   # 4/4 pass
docker compose exec frontend npm run build       # clean, 43 modules
# open http://localhost:5173             # Backlog list with seeded tickets
# navigate to /tickets/new              # standalone create form
# create a ticket → appears in list
# click ticket → two-column detail page
```

## Startup verified

`make down && docker compose up --build -d` — no ERROR/FATAL lines in logs. All three services (db, backend, frontend) started cleanly.