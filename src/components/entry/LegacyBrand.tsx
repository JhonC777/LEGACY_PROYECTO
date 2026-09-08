import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

type LegacyBrandProps = {
  markDelay?: number
  titleDelay?: number
  /** Desktop: left-aligned brand column */
  align?: 'center' | 'start'
}

/** Marca editorial del Home — Archivo vivo con presencia */
export function LegacyBrand({
  markDelay = 0.12,
  titleDelay = 0.28,
  align = 'center',
}: LegacyBrandProps) {
  const reduceMotion = useReducedMotion()
  const start = align === 'start'

  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <div
      className={cn(
        'flex flex-col',
        start ? 'items-center text-center lg:items-start lg:text-left' : 'items-center text-center',
      )}
    >
      <motion.div {...fadeUp(markDelay)} className="archive-mark mb-6 lg:mb-7">
        <span
          aria-hidden
          className={cn(
            'archive-mark-glow absolute inset-[-48%] rounded-full',
            !reduceMotion && 'archive-mark-glow-live',
          )}
        />
        <motion.span
          className="archive-mark-frame relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl lg:h-[4.75rem] lg:w-[4.75rem]"
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    'inset 0 1px 0 rgb(255 255 255 / 0.08), 0 0 0 1px rgb(214 184 120 / 0.1), 0 22px 48px rgb(0 0 0 / 0.4)',
                    'inset 0 1px 0 rgb(255 255 255 / 0.1), 0 0 0 1px rgb(214 184 120 / 0.22), 0 22px 52px rgb(214 184 120 / 0.12)',
                    'inset 0 1px 0 rgb(255 255 255 / 0.08), 0 0 0 1px rgb(214 184 120 / 0.1), 0 22px 48px rgb(0 0 0 / 0.4)',
                  ],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <span
            aria-hidden
            className="absolute inset-[5px] rounded-[0.85rem] border border-legacy-gold/20"
          />
          <span
            aria-hidden
            className="absolute inset-[10px] rounded-lg border border-legacy-gold/10"
          />
          <span className="relative font-display text-[1.85rem] font-semibold tracking-[0.1em] text-legacy-gold-soft lg:text-[2.1rem]">
            L
          </span>
        </motion.span>
      </motion.div>

      <motion.p
        {...fadeUp(markDelay + 0.06)}
        className="mb-2.5 text-[0.68rem] font-semibold tracking-[0.32em] text-legacy-muted uppercase lg:text-[0.72rem]"
      >
        Archivo académico
      </motion.p>

      <motion.h1
        {...fadeUp(titleDelay)}
        className="font-display text-[clamp(3.4rem,8vw,5.5rem)] leading-[0.9] font-semibold tracking-[0.16em] text-legacy-white"
      >
        LEGACY
      </motion.h1>

      <motion.div
        {...fadeUp(titleDelay + 0.08)}
        aria-hidden
        className={cn(
          'mt-5 h-px w-20 bg-gradient-to-r from-transparent via-legacy-gold/60 to-transparent lg:mt-6 lg:w-24',
          start && 'lg:from-legacy-gold/55 lg:via-legacy-gold/35 lg:to-transparent',
        )}
      />

      <motion.p
        {...fadeUp(titleDelay + 0.14)}
        className="mt-4 text-[0.7rem] tracking-[0.22em] text-legacy-muted/85 uppercase lg:mt-5 lg:text-[0.72rem]"
      >
        Preservar · Organizar · Trascender
      </motion.p>
    </div>
  )
}
