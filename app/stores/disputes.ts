// Wave 2.8 [F-15] — disputes. Plan D12 (flow not stated by the user):
// admin list, details, notes, Open / Resolved. Created by an admin from a
// booking (a job post with an assigned cleaner).
import { defineStore } from 'pinia'
import { initialMockDisputes, type Dispute, type DisputeParty } from '../data/mockDisputes'
import type { MockUser } from '../data/mockUsers'
import { ADMIN_ONLY, fail, isAdmin, nextId, OK, type ActionResult } from '../utils/result'
import { useJobsStore } from './jobs'

interface State { disputes: Dispute[] }

export interface DisputeInput {
  jobId: string
  title: string
  description: string
  raisedByRole: DisputeParty
  raisedByName: string
}

export const useDisputesStore = defineStore('disputes', {
  state: (): State => ({
    disputes: initialMockDisputes(),
  }),

  getters: {
    forJob: (state) => (jobId: string): Dispute[] => state.disputes.filter((d) => d.jobId === jobId),
  },

  actions: {
    getById(id: string): Dispute | undefined {
      return this.disputes.find((d) => d.id === id)
    },

    createDispute(input: DisputeInput, actor: MockUser | null): ActionResult & { id?: string } {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const job = useJobsStore().getById(input.jobId)
      if (!job?.assignedCleanerId) return fail('Disputes can only be opened on a booking (a job post with a cleaner).')
      if (!input.title.trim()) return fail('Enter a title.')
      if (!input.description.trim()) return fail('Describe the problem.')
      const id = nextId('dsp', this.disputes.map((d) => d.id))
      this.disputes.push({
        ...input,
        id,
        title: input.title.trim(),
        description: input.description.trim(),
        status: 'open',
        openedAt: new Date().toISOString(),
        resolvedAt: null,
        notes: [],
      })
      return { ok: true, id }
    },

    addNote(id: string, text: string, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const dispute = this.getById(id)
      if (!dispute) return fail('Dispute not found.')
      if (!text.trim()) return fail('Write a note first.')
      const allNoteIds = this.disputes.flatMap((d) => d.notes.map((n) => n.id))
      dispute.notes.push({ id: nextId('note', allNoteIds), at: new Date().toISOString(), authorName: actor!.name, text: text.trim() })
      return OK
    },

    resolve(id: string, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const dispute = this.getById(id)
      if (!dispute) return fail('Dispute not found.')
      if (dispute.status === 'resolved') return fail('This dispute is already resolved.')
      dispute.status = 'resolved'
      dispute.resolvedAt = new Date().toISOString()
      return OK
    },
  },
})
