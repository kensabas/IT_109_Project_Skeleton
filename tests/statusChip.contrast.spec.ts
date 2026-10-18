// F-17/18/19 Phase 3/5 — StatusChip contrast audit.
//
// The chip's bg/fg pairs come from the mockup. We verify each pair
// meets WCAG 2.x 4.5:1 (normal text) using the shared contrast util.
// If a pair ever drops below 4.5, this suite goes red and the design
// token needs to change (not just this test).

import { describe, it, expect } from 'vitest'
import { contrastRatio } from '../app/utils/contrast'

type Pair = { name: string; fg: string; bg: string }
const PAIRS: Pair[] = [
  { name: 'scheduled',   fg: '#1F4E8C', bg: '#E3EEFB' },
  { name: 'in-progress', fg: '#0B6665', bg: '#D9F0EF' },
  { name: 'completed',   fg: '#1E6B3A', bg: '#DDF1E3' },
  { name: 'missed',      fg: '#9B1C1C', bg: '#FBE3E3' },
]

describe('StatusChip — fg on bg contrast ≥ 4.5:1 (WCAG normal text)', () => {
  for (const p of PAIRS) {
    it(`${p.name} ${p.fg} on ${p.bg}`, () => {
      const ratio = contrastRatio(p.fg, p.bg)
      // Log the real number so Phase 3 run-status can quote it.
      // eslint-disable-next-line no-console
      console.log(`[chip ${p.name}] ${ratio.toFixed(2)}:1`)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  }
})
