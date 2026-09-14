import { motion, useReducedMotion } from 'framer-motion'

const PILLARS = [
  { key: 'preservar', label: 'Preservar', hint: 'El trabajo no se pierde al cerrar el año.' },
  { key: 'organizar', label: 'Organizar', hint: 'Cada institución custodia su propio archivo.' },
  { key: 'reconocer', label: 'Reconocer', hint: 'Los proyectos pueden verse y consultarse.' },
  { key: 'exhibir', label: 'Exhibir', hint: 'Una generación deja rastro para la siguiente.' },
] as const

type HomePurposeProps = {
  awakened?: boolean
}

const EASE = [0.22, 1, 0.36, 1] as const

export function HomePurpose({ awakened = true }: HomePurposeProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="home-purpose"
      initial={reduceMotion ? { opacity: awakened ? 1 : 0 } : { opacity: 0, y: 10 }}
      animate={
        reduceMotion
          ? { opacity: awakened ? 1 : 0 }
          : awakened
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 10 }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.7, delay: awakened ? 0.82 : 0, ease: EASE }
      }
    >
      <p className="home-purpose-line">Los proyectos terminan. El conocimiento permanece.</p>
      <ul className="home-purpose-list">
        {PILLARS.map((pillar) => (
          <li key={pillar.key} className="home-purpose-item">
            <span>{pillar.label}</span>
            <em>{pillar.hint}</em>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
