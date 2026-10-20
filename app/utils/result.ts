// Every store action that can be refused returns one of these, so pages
// can show the reason in plain words.
export type ActionResult = { ok: true } | { ok: false; error: string }

export const OK: ActionResult = { ok: true }

export function fail(error: string): ActionResult {
  return { ok: false, error }
}

// Next id in a "prefix-001" sequence, e.g. nextId('req', ['req-008']) → 'req-009'.
export function nextId(prefix: string, existingIds: readonly string[]): string {
  const highest = existingIds
    .map((id) => parseInt(id.slice(prefix.length + 1), 10))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0)
  return `${prefix}-${String(highest + 1).padStart(3, '0')}`
}

interface Actor { role: string; isMainAdmin?: boolean }

export function isAdmin(actor: Actor | null | undefined): boolean {
  return actor?.role === 'admin'
}

export const ADMIN_ONLY = 'Only an admin can do this.'
