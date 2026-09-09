import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Building2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { Button } from '@/components/ui/Button'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { DEMO_INSTITUTIONS, getInstitutionBySlug } from '@/data/demoData'
import { displayNameFromEmail, useAdminSession } from '@/admin/session'
import { useDeferredAction } from '@/lib/useDeferredAction'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Login administrativo DEMO.
 * Acepta cualquier correo válido + contraseña de 6+ caracteres y crea una
 * sesión ligada a la institución elegida. Supabase Auth reemplazará esto.
 */
export function AdminLogin() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { session, signIn } = useAdminSession()
  const defer = useDeferredAction()

  const requestedSlug = params.get('institution') ?? ''
  const next = params.get('next')
  const institution = getInstitutionBySlug(requestedSlug)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sesión ya activa para esta institución → directo al panel.
  if (session && institution && session.institutionSlug === institution.slug) {
    return <Navigate to={next && next.startsWith('/admin/') ? next : `/admin/${institution.slug}`} replace />
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!institution) return
    setError(null)

    if (!EMAIL.test(email.trim())) {
      setError('Escribe un correo válido.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    defer(() => {
      signIn({
        email: email.trim(),
        name: displayNameFromEmail(email.trim()),
        institutionSlug: institution.slug,
      })
      setLoading(false)
      navigate(next && next.startsWith('/admin/') ? next : `/admin/${institution.slug}`, {
        replace: true,
      })
    }, 650)
  }

  return (
    <main className="app-shell relative">
      <CosmicBackground />
      <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-8">
        <GlassSurface variant="strong" className="w-full max-w-md rounded-[1.75rem] p-7">
          <p className="text-center text-xs font-bold tracking-[0.2em] text-legacy-gold uppercase">
            Acceso administrador
          </p>
          <h1 className="mt-3 text-center font-display text-3xl font-semibold text-legacy-white">
            Panel institucional
          </h1>

          {institution ? (
            <>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <InstitutionLogo
                  name={institution.name}
                  logoUrl={institution.logoUrl}
                  fallback={institution.shortName}
                  accent={institution.accent}
                  decorative
                  className="h-11 w-11 rounded-xl text-xs font-bold text-white"
                  imageClassName="rounded-lg bg-white/95 p-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-legacy-white">{institution.name}</p>
                  <p className="text-[11px] text-legacy-muted">Gestionarás solo esta institución</p>
                </div>
                <Link
                  to="/admin/login"
                  className="text-xs font-semibold text-legacy-gold hover:text-legacy-gold-soft"
                >
                  Cambiar
                </Link>
              </div>

              {session && session.institutionSlug !== institution.slug ? (
                <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100">
                  Tienes una sesión activa en otra institución. Al entrar aquí se reemplazará.
                </p>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold tracking-wide text-legacy-muted uppercase">
                    Correo
                  </span>
                  <GlassInput
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@institucion.edu"
                    className="rounded-xl px-4 py-3"
                    aria-invalid={Boolean(error && !EMAIL.test(email.trim()))}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold tracking-wide text-legacy-muted uppercase">
                    Contraseña
                  </span>
                  <GlassInput
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl px-4 py-3"
                    aria-invalid={Boolean(error && password.length < 6)}
                  />
                </label>

                {error ? (
                  <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" loading={loading}>
                  <LockKeyhole className="h-4 w-4" aria-hidden />
                  Entrar al panel
                </Button>
              </form>

              <p className="mt-4 flex items-start gap-2 rounded-xl border border-legacy-gold/20 bg-legacy-gold/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-legacy-gold-soft">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Modo demo: cualquier correo válido y una contraseña de 6+ caracteres abren el panel.
                No se envían credenciales a ningún servidor.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-center text-sm text-legacy-muted">
                Elige la institución que administras.
              </p>
              <ul className="mt-6 space-y-2">
                {DEMO_INSTITUTIONS.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/admin/login?institution=${item.slug}${next ? `&next=${encodeURIComponent(next)}` : ''}`}
                      className="glass-surface flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:border-legacy-gold/30"
                    >
                      <InstitutionLogo
                        name={item.name}
                        logoUrl={item.logoUrl}
                        fallback={item.shortName}
                        accent={item.accent}
                        decorative
                        className="h-10 w-10 rounded-xl text-xs font-bold text-white"
                        imageClassName="rounded-lg bg-white/95 p-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-legacy-white">
                          {item.name}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-legacy-muted">
                          <Building2 className="h-3 w-3" aria-hidden />
                          Espacio institucional demo
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-legacy-gold" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-6 flex justify-center">
            <Link to="/" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al inicio
            </Link>
          </div>
        </GlassSurface>
      </div>
    </main>
  )
}
