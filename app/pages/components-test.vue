<!--
  Temporary Phase 2 verification page: renders every Phase 2 component
  in every documented state (normal, with error, disabled where it
  applies). Not linked from anywhere; it exists so a human reviewer and
  Phase 2 verification scripts can inspect the components in one place.

  This page will be removed or replaced when Phase 3 adds the real
  Login, Choose account type, and sign-up screens.
-->
<script setup lang="ts">
import { ref } from 'vue'

// TextField states ----------------------------------------------------------
const emailNormal = ref('')
const emailWithError = ref('not-an-email')
const passwordNormal = ref('')

// SelectField states --------------------------------------------------------
const clientType = ref('')
const clientTypeWithError = ref('')
const clientTypeOptions = [
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'company', label: 'Company' },
  { value: 'establishment', label: 'Establishment' },
  { value: 'business', label: 'Business' },
]
</script>

<template>
  <AuthLayout
    heading="Phase 2: component check"
    sub-text="Every component in every state. Not a real screen."
  >
    <form class="demo-form" novalidate @submit.prevent>
      <h2 class="demo-form__group">TextField — normal</h2>
      <TextField
        id="demo-email-normal"
        v-model="emailNormal"
        label="Email"
        type="email"
        placeholder="you@example.com"
      />

      <h2 class="demo-form__group">TextField — with error</h2>
      <TextField
        id="demo-email-error"
        v-model="emailWithError"
        label="Email"
        type="email"
        error="Enter a valid email address."
      />

      <h2 class="demo-form__group">TextField — password type</h2>
      <TextField
        id="demo-password"
        v-model="passwordNormal"
        label="Password"
        type="password"
        autocomplete="new-password"
        required
      />

      <h2 class="demo-form__group">SelectField — normal</h2>
      <SelectField
        id="demo-client-type-normal"
        v-model="clientType"
        label="Client type"
        placeholder="Choose one…"
        :options="clientTypeOptions"
      />

      <h2 class="demo-form__group">SelectField — with error</h2>
      <SelectField
        id="demo-client-type-error"
        v-model="clientTypeWithError"
        label="Client type"
        placeholder="Choose one…"
        :options="clientTypeOptions"
        error="Choose a client type."
      />

      <h2 class="demo-form__group">BaseButton — normal</h2>
      <BaseButton type="submit">Create account</BaseButton>

      <h2 class="demo-form__group">BaseButton — disabled</h2>
      <BaseButton type="submit" disabled>Create account</BaseButton>

      <h2 class="demo-form__group">NoticeBox</h2>
      <NoticeBox title="Before you apply">
        <p>You will need six documents and admin approval before you can apply to jobs.</p>
        <ul>
          <li>Valid government ID</li>
          <li>Proof of address</li>
          <li>Barangay clearance</li>
          <li>NBI or police clearance</li>
          <li>Recent photo</li>
          <li>One character reference</li>
        </ul>
      </NoticeBox>
    </form>
  </AuthLayout>
</template>

<style scoped>
.demo-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.demo-form__group {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.demo-form__group:first-child {
  margin-top: 0;
}
</style>
