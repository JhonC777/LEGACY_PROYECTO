import { usePageMeta } from '@/lib/usePageMeta'
import { useEffect, useState, type FormEvent } from 'react'
import { KeyRound, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AdminAuthFrame } from '@/admin/components/AdminAuthFrame'
import { displayNameFromEmail, useAdminSession } from '@/admin/session'
import { Button } from '@/components/ui/Button'
import { GlassInput } from '@/components/ui/GlassInput'
import { updateAdminPassword } from '@/data/archiveRemote'
import { DEMO_INSTITUTIONS } from '@/data/demoData'
import { setKeepAdminSignedIn, supabase } from '@/lib/supabase'

export function AdminNewPassword() {
  const navigate = useNavigate()
  const { signIn } = useAdminSession()
  usePageMeta({ title: 'Nueva contraseña', noindex: true })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setReady(true)
      }
    })
    void supabase.auth.getSession().then(({ data: current }) => {
      if (current.session) setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    void (async () => {
      try {
        const email = await updateAdminPassword(password)
        const institution = DEMO_INSTITUTIONS.find((item) => item.isActive)
        if (email && institution) {
          setKeepAdminSignedIn(true)
          signIn(
            {
              email,
              name: displayNameFromEmail(email),
              institutionSlug: institution.slug,
            },
            true,
          )
          window.localStorage.setItem('legacy.admin.email', email)
          window.localStorage.removeItem('legacy.admin.password')
          window.localStorage.setItem('legacy.admin.remember', '1')
          navigate(`/admin/${institution.slug}`, { replace: true })
          return
        }
        navigate('/admin/login?institution=fe-y-alegria&restablecida=1', { replace: true })
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo cambiar la contraseña.')
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    <AdminAuthFrame
      kicker="Contraseña nueva"
      title="Elige una clave"
      backTo="/admin/login?institution=fe-y-alegria"
      backLabel="Volver al ingreso"
    >
      {ready ? (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-sm leading-relaxed text-legacy-muted">
            Esta será la clave del administrador. Mínimo 6 caracteres.
          </p>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-wide text-legacy-muted uppercase">
              Nueva contraseña
            </span>
            <span className="admin-auth-field block">
              <span className="admin-auth-field-icon" aria-hidden>
                <LockKeyhole className="h-4 w-4" />
              </span>
              <GlassInput
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-wide text-legacy-muted uppercase">
              Repetir contraseña
            </span>
            <span className="admin-auth-field block">
              <span className="admin-auth-field-icon" aria-hidden>
                <KeyRound className="h-4 w-4" />
              </span>
              <GlassInput
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </span>
          </label>
          {error ? (
            <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={loading}>
            <KeyRound className="h-4 w-4" aria-hidden />
            Guardar contraseña
          </Button>
        </form>
      ) : (
        <p className="text-sm leading-relaxed text-legacy-muted">
          Abre el enlace del correo en este mismo navegador. Si ya expiró, pide otro desde el ingreso.
        </p>
      )}
    </AdminAuthFrame>
  )
}
