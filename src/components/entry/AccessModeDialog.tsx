import { useEffect } from 'react'
import { ArrowLeft, LockKeyhole, UserRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { Institution } from '@/data/mockInstitutions'

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
    const previous = document.body.style.overflow
    document.body.classList.add('legacy-modal-open')
    return () => {
      document.body.classList.remove('legacy-modal-open')
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && institution ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-legacy-black/75 backdrop-blur-[4px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-dialog-title"
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <GlassSurface variant="strong" className="rounded-[1.75rem] p-7 lg:p-8">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-legacy-gold/35 bg-legacy-black/45 shadow-[inset_0_0_20px_rgb(214_184_120_/_0.08)]">
                  <span
                    className="font-display text-2xl font-semibold text-legacy-gold"
                    aria-hidden
                  >
                    {institution.name.slice(0, 1)}
                  </span>
                </div>
                <h2
                  id="access-dialog-title"
                  className="font-display text-3xl font-semibold text-legacy-white"
                >
                  {institution.name}
                </h2>
                <p className="mt-1.5 text-sm text-legacy-muted">
                  Legado académico institucional
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onGuestAccess(institution)}
                  className="glass-surface-gold flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-legacy-gold/30 bg-legacy-black/30">
                    <UserRound className="h-5 w-5 text-legacy-gold" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-legacy-white">
                      Acceder como invitado
                    </span>
                    <span className="block text-xs text-legacy-muted">
                      Explorar el legado público
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onAdminAccess(institution)}
                  className="glass-surface flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-colors hover:border-legacy-gold/30"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-legacy-border bg-legacy-black/40">
                    <LockKeyhole className="h-5 w-5 text-legacy-muted" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-legacy-white">
                      Acceder como administrador
                    </span>
                    <span className="block text-xs text-legacy-muted">
                      Gestión institucional
                    </span>
                  </span>
                </button>
              </div>

              <Button variant="ghost" className="mt-6 w-full" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Cambiar institución
              </Button>
            </GlassSurface>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
