// Shared by the browser scripts: sign the browser in as a mock role by
// writing the mock session to localStorage before the app starts.
import { readFileSync } from 'node:fs'
import { SIGN_IN_AS } from './routes.mjs'

const SESSION_KEY = 'cleanlinis:session'
const SCHEMA_KEY = 'cleanlinis:schema'
// The persist plugin clears saved data written under another schema
// version, so the script writes the app's current version too (I-9).
const SCHEMA_VERSION = readFileSync('app/utils/persistence.ts', 'utf8').match(/SCHEMA_VERSION = (\d+)/)[1]

export async function signInAs(context, role) {
  const email = role ? SIGN_IN_AS[role] : null
  await context.addInitScript(
    ([key, value, schemaKey, schemaVersion]) => {
      if (value && !window.sessionStorage.getItem('script-seeded')) {
        window.localStorage.setItem(schemaKey, schemaVersion)
        window.localStorage.setItem(key, value)
        window.sessionStorage.setItem('script-seeded', '1')
      }
    },
    [SESSION_KEY, email, SCHEMA_KEY, SCHEMA_VERSION],
  )
}
