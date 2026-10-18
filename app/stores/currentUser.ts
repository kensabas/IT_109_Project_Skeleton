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
import type { MockUser } from '../data/mockUsers'

interface State {
  currentUser: MockUser | null
}

export const useCurrentUserStore = defineStore('currentUser', {
  state: (): State => ({
    currentUser: null,
  }),

  getters: {
    isLoggedIn: (state): boolean => state.currentUser !== null,
  },

  actions: {
    logOut() {
      this.currentUser = null
    },
  },
})
