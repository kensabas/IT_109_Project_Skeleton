// `npm run mobile` — phone checks with Playwright device emulation (touch,
// isMobile): iPhone 13 (WebKit), Pixel 7 (Chromium) and a generic 375×667
// touch phone (Chromium). Needs `npm run dev`. On every route:
//  - no sideways page scroll
//  - signed-in pages: tapping Menu opens the navigation (aria-expanded)
//  - tap targets at least 24×24 px (WCAG 2.5.8); targets under 44 px listed
//    (inline links inside a sentence are exempt, as WCAG 2.5.8 allows; a
//    checkbox or radio inside a label uses the whole label as its target)
//  - inputs, selects and textareas use a font size of at least 16 px, so
//    iOS does not zoom in when they get focus
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, webkit, devices } from 'playwright'
import { ROUTES } from './routes.mjs'
import { signInAs } from './session.mjs'

const BASE_URL = process.argv[2] ?? 'http://localhost:3000'
const DEVICES = [
  { name: 'iPhone 13', engine: webkit, options: devices['iPhone 13'] },
  { name: 'Pixel 7', engine: chromium, options: devices['Pixel 7'] },
  { name: '375x667 touch', engine: chromium, options: { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
]
const MIN_TARGET = 24
const COMFORT_TARGET = 44
const MIN_INPUT_FONT = 16

function measure([minTarget, comfortTarget, minFont]) {
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' }
  const isInlineLink = (el) => el.tagName === 'A' && getComputedStyle(el).display === 'inline' && (el.parentElement?.textContent.trim().length ?? 0) > el.textContent.trim().length + 3
  const tooSmall = []; const under44 = []; const smallFonts = []
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=tab]')) {
    if (!visible(el) || el.closest('.leaflet-control-attribution') || el.closest('[aria-hidden=true]')) continue
    if (isInlineLink(el)) continue
    const target = (el.matches('input[type=checkbox], input[type=radio]') && el.closest('label')) || el
    const r = target.getBoundingClientRect()
    const label = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${(el.getAttribute('aria-label') || el.textContent || el.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 30)}" ${Math.round(r.width)}×${Math.round(r.height)}`
    if (r.width < minTarget || r.height < minTarget) tooSmall.push(label)
    else if (r.width < comfortTarget || r.height < comfortTarget) under44.push(label)
  }
  for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')) {
    if (!visible(el)) continue
    const size = parseFloat(getComputedStyle(el).fontSize)
    if (size < minFont) smallFonts.push(`${el.tagName.toLowerCase()}#${el.id} ${size}px`)
  }
  return {
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
    tooSmall, under44, smallFonts,
  }
}

const report = []
let problems = 0
for (const device of DEVICES) {
  const browser = await device.engine.launch()
  for (const route of ROUTES) {
    const context = await browser.newContext({ ...device.options })
    await signInAs(context, route.role)
    const page = await context.newPage()
    await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle' })
    const m = await page.evaluate(measure, [MIN_TARGET, COMFORT_TARGET, MIN_INPUT_FONT])
    let menu = 'n/a'
    if (route.role) {
      await page.tap('.shell__menu-button')
      await page.waitForTimeout(150)
      const expanded = await page.getAttribute('.shell__menu-button', 'aria-expanded')
      const navVisible = await page.isVisible('nav[aria-label=Main] a')
      menu = expanded === 'true' && navVisible ? 'opens' : `FAIL (aria-expanded ${expanded}, nav visible ${navVisible})`
      // Measure again with the menu open: its links are tap targets too.
      const open = await page.evaluate(measure, [MIN_TARGET, COMFORT_TARGET, MIN_INPUT_FONT])
      for (const t of open.tooSmall) if (!m.tooSmall.includes(t)) m.tooSmall.push(t)
      for (const t of open.under44) if (!m.under44.includes(t)) m.under44.push(t)
      if (open.sideways) m.sideways = true
    }
    const count = (m.sideways ? 1 : 0) + m.tooSmall.length + m.smallFonts.length + (menu.startsWith('FAIL') ? 1 : 0)
    problems += count
    report.push({ device: device.name, route: route.path, menu, ...m })
    console.log(`${device.name} ${route.path}: sideways=${m.sideways} menu=${menu} under24=${m.tooSmall.length} under44=${m.under44.length} inputsUnder16px=${m.smallFonts.length}`)
    for (const t of m.tooSmall) console.log(`   under 24 px: ${t}`)
    for (const f of m.smallFonts) console.log(`   input font: ${f}`)
    await context.close()
  }
  await browser.close()
}
mkdirSync('CLAUDE/screenshots', { recursive: true })
writeFileSync('CLAUDE/screenshots/mobile-report.json', JSON.stringify(report, null, 2))
console.log(`TOTAL phone problems: ${problems}`)
