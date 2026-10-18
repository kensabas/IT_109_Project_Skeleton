<!--
  /register/client — F-01 Phase 3.3 + 4.4 + 5.5 (validation wiring).

  Phase 5 scope: run validateClientSignUp before signUp. If validation
  fails, show per-field errors and do NOT call signUp. If validation
  passes and signUp fails (duplicate email), show the duplicate message
  under the email field.
-->
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import type { ClientType } from '~/data/mockUsers'
import {
  validateClientSignUp,
  hasErrors,
  firstErroredField,
  type FieldErrors,
  type ClientSignUpField,
} from '~/utils/validation'

const clientType = ref('')
const fullName = ref('')
const email = ref('')
const mobileNumber = ref('')
const password = ref('')
const confirmPassword = ref('')
const fieldErrors = ref<FieldErrors<ClientSignUpField>>({})

const clientTypeOptions = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'company', label: 'Company' },
  { value: 'establishment', label: 'Establishment' },
  { value: 'business', label: 'Business' },
]

// 5.5.2 — display order + name-to-id map.
const CLIENT_ORDER: readonly ClientSignUpField[] = [
  'clientType',
  'fullName',
  'email',
  'mobileNumber',
  'password',
  'confirmPassword',
]
const CLIENT_FIELD_IDS: Record<ClientSignUpField, string> = {
  clientType: 'client-type',
  fullName: 'client-full-name',
  email: 'client-email',
  mobileNumber: 'client-mobile',
  password: 'client-password',
  confirmPassword: 'client-confirm-password',
}

const currentUser = useCurrentUserStore()

async function onSubmit() {
  // 5.5 — clear and re-check on every submit.
  fieldErrors.value = {}

  const errors = validateClientSignUp({
    clientType: clientType.value,
    fullName: fullName.value,
    email: email.value,
    mobileNumber: mobileNumber.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
  })
  if (hasErrors(errors)) {
    fieldErrors.value = errors
    await nextTick()
    const first = firstErroredField(errors, CLIENT_ORDER)
    if (first) document.getElementById(CLIENT_FIELD_IDS[first])?.focus()
    return
  }

  const result = currentUser.signUp({
    name: fullName.value,
    email: email.value,
    mobileNumber: mobileNumber.value,
    password: password.value,
    role: 'client',
    clientType: (clientType.value as ClientType) || undefined,
  })
  if (!result.ok) {
    // Duplicate-email message surfaces under the email field,
    // after validation already passed. Also move focus there.
    fieldErrors.value = { email: result.error }
    await nextTick()
    document.getElementById(CLIENT_FIELD_IDS.email)?.focus()
    return
  }
  navigateTo('/welcome')
}
</script>

<template>
  <AuthLayout
    heading="Create a client account"
    sub-text="Tell us a bit about who's requesting cleaners."
  >
    <form class="signup-form" novalidate @submit.prevent="onSubmit">
      <SelectField
        id="client-type"
        v-model="clientType"
        label="Client type"
        placeholder="Choose one…"
        :options="clientTypeOptions"
        :error="fieldErrors.clientType"
        required
      />
      <TextField
        id="client-full-name"
        v-model="fullName"
        label="Full name"
        type="text"
        autocomplete="name"
        :error="fieldErrors.fullName"
        required
      />
      <TextField
        id="client-email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        :error="fieldErrors.email"
        required
      />
      <TextField
        id="client-mobile"
        v-model="mobileNumber"
        label="Mobile number"
        type="tel"
        placeholder="09XX XXX XXXX"
        autocomplete="tel"
        :error="fieldErrors.mobileNumber"
        required
      />
      <TextField
        id="client-password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.password"
        required
      />
      <TextField
        id="client-confirm-password"
        v-model="confirmPassword"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        :error="fieldErrors.confirmPassword"
        required
      />
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
