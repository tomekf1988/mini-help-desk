import { useState, useEffect } from 'react'
import type { Ticket, TicketStatus, TicketPriority } from '../types'
import { getAllTickets } from '../api/tickets'
import Spinner from '../components/Spinner'
import TicketCard from '../components/TicketCard'
import TicketForm from '../components/TicketForm'
import { isOverdue, isDueThisWeek } from '../utils/dates'

type StatusFilter = 'all' | TicketStatus
type PriorityFilter = 'all' | TicketPriority
type DueFilter = 'all' | 'overdue' | 'this_week' | 'no_due_date'

interface PillRowProps {
  label: string
  options: { value: string; label: string }[]
  active: string
  onChange: (value: string) => void
}

function PillRow({ label, options, active, onChange }: PillRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B778C', minWidth: 56 }}>
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: '#F4F5F7',
          borderRadius: 20,
          padding: '3px 4px',
        }}
      >
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              background: active === opt.value ? '#fff' : 'transparent',
              boxShadow:
                active === opt.value ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              border: 'none',
              borderRadius: 16,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: active === opt.value ? 600 : 400,
              color: active === opt.value ? '#172B4D' : '#6B778C',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [dueFilter, setDueFilter] = useState<DueFilter>('all')

  async function loadTickets() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllTickets()
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setTickets(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [])

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false
    if (dueFilter === 'overdue') {
      if (!ticket.due_date || !isOverdue(ticket.due_date)) return false
    } else if (dueFilter === 'this_week') {
      if (!ticket.due_date || !isDueThisWeek(ticket.due_date)) return false
    } else if (dueFilter === 'no_due_date') {
      if (ticket.due_date !== null) return false
    }
    return true
  })

  const hasFilters =
    statusFilter !== 'all' || priorityFilter !== 'all' || dueFilter !== 'all'

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#172B4D' }}>
          Backlog
        </h1>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            background: 'linear-gradient(180deg, #1a78e5 0%, #0052CC 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Hide Form' : 'Create Issue'}
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, padding: '24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {/* Create form panel */}
        {showForm && (
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
              padding: 20,
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 600, color: '#172B4D' }}>
              New Ticket
            </h2>
            <TicketForm
              onCreated={() => {
                setShowForm(false)
                void loadTickets()
              }}
            />
          </div>
        )}

        {/* Filter + list panel */}
        <div
          style={{
            background: '#fff',
            borderRadius: showForm ? '0 0 12px 12px' : 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Filters */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #DFE1E6',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <PillRow
              label="Status"
              options={[
                { value: 'all', label: 'All' },
                { value: 'open', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'closed', label: 'Done' },
              ]}
              active={statusFilter}
              onChange={v => setStatusFilter(v as StatusFilter)}
            />
            <PillRow
              label="Priority"
              options={[
                { value: 'all', label: 'All' },
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              active={priorityFilter}
              onChange={v => setPriorityFilter(v as PriorityFilter)}
            />
            <PillRow
              label="Due"
              options={[
                { value: 'all', label: 'All' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'this_week', label: 'Due this week' },
                { value: 'no_due_date', label: 'No due date' },
              ]}
              active={dueFilter}
              onChange={v => setDueFilter(v as DueFilter)}
            />
          </div>

          {/* Ticket list */}
          {loading ? (
            <Spinner />
          ) : error ? (
            <div
              style={{
                margin: 16,
                padding: '12px 16px',
                background: '#FFEBE6',
                color: '#DE350B',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#6B778C',
                fontSize: 14,
              }}
            >
              {hasFilters
                ? 'No tickets match the current filters'
                : 'No tickets yet — create one above'}
            </div>
          ) : (
            <div>
              {filteredTickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
