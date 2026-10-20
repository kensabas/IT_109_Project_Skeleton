// Wave 1.6 — shared display formatting (peso, dates, times).
import { describe, it, expect } from 'vitest'
import { formatPeso, formatDateShort, formatDateLong, formatTime12h } from '../app/utils/format'

describe('format', () => {
  it('formats pesos without decimals', () => {
    expect(formatPeso(650)).toBe('₱650')
    expect(formatPeso(1500)).toBe('₱1,500')
  })
  it('formats an ISO date without timezone drift', () => {
    expect(formatDateShort('2026-10-24')).toMatch(/24/)
    expect(formatDateShort('2026-10-24')).toMatch(/Oct/)
    expect(formatDateLong('2026-10-24')).toMatch(/Saturday/)
  })
  it('formats 24-hour times as 12-hour', () => {
    expect(formatTime12h('08:00')).toBe('8:00 AM')
    expect(formatTime12h('12:30')).toBe('12:30 PM')
    expect(formatTime12h('00:15')).toBe('12:15 AM')
    expect(formatTime12h('19:05')).toBe('7:05 PM')
  })
})
