<!--
  /cleaner/marketplace [F-21, F-22, F-23, F-23a, F-27, F-28] — open job
  posts for this cleaner (plan D4: posts they applied to are under My
  applications), with distance from their pin (plan D5), search, filters
  and sort. Each card shows the F-28 fields: task description, rate,
  distance, duration, client name (plus date, time and area).
-->
<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useApplicationsStore } from '~/stores/applications'
import { placeLabel } from '~/data/mockJobs'
import { emptyFilters, filterMarketplace, RADIUS_MAX_KM, RADIUS_MIN_KM, SORT_OPTIONS } from '~/utils/marketplace'
import { formatDateShort, formatPeso, formatTime12h } from '~/utils/format'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const applications = useApplicationsStore()

const pin = computed(() => session.currentUser?.pinnedLocation ?? null)
const visible = computed(() => applications.marketplaceFor(session.currentUser?.email ?? ''))
const cities = computed(() => [...new Set(visible.value.map((j) => j.city))].sort())
const filters = reactive(emptyFilters())
const results = computed(() => filterMarketplace(visible.value, filters, pin.value))

// On phones the long filter panel starts closed so the job posts are in view.
const WIDE_SCREEN = '(min-width: 700px)'
const filtersOpenAtStart = window.matchMedia(WIDE_SCREEN).matches
const activeFilterCount = computed(() => {
  const start = emptyFilters()
  return (Object.keys(start) as (keyof typeof start)[]).filter((k) => k !== 'sort' && filters[k] !== start[k]).length
})

function clearAll() {
  Object.assign(filters, emptyFilters())
}

function distanceText(km: number | null): string {
  if (km === null) return pin.value ? 'Distance unknown (no map pin on this post)' : 'Distance unknown'
  return km < 1 ? 'Less than 1 km away' : `${km.toFixed(1)} km away`
}
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Marketplace" subtitle="Job posts you can apply to. Posts you applied to move to My applications." />
    <CleanerApprovalNotice />

    <p v-if="!pin" class="message message--info" role="status">
      Pin your location to see how far each job is. <NuxtLink to="/cleaner/location" class="link">Pin my location</NuxtLink>
    </p>
    <p v-else class="pin-line">Distances from <strong>{{ pin.label }}</strong> (straight line). <NuxtLink to="/cleaner/location" class="link">Change</NuxtLink></p>

    <details class="card filters" :open="filtersOpenAtStart">
      <summary class="filters__summary">Search and filters<span v-if="activeFilterCount"> ({{ activeFilterCount }} in use)</span></summary>
      <form class="filters__grid" @submit.prevent>
        <div class="field filters__radius">
          <label for="f-radius" class="field__label">Within {{ filters.radiusKm }} km of my pin</label>
          <input id="f-radius" v-model.number="filters.radiusKm" type="range" :min="RADIUS_MIN_KM" :max="RADIUS_MAX_KM" step="1" :disabled="!pin"
            :aria-valuetext="`${filters.radiusKm} kilometres`" />
          <p v-if="!pin" class="field__hint">Needs a pinned location.</p>
        </div>
        <div class="field"><label for="f-client" class="field__label">Client</label><input id="f-client" v-model="filters.client" type="search" class="field__input" /></div>
        <div class="field"><label for="f-keyword" class="field__label">Keyword in the task</label><input id="f-keyword" v-model="filters.keyword" type="search" class="field__input" /></div>
        <div class="field">
          <label for="f-city" class="field__label">Area (city)</label>
          <select id="f-city" v-model="filters.city" class="field__input"><option value="">All areas</option><option v-for="c in cities" :key="c" :value="c">{{ c }}</option></select>
        </div>
        <div class="field"><label for="f-date-from" class="field__label">Date from</label><input id="f-date-from" v-model="filters.dateFrom" type="date" class="field__input" /></div>
        <div class="field"><label for="f-date-to" class="field__label">Date to</label><input id="f-date-to" v-model="filters.dateTo" type="date" class="field__input" /></div>
        <div class="field"><label for="f-time-from" class="field__label">Starts from</label><input id="f-time-from" v-model="filters.timeFrom" type="time" class="field__input" /></div>
        <div class="field"><label for="f-time-to" class="field__label">Starts by</label><input id="f-time-to" v-model="filters.timeTo" type="time" class="field__input" /></div>
        <div class="field"><label for="f-rate-min" class="field__label">Rate from (PHP)</label><input id="f-rate-min" v-model="filters.rateMin" type="number" min="0" class="field__input" /></div>
        <div class="field"><label for="f-rate-max" class="field__label">Rate up to (PHP)</label><input id="f-rate-max" v-model="filters.rateMax" type="number" min="0" class="field__input" /></div>
        <div class="field"><label for="f-dur-min" class="field__label">Duration from (hours)</label><input id="f-dur-min" v-model="filters.durationMin" type="number" min="0" step="0.5" class="field__input" /></div>
        <div class="field"><label for="f-dur-max" class="field__label">Duration up to (hours)</label><input id="f-dur-max" v-model="filters.durationMax" type="number" min="0" step="0.5" class="field__input" /></div>
        <div class="field">
          <label for="f-sort" class="field__label">Sort by</label>
          <select id="f-sort" v-model="filters.sort" class="field__input"><option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option></select>
        </div>
        <div class="filters__clear"><button type="button" class="btn btn--secondary" @click="clearAll">Clear all filters</button></div>
      </form>
    </details>

    <p class="results-count" role="status">{{ results.length }} job post{{ results.length === 1 ? '' : 's' }} found.</p>

    <ul v-if="results.length" class="jobs">
      <li v-for="{ job, distanceKm } in results" :key="job.id" class="card job">
        <div class="job__head">
          <h2 class="job__title"><NuxtLink :to="`/cleaner/jobs/${job.id}`" class="link">{{ job.title }}</NuxtLink></h2>
          <p class="job__rate">{{ formatPeso(job.ratePhp) }}</p>
        </div>
        <p class="job__client">{{ job.clientName }}</p>
        <dl class="job__facts">
          <div><dt>Distance</dt><dd>{{ distanceText(distanceKm) }}</dd></div>
          <div><dt>When</dt><dd>{{ formatDateShort(job.date) }}, {{ formatTime12h(job.startTime) }} to {{ formatTime12h(job.endTime) }}</dd></div>
          <div><dt>Duration</dt><dd>{{ job.durationHours }} hours</dd></div>
          <div><dt>Area</dt><dd>{{ placeLabel(job) }}</dd></div>
        </dl>
        <p class="job__desc">{{ job.description }}</p>
        <NuxtLink :to="`/cleaner/jobs/${job.id}`" class="btn btn--secondary btn--small job__open">View and apply<span class="visually-hidden">: {{ job.title }}</span></NuxtLink>
      </li>
    </ul>
    <p v-else class="card muted">No job posts match. Try a bigger radius or <button type="button" class="btn btn--secondary btn--small" @click="clearAll">clear all filters</button>.</p>
  </div>
</template>

<style scoped>
.pin-line { margin: 0; font-size: 14px; color: var(--color-text-soft); }
.filters { padding: 16px; }
.filters__summary { cursor: pointer; font-weight: 700; font-size: 15px; }
.filters__grid { margin-top: 14px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; align-items: end; }
.filters__radius { grid-column: 1 / -1; max-width: 520px; }
.filters__radius input[type='range'] { width: 100%; accent-color: var(--color-teal); min-height: 32px; }
.results-count { margin: 0; font-size: 14px; font-weight: 600; }
.jobs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.job { display: flex; flex-direction: column; gap: 8px; padding: 18px; }
.job__head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
.job__title { margin: 0; font-size: 17px; font-weight: 800; }
.job__rate { margin: 0; font-size: 18px; font-weight: 800; color: var(--color-text); white-space: nowrap; }
.job__client { margin: 0; font-size: 14px; color: var(--color-text-soft); }
.job__facts { margin: 0; display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 14px; }
.job__facts div { display: flex; gap: 8px; }
.job__facts dt { min-width: 76px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-soft); padding-top: 2px; }
.job__facts dd { margin: 0; }
.job__desc { margin: 0; font-size: 14px; line-height: 1.5; }
.job__open { align-self: flex-start; }
@media (max-width: 400px) { .jobs { grid-template-columns: 1fr; } }
</style>
