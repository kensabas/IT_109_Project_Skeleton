// Wave 7.1 — the whole core flow through the real stores:
// client request → admin approves → job post published (F-13) → cleaner
// sees it and applies → admin assigns → status moves to completed →
// reports count it. Mock data only.
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useCurrentUserStore } from '../app/stores/currentUser'
import { useRequestsStore } from '../app/stores/requests'
import { useJobsStore } from '../app/stores/jobs'
import { useApplicationsStore } from '../app/stores/applications'
import { periodFor, requestCounts, jobStatusCounts, fillRate } from '../app/utils/reports'
import { cleanerReportRows, clientReportRows } from '../app/utils/reportTables'
import { filterMarketplace, emptyFilters } from '../app/utils/marketplace'

beforeEach(() => setActivePinia(createPinia()))

describe('core flow: request to completed job', () => {
  it('works end to end and shows up in the reports', () => {
    const users = useCurrentUserStore()
    const requests = useRequestsStore()
    const jobs = useJobsStore()
    const applications = useApplicationsStore()
    const client = users.findByEmail('maria.santos@example.com')!
    const admin = users.findByEmail('admin.staff@example.com')!
    const cleaner = users.findByEmail('rosa.garcia@example.com')!
    const december = periodFor('monthly', '2026-12-01')

    const created = requests.createRequest(
      { title: 'Year-end clean', description: 'Whole house before Christmas.', date: '2026-12-20', startTime: '08:00', endTime: '14:00', barangay: 'Kapitolyo', city: 'Pasig City', lat: 14.5712, lng: 121.0597, ratePhp: 1200 },
      client,
    )
    expect(created.ok).toBe(true)
    const requestId = created.id!

    const approved = requests.approveRequest(requestId, admin)
    expect(approved.ok).toBe(true)
    const jobId = approved.jobId!
    expect(jobs.getById(jobId)?.requestId).toBe(requestId)

    const market = applications.marketplaceFor(cleaner.email)
    expect(market.map((j) => j.id)).toContain(jobId)
    const nearby = filterMarketplace(market, emptyFilters(), cleaner.pinnedLocation!)
    expect(nearby.find((r) => r.job.id === jobId)?.distanceKm).toBeLessThan(25)

    expect(applications.apply(jobId, cleaner).ok).toBe(true)
    expect(applications.marketplaceFor(cleaner.email).map((j) => j.id)).not.toContain(jobId)

    expect(jobs.assignCleaner(jobId, cleaner.email, admin).ok).toBe(true)
    expect(jobs.bookings.map((j) => j.id)).toContain(jobId)
    expect(requests.cancelRequest(requestId, client).ok).toBe(false)

    expect(jobs.setStatus(jobId, 'in-progress').ok).toBe(true)
    expect(jobs.setStatus(jobId, 'completed').ok).toBe(true)

    // Reports for December 2026 now count the new request and job post.
    expect(jobStatusCounts(jobs.jobs, december).completed).toBe(1)
    expect(fillRate(jobs.jobs, december)).toEqual({ filled: 1, total: 1, rate: 1 })
    const todayPeriod = periodFor('yearly', new Date().toISOString().slice(0, 10))
    expect(requestCounts(requests.requests, todayPeriod).approved).toBeGreaterThanOrEqual(1)
    const rosaRow = cleanerReportRows({ users: users.users, documents: [], applications: applications.applications, jobs: jobs.jobs }, december).find((r) => r.email === cleaner.email)!
    expect(rosaRow.completed).toBe(1)
    expect(rosaRow.areas).toBe('Pasig City')
    const mariaRow = clientReportRows({ users: users.users, requests: requests.requests, jobs: jobs.jobs }, december).find((r) => r.email === client.email)!
    expect(mariaRow.jobsWithCleaner).toBe(1)
  })
})
