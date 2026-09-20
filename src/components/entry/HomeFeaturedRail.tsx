import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
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

const EASE = [0.22, 1, 0.36, 1] as const

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
  const reduceMotion = useReducedMotion()

  if (projects.length === 0) return null

  return (
    <motion.section
      id="home-fragmentos"
      className="home-fragments is-quiet"
      aria-labelledby="home-fragments-title"
      initial={reduceMotion ? { opacity: awakened ? 1 : 0 } : { opacity: 0, y: 16 }}
      animate={
        reduceMotion
          ? { opacity: awakened ? 1 : 0 }
          : awakened
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 16 }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.7, delay: awakened ? 1.2 : 0, ease: EASE }
      }
    >
      <div className="home-fragments-head">
        <div>
          <p className="home-threshold-kicker">Fragmentos de conocimiento</p>
          <h2 id="home-fragments-title" className="home-fragments-title">
            Del archivo piloto
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
    </motion.section>
  )
}
