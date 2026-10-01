import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function reloadPage() {
  if (__LEGACY_SENTRY_TEST__) {
    const params = new URLSearchParams(window.location.search)
    if (params.has('sentry-test')) {
      params.delete('sentry-test')
      const search = params.toString()
      window.location.assign(
        `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`,
      )
      return
    }
  }
  window.location.reload()
}

export function SentryFallback() {
  return (
    <div
      role="alert"
      className="flex min-h-[100dvh] items-center justify-center bg-legacy-black px-6"
    >
      <div className="glass-surface flex w-full max-w-md flex-col items-center rounded-2xl px-6 py-10 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-legacy-gold/25 bg-legacy-gold/10 text-legacy-gold">
          <AlertCircle className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="font-brand text-2xl font-semibold text-legacy-white">Algo salió mal</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-legacy-muted">
          Algo salió mal. Por favor recarga la página.
        </p>
        <Button variant="primary" className="mt-6" onClick={reloadPage}>
          Recargar
        </Button>
      </div>
    </div>
  )
}
