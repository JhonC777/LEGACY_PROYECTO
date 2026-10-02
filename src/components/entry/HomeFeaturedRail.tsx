import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DEMO_INSTITUTIONS,
  getProjectHref,
  type DemoProject,
} from '@/data/demoData'

type HomeFeaturedRailProps = {
  projects: DemoProject[]
  onExploreCatalog: () => void
}

function institutionName(project: DemoProject) {
  return (
    DEMO_INSTITUTIONS.find((institution) => institution.id === project.institutionId)
      ?.name ?? 'Institución'
  )
}

/** Fragmentos destacados del archivo (proyectos publicados). */
export function HomeFeaturedRail({ projects, onExploreCatalog }: HomeFeaturedRailProps) {
  if (projects.length === 0) return null

  return (
    <section id="home-fragmentos" className="home-fragments-v3" aria-labelledby="home-fragments-title">
      <header className="home-section-head is-row home-reveal">
        <div>
          <p className="home-eyebrow">Fragmentos de conocimiento</p>
          <h2 id="home-fragments-title" className="home-section-title">
            Fragmentos del archivo
          </h2>
        </div>
        <button type="button" className="home-text-link" onClick={onExploreCatalog}>
          Ver el archivo público
          <ArrowUpRight className="home-text-link-icon" aria-hidden />
        </button>
      </header>

      <ul className="home-frag-grid">
        {projects.map((project) => {
          const authors = project.authors.map((author) => author.name).join(', ')
          return (
            <li key={project.id} className="home-reveal">
              <Link to={getProjectHref(project)} className="home-frag">
                <span className="home-frag-year">{project.year}</span>
                <span className="home-frag-area">{project.category}</span>
                <span className="home-frag-title">{project.title}</span>
                {authors ? <span className="home-frag-authors">{authors}</span> : null}
                <span className="home-frag-foot">
                  <span className="home-frag-house">{institutionName(project)}</span>
                  <span className="home-frag-go" aria-hidden>
                    <ArrowUpRight className="home-btn-icon" />
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
