<!--
  /welcome — F-01 Phase 4.5.
  PLACEHOLDER landing page after a successful login or sign-up.

  Open question 1 in PLAN_F-01.md asks where the user should land next;
  until that is answered, this page just shows "Logged in as [name]
  ([role])" and a Log out button. The route name `/welcome` is itself
  unconfirmed.

  If somebody visits /welcome while logged out, the page redirects to
  /login so the "no auth" case is obvious.
-->
<script setup lang="ts">
import { useCurrentUserStore } from '~/stores/currentUser'

const currentUser = useCurrentUserStore()

// If nobody is logged in, bounce to /login. We're not a route-guard
// framework; this is just a defensive redirect for the demo.
if (import.meta.client && !currentUser.isLoggedIn) {
  navigateTo('/login')
}

function onLogOut() {
  currentUser.logOut()
  navigateTo('/login')
}
</script>

<template>
  <AuthLayout
    heading="You're signed in"
    sub-text="This is a placeholder result page for the midterm demo."
  >
    <div v-if="currentUser.currentUser" class="welcome">
      <p class="welcome__line">
        Logged in as
        <strong>{{ currentUser.currentUser.name }}</strong>
        (<span>{{ currentUser.currentUser.role }}</span>)
      </p>
      <BaseButton type="button" @click="onLogOut">Log out</BaseButton>
    </div>
    <!-- The v-if branch above never renders when logged out because
         we redirect in setup; this fallback is only visible for the
         brief moment during SSR → client navigation. -->
    <p v-else class="welcome__fallback">Redirecting to log in…</p>
  </AuthLayout>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome__line {
  margin: 0;
  font-size: 16px;
  color: var(--color-text);
}

.welcome__fallback {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-soft);
  text-align: center;
}
</style>
