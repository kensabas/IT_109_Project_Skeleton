// Wave 6.4 [F-24] — map pin helpers.
import { describe, it, expect } from 'vitest'
import { isInPhilippines, pinFromMap } from '../app/utils/pins'

describe('isInPhilippines', () => {
  it('accepts Makati and Butuan, refuses Singapore and Tokyo', () => {
    expect(isInPhilippines({ lat: 14.5547, lng: 121.0244 })).toBe(true)
    expect(isInPhilippines({ lat: 8.9475, lng: 125.5406 })).toBe(true)
    expect(isInPhilippines({ lat: 1.3521, lng: 103.8198 })).toBe(false)
    expect(isInPhilippines({ lat: 35.6762, lng: 139.6503 })).toBe(false)
  })
})

describe('pinFromMap', () => {
  it('rounds to 4 decimals and names the nearest listed city', () => {
    expect(pinFromMap({ lat: 14.56501234, lng: 121.03109876 })).toEqual({ lat: 14.565, lng: 121.0311, label: 'Map pin near Makati City' })
  })
})
