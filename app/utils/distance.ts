// Wave 2.5 [F-22, F-23] — straight-line distance (plan D5, Q4
// unconfirmed: not road distance). Haversine formula, Earth radius
// 6371 km (mean radius).

export interface LatLng { lat: number; lng: number }

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export interface WithDistance<T> { item: T; distanceKm: number }

export function withinRadius<T extends LatLng>(items: readonly T[], origin: LatLng, radiusKm: number): WithDistance<T>[] {
  return items
    .map((item) => ({ item, distanceKm: haversineKm(origin, item) }))
    .filter((entry) => entry.distanceKm <= radiusKm)
}
