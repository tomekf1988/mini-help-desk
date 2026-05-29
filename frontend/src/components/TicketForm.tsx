import { useState, CSSProperties } from 'react'
import { createTicket } from '../api/tickets'
import type { TicketStatus, TicketPriority } from '../types'

interface TicketFormProps {
  onCreated: () => void
}

const inputStyle: CSSProperties = {
  background: '#FAFBFC',
  border: '1.5px solid #DFE1E6',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
}

const inputFocusStyle: CSSProperties = {
  ...inputStyle,
  borderColor: '#0052CC',
  boxShadow: '0 0 0 3px rgba(0,82,204,0.15)',
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#6B778C',
  marginBottom: 4,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

interface FocusState {
  title: boolean
  description: boolean
  estimated_minutes: boolean
  due_date: boolean
}

export default function TicketForm({ onCreated }: TicketFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>('open')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [focused, setFocused] = useState<FocusState>({
    title: false,
    description: false,
    estimated_minutes: false,
    due_date: false,
  })

  const isDisabled = submitting || title.trim() === ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDisabled) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await createTicket({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
        due_date: dueDate || null,
      })
      setTitle('')
      setDescription('')
      setStatus('open')
      setPriority('medium')
      setEstimatedMinutes('')
      setDueDate('')
      onCreated()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  function setFocus(field: keyof FocusState, value: boolean) {
    setFocused(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setFocus('title', true)}
          onBlur={() => setFocus('title', false)}
          placeholder="Brief description of the issue"
          required
          style={focused.title ? inputFocusStyle : inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          onFocus={() => setFocus('description', true)}
          onBlur={() => setFocus('description', false)}
          placeholder="Additional details..."
          rows={3}
          style={{
            ...(focused.description ? inputFocusStyle : inputStyle),
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as TicketStatus)}
            style={inputStyle}
          >
            <option value="open">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Done</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Priority</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as TicketPriority)}
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Estimated Time (min)</label>
          <input
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={e => setEstimatedMinutes(e.target.value)}
            onFocus={() => setFocus('estimated_minutes', true)}
            onBlur={() => setFocus('estimated_minutes', false)}
            placeholder="e.g. 30"
            style={focused.estimated_minutes ? inputFocusStyle : inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            onFocus={() => setFocus('due_date', true)}
            onBlur={() => setFocus('due_date', false)}
            style={focused.due_date ? inputFocusStyle : inputStyle}
          />
        </div>
      </div>

      {submitError && (
        <p style={{ margin: 0, fontSize: 13, color: '#DE350B' }}>{submitError}</p>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        style={{
          background: isDisabled
            ? '#C1C7D0'
            : 'linear-gradient(180deg, #1a78e5 0%, #0052CC 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {submitting ? 'Creating…' : 'Create Ticket'}
      </button>
    </form>
  )
}
