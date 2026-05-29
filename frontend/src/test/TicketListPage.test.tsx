import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TicketListPage from '../pages/TicketListPage'
import type { Ticket } from '../types'

const TICKET_1: Ticket = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'First ticket',
  description: null,
  status: 'open',
  priority: 'medium',
  estimated_minutes: null,
  due_date: null,
  created_at: '2024-01-01T10:00:00',
  updated_at: '2024-01-01T10:00:00',
}

const TICKET_2: Ticket = {
  id: '22222222-2222-2222-2222-222222222222',
  title: 'Second ticket',
  description: 'Some details',
  status: 'in_progress',
  priority: 'high',
  estimated_minutes: 30,
  due_date: null,
  created_at: '2024-01-02T10:00:00',
  updated_at: '2024-01-02T10:00:00',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TicketListPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('TicketListPage', () => {
  it('renders a list of tickets', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [TICKET_1, TICKET_2],
    } as Response)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('First ticket')).toBeInTheDocument()
      expect(screen.getByText('Second ticket')).toBeInTheDocument()
    })
  })

  it('shows empty state when no tickets', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response)

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument()
    })
  })

  it('TicketForm calls POST /api/tickets on submit', async () => {
    const NEW_TICKET: Ticket = {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'New test ticket',
      description: null,
      status: 'open',
      priority: 'medium',
      estimated_minutes: null,
      due_date: null,
      created_at: '2024-01-03T10:00:00',
      updated_at: '2024-01-03T10:00:00',
    }

    const fetchMock = vi.spyOn(globalThis, 'fetch')
    // Initial list fetch → empty
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response)
    // POST create → new ticket
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => NEW_TICKET,
    } as Response)
    // Re-fetch after create → [NEW_TICKET]
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [NEW_TICKET],
    } as Response)

    renderPage()

    // Wait for empty state, then open form
    await waitFor(() => {
      expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Create Issue'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Brief description of the issue')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('Brief description of the issue'), {
      target: { value: 'New test ticket' },
    })

    fireEvent.click(screen.getByText('Create Ticket'))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        call => call[0] === '/api/tickets/' && (call[1] as RequestInit)?.method === 'POST'
      )
      expect(postCall).toBeDefined()
      const body = JSON.parse((postCall![1] as RequestInit).body as string)
      expect(body.title).toBe('New test ticket')
    })
  })
})
