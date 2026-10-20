// Wave 1.7 [F-01 to F-29] — every status shown by StatusBadge has a
// text label and a tone that exists in main.css (colour is never the
// only signal; tones are contrast-tested in statusChip.contrast.spec.ts).
import { describe, it, expect } from 'vitest'
import { STATUS_META, STATUS_KINDS, statusLabel } from '../app/utils/statusMeta'
import { TONES } from '../app/utils/statusTones'
import {
  REQUEST_STATUSES,
  APPLICATION_STATUSES,
  DISPUTE_STATUSES,
  DOCUMENT_STATUSES,
} from '../app/data/statuses'
import { JOB_STATUSES } from '../app/data/mockJobs'
import { ACCOUNT_STATES, APPROVAL_STATUSES } from '../app/data/mockUsers'

const VALUES_BY_KIND: Record<string, readonly string[]> = {
  job: JOB_STATUSES,
  request: REQUEST_STATUSES,
  application: APPLICATION_STATUSES,
  dispute: DISPUTE_STATUSES,
  document: DOCUMENT_STATUSES,
  account: ACCOUNT_STATES,
  approval: APPROVAL_STATUSES,
}

describe('STATUS_META', () => {
  it('covers every kind', () => {
    expect([...STATUS_KINDS].sort()).toEqual(Object.keys(VALUES_BY_KIND).sort())
  })

  for (const [kind, values] of Object.entries(VALUES_BY_KIND)) {
    it(`${kind}: every value has a label and a known tone`, () => {
      for (const value of values) {
        const meta = STATUS_META[kind as keyof typeof STATUS_META][value as never] as { label: string; tone: string }
        expect(meta.label.length).toBeGreaterThan(0)
        expect(TONES).toContain(meta.tone)
      }
    })
  }

  it('statusLabel returns the label, or the raw value when unknown', () => {
    expect(statusLabel('request', 'pending')).toBe('Pending')
    expect(statusLabel('request', 'nonsense')).toBe('nonsense')
  })
})
