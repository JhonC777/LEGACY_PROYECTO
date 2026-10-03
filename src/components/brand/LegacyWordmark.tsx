import { useId, type ElementType } from 'react'
import { cn } from '@/lib/cn'

type LegacyWordmarkProps = {
  className?: string
  as?: ElementType
  size?: 'nav' | 'display'
}

export function LegacyWordmark({
  className,
  as: Tag = 'span',
  size = 'nav',
}: LegacyWordmarkProps) {
  const metalId = `legacy-metal-${useId().replace(/:/g, '')}`

  return (
    <Tag className={cn('legacy-wordmark', `is-${size}`, className)}>
      <span className="sr-only">LEGACY</span>
      <span aria-hidden className="legacy-wordmark-glyphs">
        <span>L</span>
        <span>E</span>
        <span>G</span>
        <span className="legacy-wordmark-a">
          <svg viewBox="0 0 70 100" className="legacy-wordmark-a-svg">
            <defs>
              <linearGradient id={metalId} x1="0" y1="0" x2="0.2" y2="1">
                <stop offset="0%" stopColor="#f7f3ea" />
                <stop offset="42%" stopColor="#dcd6ca" />
                <stop offset="100%" stopColor="#b7aa92" />
              </linearGradient>
            </defs>
            <path
              d="M35 4 L7 96"
              stroke={`url(#${metalId})`}
              strokeWidth="8.2"
              fill="none"
              strokeLinecap="butt"
            />
            <path
              d="M35 4 L63 96"
              stroke={`url(#${metalId})`}
              strokeWidth="8.2"
              fill="none"
              strokeLinecap="butt"
            />
            <path d="M35 46 L40.2 54 L35 62 L29.8 54 Z" fill="#d6b878" />
          </svg>
        </span>
        <span>C</span>
        <span>Y</span>
      </span>
    </Tag>
  )
}
