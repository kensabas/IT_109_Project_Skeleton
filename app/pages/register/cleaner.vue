<!--
  /register/cleaner — F-01 Phase 3.4 + 4.4 (sign-up logic).
  Fields from the plan's approved-screens table (row 4).

  Phase 4 scope: adds the sign-up to the in-memory mock list via the
  currentUser Pinia store. No validation (Phase 5) — a sign-up with
  blank fields will be accepted; that's a known gap, listed in the
  Phase 4 run-status. Duplicate email is handled in 4.4.1.
  Navigation to /welcome lands in 4.5.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'

const fullName = ref('')
const email = ref('')
const mobileNumber = ref('')
const password = ref('')
const confirmPassword = ref('')
const emailError = ref('')

const currentUser = useCurrentUserStore()

function onSubmit() {
  const result = currentUser.signUp({
    name: fullName.value,
    email: email.value,
    mobileNumber: mobileNumber.value,
    password: password.value,
    role: 'cleaner',
  })
  if (!result.ok) {
    emailError.value = result.error
    return
  }
  emailError.value = ''
  // Phase 4.5 adds the navigation to /welcome.
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
        required
      />
      <TextField
        id="cleaner-email"
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        :error="emailError"
        required
      />
      <TextField
        id="cleaner-mobile"
        v-model="mobileNumber"
        label="Mobile number"
        type="tel"
        placeholder="09XX XXX XXXX"
        autocomplete="tel"
        required
      />
      <TextField
        id="cleaner-password"
        v-model="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        required
      />
      <TextField
        id="cleaner-confirm-password"
        v-model="confirmPassword"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
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
}
</style>
