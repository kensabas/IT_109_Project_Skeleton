<!--
  /admin/disputes/[id] [F-15] — dispute details, notes, resolve (Wave 4.6).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useDisputesStore } from '~/stores/disputes'
import { useJobsStore } from '~/stores/jobs'
import { formatDateShort, formatDateTime } from '~/utils/format'

definePageMeta({ layout: 'app' })

const route = useRoute()
const session = useCurrentUserStore()
const disputes = useDisputesStore()
const jobs = useJobsStore()

const id = computed(() => String(route.params.id))
const dispute = computed(() => disputes.getById(id.value))
const job = computed(() => (dispute.value ? jobs.getById(dispute.value.jobId) : undefined))
const cleanerName = computed(() => (job.value?.assignedCleanerId ? session.findByEmail(job.value.assignedCleanerId)?.name ?? job.value.assignedCleanerId : null))

const note = ref('')
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)
const confirmingResolve = ref(false)

function addNote() {
  const result = disputes.addNote(id.value, note.value, session.currentUser)
  message.value = result.ok ? { kind: 'ok', text: 'Note added.' } : { kind: 'error', text: result.error }
  if (result.ok) note.value = ''
}
function resolve() {
  const result = disputes.resolve(id.value, session.currentUser)
  message.value = result.ok ? { kind: 'ok', text: 'Dispute marked as resolved.' } : { kind: 'error', text: result.error }
  confirmingResolve.value = false
}
</script>

<template>
  <div class="page-stack">
    <p><NuxtLink to="/admin/disputes" class="link">← Back to disputes</NuxtLink></p>

    <template v-if="!dispute">
      <PageHeader title="Dispute not found" />
      <p class="card">No dispute has the id <code>{{ id }}</code>.</p>
    </template>

    <template v-else>
      <PageHeader :title="dispute.title">
        <template #actions>
          <button v-if="dispute.status === 'open'" type="button" class="btn btn--primary" @click="confirmingResolve = true">Mark as resolved</button>
        </template>
      </PageHeader>
      <p><StatusBadge kind="dispute" :value="dispute.status" /></p>

      <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">{{ message.text }}</p>

      <ConfirmPanel :open="confirmingResolve" title="Mark this dispute as resolved?" confirm-label="Yes, resolve" @confirm="resolve" @cancel="confirmingResolve = false">
        <p>Notes stay on the dispute. Payment matters are outside CleanLinis.</p>
      </ConfirmPanel>

      <div class="dispute-grid">
        <section class="card">
          <h2 class="card__title">Details</h2>
          <dl class="info-list">
            <div class="info-list__row"><dt>Raised by</dt><dd>{{ dispute.raisedByName }} ({{ dispute.raisedByRole }})</dd></div>
            <div class="info-list__row"><dt>Opened</dt><dd>{{ formatDateTime(dispute.openedAt) }}</dd></div>
            <div class="info-list__row"><dt>Resolved</dt><dd>{{ dispute.resolvedAt ? formatDateTime(dispute.resolvedAt) : 'Not yet' }}</dd></div>
          </dl>
          <h3 class="sub">What happened</h3>
          <p class="text">{{ dispute.description }}</p>
        </section>

        <section class="card">
          <h2 class="card__title">Booking</h2>
          <dl v-if="job" class="info-list">
            <div class="info-list__row"><dt>Job</dt><dd><NuxtLink :to="`/admin/jobs/${job.id}`" class="link">{{ job.title }}</NuxtLink></dd></div>
            <div class="info-list__row"><dt>Client</dt><dd>{{ job.clientName }}</dd></div>
            <div class="info-list__row"><dt>Cleaner</dt><dd>{{ cleanerName ?? 'Not assigned' }}</dd></div>
            <div class="info-list__row"><dt>Date</dt><dd>{{ formatDateShort(job.date) }}</dd></div>
            <div class="info-list__row"><dt>Job status</dt><dd><StatusBadge kind="job" :value="job.status" /></dd></div>
          </dl>
          <p v-else class="muted">The job post was not found.</p>
        </section>
      </div>

      <section class="card" aria-labelledby="notes-title">
        <h2 id="notes-title" class="card__title">Notes ({{ dispute.notes.length }})</h2>
        <ol v-if="dispute.notes.length" class="notes">
          <li v-for="n in dispute.notes" :key="n.id" class="notes__item">
            <p class="notes__meta">{{ n.authorName }} · {{ formatDateTime(n.at) }}</p>
            <p class="notes__text">{{ n.text }}</p>
          </li>
        </ol>
        <p v-else class="muted">No notes yet.</p>
        <form class="note-form" novalidate @submit.prevent="addNote">
          <div class="field">
            <label for="note-text" class="field__label">Add a note</label>
            <textarea id="note-text" v-model="note" class="field__input" />
          </div>
          <div><button type="submit" class="btn btn--secondary">Add note</button></div>
        </form>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dispute-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 900px) { .dispute-grid { grid-template-columns: 1fr; } }
.sub { margin: 16px 0 6px; font-size: 14px; font-weight: 700; }
.text { margin: 0; font-size: 14px; line-height: 1.6; }
.notes { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; }
.notes__item { padding: 10px 0; border-bottom: 1px solid var(--color-divider); }
.notes__meta { margin: 0; font-size: 12px; color: var(--color-text-soft); }
.notes__text { margin: 4px 0 0; font-size: 14px; }
.note-form { display: flex; flex-direction: column; gap: 10px; max-width: 640px; }
</style>
