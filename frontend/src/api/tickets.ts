import type { Ticket, TicketStatus, TicketPriority } from '../types'

const BASE_URL = '/api/tickets'

export async function getAllTickets(): Promise<Ticket[]> {
  const res = await fetch(`${BASE_URL}/`)
  if (!res.ok) throw new Error(`Failed to fetch tickets: ${res.status}`)
  return res.json()
}

export async function getTicketById(id: string): Promise<Ticket> {
  const res = await fetch(`${BASE_URL}/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch ticket: ${res.status}`)
  return res.json()
}

export interface CreateTicketData {
  title: string
  description?: string | null
  status?: TicketStatus
  priority?: TicketPriority
  estimated_minutes?: number | null
  due_date?: string | null
}

export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  const res = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to create ticket: ${res.status}`)
  return res.json()
}

export interface UpdateTicketData {
  description?: string | null
  status?: TicketStatus
  priority?: TicketPriority
  estimated_minutes?: number | null
  due_date?: string | null
}

export async function updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Failed to update ticket: ${res.status}`)
  return res.json()
}

export async function deleteTicket(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete ticket: ${res.status}`)
}