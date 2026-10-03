import { usePageMeta } from '@/lib/usePageMeta'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  FileText,
  Images,
  Play,
  Users,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ExploreFooter } from '@/components/explore/ExploreFooter'
import { ExploreShell } from '@/components/layout/ExploreShell'
import { ProcessTimeline } from '@/components/project/ProcessTimeline'
import { ProjectGallery } from '@/components/project/ProjectGallery'
import { ProjectPager } from '@/components/project/ProjectPager'
import { ProjectResources } from '@/components/project/ProjectResources'
import { ProjectSheet } from '@/components/project/ProjectSheet'
import { ProjectSummary } from '@/components/project/ProjectSummary'
import { ReadingMode } from '@/components/project/ReadingMode'
import { ResourceViewer, type ViewerTarget } from '@/components/project/ResourceViewer'
import { GeneratedCover } from '@/components/projects/GeneratedCover'
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
import { getProjectResources } from '@/lib/projectResources'
import { scrollLegacyElementIntoView } from '@/lib/legacyScroll'
import { cn } from '@/lib/cn'
import '@/styles/info.css'

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'proceso', label: 'Proceso' },
  { id: 'galeria', label: 'Galería' },
  { id: 'recursos', label: 'Recursos' },
] as const

type TabId = (typeof TABS)[number]['id']

/** Anclas antiguas (#documentacion) siguen llevando a su pestaña. */
const HASH_TO_TAB: Record<string, TabId> = {
  resumen: 'resumen',
  proceso: 'proceso',
  galeria: 'galeria',
  recursos: 'recursos',
  documentacion: 'recursos',
}

function tabFromHash(hash: string): TabId | null {
  return HASH_TO_TAB[hash.replace(/^#/, '')] ?? null
}

const EASE = [0.22, 1, 0.36, 1] as const

export function ProjectDetail() {
  const { institutionSlug, projectSlug } = useParams()
  const reduceMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const scrollRootRef = useRef<HTMLElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>(() => tabFromHash(location.hash) ?? 'resumen')
  const [viewer, setViewer] = useState<ViewerTarget | null>(null)
  const tabsAnchorRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const skipHashScroll = useRef(false)
  const revision = useArchiveRevision()

  const base = getInstitutionBySlug(institutionSlug)
  const institution = base ? resolveInstitution(base) : undefined
  const project = institution ? resolveProjectBySlug(institution, projectSlug) : undefined
  void revision
  usePageMeta({
    title: project && institution ? `${project.title} · ${institution.name}` : undefined,
    description: project ? project.subtitle || project.description : undefined,
  })

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

  const resources = useMemo(() => (project ? getProjectResources(project) : []), [project])
  const galleryImages = resources.find((item) => item.id === 'galeria')?.images ?? []
  const readingOpen = params.get('lectura') === '1'

  // Ancla en la URL → pestaña. Sirve para enlaces viejos (#galeria, #documentacion).
  useEffect(() => {
    const tab = tabFromHash(location.hash)
    if (!tab) return
    setActiveTab(tab)
    if (skipHashScroll.current) {
      skipHashScroll.current = false
      return
    }
    const frame = window.requestAnimationFrame(() => {
      if (tabsAnchorRef.current) scrollLegacyElementIntoView(tabsAnchorRef.current, 'start')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.hash])

  // En pantallas angostas la tira de pestañas se desplaza: mantener visible la activa.
  useEffect(() => {
    const tab = tabRefs.current[activeTab]
    const list = tab?.parentElement
    if (!tab || !list || list.scrollWidth <= list.clientWidth) return
    const left = tab.offsetLeft - list.offsetLeft
    const right = left + tab.offsetWidth
    if (left >= list.scrollLeft && right <= list.scrollLeft + list.clientWidth) return
    list.scrollTo({ left: Math.max(0, left - 12), behavior: 'auto' })
  }, [activeTab])

  const selectTab = useCallback(
    (tab: TabId, options: { focus?: boolean; scroll?: boolean } = {}) => {
      setActiveTab(tab)
      skipHashScroll.current = true
      navigate(
        { pathname: location.pathname, search: location.search, hash: `#${tab}` },
        { replace: true, state: location.state, preventScrollReset: true },
      )
      if (options.focus) tabRefs.current[tab]?.focus()
      const anchor = tabsAnchorRef.current
      if (!anchor) return
      const header =
        Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--legacy-header-h')) || 68
      if (options.scroll || anchor.getBoundingClientRect().top < header) {
        scrollLegacyElementIntoView(anchor, 'start')
      }
    },
    [location.pathname, location.search, location.state, navigate],
  )

  const onTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const order = TABS.map((tab) => tab.id)
    const current = order.indexOf(activeTab)
    let next = -1
    if (event.key === 'ArrowRight') next = (current + 1) % order.length
    if (event.key === 'ArrowLeft') next = (current - 1 + order.length) % order.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = order.length - 1
    if (next < 0) return
    event.preventDefault()
    selectTab(order[next], { focus: true })
  }

  const openReading = () => {
    const next = new URLSearchParams(location.search)
    next.set('lectura', '1')
    navigate(
      { pathname: location.pathname, search: `?${next.toString()}`, hash: location.hash },
      { state: { ...(location.state as object | null), lectura: true }, preventScrollReset: true },
    )
  }

  const closeReading = useCallback(() => {
    if ((location.state as { lectura?: boolean } | null)?.lectura) {
      navigate(-1)
      return
    }
    const next = new URLSearchParams(location.search)
    next.delete('lectura')
    const search = next.toString()
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true, state: location.state, preventScrollReset: true },
    )
  }, [location.hash, location.pathname, location.search, location.state, navigate])

  const closeViewer = useCallback(() => setViewer(null), [])

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

  const heroStyle = { '--project-accent': 'var(--legacy-gold)' } as CSSProperties
  const primaryDoc = resources.find((item) => item.id === 'pdf' || item.id === 'doc')
  const videoResource = resources.find((item) => item.id === 'video')
  const processCount = [project.problem, project.solution, project.methodology, project.results].filter(
    (text) => text?.trim(),
  ).length
  const counts: Partial<Record<TabId, number>> = {
    proceso: processCount,
    galeria: galleryImages.length,
    recursos: resources.length,
  }

  return (
    <ExploreShell className="is-institution" style={heroStyle}>
      <PublicHeader institution={institution} />

      <main id="contenido" className="project-stage">
        <section
          ref={heroRef}
          className="project-hero is-info px-6 pt-7 pb-10 lg:px-8 lg:pt-9 lg:pb-12"
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
                  <button type="button" onClick={openReading} className="home-cta is-primary">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    Modo lectura
                  </button>
                  {primaryDoc ? (
                    <button
                      type="button"
                      onClick={() => setViewer({ id: primaryDoc.id, index: 0 })}
                      className="home-cta is-ghost"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      {primaryDoc.kind === 'pdf' ? 'Ver PDF' : 'Ver documento'}
                    </button>
                  ) : null}
                  {galleryImages.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setViewer({ id: 'galeria', index: 0 })}
                      className="home-cta is-ghost"
                    >
                      <Images className="h-3.5 w-3.5" aria-hidden />
                      Galería
                    </button>
                  ) : null}
                  {videoResource ? (
                    <button
                      type="button"
                      onClick={() => setViewer({ id: 'video', index: 0 })}
                      className="home-cta is-ghost"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden />
                      Video
                    </button>
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
                    fallback={
                      <GeneratedCover
                        area={project.area}
                        title={project.title}
                        year={project.year}
                        seed={project.slug}
                        institution={institution.shortName}
                        variant="hero"
                        showText={false}
                      />
                    }
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

        <div className="mx-auto max-w-[1180px] px-6 lg:px-8">
          <ProjectSummary project={project} />
        </div>

        <div ref={tabsAnchorRef} className="project-tabs-anchor" aria-hidden />
        <div className="project-subnav is-tabs px-4 sm:px-6 lg:px-8">
          <div className="project-tabs-bar mx-auto max-w-[1180px]">
            <div className="project-tabs" role="tablist" aria-label="Secciones de la ficha">
              {TABS.map((tab) => {
                const selected = activeTab === tab.id
                const count = counts[tab.id]
                return (
                  <button
                    key={tab.id}
                    ref={(node) => {
                      tabRefs.current[tab.id] = node
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    className={cn('project-tab', selected && 'is-active')}
                    onClick={() => selectTab(tab.id)}
                    onKeyDown={onTabKey}
                  >
                    {tab.label}
                    {typeof count === 'number' ? (
                      <span className="project-tab-count" aria-label={`${count} elementos`}>
                        {count}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
            <Link to={nextHref} className="project-tabs-next">
              <span className="text-legacy-muted">Siguiente</span>
              <span className="project-tabs-next-title">{nextProject.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </Link>
          </div>
        </div>

        <div className="project-body mx-auto grid max-w-[1180px] gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10 lg:px-8 lg:py-10">
          <div className="project-reading min-w-0">
            <div role="tabpanel" id="panel-resumen" aria-labelledby="tab-resumen" hidden={activeTab !== 'resumen'} tabIndex={0} className="project-panel">
              <AcademicSection eyebrow="Resumen" title="Descripción general">
                <p>{project.description}</p>
              </AcademicSection>
            </div>
            <div role="tabpanel" id="panel-proceso" aria-labelledby="tab-proceso" hidden={activeTab !== 'proceso'} tabIndex={0} className="project-panel">
              <ProcessTimeline project={project} />
            </div>
            <div role="tabpanel" id="panel-galeria" aria-labelledby="tab-galeria" hidden={activeTab !== 'galeria'} tabIndex={0} className="project-panel">
              <ProjectGallery
                title={project.title}
                images={galleryImages}
                onOpen={(imageIndex) => setViewer({ id: 'galeria', index: imageIndex })}
              />
            </div>
            <div role="tabpanel" id="panel-recursos" aria-labelledby="tab-recursos" hidden={activeTab !== 'recursos'} tabIndex={0} className="project-panel">
              <ProjectResources resources={resources} onOpen={(id) => setViewer({ id, index: 0 })} />
            </div>

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

      <ResourceViewer
        resources={resources}
        projectTitle={project.title}
        target={viewer}
        onChange={setViewer}
        onClose={closeViewer}
      />
      <ReadingMode project={project} open={readingOpen} onClose={closeReading} />
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