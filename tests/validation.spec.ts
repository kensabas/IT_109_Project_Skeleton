// Phase 5 — validation rules for the three auth forms.
// Validators are pure; errors are keyed by logical field name.

import { describe, it, expect } from 'vitest'
import {
  validateLogin,
  validateClientSignUp,
  validateCleanerSignUp,
  ERRORS,
} from '../app/utils/validation'

// ---------- 5.1 Required fields ----------

describe('5.1 required fields — validateLogin', () => {
  it('flags blank email and password', () => {
    const errors = validateLogin({ email: '', password: '' })
    expect(errors.email).toBe(ERRORS.required)
    expect(errors.password).toBe(ERRORS.required)
  })

  it('flags whitespace-only email and password', () => {
    const errors = validateLogin({ email: '   ', password: '   ' })
    expect(errors.email).toBe(ERRORS.required)
    expect(errors.password).toBe(ERRORS.required)
  })

  it('does not flag required when both are present', () => {
    const errors = validateLogin({ email: 'a@b.c', password: 'x' })
    expect(errors.email).toBeUndefined()
    expect(errors.password).toBeUndefined()
  })
})

describe('5.1 required fields — validateClientSignUp', () => {
  const blank = {
    clientType: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  }

  it('flags every field as required when blank', () => {
    const errors = validateClientSignUp(blank)
    expect(errors.clientType).toBe(ERRORS.required)
    expect(errors.fullName).toBe(ERRORS.required)
    expect(errors.email).toBe(ERRORS.required)
    expect(errors.mobileNumber).toBe(ERRORS.required)
    expect(errors.password).toBe(ERRORS.required)
    expect(errors.confirmPassword).toBe(ERRORS.required)
  })

  it('flags whitespace-only values as required', () => {
    const errors = validateClientSignUp({
      clientType: '   ',
      fullName: '   ',
      email: '   ',
      mobileNumber: '   ',
      password: '   ',
      confirmPassword: '   ',
    })
    expect(errors.clientType).toBe(ERRORS.required)
    expect(errors.fullName).toBe(ERRORS.required)
    expect(errors.email).toBe(ERRORS.required)
    expect(errors.mobileNumber).toBe(ERRORS.required)
    expect(errors.password).toBe(ERRORS.required)
    expect(errors.confirmPassword).toBe(ERRORS.required)
  })
})

describe('5.1 required fields — validateCleanerSignUp', () => {
  it('flags every field as required when blank (no clientType on cleaner)', () => {
    const errors = validateCleanerSignUp({
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
    })
    expect(errors.fullName).toBe(ERRORS.required)
    expect(errors.email).toBe(ERRORS.required)
    expect(errors.mobileNumber).toBe(ERRORS.required)
    expect(errors.password).toBe(ERRORS.required)
    expect(errors.confirmPassword).toBe(ERRORS.required)
  })
})
