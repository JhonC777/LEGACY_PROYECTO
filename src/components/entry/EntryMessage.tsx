import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

type EntryMessageProps = {
  quoteDelay?: number
  welcomeDelay?: number
  align?: 'center' | 'start'
  awakened?: boolean
  actions?: ReactNode
}

const EASE = [0.22, 1, 0.36, 1] as const

export function EntryMessage({
  quoteDelay = 0.46,
  welcomeDelay = 0.62,
  align = 'center',
  awakened = true,
  actions,
}: EntryMessageProps) {
  const reduceMotion = useReducedMotion()
  const start = align === 'start'

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {
          initial: { opacity: awakened ? 1 : 0 },
          animate: { opacity: awakened ? 1 : 0 },
        }
      : {
          initial: { opacity: 0, y: 14 },
          animate: awakened ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
          transition: {
            duration: 0.85,
            delay: awakened ? delay : 0,
            ease: EASE,
          },
        }

  return (
    <div
        className={cn(
          'mt-7 space-y-5 lg:mt-10 lg:space-y-7',
          start
            ? 'mx-auto max-w-lg text-center lg:mx-0 lg:max-w-[38rem] lg:text-left'
            : 'mx-auto max-w-lg text-center',
        )}
    >
      <motion.blockquote {...fadeUp(quoteDelay)} className="home-quote">
        <p>
          Donde el conocimiento
          <br />
          <span className="home-quote-accent">deja legado.</span>
        </p>
      </motion.blockquote>

      <motion.p
        {...fadeUp(welcomeDelay)}
        className={cn(
          'home-welcome',
          start ? 'mx-auto max-w-md lg:mx-0 lg:max-w-lg' : 'mx-auto max-w-md',
        )}
      >
        El conocimiento de cada generación merece permanecer. LEGACY es la
        plataforma donde cada institución educativa preserva, organiza y exhibe
        los proyectos de grado de sus estudiantes.
      </motion.p>

      {actions ? (
        <motion.div
          {...fadeUp(welcomeDelay + 0.12)}
          className={cn(
            'home-hero-actions',
            start ? 'justify-center lg:justify-start' : 'justify-center',
          )}
        >
          {actions}
        </motion.div>
      ) : null}
    </div>
  )
}
