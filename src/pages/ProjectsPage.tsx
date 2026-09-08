import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
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
  getInstitutionBySlug,
  type DemoProject,
} from '@/data/demoData'
import { cn } from '@/lib/cn'

type LoadState = 'loading' | 'ready' | 'error'

const YEAR_FILTER_OPTIONS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
]

export function ProjectsPage() {
  const { institutionSlug } = useParams()
  const institution = institutionSlug
    ? getInstitutionBySlug(institutionSlug)
    : undefined
  const [params, setParams] = useSearchParams()
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  const available = useMemo(() => {
    const source = institution
      ? DEMO_PROJECTS.filter((project) => project.institutionId === institution.id)
      : DEMO_PROJECTS
    return {
      source,
      areas: [...new Set(source.map((project) => project.area))].sort(),
      categories: [...new Set(source.map((project) => project.category))].sort(),
      collections: [
        ...new Set(
          source
            .map((project) => project.collection)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    }
  }, [institution])

  const projects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    const filtered = available.source.filter((project) => {
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
        (!area || project.area === area) &&
        (!category || project.category === category) &&
        (!year || String(project.year) === year) &&
        (!collection || project.collection === collection) &&
        (!institutionFilter || project.institutionId === institutionFilter)
      )
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'es')
      if (sort === 'oldest') return a.year - b.year
      return b.year - a.year
    })
  }, [
    area,
    available.source,
    category,
    collection,
    institutionFilter,
    query,
    sort,
    year,
  ])

  const updateParam = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next)
  }

  const clearFilters = () => setParams({})
  const hasFilters = Boolean(
    query ||
      area ||
      category ||
      year ||
      collection ||
      (!institution && institutionFilter),
  )

  const retry = () => {
    setLoadState('loading')
    window.setTimeout(() => setLoadState('ready'), 450)
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
          options={DEMO_INSTITUTIONS.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
      ) : null}
      <FilterSelect
        label="Área"
        value={area}
        onChange={(value) => updateParam('area', value)}
        options={available.areas.map((item) => ({ value: item, label: item }))}
      />
      <FilterSelect
        label="Categoría"
        value={category}
        onChange={(value) => updateParam('category', value)}
        options={available.categories.map((item) => ({
          value: item,
          label: item,
        }))}
      />
      <FilterSelect
        label="Año"
        value={year}
        onChange={(value) => updateParam('year', value)}
        options={YEAR_FILTER_OPTIONS}
      />
      <FilterSelect
        label="Colección"
        value={collection}
        onChange={(value) => updateParam('collection', value)}
        options={available.collections.map((item) => ({
          value: item,
          label: item,
        }))}
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

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/8 px-5 py-7 lg:sticky lg:top-[68px] lg:block lg:self-start">
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
                  value={query}
                  onChange={(event) => updateParam('q', event.target.value)}
                  placeholder="Buscar por título, autor, área o tema..."
                  className="glass-input liquid-field w-full rounded-full py-3 pr-4 pl-10 text-sm"
                />
              </label>
            </div>

            {/* Filtros colapsables en móvil / tablet */}
            <div className="mt-5 lg:hidden">
              <button
                type="button"
                className="btn btn-secondary btn-sm w-full justify-between"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Filtros
                  {hasFilters ? (
                    <span className="rounded-full bg-legacy-gold/15 px-2 py-0.5 text-[10px] font-bold text-legacy-gold">
                      Activos
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
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  {filterPanel}
                </div>
              ) : null}
            </div>

            {(year || area || category || collection) ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {year ? (
                  <button
                    type="button"
                    className="chip-liquid is-active"
                    onClick={() => updateParam('year', '')}
                  >
                    {year}
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
                {area ? (
                  <button
                    type="button"
                    className="chip-liquid is-active"
                    onClick={() => updateParam('area', '')}
                  >
                    {area}
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
                {category ? (
                  <button
                    type="button"
                    className="chip-liquid is-active"
                    onClick={() => updateParam('category', '')}
                  >
                    {category}
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
                {collection ? (
                  <button
                    type="button"
                    className="chip-liquid is-active"
                    onClick={() => updateParam('collection', '')}
                  >
                    {collection}
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-legacy-gold hover:text-legacy-gold-soft"
                >
                  Limpiar todo
                </button>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-3">
              <p className="text-sm text-legacy-muted">
                <strong className="text-legacy-white">{projects.length}</strong>{' '}
                {projects.length === 1 ? 'proyecto' : 'proyectos'}
              </p>
              <label className="flex items-center gap-2 text-sm text-legacy-muted">
                Ordenar
                <select
                  value={sort}
                  onChange={(event) => updateParam('sort', event.target.value)}
                  className="glass-select w-auto min-w-[10rem]"
                  aria-label="Ordenar proyectos"
                >
                  <option value="recent">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="title">Título A–Z</option>
                </select>
              </label>
            </div>

            <div className="mt-6 pb-12">
              {visibleState === 'loading' ? <ProjectsLoading /> : null}
              {visibleState === 'error' ? <ProjectsError onRetry={retry} /> : null}
              {visibleState === 'empty' ? <ProjectsEmpty /> : null}
              {visibleState === 'ready' && projects.length === 0 ? (
                <ProjectsNoResults onClear={clearFilters} />
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
  options: Array<{ value: string; label: string }>
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
