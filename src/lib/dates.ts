// All dates sent to the backend are plain "YYYY-MM-DD" strings in the user's
// local time. (toISOString() is avoided on purpose: it converts to UTC and can
// shift the date by one day.)

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateString(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayString(): string {
  return toDateString(new Date())
}

export function addDays(value: string, days: number): string {
  const date = parseDateString(value)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

/** "2026-10-15" -> "15 Oct 2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  return parseDateString(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Backend numbering: 0 = Monday ... 6 = Sunday. */
export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export function weekdayIndex(value: string): number {
  return (parseDateString(value).getDay() + 6) % 7
}
