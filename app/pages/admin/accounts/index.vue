<!--
  /admin/accounts [F-05, F-14, F-04] — every account (Wave 4.3).
  Activate / deactivate / suspend with an in-page confirm. There is no
  delete anywhere (F-05: accounts are never permanently deleted).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import type { AccountState, MockUser, UserRole } from '~/data/mockUsers'
import type { TableColumn } from '~/components/SortableTable.vue'
import { ACCOUNT_STATE_LABEL, stateChangeOptions } from '~/utils/labels'
import { roleLabel } from '~/utils/navigation'
import { formatDateShort } from '~/utils/format'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const roleFilter = ref<UserRole | ''>('')
const search = ref('')

const rows = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return session.users.filter(
    (u) =>
      (!roleFilter.value || u.role === roleFilter.value) &&
      (!needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)),
  )
})
const pendingCleaners = computed(() => session.users.filter((u) => u.role === 'cleaner' && u.approvalStatus === 'pending').length)
const isSelf = (u: MockUser) => u.email === session.currentUser?.email

const columns: TableColumn<MockUser>[] = [
  { key: 'name', label: 'Name', value: (u) => u.name },
  { key: 'email', label: 'Email', value: (u) => u.email },
  { key: 'role', label: 'Role', value: (u) => roleLabel(u.role, !!u.isMainAdmin) },
  { key: 'approval', label: 'Approval', value: (u) => u.approvalStatus },
  { key: 'state', label: 'Account', value: (u) => u.accountState },
  { key: 'registered', label: 'Joined', value: (u) => u.registeredAt, type: 'date' },
  { key: 'actions', label: 'Change state', value: () => null, sortable: false },
]

const pendingChange = ref<{ user: MockUser; state: AccountState; action: string } | null>(null)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)
function confirmChange() {
  if (!pendingChange.value) return
  const { user, state } = pendingChange.value
  const result = session.setAccountState(user.email, state, session.currentUser)
  message.value = result.ok ? { kind: 'ok', text: `${user.name} is now ${ACCOUNT_STATE_LABEL[state].toLowerCase()}.` } : { kind: 'error', text: result.error }
  pendingChange.value = null
}

const STATE_MEANING: Record<AccountState, string> = {
  activated: 'They can sign in and use CleanLinis again.',
  deactivated: 'They can still sign in but will only see a notice that the account is deactivated.',
  suspended: 'They cannot sign in. If they are signed in now, they are signed out on their next page.',
}
</script>

<template>
  <div class="page-stack">
    <PageHeader title="Accounts" :subtitle="`${session.users.length} accounts · ${pendingCleaners} cleaner(s) waiting for approval. Accounts are never deleted.`">
      <template #actions>
        <NuxtLink to="/admin/accounts/new" class="btn btn--primary">Create admin account</NuxtLink>
      </template>
    </PageHeader>

    <div class="filters">
      <div class="field">
        <label for="accounts-role" class="field__label">Role</label>
        <select id="accounts-role" v-model="roleFilter" class="field__input">
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="cleaner">Cleaners</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div class="field">
        <label for="accounts-search" class="field__label">Search name or email</label>
        <input id="accounts-search" v-model="search" type="search" class="field__input" />
      </div>
    </div>

    <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">{{ message.text }}</p>

    <ConfirmPanel
      :open="pendingChange !== null"
      :title="pendingChange ? `${pendingChange.action} ${pendingChange.user.name}?` : ''"
      :confirm-label="pendingChange ? `Yes, ${pendingChange.action.toLowerCase()}` : ''"
      @confirm="confirmChange"
      @cancel="pendingChange = null"
    >
      <p v-if="pendingChange">{{ STATE_MEANING[pendingChange.state] }} Nothing is deleted.</p>
    </ConfirmPanel>

    <SortableTable
      :columns="columns"
      :rows="rows"
      :row-key="(u) => u.email"
      caption="All accounts."
      :initial-sort="{ key: 'name', direction: 'asc' }"
      :min-width="980"
      empty-text="No accounts match the filters."
    >
      <template #cell-name="{ row }">
        <NuxtLink :to="`/admin/accounts/${encodeURIComponent(row.email)}`" class="link">{{ row.name }}</NuxtLink>
      </template>
      <template #cell-approval="{ row }"><StatusBadge kind="approval" :value="row.approvalStatus" /></template>
      <template #cell-state="{ row }"><StatusBadge kind="account" :value="row.accountState" /></template>
      <template #cell-registered="{ row }">{{ formatDateShort(row.registeredAt) }}</template>
      <template #cell-actions="{ row }">
        <span v-if="isSelf(row)" class="muted">Your own account</span>
        <div v-else class="row-actions">
          <button
            v-for="option in stateChangeOptions(row.accountState)"
            :key="option.state"
            type="button"
            class="btn btn--secondary btn--small"
            :aria-label="`${option.action} ${row.name}`"
            @click="pendingChange = { user: row, state: option.state, action: option.action }; message = null"
          >
            {{ option.action }}
          </button>
        </div>
      </template>
    </SortableTable>
  </div>
</template>

<style scoped>
.filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 320px)); gap: 16px; }
.row-actions { display: flex; flex-wrap: nowrap; gap: 6px; }
</style>
