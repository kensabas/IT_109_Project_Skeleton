// Workflow status values for the records added in the bulk build.
// Values not stated by the user are unconfirmed (see CLAUDE/for_ken_review.md).

// Client request (F-09 to F-12). "Completed" is not used: a request ends
// when it is approved and becomes a job post (plan D10, D11).
export const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

// Cleaner application (F-25 to F-27). Accepted / declined are set when the
// admin assigns a cleaner (plan D1).
export const APPLICATION_STATUSES = ['applied', 'accepted', 'declined', 'cancelled'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

// Dispute (F-15, plan D12).
export const DISPUTE_STATUSES = ['open', 'resolved'] as const
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number]

// Cleaner document (F-02, plan D7).
export const DOCUMENT_STATUSES = ['missing', 'submitted', 'approved', 'rejected'] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]
