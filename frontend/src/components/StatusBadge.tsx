import type { TicketStatus } from '../types'

interface StatusConfig {
  background: string
  color: string
  label: string
}

const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  open: { background: '#DFE1E6', color: '#42526E', label: 'To Do' },
  in_progress: { background: '#DEEBFF', color: '#0052CC', label: 'In Progress' },
  closed: { background: '#E3FCEF', color: '#006644', label: 'Done' },
}

interface StatusBadgeProps {
  status: TicketStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      style={{
        background: config.background,
        color: config.color,
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }