// Wave 6.3 [F-22, F-23, F-23a] — marketplace search, filters and sort.
// Pure: the page passes the posts the cleaner may see (plan D4) and the
// cleaner's pinned location. Distance is a straight line (plan D5).
// Radius 1 to 50 km, default 25 km: placeholders (Q20 unconfirmed).
// "Slots left", "type of place" and "supplies provided" (F-23a) are not
// filters here: job posts have no such fields.
import { haversineKm, type LatLng } from './distance'

export const RADIUS_MIN_KM = 1
export const RADIUS_MAX_KM = 50
export const DEFAULT_RADIUS_KM = 25

export const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'rate', label: 'Highest rate' },
  { value: 'soonest', label: 'Soonest' },
  { value: 'newest', label: 'Newest' },
] as const
export type SortOption = (typeof SORT_OPTIONS)[number]['value']

export interface MarketplaceFilters {
  radiusKm: number
  client: string
  keyword: string
  city: string
  dateFrom: string
  dateTo: string
  timeFrom: string
  timeTo: string
  rateMin: string
  rateMax: string
  durationMin: string
  durationMax: string
  sort: SortOption
}

export function emptyFilters(): MarketplaceFilters {
  return {
    radiusKm: DEFAULT_RADIUS_KM, client: '', keyword: '', city: '', dateFrom: '', dateTo: '', timeFrom: '', timeTo: '',
    rateMin: '', rateMax: '', durationMin: '', durationMax: '', sort: 'nearest',
  }
}

interface JobLike {
  title: string; description: string; clientName: string; city: string; date: string; startTime: string
  ratePhp: number; durationHours: number; postedAt: string; lat: number | null; lng: number | null
}

export interface MarketplaceResult<J> { job: J; distanceKm: number | null }

// Empty or non-numeric range fields mean "no limit".
function asNumber(value: string | number): number | null {
  const text = String(value ?? '').trim()
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

function inRange(value: number, min: string, max: string): boolean {
  const low = asNumber(min)
  const high = asNumber(max)
  return (low === null || value >= low) && (high === null || value <= high)
}

const BY_SORT: Record<SortOption, (a: MarketplaceResult<JobLike>, b: MarketplaceResult<JobLike>) => number> = {
  nearest: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  rate: (a, b) => b.job.ratePhp - a.job.ratePhp,
  soonest: (a, b) => (a.job.date + a.job.startTime).localeCompare(b.job.date + b.job.startTime),
  newest: (a, b) => b.job.postedAt.localeCompare(a.job.postedAt),
}

export function filterMarketplace<J extends JobLike>(jobs: J[], filters: MarketplaceFilters, origin: LatLng | null): MarketplaceResult<J>[] {
  const client = filters.client.trim().toLowerCase()
  const keyword = filters.keyword.trim().toLowerCase()
  return jobs
    .map((job) => ({
      job,
      distanceKm: origin && job.lat !== null && job.lng !== null ? haversineKm(origin, { lat: job.lat, lng: job.lng }) : null,
    }))
    .filter(({ job, distanceKm }) =>
      (distanceKm === null || distanceKm <= filters.radiusKm) &&
      (!client || job.clientName.toLowerCase().includes(client)) &&
      (!keyword || `${job.title} ${job.description}`.toLowerCase().includes(keyword)) &&
      (!filters.city || job.city === filters.city) &&
      (!filters.dateFrom || job.date >= filters.dateFrom) &&
      (!filters.dateTo || job.date <= filters.dateTo) &&
      (!filters.timeFrom || job.startTime >= filters.timeFrom) &&
      (!filters.timeTo || job.startTime <= filters.timeTo) &&
      inRange(job.ratePhp, filters.rateMin, filters.rateMax) &&
      inRange(job.durationHours, filters.durationMin, filters.durationMax),
    )
    .sort(BY_SORT[filters.sort] as (a: MarketplaceResult<J>, b: MarketplaceResult<J>) => number)
}
