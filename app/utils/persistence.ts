// Wave 1.5 — keeps the mock stores in the browser (localStorage) so a
// refresh keeps the demo, and "Reset demo data" brings back the seed.
// Mock only: nothing leaves the browser. Every storage call is wrapped
// in try/catch because storage can be blocked (private mode, settings);
// the app then simply runs on the seed data.
import type { Pinia, PiniaPluginContext, Store } from 'pinia'

export interface KeyValueStorage {
  readonly length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const STORAGE_PREFIX = 'cleanlinis:'
export const SESSION_KEY = `${STORAGE_PREFIX}session`
export const SCHEMA_KEY = `${STORAGE_PREFIX}schema`
// Bump when the seed data or a stored shape changes, so browsers drop
// data saved by an older build instead of showing broken pages.
export const SCHEMA_VERSION = 3

const CURRENT_USER_STORE_ID = 'currentUser'

export function loadJson<T>(storage: KeyValueStorage, key: string): T | undefined {
  try {
    const raw = storage.getItem(key)
    return raw === null ? undefined : (JSON.parse(raw) as T)
  } catch {
    return undefined
  }
}

export function saveJson(storage: KeyValueStorage, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function readText(storage: KeyValueStorage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeText(storage: KeyValueStorage, key: string, value: string | null): void {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, value)
  } catch {
    // Storage blocked: the demo keeps working in memory only.
  }
}

export function clearDemoData(storage: KeyValueStorage): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key)
    }
    for (const key of keys) storage.removeItem(key)
  } catch {
    // Storage blocked: nothing was saved, so there is nothing to clear.
  }
}

function storeKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`
}

interface UserLike { email: string }
interface CurrentUserState { users: UserLike[]; currentUser: UserLike | null }

// The signed-in user is saved as an email only and re-linked to the
// saved user list, so account changes made by an admin show up for them.
function hydrateCurrentUser(store: Store, storage: KeyValueStorage): void {
  const state = store.$state as unknown as CurrentUserState
  const saved = loadJson<{ users: UserLike[] }>(storage, storeKey(store.$id))
  if (saved?.users) store.$patch({ users: saved.users } as never)
  const email = readText(storage, SESSION_KEY)
  state.currentUser = email ? state.users.find((u) => u.email === email) ?? null : null
}

function saveCurrentUser(store: Store, storage: KeyValueStorage): void {
  const state = store.$state as unknown as CurrentUserState
  saveJson(storage, storeKey(store.$id), { users: state.users })
  writeText(storage, SESSION_KEY, state.currentUser?.email ?? null)
}

const storesByPinia = new WeakMap<Pinia, Set<Store>>()

export function createPersistPlugin(storage: KeyValueStorage) {
  if (readText(storage, SCHEMA_KEY) !== String(SCHEMA_VERSION)) {
    clearDemoData(storage)
    writeText(storage, SCHEMA_KEY, String(SCHEMA_VERSION))
  }

  return ({ store, pinia }: PiniaPluginContext): void => {
    const registered = storesByPinia.get(pinia) ?? new Set<Store>()
    registered.add(store)
    storesByPinia.set(pinia, registered)

    const isCurrentUser = store.$id === CURRENT_USER_STORE_ID
    if (isCurrentUser) {
      hydrateCurrentUser(store, storage)
    } else {
      const saved = loadJson<Record<string, unknown>>(storage, storeKey(store.$id))
      if (saved) store.$patch(saved as never)
    }

    // flush 'sync' so a change is saved before the next navigation.
    store.$subscribe(
      () => {
        if (isCurrentUser) saveCurrentUser(store, storage)
        else saveJson(storage, storeKey(store.$id), store.$state)
      },
      { detached: true, flush: 'sync' },
    )
  }
}

// "Reset demo data": every store goes back to its seed, the session
// ends, and saved data is removed.
export function resetDemoData(pinia: Pinia, storage: KeyValueStorage): void {
  for (const store of storesByPinia.get(pinia) ?? []) store.$reset()
  clearDemoData(storage)
  writeText(storage, SCHEMA_KEY, String(SCHEMA_VERSION))
}
