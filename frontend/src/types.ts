export type TicketStatus = 'open' | 'in_progress' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface Ticket {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  estimated_minutes: number | null
  due_date: string | null
  created_at: string
  updated_at: string
}