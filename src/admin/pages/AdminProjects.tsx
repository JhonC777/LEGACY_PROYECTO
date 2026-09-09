import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  ArrowUpDown,
  CircleDashed,
  ExternalLink,
  FolderKanban,
  Images,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SearchX,
  Send,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProjectHref, type ProjectStatus } from '@/data/demoData'
import { cn } from '@/lib/cn'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../components/AdminStates'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { formatRelative } from '../format'
import { getProjectIssues, useAdminStore } from '../store'
import { useToast } from '../toast'
import { STATUS_LABEL, type AdminProject } from '../types'

type StatusFilter = 'all' | ProjectStatus
type SortKey = 'updated' | 'title' | 'year'

type PendingAction =
  | { kind: 'delete'; project: AdminProject }
  | { kind: 'archive'; project: AdminProject }
  | { kind: 'unpublish'; project: AdminProject }
  | { kind: 'publish'; project: AdminProject }

export function AdminProjects() {
  const { institution, projects, status, reload, setProjectStatus, deleteProject } =
    useAdminStore()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const base = `/admin/${institution.slug}`
  const query = params.get('q') ?? ''
  const statusFilter = (params.get('status') as StatusFilter | null) ?? 'all'
  const sort = (params.get('sort') as SortKey | null) ?? 'updated'

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all' && value !== 'updated') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: key === 'q' })
  }

  useEffect(() => {
    if (!menuFor) return
    const onPointerDown = (event: PointerEvent) => {
      if (!listRef.current?.contains(event.target as Node)) setMenuFor(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuFor(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuFor])

  const counts = useMemo(
    () => ({
      all: projects.length,
      published: projects.filter((project) => project.status === 'published').length,
      draft: projects.filter((project) => project.status === 'draft').length,
      archived: projects.filter((project) => project.status === 'archived').length,
    }),
    [projects],
  )

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    const filtered = projects.filter((project) => {
      if (statusFilter !== 'all' && project.status !== statusFilter) return false
      if (!normalized) return true
      const haystack = [
        project.title,
        project.subtitle,
        project.area,
        project.category,
        project.collection ?? '',
        project.tags.join(' '),
        project.authors.map((author) => author.name).join(' '),
      ]
        .join(' ')
        .toLocaleLowerCase('es')
      return haystack.includes(normalized)
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'es')
      if (sort === 'year') return b.year - a.year
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [projects, query, statusFilter, sort])

  const hasFilters = Boolean(query || statusFilter !== 'all')

  const runPublish = (project: AdminProject) => {
    const result = setProjectStatus(project.id, 'published')
    if (result.ok) {
      notify({
        tone: 'success',
        title: 'Proyecto publicado',
        description: `«${project.title}» ya es visible en el catálogo público.`,
      })
    } else {
      notify({
        tone: 'error',
        title: 'No se puede publicar todavía',
        description: result.errors.slice(0, 3).join(' · '),
      })
    }
  }

  const confirmPending = () => {
    if (!pending) return
    const { kind, project } = pending
    if (kind === 'delete') {
      deleteProject(project.id)
      notify({ tone: 'success', title: 'Proyecto eliminado', description: `«${project.title}» se eliminó del archivo.` })
    } else if (kind === 'archive') {
      setProjectStatus(project.id, 'archived')
      notify({ tone: 'success', title: 'Proyecto archivado', description: 'Ya no aparece en el catálogo público. Puedes restaurarlo cuando quieras.' })
    } else if (kind === 'unpublish') {
      setProjectStatus(project.id, 'draft')
      notify({ tone: 'info', title: 'Publicación retirada', description: 'El proyecto volvió a borrador.' })
    } else if (kind === 'publish') {
      runPublish(project)
    }
    setPending(null)
  }

  const restore = (project: AdminProject) => {
    setProjectStatus(project.id, 'draft')
    notify({ tone: 'success', title: 'Proyecto restaurado', description: 'Volvió a borradores para que lo revises antes de publicar.' })
  }

  const header = (
    <PageHeader
      eyebrow="Gestión"
      title="Proyectos"
      description="Crea, edita, publica y archiva las fichas académicas de tu institución."
      actions={
        <Link to={`${base}/proyectos/nuevo`} className="btn btn-primary btn-md">
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo proyecto
        </Link>
      }
    />
  )

  if (status === 'loading') {
    return (
      <>
        {header}
        <div className="mt-8">
          <AdminLoadingState rows={6} />
        </div>
      </>
    )
  }

  if (status === 'error') {
    return (
      <>
        {header}
        <div className="mt-8">
          <AdminErrorState onRetry={reload} />
        </div>
      </>
    )
  }

  if (projects.length === 0) {
    return (
      <>
        {header}
        <div className="mt-8">
          <AdminEmptyState
            icon={FolderKanban}
            title="Aún no hay proyectos"
            description="Empieza creando un borrador. Podrás completarlo por partes y publicarlo cuando cumpla los requisitos."
            action={
              <Link to={`${base}/proyectos/nuevo`} className="btn btn-primary btn-md">
                <Plus className="h-4 w-4" aria-hidden />
                Crear el primero
              </Link>
            }
          />
        </div>
      </>
    )
  }

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'published', label: STATUS_LABEL.published + 's' },
    { key: 'draft', label: STATUS_LABEL.draft + 'es' },
    { key: 'archived', label: STATUS_LABEL.archived + 's' },
  ]

  return (
    <>
      {header}

      <div className="admin-toolbar mt-7 flex flex-wrap items-center justify-between gap-3">
        <div
          className="admin-tabs flex flex-wrap items-center gap-1 rounded-full p-1"
          role="tablist"
          aria-label="Filtrar por estado"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.key}
              className={cn(
                'admin-tab inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm',
                statusFilter === tab.key && 'is-active',
              )}
              onClick={() => updateParam('status', tab.key)}
            >
              {tab.label}
              <span className="admin-tab-count">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Buscar proyectos</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-legacy-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => updateParam('q', event.target.value)}
              placeholder="Buscar por título, autor, área..."
              className="glass-input liquid-field w-full rounded-full py-2.5 pr-9 pl-9 text-sm"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                onClick={() => updateParam('q', '')}
                className="absolute top-1/2 right-2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-legacy-muted hover:bg-white/[0.06] hover:text-legacy-white"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </label>
          <label className="flex items-center gap-2 text-xs text-legacy-muted">
            <ArrowUpDown className="h-3.5 w-3.5 text-legacy-gold" aria-hidden />
            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
              className="glass-select w-auto min-w-[9.5rem]"
              aria-label="Ordenar proyectos"
            >
              <option value="updated">Última edición</option>
              <option value="title">Título A–Z</option>
              <option value="year">Año</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mt-4 text-xs text-legacy-muted" aria-live="polite">
        <strong className="text-legacy-white">{visible.length}</strong>{' '}
        {visible.length === 1 ? 'proyecto' : 'proyectos'}
        {hasFilters ? ` de ${projects.length}` : ''}
      </p>

      <div ref={listRef} className="mt-3">
        {visible.length === 0 ? (
          <AdminEmptyState
            icon={SearchX}
            title="Sin coincidencias"
            description="Ajusta la búsqueda o cambia el filtro de estado."
            action={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setParams(new URLSearchParams(), { replace: true })}
              >
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <div className="admin-table" role="table" aria-label="Lista de proyectos">
            <div
              className="admin-table-head grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 px-4 py-3 md:grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_auto] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_7.5rem_6.5rem_auto]"
              role="row"
            >
              <span role="columnheader">Proyecto</span>
              <span role="columnheader" className="hidden lg:block">Área · Año</span>
              <span role="columnheader">Estado</span>
              <span role="columnheader" className="hidden md:block">Editado</span>
              <span role="columnheader" className="sr-only">Acciones</span>
            </div>
            {visible.map((project) => {
              const issues = getProjectIssues(project)
              const menuOpen = menuFor === project.id
              return (
                <div
                  key={project.id}
                  className="admin-table-row grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 px-4 py-3 md:grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_auto] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_7.5rem_6.5rem_auto]"
                  role="row"
                >
                  <div role="cell" className="flex min-w-0 items-center gap-3">
                    <span className="admin-thumb" aria-hidden>
                      {project.coverImage ? (
                        <img src={project.coverImage} alt="" loading="lazy" />
                      ) : (
                        <Images className="h-4 w-4 text-white/30" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <Link
                        to={`${base}/proyectos/${project.id}`}
                        className="block truncate text-sm font-semibold text-legacy-white hover:text-legacy-gold-soft"
                      >
                        {project.title || 'Sin título'}
                      </Link>
                      <span className="mt-0.5 block truncate text-xs text-legacy-muted">
                        {project.authors.length > 0
                          ? project.authors.map((author) => author.name).join(', ')
                          : 'Sin autores'}
                        <span className="lg:hidden">
                          {' '}
                          · {project.area || 'Sin área'} · {project.year}
                        </span>
                      </span>
                      {!issues.complete && project.status !== 'archived' ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-300/90">
                          <CircleDashed className="h-3 w-3" aria-hidden />
                          {issues.errors.length}{' '}
                          {issues.errors.length === 1 ? 'dato pendiente' : 'datos pendientes'}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div role="cell" className="hidden text-xs text-legacy-muted lg:block">
                    <span className="block truncate text-legacy-white/85">{project.area || '—'}</span>
                    <span>{project.year}</span>
                  </div>
                  <div role="cell">
                    <StatusBadge status={project.status} />
                  </div>
                  <div role="cell" className="hidden text-xs text-legacy-muted md:block">
                    {formatRelative(project.updatedAt)}
                  </div>
                  <div role="cell" className="relative flex items-center justify-end gap-1">
                    <Link
                      to={`${base}/proyectos/${project.id}`}
                      className="btn btn-ghost btn-sm"
                      aria-label={`Editar ${project.title}`}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      <span className="hidden xl:inline">Editar</span>
                    </Link>
                    {project.status === 'draft' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm hidden sm:inline-flex"
                        onClick={() => setPending({ kind: 'publish', project })}
                        disabled={!issues.complete}
                        title={
                          issues.complete
                            ? 'Publicar en el sitio'
                            : `Faltan datos: ${issues.errors.slice(0, 2).join(', ')}`
                        }
                      >
                        <Send className="h-4 w-4" aria-hidden />
                        <span className="hidden xl:inline">Publicar</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={cn('btn btn-ghost btn-sm', menuOpen && 'is-open')}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      aria-label={`Más acciones para ${project.title}`}
                      onClick={() => setMenuFor(menuOpen ? null : project.id)}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden />
                    </button>

                    {menuOpen ? (
                      <div className="admin-menu" role="menu">
                        <Link role="menuitem" to={`${base}/proyectos/${project.id}`} className="admin-menu-item">
                          <Pencil className="h-4 w-4" aria-hidden />
                          Editar ficha
                        </Link>
                        {project.status === 'published' ? (
                          <>
                            <Link
                              role="menuitem"
                              to={getProjectHref(project)}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-menu-item"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden />
                              Ver en el sitio
                            </Link>
                            <button
                              role="menuitem"
                              type="button"
                              className="admin-menu-item"
                              onClick={() => {
                                setMenuFor(null)
                                setPending({ kind: 'unpublish', project })
                              }}
                            >
                              <Undo2 className="h-4 w-4" aria-hidden />
                              Retirar a borrador
                            </button>
                          </>
                        ) : null}
                        {project.status === 'draft' ? (
                          <button
                            role="menuitem"
                            type="button"
                            className="admin-menu-item"
                            disabled={!issues.complete}
                            onClick={() => {
                              setMenuFor(null)
                              setPending({ kind: 'publish', project })
                            }}
                          >
                            <Send className="h-4 w-4" aria-hidden />
                            {issues.complete ? 'Publicar' : 'Publicar (faltan datos)'}
                          </button>
                        ) : null}
                        {project.status === 'archived' ? (
                          <button
                            role="menuitem"
                            type="button"
                            className="admin-menu-item"
                            onClick={() => {
                              setMenuFor(null)
                              restore(project)
                            }}
                          >
                            <ArchiveRestore className="h-4 w-4" aria-hidden />
                            Restaurar
                          </button>
                        ) : (
                          <button
                            role="menuitem"
                            type="button"
                            className="admin-menu-item"
                            onClick={() => {
                              setMenuFor(null)
                              setPending({ kind: 'archive', project })
                            }}
                          >
                            <Archive className="h-4 w-4" aria-hidden />
                            Archivar
                          </button>
                        )}
                        <span className="admin-menu-sep" aria-hidden />
                        <button
                          role="menuitem"
                          type="button"
                          className="admin-menu-item is-danger"
                          onClick={() => {
                            setMenuFor(null)
                            setPending({ kind: 'delete', project })
                          }}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pending?.kind === 'delete'}
        tone="destructive"
        icon={Trash2}
        title="¿Eliminar este proyecto?"
        description={
          <>
            «{pending?.project.title}» se quitará del archivo junto con su ficha. Esta acción no se
            puede deshacer.
          </>
        }
        confirmLabel="Eliminar definitivamente"
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'archive'}
        icon={Archive}
        title="¿Archivar este proyecto?"
        description="Dejará de mostrarse en el catálogo público. Podrás restaurarlo desde la pestaña Archivados."
        confirmLabel="Archivar"
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'unpublish'}
        icon={Undo2}
        title="¿Retirar la publicación?"
        description="El proyecto volverá a borrador y dejará de verse en el sitio público hasta que lo publiques de nuevo."
        confirmLabel="Retirar"
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'publish'}
        icon={Send}
        title="¿Publicar este proyecto?"
        description="Aparecerá de inmediato en el catálogo público de tu institución."
        confirmLabel="Publicar"
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
