// Wave 2.3 + 2.4 [F-18, F-25 to F-27, F-16] — applications, assigning a
// cleaner (plan D1: admin picks an applicant) and who sees a post in the
// marketplace (plan D4, unconfirmed).
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useApplicationsStore } from '../app/stores/applications'
import { useJobsStore } from '../app/stores/jobs'
import { useCurrentUserStore } from '../app/stores/currentUser'

const user = (email: string) => useCurrentUserStore().users.find((u) => u.email === email)!
const ROSA = 'rosa.garcia@example.com'
const PEDRO = 'pedro.mendoza@example.com'
const admin = () => user('admin.staff@example.com')

beforeEach(() => setActivePinia(createPinia()))

describe('apply (F-25, F-03)', () => {
  it('an approved, activated cleaner can apply to an open post', () => {
    const store = useApplicationsStore()
    expect(store.apply('job-005', user(ROSA)).ok).toBe(true)
    expect(store.forCleaner(ROSA).find((a) => a.jobId === 'job-005')?.status).toBe('applied')
  })
  it('a cleaner pending approval cannot apply', () => {
    const result = useApplicationsStore().apply('job-005', user('liza.fernandez@example.com'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/approved/i)
  })
  it('a deactivated cleaner cannot apply', () => {
    expect(useApplicationsStore().apply('job-005', user('ana.villanueva@example.com')).ok).toBe(false)
  })
  it('a client cannot apply', () => {
    expect(useApplicationsStore().apply('job-005', user('maria.santos@example.com')).ok).toBe(false)
  })
  it('no duplicate application', () => {
    expect(useApplicationsStore().apply('job-008', user(ROSA)).ok).toBe(false)
  })
  it('cannot apply to a post that has a cleaner or is archived', () => {
    const store = useApplicationsStore()
    expect(store.apply('job-001', user(PEDRO)).ok).toBe(false)
    expect(store.apply('job-006', user(PEDRO)).ok).toBe(false)
  })
  it('can apply again after cancelling, reusing the same record', () => {
    const store = useApplicationsStore()
    const before = store.applications.length
    expect(store.apply('job-007', user(ROSA)).ok).toBe(true)
    expect(store.applications.length).toBe(before)
    expect(store.applications.find((a) => a.id === 'app-010')?.status).toBe('applied')
  })
})

describe('cancel (F-26)', () => {
  it('a cleaner cancels their own pending application', () => {
    const store = useApplicationsStore()
    expect(store.cancel('app-009', user(ROSA)).ok).toBe(true)
    expect(store.applications.find((a) => a.id === 'app-009')?.status).toBe('cancelled')
  })
  it('cannot cancel someone else\'s application', () => {
    expect(useApplicationsStore().cancel('app-007', user(ROSA)).ok).toBe(false)
  })
  it('cannot cancel an accepted application (unconfirmed rule, Q7)', () => {
    expect(useApplicationsStore().cancel('app-001', user(ROSA)).ok).toBe(false)
  })
})

describe('marketplace visibility (F-27, plan D4)', () => {
  it('a post the cleaner applied to leaves their marketplace', () => {
    const store = useApplicationsStore()
    expect(store.isInMarketplaceFor(ROSA, useJobsStore().getById('job-008')!)).toBe(false)
    expect(store.isInMarketplaceFor(PEDRO, useJobsStore().getById('job-008')!)).toBe(true)
  })
  it('a cancelled application brings the post back', () => {
    expect(useApplicationsStore().isInMarketplaceFor(ROSA, useJobsStore().getById('job-007')!)).toBe(true)
  })
  it('posts with a cleaner and archived posts are hidden for everyone', () => {
    const store = useApplicationsStore()
    const jobs = useJobsStore()
    expect(store.isInMarketplaceFor(PEDRO, jobs.getById('job-001')!)).toBe(false)
    expect(store.isInMarketplaceFor(PEDRO, jobs.getById('job-006')!)).toBe(false)
  })
  it('marketplaceFor lists only visible posts', () => {
    const ids = useApplicationsStore().marketplaceFor(ROSA).map((j) => j.id).sort()
    expect(ids).toEqual(['job-005', 'job-007', 'job-009', 'job-010'])
  })
})

describe('assignCleaner / unassign (F-18, plan D1)', () => {
  it('assigns an applicant and declines the other applicants', () => {
    const apps = useApplicationsStore()
    apps.apply('job-005', user(ROSA))
    expect(useJobsStore().assignCleaner('job-005', PEDRO, admin()).ok).toBe(true)
    expect(useJobsStore().getById('job-005')?.assignedCleanerId).toBe(PEDRO)
    expect(apps.applications.find((a) => a.id === 'app-007')?.status).toBe('accepted')
    expect(apps.forCleaner(ROSA).find((a) => a.jobId === 'job-005')?.status).toBe('declined')
  })
  it('refuses someone who did not apply', () => {
    expect(useJobsStore().assignCleaner('job-005', ROSA, admin()).ok).toBe(false)
  })
  it('refuses a non-admin', () => {
    expect(useJobsStore().assignCleaner('job-005', PEDRO, user(ROSA)).ok).toBe(false)
  })
  it('a filled post leaves the marketplace for everyone', () => {
    useJobsStore().assignCleaner('job-005', PEDRO, admin())
    expect(useApplicationsStore().isInMarketplaceFor(ROSA, useJobsStore().getById('job-005')!)).toBe(false)
  })
  it('unassign clears the cleaner and reopens the applications', () => {
    const apps = useApplicationsStore()
    apps.apply('job-005', user(ROSA))
    useJobsStore().assignCleaner('job-005', PEDRO, admin())
    expect(useJobsStore().unassign('job-005', admin()).ok).toBe(true)
    expect(useJobsStore().getById('job-005')?.assignedCleanerId).toBeNull()
    expect(apps.applicantsFor('job-005').every((a) => a.status === 'applied')).toBe(true)
  })
})

describe('bookings (F-16, plan D11)', () => {
  it('a booking is a live job post with an assigned cleaner', () => {
    expect(useJobsStore().bookings.map((j) => j.id).sort()).toEqual(['job-001', 'job-002', 'job-003', 'job-004'])
  })
})
