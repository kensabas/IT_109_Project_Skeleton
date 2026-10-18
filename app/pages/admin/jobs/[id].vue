<!--
  /admin/jobs/[id] — F-17/18/19 Phase 4.

  Shows one job. Three cards:
    - Job details (left)
    - Assigned cleaner (right, top) — "Not assigned" state included
    - Job status (right, bottom) — four rows, current highlighted, labelled "Change status" select

  Archive: in-page confirm step (NOT window.confirm). On confirm the
  job is soft-deleted and the admin is sent back to the list.

  Unknown id: shows a "Job not found" message with a link back.

  No admin login / route guard — see needs_your_attention #4.
  "View cleaner profile" link is a placeholder — needs-attention #5.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useJobsStore } from '~/stores/jobs'
import { initialMockUsers, type MockUser } from '~/data/mockUsers'
import { JOB_STATUSES, type Job, type JobStatus } from '~/data/mockJobs'

const route = useRoute()
const jobs = useJobsStore()

const jobId = computed(() => String(route.params.id))
const job = computed<Job | undefined>(() => jobs.getById(jobId.value))

// Static copy of users for display lookups (same approach as the list page).
const USERS: MockUser[] = initialMockUsers()
function cleanerFor(j: Job): MockUser | undefined {
  if (!j.assignedCleanerId) return undefined
  return USERS.find((u) => u.email === j.assignedCleanerId)
}
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0] ?? '').join('').toUpperCase()
}

const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})
const dateLong = new Intl.DateTimeFormat('en-PH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
function fullDate(iso: string): string {
  return dateLong.format(new Date(`${iso}T12:00:00+08:00`))
}
function hhmm(h24: string): string {
  const [h, m] = h24.split(':').map((n) => parseInt(n, 10))
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = ((h + 11) % 12) + 1
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
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
function doArchive() {
  if (!job.value) return
  jobs.archiveJob(job.value.id)
  confirmingArchive.value = false
  navigateTo('/admin/jobs')
}
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

    <main class="detail-page">
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
          <p v-else class="detail-page__archived-note">
            This job was archived on {{ fullDate(job.archivedAt.slice(0, 10)) }}.
          </p>
        </div>

        <!-- In-page archive confirm (NOT window.confirm) -->
        <div
          v-if="confirmingArchive"
          class="confirm-card"
          role="alertdialog"
          aria-labelledby="archive-confirm-title"
        >
          <h2 id="archive-confirm-title" class="confirm-card__title">Archive this job?</h2>
          <p class="confirm-card__body">
            Archived jobs are hidden from the main list. The record is kept and can still be viewed via "Show archived".
          </p>
          <div class="confirm-card__actions">
            <BaseButton type="button" class="confirm-card__btn" @click="doArchive">Yes, archive</BaseButton>
            <button type="button" class="confirm-card__cancel" @click="cancelConfirm">Cancel</button>
          </div>
        </div>

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
                <dd>{{ peso.format(job.ratePhp) }}</dd>
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
                    <span class="pill">Cleaner</span>
                    <span class="pill pill--state">Activated</span>
                  </p>
                  <p class="cleaner__mobile">{{ cleanerFor(job)!.mobileNumber }}</p>
                  <p class="cleaner__profile">
                    <!-- Placeholder — needs_your_attention #5 -->
                    <NuxtLink to="#" data-placeholder="cleaner-profile" class="detail-page__link">
                      View cleaner profile
                    </NuxtLink>
                  </p>
                </div>
              </div>
              <p v-else class="cleaner__none">Not assigned.</p>
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
      </template>
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
.admin-shell__brand { display: flex; align-items: center; gap: 10px; }
.admin-shell__wordmark { font-size: 18px; font-weight: 800; color: var(--color-text); letter-spacing: -0.01em; }
.admin-shell__tag {
  padding: 2px 8px; font-size: 12px; font-weight: 700;
  color: var(--color-teal-dark); background-color: #D9F0EF;
  border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em;
}
.admin-shell__who { margin: 0; font-size: 13px; color: var(--color-text-soft); }

.detail-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px;
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
.detail-page__archived-note { margin: 0; font-size: 14px; color: var(--color-text-soft); font-style: italic; }

/* Archive confirm card (in-page, NOT a native alert) */
.confirm-card {
  background-color: #FDF1D6;
  color: #5C3F00;
  border-radius: var(--radius-control);
  padding: 16px;
}
.confirm-card__title { margin: 0 0 6px; font-size: 16px; font-weight: 700; }
.confirm-card__body { margin: 0 0 12px; font-size: 14px; line-height: 1.5; }
.confirm-card__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.confirm-card__btn { width: auto; min-width: 160px; }
.confirm-card__cancel {
  all: unset;
  padding: 10px 16px;
  font-weight: 600;
  color: var(--color-text);
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-control);
  cursor: pointer;
}
.confirm-card__cancel:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

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
  padding: 20px;
}
.card__title { margin: 0 0 12px; font-size: 18px; font-weight: 700; color: var(--color-text); }
.card__subtitle { margin: 0 0 6px; font-size: 14px; font-weight: 700; color: var(--color-text); }
.card__divider { border: none; border-top: 1px solid var(--color-card-border); margin: 16px 0; }
.card__description { margin: 0; font-size: 14px; line-height: 1.6; color: var(--color-text); }

.info-list { margin: 0; display: grid; grid-template-columns: 120px 1fr; row-gap: 10px; column-gap: 12px; }
.info-list__row { display: contents; }
.info-list dt { font-size: 13px; color: var(--color-text-soft); font-weight: 600; }
.info-list dd { margin: 0; font-size: 14px; color: var(--color-text); }

/* Cleaner card */
.cleaner { display: flex; gap: 14px; align-items: flex-start; }
.cleaner__avatar {
  width: 48px; height: 48px; flex-shrink: 0;
  border-radius: 50%; background-color: var(--color-teal); color: #FFFFFF;
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
  display: inline-flex; align-items: center; min-height: 20px; padding: 1px 8px;
  font-size: 12px; font-weight: 600; border-radius: 999px;
  background-color: #D9F0EF; color: var(--color-teal-dark);
}
.pill--state { background-color: #DDF1E3; color: #1E6B3A; }

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
  background-color: #D9F0EF; color: var(--color-teal-dark);
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

.detail-page__notfound {
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  padding: 24px;
}
</style>
