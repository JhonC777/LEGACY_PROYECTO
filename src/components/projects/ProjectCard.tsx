import {
  ArrowRight,
  FileText,
  FileType2,
  Library,
  Play,
  Star,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import { SmartImage } from '@/components/ui/SmartImage'
import {
  DEMO_INSTITUTIONS,
  getProjectHref,
  type DemoProject,
} from '@/data/demoData'

type ProjectCardProps = {
  project: DemoProject
}

export function ProjectCard({ project }: ProjectCardProps) {
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
      label: 'Documento',
      href: project.docUrl?.startsWith('#')
        ? `${href}${project.docUrl}`
        : project.docUrl || href,
      Icon: FileText,
      external: Boolean(project.docUrl && /^https?:/i.test(project.docUrl)),
    },
    {
      key: 'video',
      label: 'Video',
      href: project.videoUrl || `${href}#video`,
      Icon: Play,
      external: Boolean(project.videoUrl && /^https?:/i.test(project.videoUrl)),
    },
    {
      key: 'pdf',
      label: 'PDF',
      href: project.pdfUrl || `${href}#pdf`,
      Icon: FileType2,
      external: Boolean(project.pdfUrl && /^https?:/i.test(project.pdfUrl)),
    },
  ]

  return (
    <article className="liquid-card group flex h-full flex-col overflow-hidden rounded-2xl">
      <Link
        to={href}
        state={{ from }}
        className="relative block aspect-[16/10] overflow-hidden bg-legacy-surface"
      >
        <SmartImage
          src={project.coverImage}
          alt={`Portada demostrativa de ${project.title}`}
          className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-legacy-black/55 via-transparent to-transparent opacity-80" />
        {project.isFeatured ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-legacy-gold/40 bg-legacy-gold/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-legacy-gold uppercase backdrop-blur-md">
            <Star className="h-3 w-3 fill-current" aria-hidden />
            Destacado
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full border border-white/20 bg-legacy-black/45 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-legacy-white/85 uppercase backdrop-blur-md">
            Demo
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
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

        <div className="mb-3 flex flex-wrap gap-2">
          <Link
            to={filterHref('area', project.area)}
            className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-legacy-muted uppercase transition-colors hover:border-legacy-gold/35 hover:text-legacy-gold"
            title={`Filtrar por área: ${project.area}`}
          >
            {project.area}
          </Link>
          <Link
            to={filterHref('category', project.category)}
            className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-legacy-muted uppercase transition-colors hover:border-legacy-gold/35 hover:text-legacy-gold"
            title={`Filtrar por categoría: ${project.category}`}
          >
            {project.category}
          </Link>
        </div>

        <Link to={href} state={{ from }} className="block">
          <h3 className="font-display line-clamp-2 text-[1.2rem] leading-snug font-semibold text-legacy-white transition-colors group-hover:text-legacy-gold-soft sm:text-[1.28rem]">
            {project.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-legacy-muted">
            {project.subtitle}
          </p>
        </Link>

        <p className="mt-4 line-clamp-1 text-xs text-legacy-muted" title={`${authors} · ${project.year}`}>
          <span className="text-legacy-white/80">{authors}</span>
          <span aria-hidden> · </span>
          <span>{project.year}</span>
        </p>
        {project.collection ? (
          <Link
            to={filterHref('collection', project.collection)}
            className="mt-2 inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-legacy-muted transition-colors hover:text-legacy-gold"
            title={`Filtrar por colección: ${project.collection}`}
          >
            <Library className="h-3 w-3" aria-hidden />
            {project.collection}
          </Link>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="resource-dock" aria-label="Recursos disponibles">
            {resources.map(({ key, label, href: resourceHref, Icon, external }) => {
              const className =
                'liquid-icon liquid-touch inline-flex h-8 w-8 items-center justify-center rounded-lg text-legacy-muted'
              if (external) {
                return (
                  <a
                    key={key}
                    href={resourceHref}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                    title={label}
                    aria-label={label}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
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
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </Link>
              )
            })}
          </div>

          <Link
            to={href}
            state={{ from }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-legacy-gold transition-all duration-300 hover:gap-2.5 hover:text-legacy-gold-soft"
            aria-label={`Abrir ficha de ${project.title}`}
          >
            Abrir ficha
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}
