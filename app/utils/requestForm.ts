// Wave 3.2 / 3.5 [F-09, F-10] — validation for the client request form.
// Fields from plan D13 (unconfirmed). Pure; the page passes today's date.
import type { FieldErrors } from './validation'

export interface RequestFormValues {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  barangay: string
  city: string
  ratePhp: string
}

export type RequestField = keyof RequestFormValues

export const REQUEST_FIELD_ORDER: readonly RequestField[] = [
  'title', 'description', 'date', 'startTime', 'endTime', 'barangay', 'city', 'ratePhp',
]

export const REQUEST_ERRORS = {
  required: 'This field is required.',
  pastDate: 'Choose today or a later date.',
  endBeforeStart: 'End time must be after the start time.',
  rate: 'Enter a whole peso amount above 0.',
} as const

const WHOLE_NUMBER = /^\d+$/

export function validateRequestForm(values: RequestFormValues, today: string): FieldErrors<RequestField> {
  const errors: FieldErrors<RequestField> = {}
  for (const field of REQUEST_FIELD_ORDER) {
    if (!values[field].trim()) errors[field] = REQUEST_ERRORS.required
  }
  if (!errors.date && values.date < today) errors.date = REQUEST_ERRORS.pastDate
  if (!errors.startTime && !errors.endTime && values.endTime <= values.startTime) {
    errors.endTime = REQUEST_ERRORS.endBeforeStart
  }
  if (!errors.ratePhp && (!WHOLE_NUMBER.test(values.ratePhp.trim()) || Number(values.ratePhp) <= 0)) {
    errors.ratePhp = REQUEST_ERRORS.rate
  }
  return errors
}
