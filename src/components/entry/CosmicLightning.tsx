import { useEffect, useId, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type BoltVariant = {
  id: string
  main: string
  forks: string[]
  /** Micro-filamentos / chispas de trayectoria */
  sparks: string[]
  flash: { x: string; y: string }
  /** Segundo flash (eco) */
  echo?: { x: string; y: string }
}

const BOLTS: BoltVariant[] = [
  {
    id: 'nw-se',
    main: 'M 6 2 L 14 10 L 10 16 L 22 24 L 14 30 L 28 40 L 18 48 L 34 56 L 24 64 L 42 74 L 30 82 L 48 90 L 38 96 L 52 100',
    forks: [
      'M 14 10 L 26 8 L 30 16 L 38 14 L 36 22',
      'M 22 24 L 34 28 L 32 36 L 42 38',
      'M 28 40 L 40 36 L 46 44 L 42 50',
      'M 34 56 L 48 52 L 54 60 L 50 66 L 58 68',
      'M 42 74 L 56 70 L 60 80 L 68 78',
      'M 48 90 L 60 86 L 64 94',
    ],
    sparks: [
      'M 18 48 L 12 52 L 14 58',
      'M 30 82 L 24 86 L 26 92',
      'M 40 36 L 44 32 L 48 36',
    ],
    flash: { x: '30%', y: '52%' },
    echo: { x: '48%', y: '78%' },
  },
  {
    id: 'ne-sw',
    main: 'M 94 3 L 84 12 L 90 20 L 74 30 L 82 40 L 64 50 L 74 60 L 54 70 L 66 80 L 46 88 L 58 94 L 40 100',
    forks: [
      'M 84 12 L 72 8 L 68 16 L 58 14 L 56 22',
      'M 74 30 L 62 26 L 58 34 L 50 32',
      'M 64 50 L 52 46 L 48 54 L 40 52',
      'M 54 70 L 42 66 L 38 74 L 30 72',
      'M 66 80 L 76 76 L 80 84 L 88 82',
      'M 46 88 L 36 84 L 34 92',
    ],
    sparks: [
      'M 82 40 L 88 36 L 90 42',
      'M 74 60 L 80 56 L 82 62',
      'M 52 46 L 46 42 L 44 48',
    ],
    flash: { x: '70%', y: '45%' },
    echo: { x: '48%', y: '82%' },
  },
  {
    id: 'top-split',
    main: 'M 50 0 L 47 10 L 54 18 L 44 28 L 52 36 L 40 46 L 50 54 L 36 64 L 46 72 L 32 82 L 42 90 L 28 98',
    forks: [
      'M 54 18 L 66 14 L 70 24 L 78 22 L 76 30',
      'M 44 28 L 32 24 L 28 34 L 20 32 L 18 40',
      'M 52 36 L 64 40 L 62 48 L 70 50',
      'M 40 46 L 28 50 L 24 58 L 16 56',
      'M 50 54 L 62 58 L 60 66 L 68 70',
      'M 36 64 L 24 68 L 22 76',
      'M 46 72 L 58 76 L 56 84 L 64 88',
    ],
    sparks: [
      'M 70 24 L 74 20 L 78 24',
      'M 28 34 L 22 30 L 20 36',
      'M 62 58 L 68 54 L 70 60',
    ],
    flash: { x: '50%', y: '36%' },
    echo: { x: '62%', y: '62%' },
  },
  {
    id: 'side-arc',
    main: 'M 1 22 L 10 28 L 5 36 L 18 42 L 10 50 L 26 56 L 16 64 L 34 70 L 22 78 L 40 84 L 28 90 L 46 96',
    forks: [
      'M 10 28 L 18 22 L 24 28 L 22 36',
      'M 18 42 L 28 38 L 34 46 L 32 52',
      'M 26 56 L 38 52 L 44 60 L 52 58',
      'M 34 70 L 46 66 L 50 74 L 58 72',
      'M 40 84 L 52 80 L 56 88',
    ],
    sparks: [
      'M 5 36 L 2 40 L 4 44',
      'M 16 64 L 12 68 L 14 72',
      'M 38 52 L 42 48 L 46 52',
    ],
    flash: { x: '24%', y: '58%' },
    echo: { x: '40%', y: '84%' },
  },
  {
    id: 'cross-slash',
    main: 'M 12 8 L 24 18 L 18 26 L 36 34 L 28 44 L 48 52 L 40 62 L 60 70 L 52 80 L 72 88 L 64 96',
    forks: [
      'M 24 18 L 34 12 L 40 20',
      'M 36 34 L 48 30 L 52 38 L 60 36',
      'M 48 52 L 58 48 L 62 56',
      'M 60 70 L 72 66 L 76 74 L 84 72',
      'M 52 80 L 44 86 L 48 92',
    ],
    sparks: [
      'M 28 44 L 22 48 L 24 54',
      'M 40 62 L 34 66 L 36 72',
      'M 72 66 L 78 62 L 80 68',
    ],
    flash: { x: '42%', y: '50%' },
    echo: { x: '68%', y: '78%' },
  },
  {
    id: 'vault-crack',
    main: 'M 78 4 L 70 14 L 76 22 L 62 32 L 70 42 L 54 52 L 64 62 L 48 72 L 58 82 L 42 90 L 52 98',
    forks: [
      'M 70 14 L 58 10 L 54 18 L 46 16',
      'M 62 32 L 50 28 L 46 36 L 38 34',
      'M 70 42 L 82 38 L 86 46 L 92 44',
      'M 54 52 L 42 48 L 38 56',
      'M 64 62 L 74 58 L 78 66 L 86 64',
      'M 48 72 L 36 76 L 34 84',
    ],
    sparks: [
      'M 76 22 L 82 18 L 84 24',
      'M 50 28 L 44 24 L 42 30',
      'M 74 58 L 80 54 L 82 60',
    ],
    flash: { x: '62%', y: '48%' },
    echo: { x: '44%', y: '80%' },
  },
]

const CYCLE_MS = 3000
const STRIKE_MS = 1250

export function CosmicLightning() {
  const reduceMotion = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [strikeKey, setStrikeKey] = useState(0)

  useEffect(() => {
    if (reduceMotion) return

    let timeoutId: number | undefined
    let intervalId: number | undefined

    const fire = () => {
      setActiveIndex((prev) => {
        let next = Math.floor(Math.random() * BOLTS.length)
        if (BOLTS.length > 1 && next === prev) {
          next = (next + 1) % BOLTS.length
        }
        return next
      })
      setStrikeKey((k) => k + 1)

      timeoutId = window.setTimeout(() => {
        setActiveIndex(null)
      }, STRIKE_MS)
    }

    const startId = window.setTimeout(() => {
      fire()
      intervalId = window.setInterval(fire, CYCLE_MS)
    }, 1400)

    return () => {
      window.clearTimeout(startId)
      if (timeoutId) window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [reduceMotion])

  if (reduceMotion) return null

  const bolt = activeIndex !== null ? BOLTS[activeIndex] : null
  const filterId = `cosmic-bolt-glow-${uid}`
  const bloomId = `cosmic-bolt-bloom-${uid}`
  const coreFilterId = `cosmic-bolt-core-${uid}`

  return (
    <div aria-hidden className="cosmic-layer cosmic-lightning-root">
      <AnimatePresence mode="sync">
        {bolt ? (
          <motion.div
            key={strikeKey}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Flash principal */}
            <motion.div
              className="cosmic-lightning-flash"
              style={
                {
                  '--flash-x': bolt.flash.x,
                  '--flash-y': bolt.flash.y,
                } as CSSProperties
              }
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.2, 1, 0.4, 0.85, 0.25, 0.45, 0],
              }}
              transition={{
                duration: 1.05,
                times: [0, 0.06, 0.14, 0.28, 0.38, 0.55, 0.7, 1],
                ease: 'easeOut',
              }}
            />

            {/* Eco de iluminación */}
            {bolt.echo ? (
              <motion.div
                className="cosmic-lightning-echo"
                style={
                  {
                    '--flash-x': bolt.echo.x,
                    '--flash-y': bolt.echo.y,
                  } as CSSProperties
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 0.55, 0.2, 0] }}
                transition={{
                  duration: 1.1,
                  times: [0, 0.22, 0.4, 0.65, 1],
                  ease: 'easeOut',
                }}
              />
            ) : null}

            <motion.div
              className="cosmic-lightning-rim"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0.25, 0.4, 0] }}
              transition={{ duration: 1, times: [0, 0.15, 0.4, 0.6, 1] }}
            />

            <motion.div
              className="cosmic-lightning-afterglow"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.15, 0] }}
              transition={{ duration: 1.2, times: [0, 0.25, 0.55, 1] }}
            />

            <svg
              className="cosmic-lightning-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id={bloomId} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="1.35" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter
                  id={coreFilterId}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="0.45" result="soft" />
                  <feMerge>
                    <feMergeNode in="soft" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Bloom ancho detrás del rayo */}
              <BoltStroke
                d={bolt.main}
                className="bolt-bloom"
                filter={`url(#${bloomId})`}
                delay={0}
                duration={0.36}
              />

              <BoltStroke
                d={bolt.main}
                className="bolt-halo"
                filter={`url(#${filterId})`}
                delay={0.02}
                duration={0.34}
              />

              <BoltStroke
                d={bolt.main}
                className="bolt-core"
                filter={`url(#${coreFilterId})`}
                delay={0.05}
                duration={0.3}
              />

              <BoltStroke
                d={bolt.main}
                className="bolt-filament"
                delay={0.08}
                duration={0.28}
              />

              {bolt.forks.map((fork, i) => (
                <g key={`${bolt.id}-fork-${i}`}>
                  <BoltStroke
                    d={fork}
                    className="bolt-fork-halo"
                    filter={`url(#${filterId})`}
                    delay={0.1 + i * 0.04}
                    duration={0.24}
                  />
                  <BoltStroke
                    d={fork}
                    className="bolt-fork"
                    delay={0.14 + i * 0.04}
                    duration={0.2}
                  />
                </g>
              ))}

              {bolt.sparks.map((spark, i) => (
                <BoltStroke
                  key={`${bolt.id}-spark-${i}`}
                  d={spark}
                  className="bolt-spark"
                  delay={0.22 + i * 0.06}
                  duration={0.18}
                />
              ))}
            </svg>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

type BoltStrokeProps = {
  d: string
  className: string
  filter?: string
  delay: number
  duration: number
}

function BoltStroke({ d, className, filter, delay, duration }: BoltStrokeProps) {
  return (
    <motion.path
      d={d}
      fill="none"
      className={className}
      filter={filter}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: [0, 1, 1, 1],
        opacity: [0, 1, 0.9, 0],
      }}
      transition={{
        duration: duration + 0.6,
        delay,
        times: [0, 0.28, 0.5, 1],
        ease: [0.16, 1, 0.3, 1],
      }}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    />
  )
}
