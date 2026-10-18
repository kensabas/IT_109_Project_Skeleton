<!--
  Placeholder page for Phase 1 verification only.
  Its purpose is to make the background color, body font, and base text
  visible so we can confirm the global styles are being applied.
-->
<template>
  <main class="phase1-check">
    <h1 class="phase1-check__title">CleanLinis</h1>
    <p class="phase1-check__text">
      Phase 1 base styles check. The page uses the Plus Jakarta Sans font
      at 16&nbsp;px on the #F4F7F6 page background.
    </p>
  </main>
</template>

<style scoped>
.phase1-check {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px;
}

.phase1-check__title {
  margin: 0 0 16px;
  color: var(--color-teal);
  font-weight: 700;
}

.phase1-check__text {
  margin: 0;
  color: var(--color-text-soft);
}
</style>
