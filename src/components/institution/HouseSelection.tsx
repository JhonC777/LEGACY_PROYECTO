import { ArrowRight, BookMarked, FileText, FileType2, Library, Play } from 'lucide-react'
import '@/styles/house.css'
import { motion, useReducedMotion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { SmartImage } from '@/components/ui/SmartImage'
import {
  getProjectHref,
  isRealShowcase,
  type DemoInstitution,
  type DemoProject,
} from '@/data/demoData'
import { cn } from '@/lib/cn'

export type HouseSelectionPick = {
  main?: DemoProject
  companions: DemoProject[]
}

/**
 * Pieza principal: la ficha real si existe; si no, el primer destacado.
 * Los acompañantes evitan repetir lo que ya muestra el hero cuando hay alternativa.
 */
export function pickHouseSelection(
  projects: DemoProject[],
  avoidIds: string[] = [],
): HouseSelectionPick {
  const featured = projects.filter((project) => project.isFeatured)
  const main =
    projects.find((project) => isRealShowcase(project)) ?? featured[0] ?? projects[0]
  if (!main) return { main: undefined, companions: [] }

  const avoid = new Set(avoidIds)
  const rest = [...featured, ...projects].filter(
    (project, index, list) =>
      project.id !== main.id && list.findIndex((item) => item.id === project.id) === index,
  )
  const companions = [
    ...rest.filter((project) => !avoid.has(project.id)),
    ...rest.filter((project) => avoid.has(project.id)),
  ].slice(0, 2)

  return { main, companions }
}

type HouseSelectionProps = {
  institution: DemoInstitution
  selection: HouseSelectionPick
  projectsHref: string
}

export function HouseSelection({ institution, selection, projectsHref }: HouseSelectionProps) {
  const reduceMotion = useReducedMotion()
  const location = useLocation()
  const from = `${location.pathname}${location.search}`
  const { main, companions } = selection

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  return (
    <section className="house-selection" aria-labelledby="house-selection-title">
      <div className="house-selection-inner">
        <motion.header className="house-head" {...reveal()}>
          <div>
            <p className="house-kicker">
              <BookMarked className="h-3.5 w-3.5" aria-hidden />
              Archivo destacado
            </p>
            <h2 id="house-selection-title" className="house-title">
              Selección de la casa
            </h2>
            <p className="house-lead">
              Una pieza principal del archivo de {institution.shortName} y las lecturas que la
              acompañan.
            </p>
          </div>
          <Link to={projectsHref} className="house-all">
            Recorrer el catálogo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.header>

        {main ? (
          <>
            <motion.div {...reveal(0.06)}>
              <MainPiece project={main} from={from} />
            </motion.div>

            {companions.length > 0 ? (
              <motion.div className="house-companions" {...reveal(0.12)}>
                <p className="house-companions-label">Lo acompañan</p>
                <ul className="house-companions-list">
                  {companions.map((project, index) => (
                    <li key={project.id}>
                      <Link
                        to={getProjectHref(project)}
                        state={{ from }}
                        className="house-companion"
                      >
                        <span className="house-companion-media">
                          <SmartImage
                            src={project.coverImage}
                            alt={`Portada de ${project.title}`}
                          />
                        </span>
                        <span className="house-companion-copy">
                          <span className="house-companion-meta">
                            <span className="house-folio-num">
                              {String(index + 2).padStart(2, '0')}
                            </span>
                            {project.area} · {project.year}
                          </span>
                          <span className="house-companion-title">{project.title}</span>
                          <span className="house-companion-dek">{project.subtitle}</span>
                        </span>
                        <ArrowRight className="house-companion-arrow h-4 w-4" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : null}
          </>
        ) : (
          <div className="house-empty">
            <p>Todavía no hay proyectos publicados en este archivo.</p>
            <Link to={projectsHref} className="house-all">
              Abrir el catálogo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function MainPiece({ project, from }: { project: DemoProject; from: string }) {
  const href = getProjectHref(project)
  const real = isRealShowcase(project)
  const authors = project.authors.map((author) => author.name).join(', ')
  const gallery = project.gallery.filter((src) => src && src !== project.coverImage).slice(0, 3)
  const resources = [
    project.docUrl ? { key: 'doc', label: 'Documento', Icon: FileText } : null,
    project.videoUrl ? { key: 'video', label: 'Video', Icon: Play } : null,
    project.pdfUrl ? { key: 'pdf', label: 'PDF', Icon: FileType2 } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <article className={cn('house-main', real && 'is-real')}>
      <span className="house-main-corners" aria-hidden>
        <span className="is-tl" />
        <span className="is-tr" />
        <span className="is-bl" />
        <span className="is-br" />
      </span>

      <div className="house-main-visual">
        <Link
          to={href}
          state={{ from }}
          className="house-main-media"
          aria-label={`Abrir ficha de ${project.title}`}
        >
          <SmartImage src={project.coverImage} alt={`Portada de ${project.title}`} />
          <span className="house-main-scrim" aria-hidden />
          <span className="house-main-year" aria-hidden>
            {project.year}
          </span>
          {real ? <span className="house-main-seal">Ficha real</span> : null}
        </Link>

        {gallery.length > 0 ? (
          <div className="house-main-strip" aria-label="Piezas de la galería">
            {gallery.map((src, index) => (
              <Link
                key={src}
                to={`${href}#galeria`}
                state={{ from }}
                className="house-main-thumb"
                aria-label={`Ver imagen ${index + 1} de la galería`}
              >
                <SmartImage src={src} alt="" />
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="house-main-body">
        <p className="house-main-folio">
          <span className="house-folio-num">01</span>
          Pieza principal
        </p>
        <p className="house-main-meta">
          {project.area}
          <span aria-hidden>·</span>
          {project.category}
        </p>
        <h3 className="house-main-title">
          <Link to={href} state={{ from }}>
            {project.title}
          </Link>
        </h3>
        {project.subtitle ? <p className="house-main-dek">{project.subtitle}</p> : null}
        {project.description ? (
          <p className="house-main-desc">{project.description}</p>
        ) : null}

        <dl className="house-main-facts">
          {authors ? (
            <div>
              <dt>Autoría</dt>
              <dd title={authors}>{authors}</dd>
            </div>
          ) : null}
          {project.collection ? (
            <div>
              <dt>Colección</dt>
              <dd>
                <Library className="h-3.5 w-3.5 text-legacy-gold/80" aria-hidden />
                {project.collection}
              </dd>
            </div>
          ) : null}
          {resources.length > 0 ? (
            <div>
              <dt>En la ficha</dt>
              <dd className="house-main-resources">
                {resources.map(({ key, label, Icon }) => (
                  <span key={key}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>

        <Link to={href} state={{ from }} className="house-main-cta">
          Abrir la ficha
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
