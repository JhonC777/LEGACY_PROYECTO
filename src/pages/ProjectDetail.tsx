import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  Images,
  Play,
  Users,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useParams,
} from 'react-router-dom'
import { ExploreFooter } from '@/components/explore/ExploreFooter'
import { ExploreShell } from '@/components/layout/ExploreShell'
import { ProcessTimeline } from '@/components/project/ProcessTimeline'
import { ProjectGallery } from '@/components/project/ProjectGallery'
import { ProjectPager } from '@/components/project/ProjectPager'
import { ProjectResources } from '@/components/project/ProjectResources'
import { ProjectSheet } from '@/components/project/ProjectSheet'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { PublicHeader } from '@/components/public/PublicHeader'
import { SmartImage } from '@/components/ui/SmartImage'
import {
  resolveInstitution,
  resolveInstitutionProjects,
  resolveProjectBySlug,
  resolveRelatedProjects,
  useArchiveRevision,
} from '@/admin/archiveBridge'
import { getInstitutionBySlug, isRealShowcase } from '@/data/demoData'
import { cn } from '@/lib/cn'

const SECTIONS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'galeria', label: 'Galería' },
  { id: 'recursos', label: 'Recursos' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const EASE = [0.22, 1, 0.36, 1] as const

export function ProjectDetail() {
  const { institutionSlug, projectSlug } = useParams()
  const reduceMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const scrollRootRef = useRef<HTMLElement | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('resumen')
  const revision = useArchiveRevision()

  const base = getInstitutionBySlug(institutionSlug)
  const institution = base ? resolveInstitution(base) : undefined
  const project = institution ? resolveProjectBySlug(institution, projectSlug) : undefined
  void revision

  useLayoutEffect(() => {
    scrollRootRef.current = document.querySelector('.explore-scroll')
  }, [])

  const { scrollYProgress } = useScroll({
    container: scrollRootRef,
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
      {
        root: scrollRootRef.current,
        rootMargin: '-35% 0px -55% 0px',
        threshold: 0,
      },
    )

    targets.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [project])

  if (!institution || !institution.isActive || !project) {
    return <Navigate to="/" replace />
  }

  const catalogHref = `/instituciones/${institution.slug}/proyectos`
  const related = resolveRelatedProjects(institution, project)
  const allProjects = resolveInstitutionProjects(institution, true)
  const index = allProjects.findIndex((candidate) => candidate.id === project.id)
  const nextProject = allProjects[(index + 1) % allProjects.length] ?? project
  const previousProject =
    allProjects[(index - 1 + allProjects.length) % allProjects.length] ?? project
  const nextHref = `/instituciones/${institution.slug}/proyectos/${nextProject.slug}`

  const reveal = (delay = 0, distance = 16) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: distance },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: EASE },
        }

  const heroStyle = { '--project-accent': institution.accent } as CSSProperties

  return (
    <ExploreShell style={heroStyle}>
      <PublicHeader institution={institution} />

      <main id="contenido" className="project-stage">
        <section
          ref={heroRef}
          className="project-hero px-6 pt-7 pb-10 lg:px-8 lg:pt-9 lg:pb-12"
        >
          <div className="relative mx-auto max-w-[1180px]">
            <div className="project-hero-grid">
              <motion.div
                style={reduceMotion ? undefined : { y: textY, opacity: textOpacity }}
                className="project-hero-voice"
              >
                <motion.p {...reveal(0.08)} className="project-hero-kicker">
                  {isRealShowcase(project) ? (
                    <span className="knowledge-fragment-real">Real</span>
                  ) : null}
                  Fragmento de conocimiento
                  <span aria-hidden>·</span>
                  Publicado {project.year}
                </motion.p>

                <motion.h1
                  {...reveal(0.16, 22)}
                  className="project-hero-title mt-4 font-brand text-[clamp(2.2rem,4.6vw,3.85rem)] leading-[1.04] font-semibold"
                >
                  {project.title}
                </motion.h1>

                <motion.p
                  {...reveal(0.26)}
                  className="project-hero-dek mt-5"
                >
                  {project.subtitle}
                </motion.p>

                <motion.p
                  {...reveal(0.34)}
                  className="project-hero-meta mt-6"
                  aria-label="Clasificación"
                >
                  <Link to={`${catalogHref}?area=${encodeURIComponent(project.area)}`}>
                    {project.area}
                  </Link>
                  <span aria-hidden>·</span>
                  <Link
                    to={`${catalogHref}?category=${encodeURIComponent(project.category)}`}
                  >
                    {project.category}
                  </Link>
                  <span aria-hidden>·</span>
                  <Link to={`${catalogHref}?year=${project.year}`}>{project.year}</Link>
                </motion.p>

                <motion.p {...reveal(0.42)} className="project-hero-byline mt-5">
                  <Users className="h-3.5 w-3.5 text-legacy-gold/80" aria-hidden />
                  <span>
                    {project.authors.map((author) => author.name).join(', ')}
                  </span>
                </motion.p>

                <motion.div {...reveal(0.5)} className="mt-8 flex flex-wrap gap-3">
                  <a href="#resumen" className="home-cta is-primary">
                    Leer el archivo
                  </a>
                  <a href="#galeria" className="home-cta is-ghost">
                    <Images className="h-3.5 w-3.5" aria-hidden />
                    Galería
                  </a>
                  {project.videoUrl ? (
                    <a href="#recursos" className="home-cta is-ghost">
                      <Play className="h-3.5 w-3.5" aria-hidden />
                      Video
                    </a>
                  ) : null}
                </motion.div>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.18, ease: EASE }}
                className="project-hero-plate"
              >
                <motion.div
                  className={cn(
                    'project-hero-cover aspect-[4/3] w-full',
                    isRealShowcase(project) && 'is-real-cover',
                  )}
                  style={reduceMotion ? undefined : { y: coverY, scale: coverScale }}
                >
                  <span aria-hidden className="project-hero-cover-shine" />
                  <span aria-hidden className="project-hero-cover-scrim" />
                  <SmartImage
                    src={project.coverImage}
                    alt={`Portada de ${project.title}`}
                    priority
                  />
                  <div className="project-hero-cover-caption">
                    <span className="project-hero-cover-tag">
                      {institution.shortName}
                    </span>
                    <span className="project-hero-cover-index">
                      {project.authors.length}{' '}
                      {project.authors.length === 1 ? 'autor' : 'autores'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        <nav className="project-subnav px-6 lg:px-8" aria-label="Secciones de la ficha">
          <div className="mx-auto flex max-w-[1180px] items-center">
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

        <div className="project-body mx-auto grid max-w-[1180px] gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10 lg:px-8 lg:py-12">
          <div className="project-reading min-w-0 space-y-12 lg:space-y-14">
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
          <section className="project-related px-6 py-12 lg:px-8">
            <div className="mx-auto max-w-[1180px]">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="home-threshold-kicker">En el mismo archivo</p>
                  <h2 className="mt-1 font-brand text-[1.85rem] font-semibold text-legacy-white">
                    Otros fragmentos
                  </h2>
                </div>
                <Link to={catalogHref} className="home-explore-link w-auto">
                  Volver al catálogo
                </Link>
              </div>
              <div className="knowledge-catalog">
                {related.map((relatedProject, index) => (
                  <ProjectCard
                    key={relatedProject.id}
                    project={relatedProject}
                    folio={index + 1}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <ExploreFooter />
    </ExploreShell>
  )
}

function viewReveal(reduceMotion: boolean | null, delay = 0) {
  return reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.65, delay, ease: EASE },
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
    <motion.section id={id} className="project-block" {...viewReveal(reduceMotion)}>
      <p className="home-threshold-kicker">{eyebrow}</p>
      <h2 className="mt-1 font-brand text-[1.85rem] font-semibold text-legacy-white">
        {title}
      </h2>
      <div className="project-section-rule mt-3" aria-hidden />
      <div className="project-lead mt-5">{children}</div>
    </motion.section>
  )
}