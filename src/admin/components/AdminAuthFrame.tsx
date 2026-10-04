import type { ReactNode } from 'react'
import '@/styles/admin.css'
import '@/styles/admin-auth.css'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CelestialSky } from '@/components/atmosphere/celestial/CelestialSky'
import { LegacyMark } from '@/components/brand/LegacyMark'
import { LEGACY_SLOGAN } from '@/lib/brand'
import { cn } from '@/lib/cn'

type AdminAuthFrameProps = {
  kicker: string
  title: string
  backTo?: string
  backLabel?: string
  /** Bloque principal arriba del título (p. ej. medallón con el logo de la institución). */
  lead?: ReactNode
  asideFooter?: ReactNode
  children: ReactNode
}

/**
 * Marco de las pantallas de acceso (selector, ingreso, nueva clave).
 * Una sola columna en celulares y tabletas táctiles; dos columnas solo con puntero fino y
 * pantalla ancha. La jerarquía es la misma en ambos: medallón → kicker → título → formulario.
 */
export function AdminAuthFrame({
  kicker,
  title,
  backTo = '/',
  backLabel = 'Volver al inicio',
  lead,
  asideFooter,
  children,
}: AdminAuthFrameProps) {
  return (
    <main className="app-shell relative">
      <CelestialSky />
      <div className="legacy-hidden-scroll auth-celestial-scroll">
        <section className={cn('auth-celestial-card admin-auth-stage', lead != null && 'has-lead')}>
          <header className="auth-celestial-aside">
            <span className="auth-celestial-aside-stars" aria-hidden />
            <div className="auth-celestial-head">
              {lead ?? <LegacyMark size="md" className="auth-celestial-mark" />}
              <p className="auth-celestial-kicker">{kicker}</p>
              <h1 className="auth-celestial-title">{title}</h1>
              <div className="admin-auth-rule auth-celestial-rule" aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <p className="auth-celestial-slogan">{LEGACY_SLOGAN}</p>
            </div>
            {asideFooter ? <div className="auth-celestial-aside-footer">{asideFooter}</div> : null}
            {lead ? (
              <p className="auth-celestial-signature">
                <LegacyMark size="sm" />
                <span>Legacy · Archivo institucional</span>
              </p>
            ) : null}
          </header>
          <div className="auth-celestial-panel">
            {children}
            <div className="auth-celestial-back">
              <Link to={backTo} className="btn btn-ghost btn-sm auth-tap44">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {backLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
