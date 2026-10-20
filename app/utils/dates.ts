// Wave 1.8 [F-07] — pure date helpers for CalendarMonth. Dates are ISO
// strings ("2026-10-24"), months are 0-based (JavaScript convention).
// Weeks start on Sunday (unconfirmed choice, see CLAUDE/for_ken_review.md).

export interface MonthRef { year: number; month: number }
export interface DayCell { iso: string; day: number; inMonth: boolean }

const DAYS_PER_WEEK = 7
const MONTH_TITLE = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Calendar arithmetic in UTC so daylight-saving changes never shift a day.
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day))
}

export function monthGrid(year: number, month: number): DayCell[][] {
  const first = utcDate(year, month, 1)
  const daysInMonth = utcDate(year, month + 1, 0).getUTCDate()
  const leading = first.getUTCDay()
  const totalCells = Math.ceil((leading + daysInMonth) / DAYS_PER_WEEK) * DAYS_PER_WEEK

  const weeks: DayCell[][] = []
  for (let index = 0; index < totalCells; index++) {
    const date = utcDate(year, month, 1 - leading + index)
    if (index % DAYS_PER_WEEK === 0) weeks.push([])
    weeks[weeks.length - 1].push({
      iso: toIsoDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month,
    })
  }
  return weeks
}

export function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  const date = utcDate(ref.year, ref.month + delta, 1)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

export function monthTitle(year: number, month: number): string {
  return MONTH_TITLE.format(utcDate(year, month, 1))
}

export function eventsInMonth<E extends { date: string; time?: string }>(events: E[], year: number, month: number): E[] {
  const prefix = toIsoDate(year, month, 1).slice(0, 7)
  return events
    .filter((event) => event.date.startsWith(prefix))
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
}

export function isoToday(now: Date = new Date()): string {
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate())
}

// Hours between two "HH:MM" times on the same day (end after start).
export function hoursBetween(startTime: string, endTime: string): number {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map((part) => parseInt(part, 10))
    return hours * 60 + minutes
  }
  return (toMinutes(endTime) - toMinutes(startTime)) / 60
}
