import type { CSSProperties, ReactNode } from 'react'
import { LivingField } from '@/components/atmosphere/LivingField'
import { cn } from '@/lib/cn'

type ExploreShellProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function ExploreShell({ children, className, style }: ExploreShellProps) {
  return (
    <div className={cn('explore-shell', className)} style={style}>
      <LivingField variant="page" />
      <div className="explore-scroll legacy-hidden-scroll">{children}</div>
    </div>
  )
}
