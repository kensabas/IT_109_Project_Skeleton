// `npm run b2audit` — checks every table and info list against the 20
// rules of the approved table pattern (SYSTEM_CONTEXT.md, Section B.2)
// using computed styles in a real browser (needs `npm run dev`).
// Token values are read from app/assets/css/main.css, never typed here.
// Writes CLAUDE/b2_audit.md (page × rule table) and prints a summary.
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { signInAs } from './session.mjs'

const BASE_URL = process.argv[2] ?? 'http://localhost:3000'

// ---- tokens from main.css -------------------------------------------------
const css = readFileSync('app/assets/css/main.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const raw = Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
const rgb = (hex) => {
  const h = hex.replace('#', '')
  return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`
}
const T = {
  cardBorder: rgb(raw['--color-card-border']),
  headBg: rgb(raw['--color-table-head-bg']),
  textSoft: rgb(raw['--color-text-soft']),
  text: rgb(raw['--color-text']),
  teal: rgb(raw['--color-teal']),
  tealDark: rgb(raw['--color-teal-dark']),
  stripe: rgb(raw['--color-row-stripe']),
  hover: rgb(raw['--color-row-hover']),
  divider: rgb(raw['--color-divider']),
  radius: raw['--radius-card'],
}

// ---- pages ---------------------------------------------------------------
const PAGES = [
  { name: 'Admin job posts', path: '/admin/jobs', role: 'admin' },
  { name: 'Admin job detail (job-001)', path: '/admin/jobs/job-001', role: 'admin' },
  { name: 'Admin job detail (job-005, applicants)', path: '/admin/jobs/job-005', role: 'admin' },
  { name: 'Admin requests', path: '/admin/requests', role: 'admin' },
  { name: 'Admin bookings', path: '/admin/bookings', role: 'admin' },
  { name: 'Admin accounts', path: '/admin/accounts', role: 'admin' },
  { name: 'Admin accounts (empty search)', path: '/admin/accounts', role: 'admin', action: async (p) => { await p.fill('#accounts-search', 'zzzz-no-match') } },
  { name: 'Admin account (cleaner)', path: '/admin/accounts/liza.fernandez%40example.com', role: 'admin' },
  { name: 'Admin account (client)', path: '/admin/accounts/maria.santos%40example.com', role: 'admin' },
  { name: 'Admin disputes', path: '/admin/disputes', role: 'admin' },
  { name: 'Admin dispute detail', path: '/admin/disputes/dsp-001', role: 'admin' },
  { name: 'Admin reports (admin tab, data tables open)', path: '/admin/reports', role: 'admin', action: async (p) => { for (const d of await p.locator('details.chart__table').all()) await d.evaluate((el) => { el.open = true }) } },
  { name: 'Admin reports (cleaners tab)', path: '/admin/reports', role: 'admin', action: async (p) => { await p.click('#tab-cleaners') } },
  { name: 'Admin reports (clients tab)', path: '/admin/reports', role: 'admin', action: async (p) => { await p.click('#tab-clients') } },
  { name: 'Admin calendar', path: '/admin/calendar', role: 'admin' },
  { name: 'Client requests', path: '/client/requests', role: 'client' },
  { name: 'Client request detail', path: '/client/requests/req-001', role: 'client' },
  { name: 'Cleaner applications', path: '/cleaner/applications', role: 'cleaner' },
  { name: 'Cleaner job detail', path: '/cleaner/jobs/job-005', role: 'cleaner' },
]

// Runs in the page. Returns rule → { status, value } for tables / lists found.
function audit(T) {
  const out = {}
  const put = (rule, ok, value) => {
    const prev = out[rule]
    if (!prev || (prev.status === 'PASS' && !ok)) out[rule] = { status: ok ? 'PASS' : 'FAIL', value: String(value) }
  }
  const cs = (el, pseudo) => getComputedStyle(el, pseudo)
  const lum = (c) => {
    const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  const microLabel = (s) => s.fontSize === '11px' && s.textTransform === 'uppercase' && s.letterSpacing === '0.88px' && s.color === T.textSoft

  for (const table of document.querySelectorAll('table')) {
    const container = table.closest('.sortable, .chart__table, .calendar') ?? table.parentElement
    const kind = container.classList.contains('calendar') ? 'calendar' : container.classList.contains('chart__table') ? 'chart' : 'sortable'
    const c = cs(container)
    put(1, c.borderTopWidth === '1px' && c.borderTopStyle === 'solid' && c.borderTopColor === T.cardBorder && c.boxShadow.includes('12px 32px -14px'), `${kind}: border ${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}; shadow ${c.boxShadow.includes('12px 32px -14px') ? 'card-lg' : c.boxShadow}`)
    put(2, c.borderTopLeftRadius === T.radius && c.overflow.includes('hidden'), `${kind}: radius ${c.borderTopLeftRadius}, overflow ${c.overflow}`)
    const scroller = table.parentElement
    const minW = parseFloat(cs(table).minWidth) || 0
    put(3, cs(scroller).overflowX === 'auto' && minW > 0, `${kind}: wrapper overflow-x ${cs(scroller).overflowX}, table min-width ${cs(table).minWidth}`)
    const ths = [...table.querySelectorAll('thead th')]
    for (const th of ths) {
      const s = cs(th)
      put(4, s.backgroundColor === T.headBg, `${kind}: th bg ${s.backgroundColor}`)
      put(5, microLabel(s) && s.fontWeight === '700', `${kind}: ${s.fontSize} ${s.fontWeight} ${s.textTransform} ${s.letterSpacing} ${s.color}`)
    }
    const dataThs = ths.filter((th) => th.querySelector('button'))
    const noSortButton = ths.filter((th) => !th.querySelector('button') && !th.classList.contains('actions-col') && !th.querySelector('.sortable__plain'))
    put(6, dataThs.length > 0 && noSortButton.length === 0 && dataThs.every((th) => th.getAttribute('scope') === 'col' && th.hasAttribute('aria-sort')), `${kind}: ${dataThs.length} sort buttons, ${noSortButton.length} data headers without one`)
    const sorted = ths.find((th) => ['ascending', 'descending'].includes(th.getAttribute('aria-sort')))
    if (sorted) {
      const a = cs(sorted, '::after')
      put(6, a.height === '2px' && a.backgroundColor === T.teal, `${kind}: sorted ::after ${a.height} ${a.backgroundColor}`)
      const btn = sorted.querySelector('button')
      const arrow = sorted.querySelector('[aria-hidden="true"]')
      put(7, cs(btn).color === T.tealDark && (!arrow || cs(arrow).color === T.teal), `${kind}: active label ${cs(btn).color}, arrow ${arrow ? cs(arrow).color : 'none'}`)
    }
    for (const th of dataThs.filter((t) => t !== sorted)) {
      const arrow = th.querySelector('[aria-hidden="true"]')
      if (arrow) put(7, cs(arrow).color === T.textSoft, `${kind}: inactive arrow ${cs(arrow).color}`)
    }
    const rows = [...table.querySelectorAll('tbody tr')]
    const empty = rows.length === 1 && rows[0].children.length === 1 && rows[0].children[0].colSpan > 1
    if (empty) {
      const td = rows[0].children[0]; const s = cs(td)
      put(12, td.colSpan === ths.length && s.paddingTop === '48px' && s.paddingBottom === '48px' && s.color === T.textSoft, `colspan ${td.colSpan}/${ths.length}, padding ${s.paddingTop}/${s.paddingBottom}, color ${s.color}`)
      continue
    }
    if (rows.length >= 2) {
      const even = cs(rows[1].children[0])
      put(8, even.backgroundColor === T.stripe, `${kind}: row 2 td bg ${even.backgroundColor}`)
    }
    const td0 = rows[0]?.children[0]
    if (td0) {
      const s = cs(td0)
      put(9, s.transitionProperty.includes('background-color') && s.transitionDuration.startsWith('0.12s'), `${kind}: transition ${s.transitionProperty} ${s.transitionDuration}`)
    }
    rows.forEach((tr, i) => {
      const s = cs(tr.children[0])
      const last = i === rows.length - 1
      if (last) put(10, s.borderBottomStyle === 'none' || s.borderBottomWidth === '0px', `${kind}: last row border ${s.borderBottomWidth} ${s.borderBottomStyle}`)
      else put(10, s.borderBottomWidth === '1px' && s.borderBottomColor === T.divider, `${kind}: row border ${s.borderBottomWidth} ${s.borderBottomColor}`)
    })
    for (const td of table.querySelectorAll('td.sortable__num, td.sortable__date')) {
      const s = cs(td)
      put(11, s.fontVariantNumeric.includes('tabular-nums') && s.whiteSpace === 'nowrap', `${kind}: ${s.fontVariantNumeric} ${s.whiteSpace}`)
    }
    for (const m of table.querySelectorAll('.muted')) {
      const s = cs(m)
      put(13, s.color === T.textSoft && s.fontStyle === 'italic', `${kind}: muted ${s.color} ${s.fontStyle}`)
    }
  }
  for (const chip of document.querySelectorAll('.status-badge, .status-chip')) {
    const s = cs(chip); const b = cs(chip, '::before')
    put(14, b.content !== 'none' && b.backgroundColor === s.color && s.boxShadow.includes('inset') && chip.textContent.trim().length > 0, `dot ${b.content !== 'none'}, ring ${s.boxShadow}`)
    put(15, ratio(s.color, s.backgroundColor) >= 4.5, `${chip.textContent.trim()}: ${ratio(s.color, s.backgroundColor).toFixed(2)}:1`)
  }
  for (const dl of document.querySelectorAll('dl.info-list')) {
    const s = cs(dl)
    const rows = [...dl.querySelectorAll('.info-list__row')]
    put(16, s.gridTemplateColumns.startsWith('120px') && rows.every((r) => cs(r).display === 'contents'), `grid ${s.gridTemplateColumns}, rows ${[...new Set(rows.map((r) => cs(r).display))]}`)
    rows.forEach((row, i) => {
      const dt = row.querySelector('dt'); const dd = row.querySelector('dd')
      const a = cs(dt); const b = cs(dd)
      put(17, microLabel(a), `dt ${a.fontSize} ${a.textTransform} ${a.letterSpacing} ${a.color}`)
      put(18, b.fontSize === '14px' && b.color === T.text && b.fontVariantNumeric.includes('tabular-nums'), `dd ${b.fontSize} ${b.color} ${b.fontVariantNumeric}`)
      const last = i === rows.length - 1
      for (const [el, st] of [[dt, a], [dd, b]]) {
        if (last) put(19, st.borderBottomStyle === 'none' || st.borderBottomWidth === '0px', `last row ${el.tagName} border ${st.borderBottomWidth} ${st.borderBottomStyle}`)
        else put(19, st.borderBottomWidth === '1px' && st.borderBottomColor === T.divider, `${el.tagName} border ${st.borderBottomWidth} ${st.borderBottomColor}`)
      }
    })
  }
  for (const title of document.querySelectorAll('.card__title')) {
    const s = cs(title)
    put(20, s.fontSize === '13px' && s.textTransform === 'uppercase' && s.letterSpacing === '1.04px' && s.color === T.textSoft && s.borderBottomWidth === '1px' && s.borderBottomColor === T.divider && s.paddingBottom === '10px', `${s.fontSize} ${s.textTransform} ${s.letterSpacing} ${s.color} border ${s.borderBottomWidth} ${s.borderBottomColor} pb ${s.paddingBottom}`)
  }
  return out
}

const browser = await chromium.launch()
const results = []
for (const page of PAGES) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await signInAs(context, page.role)
  const p = await context.newPage()
  await p.goto(BASE_URL + page.path, { waitUntil: 'networkidle' })
  if (page.action) { await page.action(p); await p.waitForTimeout(200) }
  const rules = await p.evaluate(audit, T)
  // Rule 9, live: hover and keyboard focus inside a data row must show the hover colour.
  const firstRow = p.locator('tbody tr:has(td:not([colspan]))').first()
  if (await firstRow.count()) {
    await p.mouse.move(0, 0)
    await firstRow.hover()
    await p.waitForTimeout(200)
    const hovered = await firstRow.evaluate((tr) => getComputedStyle(tr.children[0]).backgroundColor)
    const focusable = firstRow.locator('a, button').first()
    let focused = 'no link or button in the row'
    if (await focusable.count()) {
      await p.mouse.move(0, 0)
      await focusable.focus()
      await p.waitForTimeout(200)
      focused = await firstRow.evaluate((tr) => getComputedStyle(tr.children[0]).backgroundColor)
    }
    const ok = hovered === T.hover && (focused === T.hover || focused.startsWith('no '))
    const prev = rules[9]
    rules[9] = { status: prev?.status === 'FAIL' || !ok ? 'FAIL' : 'PASS', value: `${prev ? prev.value + '; ' : ''}hover ${hovered}, focus-within ${focused}` }
  }
  results.push({ ...page, rules })
  await context.close()
}
await browser.close()

const RULES = Array.from({ length: 20 }, (_, i) => i + 1)
let fails = 0
const lines = [
  '# B.2 audit: approved table pattern, rule by rule',
  '',
  `Run ${new Date().toISOString()} with \`npm run b2audit\` (Playwright Chromium, 1280 px, computed styles) against \`npm run dev\`. Token values read from \`app/assets/css/main.css\`. N/A = the page has nothing the rule applies to. Each cell shows the result and, for the first checked element, the computed value.`,
  '',
  `| Page | ${RULES.map((r) => `R${r}`).join(' | ')} |`,
  `|---|${RULES.map(() => '---').join('|')}|`,
]
for (const r of results) {
  lines.push(`| ${r.name} (\`${r.path}\`) | ${RULES.map((n) => r.rules[n] ? r.rules[n].status : 'N/A').join(' | ')} |`)
  fails += RULES.filter((n) => r.rules[n]?.status === 'FAIL').length
}
lines.push('', '## Computed values', '')
for (const r of results) {
  lines.push(`### ${r.name}`)
  for (const n of RULES) if (r.rules[n]) lines.push(`- R${n} ${r.rules[n].status}: ${r.rules[n].value}`)
  lines.push('')
}
writeFileSync('CLAUDE/b2_audit.md', lines.join('\n'))
console.log(`pages ${results.length}, FAIL cells ${fails}`)
for (const r of results) for (const n of RULES) if (r.rules[n]?.status === 'FAIL') console.log(`FAIL ${r.name} R${n}: ${r.rules[n].value}`)
