import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { cn } from '@/lib/cn'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'destructive'
  icon?: LucideIcon
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  icon: Icon = AlertTriangle,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const reduceMotion = useReducedMotion()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-5"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-legacy-black/70 backdrop-blur-[3px]"
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative w-full max-w-md"
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassSurface variant="strong" className="rounded-[1.5rem] p-6">
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                    tone === 'destructive'
                      ? 'border-red-400/30 bg-red-500/10 text-red-300'
                      : 'border-legacy-gold/30 bg-legacy-gold/10 text-legacy-gold',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2
                    id="confirm-title"
                    className="font-display text-2xl leading-tight font-semibold text-legacy-white"
                  >
                    {title}
                  </h2>
                  {description ? (
                    <div className="mt-2 text-sm leading-relaxed text-legacy-muted">
                      {description}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  ref={cancelRef}
                  type="button"
                  className="btn btn-ghost btn-md"
                  onClick={onCancel}
                  disabled={loading}
                >
                  {cancelLabel}
                </button>
                <Button
                  variant={tone === 'destructive' ? 'destructive' : 'primary'}
                  onClick={onConfirm}
                  loading={loading}
                >
                  {confirmLabel}
                </Button>
              </div>
            </GlassSurface>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
