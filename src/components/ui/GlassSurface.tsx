import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type GlassSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'strong' | 'gold'
  as?: 'div' | 'section' | 'aside' | 'article'
  children?: ReactNode
}

export function GlassSurface({
  variant = 'default',
  as: Tag = 'div',
  className,
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <Tag
      className={cn(
        'glass-surface',
        variant === 'strong' && 'glass-surface-strong',
        variant === 'gold' && 'glass-surface-gold',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
