import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ProjectCard } from '@/components/projects/ProjectCard'
import {
  ProjectsEmpty,
  ProjectsError,
  ProjectsLoading,
  ProjectsNoResults,
} from '@/components/projects/ProjectStates'
import { PublicHeader } from '@/components/public/PublicHeader'
import {
  DEMO_INSTITUTIONS,
  DEMO_PROJECTS,
  getAvailableYears,
  getInstitutionBySlug,
  type DemoProject,
} from '@/data/demoData'
import { cn } from '@/lib/cn'
import { useDeferredAction } from '@/lib/useDeferredAction'

type LoadState = 'loading' | 'ready' | 'error'
type FilterName = 'institution' | 'area' | 'category' | 'year' | 'collection'

type CatalogFilters = {
  query: string
  institution: string
  area: string
  category: string
  year: string
  collection: string
}

function projectMatches(
  project: DemoProject,
  filters: CatalogFilters,
  omitted?: FilterName,
) {
  const normalized = filters.query.trim().toLocaleLowerCase('es')
  const searchable = [
    project.title,
    project.subtitle,
    project.description,
    project.area,
    project.category,
    project.tags.join(' '),
    project.authors.map((author) => author.name).join(' '),
  ]
    .join(' ')
    .toLocaleLowerCase('es')

  return (
    (!normalized || searchable.includes(normalized)) &&
    (omitted === 'area' || !filters.area || project.area === filters.area) &&
    (omitted === 'category' ||
      !filters.category ||
      project.category === filters.category) &&
    (omitted === 'year' || !filters.year || String(project.year) === filters.year) &&
    (omitted === 'collection' ||
      !filters.collection ||
      project.collection === filters.collection) &&
    (omitted === 'institution' ||
      !filters.institution ||
      project.institutionId === filters.institution)
  )
}

export function ProjectsPage() {
  const { institutionSlug } = useParams()
  const institution = institutionSlug
    ? getInstitutionBySlug(institutionSlug)
    : undefined
  const [params, setParams] = useSearchParams()
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const defer = useDeferredAction()

  const query = params.get('q') ?? ''
  const area = params.get('area') ?? ''
  const category = params.get('category') ?? ''
  const year = params.get('year') ?? ''
  const collection = params.get('collection') ?? ''
  const institutionFilter = institution?.id ?? params.get('institution') ?? ''
  const sort = params.get('sort') ?? 'recent'

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadState('ready'), 280)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const source = useMemo(
    () =>
      institution
      ? DEMO_PROJECTS.filter((project) => project.institutionId === institution.id)
        : DEMO_PROJECTS,
    [institution],
  )

  const filters = useMemo<CatalogFilters>(
    () => ({
      query,
      institution: institutionFilter,
      area,
      category,
      year,
      collection,
    }),
    [area, category, collection, institutionFilter, query, year],
  )

  const available = useMemo(() => {
    const facet = (
      values: string[],
      name: FilterName,
      predicate: (project: DemoProject, value: string) => boolean,
    ) =>
      values.map((value) => ({
        value,
        label: value,
        count: source.filter(
          (project) => projectMatches(project, filters, name) && predicate(project, value),
        ).length,
      }))

    const areas = [...new Set(source.map((project) => project.area))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    )
    const categories = [...new Set(source.map((project) => project.category))].sort(
      (a, b) => a.localeCompare(b, 'es'),
    )
    const years = getAvailableYears(source).map(String)
    const collections = [
        ...new Set(
          source
            .map((project) => project.collection)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort((a, b) => a.localeCompare(b, 'es'))

    return {
      areas: facet(areas, 'area', (project, value) => project.area === value),
      categories: facet(
        categories,
        'category',
        (project, value) => project.category === value,
      ),
      years: facet(years, 'year', (project, value) => String(project.year) === value),
      collections: facet(
        collections,
        'collection',
        (project, value) => project.collection === value,
      ),
    }
  }, [filters, source])

  const institutionOptions = useMemo(
    () =>
      DEMO_INSTITUTIONS.map((item) => ({
        value: item.id,
        label: item.name,
        count: DEMO_PROJECTS.filter(
          (project) =>
            projectMatches(project, filters, 'institution') &&
            project.institutionId === item.id,
        ).length,
      })),
    [filters],
  )

  const projects = useMemo(() => {
    const filtered = source.filter((project) => projectMatches(project, filters))

    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'es')
      if (sort === 'oldest') return a.year - b.year
      if (sort === 'featured') {
        return Number(b.isFeatured) - Number(a.isFeatured) || b.year - a.year
      }
      return b.year - a.year
    })
  }, [filters, sort, source])

  const updateParam = (name: string, value: string, replace = false) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace })
  }

  const clearFilters = () => {
    const next = new URLSearchParams()
    if (sort !== 'recent') next.set('sort', sort)
    setParams(next)
  }

  const exploreArea = (value: string) => {
    const next = new URLSearchParams()
    next.set('area', value)
    if (sort !== 'recent') next.set('sort', sort)
    setParams(next)
  }
  const hasFilters = Boolean(
    query ||
      area ||
      category ||
      year ||
      collection ||
      (!institution && institutionFilter),
  )
  const activeFilterCount = [
    query,
    area,
    category,
    year,
    collection,
    !institution ? institutionFilter : '',
  ].filter(Boolean).length

  const activeFilters = [
    query
      ? { key: 'q', label: `Búsqueda: “${query}”`, value: query }
      : null,
    !institution && institutionFilter
      ? {
          key: 'institution',
          label: `Institución: ${
            DEMO_INSTITUTIONS.find((item) => item.id === institutionFilter)?.name ??
            institutionFilter
          }`,
          value: institutionFilter,
        }
      : null,
    area ? { key: 'area', label: `Área: ${area}`, value: area } : null,
    category
      ? { key: 'category', label: `Categoría: ${category}`, value: category }
      : null,
    year ? { key: 'year', label: `Año: ${year}`, value: year } : null,
    collection
      ? { key: 'collection', label: `Colección: ${collection}`, value: collection }
      : null,
  ].filter(
    (item): item is { key: string; label: string; value: string } => Boolean(item),
  )

  const retry = () => {
    setLoadState('loading')
    defer(() => setLoadState('ready'), 450)
  }

  const visibleState =
    params.get('demoState') === 'error'
      ? 'error'
      : params.get('demoState') === 'empty'
        ? 'empty'
        : loadState

  if (institutionSlug && !institution) {
    return <Navigate to="/" replace />
  }

  const filterPanel = (
    <>
      {!institution ? (
        <FilterSelect
          label="Institución"
          value={institutionFilter}
          onChange={(value) => updateParam('institution', value)}
          options={institutionOptions}
        />
      ) : null}
      <FilterSelect
        label="Área"
        value={area}
        onChange={(value) => updateParam('area', value)}
        options={available.areas}
      />
      <FilterSelect
        label="Categoría"
        value={category}
        onChange={(value) => updateParam('category', value)}
        options={available.categories}
      />
      <FilterSelect
        label="Año"
        value={year}
        onChange={(value) => updateParam('year', value)}
        options={available.years}
      />
      <FilterSelect
        label="Colección"
        value={collection}
        onChange={(value) => updateParam('collection', value)}
        options={available.collections}
      />
      {hasFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="btn btn-ghost btn-sm mt-1"
        >
          <X className="h-4 w-4" aria-hidden />
          Limpiar filtros
        </button>
      ) : null}
    </>
  )

  return (
    <div className="explore-shell">
      <PublicHeader institution={institution} />

      <main
        id="contenido"
        className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]"
      >
        <aside className="hidden border-r border-white/8 px-5 py-7 lg:sticky lg:top-[var(--legacy-header-h,68px)] lg:block lg:self-start">
          <div className="mb-6 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-legacy-gold" aria-hidden />
            <h2 className="text-xs font-bold tracking-[0.14em] text-legacy-gold uppercase">
              Filtrar archivo
            </h2>
          </div>
          {filterPanel}
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-legacy-muted">
            Contenidos de demostración. No representan información institucional oficial.
            <span className="mt-2 block font-medium text-legacy-gold/90">
              Los archivos no se guardan, trascenden.
            </span>
          </div>
        </aside>

        <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1120px]">
            <Link
              to={institution ? `/instituciones/${institution.slug}` : '/explorar'}
              className="btn btn-ghost btn-sm mb-5"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {institution ? `Volver a ${institution.name}` : 'Volver a explorar'}
            </Link>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
                  Archivo académico
                </p>
                <h1 className="mt-1 font-display text-[clamp(1.85rem,4vw,2.5rem)] font-semibold text-legacy-white">
                  {institution
                    ? `Proyectos de ${institution.name}`
                    : 'Catálogo de proyectos'}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-legacy-muted">
                  Busca, filtra y abre fichas académicas completas.
                </p>
              </div>
              <label className="relative block w-full lg:max-w-sm">
                <span className="sr-only">Buscar en el catálogo</span>
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-legacy-muted" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => updateParam('q', event.target.value, true)}
                  placeholder="Buscar por título, autor, área o tema..."
                  className="glass-input liquid-field w-full rounded-full py-3 pr-16 pl-10 text-sm"
                  autoComplete="off"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => updateParam('q', '', true)}
                    className="absolute top-1/2 right-3 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-legacy-muted transition-colors hover:bg-white/[0.06] hover:text-legacy-white"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : (
                  <kbd className="header-kbd pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                    Ctrl K
                  </kbd>
                )}
              </label>
            </div>

            {/* Filtros colapsables en móvil / tablet */}
            <div className="mt-5 lg:hidden">
              <button
                type="button"
                className="btn btn-secondary btn-sm w-full justify-between"
                aria-expanded={filtersOpen}
                aria-controls="mobile-catalog-filters"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Filtros
                  {hasFilters ? (
                    <span className="rounded-full bg-legacy-gold/15 px-2 py-0.5 text-[10px] font-bold text-legacy-gold">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    filtersOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              {filtersOpen ? (
                <div
                  id="mobile-catalog-filters"
                  className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  {filterPanel}
                </div>
              ) : null}
            </div>

            {activeFilters.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-legacy-gold/15 bg-legacy-gold/[0.035] p-3.5">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold tracking-[0.12em] text-legacy-muted uppercase">
                    Selección activa · {activeFilterCount}
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-legacy-gold hover:text-legacy-gold-soft"
                  >
                    Limpiar todo
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className="chip-liquid is-active"
                      onClick={() => updateParam(filter.key, '')}
                      aria-label={`Quitar ${filter.label}`}
                    >
                      {filter.label}
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-3">
              <p className="text-sm text-legacy-muted" aria-live="polite">
                <strong className="text-legacy-white">{projects.length}</strong>{' '}
                {projects.length === 1 ? 'proyecto visible' : 'proyectos visibles'}
                {hasFilters ? (
                  <span className="text-legacy-muted/80"> de {source.length}</span>
                ) : null}
              </p>
              <label className="flex items-center gap-2 text-sm text-legacy-muted">
                <ArrowUpDown className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
                <span className="hidden sm:inline">Clasificar por</span>
                <span className="sm:hidden">Orden</span>
                <select
                  value={sort}
                  onChange={(event) => updateParam('sort', event.target.value)}
                  className="glass-select w-auto min-w-[10.5rem]"
                  aria-label="Clasificar proyectos"
                >
                  <option value="recent">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="title">Título A–Z</option>
                  <option value="featured">Destacados primero</option>
                </select>
              </label>
            </div>

            <div className="mt-6 pb-12">
              {visibleState === 'loading' ? <ProjectsLoading /> : null}
              {visibleState === 'error' ? <ProjectsError onRetry={retry} /> : null}
              {visibleState === 'empty' ? <ProjectsEmpty /> : null}
              {visibleState === 'ready' && projects.length === 0 ? (
                <ProjectsNoResults
                  onClear={clearFilters}
                  suggestions={available.areas
                    .filter((option) => option.count > 0 && option.value !== area)
                    .slice(0, 3)
                    .map((option) => option.label)}
                  onSuggestion={exploreArea}
                />
              ) : null}
              {visibleState === 'ready' && projects.length > 0 ? (
                <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project: DemoProject) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; count: number }>
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-[11px] font-bold tracking-[0.14em] text-legacy-muted uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="glass-select"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.count === 0 && option.value !== value}
          >
            {option.label} · {option.count}
          </option>
        ))}
      </select>
    </label>
  )
}
