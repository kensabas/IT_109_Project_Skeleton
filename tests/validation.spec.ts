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

// ---------- 5.4 Confirm password must match ----------

describe('5.4 confirm password — validateClientSignUp', () => {
  const base = {
    clientType: 'homeowner',
    fullName: 'Someone Reyes',
    email: 'ok@example.com',
    mobileNumber: '09170001234',
  }
  it('flags a mismatched confirmPassword', () => {
    const errors = validateClientSignUp({
      ...base,
      password: 'password123',
      confirmPassword: 'password124',
    })
    expect(errors.confirmPassword).toBe(ERRORS.confirmMismatch)
  })
  it('does not flag mismatch when confirm is blank (required wins)', () => {
    const errors = validateClientSignUp({
      ...base,
      password: 'password123',
      confirmPassword: '',
    })
    expect(errors.confirmPassword).toBe(ERRORS.required)
  })
  it('accepts matching passwords', () => {
    const errors = validateClientSignUp({
      ...base,
      password: 'password123',
      confirmPassword: 'password123',
    })
    expect(errors.confirmPassword).toBeUndefined()
    expect(errors.password).toBeUndefined()
  })
})

describe('5.4 confirm password — validateCleanerSignUp', () => {
  const base = {
    fullName: 'Someone Reyes',
    email: 'ok@example.com',
    mobileNumber: '09170001234',
  }
  it('flags a mismatched confirmPassword', () => {
    const errors = validateCleanerSignUp({
      ...base,
      password: 'password123',
      confirmPassword: 'different1',
    })
    expect(errors.confirmPassword).toBe(ERRORS.confirmMismatch)
  })
})

// ---------- 5.5 Fence: pages must not call the store on failed validation ----------
// These simulate the page's submit flow:
//   const errors = validate(...)
//   if (hasErrors(errors)) return      // do NOT call the store
//   store.logIn / store.signUp(...)

import { setActivePinia, createPinia } from 'pinia'
import { useCurrentUserStore } from '../app/stores/currentUser'
import { hasErrors } from '../app/utils/validation'

describe('5.5 fence — a blank client sign-up does not add a user to the store', () => {
  it('validator flags errors AND the store list stays the same size', () => {
    setActivePinia(createPinia())
    const store = useCurrentUserStore()
    const sizeBefore = store.users.length

    const input = {
      clientType: '',
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
    }
    const errors = validateClientSignUp(input)
    expect(hasErrors(errors)).toBe(true)
    // Simulate the page's fence:
    if (!hasErrors(errors)) {
      store.signUp({
        name: input.fullName,
        email: input.email,
        mobileNumber: input.mobileNumber,
        password: input.password,
        role: 'client',
      })
    }
    expect(store.users.length).toBe(sizeBefore)
    expect(store.currentUser).toBeNull()
  })
})

describe('5.5 fence — a blank cleaner sign-up does not add a user to the store', () => {
  it('validator flags errors AND the store list stays the same size', () => {
    setActivePinia(createPinia())
    const store = useCurrentUserStore()
    const sizeBefore = store.users.length

    const input = {
      fullName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
    }
    const errors = validateCleanerSignUp(input)
    expect(hasErrors(errors)).toBe(true)
    if (!hasErrors(errors)) {
      store.signUp({
        name: input.fullName,
        email: input.email,
        mobileNumber: input.mobileNumber,
        password: input.password,
        role: 'cleaner',
      })
    }
    expect(store.users.length).toBe(sizeBefore)
    expect(store.currentUser).toBeNull()
  })
})

describe('5.5 fence — an invalid login does not call store.logIn', () => {
  it('blank login: validator flags and logIn is not called, so currentUser stays null', () => {
    setActivePinia(createPinia())
    const store = useCurrentUserStore()
    const errors = validateLogin({ email: '', password: '' })
    expect(hasErrors(errors)).toBe(true)
    if (!hasErrors(errors)) {
      store.logIn('', '')
    }
    expect(store.currentUser).toBeNull()
  })

  it('bad-email login: validator flags and logIn is not called', () => {
    setActivePinia(createPinia())
    const store = useCurrentUserStore()
    const errors = validateLogin({ email: 'not-an-email', password: 'anything' })
    expect(errors.email).toBe(ERRORS.invalidEmail)
    if (!hasErrors(errors)) {
      store.logIn('not-an-email', 'anything')
    }
    expect(store.currentUser).toBeNull()
  })
})
