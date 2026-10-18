// Phase 6.4 — WCAG 2.x contrast-ratio function.
// Red-then-green against three well-known values and symmetry.

import { describe, it, expect } from 'vitest'
import { contrastRatio } from '../app/utils/contrast'

const close = (a: number, b: number, tol = 0.02): boolean => Math.abs(a - b) <= tol

describe('contrastRatio — WCAG 2.x', () => {
  it('black on white = 21.00:1', () => {
    expect(close(contrastRatio('#000000', '#FFFFFF'), 21.0)).toBe(true)
  })

  it('white on white = 1.00:1 (same colour)', () => {
    expect(close(contrastRatio('#FFFFFF', '#FFFFFF'), 1.0)).toBe(true)
  })

  it('black on black = 1.00:1 (same colour)', () => {
    expect(close(contrastRatio('#000000', '#000000'), 1.0)).toBe(true)
  })

  it('is symmetric (fg/bg order does not matter)', () => {
    const a = contrastRatio('#B91C1C', '#FFFFFF')
    const b = contrastRatio('#FFFFFF', '#B91C1C')
    expect(close(a, b)).toBe(true)
  })

  it('matches a known mid-grey value: #808080 vs white ≈ 3.95:1', () => {
    // From WebAIM contrast checker; our tolerance 0.05 covers rounding.
    expect(close(contrastRatio('#808080', '#FFFFFF'), 3.95, 0.05)).toBe(true)
  })
})
