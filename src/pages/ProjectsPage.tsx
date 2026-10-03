import { usePageMeta } from '@/lib/usePageMeta'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectListRow } from '@/components/projects/ProjectListRow'
import {
  ProjectsEmpty,
  ProjectsError,
  ProjectsLoading,
  ProjectsNoResults,
} from '@/components/projects/ProjectStates'
import { ExploreFooter } from '@/components/explore/ExploreFooter'
import { ExploreShell } from '@/components/layout/ExploreShell'
import { PublicHeader } from '@/components/public/PublicHeader'
import {
  resolveInstitution,
  resolveInstitutionProjects,
  useArchiveRevision,
} from '@/admin/archiveBridge'
import {
  DEMO_INSTITUTIONS,
  getAvailableYears,
  getInstitutionBySlug,
  type DemoProject,
} from '@/data/demoData'
import { ArchiveSelect } from '@/components/ui/ArchiveSelect'
import { cn } from '@/lib/cn'
import { useDeferredAction } from '@/lib/useDeferredAction'
import { resourceKindsOf, type ResourceKind } from '@/lib/projectResources'
import '@/styles/info.css'

type LoadState = 'loading' | 'ready' | 'error'
type FilterName = 'institution' | 'area' | 'category' | 'year' | 'collection' | 'resource'

type CatalogFilters = {
  query: string
  institution: string
  area: string
  category: string
  year: string
  collection: string
  resource: string
}

/** Filtro «Recurso» (?resource=): agrupa los tipos de archivo de cada ficha. */
const RESOURCE_FILTERS: Array<{ value: string; label: string; kinds: ResourceKind[] }> = [
  { value: 'pdf', label: 'PDF', kinds: ['pdf'] },
  { value: 'video', label: 'Video', kinds: ['video'] },
  { value: 'documento', label: 'Documento o presentación', kinds: ['document', 'presentation'] },
  { value: 'imagenes', label: 'Imágenes', kinds: ['image'] },
]

function hasResource(project: DemoProject, value: string) {
  const filter = RESOURCE_FILTERS.find((item) => item.value === value)
  if (!filter) return true
  const kinds = resourceKindsOf(project)
  return filter.kinds.some((kind) => kinds.has(kind))
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
      project.institutionId === filters.institution) &&
    (omitted === 'resource' || !filters.resource || hasResource(project, filters.resource))
  )
}

export function ProjectsPage() {
  const { institutionSlug } = useParams()
  const revision = useArchiveRevision()
  const base = institutionSlug ? getInstitutionBySlug(institutionSlug) : undefined
  const institution = base ? resolveInstitution(base) : undefined
  const [params, setParams] = useSearchParams()
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const defer = useDeferredAction()
  usePageMeta({
    title: institution?.isActive ? `Proyectos y colecciones · ${institution.name}` : 'Proyectos',
    description: institution?.isActive
      ? `Catálogo de proyectos y colecciones del archivo académico de ${institution.name}.`
      : undefined,
  })

  const query = params.get('q') ?? ''
  const area = params.get('area') ?? ''
  const category = params.get('category') ?? ''
  const year = params.get('year') ?? ''
  const collection = params.get('collection') ?? ''
  const institutionFilter = institution?.id ?? params.get('institution') ?? ''
  const sort = params.get('sort') ?? 'recent'
  const resource = RESOURCE_FILTERS.some((item) => item.value === params.get('resource'))
    ? (params.get('resource') ?? '')
    : ''
  const view = params.get('view') === 'list' ? 'list' : 'grid'
  const navigate = useNavigate()

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
        ? resolveInstitutionProjects(institution, true)
        : DEMO_INSTITUTIONS.flatMap((item) => resolveInstitutionProjects(item, true)),
    [institution, revision],
  )

  const filters = useMemo<CatalogFilters>(
    () => ({
      query,
      institution: institutionFilter,
      area,
      category,
      year,
      collection,
      resource,
    }),
    [area, category, collection, institutionFilter, query, resource, year],
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
      resources: RESOURCE_FILTERS.map((item) => ({
        value: item.value,
        label: item.label,
        count: source.filter(
          (project) => projectMatches(project, filters, 'resource') && hasResource(project, item.value),
        ).length,
      })),
    }
  }, [filters, source])

  const institutionOptions = useMemo(
    () =>
      DEMO_INSTITUTIONS.map((item) => ({
        value: item.id,
        label: item.name,
        count: resolveInstitutionProjects(item, true).filter(
          (project) =>
            projectMatches(project, filters, 'institution') &&
            project.institutionId === item.id,
        ).length,
      })),
    [filters, revision],
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
    if (view !== 'grid') next.set('view', view)
    setParams(next)
  }

  /** La institución define la casa: elegir otra lleva a su catálogo con los mismos filtros. */
  const changeInstitution = (value: string) => {
    const target = DEMO_INSTITUTIONS.find((item) => item.id === value)
    if (!target || !target.isActive) return
    if (institution && target.id === institution.id) return
    const next = new URLSearchParams(params)
    next.delete('institution')
    const search = next.toString()
    navigate(`/instituciones/${target.slug}/proyectos${search ? `?${search}` : ''}`)
  }

  const exploreArea = (value: string) => {
    const next = new URLSearchParams()
    next.set('area', value)
    if (sort !== 'recent') next.set('sort', sort)
    if (view !== 'grid') next.set('view', view)
    setParams(next)
  }
  const hasFilters = Boolean(
    query ||
      area ||
      category ||
      year ||
      collection ||
      resource ||
      (!institution && institutionFilter),
  )
  const activeFilterCount = [
    query,
    area,
    category,
    year,
    collection,
    resource,
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
    resource
      ? {
          key: 'resource',
          label: `Recurso: ${RESOURCE_FILTERS.find((item) => item.value === resource)?.label ?? resource}`,
          value: resource,
        }
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

  if (institutionSlug && (!institution || !institution.isActive)) {
    return <Navigate to="/" replace />
  }

  const institutionSelectOptions = DEMO_INSTITUTIONS.map((item) => {
    const resolved = resolveInstitution(item)
    return {
      value: item.id,
      label: resolved.shortName || resolved.name,
      count: institutionOptions.find((option) => option.value === item.id)?.count ?? 0,
      disabled: !item.isActive,
    }
  })

  const filterControls = (
    <>
      <FilterSelect
        label="Año"
        value={year}
        onChange={(value) => updateParam('year', value)}
        options={available.years}
      />
      <FilterSelect
        label="Área"
        value={area}
        onChange={(value) => updateParam('area', value)}
        options={available.areas}
      />
      {institution ? (
        <FilterSelect
          label="Institución"
          value={institution.id}
          onChange={changeInstitution}
          options={institutionSelectOptions}
          allLabel={null}
        />
      ) : (
        <FilterSelect
          label="Institución"
          value={institutionFilter}
          onChange={(value) => updateParam('institution', value)}
          options={institutionOptions}
        />
      )}
      <FilterSelect
        label="Recurso"
        value={resource}
        onChange={(value) => updateParam('resource', value)}
        options={available.resources}
        allLabel="Cualquiera"
      />
      <FilterSelect
        label="Categoría"
        value={category}
        onChange={(value) => updateParam('category', value)}
        options={available.categories}
      />
      <FilterSelect
        label="Colección"
        value={collection}
        onChange={(value) => updateParam('collection', value)}
        options={available.collections}
      />
    </>
  )

  const sortSelect = (
    <ArchiveSelect
      className="catalog-sort"
      aria-label="Ordenar proyectos"
      value={sort}
      onChange={(value) => updateParam('sort', value)}
      options={[
        { value: 'recent', label: 'Más recientes' },
        { value: 'oldest', label: 'Más antiguos' },
        { value: 'title', label: 'Título A–Z' },
        { value: 'featured', label: 'Destacados primero' },
      ]}
    />
  )

  const viewToggle = (
    <div className="catalog-view" role="group" aria-label="Vista de resultados">
      <button
        type="button"
        aria-pressed={view === 'grid'}
        aria-label="Ver en cuadrícula"
        title="Cuadrícula"
        onClick={() => updateParam('view', '')}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={view === 'list'}
        aria-label="Ver en lista"
        title="Lista"
        onClick={() => updateParam('view', 'list')}
      >
        <List className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )

  return (
    <ExploreShell className={institution ? 'is-institution' : undefined}>
      <PublicHeader institution={institution} />

      <main id="contenido" className="catalog-page mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <Link
          to={institution ? `/instituciones/${institution.slug}` : '/explorar'}
          className="btn btn-ghost btn-sm catalog-back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {institution ? `Volver a ${institution.name}` : 'Volver a explorar'}
        </Link>

        <div className="catalog-top">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.16em] text-legacy-gold uppercase">
              Archivo académico
            </p>
            <h1 className="catalog-title font-brand font-semibold text-legacy-white">
              {institution ? `Proyectos de ${institution.shortName}` : 'Catálogo de proyectos'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-legacy-muted">
              {institution ? institution.name : 'Busca, filtra y abre fichas académicas completas.'}
            </p>
          </div>
          <label className="catalog-search">
            <span className="sr-only">Buscar en el catálogo</span>
            <Search className="catalog-search-icon h-4 w-4" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => updateParam('q', event.target.value, true)}
              placeholder="Buscar por título, autor, área o tema…"
              className="glass-input liquid-field"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                onClick={() => updateParam('q', '', true)}
                className="catalog-search-clear"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <kbd className="header-kbd catalog-search-kbd">Ctrl K</kbd>
            )}
          </label>
        </div>

        <section className="catalog-filterbar" aria-label="Filtros del archivo">
          <div className="catalog-mobile-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm catalog-filters-toggle"
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filtros
              {hasFilters ? <span className="catalog-filter-badge">{activeFilterCount}</span> : null}
              <ChevronDown className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')} aria-hidden />
            </button>
            {sortSelect}
            {viewToggle}
          </div>
          <div id="catalog-filters" className={cn('catalog-filters', filtersOpen && 'is-open')}>
            {filterControls}
          </div>
        </section>

        <div className="catalog-status">
          {activeFilters.length > 0 ? (
            <div className="catalog-chips">
              <span className="catalog-chips-label">Filtros activos</span>
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className="catalog-chip"
                  onClick={() => updateParam(filter.key, '')}
                  aria-label={`Quitar ${filter.label}`}
                >
                  {filter.label}
                  <span className="catalog-chip-x" aria-hidden>
                    <X className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="catalog-clear">
                Limpiar todo
              </button>
            </div>
          ) : (
            <p className="catalog-chips-label">Sin filtros: todo el archivo</p>
          )}
          <div className="catalog-result-tools">
            <p className="catalog-count" aria-live="polite">
              <strong>{projects.length}</strong>{' '}
              {projects.length === 1 ? 'proyecto' : 'proyectos'}
              {hasFilters ? <span> de {source.length}</span> : null}
            </p>
            <div className="catalog-tools">
              {sortSelect}
              {viewToggle}
            </div>
          </div>
        </div>

        <div className="mt-5 pb-12">
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
          {visibleState === 'ready' && projects.length > 0 && view === 'grid' ? (
            <div className="knowledge-catalog">
              {projects.map((project: DemoProject, index: number) => (
                <ProjectCard key={project.id} project={project} folio={index + 1} />
              ))}
            </div>
          ) : null}
          {visibleState === 'ready' && projects.length > 0 && view === 'list' ? (
            <ul className="catalog-list" aria-label="Proyectos">
              {projects.map((project: DemoProject) => (
                <ProjectListRow key={project.id} project={project} />
              ))}
            </ul>
          ) : null}
        </div>
      </main>
      <ExploreFooter />
    </ExploreShell>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'Todos',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; count: number; disabled?: boolean }>
  /** null: sin opción «Todos» (la institución siempre tiene una casa elegida). */
  allLabel?: string | null
}) {
  return (
    <div className={cn('catalog-field', value && 'is-set')}>
      <span className="catalog-field-label">{label}</span>
      <ArchiveSelect
        className="w-full"
        aria-label={label}
        value={value}
        onChange={onChange}
        placeholder={allLabel ?? 'Todos'}
        options={[
          ...(allLabel === null ? [] : [{ value: '', label: allLabel }]),
          ...options.map((option) => ({
            value: option.value,
            label: option.label,
            hint: String(option.count),
            disabled: option.disabled || (option.count === 0 && option.value !== value),
          })),
        ]}
      />
    </div>
  )
}
