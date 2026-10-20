// `npm run flows` — browser checks of the main user flows against `npm run dev`.
// Prints one JSON line per check. Grows wave by wave (bulk build).
import { chromium } from 'playwright'
const B = 'http://localhost:3000'
const browser = await chromium.launch()
const out = []
async function fresh() { const c = await browser.newContext(); const p = await c.newPage(); const errs=[]; p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.text()) }); p.on('pageerror', e => errs.push(e.message)); return { c, p, errs } }
// 1 signed out -> /login
{ const { c, p, errs } = await fresh(); await p.goto(B + '/admin/jobs'); await p.waitForURL('**/login'); out.push(['signed-out /admin/jobs', new URL(p.url()).pathname, errs.length]); await c.close() }
// 2 admin login through the form
{ const { c, p, errs } = await fresh(); await p.goto(B + '/login'); await p.fill('#login-email', 'admin.main@example.com'); await p.fill('#login-password', 'AdminMain2026'); await p.click('button[type=submit]'); await p.waitForURL('**/admin/jobs'); const role = await p.textContent('.shell__role'); out.push(['admin login', new URL(p.url()).pathname, role, errs.length]);
  await p.reload(); await p.waitForLoadState('networkidle'); out.push(['admin reload keeps session', new URL(p.url()).pathname, errs.length]);
  await p.goto(B + '/client/requests'); await p.waitForLoadState('networkidle'); out.push(['admin -> client area', p.url().replace(B,''), await p.locator('.message--info').count(), errs.length]);
  await p.click('text=Sign out'); await p.waitForURL('**/login'); out.push(['sign out', new URL(p.url()).pathname, errs.length]); await c.close() }
// 3 client login lands on My requests
{ const { c, p, errs } = await fresh(); await p.goto(B + '/login'); await p.fill('#login-email', 'maria.santos@example.com'); await p.fill('#login-password', 'StrongPass123'); await p.click('button[type=submit]'); await p.waitForURL('**/client/requests'); out.push(['client login', new URL(p.url()).pathname, errs.length]); await c.close() }
// 4 cleaner login + menu button at phone width
{ const c = await browser.newContext({ viewport: { width: 375, height: 800 } }); const p = await c.newPage(); await p.goto(B + '/login'); await p.fill('#login-email', 'rosa.garcia@example.com'); await p.fill('#login-password', 'CleanBest2024'); await p.click('button[type=submit]'); await p.waitForURL('**/cleaner/marketplace'); const before = await p.getAttribute('.shell__menu-button', 'aria-expanded'); const navVisBefore = await p.isVisible('.shell__nav'); await p.click('.shell__menu-button'); const after = await p.getAttribute('.shell__menu-button', 'aria-expanded'); const navVisAfter = await p.isVisible('.shell__nav'); out.push(['cleaner phone menu', new URL(p.url()).pathname, before, navVisBefore, after, navVisAfter]); await c.close() }
// 5 skip link is first tab stop
{ const { c, p } = await fresh(); await p.goto(B + '/login'); await p.fill('#login-email', 'admin.main@example.com'); await p.fill('#login-password', 'AdminMain2026'); await p.click('button[type=submit]'); await p.waitForURL('**/admin/jobs'); await p.keyboard.press('Tab'); out.push(['first tab stop', await p.evaluate(() => document.activeElement?.textContent?.trim())]); await p.keyboard.press('Enter'); out.push(['after skip, focus id', await p.evaluate(() => document.activeElement?.id)]); await c.close() }
// 6 wrong password and suspended (via storage edit)
{ const { c, p } = await fresh(); await p.goto(B + '/login'); await p.fill('#login-email', 'admin.main@example.com'); await p.fill('#login-password', 'nope'); await p.click('button[type=submit]'); out.push(['wrong password', await p.textContent('.login-form__error')]); await c.close() }
for (const row of out) console.log(JSON.stringify(row))
await browser.close()

// Wave 1.6 — admin jobs table sorts with header buttons and aria-sort.
{
  const browser2 = await chromium.launch()
  const c = await browser2.newContext(); const p = await c.newPage(); const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  await p.goto(B + '/login'); await p.fill('#login-email', 'admin.main@example.com'); await p.fill('#login-password', 'AdminMain2026'); await p.click('button[type=submit]'); await p.waitForURL('**/admin/jobs')
  const firstBefore = await p.locator('tbody tr').first().locator('td').first().innerText()
  await p.click('th >> text=Job')
  const ariaAfter = await p.getAttribute('th:has-text("Job")', 'aria-sort')
  const firstAfter = await p.locator('tbody tr').first().locator('td').first().innerText()
  await p.click('th >> text=Job')
  const ariaAfter2 = await p.getAttribute('th:has-text("Job")', 'aria-sort')
  const rowsNoArchived = await p.locator('tbody tr').count()
  await p.check('text=Show archived')
  const rowsWithArchived = await p.locator('tbody tr').count()
  console.log(JSON.stringify(['admin jobs sort', firstBefore, ariaAfter, firstAfter, ariaAfter2, rowsNoArchived, rowsWithArchived, errs.length]))
  await browser2.close()
}

// Wave 1.4 — deactivated users see only the notice; suspended users are signed out.
{
  const browser3 = await chromium.launch()
  const c = await browser3.newContext(); const p = await c.newPage()
  await p.goto(B + '/login'); await p.fill('#login-email', 'rosa.garcia@example.com'); await p.fill('#login-password', 'CleanBest2024'); await p.click('button[type=submit]'); await p.waitForURL('**/cleaner/marketplace')
  const setState = (state) => p.evaluate((s) => {
    const saved = JSON.parse(localStorage.getItem('cleanlinis:currentUser'))
    saved.users.find((u) => u.email === 'rosa.garcia@example.com').accountState = s
    localStorage.setItem('cleanlinis:currentUser', JSON.stringify(saved))
  }, state)
  await setState('deactivated'); await p.goto(B + '/cleaner/marketplace'); await p.waitForURL('**/account-notice')
  console.log(JSON.stringify(['deactivated user', new URL(p.url()).pathname, await p.textContent('h1')]))
  await setState('suspended'); await p.goto(B + '/cleaner/marketplace'); await p.waitForURL('**/login')
  console.log(JSON.stringify(['suspended user with session', new URL(p.url()).pathname, await p.evaluate(() => localStorage.getItem('cleanlinis:session'))]))
  await p.fill('#login-email', 'rosa.garcia@example.com'); await p.fill('#login-password', 'CleanBest2024'); await p.click('button[type=submit]')
  await p.waitForSelector('.login-form__error')
  console.log(JSON.stringify(['suspended login', await p.textContent('.login-form__error')]))
  await browser3.close()
}

// Wave 3 — client: validation + focus, create, edit, cancel, calendar.
{
  const b = await chromium.launch()
  const c = await b.newContext(); const p = await c.newPage(); const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(B + '/login'); await p.fill('#login-email', 'maria.santos@example.com'); await p.fill('#login-password', 'StrongPass123'); await p.click('button[type=submit]'); await p.waitForURL('**/client/requests')
  const before = await p.locator('tbody tr').count()
  await p.click('text=New request'); await p.waitForURL('**/client/requests/new')
  const current = await p.getAttribute('a[aria-current=page]', 'href')
  await p.click('button:has-text("Send request")')
  const focused = await p.evaluate(() => document.activeElement?.id)
  const errorCount = await p.locator('.field__error, .text-field__error').count()
  await p.fill('#request-title', 'Garage clean'); await p.fill('#request-description', 'Sweep and organise the garage.')
  await p.fill('#request-date', '2026-12-05'); await p.fill('#request-start', '08:00'); await p.fill('#request-end', '10:30')
  const duration = await p.textContent('#request-duration strong')
  await p.fill('#request-barangay', 'Kapitolyo'); await p.fill('#request-city', 'Pasig City'); await p.selectOption('#request-pin', 'Pasig City'); await p.fill('#request-rate', '450')
  await p.click('button:has-text("Send request")'); await p.waitForURL(/created=1/)
  const after = await p.locator('tbody tr').count()
  console.log(JSON.stringify(['client new request', current, focused, errorCount, duration, before, after]))
  await p.click('a:has-text("Garage clean")'); await p.waitForURL(/req-\d+/)
  await p.click('text=Edit request'); await p.fill('#request-rate', '500'); await p.click('button:has-text("Save changes")')
  const saved = await p.textContent('.message'); const rate = await p.textContent('.info-list__row:has(dt:has-text("Proposed rate")) dd')
  await p.click('button:has-text("Cancel request")')
  const dialogFocused = await p.evaluate(() => document.activeElement?.getAttribute('role'))
  await p.click('button:has-text("Yes, cancel request")')
  const status = await p.textContent('.status-badge')
  console.log(JSON.stringify(['client edit + cancel', saved?.trim(), rate?.trim(), dialogFocused, status?.trim()]))
  await p.goto(B + '/client/requests/req-001'); await p.click('button:has-text("Cancel request")'); await p.click('button:has-text("Yes, cancel request")')
  console.log(JSON.stringify(['client cancel blocked (cleaner assigned)', (await p.textContent('.message'))?.trim()]))
  await p.goto(B + '/client/calendar'); await p.waitForSelector('#calendar-title')
  const month = await p.textContent('#calendar-title'); const listItems = await p.locator('.calendar__list-item').count()
  await p.click('button:has-text("Next month")'); const next = await p.textContent('#calendar-title'); const nextItems = await p.locator('.calendar__list-item').count()
  console.log(JSON.stringify(['client calendar', month, listItems, next, nextItems, errs.length, errs.slice(0, 3)]))
  await b.close()
}

// Wave 4 — admin: approve request, assign / unassign, accounts, documents, create admin, disputes, bookings, calendar.
{
  const b = await chromium.launch()
  const c = await b.newContext(); const p = await c.newPage(); const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(e.message))
  const login = async (email, pw, home) => { await p.goto(B + '/login'); await p.fill('#login-email', email); await p.fill('#login-password', pw); await p.click('button[type=submit]'); await p.waitForURL('**' + home) }
  await login('admin.main@example.com', 'AdminMain2026', '/admin/jobs')
  const navLinks = await p.locator('nav[aria-label=Main] a').allTextContents()
  console.log(JSON.stringify(['admin nav', navLinks.map((t) => t.trim())]))

  await p.goto(B + '/admin/requests'); await p.click('button[aria-label="Approve Kitchen and living room clean"]')
  const panelFocus = await p.evaluate(() => document.activeElement?.getAttribute('role'))
  await p.click('button:has-text("Yes, approve and publish")')
  const approveMsg = (await p.textContent('.message'))?.trim()
  await p.click('text=Open the job post'); await p.waitForURL(/\/admin\/jobs\/job-0\d\d/)
  console.log(JSON.stringify(['admin approve request', panelFocus, approveMsg, new URL(p.url()).pathname, await p.textContent('h1')]))

  await p.goto(B + '/admin/jobs/job-005'); await p.click('button[aria-label="Assign Pedro Mendoza"]'); await p.click('button:has-text("Yes, assign")')
  const assigned = (await p.textContent('.cleaner__name'))?.trim(); const assignMsg = (await p.textContent('.message'))?.trim()
  await p.click('button:has-text("Unassign cleaner")'); await p.click('button:has-text("Yes, unassign")')
  const afterUnassign = (await p.textContent('.cleaner__none'))?.trim()
  console.log(JSON.stringify(['admin assign + unassign', assigned, assignMsg, afterUnassign]))

  await p.goto(B + '/admin/accounts'); await p.waitForSelector('tbody tr'); const rowsAll = await p.locator('tbody tr').count()
  await p.selectOption('#accounts-role', 'cleaner'); const rowsCleaners = await p.locator('tbody tr').count()
  await p.click('button[aria-label="Suspend Rosa Garcia"]'); await p.click('button:has-text("Yes, suspend")')
  const suspendMsg = (await p.textContent('.message'))?.trim()
  await p.click('button[aria-label="Activate Rosa Garcia"]'); await p.click('button:has-text("Yes, activate")')
  console.log(JSON.stringify(['admin accounts', rowsAll, rowsCleaners, suspendMsg, (await p.textContent('.message'))?.trim()]))

  await p.goto(B + '/admin/accounts/liza.fernandez%40example.com')
  await p.click('button:has-text("Approve cleaner")'); await p.click('button:has-text("Yes, approve")')
  const blocked = (await p.textContent('.message'))?.trim()
  await p.click('button[aria-label="Approve Birth certificate"]'); const docMsg = (await p.textContent('.message'))?.trim()
  const docsTitle = (await p.textContent('#docs-title'))?.trim()
  console.log(JSON.stringify(['admin documents', blocked, docMsg, docsTitle]))

  await p.goto(B + '/admin/accounts/new'); await p.click('button:has-text("Create admin account")')
  const firstErr = await p.evaluate(() => document.activeElement?.id)
  await p.fill('#admin-name', 'Bea Lim'); await p.fill('#admin-email', 'bea.lim@example.com'); await p.fill('#admin-mobile', '09170000009'); await p.fill('#admin-password', 'AdminNew2026'); await p.fill('#admin-confirm', 'AdminNew2026')
  await p.click('button:has-text("Create admin account")')
  console.log(JSON.stringify(['main admin creates admin', firstErr, (await p.textContent('.message'))?.trim()]))

  await p.goto(B + '/admin/bookings'); await p.waitForSelector('tbody tr'); const bookingRows = await p.locator('tbody tr').count()
  await p.click('a[aria-label="Open a dispute on Office cleaning"]'); await p.waitForSelector('#dispute-form')
  const pre = await p.inputValue('#dispute-job')
  await p.fill('#dispute-title', 'Broken vase'); await p.fill('#dispute-description', 'Client reports a broken vase.'); await p.fill('#dispute-party-name', 'Lim Trading Corp.')
  await p.click('button:has-text("Open dispute")'); await p.click('text=Open it to add notes'); await p.waitForURL(/dsp-\d+/)
  await p.fill('#note-text', 'Asked the cleaner for her side.'); await p.click('button:has-text("Add note")')
  const notes = (await p.textContent('#notes-title'))?.trim()
  await p.click('button:has-text("Mark as resolved")'); await p.click('button:has-text("Yes, resolve")')
  console.log(JSON.stringify(['admin disputes', bookingRows, pre, notes, (await p.textContent('.status-badge'))?.trim()]))

  await p.goto(B + '/admin/calendar'); await p.waitForSelector('#calendar-title')
  console.log(JSON.stringify(['admin calendar', await p.textContent('#calendar-title'), await p.locator('.calendar__list-item').count()]))

  await p.click('text=Sign out'); await login('admin.staff@example.com', 'AdminStaff2026', '/admin/jobs')
  await p.goto(B + '/admin/accounts/new')
  console.log(JSON.stringify(['regular admin create admin', (await p.textContent('.card strong'))?.trim(), errs.length, errs.slice(0, 3)]))
  await b.close()
}

// Wave 5 — reports: figures, period change, tabs by keyboard, CSV download.
{
  const b = await chromium.launch()
  const c = await b.newContext({ acceptDownloads: true }); const p = await c.newPage(); const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(B + '/login'); await p.fill('#login-email', 'admin.staff@example.com'); await p.fill('#login-password', 'AdminStaff2026'); await p.click('button[type=submit]'); await p.waitForURL('**/admin/jobs')
  await p.goto(B + '/admin/reports'); await p.waitForSelector('.stat')
  const meta = (await p.textContent('.report-meta'))?.replace(/\s+/g, ' ').trim()
  const firstCard = (await p.locator('.stat').first().innerText()).replace(/\n/g, ' | ')
  const highlights = await p.locator('.highlights li').allTextContents()
  const charts = await p.locator('svg[role=img]').count()
  await p.selectOption('#report-kind', 'yearly'); const yearly = (await p.locator('.stat').first().innerText()).replace(/\n/g, ' | ')
  const download = p.waitForEvent('download'); await p.click('button:has-text("Download CSV")'); const file = await download
  const csvPath = await file.path(); const { readFileSync } = await import('node:fs'); const csvFirstLine = readFileSync(csvPath, 'utf8').split('\r\n')[0]
  await p.focus('#tab-admin'); await p.keyboard.press('ArrowRight')
  const focusedTab = await p.evaluate(() => document.activeElement?.id); const cleanerRows = await p.locator('#panel-cleaners tbody tr').count()
  await p.keyboard.press('ArrowRight'); const clientRows = await p.locator('#panel-clients tbody tr').count()
  console.log(JSON.stringify(['reports', meta, firstCard, highlights, charts, yearly, file.suggestedFilename(), csvFirstLine, focusedTab, cleanerRows, clientRows, errs.length, errs.slice(0, 3)]))
  await b.close()
}

// Wave 5.4 — print stylesheet: only the report prints (checked with print media emulation + a PDF).
{
  const b = await chromium.launch()
  const p = await (await b.newContext()).newPage()
  await p.goto(B + '/login'); await p.fill('#login-email', 'admin.staff@example.com'); await p.fill('#login-password', 'AdminStaff2026'); await p.click('button[type=submit]'); await p.waitForURL('**/admin/jobs')
  await p.goto(B + '/admin/reports'); await p.waitForSelector('.stat')
  await p.emulateMedia({ media: 'print' })
  const hidden = await p.evaluate(() => ['.shell__header', '.shell__footer', '.filters', '.tabs'].map((s) => getComputedStyle(document.querySelector(s)).display))
  const { mkdirSync } = await import('node:fs'); mkdirSync('CLAUDE/screenshots', { recursive: true })
  await p.pdf({ path: 'CLAUDE/screenshots/admin-reports_print.pdf', format: 'A4' })
  console.log(JSON.stringify(['reports print', hidden, await p.isVisible('h1'), 'CLAUDE/screenshots/admin-reports_print.pdf']))
  await b.close()
}
