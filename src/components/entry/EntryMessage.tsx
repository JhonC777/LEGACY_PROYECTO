import type { ReactNode } from 'react'
import { withLegacyName } from '@/components/brand/LegacyName'
import { cn } from '@/lib/cn'
import { riseStyle } from '@/lib/rise'

type EntryMessageProps = {
  quoteDelay?: number
  welcomeDelay?: number
  align?: 'center' | 'start'
  awakened?: boolean
  actions?: ReactNode
}

export function EntryMessage({
  quoteDelay = 0.46,
  welcomeDelay = 0.62,
  align = 'center',
  awakened = true,
  actions,
}: EntryMessageProps) {
  const start = align === 'start'
  const rise = (delay: number) => riseStyle(awakened ? delay : 0, 0.85, 14)
  const dormant = !awakened && 'is-dormant'

  return (
    <div
        className={cn(
          'mt-5 space-y-4 lg:mt-[clamp(0.7rem,2.2vh,1.55rem)] lg:space-y-5',
          start
            ? 'mx-auto max-w-lg text-center lg:mx-0 lg:max-w-[38rem] lg:text-left'
            : 'mx-auto max-w-lg text-center',
        )}
    >
      <blockquote style={rise(quoteDelay)} className={cn('legacy-rise home-quote', dormant)}>
        <p>
          Donde el conocimiento
          <br />
          <span className="home-quote-accent">deja legado.</span>
        </p>
      </blockquote>

      <p
        style={rise(welcomeDelay)}
        className={cn(
          'legacy-rise home-welcome',
          dormant,
          start ? 'mx-auto max-w-md lg:mx-0 lg:max-w-lg' : 'mx-auto max-w-md',
        )}
      >
        {withLegacyName(
          'El conocimiento de cada generación merece permanecer. LEGACY es la plataforma donde cada institución educativa preserva, organiza y exhibe los proyectos de grado de sus estudiantes.',
        )}
      </p>

      {actions ? (
        <div
          style={rise(welcomeDelay + 0.12)}
          className={cn(
            'legacy-rise home-hero-actions',
            dormant,
            start ? 'justify-center lg:justify-start' : 'justify-center',
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}
