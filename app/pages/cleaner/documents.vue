<!--
  /cleaner/documents [F-02, F-03] — the six required documents. Pick a
  file to submit it; only its name, type and size are kept (no real
  upload). Rules: PDF, JPG or PNG up to 5 MB (plan D7 placeholder).
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import { useDocumentsStore } from '~/stores/documents'
import { DOCUMENT_TYPE_LABEL, type DocumentType } from '~/data/mockDocuments'
import { ALLOWED_DOCUMENT_ACCEPT, formatFileSize } from '~/utils/documents'
import { formatDateTime } from '~/utils/format'

definePageMeta({ layout: 'app' })

const session = useCurrentUserStore()
const documents = useDocumentsStore()
const email = computed(() => session.currentUser?.email ?? '')
const docs = computed(() => documents.documentsFor(email.value))
const approved = computed(() => docs.value.filter((d) => d.status === 'approved').length)

const messages = ref<Partial<Record<DocumentType, { kind: 'ok' | 'error'; text: string }>>>({})

function onFile(type: DocumentType, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const result = documents.submitDocument(email.value, type, { name: file.name, type: file.type, size: file.size })
  messages.value[type] = result.ok ? { kind: 'ok', text: `${file.name} submitted for review.` } : { kind: 'error', text: result.error }
  input.value = ''
}
</script>

<template>
  <div class="page-stack">
    <PageHeader title="My documents" :subtitle="`${approved} of 6 approved. All six are needed before an admin can approve your account.`" />
    <CleanerApprovalNotice />
    <p class="field__hint">Allowed files: PDF, JPG or PNG, up to 5 MB each. In this demo only the file name, type and size are kept; the file itself is not uploaded.</p>

    <ul class="docs">
      <li v-for="doc in docs" :key="doc.type" class="card doc">
        <div class="doc__head">
          <h2 class="doc__title">{{ DOCUMENT_TYPE_LABEL[doc.type] }}</h2>
          <StatusBadge kind="document" :value="doc.status" />
        </div>
        <p v-if="doc.fileName" class="doc__file">
          {{ doc.fileName }} · {{ formatFileSize(doc.fileSizeBytes ?? 0) }}<span v-if="doc.submittedAt"> · sent {{ formatDateTime(doc.submittedAt) }}</span>
        </p>
        <p v-else class="muted">No file yet.</p>
        <p v-if="doc.status === 'rejected'" class="doc__note">Rejected by the admin. Please send a new file.</p>
        <div v-if="doc.status !== 'approved'" class="field">
          <label :for="`doc-${doc.type}`" class="field__label">{{ doc.fileName ? 'Replace file' : 'Choose file' }}<span class="visually-hidden"> for {{ DOCUMENT_TYPE_LABEL[doc.type] }}</span></label>
          <input :id="`doc-${doc.type}`" type="file" class="field__input doc__input" :accept="ALLOWED_DOCUMENT_ACCEPT"
            :aria-describedby="messages[doc.type] ? `doc-${doc.type}-msg` : undefined" @change="onFile(doc.type, $event)" />
        </div>
        <p v-if="messages[doc.type]" :id="`doc-${doc.type}-msg`" class="message" :class="`message--${messages[doc.type]!.kind}`" :role="messages[doc.type]!.kind === 'error' ? 'alert' : 'status'">
          {{ messages[doc.type]!.text }}
        </p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.docs { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.doc { display: flex; flex-direction: column; gap: 10px; padding: 18px; }
.doc__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; }
.doc__title { margin: 0; font-size: 16px; font-weight: 700; }
.doc__file { margin: 0; font-size: 13px; color: var(--color-text-soft); word-break: break-all; }
.doc__note { margin: 0; font-size: 14px; color: var(--color-error); }
.doc__input { padding: 10px; }
@media (max-width: 400px) { .docs { grid-template-columns: 1fr; } }
</style>
