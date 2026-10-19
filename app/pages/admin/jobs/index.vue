<!--
  /admin/jobs — F-17/18/19 Phase 3.
  Admin job-posts list. Column headers are buttons that sort the table;
  `aria-sort` on the matching `<th>` reflects the current column +
  direction. Status is a <StatusChip> (text + colour, not colour only).

  No route guard, no admin login yet — see needs_your_attention #4.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJobsStore } from '~/stores/jobs'
import { initialMockUsers, type MockUser } from '~/data/mockUsers'
import type { Job, JobStatus } from '~/data/mockJobs'
import {
  sortRows,
  toggleDirection,
  STATUS_RANK,
  type SortDirection,
} from '~/utils/sortRows'

type ColumnKey = 'title' | 'clientName' | 'date' | 'ratePhp' | 'cleaner' | 'status'

const jobs = useJobsStore()
const showArchived = ref(false)
const sortKey = ref<ColumnKey>('date')
const sortDir = ref<SortDirection>('desc')

// Phase-3 scope: look up cleaner display info from the mock users list
// (static — see mockUsers.ts) by matching email === assignedCleanerId.
const CLEANERS: MockUser[] = initialMockUsers()
function cleanerFor(job: Job): MockUser | undefined {
  if (!job.assignedCleanerId) return undefined
  return CLEANERS.find((u) => u.email === job.assignedCleanerId)
}
function cleanerLabel(job: Job): string {
  return cleanerFor(job)?.name ?? 'Not assigned'
}

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})
const dateLabel = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
function formatDate(iso: string): string {
  // Build with a safe midday timezone to avoid off-by-one day drift.
  return dateLabel.format(new Date(`${iso}T12:00:00+08:00`))
}

const rows = computed<Job[]>(() => {
  const visible = jobs.visibleJobs(showArchived.value)
  const asc = sortDir.value === 'asc'
  switch (sortKey.value) {
    case 'title':
      return sortRows(visible, (j) => j.title, sortDir.value)
    case 'clientName':
      return sortRows(visible, (j) => j.clientName, sortDir.value)
    case 'date':
      return sortRows(visible, (j) => j.date, sortDir.value)
    case 'ratePhp':
      return sortRows(visible, (j) => j.ratePhp, sortDir.value)
    case 'cleaner':
      // "Not assigned" always last: on asc use '￿', on desc use '' so
      // nulls still land at the end of the list.
      return sortRows(visible, (j) => cleanerLabel(j) === 'Not assigned' ? (asc ? '￿' : '') : cleanerFor(j)!.name, sortDir.value)
    case 'status':
      return sortRows(visible, (j) => STATUS_RANK[j.status], sortDir.value)
  }
})

function onHeaderClick(key: ColumnKey) {
  if (sortKey.value === key) {
    sortDir.value = toggleDirection(sortDir.value)
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}
function ariaSort(key: ColumnKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'title',      label: 'Job' },
  { key: 'clientName', label: 'Client' },
  { key: 'date',       label: 'Date' },
  { key: 'ratePhp',    label: 'Rate' },
  { key: 'cleaner',    label: 'Cleaner' },
  { key: 'status',     label: 'Status' },
]
</script>

<template>
  <div class="admin-shell">
    <header class="admin-shell__header">
      <div class="admin-shell__brand">
        <svg
          class="admin-shell__logo"
          width="28" height="28" viewBox="0 0 36 36"
          aria-hidden="true" focusable="false"
        >
          <rect x="0" y="0" width="36" height="36" rx="8" fill="var(--color-teal)" />
          <path d="M18 7 L20 16 L29 18 L20 20 L18 29 L16 20 L7 18 L16 16 Z" fill="#FFFFFF" />
          <circle cx="29" cy="29" r="3.5" fill="var(--color-accent)" />
        </svg>
        <span class="admin-shell__wordmark">CleanLinis</span>
        <span class="admin-shell__tag" aria-label="Admin area">Admin</span>
      </div>
      <p class="admin-shell__who">Signed in as Main admin</p>
    </header>

    <main class="admin-page">
      <h1 class="admin-page__title">Job posts</h1>

      <label class="admin-page__filter">
        <input type="checkbox" v-model="showArchived" />
        <span>Show archived</span>
      </label>

      <section class="jobs-card">
        <div class="jobs-card__scroll">
          <table class="jobs-table">
            <caption class="jobs-table__caption">All job posts, sortable.</caption>
            <thead>
              <tr>
                <th
                  v-for="col in COLUMNS" :key="col.key"
                  scope="col"
                  :aria-sort="ariaSort(col.key)"
                >
                  <button
                    type="button"
                    class="jobs-table__sort"
                    :class="{ 'jobs-table__sort--active': sortKey === col.key }"
                    @click="onHeaderClick(col.key)"
                  >
                    {{ col.label }}
                    <span class="jobs-table__arrow" aria-hidden="true">
                      <template v-if="sortKey === col.key">{{ sortDir === 'asc' ? '▲' : '▼' }}</template>
                      <template v-else>⇵</template>
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody v-if="rows.length > 0">
              <tr v-for="job in rows" :key="job.id">
                <td>
                  <NuxtLink :to="`/admin/jobs/${job.id}`" class="jobs-table__link">
                    {{ job.title }}
                  </NuxtLink>
                </td>
                <td>{{ job.clientName }}</td>
                <td class="jobs-table__date">{{ formatDate(job.date) }}</td>
                <td class="jobs-table__num">{{ peso.format(job.ratePhp) }}</td>
                <td>
                  <span v-if="cleanerFor(job)">{{ cleanerFor(job)!.name }}</span>
                  <span v-else class="jobs-table__muted">Not assigned</span>
                </td>
                <td>
                  <StatusChip :status="job.status" />
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td :colspan="COLUMNS.length" class="jobs-table__empty">
                  No job posts to show. Tick <strong>Show archived</strong> if you archived something.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.admin-shell__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  background-color: var(--color-card);
  border-bottom: 1px solid var(--color-card-border);
}

.admin-shell__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-shell__wordmark {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.admin-shell__tag {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-teal-dark);
  background-color: #D9F0EF;
  border: 1px solid rgba(11, 102, 101, 0.14);
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.admin-shell__who {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-soft);
}

.admin-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-page__title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.admin-page__filter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
  width: fit-content;
}
.admin-page__filter input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-teal);
}

.jobs-card {
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-lg);
  overflow: hidden;
}
.jobs-card__scroll {
  overflow-x: auto;
}

.jobs-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 14px;
}
.jobs-table__caption {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* Header row — tinted, uppercase micro-label, letter-spaced. */
.jobs-table thead th {
  position: relative;
  background-color: var(--color-table-head-bg);
  border-bottom: 1px solid var(--color-card-border);
  text-align: left;
  padding: 0;
  color: var(--color-text-soft);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
/* Current-sort column: thin teal accent underneath the th label. */
.jobs-table thead th[aria-sort="ascending"]::after,
.jobs-table thead th[aria-sort="descending"]::after {
  content: '';
  position: absolute;
  left: 16px; right: 16px; bottom: -1px;
  height: 2px;
  background-color: var(--color-teal);
  border-radius: 2px;
}

.jobs-table tbody td {
  padding: 16px;
  border-bottom: 1px solid var(--color-divider);
  color: var(--color-text);
  vertical-align: middle;
  transition: background-color 120ms ease;
}
.jobs-table tbody tr:last-child td {
  border-bottom: none;
}

/* Zebra stripes for calm scanning + hover highlight on top. */
.jobs-table tbody tr:nth-child(even) td {
  background-color: var(--color-row-stripe);
}
.jobs-table tbody tr:hover td,
.jobs-table tbody tr:focus-within td {
  background-color: var(--color-row-hover);
}

/* Tabular numerals so money + dates line up on the vertical. */
.jobs-table__num,
.jobs-table__date {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  white-space: nowrap;
}

.jobs-table__sort {
  all: unset;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px;
  width: 100%;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  transition: color 120ms ease;
}
.jobs-table__sort:hover {
  color: var(--color-text);
}
.jobs-table__sort:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: -2px;
}
.jobs-table__sort--active {
  color: var(--color-teal-dark);
}
.jobs-table__arrow {
  font-size: 10px;
  color: var(--color-text-soft);
}
.jobs-table__sort--active .jobs-table__arrow {
  color: var(--color-teal);
}

.jobs-table__link {
  color: var(--color-teal-dark);
  font-weight: 600;
  text-decoration: none;
  border-radius: 2px;
}
.jobs-table__link:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}
.jobs-table__link:hover {
  text-decoration: underline;
}
.jobs-table__muted {
  color: var(--color-text-soft);
  font-style: italic;
}
.jobs-table__empty {
  padding: 48px 16px;
  text-align: center;
  color: var(--color-text-soft);
}

@media (max-width: 640px) {
  .admin-page {
    padding: 16px;
  }
}
</style>
