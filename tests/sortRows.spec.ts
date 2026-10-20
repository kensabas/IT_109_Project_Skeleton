// F-17/18/19 Phase 2 — sortRows util tests.
import { describe, it, expect } from 'vitest'
import { sortRows, toggleDirection, STATUS_RANK, type SortDirection } from '../app/utils/sortRows'

type Row = {
  title: string
  rate: number
  date: string // ISO date string
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed'
  cleanerName: string | null
}

const rows: Row[] = [
  { title: 'Beta',  rate: 300, date: '2026-10-20', status: 'in-progress', cleanerName: 'Rosa Garcia' },
  { title: 'Alpha', rate: 500, date: '2026-10-10', status: 'completed',   cleanerName: null },
  { title: 'Gamma', rate: 400, date: '2026-10-24', status: 'scheduled',   cleanerName: 'Ana Villanueva' },
  { title: 'Delta', rate: 200, date: '2026-09-01', status: 'missed',      cleanerName: 'Pedro Mendoza' },
]

describe('sortRows — text', () => {
  it('sorts by text asc', () => {
    const out = sortRows(rows, (r) => r.title, 'asc')
    expect(out.map((r) => r.title)).toEqual(['Alpha', 'Beta', 'Delta', 'Gamma'])
  })
  it('sorts by text desc', () => {
    const out = sortRows(rows, (r) => r.title, 'desc')
    expect(out.map((r) => r.title)).toEqual(['Gamma', 'Delta', 'Beta', 'Alpha'])
  })
  it('is case-insensitive', () => {
    const mixed = [{ k: 'banana' }, { k: 'Apple' }, { k: 'cherry' }]
    const out = sortRows(mixed, (r) => r.k, 'asc')
    expect(out.map((r) => r.k)).toEqual(['Apple', 'banana', 'cherry'])
  })
})

describe('sortRows — number', () => {
  it('sorts by number asc', () => {
    const out = sortRows(rows, (r) => r.rate, 'asc')
    expect(out.map((r) => r.rate)).toEqual([200, 300, 400, 500])
  })
  it('sorts by number desc', () => {
    const out = sortRows(rows, (r) => r.rate, 'desc')
    expect(out.map((r) => r.rate)).toEqual([500, 400, 300, 200])
  })
})

describe('sortRows — date (ISO strings compare correctly as text)', () => {
  it('sorts by date asc', () => {
    const out = sortRows(rows, (r) => r.date, 'asc')
    expect(out.map((r) => r.date)).toEqual([
      '2026-09-01',
      '2026-10-10',
      '2026-10-20',
      '2026-10-24',
    ])
  })
  it('sorts by date desc', () => {
    const out = sortRows(rows, (r) => r.date, 'desc')
    expect(out.map((r) => r.date)).toEqual([
      '2026-10-24',
      '2026-10-20',
      '2026-10-10',
      '2026-09-01',
    ])
  })
})

describe('sortRows — status via STATUS_RANK', () => {
  it('sorts by workflow order asc', () => {
    const out = sortRows(rows, (r) => STATUS_RANK[r.status], 'asc')
    expect(out.map((r) => r.status)).toEqual(['scheduled', 'in-progress', 'completed', 'missed'])
  })
  it('sorts by workflow order desc', () => {
    const out = sortRows(rows, (r) => STATUS_RANK[r.status], 'desc')
    expect(out.map((r) => r.status)).toEqual(['missed', 'completed', 'in-progress', 'scheduled'])
  })
})

describe('sortRows — cleaner name, "Not assigned" last on asc', () => {
  // UX rule: on ascending, null/empty cleaner sorts to the end (so admins
  // see assigned jobs first); on descending, null/empty sorts to the end
  // too (so the alphabetical head still wins). We implement this by
  // mapping null to a sentinel string that always compares last.
  it('ascending — nulls last', () => {
    const out = sortRows(rows, (r) => r.cleanerName ?? '￿', 'asc')
    expect(out.map((r) => r.cleanerName)).toEqual([
      'Ana Villanueva',
      'Pedro Mendoza',
      'Rosa Garcia',
      null, // "Not assigned" sorted last
    ])
  })
  it('descending — still shows Not assigned last', () => {
    // On desc, the natural reverse would put '￿' first; to keep
    // "Not assigned" at the end on both directions, callers can use a
    // sentinel on the other side. We test both directions explicitly
    // with the agreed callsite behaviour: use '￿' for asc, '' for
    // desc.
    const out = sortRows(rows, (r) => r.cleanerName ?? '', 'desc')
    expect(out.map((r) => r.cleanerName)).toEqual([
      'Rosa Garcia',
      'Pedro Mendoza',
      'Ana Villanueva',
      null,
    ])
  })
})

describe('sortRows — purity', () => {
  it('does not mutate the input array', () => {
    const original = [...rows]
    sortRows(rows, (r) => r.title, 'asc')
    expect(rows).toEqual(original)
  })
})

describe('toggleDirection', () => {
  it('toggles asc → desc', () => {
    const next: SortDirection = toggleDirection('asc')
    expect(next).toBe('desc')
  })
  it('toggles desc → asc', () => {
    expect(toggleDirection('desc')).toBe('asc')
  })
})

// Wave 1.6 [F-08] — helpers behind the shared SortableTable.
import { sortRowsEmptyLast, nextSort, ariaSortFor } from '../app/utils/sortRows'

describe('sortRowsEmptyLast — empty values stay at the end both ways', () => {
  const people = [{ n: 'Rosa' }, { n: null }, { n: 'Ana' }, { n: '' }, { n: 'Pedro' }]
  it('ascending', () => {
    expect(sortRowsEmptyLast(people, (r) => r.n, 'asc').map((r) => r.n)).toEqual(['Ana', 'Pedro', 'Rosa', null, ''])
  })
  it('descending', () => {
    expect(sortRowsEmptyLast(people, (r) => r.n, 'desc').map((r) => r.n)).toEqual(['Rosa', 'Pedro', 'Ana', null, ''])
  })
  it('sorts numbers numerically', () => {
    const rows = [{ v: 10 }, { v: 9 }, { v: undefined }, { v: 100 }]
    expect(sortRowsEmptyLast(rows, (r) => r.v, 'asc').map((r) => r.v)).toEqual([9, 10, 100, undefined])
  })
})

describe('nextSort — header button clicks', () => {
  it('clicking the current column flips the direction', () => {
    expect(nextSort({ key: 'date', direction: 'asc' }, 'date')).toEqual({ key: 'date', direction: 'desc' })
  })
  it('clicking another column sorts it ascending', () => {
    expect(nextSort({ key: 'date', direction: 'desc' }, 'rate')).toEqual({ key: 'rate', direction: 'asc' })
  })
})

describe('ariaSortFor', () => {
  it('returns ascending / descending for the current column, none otherwise', () => {
    const state = { key: 'date', direction: 'asc' as const }
    expect(ariaSortFor(state, 'date')).toBe('ascending')
    expect(ariaSortFor({ ...state, direction: 'desc' }, 'date')).toBe('descending')
    expect(ariaSortFor(state, 'rate')).toBe('none')
  })
})
