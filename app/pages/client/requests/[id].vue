<!--
  /client/requests/[id] [F-09 to F-11] — one request (Wave 3.3).
  Edit while pending (F-10); cancel while pending or approved with an
  in-page confirm (F-11). Rules from plan D10 (unconfirmed).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useRequestsStore } from '~/stores/requests'
import { useJobsStore } from '~/stores/jobs'
import type { PinnedLocation } from '~/data/mockUsers'
import type { RequestFormValues } from '~/utils/requestForm'
import { formatDateLong, formatDateTime, formatPeso, formatTime12h } from '~/utils/format'

definePageMeta({ layout: 'app' })

const route = useRoute()
const session = useCurrentUserStore()
const requests = useRequestsStore()
const jobs = useJobsStore()

const id = computed(() => String(route.params.id))
// A client only ever sees their own requests.
const request = computed(() => {
  const found = requests.getById(id.value)
  return found && found.clientEmail === session.currentUser?.email ? found : undefined
})
const job = computed(() => (request.value?.jobId ? jobs.getById(request.value.jobId) : undefined))

useHead(() => ({ title: `${request.value?.title ?? 'Request not found'} | CleanLinis` }))

const editing = ref(false)
const confirmingCancel = ref(false)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

const canEdit = computed(() => request.value?.status === 'pending')
const canCancel = computed(() => request.value?.status === 'pending' || request.value?.status === 'approved')

const formInitial = computed<Partial<RequestFormValues>>(() => {
  const r = request.value
  if (!r) return {}
  return { title: r.title, description: r.description, date: r.date, startTime: r.startTime, endTime: r.endTime, barangay: r.barangay, city: r.city, ratePhp: String(r.ratePhp) }
})
const formPin = computed<PinnedLocation | null>(() => {
  const r = request.value
  return r && r.lat !== null && r.lng !== null ? { lat: r.lat, lng: r.lng, label: `Pinned near ${r.city}` } : null
})

function onSave(values: RequestFormValues, pin: PinnedLocation | null) {
  const result = requests.updateRequest(
    id.value,
    {
      title: values.title.trim(), description: values.description.trim(), date: values.date,
      startTime: values.startTime, endTime: values.endTime, barangay: values.barangay.trim(), city: values.city.trim(),
      lat: pin?.lat ?? null, lng: pin?.lng ?? null, ratePhp: Number(values.ratePhp),
    },
    session.currentUser,
  )
  message.value = result.ok ? { kind: 'ok', text: 'Changes saved.' } : { kind: 'error', text: result.error }
  if (result.ok) editing.value = false
}

function onCancelRequest() {
  const result = requests.cancelRequest(id.value, session.currentUser)
  confirmingCancel.value = false
  message.value = result.ok ? { kind: 'ok', text: 'Request cancelled.' } : { kind: 'error', text: result.error }
}
</script>

<template>
  <div class="page-stack">
    <p><NuxtLink to="/client/requests" class="link">← Back to my requests</NuxtLink></p>

    <template v-if="!request">
      <PageHeader title="Request not found" />
      <p class="card">There is no request with the id <code>{{ id }}</code> in your account.</p>
    </template>

    <template v-else>
      <PageHeader :title="request.title">
        <template #actions>
          <button v-if="canEdit && !editing" type="button" class="btn btn--secondary" @click="editing = true">Edit request</button>
          <button v-if="canCancel && !editing" type="button" class="btn btn--secondary" @click="confirmingCancel = true">Cancel request</button>
        </template>
      </PageHeader>

      <p><StatusBadge kind="request" :value="request.status" /></p>

      <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">
        {{ message.text }}
      </p>

      <ConfirmPanel
        :open="confirmingCancel"
        title="Cancel this request?"
        confirm-label="Yes, cancel request"
        cancel-label="Keep request"
        @confirm="onCancelRequest"
        @cancel="confirmingCancel = false"
      >
        <p v-if="request.status === 'approved'">The job post made from this request will be archived. If a cleaner is already assigned, the cancel is not possible here.</p>
        <p v-else>The admin will no longer review it.</p>
      </ConfirmPanel>

      <ClientRequestForm
        v-if="editing"
        submit-label="Save changes"
        :initial="formInitial"
        :initial-pin="formPin"
        @submit="onSave"
        @cancel="editing = false"
      />

      <div v-else class="request-grid">
        <section class="card">
          <h2 class="card__title">Request details</h2>
          <dl class="info-list">
            <div class="info-list__row"><dt>Date</dt><dd>{{ formatDateLong(request.date) }}</dd></div>
            <div class="info-list__row"><dt>Time</dt><dd>{{ formatTime12h(request.startTime) }} to {{ formatTime12h(request.endTime) }}</dd></div>
            <div class="info-list__row"><dt>Duration</dt><dd>{{ request.durationHours }} hours</dd></div>
            <div class="info-list__row"><dt>Area</dt><dd>{{ request.barangay }}, {{ request.city }}</dd></div>
            <div class="info-list__row"><dt>Map pin</dt><dd>{{ request.lat !== null ? 'Pinned' : 'No pin' }}</dd></div>
            <div class="info-list__row"><dt>Proposed rate</dt><dd>{{ formatPeso(request.ratePhp) }}</dd></div>
            <div class="info-list__row"><dt>Sent</dt><dd>{{ formatDateTime(request.createdAt) }}</dd></div>
            <div class="info-list__row"><dt>Last change</dt><dd>{{ formatDateTime(request.updatedAt) }}</dd></div>
          </dl>
          <h3 class="request-subtitle">Task description</h3>
          <p class="request-description">{{ request.description }}</p>
        </section>

        <section class="card">
          <h2 class="card__title">Job post</h2>
          <template v-if="job">
            <p>The admin approved this request and it was posted for cleaners.</p>
            <dl class="info-list">
              <div class="info-list__row"><dt>Job status</dt><dd><StatusBadge kind="job" :value="job.status" /></dd></div>
              <div class="info-list__row"><dt>Cleaner</dt><dd>{{ job.assignedCleanerId ? 'Assigned' : 'Not assigned yet' }}</dd></div>
              <div v-if="job.archivedAt" class="info-list__row"><dt>Post</dt><dd>Archived</dd></div>
            </dl>
          </template>
          <p v-else-if="request.status === 'pending'" class="muted">Waiting for the admin to review it.</p>
          <p v-else class="muted">No job post was made from this request.</p>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.request-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 900px) { .request-grid { grid-template-columns: 1fr; } }
.request-subtitle { margin: 16px 0 6px; font-size: 14px; font-weight: 700; }
.request-description { margin: 0; font-size: 14px; line-height: 1.6; }
</style>
