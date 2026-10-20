// F-17/18/19 Phase 1 — jobs store tests.
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useJobsStore } from '../app/stores/jobs'
import { JOB_STATUSES } from '../app/data/mockJobs'

describe('jobs store — load + getById', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts with the six mock jobs', () => {
    const s = useJobsStore()
    expect(s.jobs.length).toBe(6)
  })

  it('getById returns the right job', () => {
    const s = useJobsStore()
    const j = s.getById('job-001')
    expect(j?.title).toBe('Office cleaning')
    expect(j?.clientName).toBe('Lim Trading Corp.')
  })

  it('getById returns undefined for an unknown id', () => {
    const s = useJobsStore()
    expect(s.getById('job-404')).toBeUndefined()
  })
})

describe('jobs store — visibleJobs(showArchived)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('hides archived jobs by default (showArchived=false)', () => {
    const s = useJobsStore()
    const visible = s.visibleJobs(false)
    expect(visible.length).toBe(5)
    expect(visible.every((j) => j.archivedAt === null)).toBe(true)
  })

  it('includes archived when showArchived=true', () => {
    const s = useJobsStore()
    const visible = s.visibleJobs(true)
    expect(visible.length).toBe(6)
    expect(visible.some((j) => j.archivedAt !== null)).toBe(true)
  })
})

describe('jobs store — archiveJob (soft delete)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('sets archivedAt on the job and never removes the record', () => {
    const s = useJobsStore()
    const sizeBefore = s.jobs.length
    const before = s.getById('job-001')
    expect(before?.archivedAt).toBeNull()

    s.archiveJob('job-001')

    const after = s.getById('job-001')
    expect(s.jobs.length).toBe(sizeBefore)
    expect(after).toBeDefined()
    expect(after?.archivedAt).not.toBeNull()
    expect(typeof after?.archivedAt).toBe('string')
  })

  it('does not change already-archived timestamp when called twice', () => {
    const s = useJobsStore()
    const already = s.getById('job-006')
    const originalArchivedAt = already?.archivedAt
    expect(originalArchivedAt).not.toBeNull()

    s.archiveJob('job-006')
    expect(s.getById('job-006')?.archivedAt).toBe(originalArchivedAt)
  })

  it('does nothing when the id is unknown', () => {
    const s = useJobsStore()
    const sizeBefore = s.jobs.length
    expect(() => s.archiveJob('job-404')).not.toThrow()
    expect(s.jobs.length).toBe(sizeBefore)
  })
})

describe('jobs store — setStatus', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('accepts each of the four known statuses', () => {
    const s = useJobsStore()
    for (const status of JOB_STATUSES) {
      const result = s.setStatus('job-001', status)
      expect(result.ok).toBe(true)
      expect(s.getById('job-001')?.status).toBe(status)
    }
  })

  it('rejects an unknown status and leaves the job alone', () => {
    const s = useJobsStore()
    const before = s.getById('job-001')?.status
    // @ts-expect-error — intentionally wrong input
    const result = s.setStatus('job-001', 'cancelled')
    expect(result.ok).toBe(false)
    expect(s.getById('job-001')?.status).toBe(before)
  })

  it('reports not-found when the id is unknown', () => {
    const s = useJobsStore()
    const result = s.setStatus('job-404', 'completed')
    expect(result.ok).toBe(false)
  })
})

describe('jobs store — restoreJob (Wave 0.7, plan D3)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('clears archivedAt on an archived job', () => {
    const s = useJobsStore()
    expect(s.getById('job-006')?.archivedAt).not.toBeNull()
    const result = s.restoreJob('job-006')
    expect(result.ok).toBe(true)
    expect(s.getById('job-006')?.archivedAt).toBeNull()
  })

  it('reports an error when the job is not archived', () => {
    const s = useJobsStore()
    const result = s.restoreJob('job-001')
    expect(result.ok).toBe(false)
  })

  it('reports not-found for an unknown id', () => {
    const s = useJobsStore()
    expect(s.restoreJob('job-404').ok).toBe(false)
  })
})
