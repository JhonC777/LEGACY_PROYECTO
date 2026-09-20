import emblem from '@/assets/legacy-emblem.png'
import { cn } from '@/lib/cn'

type LegacyMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LegacyMark({ className, size = 'md' }: LegacyMarkProps) {
  return (
    <span className={cn('legacy-mark', `is-${size}`, className)} aria-hidden>
      <img src={emblem} alt="" width={240} height={240} />
    </span>
  )
}
