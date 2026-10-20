<!--
  /admin/jobs [F-17, F-18, F-19] — admin job-posts list.
  Uses the shared SortableTable (F-08, Wave 1.6). Status is a StatusChip
  (text + colour). "Show archived" reveals soft-deleted posts (plan D3).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useJobsStore } from '~/stores/jobs'
import { useCurrentUserStore } from '~/stores/currentUser'
import type { Job } from '~/data/mockJobs'
import type { TableColumn } from '~/components/SortableTable.vue'
import { STATUS_RANK } from '~/utils/sortRows'
import { formatDateShort, formatPeso } from '~/utils/format'

definePageMeta({ layout: 'app' })

const jobs = useJobsStore()
const users = useCurrentUserStore()
const showArchived = ref(false)

function cleanerName(job: Job): string | null {
  if (!job.assignedCleanerId) return null
  return users.users.find((u) => u.email === job.assignedCleanerId)?.name ?? job.assignedCleanerId
}

const rows = computed(() => jobs.visibleJobs(showArchived.value))

const columns: TableColumn<Job>[] = [
  { key: 'title', label: 'Job', value: (j) => j.title },
  { key: 'client', label: 'Client', value: (j) => j.clientName },
  { key: 'date', label: 'Date', value: (j) => j.date, type: 'date' },
  { key: 'rate', label: 'Rate', value: (j) => j.ratePhp, type: 'num' },
  { key: 'cleaner', label: 'Cleaner', value: (j) => cleanerName(j) },
  { key: 'status', label: 'Status', value: (j) => STATUS_RANK[j.status] },
]
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Job posts" subtitle="Every job post, including those made from approved client requests." />

    <label class="inline-check">
      <input v-model="showArchived" type="checkbox" />
      <span>Show archived</span>
    </label>

    <SortableTable
      :columns="columns"
      :rows="rows"
      :row-key="(j) => j.id"
      caption="All job posts."
      :initial-sort="{ key: 'date', direction: 'desc' }"
    >
      <template #cell-title="{ row }">
        <NuxtLink :to="`/admin/jobs/${row.id}`" class="link">{{ row.title }}</NuxtLink>
        <span v-if="row.archivedAt" class="jobs-archived">Archived</span>
      </template>
      <template #cell-date="{ row }">{{ formatDateShort(row.date) }}</template>
      <template #cell-rate="{ row }">{{ formatPeso(row.ratePhp) }}</template>
      <template #cell-cleaner="{ row }">
        <span v-if="cleanerName(row)">{{ cleanerName(row) }}</span>
        <span v-else class="muted">Not assigned</span>
      </template>
      <template #cell-status="{ row }"><StatusChip :status="row.status" /></template>
      <template #empty>
        No job posts to show. Tick <strong>Show archived</strong> if you archived something.
      </template>
    </SortableTable>
  </div>
</template>

<style scoped>
.jobs-archived {
  margin-left: 8px;
  font-size: 12px;
  font-style: italic;
  color: var(--color-text-soft);
}
</style>
