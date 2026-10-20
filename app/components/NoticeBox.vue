<!--
  NoticeBox: informational panel used on the cleaner sign-up screen
  (required documents + approval message). Title prop + default slot
  for the body so pages can put lists, paragraphs, or links inside.

  Rendered as <aside> since it is a supporting note, not the main
  content of the page. The title is an h2, the level right under the
  page's h1 (I-24); its size is set below, so it looks the same.
-->
<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <aside class="notice-box">
    <h2 class="notice-box__title">{{ title }}</h2>
    <div class="notice-box__body">
      <slot />
    </div>
  </aside>
</template>

<style scoped>
.notice-box {
  padding: 16px;
  background-color: var(--color-notice-bg);
  color: var(--color-notice-text);
  border-radius: var(--radius-control);
}

.notice-box__title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 700;
}

.notice-box__body {
  font-size: 14px;
  line-height: 1.5;
}

/* Keep list spacing tidy if pages pass in a <ul>. */
.notice-box__body :deep(ul) {
  margin: 0;
  padding-left: 20px;
}

.notice-box__body :deep(p) {
  margin: 0 0 6px;
}

.notice-box__body :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
