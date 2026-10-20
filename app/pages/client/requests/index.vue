<!--
  /client/requests [F-09 to F-11] — the client's own requests (Wave 3.1).
  Sortable table (F-08) with status badges; each title opens the request.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useRequestsStore } from '~/stores/requests'
import { useJobsStore } from '~/stores/jobs'
import type { ClientRequest } from '~/data/mockRequests'
import type { TableColumn } from '~/components/SortableTable.vue'
import { formatDateShort, formatPeso, formatTime12h } from '~/utils/format'
import { STATUS_RANK } from '~/utils/sortRows'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const requests = useRequestsStore()
const jobs = useJobsStore()
const route = useRoute()

const rows = computed(() => requests.forClient(session.currentUser?.email ?? ''))
const jobFor = (r: ClientRequest) => (r.jobId ? jobs.getById(r.jobId) : undefined)

const REQUEST_RANK: Record<string, number> = { pending: 0, approved: 1, rejected: 2, cancelled: 3 }

const columns: TableColumn<ClientRequest>[] = [
  { key: 'title', label: 'Request', value: (r) => r.title },
  { key: 'date', label: 'Date', value: (r) => r.date + r.startTime, type: 'date' },
  { key: 'area', label: 'Area', value: (r) => `${r.city} ${r.barangay}` },
  { key: 'rate', label: 'Rate', value: (r) => r.ratePhp, type: 'num' },
  { key: 'status', label: 'Request status', value: (r) => REQUEST_RANK[r.status] },
  { key: 'job', label: 'Job status', value: (r) => { const j = jobFor(r); return j ? STATUS_RANK[j.status] : null } },
]
</script>

<template>
  <div class="page-stack">
    <PageHeader title="My requests" subtitle="Requests you sent to the CleanLinis admin.">
      <template #actions>
        <NuxtLink to="/client/requests/new" class="btn btn--primary">New request</NuxtLink>
      </template>
    </PageHeader>

    <p v-if="route.query.created" class="message message--ok" role="status">
      Request sent. The admin will review it.
    </p>

    <SortableTable
      :columns="columns"
      :rows="rows"
      :row-key="(r) => r.id"
      caption="Your requests."
      :initial-sort="{ key: 'date', direction: 'desc' }"
      empty-text="You have not sent any requests yet."
    >
      <template #cell-title="{ row }">
        <NuxtLink :to="`/client/requests/${row.id}`" class="link">{{ row.title }}</NuxtLink>
      </template>
      <template #cell-date="{ row }">
        {{ formatDateShort(row.date) }}<br />
        <span class="muted-time">{{ formatTime12h(row.startTime) }} to {{ formatTime12h(row.endTime) }}</span>
      </template>
      <template #cell-area="{ row }">{{ row.barangay }}, {{ row.city }}</template>
      <template #cell-rate="{ row }">{{ formatPeso(row.ratePhp) }}</template>
      <template #cell-status="{ row }"><StatusBadge kind="request" :value="row.status" /></template>
      <template #cell-job="{ row }">
        <StatusBadge v-if="jobFor(row)" kind="job" :value="jobFor(row)!.status" />
        <span v-else class="muted">No job post</span>
      </template>
    </SortableTable>
  </div>
</template>

<style scoped>
.muted-time { font-size: 13px; color: var(--color-text-soft); }
</style>
