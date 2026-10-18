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

describe('currentUser store — 4.3 logIn against mock users', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('logs in a sample client with the right email and password', () => {
    const store = useCurrentUserStore()
    const result = store.logIn('maria.santos@example.com', 'StrongPass123')
    expect(result).toEqual({ ok: true })
    expect(store.currentUser?.email).toBe('maria.santos@example.com')
    expect(store.currentUser?.role).toBe('client')
  })

  it('logs in a sample cleaner with the right email and password', () => {
    const store = useCurrentUserStore()
    const result = store.logIn('rosa.garcia@example.com', 'CleanBest2024')
    expect(result).toEqual({ ok: true })
    expect(store.currentUser?.email).toBe('rosa.garcia@example.com')
    expect(store.currentUser?.role).toBe('cleaner')
  })

  it('rejects a wrong password with the shared error message', () => {
    const store = useCurrentUserStore()
    const result = store.logIn('maria.santos@example.com', 'wrong-password')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/incorrect/i)
    expect(store.currentUser).toBeNull()
  })

  it('rejects an unknown email with the shared error message', () => {
    const store = useCurrentUserStore()
    const result = store.logIn('nobody@example.com', 'StrongPass123')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/incorrect/i)
    expect(store.currentUser).toBeNull()
  })

  it('matches emails case-insensitively on login', () => {
    const store = useCurrentUserStore()
    const result = store.logIn('MARIA.SANTOS@example.com', 'StrongPass123')
    expect(result).toEqual({ ok: true })
    expect(store.currentUser?.email).toBe('maria.santos@example.com')
  })
})
