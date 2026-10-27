import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { refreshCatalogVersion } from '@/lib/catalogVersion'
import { clearPrivateDownloads } from '@/lib/offline'
import { api, setToken } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [google, setGoogle] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [{ user: next }, config] = await Promise.all([api('/auth/me'), api('/auth/config')])
      setUser(next)
      if (next) localStorage.setItem('groovy-offline-user', JSON.stringify(next))
      else localStorage.removeItem('groovy-offline-user')
      setGoogle(Boolean(config.google))
    } catch {
      if (!navigator.onLine) { try { setUser(JSON.parse(localStorage.getItem('groovy-offline-user') || 'null')) } catch { setUser(null) } } else setUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { refreshCatalogVersion().then(refresh) }, [refresh])

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('groovy-offline-user', JSON.stringify(data.user))
    return data.user
  }
  const signup = async (name, email, password) => {
    const data = await api('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' })
    await clearPrivateDownloads(user?.id).catch(() => {})
    localStorage.removeItem('groovy-offline-user')
    setToken('')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, google, refresh, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
