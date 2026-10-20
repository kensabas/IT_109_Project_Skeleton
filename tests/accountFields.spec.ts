// Wave 0.3 [F-05, F-18] — every user carries an account state and an
// approval status, and sign-up fills in sensible starting values.
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import {
  initialMockUsers,
  ACCOUNT_STATES,
  APPROVAL_STATUSES,
} from '../app/data/mockUsers'
import { useCurrentUserStore } from '../app/stores/currentUser'
import { ACCOUNT_STATE_LABEL, APPROVAL_STATUS_LABEL } from '../app/utils/labels'

describe('mock users — accountState and approvalStatus', () => {
  it('every seeded user has a known account state', () => {
    for (const user of initialMockUsers()) {
      expect(ACCOUNT_STATES).toContain(user.accountState)
    }
  })

  it('every seeded cleaner has approved, pending or rejected', () => {
    const cleaners = initialMockUsers().filter((u) => u.role === 'cleaner')
    expect(cleaners.length).toBeGreaterThan(0)
    for (const cleaner of cleaners) {
      expect(['approved', 'pending', 'rejected']).toContain(cleaner.approvalStatus)
    }
  })

  it('non-cleaners are marked not-required for approval', () => {
    const others = initialMockUsers().filter((u) => u.role !== 'cleaner')
    for (const user of others) {
      expect(user.approvalStatus).toBe('not-required')
    }
  })

  it('has a label for every account state and approval status', () => {
    for (const state of ACCOUNT_STATES) expect(ACCOUNT_STATE_LABEL[state]).toBeTruthy()
    for (const status of APPROVAL_STATUSES) expect(APPROVAL_STATUS_LABEL[status]).toBeTruthy()
  })
})

describe('signUp — starting account state and approval', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('a new cleaner starts activated and pending approval', () => {
    const store = useCurrentUserStore()
    store.signUp({
      name: 'Carlos Bautista',
      email: 'carlos.bautista@example.com',
      mobileNumber: '09170005678',
      password: 'CleanWell8',
      role: 'cleaner',
    })
    expect(store.currentUser?.accountState).toBe('activated')
    expect(store.currentUser?.approvalStatus).toBe('pending')
  })

  it('a new client starts activated with approval not required', () => {
    const store = useCurrentUserStore()
    store.signUp({
      name: 'Luis Aquino',
      email: 'luis.aquino@example.com',
      mobileNumber: '09170001234',
      password: 'NewPassword9',
      role: 'client',
      clientType: 'homeowner',
    })
    expect(store.currentUser?.accountState).toBe('activated')
    expect(store.currentUser?.approvalStatus).toBe('not-required')
  })
})
