<!--
  /register/cleaner — F-01 Phase 3.4
  Fields and content from the plan's approved-screens table (row 4):
  full name, email, mobile number, password, confirm password, and a
  notice box with the 6 required documents and the approval message.
  The six documents are from the current-run prompt:
  birth certificate, NBI clearance, police clearance, valid
  government-issued ID, BIR, medical certificate / fit-to-work.

  Phase 3 scope only: no validation (Phase 5), no sign-up logic
  (Phase 4). Submit is intercepted; back/log-in links are added in 3.5.2.
-->
<script setup lang="ts">
import { ref } from 'vue'

const fullName = ref('')
const email = ref('')
const mobileNumber = ref('')
const password = ref('')
const confirmPassword = ref('')
</script>

<template>
  <AuthLayout
    heading="Apply as a cleaner"
    sub-text="Create your cleaner profile."
  >
    <form class="signup-form" novalidate @submit.prevent>
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
