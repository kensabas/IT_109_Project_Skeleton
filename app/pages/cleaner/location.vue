<!--
  /cleaner/location [F-24] — pin the place distances are measured from
  (plan D5: straight line from this pin). Map or city list.
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import type { PinnedLocation } from '~/data/mockUsers'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const pin = ref<PinnedLocation | null>(session.currentUser?.pinnedLocation ?? null)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

function save() {
  if (!pin.value || !session.currentUser) {
    message.value = { kind: 'error', text: 'Choose a place on the map or from the list first.' }
    return
  }
  const result = session.setPinnedLocation(session.currentUser.email, pin.value)
  message.value = result.ok ? { kind: 'ok', text: `Location saved: ${pin.value.label}.` } : { kind: 'error', text: result.error }
}
</script>

<template>
  <div class="page-stack">
    <PageHeader title="My location" subtitle="Distances in the marketplace are measured in a straight line from this pin." />
    <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">{{ message.text }}</p>
    <div class="card location-card">
      <LocationPicker id="cleaner-pin" v-model="pin" label="Pinned location" />
      <div class="location-card__actions">
        <button type="button" class="btn btn--primary" @click="save">Save location</button>
        <NuxtLink to="/cleaner/marketplace" class="btn btn--secondary">Back to the marketplace</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-card { display: flex; flex-direction: column; gap: 16px; max-width: 760px; }
.location-card__actions { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
