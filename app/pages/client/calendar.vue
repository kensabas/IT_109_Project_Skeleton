<!--
  /client/calendar [F-07] — the client's requests by date (plan D8, Q16
  unconfirmed). Approved requests show their job status.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useRequestsStore } from '~/stores/requests'
import { useJobsStore } from '~/stores/jobs'
import type { CalendarEvent } from '~/components/CalendarMonth.vue'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const requests = useRequestsStore()
const jobs = useJobsStore()

const events = computed<CalendarEvent[]>(() =>
  requests.forClient(session.currentUser?.email ?? '').map((r) => {
    const job = r.jobId ? jobs.getById(r.jobId) : undefined
    return {
      id: r.id,
      date: r.date,
      time: r.startTime,
      title: r.title,
      to: `/client/requests/${r.id}`,
      statusKind: job ? 'job' : 'request',
      statusValue: job ? job.status : r.status,
    }
  }),
)
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Calendar" subtitle="Your requests by date. Approved requests show their job status." />
    <CalendarMonth :events="events" />
  </div>
</template>
