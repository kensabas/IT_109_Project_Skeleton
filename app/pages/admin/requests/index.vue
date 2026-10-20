<!--
  /admin/requests [F-12, F-13] — every client request (Wave 4.1).
  Approve or reject pending requests with an in-page confirm that shows
  the full request. Approving publishes the job post (F-13) and links to it.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useRequestsStore } from '~/stores/requests'
import type { ClientRequest } from '~/data/mockRequests'
import type { TableColumn } from '~/components/SortableTable.vue'
import { formatDateShort, formatDateTime, formatPeso, formatTime12h } from '~/utils/format'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const requests = useRequestsStore()

const showOnlyPending = ref(false)
const rows = computed(() => (showOnlyPending.value ? requests.requests.filter((r) => r.status === 'pending') : requests.requests))
const pendingCount = computed(() => requests.requests.filter((r) => r.status === 'pending').length)

const REQUEST_RANK: Record<string, number> = { pending: 0, approved: 1, rejected: 2, cancelled: 3 }
const columns: TableColumn<ClientRequest>[] = [
  { key: 'title', label: 'Request', value: (r) => r.title },
  { key: 'client', label: 'Client', value: (r) => r.clientName },
  { key: 'date', label: 'Job date', value: (r) => r.date + r.startTime, type: 'date' },
  { key: 'area', label: 'Area', value: (r) => `${r.city} ${r.barangay}` },
  { key: 'rate', label: 'Rate', value: (r) => r.ratePhp, type: 'num' },
  { key: 'sent', label: 'Received', value: (r) => r.createdAt, type: 'date' },
  { key: 'status', label: 'Status', value: (r) => REQUEST_RANK[r.status] },
  { key: 'actions', label: 'Actions', value: () => null, sortable: false },
]

type Decision = 'approve' | 'reject'
const pending = ref<{ request: ClientRequest; decision: Decision } | null>(null)
const message = ref<{ kind: 'ok' | 'error'; text: string; jobId?: string } | null>(null)

function ask(request: ClientRequest, decision: Decision) {
  message.value = null
  pending.value = { request, decision }
}

function confirm() {
  if (!pending.value) return
  const { request, decision } = pending.value
  if (decision === 'approve') {
    const result = requests.approveRequest(request.id, session.currentUser)
    message.value = result.ok
      ? { kind: 'ok', text: `Approved "${request.title}". The job post was published.`, jobId: result.jobId }
      : { kind: 'error', text: result.error }
  } else {
    const result = requests.rejectRequest(request.id, session.currentUser)
    message.value = result.ok ? { kind: 'ok', text: `Rejected "${request.title}".` } : { kind: 'error', text: result.error }
  }
  pending.value = null
}
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Client requests" :subtitle="`${pendingCount} waiting for review.`" />

    <label class="inline-check">
      <input v-model="showOnlyPending" type="checkbox" />
      <span>Show only pending requests</span>
    </label>

    <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">
      {{ message.text }}
      <NuxtLink v-if="message.jobId" :to="`/admin/jobs/${message.jobId}`" class="link">Open the job post</NuxtLink>
    </p>

    <ConfirmPanel
      :open="pending !== null"
      :title="pending?.decision === 'approve' ? 'Approve this request?' : 'Reject this request?'"
      :confirm-label="pending?.decision === 'approve' ? 'Yes, approve and publish' : 'Yes, reject'"
      @confirm="confirm"
      @cancel="pending = null"
    >
      <template v-if="pending">
        <p><strong>{{ pending.request.title }}</strong> for {{ pending.request.clientName }}</p>
        <p>{{ formatDateShort(pending.request.date) }}, {{ formatTime12h(pending.request.startTime) }} to {{ formatTime12h(pending.request.endTime) }} ({{ pending.request.durationHours }} hours) · {{ pending.request.barangay }}, {{ pending.request.city }} · {{ formatPeso(pending.request.ratePhp) }}</p>
        <p>{{ pending.request.description }}</p>
        <p v-if="pending.decision === 'approve'">Approving publishes it as a job post for cleaners.</p>
      </template>
    </ConfirmPanel>

    <SortableTable
      :columns="columns"
      :rows="rows"
      :row-key="(r) => r.id"
      caption="All client requests."
      :initial-sort="{ key: 'status', direction: 'asc' }"
      :min-width="980"
      empty-text="No requests to show."
    >
      <template #cell-title="{ row }">
        <div class="row-request">
          <strong>{{ row.title }}</strong>
          <p class="row-description">{{ row.description }}</p>
        </div>
      </template>
      <template #cell-date="{ row }">{{ formatDateShort(row.date) }}<br /><span class="row-soft">{{ formatTime12h(row.startTime) }} to {{ formatTime12h(row.endTime) }}</span></template>
      <template #cell-area="{ row }">{{ row.barangay }}, {{ row.city }}</template>
      <template #cell-rate="{ row }">{{ formatPeso(row.ratePhp) }}</template>
      <template #cell-sent="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #cell-status="{ row }">
        <StatusBadge kind="request" :value="row.status" />
        <NuxtLink v-if="row.jobId" :to="`/admin/jobs/${row.jobId}`" class="link row-link">Job post</NuxtLink>
      </template>
      <template #cell-actions="{ row }">
        <div v-if="row.status === 'pending'" class="row-actions">
          <button type="button" class="btn btn--primary btn--small" :aria-label="`Approve ${row.title}`" @click="ask(row, 'approve')">Approve</button>
          <button type="button" class="btn btn--secondary btn--small" :aria-label="`Reject ${row.title}`" @click="ask(row, 'reject')">Reject</button>
        </div>
        <span v-else class="muted">No action</span>
      </template>
    </SortableTable>
  </div>
</template>

<style scoped>
.row-request { min-width: 260px; }
.row-description { margin: 4px 0 0; font-size: 13px; color: var(--color-text-soft); max-width: 320px; }
.row-soft { font-size: 13px; color: var(--color-text-soft); }
.row-link { display: block; margin-top: 4px; font-size: 13px; }
.row-actions { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
