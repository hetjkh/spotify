import { api } from './api'
export async function refreshCatalogVersion() {
  try {
    const { version } = await api('/catalog/version')
    if (!version || localStorage.getItem('groovy-catalog-version') === version) return
    for (const key of Object.keys(localStorage)) {
      if (/^groovy-(library|downloads|offline-user|token|guest)/.test(key)) localStorage.removeItem(key)
    }
    if ('caches' in window) for (const key of await caches.keys()) if (key.startsWith('groovy-')) await caches.delete(key)
    localStorage.setItem('groovy-catalog-version', version)
  } catch { /* Retain downloaded content when the browser is offline. */ }
}
