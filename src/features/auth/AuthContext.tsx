import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type UserDto } from '../../lib/api'

interface AuthContextValue {
  user: UserDto | null
  /** Faux tant qu'on ne sait pas encore si une session peut être reprise. */
  ready: boolean
  /** Vrai si la dernière session s'est terminée par expiration. */
  expired: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth doit être appelé sous <AuthProvider>')
  return value
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    let ignore = false
    api.onSessionExpired(() => {
      setUser(null)
      setExpired(true)
    })
    api
      .restore()
      .then((restored) => {
        if (!ignore && restored) setUser(restored)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!ignore) setReady(true)
      })
    return () => {
      ignore = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setUser(await api.login(email, password))
    setExpired(false)
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, ready, expired, login, logout }), [user, ready, expired, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
