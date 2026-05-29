# Milestone 9 — Chat UI Frontend

## Goal

360px fixed right sidebar `ChatPanel` on `TicketListPage` — matching the visual style of claude-skill-lab.
SSE events render as: streamed text, ticket cards (created ticket), search result lists, tool-call indicator pill.

## Deliverables

| File | Action | Description |
|---|---|---|
| `frontend/src/hooks/useChat.ts` | New | Fetch-based SSE hook; message history in `sessionStorage` |
| `frontend/src/components/ChatPanel.tsx` | New | 360px sidebar: header, scrollable message list, tool badge, input row |
| `frontend/src/types.ts` | Modified | Add `ChatMessage`, `SSEEvent`, `CreatedTicket` types |
| `frontend/src/pages/TicketListPage.tsx` | Modified | Add `ChatPanel` as right sidebar; pass `onTicketsUpdated` callback |
| `frontend/src/test/ChatPanel.test.tsx` | New | Frontend tests for chat UI states |

## Type additions (types.ts)

```typescript
export interface CreatedTicket {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  due_date: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ticket?: CreatedTicket        // populated on ticket_created event
  searchResults?: Ticket[]      // populated on search_results event
}

export interface SSEEvent {
  type: 'thinking' | 'message' | 'tool_call' | 'ticket_created' | 'search_results'
      | 'tasks_updated' | 'done' | 'error'
  content: string
}
```

## useChat.ts

```typescript
interface UseChatResult {
  messages: ChatMessage[]
  isStreaming: boolean
  activeToolCall: string | null
  sendMessage: (text: string) => void
}
```

- `messages` persisted in `sessionStorage['chat_messages']`
- `sendMessage`:
  1. Append user message + empty assistant message to state
  2. `POST /api/chat/stream` with full message history (fetch + ReadableStream)
  3. Split stream on `\n\n`, parse `data: {…}` lines → `SSEEvent`
  4. Dispatch to `handleEvent()`
- `handleEvent()` dispatch table:

| Event | Action |
|---|---|
| `thinking` | no-op (empty bubble already visible) |
| `message` | append token to last assistant message content |
| `tool_call` | set `activeToolCall` to `content` |
| `ticket_created` | parse JSON → set `msg.ticket` on last assistant message |
| `search_results` | parse JSON array → set `msg.searchResults` on last assistant message |
| `tasks_updated` | call `onTasksUpdated()` callback (refreshes ticket list) |
| `done` | `isStreaming = false`, `activeToolCall = null` |
| `error` | append error text to last assistant message |

- Guard against stale ref: use `abortRef.current` to prevent double-start (same pattern as `useStreamingSummary`)

## ChatPanel.tsx layout

```
┌─────────────────────────────────────┐  width: 360
│  Assistant              [header]    │  borderBottom: 1px solid #E5E7EB
├─────────────────────────────────────┤
│                                     │  flex: 1, overflow-y: auto
│   [assistant bubble] ←              │  padding: 16px, gap: 8px
│              → [user bubble]        │
│   [ticket card inside bubble]       │
│   [search results list]             │
│                                     │
│  ⚙ Calling create_ticket…  [badge]  │  conditional, above input
├─────────────────────────────────────┤
│  [input field]         [Send]       │  padding: 12px, gap: 8px
└─────────────────────────────────────┘
```

### Styles (inline only)

- Container: `width: 360, borderLeft: '1px solid #E5E7EB', boxShadow: '-2px 0 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0`
- User bubble: right-aligned, `background: '#007AFF'`, white text, `borderRadius: 12`
- Assistant bubble: left-aligned, `background: '#F2F2F7'`, dark text, `whiteSpace: 'pre-wrap'`
- Thinking state: italic, `color: '#6B778C'`
- Tool badge: `background: '#DEEBFF', color: '#0052CC', borderRadius: 12, padding: '4px 10px', fontSize: 12`
- Ticket card: `background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 10`
- Search list: `maxHeight: 300, overflowY: 'auto'`
- Status/priority pills: same colors as existing `StatusBadge`/`PriorityBadge` components

### TicketListPage.tsx change

Wrap existing content in a flex row, append `ChatPanel` on the right:

```tsx
<div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
  <div style={{ flex: 1, overflowY: 'auto' }}>
    {/* existing ticket list markup */}
  </div>
  <ChatPanel onTicketsUpdated={fetchTickets} />
</div>
```

## Key decisions

- **sessionStorage for history**: Chat messages survive page navigation within the session but are cleared on tab close — same approach as claude-skill-lab.
- **Fetch-based SSE**: Uses `fetch()` + `ReadableStream` (not `EventSource`) to support `POST` with a body — same approach as `useStreamingSummary`.
- **No new CSS files**: All styles inline, consistent with project convention.
- **Reuse existing badge components**: `StatusBadge`/`PriorityBadge` from `components/` for ticket and search result cards.
- **`onTicketsUpdated` callback**: Called on `tasks_updated` event so the ticket list refreshes without a full page reload.

## Tests

- `ChatPanel` renders header, input, and send button
- Send button disabled while `isStreaming`
- Ticket card renders inside assistant bubble when `msg.ticket` is set
- Search results list renders when `msg.searchResults` is set
- `useChat.sendMessage` appends user + empty assistant message

## Deviations from spec

- Tool call indicator uses `Calling {toolName}...` without the `⚙` emoji, per project convention (no emojis in files).
- `ChatPanel` prop is `onTicketsUpdated` (not `onTasksUpdated`) to match the broader ticket list refresh semantics.
- `searchResults` in test file includes `estimated_minutes`, `created_at`, `updated_at` fields to satisfy the `Ticket` interface (which is wider than `CreatedTicket`).

## Verification

```bash
make down && make up
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec frontend npm test -- --run
# 20/20 tests pass
# open http://localhost:35173
# → type "Add urgent task: test agent" → confirm ticket appears in list and chat bubble
# → type "show all open tasks" → confirm search results render
```

## Test results

- 4 test files, 20 tests total — all passed
- `src/test/ChatPanel.test.tsx` — 7 tests
- `src/hooks/useStreamingSummary.test.ts` — 9 tests
- `src/test/TicketListPage.test.tsx` — 3 tests
- `src/test/TicketCreatePage.test.tsx` — 1 test

## PR target branch

`extra_milestone`