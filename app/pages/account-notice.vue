<!--
  /account-notice [F-05] — plan D6 (Q12 unconfirmed): a deactivated user
  can sign in but sees only this notice. The route guard sends them here.
-->
<script setup lang="ts">
import { useCurrentUserStore } from '~/stores/currentUser'
import { LOGIN_PATH } from '~/utils/access'

const session = useCurrentUserStore()
useHead({ title: 'Account deactivated | CleanLinis' })

function signOut() {
  session.logOut()
  navigateTo(LOGIN_PATH)
}
</script>

<template>
  <AuthLayout heading="Your account is deactivated" sub-text="An admin has switched this account off.">
    <div class="notice-page">
      <NoticeBox title="What this means">
        <p>You can sign in, but you cannot use CleanLinis while the account is deactivated.</p>
        <p>Your information is kept. Contact the CleanLinis admin to have the account activated again.</p>
      </NoticeBox>
      <BaseButton type="button" @click="signOut">Sign out</BaseButton>
    </div>
  </AuthLayout>
</template>

<style scoped>
.notice-page { display: flex; flex-direction: column; gap: 18px; }
</style>
