<!--
  LocationMap [F-24]: Leaflet map with OpenStreetMap tiles (plan D5),
  browser only. Click to pin, or move the map and use "Pin the map
  centre" (keyboard users: arrow keys move a focused map). The
  OpenStreetMap attribution stays visible (OSM tile policy). If Leaflet or
  the tiles cannot load, emits "unavailable" so the city list is shown.
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PinnedLocation } from '~/data/mockUsers'
import { isInPhilippines, pinFromMap } from '~/utils/pins'

const props = defineProps<{ modelValue: PinnedLocation | null; id: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: PinnedLocation): void; (e: 'unavailable'): void }>()

const MANILA = { lat: 14.5995, lng: 120.9842 }
const PIN_ZOOM = 13
const COUNTRY_ZOOM = 6
const TILE_TIMEOUT_MS = 8000
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const container = ref<HTMLElement | null>(null)
const message = ref('')
// Leaflet types are not installed (no @types package in the plan), so the
// map objects are kept loosely typed.
let map: any = null
let marker: any = null
let leaflet: any = null

function place(point: { lat: number; lng: number }) {
  if (!map || !leaflet) return
  if (marker) marker.setLatLng(point)
  else {
    // Leaflet needs colour values, so read the main.css tokens.
    const tokens = getComputedStyle(document.documentElement)
    marker = leaflet.circleMarker(point, {
      radius: 9,
      weight: 3,
      color: tokens.getPropertyValue('--color-teal-dark').trim(),
      fillColor: tokens.getPropertyValue('--color-teal').trim(),
      fillOpacity: 0.85,
    }).addTo(map)
  }
}

function choose(point: { lat: number; lng: number }) {
  if (!isInPhilippines(point)) {
    message.value = 'Choose a place in the Philippines.'
    return
  }
  message.value = ''
  const pin = pinFromMap(point)
  place(pin)
  emit('update:modelValue', pin)
}

function pinCentre() {
  if (map) choose(map.getCenter())
}

onMounted(async () => {
  try {
    leaflet = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
  } catch {
    emit('unavailable')
    return
  }
  if (!container.value) return
  const start = props.modelValue ?? MANILA
  map = leaflet.map(container.value, { keyboard: true }).setView(start, props.modelValue ? PIN_ZOOM : COUNTRY_ZOOM)
  let loaded = false
  const tiles = leaflet.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map)
  tiles.on('tileload', () => { loaded = true })
  setTimeout(() => { if (!loaded) emit('unavailable') }, TILE_TIMEOUT_MS)
  if (props.modelValue) place(props.modelValue)
  map.on('click', (event: { latlng: { lat: number; lng: number } }) => choose(event.latlng))
})

watch(() => props.modelValue, (pin) => { if (pin) place(pin) })

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="location-map">
    <div
      :id="id"
      ref="container"
      class="location-map__canvas"
      role="region"
      :aria-label="`Map. Click a place to pin it, or move the map and use Pin the map centre.`"
    />
    <div class="location-map__actions">
      <button type="button" class="btn btn--secondary btn--small" @click="pinCentre">Pin the map centre</button>
      <p v-if="message" class="field__error" role="alert">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.location-map { display: flex; flex-direction: column; gap: 8px; }
.location-map__canvas {
  height: 320px;
  width: 100%;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-control);
  overflow: hidden;
  z-index: 0;
}
.location-map__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
</style>
