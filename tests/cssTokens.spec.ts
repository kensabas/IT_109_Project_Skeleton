// Wave 0.5 [F-01, F-17, F-19] — parsing custom properties out of CSS text.
import { describe, it, expect } from 'vitest'
import { parseCssTokens } from '../app/utils/cssTokens'

describe('parseCssTokens', () => {
  it('reads hex colour tokens', () => {
    const css = ':root {\n  --color-teal: #0E7C7B;\n  --color-text: #0F2A2E;\n}'
    expect(parseCssTokens(css)).toEqual({
      '--color-teal': '#0E7C7B',
      '--color-text': '#0F2A2E',
    })
  })

  it('ignores comments next to a value', () => {
    const css = ':root { --color-error: #B91C1C; /* placeholder */ }'
    expect(parseCssTokens(css)['--color-error']).toBe('#B91C1C')
  })

  it('ignores tokens that only appear inside a comment', () => {
    const css = '/* --color-ghost: #000000; */ :root { --color-real: #FFFFFF; }'
    const tokens = parseCssTokens(css)
    expect(tokens['--color-ghost']).toBeUndefined()
    expect(tokens['--color-real']).toBe('#FFFFFF')
  })

  it('keeps multi-line values joined with single spaces', () => {
    const css = ':root {\n  --shadow: 0 1px 2px red,\n    0 2px 4px blue;\n}'
    expect(parseCssTokens(css)['--shadow']).toBe('0 1px 2px red, 0 2px 4px blue')
  })
})
