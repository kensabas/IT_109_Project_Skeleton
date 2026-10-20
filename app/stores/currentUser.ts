// F-01 Phase 4.2 — Pinia store for the currently signed-in user.
//
// State:
//   currentUser — the signed-in user object, or null if nobody is signed in.
//
// Getters:
//   isLoggedIn — true when currentUser is set.
//
// Actions:
//   logOut — clears currentUser.
//
// The 4.3 login and 4.4 sign-up actions are added in later commits.
// Imports are explicit so this store can be tested with plain Vitest
// (outside the Nuxt runtime where defineStore would be auto-imported).

import { defineStore } from 'pinia'
import { initialMockUsers, type MockUser, type NewUserInput } from '../data/mockUsers'

interface State {
  currentUser: MockUser | null
  // Mock users list, kept in memory only. Lost on refresh — this is
  // the midterm's required behavior per PLAN_F-01.md Phase 4.4.
  users: MockUser[]
}

// Email comparison is case-insensitive on login (also on duplicate-email
// check in 4.4.1). Unconfirmed choice per the Phase 4 prompt; reported
// in the Phase 4 run-status.
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

// Single error message for both "unknown email" and "wrong password".
// The plan allows this ("one message for both cases is fine").
const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect.'

// Shown under the email field when a sign-up uses an email already in
// the list. Phase 4.4.1.
const DUPLICATE_EMAIL_MESSAGE = 'An account with this email already exists.'

export type AuthResult = { ok: true } | { ok: false; error: string }

export const useCurrentUserStore = defineStore('currentUser', {
  state: (): State => ({
    currentUser: null,
    users: initialMockUsers(),
  }),

  getters: {
    isLoggedIn: (state): boolean => state.currentUser !== null,
  },

  actions: {
    logOut() {
      this.currentUser = null
    },

    logIn(email: string, password: string): AuthResult {
      const needle = normalizeEmail(email)
      const match = this.users.find(
        (u) => normalizeEmail(u.email) === needle && u.password === password,
      )
      if (!match) {
        return { ok: false, error: INVALID_CREDENTIALS_MESSAGE }
      }
      this.currentUser = match
      return { ok: true }
    },

    // Appends the new user to the in-memory list and signs them in.
    // Blocks the sign-up if the email is already in the list (4.4.1,
    // case-insensitive; unconfirmed choice, see Phase 4 run-status).
    // New accounts start activated; cleaners also start pending
    // approval (F-03: cannot apply before approval).
    signUp(input: NewUserInput): AuthResult {
      const newUser: MockUser = {
        ...input,
        accountState: 'activated',
        approvalStatus: input.role === 'cleaner' ? 'pending' : 'not-required',
      }
      const needle = normalizeEmail(newUser.email)
      const already = this.users.some(
        (u) => normalizeEmail(u.email) === needle,
      )
      if (already) {
        return { ok: false, error: DUPLICATE_EMAIL_MESSAGE }
      }
      this.users.push(newUser)
      this.currentUser = newUser
      return { ok: true }
    },
  },
})
