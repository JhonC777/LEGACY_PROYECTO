import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ExternalLink,
  FileText,
  Layers3,
  Play,
  Tags,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { ExploreFooter } from '@/components/explore/ExploreFooter'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { PublicHeader } from '@/components/public/PublicHeader'
import {
  getInstitutionBySlug,
  getInstitutionProjects,
  getProjectBySlug,
} from '@/data/demoData'

export function ProjectDetail() {
  const { institutionSlug, projectSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const institution = getInstitutionBySlug(institutionSlug)
  const project = institution
    ? getProjectBySlug(institution.id, projectSlug)
    : undefined

  if (!institution || !project) {
    return <Navigate to="/" replace />
  }

  const catalogHref = `/instituciones/${institution.slug}/proyectos`
  const related = getInstitutionProjects(institution.id)
    .filter(
      (candidate) =>
        candidate.id !== project.id &&
        (candidate.area === project.area ||
          candidate.category === project.category ||
          candidate.tags.some((tag) => project.tags.includes(tag))),
    )
    .slice(0, 3)

  const allProjects = getInstitutionProjects(institution.id)
  const index = allProjects.findIndex((candidate) => candidate.id === project.id)
  const nextProject = allProjects[(index + 1) % allProjects.length] ?? project
  const nextHref = `/instituciones/${institution.slug}/proyectos/${nextProject.slug}`

  return (
    <div className="explore-shell">
      <PublicHeader institution={institution} />

      <main>
        <div className="border-b border-white/10 px-6 py-4 lg:px-8">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 text-sm text-legacy-muted">
            <Link to="/" className="hover:text-legacy-gold">Inicio</Link>
            <span>/</span>
            <Link
              to={`/instituciones/${institution.slug}`}
              className="hover:text-legacy-gold"
            >
              {institution.name}
            </Link>
            <span>/</span>
            <Link to={catalogHref} className="hover:text-legacy-gold">Proyectos</Link>
            <span>/</span>
            <span className="max-w-[320px] truncate font-medium text-legacy-white">
              {project.title}
            </span>
          </div>
        </div>

        <section className="bg-legacy-black/20 px-6 py-9 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-[1200px]">
            <button
              type="button"
              onClick={() => {
                const state = location.state as { from?: string } | null
                if (state?.from) navigate(-1)
                else navigate(catalogHref)
              }}
              className="btn btn-ghost btn-sm mb-6"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver a la vista anterior
            </button>

            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <span className="inline-flex rounded-full border border-legacy-gold/30 bg-legacy-gold/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-legacy-gold uppercase">
                  Proyecto de demostración
                </span>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-legacy-gold">
                  <span>{project.area}</span>
                  <span>·</span>
                  <span>{project.category}</span>
                  <span>·</span>
                  <span>{project.year}</span>
                </div>
                <h1 className="mt-3 font-display text-4xl leading-[1.08] font-semibold text-legacy-white lg:text-6xl">
                  {project.title}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-legacy-muted">
                  {project.subtitle}
                </p>

                <div className="mt-6 flex flex-wrap gap-4 text-sm text-legacy-muted">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-legacy-gold" aria-hidden />
                    {project.authors.map((author) => author.name).join(', ')}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-legacy-gold" aria-hidden />
                    {project.year}
                  </span>
                </div>
              </div>

              <img
                src={project.coverImage}
                alt={`Portada demostrativa de ${project.title}`}
                className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_24px_60px_rgb(31_36_48_/_0.12)]"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-14">
          <div className="space-y-10">
            <AcademicSection title="Descripción general">
              <p>{project.description}</p>
            </AcademicSection>

            <div className="grid gap-5 md:grid-cols-2">
              <AcademicCard title="Problema abordado" text={project.problem} />
              <AcademicCard title="Solución propuesta" text={project.solution} />
            </div>

            <AcademicSection title="Proceso y metodología">
              <p>{project.methodology}</p>
            </AcademicSection>

            <AcademicSection title="Resultados e impacto demostrativo">
              <p>{project.results}</p>
            </AcademicSection>

            <section>
              <h2 className="font-display text-3xl font-semibold text-explore-ink">
                Galería del proyecto
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {project.gallery.map((image, galleryIndex) => (
                  <img
                    key={image}
                    src={image}
                    alt={`Evidencia demostrativa ${galleryIndex + 1} de ${project.title}`}
                    className={`w-full rounded-2xl object-cover ${
                      galleryIndex === 0 ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[4/3]'
                    }`}
                  />
                ))}
              </div>
            </section>

            <section id="documentacion">
              <h2 className="font-display text-3xl font-semibold text-legacy-white">
                Recursos
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={project.docUrl?.startsWith('#') ? '#documentacion' : project.docUrl || '#documentacion'}
                  className="btn btn-secondary btn-sm"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  Documento
                </a>
                {project.videoUrl ? (
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <Play className="h-4 w-4" aria-hidden />
                    Video
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
                {project.pdfUrl ? (
                  <a
                    href={project.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    PDF
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <div className="explore-card rounded-2xl p-5">
              <h2 className="font-display text-2xl font-semibold text-explore-ink">
                Ficha académica
              </h2>
              <dl className="mt-5 space-y-4">
                <MetaItem icon={Layers3} label="Institución" value={institution.name} />
                <MetaItem icon={Calendar} label="Año" value={String(project.year)} />
                <MetaItem icon={Tags} label="Colección" value={project.collection ?? 'Sin colección'} />
              </dl>
            </div>

            <div className="explore-card rounded-2xl p-5">
              <h2 className="text-sm font-bold tracking-[0.12em] text-explore-muted uppercase">
                Participantes
              </h2>
              <div className="mt-4 space-y-3">
                {project.authors.map((author) => (
                  <div key={author.id} className="rounded-xl bg-explore-panel p-3">
                    <p className="text-sm font-semibold text-explore-ink">{author.name}</p>
                    <p className="text-xs text-explore-muted">{author.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="explore-card rounded-2xl p-5">
              <h2 className="text-sm font-bold tracking-[0.12em] text-explore-muted uppercase">
                Tecnologías
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.technologies.map((technology) => (
                  <span
                    key={technology}
                    className="rounded-full bg-explore-purple/10 px-3 py-1.5 text-xs font-semibold text-explore-purple"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            </div>

            <Link
              to={nextHref}
              className="glass-surface-gold flex items-center justify-between rounded-2xl p-5 text-legacy-white"
            >
              <span>
                <span className="block text-xs text-legacy-muted">Siguiente proyecto</span>
                <span className="mt-1 block font-semibold">{nextProject.title}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
            </Link>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="bg-legacy-black/30 px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-[1200px]">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-legacy-gold uppercase">
                    Sigue explorando
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-semibold text-legacy-white">
                    Proyectos relacionados
                  </h2>
                </div>
                <Link to={catalogHref} className="btn btn-ghost btn-sm">
                  Volver al catálogo →
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {related.map((relatedProject) => (
                  <ProjectCard key={relatedProject.id} project={relatedProject} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <ExploreFooter />
    </div>
  )
}

function AcademicSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="font-display text-3xl font-semibold text-legacy-white">{title}</h2>
      <div className="mt-3 text-[0.98rem] leading-8 text-legacy-muted">{children}</div>
    </section>
  )
}

function AcademicCard({ title, text }: { title: string; text: string }) {
  return (
    <section className="explore-card rounded-2xl p-6">
      <h2 className="font-display text-2xl font-semibold text-legacy-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-legacy-muted">{text}</p>
    </section>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-legacy-gold" aria-hidden />
      <div>
        <dt className="text-xs text-legacy-muted">{label}</dt>
        <dd className="text-sm font-semibold text-legacy-white">{value}</dd>
      </div>
    </div>
  )
}
