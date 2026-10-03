import type { CSSProperties, ReactNode } from 'react'
import '@/styles/explore.css'
import { cn } from '@/lib/cn'

type ExploreShellProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function ExploreShell({ children, className, style }: ExploreShellProps) {
  return (
    <div className={cn('explore-shell', className)} style={style}>
      <div className="explore-scroll legacy-hidden-scroll">{children}</div>
    </div>
  )
}
