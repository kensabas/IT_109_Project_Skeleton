// Wave 1.8 [F-07] — pure date helpers for the month calendar.
// Weeks start on Sunday (unconfirmed choice, see review file).
import { describe, it, expect } from 'vitest'
import { toIsoDate, monthGrid, shiftMonth, monthTitle, eventsInMonth, isoToday } from '../app/utils/dates'

describe('toIsoDate', () => {
  it('pads month and day', () => expect(toIsoDate(2026, 0, 5)).toBe('2026-01-05'))
})

describe('monthGrid — October 2026 (1 Oct is a Thursday)', () => {
  const grid = monthGrid(2026, 9)
  it('has whole weeks of 7 days', () => {
    expect(grid.length).toBe(5)
    expect(grid.every((week) => week.length === 7)).toBe(true)
  })
  it('starts on the Sunday before the 1st', () => {
    expect(grid[0][0]).toEqual({ iso: '2026-09-27', day: 27, inMonth: false })
    expect(grid[0][4]).toEqual({ iso: '2026-10-01', day: 1, inMonth: true })
  })
  it('ends on the Saturday after the last day', () => {
    expect(grid[4][6]).toEqual({ iso: '2026-10-31', day: 31, inMonth: true })
  })
  it('handles a month that needs six rows (August 2026)', () => {
    expect(monthGrid(2026, 7).length).toBe(6)
  })
})

describe('shiftMonth', () => {
  it('moves forward across a year end', () => expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 }))
  it('moves back across a year start', () => expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 }))
})

describe('monthTitle', () => {
  it('names the month', () => expect(monthTitle(2026, 9)).toBe('October 2026'))
})

describe('eventsInMonth', () => {
  const events = [
    { id: 'b', date: '2026-10-20', time: '13:00' },
    { id: 'a', date: '2026-10-20', time: '08:00' },
    { id: 'c', date: '2026-11-01', time: '08:00' },
    { id: 'd', date: '2026-10-02', time: '09:00' },
  ]
  it('keeps only the month and sorts by date then time', () => {
    expect(eventsInMonth(events, 2026, 9).map((e) => e.id)).toEqual(['d', 'a', 'b'])
  })
})

describe('isoToday', () => {
  it('uses the given clock (deterministic)', () => {
    expect(isoToday(new Date(2026, 9, 20, 9, 0))).toBe('2026-10-20')
  })
})

import { hoursBetween } from '../app/utils/dates'
describe('hoursBetween', () => {
  it('works out whole and half hours', () => {
    expect(hoursBetween('09:00', '12:30')).toBe(3.5)
    expect(hoursBetween('08:00', '14:00')).toBe(6)
  })
})
