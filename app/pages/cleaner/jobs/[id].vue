<!--
  /cleaner/jobs/[id] [F-25, F-28, F-03] — one job post and Apply.
  Apply is disabled with the reason when the cleaner is not approved or
  not active (F-03). Archived posts are not shown to cleaners (plan D3).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useJobsStore } from '~/stores/jobs'
import { useApplicationsStore, canCleanerApply } from '~/stores/applications'
import { placeLabel } from '~/data/mockJobs'
import { haversineKm } from '~/utils/distance'
import { formatDateLong, formatPeso, formatTime12h } from '~/utils/format'

definePageMeta({ layout: 'app' })

const route = useRoute()
const session = useCurrentUserStore()
const jobs = useJobsStore()
const applications = useApplicationsStore()

const id = computed(() => String(route.params.id))
const me = computed(() => session.currentUser)
const myApplication = computed(() => applications.forCleaner(me.value?.email ?? '').find((a) => a.jobId === id.value))
// Cleaners see a post if it is open, or if they have an application for it.
const job = computed(() => {
  const found = jobs.getById(id.value)
  if (!found || found.archivedAt) return undefined
  if (found.assignedCleanerId && found.assignedCleanerId !== me.value?.email && !myApplication.value) return undefined
  return found
})
const distance = computed(() => {
  const pin = me.value?.pinnedLocation
  if (!pin || !job.value || job.value.lat === null || job.value.lng === null) return null
  return haversineKm(pin, { lat: job.value.lat, lng: job.value.lng })
})
const refusal = computed(() => canCleanerApply(me.value))
const isActiveApplication = computed(() => myApplication.value?.status === 'applied' || myApplication.value?.status === 'accepted')
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

function apply() {
  const result = applications.apply(id.value, me.value)
  message.value = result.ok ? { kind: 'ok', text: 'Application sent. The admin chooses the cleaner from the applicants.' } : { kind: 'error', text: result.error }
}
</script>

<template>
  <div class="page-stack">
    <p><NuxtLink to="/cleaner/marketplace" class="link">← Back to the marketplace</NuxtLink></p>

    <template v-if="!job">
      <PageHeader title="Job post not found" />
      <p class="card">This job post does not exist or is no longer open.</p>
    </template>

    <template v-else>
      <PageHeader :title="job.title" :subtitle="job.clientName" />
      <CleanerApprovalNotice />
      <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">
        {{ message.text }} <NuxtLink v-if="message.kind === 'ok'" to="/cleaner/applications" class="link">See my applications</NuxtLink>
      </p>

      <div class="job-grid">
        <section class="card">
          <h2 class="card__title">Job details</h2>
          <dl class="info-list">
            <div class="info-list__row"><dt>Client</dt><dd>{{ job.clientName }}</dd></div>
            <div class="info-list__row"><dt>Rate</dt><dd>{{ formatPeso(job.ratePhp) }}</dd></div>
            <div class="info-list__row"><dt>Distance</dt><dd>{{ distance === null ? 'Unknown' : `${distance.toFixed(1)} km (straight line)` }}</dd></div>
            <div class="info-list__row"><dt>Date</dt><dd>{{ formatDateLong(job.date) }}</dd></div>
            <div class="info-list__row"><dt>Time</dt><dd>{{ formatTime12h(job.startTime) }} to {{ formatTime12h(job.endTime) }}</dd></div>
            <div class="info-list__row"><dt>Duration</dt><dd>{{ job.durationHours }} hours</dd></div>
            <div class="info-list__row"><dt>Area</dt><dd>{{ placeLabel(job) }}</dd></div>
          </dl>
          <h3 class="sub">Task description</h3>
          <p class="text">{{ job.description }}</p>
        </section>

        <section class="card">
          <h2 class="card__title">Apply</h2>
          <template v-if="myApplication">
            <p>Your application: <StatusBadge kind="application" :value="myApplication.status" /></p>
            <p v-if="myApplication.status === 'accepted'">You are the assigned cleaner. Job status: <StatusBadge kind="job" :value="job.status" /></p>
          </template>
          <template v-if="!isActiveApplication">
            <button type="button" class="btn btn--primary" :disabled="refusal !== null" :aria-describedby="refusal ? 'apply-why' : undefined" @click="apply">
              {{ myApplication ? 'Apply again' : 'Apply to this job' }}
            </button>
            <p v-if="refusal" id="apply-why" class="field__hint">{{ refusal }}</p>
          </template>
          <p v-else-if="myApplication?.status === 'applied'" class="field__hint">You can cancel it under <NuxtLink to="/cleaner/applications" class="link">My applications</NuxtLink>.</p>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.job-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 900px) { .job-grid { grid-template-columns: 1fr; } }
.sub { margin: 16px 0 6px; font-size: 14px; font-weight: 700; }
.text { margin: 0; font-size: 14px; line-height: 1.6; }
</style>
