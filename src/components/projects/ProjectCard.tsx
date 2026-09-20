import { ArrowRight, FileText, FileType2, Library, Play } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { SmartImage } from '@/components/ui/SmartImage'
import {
  DEMO_INSTITUTIONS,
  getProjectHref,
  isRealShowcase,
  type DemoProject,
} from '@/data/demoData'
import { cn } from '@/lib/cn'
import { isFileResource, resourceFileName } from '@/lib/resources'

type ProjectCardProps = {
  project: DemoProject
  layout?: 'hero' | 'plate'
  folio?: number
}

export function ProjectCard({
  project,
  layout = 'plate',
  folio,
}: ProjectCardProps) {
  const location = useLocation()
  const from = `${location.pathname}${location.search}`
  const href = getProjectHref(project)
  const authors = project.authors.map((author) => author.name).join(', ')
  const institution = DEMO_INSTITUTIONS.find(
    (item) => item.id === project.institutionId,
  )
  const institutionCatalogPath = `/instituciones/${institution?.slug ?? 'fe-y-alegria'}/proyectos`
  const isGlobalCatalog = location.pathname === '/proyectos'
  const isInstitutionCatalog = location.pathname === institutionCatalogPath
  const catalogPath =
    isGlobalCatalog || isInstitutionCatalog ? location.pathname : institutionCatalogPath
  const hero = layout === 'hero'
  const folioLabel =
    typeof folio === 'number' ? String(folio).padStart(2, '0') : null

  const filterHref = (key: 'area' | 'category' | 'collection', value: string) => {
    const next = new URLSearchParams(
      isGlobalCatalog || isInstitutionCatalog ? location.search : '',
    )
    next.set(key, value)
    return `${catalogPath}?${next.toString()}`
  }

  const resources = [
    {
      key: 'doc',
      label: 'Doc',
      href: project.docUrl?.startsWith('#')
        ? `${href}${project.docUrl}`
        : project.docUrl || href,
      Icon: FileText,
      file: isFileResource(project.docUrl),
      download: project.docUrl
        ? resourceFileName(project.docUrl, 'documento-del-proyecto')
        : undefined,
    },
    {
      key: 'video',
      label: 'Video',
      href: project.videoUrl || `${href}#video`,
      Icon: Play,
      file: isFileResource(project.videoUrl),
      download: project.videoUrl
        ? resourceFileName(project.videoUrl, 'video-del-proyecto')
        : undefined,
    },
    {
      key: 'pdf',
      label: 'PDF',
      href: project.pdfUrl || `${href}#pdf`,
      Icon: FileType2,
      file: isFileResource(project.pdfUrl),
      download: project.pdfUrl
        ? resourceFileName(project.pdfUrl, 'informe-del-proyecto.pdf')
        : undefined,
    },
  ]

  const real = isRealShowcase(project)

  const kicker = (
    <p className="knowledge-fragment-kicker">
      <Link to={filterHref('area', project.area)} title={`Filtrar por área: ${project.area}`}>
        {project.area}
      </Link>
      <span aria-hidden>·</span>
      <Link
        to={filterHref('category', project.category)}
        title={`Filtrar por categoría: ${project.category}`}
      >
        {project.category}
      </Link>
    </p>
  )

  const badges = (
    <span className="knowledge-fragment-badges">
      {real ? <span className="knowledge-fragment-real">Real</span> : null}
      {project.isFeatured && !real ? (
        <span className="knowledge-fragment-featured">Destacado</span>
      ) : null}
    </span>
  )

  const stamps = (
    <div className="knowledge-fragment-stamps" aria-label="Recursos disponibles">
      {resources.map(({ key, label, href: resourceHref, Icon, file, download }) => {
        const className = 'knowledge-fragment-stamp'
        const inner = (
          <>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span>{label}</span>
          </>
        )
        if (file) {
          return (
            <a
              key={key}
              href={resourceHref.split('#')[0]}
              download={download}
              className={className}
              title={`Descargar ${download ?? label}`}
              aria-label={`Descargar ${label}`}
              onClick={(event) => event.stopPropagation()}
            >
              {inner}
            </a>
          )
        }
        return (
          <Link
            key={key}
            to={resourceHref}
            state={{ from }}
            className={className}
            title={label}
            aria-label={label}
            onClick={(event) => event.stopPropagation()}
          >
            {inner}
          </Link>
        )
      })}
    </div>
  )

  return (
    <article
      className={cn(
        'knowledge-fragment group flex h-full flex-col',
        hero && 'is-hero',
        real && 'is-real',
      )}
    >
      <span className="knowledge-fragment-corners" aria-hidden>
        <span className="is-tl" />
        <span className="is-tr" />
        <span className="is-bl" />
        <span className="is-br" />
      </span>
      <span className="knowledge-fragment-fillet" aria-hidden />
      <span className="knowledge-fragment-sweep" aria-hidden />

      <Link
        to={href}
        state={{ from }}
        className="knowledge-fragment-cover relative block overflow-hidden"
      >
        <SmartImage
          src={project.coverImage}
          alt={`Portada demostrativa de ${project.title}`}
          className="knowledge-fragment-image"
        />
        <span aria-hidden className="knowledge-fragment-grain" />
        <span aria-hidden className="knowledge-fragment-scrim" />

        {folioLabel ? (
          <span className="knowledge-fragment-folio">{folioLabel}</span>
        ) : null}

        <span className="knowledge-fragment-year-mark">{project.year}</span>

        {hero ? (
          <span className="knowledge-fragment-voice">
            <h3 className="knowledge-fragment-title is-on-plate">{project.title}</h3>
            <span className="knowledge-fragment-dek is-on-plate">{project.subtitle}</span>
          </span>
        ) : null}
      </Link>

      <div className="knowledge-fragment-body">
        {isGlobalCatalog && institution ? (
          <Link
            to={`/instituciones/${institution.slug}`}
            className="mb-3 inline-flex w-fit max-w-full items-center gap-2 text-xs font-medium text-legacy-muted transition-colors hover:text-legacy-gold"
            title={`Abrir ${institution.name}`}
          >
            <InstitutionLogo
              name={institution.name}
              logoUrl={institution.logoUrl}
              fallback={institution.shortName}
              accent={institution.accent}
              decorative
              className="header-avatar"
              imageClassName="bg-white/95 p-0.5"
            />
            <span className="truncate">{institution.name}</span>
          </Link>
        ) : null}

        {hero ? (
          <div className="knowledge-fragment-head">
            {kicker}
            {badges}
          </div>
        ) : (
          <>
            <div className="knowledge-fragment-head">
              {kicker}
              {badges}
            </div>
            <Link to={href} state={{ from }} className="knowledge-fragment-copy">
              <h3 className="knowledge-fragment-title">{project.title}</h3>
              <p className="knowledge-fragment-dek">{project.subtitle}</p>
            </Link>
          </>
        )}

        <div className="knowledge-fragment-sign">
          <p className="knowledge-fragment-authors" title={authors}>
            {authors}
          </p>
          {project.collection ? (
            <Link
              to={filterHref('collection', project.collection)}
              className="knowledge-fragment-register"
              title={`Filtrar por colección: ${project.collection}`}
            >
              <Library className="h-3 w-3" aria-hidden />
              {project.collection}
            </Link>
          ) : null}
        </div>

        <div className="knowledge-fragment-foot">
          {stamps}
          <Link
            to={href}
            state={{ from }}
            className="knowledge-fragment-cta"
            aria-label={`Abrir ficha de ${project.title}`}
          >
            Abrir el archivo
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}
