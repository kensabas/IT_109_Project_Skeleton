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

// ---------- 5.2 Email format ----------

const BAD_EMAILS = [
  'notanemail',
  'no-at-sign.com',
  'spaces in@example.com',
  '@example.com',
  'name@',
  'name@domain',    // no TLD
  'name@.com',
  'name@domain.',
]

const GOOD_EMAILS = [
  'a@b.co',
  'first.last@example.com',
  'MIX3D_case@sub.example.co.uk',
]

describe('5.2 email format — validateLogin', () => {
  it.each(BAD_EMAILS)('flags "%s" as invalid email', (bad) => {
    const errors = validateLogin({ email: bad, password: 'anything' })
    expect(errors.email).toBe(ERRORS.invalidEmail)
  })

  it.each(GOOD_EMAILS)('accepts "%s" as a valid email', (good) => {
    const errors = validateLogin({ email: good, password: 'anything' })
    expect(errors.email).toBeUndefined()
  })

  it('required beats invalid-format when blank', () => {
    const errors = validateLogin({ email: '', password: 'x' })
    expect(errors.email).toBe(ERRORS.required)
  })
})

describe('5.2 email format — validateClientSignUp', () => {
  const base = {
    clientType: 'homeowner',
    fullName: 'Someone Reyes',
    mobileNumber: '09170001234',
    password: 'password123',
    confirmPassword: 'password123',
  }
  it('rejects a malformed email', () => {
    const errors = validateClientSignUp({ ...base, email: 'notanemail' })
    expect(errors.email).toBe(ERRORS.invalidEmail)
  })
  it('accepts a well-formed email', () => {
    const errors = validateClientSignUp({ ...base, email: 'ok@example.com' })
    expect(errors.email).toBeUndefined()
  })
})

describe('5.2 email format — validateCleanerSignUp', () => {
  const base = {
    fullName: 'Someone Reyes',
    mobileNumber: '09170001234',
    password: 'password123',
    confirmPassword: 'password123',
  }
  it('rejects a malformed email', () => {
    const errors = validateCleanerSignUp({ ...base, email: 'notanemail' })
    expect(errors.email).toBe(ERRORS.invalidEmail)
  })
  it('accepts a well-formed email', () => {
    const errors = validateCleanerSignUp({ ...base, email: 'ok@example.com' })
    expect(errors.email).toBeUndefined()
  })
})

// ---------- 5.3 Password min 8 characters (sign-up only) ----------

describe('5.3 password min length — validateClientSignUp', () => {
  const base = {
    clientType: 'homeowner',
    fullName: 'Someone Reyes',
    email: 'ok@example.com',
    mobileNumber: '09170001234',
  }
  it('rejects a 7-char password', () => {
    const errors = validateClientSignUp({
      ...base,
      password: 'short12',
      confirmPassword: 'short12',
    })
    expect(errors.password).toBe(ERRORS.shortPassword)
  })
  it('accepts an exactly-8-char password', () => {
    const errors = validateClientSignUp({
      ...base,
      password: '12345678',
      confirmPassword: '12345678',
    })
    expect(errors.password).toBeUndefined()
  })
  it('accepts a longer password', () => {
    const errors = validateClientSignUp({
      ...base,
      password: 'longpassword',
      confirmPassword: 'longpassword',
    })
    expect(errors.password).toBeUndefined()
  })
})

describe('5.3 password min length — validateCleanerSignUp', () => {
  const base = {
    fullName: 'Someone Reyes',
    email: 'ok@example.com',
    mobileNumber: '09170001234',
  }
  it('rejects a 7-char password', () => {
    const errors = validateCleanerSignUp({
      ...base,
      password: 'short12',
      confirmPassword: 'short12',
    })
    expect(errors.password).toBe(ERRORS.shortPassword)
  })
  it('accepts an exactly-8-char password', () => {
    const errors = validateCleanerSignUp({
      ...base,
      password: '12345678',
      confirmPassword: '12345678',
    })
    expect(errors.password).toBeUndefined()
  })
})

describe('5.3 password min length — validateLogin DOES NOT enforce it', () => {
  it('accepts a short password on login (so wrong-credentials path still runs)', () => {
    const errors = validateLogin({ email: 'ok@example.com', password: 'x' })
    expect(errors.password).toBeUndefined()
  })
})
