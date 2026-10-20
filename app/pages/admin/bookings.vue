<!--
  /admin/bookings [F-16] — bookings (Wave 4.7). Plan D11 (Q11
  unconfirmed): a booking is a live job post with an assigned cleaner.
-->
<script setup lang="ts">
import { useCurrentUserStore } from '~/stores/currentUser'
import { useJobsStore } from '~/stores/jobs'
import { placeLabel, type Job } from '~/data/mockJobs'
import type { TableColumn } from '~/components/SortableTable.vue'
import { formatDateShort, formatPeso, formatTime12h } from '~/utils/format'
import { STATUS_RANK } from '~/utils/sortRows'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const jobs = useJobsStore()
const cleanerName = (j: Job) => session.findByEmail(j.assignedCleanerId ?? '')?.name ?? j.assignedCleanerId

const columns: TableColumn<Job>[] = [
  { key: 'title', label: 'Job', value: (j) => j.title },
  { key: 'client', label: 'Client', value: (j) => j.clientName },
  { key: 'cleaner', label: 'Cleaner', value: (j) => cleanerName(j) },
  { key: 'date', label: 'Date', value: (j) => j.date + j.startTime, type: 'date' },
  { key: 'area', label: 'Area', value: (j) => placeLabel(j) },
  { key: 'rate', label: 'Rate', value: (j) => j.ratePhp, type: 'num' },
  { key: 'status', label: 'Status', value: (j) => STATUS_RANK[j.status] },
  { key: 'actions', label: 'Actions', value: () => null, sortable: false },
]
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Bookings" subtitle="Job posts that have an assigned cleaner." />
    <SortableTable
      :columns="columns"
      :rows="jobs.bookings"
      :row-key="(j) => j.id"
      caption="All bookings."
      :initial-sort="{ key: 'date', direction: 'desc' }"
      :min-width="980"
      empty-text="No bookings yet."
    >
      <template #cell-title="{ row }"><NuxtLink :to="`/admin/jobs/${row.id}`" class="link">{{ row.title }}</NuxtLink></template>
      <template #cell-cleaner="{ row }"><NuxtLink :to="`/admin/accounts/${encodeURIComponent(row.assignedCleanerId ?? '')}`" class="link">{{ cleanerName(row) }}</NuxtLink></template>
      <template #cell-date="{ row }">{{ formatDateShort(row.date) }}<br /><span class="soft">{{ formatTime12h(row.startTime) }} to {{ formatTime12h(row.endTime) }}</span></template>
      <template #cell-area="{ row }">{{ placeLabel(row) }}</template>
      <template #cell-rate="{ row }">{{ formatPeso(row.ratePhp) }}</template>
      <template #cell-status="{ row }"><StatusChip :status="row.status" /></template>
      <template #cell-actions="{ row }">
        <NuxtLink :to="{ path: '/admin/disputes', query: { jobId: row.id } }" class="link" :aria-label="`Open a dispute on ${row.title}`">Open a dispute</NuxtLink>
      </template>
    </SortableTable>
  </div>
</template>

<style scoped>
.soft { font-size: 13px; color: var(--color-text-soft); }
</style>
