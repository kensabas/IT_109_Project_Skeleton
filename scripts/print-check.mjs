// `npm run print-check` — the report as printed (needs `npm run dev`):
// fires beforeprint like a browser does, emulates print media, saves
// CLAUDE/screenshots/print/admin-reports.pdf and a print-media screenshot,
// records which screen-only parts are hidden and whether the chart data
// tables are open for print and closed again afterwards. The PDF pages are
// turned into PNGs with macOS PDFKit (see the run-status files) and viewed.
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { signInAs } from './session.mjs'
const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); await signInAs(c, 'admin'); const p = await c.newPage()
await p.goto('http://localhost:3000/admin/reports', { waitUntil: 'networkidle' })
// What the browser does when printing starts (Playwright's pdf() does not fire it).
await p.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
const opened = await p.locator('details.chart__table[open]').count()
await p.emulateMedia({ media: 'print' })
await p.pdf({ path: 'CLAUDE/screenshots/print/admin-reports.pdf', format: 'A4', printBackground: true })
await p.screenshot({ path: 'CLAUDE/screenshots/print/admin-reports-print-media.png', fullPage: true })
const hidden = await p.evaluate(() => Object.fromEntries(['.shell__header', '.shell__footer', '.filters', '.tabs', '.page-header__actions button', '.shell__skip'].map((s) => [s, document.querySelector(s) ? getComputedStyle(document.querySelector(s)).display : 'missing'])))
const lines = [JSON.stringify(hidden), `data tables open: ${opened}`]
await p.evaluate(() => window.dispatchEvent(new Event('afterprint')))
lines.push(`after print, data tables open: ${await p.locator('details.chart__table[open]').count()}`)
mkdirSync('CLAUDE/screenshots/print', { recursive: true })
writeFileSync('CLAUDE/screenshots/print/print-check.txt', lines.join('\n'))
console.log(lines.join('\n'))
await b.close()
