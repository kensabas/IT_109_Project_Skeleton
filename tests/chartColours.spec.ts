// Polish C [F-20] — every chart mark colour, READ FROM main.css, reaches
// at least 3:1 against the white card (WCAG 1.4.11 non-text contrast).
import { describe, it, expect } from 'vitest'
import { contrastRatio } from '../app/utils/contrast'
import { mainCssTokens, token } from './helpers/mainCss'

const tokens = mainCssTokens()
const CHART_TOKENS = ['--color-chart-single', '--color-chart-1', '--color-chart-2', '--color-chart-3', '--color-chart-4']

describe('chart colours vs the card background', () => {
  for (const name of CHART_TOKENS) {
    it(`${name} ≥ 3:1`, () => {
      const ratio = contrastRatio(token(tokens, name), token(tokens, '--color-card'))
      // eslint-disable-next-line no-console
      console.log(`[chart] ${name} ${token(tokens, name)} on ${token(tokens, '--color-card')} = ${ratio.toFixed(2)}:1`)
      expect(ratio).toBeGreaterThanOrEqual(3)
    })
  }
})
