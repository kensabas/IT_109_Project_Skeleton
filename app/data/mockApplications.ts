// Wave 2.1 [F-25 to F-27] — cleaner applications to job posts (mock).
// Accepted / declined are set when the admin assigns a cleaner (plan D1).
import type { ApplicationStatus } from './statuses'

export interface Application {
  id: string
  jobId: string
  cleanerEmail: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
}

export function initialMockApplications(): Application[] {
  const at = (iso: string) => `${iso}T09:00:00+08:00`
  return [
    { id: 'app-001', jobId: 'job-001', cleanerEmail: 'rosa.garcia@example.com', status: 'accepted', appliedAt: at('2026-10-13'), updatedAt: at('2026-10-14') },
    { id: 'app-002', jobId: 'job-001', cleanerEmail: 'pedro.mendoza@example.com', status: 'declined', appliedAt: at('2026-10-13'), updatedAt: at('2026-10-14') },
    { id: 'app-003', jobId: 'job-002', cleanerEmail: 'pedro.mendoza@example.com', status: 'accepted', appliedAt: at('2026-10-09'), updatedAt: at('2026-10-10') },
    { id: 'app-004', jobId: 'job-003', cleanerEmail: 'ana.villanueva@example.com', status: 'accepted', appliedAt: at('2026-09-29'), updatedAt: at('2026-09-30') },
    { id: 'app-005', jobId: 'job-004', cleanerEmail: 'rosa.garcia@example.com', status: 'accepted', appliedAt: at('2026-10-06'), updatedAt: at('2026-10-07') },
    { id: 'app-006', jobId: 'job-006', cleanerEmail: 'ana.villanueva@example.com', status: 'accepted', appliedAt: at('2026-09-16'), updatedAt: at('2026-09-17') },
    { id: 'app-007', jobId: 'job-005', cleanerEmail: 'pedro.mendoza@example.com', status: 'applied', appliedAt: at('2026-10-17'), updatedAt: at('2026-10-17') },
    { id: 'app-008', jobId: 'job-007', cleanerEmail: 'pedro.mendoza@example.com', status: 'applied', appliedAt: at('2026-10-19'), updatedAt: at('2026-10-19') },
    { id: 'app-009', jobId: 'job-008', cleanerEmail: 'rosa.garcia@example.com', status: 'applied', appliedAt: at('2026-10-18'), updatedAt: at('2026-10-18') },
    { id: 'app-010', jobId: 'job-007', cleanerEmail: 'rosa.garcia@example.com', status: 'cancelled', appliedAt: at('2026-10-18'), updatedAt: at('2026-10-19') },
  ]
}
