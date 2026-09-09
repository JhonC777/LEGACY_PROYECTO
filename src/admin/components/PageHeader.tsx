import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold tracking-[0.18em] text-legacy-gold uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 font-display text-[clamp(1.75rem,3vw,2.35rem)] leading-tight font-semibold text-legacy-white">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-legacy-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
