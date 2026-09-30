import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { clearSession, readSession, writeSession } from './session'
import type { RememberedLogin, Session } from '../types'

type AuthContextValue = {
  session: Session | null
  signIn: (session: Session, remember: boolean, draft: RememberedLogin) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: (next, remember, draft) => {
        writeSession(next, remember, draft)
        setSession(next)
      },
      signOut: () => {
        clearSession()
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
