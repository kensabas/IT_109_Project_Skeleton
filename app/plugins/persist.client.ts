// Wave 1.5 — saves the mock stores in localStorage (browser only).
import type { Pinia } from 'pinia'
import { createPersistPlugin } from '~/utils/persistence'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia
  pinia.use(createPersistPlugin(window.localStorage))
})
