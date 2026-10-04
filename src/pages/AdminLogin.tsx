import { usePageMeta } from '@/lib/usePageMeta'
import { useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeftRight, ArrowRight, Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AdminAuthFrame } from '@/admin/components/AdminAuthFrame'
import { displayNameFromEmail, useAdminSession } from '@/admin/session'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { Button } from '@/components/ui/Button'
import { GlassInput } from '@/components/ui/GlassInput'
import { DEMO_INSTITUTIONS, getInstitutionBySlug } from '@/data/demoData'
import { sendAdminPasswordReset, signInInstitutionAdmin } from '@/data/archiveRemote'
import { cn } from '@/lib/cn'
import { safeAdminNext } from '@/admin/safeNext'
import { setKeepAdminSignedIn, supabaseConfigured } from '@/lib/supabase'

const REMEMBER_KEY = 'legacy.admin.remember'
const EMAIL_KEY = 'legacy.admin.email'
const PASSWORD_KEY = 'legacy.admin.password'

function readRemembered() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(PASSWORD_KEY)
  if (typeof window === 'undefined' || window.localStorage.getItem(REMEMBER_KEY) !== '1') {
    return { email: '', remember: false }
  }
  return {
    email: window.localStorage.getItem(EMAIL_KEY) ?? '',
    remember: true,
  }
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AuthField({
  label,
  icon,
  trailing,
  children,
}: {
  label: string
  icon: ReactNode
  trailing?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="auth-celestial-label">{label}</span>
      <span className="admin-auth-field block">
        <span className="admin-auth-field-icon" aria-hidden>
          {icon}
        </span>
        {children}
        {trailing}
      </span>
    </label>
  )
}

function SwitchRow({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  title: string
  hint: string
}) {
  return (
    <label className="admin-auth-switch">
      <span>
        <span className="admin-auth-switch-title">{title}</span>
        <span className="admin-auth-switch-hint">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={cn('admin-auth-switch-track', checked && 'is-on')} aria-hidden>
        <span className="admin-auth-switch-knob" />
      </span>
    </label>
  )
}

/**
 * Login administrativo.
 * Con Supabase exige la cuenta del administrador de la institución.
 * Sin Supabase, cualquier correo válido y una clave de 6+ caracteres abren el panel demo.
 */
export function AdminLogin() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { session, signIn } = useAdminSession()

  const requestedSlug = params.get('institution') ?? ''
  const next = safeAdminNext(params.get('next'))
  const institution = getInstitutionBySlug(requestedSlug)
  usePageMeta({ title: 'Acceso de administradores', noindex: true })

  const remembered = readRemembered()
  const [email, setEmail] = useState(remembered.email)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(remembered.remember)
  // Apagado por defecto: el acceso suele hacerse en equipos compartidos (eventos, salas).
  const [keepSession, setKeepSession] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [notice, setNotice] = useState<string | null>(
    params.get('restablecida') === '1' ? 'Contraseña actualizada. Ya puedes entrar.' : null,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session && institution && session.institutionSlug === institution.slug) {
    return <Navigate to={next ?? `/admin/${institution.slug}`} replace />
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
    void (async () => {
      try {
        setKeepAdminSignedIn(keepSession)
        window.localStorage.removeItem(PASSWORD_KEY)
        if (remember) {
          window.localStorage.setItem(REMEMBER_KEY, '1')
          window.localStorage.setItem(EMAIL_KEY, email.trim())
        } else {
          window.localStorage.removeItem(REMEMBER_KEY)
          window.localStorage.removeItem(EMAIL_KEY)
        }
        if (supabaseConfigured) {
          await signInInstitutionAdmin(email.trim(), password, institution.id)
        }
        signIn(
          {
            email: email.trim(),
            name: displayNameFromEmail(email.trim()),
            institutionSlug: institution.slug,
          },
          keepSession,
        )
        navigate(next ?? `/admin/${institution.slug}`, {
          replace: true,
        })
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo entrar al panel.')
      } finally {
        setLoading(false)
      }
    })()
  }

  const sendReset = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!EMAIL.test(email.trim())) {
      setError('Escribe el correo del administrador.')
      return
    }
    setLoading(true)
    void sendAdminPasswordReset(email.trim())
      .then(() => {
        setNotice(`Te enviamos un enlace a ${email.trim()}. Ábrelo y elige la clave nueva.`)
        setForgot(false)
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'No se pudo enviar el correo.')
      })
      .finally(() => setLoading(false))
  }

  const fade = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }

  // Medallón: el logo de la institución encabeza la tarjeta (celular y escritorio).
  const institutionLead = institution ? (
    <div className="auth-medallion-block">
      <span className="auth-medallion">
        <span className="auth-medallion-glass">
          <InstitutionLogo
            name={institution.name}
            logoUrl={institution.logoUrl}
            fallback={institution.shortName}
            accent={institution.accent}
            className="auth-medallion-logo font-bold"
          />
        </span>
      </span>
      <p className="auth-medallion-name">{institution.name}</p>
      <p className="auth-medallion-meta">
        <span>Solo esta institución</span>
        <Link to="/admin/login" className="btn btn-ghost btn-sm auth-tap44" aria-label="Cambiar de institución">
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
          Cambiar
        </Link>
      </p>
    </div>
  ) : null

  // El selector solo lista instituciones activas (oculta los marcadores de demostración).
  const selectable = DEMO_INSTITUTIONS.filter((item) => item.isActive)

  return (
    <AdminAuthFrame
      kicker="Acceso administrador"
      title="Panel institucional"
      lead={institutionLead}
    >
      {institution ? (
        <>
          {session && session.institutionSlug !== institution.slug ? (
            <p className="mb-3 rounded-2xl border border-legacy-gold/30 bg-legacy-gold/10 px-3 py-2.5 text-sm leading-relaxed text-legacy-gold-soft">
              Tienes una sesión activa en otra institución. Al entrar aquí se reemplazará.
            </p>
          ) : null}

          <AnimatePresence mode="wait" initial={false}>
            {forgot ? (
              <motion.form
                key="forgot"
                {...fade}
                transition={{ duration: 0.22 }}
                className="space-y-4"
                onSubmit={sendReset}
                noValidate
              >
                <div>
                  <p className="font-brand text-2xl font-semibold text-legacy-white">Recuperar acceso</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-legacy-muted">
                    Te llega un correo con un enlace para elegir otra contraseña.
                  </p>
                </div>
                <AuthField label="Correo" icon={<Mail className="h-4 w-4" />}>
                  <GlassInput
                    type="email"
                    name="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@institucion.edu"
                    aria-invalid={Boolean(error && !EMAIL.test(email.trim()))}
                  />
                </AuthField>
                <Status notice={notice} error={error} />
                <Button type="submit" className="w-full" loading={loading}>
                  Enviar enlace
                </Button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm auth-tap44 w-full"
                  onClick={() => {
                    setForgot(false)
                    setError(null)
                  }}
                >
                  Volver al ingreso
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="login"
                {...fade}
                transition={{ duration: 0.22 }}
                className="space-y-4"
                onSubmit={handleSubmit}
                noValidate
              >
                <AuthField label="Correo" icon={<Mail className="h-4 w-4" />}>
                  <GlassInput
                    type="email"
                    name="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@institucion.edu"
                    aria-invalid={Boolean(error && !EMAIL.test(email.trim()))}
                  />
                </AuthField>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="auth-celestial-label">Contraseña</span>
                    {supabaseConfigured ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm auth-tap44 -mt-2"
                        onClick={() => {
                          setForgot(true)
                          setError(null)
                          setNotice(null)
                        }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    ) : null}
                  </div>
                  <span className="admin-auth-field block">
                    <span className="admin-auth-field-icon" aria-hidden>
                      <LockKeyhole className="h-4 w-4" />
                    </span>
                    <GlassInput
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Tu contraseña"
                      aria-invalid={Boolean(error && password.length < 6)}
                    />
                    <button
                      type="button"
                      className="admin-auth-reveal"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <SwitchRow
                    checked={remember}
                    onChange={setRemember}
                    title="Recordar correo"
                    hint="Solo el correo queda escrito la próxima vez, en este navegador"
                  />
                  <SwitchRow
                    checked={keepSession}
                    onChange={setKeepSession}
                    title="Mantener inicio de sesión"
                    hint="No pide la clave otra vez al cerrar el navegador"
                  />
                </div>

                <Status notice={notice} error={error} />

                <Button type="submit" className="w-full" loading={loading}>
                  <LockKeyhole className="h-4 w-4" aria-hidden />
                  Entrar al panel
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="admin-auth-note mt-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {supabaseConfigured
              ? 'Usa el correo y la contraseña del administrador de esta institución.'
              : 'Modo demostración en este navegador: el archivo remoto no está conectado.'}
          </p>
        </>
      ) : (
        <>
          <p className="auth-celestial-intro">Elige la institución que administras.</p>
          <ul className="auth-celestial-list">
            {selectable.map((item) => (
              <li key={item.id} className="min-w-0">
                <Link
                  to={`/admin/login?institution=${item.slug}${next ? `&next=${encodeURIComponent(next)}` : ''}`}
                  className="auth-celestial-option"
                >
                  <span className="auth-celestial-option-logo" aria-hidden>
                    <span>
                      <InstitutionLogo
                        name={item.name}
                        logoUrl={item.logoUrl}
                        fallback={item.shortName}
                        accent={item.accent}
                        decorative
                        className="text-sm font-bold"
                      />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="auth-celestial-option-name">{item.name}</span>
                    <span className="auth-celestial-option-meta">
                      <Building2 className="h-3.5 w-3.5" aria-hidden />
                      Espacio institucional
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-legacy-gold" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminAuthFrame>
  )
}

function Status({ notice, error }: { notice: string | null; error: string | null }) {
  if (notice) {
    return (
      <p className="rounded-2xl border border-legacy-gold/30 bg-legacy-gold/10 px-3 py-2.5 text-sm text-legacy-gold-soft">
        {notice}
      </p>
    )
  }
  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
        {error}
      </p>
    )
  }
  return null
}
