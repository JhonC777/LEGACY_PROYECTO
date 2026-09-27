import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { signOutRemote } from '@/data/archiveRemote'
import { clearArchiveSnapshot } from './archiveBridge'

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
const PERSIST_KEY = 'legacy.admin.persist'

function readRaw() {
  return window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY)
}

function readSession(): AdminSession | null {
  try {
    const raw = readRaw()
    return raw ? (JSON.parse(raw) as AdminSession) : null
  } catch {
    return null
  }
}

export function adminSessionPersists() {
  return window.localStorage.getItem(PERSIST_KEY) === '1'
}

type SessionContextValue = {
  session: AdminSession | null
  signIn: (input: Omit<AdminSession, 'signedInAt'>, persist?: boolean) => AdminSession
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() =>
    typeof window === 'undefined' ? null : readSession(),
  )

  const signIn = useCallback((input: Omit<AdminSession, 'signedInAt'>, persist = true) => {
    const next: AdminSession = { ...input, signedInAt: new Date().toISOString() }
    if (persist) window.localStorage.setItem(PERSIST_KEY, '1')
    else window.localStorage.removeItem(PERSIST_KEY)
    const primary = persist ? window.localStorage : window.sessionStorage
    const other = persist ? window.sessionStorage : window.localStorage
    other.removeItem(STORAGE_KEY)
    primary.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    return next
  }, [])

  const signOut = useCallback(() => {
    const slug = session?.institutionSlug
    if (slug) clearArchiveSnapshot(slug)
    void signOutRemote()
    window.sessionStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [session])

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
