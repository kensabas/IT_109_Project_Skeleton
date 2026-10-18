<!--
  /register/cleaner — F-01 Phase 3.4 + 4.4 + 5.5 (validation wiring).

  Phase 5 scope: run validateCleanerSignUp before signUp. If validation
  fails, show per-field errors and do NOT call signUp. If validation
  passes and signUp fails (duplicate email), show the duplicate message
  under the email field.
-->
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import {
  validateCleanerSignUp,
  hasErrors,
  firstErroredField,
  type FieldErrors,
  type CleanerSignUpField,
} from '~/utils/validation'

const fullName = ref('')
const email = ref('')
const mobileNumber = ref('')
const password = ref('')
const confirmPassword = ref('')
const fieldErrors = ref<FieldErrors<CleanerSignUpField>>({})

// 5.5.2 — display order + name-to-id map.
const CLEANER_ORDER: readonly CleanerSignUpField[] = [
  'fullName',
  'email',
  'mobileNumber',
  'password',
  'confirmPassword',
]
const CLEANER_FIELD_IDS: Record<CleanerSignUpField, string> = {
  fullName: 'cleaner-full-name',
  email: 'cleaner-email',
  mobileNumber: 'cleaner-mobile',
  password: 'cleaner-password',
  confirmPassword: 'cleaner-confirm-password',
}

const currentUser = useCurrentUserStore()

async function onSubmit() {
  // 5.5 — clear and re-check on every submit.
  fieldErrors.value = {}

  const errors = validateCleanerSignUp({
    fullName: fullName.value,
    email: email.value,
    mobileNumber: mobileNumber.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
  if (hasErrors(errors)) {
    fieldErrors.value = errors
    await nextTick()
    const first = firstErroredField(errors, CLEANER_ORDER)
    if (first) document.getElementById(CLEANER_FIELD_IDS[first])?.focus()
    return
  }

  const result = currentUser.signUp({
    name: fullName.value,
    email: email.value,
    mobileNumber: mobileNumber.value,
    password: password.value,
    role: 'cleaner',
  })
  if (!result.ok) {
    fieldErrors.value = { email: result.error }
    await nextTick()
    document.getElementById(CLEANER_FIELD_IDS.email)?.focus()
    return
  }
  navigateTo('/welcome')
}
</script>

<template>
  <AuthLayout
    heading="Apply as a cleaner"
    sub-text="Create your cleaner profile."
  >
    <form class="signup-form" novalidate @submit.prevent="onSubmit">
      <TextField
        id="cleaner-full-name"
        v-model="fullName"
        label="Full name"
        type="text"
        autocomplete="name"
        :error="fieldErrors.fullName"
        required
      />
      <TextField
        id="cleaner-email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        :error="fieldErrors.email"
        required
      />
      <TextField
        id="cleaner-mobile"
        v-model="mobileNumber"
        label="Mobile number"
        type="tel"
        placeholder="09XX XXX XXXX"
        autocomplete="tel"
        :error="fieldErrors.mobileNumber"
        required
      />
      <TextField
        id="cleaner-password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.password"
        required
      />
      <TextField
        id="cleaner-confirm-password"
        v-model="confirmPassword"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.confirmPassword"
        required
      />

      <NoticeBox title="Before you apply">
        <p>You will need the following six documents, and your account must be approved before you can apply to jobs.</p>
        <ul>
          <li>Birth certificate</li>
          <li>NBI clearance</li>
          <li>Police clearance</li>
          <li>Valid government-issued ID</li>
          <li>BIR</li>
          <li>Medical certificate / fit-to-work</li>
        </ul>
      </NoticeBox>

      <BaseButton type="submit">Create account</BaseButton>

      <p class="signup-form__alt">
        <NuxtLink to="/register" class="signup-form__link">Back</NuxtLink> to account type
      </p>
      <p class="signup-form__alt">
        Already have an account?
        <NuxtLink to="/login" class="signup-form__link">Log in</NuxtLink>
      </p>
    </form>
  </AuthLayout>
</template>

<style scoped>
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.signup-form__alt {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-soft);
  text-align: center;
}

.signup-form__link {
  color: var(--color-teal-dark);
  font-weight: 600;
  border-radius: 2px;
}

.signup-form__link:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}
</style>
