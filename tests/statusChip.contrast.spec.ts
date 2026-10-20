// F-17/18/19 + Wave 0.5 [I-3] — status chip colours.
//
// Every tone pair is READ FROM main.css (no typed copies), and every
// job status must map to a tone whose fg/bg meet WCAG 2.x 4.5:1 for
// normal text. If a pair drops below 4.5 the token must change.

import { describe, it, expect } from 'vitest'
import { contrastRatio } from '../app/utils/contrast'
import { TONES, JOB_STATUS_TONE } from '../app/utils/statusTones'
import { JOB_STATUSES } from '../app/data/mockJobs'
import { mainCssTokens, token } from './helpers/mainCss'

const tokens = mainCssTokens()

describe('status tones in main.css — fg on bg contrast ≥ 4.5:1', () => {
  for (const tone of TONES) {
    it(`tone ${tone}`, () => {
      const fg = token(tokens, `--color-tone-${tone}-fg`)
      const bg = token(tokens, `--color-tone-${tone}-bg`)
      const ratio = contrastRatio(fg, bg)
      // eslint-disable-next-line no-console
      console.log(`[tone ${tone}] ${fg} on ${bg} = ${ratio.toFixed(2)}:1`)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  }
})

describe('StatusChip — every job status uses a defined tone', () => {
  for (const status of JOB_STATUSES) {
    it(status, () => {
      expect(TONES).toContain(JOB_STATUS_TONE[status])
    })
  }
})
