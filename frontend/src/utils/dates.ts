export function parseDueDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDueDate(dateStr: string): string {
  return parseDueDate(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isOverdue(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parseDueDate(dateStr) < today
}

export function isDueThisWeek(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const due = parseDueDate(dateStr)
  return due >= today && due <= weekEnd
}
