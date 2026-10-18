// F-01 Phase 6.4 — WCAG 2.x relative luminance + contrast ratio.
//
// Pure functions, no DOM. Tested from tests/contrast.spec.ts.
// Reference: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
//
// Not production-grade: assumes sRGB inputs, no alpha, no colour spaces
// beyond sRGB. For the midterm design-token audit this is enough.

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').toLowerCase()
  if (!/^[0-9a-f]{6}$/.test(h)) {
    throw new Error(`contrast: expected #rrggbb hex, got "${hex}"`)
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

// Convert one sRGB channel (0..255) to the linearised value used in the
// luminance formula (WCAG 2.x gamma expansion).
function channelToLinear(ch255: number): number {
  const c = ch255 / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

// WCAG relative luminance.
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex)
  const R = channelToLinear(r)
  const G = channelToLinear(g)
  const B = channelToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

// Contrast ratio between two colours. Argument order does not matter.
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}
