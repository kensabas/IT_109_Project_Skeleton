// Wave 2.1 [F-09 to F-13] — client requests for cleaners (mock).
// Form fields follow plan D13 (unconfirmed). Approved requests point at
// the job post the system published from them (F-13).
import type { RequestStatus } from './statuses'

export interface ClientRequest {
  id: string
  clientEmail: string
  clientName: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  durationHours: number
  barangay: string
  city: string
  // Optional map pin (plan D13).
  lat: number | null
  lng: number | null
  ratePhp: number
  status: RequestStatus
  createdAt: string
  updatedAt: string
  // When the admin approved or rejected it, or the client cancelled it.
  decidedAt: string | null
  jobId: string | null
}

export function initialMockRequests(): ClientRequest[] {
  return [
    {
      id: 'req-001', clientEmail: 'maria.santos@example.com', clientName: 'Maria Clara Santos',
      title: 'Condo deep clean',
      description: 'Two-bedroom condo deep clean: kitchen and bath descaling, oven interior, floor polish, dust blinds.',
      date: '2026-10-20', startTime: '09:00', endTime: '13:00', durationHours: 4,
      barangay: 'Kapitolyo', city: 'Pasig City', lat: 14.5712, lng: 121.0597, ratePhp: 500,
      status: 'approved', createdAt: '2026-10-03T10:20:00+08:00', updatedAt: '2026-10-08T09:00:00+08:00',
      decidedAt: '2026-10-08T09:00:00+08:00', jobId: 'job-002',
    },
    {
      id: 'req-002', clientEmail: 'juan.reyes@example.com', clientName: 'Juan Reyes',
      title: 'Retail store post-event clean',
      description: 'Post-event clean-up for a weekend sale: pick up litter, mop the sales floor, wipe fitting rooms, restock cleaning supplies.',
      date: '2026-10-10', startTime: '18:00', endTime: '22:00', durationHours: 4,
      barangay: 'Ermita', city: 'Manila', lat: 14.5826, lng: 120.9847, ratePhp: 700,
      status: 'approved', createdAt: '2026-09-25T14:05:00+08:00', updatedAt: '2026-09-28T11:30:00+08:00',
      decidedAt: '2026-09-28T11:30:00+08:00', jobId: 'job-003',
    },
    {
      id: 'req-003', clientEmail: 'jose.delacruz@example.com', clientName: 'Jose Dela Cruz',
      title: 'Office pantry weekly service',
      description: 'Weekly pantry service: wipe counters and fridge, refill water dispenser, run dishwasher cycle, bag trash.',
      date: '2026-10-15', startTime: '07:00', endTime: '10:00', durationHours: 3,
      barangay: 'Diliman', city: 'Quezon City', lat: null, lng: null, ratePhp: 550,
      status: 'approved', createdAt: '2026-10-01T08:45:00+08:00', updatedAt: '2026-10-05T16:10:00+08:00',
      decidedAt: '2026-10-05T16:10:00+08:00', jobId: 'job-004',
    },
    {
      id: 'req-004', clientEmail: 'maria.santos@example.com', clientName: 'Maria Clara Santos',
      title: 'Two-storey house general clean',
      description: 'General clean of a two-storey house: three bedrooms, two bathrooms, kitchen, stairs and living room. Cleaning supplies are provided by the homeowner.',
      date: '2026-10-28', startTime: '08:00', endTime: '14:00', durationHours: 6,
      barangay: 'Ugong', city: 'Pasig City', lat: 14.58, lng: 121.075, ratePhp: 900,
      status: 'approved', createdAt: '2026-10-15T19:30:00+08:00', updatedAt: '2026-10-18T10:00:00+08:00',
      decidedAt: '2026-10-18T10:00:00+08:00', jobId: 'job-007',
    },
    {
      id: 'req-005', clientEmail: 'maria.santos@example.com', clientName: 'Maria Clara Santos',
      title: 'Kitchen and living room clean',
      description: 'Clean the kitchen (counters, stove top, sink, floor) and the living room (dust shelves, vacuum sofa, mop floor).',
      date: '2026-11-08', startTime: '09:00', endTime: '12:00', durationHours: 3,
      barangay: 'Kapitolyo', city: 'Pasig City', lat: 14.5712, lng: 121.0597, ratePhp: 520,
      status: 'pending', createdAt: '2026-10-19T21:10:00+08:00', updatedAt: '2026-10-19T21:10:00+08:00',
      decidedAt: null, jobId: null,
    },
    {
      id: 'req-006', clientEmail: 'jose.delacruz@example.com', clientName: 'Jose Dela Cruz',
      title: 'Conference room clean after event',
      description: 'Clean a conference room after a company event: clear tables, wipe chairs, vacuum the carpet, empty bins.',
      date: '2026-11-10', startTime: '13:00', endTime: '16:00', durationHours: 3,
      barangay: 'Diliman', city: 'Quezon City', lat: null, lng: null, ratePhp: 600,
      status: 'pending', createdAt: '2026-10-20T08:30:00+08:00', updatedAt: '2026-10-20T08:30:00+08:00',
      decidedAt: null, jobId: null,
    },
    {
      id: 'req-007', clientEmail: 'juan.reyes@example.com', clientName: 'Juan Reyes',
      title: 'Warehouse floor scrub',
      description: 'Machine scrub of a 600 square-metre warehouse floor.',
      date: '2026-10-12', startTime: '07:00', endTime: '17:00', durationHours: 10,
      barangay: 'Ermita', city: 'Manila', lat: null, lng: null, ratePhp: 1500,
      status: 'rejected', createdAt: '2026-10-02T13:00:00+08:00', updatedAt: '2026-10-04T09:40:00+08:00',
      decidedAt: '2026-10-04T09:40:00+08:00', jobId: null,
    },
    {
      id: 'req-008', clientEmail: 'juan.reyes@example.com', clientName: 'Juan Reyes',
      title: 'Store window cleaning',
      description: 'Clean the inside and outside of the store front windows (ground floor only).',
      date: '2026-10-18', startTime: '08:00', endTime: '10:00', durationHours: 2,
      barangay: 'Ermita', city: 'Manila', lat: null, lng: null, ratePhp: 400,
      status: 'cancelled', createdAt: '2026-10-06T15:20:00+08:00', updatedAt: '2026-10-07T08:05:00+08:00',
      decidedAt: '2026-10-07T08:05:00+08:00', jobId: null,
    },
  ]
}
