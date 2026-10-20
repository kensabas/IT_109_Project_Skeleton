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
