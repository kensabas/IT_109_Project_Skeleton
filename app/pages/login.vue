<!--
  /login — F-01 Phase 3.1 (3.5.2 added links) + 4.3 (login logic).
  Fields and content from the plan's approved-screens table (row 1).

  Phase 4 scope: real login against the mock user list via the
  currentUser Pinia store. Still no validation (Phase 5): fields hold
  what is typed, submit is intercepted, the store returns a single
  "Email or password is incorrect." message for a bad email or a wrong
  password.

  Navigation to /welcome on success lands in Phase 4.5.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'

const email = ref('')
const password = ref('')
const formError = ref('')

const currentUser = useCurrentUserStore()

function onSubmit() {
  const result = currentUser.logIn(email.value, password.value)
  if (!result.ok) {
    formError.value = result.error
    return
  }
  formError.value = ''
  navigateTo('/welcome')
}
</script>

<template>
  <AuthLayout
    heading="Welcome back"
    sub-text="Log in to your CleanLinis account."
  >
    <form class="login-form" novalidate @submit.prevent="onSubmit">
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

      <!-- Shared "incorrect credentials" message. Uses the same error
           color as field-level errors so it fits the error styling. -->
      <p v-if="formError" class="login-form__error" role="alert">
        {{ formError }}
      </p>

      <BaseButton type="submit">Log in</BaseButton>

      <p class="login-form__alt">
        Don't have an account?
        <NuxtLink to="/register" class="login-form__link">Create an account</NuxtLink>
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

.login-form__error {
  margin: 0;
  font-size: 14px;
  color: var(--color-error);
  text-align: center;
}

.login-form__alt {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-soft);
  text-align: center;
}

.login-form__link {
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
