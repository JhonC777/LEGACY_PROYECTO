import type { ElementType } from 'react'
import { cn } from '@/lib/cn'

type LegacyWordmarkProps = {
  className?: string
  as?: ElementType
  size?: 'nav' | 'display'
}

/**
 * Wordmark en Ballet. El nombre accesible sigue siendo LEGACY;
 * el glifo visible es la firma «Legacy».
 */
export function LegacyWordmark({
  className,
  as: Tag = 'span',
  size = 'nav',
}: LegacyWordmarkProps) {
  return (
    <Tag className={cn('legacy-wordmark', `is-${size}`, className)}>
      <span className="sr-only">LEGACY</span>
      <span aria-hidden className="legacy-wordmark-script">
        Legacy
      </span>
    </Tag>
  )
}
