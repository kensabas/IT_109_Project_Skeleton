// `npm run shots` — screenshots of every listed route at 1280, 768 and
// 375 px into CLAUDE/screenshots/ (git-ignored). Needs `npm run dev`
// running. Also records console errors and page errors per route in
// CLAUDE/screenshots/report.json so problems are not missed.
//
// Usage: node scripts/shots.mjs [baseUrl] [nameFilter]
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { ROUTES, SIGN_IN_AS } from './routes.mjs'

const BASE_URL = process.argv[2] ?? 'http://localhost:3000'
const NAME_FILTER = process.argv[3] ?? ''
const WIDTHS = [1280, 768, 375]
const HEIGHT_FOR_WIDTH = { 1280: 800, 768: 1024, 375: 812 }
const OUT_DIR = 'CLAUDE/screenshots'
const SESSION_KEY = 'cleanlinis:session'

mkdirSync(OUT_DIR, { recursive: true })
const browser = await chromium.launch()
const report = []

for (const route of ROUTES.filter((r) => r.name.includes(NAME_FILTER))) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: HEIGHT_FOR_WIDTH[width] },
    })
    const email = route.role ? SIGN_IN_AS[route.role] : null
    await context.addInitScript(
      ([key, value]) => {
        if (value && !window.sessionStorage.getItem('shots-seeded')) {
          window.localStorage.setItem(key, value)
          window.sessionStorage.setItem('shots-seeded', '1')
        }
      },
      [SESSION_KEY, email],
    )
    const page = await context.newPage()
    const errors = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`${msg.type()}: ${msg.text()}`)
    })
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
    const response = await page.goto(BASE_URL + route.path, { waitUntil: 'networkidle' })
    // The Nuxt devtools button only exists in dev mode; hide it so the
    // screenshots show the app as users see it.
    await page.addStyleTag({ content: '#nuxt-devtools-container { display: none !important; }' })
    await page.waitForTimeout(300)
    const file = `${OUT_DIR}/${route.name}_${width}.png`
    await page.screenshot({ path: file, fullPage: true })
    const finalPath = new URL(page.url()).pathname
    const h1Count = await page.locator('h1').count()
    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    report.push({ route: route.path, name: route.name, width, status: response?.status(), finalPath, h1Count, pageScrollsSideways: overflowX, file, errors })
    console.log(`${route.path} @${width} -> ${response?.status()} final=${finalPath} h1=${h1Count} sideways=${overflowX} errors=${errors.length}`)
    await context.close()
  }
}

await browser.close()
writeFileSync(`${OUT_DIR}/report${NAME_FILTER ? '-' + NAME_FILTER : ''}.json`, JSON.stringify(report, null, 2))
