const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const { chromium, expect } = require('@playwright/test')
const WEB = process.env.CHECK_WEB_URL || 'http://localhost:3000'
const API = process.env.CHECK_API_URL || 'http://localhost:4000'
const report = { startedAt: new Date().toISOString(), pages: [], audio: [], checks: [], errors: [] }
async function main() {
  const { books } = await (await fetch(API + '/books/public')).json()
  const { authors } = await (await fetch(API + '/books/authors')).json()
  assert.equal(books.length, 6); assert.equal(authors.length, 5)
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    page.on('pageerror', error => report.errors.push({ path: new URL(page.url()).pathname, message: error.message }))
    page.on('response', response => { if (response.status() >= 500) report.errors.push({ url: response.url(), status: response.status() }) })
    await page.goto(WEB)
    await page.getByRole('button', { name: 'Listen now', exact: true }).first().click()
    await page.waitForFunction(() => { const audio = document.querySelector('audio'); return audio && !audio.paused && audio.currentTime > .3 })
    report.checks.push('Homepage first-click playback using real local LibriVox audio; no request interception or audio mocks')
    for (const book of books) {
      await page.goto(WEB + '/listen/' + book.id)
      await page.locator('#main-content').getByRole('heading', { name: book.title, exact: true }).waitFor()
      await expect(page.getByRole('link', { name: 'Full audiobook and original recording', exact: true })).toBeVisible()
      for (const [index, chapter] of book.chapters.entries()) {
        await page.locator('#main-content .track-row').nth(index).click()
        await page.waitForFunction(filename => { const audio = document.querySelector('audio'); return audio.currentSrc.endsWith(filename) && !audio.paused && audio.readyState >= 2 }, chapter.audioUrl)
        const before = await page.locator('audio').evaluate(audio => audio.currentTime)
        await expect.poll(() => page.locator('audio').evaluate(audio => audio.currentTime)).toBeGreaterThan(before + .2)
        const audio = await page.locator('audio').evaluate(audio => ({ src: audio.currentSrc, duration: audio.duration, paused: audio.paused }))
        assert.ok(audio.duration > 89 && audio.duration < 92)
        report.audio.push({ book: book.title, chapter: chapter.title, ...audio })
      }
      console.log(`PASS real playback: ${book.title}, both excerpts`)
    }
    await page.locator('.player-sidebar').getByRole('button', { name: '1.5x', exact: true }).click()
    assert.equal(await page.locator('audio').evaluate(audio => audio.playbackRate), 1.5)
    await page.locator('.player-sidebar').getByRole('button', { name: 'Mute', exact: true }).click()
    assert.equal(await page.locator('audio').evaluate(audio => audio.volume), 0)
    await page.locator('.player-sidebar').getByRole('button', { name: 'Unmute', exact: true }).click()
    await page.locator('.player-sidebar').getByRole('button', { name: 'Chapter', exact: true }).click()
    await page.locator('audio').evaluate(audio => { audio.currentTime = audio.duration - .2 })
    await expect.poll(() => page.locator('audio').evaluate(audio => audio.paused)).toBe(true)
    report.checks.push('Playback speed, mute/unmute, and real end-of-chapter sleep timer')
    await page.goto(WEB + '/login')
    await page.getByLabel('Email', { exact: true }).fill('mira@groovy.demo')
    await page.getByLabel('Password', { exact: true }).fill('listening123')
    await page.locator('#main-content').getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.waitForURL('**/dashboard')
    await page.getByRole('heading', { name: 'Continue listening', exact: true }).waitFor()
    await expect(page.getByText('Demo account · sample listening activity')).toBeVisible()
    await page.getByRole('button', { name: 'Resume', exact: true }).first().click()
    await page.waitForFunction(() => !document.querySelector('audio').paused)
    await page.goto(WEB + '/creator')
    await page.getByRole('link', { name: 'Upload a book', exact: true }).waitFor()
    await page.goto(WEB + '/dashboard')
    report.checks.push('Email/password login, seeded dashboard, resume after account switch, and separate creator workspace')
    const routes = ['/browse','/browse?tab=categories','/browse?tab=popular','/browse?tab=new','/browse?tab=people','/browse?tab=stations','/collections','/collections?type=chapters','/creator','/library?status=in_progress','/library?status=want_to_listen','/', '/albums', '/artists', '/genres', '/genres?genre=Fantasy', '/genres?genre=Mystery', '/genres?genre=Biography', '/charts', '/radio', '/search', '/search/Alice', '/search/zz-no-demo-results', '/recent', '/local', '/download', '/library', '/library?status=wishlist', '/dashboard', '/profile', '/upload', '/collection/albums', '/collection/artists', '/collection/podcasts', '/collection/episodes', '/collection/playlists', '/collection/tracks', '/playlist/my-demo-evening', '/login', '/signup', '/forgot', '/reset?token=invalid', '/verify?token=invalid', '/bookmarks', '/404', '/does-not-exist']
    for (const tab of ['albums', 'artists', 'tracks', 'podcasts', 'playlists']) routes.push('/search/Alice/' + tab)
    for (const author of authors) routes.push('/u/' + author.id, '/artists?artist=' + author.id)
    for (const book of books) routes.push('/listen/' + book.id)
    for (const name of new Set(books.map(book => book.narrator))) routes.push('/narrator/' + encodeURIComponent(name))
    for (const series of new Set(books.map(book => book.series).filter(Boolean))) routes.push('/series/' + encodeURIComponent(series))
    routes.push('/edit/' + books.find(book => book.authorName === 'Lewis Carroll').id)
    for (const route of routes) {
      const response = await page.goto(WEB + route)
      assert.ok(response.status() < 400 || route === '/404' || route === '/does-not-exist', `Unexpected HTTP ${response.status()}: ${route}`)
      await page.locator('#main-content h1, main.error-page h1').first().waitFor()
      await page.waitForTimeout(180)
      const images = await page.locator('img').evaluateAll(async images => {
        await Promise.all(images.map(image => image.decode().catch(() => {})))
        return images.filter(image => image.getAttribute('src') && !image.naturalWidth).map(image => image.src)
      })
      assert.deepEqual(images, [], `Broken images on ${route}`)
      if (route.includes('genre=Fantasy') || route.includes('genre=Mystery')) {
        const genre = new URL(WEB + route).searchParams.get('genre')
        await expect.poll(() => page.locator('.genre-results .genre-pill').count()).toBeGreaterThan(0)
        for (const label of await page.locator('.genre-results .genre-pill').allTextContents()) assert.ok(label.includes(genre), `Incorrect genre: ${label}`)
      }
      report.pages.push({ route, status: response.status(), headings: await page.locator('#main-content h1, main.error-page h1').allTextContents(), brokenImages: images.length })
      console.log(`PASS page: ${route}`)
    }
    for (const route of ['/dashboard', '/albums', '/library', '/profile', '/upload', '/download']) {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(WEB + route); await page.locator('#main-content h1, main.error-page h1').first().waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Mobile overflow on ${route}`)
    }
    report.checks.push('Mobile layout at 390px: dashboard, books, library, profile, upload, downloads')
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(WEB); await page.getByRole('button', { name: 'Listen now', exact: true }).first().waitFor(); await page.locator('.hero-portrait').evaluate(image => image.decode()); await page.locator('.topbar-actions .profile-button').filter({ hasText: 'Mira' }).waitFor()
    await page.screenshot({ path: path.join(__dirname, '../artifacts/demo-home-desktop.png') })
    await page.goto(WEB + '/dashboard'); await page.getByRole('heading', { name: 'Continue listening', exact: true }).waitFor()
    await page.screenshot({ path: path.join(__dirname, '../artifacts/demo-dashboard-desktop.png') })
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: path.join(__dirname, '../artifacts/demo-dashboard-mobile.png') })
    assert.deepEqual(report.errors, [])
  } finally {
    await browser.close()
    report.finishedAt = new Date().toISOString()
    await fs.writeFile(path.join(__dirname, '../artifacts/demo-site-check.json'), JSON.stringify(report, null, 2))
  }
  console.log(`PASS ${report.pages.length} page visits, ${report.audio.length} real-audio playback checks, ${report.checks.length} workflow groups`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
