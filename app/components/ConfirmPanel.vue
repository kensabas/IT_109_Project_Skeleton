<!--
  ConfirmPanel: in-page confirm step (never window.confirm).
  role="alertdialog" with a label and description. When it opens, focus
  moves into the panel; Escape or Cancel closes it; focus then returns to
  whatever was focused before (usually the button that opened it).
-->
<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    confirmLabel: string
    cancelLabel?: string
  }>(),
  { cancelLabel: 'Cancel' },
)
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()

const panel = ref<HTMLElement | null>(null)
const baseId = useId()
let focusBeforeOpen: HTMLElement | null = null

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      focusBeforeOpen = document.activeElement as HTMLElement | null
      await nextTick()
      panel.value?.focus()
    } else if (focusBeforeOpen?.isConnected) {
      focusBeforeOpen.focus()
      focusBeforeOpen = null
    }
  },
)
</script>

<template>
  <div
    v-if="open"
    ref="panel"
    class="confirm-panel"
    role="alertdialog"
    tabindex="-1"
    :aria-labelledby="`${baseId}-title`"
    :aria-describedby="`${baseId}-body`"
    @keydown.esc="emit('cancel')"
  >
    <h2 :id="`${baseId}-title`" class="confirm-panel__title">{{ title }}</h2>
    <div :id="`${baseId}-body`" class="confirm-panel__body"><slot /></div>
    <div class="confirm-panel__actions">
      <button type="button" class="btn btn--primary" @click="emit('confirm')">{{ confirmLabel }}</button>
      <button type="button" class="btn btn--secondary" @click="emit('cancel')">{{ cancelLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.confirm-panel {
  background-color: var(--color-notice-bg);
  color: var(--color-notice-text);
  border-radius: var(--radius-control);
  padding: 16px;
}
.confirm-panel:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}
.confirm-panel__title { margin: 0 0 6px; font-size: 16px; font-weight: 700; }
.confirm-panel__body { margin: 0 0 12px; font-size: 14px; line-height: 1.5; }
.confirm-panel__body :deep(p) { margin: 0 0 6px; }
.confirm-panel__actions { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
