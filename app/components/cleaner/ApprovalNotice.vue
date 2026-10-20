<!--
  ApprovalNotice [F-03]: tells a cleaner who is not approved yet why they
  cannot apply, and links to the documents page. Shows nothing when approved.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'

const session = useCurrentUserStore()
const status = computed(() => session.currentUser?.approvalStatus)
</script>

<template>
  <div v-if="status === 'pending'" class="message message--info" role="status">
    <strong>Your account is waiting for approval.</strong>
    You can look at job posts, but you cannot apply until an admin approves your account.
    <NuxtLink to="/cleaner/documents" class="link">Check your six documents</NuxtLink>.
  </div>
  <div v-else-if="status === 'rejected'" class="message message--error" role="status">
    <strong>Your account was not approved.</strong>
    You cannot apply to job posts. <NuxtLink to="/cleaner/documents" class="link">See which documents were rejected</NuxtLink> and contact the admin.
  </div>
</template>
