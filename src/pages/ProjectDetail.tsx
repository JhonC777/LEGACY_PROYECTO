import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  Images,
  Layers3,
  Play,
  Tags,
  Users,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { ExploreFooter } from '@/components/explore/ExploreFooter'
import { ProcessTimeline } from '@/components/project/ProcessTimeline'
import { ProjectGallery } from '@/components/project/ProjectGallery'
import { ProjectPager } from '@/components/project/ProjectPager'
import { ProjectResources } from '@/components/project/ProjectResources'
import { ProjectSheet } from '@/components/project/ProjectSheet'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { PublicHeader } from '@/components/public/PublicHeader'
import { SmartImage } from '@/components/ui/SmartImage'
import {
  getInstitutionBySlug,
  getInstitutionProjects,
  getProjectBySlug,
  getRelatedProjects,
} from '@/data/demoData'
import { cn } from '@/lib/cn'

const SECTIONS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'galeria', label: 'Galería' },
  { id: 'recursos', label: 'Recursos' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const EASE = [0.22, 1, 0.36, 1] as const

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProjectDetail() {
  const { institutionSlug, projectSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('resumen')

  const institution = getInstitutionBySlug(institutionSlug)
  const project = institution
    ? getProjectBySlug(institution.id, projectSlug)
    : undefined

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const coverY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const coverScale = useTransform(scrollYProgress, [0, 1], [1, 1.06])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 40])
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.35])

  useEffect(() => {
    if (!project) return
    const targets = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    )
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const first = visible[0]
        if (first) setActiveSection(first.target.id as SectionId)
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 },
    )

    targets.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [project])

  if (!institution || !project) {
    return <Navigate to="/" replace />
  }

  const catalogHref = `/instituciones/${institution.slug}/proyectos`
  const related = getRelatedProjects(project)

  const allProjects = getInstitutionProjects(institution.id)
  const index = allProjects.findIndex((candidate) => candidate.id === project.id)
  const nextProject = allProjects[(index + 1) % allProjects.length] ?? project
  const previousProject =
    allProjects[(index - 1 + allProjects.length) % allProjects.length] ?? project
  const nextHref = `/instituciones/${institution.slug}/proyectos/${nextProject.slug}`
  const position = String(index + 1).padStart(2, '0')
  const total = String(allProjects.length).padStart(2, '0')

  const reveal = (delay = 0, distance = 22) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: distance, filter: 'blur(8px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.75, delay, ease: EASE },
        }

  const heroStyle = { '--project-accent': institution.accent } as CSSProperties

  return (
    <div className="explore-shell" style={heroStyle}>
      <PublicHeader institution={institution} />

      <main id="contenido">
        <section
          ref={heroRef}
          className="project-hero px-6 pt-6 pb-12 lg:px-8 lg:pt-8 lg:pb-16"
        >
          <div aria-hidden className="institution-hero-grid" />
          <div aria-hidden className="institution-hero-grain" />
          <div aria-hidden className="project-orb project-orb-a" />
          <div aria-hidden className="project-orb project-orb-b" />
          <div aria-hidden className="institution-blur-streak institution-blur-streak-a" />
          <div aria-hidden className="institution-blur-streak institution-blur-streak-b" />

          <div className="relative mx-auto max-w-[1200px]">
            <motion.nav
              {...reveal(0, 10)}
              className="flex flex-wrap items-center gap-2 text-sm text-legacy-muted"
              aria-label="Ruta"
            >
              <Link to="/" className="transition-colors hover:text-legacy-gold">
                Inicio
              </Link>
              <span aria-hidden>/</span>
              <Link
                to={`/instituciones/${institution.slug}`}
                className="transition-colors hover:text-legacy-gold"
              >
                {institution.name}
              </Link>
              <span aria-hidden>/</span>
              <Link to={catalogHref} className="transition-colors hover:text-legacy-gold">
                Proyectos
              </Link>
              <span aria-hidden>/</span>
              <span className="max-w-[280px] truncate font-medium text-legacy-white">
                {project.title}
              </span>
            </motion.nav>

            <motion.div {...reveal(0.05, 10)} className="mt-5">
              <button
                type="button"
                onClick={() => {
                  const state = location.state as { from?: string } | null
                  if (state?.from) navigate(-1)
                  else navigate(catalogHref)
                }}
                className="btn btn-ghost btn-sm pickup"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Volver a la vista anterior
              </button>
            </motion.div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
              <motion.div
                style={reduceMotion ? undefined : { y: textY, opacity: textOpacity }}
              >
                <motion.span {...reveal(0.1)} className="project-hero-eyebrow">
                  <span aria-hidden className="project-hero-eyebrow-dot" />
                  Proyecto de demostración
                  <span aria-hidden className="text-legacy-gold/40">·</span>
                  Publicado {project.year}
                </motion.span>

                <motion.div
                  {...reveal(0.18)}
                  className="mt-5 flex flex-wrap gap-2"
                  aria-label="Clasificación"
                >
                  <Link
                    to={`${catalogHref}?area=${encodeURIComponent(project.area)}`}
                    className="project-meta-link"
                  >
                    <Layers3 className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
                    {project.area}
                  </Link>
                  <Link
                    to={`${catalogHref}?category=${encodeURIComponent(project.category)}`}
                    className="project-meta-link"
                  >
                    <Tags className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
                    {project.category}
                  </Link>
                  <Link
                    to={`${catalogHref}?year=${project.year}`}
                    className="project-meta-link"
                  >
                    <Calendar className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
                    {project.year}
                  </Link>
                </motion.div>

                <motion.h1
                  {...reveal(0.26, 28)}
                  className="project-hero-title mt-5 font-display text-[clamp(2.4rem,5.2vw,4.3rem)] leading-[1.02] font-semibold"
                >
                  {project.title}
                </motion.h1>

                <motion.p
                  {...reveal(0.36)}
                  className="mt-5 max-w-xl text-lg leading-relaxed text-legacy-muted"
                >
                  {project.subtitle}
                </motion.p>

                <motion.ul
                  {...reveal(0.44)}
                  className="mt-6 flex flex-wrap gap-2"
                  aria-label="Participantes"
                >
                  {project.authors.map((author) => (
                    <li key={author.id} className="project-author-chip">
                      <span aria-hidden className="project-author-initial">
                        {initialsOf(author.name)}
                      </span>
                      <span className="leading-tight">
                        <span className="block font-medium">{author.name}</span>
                        <span className="block text-[0.62rem] text-legacy-muted">
                          {author.role}
                        </span>
                      </span>
                    </li>
                  ))}
                </motion.ul>

                <motion.div {...reveal(0.54)} className="mt-8 flex flex-wrap gap-3">
                  <a href="#recursos" className="btn btn-primary btn-sm pickup">
                    <FileText className="h-4 w-4" aria-hidden />
                    Ver documentación
                  </a>
                  {project.videoUrl ? (
                    <a href="#recursos" className="btn btn-secondary btn-sm pickup">
                      <Play className="h-4 w-4" aria-hidden />
                      Ver video
                    </a>
                  ) : null}
                  <a href="#galeria" className="btn btn-ghost btn-sm pickup">
                    <Images className="h-4 w-4" aria-hidden />
                    Galería
                    <span className="header-nav-count">{project.gallery.length}</span>
                  </a>
                </motion.div>
              </motion.div>

              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 36, rotateX: 7, filter: 'blur(14px)' }
                }
                animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.05, delay: 0.2, ease: EASE }}
                className="perspective-[1400px]"
              >
                <motion.div
                  className="project-hero-cover aspect-[4/3] w-full"
                  style={reduceMotion ? undefined : { y: coverY, scale: coverScale }}
                >
                  <span aria-hidden className="project-hero-cover-shine" />
                  <span aria-hidden className="project-hero-cover-scrim" />
                  <SmartImage
                    src={project.coverImage}
                    alt={`Portada demostrativa de ${project.title}`}
                  />
                  <div className="project-hero-cover-caption">
                    <span className="project-hero-cover-tag">
                      <Users className="h-3 w-3 text-legacy-gold" aria-hidden />
                      {institution.shortName} · {project.authors.length}{' '}
                      {project.authors.length === 1 ? 'participante' : 'participantes'}
                    </span>
                    <span className="project-hero-cover-index">
                      {position}
                      <small>/ {total}</small>
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <nav className="project-subnav px-6 lg:px-8" aria-label="Secciones de la ficha">
          <div className="mx-auto flex max-w-[1200px] items-center">
            <div className="project-subnav-track">
              {SECTIONS.map((section, sectionIndex) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={cn(
                    'project-subnav-link',
                    activeSection === section.id && 'is-active',
                  )}
                  aria-current={activeSection === section.id ? 'location' : undefined}
                >
                  <span className="project-subnav-step">{sectionIndex + 1}</span>
                  {section.label}
                </a>
              ))}
            </div>
            <Link
              to={nextHref}
              className="project-subnav-side hidden transition-colors hover:text-legacy-gold lg:inline-flex"
            >
              <span className="text-legacy-muted/70">Siguiente</span>
              <span className="max-w-[16rem] truncate text-legacy-white">
                {nextProject.title}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start lg:gap-12 lg:px-8 lg:py-14">
          <div className="min-w-0 space-y-16">
            <AcademicSection id="resumen" eyebrow="Resumen" title="Descripción general">
              <p>{project.description}</p>
            </AcademicSection>

            <ProcessTimeline project={project} />

            <ProjectGallery title={project.title} images={project.gallery} />

            <ProjectResources project={project} />

            <ProjectPager
              previous={previousProject}
              next={nextProject}
              position={index + 1}
              total={allProjects.length}
            />
          </div>

          <ProjectSheet
            project={project}
            institution={institution}
            catalogHref={catalogHref}
            nextProject={nextProject}
            nextHref={nextHref}
          />
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
                <Link to={catalogHref} className="btn btn-ghost btn-sm pickup">
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

function viewReveal(reduceMotion: boolean | null, delay = 0) {
  return reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 26, filter: 'blur(8px)' },
        whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.7, delay, ease: EASE },
      }
}

function AcademicSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string
  eyebrow: string
  title: string
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section id={id} {...viewReveal(reduceMotion)}>
      <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-legacy-white">{title}</h2>
      <div className="project-section-rule mt-3" aria-hidden />
      <div className="project-lead mt-5 text-[1.02rem] leading-8 text-legacy-muted">
        {children}
      </div>
    </motion.section>
  )
}
