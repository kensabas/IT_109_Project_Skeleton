// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // Home route redirects to /login so new visitors land on the login
  // screen. There is no index page; Nitro handles the redirect at the
  // server layer.
  routeRules: {
    '/': { redirect: '/login' },
  },

  app: {
    head: {
      // Phase 6.3 — set the document language so screen readers pronounce
      // the UI as English. "en" is the broad default; unconfirmed if the
      // team wants Filipino/Tagalog ("tl") or regional variants later.
      htmlAttrs: {
        lang: 'en',
      },
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
