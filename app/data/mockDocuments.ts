// Wave 2.1 [F-02] — the six cleaner registration documents (from the
// user). Only file details are kept (no real upload, midterm mock).
// "BIR" is shown as "BIR document (type unconfirmed)" (plan D7, Q18).
import type { DocumentStatus } from './statuses'

export const DOCUMENT_TYPES = [
  'birth-certificate',
  'nbi-clearance',
  'police-clearance',
  'government-id',
  'bir',
  'medical-certificate',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  'birth-certificate': 'Birth certificate',
  'nbi-clearance': 'NBI Clearance',
  'police-clearance': 'Police Clearance',
  'government-id': 'Valid government-issued ID',
  bir: 'BIR document (type unconfirmed)',
  'medical-certificate': 'Medical certificate (fit-to-work)',
}

export interface CleanerDocument {
  cleanerEmail: string
  type: DocumentType
  status: DocumentStatus
  fileName: string | null
  fileType: string | null
  fileSizeBytes: number | null
  submittedAt: string | null
  reviewedAt: string | null
}

function documentsFor(
  cleanerEmail: string,
  slug: string,
  statusFor: (type: DocumentType, index: number) => DocumentStatus,
  submittedOn: string,
  reviewedOn: string | null,
): CleanerDocument[] {
  return DOCUMENT_TYPES.map((type, index) => {
    const status = statusFor(type, index)
    const hasFile = status !== 'missing'
    const isImage = type === 'government-id'
    return {
      cleanerEmail,
      type,
      status,
      fileName: hasFile ? `${slug}-${type}.${isImage ? 'jpg' : 'pdf'}` : null,
      fileType: hasFile ? (isImage ? 'image/jpeg' : 'application/pdf') : null,
      fileSizeBytes: hasFile ? 180_000 + index * 41_000 : null,
      submittedAt: hasFile ? `${submittedOn}T10:00:00+08:00` : null,
      reviewedAt: status === 'approved' || status === 'rejected' ? `${reviewedOn}T15:00:00+08:00` : null,
    }
  })
}

export function initialMockDocuments(): CleanerDocument[] {
  return [
    ...documentsFor('rosa.garcia@example.com', 'rosa-garcia', () => 'approved', '2026-06-02', '2026-06-05'),
    ...documentsFor('pedro.mendoza@example.com', 'pedro-mendoza', () => 'approved', '2026-06-21', '2026-06-24'),
    ...documentsFor('ana.villanueva@example.com', 'ana-villanueva', () => 'approved', '2026-07-16', '2026-07-20'),
    // Pending cleaner: four submitted, two still missing.
    ...documentsFor('liza.fernandez@example.com', 'liza-fernandez', (_t, i) => (i < 4 ? 'submitted' : 'missing'), '2026-10-15', null),
    // Rejected cleaner: two documents rejected.
    ...documentsFor('carlo.ramos@example.com', 'carlo-ramos', (t) => (t === 'nbi-clearance' || t === 'police-clearance' ? 'rejected' : 'approved'), '2026-08-21', '2026-08-25'),
  ]
}
