import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Cpu,
  Hash,
  Library,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DemoInstitution, DemoProject } from '@/data/demoData'

const EASE = [0.22, 1, 0.36, 1] as const

type ProjectSheetProps = {
  project: DemoProject
  institution: DemoInstitution
  catalogHref: string
  nextProject: DemoProject
  nextHref: string
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Ficha académica: un solo panel pegajoso con secciones, en vez de cinco cajas sueltas. */
export function ProjectSheet({
  project,
  institution,
  catalogHref,
  nextProject,
  nextHref,
}: ProjectSheetProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.aside
      className="project-sheet"
      {...(reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
            animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
            transition: { duration: 0.8, delay: 0.5, ease: EASE },
          })}
    >
      <div className="project-sheet-head">
        <p className="text-[0.62rem] font-bold tracking-[0.16em] text-legacy-gold uppercase">
          Ficha académica
        </p>
        <h2 className="mt-1 font-display text-[1.45rem] leading-tight font-semibold text-legacy-white">
          Datos del proyecto
        </h2>
      </div>

      <dl className="project-sheet-section space-y-3.5">
        <SheetRow icon={Building2} label="Institución">
          <Link
            to={`/instituciones/${institution.slug}`}
            className="hover:text-legacy-gold hover:underline"
          >
            {institution.name}
          </Link>
        </SheetRow>
        <SheetRow icon={CalendarDays} label="Año de publicación">
          <Link
            to={`${catalogHref}?year=${project.year}`}
            className="hover:text-legacy-gold hover:underline"
          >
            {project.year}
          </Link>
        </SheetRow>
        <SheetRow icon={Library} label="Colección">
          {project.collection ? (
            <Link
              to={`${catalogHref}?collection=${encodeURIComponent(project.collection)}`}
              className="hover:text-legacy-gold hover:underline"
            >
              {project.collection}
            </Link>
          ) : (
            <span className="text-legacy-muted">Sin colección</span>
          )}
        </SheetRow>
      </dl>

      <section className="project-sheet-section" aria-labelledby="sheet-authors">
        <h3 id="sheet-authors" className="project-sheet-title">
          <Users className="h-3.5 w-3.5" aria-hidden />
          Participantes
          <span className="project-sheet-count">{project.authors.length}</span>
        </h3>
        <ul className="mt-3 space-y-2">
          {project.authors.map((author) => (
            <li key={author.id} className="project-sheet-person">
              <span className="project-sheet-avatar" aria-hidden>
                {initialsOf(author.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-legacy-white">
                  {author.name}
                </span>
                <span className="block text-[0.7rem] text-legacy-muted">{author.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="project-sheet-section" aria-labelledby="sheet-tech">
        <h3 id="sheet-tech" className="project-sheet-title">
          <Cpu className="h-3.5 w-3.5" aria-hidden />
          Tecnologías y herramientas
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.technologies.map((technology) => (
            <Link
              key={technology}
              to={`${catalogHref}?q=${encodeURIComponent(technology)}`}
              className="chip-liquid"
            >
              {technology}
            </Link>
          ))}
        </div>
      </section>

      <section className="project-sheet-section" aria-labelledby="sheet-tags">
        <h3 id="sheet-tags" className="project-sheet-title">
          <Hash className="h-3.5 w-3.5" aria-hidden />
          Temas
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Link
              key={tag}
              to={`${catalogHref}?q=${encodeURIComponent(tag)}`}
              className="chip-liquid"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>

      <Link to={nextHref} className="project-sheet-next group">
        <span className="min-w-0">
          <span className="block text-[0.62rem] font-bold tracking-[0.16em] text-legacy-muted uppercase">
            Siguiente en el archivo
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-legacy-white transition-colors group-hover:text-legacy-gold-soft">
            {nextProject.title}
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-legacy-gold transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
    </motion.aside>
  )
}

function SheetRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="project-sheet-row-icon">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.68rem] text-legacy-muted">{label}</dt>
        <dd className="text-sm font-semibold text-legacy-white">{children}</dd>
      </div>
    </div>
  )
}
