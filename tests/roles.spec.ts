// Wave 1.1 [F-04, F-06] — three roles, a main admin, two mock admins.
// Admin names and passwords are placeholders (Q22, unconfirmed).
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { initialMockUsers, USER_ROLES } from '../app/data/mockUsers'
import { useCurrentUserStore } from '../app/stores/currentUser'

describe('roles', () => {
  it('has exactly the roles client, cleaner and admin', () => {
    expect([...USER_ROLES]).toEqual(['client', 'cleaner', 'admin'])
  })

  it('seeds two admins, one of them the main admin', () => {
    const admins = initialMockUsers().filter((u) => u.role === 'admin')
    expect(admins.length).toBe(2)
    expect(admins.filter((a) => a.isMainAdmin === true).length).toBe(1)
  })

  it('only admins can be the main admin', () => {
    const others = initialMockUsers().filter((u) => u.role !== 'admin')
    expect(others.every((u) => !u.isMainAdmin)).toBe(true)
  })
})

describe('admin login (plan D9: same login screen)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the main admin can log in', () => {
    const store = useCurrentUserStore()
    expect(store.logIn('admin.main@example.com', 'AdminMain2026')).toEqual({ ok: true })
    expect(store.currentUser?.role).toBe('admin')
    expect(store.currentUser?.isMainAdmin).toBe(true)
  })

  it('the regular admin can log in and is not the main admin', () => {
    const store = useCurrentUserStore()
    expect(store.logIn('admin.staff@example.com', 'AdminStaff2026')).toEqual({ ok: true })
    expect(store.currentUser?.isMainAdmin).toBe(false)
  })

  it('sign-up can never create an admin account', () => {
    const store = useCurrentUserStore()
    const sizeBefore = store.users.length
    const result = store.signUp({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      mobileNumber: '09170000000',
      password: 'Password99',
      role: 'admin',
    })
    expect(result.ok).toBe(false)
    expect(store.users.length).toBe(sizeBefore)
    expect(store.currentUser).toBeNull()
  })
})
