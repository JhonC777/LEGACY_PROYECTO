import { Navigate, Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { getInstitutionBySlug } from '@/data/demoData'
import { AdminLayout } from './components/AdminLayout'
import { AdminNoAccess } from './pages/AdminNoAccess'
import { useAdminSession } from './session'
import { AdminStoreProvider } from './store'
import { ToastProvider } from './toast'

/**
 * Protege /admin/:institutionSlug.
 * Sin sesión → login. Sesión de otra institución → "sin permisos".
 * Nunca monta el store de una institución distinta a la de la sesión.
 */
export function RequireAdmin() {
  const { institutionSlug } = useParams()
  const location = useLocation()
  const [params] = useSearchParams()
  const { session } = useAdminSession()
  const institution = getInstitutionBySlug(institutionSlug)

  if (!institution) return <Navigate to="/" replace />

  if (!session) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return (
      <Navigate to={`/admin/login?institution=${institution.slug}&next=${next}`} replace />
    )
  }

  if (session.institutionSlug !== institution.slug) {
    return <AdminNoAccess requested={institution} />
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
