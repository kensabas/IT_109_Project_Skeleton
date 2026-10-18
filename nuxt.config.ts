// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // Phase 3.5.1 — the four auth routes are set by file-based routing in
  // app/pages/. The home route redirects to /login so new visitors land
  // on the login screen; the Phase 1 placeholder index.vue stays as the
  // redirect target source (users don't see it).
  routeRules: {
    '/': { redirect: '/login' },
  },

  app: {
    head: {
      title: 'CleanLinis',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
        }
      ]
    }
  }
})
