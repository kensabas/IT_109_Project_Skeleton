// Wave 5.3 / 5.4 / 5.5 [F-20, F-20a] — CSV export, written highlights
// built from the figures (no invented numbers), cleaner and client rows.
import { describe, it, expect } from 'vitest'
import { toCsv, buildHighlights, cleanerReportRows, clientReportRows } from '../app/utils/reportTables'
import { periodFor } from '../app/utils/reports'

describe('toCsv', () => {
  it('joins headers and rows with CRLF', () => {
    expect(toCsv(['A', 'B'], [[1, 'x']])).toBe('A,B\r\n1,x')
  })
  it('quotes commas, quotes and new lines', () => {
    expect(toCsv(['Name'], [['Dela Cruz, Jose'], ['Say "hi"'], ['two\nlines']])).toBe('Name\r\n"Dela Cruz, Jose"\r\n"Say ""hi"""\r\n"two\nlines"')
  })
  it('writes empty cells for null', () => {
    expect(toCsv(['A', 'B'], [[null, 2]])).toBe('A,B\r\n,2')
  })
  it('stops spreadsheet formulas in text cells', () => {
    expect(toCsv(['A'], [['=SUM(A1)'], ['+63 917'], ['@x']])).toBe("A\r\n'=SUM(A1)\r\n'+63 917\r\n'@x")
  })
  it('keeps negative numbers as numbers', () => {
    expect(toCsv(['A'], [[-5]])).toBe('A\r\n-5')
  })
})

describe('buildHighlights', () => {
  const base = {
    periodLabel: 'October 2026',
    previousLabel: 'September 2026',
    requests: { current: 6, previous: 4 },
    fill: { filled: 3, total: 4 },
    missed: 1,
    pendingApprovals: 2,
    disputesOpened: { current: 1, previous: 1 },
  }
  it('describes a rise with the real numbers and percentage', () => {
    expect(buildHighlights(base)[0]).toBe('Requests received went up from 4 in September 2026 to 6 in October 2026 (+50%).')
  })
  it('describes a fall and no change', () => {
    expect(buildHighlights({ ...base, requests: { current: 2, previous: 4 } })[0]).toBe('Requests received went down from 4 in September 2026 to 2 in October 2026 (-50%).')
    expect(buildHighlights({ ...base, requests: { current: 4, previous: 4 } })[0]).toBe('Requests received stayed at 4, the same as September 2026.')
  })
  it('handles a previous period with nothing (no percentage)', () => {
    expect(buildHighlights({ ...base, requests: { current: 3, previous: 0 } })[0]).toBe('Requests received went up from 0 in September 2026 to 3 in October 2026.')
  })
  it('reports fill, missed, approvals and disputes', () => {
    const lines = buildHighlights(base)
    expect(lines).toContain('3 of 4 job posts dated in October 2026 have a cleaner (75%).')
    expect(lines).toContain('1 job post was marked missed.')
    expect(lines).toContain('2 cleaners are waiting for approval.')
    expect(lines).toContain('Disputes opened stayed at 1, the same as September 2026.')
  })
  it('says so when there are no job posts', () => {
    expect(buildHighlights({ ...base, fill: { filled: 0, total: 0 }, missed: 0, pendingApprovals: 0 })).toContain('No job posts are dated in October 2026.')
  })
})

const october = periodFor('monthly', '2026-10-20')

describe('cleanerReportRows', () => {
  const users = [
    { name: 'Rosa', email: 'r@x', role: 'cleaner', approvalStatus: 'approved', accountState: 'activated' },
    { name: 'Client', email: 'c@x', role: 'client', approvalStatus: 'not-required', accountState: 'activated' },
  ]
  const documents = [
    { cleanerEmail: 'r@x', status: 'approved' },
    { cleanerEmail: 'r@x', status: 'approved' },
    { cleanerEmail: 'r@x', status: 'submitted' },
  ]
  const applications = [
    { cleanerEmail: 'r@x', status: 'applied', appliedAt: '2026-10-02T09:00:00+08:00' },
    { cleanerEmail: 'r@x', status: 'accepted', appliedAt: '2026-10-03T09:00:00+08:00' },
    { cleanerEmail: 'r@x', status: 'cancelled', appliedAt: '2026-09-03T09:00:00+08:00' },
  ]
  const jobs = [
    { assignedCleanerId: 'r@x', status: 'completed', date: '2026-10-05', city: 'Pasig City', archivedAt: null },
    { assignedCleanerId: 'r@x', status: 'missed', date: '2026-10-06', city: 'Manila', archivedAt: null },
    { assignedCleanerId: 'r@x', status: 'completed', date: '2026-10-07', city: 'Pasig City', archivedAt: null },
    { assignedCleanerId: 'r@x', status: 'scheduled', date: '2026-11-07', city: 'Cebu City', archivedAt: null },
  ]
  it('one row per cleaner with documents, applications in the period and jobs in the period', () => {
    const rows = cleanerReportRows({ users, documents, applications, jobs }, october)
    expect(rows).toEqual([
      {
        name: 'Rosa', email: 'r@x', approvalStatus: 'approved', accountState: 'activated', documentsApproved: 2,
        applied: 1, accepted: 1, declined: 0, cancelled: 0,
        scheduled: 0, inProgress: 0, completed: 2, missed: 1, areas: 'Manila, Pasig City',
      },
    ])
  })
})

describe('clientReportRows', () => {
  const users = [
    { name: 'Maria', email: 'm@x', role: 'client', clientType: 'homeowner' },
    { name: 'Juan', email: 'j@x', role: 'client', clientType: 'business' },
  ]
  const requests = [
    { clientEmail: 'm@x', status: 'approved', createdAt: '2026-10-01T09:00:00+08:00' },
    { clientEmail: 'm@x', status: 'cancelled', createdAt: '2026-10-02T09:00:00+08:00' },
    { clientEmail: 'm@x', status: 'pending', createdAt: '2026-09-02T09:00:00+08:00' },
    { clientEmail: 'j@x', status: 'rejected', createdAt: '2026-10-03T09:00:00+08:00' },
  ]
  const jobs = [
    { clientEmail: 'm@x', date: '2026-10-10', assignedCleanerId: 'r@x', archivedAt: null },
    { clientEmail: 'm@x', date: '2026-10-11', assignedCleanerId: null, archivedAt: null },
  ]
  it('counts requests in the period, jobs in the period, and repeat use over all time', () => {
    const rows = clientReportRows({ users, requests, jobs }, october)
    expect(rows.find((r) => r.email === 'm@x')).toEqual({
      name: 'Maria', email: 'm@x', clientType: 'homeowner', requests: 2, approved: 1, rejected: 0, cancelled: 1, pending: 0,
      jobs: 2, jobsWithCleaner: 1, repeatClient: 'Yes',
    })
    expect(rows.find((r) => r.email === 'j@x')?.repeatClient).toBe('No')
  })
})
