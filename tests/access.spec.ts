// Wave 1.2 + 1.4 [F-01, F-05, F-06] — landing by role and the mock
// route guard. Front-end only; no real security (CLAUDE.md midterm limits).
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { homeFor, canAccess, routeDecision, ACCOUNT_NOTICE_PATH } from '../app/utils/access'
import { useCurrentUserStore } from '../app/stores/currentUser'

describe('homeFor — landing page by role (plan D9, Q21)', () => {
  it('client lands on My requests', () => expect(homeFor('client')).toBe('/client/requests'))
  it('cleaner lands on the Marketplace', () => expect(homeFor('cleaner')).toBe('/cleaner/marketplace'))
  it('admin lands on Job posts', () => expect(homeFor('admin')).toBe('/admin/jobs'))
})

describe('canAccess(role, path)', () => {
  it('lets each role into its own area', () => {
    expect(canAccess('client', '/client/requests/new')).toBe(true)
    expect(canAccess('cleaner', '/cleaner/marketplace')).toBe(true)
    expect(canAccess('admin', '/admin/jobs/job-001')).toBe(true)
  })

  it('keeps each role out of the other areas', () => {
    expect(canAccess('client', '/admin/jobs')).toBe(false)
    expect(canAccess('client', '/cleaner/marketplace')).toBe(false)
    expect(canAccess('cleaner', '/client/requests')).toBe(false)
    expect(canAccess('cleaner', '/admin/accounts')).toBe(false)
    expect(canAccess('admin', '/client/requests')).toBe(false)
  })

  it('does not treat a lookalike prefix as the area', () => {
    expect(canAccess('client', '/administrator')).toBe(true)
    expect(canAccess('admin', '/clients')).toBe(true)
  })
})

const activeClient = { role: 'client' as const, accountState: 'activated' as const }

describe('routeDecision(user, path)', () => {
  it('lets anyone open the public pages', () => {
    expect(routeDecision(null, '/login')).toEqual({ action: 'allow' })
    expect(routeDecision(null, '/register/cleaner')).toEqual({ action: 'allow' })
  })

  it('sends signed-out people to /login for any other page', () => {
    expect(routeDecision(null, '/admin/jobs')).toEqual({ action: 'redirect', to: '/login' })
    expect(routeDecision(null, '/welcome')).toEqual({ action: 'redirect', to: '/login' })
  })

  it('sends a signed-in person away from login to their home', () => {
    expect(routeDecision(activeClient, '/login')).toEqual({ action: 'redirect', to: '/client/requests' })
  })

  it('sends /welcome to the role home', () => {
    expect(routeDecision(activeClient, '/welcome')).toEqual({ action: 'redirect', to: '/client/requests' })
  })

  it('sends the wrong role to its own home with a notice', () => {
    expect(routeDecision(activeClient, '/admin/jobs')).toEqual({
      action: 'redirect',
      to: '/client/requests',
      notice: 'no-access',
    })
  })

  it('allows the right role', () => {
    expect(routeDecision(activeClient, '/client/requests')).toEqual({ action: 'allow' })
  })

  it('shows a deactivated user only the account notice (plan D6)', () => {
    const user = { role: 'cleaner' as const, accountState: 'deactivated' as const }
    expect(routeDecision(user, '/cleaner/marketplace')).toEqual({ action: 'redirect', to: ACCOUNT_NOTICE_PATH })
    expect(routeDecision(user, ACCOUNT_NOTICE_PATH)).toEqual({ action: 'allow' })
  })

  it('sends an active user away from the account notice', () => {
    expect(routeDecision(activeClient, ACCOUNT_NOTICE_PATH)).toEqual({ action: 'redirect', to: '/client/requests' })
  })

  it('signs out a suspended user who still has a session (plan D6)', () => {
    const user = { role: 'client' as const, accountState: 'suspended' as const }
    expect(routeDecision(user, '/client/requests')).toEqual({ action: 'sign-out', to: '/login' })
  })
})

describe('logIn — account states (plan D6, Q12 unconfirmed)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('blocks a suspended user with a clear message', () => {
    const store = useCurrentUserStore()
    const rosa = store.users.find((u) => u.email === 'rosa.garcia@example.com')!
    rosa.accountState = 'suspended'
    const result = store.logIn('rosa.garcia@example.com', 'CleanBest2024')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/suspended/i)
    expect(store.currentUser).toBeNull()
  })

  it('lets a deactivated user sign in (they then see only the notice)', () => {
    const store = useCurrentUserStore()
    const rosa = store.users.find((u) => u.email === 'rosa.garcia@example.com')!
    rosa.accountState = 'deactivated'
    expect(store.logIn('rosa.garcia@example.com', 'CleanBest2024')).toEqual({ ok: true })
  })
})
