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
  gap: 6px;
  padding: 3px 10px 3px 8px;
  min-height: 24px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.01em;
  border-radius: 999px;
  white-space: nowrap;
  /* Thin inset ring in the chip's own foreground colour at low alpha,
   * for a crisp "pill" feel on both light and off-white rows. */
  box-shadow: inset 0 0 0 1px currentColor;
}

/* Each variant uses `currentColor` for the ring (via the inherited
 * foreground) so the inset shadow matches the text colour. */

.status-chip--scheduled {
  background-color: #E3EEFB;
  color: #1F4E8C;
  box-shadow: inset 0 0 0 1px rgba(31, 78, 140, 0.22);
}

.status-chip--in-progress {
  background-color: #D9F0EF;
  color: #0B6665;
  box-shadow: inset 0 0 0 1px rgba(11, 102, 101, 0.22);
}

.status-chip--completed {
  background-color: #DDF1E3;
  color: #1E6B3A;
  box-shadow: inset 0 0 0 1px rgba(30, 107, 58, 0.22);
}

.status-chip--missed {
  background-color: #FBE3E3;
  color: #9B1C1C;
  box-shadow: inset 0 0 0 1px rgba(155, 28, 28, 0.22);
}

/* Tiny leading dot (the gap: 6px + ::before) adds the "live indicator"
 * feel on the current status. Decorative, so aria-hidden via scoping. */
.status-chip::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
</style>
