import { ArrowRight } from 'lucide-react'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import type { Institution } from '@/data/mockInstitutions'

export type InstitutionFacts = {
  projects: number
  participants: number
  categories: number
  years: string | null
}

type InstitutionCardProps = {
  institution: Institution
  index: number
  onSelect: (institution: Institution) => void
  projectCount?: number
  facts?: InstitutionFacts
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Ficha de casa del archivo. Nombres y descripciones completos (sin recortes);
 * en móvil el contenido se apila para que nada quede apretado.
 */
export function InstitutionCard({ institution, index, onSelect, projectCount, facts }: InstitutionCardProps) {
  const number = String(index + 1).padStart(2, '0')

  if (!institution.isActive) {
    return (
      <div className="home-house is-soon home-reveal" aria-label={`${institution.name}, próximamente`}>
        <div className="home-house-top">
          <span className="home-house-num" aria-hidden>
            {number}
          </span>
          <span className="home-badge">Próximamente</span>
        </div>
        <div className="home-house-id">
          <span className="home-house-seal is-empty" aria-hidden />
          <div className="min-w-0">
            <h3 className="home-house-name is-soon">{institution.name}</h3>
            <p className="home-house-sub">{institution.description}</p>
          </div>
        </div>
      </div>
    )
  }

  const count = facts?.projects ?? projectCount
  return (
    <button
      type="button"
      className="home-house is-open home-reveal"
      aria-haspopup="dialog"
      onClick={() => onSelect(institution)}
    >
      <span className="home-house-top">
        <span className="home-house-num" aria-hidden>
          {number}
        </span>
        <span className="home-badge is-live">
          <span className="home-dot" aria-hidden />
          Disponible
        </span>
      </span>
      <span className="home-house-id">
        <InstitutionLogo
          name={institution.name}
          logoUrl={institution.logoUrl}
          fallback={initials(institution.name)}
          decorative
          className="home-house-seal"
          imageClassName="home-house-logo"
        />
        <span className="min-w-0">
          <span className="home-house-name">{institution.name}</span>
          <span className="home-house-sub">{institution.description}</span>
        </span>
      </span>
      {facts && facts.projects > 0 ? (
        <span className="home-house-facts">
          <span>
            <span className="home-house-fact-label">Proyectos</span>
            <span className="home-house-fact-value">{facts.projects}</span>
          </span>
          {facts.participants > 0 ? (
            <span>
              <span className="home-house-fact-label">Participantes</span>
              <span className="home-house-fact-value">{facts.participants}</span>
            </span>
          ) : null}
          {facts.categories > 0 ? (
            <span>
              <span className="home-house-fact-label">Categorías</span>
              <span className="home-house-fact-value">{facts.categories}</span>
            </span>
          ) : null}
          {facts.years ? (
            <span>
              <span className="home-house-fact-label">Periodo</span>
              <span className="home-house-fact-value">{facts.years}</span>
            </span>
          ) : null}
        </span>
      ) : typeof count === 'number' && count > 0 ? (
        <span className="home-house-sub">
          {count} proyecto{count === 1 ? '' : 's'}
        </span>
      ) : null}
      <span className="home-house-cta">
        Entrar al archivo
        <ArrowRight className="home-btn-icon" aria-hidden />
      </span>
    </button>
  )
}
