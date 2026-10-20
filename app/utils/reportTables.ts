// Wave 5.3 / 5.4 [F-20, F-20a] — report tables, CSV export and written
// highlights. Highlights are fixed sentence templates filled with the
// real figures, so the text never states a number the data does not hold.
import { inPeriod, type Period } from './reports'

// ---- CSV (client side, F-20 output: CSV download) ---------------------

type Cell = string | number | null | undefined

// Text starting with these could run as a formula in a spreadsheet app.
const FORMULA_START = /^[=+\-@]/

function csvCell(value: Cell): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

// ---- Written highlights (F-20a "analysis") ----------------------------

export interface HighlightInput {
  periodLabel: string
  previousLabel: string
  requests: { current: number; previous: number }
  fill: { filled: number; total: number }
  missed: number
  pendingApprovals: number
  disputesOpened: { current: number; previous: number }
}

function changeSentence(subject: string, current: number, previous: number, periodLabel: string, previousLabel: string): string {
  if (current === previous) return `${subject} stayed at ${current}, the same as ${previousLabel}.`
  const direction = current > previous ? 'up' : 'down'
  const percent = previous === 0 ? '' : ` (${current > previous ? '+' : ''}${Math.round(((current - previous) / previous) * 100)}%)`
  return `${subject} went ${direction} from ${previous} in ${previousLabel} to ${current} in ${periodLabel}${percent}.`
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

export function buildHighlights(input: HighlightInput): string[] {
  const { periodLabel, previousLabel } = input
  const lines = [changeSentence('Requests received', input.requests.current, input.requests.previous, periodLabel, previousLabel)]
  if (input.fill.total === 0) {
    lines.push(`No job posts are dated in ${periodLabel}.`)
  } else {
    const percent = Math.round((input.fill.filled / input.fill.total) * 100)
    lines.push(`${input.fill.filled} of ${input.fill.total} job posts dated in ${periodLabel} have a cleaner (${percent}%).`)
  }
  if (input.missed > 0) lines.push(`${input.missed} ${plural(input.missed, 'job post was', 'job posts were')} marked missed.`)
  if (input.pendingApprovals > 0) {
    lines.push(`${input.pendingApprovals} ${plural(input.pendingApprovals, 'cleaner is', 'cleaners are')} waiting for approval.`)
  }
  lines.push(changeSentence('Disputes opened', input.disputesOpened.current, input.disputesOpened.previous, periodLabel, previousLabel))
  return lines
}

// ---- Cleaner report (SYSTEM_CONTEXT F-20a cleaner report) ---------------

interface CleanerData {
  users: { name: string; email: string; role: string; approvalStatus: string; accountState: string }[]
  documents: { cleanerEmail: string; status: string }[]
  applications: { cleanerEmail: string; status: string; appliedAt: string }[]
  jobs: { assignedCleanerId: string | null; status: string; date: string; city: string; archivedAt: string | null }[]
}

export function cleanerReportRows(data: CleanerData, period: Period) {
  return data.users
    .filter((u) => u.role === 'cleaner')
    .map((cleaner) => {
      const apps = data.applications.filter((a) => a.cleanerEmail === cleaner.email && inPeriod(a.appliedAt, period))
      const jobs = data.jobs.filter((j) => j.assignedCleanerId === cleaner.email && j.archivedAt === null && inPeriod(j.date, period))
      const countApps = (status: string) => apps.filter((a) => a.status === status).length
      const countJobs = (status: string) => jobs.filter((j) => j.status === status).length
      return {
        name: cleaner.name,
        email: cleaner.email,
        approvalStatus: cleaner.approvalStatus,
        accountState: cleaner.accountState,
        documentsApproved: data.documents.filter((d) => d.cleanerEmail === cleaner.email && d.status === 'approved').length,
        applied: countApps('applied'),
        accepted: countApps('accepted'),
        declined: countApps('declined'),
        cancelled: countApps('cancelled'),
        scheduled: countJobs('scheduled'),
        inProgress: countJobs('in-progress'),
        completed: countJobs('completed'),
        missed: countJobs('missed'),
        areas: [...new Set(jobs.map((j) => j.city))].sort().join(', '),
      }
    })
}

// ---- Client report (SYSTEM_CONTEXT F-20a client report) -----------------

interface ClientData {
  users: { name: string; email: string; role: string; clientType?: string }[]
  requests: { clientEmail: string; status: string; createdAt: string }[]
  jobs: { clientEmail: string | null; date: string; assignedCleanerId: string | null; archivedAt: string | null }[]
}

// "Repeat client" = two or more requests over all time (unconfirmed reading
// of "repeat usage").
const REPEAT_REQUESTS = 2

export function clientReportRows(data: ClientData, period: Period) {
  return data.users
    .filter((u) => u.role === 'client')
    .map((client) => {
      const all = data.requests.filter((r) => r.clientEmail === client.email)
      const inRange = all.filter((r) => inPeriod(r.createdAt, period))
      const jobs = data.jobs.filter((j) => j.clientEmail === client.email && j.archivedAt === null && inPeriod(j.date, period))
      const count = (status: string) => inRange.filter((r) => r.status === status).length
      return {
        name: client.name,
        email: client.email,
        clientType: client.clientType ?? '',
        requests: inRange.length,
        approved: count('approved'),
        rejected: count('rejected'),
        cancelled: count('cancelled'),
        pending: count('pending'),
        jobs: jobs.length,
        jobsWithCleaner: jobs.filter((j) => j.assignedCleanerId !== null).length,
        repeatClient: all.length >= REPEAT_REQUESTS ? 'Yes' : 'No',
      }
    })
}
