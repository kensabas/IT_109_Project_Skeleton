// `npm run aria` — what a screen reader gets, without a screen reader:
// Playwright's accessibility tree (ariaSnapshot) for every route, saved to
// CLAUDE/screenshots/aria/<route>.yml, plus checks on the same page:
// one h1, headings in order, landmarks, accessible names on inputs /
// buttons / links, aria-sort / aria-current / aria-expanded values, status
// badges with text, dialog role and label, live-region roles on messages.
// Needs `npm run dev`. VoiceOver / NVDA themselves cannot be automated.
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, firefox, webkit } from 'playwright'
// Engine: BROWSER=chromium (default) | firefox | webkit.
const ENGINE_NAME = process.env.BROWSER ?? 'chromium'
const engine = { chromium, firefox, webkit }[ENGINE_NAME]
import { ROUTES } from './routes.mjs'
import { signInAs } from './session.mjs'

const BASE_URL = process.argv[2] ?? 'http://localhost:3000'
const OUT = ENGINE_NAME === 'chromium' ? 'CLAUDE/screenshots/aria' : `CLAUDE/screenshots/aria-${ENGINE_NAME}`
mkdirSync(OUT, { recursive: true })

function checks(signedIn) {
  const problems = []
  const nameOf = (el) => {
    const labelledby = el.getAttribute('aria-labelledby')
    if (labelledby) return labelledby.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim()
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim()
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) return l.textContent.trim() }
    const wrap = el.closest('label'); if (wrap) return wrap.textContent.trim()
    if (el.getAttribute('title')) return el.getAttribute('title').trim()
    return (el.textContent ?? '').trim()
  }
  const h1s = document.querySelectorAll('h1')
  if (h1s.length !== 1) problems.push(`h1 count ${h1s.length}`)
  let last = 0
  for (const h of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    if (h.closest('[hidden], details:not([open])')) continue
    const level = Number(h.tagName[1])
    if (last && level > last + 1) problems.push(`heading jump h${last} → h${level} "${h.textContent.trim().slice(0, 30)}"`)
    last = level
  }
  if (!document.querySelector('main')) problems.push('no <main> landmark')
  if (signedIn) {
    if (!document.querySelector('header')) problems.push('no <header> (banner) landmark')
    if (!document.querySelector('nav')) problems.push('no <nav> landmark')
    const current = document.querySelectorAll('nav [aria-current="page"]')
    if (current.length !== 1) problems.push(`nav aria-current="page" count ${current.length}`)
    const menu = document.querySelector('.shell__menu-button')
    if (!menu || !['true', 'false'].includes(menu.getAttribute('aria-expanded'))) problems.push('menu button aria-expanded missing')
  }
  for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
    if (!nameOf(el)) problems.push(`input without a name: ${el.outerHTML.slice(0, 80)}`)
  }
  for (const el of document.querySelectorAll('button, a[href], [role=button], [role=tab]')) {
    if (el.closest('.leaflet-container') && el.classList.contains('leaflet-marker-icon')) continue
    if (!nameOf(el)) problems.push(`control without a name: ${el.outerHTML.slice(0, 80)}`)
  }
  for (const th of document.querySelectorAll('th[aria-sort]')) {
    if (!['ascending', 'descending', 'none'].includes(th.getAttribute('aria-sort'))) problems.push(`bad aria-sort ${th.getAttribute('aria-sort')}`)
  }
  for (const table of document.querySelectorAll('table')) {
    if (table.querySelectorAll('th[aria-sort="ascending"], th[aria-sort="descending"]').length > 1) problems.push('table with more than one sorted column')
  }
  for (const b of document.querySelectorAll('.status-badge, .status-chip')) if (!b.textContent.trim()) problems.push('status badge without text')
  for (const m of document.querySelectorAll('.message')) {
    if (!['status', 'alert'].includes(m.getAttribute('role'))) problems.push(`message without live role: "${m.textContent.trim().slice(0, 40)}"`)
  }
  for (const d of document.querySelectorAll('[role=alertdialog], [role=dialog]')) {
    const label = d.getAttribute('aria-labelledby') && document.getElementById(d.getAttribute('aria-labelledby'))?.textContent.trim()
    if (!label) problems.push('dialog without a label')
  }
  return problems
}

const browser = await engine.launch()
let total = 0
const report = []
for (const route of ROUTES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await signInAs(context, route.role)
  const page = await context.newPage()
  await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle' })
  const snapshot = await page.locator('body').ariaSnapshot()
  writeFileSync(`${OUT}/${route.name}.yml`, snapshot)
  const problems = await page.evaluate(checks, !!route.role)
  // Open one confirm dialog (Reset demo data) and check it as well.
  if (route.role) {
    await page.click('button:has-text("Reset demo data")')
    const dialogProblems = await page.evaluate(checks, true)
    const dialog = await page.locator('[role=alertdialog]').ariaSnapshot()
    writeFileSync(`${OUT}/${route.name}--reset-dialog.yml`, dialog)
    for (const p of dialogProblems) if (!problems.includes(p)) problems.push(`(dialog open) ${p}`)
  }
  total += problems.length
  report.push({ route: route.path, problems, snapshotLines: snapshot.split('\n').length })
  console.log(`${route.path}: ${problems.length ? problems.length + ' problem(s)' : 'ok'} (snapshot ${snapshot.split('\n').length} lines)`)
  for (const p of problems) console.log(`   ${p}`)
  await context.close()
}
await browser.close()
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
console.log(`TOTAL aria problems (${ENGINE_NAME}): ${total}`)
