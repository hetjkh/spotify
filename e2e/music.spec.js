const { test, expect } = require('@playwright/test')

test('catalog audio plays and keeps playing across navigation', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Listen now', exact: true }).first().waitFor({ timeout: 60000 })
  await page.getByRole('button', { name: 'Listen now', exact: true }).first().click()
  const audio = page.locator('audio')
  await expect.poll(() => audio.evaluate(element => element.currentSrc), { timeout: 20000 }).toContain('/uploads/audio/demo-')
  await expect.poll(() => audio.evaluate(element => element.paused)).toBe(false)
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Browse', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Listen to the whole story.' })).toBeVisible()
  await expect.poll(() => audio.evaluate(element => element.currentTime)).toBeGreaterThan(0.1)
  await page.locator('.player-sidebar').getByRole('button', { name: 'Pause audiobook', exact: true }).click()
  await expect.poll(() => audio.evaluate(element => element.paused)).toBe(true)
  expect(errors).toEqual([])
})

test('book page lists chapters from catalog', async ({ page }) => {
  await page.goto('/albums')
  await page.locator('.workspace-book-card').first().waitFor({ timeout: 60000 })
  await page.locator('.workspace-book-card').first().getByRole('link').first().click()
  await expect(page.locator('#main-content').getByRole('heading', { name: 'Chapters' })).toBeVisible()
  await page.locator('.track-list button, .track-row').first().click()
  await expect.poll(() => page.locator('audio').evaluate(el => el.currentSrc)).toContain('http')
})
