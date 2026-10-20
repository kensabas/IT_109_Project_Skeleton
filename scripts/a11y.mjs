// `npm run a11y` — automated accessibility, keyboard, console and network
// checks for every listed route at 1280 and 375 px (needs `npm run dev`).
//  - axe-core (WCAG 2.0 / 2.1, levels A and AA rules)
//  - Tab through the page: every focused element must show a visible
//    focus indicator (outline or box-shadow)
//  - console errors / warnings, page errors, failed or 4xx/5xx requests
// Writes CLAUDE/screenshots/a11y-report.json and prints one line per check.
// Automated checks find only part of all accessibility problems; a person
// with a keyboard and a screen reader still needs to check (see review file).
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'
import { ROUTES } from './routes.mjs'
import { signInAs } from './session.mjs'

const BASE_URL = process.argv[2] ?? 'http://localhost:3000'
const NAME_FILTER = process.argv[3] ?? ''
const WIDTHS = [1280, 375]
const MAX_TAB_STOPS = 40
const AXE_PATH = createRequire(import.meta.url).resolve('axe-core/axe.min.js')

const browser = await chromium.launch()
const report = []
let problems = 0

for (const route of ROUTES.filter((r) => r.name.includes(NAME_FILTER))) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    await signInAs(context, route.role)
    const page = await context.newPage()
    const consoleProblems = []
    const network = []
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleProblems.push(`${m.type()}: ${m.text()}`) })
    page.on('pageerror', (e) => consoleProblems.push(`pageerror: ${e.message}`))
    page.on('requestfailed', (r) => network.push(`failed ${r.url()} ${r.failure()?.errorText}`))
    page.on('response', (r) => { if (r.status() >= 400) network.push(`${r.status()} ${r.url()}`) })
    await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)

    await page.addScriptTag({ path: AXE_PATH })
    const axe = await page.evaluate(async () => {
      // The Nuxt devtools button exists only in `npm run dev`; it is not
      // part of the app, so it is left out.
      const result = await window.axe.run({ exclude: [['#nuxt-devtools-container']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })
      return result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(' ') }))
    })

    const focusProblems = []
    let stops = 0
    for (let i = 0; i < MAX_TAB_STOPS; i++) {
      await page.keyboard.press('Tab')
      const info = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body || el.closest('#nuxt-devtools-container') || el.tagName.toLowerCase() === 'nuxt-devtools-frame') return null
        // Tab inside a date or time input can land on the browser's own
        // calendar / clock button (inside the input's private shadow tree):
        // the input then no longer matches :focus and its styles cannot be
        // read from the page. Chromium draws its own focus ring there
        // (checked by screenshot, CLAUDE/screenshots/date-picker-button-focus.png).
        if (el.matches('input[type=date], input[type=time]') && !el.matches(':focus')) {
          return { tag: 'input', text: `${el.id} (browser picker button)`, visible: true }
        }
        const style = getComputedStyle(el)
        const visible = (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || (style.boxShadow && style.boxShadow !== 'none')
        return { tag: el.tagName.toLowerCase(), text: (el.getAttribute('aria-label') || el.textContent || el.id || '').trim().slice(0, 40), visible }
      })
      if (!info) break
      stops++
      if (!info.visible) focusProblems.push(`${info.tag} "${info.text}"`)
    }

    const entry = { route: route.path, name: route.name, width, axe, tabStops: stops, focusProblems, consoleProblems, network }
    report.push(entry)
    const count = axe.length + focusProblems.length + consoleProblems.length + network.length
    problems += count
    console.log(`${route.path} @${width}: axe=${axe.length} tabStops=${stops} focusNotVisible=${focusProblems.length} console=${consoleProblems.length} network=${network.length}`)
    for (const v of axe) console.log(`   axe ${v.id} (${v.impact}) x${v.nodes}: ${v.help} :: ${v.target}`)
    for (const f of focusProblems) console.log(`   focus not visible: ${f}`)
    for (const c of consoleProblems) console.log(`   ${c}`)
    for (const n of network) console.log(`   network ${n}`)
    await context.close()
  }
}

await browser.close()
mkdirSync('CLAUDE/screenshots', { recursive: true })
writeFileSync(`CLAUDE/screenshots/a11y-report${NAME_FILTER ? '-' + NAME_FILTER : ''}.json`, JSON.stringify(report, null, 2))
console.log(`TOTAL problems: ${problems}`)
