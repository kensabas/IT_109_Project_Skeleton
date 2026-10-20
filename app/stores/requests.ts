// Wave 2.2 [F-09 to F-13] — client requests. Rules (plan D10, Q6 / Q7
// unconfirmed): clients edit only while pending; they cancel while pending
// or approved; cancelling an approved request archives its job post if no
// cleaner is assigned, and is blocked if one is. No penalties.
import { defineStore } from 'pinia'
import { initialMockRequests, type ClientRequest } from '../data/mockRequests'
import type { MockUser } from '../data/mockUsers'
import { hoursBetween } from '../utils/dates'
import { ADMIN_ONLY, fail, isAdmin, nextId, OK, type ActionResult } from '../utils/result'
import { useJobsStore } from './jobs'

export type RequestInput = Pick<
  ClientRequest,
  'title' | 'description' | 'date' | 'startTime' | 'endTime' | 'barangay' | 'city' | 'lat' | 'lng' | 'ratePhp'
>

interface State { requests: ClientRequest[] }

const NOT_YOURS = 'You can only change your own requests.'

export const useRequestsStore = defineStore('requests', {
  state: (): State => ({ requests: initialMockRequests() }),

  getters: {
    forClient: (state) => (email: string): ClientRequest[] =>
      state.requests.filter((r) => r.clientEmail === email),
  },

  actions: {
    getById(id: string): ClientRequest | undefined {
      return this.requests.find((r) => r.id === id)
    },

    createRequest(input: RequestInput, client: MockUser | null): ActionResult & { id?: string } {
      if (client?.role !== 'client') return fail('Only clients can send requests.')
      const now = new Date().toISOString()
      const id = nextId('req', this.requests.map((r) => r.id))
      this.requests.push({
        ...input,
        id,
        clientEmail: client.email,
        clientName: client.name,
        durationHours: hoursBetween(input.startTime, input.endTime),
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        decidedAt: null,
        jobId: null,
      })
      return { ok: true, id }
    },

    updateRequest(id: string, input: RequestInput, client: MockUser | null): ActionResult {
      const request = this.getById(id)
      if (!request) return fail('Request not found.')
      if (request.clientEmail !== client?.email) return fail(NOT_YOURS)
      if (request.status !== 'pending') return fail('Only pending requests can be edited.')
      Object.assign(request, input, {
        durationHours: hoursBetween(input.startTime, input.endTime),
        updatedAt: new Date().toISOString(),
      })
      return OK
    },

    cancelRequest(id: string, client: MockUser | null): ActionResult {
      const request = this.getById(id)
      if (!request) return fail('Request not found.')
      if (request.clientEmail !== client?.email) return fail(NOT_YOURS)
      if (request.status !== 'pending' && request.status !== 'approved') {
        return fail('Only pending or approved requests can be cancelled.')
      }
      if (request.status === 'approved' && request.jobId) {
        const jobs = useJobsStore()
        const job = jobs.getById(request.jobId)
        if (job?.assignedCleanerId) {
          return fail('A cleaner is already assigned to this job, so it cannot be cancelled here. Please contact the admin.')
        }
        if (job) jobs.archiveJob(job.id)
      }
      const now = new Date().toISOString()
      request.status = 'cancelled'
      request.decidedAt = now
      request.updatedAt = now
      return OK
    },

    approveRequest(id: string, actor: MockUser | null): ActionResult & { jobId?: string } {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const request = this.getById(id)
      if (!request) return fail('Request not found.')
      if (request.status !== 'pending') return fail('Only pending requests can be approved.')
      const job = useJobsStore().publishFromRequest(request)
      const now = new Date().toISOString()
      request.status = 'approved'
      request.jobId = job.id
      request.decidedAt = now
      request.updatedAt = now
      return { ok: true, jobId: job.id }
    },

    rejectRequest(id: string, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const request = this.getById(id)
      if (!request) return fail('Request not found.')
      if (request.status !== 'pending') return fail('Only pending requests can be rejected.')
      const now = new Date().toISOString()
      request.status = 'rejected'
      request.decidedAt = now
      request.updatedAt = now
      return OK
    },
  },
})
