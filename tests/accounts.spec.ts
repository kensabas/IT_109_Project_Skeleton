// Wave 2.6 + 2.7 [F-02 to F-05, F-14, F-24] — cleaner documents and
// admin account actions. Accounts are never deleted (F-05).
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useCurrentUserStore } from '../app/stores/currentUser'
import { useDocumentsStore } from '../app/stores/documents'
import { useJobsStore } from '../app/stores/jobs'
import { useRequestsStore } from '../app/stores/requests'
import { useApplicationsStore } from '../app/stores/applications'
import { useDisputesStore } from '../app/stores/disputes'
import { validateDocumentFile, MAX_DOCUMENT_BYTES } from '../app/utils/documents'
import { DOCUMENT_TYPES } from '../app/data/mockDocuments'

const user = (email: string) => useCurrentUserStore().users.find((u) => u.email === email)!
const MAIN = 'admin.main@example.com'
const STAFF = 'admin.staff@example.com'
const LIZA = 'liza.fernandez@example.com'
const pdf = { name: 'nbi.pdf', type: 'application/pdf', size: 200_000 }

beforeEach(() => setActivePinia(createPinia()))

describe('validateDocumentFile (plan D7 placeholder rules)', () => {
  it('accepts PDF, JPG and PNG up to 5 MB', () => {
    expect(validateDocumentFile(pdf)).toBeNull()
    expect(validateDocumentFile({ name: 'id.jpg', type: 'image/jpeg', size: 1000 })).toBeNull()
    expect(validateDocumentFile({ name: 'id.png', type: 'image/png', size: MAX_DOCUMENT_BYTES })).toBeNull()
  })
  it('refuses other types and bigger files', () => {
    expect(validateDocumentFile({ name: 'a.gif', type: 'image/gif', size: 10 })).toMatch(/PDF, JPG or PNG/)
    expect(validateDocumentFile({ name: 'a.pdf', type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 })).toMatch(/5 MB/)
    expect(validateDocumentFile({ name: 'a.pdf', type: 'application/pdf', size: 0 })).toMatch(/empty/)
  })
})

describe('documents store (F-02)', () => {
  it('always returns the six documents in a fixed order', () => {
    const docs = useDocumentsStore().documentsFor(LIZA)
    expect(docs.map((d) => d.type)).toEqual([...DOCUMENT_TYPES])
  })
  it('a new cleaner starts with six missing documents', () => {
    const docs = useDocumentsStore().documentsFor('new.cleaner@example.com')
    expect(docs.length).toBe(6)
    expect(docs.every((d) => d.status === 'missing')).toBe(true)
  })
  it('submitting a valid file marks the document submitted', () => {
    const store = useDocumentsStore()
    expect(store.submitDocument(LIZA, 'bir', pdf).ok).toBe(true)
    const doc = store.documentsFor(LIZA).find((d) => d.type === 'bir')!
    expect(doc.status).toBe('submitted')
    expect(doc.fileName).toBe('nbi.pdf')
  })
  it('an invalid file is refused and nothing changes', () => {
    const store = useDocumentsStore()
    expect(store.submitDocument(LIZA, 'bir', { name: 'x.gif', type: 'image/gif', size: 5 }).ok).toBe(false)
    expect(store.documentsFor(LIZA).find((d) => d.type === 'bir')?.status).toBe('missing')
  })
  it('an admin approves or rejects a submitted document', () => {
    const store = useDocumentsStore()
    expect(store.reviewDocument(LIZA, 'birth-certificate', 'approved', user(STAFF)).ok).toBe(true)
    expect(store.reviewDocument(LIZA, 'nbi-clearance', 'rejected', user(STAFF)).ok).toBe(true)
    expect(store.reviewDocument(LIZA, 'bir', 'approved', user(STAFF)).ok).toBe(false) // still missing
    expect(store.reviewDocument(LIZA, 'police-clearance', 'approved', user(LIZA)).ok).toBe(false) // not an admin
  })
})

describe('account actions (F-05, F-14)', () => {
  it('an admin changes another user\'s account state', () => {
    const store = useCurrentUserStore()
    expect(store.setAccountState('maria.santos@example.com', 'suspended', user(STAFF)).ok).toBe(true)
    expect(user('maria.santos@example.com').accountState).toBe('suspended')
  })
  it('a non-admin cannot change states, and an admin cannot change their own', () => {
    const store = useCurrentUserStore()
    expect(store.setAccountState('rosa.garcia@example.com', 'suspended', user('maria.santos@example.com')).ok).toBe(false)
    expect(store.setAccountState(STAFF, 'deactivated', user(STAFF)).ok).toBe(false)
  })
  it('approving a cleaner needs all six documents approved (plan D7)', () => {
    const store = useCurrentUserStore()
    const result = store.approveCleaner(LIZA, user(STAFF))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/documents/i)
  })
  it('approves the cleaner once every document is approved', () => {
    const docs = useDocumentsStore()
    for (const type of DOCUMENT_TYPES) {
      if (docs.documentsFor(LIZA).find((d) => d.type === type)?.status === 'missing') docs.submitDocument(LIZA, type, pdf)
      docs.reviewDocument(LIZA, type, 'approved', user(STAFF))
    }
    expect(useCurrentUserStore().approveCleaner(LIZA, user(STAFF)).ok).toBe(true)
    expect(user(LIZA).approvalStatus).toBe('approved')
  })
  it('rejects a cleaner', () => {
    expect(useCurrentUserStore().rejectCleaner(LIZA, user(STAFF)).ok).toBe(true)
    expect(user(LIZA).approvalStatus).toBe('rejected')
  })
  it('saves a cleaner\'s pinned location (F-24)', () => {
    const store = useCurrentUserStore()
    expect(store.setPinnedLocation(LIZA, { lat: 14.6, lng: 121.0, label: 'Test pin' }).ok).toBe(true)
    expect(user(LIZA).pinnedLocation?.label).toBe('Test pin')
  })
})

describe('createAdmin (F-04: main admin only)', () => {
  const newAdmin = { name: 'Bea Lim', email: 'bea.lim@example.com', mobileNumber: '09170000009', password: 'AdminNew2026' }
  it('the main admin creates a regular admin', () => {
    const store = useCurrentUserStore()
    expect(store.createAdmin(newAdmin, user(MAIN)).ok).toBe(true)
    const created = user('bea.lim@example.com')
    expect(created.role).toBe('admin')
    expect(created.isMainAdmin).toBe(false)
    expect(created.accountState).toBe('activated')
  })
  it('a regular admin cannot create admins', () => {
    expect(useCurrentUserStore().createAdmin(newAdmin, user(STAFF)).ok).toBe(false)
  })
  it('refuses an email already in use', () => {
    expect(useCurrentUserStore().createAdmin({ ...newAdmin, email: 'rosa.garcia@example.com' }, user(MAIN)).ok).toBe(false)
  })
})

describe('nothing can be permanently deleted (F-05, F-17)', () => {
  it('no store has a delete or remove action', () => {
    const stores = [useCurrentUserStore(), useJobsStore(), useRequestsStore(), useApplicationsStore(), useDocumentsStore(), useDisputesStore()]
    for (const store of stores) {
      const names = Object.keys(store).filter((k) => typeof (store as Record<string, unknown>)[k] === 'function' && !k.startsWith('$') && !k.startsWith('_'))
      expect(names.filter((n) => /delete|remove|destroy|purge/i.test(n))).toEqual([])
    }
  })
})
