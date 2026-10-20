<!--
  /welcome — F-01 Phase 4.5 placeholder, replaced in Wave 1.2 (plan D9):
  the route guard sends signed-in people to their role home and
  signed-out people to /login, so this page only shows while redirecting.
-->
<script setup lang="ts">
useHead({ title: 'Redirecting | CleanLinis' })
</script>

<template>
  <AuthLayout heading="Redirecting" sub-text="Taking you to your home page.">
    <p class="welcome__fallback">If nothing happens, <NuxtLink to="/login" class="link">go to log in</NuxtLink>.</p>
  </AuthLayout>
</template>

<style scoped>
.welcome__fallback { margin: 0; font-size: 14px; color: var(--color-text-soft); text-align: center; }
</style>
