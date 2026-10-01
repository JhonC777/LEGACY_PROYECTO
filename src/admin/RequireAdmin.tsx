import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { RouteFallback } from '@/components/navigation/RouteFallback'
import { getInstitutionBySlug } from '@/data/demoData'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { AdminLayout } from './components/AdminLayout'
import { AdminNoAccess } from './pages/AdminNoAccess'
import { safeAdminNext } from './safeNext'
import { useAdminSession } from './session'
import { AdminStoreProvider } from './store'
import { ToastProvider } from './toast'

type AdminGate = 'skip' | 'checking' | 'ok' | 'anonymous' | 'forbidden' | 'error'

function isAnonymousAuthError(message: string) {
  return /session missing|invalid claim|invalid jwt|jwt expired|not authenticated|user not found/i.test(
    message,
  )
}

/**
 * Protege /admin/:institutionSlug.
 * Sin sesión → login. Sesión de otra institución → "sin permisos".
 * Nunca monta el store de una institución distinta a la de la sesión.
 */
export function RequireAdmin() {
  const { institutionSlug } = useParams()
  const location = useLocation()
  const [params] = useSearchParams()
  const { session, signOut } = useAdminSession()
  const institution = getInstitutionBySlug(institutionSlug)
  const [gate, setGate] = useState<AdminGate>(supabaseConfigured ? 'checking' : 'skip')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!supabaseConfigured || !supabase || !institution) {
      setGate('skip')
      return
    }
    if (!session || session.institutionSlug !== institution.slug) {
      setGate('skip')
      return
    }

    let cancelled = false
    setGate('checking')
    const client = supabase
    const institutionId = institution.id
    void (async () => {
      try {
        const { data, error } = await client.auth.getUser()
        if (cancelled) return
        if (!data.user) {
          setGate(error && !isAnonymousAuthError(error.message) ? 'error' : 'anonymous')
          return
        }
        const membership = await client
          .from('institution_admins')
          .select('institution_id')
          .eq('institution_id', institutionId)
          .eq('user_id', data.user.id)
          .maybeSingle()
        if (cancelled) return
        if (membership.error) {
          setGate('error')
          return
        }
        setGate(membership.data ? 'ok' : 'forbidden')
      } catch {
        if (!cancelled) setGate('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [attempt, institution, session])

  useEffect(() => {
    if (gate === 'anonymous') signOut()
  }, [gate, signOut])

  if (!institution) return <Navigate to="/" replace />

  if (!session) {
    const next = safeAdminNext(`${location.pathname}${location.search}`)
    const target = `/admin/login?institution=${institution.slug}${
      next ? `&next=${encodeURIComponent(next)}` : ''
    }`
    return <Navigate to={target} replace />
  }

  if (session.institutionSlug !== institution.slug || gate === 'forbidden') {
    return <AdminNoAccess requested={institution} />
  }

  if (supabaseConfigured && gate === 'checking') return <RouteFallback />

  if (supabaseConfigured && gate === 'anonymous') return <RouteFallback />

  if (supabaseConfigured && gate === 'error') {
    return (
      <div
        role="alert"
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-legacy-black px-6 text-center"
      >
        <p className="max-w-sm text-sm leading-relaxed text-legacy-muted">
          No se pudo comprobar el acceso. Revisa la conexión e intenta de nuevo.
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttempt((n) => n + 1)}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <ToastProvider>
      <AdminStoreProvider
        key={institution.id}
        institution={institution}
        actor={session.name}
        simulateError={params.get('demoState') === 'error'}
      >
        <AdminLayout>
          <Outlet />
        </AdminLayout>
      </AdminStoreProvider>
    </ToastProvider>
  )
}
