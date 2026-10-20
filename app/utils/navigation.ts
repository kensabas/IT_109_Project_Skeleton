// Wave 1.3 [F-06] — navigation links per role. Links are added here as
// each wave builds its pages, so the menu never points at a missing page.
import type { UserRole } from '../data/mockUsers'

// `also`: other paths that belong to this menu section (for example a
// cleaner's job page belongs to Marketplace), so it is marked current there.
export interface NavItem { label: string; to: string; also?: string[] }

const NAV: Record<UserRole, NavItem[]> = {
  client: [
    { label: 'My requests', to: '/client/requests' },
    { label: 'New request', to: '/client/requests/new' },
    { label: 'Calendar', to: '/client/calendar' },
  ],
  cleaner: [
    { label: 'Marketplace', to: '/cleaner/marketplace', also: ['/cleaner/jobs'] },
    { label: 'My applications', to: '/cleaner/applications' },
    { label: 'My documents', to: '/cleaner/documents' },
    { label: 'My location', to: '/cleaner/location' },
    { label: 'Calendar', to: '/cleaner/calendar' },
  ],
  admin: [
    { label: 'Job posts', to: '/admin/jobs' },
    { label: 'Requests', to: '/admin/requests' },
    { label: 'Bookings', to: '/admin/bookings' },
    { label: 'Accounts', to: '/admin/accounts' },
    { label: 'Disputes', to: '/admin/disputes' },
    { label: 'Reports', to: '/admin/reports' },
    { label: 'Calendar', to: '/admin/calendar' },
  ],
}

export function navFor(role: UserRole): NavItem[] {
  return NAV[role]
}

const ROLE_LABEL: Record<UserRole, string> = {
  client: 'Client',
  cleaner: 'Cleaner',
  admin: 'Admin',
}

export function roleLabel(role: UserRole, isMainAdmin: boolean): string {
  return role === 'admin' && isMainAdmin ? 'Main admin' : ROLE_LABEL[role]
}

// The link to mark with aria-current: the longest link that the path is
// on or under, so "/client/requests/new" does not also mark "/client/requests".
export function currentNavPath(items: NavItem[], path: string): string | null {
  const under = (base: string) => path === base || path.startsWith(`${base}/`)
  let best: { to: string; length: number } | null = null
  for (const item of items) {
    for (const base of [item.to, ...(item.also ?? [])]) {
      if (under(base) && (!best || base.length > best.length)) best = { to: item.to, length: base.length }
    }
  }
  return best?.to ?? null
}
