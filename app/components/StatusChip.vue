<!--
  StatusChip: a small text badge for a job status.

  The chip always shows the text label; colour is a hint, not the only
  signal (WCAG 1.4.1). Colours are the tone tokens in main.css
  (`--color-tone-*`), picked through JOB_STATUS_TONE and contrast-tested
  by reading main.css in `tests/statusChip.contrast.spec.ts`.
-->
<script setup lang="ts">
import type { JobStatus } from '~/data/mockJobs'
import { JOB_STATUS_TONE } from '~/utils/statusTones'

defineProps<{ status: JobStatus }>()

const LABEL: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  'in-progress': 'In progress',
  completed: 'Completed',
  missed: 'Missed',
}
</script>

<template>
  <span class="status-chip" :class="`tone-chip--${JOB_STATUS_TONE[status]}`">
    {{ LABEL[status] }}
  </span>
</template>

<style scoped>
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  min-height: 24px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  border-radius: 999px;
  white-space: nowrap;
}

/* Tiny leading dot; decorative (the text label carries the meaning). */
.status-chip::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
</style>
