import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuraPlayback } from '@/lib/useAuraPlayback'

type LegacyIntroProps = {
  onDone: () => void
  ceremonial?: boolean
}

const LETTERS = ['L', 'E', 'G', 'A', 'C', 'Y'] as const
const LETTER_X = [-21, -12.6, -4.2, 4.2, 12.6, 21] as const
const INTRO_MS = 20_000
const REDUCED_MS = 1_400
const EASE = [0.22, 1, 0.36, 1] as const

const BUBBLES = [
  { x: -58, y: -38, size: 40, delay: 0, letter: 0, violet: false },
  { x: -48, y: 36, size: 28, delay: 0.22, letter: 0, violet: true },
  { x: -62, y: 8, size: 32, delay: 0.4, letter: 0, violet: false },
  { x: -34, y: -46, size: 36, delay: 0.1, letter: 1, violet: false },
  { x: -28, y: 44, size: 26, delay: 0.3, letter: 1, violet: true },
  { x: -42, y: 18, size: 30, delay: 0.5, letter: 1, violet: false },
  { x: -8, y: -52, size: 38, delay: 0.16, letter: 2, violet: false },
  { x: -16, y: 48, size: 24, delay: 0.36, letter: 2, violet: true },
  { x: 6, y: -40, size: 34, delay: 0.54, letter: 2, violet: false },
  { x: 14, y: 50, size: 36, delay: 0.12, letter: 3, violet: false },
  { x: 22, y: -44, size: 28, delay: 0.34, letter: 3, violet: true },
  { x: 8, y: 32, size: 30, delay: 0.48, letter: 3, violet: false },
  { x: 40, y: -36, size: 38, delay: 0.2, letter: 4, violet: false },
  { x: 48, y: 40, size: 26, delay: 0.38, letter: 4, violet: true },
  { x: 36, y: 12, size: 32, delay: 0.58, letter: 4, violet: false },
  { x: 60, y: -28, size: 40, delay: 0.18, letter: 5, violet: false },
  { x: 56, y: 34, size: 28, delay: 0.42, letter: 5, violet: true },
  { x: 64, y: 4, size: 34, delay: 0.6, letter: 5, violet: false },
] as const

const STARS = [
  { x: -70, y: -44, delay: 0.08, letter: 0 },
  { x: -64, y: 46, delay: 0.26, letter: 1 },
  { x: -24, y: -58, delay: 0.14, letter: 2 },
  { x: 18, y: 58, delay: 0.32, letter: 3 },
  { x: 66, y: -40, delay: 0.2, letter: 4 },
  { x: 72, y: 38, delay: 0.44, letter: 5 },
  { x: -74, y: 6, delay: 0.36, letter: 0 },
  { x: 76, y: -6, delay: 0.5, letter: 5 },
  { x: 4, y: -56, delay: 0.28, letter: 2 },
  { x: -4, y: 56, delay: 0.52, letter: 3 },
] as const

export function LegacyIntro({ onDone, ceremonial = false }: LegacyIntroProps) {
  const { live, reduceMotion } = useAuraPlayback()

  useEffect(() => {
    const wait = reduceMotion ? REDUCED_MS : INTRO_MS
    const timer = window.setTimeout(onDone, wait)
    return () => window.clearTimeout(timer)
  }, [onDone, reduceMotion])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onDone()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  return (
    <motion.div
      className="legacy-intro"
      role="dialog"
      aria-modal="true"
      aria-label="Presentación de LEGACY"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.85, ease: EASE }}
    >
      <motion.div
        aria-hidden
        className="legacy-intro-bar is-top"
        initial={{ scaleY: 0 }}
        animate={reduceMotion ? { scaleY: 0 } : { scaleY: [0, 1, 1, 0] }}
        transition={{ duration: 20, times: [0, 0.07, 0.9, 1], ease: EASE }}
      />
      <motion.div
        aria-hidden
        className="legacy-intro-bar is-bottom"
        initial={{ scaleY: 0 }}
        animate={reduceMotion ? { scaleY: 0 } : { scaleY: [0, 1, 1, 0] }}
        transition={{ duration: 20, times: [0, 0.07, 0.9, 1], ease: EASE }}
      />

      <div className="legacy-intro-nebula" aria-hidden>
        <motion.span
          className="legacy-intro-ember"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={
            reduceMotion
              ? { opacity: 0.7, scale: 1 }
              : { opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 0.2] }
          }
          transition={{ duration: 5.2, times: [0, 0.18, 0.72, 1], ease: 'easeInOut' }}
        />
        <motion.span
          className="legacy-intro-blob legacy-intro-blob-gold"
          initial={{ opacity: 0, scale: 1.4 }}
          animate={
            reduceMotion
              ? { opacity: 0.7, scale: 3.2 }
              : {
                  opacity: [0, 0, 0.95, 0.82, 0.2],
                  scale: [1.4, 1.8, 4.2, 3.8, 1.4],
                  x: [0, 0, -18, 10, 0],
                  y: [0, 0, 10, -8, 0],
                }
          }
          transition={{ duration: 20, times: [0, 0.16, 0.38, 0.78, 1], ease: 'easeInOut' }}
        />
        <motion.span
          className="legacy-intro-blob legacy-intro-blob-violet"
          initial={{ opacity: 0, scale: 1.2 }}
          animate={
            reduceMotion
              ? { opacity: 0.4, scale: 3 }
              : {
                  opacity: [0, 0, 0.7, 0.55, 0.1],
                  scale: [1.2, 1.6, 3.9, 3.5, 1.2],
                  x: [0, 0, 22, -12, 0],
                  y: [0, 0, -12, 14, 0],
                }
          }
          transition={{ duration: 20, times: [0, 0.18, 0.4, 0.8, 1], ease: 'easeInOut' }}
        />
        <motion.span
          className="legacy-intro-blob legacy-intro-blob-ice"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={
            reduceMotion
              ? { opacity: 0.25, scale: 2.6 }
              : { opacity: [0, 0, 0.45, 0.3, 0], scale: [1.1, 1.4, 3.2, 2.8, 1] }
          }
          transition={{ duration: 20, times: [0, 0.2, 0.42, 0.76, 1], ease: 'easeInOut' }}
        />
        <motion.span
          className="legacy-intro-ring"
          initial={{ opacity: 0, scale: 0.28 }}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: [0, 0, 0.7, 0.35, 0], scale: [0.28, 0.4, 1.05, 1.25, 1.5] }
          }
          transition={{ duration: 20, times: [0, 0.42, 0.56, 0.78, 1], ease: EASE }}
        />
        <motion.span
          className="legacy-intro-flare"
          initial={{ opacity: 0, scaleX: 0.2 }}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: [0, 0, 1, 0.35, 0], scaleX: [0.15, 0.2, 1, 1, 0.6] }
          }
          transition={{ duration: 20, times: [0, 0.66, 0.72, 0.84, 1], ease: EASE }}
        />
      </div>

      {!reduceMotion ? (
        <div className="legacy-intro-swarm" aria-hidden>
          {BUBBLES.map((bubble, index) => {
            const dest = LETTER_X[bubble.letter]
            return (
              <motion.span
                key={`bubble-${index}`}
                className={
                  bubble.violet ? 'legacy-intro-bubble is-violet' : 'legacy-intro-bubble'
                }
                style={{
                  width: bubble.size,
                  height: bubble.size,
                  marginLeft: -bubble.size / 2,
                  marginTop: -bubble.size / 2,
                  willChange: live ? 'transform, opacity' : undefined,
                }}
                initial={{
                  x: `${bubble.x}vmin`,
                  y: `${bubble.y}vmin`,
                  opacity: 0,
                  scale: 0.3,
                }}
                animate={{
                  x: [`${bubble.x}vmin`, `${dest}vmin`, `${dest}vmin`],
                  y: [`${bubble.y}vmin`, '0vmin', '0vmin'],
                  opacity: [0, 1, 0],
                  scale: [0.3, 1.15, 0.12],
                }}
                transition={{
                  duration: 9.2,
                  delay: 3.8 + bubble.delay,
                  times: [0, 0.68, 1],
                  ease: EASE,
                }}
              />
            )
          })}
          {STARS.map((star, index) => {
            const dest = LETTER_X[star.letter]
            return (
              <motion.span
                key={`star-${index}`}
                className="legacy-intro-star"
                style={{ willChange: live ? 'transform, opacity' : undefined }}
                initial={{
                  x: `${star.x}vmin`,
                  y: `${star.y}vmin`,
                  opacity: 0,
                  scale: 0.4,
                }}
                animate={{
                  x: [`${star.x}vmin`, `${dest}vmin`, `${dest}vmin`],
                  y: [`${star.y}vmin`, '0vmin', '0vmin'],
                  opacity: [0, 1, 0],
                  scale: [0.4, 1.3, 0.15],
                }}
                transition={{
                  duration: 8.6,
                  delay: 4 + star.delay,
                  times: [0, 0.7, 1],
                  ease: EASE,
                }}
              />
            )
          })}
        </div>
      ) : null}

      <div className="legacy-intro-stage">
        <div className="legacy-intro-lockup">
          <p className="legacy-intro-word" aria-hidden={reduceMotion ? undefined : true}>
            {LETTERS.map((letter, index) => (
              <motion.span
                key={letter}
                className="legacy-intro-letter"
                initial={{ opacity: 0, y: 22, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={
                  reduceMotion
                    ? { duration: 0.28 }
                    : {
                        duration: 0.85,
                        delay: 9.1 + index * 0.32,
                        ease: EASE,
                      }
                }
              >
                {letter}
              </motion.span>
            ))}
          </p>
          <span className="sr-only">LEGACY</span>
          <motion.p
            className="legacy-intro-line"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.28, delay: 0.15 }
                : { duration: 1, delay: 13.8, ease: EASE }
            }
          >
            Los archivos no se guardan, <em>trascienden.</em>
          </motion.p>
        </div>
      </div>

      {ceremonial ? null : (
        <button type="button" className="legacy-intro-skip" onClick={onDone}>
          Saltar
        </button>
      )}
    </motion.div>
  )
}
