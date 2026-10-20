<!--
  LocationPicker [F-24, F-09]: pick a location. Wave 3 builds the city
  list (the fallback of plan D5); Wave 6.4 adds the map.
  v-model is a PinnedLocation or null (no pin).
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { PinnedLocation } from '~/data/mockUsers'
import { PH_CITIES } from '~/data/phCities'

const props = withDefaults(
  defineProps<{ modelValue: PinnedLocation | null; id: string; label: string; optional?: boolean; hint?: string }>(),
  { optional: false, hint: '' },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: PinnedLocation | null): void }>()

const NO_PIN = ''

// A pin that is not one of the listed cities (for example from the map)
// is still shown as the current choice.
const options = computed(() => {
  const current = props.modelValue
  const listed = PH_CITIES.some((c) => c.label === current?.label)
  return current && !listed ? [current, ...PH_CITIES] : [...PH_CITIES]
})

function onChange(event: Event) {
  const label = (event.target as HTMLSelectElement).value
  emit('update:modelValue', label === NO_PIN ? null : options.value.find((c) => c.label === label) ?? null)
}
</script>

<template>
  <div class="field">
    <label :for="id" class="field__label">{{ label }}<span v-if="optional"> (optional)</span></label>
    <p v-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
    <select
      :id="id"
      class="field__input"
      :value="modelValue?.label ?? NO_PIN"
      :aria-describedby="hint ? `${id}-hint` : undefined"
      @change="onChange"
    >
      <option :value="NO_PIN">{{ optional ? 'No pin' : 'Choose a city…' }}</option>
      <option v-for="city in options" :key="city.label" :value="city.label">{{ city.label }}</option>
    </select>
  </div>
</template>
