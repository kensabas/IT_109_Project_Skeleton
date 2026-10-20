// Wave 2.1 — the seed data covers every state the screens must show and
// all references between records point at real records.
import { describe, it, expect } from 'vitest'
import { initialMockUsers } from '../app/data/mockUsers'
import { initialMockJobs, JOB_STATUSES } from '../app/data/mockJobs'
import { initialMockRequests } from '../app/data/mockRequests'
import { initialMockApplications } from '../app/data/mockApplications'
import { initialMockDocuments, DOCUMENT_TYPES } from '../app/data/mockDocuments'
import { initialMockDisputes } from '../app/data/mockDisputes'
import { REQUEST_STATUSES } from '../app/data/statuses'

const users = initialMockUsers()
const jobs = initialMockJobs()
const requests = initialMockRequests()
const applications = initialMockApplications()
const documents = initialMockDocuments()
const disputes = initialMockDisputes()
const cleaners = users.filter((u) => u.role === 'cleaner')

// Rough bounding box of the Philippines.
const inPhilippines = (lat: number, lng: number) => lat > 4.5 && lat < 21.5 && lng > 116 && lng < 127

describe('seed — users', () => {
  it('has 3 clients, 5 cleaners and 2 admins', () => {
    expect(users.filter((u) => u.role === 'client').length).toBe(3)
    expect(cleaners.length).toBe(5)
    expect(users.filter((u) => u.role === 'admin').length).toBe(2)
  })
  it('cleaners cover approved, pending and rejected', () => {
    expect(new Set(cleaners.map((c) => c.approvalStatus))).toEqual(new Set(['approved', 'pending', 'rejected']))
  })
  it('cleaners cover activated, deactivated and suspended', () => {
    expect(new Set(cleaners.map((c) => c.accountState))).toEqual(new Set(['activated', 'deactivated', 'suspended']))
  })
  it('emails are unique', () => {
    expect(new Set(users.map((u) => u.email)).size).toBe(users.length)
  })
  it('pinned locations are in the Philippines', () => {
    for (const c of cleaners) if (c.pinnedLocation) expect(inPhilippines(c.pinnedLocation.lat, c.pinnedLocation.lng)).toBe(true)
  })
})

describe('seed — job posts', () => {
  it('has 10 posts with all four statuses', () => {
    expect(jobs.length).toBe(10)
    expect(new Set(jobs.map((j) => j.status))).toEqual(new Set(JOB_STATUSES))
  })
  it('has one archived post and at least one without a cleaner', () => {
    expect(jobs.filter((j) => j.archivedAt).length).toBe(1)
    expect(jobs.filter((j) => !j.assignedCleanerId).length).toBeGreaterThanOrEqual(1)
  })
  it('every place is in the Philippines', () => {
    for (const j of jobs) expect(inPhilippines(j.lat, j.lng)).toBe(true)
  })
  it('assigned cleaners are real cleaners', () => {
    for (const j of jobs) if (j.assignedCleanerId) expect(cleaners.map((c) => c.email)).toContain(j.assignedCleanerId)
  })
})

describe('seed — requests', () => {
  it('has 8 requests covering every request status', () => {
    expect(requests.length).toBe(8)
    expect(new Set(requests.map((r) => r.status))).toEqual(new Set(REQUEST_STATUSES))
  })
  it('approved requests point at a job post that points back', () => {
    for (const r of requests.filter((x) => x.status === 'approved')) {
      const job = jobs.find((j) => j.id === r.jobId)
      expect(job?.requestId).toBe(r.id)
    }
  })
  it('only approved requests have a job post', () => {
    for (const r of requests.filter((x) => x.status !== 'approved')) expect(r.jobId).toBeNull()
  })
})

describe('seed — applications, documents, disputes', () => {
  it('applications point at real jobs and real cleaners', () => {
    for (const a of applications) {
      expect(jobs.map((j) => j.id)).toContain(a.jobId)
      expect(cleaners.map((c) => c.email)).toContain(a.cleanerEmail)
    }
  })
  it('the assigned cleaner of a post has an accepted application', () => {
    for (const j of jobs.filter((x) => x.assignedCleanerId)) {
      expect(applications.some((a) => a.jobId === j.id && a.cleanerEmail === j.assignedCleanerId && a.status === 'accepted')).toBe(true)
    }
  })
  it('every cleaner has exactly the six documents', () => {
    for (const c of cleaners) {
      expect(documents.filter((d) => d.cleanerEmail === c.email).map((d) => d.type).sort()).toEqual([...DOCUMENT_TYPES].sort())
    }
  })
  it('has 3 disputes about real job posts', () => {
    expect(disputes.length).toBe(3)
    for (const d of disputes) expect(jobs.map((j) => j.id)).toContain(d.jobId)
  })
})
