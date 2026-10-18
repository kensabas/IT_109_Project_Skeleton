<!--
  StatusChip: a small text badge for a job status.

  The chip always shows the text label; colour is a hint, not the only
  signal (WCAG). Colour pairs come from the mockup; their luminance is
  checked by `tests/statusChip.contrast.spec.ts` using the shared
  contrast utility.
-->
<script setup lang="ts">
import type { JobStatus } from '~/data/mockJobs'

defineProps<{ status: JobStatus }>()

const LABEL: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  'in-progress': 'In progress',
  completed: 'Completed',
  missed: 'Missed',
}
</script>

<template>
  <span
    class="status-chip"
    :class="`status-chip--${status}`"
  >
    {{ LABEL[status] }}
  </span>
</template>

<style scoped>
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  min-height: 24px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  white-space: nowrap;
}

.status-chip--scheduled {
  background-color: #E3EEFB;
  color: #1F4E8C;
}

.status-chip--in-progress {
  background-color: #D9F0EF;
  color: #0B6665;
}

.status-chip--completed {
  background-color: #DDF1E3;
  color: #1E6B3A;
}

.status-chip--missed {
  background-color: #FBE3E3;
  color: #9B1C1C;
}
</style>
