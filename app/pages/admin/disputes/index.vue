<!--
  /admin/disputes [F-15] — dispute list and "Open a dispute" form
  (Wave 4.6). Plan D12 (flow not stated by the user): disputes are opened
  by an admin on a booking; Open / Resolved; notes on the detail page.
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useDisputesStore } from '~/stores/disputes'
import { useJobsStore } from '~/stores/jobs'
import type { Dispute, DisputeParty } from '~/data/mockDisputes'
import type { TableColumn } from '~/components/SortableTable.vue'
import { formatDateTime } from '~/utils/format'
import { DISPUTE_PARTY_LABEL } from '~/utils/labels'

definePageMeta({ layout: 'app' })

const route = useRoute()
const session = useCurrentUserStore()
const disputes = useDisputesStore()
const jobs = useJobsStore()

const jobTitle = (jobId: string) => jobs.getById(jobId)?.title ?? jobId
const columns: TableColumn<Dispute>[] = [
  { key: 'title', label: 'Dispute', value: (d) => d.title },
  { key: 'job', label: 'Booking', value: (d) => jobTitle(d.jobId) },
  { key: 'raisedBy', label: 'Raised by', value: (d) => d.raisedByName },
  { key: 'opened', label: 'Opened', value: (d) => d.openedAt, type: 'date' },
  { key: 'notes', label: 'Notes', value: (d) => d.notes.length, type: 'num' },
  { key: 'status', label: 'Status', value: (d) => (d.status === 'open' ? 0 : 1) },
]

const preselected = typeof route.query.jobId === 'string' ? route.query.jobId : ''
const showForm = ref(preselected !== '')
const form = ref({ jobId: preselected, title: '', description: '', raisedByRole: 'client' as DisputeParty, raisedByName: '' })
const formError = ref('')
const created = ref<string | null>(null)


async function onSubmit() {
  formError.value = ''
  if (!form.value.raisedByName.trim()) {
    formError.value = 'Enter the name of the person who raised it.'
  } else {
    const result = disputes.createDispute({ ...form.value, raisedByName: form.value.raisedByName.trim() }, session.currentUser)
    if (result.ok) {
      created.value = result.id ?? null
      showForm.value = false
      form.value = { jobId: '', title: '', description: '', raisedByRole: 'client', raisedByName: '' }
      return
    }
    formError.value = result.error
  }
  await nextTick()
  document.getElementById('dispute-form-error')?.focus()
}
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Disputes" :subtitle="`${disputes.disputes.filter((d) => d.status === 'open').length} open.`">
      <template #actions>
        <button type="button" class="btn btn--primary" :aria-expanded="showForm ? 'true' : 'false'" aria-controls="dispute-form" @click="showForm = !showForm">
          Open a dispute
        </button>
      </template>
    </PageHeader>

    <p v-if="created" class="message message--ok" role="status">
      Dispute opened. <NuxtLink :to="`/admin/disputes/${created}`" class="link">Open it to add notes</NuxtLink>
    </p>

    <form v-if="showForm" id="dispute-form" class="card dispute-form" novalidate @submit.prevent="onSubmit">
      <h2 class="card__title">Open a dispute on a booking</h2>
      <p v-if="formError" id="dispute-form-error" class="message message--error" role="alert" tabindex="-1">{{ formError }}</p>
      <div class="field">
        <label for="dispute-job" class="field__label">Booking</label>
        <select id="dispute-job" v-model="form.jobId" class="field__input" required>
          <option value="">Choose a booking…</option>
          <option v-for="b in jobs.bookings" :key="b.id" :value="b.id">{{ b.title }} ({{ b.clientName }}, {{ b.date }})</option>
        </select>
      </div>
      <TextField id="dispute-title" v-model="form.title" label="Title" required />
      <div class="field">
        <label for="dispute-description" class="field__label">What happened</label>
        <textarea id="dispute-description" v-model="form.description" class="field__input" required />
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="dispute-party" class="field__label">Raised by</label>
          <select id="dispute-party" v-model="form.raisedByRole" class="field__input">
            <option v-for="(label, value) in DISPUTE_PARTY_LABEL" :key="value" :value="value">{{ label }}</option>
          </select>
        </div>
        <TextField id="dispute-party-name" v-model="form.raisedByName" label="Their name" required />
      </div>
      <div><button type="submit" class="btn btn--primary">Open dispute</button></div>
    </form>

    <SortableTable
      :columns="columns"
      :rows="disputes.disputes"
      :row-key="(d) => d.id"
      caption="All disputes."
      :initial-sort="{ key: 'status', direction: 'asc' }"
      empty-text="No disputes."
    >
      <template #cell-title="{ row }"><NuxtLink :to="`/admin/disputes/${row.id}`" class="link">{{ row.title }}</NuxtLink></template>
      <template #cell-job="{ row }"><NuxtLink :to="`/admin/jobs/${row.jobId}`" class="link">{{ jobTitle(row.jobId) }}</NuxtLink></template>
      <template #cell-raisedBy="{ row }">{{ row.raisedByName }} ({{ DISPUTE_PARTY_LABEL[row.raisedByRole] }})</template>
      <template #cell-opened="{ row }">{{ formatDateTime(row.openedAt) }}</template>
      <template #cell-status="{ row }"><StatusBadge kind="dispute" :value="row.status" /></template>
    </SortableTable>
  </div>
</template>

<style scoped>
.dispute-form { display: flex; flex-direction: column; gap: 16px; max-width: 760px; }
</style>
