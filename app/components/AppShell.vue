<!--
  AppShell [F-06]: frame for every signed-in page.
  Skip link, header (logo, role label, user name, role navigation,
  Sign out), a menu button on small screens (aria-expanded), the
  "no access" notice from the route guard, and "Reset demo data".
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Pinia } from 'pinia'
import { useCurrentUserStore } from '~/stores/currentUser'
import { navFor, roleLabel } from '~/utils/navigation'
import { NO_ACCESS_NOTICE, LOGIN_PATH } from '~/utils/access'
import { resetDemoData } from '~/utils/persistence'

const route = useRoute()
const session = useCurrentUserStore()
const nuxtApp = useNuxtApp()

const user = computed(() => session.currentUser)
const links = computed(() => (user.value ? navFor(user.value.role) : []))
const label = computed(() => (user.value ? roleLabel(user.value.role, !!user.value.isMainAdmin) : ''))
const showNoAccess = computed(() => route.query.notice === NO_ACCESS_NOTICE)

const menuOpen = ref(false)
watch(() => route.fullPath, () => { menuOpen.value = false })

function isCurrent(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function signOut() {
  session.logOut()
  navigateTo(LOGIN_PATH)
}

const confirmingReset = ref(false)
function doReset() {
  resetDemoData(nuxtApp.$pinia as Pinia, window.localStorage)
  confirmingReset.value = false
  navigateTo(LOGIN_PATH)
}
</script>

<template>
  <div class="shell">
    <a href="#main-content" class="shell__skip">Skip to main content</a>

    <header class="shell__header">
      <div class="shell__bar">
        <NuxtLink :to="links[0]?.to ?? '/'" class="shell__brand">
          <svg width="28" height="28" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
            <rect x="0" y="0" width="36" height="36" rx="8" fill="var(--color-teal)" />
            <path d="M18 7 L20 16 L29 18 L20 20 L18 29 L16 20 L7 18 L16 16 Z" fill="var(--color-on-teal)" />
            <circle cx="29" cy="29" r="3.5" fill="var(--color-accent)" />
          </svg>
          <span class="shell__wordmark">CleanLinis</span>
          <span class="visually-hidden">home</span>
        </NuxtLink>
        <span v-if="user" class="shell__role">{{ label }}</span>

        <button
          type="button"
          class="shell__menu-button btn btn--secondary btn--small"
          aria-controls="shell-nav"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          @click="menuOpen = !menuOpen"
        >
          Menu
        </button>
      </div>

      <div id="shell-nav" class="shell__nav-area" :class="{ 'shell__nav-area--open': menuOpen }">
        <nav aria-label="Main">
          <ul class="shell__nav">
            <li v-for="item in links" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="shell__nav-link"
                :aria-current="isCurrent(item.to) ? 'page' : undefined"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <div v-if="user" class="shell__user">
          <span class="shell__name">Signed in as <strong>{{ user.name }}</strong></span>
          <button type="button" class="btn btn--secondary btn--small" @click="signOut">Sign out</button>
        </div>
      </div>
    </header>

    <main id="main-content" class="shell__main" tabindex="-1">
      <p v-if="showNoAccess" class="message message--info" role="status">
        You do not have access to that page, so you were brought to your home page.
      </p>
      <slot />
    </main>

    <footer class="shell__footer">
      <p class="shell__footer-text">CleanLinis demo. All data is sample data stored in this browser.</p>
      <button type="button" class="btn btn--secondary btn--small" @click="confirmingReset = true">
        Reset demo data
      </button>
      <ConfirmPanel
        :open="confirmingReset"
        title="Reset demo data?"
        confirm-label="Yes, reset"
        @confirm="doReset"
        @cancel="confirmingReset = false"
      >
        <p>All changes made in this browser are removed, the sample data comes back, and you are signed out.</p>
      </ConfirmPanel>
    </footer>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--color-bg); }

.shell__skip {
  position: absolute;
  left: 12px;
  top: -60px;
  z-index: 10;
  padding: 10px 14px;
  background-color: var(--color-card);
  color: var(--color-teal-dark);
  font-weight: 700;
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-card-lg);
}
.shell__skip:focus { top: 12px; }

.shell__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  padding: 12px 24px;
  background-color: var(--color-card);
  border-bottom: 1px solid var(--color-card-border);
}
.shell__bar { display: flex; align-items: center; gap: 10px; }
.shell__brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; border-radius: 4px; }
.shell__wordmark { font-size: 18px; font-weight: 800; color: var(--color-text); letter-spacing: -0.01em; }
.shell__role {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-teal-dark);
  background-color: var(--color-card);
  border: 1px solid var(--color-card-border);
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.shell__menu-button { display: none; margin-left: auto; }

.shell__nav-area { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; flex: 1; justify-content: space-between; }
.shell__nav { list-style: none; display: flex; flex-wrap: wrap; gap: 4px; margin: 0; padding: 0; }
.shell__nav-link {
  display: inline-block;
  padding: 8px 12px;
  border-radius: var(--radius-control);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}
.shell__nav-link:hover { background-color: var(--color-row-hover); }
.shell__nav-link[aria-current='page'] {
  color: var(--color-tone-teal-fg);
  background-color: var(--color-tone-teal-bg);
  text-decoration: underline;
  text-underline-offset: 4px;
}
.shell__user { display: flex; align-items: center; gap: 12px; }
.shell__name { font-size: 13px; color: var(--color-text-soft); }

.shell__main {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.shell__main:focus { outline: none; }

.shell__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px 32px;
}
.shell__footer-text { margin: 0; font-size: 13px; color: var(--color-text-soft); }
.shell__footer :deep(.confirm-panel) { flex-basis: 100%; }

@media (max-width: 760px) {
  .shell__header { padding: 12px 16px; }
  .shell__bar { width: 100%; }
  .shell__menu-button { display: inline-flex; }
  .shell__nav-area { display: none; flex-direction: column; align-items: stretch; width: 100%; }
  .shell__nav-area--open { display: flex; }
  .shell__nav { flex-direction: column; }
  .shell__user { justify-content: space-between; }
  .shell__main { padding: 16px; }
  .shell__footer { padding: 16px 16px 28px; }
}
</style>
