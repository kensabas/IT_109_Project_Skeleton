// Wave 1.3 [F-06] — navigation links per role. Links are added here as
// each wave builds its pages, so the menu never points at a missing page.
import type { UserRole } from '../data/mockUsers'

export interface NavItem { label: string; to: string }

const NAV: Record<UserRole, NavItem[]> = {
  client: [{ label: 'My requests', to: '/client/requests' }],
  cleaner: [{ label: 'Marketplace', to: '/cleaner/marketplace' }],
  admin: [{ label: 'Job posts', to: '/admin/jobs' }],
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
