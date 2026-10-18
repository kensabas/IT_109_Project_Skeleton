// Phase 4.2 — currentUser store: identity + logOut.
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useCurrentUserStore } from '../app/stores/currentUser'
import type { MockUser } from '../app/data/mockUsers'

const sampleCleaner: MockUser = {
  name: 'Rosa Garcia',
  email: 'rosa.garcia@example.com',
  mobileNumber: '09204567890',
  password: 'CleanBest2024',
  role: 'cleaner',
}

describe('currentUser store — 4.2 identity + logOut', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts logged out (currentUser is null)', () => {
    const store = useCurrentUserStore()
    expect(store.currentUser).toBeNull()
  })

  it('exposes isLoggedIn=false when nobody is logged in', () => {
    const store = useCurrentUserStore()
    expect(store.isLoggedIn).toBe(false)
  })

  it('logOut sets currentUser back to null', () => {
    const store = useCurrentUserStore()
    // Simulate a logged-in state by setting currentUser directly.
    store.currentUser = sampleCleaner
    expect(store.isLoggedIn).toBe(true)
    store.logOut()
    expect(store.currentUser).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })
})
