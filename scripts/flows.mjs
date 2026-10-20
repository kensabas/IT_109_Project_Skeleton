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
