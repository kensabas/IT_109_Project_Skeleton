<!--
  RequestForm [F-09, F-10]: the client request form (fields from plan D13,
  unconfirmed), used for new requests and for editing pending ones.
  Validates on submit, shows errors under each field, moves focus to the
  first field with an error, and shows the worked-out duration.
-->
<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import type { PinnedLocation } from '~/data/mockUsers'
import { hasErrors, firstErroredField, type FieldErrors } from '~/utils/validation'
import { validateRequestForm, REQUEST_FIELD_ORDER, type RequestField, type RequestFormValues } from '~/utils/requestForm'
import { hoursBetween, isoToday } from '~/utils/dates'

const props = withDefaults(
  defineProps<{ initial?: Partial<RequestFormValues>; initialPin?: PinnedLocation | null; submitLabel: string; formError?: string }>(),
  { initial: () => ({}), initialPin: null, formError: '' },
)
const emit = defineEmits<{ (e: 'submit', values: RequestFormValues, pin: PinnedLocation | null): void; (e: 'cancel'): void }>()

const values = reactive<RequestFormValues>({
  title: '', description: '', date: '', startTime: '', endTime: '', barangay: '', city: '', ratePhp: '',
  ...props.initial,
})
const pin = ref<PinnedLocation | null>(props.initialPin)
const errors = ref<FieldErrors<RequestField>>({})
const today = isoToday()

const ids: Record<RequestField, string> = {
  title: 'request-title', description: 'request-description', date: 'request-date', startTime: 'request-start',
  endTime: 'request-end', barangay: 'request-barangay', city: 'request-city', ratePhp: 'request-rate',
}

const duration = computed(() => {
  if (!values.startTime || !values.endTime || values.endTime <= values.startTime) return null
  return hoursBetween(values.startTime, values.endTime)
})

async function onSubmit() {
  errors.value = validateRequestForm(values, today)
  if (hasErrors(errors.value)) {
    await nextTick()
    const first = firstErroredField(errors.value, REQUEST_FIELD_ORDER)
    if (first) document.getElementById(ids[first])?.focus()
    return
  }
  emit('submit', { ...values }, pin.value)
}

function describedBy(field: RequestField, hintId?: string): string | undefined {
  const parts = [hintId, errors.value[field] ? `${ids[field]}-error` : undefined].filter(Boolean)
  return parts.length ? parts.join(' ') : undefined
}
</script>

<template>
  <form class="request-form card" novalidate @submit.prevent="onSubmit">
    <p v-if="formError" class="message message--error" role="alert">{{ formError }}</p>

    <TextField :id="ids.title" v-model="values.title" label="Title" :error="errors.title" required />

    <div class="field">
      <label :for="ids.description" class="field__label">Task description</label>
      <textarea
        :id="ids.description"
        v-model="values.description"
        class="field__input"
        :aria-invalid="errors.description ? 'true' : 'false'"
        :aria-describedby="describedBy('description')"
        required
      />
      <p v-if="errors.description" :id="`${ids.description}-error`" class="field__error" role="alert">{{ errors.description }}</p>
    </div>

    <div class="form-grid">
      <div class="field">
        <label :for="ids.date" class="field__label">Date</label>
        <input :id="ids.date" v-model="values.date" type="date" class="field__input" :min="today"
          :aria-invalid="errors.date ? 'true' : 'false'" :aria-describedby="describedBy('date')" required />
        <p v-if="errors.date" :id="`${ids.date}-error`" class="field__error" role="alert">{{ errors.date }}</p>
      </div>
      <div class="field">
        <label :for="ids.startTime" class="field__label">Start time</label>
        <input :id="ids.startTime" v-model="values.startTime" type="time" class="field__input"
          :aria-invalid="errors.startTime ? 'true' : 'false'" :aria-describedby="describedBy('startTime')" required />
        <p v-if="errors.startTime" :id="`${ids.startTime}-error`" class="field__error" role="alert">{{ errors.startTime }}</p>
      </div>
      <div class="field">
        <label :for="ids.endTime" class="field__label">End time</label>
        <input :id="ids.endTime" v-model="values.endTime" type="time" class="field__input"
          :aria-invalid="errors.endTime ? 'true' : 'false'" :aria-describedby="describedBy('endTime', 'request-duration')" required />
        <p v-if="errors.endTime" :id="`${ids.endTime}-error`" class="field__error" role="alert">{{ errors.endTime }}</p>
      </div>
    </div>
    <p id="request-duration" class="field__hint" aria-live="polite">
      Duration: <strong>{{ duration === null ? 'set a start and end time' : `${duration} hours` }}</strong>
    </p>

    <div class="form-grid">
      <TextField :id="ids.barangay" v-model="values.barangay" label="Barangay" :error="errors.barangay" required />
      <TextField :id="ids.city" v-model="values.city" label="City or municipality" :error="errors.city" required />
    </div>

    <LocationPicker
      id="request-pin"
      v-model="pin"
      label="Pin location on the map"
      optional
      hint="Helps cleaners see how far the job is. Until the map is added, choose the nearest city."
    />

    <div class="field">
      <label :for="ids.ratePhp" class="field__label">Proposed rate (PHP)</label>
      <input :id="ids.ratePhp" v-model="values.ratePhp" type="number" inputmode="numeric" min="1" step="1" class="field__input"
        :aria-invalid="errors.ratePhp ? 'true' : 'false'" :aria-describedby="describedBy('ratePhp')" required />
      <p v-if="errors.ratePhp" :id="`${ids.ratePhp}-error`" class="field__error" role="alert">{{ errors.ratePhp }}</p>
    </div>

    <div class="request-form__actions">
      <button type="submit" class="btn btn--primary">{{ submitLabel }}</button>
      <button type="button" class="btn btn--secondary" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>

<style scoped>
.request-form { display: flex; flex-direction: column; gap: 18px; max-width: 760px; }
.request-form__actions { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
