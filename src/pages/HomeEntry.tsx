import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import '@/styles/home.css'
import { AccessModeDialog } from '@/components/entry/AccessModeDialog'
import { HomeFeaturedRail } from '@/components/entry/HomeFeaturedRail'
import { HomePurpose } from '@/components/entry/HomePurpose'
import type { InstitutionFacts } from '@/components/entry/InstitutionCard'
import { InstitutionSelector } from '@/components/entry/InstitutionSelector'
import { ExploreHeader } from '@/components/explore/ExploreHeader'
import { LegacyMark } from '@/components/brand/LegacyMark'
import { LegacyWordmark } from '@/components/brand/LegacyWordmark'
import { withLegacyName } from '@/components/brand/LegacyName'
import { HomeHero } from '@/components/home/HomeHero'
import {
  resolveInstitutionProjects,
  useArchiveRevision,
} from '@/admin/archiveBridge'
import {
  getInstitutionBySlug,
  PILOT_CATALOG_PATH,
  type DemoProject,
} from '@/data/demoData'
import { scrollLegacyElementIntoView } from '@/lib/legacyScroll'
import { MOCK_INSTITUTIONS, type Institution } from '@/data/mockInstitutions'

/** Cifras reales a partir de los proyectos publicados (sin inventar datos). */
function factsOf(projects: DemoProject[]): InstitutionFacts {
  const people = new Set<string>()
  const categories = new Set<string>()
  let min = Infinity
  let max = -Infinity
  for (const project of projects) {
    for (const author of project.authors) people.add(author.name.trim().toLowerCase())
    if (project.category) categories.add(project.category)
    if (Number.isFinite(project.year)) {
      min = Math.min(min, project.year)
      max = Math.max(max, project.year)
    }
  }
  const years = Number.isFinite(min) ? (min === max ? String(min) : `${min}–${max}`) : null
  return { projects: projects.length, participants: people.size, categories: categories.size, years }
}

export function HomeEntry() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Institution | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  const archiveRevision = useArchiveRevision()
  const published = useMemo(() => {
    const bySlug: Record<string, DemoProject[]> = {}
    for (const institution of MOCK_INSTITUTIONS) {
      if (!institution.isActive) continue
      const demo = getInstitutionBySlug(institution.slug)
      if (demo) bySlug[institution.slug] = resolveInstitutionProjects(demo, true)
    }
    return bySlug
    // archiveRevision invalida la caché cuando el panel publica cambios
  }, [archiveRevision])

  const featured = useMemo(
    () =>
      Object.values(published)
        .flat()
        .filter((project) => project.isFeatured)
        .sort(
          (a, b) =>
            Number(Boolean(b.isReal)) - Number(Boolean(a.isReal)) ||
            b.year - a.year ||
            a.title.localeCompare(b.title, 'es'),
        )
        .slice(0, 3),
    [published],
  )
  const { facts, projectCounts, totals } = useMemo(() => {
    const factsBySlug: Record<string, InstitutionFacts> = {}
    const counts: Record<string, number> = {}
    for (const [slug, projects] of Object.entries(published)) {
      factsBySlug[slug] = factsOf(projects)
      if (projects.length > 0) counts[slug] = projects.length
    }
    return { facts: factsBySlug, projectCounts: counts, totals: factsOf(Object.values(published).flat()) }
  }, [published])

  /* Revelado suave de las secciones al entrar en vista (solo clases; nada inline). */
  useEffect(() => {
    const root = stageRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('.home-reveal'))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-in'))
      return
    }
    root.classList.add('has-reveal')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      },
      { root, rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    nodes.forEach((node) => io.observe(node))
    return () => io.disconnect()
  }, [featured.length])

  const handleSelect = (institution: Institution) => {
    if (!institution.isActive) return
    setSelected(institution)
    setDialogOpen(true)
  }

  const handleExploreAll = () => navigate('/explorar')

  const handleGuestAccess = (institution: Institution) => {
    setDialogOpen(false)
    navigate(`/instituciones/${institution.slug}`)
  }

  const handleAdminAccess = (institution: Institution) => {
    setDialogOpen(false)
    navigate(`/admin/login?institution=${institution.slug}`)
  }

  const scrollToId = (id: string, fallback?: string) => {
    const section = document.getElementById(id)
    if (section && scrollLegacyElementIntoView(section, 'start')) return
    if (fallback) navigate(fallback)
  }

  return (
    <main className="app-shell home-v3">
      <ExploreHeader />

      <div
        ref={stageRef}
        className="home-entry-stage legacy-hidden-scroll home-v3-stage"
      >
        <HomeHero
          stats={totals}
          onExplore={() => navigate('/instituciones')}
          onFragments={featured.length > 0 ? () => scrollToId('home-fragmentos', PILOT_CATALOG_PATH) : undefined}
          onScrollCue={() => scrollToId('home-instituciones')}
        />

        <section id="home-instituciones" className="home-section" aria-label="Instituciones">
          <div className="home-container">
            <InstitutionSelector
              institutions={MOCK_INSTITUTIONS}
              onSelect={handleSelect}
              onExploreAll={handleExploreAll}
              projectCounts={projectCounts}
              facts={facts}
            />
          </div>
        </section>

        {featured.length > 0 ? (
          <div className="home-section">
            <div className="home-container">
              <HomeFeaturedRail projects={featured} onExploreCatalog={handleExploreAll} />
            </div>
          </div>
        ) : null}

        <div className="home-section">
          <div className="home-container">
            <HomePurpose />
            <div className="home-closing home-reveal">
              <p className="home-closing-line">
                <span>Una institución hoy</span>
                <i aria-hidden>◆</i>
                <span>El archivo crece con cada casa</span>
              </p>
              <button type="button" className="home-btn is-gold" onClick={handleExploreAll}>
                Explorar el archivo público
                <ArrowRight className="home-btn-icon" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <footer className="home-footer">
          <div className="home-container home-footer-grid">
            <div className="home-footer-brand">
              <Link to="/" className="legacy-brand home-footer-mark" aria-label="LEGACY, volver al inicio">
                <LegacyMark size="sm" />
                <span className="legacy-brand-rule" aria-hidden />
                <LegacyWordmark className="block" />
              </Link>
              <p className="home-footer-slogan">
                Donde el conocimiento <em>deja legado.</em>
              </p>
            </div>
            <nav className="home-footer-nav" aria-label="Archivo">
              <p className="home-footer-h">Archivo</p>
              <Link to={PILOT_CATALOG_PATH}>Explorar</Link>
              <Link to="/instituciones">Instituciones</Link>
              <Link to="/explorar#categorias">Categorías</Link>
              <Link to="/explorar#proyectos">Destacados</Link>
            </nav>
            <nav className="home-footer-nav" aria-label="Plataforma">
              <p className="home-footer-h">Plataforma</p>
              <Link to="/explorar#mision">{withLegacyName('Sobre LEGACY')}</Link>
              <Link to="/admin/login">Administrador</Link>
            </nav>
          </div>
          <div className="home-container home-footer-bottom">
            <p>{withLegacyName(`© ${new Date().getFullYear()} LEGACY · Archivo académico institucional`)}</p>
            {totals.projects > 0 ? (
              <p>
                {totals.projects} proyectos · {totals.participants} participantes · {totals.categories} categorías
                {totals.years ? ` · ${totals.years}` : ''}
              </p>
            ) : null}
          </div>
        </footer>
      </div>

      <AccessModeDialog
        institution={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onGuestAccess={handleGuestAccess}
        onAdminAccess={handleAdminAccess}
      />
    </main>
  )
}
