import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Ticket, TicketStatus, TicketPriority } from '../types'
import { getTicketById, updateTicket, deleteTicket } from '../api/tickets'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import SummaryPanel from '../components/SummaryPanel'
import { isOverdue } from '../utils/dates'

const STATUS_CYCLE: TicketStatus[] = ['open', 'in_progress', 'closed']

function nextStatus(current: TicketStatus): TicketStatus {
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

const inputStyle: React.CSSProperties = {
  background: '#FAFBFC',
  border: '1.5px solid #DFE1E6',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B778C',
  marginBottom: 4,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>('open')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [descFocused, setDescFocused] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    getTicketById(id)
      .then(data => {
        setTicket(data)
        setDescription(data.description ?? '')
        setStatus(data.status)
        setPriority(data.priority)
        setEstimatedMinutes(data.estimated_minutes != null ? String(data.estimated_minutes) : '')
        setDueDate(data.due_date ?? '')
      })
      .catch(err => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load ticket')
      })
      .finally(() => setLoading(false))
  }, [id])

  const isDirty =
    ticket !== null &&
    (description !== (ticket.description ?? '') ||
      status !== ticket.status ||
      priority !== ticket.priority ||
      estimatedMinutes !== (ticket.estimated_minutes != null ? String(ticket.estimated_minutes) : '') ||
      dueDate !== (ticket.due_date ?? ''))

  async function handleSave() {
    if (!ticket || !isDirty || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateTicket(ticket.id, {
        description: description.trim() || null,
        status,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
        due_date: dueDate || null,
      })
      setTicket(updated)
      setDescription(updated.description ?? '')
      setStatus(updated.status)
      setPriority(updated.priority)
      setEstimatedMinutes(updated.estimated_minutes != null ? String(updated.estimated_minutes) : '')
      setDueDate(updated.due_date ?? '')
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!ticket || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteTicket(ticket.id)
      navigate('/')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  function handleDiscard() {
    if (!ticket) return
    setDescription(ticket.description ?? '')
    setStatus(ticket.status)
    setPriority(ticket.priority)
    setEstimatedMinutes(ticket.estimated_minutes != null ? String(ticket.estimated_minutes) : '')
    setDueDate(ticket.due_date ?? '')
    setSaveError(null)
  }

  const truncatedTitle = ticket
    ? ticket.title.length > 60
      ? ticket.title.slice(0, 60) + '…'
      : ticket.title
    : ''

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky breadcrumb */}
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
          height: 56,
          gap: 8,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#0052CC',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          Backlog
        </button>
        <span style={{ color: '#6B778C', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 14, color: '#172B4D', fontWeight: 500 }}>{truncatedTitle}</span>
      </div>

      {loading ? (
        <Spinner />
      ) : loadError ? (
        <div
          style={{
            margin: 24,
            padding: '12px 16px',
            background: '#FFEBE6',
            color: '#DE350B',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {loadError}
        </div>
      ) : ticket ? (
        <div
          style={{
            flex: 1,
            padding: '24px',
            maxWidth: 1100,
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '65% 35%',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Left column — title + description */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
              padding: 24,
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Title</label>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#172B4D',
                  padding: '8px 0',
                  lineHeight: 1.4,
                }}
              >
                {ticket.title}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onFocus={() => setDescFocused(true)}
                onBlur={() => setDescFocused(false)}
                placeholder="Add a description..."
                rows={6}
                style={{
                  ...inputStyle,
                  background: descFocused ? '#fff' : '#F4F5F7',
                  borderColor: descFocused ? '#0052CC' : '#DFE1E6',
                  boxShadow: descFocused ? '0 0 0 3px rgba(0,82,204,0.15)' : 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Right column — sidebar */}
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <button
                onClick={() => setStatus(prev => nextStatus(prev))}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                }}
                title="Click to cycle status"
              >
                <StatusBadge status={status} />
              </button>
            </div>

            {/* Priority */}
            <div>
              <label style={labelStyle}>Priority</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PriorityBadge priority={priority} />
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TicketPriority)}
                  style={{ ...inputStyle, width: 'auto', flex: 1 }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Estimated time */}
            <div>
              <label style={labelStyle}>Estimated Time</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(e.target.value)}
                  placeholder="–"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span style={{ fontSize: 13, color: '#6B778C', whiteSpace: 'nowrap' }}>min</span>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: dueDate && isOverdue(dueDate) ? '#DE350B' : '#DFE1E6',
                }}
              />
            </div>

            {/* Created */}
            <div>
              <label style={labelStyle}>Created</label>
              <div style={{ fontSize: 13, color: '#6B778C' }}>
                {new Date(ticket.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => void handleSave()}
                disabled={!isDirty || saving}
                style={{
                  background:
                    isDirty && !saving
                      ? 'linear-gradient(180deg, #1a78e5 0%, #0052CC 100%)'
                      : '#C1C7D0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
                  width: '100%',
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>

              {isDirty && (
                <button
                  onClick={handleDiscard}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6B778C',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    padding: '4px 0',
                    textAlign: 'center',
                  }}
                >
                  Discard changes
                </button>
              )}

              {savedMessage && (
                <span style={{ fontSize: 13, color: '#006644', textAlign: 'center' }}>
                  Changes saved.
                </span>
              )}

              {saveError && (
                <span style={{ fontSize: 13, color: '#DE350B', textAlign: 'center' }}>
                  {saveError}
                </span>
              )}
            </div>

            {/* Delete */}
            <div style={{ borderTop: '1px solid #DFE1E6', paddingTop: 16 }}>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    background: 'none',
                    border: '1.5px solid #DE350B',
                    borderRadius: 8,
                    padding: '8px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#DE350B',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Delete Ticket
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#172B4D', textAlign: 'center' }}>
                    Are you sure? This cannot be undone.
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                      style={{
                        flex: 1,
                        background: '#DE350B',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fff',
                        fontFamily: 'inherit',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {deleting ? 'Deleting…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: '1.5px solid #DFE1E6',
                        borderRadius: 8,
                        padding: '8px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#6B778C',
                        fontFamily: 'inherit',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {deleteError && (
                    <span style={{ fontSize: 12, color: '#DE350B', textAlign: 'center' }}>
                      {deleteError}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* AI Summary */}
            <SummaryPanel ticketId={ticket.id} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
