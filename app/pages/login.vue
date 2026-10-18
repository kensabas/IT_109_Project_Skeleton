<!--
  /login — F-01 Phase 3.1 + 4.3 + 5.5 (validation wiring).
  Fields from the plan's approved-screens table (row 1).

  Phase 5 scope: client-side validation on submit via the shared
  validateLogin() rules in app/utils/validation.ts. If validation fails,
  the store is NOT called. If validation passes but credentials are
  wrong, the shared "Email or password is incorrect." message is shown
  as a form-level alert.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { validateLogin, hasErrors, type FieldErrors, type LoginField } from '~/utils/validation'

const email = ref('')
const password = ref('')
const fieldErrors = ref<FieldErrors<LoginField>>({})
const formError = ref('')

const currentUser = useCurrentUserStore()

function onSubmit() {
  // 5.5 — clear and re-check on every submit, do not auto-validate while typing.
  fieldErrors.value = {}
  formError.value = ''

  const errors = validateLogin({ email: email.value, password: password.value })
  if (hasErrors(errors)) {
    fieldErrors.value = errors
    return
  }

  const result = currentUser.logIn(email.value, password.value)
  if (!result.ok) {
    formError.value = result.error
    return
  }
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
        :error="fieldErrors.email"
        required
      />
      <TextField
        id="login-password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="current-password"
        :error="fieldErrors.password"
        required
      />

      <!-- Form-level, shared "incorrect credentials" message. -->
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
