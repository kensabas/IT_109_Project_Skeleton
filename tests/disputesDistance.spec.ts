// Wave 2.5 [F-22, F-23] distance + Wave 2.8 [F-15] disputes store.
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { haversineKm, withinRadius } from '../app/utils/distance'
import { useDisputesStore } from '../app/stores/disputes'
import { useCurrentUserStore } from '../app/stores/currentUser'

describe('haversineKm (plan D5: straight line)', () => {
  it('is zero for the same point', () => {
    expect(haversineKm({ lat: 14.6, lng: 121 }, { lat: 14.6, lng: 121 })).toBe(0)
  })
  it('one degree of latitude is about 111.19 km', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1)
  })
  it('is symmetric', () => {
    const a = { lat: 14.565, lng: 121.031 }
    const b = { lat: 10.3316, lng: 123.8996 }
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 9)
  })
})

describe('withinRadius', () => {
  const origin = { lat: 0, lng: 0 }
  const places = [
    { id: 'near', lat: 0.05, lng: 0 },
    { id: 'edge', lat: 0.09, lng: 0 },
    { id: 'far', lat: 1, lng: 0 },
  ]
  it('keeps places within the radius (inclusive) and adds the distance', () => {
    const result = withinRadius(places, origin, 10)
    expect(result.map((r) => r.item.id)).toEqual(['near', 'edge'])
    expect(result[0].distanceKm).toBeCloseTo(5.56, 1)
  })
})

describe('disputes store (plan D12)', () => {
  beforeEach(() => setActivePinia(createPinia()))
  const admin = () => useCurrentUserStore().users.find((u) => u.email === 'admin.staff@example.com')!

  it('an admin opens a dispute on a booking', () => {
    const store = useDisputesStore()
    const result = store.createDispute({ jobId: 'job-001', title: 'Broken vase', description: 'Client reports a broken vase.', raisedByRole: 'client', raisedByName: 'Lim Trading Corp.' }, admin())
    expect(result.ok).toBe(true)
    expect(store.disputes.find((d) => d.title === 'Broken vase')?.status).toBe('open')
  })
  it('refuses a job post with no cleaner (not a booking)', () => {
    expect(useDisputesStore().createDispute({ jobId: 'job-005', title: 'x', description: 'y', raisedByRole: 'admin', raisedByName: 'Admin' }, admin()).ok).toBe(false)
  })
  it('refuses an empty title', () => {
    expect(useDisputesStore().createDispute({ jobId: 'job-001', title: ' ', description: 'y', raisedByRole: 'admin', raisedByName: 'Admin' }, admin()).ok).toBe(false)
  })
  it('adds a note with the admin\'s name', () => {
    const store = useDisputesStore()
    expect(store.addNote('dsp-003', 'Asked the building for the visitor log.', admin()).ok).toBe(true)
    const notes = store.getById('dsp-003')!.notes
    expect(notes[notes.length - 1].authorName).toBe('Ramon Castillo')
    expect(store.addNote('dsp-003', '   ', admin()).ok).toBe(false)
  })
  it('resolves an open dispute once', () => {
    const store = useDisputesStore()
    expect(store.resolve('dsp-001', admin()).ok).toBe(true)
    expect(store.getById('dsp-001')?.status).toBe('resolved')
    expect(store.getById('dsp-001')?.resolvedAt).not.toBeNull()
    expect(store.resolve('dsp-001', admin()).ok).toBe(false)
  })
})
