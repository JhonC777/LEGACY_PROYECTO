import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Layers3,
  Library,
  Menu,
  MessageSquareText,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { LegacyMark } from '@/components/brand/LegacyMark'
import { LegacyWordmark } from '@/components/brand/LegacyWordmark'
import { cn } from '@/lib/cn'
import { getLegacyScrollRoot } from '@/lib/legacyScroll'
import { ArchiveAssistantPanel } from '@/components/assistant/ArchiveAssistantPanel'
import { InstitutionLogo } from '@/components/institution/InstitutionLogo'
import {
  DEMO_INSTITUTIONS,
  PILOT_CATALOG_PATH,
  getAvailableYears,
  type DemoInstitution,
} from '@/data/demoData'
import {
  resolveInstitution,
  resolveInstitutionProjects,
  resolveProjectBySlug,
  useArchiveRevision,
} from '@/admin/archiveBridge'

type PublicHeaderProps = {
  institution?: DemoInstitution
}

type MenuKey = 'institution' | 'area' | 'year' | 'collection'

function navClass(active: boolean) {
  return cn(
    'nav-liquid text-sm font-medium',
    active ? 'is-active text-legacy-gold' : 'text-legacy-muted hover:text-legacy-gold',
  )
}

export function PublicHeader({ institution: incoming }: PublicHeaderProps) {
  const revision = useArchiveRevision()
  const institution = incoming ? resolveInstitution(incoming) : undefined
  const location = useLocation()
  const navigate = useNavigate()
  const { projectSlug } = useParams()
  const headerRef = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [condensed, setCondensed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [term, setTerm] = useState('')
  const [shortcutLabel] = useState(() =>
    typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.userAgent)
      ? '⌘K'
      : 'Ctrl K',
  )

  const institutionBase = institution
    ? `/instituciones/${institution.slug}`
    : '/explorar'
  const archiveHref = institution
    ? `/instituciones/${institution.slug}?vista=archivo`
    : '/explorar'
  const projectsHref = institution
    ? `/instituciones/${institution.slug}/proyectos`
    : PILOT_CATALOG_PATH

  const onCoverView =
    Boolean(institution) &&
    location.pathname === institutionBase &&
    new URLSearchParams(location.search).get('vista') !== 'archivo'
  const onInstitutionView =
    Boolean(institution) &&
    location.pathname === institutionBase &&
    new URLSearchParams(location.search).get('vista') === 'archivo'
  const onProjectsView = institution
    ? location.pathname.startsWith(`${institutionBase}/proyectos`)
    : location.pathname === '/proyectos' ||
      location.pathname.startsWith('/proyectos/')
  const onProjectDetail = institution
    ? location.pathname.startsWith(`${institutionBase}/proyectos/`)
    : /^\/proyectos\/[^/]+/.test(location.pathname)
  const onExploreView =
    location.pathname === '/explorar' || location.pathname === '/instituciones'

  /** En portada y catálogo no se vuelca el archivo: la portada es solo umbral. */
  const showToolbar = !onProjectsView && !onCoverView

  const scoped = useMemo(
    () =>
      institution
        ? resolveInstitutionProjects(institution, true)
        : DEMO_INSTITUTIONS.flatMap((item) => resolveInstitutionProjects(item, true)),
    [institution, revision],
  )

  const areas = useMemo(
    () =>
      [...new Set(scoped.map((project) => project.area))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [scoped],
  )

  const years = useMemo(() => getAvailableYears(scoped), [scoped])

  const collections = useMemo(
    () =>
      [
        ...new Set(
          scoped
            .map((project) => project.collection)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort((a, b) => a.localeCompare(b, 'es')),
    [scoped, revision],
  )

  const institutionOptions = useMemo(
    () =>
      DEMO_INSTITUTIONS.map((item) => ({
        item: resolveInstitution(item),
        count: resolveInstitutionProjects(item, true).length,
      })),
    [revision],
  )

  const yearRange =
    years.length > 1
      ? `${years[years.length - 1]}–${years[0]}`
      : years.length === 1
        ? String(years[0])
        : '—'

  const currentProject =
    institution && onProjectDetail && projectSlug
      ? resolveProjectBySlug(institution, projectSlug)
      : undefined
  const projectIndex = currentProject
    ? scoped.findIndex((item) => item.id === currentProject.id)
    : -1
  const showContextRail = !showToolbar && !onCoverView

  const goBackToArchive = () => {
    const state = location.state as { from?: string } | null
    if (state?.from) navigate(-1)
    else navigate(projectsHref)
    setSheetOpen(false)
  }

  useEffect(() => {
    setOpenMenu(null)
    setSheetOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    setAssistantOpen(false)
  }, [location.pathname, institution?.id])

  useEffect(() => {
    if (!openMenu && !sheetOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenMenu(null)
        setSheetOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null)
        setSheetOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openMenu, sheetOpen])

  useEffect(() => {
    let frame = 0
    const root = getLegacyScrollRoot(headerRef.current)

    const update = () => {
      frame = 0
      const top = root ? root.scrollTop : window.scrollY
      const max = root
        ? root.scrollHeight - root.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight
      setCondensed(top > 10)
      setProgress(max > 8 ? Math.min(1, Math.max(0, top / max)) : 0)
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    const target: EventTarget = root ?? window
    target.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [location.pathname])

  /** Expone la altura real para los elementos sticky de las páginas. */
  useEffect(() => {
    const node = headerRef.current
    if (!node) return

    const apply = () =>
      document.documentElement.style.setProperty(
        '--legacy-header-h',
        `${Math.round(node.getBoundingClientRect().height)}px`,
      )

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!showToolbar) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (assistantOpen) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showToolbar, assistantOpen])

  const filterHref = (key: string, value: string | number) =>
    `${projectsHref}?${key}=${encodeURIComponent(String(value))}`

  const countBy = (predicate: (project: (typeof scoped)[number]) => boolean) =>
    scoped.filter(predicate).length

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const value = term.trim()
    navigate(value ? `${projectsHref}?q=${encodeURIComponent(value)}` : projectsHref)
    setTerm('')
    setSheetOpen(false)
  }

  const toggleMenu = (key: MenuKey) =>
    setOpenMenu((current) => (current === key ? null : key))

  const openAssistant = () => {
    setOpenMenu(null)
    setSheetOpen(false)
    setAssistantOpen(true)
  }

  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <header
        ref={headerRef}
        className={cn('glass-header legacy-header sticky top-0 z-40', condensed && 'is-condensed')}
      >
        <div className="header-main">
          <div className="header-identity">
            <Link
              to="/"
              className="legacy-brand flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl"
              aria-label="Volver al inicio de LEGACY"
            >
              <LegacyMark size="sm" />
              <span className="min-w-0 leading-tight">
                <LegacyWordmark className="block" />
                <span className="hidden truncate text-[10px] text-legacy-muted sm:block">
                  Museo Digital del Legado Estudiantil
                </span>
              </span>
            </Link>

            <span className="header-divider hidden lg:block" aria-hidden />

            <div className="header-switcher relative hidden lg:block">
              <button
                type="button"
                className={cn('header-chip', openMenu === 'institution' && 'is-open')}
                aria-expanded={openMenu === 'institution'}
                aria-controls="header-institution-menu"
                title={institution ? institution.name : 'Todas las instituciones'}
                onClick={() => toggleMenu('institution')}
              >
                {institution ? (
                  <InstitutionLogo
                    name={institution.name}
                    logoUrl={institution.logoUrl}
                    fallback={institution.shortName}
                    accent={institution.accent}
                    decorative
                    className="header-avatar"
                    imageClassName="bg-white/95 p-0.5"
                  />
                ) : (
                  <Compass className="h-4 w-4 text-legacy-gold" aria-hidden />
                )}
                <span className="header-chip-copy">
                  <span className="header-chip-kicker">
                    {institution ? institution.shortName : 'Red LEGACY'}
                  </span>
                  <span className="header-chip-name">
                    {institution ? institution.name : 'Todas las instituciones'}
                  </span>
                </span>
                <ChevronDown className="header-chip-caret h-3.5 w-3.5" aria-hidden />
              </button>

              {openMenu === 'institution' ? (
                <div
                  id="header-institution-menu"
                  className="header-menu w-[22rem]"
                  aria-label="Cambiar de institución"
                >
                  <p className="header-menu-title">Instituciones demo</p>
                  <ul>
                    {institutionOptions.map(({ item, count }) => {
                      const isCurrent = item.id === institution?.id
                      return (
                        <li key={item.id}>
                          <Link
                            to={`/instituciones/${item.slug}`}
                            className={cn('header-menu-item', isCurrent && 'is-current')}
                            aria-current={isCurrent ? 'true' : undefined}
                          >
                            <InstitutionLogo
                              name={item.name}
                              logoUrl={item.logoUrl}
                              fallback={item.shortName}
                              accent={item.accent}
                              decorative
                              className="header-avatar"
                              imageClassName="bg-white/95 p-0.5"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-legacy-white">
                                {item.name}
                              </span>
                              <span className="block text-[11px] text-legacy-muted">
                                {count} proyectos demo
                              </span>
                            </span>
                            {isCurrent ? (
                              <Check className="h-4 w-4 shrink-0 text-legacy-gold" aria-hidden />
                            ) : (
                              <ArrowRight
                                className="h-4 w-4 shrink-0 text-legacy-muted"
                                aria-hidden
                              />
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="header-menu-footer">
                    <Link to="/" className="header-menu-action">
                      Ver todas las instituciones
                    </Link>
                    <Link to={projectsHref} className="header-menu-action">
                      Catálogo de la institución
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="header-nav hidden lg:flex" aria-label="Secciones">
            {institution ? (
              <Link
                to={archiveHref}
                className={navClass(onInstitutionView)}
                aria-current={onInstitutionView ? 'page' : undefined}
              >
                Institución
              </Link>
            ) : null}
            <NavLink
              to={projectsHref}
              className={navClass(onProjectsView)}
              aria-current={onProjectsView ? 'page' : undefined}
            >
              Proyectos
              <span className="header-nav-count">{scoped.length}</span>
            </NavLink>
            <NavLink
              to="/explorar"
              className={navClass(onExploreView)}
              aria-current={onExploreView ? 'page' : undefined}
            >
              Explorar
            </NavLink>
          </nav>

          <div className="header-tools">
            {showToolbar ? (
              <div className="header-search-slot hidden min-w-0">
                <form role="search" onSubmit={submitSearch} className="header-search">
                  <Search className="h-4 w-4 shrink-0 text-legacy-muted" aria-hidden />
                  <input
                    ref={searchRef}
                    type="search"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder={
                      institution ? `Buscar en ${institution.shortName}...` : 'Buscar proyectos...'
                    }
                    aria-label="Buscar en el catálogo"
                  />
                  <kbd className="header-kbd" aria-hidden>
                    {shortcutLabel}
                  </kbd>
                </form>
              </div>
            ) : null}

            {institution ? (
              <button
                type="button"
                className="header-action header-action-gold"
                aria-expanded={assistantOpen}
                aria-controls="archive-assistant-panel"
                aria-haspopup="dialog"
                aria-label="Consultar el archivo"
                title="Consultar el archivo"
                onClick={openAssistant}
              >
                <MessageSquareText className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline 2xl:hidden">Consultar</span>
                <span className="hidden 2xl:inline">Consultar el archivo</span>
              </button>
            ) : null}

            <Link
              to={`/admin/login${institution ? `?institution=${institution.slug}` : ''}`}
              className="header-action header-action-quiet"
              title="Panel de administración institucional"
            >
              <UserRound className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Administrador</span>
            </Link>

            <button
              type="button"
              className="header-action header-action-quiet header-menu-toggle"
              aria-expanded={sheetOpen}
              aria-controls="public-mobile-nav"
              onClick={() => setSheetOpen((open) => !open)}
            >
              {sheetOpen ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
              <span className="sr-only">Menú</span>
            </button>
          </div>
        </div>

        {showToolbar ? (
          <div className="header-rail is-filters hidden lg:block">
            <div className="header-chamber">
              <span className="header-subbar-label">Acceso rápido</span>

              <FilterMenu
                id="header-area-menu"
                label="Áreas"
                icon={Layers3}
                open={openMenu === 'area'}
                onToggle={() => toggleMenu('area')}
                items={areas.map((area) => ({
                  key: area,
                  label: area,
                  count: countBy((project) => project.area === area),
                  href: filterHref('area', area),
                }))}
                footerHref={projectsHref}
              />

              <FilterMenu
                id="header-year-menu"
                label="Años"
                icon={CalendarDays}
                open={openMenu === 'year'}
                onToggle={() => toggleMenu('year')}
                items={years.map((year) => ({
                  key: String(year),
                  label: String(year),
                  count: countBy((project) => project.year === year),
                  href: filterHref('year', year),
                }))}
                footerHref={projectsHref}
              />

              <FilterMenu
                id="header-collection-menu"
                label="Colecciones"
                icon={Library}
                open={openMenu === 'collection'}
                onToggle={() => toggleMenu('collection')}
                items={collections.map((collection) => ({
                  key: collection,
                  label: collection,
                  count: countBy((project) => project.collection === collection),
                  href: filterHref('collection', collection),
                }))}
                footerHref={projectsHref}
              />

              <p className="header-subbar-summary ml-auto">
                <span>{scoped.length} proyectos</span>
                <span aria-hidden>·</span>
                <span>{yearRange}</span>
                <span aria-hidden>·</span>
                <span>{areas.length} áreas</span>
                <span className="header-demo-pill">Demo</span>
              </p>
            </div>
          </div>
        ) : showContextRail ? (
          <div className="header-rail hidden lg:block">
            <div className="header-chamber">
              {onProjectDetail ? (
                <button type="button" className="header-back" onClick={goBackToArchive}>
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Volver
                </button>
              ) : (
                <span className="header-context-kicker">
                  <Archive className="h-3.5 w-3.5" aria-hidden />
                  Archivo académico
                </span>
              )}

              <span className="header-context-divider" aria-hidden />

              <nav className="header-context-path" aria-label="Ruta del archivo">
                <Link
                  to={institution ? institutionBase : '/explorar'}
                  className="header-context-link"
                >
                  {institution ? institution.shortName : 'Red institucional'}
                </Link>
                <ChevronRight className="h-3 w-3 shrink-0 text-white/25" aria-hidden />
                {onProjectDetail ? (
                  <>
                    <Link to={projectsHref} className="header-context-link">
                      Proyectos
                    </Link>
                    <ChevronRight className="h-3 w-3 shrink-0 text-white/25" aria-hidden />
                    <span className="header-context-current">
                      {currentProject?.title ?? 'Ficha académica'}
                    </span>
                  </>
                ) : (
                  <span className="header-context-current">Catálogo de proyectos</span>
                )}
              </nav>

              <p className="header-context-summary">
                {onProjectDetail && projectIndex >= 0 ? (
                  <span className="header-folio" aria-label="Posición en el archivo">
                    {String(projectIndex + 1).padStart(2, '0')}
                    <span> / {String(scoped.length).padStart(2, '0')}</span>
                  </span>
                ) : (
                  <>
                    <span>
                      <strong>{scoped.length}</strong> publicados
                    </span>
                    <span className="header-context-separator" aria-hidden />
                    <span>{yearRange}</span>
                    <span className="header-context-separator" aria-hidden />
                    <span>
                      <strong>{areas.length}</strong> áreas
                    </span>
                  </>
                )}
                <span className="header-demo-pill">Contenido demo</span>
              </p>
            </div>
          </div>
        ) : null}

        <span
          className="header-progress"
          style={{ transform: `scaleX(${progress})` }}
          aria-hidden
        />
      </header>

      {sheetOpen ? (
        <div id="public-mobile-nav" className="header-sheet lg:hidden">
          {onProjectDetail ? (
            <button type="button" className="header-back mb-3" onClick={goBackToArchive}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Volver
            </button>
          ) : null}

          {showToolbar ? (
            <form role="search" onSubmit={submitSearch} className="header-search w-full">
              <Search className="h-4 w-4 shrink-0 text-legacy-muted" aria-hidden />
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar proyectos..."
                aria-label="Buscar en el catálogo"
              />
            </form>
          ) : null}

          <div className={cn('header-sheet-context', !showToolbar && !onProjectDetail && 'mt-0')}>
            <span className="header-context-kicker">
              <Archive className="h-3.5 w-3.5" aria-hidden />
              {onProjectDetail ? 'Ficha académica' : 'Archivo académico'}
            </span>
            <p>
              {onProjectDetail && currentProject
                ? currentProject.title
                : `${scoped.length} proyectos publicados · ${yearRange} · ${areas.length} áreas`}
            </p>
          </div>

          {institution ? (
            <button
              type="button"
              className="btn btn-primary btn-md mt-3 w-full"
              aria-expanded={assistantOpen}
              aria-controls="archive-assistant-panel"
              aria-haspopup="dialog"
              onClick={openAssistant}
            >
              <MessageSquareText className="h-4 w-4" aria-hidden />
              Consultar el archivo
            </button>
          ) : null}

          <nav className="mt-3 flex flex-col gap-1" aria-label="Secciones móviles">
            {institution ? (
              <Link
                to={archiveHref}
                className={cn('header-sheet-link', onInstitutionView && 'is-current')}
              >
                Institución
              </Link>
            ) : null}
            <Link
              to={projectsHref}
              className={cn('header-sheet-link', onProjectsView && 'is-current')}
            >
              Proyectos
              <span className="header-nav-count">{scoped.length}</span>
            </Link>
            <Link
              to="/explorar"
              className={cn('header-sheet-link', onExploreView && 'is-current')}
            >
              Explorar
            </Link>
          </nav>

          <p className="header-menu-title mt-4">Cambiar institución</p>
          <ul className="flex flex-col gap-1">
            {institutionOptions.map(({ item, count }) => {
              const isCurrent = item.id === institution?.id
              return (
                <li key={item.id}>
                  <Link
                    to={`/instituciones/${item.slug}`}
                    className={cn('header-menu-item', isCurrent && 'is-current')}
                  >
                    <InstitutionLogo
                      name={item.name}
                      logoUrl={item.logoUrl}
                      fallback={item.shortName}
                      accent={item.accent}
                      decorative
                      className="header-avatar"
                      imageClassName="bg-white/95 p-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-legacy-white">
                        {item.name}
                      </span>
                      <span className="block text-[11px] text-legacy-muted">
                        {count} proyectos demo
                      </span>
                    </span>
                    {isCurrent ? (
                      <Check className="h-4 w-4 shrink-0 text-legacy-gold" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>

          <p className="mt-4 text-[11px] leading-relaxed text-legacy-muted">
            Contenido de demostración. No representa información institucional oficial.
          </p>
        </div>
      ) : null}

      {institution ? (
        <ArchiveAssistantPanel
          institution={institution}
          projects={scoped}
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
        />
      ) : null}
    </>
  )
}

type FilterMenuItem = {
  key: string
  label: string
  count: number
  href: string
}

function FilterMenu({
  id,
  label,
  icon: Icon,
  open,
  onToggle,
  items,
  footerHref,
}: {
  id: string
  label: string
  icon: typeof Layers3
  open: boolean
  onToggle: () => void
  items: FilterMenuItem[]
  footerHref: string
}) {
  if (items.length === 0) return null

  return (
    <div className="relative">
      <button
        type="button"
        className={cn('header-pill', open && 'is-open')}
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
        <span className="header-pill-count">{items.length}</span>
        <ChevronDown className="header-chip-caret h-3 w-3" aria-hidden />
      </button>

      {open ? (
        <div id={id} className="header-menu w-[16rem]" aria-label={`Filtrar por ${label}`}>
          <ul className="header-menu-scroll">
            {items.map((item) => (
              <li key={item.key}>
                <Link to={item.href} className="header-menu-item">
                  <span className="min-w-0 flex-1 truncate text-sm text-legacy-white">
                    {item.label}
                  </span>
                  <span className="header-menu-count">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="header-menu-footer">
            <Link to={footerHref} className="header-menu-action">
              Ver catálogo completo
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
