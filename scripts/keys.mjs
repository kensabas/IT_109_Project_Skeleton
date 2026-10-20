// `npm run keys` — keyboard-only checks on every route (needs `npm run dev`).
// Engine: BROWSER=chromium (default) | firefox | webkit.
// Per route: Tab through the whole page and check
//   - a visible focus indicator at every stop (outline or box-shadow)
//   - visual order (no jump back up-and-left in reading order)
//   - no keyboard trap (the cycle reaches the end of the page)
//   - the skip link is the first stop and moves focus to the main content
// Plus: Enter and Space on sort headers change aria-sort; Enter and Space
// on the phone Menu button toggle aria-expanded; every confirm panel opens
// from the keyboard, Escape closes it and focus returns to its opener.
// WebKit on macOS moves to links only with Option+Tab (Safari's own
// keyboard setting), so Alt+Tab is used there.
import { writeFileSync, mkdirSync } from 'node:fs'
import { chromium, firefox, webkit } from 'playwright'
import { ROUTES } from './routes.mjs'
import { signInAs } from './session.mjs'

const ENGINE_NAME = process.env.BROWSER ?? 'chromium'
const engine = { chromium, firefox, webkit }[ENGINE_NAME]
const TAB = ENGINE_NAME === 'webkit' ? 'Alt+Tab' : 'Tab'
const BASE_URL = process.argv[2] ?? 'http://localhost:3000'
const MAX_STOPS = 250

// Confirm panels and the buttons that open them (route path → openers).
const CONFIRM_OPENERS = {
  '/admin/jobs/job-001': ['button:has-text("Archive job")', 'button:has-text("Unassign cleaner")'],
  '/admin/jobs/job-005': ['button[aria-label="Assign Pedro Mendoza"]'],
  '/admin/requests': ['button[aria-label="Approve Kitchen and living room clean"]', 'button[aria-label="Reject Kitchen and living room clean"]'],
  '/admin/accounts': ['button[aria-label="Suspend Rosa Garcia"]'],
  '/admin/accounts/liza.fernandez%40example.com': ['button:has-text("Suspend")', 'button:has-text("Approve cleaner")', 'button:has-text("Reject cleaner")'],
  '/admin/disputes/dsp-001': ['button:has-text("Mark as resolved")'],
  '/client/requests/req-005': ['button:has-text("Cancel request")'],
  '/cleaner/applications': ['button[aria-label="Cancel application for Café closing clean"]'],
}
const RESET_OPENER = 'button:has-text("Reset demo data")'

function describeActive() {
  const el = document.activeElement
  if (!el || el === document.body) return null
  const r = el.getBoundingClientRect()
  const style = getComputedStyle(el)
  const isDate = el.matches('input[type=date], input[type=time]')
  // Chromium's own picker button inside a date input (see I-18): the input
  // loses :focus and the browser draws its ring; checked by screenshot.
  const browserPickerButton = isDate && !el.matches(':focus')
  const visible = browserPickerButton ||
    (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
    (style.boxShadow && style.boxShadow !== 'none')
  const text = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.id || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)
  return {
    key: `${el.tagName.toLowerCase()}#${el.id}|${text}|${Math.round(r.top + scrollY)}|${Math.round(r.left)}`,
    label: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${text}"`,
    top: r.top + scrollY, left: r.left, visible, isDate, inHeader: !!el.closest('header'),
  }
}

async function tabCycle(page) {
  const stops = []
  let repeatsInARow = 0
  let trapped = false
  for (let i = 0; i < MAX_STOPS; i++) {
    await page.keyboard.press(TAB)
    const info = await page.evaluate(describeActive)
    if (!info) { if (stops.length) break; continue }
    if (stops.length && info.key === stops[0].key) break // cycled back to the start
    const prev = stops[stops.length - 1]
    if (prev && prev.key === info.key && !info.isDate) {
      repeatsInARow++
      if (repeatsInARow >= 3) { trapped = true; break }
    } else repeatsInARow = 0
    if (!prev || prev.key !== info.key) stops.push(info)
  }
  const hitMax = stops.length >= MAX_STOPS
  const orderProblems = []
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]; const b = stops[i]
    if (a.inHeader || b.inHeader) continue
    if (b.top < a.top - 40 && b.left < a.left - 40) orderProblems.push(`${a.label} → ${b.label}`)
  }
  return { stops, trapped: trapped || hitMax, orderProblems, focusProblems: stops.filter((s) => !s.visible).map((s) => s.label) }
}

async function checkSkipLink(page) {
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press(TAB)
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
  if (first !== 'Skip to main content') return `first stop is "${first}"`
  await page.keyboard.press('Enter')
  const id = await page.evaluate(() => document.activeElement?.id)
  return id === 'main-content' ? null : `after Enter focus is on #${id}`
}

async function checkSortKeys(page) {
  const button = page.locator('.sortable__sort:visible').first()
  if (!(await button.count())) return null
  const th = button.locator('xpath=..')
  const before = await th.getAttribute('aria-sort')
  await button.focus(); await page.keyboard.press('Enter')
  const afterEnter = await th.getAttribute('aria-sort')
  await page.keyboard.press(' ')
  const afterSpace = await th.getAttribute('aria-sort')
  const ok = afterEnter !== before && afterSpace !== afterEnter
  return { ok, detail: `aria-sort ${before} → Enter ${afterEnter} → Space ${afterSpace}` }
}

async function checkConfirm(page, selector) {
  const opener = page.locator(selector).first()
  if (!(await opener.count())) return { ok: false, detail: `${selector}: not found` }
  await opener.evaluate((el) => el.setAttribute('data-opener', 'yes'))
  await opener.focus(); await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  const dialog = page.locator('[role=alertdialog]')
  const opened = await dialog.count()
  const focusInside = opened ? await page.evaluate(() => !!document.activeElement?.closest('[role=alertdialog]')) : false
  await page.keyboard.press('Escape')
  await page.waitForTimeout(150)
  const closed = (await dialog.count()) === 0
  const backOnOpener = await page.evaluate(() => document.activeElement?.getAttribute('data-opener') === 'yes')
  await page.evaluate(() => document.querySelector('[data-opener]')?.removeAttribute('data-opener'))
  const ok = opened > 0 && focusInside && closed && backOnOpener
  return { ok, detail: `${selector}: opened ${opened > 0}, focus inside ${focusInside}, Escape closes ${closed}, focus back on opener ${backOnOpener}` }
}

const browser = await engine.launch()
const report = []
let problems = 0
const routes = [...ROUTES, { name: 'account-notice', path: '/account-notice', role: null }]
for (const route of routes) {
  if (route.path === '/account-notice') continue // needs a deactivated session; checked in the flows
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await signInAs(context, route.role)
  const page = await context.newPage()
  await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle' })
  const entry = { route: route.path, engine: ENGINE_NAME }
  const cycle = await tabCycle(page)
  entry.tabStops = cycle.stops.length
  entry.trapped = cycle.trapped
  entry.focusProblems = cycle.focusProblems
  entry.orderProblems = cycle.orderProblems
  if (route.role) entry.skipLink = await checkSkipLink(page)
  entry.sortKeys = await checkSortKeys(page)
  entry.confirms = []
  for (const sel of [...(CONFIRM_OPENERS[route.path] ?? []), ...(route.role ? [RESET_OPENER] : [])]) {
    await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle' })
    entry.confirms.push(await checkConfirm(page, sel))
  }
  const count = (entry.trapped ? 1 : 0) + entry.focusProblems.length + entry.orderProblems.length + (entry.skipLink ? 1 : 0) +
    (entry.sortKeys && !entry.sortKeys.ok ? 1 : 0) + entry.confirms.filter((c) => !c.ok).length
  problems += count
  console.log(`${route.path}: stops=${entry.tabStops} trap=${entry.trapped} focusNotVisible=${entry.focusProblems.length} orderJumps=${entry.orderProblems.length} skip=${entry.skipLink ?? 'ok'} sortKeys=${entry.sortKeys ? (entry.sortKeys.ok ? 'ok' : 'FAIL') : 'n/a'} confirms=${entry.confirms.filter((c) => c.ok).length}/${entry.confirms.length}`)
  for (const f of entry.focusProblems) console.log(`   focus not visible: ${f}`)
  for (const o of entry.orderProblems) console.log(`   order jump: ${o}`)
  if (entry.sortKeys && !entry.sortKeys.ok) console.log(`   sort keys: ${entry.sortKeys.detail}`)
  for (const c of entry.confirms.filter((x) => !x.ok)) console.log(`   confirm: ${c.detail}`)
  report.push(entry)
  await context.close()
}

// Phone menu button: Enter and Space toggle aria-expanded.
{
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } })
  await signInAs(context, 'cleaner')
  const page = await context.newPage()
  await page.goto(BASE_URL + '/cleaner/marketplace', { waitUntil: 'networkidle' })
  const menu = page.locator('.shell__menu-button')
  const states = [await menu.getAttribute('aria-expanded')]
  await menu.focus(); await page.keyboard.press('Enter'); states.push(await menu.getAttribute('aria-expanded'))
  await page.keyboard.press(' '); states.push(await menu.getAttribute('aria-expanded'))
  const ok = states.join() === 'false,true,false'
  if (!ok) problems++
  console.log(`phone Menu button Enter/Space: ${states.join(' → ')} ${ok ? 'ok' : 'FAIL'}`)
  report.push({ route: '/cleaner/marketplace @375 menu', engine: ENGINE_NAME, menuStates: states, ok })
  await context.close()
}

await browser.close()
mkdirSync('CLAUDE/screenshots', { recursive: true })
writeFileSync(`CLAUDE/screenshots/keys-report-${ENGINE_NAME}.json`, JSON.stringify(report, null, 2))
console.log(`TOTAL keyboard problems (${ENGINE_NAME}): ${problems}`)
