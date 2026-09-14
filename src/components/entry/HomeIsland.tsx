import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useAuraPlayback } from '@/lib/useAuraPlayback'

type HomeIslandProps = {
  children: ReactNode
  className?: string
  panelClassName?: string
}

/** Isla de cristal con halo cónico (glow de agente, solo CSS). */
export function HomeIsland({ children, className, panelClassName }: HomeIslandProps) {
  const { live } = useAuraPlayback()

  return (
    <div className={cn('home-island', className)}>
      <div aria-hidden className={cn('home-island-halo', live && 'is-live')} />
      <div className={cn('entry-panel home-island-glass', panelClassName)}>{children}</div>
    </div>
  )
}
