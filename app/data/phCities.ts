// Philippine cities for the location fallback list (plan D5: if the map
// cannot load, choose a city). Coordinates are APPROXIMATE city centres,
// for the demo's straight-line distances only.
import type { PinnedLocation } from './mockUsers'

export const PH_CITIES: readonly PinnedLocation[] = [
  { label: 'Bacolod City', lat: 10.6765, lng: 122.9509 },
  { label: 'Baguio City', lat: 16.4023, lng: 120.596 },
  { label: 'Butuan City', lat: 8.9475, lng: 125.5406 },
  { label: 'Cagayan de Oro City', lat: 8.4542, lng: 124.6319 },
  { label: 'Cebu City', lat: 10.3157, lng: 123.8854 },
  { label: 'Davao City', lat: 7.1907, lng: 125.4553 },
  { label: 'Iloilo City', lat: 10.7202, lng: 122.5621 },
  { label: 'Makati City', lat: 14.5547, lng: 121.0244 },
  { label: 'Manila', lat: 14.5995, lng: 120.9842 },
  { label: 'Pasig City', lat: 14.5764, lng: 121.0851 },
  { label: 'Quezon City', lat: 14.676, lng: 121.0437 },
  { label: 'Taguig City', lat: 14.5176, lng: 121.0509 },
  { label: 'Zamboanga City', lat: 6.9214, lng: 122.079 },
]
