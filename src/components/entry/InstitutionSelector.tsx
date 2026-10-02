import { Compass } from 'lucide-react'
import type { Institution } from '@/data/mockInstitutions'
import { InstitutionCard, type InstitutionFacts } from './InstitutionCard'

type InstitutionSelectorProps = {
  institutions: Institution[]
  onSelect: (institution: Institution) => void
  onExploreAll: () => void
  projectCounts?: Record<string, number>
  facts?: Record<string, InstitutionFacts>
}

const VISIBLE_COUNT = 3

/** Casas del archivo: la abierta en grande; las próximas, en fichas discretas. */
export function InstitutionSelector({
  institutions,
  onSelect,
  onExploreAll,
  projectCounts,
  facts,
}: InstitutionSelectorProps) {
  const visible = institutions.slice(0, VISIBLE_COUNT)
  const open = visible.filter((institution) => institution.isActive)
  const soon = visible.filter((institution) => !institution.isActive)
  const empty = visible.length === 0

  return (
    <div className="home-houses">
      <header className="home-section-head home-reveal">
        <p className="home-eyebrow">Casas del archivo</p>
        <h2 className="home-section-title">Instituciones</h2>
        <p className="home-section-sub">
          Cada institución conserva su propio archivo académico. Hoy está abierta Fe y Alegría; las
          demás casas siguen en preparación.
        </p>
        {!empty ? (
          <p className="home-pill-note">
            <span className="home-dot" aria-hidden />
            {open.length} disponible
            {soon.length > 0 ? ` · ${soon.length} próxima${soon.length === 1 ? '' : 's'}` : null}
          </p>
        ) : null}
      </header>

      {empty ? (
        <p className="home-section-sub" role="status">
          Aún no hay casas publicadas en el archivo.
        </p>
      ) : (
        <div className={soon.length ? 'home-houses-grid' : 'home-houses-grid is-single'}>
          {open.map((institution) => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
              index={visible.indexOf(institution)}
              onSelect={onSelect}
              projectCount={projectCounts?.[institution.slug]}
              facts={facts?.[institution.slug]}
            />
          ))}
          {soon.length ? (
            <div className="home-houses-soon">
              {soon.map((institution) => (
                <InstitutionCard
                  key={institution.id}
                  institution={institution}
                  index={visible.indexOf(institution)}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      <div className="home-houses-more home-reveal">
        <button type="button" className="home-text-link" onClick={onExploreAll}>
          <Compass className="home-text-link-icon" aria-hidden />
          Explorar el archivo público
        </button>
      </div>
    </div>
  )
}
