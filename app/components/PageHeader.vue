<!--
  PageHeader: the page's single h1, an optional sub-line, and an actions
  slot (buttons/links on the right, stacked on phones). Also sets the
  browser tab title.
-->
<script setup lang="ts">
const props = defineProps<{ title: string; subtitle?: string }>()

useHead(() => ({ title: `${props.title} | CleanLinis` }))
</script>

<template>
  <div class="page-header">
    <div class="page-header__text">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.page-header__title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
}
.page-header__subtitle { margin: 4px 0 0; font-size: 15px; color: var(--color-text-soft); }
.page-header__actions { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
