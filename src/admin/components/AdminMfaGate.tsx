import { useEffect, useState, type FormEvent } from 'react'
import { LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Props = {
  mode: 'setup' | 'challenge'
  onComplete: () => void
  onSignOut: () => void
}

export function AdminMfaGate({ mode, onComplete, onSignOut }: Props) {
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(mode === 'challenge')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode !== 'challenge' || !supabase) return
    let active = true
    void (async () => {
      try {
        const { data, error: factorsError } = await supabase.auth.mfa.listFactors()
        if (factorsError) throw factorsError
        const factor = data.totp.find((item) => item.status === 'verified')
        if (!factor) throw new Error('No verified factor')
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factor.id,
        })
        if (challengeError) throw challengeError
        if (active) {
          setFactorId(factor.id)
          setChallengeId(challenge.id)
        }
      } catch {
        if (active) setError('No se pudo iniciar la verificación. Inténtalo de nuevo.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [mode])

  const startSetup = async () => {
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'LEGACY Admin',
      })
      if (enrollError) throw enrollError
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      })
      if (challengeError) throw challengeError
      setChallengeId(challenge.id)
    } catch {
      setError('No se pudo configurar el autenticador. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const verify = (event: FormEvent) => {
    event.preventDefault()
    if (!supabase || !factorId || !challengeId || !/^\\d{6}$/.test(code)) {
      setError('Introduce el código de seis dígitos de tu aplicación autenticadora.')
      return
    }
    setBusy(true)
    setError('')
    void (async () => {
      try {
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code,
        })
        if (verifyError) throw verifyError
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) throw refreshError
        onComplete()
      } catch {
        setError('El código no es válido o ha caducado. Comprueba tu autenticador e inténtalo otra vez.')
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-legacy-black px-4 py-10 text-legacy-white">
      <section className="admin-card w-full max-w-lg p-6 sm:p-8" aria-labelledby="mfa-title">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-legacy-gold/30 bg-legacy-gold/10 text-legacy-gold">
          {mode === 'setup' ? <ShieldCheck className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-legacy-gold">Seguridad de LEGACY</p>
        <h1 id="mfa-title" className="mt-2 font-brand text-2xl font-semibold">
          {mode === 'setup' ? 'Activa la verificación en dos pasos' : 'Confirma tu identidad'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-legacy-muted">
          {mode === 'setup'
            ? 'El panel requiere una aplicación autenticadora para proteger los datos institucionales.'
            : 'Introduce el código temporal generado por tu aplicación autenticadora para continuar.'}
        </p>

        {mode === 'setup' && !factorId ? (
          <button type="button" className="btn btn-primary btn-md mt-6 w-full" onClick={startSetup} disabled={busy}>
            <Smartphone className="h-4 w-4" aria-hidden />
            {busy ? 'Preparando…' : 'Configurar autenticador'}
          </button>
        ) : null}

        {qrCode ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white p-4 text-center">
            <img src={qrCode} alt="Código QR para configurar el autenticador" className="mx-auto h-48 w-48" />
            <p className="mt-3 text-xs text-slate-700">Escanea el código con Google Authenticator, Microsoft Authenticator o una aplicación TOTP compatible.</p>
            <p className="mt-3 break-all rounded-lg bg-slate-100 p-3 text-left font-mono text-xs text-slate-800">
              Clave manual: {secret}
            </p>
          </div>
        ) : null}

        {mode === 'challenge' && loading ? (
          <p className="mt-6 text-sm text-legacy-muted">Preparando verificación segura…</p>
        ) : null}

        {(mode === 'challenge' && !loading && challengeId) || (mode === 'setup' && challengeId) ? (
          <form className="mt-6 space-y-4" onSubmit={verify}>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-legacy-muted">Código de 6 dígitos</span>
              <input
                className="glass-input liquid-field w-full rounded-xl px-4 py-3 text-center font-mono text-xl tracking-[0.35em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\\D/g, '').slice(0, 6))}
                aria-label="Código de verificación"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-md w-full" disabled={busy || code.length !== 6}>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {busy ? 'Verificando…' : mode === 'setup' ? 'Activar y continuar' : 'Verificar y entrar'}
            </button>
          </form>
        ) : null}

        {error ? <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
        <button type="button" className="btn btn-ghost btn-sm mt-5 w-full" onClick={onSignOut}>
          Cerrar sesión
        </button>
      </section>
    </main>
  )
}
