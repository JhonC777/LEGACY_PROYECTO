import { cn } from '@/lib/cn'
import { riseStyle } from '@/lib/rise'

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

export function HomePurpose({ awakened = true, quiet = false }: HomePurposeProps) {
  return (
    <div
      className={cn('legacy-rise home-purpose', quiet && 'is-quiet', !awakened && 'is-dormant')}
      style={riseStyle(awakened ? (quiet ? 1.12 : 0.82) : 0, 0.7, 10)}
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
    </div>
  )
}
