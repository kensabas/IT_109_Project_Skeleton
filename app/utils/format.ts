// Shared display formatting so every page shows money, dates and times
// the same way. ISO dates are read at Philippine midday (+08:00) so the
// day never shifts with the viewer's timezone.

const PESO = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })
const DATE_SHORT = new Intl.DateTimeFormat('en-PH', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Manila' })
const DATE_LONG = new Intl.DateTimeFormat('en-PH', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Manila' })
const DATE_TIME = new Intl.DateTimeFormat('en-PH', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })

function atManilaMidday(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00+08:00`)
}

export function formatPeso(amount: number): string {
  return PESO.format(amount)
}

export function formatDateShort(isoDate: string): string {
  return DATE_SHORT.format(atManilaMidday(isoDate))
}

export function formatDateLong(isoDate: string): string {
  return DATE_LONG.format(atManilaMidday(isoDate))
}

export function formatDateTime(isoDateTime: string): string {
  return DATE_TIME.format(new Date(isoDateTime))
}

export function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map((part) => parseInt(part, 10))
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = ((hours + 11) % 12) + 1
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}
