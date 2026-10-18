<!--
  SelectField: label + native select + error-message area.

  Used by the client sign-up form for the client-type dropdown.
  Uses a native <select> so platform keyboard behaviour, screen-reader
  announcements, and mobile pickers all come for free.

  Accessibility matches TextField: for/id link, aria-invalid when
  error, aria-describedby points at the error, error shown in text.
-->
<script setup lang="ts">
export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    id: string
    options: SelectOption[]
    placeholder?: string
    error?: string
    required?: boolean
  }>(),
  {
    placeholder: '',
    error: '',
    required: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="select-field">
    <label :for="id" class="select-field__label">
      {{ label }}
    </label>
    <select
      :id="id"
      class="select-field__input"
      :class="{ 'select-field__input--error': !!error, 'select-field__input--placeholder': modelValue === '' }"
      :value="modelValue"
      :required="required"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? `${id}-error` : undefined"
      @change="onChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" :id="`${id}-error`" class="select-field__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.select-field {
  display: flex;
  flex-direction: column;
}

.select-field__label {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.select-field__input {
  height: var(--control-height-input);
  padding: 0 14px;
  font-family: inherit;
  font-size: 16px;
  color: var(--color-text);
  background-color: var(--color-card);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-control);
  outline: none;
  appearance: none;
  /* Chevron drawn as SVG so no icon library is pulled in. */
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%234A6663'><path d='M5.293 7.293a1 1 0 0 1 1.414 0L10 10.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 0-1.414Z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px 20px;
  padding-right: 40px;
}

.select-field__input--placeholder {
  color: var(--color-text-soft);
}

.select-field__input:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

.select-field__input--error {
  border-color: var(--color-error);
}

.select-field__error {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--color-error);
}
</style>
