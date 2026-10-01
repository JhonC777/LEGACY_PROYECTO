import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { riseStyle } from '@/lib/rise'
import {
  DEMO_INSTITUTIONS,
  getProjectHref,
  type DemoProject,
} from '@/data/demoData'

type HomeFeaturedRailProps = {
  projects: DemoProject[]
  awakened?: boolean
  onExploreCatalog: () => void
}

function institutionName(project: DemoProject) {
  return (
    DEMO_INSTITUTIONS.find((institution) => institution.id === project.institutionId)
      ?.name ?? 'Institución'
  )
}

export function HomeFeaturedRail({
  projects,
  awakened = true,
  onExploreCatalog,
}: HomeFeaturedRailProps) {
  if (projects.length === 0) return null

  return (
    <section
      id="home-fragmentos"
      className={cn('legacy-rise home-fragments is-quiet', !awakened && 'is-dormant')}
      style={riseStyle(awakened ? 1.2 : 0, 0.7, 16)}
      aria-labelledby="home-fragments-title"
    >
      <div className="home-fragments-head">
        <div>
          <p className="home-threshold-kicker">Fragmentos de conocimiento</p>
          <h2 id="home-fragments-title" className="home-fragments-title">
            Del archivo
          </h2>
        </div>
        <button type="button" className="home-explore-link home-fragments-more" onClick={onExploreCatalog}>
          Ver el archivo público
        </button>
      </div>

      <ul className="home-fragments-track">
        {projects.map((project) => {
          const authors = project.authors.map((author) => author.name).join(', ')
          return (
            <li key={project.id}>
              <Link to={getProjectHref(project)} className="home-fragment">
                <span className="home-fragment-year">{project.year}</span>
                <span className="home-fragment-body">
                  <span className="home-fragment-title">{project.title}</span>
                  <span className="home-fragment-meta">
                    {project.category}
                    <span aria-hidden> · </span>
                    {authors}
                  </span>
                  <span className="home-fragment-house">{institutionName(project)}</span>
                </span>
                <ArrowUpRight className="home-fragment-arrow" aria-hidden />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
