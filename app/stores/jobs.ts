// F-17/18/19 Phase 1 — Pinia store for admin job posts.
//
// Mock-only. The list is seeded from `initialMockJobs()` at store init
// and lives in memory for the life of the page. Archive is soft:
// `archivedAt` becomes an ISO string; the record is never removed.
//
// Status changes go through `setStatus(id, status)` which validates
// against `JOB_STATUSES` from the data file. See needs-attention #2.

import { defineStore } from 'pinia'
import { initialMockJobs, JOB_STATUSES, type Job, type JobStatus } from '../data/mockJobs'
import type { ClientRequest } from '../data/mockRequests'
import type { MockUser } from '../data/mockUsers'
import { ADMIN_ONLY, fail, isAdmin, nextId, OK, type ActionResult } from '../utils/result'
import { isoToday } from '../utils/dates'
import { useApplicationsStore } from './applications'

interface State {
  jobs: Job[]
}

export type StoreResult = { ok: true } | { ok: false; error: string }

export const useJobsStore = defineStore('jobs', {
  state: (): State => ({
    jobs: initialMockJobs(),
  }),

  getters: {
    // Keep as a function so the UI can pass the current `showArchived`
    // state without turning the store into a lot of computed getters.
    visibleJobs: (state) => {
      return (showArchived: boolean): Job[] => {
        if (showArchived) return state.jobs
        return state.jobs.filter((j) => j.archivedAt === null)
      }
    },

    // Plan D11 (Q11 unconfirmed): a booking is a live job post that has an
    // assigned cleaner.
    bookings: (state): Job[] =>
      state.jobs.filter((j) => j.archivedAt === null && j.assignedCleanerId !== null),
  },

  actions: {
    getById(id: string): Job | undefined {
      return this.jobs.find((j) => j.id === id)
    },

    // Soft delete: set archivedAt once; keep as-is if already archived.
    archiveJob(id: string): void {
      const job = this.jobs.find((j) => j.id === id)
      if (!job) return
      if (job.archivedAt !== null) return
      job.archivedAt = new Date().toISOString()
    },

    // Plan D3 (Q13, unconfirmed): admins can bring an archived post back.
    restoreJob(id: string): StoreResult {
      const job = this.jobs.find((j) => j.id === id)
      if (!job) return { ok: false, error: 'Job not found.' }
      if (job.archivedAt === null) return { ok: false, error: 'This job is not archived.' }
      job.archivedAt = null
      return { ok: true }
    },

    // F-13: the system publishes an approved request as a job post.
    publishFromRequest(request: ClientRequest): Job {
      const job: Job = {
        id: nextId('job', this.jobs.map((j) => j.id)),
        title: request.title,
        clientName: request.clientName,
        ratePhp: request.ratePhp,
        date: request.date,
        startTime: request.startTime,
        endTime: request.endTime,
        durationHours: request.durationHours,
        description: request.description,
        status: 'scheduled',
        assignedCleanerId: null,
        archivedAt: null,
        barangay: request.barangay,
        city: request.city,
        lat: request.lat,
        lng: request.lng,
        requestId: request.id,
        clientEmail: request.clientEmail,
        postedAt: isoToday(),
      }
      this.jobs.push(job)
      return job
    },

    // Plan D1 (Q3 unconfirmed): the admin picks the cleaner from the people
    // who applied. The other applicants are declined.
    assignCleaner(jobId: string, cleanerEmail: string, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const job = this.jobs.find((j) => j.id === jobId)
      if (!job) return fail('Job not found.')
      if (job.archivedAt) return fail('This job post is archived. Restore it first.')
      const applications = useApplicationsStore()
      const pick = applications.applications.find(
        (a) => a.jobId === jobId && a.cleanerEmail === cleanerEmail && a.status === 'applied',
      )
      if (!pick) return fail('Only a cleaner who applied to this job post can be assigned.')
      job.assignedCleanerId = cleanerEmail
      applications.settleAfterAssign(jobId, cleanerEmail)
      return OK
    },

    unassign(jobId: string, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const job = this.jobs.find((j) => j.id === jobId)
      if (!job) return fail('Job not found.')
      if (!job.assignedCleanerId) return fail('No cleaner is assigned.')
      job.assignedCleanerId = null
      useApplicationsStore().reopenForJob(jobId)
      return OK
    },

    setStatus(id: string, status: JobStatus): StoreResult {
      if (!(JOB_STATUSES as readonly string[]).includes(status)) {
        return { ok: false, error: 'Unknown status.' }
      }
      const job = this.jobs.find((j) => j.id === id)
      if (!job) {
        return { ok: false, error: 'Job not found.' }
      }
      job.status = status
      return { ok: true }
    },
  },
})
