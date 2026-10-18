// F-01 Phase 5 — validation rules shared by the three auth forms.
//
// Pure functions, no Vue / Pinia / DOM imports: tested with Vitest
// directly. Pages import the validators and the ERRORS messages and
// render field-level errors through the existing TextField and
// SelectField `error` props.

// -----------------------------------------------------------------------
// Shared error-message copy (unconfirmed — my own wording per the Phase 5
// prompt). Centralised so the run-status can list every message once.
// -----------------------------------------------------------------------

export const MIN_PASSWORD_LENGTH = 8

export const ERRORS = {
  required: 'This field is required.',
  invalidEmail: 'Enter a valid email address.',
  shortPassword: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  confirmMismatch: 'Passwords do not match.',
} as const

// Simple "something@something.something" rule per the Phase 5 prompt.
// Rejects whitespace in any of the three parts and requires at least
// one character on each side of @ and of the final dot. Not RFC 5322;
// enough for a demo form. Reported as unconfirmed in the run-status.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

// -----------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length > 0
}

// 5.5.2 — returns the earliest field (per the given display order) that
// has an error, or null when there is none. Pages pair this with a
// name-to-id map to decide which DOM element to focus.
export function firstErroredField<T extends string>(
  errors: FieldErrors<T>,
  order: readonly T[],
): T | null {
  for (const field of order) {
    if (errors[field]) return field
  }
  return null
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

// -----------------------------------------------------------------------
// 5.1 — Login: email + password required.
// -----------------------------------------------------------------------

export type LoginField = 'email' | 'password'
export interface LoginInput {
  email: string
  password: string
}

export function validateLogin(input: LoginInput): FieldErrors<LoginField> {
  const errors: FieldErrors<LoginField> = {}

  if (isBlank(input.email)) {
    errors.email = ERRORS.required
  } else if (!isValidEmail(input.email)) {
    errors.email = ERRORS.invalidEmail
  }
  if (isBlank(input.password)) {
    errors.password = ERRORS.required
  }
  return errors
}

// -----------------------------------------------------------------------
// 5.1 — Client sign-up: every field required.
// -----------------------------------------------------------------------

export type ClientSignUpField =
  | 'clientType'
  | 'fullName'
  | 'email'
  | 'mobileNumber'
  | 'password'
  | 'confirmPassword'

export interface ClientSignUpInput {
  clientType: string
  fullName: string
  email: string
  mobileNumber: string
  password: string
  confirmPassword: string
}

export function validateClientSignUp(
  input: ClientSignUpInput,
): FieldErrors<ClientSignUpField> {
  const errors: FieldErrors<ClientSignUpField> = {}

  if (isBlank(input.clientType)) errors.clientType = ERRORS.required
  if (isBlank(input.fullName)) errors.fullName = ERRORS.required
  if (isBlank(input.email)) errors.email = ERRORS.required
  else if (!isValidEmail(input.email)) errors.email = ERRORS.invalidEmail
  if (isBlank(input.mobileNumber)) errors.mobileNumber = ERRORS.required
  if (isBlank(input.password)) errors.password = ERRORS.required
  else if (input.password.length < MIN_PASSWORD_LENGTH) errors.password = ERRORS.shortPassword
  if (isBlank(input.confirmPassword)) errors.confirmPassword = ERRORS.required
  else if (input.password && input.password !== input.confirmPassword) {
    errors.confirmPassword = ERRORS.confirmMismatch
  }

  return errors
}

// -----------------------------------------------------------------------
// 5.1 — Cleaner sign-up: every field required (no clientType).
// -----------------------------------------------------------------------

export type CleanerSignUpField =
  | 'fullName'
  | 'email'
  | 'mobileNumber'
  | 'password'
  | 'confirmPassword'

export interface CleanerSignUpInput {
  fullName: string
  email: string
  mobileNumber: string
  password: string
  confirmPassword: string
}

export function validateCleanerSignUp(
  input: CleanerSignUpInput,
): FieldErrors<CleanerSignUpField> {
  const errors: FieldErrors<CleanerSignUpField> = {}

  if (isBlank(input.fullName)) errors.fullName = ERRORS.required
  if (isBlank(input.email)) errors.email = ERRORS.required
  else if (!isValidEmail(input.email)) errors.email = ERRORS.invalidEmail
  if (isBlank(input.mobileNumber)) errors.mobileNumber = ERRORS.required
  if (isBlank(input.password)) errors.password = ERRORS.required
  else if (input.password.length < MIN_PASSWORD_LENGTH) errors.password = ERRORS.shortPassword
  if (isBlank(input.confirmPassword)) errors.confirmPassword = ERRORS.required
  else if (input.password && input.password !== input.confirmPassword) {
    errors.confirmPassword = ERRORS.confirmMismatch
  }

  return errors
}
