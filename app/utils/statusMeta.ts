// Label and colour tone for every status shown by StatusBadge. The text
// label is always shown, so colour is never the only signal (WCAG 1.4.1).
import type { JobStatus } from '../data/mockJobs'
import type { AccountState, ApprovalStatus } from '../data/mockUsers'
import type { ApplicationStatus, DisputeStatus, DocumentStatus, RequestStatus } from '../data/statuses'
import { ACCOUNT_STATE_LABEL, APPROVAL_STATUS_LABEL } from './labels'
import { ACCOUNT_STATE_TONE, JOB_STATUS_TONE, type Tone } from './statusTones'

interface Meta { label: string; tone: Tone }

const JOB: Record<JobStatus, Meta> = {
  scheduled: { label: 'Scheduled', tone: JOB_STATUS_TONE.scheduled },
  'in-progress': { label: 'In progress', tone: JOB_STATUS_TONE['in-progress'] },
  completed: { label: 'Completed', tone: JOB_STATUS_TONE.completed },
  missed: { label: 'Missed', tone: JOB_STATUS_TONE.missed },
}

const REQUEST: Record<RequestStatus, Meta> = {
  pending: { label: 'Pending', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'grey' },
}

const APPLICATION: Record<ApplicationStatus, Meta> = {
  applied: { label: 'Applied', tone: 'blue' },
  accepted: { label: 'Accepted', tone: 'green' },
  declined: { label: 'Declined', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'grey' },
}

const DISPUTE: Record<DisputeStatus, Meta> = {
  open: { label: 'Open', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'green' },
}

const DOCUMENT: Record<DocumentStatus, Meta> = {
  missing: { label: 'Missing', tone: 'grey' },
  submitted: { label: 'Submitted', tone: 'blue' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}

const ACCOUNT: Record<AccountState, Meta> = {
  activated: { label: ACCOUNT_STATE_LABEL.activated, tone: ACCOUNT_STATE_TONE.activated },
  deactivated: { label: ACCOUNT_STATE_LABEL.deactivated, tone: ACCOUNT_STATE_TONE.deactivated },
  suspended: { label: ACCOUNT_STATE_LABEL.suspended, tone: ACCOUNT_STATE_TONE.suspended },
}

const APPROVAL: Record<ApprovalStatus, Meta> = {
  approved: { label: APPROVAL_STATUS_LABEL.approved, tone: 'green' },
  pending: { label: APPROVAL_STATUS_LABEL.pending, tone: 'amber' },
  rejected: { label: APPROVAL_STATUS_LABEL.rejected, tone: 'red' },
  'not-required': { label: APPROVAL_STATUS_LABEL['not-required'], tone: 'grey' },
}

export const STATUS_META = {
  job: JOB,
  request: REQUEST,
  application: APPLICATION,
  dispute: DISPUTE,
  document: DOCUMENT,
  account: ACCOUNT,
  approval: APPROVAL,
} as const

export type StatusKind = keyof typeof STATUS_META
export const STATUS_KINDS = Object.keys(STATUS_META) as StatusKind[]

function metaFor(kind: StatusKind, value: string): Meta | undefined {
  return (STATUS_META[kind] as Record<string, Meta>)[value]
}

export function statusLabel(kind: StatusKind, value: string): string {
  return metaFor(kind, value)?.label ?? value
}

export function statusTone(kind: StatusKind, value: string): Tone {
  return metaFor(kind, value)?.tone ?? 'grey'
}
