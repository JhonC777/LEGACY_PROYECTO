import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { CosmicBackground } from '@/components/entry/CosmicBackground'
import { Button } from '@/components/ui/Button'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { useState } from 'react'

/** Login admin DEMO — Auth real con Supabase en etapa posterior */
export function AdminLogin() {
  const [params] = useSearchParams()
  const institution = params.get('institution')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    window.setTimeout(() => {
      setLoading(false)
      setMessage(
        'Demo: el acceso administrativo se conectará con Supabase Auth. No se enviaron credenciales.',
      )
    }, 700)
  }

  return (
    <main className="app-shell relative">
      <CosmicBackground />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <GlassSurface variant="strong" className="w-full max-w-md rounded-[1.75rem] p-7">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-legacy-gold">
            Acceso administrador
          </p>
          <h1 className="mt-3 text-center font-display text-3xl text-legacy-white">
            Panel institucional
          </h1>
          <p className="mt-2 text-center text-sm text-legacy-muted">
            Formulario de demostración.
            {institution ? (
              <>
                {' '}
                Institución:{' '}
                <span className="text-legacy-gold-soft">{institution}</span>
              </>
            ) : null}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold tracking-wide text-legacy-muted uppercase">
                Correo
              </span>
              <GlassInput
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@institucion.edu"
                className="rounded-xl px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold tracking-wide text-legacy-muted uppercase">
                Contraseña
              </span>
              <GlassInput
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="rounded-xl px-4 py-3"
              />
            </label>
            <Button type="submit" className="w-full" loading={loading}>
              Entrar al panel
            </Button>
          </form>

          {message ? (
            <p className="mt-4 rounded-xl border border-legacy-gold/25 bg-legacy-gold/10 px-3 py-3 text-center text-xs leading-relaxed text-legacy-gold-soft">
              {message}
            </p>
          ) : null}

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
