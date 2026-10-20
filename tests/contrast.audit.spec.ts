// Phase 6.4 — contrast audit of the design-token pairs in main.css.
// This is not a traditional assertion test: it logs the actual ratio
// for each foreground/background pair the UI uses, so the Phase 6
// run-status can show the real numbers (not retyped from memory).
// Each pair is checked against the WCAG 2.x minimum appropriate for
// its usage.

import { describe, it, expect } from 'vitest'
import { contrastRatio } from '../app/utils/contrast'
import { mainCssTokens, token } from './helpers/mainCss'

// Wave 0.5 [I-4]: values are READ FROM main.css at test time, so this
// audit always checks the real tokens (it used to hold typed copies).
const tokens = mainCssTokens()
const C = {
  teal: token(tokens, '--color-teal'),
  tealDark: token(tokens, '--color-teal-dark'),
  text: token(tokens, '--color-text'),
  textSoft: token(tokens, '--color-text-soft'),
  bg: token(tokens, '--color-bg'),
  card: token(tokens, '--color-card'),
  cardBorder: token(tokens, '--color-card-border'),
  inputBorder: token(tokens, '--color-input-border'),
  noticeBg: token(tokens, '--color-notice-bg'),
  noticeText: token(tokens, '--color-notice-text'),
  accent: token(tokens, '--color-accent'),
  error: token(tokens, '--color-error'),
  white: token(tokens, '--color-on-teal'),
}

type Pair = {
  name: string
  fg: string
  bg: string
  min: number // required WCAG minimum per the Phase 6 prompt
  kind: 'text' | 'nontext' // for the report
  required: boolean // true when the Phase 6 prompt listed this pair as mandatory
}

const PAIRS: Pair[] = [
  // --- Normal text pairs (4.5:1 required by the prompt) ---
  { name: 'dark text on page bg', fg: C.text, bg: C.bg, min: 4.5, kind: 'text', required: true },
  { name: 'dark text on white card', fg: C.text, bg: C.card, min: 4.5, kind: 'text', required: true },
  { name: 'soft text on white', fg: C.textSoft, bg: C.card, min: 4.5, kind: 'text', required: true },
  { name: 'soft text on page bg', fg: C.textSoft, bg: C.bg, min: 4.5, kind: 'text', required: true },
  { name: 'teal on white (link / focus token)', fg: C.teal, bg: C.card, min: 4.5, kind: 'text', required: true },
  { name: 'teal-dark on white (inline link text)', fg: C.tealDark, bg: C.card, min: 4.5, kind: 'text', required: true },
  { name: 'white on teal (button normal)', fg: C.white, bg: C.teal, min: 4.5, kind: 'text', required: true },
  { name: 'white on teal-dark (button hover)', fg: C.white, bg: C.tealDark, min: 4.5, kind: 'text', required: true },
  { name: 'error on white (field error)', fg: C.error, bg: C.card, min: 4.5, kind: 'text', required: true },
  { name: 'notice text on notice bg', fg: C.noticeText, bg: C.noticeBg, min: 4.5, kind: 'text', required: true },
  { name: 'placeholder text on white (soft on white)', fg: C.textSoft, bg: C.card, min: 4.5, kind: 'text', required: true },
  // --- Non-text pairs (3:1 required by the prompt: input borders + focus outlines) ---
  { name: 'input border on white (text-field)', fg: C.inputBorder, bg: C.card, min: 3.0, kind: 'nontext', required: true },
  { name: 'teal focus outline on white card', fg: C.teal, bg: C.card, min: 3.0, kind: 'nontext', required: true },
  { name: 'teal focus outline on page bg (choice card)', fg: C.teal, bg: C.bg, min: 3.0, kind: 'nontext', required: true },
  { name: 'error border on white', fg: C.error, bg: C.card, min: 3.0, kind: 'nontext', required: true },
  // --- Informational (NOT in the prompt's required list) ---
  // The card border is decorative: the white card is distinguishable from the
  // page bg via content density + luminance, so WCAG 1.4.11 ("info required to
  // identify UI components") does not strictly require 3:1 here. Logged for
  // visibility; not asserted. See Phase 6 run-status for discussion.
  { name: 'card border on page bg [informational]', fg: C.cardBorder, bg: C.bg, min: 0, kind: 'nontext', required: false },
]

describe('6.4 contrast audit — each UI pair meets its WCAG minimum', () => {
  for (const p of PAIRS) {
    const label = p.required
      ? `${p.name} (${p.fg} vs ${p.bg}, min ${p.min}:1)`
      : `${p.name} (${p.fg} vs ${p.bg}) — informational only`
    it(label, () => {
      const ratio = contrastRatio(p.fg, p.bg)
      // Log the actual number so the Phase 6 run-status table has real data.
      // eslint-disable-next-line no-console
      console.log(
        `[contrast] ${p.name}: ${ratio.toFixed(2)}:1 ` +
          (p.required ? `(min ${p.min}:1) — ${ratio >= p.min ? 'PASS' : 'FAIL'}` : '(informational)'),
      )
      if (p.required) {
        expect(ratio).toBeGreaterThanOrEqual(p.min)
      }
    })
  }
})
