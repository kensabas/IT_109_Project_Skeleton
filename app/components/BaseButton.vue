<!--
  BaseButton: full-width primary button.

  Uses a real <button>, not a clickable div. Supports type="button"
  (default) and type="submit" for forms. The disabled attribute is
  passed through so the browser handles keyboard + submit prevention.
-->
<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  {
    type: 'button',
    disabled: false,
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="base-button"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  width: 100%;
  height: var(--control-height-button);
  padding: 0 20px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  background-color: var(--color-teal);
  border: none;
  border-radius: var(--radius-control);
  cursor: pointer;
  outline: none;
  transition: background-color 120ms ease;
}

.base-button:hover:not(:disabled) {
  background-color: var(--color-teal-dark);
}

.base-button:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
