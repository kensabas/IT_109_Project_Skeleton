// Wave 1.2 + 1.4 [F-01, F-05, F-06] — role homes and the mock route
// guard decision. Pure functions; the global middleware applies them.
// Front-end only: this is NOT real security (midterm mock).
import type { AccountState, UserRole } from '../data/mockUsers'

export const LOGIN_PATH = '/login'
export const WELCOME_PATH = '/welcome'
export const ACCOUNT_NOTICE_PATH = '/account-notice'
export const NO_ACCESS_NOTICE = 'no-access'

const PUBLIC_PATHS = ['/login', '/register', '/register/client', '/register/cleaner']

// Plan D9 (Q21 unconfirmed): client → My requests, cleaner →
// Marketplace, admin → Job posts.
const HOME_BY_ROLE: Record<UserRole, string> = {
  client: '/client/requests',
  cleaner: '/cleaner/marketplace',
  admin: '/admin/jobs',
}

const AREA_BY_ROLE: Record<UserRole, string> = {
  client: '/client',
  cleaner: '/cleaner',
  admin: '/admin',
}

export function homeFor(role: UserRole): string {
  return HOME_BY_ROLE[role]
}

function isInArea(path: string, area: string): boolean {
  return path === area || path.startsWith(`${area}/`)
}

// A role may open its own area and any page outside the three role areas.
export function canAccess(role: UserRole, path: string): boolean {
  for (const [areaRole, area] of Object.entries(AREA_BY_ROLE)) {
    if (isInArea(path, area)) return areaRole === role
  }
  return true
}

export interface GuardUser {
  role: UserRole
  accountState: AccountState
}

export type RouteDecision =
  | { action: 'allow' }
  | { action: 'redirect'; to: string; notice?: typeof NO_ACCESS_NOTICE }
  | { action: 'sign-out'; to: string }

export function routeDecision(user: GuardUser | null, path: string): RouteDecision {
  const isPublic = PUBLIC_PATHS.includes(path)

  if (!user) {
    return isPublic ? { action: 'allow' } : { action: 'redirect', to: LOGIN_PATH }
  }
  // Plan D6 (Q12 unconfirmed): suspended accounts cannot stay signed in.
  if (user.accountState === 'suspended') {
    return { action: 'sign-out', to: LOGIN_PATH }
  }
  // Plan D6: deactivated accounts see only the notice page.
  if (user.accountState === 'deactivated') {
    return path === ACCOUNT_NOTICE_PATH
      ? { action: 'allow' }
      : { action: 'redirect', to: ACCOUNT_NOTICE_PATH }
  }

  const home = homeFor(user.role)
  if (isPublic || path === WELCOME_PATH || path === ACCOUNT_NOTICE_PATH) {
    return { action: 'redirect', to: home }
  }
  if (!canAccess(user.role, path)) {
    return { action: 'redirect', to: home, notice: NO_ACCESS_NOTICE }
  }
  return { action: 'allow' }
}
