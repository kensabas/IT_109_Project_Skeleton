// Wave 1.3 [F-06] — each role's navigation only links to pages that role
// may open, starts with the role home, and has a readable role label.
import { describe, it, expect } from 'vitest'
import { navFor, roleLabel } from '../app/utils/navigation'
import { canAccess, homeFor } from '../app/utils/access'
import { USER_ROLES } from '../app/data/mockUsers'

describe('navFor(role)', () => {
  for (const role of USER_ROLES) {
    it(`${role}: first link is the role home`, () => {
      expect(navFor(role)[0].to).toBe(homeFor(role))
    })
    it(`${role}: every link is allowed for the role`, () => {
      for (const item of navFor(role)) expect(canAccess(role, item.to)).toBe(true)
    })
  }
})

describe('roleLabel', () => {
  it('names the main admin separately', () => {
    expect(roleLabel('admin', true)).toBe('Main admin')
    expect(roleLabel('admin', false)).toBe('Admin')
    expect(roleLabel('client', false)).toBe('Client')
    expect(roleLabel('cleaner', false)).toBe('Cleaner')
  })
})

import { currentNavPath } from '../app/utils/navigation'
describe('currentNavPath — only one link is marked current', () => {
  const items = [
    { label: 'My requests', to: '/client/requests' },
    { label: 'New request', to: '/client/requests/new' },
  ]
  it('picks the longest matching link', () => {
    expect(currentNavPath(items, '/client/requests/new')).toBe('/client/requests/new')
    expect(currentNavPath(items, '/client/requests/req-001')).toBe('/client/requests')
    expect(currentNavPath(items, '/client/requests')).toBe('/client/requests')
  })
  it('returns null when nothing matches', () => expect(currentNavPath(items, '/elsewhere')).toBeNull())
})
