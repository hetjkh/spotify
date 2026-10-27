/** @jest-environment node */
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const listeningDate = require('../server/listeningDate')
const { canRead } = require('../server/access')

test('private books are only readable by their owner, including populated owners', () => {
  const book = { visibility: 'private', owner: 'author' }
  expect(canRead(book)).toBe(false)
  expect(canRead(book, { _id: 'listener' })).toBe(false)
  expect(canRead(book, { _id: 'author' })).toBe(true)
  expect(canRead({ ...book, owner: { _id: 'author' } }, { _id: 'author' })).toBe(true)
  expect(canRead({ ...book, visibility: 'public' })).toBe(true)
})

test('listening days follow the listener timezone at midnight boundaries', () => {
  const instant = new Date('2026-10-23T20:00:00Z')
  expect(listeningDate('Asia/Kolkata', instant)).toBe('2026-10-24')
  expect(listeningDate('America/Los_Angeles', instant)).toBe('2026-10-23')
  expect(listeningDate('invalid', instant)).toBe('2026-10-23')
})

async function offlineRequest(range) {
  let handler, result
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
    URL, Response, self: { location: { origin: 'http://localhost' }, addEventListener: (name, callback) => { if (name === 'fetch') handler = callback } },
    caches: { open: async () => ({ match: async () => new Response(Uint8Array.from([0, 1, 2, 3, 4, 5]), { headers: { 'Content-Type': 'audio/mpeg' } }) }) },
  })
  handler({ request: new Request('http://localhost/offline-audio/user/chapter', { headers: range ? { Range: range } : {} }), respondWith: promise => { result = promise } })
  return result
}

test('offline audio supports bounded byte ranges for seeking', async () => {
  const response = await offlineRequest('bytes=2-4')
  expect(response.status).toBe(206)
  expect(response.headers.get('Content-Range')).toBe('bytes 2-4/6')
  expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([2, 3, 4])
})

test('offline audio supports suffix requests and rejects unsatisfiable ranges', async () => {
  const response = await offlineRequest('bytes=-2')
  expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([4, 5])
  expect((await offlineRequest('bytes=99-100')).status).toBe(416)
})
