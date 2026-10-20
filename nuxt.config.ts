// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // Off (Ken's decision, 2026-10-20): @nuxt/devtools 3.4.3 printed a
  // Vite-hook warning on every `npm run dev` start (I-19).
  devtools: { enabled: false },

  // The mock session and data live in the browser (localStorage), which
  // the server cannot read. Rendering on the server would show every
  // protected page as signed out and then disagree with the browser
  // (hydration mismatch), so pages render in the browser only. Midterm
  // mock decision, logged in CLAUDE/for_ken_review.md.
  ssr: false,

  modules: ['@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // Leaflet is loaded with a dynamic import on the map pages. Listing it
  // here lets Vite pre-bundle it at start instead of discovering it on the
  // first map visit and reloading the page.
  vite: {
    optimizeDeps: {
      include: ['leaflet'],
    },
  },

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
