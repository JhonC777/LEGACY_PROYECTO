import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, LockKeyhole, UserRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import type { Institution } from '@/data/mockInstitutions'
import { HomeIsland } from './HomeIsland'

type AccessModeDialogProps = {
  institution: Institution | null
  open: boolean
  onClose: () => void
  onGuestAccess: (institution: Institution) => void
  onAdminAccess: (institution: Institution) => void
}

export function AccessModeDialog({
  institution,
  open,
  onClose,
  onGuestAccess,
  onAdminAccess,
}: AccessModeDialogProps) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    document.body.classList.add('legacy-modal-open')

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.classList.remove('legacy-modal-open')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && institution ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.32 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="access-threshold-veil absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-dialog-title"
            aria-describedby="access-dialog-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[26.5rem]"
          >
            <HomeIsland panelClassName="access-threshold max-h-[min(36rem,calc(100dvh-2rem))] overflow-y-auto p-6 sm:p-8">
              <div className="relative mb-7 text-center">
                <p className="home-threshold-kicker mb-5">Acceso</p>
                <InstitutionLogo
                  name={institution.name}
                  logoUrl={institution.logoUrl}
                  fallback={institution.name.slice(0, 1)}
                  decorative
                  className="mx-auto mb-4 h-14 w-14 rounded-2xl border border-legacy-gold/35 bg-legacy-black/45 text-2xl text-legacy-gold shadow-[inset_0_0_20px_rgb(214_184_120_/_0.08)]"
                  imageClassName="rounded-xl bg-white/95 p-1.5"
                />
                <h2
                  id="access-dialog-title"
                  className="font-display text-[1.75rem] leading-tight font-semibold tracking-[0.02em] text-legacy-white sm:text-[2rem]"
                >
                  {institution.name}
                </h2>
                {institution.isPilot ? (
                  <span className="mt-2.5 inline-flex rounded-full border border-legacy-gold/45 bg-legacy-gold/10 px-2 py-0.5 text-[9px] font-semibold tracking-[0.16em] text-legacy-gold uppercase">
                    Institución piloto
                  </span>
                ) : null}
                <p
                  id="access-dialog-copy"
                  className="mt-3 text-sm leading-relaxed text-legacy-muted"
                >
                  Cómo entrar. Los invitados consultan el archivo publicado, sin cuenta.
                </p>
              </div>

              <div className="relative space-y-2.5">
                <button
                  type="button"
                  onClick={() => onGuestAccess(institution)}
                  className="access-mode-option is-guest flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-legacy-gold/30 bg-legacy-black/30">
                    <UserRound className="h-5 w-5 text-legacy-gold" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-legacy-white">
                      Entrar como invitado
                    </span>
                    <span className="mt-0.5 block text-xs text-legacy-muted">
                      Consulta el archivo publicado, sin iniciar sesión.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onAdminAccess(institution)}
                  className="access-mode-option flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-legacy-border bg-legacy-black/40">
                    <LockKeyhole className="h-5 w-5 text-legacy-muted" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-legacy-white">
                      Entrar como administrador
                    </span>
                    <span className="mt-0.5 block text-xs text-legacy-muted">
                      Custodia y publica los proyectos de esta institución.
                    </span>
                  </span>
                </button>
              </div>

              <button type="button" className="home-explore-link mt-6" onClick={onClose}>
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Cambiar de institución
              </button>
            </HomeIsland>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
