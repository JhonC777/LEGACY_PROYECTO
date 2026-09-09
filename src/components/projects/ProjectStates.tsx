import type { ReactNode } from 'react'
import { AlertCircle, FolderOpen, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ProjectsLoading() {
  return (
    <div
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-label="Cargando proyectos"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-legacy-surface/50"
        >
          <div className="aspect-[16/10] bg-white/[0.04]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
            <div className="h-6 w-4/5 rounded bg-white/[0.06]" />
            <div className="h-4 w-full rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProjectsEmpty() {
  return (
    <StateCard
      icon={FolderOpen}
      title="El archivo todavía está vacío"
      description="Cuando existan proyectos publicados para esta institución, aparecerán aquí."
    />
  )
}

export function ProjectsNoResults({
  onClear,
  suggestions = [],
  onSuggestion,
}: {
  onClear: () => void
  suggestions?: string[]
  onSuggestion?: (suggestion: string) => void
}) {
  return (
    <StateCard
      icon={SearchX}
      title="No encontramos coincidencias"
      description="Prueba otra búsqueda, explora una de estas áreas o elimina los filtros activos."
      actionLabel="Limpiar filtros"
      onAction={onClear}
    >
      {suggestions.length > 0 && onSuggestion ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Áreas sugeridas">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chip-liquid"
              onClick={() => onSuggestion(suggestion)}
            >
              Explorar {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </StateCard>
  )
}

export function ProjectsError({ onRetry }: { onRetry: () => void }) {
  return (
    <StateCard
      icon={AlertCircle}
      title="No pudimos cargar los proyectos"
      description="Ocurrió un error de demostración. Puedes intentar nuevamente."
      actionLabel="Reintentar"
      onAction={onRetry}
    />
  )
}

type StateCardProps = {
  icon: typeof FolderOpen
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

function StateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: StateCardProps) {
  return (
    <div className="glass-surface flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-dashed px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-legacy-gold/25 bg-legacy-gold/10 text-legacy-gold">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="font-display text-2xl font-semibold text-legacy-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-legacy-muted">
        {description}
      </p>
      {children}
      {actionLabel && onAction ? (
        <Button variant="primary" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
