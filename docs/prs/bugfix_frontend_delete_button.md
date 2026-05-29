# bugfix/frontend_delete_button

## What was implemented

Added a Delete Ticket button to the ticket detail page sidebar. The button uses a two-step confirmation flow to prevent accidental deletion. On success the user is redirected to the backlog list.

## Technical highlights

- `deleteTicket(id)` added to `frontend/src/api/tickets.ts` — thin wrapper calling `DELETE /api/tickets/{id}` (endpoint already existed in the backend)
- `TicketDetailPage` extended with `confirmDelete`, `deleting`, `deleteError` state and a `handleDelete` async handler
- Confirmation UI expands inline on first click; error message stays visible on failure (confirmation panel is not collapsed on error)
- Follows all project conventions: inline styles, no new abstractions, consistent error handling pattern

## Testing performed

- TypeScript compilation passes (no errors in production files)
- Reviewer agent verified code correctness; one bug (error message hidden on failure) found and fixed before commit

## Remaining work

- No automated test added for the delete flow (noted in review as non-blocking for a bug fix)
