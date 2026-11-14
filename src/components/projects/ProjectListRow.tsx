import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { FileTypeTag } from '@/components/project/FileTypeTag'
import { GeneratedCover } from '@/components/projects/GeneratedCover'
import { SmartImage } from '@/components/ui/SmartImage'
import { DEMO_INSTITUTIONS, getProjectHref, type DemoProject } from '@/data/demoData'
import { getProjectResources } from '@/lib/projectResources'
import { subjectTagStyle } from '@/lib/subjectTags'
import '@/styles/info.css'

/** Vista de lista del catálogo: una fila por proyecto, toda la fila es el enlace. */
export function ProjectListRow({ project }: { project: DemoProject }) {
  const location = useLocation()
  const institution = DEMO_INSTITUTIONS.find((item) => item.id === project.institutionId)
  const kinds = [...new Set(getProjectResources(project).map((item) => item.kind))]
  const authors = project.authors.map((author) => author.name).join(', ')

  return (
    <li>
      <Link
        to={getProjectHref(project)}
        state={{ from: `${location.pathname}${location.search}` }}
        className="catalog-row"
      >
        <span className="catalog-row-cover">
          <SmartImage
            src={project.coverImage}
            alt=""
            fallback={
              <GeneratedCover
                area={project.area}
                title={project.title}
                seed={project.slug}
                variant="thumb"
              />
            }
          />
        </span>
        <span className="catalog-row-main">
          <span className="catalog-row-kicker">
            <span className="subject-tag" style={subjectTagStyle(project.area)}>
              <span className="subject-tag-dot" aria-hidden />{project.area}
            </span>
            <span className="subject-tag" style={subjectTagStyle(project.category)}>
              <span className="subject-tag-dot" aria-hidden />{project.category}
            </span>
          </span>
          <span className="catalog-row-title">{project.title}</span>
          <span className="catalog-row-dek">{project.subtitle}</span>
          <span className="catalog-row-meta">
            <span className="catalog-row-year">{project.year}</span>
            {kinds.map((kind) => (
              <FileTypeTag key={kind} kind={kind} className="catalog-row-tag" />
            ))}
            {institution ? <span className="catalog-row-inst">{institution.shortName}</span> : null}
            {authors ? <span className="catalog-row-authors">{authors}</span> : null}
          </span>
        </span>
        <ChevronRight className="catalog-row-chevron h-5 w-5" aria-hidden />
      </Link>
    </li>
  )
}
