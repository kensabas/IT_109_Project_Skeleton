// F-17/18/19 Phase 1 — mock job posts for the admin dashboard.
// Wave 2.1: ten posts (all four statuses, one archived, five without a
// cleaner so the marketplace has posts to show), each with a place in
// the Philippines (approximate coordinates, demo only).
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
  // Wave 2.1 — where the job is (plan D5: distance from the cleaner's pin).
  barangay: string
  city: string
  lat: number
  lng: number
  // The client request this post was published from (F-13). Null for
  // the seeded posts that have no request on file.
  requestId: string | null
  // Client account email when the client is a registered user; null for
  // free-text client names (see needs-attention N-22).
  clientEmail: string | null
  // ISO date the post was published.
  postedAt: string
}

export function placeLabel(job: Pick<Job, 'barangay' | 'city'>): string {
  return `${job.barangay}, ${job.city}`
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
      barangay: 'Bel-Air',
      city: 'Makati City',
      lat: 14.5605,
      lng: 121.0255,
      requestId: null,
      clientEmail: null,
      postedAt: '2026-10-12',
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
      barangay: 'Kapitolyo',
      city: 'Pasig City',
      lat: 14.5712,
      lng: 121.0597,
      requestId: 'req-001',
      clientEmail: 'maria.santos@example.com',
      postedAt: '2026-10-08',
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
      barangay: 'Ermita',
      city: 'Manila',
      lat: 14.5826,
      lng: 120.9847,
      requestId: 'req-002',
      clientEmail: 'juan.reyes@example.com',
      postedAt: '2026-09-28',
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
      barangay: 'Diliman',
      city: 'Quezon City',
      lat: 14.6537,
      lng: 121.0687,
      requestId: 'req-003',
      clientEmail: 'jose.delacruz@example.com',
      postedAt: '2026-10-05',
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
      barangay: 'Malate',
      city: 'Manila',
      lat: 14.5711,
      lng: 120.9903,
      requestId: null,
      clientEmail: null,
      postedAt: '2026-10-16',
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
      barangay: 'Lahug',
      city: 'Cebu City',
      lat: 10.3316,
      lng: 123.8996,
      requestId: null,
      clientEmail: null,
      postedAt: '2026-09-15',
    },
    {
      id: 'job-007',
      title: 'Two-storey house general clean',
      clientName: 'Maria Clara Santos',
      ratePhp: 900,
      date: '2026-10-28',
      startTime: '08:00',
      endTime: '14:00',
      durationHours: 6,
      description:
        'General clean of a two-storey house: three bedrooms, two bathrooms, kitchen, stairs and living room. Cleaning supplies are provided by the homeowner.',
      status: 'scheduled',
      assignedCleanerId: null,
      archivedAt: null,
      barangay: 'Ugong',
      city: 'Pasig City',
      lat: 14.58,
      lng: 121.075,
      requestId: 'req-004',
      clientEmail: 'maria.santos@example.com',
      postedAt: '2026-10-18',
    },
    {
      id: 'job-008',
      title: 'Café closing clean',
      clientName: 'Kapihan sa Kanto',
      ratePhp: 480,
      date: '2026-10-26',
      startTime: '20:00',
      endTime: '23:00',
      durationHours: 3,
      description:
        'After-hours clean of a small café: wipe tables and counters, clean the espresso area, mop the floor, take out the trash.',
      status: 'scheduled',
      assignedCleanerId: null,
      archivedAt: null,
      barangay: 'Poblacion',
      city: 'Makati City',
      lat: 14.5649,
      lng: 121.0313,
      requestId: null,
      clientEmail: null,
      postedAt: '2026-10-17',
    },
    {
      id: 'job-009',
      title: 'Clinic disinfection',
      clientName: 'Lahug Family Clinic',
      ratePhp: 750,
      date: '2026-10-30',
      startTime: '06:00',
      endTime: '09:00',
      durationHours: 3,
      description:
        'Early-morning disinfection of a family clinic: waiting area, two consultation rooms and the restroom. Clinic provides disinfectant.',
      status: 'scheduled',
      assignedCleanerId: null,
      archivedAt: null,
      barangay: 'Lahug',
      city: 'Cebu City',
      lat: 10.333,
      lng: 123.901,
      requestId: null,
      clientEmail: null,
      postedAt: '2026-10-19',
    },
    {
      id: 'job-010',
      title: 'Apartment move-out clean',
      clientName: 'Juan Reyes',
      ratePhp: 1100,
      date: '2026-11-05',
      startTime: '09:00',
      endTime: '15:00',
      durationHours: 6,
      description:
        'Move-out clean of a one-bedroom apartment: kitchen degreasing, bathroom descaling, wipe cabinets inside and out, floors.',
      status: 'scheduled',
      assignedCleanerId: null,
      archivedAt: null,
      barangay: 'Libertad',
      city: 'Butuan City',
      lat: 8.948,
      lng: 125.527,
      requestId: null,
      clientEmail: 'juan.reyes@example.com',
      postedAt: '2026-10-19',
    },
  ]
}
