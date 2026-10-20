// Wave 2.9 [F-20, F-20a] — report periods and metrics. Pure functions:
// every figure is counted from the mock data, nothing is invented.
// Periods (plan D15, Q19 unconfirmed): daily, monthly, quarterly, yearly.
// Archived (soft-deleted) job posts are left out of job figures.
import { toIsoDate } from './dates'
import { formatDateShort } from './format'

export const PERIOD_KINDS = ['daily', 'monthly', 'quarterly', 'yearly'] as const
export type PeriodKind = (typeof PERIOD_KINDS)[number]

export interface Period { kind: PeriodKind; start: string; end: string; label: string }
export interface Bucket { start: string; end: string; label: string }

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_IN_DAILY_TREND = 7

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split('-').map((p) => parseInt(p, 10))
  return [y, m - 1, d]
}

function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day))
}

function iso(date: Date): string {
  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = parts(isoDate)
  return iso(utc(y, m, d + days))
}

function lastDayOfMonth(year: number, month: number): string {
  return iso(utc(year, month + 1, 0))
}

export function periodFor(kind: PeriodKind, anchor: string): Period {
  const [year, month] = parts(anchor)
  switch (kind) {
    case 'daily':
      return { kind, start: anchor.slice(0, 10), end: anchor.slice(0, 10), label: formatDateShort(anchor.slice(0, 10)) }
    case 'monthly':
      return { kind, start: toIsoDate(year, month, 1), end: lastDayOfMonth(year, month), label: `${MONTH_LONG[month]} ${year}` }
    case 'quarterly': {
      const first = Math.floor(month / 3) * 3
      return {
        kind,
        start: toIsoDate(year, first, 1),
        end: lastDayOfMonth(year, first + 2),
        label: `Q${first / 3 + 1} ${year} (${MONTH_SHORT[first]} to ${MONTH_SHORT[first + 2]})`,
      }
    }
    case 'yearly':
      return { kind, start: toIsoDate(year, 0, 1), end: toIsoDate(year, 11, 31), label: String(year) }
  }
}

export function previousPeriod(period: Period): Period {
  return periodFor(period.kind, addDays(period.start, -1))
}

export function inPeriod(isoDateOrDateTime: string, period: Period | Bucket): boolean {
  const day = isoDateOrDateTime.slice(0, 10)
  return day >= period.start && day <= period.end
}

// Points for the trend line: daily → the 7 days ending that day;
// monthly → each day; quarterly and yearly → each month.
export function trendBuckets(period: Period): Bucket[] {
  if (period.kind === 'daily' || period.kind === 'monthly') {
    const start = period.kind === 'daily' ? addDays(period.start, -(DAYS_IN_DAILY_TREND - 1)) : period.start
    const buckets: Bucket[] = []
    for (let day = start; day <= period.end; day = addDays(day, 1)) {
      const [, m, d] = parts(day)
      buckets.push({ start: day, end: day, label: period.kind === 'daily' ? `${MONTH_SHORT[m]} ${d}` : String(d) })
    }
    return buckets
  }
  const [year, firstMonth] = parts(period.start)
  const months = period.kind === 'quarterly' ? 3 : 12
  return Array.from({ length: months }, (_, i) => ({
    start: toIsoDate(year, firstMonth + i, 1),
    end: lastDayOfMonth(year, firstMonth + i),
    label: MONTH_SHORT[firstMonth + i],
  }))
}

// ---- Requests --------------------------------------------------------

interface RequestLike { status: string; createdAt: string; city: string; date: string }

export function requestCounts(requests: RequestLike[], period: Period) {
  const received = requests.filter((r) => inPeriod(r.createdAt, period))
  const count = (status: string) => received.filter((r) => r.status === status).length
  return {
    received: received.length,
    pending: count('pending'),
    approved: count('approved'),
    rejected: count('rejected'),
    cancelled: count('cancelled'),
  }
}

function ratio(part: number, whole: number): number | null {
  return whole === 0 ? null : part / whole
}

export function cancellationRate(requests: RequestLike[], period: Period): number | null {
  const counts = requestCounts(requests, period)
  return ratio(counts.cancelled, counts.received)
}

export function demandByArea(requests: RequestLike[], period: Period): { area: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of requests.filter((x) => inPeriod(x.createdAt, period))) counts.set(r.city, (counts.get(r.city) ?? 0) + 1)
  return [...counts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area))
}

export function demandByWeekday(requests: RequestLike[], period: Period): { day: string; count: number }[] {
  const counts = WEEKDAYS.map((day) => ({ day, count: 0 }))
  for (const r of requests.filter((x) => inPeriod(x.createdAt, period))) {
    const [y, m, d] = parts(r.date)
    counts[utc(y, m, d).getUTCDay()].count++
  }
  return counts
}

// ---- Job posts -------------------------------------------------------

interface JobLike { id: string; status: string; date: string; postedAt: string; assignedCleanerId: string | null; archivedAt: string | null }

function liveJobsDatedIn(jobs: JobLike[], period: Period): JobLike[] {
  return jobs.filter((j) => j.archivedAt === null && inPeriod(j.date, period))
}

export function jobStatusCounts(jobs: JobLike[], period: Period) {
  const inRange = liveJobsDatedIn(jobs, period)
  const count = (status: string) => inRange.filter((j) => j.status === status).length
  return { scheduled: count('scheduled'), 'in-progress': count('in-progress'), completed: count('completed'), missed: count('missed') }
}

export function fillRate(jobs: JobLike[], period: Period) {
  const inRange = liveJobsDatedIn(jobs, period)
  const filled = inRange.filter((j) => j.assignedCleanerId !== null).length
  return { filled, total: inRange.length, rate: ratio(filled, inRange.length) }
}

export function missedRate(jobs: JobLike[], period: Period): number | null {
  const inRange = liveJobsDatedIn(jobs, period)
  return ratio(inRange.filter((j) => j.status === 'missed').length, inRange.length)
}

export function applicationsPerPost(applications: { jobId: string }[], jobs: JobLike[], period: Period): number | null {
  const posted = new Set(jobs.filter((j) => j.archivedAt === null && inPeriod(j.postedAt, period)).map((j) => j.id))
  return ratio(applications.filter((a) => posted.has(a.jobId)).length, posted.size)
}

// ---- People and disputes ---------------------------------------------

interface UserLike { role: string; registeredAt: string; accountState: string; approvalStatus: string }

export function registrations(users: UserLike[], period: Period) {
  const joined = users.filter((u) => u.role !== 'admin' && inPeriod(u.registeredAt, period))
  return {
    total: joined.length,
    clients: joined.filter((u) => u.role === 'client').length,
    cleaners: joined.filter((u) => u.role === 'cleaner').length,
  }
}

export function pendingApprovals(users: UserLike[]): number {
  return users.filter((u) => u.role === 'cleaner' && u.approvalStatus === 'pending').length
}

export function accountsByState(users: UserLike[]) {
  const count = (state: string) => users.filter((u) => u.accountState === state).length
  return { activated: count('activated'), deactivated: count('deactivated'), suspended: count('suspended') }
}

export function disputeCounts(disputes: { openedAt: string; resolvedAt: string | null }[], period: Period) {
  return {
    opened: disputes.filter((d) => inPeriod(d.openedAt, period)).length,
    resolved: disputes.filter((d) => d.resolvedAt !== null && inPeriod(d.resolvedAt, period)).length,
  }
}

// ---- Comparison and trends -------------------------------------------

export function compare(current: number, previous: number) {
  return {
    current,
    previous,
    change: current - previous,
    changePercent: previous === 0 ? null : Math.round(((current - previous) / previous) * 100),
  }
}

export function trendSeries<T>(items: T[], dateOf: (item: T) => string, period: Period): { label: string; count: number }[] {
  return trendBuckets(period).map((bucket) => ({
    label: bucket.label,
    count: items.filter((item) => inPeriod(dateOf(item), bucket)).length,
  }))
}

export function monthName(monthIndex: number): string {
  return MONTH_LONG[monthIndex]
}
