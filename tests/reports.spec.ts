// Wave 2.9 [F-20, F-20a] — report metrics and periods. Pure functions on
// small hand-made data so every expected number can be checked by hand.
import { describe, it, expect } from 'vitest'
import {
  periodFor,
  previousPeriod,
  inPeriod,
  trendBuckets,
  requestCounts,
  jobStatusCounts,
  fillRate,
  applicationsPerPost,
  cancellationRate,
  missedRate,
  registrations,
  pendingApprovals,
  accountsByState,
  disputeCounts,
  demandByArea,
  demandByWeekday,
  compare,
  trendSeries,
} from '../app/utils/reports'

describe('periodFor', () => {
  it('daily', () => expect(periodFor('daily', '2026-10-20')).toMatchObject({ start: '2026-10-20', end: '2026-10-20' }))
  it('monthly', () => expect(periodFor('monthly', '2026-10-20')).toMatchObject({ start: '2026-10-01', end: '2026-10-31', label: 'October 2026' }))
  it('quarterly', () => expect(periodFor('quarterly', '2026-11-05')).toMatchObject({ start: '2026-10-01', end: '2026-12-31', label: 'Q4 2026 (Oct to Dec)' }))
  it('yearly', () => expect(periodFor('yearly', '2026-02-10')).toMatchObject({ start: '2026-01-01', end: '2026-12-31', label: '2026' }))
  it('February in a leap year ends on the 29th', () => expect(periodFor('monthly', '2028-02-03').end).toBe('2028-02-29'))
})

describe('previousPeriod', () => {
  it('month before', () => expect(previousPeriod(periodFor('monthly', '2026-01-15'))).toMatchObject({ start: '2025-12-01', end: '2025-12-31' }))
  it('quarter before', () => expect(previousPeriod(periodFor('quarterly', '2026-10-15'))).toMatchObject({ start: '2026-07-01', end: '2026-09-30' }))
  it('day before', () => expect(previousPeriod(periodFor('daily', '2026-10-01')).start).toBe('2026-09-30'))
})

describe('inPeriod', () => {
  const october = periodFor('monthly', '2026-10-20')
  it('accepts dates and date-times inside', () => {
    expect(inPeriod('2026-10-01', october)).toBe(true)
    expect(inPeriod('2026-10-31T23:00:00+08:00', october)).toBe(true)
  })
  it('rejects dates outside', () => expect(inPeriod('2026-11-01', october)).toBe(false))
})

describe('trendBuckets', () => {
  it('monthly → one bucket per day, labelled with the month', () => {
    const buckets = trendBuckets(periodFor('monthly', '2026-10-05'))
    expect(buckets.length).toBe(31)
    expect(buckets[0].label).toBe('Oct 1')
  })
  it('quarterly → one bucket per month', () => expect(trendBuckets(periodFor('quarterly', '2026-10-05')).map((b) => b.label)).toEqual(['Oct', 'Nov', 'Dec']))
  it('yearly → twelve months', () => expect(trendBuckets(periodFor('yearly', '2026-10-05')).length).toBe(12))
  it('daily → the seven days ending on that day', () => {
    const buckets = trendBuckets(periodFor('daily', '2026-10-20'))
    expect(buckets.length).toBe(7)
    expect(buckets[6].start).toBe('2026-10-20')
  })
})

const october = periodFor('monthly', '2026-10-20')

const requests = [
  { status: 'pending', createdAt: '2026-10-02T09:00:00+08:00', city: 'Pasig City', date: '2026-10-24' },
  { status: 'approved', createdAt: '2026-10-05T09:00:00+08:00', city: 'Pasig City', date: '2026-10-25' },
  { status: 'approved', createdAt: '2026-10-06T09:00:00+08:00', city: 'Manila', date: '2026-10-26' },
  { status: 'rejected', createdAt: '2026-10-07T09:00:00+08:00', city: 'Manila', date: '2026-10-24' },
  { status: 'cancelled', createdAt: '2026-10-08T09:00:00+08:00', city: 'Cebu City', date: '2026-10-24' },
  { status: 'approved', createdAt: '2026-09-30T09:00:00+08:00', city: 'Manila', date: '2026-10-01' },
] as const

describe('request metrics', () => {
  it('counts requests received in the period by status', () => {
    expect(requestCounts([...requests], october)).toEqual({ received: 5, pending: 1, approved: 2, rejected: 1, cancelled: 1 })
  })
  it('cancellation rate = cancelled / received', () => {
    expect(cancellationRate([...requests], october)).toBeCloseTo(0.2)
    expect(cancellationRate([], october)).toBeNull()
  })
  it('demand by area, most first', () => {
    expect(demandByArea([...requests], october)).toEqual([
      { area: 'Manila', count: 2 },
      { area: 'Pasig City', count: 2 },
      { area: 'Cebu City', count: 1 },
    ])
  })
  it('demand by weekday of the requested date (24 Oct 2026 is a Saturday)', () => {
    const byDay = demandByWeekday([...requests], october)
    expect(byDay.find((d) => d.day === 'Saturday')?.count).toBe(3)
    expect(byDay.length).toBe(7)
  })
})

const jobs = [
  { id: 'a', status: 'scheduled', date: '2026-10-10', postedAt: '2026-10-01', assignedCleanerId: 'x', archivedAt: null },
  { id: 'b', status: 'completed', date: '2026-10-11', postedAt: '2026-10-02', assignedCleanerId: 'x', archivedAt: null },
  { id: 'c', status: 'missed', date: '2026-10-12', postedAt: '2026-10-03', assignedCleanerId: 'y', archivedAt: null },
  { id: 'd', status: 'scheduled', date: '2026-10-13', postedAt: '2026-10-04', assignedCleanerId: null, archivedAt: null },
  { id: 'e', status: 'completed', date: '2026-10-14', postedAt: '2026-10-05', assignedCleanerId: 'x', archivedAt: '2026-10-15' },
  { id: 'f', status: 'scheduled', date: '2026-11-01', postedAt: '2026-10-06', assignedCleanerId: null, archivedAt: null },
] as const

describe('job metrics (archived posts are left out)', () => {
  it('counts job posts dated in the period by status', () => {
    expect(jobStatusCounts([...jobs], october)).toEqual({ scheduled: 2, 'in-progress': 0, completed: 1, missed: 1 })
  })
  it('fill rate = posts with a cleaner / posts', () => {
    expect(fillRate([...jobs], october)).toEqual({ filled: 3, total: 4, rate: 0.75 })
  })
  it('missed rate = missed / posts', () => expect(missedRate([...jobs], october)).toBeCloseTo(0.25))
  it('applications per post posted in the period', () => {
    const applications = [{ jobId: 'a' }, { jobId: 'a' }, { jobId: 'd' }, { jobId: 'f' }, { jobId: 'zzz' }]
    // Posts posted in October (not archived): a, b, c, d, f = 5; applications to them = 4.
    expect(applicationsPerPost(applications, [...jobs], october)).toBeCloseTo(0.8)
  })
})

describe('people and disputes', () => {
  const users = [
    { role: 'client', registeredAt: '2026-10-03', accountState: 'activated', approvalStatus: 'not-required' },
    { role: 'cleaner', registeredAt: '2026-10-04', accountState: 'activated', approvalStatus: 'pending' },
    { role: 'cleaner', registeredAt: '2026-09-04', accountState: 'suspended', approvalStatus: 'rejected' },
    { role: 'cleaner', registeredAt: '2026-08-04', accountState: 'deactivated', approvalStatus: 'pending' },
    { role: 'admin', registeredAt: '2026-10-05', accountState: 'activated', approvalStatus: 'not-required' },
  ] as const
  it('new registrations in the period (admins are created, not registered)', () => {
    expect(registrations([...users], october)).toEqual({ total: 2, clients: 1, cleaners: 1 })
  })
  it('pending cleaner approvals (now)', () => expect(pendingApprovals([...users])).toBe(2))
  it('accounts by state (now)', () => expect(accountsByState([...users])).toEqual({ activated: 3, deactivated: 1, suspended: 1 }))
  it('disputes opened and resolved in the period', () => {
    const disputes = [
      { openedAt: '2026-10-01T10:00:00+08:00', resolvedAt: '2026-10-03T10:00:00+08:00' },
      { openedAt: '2026-09-28T10:00:00+08:00', resolvedAt: '2026-10-02T10:00:00+08:00' },
      { openedAt: '2026-10-20T10:00:00+08:00', resolvedAt: null },
    ]
    expect(disputeCounts(disputes, october)).toEqual({ opened: 2, resolved: 2 })
  })
})

describe('compare and trendSeries', () => {
  it('compares with the previous period', () => {
    expect(compare(6, 4)).toEqual({ current: 6, previous: 4, change: 2, changePercent: 50 })
    expect(compare(3, 0)).toEqual({ current: 3, previous: 0, change: 3, changePercent: null })
  })
  it('counts items per bucket', () => {
    const series = trendSeries([...requests], (r) => r.createdAt, periodFor('quarterly', '2026-10-10'))
    expect(series.map((p) => p.count)).toEqual([5, 0, 0])
  })
})
