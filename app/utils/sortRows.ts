// F-17/18/19 Phase 2 — pure sort util for the admin jobs table.
//
// `sortRows(rows, keyFn, direction)` returns a new array, sorted by
// the key returned by `keyFn`. Numbers compare numerically; strings
// compare case-insensitively (via `localeCompare` with `{ sensitivity:
// 'base' }`). Does not mutate the input.
//
// `STATUS_RANK` lets the status column sort by workflow order
// (scheduled → in-progress → completed → missed) instead of
// alphabetical.
//
// `toggleDirection` flips asc ↔ desc for the column-header buttons.

export type SortDirection = 'asc' | 'desc'

export const STATUS_RANK: Record<
  'scheduled' | 'in-progress' | 'completed' | 'missed',
  number
> = {
  scheduled: 0,
  'in-progress': 1,
  completed: 2,
  missed: 3,
}

export function toggleDirection(current: SortDirection): SortDirection {
  return current === 'asc' ? 'desc' : 'asc'
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  const aStr = String(a ?? '')
  const bStr = String(b ?? '')
  return aStr.localeCompare(bStr, undefined, { sensitivity: 'base' })
}

export function sortRows<T, K>(
  rows: readonly T[],
  keyFn: (row: T) => K,
  direction: SortDirection,
): T[] {
  const copy = rows.slice()
  copy.sort((a, b) => {
    const cmp = compareValues(keyFn(a), keyFn(b))
    return direction === 'asc' ? cmp : -cmp
  })
  return copy
}

// Wave 1.6 [F-08] — helpers for the shared SortableTable.

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

// Like sortRows, but empty values (null, undefined, '') always go to the
// end, in both directions, so "Not assigned" rows never jump to the top.
export function sortRowsEmptyLast<T>(
  rows: readonly T[],
  keyFn: (row: T) => unknown,
  direction: SortDirection,
): T[] {
  const filled = rows.filter((r) => !isEmpty(keyFn(r)))
  const empty = rows.filter((r) => isEmpty(keyFn(r)))
  return [...sortRows(filled, keyFn, direction), ...empty]
}

export interface SortState { key: string; direction: SortDirection }

export function nextSort(current: SortState, clickedKey: string): SortState {
  if (current.key === clickedKey) return { key: clickedKey, direction: toggleDirection(current.direction) }
  return { key: clickedKey, direction: 'asc' }
}

export function ariaSortFor(state: SortState, key: string): 'ascending' | 'descending' | 'none' {
  if (state.key !== key) return 'none'
  return state.direction === 'asc' ? 'ascending' : 'descending'
}
