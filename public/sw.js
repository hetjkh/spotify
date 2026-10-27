const SHELL = 'groovy-shell-v3'
const AUDIO = 'groovy-audio-v3'
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(SHELL).then(cache => cache.add('/download')).catch(() => {})) })
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()) })
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return
  if (url.pathname.startsWith('/offline-audio/')) {
    event.respondWith((async () => {
      const response = await (await caches.open(AUDIO)).match(url.pathname)
      if (!response) return new Response('Download not available', { status: 404 })
      const range = event.request.headers.get('Range')
      if (!range) return response
      const data = await response.arrayBuffer()
      const match = /^bytes=(\d*)-(\d*)$/.exec(range)
      if (!match) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${data.byteLength}` } })
      const start = match[1] ? Number(match[1]) : Math.max(0, data.byteLength - Number(match[2]))
      const end = match[1] && match[2] ? Math.min(Number(match[2]), data.byteLength - 1) : data.byteLength - 1
      if (start > end || start >= data.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${data.byteLength}` } })
      return new Response(data.slice(start, end + 1), { status: 206, headers: { 'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg', 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${data.byteLength}` } })
    })())
    return
  }
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/data/')) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL)
      try { const response = await fetch(event.request); if (response.ok) await cache.put(event.request, response.clone()); return response }
      catch { return await cache.match(event.request) || (event.request.mode === 'navigate' ? await cache.match('/download') : null) || new Response('Offline', { status: 503 }) }
    })())
  }
})
