import Router from 'next/router'
import { fileUrl } from './api'
const CACHE = 'groovy-audio-v3'
export const offlineKey = owner => `groovy-downloads:${owner || 'guest'}`
export function readDownloads(owner) {
  try { return JSON.parse(localStorage.getItem(offlineKey(owner)) || '[]') } catch { return [] }
}
function save(owner, items) {
  localStorage.setItem(offlineKey(owner), JSON.stringify(items))
  window.dispatchEvent(new Event('groovy:downloads'))
}
export function offlineAudio(owner, chapter) { return `/offline-audio/${owner || 'guest'}/${chapter}` }
export async function downloadBook(book, owner, onProgress = () => {}) {
  if (!('serviceWorker' in navigator) || !('caches' in window)) throw new Error('Offline listening requires HTTPS and a supported browser')
  await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  await Router.prefetch('/download')
  const shell = await caches.open('groovy-shell-v3')
  await Promise.allSettled(['/download', ...performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.startsWith(location.origin + '/_next/static/'))].map(url => shell.add(url)))
  const cache = await caches.open(CACHE)
  const chapters = book.chapters || []
  let bytes = 0
  const written = []
  try {
    for (let index = 0; index < chapters.length; index++) {
      const chapter = chapters[index]
      const response = await fetch(fileUrl(chapter.audioUrl), { credentials: chapter.audioUrl.startsWith('http') ? 'omit' : 'include' })
      if (!response.ok || response.type === 'opaque') throw new Error('This audio source does not allow offline downloads')
      const blob = await response.blob()
      const url = offlineAudio(owner, chapter._id || chapter.id)
      await cache.put(url, new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/mpeg', 'Content-Length': String(blob.size) } }))
      written.push(url); bytes += blob.size
      onProgress(Math.round((index + 1) / chapters.length * 100))
    }
    const items = readDownloads(owner).filter(item => item.book.id !== book.id)
    save(owner, [...items, { book, bytes, savedAt: new Date().toISOString() }])
  } catch (error) {
    for (const url of written) await cache.delete(url)
    throw error
  }
}
export async function removeDownload(owner, bookId) {
  const items = readDownloads(owner)
  const item = items.find(entry => entry.book.id === bookId)
  const cache = await caches.open(CACHE)
  if (item) for (const chapter of item.book.chapters) await cache.delete(offlineAudio(owner, chapter._id || chapter.id))
  save(owner, items.filter(entry => entry.book.id !== bookId))
}
export async function clearPrivateDownloads(owner) {
  for (const item of readDownloads(owner).filter(entry => entry.book.visibility === 'private')) await removeDownload(owner, item.book.id)
}
export function downloadedBook(owner, bookId) { return readDownloads(owner).find(item => item.book.id === bookId)?.book }
export function offlineBook(book, owner) {
  return { ...book, chapters: book.chapters.map(chapter => ({ ...chapter, audioUrl: offlineAudio(owner, chapter._id || chapter.id) })) }
}
