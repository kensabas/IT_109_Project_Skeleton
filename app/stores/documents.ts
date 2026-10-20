// Wave 2.6 [F-02] — the six cleaner documents. File details only (no
// real upload). Plan D7 (Q18 unconfirmed): an admin reviews each one.
import { defineStore } from 'pinia'
import { DOCUMENT_TYPES, initialMockDocuments, type CleanerDocument, type DocumentType } from '../data/mockDocuments'
import type { MockUser } from '../data/mockUsers'
import { validateDocumentFile, type FileInfo } from '../utils/documents'
import { ADMIN_ONLY, fail, isAdmin, OK, type ActionResult } from '../utils/result'

interface State { documents: CleanerDocument[] }

function missingDocument(cleanerEmail: string, type: DocumentType): CleanerDocument {
  return {
    cleanerEmail, type, status: 'missing',
    fileName: null, fileType: null, fileSizeBytes: null, submittedAt: null, reviewedAt: null,
  }
}

export const useDocumentsStore = defineStore('documents', {
  state: (): State => ({ documents: initialMockDocuments() }),

  actions: {
    // Always the six documents, in the order the user listed them.
    documentsFor(cleanerEmail: string): CleanerDocument[] {
      return DOCUMENT_TYPES.map(
        (type) =>
          this.documents.find((d) => d.cleanerEmail === cleanerEmail && d.type === type) ??
          missingDocument(cleanerEmail, type),
      )
    },

    allApproved(cleanerEmail: string): boolean {
      return this.documentsFor(cleanerEmail).every((d) => d.status === 'approved')
    },

    submitDocument(cleanerEmail: string, type: DocumentType, file: FileInfo): ActionResult {
      const error = validateDocumentFile(file)
      if (error) return fail(error)
      let document = this.documents.find((d) => d.cleanerEmail === cleanerEmail && d.type === type)
      if (!document) {
        document = missingDocument(cleanerEmail, type)
        this.documents.push(document)
      }
      Object.assign(document, {
        status: 'submitted',
        fileName: file.name,
        fileType: file.type,
        fileSizeBytes: file.size,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      })
      return OK
    },

    reviewDocument(cleanerEmail: string, type: DocumentType, decision: 'approved' | 'rejected', actor: MockUser | null): ActionResult {
      if (!isAdmin(actor)) return fail(ADMIN_ONLY)
      const document = this.documents.find((d) => d.cleanerEmail === cleanerEmail && d.type === type)
      if (!document || document.status === 'missing') return fail('This document has not been submitted yet.')
      document.status = decision
      document.reviewedAt = new Date().toISOString()
      return OK
    },
  },
})
