// Display labels for state values. Kept in one place so tables, badges
// and reports all show the same words.
import type { AccountState, ApprovalStatus } from '../data/mockUsers'

export const ACCOUNT_STATE_LABEL: Record<AccountState, string> = {
  activated: 'Activated',
  deactivated: 'Deactivated',
  suspended: 'Suspended',
}

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  approved: 'Approved',
  pending: 'Pending approval',
  rejected: 'Rejected',
  'not-required': 'Not required',
}
