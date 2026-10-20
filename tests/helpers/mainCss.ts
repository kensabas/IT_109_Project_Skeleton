// Test helper: reads the design tokens straight from main.css so the
// contrast tests can never drift from the real values (Wave 0.5, I-3, I-4).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseCssTokens } from '../../app/utils/cssTokens'

// Resolved from the project root: under jsdom, import.meta.url is not a file URL.
const MAIN_CSS_PATH = resolve(process.cwd(), 'app/assets/css/main.css')

export function mainCssTokens(): Record<string, string> {
  return parseCssTokens(readFileSync(MAIN_CSS_PATH, 'utf8'))
}

// Returns the token value, failing loudly if main.css does not define it.
export function token(tokens: Record<string, string>, name: string): string {
  const value = tokens[name]
  if (!value) throw new Error(`main.css has no token ${name}`)
  return value
}
