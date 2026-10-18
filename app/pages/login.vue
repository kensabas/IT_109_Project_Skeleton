<!--
  /login — F-01 Phase 3.1
  Fields and content from the plan's approved-screens table (row 1):
  email, password, "Log in" button, link to create an account, note that
  admin accounts are created by the main admin in the admin panel.

  Phase 3 scope only: no validation (Phase 5), no auth logic (Phase 4).
  Submit is intercepted with @submit.prevent so pressing the button
  does nothing but keep the typed values. The create-account link is
  added in 3.5.2.
-->
<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
</script>

<template>
  <AuthLayout
    heading="Welcome back"
    sub-text="Log in to your CleanLinis account."
  >
    <form class="login-form" novalidate @submit.prevent>
      <TextField
        id="login-email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
      <TextField
        id="login-password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        required
      />
      <BaseButton type="submit">Log in</BaseButton>

      <!-- 3.5.2 will wire this NuxtLink to /register. -->
      <p class="login-form__alt" data-link-slot="create-account">
        Don't have an account? <span class="login-form__link-placeholder">Create an account</span>
      </p>
    </form>

    <p class="login-admin-note">
      Admin accounts are created by the main admin in the admin panel.
    </p>
  </AuthLayout>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-form__alt {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-soft);
  text-align: center;
}

.login-form__link-placeholder {
  color: var(--color-teal-dark);
  font-weight: 600;
}

.login-admin-note {
  margin: 20px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-soft);
  text-align: center;
}
</style>
