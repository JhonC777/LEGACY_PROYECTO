import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

const PILLARS = [
  { key: 'preservar', label: 'Preservar', hint: 'El trabajo no se pierde al cerrar el año.' },
  { key: 'organizar', label: 'Organizar', hint: 'Cada institución custodia su propio archivo.' },
  { key: 'reconocer', label: 'Reconocer', hint: 'Los proyectos pueden verse y consultarse.' },
  { key: 'exhibir', label: 'Exhibir', hint: 'Una generación deja rastro para la siguiente.' },
] as const

type HomePurposeProps = {
  awakened?: boolean
  quiet?: boolean
}

const EASE = [0.22, 1, 0.36, 1] as const

export function HomePurpose({ awakened = true, quiet = false }: HomePurposeProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={cn('home-purpose', quiet && 'is-quiet')}
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
          : { duration: 0.7, delay: awakened ? (quiet ? 1.12 : 0.82) : 0, ease: EASE }
      }
    >
      <p className="home-purpose-line">Los proyectos terminan. El conocimiento permanece.</p>
      <ul className="home-purpose-list">
        {PILLARS.map((pillar) => (
          <li key={pillar.key} className="home-purpose-item" title={pillar.hint}>
            <span>{pillar.label}</span>
            <em>{pillar.hint}</em>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
