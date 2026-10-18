// F-17/18/19 Phase 1 — mock job posts for the admin dashboard.
//
// Scope: midterm, mock only. See `CLAUDE/feature_plans/PLAN_F-17-18-19.md`.
//
// `assignedCleanerId` is the cleaner's email from `mockUsers.ts` (the
// only stable unique field on `MockUser` today). This is a design
// decision for the mock — logged in needs-attention #8.
//
// `clientName` is a free-text string on the job (not a reference to a
// user). The plan's sample uses "Lim Trading Corp." which is not a
// sample user; other jobs reuse names from `mockUsers.ts` for
// coherence. Logged in needs-attention #8.

export type JobStatus = 'scheduled' | 'in-progress' | 'completed' | 'missed'

export const JOB_STATUSES: readonly JobStatus[] = [
  'scheduled',
  'in-progress',
  'completed',
  'missed',
] as const

export interface Job {
  id: string
  title: string
  clientName: string
  ratePhp: number
  // ISO calendar date, e.g. "2026-10-24". Not a Date object so tests
  // and the UI don't depend on a timezone.
  date: string
  // 24h strings like "08:00" and "12:00".
  startTime: string
  endTime: string
  durationHours: number
  description: string
  status: JobStatus
  assignedCleanerId: string | null
  // null when the job is live; ISO string when it was archived.
  archivedAt: string | null
}

// Fresh array per call so tests get a clean list.
export function initialMockJobs(): Job[] {
  return [
    {
      id: 'job-001',
      title: 'Office cleaning',
      clientName: 'Lim Trading Corp.',
      ratePhp: 650,
      date: '2026-10-24',
      startTime: '08:00',
      endTime: '12:00',
      durationHours: 4,
      description:
        'General office cleaning for the Lim Trading Corp. head office: sweep and mop floors, wipe desks and glass partitions, empty bins, clean two pantry areas and three restrooms.',
      status: 'scheduled',
      assignedCleanerId: 'rosa.garcia@example.com',
      archivedAt: null,
    },
    {
      id: 'job-002',
      title: 'Condo deep clean',
      clientName: 'Maria Clara Santos',
      ratePhp: 500,
      date: '2026-10-20',
      startTime: '09:00',
      endTime: '13:00',
      durationHours: 4,
      description:
        'Two-bedroom condo deep clean: kitchen and bath descaling, oven interior, floor polish, dust blinds.',
      status: 'in-progress',
      assignedCleanerId: 'pedro.mendoza@example.com',
      archivedAt: null,
    },
    {
      id: 'job-003',
      title: 'Retail store post-event clean',
      clientName: 'Juan Reyes',
      ratePhp: 700,
      date: '2026-10-10',
      startTime: '18:00',
      endTime: '22:00',
      durationHours: 4,
      description:
        'Post-event clean-up for a weekend sale: pick up litter, mop the sales floor, wipe fitting rooms, restock cleaning supplies.',
      status: 'completed',
      assignedCleanerId: 'ana.villanueva@example.com',
      archivedAt: null,
    },
    {
      id: 'job-004',
      title: 'Office pantry weekly service',
      clientName: 'Jose Dela Cruz',
      ratePhp: 550,
      date: '2026-10-15',
      startTime: '07:00',
      endTime: '10:00',
      durationHours: 3,
      description:
        'Weekly pantry service: wipe counters and fridge, refill water dispenser, run dishwasher cycle, bag trash.',
      status: 'missed',
      assignedCleanerId: 'rosa.garcia@example.com',
      archivedAt: null,
    },
    {
      id: 'job-005',
      title: 'Barbershop deep clean',
      clientName: 'Reyes Barbers',
      ratePhp: 450,
      date: '2026-11-02',
      startTime: '19:00',
      endTime: '22:00',
      durationHours: 3,
      description:
        'Barbershop closing-time deep clean: sanitise chairs and counters, sweep hair, mop, empty bins.',
      status: 'scheduled',
      assignedCleanerId: null,
      archivedAt: null,
    },
    {
      id: 'job-006',
      title: 'Back-office quarterly clean',
      clientName: 'Santos Trading',
      ratePhp: 600,
      date: '2026-09-30',
      startTime: '08:00',
      endTime: '12:00',
      durationHours: 4,
      description:
        'Quarterly deep clean of back-office area: filing cabinets, carpet shampoo, window interiors.',
      status: 'completed',
      assignedCleanerId: 'ana.villanueva@example.com',
      // Pre-archived so the "Show archived" checkbox has something to reveal.
      archivedAt: '2026-10-02T09:15:00+08:00',
    },
  ]
}
