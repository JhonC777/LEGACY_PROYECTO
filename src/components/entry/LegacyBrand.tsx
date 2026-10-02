import type { CSSProperties } from 'react'
import { LegacyMark } from '@/components/brand/LegacyMark'
import { LegacyWordmark } from '@/components/brand/LegacyWordmark'
import { cn } from '@/lib/cn'
import { LEGACY_SLOGAN } from '@/lib/brand'
import { riseStyle } from '@/lib/rise'

type LegacyBrandProps = {
  markDelay?: number
  titleDelay?: number
  align?: 'center' | 'start'
  awakened?: boolean
}

/** Marca editorial del Home — sello de observatorio / casa de archivos. */
export function LegacyBrand({
  markDelay = 0.12,
  titleDelay = 0.28,
  align = 'center',
  awakened = true,
}: LegacyBrandProps) {
  const start = align === 'start'
  const rise = (delay: number): CSSProperties => riseStyle(awakened ? delay : 0, 0.9, 16)

  return (
    <div
      className={cn(
        'flex flex-col',
        start ? 'items-center text-center lg:items-start lg:text-left' : 'items-center text-center',
      )}
    >
      <div
        style={rise(markDelay)}
        className={cn('legacy-rise archive-mark mb-4 lg:mb-[clamp(0.65rem,2vh,1.35rem)]', !awakened && 'is-dormant')}
      >
        <span aria-hidden className="archive-mark-glow absolute inset-[-42%] rounded-full" />
        <LegacyMark size="lg" />
      </div>

      <p
        style={rise(markDelay + 0.08)}
        className={cn('legacy-rise home-brand-kicker', !awakened && 'is-dormant')}
      >
        Archivo académico institucional
      </p>

      <div className="home-brand-stack">
        <h1 style={rise(titleDelay)} className={cn('legacy-rise home-brand-title', !awakened && 'is-dormant')}>
          <LegacyWordmark as="span" size="display" />
        </h1>

        <div
          style={rise(titleDelay + 0.1)}
          aria-hidden
          className={cn(
            'legacy-rise archive-rule home-brand-rule',
            start && 'is-start',
            !awakened && 'is-dormant',
          )}
        >
          <span className="archive-rule-line" />
          <span className="archive-rule-diamond" />
          <span className="archive-rule-line" />
        </div>

        <p
          style={rise(titleDelay + 0.16)}
          className={cn('legacy-rise home-brand-slogan', !awakened && 'is-dormant')}
        >
          {LEGACY_SLOGAN}
        </p>
      </div>
    </div>
  )
}
