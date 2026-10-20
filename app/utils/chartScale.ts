// Chart helpers: a rounded top for the value axis and a readable summary.

// Smallest "nice" number (1, 2, 5 × 10^n) at or above the largest value.
export function niceMax(values: number[]): number {
  const max = Math.max(0, ...values)
  if (max === 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(max))
  for (const step of [1, 2, 5, 10]) if (step * magnitude >= max) return step * magnitude
  return 10 * magnitude
}

export interface Point { label: string; value: number }

export function summarise(points: Point[], unit: string): string {
  if (!points.length || points.every((p) => p.value === 0)) return `No ${unit} in this period.`
  const total = points.reduce((sum, p) => sum + p.value, 0)
  const top = points.reduce((best, p) => (p.value > best.value ? p : best))
  return `${total} ${unit} in total. Highest: ${top.label} (${top.value}).`
}

const MAX_AXIS_LABELS = 5

// Which points get an x-axis label: every nth point, plus the last one
// only when it is not crowded by the previous labelled point (I-20).
export function axisLabelIndexes(count: number): number[] {
  const every = Math.max(1, Math.ceil(count / MAX_AXIS_LABELS))
  const indexes: number[] = []
  for (let i = 0; i < count; i += every) indexes.push(i)
  const last = count - 1
  if (last > 0 && !indexes.includes(last) && last % every > every / 2) indexes.push(last)
  return indexes
}
