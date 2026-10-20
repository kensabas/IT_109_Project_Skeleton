// Wave 6.3 [F-22, F-23, F-23a] — marketplace search, filters and sort.
// Radius limits (1 to 50 km) and the 25 km default are unconfirmed (Q20).
import { describe, it, expect } from 'vitest'
import { filterMarketplace, emptyFilters, RADIUS_MIN_KM, RADIUS_MAX_KM, DEFAULT_RADIUS_KM, type MarketplaceFilters } from '../app/utils/marketplace'

const job = (over: Partial<Record<string, unknown>>) => ({
  id: 'x', title: 'Clean', description: 'General clean', clientName: 'Client', date: '2026-11-01', startTime: '09:00',
  ratePhp: 500, durationHours: 3, city: 'Pasig City', barangay: 'Kapitolyo', lat: 14.5712, lng: 121.0597, postedAt: '2026-10-10',
  ...over,
})

const jobs = [
  job({ id: 'near', lat: 14.566, lng: 121.032, ratePhp: 480, date: '2026-10-26', startTime: '20:00', durationHours: 3, clientName: 'Kapihan sa Kanto', city: 'Makati City', postedAt: '2026-10-17', description: 'Café closing clean' }),
  job({ id: 'pasig', ratePhp: 900, date: '2026-10-28', startTime: '08:00', durationHours: 6, clientName: 'Maria Clara Santos', postedAt: '2026-10-18', description: 'Two-storey house' }),
  job({ id: 'cebu', lat: 10.333, lng: 123.901, ratePhp: 750, date: '2026-10-30', startTime: '06:00', city: 'Cebu City', clientName: 'Lahug Family Clinic', postedAt: '2026-10-19', description: 'Clinic disinfection' }),
  job({ id: 'nopin', lat: null, lng: null, ratePhp: 520, date: '2026-11-08', city: 'Pasig City', postedAt: '2026-10-20', description: 'Kitchen clean' }),
]
const makati = { lat: 14.565, lng: 121.031 }
// Tests that are not about distance pass no pin (null): Cebu is ~570 km
// from the Makati pin, outside even the 50 km maximum radius.
const all = (over: Partial<MarketplaceFilters> = {}): MarketplaceFilters => ({ ...emptyFilters(), radiusKm: RADIUS_MAX_KM, ...over })

describe('emptyFilters', () => {
  it('starts at the default radius with nothing else set', () => {
    expect(emptyFilters()).toMatchObject({ radiusKm: DEFAULT_RADIUS_KM, client: '', keyword: '', sort: 'nearest' })
    expect(RADIUS_MIN_KM).toBe(1)
  })
})

describe('filterMarketplace', () => {
  it('adds the distance and keeps posts inside the radius', () => {
    const result = filterMarketplace(jobs, all({ radiusKm: 10 }), makati)
    expect(result.map((r) => r.job.id)).toEqual(['near', 'pasig', 'nopin'])
    expect(result[0].distanceKm).toBeLessThan(1)
  })
  it('keeps posts with no pin but shows their distance as unknown, and lists them last when sorting by nearest', () => {
    const result = filterMarketplace(jobs, all(), makati)
    expect(result[result.length - 1].job.id).toBe('nopin')
    expect(result[result.length - 1].distanceKm).toBeNull()
  })
  it('without a pinned location no radius is applied and distance is unknown', () => {
    const result = filterMarketplace(jobs, all({ radiusKm: 1 }), null)
    expect(result.length).toBe(4)
    expect(result.every((r) => r.distanceKm === null)).toBe(true)
  })
  it('client name search (typed text, any case)', () => {
    expect(filterMarketplace(jobs, all({ client: 'maria' }), null).map((r) => r.job.id)).toEqual(['pasig'])
  })
  it('keyword search in title and description', () => {
    expect(filterMarketplace(jobs, all({ keyword: 'CLINIC' }), null).map((r) => r.job.id)).toEqual(['cebu'])
  })
  it('date range', () => {
    expect(filterMarketplace(jobs, all({ dateFrom: '2026-10-27', dateTo: '2026-10-31' }), null).map((r) => r.job.id).sort()).toEqual(['cebu', 'pasig'])
  })
  it('time of day range on the start time', () => {
    expect(filterMarketplace(jobs, all({ timeFrom: '07:00', timeTo: '12:00' }), null).map((r) => r.job.id).sort()).toEqual(['nopin', 'pasig'])
  })
  it('rate range', () => {
    expect(filterMarketplace(jobs, all({ rateMin: '500', rateMax: '800' }), null).map((r) => r.job.id).sort()).toEqual(['cebu', 'nopin'])
  })
  it('duration range', () => {
    expect(filterMarketplace(jobs, all({ durationMin: '4' }), null).map((r) => r.job.id)).toEqual(['pasig'])
  })
  it('area (city)', () => {
    expect(filterMarketplace(jobs, all({ city: 'Pasig City' }), null).map((r) => r.job.id).sort()).toEqual(['nopin', 'pasig'])
  })
  it('sorts by highest rate, soonest and newest', () => {
    expect(filterMarketplace(jobs, all({ sort: 'rate' }), null).map((r) => r.job.id)).toEqual(['pasig', 'cebu', 'nopin', 'near'])
    expect(filterMarketplace(jobs, all({ sort: 'soonest' }), null).map((r) => r.job.id)).toEqual(['near', 'pasig', 'cebu', 'nopin'])
    expect(filterMarketplace(jobs, all({ sort: 'newest' }), null).map((r) => r.job.id)).toEqual(['nopin', 'cebu', 'pasig', 'near'])
  })
  it('ignores range fields that are not numbers', () => {
    expect(filterMarketplace(jobs, all({ rateMin: 'abc' }), null).length).toBe(4)
  })
})
