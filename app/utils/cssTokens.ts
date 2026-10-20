// Reads CSS custom properties (`--name: value;`) out of a stylesheet's
// text. Used by the contrast tests so they check the real tokens in
// main.css instead of typed copies (Wave 0.5).

const COMMENT = /\/\*[\s\S]*?\*\//g
const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g

export function parseCssTokens(cssText: string): Record<string, string> {
  const withoutComments = cssText.replace(COMMENT, '')
  const tokens: Record<string, string> = {}
  for (const match of withoutComments.matchAll(DECLARATION)) {
    tokens[match[1]] = match[2].replace(/\s+/g, ' ').trim()
  }
  return tokens
}
