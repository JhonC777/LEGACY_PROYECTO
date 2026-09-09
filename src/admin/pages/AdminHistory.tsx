import { useMemo, useState } from 'react'
import { History, Search, SearchX, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../components/AdminStates'
import { PageHeader } from '../components/PageHeader'
import { dayKey, formatDateTime, formatDay } from '../format'
import { useAdminStore } from '../store'
import { ACTIVITY_LABEL, type ActivityEntry, type ActivityType } from '../types'

type Group = 'all' | 'projects' | 'publishing' | 'media' | 'settings'

const GROUPS: Record<Exclude<Group, 'all'>, ActivityType[]> = {
  projects: ['create', 'update', 'delete'],
  publishing: ['publish', 'unpublish', 'archive', 'restore'],
  media: ['upload'],
  settings: ['settings', 'session'],
}

const GROUP_LABEL: Record<Group, string> = {
  all: 'Todo',
  projects: 'Proyectos',
  publishing: 'Publicación',
  media: 'Cargas',
  settings: 'Ajustes',
}

export function AdminHistory() {
  const { institution, activity, projects, status, reload } = useAdminStore()
  const [group, setGroup] = useState<Group>('all')
  const [query, setQuery] = useState('')
  const base = `/admin/${institution.slug}`

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    return activity.filter((entry) => {
      if (group !== 'all' && !GROUPS[group].includes(entry.type)) return false
      if (!normalized) return true
      return `${entry.message} ${entry.actor} ${entry.projectTitle ?? ''}`
        .toLocaleLowerCase('es')
        .includes(normalized)
    })
  }, [activity, group, query])

  const byDay = useMemo(() => {
    const map = new Map<string, ActivityEntry[]>()
    visible.forEach((entry) => {
      const key = dayKey(entry.at)
      map.set(key, [...(map.get(key) ?? []), entry])
    })
    return [...map.entries()]
  }, [visible])

  const header = (
    <PageHeader
      eyebrow="Trazabilidad"
      title="Historial"
      description="Registro de lo que ha cambiado en el archivo: quién, qué y cuándo."
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

  return (
    <>
      {header}

      <div className="admin-toolbar mt-7">
        <div className="admin-tabs" role="tablist" aria-label="Filtrar actividad">
          {(Object.keys(GROUP_LABEL) as Group[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={group === key}
              className={cn('admin-tab', group === key && 'is-active')}
              onClick={() => setGroup(key)}
            >
              {GROUP_LABEL[key]}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Buscar en el historial</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-legacy-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por proyecto o acción..."
            className="glass-input liquid-field w-full rounded-full py-2.5 pr-9 pl-9 text-sm"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-legacy-muted hover:bg-white/[0.06] hover:text-legacy-white"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
      </div>

      {activity.length === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            icon={History}
            title="Sin actividad registrada"
            description="Cuando crees, edites o publiques proyectos, quedará constancia aquí."
          />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            icon={SearchX}
            title="Sin coincidencias"
            description="Prueba otro término o cambia el filtro."
            action={
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setGroup('all')
                  setQuery('')
                }}
              >
                Limpiar filtros
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          {byDay.map(([day, entries]) => (
            <section key={day} aria-labelledby={`day-${day}`}>
              <h2 id={`day-${day}`} className="mb-3 text-[11px] font-bold tracking-[0.16em] text-legacy-gold uppercase">
                {formatDay(entries[0].at)}
              </h2>
              <ol className="admin-timeline admin-card p-4">
                {entries.map((entry) => {
                  const project = entry.projectId
                    ? projects.find((item) => item.id === entry.projectId)
                    : undefined
                  return (
                    <li key={entry.id} className="admin-timeline-item">
                      <span className={cn('admin-timeline-dot', `is-${entry.type}`)} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-legacy-white">{entry.message}</p>
                        <p className="mt-0.5 text-[11px] text-legacy-muted">
                          {entry.actor} · {formatDateTime(entry.at)} · {ACTIVITY_LABEL[entry.type]}
                        </p>
                      </div>
                      {project ? (
                        <Link to={`${base}/proyectos/${project.id}`} className="btn btn-ghost btn-sm shrink-0">
                          Abrir
                        </Link>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
