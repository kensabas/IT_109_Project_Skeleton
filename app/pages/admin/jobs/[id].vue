<!--
  /admin/jobs/[id] — F-17/18/19 Phase 4.

  Shows one job. Three cards:
    - Job details (left)
    - Assigned cleaner (right, top) — "Not assigned" state included
    - Job status (right, bottom) — four rows, current highlighted, labelled "Change status" select

  Archive: in-page confirm step (NOT window.confirm). On confirm the
  job is soft-deleted and the admin is sent back to the list.

  Unknown id: shows a "Job not found" message with a link back.

  Wrapped in the AppShell; the route guard limits it to admins (Wave 1).
  "View cleaner profile" link is a placeholder — needs-attention #5.
-->
<script setup lang="ts">
definePageMeta({ layout: 'app' })
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useJobsStore } from '~/stores/jobs'
import { useApplicationsStore } from '~/stores/applications'
import type { Application } from '~/data/mockApplications'
import type { TableColumn } from '~/components/SortableTable.vue'
import { formatDateTime } from '~/utils/format'
import { placeLabel } from '~/data/mockJobs'
import type { MockUser } from '~/data/mockUsers'
import { useCurrentUserStore } from '~/stores/currentUser'
import { ACCOUNT_STATE_LABEL } from '~/utils/labels'
import { ACCOUNT_STATE_TONE } from '~/utils/statusTones'
import { formatDateLong as fullDate, formatPeso, formatTime12h as hhmm } from '~/utils/format'
import { JOB_STATUSES, type Job, type JobStatus } from '~/data/mockJobs'

const route = useRoute()
const jobs = useJobsStore()

const jobId = computed(() => String(route.params.id))
const job = computed<Job | undefined>(() => jobs.getById(jobId.value))

// Users come from the store so account-state changes show up here.
const userStore = useCurrentUserStore()
function cleanerFor(j: Job): MockUser | undefined {
  if (!j.assignedCleanerId) return undefined
  return userStore.users.find((u) => u.email === j.assignedCleanerId)
}
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0] ?? '').join('').toUpperCase()
}

const STATUS_LABEL: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  'in-progress': 'In progress',
  completed: 'Completed',
  missed: 'Missed',
}

// Status select ----------------------------------------------------------
const chosenStatus = ref<JobStatus | ''>('')
const statusError = ref('')
// Keep the <select> in sync when the job's current status changes elsewhere.
function syncChosen() {
  if (job.value) chosenStatus.value = job.value.status
}
syncChosen()

function onStatusChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value as JobStatus
  if (!job.value) return
  const result = jobs.setStatus(job.value.id, value)
  if (!result.ok) {
    statusError.value = result.error
    // Snap the select back to the stored status.
    chosenStatus.value = job.value.status
    return
  }
  statusError.value = ''
  chosenStatus.value = value
}

// Archive confirm --------------------------------------------------------
const confirmingArchive = ref(false)
function openConfirm() { confirmingArchive.value = true }
function cancelConfirm() { confirmingArchive.value = false }
// Restore (plan D3, unconfirmed Q13): no confirm step because it is
// harmless and can be undone by archiving again.
const restoreMessage = ref('')
function doRestore() {
  if (!job.value) return
  const result = jobs.restoreJob(job.value.id)
  restoreMessage.value = result.ok ? 'Job restored. It is back in the main list.' : result.error
}

// Applicants and assignment (F-18, plan D1: admin picks an applicant).
const applications = useApplicationsStore()
const applicants = computed(() => (job.value ? applications.applicantsFor(job.value.id) : []))
function applicantName(a: Application): string {
  return userStore.findByEmail(a.cleanerEmail)?.name ?? a.cleanerEmail
}
const APPLICATION_RANK: Record<string, number> = { applied: 0, accepted: 1, declined: 2, cancelled: 3 }
const applicantColumns: TableColumn<Application>[] = [
  { key: 'name', label: 'Cleaner', value: (a) => applicantName(a) },
  { key: 'approval', label: 'Approval', value: (a) => userStore.findByEmail(a.cleanerEmail)?.approvalStatus ?? '' },
  { key: 'state', label: 'Account', value: (a) => userStore.findByEmail(a.cleanerEmail)?.accountState ?? '' },
  { key: 'applied', label: 'Applied', value: (a) => a.appliedAt, type: 'date' },
  { key: 'status', label: 'Application', value: (a) => APPLICATION_RANK[a.status] },
  { key: 'actions', label: 'Actions', value: () => null, sortable: false },
]
const canAssign = computed(() => !!job.value && !job.value.archivedAt && !job.value.assignedCleanerId)

const assignChoice = ref<Application | null>(null)
const confirmingUnassign = ref(false)
const assignMessage = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)
function doAssign() {
  if (!job.value || !assignChoice.value) return
  const name = applicantName(assignChoice.value)
  const result = jobs.assignCleaner(job.value.id, assignChoice.value.cleanerEmail, userStore.currentUser)
  assignMessage.value = result.ok ? { kind: 'ok', text: `${name} is now assigned. Other applicants were declined.` } : { kind: 'error', text: result.error }
  assignChoice.value = null
}
function doUnassign() {
  if (!job.value) return
  const result = jobs.unassign(job.value.id, userStore.currentUser)
  assignMessage.value = result.ok ? { kind: 'ok', text: 'The cleaner was removed. Applications are open again.' } : { kind: 'error', text: result.error }
  confirmingUnassign.value = false
}

useHead(() => ({
  title: job.value ? `${job.value.title} | CleanLinis` : 'Job not found | CleanLinis',
}))

function doArchive() {
  if (!job.value) return
  jobs.archiveJob(job.value.id)
  confirmingArchive.value = false
  navigateTo('/admin/jobs')
}
</script>

<template>
    <div class="detail-page">
      <p class="detail-page__back">
        <NuxtLink to="/admin/jobs" class="detail-page__back-link">← Back to job posts</NuxtLink>
      </p>

      <!-- Not-found branch -->
      <section v-if="!job" class="detail-page__notfound">
        <h1 class="detail-page__title">Job not found</h1>
        <p>No job post has the id <code>{{ jobId }}</code>.</p>
        <p>
          <NuxtLink to="/admin/jobs" class="detail-page__link">Go back to the list</NuxtLink>
        </p>
      </section>

      <!-- Normal branch -->
      <template v-else>
        <div class="detail-page__heading">
          <div class="detail-page__title-row">
            <h1 class="detail-page__title">{{ job.title }}</h1>
            <StatusChip :status="job.status" />
          </div>
          <BaseButton
            v-if="!job.archivedAt"
            type="button"
            class="detail-page__archive"
            @click="openConfirm"
          >
            Archive job
          </BaseButton>
          <div v-else class="detail-page__archived">
            <p class="detail-page__archived-note">
              This job was archived on {{ fullDate(job.archivedAt.slice(0, 10)) }}.
            </p>
            <BaseButton type="button" class="detail-page__archive" @click="doRestore">
              Restore job
            </BaseButton>
          </div>
        </div>

        <p v-if="restoreMessage" class="detail-page__message" role="status">{{ restoreMessage }}</p>

        <!-- In-page archive confirm (shared ConfirmPanel: focus moves in, Escape closes, focus returns) -->
        <ConfirmPanel
          :open="confirmingArchive"
          title="Archive this job?"
          confirm-label="Yes, archive"
          @confirm="doArchive"
          @cancel="cancelConfirm"
        >
          <p>Archived jobs are hidden from the main list. The record is kept, can be viewed with "Show archived", and can be restored.</p>
        </ConfirmPanel>

        <div class="detail-grid">
          <!-- Left: job details card -->
          <section class="card">
            <h2 class="card__title">Job details</h2>
            <dl class="info-list">
              <div class="info-list__row">
                <dt>Client</dt>
                <dd>{{ job.clientName }}</dd>
              </div>
              <div class="info-list__row">
                <dt>Rate</dt>
                <dd>{{ formatPeso(job.ratePhp) }}</dd>
              </div>
              <div class="info-list__row">
                <dt>Date</dt>
                <dd>{{ fullDate(job.date) }}</dd>
              </div>
              <div class="info-list__row">
                <dt>Time</dt>
                <dd>{{ hhmm(job.startTime) }} to {{ hhmm(job.endTime) }}</dd>
              </div>
              <div class="info-list__row">
                <dt>Area</dt>
                <dd>{{ placeLabel(job) }}</dd>
              </div>
              <div class="info-list__row">
                <dt>Request</dt>
                <dd>{{ job.requestId ?? 'No request on file' }}</dd>
              </div>
              <div class="info-list__row">
                <dt>Duration</dt>
                <dd>{{ job.durationHours }} hours</dd>
              </div>
            </dl>
            <hr class="card__divider" />
            <h3 class="card__subtitle">Task description</h3>
            <p class="card__description">{{ job.description }}</p>
          </section>

          <!-- Right column: two stacked cards -->
          <div class="detail-grid__right">
            <!-- Assigned cleaner -->
            <section class="card">
              <h2 class="card__title">Assigned cleaner</h2>
              <div v-if="cleanerFor(job)" class="cleaner">
                <div class="cleaner__avatar" aria-hidden="true">
                  {{ initialsFor(cleanerFor(job)!.name) }}
                </div>
                <div class="cleaner__text">
                  <p class="cleaner__name">{{ cleanerFor(job)!.name }}</p>
                  <p class="cleaner__tags">
                    <span class="pill tone-chip--purple">Cleaner</span>
                    <span class="pill" :class="`tone-chip--${ACCOUNT_STATE_TONE[cleanerFor(job)!.accountState]}`">
                      {{ ACCOUNT_STATE_LABEL[cleanerFor(job)!.accountState] }}
                    </span>
                  </p>
                  <p class="cleaner__mobile">
                    <a :href="`tel:${cleanerFor(job)!.mobileNumber}`" class="detail-page__link">
                      {{ cleanerFor(job)!.mobileNumber }}
                    </a>
                  </p>
                  <p class="cleaner__profile">
                    <NuxtLink :to="`/admin/accounts/${encodeURIComponent(cleanerFor(job)!.email)}`" class="detail-page__link">
                      View cleaner profile
                    </NuxtLink>
                  </p>
                  <p class="cleaner__profile">
                    <button type="button" class="btn btn--secondary btn--small" @click="confirmingUnassign = true">Unassign cleaner</button>
                  </p>
                  <p class="cleaner__profile">
                    <NuxtLink :to="{ path: '/admin/disputes', query: { jobId: job.id } }" class="detail-page__link">Open a dispute</NuxtLink>
                  </p>
                </div>
              </div>
              <p v-else class="cleaner__none">Not assigned. Choose from the applicants below.</p>
            </section>

            <!-- Job status -->
            <section class="card">
              <h2 class="card__title">Job status</h2>
              <ol class="status-list" aria-label="Workflow steps">
                <li
                  v-for="s in JOB_STATUSES" :key="s"
                  class="status-list__row"
                  :class="{ 'status-list__row--current': s === job.status }"
                  :aria-current="s === job.status ? 'step' : undefined"
                >
                  <span class="status-list__dot" aria-hidden="true"></span>
                  <span class="status-list__label">{{ STATUS_LABEL[s] }}</span>
                </li>
              </ol>
              <div class="status-change">
                <label :for="`status-select-${job.id}`" class="status-change__label">
                  Change status
                </label>
                <select
                  :id="`status-select-${job.id}`"
                  class="status-change__select"
                  :value="chosenStatus"
                  @change="onStatusChange"
                >
                  <option v-for="s in JOB_STATUSES" :key="s" :value="s">
                    {{ STATUS_LABEL[s] }}
                  </option>
                </select>
                <p v-if="statusError" class="status-change__error" role="alert">{{ statusError }}</p>
              </div>
            </section>
          </div>
        </div>

        <p v-if="assignMessage" class="message" :class="`message--${assignMessage.kind}`" :role="assignMessage.kind === 'error' ? 'alert' : 'status'">
          {{ assignMessage.text }}
        </p>
        <ConfirmPanel
          :open="assignChoice !== null"
          title="Assign this cleaner?"
          confirm-label="Yes, assign"
          @confirm="doAssign"
          @cancel="assignChoice = null"
        >
          <p v-if="assignChoice">{{ applicantName(assignChoice) }} will be assigned to "{{ job.title }}". The other applicants will be declined.</p>
        </ConfirmPanel>
        <ConfirmPanel
          :open="confirmingUnassign"
          title="Remove the assigned cleaner?"
          confirm-label="Yes, unassign"
          @confirm="doUnassign"
          @cancel="confirmingUnassign = false"
        >
          <p>The job post goes back to the marketplace and every application for it is open again.</p>
        </ConfirmPanel>

        <section class="applicants" aria-labelledby="applicants-title">
          <h2 id="applicants-title" class="applicants__title">Applicants ({{ applicants.length }})</h2>
          <SortableTable
            :columns="applicantColumns"
            :rows="applicants"
            :row-key="(a) => a.id"
            caption="Cleaners who applied to this job post."
            :initial-sort="{ key: 'status', direction: 'asc' }"
            empty-text="Nobody has applied yet."
          >
            <template #cell-name="{ row }">
              <NuxtLink :to="`/admin/accounts/${encodeURIComponent(row.cleanerEmail)}`" class="link">{{ applicantName(row) }}</NuxtLink>
            </template>
            <template #cell-approval="{ row }"><StatusBadge kind="approval" :value="userStore.findByEmail(row.cleanerEmail)?.approvalStatus ?? 'pending'" /></template>
            <template #cell-state="{ row }"><StatusBadge kind="account" :value="userStore.findByEmail(row.cleanerEmail)?.accountState ?? 'activated'" /></template>
            <template #cell-applied="{ row }">{{ formatDateTime(row.appliedAt) }}</template>
            <template #cell-status="{ row }"><StatusBadge kind="application" :value="row.status" /></template>
            <template #cell-actions="{ row }">
              <button
                v-if="canAssign && row.status === 'applied'"
                type="button"
                class="btn btn--primary btn--small"
                :aria-label="`Assign ${applicantName(row)}`"
                @click="assignChoice = row"
              >
                Assign
              </button>
              <span v-else class="muted">No action</span>
            </template>
          </SortableTable>
        </section>
      </template>
    </div>
</template>

<style scoped>
.detail-page {
  /* Width and padding come from the AppShell (1280 px). */
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.detail-page__back { margin: 0; }
.detail-page__back-link,
.detail-page__link {
  color: var(--color-teal-dark);
  font-weight: 600;
  text-decoration: none;
  border-radius: 2px;
}
.detail-page__back-link:focus-visible,
.detail-page__link:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}
.detail-page__back-link:hover,
.detail-page__link:hover { text-decoration: underline; }

.detail-page__heading {
  display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: flex-start;
}
.detail-page__title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.detail-page__title { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--color-text); }
.detail-page__archive { width: auto; min-width: 160px; }
.detail-page__archived { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.detail-page__message { margin: 0; font-size: 14px; color: var(--color-text); }
.detail-page__archived-note { margin: 0; font-size: 14px; color: var(--color-text-soft); font-style: italic; }


.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
}
.detail-grid__right { display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 900px) {
  .detail-grid { grid-template-columns: 1fr; }
}

.card {
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-lg);
  padding: 22px 22px 20px;
}
.card__title {
  margin: 0 0 14px;
  padding-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--color-divider);
}
.card__subtitle { margin: 0 0 6px; font-size: 14px; font-weight: 700; color: var(--color-text); }
.card__divider { border: none; border-top: 1px solid var(--color-divider); margin: 16px 0; }
.card__description { margin: 0; font-size: 14px; line-height: 1.6; color: var(--color-text); }

/* Info list — rows are visually tabular: thin dividers, consistent
 * baseline, label uppercase micro-caps on the left, value tabular-num
 * where it's a number/date. Reads like a compact table on narrow
 * screens too, because we collapse to a single column via contents. */
.info-list {
  margin: 0;
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: 0;
  column-gap: 12px;
}
.info-list__row { display: contents; }
.info-list__row > dt,
.info-list__row > dd {
  padding: 10px 0;
  border-bottom: 1px solid var(--color-divider);
}
.info-list__row:last-child > dt,
.info-list__row:last-child > dd {
  border-bottom: none;
}
.info-list dt {
  font-size: 11px;
  color: var(--color-text-soft);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  align-self: center;
}
.info-list dd {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

/* Cleaner card */
.cleaner { display: flex; gap: 14px; align-items: flex-start; }
.cleaner__avatar {
  width: 48px; height: 48px; flex-shrink: 0;
  border-radius: 50%; background-color: var(--color-tone-teal-bg); color: var(--color-tone-teal-fg);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px; letter-spacing: 0.02em;
}
.cleaner__text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cleaner__name { margin: 0; font-size: 16px; font-weight: 700; color: var(--color-text); }
.cleaner__tags { margin: 0; display: flex; gap: 6px; flex-wrap: wrap; }
.cleaner__mobile { margin: 0; font-size: 14px; color: var(--color-text); }
.cleaner__profile { margin: 2px 0 0; font-size: 14px; }
.cleaner__none { margin: 0; font-size: 14px; color: var(--color-text-soft); font-style: italic; }

.pill {
  display: inline-flex; align-items: center; min-height: 22px; padding: 2px 10px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em; border-radius: 999px;
}

/* Status card */
.status-list { list-style: none; margin: 0 0 14px; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.status-list__row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-control);
  background-color: var(--color-card);
  font-size: 14px; color: var(--color-text-soft);
}
.status-list__row--current {
  background-color: var(--color-tone-teal-bg); color: var(--color-tone-teal-fg);
  border-color: var(--color-teal);
}
.status-list__dot {
  width: 10px; height: 10px; border-radius: 50%; background-color: currentColor;
  flex-shrink: 0;
}
.status-list__label { font-weight: 600; }

.status-change { display: flex; flex-direction: column; gap: 6px; }
.status-change__label { font-size: 13px; font-weight: 600; color: var(--color-text); }
.status-change__select {
  height: var(--control-height-input);
  padding: 0 12px;
  font: inherit;
  color: var(--color-text);
  background-color: var(--color-card);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-control);
}
.status-change__select:focus-visible {
  outline: 2px solid var(--color-teal); outline-offset: 2px;
}
.status-change__error { margin: 0; font-size: 13px; color: var(--color-error); }

.applicants { display: flex; flex-direction: column; gap: 12px; }
.applicants__title { margin: 0; font-size: 18px; font-weight: 800; color: var(--color-text); }

.detail-page__notfound {
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-lg);
  padding: 24px;
}
</style>
