// Wave 1.5 [F-01, all] — mock stores saved in the browser so a refresh
// keeps the demo, plus "Reset demo data". Uses an in-memory fake storage.
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import {
  loadJson,
  saveJson,
  clearDemoData,
  createPersistPlugin,
  resetDemoData,
  SESSION_KEY,
  SCHEMA_KEY,
  SCHEMA_VERSION,
  type KeyValueStorage,
} from '../app/utils/persistence'
import { useJobsStore } from '../app/stores/jobs'
import { useCurrentUserStore } from '../app/stores/currentUser'

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    get length() { return data.size },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v) },
    removeItem: (k: string) => { data.delete(k) },
  }
}

function brokenStorage(): KeyValueStorage {
  const fail = () => { throw new Error('storage blocked') }
  return { length: 0, key: fail, getItem: fail, setItem: fail, removeItem: fail }
}

function piniaWith(storage: KeyValueStorage) {
  const pinia = createPinia()
  createApp({}).use(pinia)
  pinia.use(createPersistPlugin(storage))
  setActivePinia(pinia)
  return pinia
}

describe('loadJson / saveJson', () => {
  it('round-trips a value', () => {
    const s = fakeStorage()
    expect(saveJson(s, 'cleanlinis:x', { a: 1 })).toBe(true)
    expect(loadJson(s, 'cleanlinis:x')).toEqual({ a: 1 })
  })

  it('returns undefined for a missing key or broken JSON', () => {
    const s = fakeStorage({ 'cleanlinis:bad': '{not json' })
    expect(loadJson(s, 'cleanlinis:none')).toBeUndefined()
    expect(loadJson(s, 'cleanlinis:bad')).toBeUndefined()
  })

  it('never throws when storage is blocked', () => {
    const s = brokenStorage()
    expect(loadJson(s, 'cleanlinis:x')).toBeUndefined()
    expect(saveJson(s, 'cleanlinis:x', 1)).toBe(false)
    expect(() => clearDemoData(s)).not.toThrow()
  })
})

describe('clearDemoData', () => {
  it('removes only CleanLinis keys', () => {
    const s = fakeStorage({ 'cleanlinis:jobs': '[]', [SESSION_KEY]: 'a@b.c', other: 'keep' })
    clearDemoData(s)
    expect([...s.data.keys()]).toEqual(['other'])
  })
})

describe('persist plugin', () => {
  let storage: ReturnType<typeof fakeStorage>
  beforeEach(() => { storage = fakeStorage() })

  it('saves a store change and loads it back in a fresh pinia', async () => {
    piniaWith(storage)
    useJobsStore().archiveJob('job-001')
    await Promise.resolve()

    piniaWith(storage)
    expect(useJobsStore().getById('job-001')?.archivedAt).not.toBeNull()
  })

  it('keeps the session across a reload and links it to the saved user', async () => {
    piniaWith(storage)
    const first = useCurrentUserStore()
    first.logIn('maria.santos@example.com', 'StrongPass123')
    await Promise.resolve()
    expect(storage.getItem(SESSION_KEY)).toBe('maria.santos@example.com')

    piniaWith(storage)
    const second = useCurrentUserStore()
    expect(second.currentUser?.email).toBe('maria.santos@example.com')
    expect(second.currentUser).toBe(second.users.find((u) => u.email === 'maria.santos@example.com'))
  })

  it('drops saved data written by an older schema version', () => {
    storage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION - 1))
    storage.setItem('cleanlinis:jobs', JSON.stringify({ jobs: [] }))
    piniaWith(storage)
    expect(useJobsStore().jobs.length).toBeGreaterThan(0)
    expect(storage.getItem(SCHEMA_KEY)).toBe(String(SCHEMA_VERSION))
  })

  it('works with blocked storage (falls back to the seed data)', () => {
    piniaWith(brokenStorage())
    expect(useJobsStore().jobs.length).toBeGreaterThan(0)
  })
})

describe('resetDemoData', () => {
  it('restores the seed, signs out and clears saved data', async () => {
    const storage = fakeStorage()
    const pinia = piniaWith(storage)
    const users = useCurrentUserStore()
    const jobs = useJobsStore()
    users.logIn('maria.santos@example.com', 'StrongPass123')
    jobs.archiveJob('job-001')
    await Promise.resolve()

    resetDemoData(pinia, storage)
    await Promise.resolve()

    expect(jobs.getById('job-001')?.archivedAt).toBeNull()
    expect(users.currentUser).toBeNull()
    expect(storage.getItem(SESSION_KEY)).toBeNull()
  })
})
