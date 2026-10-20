// Wave 6.4 [F-24] — helpers for map pins (plan D5).
import type { PinnedLocation } from '../data/mockUsers'
import { PH_CITIES } from '../data/phCities'
import { haversineKm, type LatLng } from './distance'

// Rough bounding box of the Philippines (system is for the Philippines only).
const PH_BOUNDS = { south: 4.5, north: 21.5, west: 116, east: 127 }

export function isInPhilippines(point: LatLng): boolean {
  return point.lat > PH_BOUNDS.south && point.lat < PH_BOUNDS.north && point.lng > PH_BOUNDS.west && point.lng < PH_BOUNDS.east
}

// There is no address lookup in the mock, so a map pin is named after the
// nearest city in the list.
export function pinFromMap(point: LatLng): PinnedLocation {
  const nearest = PH_CITIES.reduce((best, city) => (haversineKm(point, city) < haversineKm(point, best) ? city : best))
  return {
    lat: Math.round(point.lat * 10000) / 10000,
    lng: Math.round(point.lng * 10000) / 10000,
    label: `Map pin near ${nearest.label}`,
  }
}
