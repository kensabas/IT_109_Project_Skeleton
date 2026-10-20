<!--
  AuthLayout: wraps every auth screen (login + both sign-ups).
  Renders the brand (decorative logo + "CleanLinis" wordmark), a heading,
  an optional sub-text line, and a centered 480 px card into which pages
  pass their form via the default slot.

  The whole screen is the page's <main> landmark (I-24).

  The logo is decorative per the mockup brief, so it is hidden from
  screen readers (aria-hidden). The wordmark alone communicates the brand.
-->
<script setup lang="ts">
defineProps<{
  heading: string
  subText?: string
}>()
</script>

<template>
  <main class="auth-layout">
    <header class="auth-layout__brand">
      <svg
        class="auth-layout__logo"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="0" y="0" width="36" height="36" rx="8" fill="var(--color-teal)" />
        <path
          d="M18 7 L20 16 L29 18 L20 20 L18 29 L16 20 L7 18 L16 16 Z"
          fill="#FFFFFF"
        />
        <circle cx="29" cy="29" r="3.5" fill="var(--color-accent)" />
      </svg>
      <span class="auth-layout__wordmark">CleanLinis</span>
    </header>

    <h1 class="auth-layout__heading">{{ heading }}</h1>
    <p v-if="subText" class="auth-layout__subtext">{{ subText }}</p>

    <section class="auth-layout__card">
      <slot />
    </section>
  </main>
</template>

<style scoped>
.auth-layout {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 40px 20px;
}

.auth-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.auth-layout__logo {
  display: block;
}

.auth-layout__wordmark {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.auth-layout__heading {
  margin: 0 0 8px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.auth-layout__subtext {
  margin: 0 0 24px;
  font-size: 16px;
  color: var(--color-text-soft);
}

.auth-layout__card {
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-card);
  padding: 24px;
}

/* On narrow phones, keep the card inside the viewport. */
@media (max-width: 360px) {
  .auth-layout {
    padding: 24px 16px;
  }
  .auth-layout__card {
    padding: 20px;
  }
}
</style>
