// Wave 2.2 [F-09 to F-13] — requests store. Rules from plan D10
// (unconfirmed): edit only while pending; cancel while pending or
// approved; cancelling an approved request archives its job post unless a
// cleaner is assigned, in which case the cancel is blocked.
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useRequestsStore, type RequestInput } from '../app/stores/requests'
import { useJobsStore } from '../app/stores/jobs'
import { useCurrentUserStore } from '../app/stores/currentUser'

const maria = () => useCurrentUserStore().users.find((u) => u.email === 'maria.santos@example.com')!
const jose = () => useCurrentUserStore().users.find((u) => u.email === 'jose.delacruz@example.com')!
const admin = () => useCurrentUserStore().users.find((u) => u.email === 'admin.staff@example.com')!

const input: RequestInput = {
  title: 'Bedroom clean',
  description: 'Clean two bedrooms.',
  date: '2026-11-20',
  startTime: '09:00',
  endTime: '12:30',
  barangay: 'Kapitolyo',
  city: 'Pasig City',
  lat: null,
  lng: null,
  ratePhp: 600,
}

beforeEach(() => setActivePinia(createPinia()))

describe('createRequest', () => {
  it('adds a pending request for the client with the duration worked out', () => {
    const store = useRequestsStore()
    const result = store.createRequest(input, maria())
    expect(result.ok).toBe(true)
    const created = store.requests.find((r) => r.title === 'Bedroom clean')!
    expect(created.status).toBe('pending')
    expect(created.clientEmail).toBe('maria.santos@example.com')
    expect(created.durationHours).toBe(3.5)
    expect(store.forClient('maria.santos@example.com').some((r) => r.id === created.id)).toBe(true)
  })
  it('refuses a non-client', () => {
    expect(useRequestsStore().createRequest(input, admin()).ok).toBe(false)
  })
})

describe('updateRequest (F-10)', () => {
  it('updates a pending request of the same client', () => {
    const store = useRequestsStore()
    expect(store.updateRequest('req-005', { ...input, ratePhp: 700 }, maria()).ok).toBe(true)
    expect(store.getById('req-005')?.ratePhp).toBe(700)
  })
  it('blocks editing an approved request', () => {
    expect(useRequestsStore().updateRequest('req-001', input, maria()).ok).toBe(false)
  })
  it('blocks another client', () => {
    expect(useRequestsStore().updateRequest('req-005', input, jose()).ok).toBe(false)
  })
})

describe('cancelRequest (F-11)', () => {
  it('cancels a pending request', () => {
    const store = useRequestsStore()
    expect(store.cancelRequest('req-005', maria()).ok).toBe(true)
    expect(store.getById('req-005')?.status).toBe('cancelled')
  })
  it('cancels an approved request with no cleaner and archives its job post', () => {
    const store = useRequestsStore()
    expect(store.cancelRequest('req-004', maria()).ok).toBe(true)
    expect(store.getById('req-004')?.status).toBe('cancelled')
    expect(useJobsStore().getById('job-007')?.archivedAt).not.toBeNull()
  })
  it('blocks cancelling an approved request whose post has a cleaner', () => {
    const store = useRequestsStore()
    const result = store.cancelRequest('req-001', maria())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/cleaner/i)
    expect(store.getById('req-001')?.status).toBe('approved')
  })
  it('blocks cancelling a rejected request', () => {
    expect(useRequestsStore().cancelRequest('req-007', useCurrentUserStore().users.find((u) => u.email === 'juan.reyes@example.com')!).ok).toBe(false)
  })
})

describe('approveRequest / rejectRequest (F-12, F-13)', () => {
  it('approving publishes a job post from the request', () => {
    const store = useRequestsStore()
    const result = store.approveRequest('req-005', admin())
    expect(result.ok).toBe(true)
    const request = store.getById('req-005')!
    expect(request.status).toBe('approved')
    const job = useJobsStore().getById(request.jobId!)!
    expect(job.requestId).toBe('req-005')
    expect(job.clientEmail).toBe('maria.santos@example.com')
    expect(job.title).toBe(request.title)
    expect(job.status).toBe('scheduled')
    expect(job.assignedCleanerId).toBeNull()
    expect(job.archivedAt).toBeNull()
  })
  it('a request without a map pin publishes a post with no coordinates (null, not NaN)', () => {
    const store = useRequestsStore()
    store.approveRequest('req-006', admin())
    const job = useJobsStore().getById(store.getById('req-006')!.jobId!)!
    expect(job.lat).toBeNull()
    expect(job.lng).toBeNull()
    expect(JSON.parse(JSON.stringify(job)).lat).toBeNull()
  })
  it('only admins can approve', () => {
    expect(useRequestsStore().approveRequest('req-005', maria()).ok).toBe(false)
  })
  it('cannot approve twice', () => {
    expect(useRequestsStore().approveRequest('req-001', admin()).ok).toBe(false)
  })
  it('rejects a pending request', () => {
    const store = useRequestsStore()
    expect(store.rejectRequest('req-006', admin()).ok).toBe(true)
    expect(store.getById('req-006')?.status).toBe('rejected')
    expect(store.getById('req-006')?.jobId).toBeNull()
  })
})
