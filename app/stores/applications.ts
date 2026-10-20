// Wave 2.4 [F-25 to F-27] — cleaner applications and marketplace
// visibility. Plan D4 (Q14 unconfirmed): a post leaves the marketplace
// for the cleaner who applied; it stays for others until a cleaner is
// assigned; a cancelled or declined application brings it back for that
// cleaner unless the post is filled.
import { defineStore } from 'pinia'
import { initialMockApplications, type Application } from '../data/mockApplications'
import type { Job } from '../data/mockJobs'
import type { MockUser } from '../data/mockUsers'
import { fail, nextId, OK, type ActionResult } from '../utils/result'
import { useJobsStore } from './jobs'

interface State { applications: Application[] }

const ACTIVE_STATUSES = ['applied', 'accepted'] as const

function isActive(application: Application): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(application.status)
}

export function canCleanerApply(cleaner: MockUser | null): string | null {
  if (cleaner?.role !== 'cleaner') return 'Only cleaners can apply.'
  if (cleaner.accountState !== 'activated') return 'Your account is not active.'
  if (cleaner.approvalStatus !== 'approved') {
    return 'Your account must be approved before you can apply. Submit all six documents for review.'
  }
  return null
}

export const useApplicationsStore = defineStore('applications', {
  state: (): State => ({
    applications: initialMockApplications(),
  }),

  getters: {
    forCleaner: (state) => (email: string): Application[] =>
      state.applications.filter((a) => a.cleanerEmail === email),
    applicantsFor: (state) => (jobId: string): Application[] =>
      state.applications.filter((a) => a.jobId === jobId),
  },

  actions: {
    isInMarketplaceFor(cleanerEmail: string, job: Job): boolean {
      if (job.archivedAt !== null || job.assignedCleanerId !== null) return false
      return !this.applications.some((a) => a.jobId === job.id && a.cleanerEmail === cleanerEmail && isActive(a))
    },

    marketplaceFor(cleanerEmail: string): Job[] {
      return useJobsStore().jobs.filter((job) => this.isInMarketplaceFor(cleanerEmail, job))
    },

    apply(jobId: string, cleaner: MockUser | null): ActionResult {
      const refusal = canCleanerApply(cleaner)
      if (refusal) return fail(refusal)
      const job = useJobsStore().getById(jobId)
      if (!job) return fail('Job not found.')
      if (job.archivedAt) return fail('This job post is no longer available.')
      if (job.assignedCleanerId) return fail('A cleaner has already been assigned to this job post.')
      const email = cleaner!.email
      const existing = this.applications.find((a) => a.jobId === jobId && a.cleanerEmail === email)
      if (existing && isActive(existing)) return fail('You already applied to this job post.')
      const now = new Date().toISOString()
      if (existing) {
        existing.status = 'applied'
        existing.appliedAt = now
        existing.updatedAt = now
      } else {
        this.applications.push({
          id: nextId('app', this.applications.map((a) => a.id)),
          jobId,
          cleanerEmail: email,
          status: 'applied',
          appliedAt: now,
          updatedAt: now,
        })
      }
      return OK
    },

    cancel(applicationId: string, cleaner: MockUser | null): ActionResult {
      const application = this.applications.find((a) => a.id === applicationId)
      if (!application) return fail('Application not found.')
      if (application.cleanerEmail !== cleaner?.email) return fail('You can only cancel your own applications.')
      // Unconfirmed (Q7): once accepted, the cleaner asks the admin instead.
      if (application.status !== 'applied') return fail('Only applications that are still waiting can be cancelled.')
      application.status = 'cancelled'
      application.updatedAt = new Date().toISOString()
      return OK
    },

    // Called by the jobs store when the admin assigns a cleaner.
    settleAfterAssign(jobId: string, chosenEmail: string): void {
      const now = new Date().toISOString()
      for (const application of this.applications.filter((a) => a.jobId === jobId && a.status === 'applied')) {
        application.status = application.cleanerEmail === chosenEmail ? 'accepted' : 'declined'
        application.updatedAt = now
      }
    },

    // Called by the jobs store when the admin removes the assigned cleaner.
    reopenForJob(jobId: string): void {
      const now = new Date().toISOString()
      for (const application of this.applications.filter(
        (a) => a.jobId === jobId && (a.status === 'accepted' || a.status === 'declined'),
      )) {
        application.status = 'applied'
        application.updatedAt = now
      }
    },
  },
})
