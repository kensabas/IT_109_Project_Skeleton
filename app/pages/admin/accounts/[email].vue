<!--
  /admin/accounts/[email] [F-02, F-03, F-05, F-14] — one account (Wave 4.4).
  Account state actions; for cleaners, the six documents with approve /
  reject per document and approve / reject for the cleaner (plan D7).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useDocumentsStore } from '~/stores/documents'
import { useApplicationsStore } from '~/stores/applications'
import { useJobsStore } from '~/stores/jobs'
import type { AccountState } from '~/data/mockUsers'
import { DOCUMENT_TYPE_LABEL, type CleanerDocument, type DocumentType } from '~/data/mockDocuments'
import type { TableColumn } from '~/components/SortableTable.vue'
import { ACCOUNT_STATE_LABEL, CLIENT_TYPE_LABEL, stateChangeOptions } from '~/utils/labels'
import { roleLabel } from '~/utils/navigation'
import { formatDateShort, formatDateTime } from '~/utils/format'
import { formatFileSize } from '~/utils/documents'

definePageMeta({ layout: 'app' })

const route = useRoute()
const session = useCurrentUserStore()
const documents = useDocumentsStore()
const applications = useApplicationsStore()
const jobs = useJobsStore()

const email = computed(() => decodeURIComponent(String(route.params.email)))
const user = computed(() => session.findByEmail(email.value))
const isSelf = computed(() => user.value?.email === session.currentUser?.email)
const docs = computed(() => (user.value?.role === 'cleaner' ? documents.documentsFor(user.value.email) : []))
const approvedCount = computed(() => docs.value.filter((d) => d.status === 'approved').length)
const cleanerApplications = computed(() => (user.value ? applications.forCleaner(user.value.email) : []))
const assignedJobs = computed(() => jobs.jobs.filter((j) => j.assignedCleanerId === user.value?.email))

useHead(() => ({ title: `${user.value?.name ?? 'Account not found'} | CleanLinis` }))

const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)
function show(result: { ok: true } | { ok: false; error: string }, okText: string) {
  message.value = result.ok ? { kind: 'ok', text: okText } : { kind: 'error', text: result.error }
}

const pendingState = ref<{ state: AccountState; action: string } | null>(null)
function confirmState() {
  if (!user.value || !pendingState.value) return
  const { state } = pendingState.value
  show(session.setAccountState(user.value.email, state, session.currentUser), `Account is now ${ACCOUNT_STATE_LABEL[state].toLowerCase()}.`)
  pendingState.value = null
}

function review(type: DocumentType, decision: 'approved' | 'rejected') {
  if (!user.value) return
  show(documents.reviewDocument(user.value.email, type, decision, session.currentUser), `${DOCUMENT_TYPE_LABEL[type]} ${decision}.`)
}

const pendingApproval = ref<'approve' | 'reject' | null>(null)
function confirmApproval() {
  if (!user.value || !pendingApproval.value) return
  const result = pendingApproval.value === 'approve'
    ? session.approveCleaner(user.value.email, session.currentUser)
    : session.rejectCleaner(user.value.email, session.currentUser)
  show(result, pendingApproval.value === 'approve' ? 'Cleaner approved. They can now apply to jobs.' : 'Cleaner rejected.')
  pendingApproval.value = null
}

const DOC_RANK: Record<string, number> = { submitted: 0, rejected: 1, missing: 2, approved: 3 }
const docColumns: TableColumn<CleanerDocument>[] = [
  { key: 'type', label: 'Document', value: (d) => DOCUMENT_TYPE_LABEL[d.type] },
  { key: 'status', label: 'Status', value: (d) => DOC_RANK[d.status] },
  { key: 'file', label: 'File', value: (d) => d.fileName },
  { key: 'size', label: 'Size', value: (d) => d.fileSizeBytes, type: 'num' },
  { key: 'submitted', label: 'Submitted', value: (d) => d.submittedAt, type: 'date' },
  { key: 'actions', label: 'Review', value: () => null, sortable: false },
]
</script>

<template>
  <div class="page-stack">
    <p><NuxtLink to="/admin/accounts" class="link">← Back to accounts</NuxtLink></p>

    <template v-if="!user">
      <PageHeader title="Account not found" />
      <p class="card">No account uses the email <code>{{ email }}</code>.</p>
    </template>

    <template v-else>
      <PageHeader :title="user.name" :subtitle="roleLabel(user.role, !!user.isMainAdmin)" />
      <p class="badges">
        <StatusBadge kind="account" :value="user.accountState" />
        <StatusBadge v-if="user.role === 'cleaner'" kind="approval" :value="user.approvalStatus" />
      </p>

      <p v-if="message" class="message" :class="`message--${message.kind}`" :role="message.kind === 'error' ? 'alert' : 'status'">{{ message.text }}</p>

      <div class="account-grid">
        <section class="card">
          <h2 class="card__title">Account details</h2>
          <dl class="info-list">
            <div class="info-list__row"><dt>Email</dt><dd><a :href="`mailto:${user.email}`" class="link">{{ user.email }}</a></dd></div>
            <div class="info-list__row"><dt>Mobile</dt><dd><a :href="`tel:${user.mobileNumber}`" class="link">{{ user.mobileNumber }}</a></dd></div>
            <div class="info-list__row"><dt>Role</dt><dd>{{ roleLabel(user.role, !!user.isMainAdmin) }}</dd></div>
            <div v-if="user.clientType" class="info-list__row"><dt>Client type</dt><dd>{{ CLIENT_TYPE_LABEL[user.clientType] }}</dd></div>
            <div class="info-list__row"><dt>Joined</dt><dd>{{ formatDateShort(user.registeredAt) }}</dd></div>
            <div v-if="user.role === 'cleaner'" class="info-list__row"><dt>Pinned location</dt><dd>{{ user.pinnedLocation?.label ?? 'Not pinned' }}</dd></div>
          </dl>
        </section>

        <section class="card">
          <h2 class="card__title">Account state</h2>
          <p>Current state: <StatusBadge kind="account" :value="user.accountState" /></p>
          <p v-if="isSelf" class="muted">You cannot change your own account state.</p>
          <div v-else class="row-actions">
            <button
              v-for="option in stateChangeOptions(user.accountState)"
              :key="option.state"
              type="button"
              class="btn btn--secondary"
              @click="pendingState = option; message = null"
            >
              {{ option.action }}
            </button>
          </div>
          <ConfirmPanel
            :open="pendingState !== null"
            :title="pendingState ? `${pendingState.action} ${user.name}?` : ''"
            :confirm-label="pendingState ? `Yes, ${pendingState.action.toLowerCase()}` : ''"
            @confirm="confirmState"
            @cancel="pendingState = null"
          >
            <p>Nothing is deleted. The state can be changed again at any time.</p>
          </ConfirmPanel>
        </section>
      </div>

      <template v-if="user.role === 'cleaner'">
        <section class="page-stack" aria-labelledby="docs-title">
          <h2 id="docs-title" class="section-title">Documents ({{ approvedCount }} of 6 approved)</h2>
          <SortableTable
            :columns="docColumns"
            :rows="docs"
            :row-key="(d) => d.type"
            caption="The six required cleaner documents."
            :initial-sort="{ key: 'status', direction: 'asc' }"
            :min-width="860"
          >
            <template #cell-status="{ row }"><StatusBadge kind="document" :value="row.status" /></template>
            <template #cell-file="{ row }"><span v-if="row.fileName">{{ row.fileName }}</span><span v-else class="muted">No file</span></template>
            <template #cell-size="{ row }">{{ row.fileSizeBytes ? formatFileSize(row.fileSizeBytes) : '' }}</template>
            <template #cell-submitted="{ row }">{{ row.submittedAt ? formatDateTime(row.submittedAt) : '' }}</template>
            <template #cell-actions="{ row }">
              <div v-if="row.status !== 'missing'" class="row-actions">
                <button v-if="row.status !== 'approved'" type="button" class="btn btn--primary btn--small" :aria-label="`Approve ${DOCUMENT_TYPE_LABEL[row.type]}`" @click="review(row.type, 'approved')">Approve</button>
                <button v-if="row.status !== 'rejected'" type="button" class="btn btn--secondary btn--small" :aria-label="`Reject ${DOCUMENT_TYPE_LABEL[row.type]}`" @click="review(row.type, 'rejected')">Reject</button>
              </div>
              <span v-else class="muted">Waiting for the cleaner</span>
            </template>
          </SortableTable>
          <p class="field__hint">Files are not stored in this demo; only the file name, type and size are kept.</p>

          <div class="card">
            <h2 class="card__title">Cleaner approval</h2>
            <p>A cleaner cannot apply to jobs until approved. Approval needs all six documents approved.</p>
            <div class="row-actions">
              <button type="button" class="btn btn--primary" :disabled="user.approvalStatus === 'approved'" @click="pendingApproval = 'approve'; message = null">Approve cleaner</button>
              <button type="button" class="btn btn--secondary" :disabled="user.approvalStatus === 'rejected'" @click="pendingApproval = 'reject'; message = null">Reject cleaner</button>
            </div>
            <ConfirmPanel
              :open="pendingApproval !== null"
              :title="pendingApproval === 'approve' ? 'Approve this cleaner?' : 'Reject this cleaner?'"
              :confirm-label="pendingApproval === 'approve' ? 'Yes, approve' : 'Yes, reject'"
              @confirm="confirmApproval"
              @cancel="pendingApproval = null"
            >
              <p v-if="pendingApproval === 'approve'">They will be able to apply to job posts.</p>
              <p v-else>They will not be able to apply to job posts.</p>
            </ConfirmPanel>
          </div>
        </section>

        <section class="card">
          <h2 class="card__title">Work</h2>
          <dl class="info-list">
            <div class="info-list__row"><dt>Applications</dt><dd>{{ cleanerApplications.length }}</dd></div>
            <div class="info-list__row"><dt>Assigned jobs</dt>
              <dd>
                <span v-if="!assignedJobs.length" class="muted">None</span>
                <span v-for="(j, i) in assignedJobs" :key="j.id"><NuxtLink :to="`/admin/jobs/${j.id}`" class="link">{{ j.title }}</NuxtLink><span v-if="i < assignedJobs.length - 1">, </span></span>
              </dd>
            </div>
          </dl>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.badges { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
.account-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; align-items: start; }
@media (max-width: 900px) { .account-grid { grid-template-columns: 1fr; } }
.row-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.section-title { margin: 0; font-size: 18px; font-weight: 800; }
</style>
