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
