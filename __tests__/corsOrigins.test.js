/** @jest-environment node */
const http = require('node:http')
const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const { getClientConfig } = require('../server/clientOrigins')

const vercel = 'https://spotify-two-lilac.vercel.app'
const local3000 = 'http://localhost:3000'
const local3001 = 'http://localhost:3001'
const production = { NODE_ENV: 'production', CLIENT_ORIGIN: `${vercel},${local3000},${local3001}` }

describe('frontend origin configuration', () => {
  test('separates origins, normalizes trailing slashes, and keeps one redirect destination', () => {
    const config = getClientConfig({ NODE_ENV: 'production', CLIENT_ORIGIN: ` ${vercel}/, ${local3001},,${vercel} ` })
    expect(config.clientOrigin).toBe(vercel)
    expect(config.corsOptions).toEqual({ origin: [vercel, local3001], credentials: true })
  })

  test('accepts a bare hostname or localhost without a scheme', () => {
    const config = getClientConfig({ NODE_ENV: 'production', CLIENT_ORIGIN: 'spotify-two-lilac.vercel.app, localhost:3000' })
    expect(config.clientOrigin).toBe(vercel)
    expect(config.corsOptions.origin).toEqual([vercel, local3000])
  })

  test('permits local development ports without implicitly adding them in production', () => {
    expect(getClientConfig({ NODE_ENV: 'development' }).corsOptions.origin).toEqual(expect.arrayContaining([local3000, local3001, 'http://127.0.0.1:3001']))
    expect(getClientConfig({ NODE_ENV: 'production', CLIENT_ORIGIN: vercel }).corsOptions.origin).toEqual([vercel])
  })

  test.each(['*', 'null', 'javascript:alert(1)', `${vercel}/browse`, 'https://user:password@example.com', `${vercel}?next=elsewhere`])('rejects invalid configured origin %s', value => {
    expect(() => getClientConfig({ CLIENT_ORIGIN: value })).toThrow('CLIENT_ORIGIN')
  })
})

describe('API and Socket.IO CORS responses', () => {
  let server, io, baseUrl
  beforeAll(async () => {
    const app = express()
    const { corsOptions } = getClientConfig(production)
    app.use(cors(corsOptions))
    app.get('/catalog/version', (_req, res) => res.json({ version: 'test' }))
    server = http.createServer(app)
    io = new Server(server, { cors: corsOptions })
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    baseUrl = `http://127.0.0.1:${server.address().port}`
  })
  afterAll(async () => { if (io) await new Promise(resolve => io.close(resolve)) })

  test.each([vercel, local3000, local3001])('reflects only %s for credentialed API preflights', async origin => {
    const response = await fetch(`${baseUrl}/books/public`, {
      method: 'OPTIONS', headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    })
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('authorization,content-type')
    expect(response.headers.get('Vary')).toContain('Origin')
  })

  test('also includes the matching origin on actual API responses', async () => {
    const response = await fetch(`${baseUrl}/catalog/version`, { headers: { Origin: local3001 } })
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(local3001)
    expect(await response.json()).toEqual({ version: 'test' })
  })

  test.each(['https://unlisted.example', 'https://spotify-two-lilac.vercel.app.evil.example', 'null'])('does not grant browser access to %s', async origin => {
    const response = await fetch(`${baseUrl}/catalog/version`, { headers: { Origin: origin } })
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    await response.text()
  })

  test('allows a health-style request without an Origin header', async () => {
    const response = await fetch(`${baseUrl}/catalog/version`)
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    await response.text()
  })

  test.each([vercel, local3001])('Socket.IO uses the same origin handling for %s', async origin => {
    const response = await fetch(`${baseUrl}/socket.io/?EIO=4&transport=polling`, {
      method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
    })
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })
})

test('email links use the primary frontend rather than the comma-separated list', async () => {
  const originalEnv = process.env
  process.env = { ...originalEnv, ...production, RESEND_API_KEY: 'test-only', MAIL_FROM: 'test@example.com' }
  const request = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true })
  try {
    const { sendAccountEmail } = require('../server/mail')
    await sendAccountEmail('listener@example.com', 'reset', 'test-token')
    const body = JSON.parse(request.mock.calls[0][1].body)
    expect(body.text).toContain(`${vercel}/reset?token=test-token`)
    expect(body.text).not.toContain(local3000)
  } finally {
    request.mockRestore()
    process.env = originalEnv
  }
})
