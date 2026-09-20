import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** The word LEGACY in the brand inscription face (Cinzel). */
export function LegacyName({ className }: { className?: string }) {
  return <span className={cn('legacy-name', className)}>LEGACY</span>
}

export function withLegacyName(text: string, className?: string): ReactNode {
  const parts = text.split(/(LEGACY)/g)
  if (parts.length === 1) return text
  return parts.map((part, index) =>
    part === 'LEGACY' ? <LegacyName key={index} className={className} /> : part,
  )
}
