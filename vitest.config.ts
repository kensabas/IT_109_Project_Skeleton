// Vitest configuration — plain unit tests for the Pinia stores.
// We do not need @nuxt/test-utils for Phase 4: the store is a plain
// Pinia module that works outside Nuxt's runtime. If we later test
// components or pages, we can add @nuxt/test-utils then.

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.spec.ts'],
  },
})
