<!--
  /register/client — F-01 Phase 3.3
  Fields and content from the plan's approved-screens table (row 3):
  client type (homeowner, company, establishment, business), full name,
  email, mobile number, password, confirm password.

  Phase 3 scope only: no validation (Phase 5), no sign-up logic (Phase 4).
  Submit is intercepted; back/log-in links are added in 3.5.2.
-->
<script setup lang="ts">
import { ref } from 'vue'

const clientType = ref('')
const fullName = ref('')
const email = ref('')
const mobileNumber = ref('')
const password = ref('')
const confirmPassword = ref('')

const clientTypeOptions = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'company', label: 'Company' },
  { value: 'establishment', label: 'Establishment' },
  { value: 'business', label: 'Business' },
]
</script>

<template>
  <AuthLayout
    heading="Create a client account"
    sub-text="Tell us a bit about who's requesting cleaners."
  >
    <form class="signup-form" novalidate @submit.prevent>
      <SelectField
        id="client-type"
        v-model="clientType"
        label="Client type"
        placeholder="Choose one…"
        :options="clientTypeOptions"
        required
      />
      <TextField
        id="client-full-name"
        v-model="fullName"
        label="Full name"
        type="text"
        autocomplete="name"
        required
      />
      <TextField
        id="client-email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
      <TextField
        id="client-mobile"
        v-model="mobileNumber"
        label="Mobile number"
        type="tel"
        placeholder="09XX XXX XXXX"
        autocomplete="tel"
        required
      />
      <TextField
        id="client-password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        required
      />
      <TextField
        id="client-confirm-password"
        v-model="confirmPassword"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
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
}
</style>
