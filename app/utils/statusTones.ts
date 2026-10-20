// Colour tones for status chips and badges. Each tone has a
// `--color-tone-<tone>-bg` / `-fg` token pair in main.css, contrast-
// tested in tests/statusChip.contrast.spec.ts. Text labels are always
// shown, so colour is never the only signal (WCAG 1.4.1).
import type { JobStatus } from '../data/mockJobs'

export const TONES = ['blue', 'teal', 'green', 'red', 'amber', 'grey', 'purple'] as const
export type Tone = (typeof TONES)[number]

export const JOB_STATUS_TONE: Record<JobStatus, Tone> = {
  scheduled: 'blue',
  'in-progress': 'teal',
  completed: 'green',
  missed: 'red',
}
