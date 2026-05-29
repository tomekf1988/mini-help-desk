import type { TicketPriority } from '../types'

interface PriorityConfig {
  background: string
  color: string
  label: string
}

const PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  low: { background: '#F4F5F7', color: '#6B778C', label: 'Low' },
  medium: { background: '#FFF3CD', color: '#856404', label: 'Medium' },
  high: { background: '#FFEBE6', color: '#DE350B', label: 'High' },
}

interface PriorityBadgeProps {
  priority: TicketPriority
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
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
