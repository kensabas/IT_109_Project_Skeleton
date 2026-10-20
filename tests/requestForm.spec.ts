// Wave 3.5 [F-09, F-10] — request form validation (fields from plan D13,
// unconfirmed). `today` is passed in so the tests never depend on the clock.
import { describe, it, expect } from 'vitest'
import { validateRequestForm, REQUEST_FIELD_ORDER, REQUEST_ERRORS, type RequestFormValues } from '../app/utils/requestForm'
import { firstErroredField } from '../app/utils/validation'

const TODAY = '2026-10-20'
const valid: RequestFormValues = {
  title: 'Bedroom clean',
  description: 'Clean two bedrooms.',
  date: '2026-11-01',
  startTime: '09:00',
  endTime: '12:00',
  barangay: 'Kapitolyo',
  city: 'Pasig City',
  ratePhp: '600',
}

describe('validateRequestForm', () => {
  it('accepts a complete form', () => {
    expect(validateRequestForm(valid, TODAY)).toEqual({})
  })
  it('flags every required field when blank', () => {
    const blank = Object.fromEntries(Object.keys(valid).map((k) => [k, ' '])) as unknown as RequestFormValues
    const errors = validateRequestForm(blank, TODAY)
    for (const field of REQUEST_FIELD_ORDER) expect(errors[field]).toBe(REQUEST_ERRORS.required)
  })
  it('refuses a date in the past but accepts today', () => {
    expect(validateRequestForm({ ...valid, date: '2026-10-19' }, TODAY).date).toBe(REQUEST_ERRORS.pastDate)
    expect(validateRequestForm({ ...valid, date: TODAY }, TODAY).date).toBeUndefined()
  })
  it('needs the end time after the start time', () => {
    expect(validateRequestForm({ ...valid, endTime: '09:00' }, TODAY).endTime).toBe(REQUEST_ERRORS.endBeforeStart)
    expect(validateRequestForm({ ...valid, endTime: '08:00' }, TODAY).endTime).toBe(REQUEST_ERRORS.endBeforeStart)
  })
  it('needs a whole peso amount above zero', () => {
    expect(validateRequestForm({ ...valid, ratePhp: '0' }, TODAY).ratePhp).toBe(REQUEST_ERRORS.rate)
    expect(validateRequestForm({ ...valid, ratePhp: '-5' }, TODAY).ratePhp).toBe(REQUEST_ERRORS.rate)
    expect(validateRequestForm({ ...valid, ratePhp: '12.5' }, TODAY).ratePhp).toBe(REQUEST_ERRORS.rate)
    expect(validateRequestForm({ ...valid, ratePhp: 'abc' }, TODAY).ratePhp).toBe(REQUEST_ERRORS.rate)
  })
  it('focus goes to the first field in form order', () => {
    const errors = validateRequestForm({ ...valid, city: '', title: '' }, TODAY)
    expect(firstErroredField(errors, REQUEST_FIELD_ORDER)).toBe('title')
  })
})
