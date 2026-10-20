<!--
  /client/requests/new [F-09] — send a request to the admin (Wave 3.2).
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useRequestsStore } from '~/stores/requests'
import type { PinnedLocation } from '~/data/mockUsers'
import type { RequestFormValues } from '~/utils/requestForm'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const requests = useRequestsStore()
const formError = ref('')

function onSubmit(values: RequestFormValues, pin: PinnedLocation | null) {
  const result = requests.createRequest(
    {
      title: values.title.trim(),
      description: values.description.trim(),
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      barangay: values.barangay.trim(),
      city: values.city.trim(),
      lat: pin?.lat ?? null,
      lng: pin?.lng ?? null,
      ratePhp: Number(values.ratePhp),
    },
    session.currentUser,
  )
  if (!result.ok) {
    formError.value = result.error
    return
  }
  navigateTo({ path: '/client/requests', query: { created: '1' } })
}
</script>

<template>
  <div class="page-stack">
    <p><NuxtLink to="/client/requests" class="link">← Back to my requests</NuxtLink></p>
    <PageHeader title="New request" subtitle="Tell the admin what cleaning you need. The admin reviews it before it is posted for cleaners." />
    <ClientRequestForm submit-label="Send request" :form-error="formError" @submit="onSubmit" @cancel="navigateTo('/client/requests')" />
  </div>
</template>
