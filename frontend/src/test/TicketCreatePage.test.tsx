import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TicketCreatePage from '../pages/TicketCreatePage'
import type { Ticket } from '../types'

const CREATED_TICKET: Ticket = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  title: 'My new issue',
  description: null,
  status: 'open',
  priority: 'medium',
  estimated_minutes: null,
  due_date: null,
  created_at: '2024-01-01T10:00:00',
  updated_at: '2024-01-01T10:00:00',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('TicketCreatePage', () => {
  it('submits the form and navigates to /', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => CREATED_TICKET,
    } as Response)

    render(
      <MemoryRouter initialEntries={['/tickets/new']}>
        <TicketCreatePage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Create Ticket' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Brief description of the issue'), {
      target: { value: 'My new issue' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }))

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        call => call[0] === '/api/tickets/' && (call[1] as RequestInit)?.method === 'POST'
      )
      expect(postCall).toBeDefined()
      const body = JSON.parse((postCall![1] as RequestInit).body as string)
      expect(body.title).toBe('My new issue')
    })
  })
})
