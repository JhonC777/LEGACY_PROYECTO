import { LegacyName } from '@/components/brand/LegacyName'
import { AlertCircle } from 'lucide-react'

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
      className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-[#08090C] px-4 py-8 text-[#F7F5EF] sm:px-8"
    >
      <div className="flex w-full max-w-[28rem] flex-col items-center rounded-2xl border border-white/10 bg-[#0C0E14] px-6 py-8 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D6B878]/15 text-[#D6B878]">
          <AlertCircle className="h-6 w-6" aria-hidden />
        </span>
        <p className="font-brand text-sm font-semibold tracking-[0.22em] text-[#F7F5EF] uppercase">
          <LegacyName />
        </p>
        <h1 className="mt-4 font-brand text-[1.75rem] leading-tight font-semibold text-[#F7F5EF] sm:text-[2rem]">
          Algo salió mal
        </h1>
        <p className="mt-4 font-display text-xl leading-snug text-[#F7F5EF] italic">
          Donde el conocimiento deja legado.
        </p>
        <p className="mt-4 max-w-sm font-sans text-base leading-relaxed text-[#C8CAD3]">
          Algo salió mal. Por favor recarga la página.
        </p>
        <div className="mt-8 flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={reloadPage}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#D6B878] px-6 font-sans text-base font-semibold text-[#08090C] transition-colors hover:brightness-110 active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#D6B878] motion-reduce:transition-none"
          >
            Recargar
          </button>
          <a
            href="/"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#D6B878] bg-transparent px-6 font-sans text-base font-semibold text-[#D6B878] transition-colors hover:bg-[#D6B878]/10 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#D6B878] motion-reduce:transition-none"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
