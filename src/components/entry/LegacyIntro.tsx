import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuraPlayback } from '@/lib/useAuraPlayback'
import { LEGACY_SLOGAN } from '@/lib/brand'

type LegacyIntroProps = {
  onDone: () => void
  ceremonial?: boolean
}

const LETTERS = ['L', 'E', 'G', 'A', 'C', 'Y'] as const
const LETTER_X = [-21, -12.6, -4.2, 4.2, 12.6, 21] as const
const INTRO_S = 26.8
const INTRO_MS = 26_800
const REDUCED_MS = 2_200
const EASE = [0.22, 1, 0.36, 1] as const
const GRAVITY = [0.62, 0.02, 0.22, 1] as const
const COLLISION = 7.28
const TITLE_AT = 9.1
const LINE_AT = 13.8
const DISSOLVE_AT = 16
const LAURA_AT = 18.05
const DIM_AT = 20.7
const LIGHT_AT = 21.55
const CREATED_AT = 21.95
const DIRECTOR_AT = 22.28

const DUST = LETTERS.flatMap((_, letter) => {
  const base = LETTER_X[letter]
  return [0, 1, 2].map((n) => ({
    x: base + (n - 1) * 2.3,
    y: n === 1 ? 5 : -5,
    dx: (n - 1) * 7 + (letter - 2.5) * 1.1,
    dy: -11 - n * 2.8,
    delay: letter * 0.06 + n * 0.05,
  }))
})

const NODES = [
  { x: -58, y: -38, delay: 0, letter: 0, violet: false },
  { x: -48, y: 36, delay: 0.22, letter: 0, violet: true },
  { x: -62, y: 8, delay: 0.4, letter: 0, violet: false },
  { x: -34, y: -46, delay: 0.1, letter: 1, violet: false },
  { x: -28, y: 44, delay: 0.3, letter: 1, violet: true },
  { x: -42, y: 18, delay: 0.5, letter: 1, violet: false },
  { x: -8, y: -52, delay: 0.16, letter: 2, violet: false },
  { x: -16, y: 48, delay: 0.36, letter: 2, violet: true },
  { x: 6, y: -40, delay: 0.54, letter: 2, violet: false },
  { x: 14, y: 50, delay: 0.12, letter: 3, violet: false },
  { x: 22, y: -44, delay: 0.34, letter: 3, violet: true },
  { x: 8, y: 32, delay: 0.48, letter: 3, violet: false },
  { x: 40, y: -36, delay: 0.2, letter: 4, violet: false },
  { x: 48, y: 40, delay: 0.38, letter: 4, violet: true },
  { x: 36, y: 12, delay: 0.58, letter: 4, violet: false },
  { x: 60, y: -28, delay: 0.18, letter: 5, violet: false },
  { x: 56, y: 34, delay: 0.42, letter: 5, violet: true },
  { x: 64, y: 4, delay: 0.6, letter: 5, violet: false },
] as const

const SPARKS = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2
  return {
    x: Math.cos(angle) * 44,
    y: Math.sin(angle) * 7.5,
    delay: (index % 4) * 0.03,
    violet: index % 3 === 1,
  }
})

const CONSTELLATIONS = [
  {
    id: 'west',
    delay: 1.15,
    paths: ['M118 228 L188 176 L252 246 L318 158', 'M188 176 L214 286'],
    stars: [
      [118, 228, 1.8],
      [188, 176, 2.2],
      [252, 246, 1.5],
      [318, 158, 1.9],
      [214, 286, 1.3],
    ],
  },
  {
    id: 'north',
    delay: 1.55,
    paths: ['M486 72 L548 118 L618 78 L678 136', 'M548 118 L566 178'],
    stars: [
      [486, 72, 1.6],
      [548, 118, 2.1],
      [618, 78, 1.4],
      [678, 136, 1.8],
      [566, 178, 1.2],
    ],
  },
  {
    id: 'east',
    delay: 1.95,
    paths: ['M842 208 L924 154 L1004 236 L1072 184', 'M924 154 L948 278'],
    stars: [
      [842, 208, 1.7],
      [924, 154, 2.2],
      [1004, 236, 1.4],
      [1072, 184, 1.9],
      [948, 278, 1.3],
    ],
  },
  {
    id: 'south-west',
    delay: 2.25,
    paths: ['M164 528 L246 572 L328 508 L286 638'],
    stars: [
      [164, 528, 1.5],
      [246, 572, 2],
      [328, 508, 1.4],
      [286, 638, 1.7],
    ],
  },
  {
    id: 'south-east',
    delay: 2.55,
    paths: ['M772 548 L852 498 L934 578 L1002 528', 'M852 498 L888 628'],
    stars: [
      [772, 548, 1.6],
      [852, 498, 2.1],
      [934, 578, 1.3],
      [1002, 528, 1.8],
      [888, 628, 1.2],
    ],
  },
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
      transition={{ duration: reduceMotion ? 0.2 : 0.9, ease: EASE }}
    >
      <motion.div
        aria-hidden
        className="legacy-intro-bar is-top"
        initial={{ scaleY: 0 }}
        animate={reduceMotion ? { scaleY: 0 } : { scaleY: [0, 1, 1, 0] }}
        transition={{ duration: INTRO_S, times: [0, 0.041, 0.94, 1], ease: EASE }}
      />
      <motion.div
        aria-hidden
        className="legacy-intro-bar is-bottom"
        initial={{ scaleY: 0 }}
        animate={reduceMotion ? { scaleY: 0 } : { scaleY: [0, 1, 1, 0] }}
        transition={{ duration: INTRO_S, times: [0, 0.041, 0.94, 1], ease: EASE }}
      />

      <div className="legacy-intro-sky" aria-hidden>
        <motion.div
          className="legacy-intro-dolly"
          initial={{ scale: 1.07 }}
          animate={reduceMotion ? { scale: 1 } : { scale: [1.07, 1.02, 1] }}
          transition={{ duration: INTRO_S, times: [0, 0.34, 1], ease: 'linear' }}
        >
          <span className="legacy-intro-starfield is-far" />
          <span className="legacy-intro-starfield is-near" />
          <span className="legacy-intro-grain" />

          <motion.span
            className="legacy-intro-aurora is-a"
            initial={{ opacity: 0, x: -36, y: 10 }}
            animate={
              reduceMotion
                ? { opacity: 0.22 }
                : { opacity: [0, 0.48, 0.62, 0.22, 0.04], x: [-36, 6, 14, -8, 0], y: [10, -4, 6, -2, 0] }
            }
            transition={{ duration: INTRO_S, times: [0, 0.1, 0.27, 0.46, 0.62], ease: 'easeInOut' }}
          />
          <motion.span
            className="legacy-intro-aurora is-b"
            initial={{ opacity: 0, x: 40 }}
            animate={
              reduceMotion
                ? { opacity: 0.18 }
                : { opacity: [0, 0.36, 0.54, 0.2, 0.03], x: [40, 8, -12, 4, 0] }
            }
            transition={{ duration: INTRO_S, times: [0, 0.12, 0.28, 0.48, 0.62], ease: 'easeInOut' }}
          />
          <motion.span
            className="legacy-intro-aurora is-c"
            initial={{ opacity: 0, y: 20 }}
            animate={
              reduceMotion
                ? { opacity: 0.14 }
                : { opacity: [0, 0.22, 0.4, 0.16, 0], y: [20, 4, -6, 4, 0] }
            }
            transition={{ duration: INTRO_S, times: [0, 0.13, 0.3, 0.49, 0.62], ease: 'easeInOut' }}
          />
          <motion.span
            className="legacy-intro-aurora is-d"
            initial={{ opacity: 0 }}
            animate={
              reduceMotion
                ? { opacity: 0.12 }
                : { opacity: [0, 0.18, 0.38, 0.12, 0] }
            }
            transition={{ duration: INTRO_S, times: [0, 0.15, 0.31, 0.45, 0.6], ease: 'easeInOut' }}
          />

          <span className="legacy-intro-galaxy is-far-a" />
          <span className="legacy-intro-galaxy is-far-b" />

          <motion.div
            className="legacy-intro-universe is-gold"
            initial={{ opacity: 0, x: '-46vw', scale: 0.38, rotate: -12 }}
            animate={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: [0, 0.88, 1, 0.35, 0],
                    x: ['-46vw', '-18vw', '0vw', '0vw', '0vw'],
                    scale: [0.38, 0.86, 1.04, 0.62, 0.12],
                    rotate: [-12, -5, 2, 6, 8],
                  }
            }
            transition={{ duration: 7.4, times: [0, 0.38, 0.695, 0.82, 1], delay: 2.12, ease: GRAVITY }}
          >
            <span className="legacy-intro-universe-haze" />
            <span className="legacy-intro-universe-disc" />
            <span className="legacy-intro-universe-ring" />
            <span className="legacy-intro-universe-core" />
          </motion.div>

          <motion.div
            className="legacy-intro-universe is-violet"
            initial={{ opacity: 0, x: '46vw', scale: 0.36, rotate: 14 }}
            animate={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: [0, 0.8, 1, 0.32, 0],
                    x: ['46vw', '18vw', '0vw', '0vw', '0vw'],
                    scale: [0.36, 0.84, 1.02, 0.58, 0.1],
                    rotate: [14, 6, -2, -6, -8],
                  }
            }
            transition={{ duration: 7.4, times: [0, 0.38, 0.695, 0.82, 1], delay: 2.22, ease: GRAVITY }}
          >
            <span className="legacy-intro-universe-haze" />
            <span className="legacy-intro-universe-disc" />
            <span className="legacy-intro-universe-ring" />
            <span className="legacy-intro-universe-core" />
          </motion.div>

          <motion.span
            className="legacy-intro-ember"
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={
              reduceMotion
                ? { opacity: 0.4, scaleX: 1 }
                : { opacity: [0, 0.28, 1, 0.55, 0], scaleX: [0.2, 0.45, 1.15, 0.7, 0.15] }
            }
            transition={{ duration: 8.6, times: [0, 0.32, 0.6, 0.78, 1], delay: 1.55, ease: EASE }}
          />

          {[0, 1].map((wave) => (
            <motion.span
              key={`shock-${wave}`}
              className="legacy-intro-shock"
              initial={{ opacity: 0, scale: 0.22 }}
              animate={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: [0, 0.7, 0], scale: [0.22, 1.42 + wave * 0.22] }
              }
              transition={{
                duration: 2.15 + wave * 0.25,
                delay: COLLISION + wave * 0.12,
                ease: EASE,
              }}
            />
          ))}

          <motion.span
            className="legacy-intro-horizon"
            initial={{ opacity: 0, scaleX: 0.1 }}
            animate={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: [0, 0, 1, 0.32, 0], scaleX: [0.1, 0.14, 1, 1.04, 0.55] }
            }
            transition={{ duration: 20, times: [0, 0.35, 0.364, 0.48, 0.62], ease: EASE }}
          />

          <motion.span
            className="legacy-intro-flare"
            initial={{ opacity: 0, scaleX: 0.16 }}
            animate={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: [0, 0, 1, 0.22, 0], scaleX: [0.16, 0.2, 1, 1, 0.4] }
            }
            transition={{ duration: 20, times: [0, 0.352, 0.364, 0.44, 0.56], ease: EASE }}
          />

          <motion.span
            className="legacy-intro-bloom"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: [0, 0, 0.85, 0.18, 0], scale: [0.4, 0.5, 1.2, 1, 0.7] }
            }
            transition={{ duration: 20, times: [0, 0.355, 0.364, 0.42, 0.5], ease: EASE }}
          />
        </motion.div>

        <motion.span
          className="legacy-intro-iris"
          initial={{ opacity: 0.92 }}
          animate={
            reduceMotion
              ? { opacity: 0.55 }
              : { opacity: [0.92, 0.62, 0.78, 0.36, 0.5, 0.58, 0.28, 0.3, 0.88, 0.06, 0.12, 0.6] }
          }
          transition={{
            duration: INTRO_S,
            times: [0, 0.134, 0.254, 0.272, 0.373, 0.537, 0.673, 0.76, 0.775, 0.806, 0.914, 1],
            ease: 'easeInOut',
          }}
        />

        <motion.span
          className="legacy-intro-flash"
          initial={{ opacity: 0 }}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: [0, 0, 0.92, 0.2, 0] }
          }
          transition={{ duration: 20, times: [0, 0.358, 0.364, 0.382, 0.415], ease: EASE }}
        />

        <motion.span
          className="legacy-intro-blackout"
          initial={{ opacity: 0 }}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: [0, 0, 0, 0.96, 0.08, 0] }
          }
          transition={{ duration: 20, times: [0, 0.39, 0.408, 0.428, 0.455, 0.49], ease: EASE }}
        />

        <motion.span
          className="legacy-intro-dim"
          initial={{ opacity: 0 }}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: [0, 0.94, 0] }
          }
          transition={{ duration: 1.05, delay: DIM_AT, times: [0, 0.4, 1], ease: EASE }}
        />

        <motion.span
          className="legacy-intro-illuminate"
          initial={{ opacity: 0 }}
          animate={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: [0, 0.72, 0.56, 0.34, 0] }
          }
          transition={{ duration: 5.15, delay: LIGHT_AT, times: [0, 0.16, 0.38, 0.78, 1], ease: EASE }}
        />
      </div>

      {!reduceMotion ? (
        <>
          <motion.svg
            className="legacy-intro-map"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{
              opacity: [0, 1, 0.8, 0],
              scale: [1.03, 1, 0.94, 0.62],
            }}
            transition={{ duration: 6.85, times: [0, 0.22, 0.74, 1], delay: 0.52, ease: EASE }}
          >
            {CONSTELLATIONS.map((constellation) => (
              <g key={constellation.id}>
                {constellation.paths.map((d) => (
                  <motion.path
                    key={d}
                    d={d}
                    className="legacy-intro-constellation-line"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 0.75, 0] }}
                    transition={{
                      duration: 3.2,
                      delay: constellation.delay,
                      times: [0, 0.38, 0.8, 1],
                      ease: EASE,
                    }}
                  />
                ))}
                {constellation.stars.map(([cx, cy, r]) => (
                  <motion.circle
                    key={`${constellation.id}-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    className="legacy-intro-constellation-star"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0.85, 0], scale: [0.5, 1, 1, 0.35] }}
                    transition={{
                      duration: 3.4,
                      delay: constellation.delay + 0.16,
                      times: [0, 0.3, 0.78, 1],
                      ease: EASE,
                    }}
                  />
                ))}
              </g>
            ))}
          </motion.svg>

          <div className="legacy-intro-swarm" aria-hidden>
            {NODES.map((node, index) => {
              const dest = LETTER_X[node.letter]
              return (
                <motion.span
                  key={`node-${index}`}
                  className={
                    node.violet ? 'legacy-intro-node is-violet' : 'legacy-intro-node'
                  }
                  style={{ willChange: live ? 'transform, opacity' : undefined }}
                  initial={{
                    x: `${node.x}vmin`,
                    y: `${node.y}vmin`,
                    opacity: 0,
                    scale: 0.35,
                  }}
                  animate={{
                    x: [`${node.x}vmin`, `${node.x * 0.58}vmin`, `${dest}vmin`],
                    y: [`${node.y}vmin`, `${node.y * 0.4}vmin`, '0vmin'],
                    opacity: [0, 1, 0],
                    scale: [0.35, 1, 0.18],
                  }}
                  transition={{
                    duration: 6.55,
                    delay: 2.45 + node.delay,
                    times: [0, 0.6, 1],
                    ease: GRAVITY,
                  }}
                />
              )
            })}

            {SPARKS.map((spark, index) => (
              <motion.span
                key={`spark-${index}`}
                className={
                  spark.violet ? 'legacy-intro-spark is-violet' : 'legacy-intro-spark'
                }
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [0, `${spark.x}vmin`],
                  y: [0, `${spark.y}vmin`],
                  opacity: [0, 0.85, 0],
                  scale: [0.4, 1, 0.2],
                }}
                transition={{
                  duration: 1.7,
                  delay: COLLISION + spark.delay,
                  times: [0, 0.2, 1],
                  ease: EASE,
                }}
              />
            ))}

            {DUST.map((speck, index) => (
              <motion.span
                key={`dust-${index}`}
                className="legacy-intro-dust"
                initial={{
                  x: `${speck.x}vmin`,
                  y: `${speck.y}vmin`,
                  opacity: 0,
                  scale: 0.4,
                }}
                animate={{
                  x: [`${speck.x}vmin`, `${speck.x + speck.dx}vmin`],
                  y: [`${speck.y}vmin`, `${speck.y + speck.dy}vmin`],
                  opacity: [0, 0.9, 0],
                  scale: [0.4, 1, 0.15],
                }}
                transition={{
                  duration: 1.85,
                  delay: DISSOLVE_AT + speck.delay,
                  times: [0, 0.22, 1],
                  ease: EASE,
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="legacy-intro-stage">
        <div className="legacy-intro-lockup">
          <motion.span
            aria-hidden
            className="legacy-intro-title-glow"
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={
              reduceMotion
                ? { opacity: 0.28, scaleX: 1 }
                : { opacity: [0, 0, 0.75, 0.28, 0], scaleX: [0.2, 0.25, 1, 0.85, 0.4] }
            }
            transition={{ duration: 20, times: [0, 0.44, 0.455, 0.62, 0.8], ease: EASE }}
          />
          <motion.p
            className="legacy-intro-word"
            aria-hidden={reduceMotion ? undefined : true}
            initial={{ letterSpacing: '0.28em' }}
            animate={
              reduceMotion
                ? { letterSpacing: '0.16em' }
                : { letterSpacing: ['0.28em', '0.16em', '0.16em', '0.34em'] }
            }
            transition={
              reduceMotion
                ? { duration: 0.28 }
                : { duration: 8.7, delay: TITLE_AT, times: [0, 0.14, 0.79, 1], ease: EASE }
            }
          >
            {LETTERS.map((letter, index) => (
              <motion.span
                key={letter}
                className="legacy-intro-letter"
                initial={{ opacity: 0, scale: 1.05, y: 0 }}
                animate={
                  reduceMotion
                    ? { opacity: 1, scale: 1 }
                    : {
                        opacity: [0, 1, 1, 0],
                        scale: [1.05, 1, 1, 0.86],
                        y: [0, 0, 0, -14],
                      }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.28 }
                    : {
                        duration: 8.7,
                        delay: TITLE_AT + index * 0.09,
                        times: [0, 0.14, 0.79, 1],
                        ease: EASE,
                      }
                }
              >
                {letter}
              </motion.span>
            ))}
          </motion.p>
          <span className="sr-only">LEGACY</span>
          <motion.span
            aria-hidden
            className="legacy-intro-rule"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              reduceMotion
                ? { scaleX: 1, opacity: 1 }
                : { scaleX: [0, 1, 1, 0.4], opacity: [0, 1, 1, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0.2, delay: 0.12 }
                : { duration: 4.4, delay: 13.35, times: [0, 0.18, 0.58, 1], ease: EASE }
            }
          />
          <motion.p
            className="legacy-intro-line"
            initial={{ opacity: 0 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: [0, 1, 1, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0.28, delay: 0.15 }
                : { duration: 4.15, delay: LINE_AT, times: [0, 0.22, 0.52, 1], ease: EASE }
            }
          >
            {LEGACY_SLOGAN}
          </motion.p>
        </div>

        {reduceMotion ? (
          <p className="legacy-intro-credit-still">
            Con participación de Laura Díaz
            <span>Creado por John Derek Castro</span>
          </p>
        ) : (
          <>
            <motion.div
              className="legacy-intro-card is-credit"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3, delay: LAURA_AT, times: [0, 0.18, 0.72, 1], ease: EASE }}
            >
              <p className="legacy-intro-credit-kicker">Con participación de</p>
              <p className="legacy-intro-credit-name">Laura Díaz</p>
            </motion.div>

            <motion.div
              className="legacy-intro-card is-director"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4.55, delay: CREATED_AT, times: [0, 0.08, 0.8, 1], ease: EASE }}
            >
              <motion.p
                className="legacy-intro-created"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4.55, delay: CREATED_AT, times: [0, 0.1, 0.78, 1], ease: EASE }}
              >
                Creado por
              </motion.p>
              <span className="legacy-intro-director-rule" aria-hidden />
              <motion.p
                className="legacy-intro-director-name"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [1.04, 1, 1, 1] }}
                transition={{ duration: 4.22, delay: DIRECTOR_AT, times: [0, 0.14, 0.78, 1], ease: EASE }}
              >
                JOHN DEREK CASTRO
              </motion.p>
            </motion.div>
          </>
        )}
      </div>

      {ceremonial ? null : (
        <button type="button" className="legacy-intro-skip" onClick={onDone}>
          Saltar
        </button>
      )}
    </motion.div>
  )
}
