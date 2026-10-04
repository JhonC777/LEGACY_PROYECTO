import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * La palabra Legacy, siempre en Ballet (la firma de la marca).
 * El nombre accesible sigue siendo LEGACY.
 */
export function LegacyName({ className }: { className?: string }) {
  return (
    <span className={cn('legacy-name', className)}>
      <span className="sr-only">LEGACY</span>
      <span aria-hidden className="legacy-name-script">
        Legacy
      </span>
    </span>
  )
}

export function withLegacyName(text: string, className?: string): ReactNode {
  const parts = text.split(/(LEGACY|Legacy)/g)
  if (parts.length === 1) return text
  return parts.map((part, index) =>
    part === 'LEGACY' || part === 'Legacy' ? (
      <LegacyName key={index} className={className} />
    ) : (
      part
    ),
  )
}
