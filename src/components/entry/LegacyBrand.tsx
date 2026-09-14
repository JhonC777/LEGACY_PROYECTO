import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

type LegacyBrandProps = {
  markDelay?: number
  titleDelay?: number
  align?: 'center' | 'start'
  awakened?: boolean
}

const EASE = [0.22, 1, 0.36, 1] as const

/** Marca editorial del Home — sello de observatorio / casa de archivos. */
export function LegacyBrand({
  markDelay = 0.12,
  titleDelay = 0.28,
  align = 'center',
  awakened = true,
}: LegacyBrandProps) {
  const reduceMotion = useReducedMotion()
  const start = align === 'start'

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {
          initial: { opacity: awakened ? 1 : 0 },
          animate: { opacity: awakened ? 1 : 0 },
        }
      : {
          initial: { opacity: 0, y: 16 },
          animate: awakened ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
          transition: {
            duration: 0.9,
            delay: awakened ? delay : 0,
            ease: EASE,
          },
        }

  return (
    <div
      className={cn(
        'flex flex-col',
        start ? 'items-center text-center lg:items-start lg:text-left' : 'items-center text-center',
      )}
    >
      <motion.div {...fadeUp(markDelay)} className="archive-mark mb-5 lg:mb-8">
        <span aria-hidden className="archive-mark-glow absolute inset-[-56%] rounded-full" />
        <span aria-hidden className="archive-mark-orbit is-outer" />
        <span aria-hidden className="archive-mark-orbit is-elliptic" />
        <span aria-hidden className="archive-mark-tick" />
        <span className="archive-mark-frame relative flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full lg:h-[5.15rem] lg:w-[5.15rem]">
          <span
            aria-hidden
            className="absolute inset-[7px] rounded-full border border-legacy-gold/25"
          />
          <span
            aria-hidden
            className="absolute inset-[13px] rounded-full border border-legacy-gold/12"
          />
          <span className="relative font-display text-[1.7rem] font-semibold tracking-[0.12em] text-legacy-gold-soft lg:text-[2.25rem]">
            L
          </span>
        </span>
      </motion.div>

      <motion.p
        {...fadeUp(markDelay + 0.08)}
        className="home-brand-kicker mb-2.5 lg:mb-3"
      >
        Archivo académico institucional
      </motion.p>

      <motion.h1 {...fadeUp(titleDelay)} className="home-brand-title">
        LEGACY
      </motion.h1>

      <motion.div
        {...fadeUp(titleDelay + 0.1)}
        aria-hidden
        className={cn('archive-rule mt-5 lg:mt-7', start && 'is-start')}
      >
        <span className="archive-rule-line" />
        <span className="archive-rule-diamond" />
        <span className="archive-rule-line" />
      </motion.div>
    </div>
  )
}
