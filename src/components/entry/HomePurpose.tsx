import { withLegacyName } from '@/components/brand/LegacyName'

const PILLARS = [
  { key: 'preservar', num: 'I', label: 'Preservar', hint: 'Cada proyecto de grado queda resguardado con su autoría, su año y su contexto.' },
  { key: 'organizar', num: 'II', label: 'Organizar', hint: 'Instituciones, categorías y años ordenan el archivo para que nada se pierda.' },
  { key: 'reconocer', num: 'III', label: 'Reconocer', hint: 'El trabajo de estudiantes y docentes recibe el lugar que merece.' },
  { key: 'exhibir', num: 'IV', label: 'Exhibir', hint: 'Un escaparate público donde la comunidad descubre lo que se crea en las aulas.' },
] as const

/** Los cuatro gestos de LEGACY. */
export function HomePurpose() {
  return (
    <section className="home-purpose-v3" aria-labelledby="home-purpose-title">
      <header className="home-section-head is-center home-reveal">
        <p className="home-eyebrow">{withLegacyName('Sobre LEGACY')}</p>
        <h2 id="home-purpose-title" className="home-section-title">
          Cuatro gestos, un mismo legado
        </h2>
        <p className="home-pillars-line" aria-hidden>
          Preservar <i>·</i> Organizar <i>·</i> Reconocer <i>·</i> Exhibir
        </p>
      </header>
      <ol className="home-pillars">
        {PILLARS.map((pillar) => (
          <li key={pillar.key} className="home-pillar home-reveal">
            <span className="home-pillar-num" aria-hidden>
              {pillar.num}
            </span>
            <h3>{pillar.label}</h3>
            <p>{pillar.hint}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
