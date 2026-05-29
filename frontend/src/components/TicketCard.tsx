import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Ticket, TicketStatus } from '../types'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import { formatDueDate, isOverdue } from '../utils/dates'

const STATUS_ICON_COLOR: Record<TicketStatus, string> = {
  open: '#42526E',
  in_progress: '#0052CC',
  closed: '#006644',
}

interface TicketCardProps {
  ticket: Ticket
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const overdue = ticket.due_date ? isOverdue(ticket.due_date) : false
  const dateLabel = ticket.due_date
    ? formatDueDate(ticket.due_date)
    : new Date(ticket.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })

  return (
    <div
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid #DFE1E6',
        padding: '12px 16px',
        background: hovered ? '#F4F5F7' : '#fff',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
    >
      <span
        style={{
          color: STATUS_ICON_COLOR[ticket.status],
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        &#9632;
      </span>

      <PriorityBadge priority={ticket.priority} />

      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 14,
          color: '#172B4D',
        }}
      >
        {ticket.title}
      </span>

      <StatusBadge status={ticket.status} />

      <span
        style={{
          fontSize: 12,
          color: overdue ? '#DE350B' : '#6B778C',
          fontWeight: overdue ? 700 : 400,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {dateLabel}
      </span>
    </div>
  )
}
