// Test helper: reads the design tokens straight from main.css so the
// contrast tests can never drift from the real values (Wave 0.5, I-3, I-4).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseCssTokens } from '../../app/utils/cssTokens'

const MAIN_CSS_PATH = fileURLToPath(new URL('../../app/assets/css/main.css', import.meta.url))

export function mainCssTokens(): Record<string, string> {
  return parseCssTokens(readFileSync(MAIN_CSS_PATH, 'utf8'))
}

// Returns the token value, failing loudly if main.css does not define it.
export function token(tokens: Record<string, string>, name: string): string {
  const value = tokens[name]
  if (!value) throw new Error(`main.css has no token ${name}`)
  return value
}
