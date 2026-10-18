<!--
  TextField: label + input + error-message area.

  Accessibility (built in now, not deferred to Phase 6):
    - The <label> is linked to the <input> via for/id. The placeholder is
      a hint, never a label substitute.
    - When an error is present, aria-invalid="true" and aria-describedby
      points at the error element, so screen readers read the error with
      the field.
    - Errors are shown in text as well as colour.
    - Native <input> keeps built-in keyboard/focus/autofill behaviour.
-->
<script setup lang="ts">
type InputType = 'text' | 'email' | 'tel' | 'password'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    id: string
    type?: InputType
    placeholder?: string
    error?: string
    required?: boolean
    autocomplete?: string
  }>(),
  {
    type: 'text',
    placeholder: '',
    error: '',
    required: false,
    autocomplete: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="text-field">
    <label :for="id" class="text-field__label">
      {{ label }}
    </label>
    <input
      :id="id"
      class="text-field__input"
      :class="{ 'text-field__input--error': !!error }"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="error ? `${id}-error` : undefined"
      @input="onInput"
    />
    <p v-if="error" :id="`${id}-error`" class="text-field__error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.text-field {
  display: flex;
  flex-direction: column;
}

.text-field__label {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.text-field__input {
  height: var(--control-height-input);
  padding: 0 14px;
  font-family: inherit;
  font-size: 16px;
  color: var(--color-text);
  background-color: var(--color-card);
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-control);
  outline: none;
}

.text-field__input::placeholder {
  color: var(--color-text-soft);
}

.text-field__input:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
}

.text-field__input--error {
  border-color: var(--color-error);
}

.text-field__error {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--color-error);
}
</style>
