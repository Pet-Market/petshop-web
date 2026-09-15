import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { api, getStoredToken, storeToken, type AuthClient, type AuthSession } from '@/lib/api'
import { getRawInitData, isTMA, requestPhone } from '@/lib/telegram'

interface AuthContextValue {
  client: AuthClient | null
  token: string | null
  /** True until the stored session has been verified against /auth/me/. */
  loading: boolean
  /** TMA auto-login (validates initData hash on the backend). */
  tmaLogin: (initData: string, phone?: string) => Promise<AuthSession>
  /** Web login with phone + one-time password. */
  login: (phone: string, password: string) => Promise<AuthSession>
  /** Request Telegram to share the phone, then attach it to the TMA session. */
  attachPhone: () => Promise<AuthSession | null>
  resetPassword: (phone: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<AuthClient | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [loading, setLoading] = useState(true)
  const bootAttempted = useRef(false)

  useEffect(() => {
    let active = true

    async function restore() {
      const stored = getStoredToken()
      if (!stored) {
        setLoading(false)
        return
      }
      try {
        const session = await api.auth.me()
        if (!active) return
        setClient(session.client)
        setToken(session.token)
      } catch {
        if (active) {
          storeToken(null)
          setToken(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    restore()
    return () => {
      active = false
    }
  }, [])

  // Silent TMA auto-login: the initData hash is verified server-side.
  useEffect(() => {
    if (bootAttempted.current || loading || client) return
    if (!isTMA()) return
    bootAttempted.current = true
    const raw = getRawInitData()
    if (!raw) return
    api.auth.tma(raw).then((session) => {
      storeToken(session.token)
      setClient(session.client)
      setToken(session.token)
    }).catch(() => {
      /* user not ready — they can open the account dialog */
    })
  }, [loading, client])

  const setSession = useCallback((session: AuthSession) => {
    storeToken(session.token)
    setToken(session.token)
    setClient(session.client)
  }, [])

  const tmaLogin = useCallback(
    async (initData: string, phone?: string) => {
      const session = await api.auth.tma(initData, phone || undefined)
      setSession(session)
      return session
    },
    [setSession]
  )

  const login = useCallback(
    async (phone: string, password: string) => {
      const session = await api.auth.login(phone, password)
      setSession(session)
      return session
    },
    [setSession]
  )

  const attachPhone = useCallback(async () => {
    if (!isTMA()) return null
    const phone = await requestPhone()
    const raw = getRawInitData() ?? ''
    const session = await api.auth.tma(raw, phone ?? undefined)
    setSession(session)
    return session
  }, [setSession])

  const resetPassword = useCallback(async (phone: string) => {
    await api.auth.resetPassword(phone)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      /* token may already be invalid — clear locally anyway */
    }
    storeToken(null)
    setToken(null)
    setClient(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ client, token, loading, tmaLogin, login, attachPhone, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}