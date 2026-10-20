<!--
  /cleaner/applications [F-26, F-27] — the cleaner's applications.
  Cancel while "Applied" (Q7 unconfirmed); a cancelled post goes back to
  the marketplace unless a cleaner was assigned (plan D4).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useApplicationsStore } from '~/stores/applications'
import { useJobsStore } from '~/stores/jobs'
import type { Application } from '~/data/mockApplications'
import type { TableColumn } from '~/components/SortableTable.vue'
import { formatDateShort, formatDateTime, formatPeso } from '~/utils/format'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const applications = useApplicationsStore()
const jobs = useJobsStore()

const rows = computed(() => applications.forCleaner(session.currentUser?.email ?? ''))
const jobOf = (a: Application) => jobs.getById(a.jobId)
const RANK: Record<string, number> = { applied: 0, accepted: 1, declined: 2, cancelled: 3 }
const columns: TableColumn<Application>[] = [
  { key: 'job', label: 'Job post', value: (a) => jobOf(a)?.title ?? a.jobId },
  { key: 'client', label: 'Client', value: (a) => jobOf(a)?.clientName ?? '' },
  { key: 'date', label: 'Job date', value: (a) => jobOf(a)?.date ?? '', type: 'date' },
  { key: 'rate', label: 'Rate', value: (a) => jobOf(a)?.ratePhp ?? null, type: 'num' },
  { key: 'applied', label: 'Applied', value: (a) => a.appliedAt, type: 'date' },
  { key: 'status', label: 'Status', value: (a) => RANK[a.status] },
  { key: 'actions', label: 'Actions', value: () => null, sortable: false },
]

const cancelling = ref<Application | null>(null)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)
function confirmCancel() {
  if (!cancelling.value) return
  const result = applications.cancel(cancelling.value.id, session.currentUser)
  message.value = result.ok ? { kind: 'ok', text: 'Application cancelled. The post is back in your marketplace if it is still open.' } : { kind: 'error', text: result.error }
  cancelling.value = null
}
</script>

<template>
  <div class="page-stack">
    <PageHeader title="My applications" subtitle="Job posts you applied to. The admin picks the cleaner from the applicants." />
    <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">{{ message.text }}</p>
    <ConfirmPanel :open="cancelling !== null" title="Cancel this application?" confirm-label="Yes, cancel application" cancel-label="Keep it" @confirm="confirmCancel" @cancel="cancelling = null">
      <p v-if="cancelling">{{ jobOf(cancelling)?.title }}. You can apply again later while the post is open.</p>
    </ConfirmPanel>
    <SortableTable :columns="columns" :rows="rows" :row-key="(a) => a.id" caption="Your applications." :initial-sort="{ key: 'status', direction: 'asc' }" :min-width="860" empty-text="You have not applied to any job posts yet.">
      <template #cell-job="{ row }"><NuxtLink :to="`/cleaner/jobs/${row.jobId}`" class="link">{{ jobOf(row)?.title ?? row.jobId }}</NuxtLink></template>
      <template #cell-date="{ row }">{{ jobOf(row) ? formatDateShort(jobOf(row)!.date) : '' }}</template>
      <template #cell-rate="{ row }">{{ jobOf(row) ? formatPeso(jobOf(row)!.ratePhp) : '' }}</template>
      <template #cell-applied="{ row }">{{ formatDateTime(row.appliedAt) }}</template>
      <template #cell-status="{ row }"><StatusBadge kind="application" :value="row.status" /></template>
      <template #cell-actions="{ row }">
        <button v-if="row.status === 'applied'" type="button" class="btn btn--secondary btn--small" :aria-label="`Cancel application for ${jobOf(row)?.title}`" @click="cancelling = row; message = null">Cancel</button>
        <span v-else class="muted">No action</span>
      </template>
    </SortableTable>
  </div>
</template>
