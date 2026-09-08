import { motion, useReducedMotion } from 'framer-motion'

/** Capas vivas del Home — respiración, polvo, orbes (sin partículas excesivas) */
export function CosmicLife() {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <>
        <div aria-hidden className="cosmic-layer cosmic-aurora" />
        <div aria-hidden className="cosmic-layer cosmic-dust" />
      </>
    )
  }

  return (
    <>
      <div aria-hidden className="cosmic-layer cosmic-aurora cosmic-aurora-live" />
      <div aria-hidden className="cosmic-layer cosmic-breath" />
      <div aria-hidden className="cosmic-layer cosmic-dust cosmic-dust-live" />

      <div aria-hidden className="cosmic-layer cosmic-orbs">
        <motion.span
          className="cosmic-orb cosmic-orb-a"
          animate={{
            y: [0, -18, 8, 0],
            x: [0, 10, -6, 0],
            opacity: [0.35, 0.55, 0.4, 0.35],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="cosmic-orb cosmic-orb-b"
          animate={{
            y: [0, 14, -10, 0],
            x: [0, -12, 8, 0],
            opacity: [0.25, 0.45, 0.3, 0.25],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        />
        <motion.span
          className="cosmic-orb cosmic-orb-c"
          animate={{
            y: [0, -10, 16, 0],
            opacity: [0.2, 0.4, 0.28, 0.2],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
        />
      </div>

      <div aria-hidden className="cosmic-layer cosmic-constellation cosmic-constellation-live" />
    </>
  )
}
