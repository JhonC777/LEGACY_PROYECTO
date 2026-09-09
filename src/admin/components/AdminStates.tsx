import type { ReactNode } from 'react'
import { AlertCircle, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'admin-empty flex flex-col items-center justify-center rounded-2xl px-6 text-center',
        compact ? 'min-h-[180px] py-8' : 'min-h-[300px] py-12',
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-legacy-gold/25 bg-legacy-gold/10 text-legacy-gold">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="font-display text-2xl font-semibold text-legacy-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-legacy-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}

export function AdminErrorState({
  title = 'No pudimos cargar el panel',
  description = 'Ocurrió un error de demostración. Puedes intentar nuevamente.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry: () => void
}) {
  return (
    <AdminEmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={
        <Button variant="primary" onClick={onRetry}>
          Reintentar
        </Button>
      }
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('admin-skeleton', className)} aria-hidden />
}

export function AdminLoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-label="Cargando" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
