// `npm run checklist` — runs all 67 rows of CLAUDE/test_checklist_ALL.md
// in a real browser (Playwright, Chromium) against `npm run dev`, and
// writes CLAUDE/test_checklist_ALL_cli_results.md (the original file is
// not changed). Every row starts in a new browser context, signs in through
// the login form, presses "Reset demo data" (and confirms), and signs in
// again, so it starts from the seed data. Rows 19, 20, 24, 49, 65, 66 and
// 67 read the reports written by `npm run mobile`, `npm run keys`
// (Chromium, Firefox, WebKit), `npm run aria` and the print check.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { chromium } from 'playwright'

const B = process.argv[2] ?? 'http://localhost:3000'
const ONLY = process.argv[3] ? process.argv[3].split(',').map(Number) : null
const USERS = {
  maria: ['maria.santos@example.com', 'StrongPass123', '/client/requests'],
  rosa: ['rosa.garcia@example.com', 'CleanBest2024', '/cleaner/marketplace'],
  liza: ['liza.fernandez@example.com', 'Sparkle2026', '/cleaner/marketplace'],
  ana: ['ana.villanueva@example.com', 'TidyPro123', '/account-notice'],
  carlo: ['carlo.ramos@example.com', 'Mopping2026', null],
  main: ['admin.main@example.com', 'AdminMain2026', '/admin/jobs'],
  staff: ['admin.staff@example.com', 'AdminStaff2026', '/admin/jobs'],
}
const SCRIPT_METHOD = 'Playwright Chromium, new context, login form, Reset demo data, login again'

const browser = await chromium.launch()
const text = async (p, sel) => ((await p.locator(sel).first().textContent()) ?? '').replace(/\s+/g, ' ').trim()

async function logIn(p, who) {
  const [email, pw, home] = USERS[who]
  await p.goto(B + '/login'); await p.fill('#login-email', email); await p.fill('#login-password', pw); await p.click('button[type=submit]')
  if (home) await p.waitForURL('**' + home)
}
async function signOut(p) { await p.click('button:has-text("Sign out")'); await p.waitForURL('**/login') }

// New context → sign in → Reset demo data → sign in again (seed state).
let currentPage = null
async function start(who = 'maria', options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, ...options })
  const p = await context.newPage()
  currentPage = p
  p.errors = []
  p.on('pageerror', (e) => p.errors.push(e.message))
  p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()) })
  await logIn(p, 'maria')
  await p.click('button:has-text("Reset demo data")'); await p.click('button:has-text("Yes, reset")'); await p.waitForURL('**/login')
  if (who) await logIn(p, who)
  return { context, p }
}

const ROWS = {
  1: async () => { const { context, p } = await start(null); await logIn(p, 'maria'); const r = [new URL(p.url()).pathname, await text(p, 'h1')]; await context.close(); return [r[0] === '/client/requests' && r[1] === 'My requests', `landed on ${r[0]}, h1 "${r[1]}"`] },
  2: async () => { const { context, p } = await start(null); await p.goto(B + '/register/client'); await p.click('button[type=submit]'); const n = await p.locator('.select-field__error, .text-field__error').count(); const f = await p.evaluate(() => document.activeElement?.id); await context.close(); return [n === 6 && f === 'client-type', `${n} errors, focus on #${f}`] },
  3: async () => { const { context, p } = await start(null); await p.goto(B + '/register/cleaner'); await p.fill('#cleaner-full-name', 'Test Cleaner'); await p.fill('#cleaner-email', 'test.cleaner@example.com'); await p.fill('#cleaner-mobile', '09170001111'); await p.fill('#cleaner-password', 'TestPass99'); await p.fill('#cleaner-confirm-password', 'TestPass99'); await p.click('button[type=submit]'); await p.waitForURL('**/cleaner/marketplace'); const n = await text(p, '.message--info strong'); await context.close(); return [n === 'Your account is waiting for approval.', `on /cleaner/marketplace, notice "${n}"`] },
  4: async () => { const { context, p } = await start(null); await logIn(p, 'main'); const r = [new URL(p.url()).pathname, await text(p, '.shell__role')]; await context.close(); return [r[0] === '/admin/jobs' && r[1] === 'Main admin', `landed on ${r[0]}, label "${r[1]}"`] },
  5: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/req-001'); await signOut(p); await p.goBack(); await p.waitForTimeout(500); const r = [new URL(p.url()).pathname, await text(p, 'h1')]; await context.close(); return [r[0] === '/login', `after Back: ${r[0]}, h1 "${r[1]}"`] },
  6: async () => { const { context, p } = await start('liza'); await p.goto(B + '/cleaner/documents'); await p.setInputFiles('#doc-bir', { name: 'bir.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') }); const m = await text(p, '#doc-bir-msg'); await context.close(); return [m === 'The file must be a PDF, JPG or PNG.', `"${m}"`] },
  7: async () => { const { context, p } = await start('liza'); await p.goto(B + '/cleaner/documents'); await p.setInputFiles('#doc-bir', { name: 'bir-form.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(200_000, 1) }); const m = await text(p, '#doc-bir-msg'); const card = await text(p, 'li.doc:has(#doc-bir)'); await context.close(); return [m === 'bir-form.pdf submitted for review.' && card.includes('Submitted') && card.includes('bir-form.pdf'), `"${m}"; card shows Submitted and the file name: ${card.includes('Submitted') && card.includes('bir-form.pdf')}`] },
  8: async () => { const { context, p } = await start('liza'); await p.goto(B + '/cleaner/documents'); await p.setInputFiles('#doc-bir', { name: 'big.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 1) }); const m = await text(p, '#doc-bir-msg'); await context.close(); return [m === 'The file must be 5 MB or smaller.', `"${m}"`] },
  9: async () => { const { context, p } = await start('liza'); await p.goto(B + '/cleaner/jobs/job-005'); const b = p.locator('button:has-text("Apply to this job")'); const d = await b.isDisabled(); const why = await text(p, '#apply-why'); await context.close(); return [d && why.includes('approved'), `disabled ${d}, reason "${why}"`] },
  10: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/accounts/liza.fernandez%40example.com'); await p.click('button:has-text("Approve cleaner")'); await p.click('button:has-text("Yes, approve")'); const m = await text(p, '.message'); await context.close(); return [m.startsWith('All six documents must be approved'), `"${m}"`] },
  11: async () => {
    const { context, p } = await start('liza'); await p.goto(B + '/cleaner/documents')
    for (const id of ['doc-bir', 'doc-medical-certificate']) { await p.setInputFiles('#' + id, { name: `${id}.pdf`, mimeType: 'application/pdf', buffer: Buffer.alloc(1000, 1) }); await p.waitForSelector(`#${id}-msg`) }
    await signOut(p); await logIn(p, 'staff'); await p.goto(B + '/admin/accounts/liza.fernandez%40example.com')
    await p.waitForSelector('#docs-title') // the page renders in the browser; wait before counting buttons
    // Approving re-sorts the table, so always click the first remaining button.
    const approve = p.locator('button[aria-label^="Approve "]')
    for (let i = 0; i < 6 && (await approve.count()); i++) await approve.first().click()
    const docs = await text(p, '#docs-title')
    await p.click('button:has-text("Approve cleaner")'); await p.click('button:has-text("Yes, approve")'); const m = await text(p, '.message')
    await signOut(p); await logIn(p, 'liza'); await p.goto(B + '/cleaner/jobs/job-005'); await p.click('button:has-text("Apply to this job")'); const a = await text(p, '.message')
    await context.close(); return [docs.includes('6 of 6') && m.startsWith('Cleaner approved') && a.startsWith('Application sent'), `"${docs}"; "${m}"; Liza applies: "${a}"`]
  },
  12: async () => { const { context, p } = await start('main'); await p.goto(B + '/admin/accounts/new'); await p.fill('#admin-name', 'Bea Lim'); await p.fill('#admin-email', 'bea.lim@example.com'); await p.fill('#admin-mobile', '09170000009'); await p.fill('#admin-password', 'AdminNew2026'); await p.fill('#admin-confirm', 'AdminNew2026'); await p.click('button:has-text("Create admin account")'); const m = await text(p, '.message'); await signOut(p); await p.fill('#login-email', 'bea.lim@example.com'); await p.fill('#login-password', 'AdminNew2026'); await p.click('button[type=submit]'); await p.waitForURL('**/admin/jobs'); const role = await text(p, '.shell__role'); await context.close(); return [m.startsWith('Admin account created') && role === 'Admin', `"${m}"; Bea logs in, label "${role}"`] },
  13: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/accounts/new'); const t = await text(p, '.card strong'); const forms = await p.locator('form').count(); await context.close(); return [t === 'Only the main admin can create admin accounts.' && forms === 0, `"${t}", forms on page: ${forms}`] },
  14: async () => { const { context, p } = await start(null); await logIn(p, 'carlo'); await p.waitForSelector('.login-form__error'); const m = await text(p, '.login-form__error'); await context.close(); return [m.includes('suspended'), `"${m}"`] },
  15: async () => { const { context, p } = await start(null); await logIn(p, 'ana'); const h = await text(p, 'h1'); await p.goto(B + '/cleaner/marketplace'); await p.waitForURL('**/account-notice'); await context.close(); return [h === 'Your account is deactivated', `h1 "${h}"; /cleaner/marketplace sends back to /account-notice`] },
  16: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/accounts'); await p.click('button[aria-label="Suspend Rosa Garcia"]'); await p.click('button:has-text("Yes, suspend")'); const badge = await text(p, 'tr:has-text("Rosa Garcia") .status-badge >> nth=1'); await signOut(p); await p.fill('#login-email', USERS.rosa[0]); await p.fill('#login-password', USERS.rosa[1]); await p.click('button[type=submit]'); await p.waitForSelector('.login-form__error'); const m = await text(p, '.login-form__error'); await context.close(); return [badge === 'Suspended' && m.includes('suspended'), `badge "${badge}"; Rosa's login: "${m}"`] },
  17: async () => { const { context, p } = await start('main'); const found = []; for (const path of ['/admin/accounts', '/admin/accounts/rosa.garcia%40example.com', '/admin/jobs', '/admin/jobs/job-001', '/admin/requests', '/admin/disputes/dsp-001']) { await p.goto(B + path); await p.waitForSelector('h1'); const n = await p.locator('button, a').filter({ hasText: /delete|remove/i }).count(); if (n) found.push(`${path}: ${n}`) } await context.close(); return [found.length === 0, found.length ? found.join('; ') : 'no Delete / Remove button or link on 6 admin pages'] },
  18: async () => { const { context, p } = await start('maria'); await p.goto(B + '/admin/jobs'); await p.waitForURL(/notice=no-access/); const m = await text(p, '.message--info'); const path = new URL(p.url()).pathname; await context.close(); return [path === '/client/requests' && m.startsWith('You do not have access'), `${path}: "${m}"`] },
  19: async () => reportRow('mobile-menu'),
  20: async () => reportRow('skip'),
  21: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/calendar'); await p.waitForSelector('#calendar-title'); const a = await text(p, '#calendar-title'); const la = await p.locator('.calendar__list tbody tr:has(td:not([colspan]))').count(); await p.click('button:has-text("Next month")'); const b = await text(p, '#calendar-title'); await p.click('button:has-text("Previous month")'); await p.click('button:has-text("Previous month")'); const c = await text(p, '#calendar-title'); await context.close(); return [a === 'October 2026' && b === 'November 2026' && c === 'September 2026' && la === 2, `${a} (${la} events listed) → Next ${b} → Previous twice ${c}`] },
  22: async () => { const { context, p } = await start('rosa'); await p.goto(B + '/cleaner/calendar'); await p.waitForSelector('#calendar-title'); const c = await p.locator('.calendar__list tbody tr:has(td:not([colspan]))').count(); await signOut(p); await logIn(p, 'staff'); await p.goto(B + '/admin/calendar'); await p.waitForSelector('#calendar-title'); const a = await p.locator('.calendar__list tbody tr:has(td:not([colspan]))').count(); await context.close(); return [c === 3 && a === 7, `cleaner Rosa, October 2026: ${c} events (applied + accepted); admin: ${a} live job posts in October 2026`] },
  23: async () => {
    const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs'); const bad = []
    for (const b of await p.locator('th .sortable__sort').all()) {
      const th = b.locator('xpath=..'); const label = (await b.textContent()).replace(/[↕▲▼]/g, '').trim()
      await b.click(); const s1 = await th.getAttribute('aria-sort'); const u1 = await th.evaluate((el) => getComputedStyle(el, '::after').height)
      await b.click(); const s2 = await th.getAttribute('aria-sort')
      if (!(s1 === 'ascending' && s2 === 'descending' && u1 === '2px')) bad.push(`${label}: ${s1}/${s2}/${u1}`)
    }
    await context.close(); return [bad.length === 0, bad.length ? bad.join('; ') : 'all 6 columns of /admin/jobs: first click ascending, second descending; 2px underline under the sorted column']
  },
  24: async () => {
    const { context, p } = await start('staff', { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }); await p.goto(B + '/admin/jobs'); await p.waitForSelector('tbody tr')
    const m = await p.evaluate(() => { const s = document.querySelector('.sortable__scroll'); const before = s.scrollLeft; s.scrollLeft = 200; return { tableScrolls: s.scrollWidth > s.clientWidth, moved: s.scrollLeft > before, page: document.documentElement.scrollWidth > document.documentElement.clientWidth } })
    await context.close(); const mob = reportRow('mobile-sideways')
    return [m.tableScrolls && m.moved && !m.page && mob[0], `375 px: table scrolls inside its card (${m.tableScrolls}, scrolled ${m.moved}), page sideways ${m.page}; ${mob[1]}`]
  },
  25: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/new'); await p.click('button:has-text("Send request")'); const n = await p.locator('.field__error, .text-field__error').count(); const f = await p.evaluate(() => document.activeElement?.id); await context.close(); return [n === 8 && f === 'request-title', `${n} errors, focus on #${f}`] },
  26: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/new'); await p.fill('#request-start', '08:00'); await p.fill('#request-end', '10:30'); const d = await text(p, '#request-duration'); await context.close(); return [d === 'Duration: 2.5 hours', `"${d}"`] },
  27: async () => {
    const { context, p } = await start('maria'); await p.goto(B + '/client/requests/new')
    await p.fill('#request-title', 'Garage clean'); await p.fill('#request-description', 'Sweep and organise the garage.'); await p.fill('#request-date', '2026-12-05'); await p.fill('#request-start', '08:00'); await p.fill('#request-end', '10:30'); await p.fill('#request-barangay', 'Kapitolyo'); await p.fill('#request-city', 'Pasig City'); await p.fill('#request-rate', '450')
    await p.waitForSelector('.leaflet-container'); await p.click('.leaflet-container', { position: { x: 300, y: 160 } }); const pin = await text(p, '.picker__current strong')
    await p.click('button:has-text("Send request")'); await p.waitForURL(/created=1/); const m = await text(p, '.message'); const row = await text(p, 'tr:has-text("Garage clean")')
    await context.close(); return [m.startsWith('Request sent') && row.includes('Pending') && pin.startsWith('Map pin near'), `pin "${pin}"; "${m}"; new row: ${row.slice(0, 80)}`]
  },
  28: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/req-005'); await p.click('text=Edit request'); await p.fill('#request-rate', '700'); await p.click('button:has-text("Save changes")'); const m = await text(p, '.message'); const r = await text(p, '.info-list__row:has(dt:has-text("Proposed rate")) dd'); await context.close(); return [m === 'Changes saved.' && r === '₱700', `"${m}"; rate ${r}`] },
  29: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/req-001'); await p.waitForSelector('h1'); const n = await p.locator('button:has-text("Edit request")').count(); await context.close(); return [n === 0, `Edit request buttons: ${n}`] },
  30: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/req-005'); await p.click('button:has-text("Cancel request")'); await p.click('button:has-text("Yes, cancel request")'); const s = await text(p, '.status-badge'); await context.close(); return [s === 'Cancelled', `status "${s}"`] },
  31: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/req-004'); await p.click('button:has-text("Cancel request")'); await p.click('button:has-text("Yes, cancel request")'); const s = await text(p, '.status-badge'); await signOut(p); await logIn(p, 'staff'); await p.goto(B + '/admin/jobs/job-007'); const a = await text(p, '.detail-page__archived-note'); await context.close(); return [s === 'Cancelled' && a.startsWith('This job was archived'), `status "${s}"; admin job-007: "${a}"`] },
  32: async () => { const { context, p } = await start('maria'); await p.goto(B + '/client/requests/req-001'); await p.click('button:has-text("Cancel request")'); await p.click('button:has-text("Yes, cancel request")'); const m = await text(p, '.message'); await context.close(); return [m.startsWith('A cleaner is already assigned'), `"${m}"`] },
  33: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/requests'); await p.click('button[aria-label="Approve Kitchen and living room clean"]'); const panel = await text(p, '[role=alertdialog]'); await p.click('button:has-text("Yes, approve and publish")'); const m = await text(p, '.message'); const link = await p.locator('.message a:has-text("Open the job post")').count(); await context.close(); return [panel.includes('Kapitolyo, Pasig City') && panel.includes('₱520') && m.startsWith('Approved') && link === 1, `confirm shows place and rate: ${panel.includes('Kapitolyo, Pasig City') && panel.includes('₱520')}; "${m}"`] },
  34: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/requests'); await p.click('button[aria-label="Reject Conference room clean after event"]'); await p.click('button:has-text("Yes, reject")'); const s = await text(p, 'tr:has-text("Conference room clean after event") .status-badge'); await context.close(); return [s === 'Rejected', `status "${s}"`] },
  35: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/requests'); await p.click('button[aria-label="Approve Kitchen and living room clean"]'); await p.click('button:has-text("Yes, approve and publish")'); await p.click('text=Open the job post'); await p.waitForURL(/job-011/); const h = await text(p, 'h1'); const rate = await text(p, '.info-list__row:has(dt:has-text("Rate")) dd'); const req = await text(p, '.info-list__row:has(dt:has-text("Request")) dd'); await context.close(); return [h === 'Kitchen and living room clean' && rate === '₱520' && req === 'req-005', `/admin/jobs/job-011: h1 "${h}", rate ${rate}, request ${req}`] },
  36: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/accounts'); await p.selectOption('#accounts-role', 'cleaner'); await p.fill('#accounts-search', 'rosa'); const n = await p.locator('tbody tr').count(); const t = await text(p, 'tbody tr'); await context.close(); return [n === 1 && t.includes('Rosa Garcia'), `${n} row: ${t.slice(0, 50)}`] },
  37: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/bookings'); await p.click('a[aria-label="Open a dispute on Office cleaning"]'); await p.waitForSelector('#dispute-form'); const pre = await p.inputValue('#dispute-job'); await p.fill('#dispute-title', 'Broken vase'); await p.fill('#dispute-description', 'Client reports a broken vase.'); await p.fill('#dispute-party-name', 'Lim Trading Corp.'); await p.click('button:has-text("Open dispute")'); const m = await text(p, '.message'); await context.close(); return [pre === 'job-001' && m.startsWith('Dispute opened'), `booking preselected ${pre}; "${m}"`] },
  38: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/disputes/dsp-001'); await p.fill('#note-text', 'Checked the schedule.'); await p.click('button:has-text("Add note")'); const n = await text(p, '#notes-title'); await p.click('button:has-text("Mark as resolved")'); await p.click('button:has-text("Yes, resolve")'); const s = await text(p, '.status-badge'); await context.close(); return [n === 'Notes (2)' && s === 'Resolved', `"${n}", status "${s}"`] },
  39: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/bookings'); await p.waitForSelector('tbody tr'); const n = await p.locator('tbody tr').count(); await context.close(); return [n === 4, `${n} bookings`] },
  40: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs/job-001'); await p.click('button:has-text("Archive job")'); await p.click('button:has-text("Yes, archive")'); await p.waitForURL(/\/admin\/jobs$/); const without = await p.locator('tbody tr:has-text("Office cleaning")').count(); await p.check('text=Show archived'); const withA = await text(p, 'tbody tr:has-text("Office cleaning")'); await context.close(); return [without === 0 && withA.includes('Archived'), `hidden (${without} rows) until Show archived; then "${withA.slice(0, 40)}"`] },
  41: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs/job-006'); await p.click('button:has-text("Restore job")'); const m = await text(p, '.detail-page__message'); await context.close(); return [m.startsWith('Job restored'), `"${m}"`] },
  42: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs/job-005'); await p.click('button[aria-label="Assign Pedro Mendoza"]'); await p.click('button:has-text("Yes, assign")'); const c = await text(p, '.cleaner__name'); const s = await text(p, 'tbody tr:has-text("Pedro Mendoza") >> .status-badge >> nth=2'); await context.close(); return [c === 'Pedro Mendoza' && s === 'Accepted', `assigned "${c}", application "${s}"`] },
  43: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs/job-005'); await p.click('button[aria-label="Assign Pedro Mendoza"]'); await p.click('button:has-text("Yes, assign")'); await p.click('button:has-text("Unassign cleaner")'); await p.click('button:has-text("Yes, unassign")'); const n = await text(p, '.cleaner__none'); const s = await text(p, 'tbody tr:has-text("Pedro Mendoza") >> .status-badge >> nth=2'); await context.close(); return [n.startsWith('Not assigned') && s === 'Applied', `"${n}"; application "${s}"`] },
  44: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs/job-001'); const tel = await p.getAttribute('a[href^="tel:"]', 'href'); await p.click('text=View cleaner profile'); await p.waitForURL(/accounts\/rosa/); const h = await text(p, 'h1'); await context.close(); return [tel === 'tel:09204567890' && h === 'Rosa Garcia', `phone link ${tel}; profile h1 "${h}"`] },
  45: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs/job-001'); await p.selectOption('select[id^=status-select]', 'completed'); const chip = await text(p, '.detail-page__title-row .status-chip'); const cur = await text(p, '.status-list__row[aria-current=step]'); await context.close(); return [chip === 'Completed' && cur === 'Completed', `chip "${chip}", current row "${cur}"`] },
  46: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/reports'); await p.waitForSelector('.stat'); const meta = await text(p, '.report-meta strong'); const c = await p.locator('.stat').count(); const h = await p.locator('.highlights li').count(); const ch = await p.locator('svg[role=img]').count(); await context.close(); return [meta === 'Period: October 2026' && c === 9 && h >= 4 && ch === 5, `"${meta}", ${c} cards, ${h} highlights, ${ch} charts`] },
  47: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/reports'); await p.selectOption('#report-kind', 'yearly'); const meta = await text(p, '.report-meta'); const first = await text(p, '.stat'); await context.close(); return [meta.includes('Period: 2026') && meta.includes('compared with 2025'), `"${meta.slice(0, 70)}"; first card "${first}"`] },
  48: async () => {
    const { context, p } = await start('staff'); await p.goto(B + '/admin/reports'); const out = []
    for (const tab of ['admin', 'cleaners', 'clients']) {
      await p.click(`#tab-${tab}`); const dl = p.waitForEvent('download'); await p.click('button:has-text("Download CSV")'); const f = await dl
      const csv = readFileSync(await f.path(), 'utf8'); out.push(`${f.suggestedFilename()}: ${csv.split('\r\n').length} lines, header "${csv.split('\r\n')[0].slice(0, 40)}"`)
    }
    await context.close(); return [out.length === 3 && out.every((o) => !o.includes(': 1 lines')), out.join('; ') + ' (opening in a spreadsheet app: LIMIT, file content parsed instead)']
  },
  49: async () => reportRow('print'),
  50: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/reports'); await p.focus('#tab-admin'); await p.keyboard.press('ArrowRight'); const f1 = await p.evaluate(() => document.activeElement?.id); const r1 = await p.locator('#panel-cleaners tbody tr').count(); await p.keyboard.press('ArrowRight'); const r2 = await p.locator('#panel-clients tbody tr').count(); await context.close(); return [f1 === 'tab-cleaners' && r1 === 5 && r2 === 3, `ArrowRight → #${f1}: ${r1} cleaner rows; ArrowRight → clients: ${r2} rows`] },
  51: async () => {
    const { context, p } = await start('staff'); await p.goto(B + '/admin/reports'); await p.waitForSelector('.donut__legend')
    const legend = (await p.locator('.donut__legend li').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim())
    const donut = p.locator('figure:has-text("Job posts by status")'); await donut.locator('summary').click()
    const table = (await donut.locator('tbody tr').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim())
    const same = legend.every((l, i) => { const [name, rest] = l.split(':'); return table[i]?.startsWith(name) && table[i].includes(rest.trim()) })
    await context.close(); return [same, `legend [${legend.join(' | ')}] vs table [${table.join(' | ')}]`]
  },
  52: async () => { const { context, p } = await start('rosa'); await p.waitForSelector('.results-count'); const n = await text(p, '.results-count'); const d = await p.locator('.job__facts dd').allTextContents(); await context.close(); return [n.startsWith('2 ') && d[0].includes('4.4 km'), `"${n}", first card distance "${d[0]}"`] },
  53: async () => { const { context, p } = await start('rosa'); await p.fill('#f-radius', '50'); const n = await text(p, '.results-count'); await context.close(); return [n.startsWith('2 '), `"${n}"`] },
  54: async () => { const { context, p } = await start('rosa'); await p.fill('#f-client', 'reyes'); const n = await text(p, '.results-count'); await context.close(); return [n.startsWith('1 '), `"${n}"`] },
  55: async () => { const { context, p } = await start('rosa'); await p.selectOption('#f-sort', 'rate'); const t = await text(p, '.job__title'); await p.fill('#f-client', 'x'); await p.click('button:has-text("Clear all filters")'); const v = [await p.inputValue('#f-client'), await p.inputValue('#f-sort'), await p.inputValue('#f-radius')]; await context.close(); return [t === 'Two-storey house general clean' && v.join() === ',nearest,25', `top by rate "${t}"; after Clear all: client "${v[0]}", sort ${v[1]}, radius ${v[2]}`] },
  56: async () => { const { context, p } = await start('rosa'); await p.goto(B + '/cleaner/location'); await p.waitForSelector('.leaflet-container'); await p.waitForTimeout(1500); const attr = await text(p, '.leaflet-control-attribution'); await p.click('.leaflet-container', { position: { x: 250, y: 150 } }); await p.click('button:has-text("Save location")'); const m = await text(p, '.message'); await context.close(); return [m.startsWith('Location saved: Map pin near') && attr.includes('OpenStreetMap'), `"${m}"; attribution "${attr}"`] },
  57: async () => { const { context, p } = await start('rosa'); await p.goto(B + '/cleaner/location'); await p.check('input[value=list]'); await p.selectOption('#cleaner-pin', 'Butuan City'); await p.click('button:has-text("Save location")'); const m = await text(p, '.message'); await p.goto(B + '/cleaner/marketplace'); await p.waitForSelector('.results-count'); const n = await text(p, '.results-count'); const t = await text(p, '.job__title'); await context.close(); return [m === 'Location saved: Butuan City.' && t === 'Apartment move-out clean', `"${m}"; marketplace now "${n}", nearest "${t}" (Butuan)`] },
  58: async () => { const { context, p } = await start('rosa'); await p.route('**/tile.openstreetmap.org/**', (r) => r.abort()); await p.goto(B + '/cleaner/location'); await p.waitForSelector('text=The map could not load', { timeout: 15000 }); const m = await text(p, '.message--info'); const list = await p.isVisible('#cleaner-pin'); await context.close(); return [list, `tiles blocked (network off for the map): "${m}"; city list shown ${list}`] },
  59: async () => { const { context, p } = await start('rosa'); await p.goto(B + '/cleaner/jobs/job-005'); await p.click('button:has-text("Apply to this job")'); const m = await text(p, '.message'); await context.close(); return [m.startsWith('Application sent'), `"${m}"`] },
  60: async () => { const { context, p } = await start('rosa'); await p.goto(B + '/cleaner/applications'); await p.click('button[aria-label="Cancel application for Café closing clean"]'); await p.click('button:has-text("Yes, cancel application")'); const s = await text(p, 'tr:has-text("Café closing clean") .status-badge'); await context.close(); return [s === 'Cancelled', `status "${s}"`] },
  61: async () => { const { context, p } = await start('rosa'); const count = async () => { await p.goto(B + '/cleaner/marketplace'); await p.waitForSelector('.results-count'); return parseInt(await text(p, '.results-count'), 10) }; const a = await count(); await p.goto(B + '/cleaner/jobs/job-005'); await p.click('button:has-text("Apply to this job")'); const b = await count(); await p.goto(B + '/cleaner/applications'); await p.click('button[aria-label="Cancel application for Barbershop deep clean"]'); await p.click('button:has-text("Yes, cancel application")'); const c = await count(); await context.close(); return [a === 2 && b === 1 && c === 2, `posts ${a} → after applying ${b} → after cancelling ${c}`] },
  62: async () => { const { context, p } = await start('rosa'); await p.waitForSelector('.job'); const card = await text(p, '.job'); const ok = ['Barbershop deep clean', '₱450', 'Reyes Barbers', 'km away', '3 hours', 'Barbershop closing-time deep clean'].every((x) => card.includes(x)); await context.close(); return [ok, `first card: ${card.slice(0, 160)}`] },
  63: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs'); await p.check('text=Show archived'); const chips = [...new Set(await p.locator('tbody .status-chip').allTextContents())].map((t) => t.trim()).sort(); await context.close(); return [chips.every((c) => ['Completed', 'In progress', 'Missed', 'Scheduled'].includes(c)), `statuses shown: ${chips.join(', ')}`] },
  64: async () => { const { context, p } = await start('staff'); await p.goto(B + '/admin/jobs/job-001'); await p.click('button:has-text("Archive job")'); await p.click('button:has-text("Yes, archive")'); await p.waitForURL(/\/admin\/jobs$/); await p.click('button:has-text("Reset demo data")'); await p.click('button:has-text("Yes, reset")'); await p.waitForURL('**/login'); const signedOut = new URL(p.url()).pathname; await logIn(p, 'staff'); const back = await p.locator('tbody tr:has-text("Office cleaning")').count(); await context.close(); return [signedOut === '/login' && back === 1, `after Reset: ${signedOut}; archived job-001 back in the list (${back} row)`] },
  65: async () => reportRow('mobile-all'),
  66: async () => reportRow('keys'),
  67: async () => reportRow('aria'),
}

// Rows answered by the dedicated scripts' reports.
function reportRow(kind) {
  const read = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null)
  const mobile = read('CLAUDE/screenshots/mobile-report.json')
  if (kind.startsWith('mobile')) {
    if (!mobile) return [false, 'mobile-report.json missing']
    const devices = [...new Set(mobile.map((m) => m.device))].join(', ')
    if (kind === 'mobile-menu') {
      const signed = mobile.filter((m) => m.menu !== 'n/a'); const ok = signed.every((m) => m.menu === 'opens')
      const keys = read('CLAUDE/screenshots/keys-report-chromium.json')?.find((e) => e.menuStates)
      return [ok && keys?.ok, `npm run mobile (${devices}, touch): Menu opens by tap on ${signed.filter((m) => m.menu === 'opens').length}/${signed.length} signed-in page loads; npm run keys: Enter/Space ${keys?.menuStates?.join(' → ')}`]
    }
    const side = mobile.filter((m) => m.sideways)
    if (kind === 'mobile-sideways') return [side.length === 0, `npm run mobile: page scrolls sideways on ${side.length}/${mobile.length} page loads`]
    const small = mobile.reduce((n, m) => n + m.tooSmall.length, 0); const fonts = mobile.reduce((n, m) => n + m.smallFonts.length, 0)
    return [side.length === 0 && small === 0 && fonts === 0, `npm run mobile (${devices}; ${mobile.length} page loads): sideways ${side.length}, tap targets under 24 px ${small}, inputs under 16 px ${fonts} (text readability: see look-and-feel notes)`]
  }
  if (kind === 'skip' || kind === 'keys') {
    const engines = ['chromium', 'firefox', 'webkit'].map((e) => [e, read(`CLAUDE/screenshots/keys-report-${e}.json`)])
    const parts = []; let ok = true
    for (const [e, r] of engines) {
      if (!r) { ok = false; parts.push(`${e}: report missing`); continue }
      const routes = r.filter((x) => x.tabStops !== undefined)
      if (kind === 'skip') { const bad = routes.filter((x) => x.skipLink); ok &&= bad.length === 0; parts.push(`${e}: skip link first and works on ${routes.filter((x) => x.skipLink === null).length} signed-in routes, ${bad.length} failures`) }
      else {
        const bad = routes.filter((x) => x.trapped || x.focusProblems.length || x.orderProblems.length || x.skipLink || (x.sortKeys && !x.sortKeys.ok) || x.confirms.some((c) => !c.ok))
        const confirms = routes.reduce((n, x) => n + x.confirms.length, 0)
        ok &&= bad.length === 0; parts.push(`${e}: ${routes.length} routes, ${routes.reduce((n, x) => n + x.tabStops, 0)} tab stops, ${confirms} confirm panels (Escape + focus return), ${bad.length} routes with problems`)
      }
    }
    return [ok, `npm run keys — ${parts.join('; ')}`]
  }
  if (kind === 'aria') {
    const r = read('CLAUDE/screenshots/aria/report.json'); if (!r) return [false, 'aria report missing']
    const n = r.reduce((s, x) => s + x.problems.length, 0)
    return [n === 0, `npm run aria: accessibility-tree snapshots of ${r.length} routes (+ open dialog) in CLAUDE/screenshots/aria/; ${n} problems (h1, heading order, landmarks, names, aria-sort / aria-current / aria-expanded, badges, dialogs, live roles). VoiceOver itself: LIMIT`]
  }
  if (kind === 'print') {
    const log = existsSync('CLAUDE/screenshots/print/print-check.txt') ? readFileSync('CLAUDE/screenshots/print/print-check.txt', 'utf8') : ''
    const ok = log.includes('"none",".filters":"none"') && log.includes('data tables open: 5') && log.includes('after print, data tables open: 0')
    return [ok, `print check (print media + PDF rendered with macOS PDFKit, pages viewed): ${log.replace(/\s+/g, ' ').trim()}`]
  }
}

const original = readFileSync('CLAUDE/test_checklist_ALL.md', 'utf8').split('\n')
const results = {}
for (const [n, fn] of Object.entries(ROWS)) {
  if (ONLY && !ONLY.includes(Number(n))) continue
  try {
    const [ok, observed] = await fn()
    const method = ['19', '20', '24', '49', '65', '66', '67'].includes(n) ? 'script reports (see text)' + (n === '24' ? ' + Playwright 375 px touch' : '') : SCRIPT_METHOD
    results[n] = { result: ok ? 'PASS' : 'FAIL', observed, method }
  } catch (e) {
    // Keep evidence of where the row stopped.
    let where = ''
    try { where = ` at ${new URL(currentPage.url()).pathname}`; await currentPage.screenshot({ path: `CLAUDE/screenshots/checklist-fail-row${n}.png`, fullPage: true }) } catch { /* page already closed */ }
    results[n] = { result: 'FAIL', observed: `error${where}: ${e.message.split('\n').slice(0, 3).join(' ')}`, method: SCRIPT_METHOD }
  }
  console.log(`${n}: ${results[n].result} — ${results[n].observed}`)
}
await browser.close()

if (!ONLY) {
  const out = original.map((line) => {
    if (line.startsWith('| # |')) return line.replace('| Browser result |', '| Browser result | CLI result |')
    if (line.startsWith('|---|')) return line + '---|'
    const m = line.match(/^\| (\d+) \|/)
    if (!m || !results[m[1]]) return line
    const r = results[m[1]]
    return line.replace(/\| \|$/, `| | **${r.result}**: ${r.observed.replace(/\|/g, '/')} (method: ${r.method}) |`)
  })
  out.splice(2, 0, `> CLI run ${new Date().toISOString()} with \`npm run checklist\` against \`npm run dev\`: ${Object.values(results).filter((r) => r.result === 'PASS').length} PASS, ${Object.values(results).filter((r) => r.result === 'FAIL').length} FAIL. The "Browser result" column is left as it was in the original.`, '')
  writeFileSync('CLAUDE/test_checklist_ALL_cli_results.md', out.join('\n'))
}
console.log(`PASS ${Object.values(results).filter((r) => r.result === 'PASS').length} / FAIL ${Object.values(results).filter((r) => r.result === 'FAIL').length}`)
