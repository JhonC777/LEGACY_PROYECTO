import { ArrowRight, LogOut, ShieldAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { getInstitutionBySlug, type DemoInstitution } from '@/data/demoData'
import { useAdminSession } from '../session'

/** Estado "sin permisos": la sesión pertenece a otra institución. */
export function AdminNoAccess({ requested }: { requested: DemoInstitution }) {
  const { session, signOut } = useAdminSession()
  const navigate = useNavigate()
  const own = getInstitutionBySlug(session?.institutionSlug)

  const handleSignOut = () => {
    signOut()
    navigate(`/admin/login?institution=${requested.slug}`, { replace: true })
  }

  return (
    <main className="app-shell relative">
      <CosmicBackground />
      <div className="relative z-10 flex h-full items-center justify-center px-6">
        <GlassSurface variant="strong" className="w-full max-w-md rounded-[1.75rem] p-7 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-300">
            <ShieldAlert className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-xs font-bold tracking-[0.2em] text-legacy-gold uppercase">
            Sin permisos
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-legacy-white">
            Este panel no pertenece a tu institución
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-legacy-muted">
            Tu sesión está vinculada a{' '}
            <span className="text-legacy-white">{own?.name ?? 'otra institución'}</span>. Cada
            administrador solo puede gestionar el archivo de su propia institución.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            {own ? (
              <Link to={`/admin/${own.slug}`} className="btn btn-primary btn-md w-full">
                Ir a mi panel
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ) : null}
            <button type="button" onClick={handleSignOut} className="btn btn-secondary btn-md w-full">
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión y entrar a {requested.shortName}
            </button>
            <Link to="/" className="btn btn-ghost btn-sm mt-1">
              Volver al inicio
            </Link>
          </div>
        </GlassSurface>
      </div>
    </main>
  )
}
