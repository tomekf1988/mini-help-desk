# Milestone 4 Frontend Review

## 1. Summary

A clean, minimal React + TypeScript frontend that covers the milestone scope well: list page with
filters, detail page with inline editing, create page, a reusable form component, and two focused
test suites. The code is readable, stays within the inline-style constraint, and avoids over-
engineering. A handful of real issues exist around error handling, a silent data loss path in the
update flow, duplicate helper code, and incomplete test coverage, but none are architectural
problems.

---

## 2. Critical Issues

### 2.1 `handleSave` silently swallows errors after a failed save

`/frontend/src/pages/TicketDetailPage.tsx` lines 99-123

When `updateTicket` throws, `setError` is called but the local form state (description, status,
priority, estimatedMinutes, dueDate) is not reset and the `ticket` object in state is still the
old server copy. This leaves the form in a dirty, seemingly unsaved state with no clear path to
recover — the user can try to save again but has no way to discard the failed edit. At minimum,
a "Discard" button or a reset-on-error should be considered. As written the user may not even
notice the error banner if the page has scrolled.

### 2.2 `parseDueDate` / `isOverdue` / `isDueThisWeek` are duplicated

`TicketCard.tsx` (lines 30-42), `TicketListPage.tsx` (lines 18-33), and `TicketDetailPage.tsx`
(lines 16-25) each contain their own copy of the same date-splitting logic. Any change to the
interpretation of due-date strings needs to be made in three places. These three functions belong
in a shared `utils/dates.ts` (or similar) and imported everywhere.

### 2.3 `TicketForm.handleSubmit` silently ignores network errors

Lines 50-74 of `/frontend/src/components/TicketForm.tsx`:

```ts
} finally {
  setSubmitting(false)
}
```

The `catch` block is missing entirely. If `createTicket` throws (network error, 4xx, 5xx), the
error is swallowed and the form just re-enables the submit button with no feedback to the user.
This is a regression path: the user typed data, clicked Create, nothing happened, and no message
explains why.

### 2.4 `TicketDetailPage` — `id` from `useParams` is not validated before use

Line 49: `const { id } = useParams<{ id: string }>()` — TypeScript types this as `string |
undefined`, and `loadTicket` guards on `!id`, but the `updateTicket` call on line 103 uses
`ticket.id` (which comes from the server response), so this specific path is safe. The concern is
cosmetic but real: if routing is ever relaxed, the early return in `loadTicket` leaves `loading`
stuck as `true` with no error shown. A short explicit guard with an error message would be safer
and cheaper to debug.

---

## 3. Suggested Improvements

### 3.1 `TicketCreatePage` is mostly redundant with `TicketListPage`'s embedded form

Both pages show the same `TicketForm`. The `/tickets/new` route and `TicketCreatePage` exist but
are never linked from the nav — the list page's "Create Issue" toggle is the primary creation
entry point. If the dedicated create page is intentional (deep-linkable URL), it is fine to keep;
if not, removing it reduces surface area. Either way, the route should either be surfaced or
removed.

### 3.2 `PriorityBadge` and `PRIORITY_ICON_COLOR` exported from `TicketCard.tsx`

These are consumed in `TicketDetailPage.tsx` via `import { PriorityBadge } from
'../components/TicketCard'`. `PriorityBadge` is a generic display component; exporting it from
`TicketCard` couples an unrelated page to an implementation detail of the card. Moving
`PriorityBadge` (and its config) to its own file alongside `StatusBadge.tsx` would make the
dependency structure obvious.

### 3.3 `STATUS_ICON_COLOR` in `TicketCard.tsx` duplicates color data from `StatusBadge.tsx`

`StatusBadge.tsx` already exports `STATUS_CONFIG` which contains the `color` field (the icon
color). `TicketCard.tsx` defines a separate `STATUS_ICON_COLOR` map with the same values. The
card could import `STATUS_CONFIG` from `StatusBadge` and derive the icon color from it, or
`STATUS_ICON_COLOR` could be exported from `StatusBadge` alongside `STATUS_CONFIG`.

### 3.4 Spinner injects a `<style>` tag on every render

`Spinner.tsx` line 14 injects a `<style>` block inline inside the component's JSX. This works but
produces a new `<style>` element each time the spinner mounts. The keyframe belongs in
`index.css`, which already exists and is the right place for global animation definitions.

### 3.5 `loadTickets` wrapped in `useCallback` for no benefit

In `TicketListPage.tsx` (line 93), `loadTickets` is wrapped in `useCallback` with `[]` deps.
Because it is only passed to `useEffect` (which also has `[loadTickets]` in its deps), the
callback never changes reference and the memoisation adds no value. The same pattern is repeated
in `TicketDetailPage.tsx`. Making `loadTicket` a plain async function inside `useEffect` is
simpler and equally correct.

### 3.6 Filter state is not preserved in the URL

The status/priority/due filters are local state only. Refreshing the page or sharing a link drops
the filter selection. For a help-desk tool where someone might bookmark "show all overdue high
priority tickets", query-string driven filters would be more useful. This is optional for this
milestone but worth noting before the project grows.

### 3.7 Test coverage gaps

Both test files test happy paths and the empty state. Missing:
- API error → error banner visible in `TicketListPage`
- Status cycle click marks form dirty in `TicketDetailPage`
- `TicketDetailPage` has no tests at all
- `TicketForm` missing-title disables submit button (a guard present in code but untested)

The existing tests are well-structured and the mock approach (spying on `globalThis.fetch`) is
appropriate. Filling the gaps above would make the test suite meaningfully useful as a regression
safety net.

### 3.8 `Layout.tsx` adds no value in its current form

The component wraps children in a single `<div>` with three style properties. Every page already
manages its own outer container styles. `Layout` could simply be removed and `main.tsx` updated
accordingly, or it could be given real purpose (nav bar, global header) in a later milestone.

---

## 4. Final Verdict

**Approve with fixes required before milestone 5 builds on top.**

The two blocking fixes before milestone 5:

1. Add a `catch` block in `TicketForm.handleSubmit` that sets an error state and renders an error
   message. The streaming milestone will also need user feedback on errors; establishing the
   pattern now avoids a second pass.

2. Extract the shared date helpers to a single module. The detail page already imports from the
   card component for `PriorityBadge`; duplicating logic further will make the milestone 5 edits
   harder to reason about.

Everything else in section 3 is low priority and can be addressed opportunistically or deferred.
The overall code quality is solid for a milestone 4 implementation.
