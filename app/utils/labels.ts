// Display labels for state values. Kept in one place so tables, badges
// and reports all show the same words.
import type { AccountState, ApprovalStatus, ClientType } from '../data/mockUsers'
import type { DisputeParty } from '../data/mockDisputes'

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

const ACCOUNT_STATE_ACTION: Record<AccountState, string> = {
  activated: 'Activate',
  deactivated: 'Deactivate',
  suspended: 'Suspend',
}

const ACCOUNT_STATE_ORDER: AccountState[] = ['activated', 'deactivated', 'suspended']

// The state changes an admin can make from the current state (F-05, F-14).
export function stateChangeOptions(current: AccountState): { state: AccountState; action: string }[] {
  return ACCOUNT_STATE_ORDER.filter((state) => state !== current).map((state) => ({ state, action: ACCOUNT_STATE_ACTION[state] }))
}

// The same words the sign-up form shows (I-32).
export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  homeowner: 'Homeowner',
  company: 'Company',
  establishment: 'Establishment',
  business: 'Business',
}

export const DISPUTE_PARTY_LABEL: Record<DisputeParty, string> = {
  client: 'Client',
  cleaner: 'Cleaner',
  admin: 'Admin',
}
