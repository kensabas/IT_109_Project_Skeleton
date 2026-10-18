<!--
  /register — F-01 Phase 3.2
  Fields and content from the plan's approved-screens table (row 2):
  two cards (client "I need cleaners" and cleaner "I am a cleaner")
  and a link to log in.

  Cards are placed here with keyboard-reachable semantics (role="link"
  on real NuxtLinks in 3.5.2); for now they are inert <div>s so this
  commit does not introduce navigation yet. 3.5.2 swaps them for
  <NuxtLink>.
-->
<script setup lang="ts">
</script>

<template>
  <AuthLayout
    heading="Create your account"
    sub-text="Which best describes you?"
  >
    <div class="choice-list">
      <NuxtLink to="/register/client" class="choice-card">
        <span class="choice-card__title">I need cleaners</span>
      </NuxtLink>

      <NuxtLink to="/register/cleaner" class="choice-card">
        <span class="choice-card__title">I am a cleaner</span>
      </NuxtLink>
    </div>

    <p class="choice-alt">
      Already have an account?
      <NuxtLink to="/login" class="choice-alt__link">Log in</NuxtLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.choice-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.choice-card {
  display: block;
  padding: 20px;
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-control);
  text-decoration: none;
  color: var(--color-text);
  cursor: pointer;
}

.choice-card:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

.choice-card:hover {
  border-color: var(--color-teal);
}

.choice-card__title {
  font-size: 18px;
  font-weight: 700;
}

.choice-alt {
  margin: 20px 0 0;
  font-size: 14px;
  text-align: center;
  color: var(--color-text-soft);
}

.choice-alt__link {
  color: var(--color-teal-dark);
  font-weight: 600;
  border-radius: 2px;
}

.choice-alt__link:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}
</style>
