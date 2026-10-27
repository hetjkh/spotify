const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 7000 },
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000', channel: 'chrome', headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  reporter: 'list',
  webServer: [
    { command: 'node server/index.js', cwd: __dirname, url: 'http://localhost:4000/health', reuseExistingServer: true, timeout: 120000 },
    { command: 'npm run dev', cwd: __dirname, url: 'http://127.0.0.1:3000', reuseExistingServer: true, timeout: 120000, env: { ...process.env, NEXT_PUBLIC_API_URL: 'http://localhost:4000' } },
  ],
})
