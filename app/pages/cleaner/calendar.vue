<!--
  /cleaner/calendar [F-07] — jobs the cleaner applied to or was accepted
  for (plan D8, Q16 unconfirmed). Cancelled and declined are left out.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useApplicationsStore } from '~/stores/applications'
import { useJobsStore } from '~/stores/jobs'
import type { CalendarEvent } from '~/components/CalendarMonth.vue'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const applications = useApplicationsStore()
const jobs = useJobsStore()

const events = computed<CalendarEvent[]>(() =>
  applications
    .forCleaner(session.currentUser?.email ?? '')
    .filter((a) => a.status === 'applied' || a.status === 'accepted')
    .flatMap((a) => {
      const job = jobs.getById(a.jobId)
      if (!job || job.archivedAt) return []
      return [{
        id: a.id, date: job.date, time: job.startTime, title: job.title, to: `/cleaner/jobs/${job.id}`,
        statusKind: a.status === 'accepted' ? 'job' : 'application',
        statusValue: a.status === 'accepted' ? job.status : a.status,
      } satisfies CalendarEvent]
    }),
)
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Calendar" subtitle="Jobs you applied to and jobs you are assigned to." />
    <CalendarMonth :events="events" />
  </div>
</template>
