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
import { isoToday } from '../utils/dates'
import { initialMockUsers, type AccountState, type MockUser, type NewUserInput, type PinnedLocation } from '../data/mockUsers'
import { ADMIN_ONLY, fail, isAdmin, OK, type ActionResult } from '../utils/result'
import { useDocumentsStore } from './documents'

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

// Plan D6 (Q12 unconfirmed): a suspended account cannot sign in.
const SUSPENDED_MESSAGE = 'This account is suspended. Please contact the CleanLinis admin.'

// F-04: admins have no registration; only the main admin creates them.
const NO_ADMIN_SIGN_UP_MESSAGE = 'Admin accounts are created by the main admin in the admin panel.'

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
      if (match.accountState === 'suspended') {
        return { ok: false, error: SUSPENDED_MESSAGE }
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
      if (input.role === 'admin') {
        return { ok: false, error: NO_ADMIN_SIGN_UP_MESSAGE }
      }
      const newUser: MockUser = {
        ...input,
        accountState: 'activated',
        approvalStatus: input.role === 'cleaner' ? 'pending' : 'not-required',
        registeredAt: isoToday(),
        pinnedLocation: input.role === 'cleaner' ? null : undefined,
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

    findByEmail(email: string): MockUser | undefined {
      const needle = normalizeEmail(email)
      return this.users.find((u) => normalizeEmail(u.email) === needle)
    },

    // F-05, F-14 — plan D6 (Q12 unconfirmed). Admins change states; an
    // admin cannot change their own state (would lock them out).
    setAccountState(email: string, state: AccountState, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const user = this.findByEmail(email)
      if (!user) return fail('Account not found.')
      if (normalizeEmail(user.email) === normalizeEmail(actor!.email)) return fail('You cannot change your own account state.')
      user.accountState = state
      return OK
    },

    // F-03 — plan D7 (Q18 unconfirmed): approval needs all six documents
    // approved by an admin.
    approveCleaner(email: string, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const user = this.findByEmail(email)
      if (user?.role !== 'cleaner') return fail('Cleaner not found.')
      if (!useDocumentsStore().allApproved(user.email)) {
        return fail('All six documents must be approved before the cleaner can be approved.')
      }
      user.approvalStatus = 'approved'
      return OK
    },

    rejectCleaner(email: string, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const user = this.findByEmail(email)
      if (user?.role !== 'cleaner') return fail('Cleaner not found.')
      user.approvalStatus = 'rejected'
      return OK
    },

    // F-24 — the cleaner's pinned location (plan D5).
    setPinnedLocation(email: string, location: PinnedLocation): ActionResult {
      const user = this.findByEmail(email)
      if (user?.role !== 'cleaner') return fail('Only cleaners pin a location.')
      user.pinnedLocation = { ...location }
      return OK
    },

    // F-04 — only the main admin creates admin accounts (no registration).
    createAdmin(input: Pick<MockUser, 'name' | 'email' | 'mobileNumber' | 'password'>, actor: MockUser | null): ActionResult {
      if (!isAdmin(actor) || !actor!.isMainAdmin) return fail('Only the main admin can create admin accounts.')
      if (this.findByEmail(input.email)) return fail(DUPLICATE_EMAIL_MESSAGE)
      this.users.push({
        ...input,
        role: 'admin',
        isMainAdmin: false,
        accountState: 'activated',
        approvalStatus: 'not-required',
        registeredAt: isoToday(),
      })
      return OK
    },
  },
})
