// Wave 2.1 [F-15] — disputes about bookings (mock). Plan D12: admin list,
// details, notes, Open / Resolved. Who may raise one is unconfirmed.
import type { DisputeStatus } from './statuses'

export type DisputeParty = 'client' | 'cleaner' | 'admin'

export interface DisputeNote {
  id: string
  at: string
  authorName: string
  text: string
}

export interface Dispute {
  id: string
  jobId: string
  title: string
  description: string
  raisedByRole: DisputeParty
  raisedByName: string
  status: DisputeStatus
  openedAt: string
  resolvedAt: string | null
  notes: DisputeNote[]
}

export function initialMockDisputes(): Dispute[] {
  return [
    {
      id: 'dsp-001', jobId: 'job-004', title: 'Cleaner did not arrive',
      description: 'The client reports that nobody arrived for the 7:00 AM pantry service on 15 October.',
      raisedByRole: 'client', raisedByName: 'Jose Dela Cruz', status: 'open',
      openedAt: '2026-10-15T11:00:00+08:00', resolvedAt: null,
      notes: [
        { id: 'note-001', at: '2026-10-16T09:30:00+08:00', authorName: 'Teresa Navarro', text: 'Called the cleaner. Waiting for her reply.' },
      ],
    },
    {
      id: 'dsp-002', jobId: 'job-003', title: 'Extra hour not agreed',
      description: 'The cleaner stayed one hour longer at the client\'s request; the client and cleaner disagree on whether this was agreed.',
      raisedByRole: 'cleaner', raisedByName: 'Ana Villanueva', status: 'resolved',
      openedAt: '2026-10-11T08:15:00+08:00', resolvedAt: '2026-10-14T17:00:00+08:00',
      notes: [
        { id: 'note-002', at: '2026-10-12T10:00:00+08:00', authorName: 'Ramon Castillo', text: 'Spoke with both parties.' },
        { id: 'note-003', at: '2026-10-14T16:45:00+08:00', authorName: 'Ramon Castillo', text: 'Both agreed to settle it between themselves. Payment is outside the system.' },
      ],
    },
    {
      id: 'dsp-003', jobId: 'job-002', title: 'Late start because of building access',
      description: 'Building security did not have the cleaner on the visitor list, so the job started 40 minutes late.',
      raisedByRole: 'cleaner', raisedByName: 'Pedro Mendoza', status: 'open',
      openedAt: '2026-10-20T10:05:00+08:00', resolvedAt: null, notes: [],
    },
  ]
}
