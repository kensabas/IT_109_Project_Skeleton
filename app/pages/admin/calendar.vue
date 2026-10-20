<!--
  /admin/calendar [F-07] — every live job post by date (plan D8, Q16
  unconfirmed). Archived posts are left out.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useJobsStore } from '~/stores/jobs'
import type { CalendarEvent } from '~/components/CalendarMonth.vue'

definePageMeta({ layout: 'app' })

const jobs = useJobsStore()
const events = computed<CalendarEvent[]>(() =>
  jobs.visibleJobs(false).map((j) => ({
    id: j.id, date: j.date, time: j.startTime, title: j.title, to: `/admin/jobs/${j.id}`, statusKind: 'job', statusValue: j.status,
  })),
)
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Calendar" subtitle="All job posts by date." />
    <CalendarMonth :events="events" />
  </div>
</template>
