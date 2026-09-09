import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

type ToastTone = 'success' | 'error' | 'info'

type Toast = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

type ToastInput = Omit<Toast, 'id'>

type ToastContextValue = {
  notify: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, number>())
  const reduceMotion = useReducedMotion()

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setToasts((current) => [...current.slice(-3), { ...input, id }])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), input.tone === 'error' ? 6500 : 4200),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="admin-toast-region" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone]
            return (
              <motion.div
                key={toast.id}
                role={toast.tone === 'error' ? 'alert' : 'status'}
                className={cn('admin-toast', `is-${toast.tone}`)}
                initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                layout={!reduceMotion}
              >
                <Icon className="admin-toast-icon h-4 w-4" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-legacy-white">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-legacy-muted">
                      {toast.description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="admin-toast-close"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Cerrar aviso"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
