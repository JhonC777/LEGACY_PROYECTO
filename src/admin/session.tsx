import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Sesión administrativa DEMO.
 * Vive en sessionStorage (se pierde al cerrar la pestaña). No hay credenciales
 * reales: Supabase Auth sustituirá este módulo sin cambiar la interfaz.
 */
export type AdminSession = {
  email: string
  name: string
  institutionSlug: string
  signedInAt: string
}

const STORAGE_KEY = 'legacy.admin.session'

function readSession(): AdminSession | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AdminSession) : null
  } catch {
    return null
  }
}

type SessionContextValue = {
  session: AdminSession | null
  signIn: (input: Omit<AdminSession, 'signedInAt'>) => AdminSession
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() =>
    typeof window === 'undefined' ? null : readSession(),
  )

  const signIn = useCallback((input: Omit<AdminSession, 'signedInAt'>) => {
    const next: AdminSession = { ...input, signedInAt: new Date().toISOString() }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    return next
  }, [])

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useAdminSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useAdminSession debe usarse dentro de AdminSessionProvider')
  }
  return context
}

/** Deriva un nombre legible a partir del correo (demo). */
export function displayNameFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const words = local.split(/[._-]+/).filter(Boolean)
  if (words.length === 0) return 'Administrador'
  return words
    .map((word) => word.charAt(0).toLocaleUpperCase('es') + word.slice(1))
    .join(' ')
}
