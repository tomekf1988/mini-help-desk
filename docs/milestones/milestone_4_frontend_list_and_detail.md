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

## Agent delegation

- `react-dev`: all of the above

## Verification

```bash
docker compose exec frontend npm test
# open http://localhost:5173             # list loads seeded tickets
# navigate to /tickets/new              # form renders
# create a ticket, check it appears in list
```