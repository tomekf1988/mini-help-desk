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
  ticket?: CreatedTicket
  searchResults?: Ticket[]
}

export interface SSEEvent {
  type: 'thinking' | 'message' | 'tool_call' | 'ticket_created' | 'search_results'
       | 'tasks_updated' | 'done' | 'error'
  content: string
}