import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type GlassBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
}

export function GlassBadge({ className, children, ...props }: GlassBadgeProps) {
  return (
    <span className={cn('glass-badge', className)} {...props}>
      {children}
    </span>
  )
}
