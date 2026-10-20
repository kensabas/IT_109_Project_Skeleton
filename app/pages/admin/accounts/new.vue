<!--
  /admin/accounts/new [F-04] — create an admin account (Wave 4.5).
  Only the main admin may do this; other admins see why not.
-->
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { validateCleanerSignUp, hasErrors, firstErroredField, type FieldErrors, type CleanerSignUpField } from '~/utils/validation'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const form = ref({ fullName: '', email: '', mobileNumber: '', password: '', confirmPassword: '' })
const errors = ref<FieldErrors<CleanerSignUpField>>({})
const created = ref('')

// Same fields and rules as the cleaner sign-up (name, email, mobile, password, confirm).
const ORDER: readonly CleanerSignUpField[] = ['fullName', 'email', 'mobileNumber', 'password', 'confirmPassword']
const IDS: Record<CleanerSignUpField, string> = {
  fullName: 'admin-name', email: 'admin-email', mobileNumber: 'admin-mobile', password: 'admin-password', confirmPassword: 'admin-confirm',
}

async function onSubmit() {
  created.value = ''
  errors.value = validateCleanerSignUp(form.value)
  if (!hasErrors(errors.value)) {
    const result = session.createAdmin(
      { name: form.value.fullName.trim(), email: form.value.email.trim(), mobileNumber: form.value.mobileNumber.trim(), password: form.value.password },
      session.currentUser,
    )
    if (result.ok) {
      created.value = form.value.fullName.trim()
      form.value = { fullName: '', email: '', mobileNumber: '', password: '', confirmPassword: '' }
      return
    }
    errors.value = { email: result.error }
  }
  await nextTick()
  const first = firstErroredField(errors.value, ORDER)
  if (first) document.getElementById(IDS[first])?.focus()
}
</script>

<template>
  <div class="page-stack">
    <p><NuxtLink to="/admin/accounts" class="link">← Back to accounts</NuxtLink></p>
    <PageHeader title="Create admin account" subtitle="Admins do not register. Only the main admin creates admin accounts." />

    <div v-if="!session.currentUser?.isMainAdmin" class="card">
      <p><strong>Only the main admin can create admin accounts.</strong></p>
      <p>You are signed in as a regular admin. Ask the main admin to create the account.</p>
    </div>

    <template v-else>
      <p v-if="created" class="message message--ok" role="status">Admin account created for {{ created }}. They can sign in on the normal login page.</p>
      <form class="card admin-form" novalidate @submit.prevent="onSubmit">
        <TextField :id="IDS.fullName" v-model="form.fullName" label="Full name" autocomplete="off" :error="errors.fullName" required />
        <TextField :id="IDS.email" v-model="form.email" label="Email" type="email" autocomplete="off" :error="errors.email" required />
        <TextField :id="IDS.mobileNumber" v-model="form.mobileNumber" label="Mobile number" type="tel" :error="errors.mobileNumber" required />
        <TextField :id="IDS.password" v-model="form.password" label="Temporary password" type="password" autocomplete="new-password" :error="errors.password" required />
        <TextField :id="IDS.confirmPassword" v-model="form.confirmPassword" label="Confirm password" type="password" autocomplete="new-password" :error="errors.confirmPassword" required />
        <div><button type="submit" class="btn btn--primary">Create admin account</button></div>
      </form>
    </template>
  </div>
</template>

<style scoped>
.admin-form { display: flex; flex-direction: column; gap: 18px; max-width: 560px; }
</style>
