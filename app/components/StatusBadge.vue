<!--
  StatusBadge: text label + tone colour for any status kind (job,
  request, application, dispute, document, account, approval).
  The label is always visible, so colour is never the only signal.
  Tones come from main.css and are contrast-tested.
-->
<script setup lang="ts">
import { statusLabel, statusTone, type StatusKind } from '~/utils/statusMeta'

defineProps<{ kind: StatusKind; value: string }>()
</script>

<template>
  <span class="status-badge" :class="`tone-chip--${statusTone(kind, value)}`">
    {{ statusLabel(kind, value) }}
  </span>
</template>

<style scoped>
.status-badge {
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
.status-badge::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
</style>
