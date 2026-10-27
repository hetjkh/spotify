export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const TOKEN_KEY = 'groovy-token'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}
export function setToken(token) {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

export function fileUrl(path) {
  if (!path) return '/groovy.svg'
  if (path.startsWith('/offline-audio/')) return path
  if (path.startsWith('http')) return path
  return `${API}${path}`
}

export function avatarUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API}${path}`
}

export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData
  const token = getToken()
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function toPlayerTracks(book) {
  return (book.chapters || []).map(chapter => ({
    id: String(chapter._id || chapter.id),
    title: chapter.title,
    artist: book.authorName || book.owner?.name || 'Unknown',
    artistId: book.owner?.id,
    album: book.title,
    bookId: String(book.id),
    narrator: book.narrator,
    image: fileUrl(book.coverUrl),
    genre: book.genre,
    duration: chapter.duration || 0,
    src: fileUrl(chapter.audioUrl),
  }))
}
