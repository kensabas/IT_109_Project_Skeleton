<!--
  LocationPicker [F-24, F-09]: pick a location on the map (Leaflet +
  OpenStreetMap, plan D5) or from a list of Philippine cities. The list
  is also the fallback when the map cannot load, and a keyboard-friendly
  alternative. v-model is a PinnedLocation or null (no pin).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PinnedLocation } from '~/data/mockUsers'
import { PH_CITIES } from '~/data/phCities'

const props = withDefaults(
  defineProps<{ modelValue: PinnedLocation | null; id: string; label: string; optional?: boolean; hint?: string }>(),
  { optional: false, hint: '' },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: PinnedLocation | null): void }>()

const NO_PIN = ''
const mode = ref<'map' | 'list'>('map')
const mapUnavailable = ref(false)

// A pin that is not one of the listed cities (for example from the map)
// is still shown as the current choice in the list.
const options = computed(() => {
  const current = props.modelValue
  const listed = PH_CITIES.some((c) => c.label === current?.label)
  return current && !listed ? [current, ...PH_CITIES] : [...PH_CITIES]
})

function onSelect(event: Event) {
  const label = (event.target as HTMLSelectElement).value
  emit('update:modelValue', label === NO_PIN ? null : options.value.find((c) => c.label === label) ?? null)
}

function onUnavailable() {
  mapUnavailable.value = true
  mode.value = 'list'
}
</script>

<template>
  <fieldset class="picker">
    <legend class="field__label">{{ label }}<span v-if="optional"> (optional)</span></legend>
    <p v-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>

    <div class="picker__modes" role="radiogroup" :aria-label="`How to choose: ${label}`">
      <label class="inline-check"><input v-model="mode" type="radio" value="map" :name="`${id}-mode`" :disabled="mapUnavailable" /> Map</label>
      <label class="inline-check"><input v-model="mode" type="radio" value="list" :name="`${id}-mode`" /> City list</label>
    </div>

    <p v-if="mapUnavailable" class="message message--info" role="status">The map could not load, so choose the nearest city from the list.</p>

    <LocationMap v-if="mode === 'map'" :id="`${id}-map`" :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @unavailable="onUnavailable" />

    <div v-else class="field">
      <label :for="id" class="field__label">City</label>
      <select :id="id" class="field__input" :value="modelValue?.label ?? NO_PIN" :aria-describedby="hint ? `${id}-hint` : undefined" @change="onSelect">
        <option :value="NO_PIN">{{ optional ? 'No pin' : 'Choose a city…' }}</option>
        <option v-for="city in options" :key="city.label" :value="city.label">{{ city.label }}</option>
      </select>
    </div>

    <p class="picker__current" aria-live="polite">
      Current pin: <strong>{{ modelValue?.label ?? 'none' }}</strong>
      <button v-if="optional && modelValue" type="button" class="btn btn--secondary btn--small" @click="emit('update:modelValue', null)">Remove pin</button>
    </p>
  </fieldset>
</template>

<style scoped>
.picker { border: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.picker legend { padding: 0; margin-bottom: 4px; }
.picker__modes { display: flex; gap: 16px; }
.picker__current { margin: 0; font-size: 14px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
</style>
